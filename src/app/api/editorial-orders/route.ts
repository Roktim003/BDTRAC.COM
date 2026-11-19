import { NextResponse } from "next/server";
import { getPrismaClient, isDatabaseConfigured } from "@/lib/prisma";
import { calculateShippingFeeBdt } from "@/lib/bd-utils";
import {
  checkOrderRateLimits,
  clientIpFromHeaders,
} from "@/lib/rate-limit";
import {
  createOrderSchema,
  isValidPromoCode,
  promoDiscountBdt,
  type OrderReceipt,
} from "@/lib/order-schema";

/**
 * Editorial order API (Part 4) — POST /api/editorial-orders.
 *
 * Fraud-protected order creation for the Prisma catalog:
 *  1. Zod validation with the SAME schema the checkout form uses.
 *     Clients send SKU + size + qty only — every price is recomputed
 *     from the database, so a tampered client total is meaningless.
 *  2. Dual rate limits (IP: 5/10min, normalized +880 phone: 3/10min)
 *     to block fake COD spam, which typically rotates one of the two.
 *  3. ONE atomic Prisma transaction: each variant's stock is verified
 *     and decremented with a conditional update (stockCount >= qty),
 *     so two buyers can never claim the same last unit; the order, its
 *     items and a queued confirmation SmsLog are written together or
 *     not at all.
 *  4. The receipt is returned with server-computed totals.
 *
 * This route is the Prisma catalog's order API. The legacy catalog's
 * Phase 7 engine keeps serving POST /api/orders untouched until the
 * catalog cutover, when this implementation takes that path over.
 * Without DATABASE_URL the route answers 503 (ordering unavailable)
 * instead of failing open.
 */

class OrderError extends Error {
  status: number;
  fieldErrors?: Record<string, string>;
  constructor(status: number, message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = createOrderSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return NextResponse.json(
      { error: "Please check the highlighted fields.", fieldErrors },
      { status: 400 },
    );
  }
  const input = parsed.data; // phone is normalized to +8801… by the schema

  if (input.promoCode && !isValidPromoCode(input.promoCode)) {
    return NextResponse.json(
      { error: "That promo code is not active.", fieldErrors: { promoCode: "Inactive code." } },
      { status: 400 },
    );
  }

  const rate = checkOrderRateLimits(clientIpFromHeaders(req.headers), input.phone);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        error:
          rate.scope === "phone"
            ? "Too many orders from this number — please wait before ordering again."
            : "Too many order attempts — please wait before trying again.",
      },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Ordering is temporarily unavailable." },
      { status: 503 },
    );
  }

  try {
    const receipt = await placeOrderWithRetry(input);
    return NextResponse.json({ receipt }, { status: 201 });
  } catch (err) {
    if (err instanceof OrderError) {
      return NextResponse.json(
        { error: err.message, fieldErrors: err.fieldErrors },
        { status: err.status },
      );
    }
    console.error("editorial-orders: unexpected failure", err);
    return NextResponse.json(
      { error: "Something went wrong placing the order." },
      { status: 500 },
    );
  }
}

async function placeOrderWithRetry(
  input: ReturnType<typeof createOrderSchema.parse>,
): Promise<OrderReceipt> {
  const prisma = getPrismaClient();
  // Order numbers are sequential (TRAC-1025, TRAC-1026, …). The count is
  // read inside the attempt; a unique-collision (P2002) retries with the
  // next number, up to 3 attempts.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const count = await tx.order.count();
        const orderNumber = `TRAC-${1025 + count + attempt}`;

        let subtotalBdt = 0;
        type TxLine = OrderReceipt["items"][number] & { variantId: string };
        const lines: TxLine[] = [];

        for (const item of input.items) {
          const variant = await tx.productVariant.findUnique({
            where: { sku: item.sku },
            include: { product: true },
          });
          if (!variant || variant.size !== item.size || !variant.product.isActive) {
            throw new OrderError(400, `Unknown item: ${item.sku} (${item.size}).`, {
              items: "One of the items is no longer available.",
            });
          }
          // Atomic verify + decrement: the update only lands when enough
          // stock remains, so concurrent orders cannot oversell.
          const updated = await tx.productVariant.updateMany({
            where: { id: variant.id, stockCount: { gte: item.quantity } },
            data: { stockCount: { decrement: item.quantity } },
          });
          if (updated.count === 0) {
            throw new OrderError(409, `Only ${variant.stockCount} left for ${item.sku} (${item.size}).`, {
              items: "Not enough studio stock for one of the items.",
            });
          }
          subtotalBdt += variant.product.basePriceBdt * item.quantity;
          lines.push({
            sku: item.sku,
            size: item.size,
            quantity: item.quantity,
            unitPriceBdt: variant.product.basePriceBdt,
            variantId: variant.id,
          });
        }

        const discountBdt = promoDiscountBdt(subtotalBdt, input.promoCode);
        const shippingFeeBdt = calculateShippingFeeBdt(
          subtotalBdt - discountBdt,
          input.deliveryZone,
        );
        const totalBdt = subtotalBdt - discountBdt + shippingFeeBdt;

        const order = await tx.order.create({
          data: {
            orderNumber,
            customerName: input.customerName,
            phone: input.phone,
            district: input.district,
            address: input.address,
            deliveryZone: input.deliveryZone,
            shippingFeeBdt,
            subtotalBdt,
            discountBdt,
            totalBdt,
            paymentMethod: input.paymentMethod,
            paymentStatus: "PENDING",
            orderStatus: "PENDING",
            items: {
              create: lines.map((l) => ({
                variantId: l.variantId,
                quantity: l.quantity,
                unitPriceBdt: l.unitPriceBdt,
              })),
            },
            smsLogs: {
              create: {
                phone: input.phone,
                message: `TRAC: Order ${orderNumber} confirmed. Total ${totalBdt} BDT. ${
                  input.paymentMethod === "COD"
                    ? "Please keep the amount ready for the courier."
                    : "Payment instructions will follow by SMS."
                }`,
                provider: "PENDING",
                status: "QUEUED",
              },
            },
          },
        });

        return {
          orderNumber: order.orderNumber,
          customerName: input.customerName,
          phone: input.phone,
          district: input.district,
          deliveryZone: input.deliveryZone,
          paymentMethod: input.paymentMethod,
          paymentStatus: "PENDING",
          items: lines.map((l) => ({
            sku: l.sku,
            size: l.size,
            quantity: l.quantity,
            unitPriceBdt: l.unitPriceBdt,
          })),
          subtotalBdt,
          discountBdt,
          shippingFeeBdt,
          totalBdt,
        };
      });
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "P2002" && attempt < 2) continue; // orderNumber collision — retry
      throw err;
    }
  }
  throw new OrderError(500, "Could not allocate an order number.");
}
