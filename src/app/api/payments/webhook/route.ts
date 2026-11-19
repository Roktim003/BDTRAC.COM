import { NextResponse } from "next/server";
import { z } from "zod";
import { getPrismaClient, isDatabaseConfigured } from "@/lib/prisma";
import { sendPaymentConfirmedSms } from "@/lib/sms";
import { dispatchCourierOrder } from "@/lib/couriers";
import { verifyNagadSignature, verifySslcommerzSign } from "@/lib/payment-verify";

/**
 * Payment webhooks (Part 5) — POST /api/payments/webhook?provider=…
 *
 * Typed handlers for bKash, Nagad and SSLCommerz. Every handler:
 *  1. Parses with its own zod schema.
 *  2. VERIFIES the callback before trusting it — SSLCommerz via the
 *     documented verify_sign MD5 chain, Nagad via RSA signature check
 *     against Nagad's public key, bKash by querying the payment back
 *     with merchant credentials. Unverifiable = rejected (401).
 *  3. Fails closed (503) when the provider's secrets are not in env —
 *     a webhook is never "verified" by optimism.
 *  4. On verified success: checks the amount against the stored order,
 *     flips paymentStatus to PAID (idempotently — a duplicate webhook
 *     returns 200 without re-sending anything), dispatches the courier
 *     consignment for the prepaid order, and triggers the confirmation
 *     SMS via lib/sms.ts.
 */

const sslcommerzSchema = z.object({
  tran_id: z.string().min(1), // = TRAC orderNumber
  amount: z.string().min(1),
  currency: z.string().default("BDT"),
  status: z.string().min(1), // VALID / VALIDATED on success
  verify_key: z.string().min(1),
  verify_sign: z.string().min(1),
  val_id: z.string().optional(),
});

const bkashSchema = z.object({
  paymentID: z.string().min(1),
  trxID: z.string().optional(),
  transactionStatus: z.string().min(1), // Completed on success
  amount: z.string().min(1),
  merchantInvoiceNumber: z.string().min(1), // = TRAC orderNumber
});

const nagadSchema = z.object({
  merchantId: z.string().min(1),
  paymentRefId: z.string().min(1),
  issuerPaymentRefNo: z.string().optional(),
  additionalFieldName1: z.string().min(1), // = TRAC orderNumber (set at initiation)
  amount: z.string().min(1),
  status: z.string().min(1), // Success
  signature: z.string().min(1),
});

type Provider = "sslcommerz" | "bkash" | "nagad";

/** bKash has no callback signature — verification = query the payment
    back from bKash with merchant credentials and compare status/amount. */
