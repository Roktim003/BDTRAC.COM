import { getPrismaClient, isDatabaseConfigured } from "./prisma";

/**
 * SMS dispatcher (Part 5) — modular transactional SMS for BDTRAC.
 *
 * Providers: SSL Wireless (default) and BulkSMSBD, selected with the
 * SMS_PROVIDER env var ("ssl-wireless" | "bulksmsbd"). Each provider is
 * a small adapter behind the SmsProvider interface — adding a third
 * gateway is a new adapter, not a refactor.
 *
 * Every dispatch is logged to the Prisma SmsLog table when a database
 * is configured. When NO provider credentials are set, the dispatcher
 * runs in log-only mode: the message is recorded QUEUED with provider
 * "LOG" and nothing is sent — it never pretends a text was delivered.
 * SMS failures never throw into order/payment flows; callers get a
 * result object.
 */

export type SmsProviderName = "ssl-wireless" | "bulksmsbd";

export interface SmsSendResult {
  ok: boolean;
  provider: string;
  status: "SENT" | "QUEUED" | "FAILED";
  providerMessageId?: string;
  error?: string;
}

interface SmsProvider {
  name: SmsProviderName | "LOG";
  isConfigured: () => boolean;
  send: (to: string, message: string) => Promise<SmsSendResult>;
}

/* ——— SSL Wireless (api.sslwireless.com, v3 send-sms) ——— */
const sslWireless: SmsProvider = {
  name: "ssl-wireless",
  isConfigured: () =>
    Boolean(process.env.SSL_WIRELESS_API_TOKEN && process.env.SSL_WIRELESS_SID),
  async send(to, message) {
    try {
      const res = await fetch("https://sms.sslwireless.com/api/v3/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          api_token: process.env.SSL_WIRELESS_API_TOKEN,
          sid: process.env.SSL_WIRELESS_SID,
          msisdn: to.replace("+", ""),
          sms: message,
          csms_id: `trac-${Date.now()}`,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        status?: string;
        message?: string;
      };
      if (res.ok && data.status === "SUCCESS") {
        return { ok: true, provider: "ssl-wireless", status: "SENT" };
      }
      return {
        ok: false,
        provider: "ssl-wireless",
        status: "FAILED",
        error: data.message ?? `HTTP ${res.status}`,
      };
    } catch (err) {
      return { ok: false, provider: "ssl-wireless", status: "FAILED", error: String(err) };
    }
  },
};

/* ——— BulkSMSBD (bulksmsbd.net smsapi) ——— */
const bulkSmsBd: SmsProvider = {
  name: "bulksmsbd",
  isConfigured: () =>
    Boolean(process.env.BULKSMSBD_API_KEY && process.env.BULKSMSBD_SENDER_ID),
  async send(to, message) {
    try {
      const params = new URLSearchParams({
        api_key: process.env.BULKSMSBD_API_KEY ?? "",
        type: "text",
        number: to.replace("+", ""),
        senderid: process.env.BULKSMSBD_SENDER_ID ?? "",
        message,
      });
      const res = await fetch(`http://bulksmsbd.net/api/smsapi?${params.toString()}`);
      const text = await res.text();
      // BulkSMSBD answers 202 on success, an error code otherwise.
      if (res.ok && text.trim().startsWith("202")) {
        return { ok: true, provider: "bulksmsbd", status: "SENT" };
      }
      return { ok: false, provider: "bulksmsbd", status: "FAILED", error: text.slice(0, 160) };
    } catch (err) {
      return { ok: false, provider: "bulksmsbd", status: "FAILED", error: String(err) };
    }
  },
};

const logOnly: SmsProvider = {
  name: "LOG",
  isConfigured: () => true,
  async send() {
    return { ok: false, provider: "LOG", status: "QUEUED", error: "No SMS provider configured — logged only." };
  },
};

function activeProvider(): SmsProvider {
  const wanted = (process.env.SMS_PROVIDER ?? "ssl-wireless").toLowerCase();
  const chosen = wanted === "bulksmsbd" ? bulkSmsBd : sslWireless;
  return chosen.isConfigured() ? chosen : logOnly;
}

/* ——— Bilingual templates (Bangla-first: BD customers read the SMS in
   Bangla; brand + numbers stay Latin for handset safety) ——— */

export function orderConfirmedSms(orderNumber: string, totalBdt: number): string {
  return `BDTRAC: আপনার অর্ডার #${orderNumber} কনফার্ম হয়েছে। ডেলিভারি চার্জসহ মোট ৳${totalBdt}। ট্র্যাক করুন: bdtrac.com/track`;
}

export function paymentConfirmedSms(orderNumber: string, totalBdt: number): string {
  return `BDTRAC: আপনার পেমেন্ট সফল হয়েছে। অর্ডার #${orderNumber}, মোট ৳${totalBdt}। আমরা এখন আপনার অর্ডারটি প্যাক করছি। ট্র্যাক করুন: bdtrac.com/track`;
}

export function orderShippedSms(orderNumber: string, courier: string, trackingCode: string): string {
  return `BDTRAC: আপনার অর্ডার #${orderNumber} পাঠানো হয়েছে। কুরিয়ার: ${courier}, ট্র্যাকিং: ${trackingCode}। ডেলিভারিম্যান কল করলে রিসিভ করুন।`;
}

export function orderDeliveredSms(orderNumber: string): string {
  return `BDTRAC: আপনার অর্ডার #${orderNumber} ডেলিভারি সম্পন্ন হয়েছে। TRAC-এর সাথে থাকার জন্য ধন্যবাদ!`;
}

/* ——— Dispatcher ——— */

export async function sendSms(input: {
  to: string;
  message: string;
  orderId?: string;
}): Promise<SmsSendResult> {
  const provider = activeProvider();
  const result = await provider.send(input.to, input.message);

  // SmsLog.orderId is a required FK (Part 2 schema), so only
  // order-linked messages are written to the log table.
  if (isDatabaseConfigured() && input.orderId) {
    try {
      const prisma = getPrismaClient();
      await prisma.smsLog.create({
        data: {
          orderId: input.orderId,
          phone: input.to,
          message: input.message,
          provider: result.provider,
          status: result.status,
        },
      });
    } catch {
      // Logging must never break the caller's flow.
    }
  }
  return result;
}

export async function sendOrderConfirmedSms(input: {
  orderId?: string;
  orderNumber: string;
  phone: string;
  totalBdt: number;
}): Promise<SmsSendResult> {
  return sendSms({
    to: input.phone,
    orderId: input.orderId,
    message: orderConfirmedSms(input.orderNumber, input.totalBdt),
  });
}

export async function sendPaymentConfirmedSms(input: {
  orderId?: string;
  orderNumber: string;
  phone: string;
  totalBdt: number;
}): Promise<SmsSendResult> {
  return sendSms({
    to: input.phone,
    orderId: input.orderId,
    message: paymentConfirmedSms(input.orderNumber, input.totalBdt),
  });
}
