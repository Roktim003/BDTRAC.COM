import type { DeliveryZone } from "./bd-utils";

/**
 * Courier integrations (Part 5) — typed payload mappers + dispatch for
 * Pathao, Steadfast and RedX.
 *
 * Routing rule (by deliveryZone): INSIDE_DHAKA → Steadfast (fastest
 * inside the capital), OUTSIDE_DHAKA → Pathao (deepest nationwide
 * network). RedX is the configured fallback: set COURIER_FALLBACK=REDX
 * and it takes over whenever the primary's credentials are missing, or
 * pin a provider per deployment with COURIER_DEFAULT.
 *
 * Dispatch only fires when the provider's credentials exist in env;
 * otherwise it returns the mapped payload with dispatched: false —
 * the payload is the deliverable, nothing is faked as booked.
 */

export type CourierName = "PATHAO" | "STEADFAST" | "REDX";

export interface CourierOrderInput {
  orderNumber: string;
  customerName: string;
  phone: string; // normalized +8801…
  district: string;
  address: string;
  deliveryZone: DeliveryZone;
  /** Amount the courier collects on delivery (0 when prepaid). */
  codAmountBdt: number;
  itemQuantity: number;
  /** Total parcel weight in kg; defaults to 0.5 per item. */
  weightKg?: number;
  note?: string;
}

export interface CourierDispatchResult {
  dispatched: boolean;
  provider: CourierName;
  trackingCode?: string;
  reason?: string;
  payload: unknown;
}

export function selectCourier(zone: DeliveryZone): CourierName {
  const pinned = (process.env.COURIER_DEFAULT ?? "").toUpperCase();
  if (pinned === "PATHAO" || pinned === "STEADFAST" || pinned === "REDX") {
    return pinned;
  }
  return zone === "INSIDE_DHAKA" ? "STEADFAST" : "PATHAO";
}

function fallbackCourier(): CourierName | null {
  const fb = (process.env.COURIER_FALLBACK ?? "").toUpperCase();
  return fb === "PATHAO" || fb === "STEADFAST" || fb === "REDX" ? fb : null;
}

function weightOf(order: CourierOrderInput): number {
  return order.weightKg ?? Math.max(0.5, order.itemQuantity * 0.5);
}

/* ——— Payload mappers (pure, unit-tested) ——— */

export interface PathaoPayload {
  store_id: string;
  merchant_order_id: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  recipient_city: string;
  recipient_zone: string;
  delivery_type: 48;
  item_type: 2;
  special_instruction: string;
  item_quantity: number;
  item_weight: number;
  amount_to_collect: number;
  item_description: string;
}

export function toPathaoPayload(order: CourierOrderInput, storeId: string): PathaoPayload {
  return {
    store_id: storeId,
    merchant_order_id: order.orderNumber,
    recipient_name: order.customerName,
    recipient_phone: order.phone.replace("+", ""),
    recipient_address: order.address,
    recipient_city: order.district,
    recipient_zone: order.district,
    delivery_type: 48,
    item_type: 2,
    special_instruction: order.note ?? "TRAC apparel — handle with care.",
    item_quantity: order.itemQuantity,
    item_weight: weightOf(order),
    amount_to_collect: order.codAmountBdt,
    item_description: `TRAC order ${order.orderNumber} — apparel`,
  };
}

export interface SteadfastPayload {
  invoice: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  note: string;
}

export function toSteadfastPayload(order: CourierOrderInput): SteadfastPayload {
  return {
    invoice: order.orderNumber,
    recipient_name: order.customerName,
    recipient_phone: order.phone.replace("+880", "0"),
    recipient_address: `${order.address}, ${order.district}`,
    cod_amount: order.codAmountBdt,
    note: order.note ?? `TRAC order ${order.orderNumber}`,
  };
}

export interface RedxPayload {
  customer_name: string;
  customer_phone_number: string;
  customer_address: string;
  district: string;
  area: string;
  merchant_invoice_id: string;
  cash_collection_amount: number;
  parcel_weight: number;
  instruction: string;
  value: number;
}