async function verifyBkashPayment(
  paymentID: string,
): Promise<{ ok: boolean; status?: string; amount?: string; trxID?: string }> {
  const base = process.env.BKASH_BASE_URL ?? "https://tokenized.pay.bka.sh/v1.2.0-beta";
  const tokenRes = await fetch(`${base}/tokenized/checkout/token/grant`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      username: process.env.BKASH_USERNAME ?? "",
      password: process.env.BKASH_PASSWORD ?? "",
    },
    body: JSON.stringify({
      app_key: process.env.BKASH_APP_KEY,
      app_secret: process.env.BKASH_APP_SECRET,
    }),
  });
  if (!tokenRes.ok) return { ok: false };
  const token = (await tokenRes.json()) as { id_token?: string };
  if (!token.id_token) return { ok: false };
  const queryRes = await fetch(`${base}/tokenized/checkout/payment/status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token.id_token,
      "X-App-Key": process.env.BKASH_APP_KEY ?? "",
    },
    body: JSON.stringify({ paymentID }),
  });
  if (!queryRes.ok) return { ok: false };
  const data = (await queryRes.json()) as {
    transactionStatus?: string;
    amount?: string;
    trxID?: string;
  };
  return {
    ok: data.transactionStatus === "Completed",
    status: data.transactionStatus,
    amount: data.amount,
    trxID: data.trxID,
  };
}

interface VerifiedPayment {
  orderNumber: string;
  amountBdt: number;
}

async function finalizePaidOrder(payment: VerifiedPayment): Promise<NextResponse> {
  const prisma = getPrismaClient();
  const order = await prisma.order.findUnique({
    where: { orderNumber: payment.orderNumber },
    include: { items: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Unknown order." }, { status: 404 });
  }
  if (Math.round(payment.amountBdt) !== order.totalBdt) {
    return NextResponse.json({ error: "Amount mismatch." }, { status: 400 });
  }
  if (order.paymentStatus === "PAID") {
    return NextResponse.json({ received: true, duplicate: true });
  }
  await prisma.order.update({
    where: { id: order.id },
    data: { paymentStatus: "PAID" },
  });

  // Prepaid parcel: book the courier now (COD orders dispatch from the
  // fulfilment flow instead). Credential-gated — failure never fails
  // the webhook, the booking is retried by ops.
  const dispatch = await dispatchCourierOrder({
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    phone: order.phone,
    district: order.district,
    address: order.address,
    deliveryZone: order.deliveryZone,
    codAmountBdt: 0,
    itemQuantity: order.items.reduce((n: number, i: { quantity: number }) => n + i.quantity, 0),
  });
  if (dispatch.dispatched && dispatch.trackingCode) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        courierProvider: dispatch.provider,
        trackingCode: dispatch.trackingCode,
        orderStatus: "CONFIRMED",
      },
    });
  }

  await sendPaymentConfirmedSms({
    orderId: order.id,
    orderNumber: order.orderNumber,
    phone: order.phone,
    totalBdt: order.totalBdt,
  });
  return NextResponse.json({ received: true });
}

export async function POST(req: Request) {
  const provider = new URL(req.url).searchParams.get("provider") as Provider | null;
  if (provider !== "sslcommerz" && provider !== "bkash" && provider !== "nagad") {
    return NextResponse.json({ error: "Unknown provider." }, { status: 400 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Payments unavailable." }, { status: 503 });
  }

  const contentType = req.headers.get("content-type") ?? "";
  let body: Record<string, string> = {};
  if (contentType.includes("application/json")) {
    body = (await req.json().catch(() => ({}))) as Record<string, string>;
  } else {
    const form = await req.formData().catch(() => null);
    if (form) form.forEach((v, k) => (body[k] = String(v)));
  }

  try {
    if (provider === "sslcommerz") {
      const storePass = process.env.SSLCOMMERZ_STORE_PASSWORD;
      if (!process.env.SSLCOMMERZ_STORE_ID || !storePass) {
        return NextResponse.json({ error: "SSLCommerz not configured." }, { status: 503 });
      }
      const parsed = sslcommerzSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ error: "Malformed IPN." }, { status: 400 });
      if (parsed.data.status !== "VALID" && parsed.data.status !== "VALIDATED") {
        return NextResponse.json({ received: true, ignored: "not a success status" });
      }
      if (!verifySslcommerzSign(body, storePass)) {
        return NextResponse.json({ error: "Signature verification failed." }, { status: 401 });
      }
      return finalizePaidOrder({
        orderNumber: parsed.data.tran_id,
        amountBdt: Number.parseFloat(parsed.data.amount),
      });
    }

    if (provider === "bkash") {
      if (!process.env.BKASH_APP_KEY || !process.env.BKASH_APP_SECRET) {
        return NextResponse.json({ error: "bKash not configured." }, { status: 503 });
      }
      const parsed = bkashSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ error: "Malformed callback." }, { status: 400 });
      const verified = await verifyBkashPayment(parsed.data.paymentID);
      if (!verified.ok) {
        return NextResponse.json({ error: "Payment could not be verified with bKash." }, { status: 401 });
      }
      return finalizePaidOrder({
        orderNumber: parsed.data.merchantInvoiceNumber,
        amountBdt: Number.parseFloat(verified.amount ?? parsed.data.amount),
      });
    }

    // nagad
    const publicKey = process.env.NAGAD_PUBLIC_KEY;
    if (!publicKey) {
      return NextResponse.json({ error: "Nagad not configured." }, { status: 503 });
    }
    const parsed = nagadSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Malformed callback." }, { status: 400 });
    if (parsed.data.status !== "Success") {
      return NextResponse.json({ received: true, ignored: "not a success status" });
    }
    const sensitive = `${parsed.data.merchantId}${parsed.data.additionalFieldName1}${parsed.data.amount}${parsed.data.paymentRefId}`;
    if (!verifyNagadSignature(sensitive, parsed.data.signature, publicKey)) {
      return NextResponse.json({ error: "Signature verification failed." }, { status: 401 });
    }
    return finalizePaidOrder({
      orderNumber: parsed.data.additionalFieldName1,
      amountBdt: Number.parseFloat(parsed.data.amount),
    });
  } catch (err) {
    console.error(`payments/webhook (${provider}) failed`, err);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}