export function toRedxPayload(order: CourierOrderInput): RedxPayload {
  return {
    customer_name: order.customerName,
    customer_phone_number: order.phone.replace("+880", "0"),
    customer_address: `${order.address}, ${order.district}`,
    district: order.district,
    area: order.district,
    merchant_invoice_id: order.orderNumber,
    cash_collection_amount: order.codAmountBdt,
    parcel_weight: weightOf(order),
    instruction: order.note ?? "Call the customer before delivery.",
    value: order.codAmountBdt,
  };
}

/* ——— Dispatch (network, credential-gated) ——— */

function configured(provider: CourierName): boolean {
  switch (provider) {
    case "PATHAO":
      return Boolean(
        process.env.PATHAO_CLIENT_ID &&
          process.env.PATHAO_CLIENT_SECRET &&
          process.env.PATHAO_STORE_ID &&
          process.env.PATHAO_USERNAME &&
          process.env.PATHAO_PASSWORD,
      );
    case "STEADFAST":
      return Boolean(process.env.STEADFAST_API_KEY && process.env.STEADFAST_SECRET_KEY);
    case "REDX":
      return Boolean(process.env.REDX_ACCESS_TOKEN);
  }
}

async function pathaoToken(): Promise<string | null> {
  const res = await fetch("https://api-hermes.pathao.com/api/v1/issue-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.PATHAO_CLIENT_ID,
      client_secret: process.env.PATHAO_CLIENT_SECRET,
      username: process.env.PATHAO_USERNAME,
      password: process.env.PATHAO_PASSWORD,
      grant_type: "password",
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { access_token?: string };
  return data.access_token ?? null;
}

async function dispatchTo(
  provider: CourierName,
  order: CourierOrderInput,
): Promise<CourierDispatchResult> {
  try {
    if (provider === "STEADFAST") {
      const payload = toSteadfastPayload(order);
      const res = await fetch("https://portal.packzy.com/api/v1/create_order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Api-Key": process.env.STEADFAST_API_KEY ?? "",
          "Secret-Key": process.env.STEADFAST_SECRET_KEY ?? "",
        },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as {
        status?: number;
        consignment?: { tracking_code?: string };
      };
      if (res.ok && data.consignment?.tracking_code) {
        return { dispatched: true, provider, trackingCode: data.consignment.tracking_code, payload };
      }
      return { dispatched: false, provider, reason: `Steadfast HTTP ${res.status}`, payload };
    }
    if (provider === "PATHAO") {
      const payload = toPathaoPayload(order, process.env.PATHAO_STORE_ID ?? "");
      const token = await pathaoToken();
      if (!token) return { dispatched: false, provider, reason: "Pathao token issue failed", payload };
      const res = await fetch("https://api-hermes.pathao.com/api/v1/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as {
        data?: { consignment_id?: string | number };
      };
      if (res.ok && data.data?.consignment_id) {
        return { dispatched: true, provider, trackingCode: String(data.data.consignment_id), payload };
      }
      return { dispatched: false, provider, reason: `Pathao HTTP ${res.status}`, payload };
    }
    const payload = toRedxPayload(order);
    const res = await fetch("https://openapi.redx.com.bd/v1/merchant/parcel", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "API-ACCESS-TOKEN": `Bearer ${process.env.REDX_ACCESS_TOKEN ?? ""}`,
      },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => ({}))) as { data?: { tracking_id?: string } };
    if (res.ok && data.data?.tracking_id) {
      return { dispatched: true, provider, trackingCode: data.data.tracking_id, payload };
    }
    return { dispatched: false, provider, reason: `RedX HTTP ${res.status}`, payload };
  } catch (err) {
    return { dispatched: false, provider, reason: String(err), payload: null };
  }
}

export async function dispatchCourierOrder(
  order: CourierOrderInput,
): Promise<CourierDispatchResult> {
  const primary = selectCourier(order.deliveryZone);
  if (configured(primary)) return dispatchTo(primary, order);
  const fallback = fallbackCourier();
  if (fallback && fallback !== primary && configured(fallback)) {
    return dispatchTo(fallback, order);
  }
  const payload =
    primary === "PATHAO"
      ? toPathaoPayload(order, process.env.PATHAO_STORE_ID ?? "")
      : primary === "STEADFAST"
        ? toSteadfastPayload(order)
        : toRedxPayload(order);
  return {
    dispatched: false,
    provider: primary,
    reason: `${primary} credentials not configured — payload prepared, not booked.`,
    payload,
  };
}
