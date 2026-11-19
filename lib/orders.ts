import { promises as fs } from "fs";
import path from "path";
import type { Product } from "./products";
import { getCatalogProduct } from "./catalogStore";
import { dbEnabled, readDoc, writeDoc } from "./db";
import { getSettings } from "./settingsStore";
import { divisions, normalizeBDPhone, PHONE_ERROR, type DeliveryZone } from "./bd";

/* Server-side order engine (Phase 7, §7.7). NEVER trust client prices:
   every line is recomputed from the catalog; stock, sizes, zone, phone and
   totals are all validated here. The client only sends ids/sizes/qtys.

   Persistence seam: orders are stored in .data/orders.json for local /
   self-hosted runs. On Vercel the filesystem is ephemeral — swap saveOrder()
   for a Supabase `orders` table insert at deployment (the live bdtrac.com
   backend); the API contract does not change. */

export interface OrderLine {
  id: string;
  name: string;
  size: string;
  qty: number;
  price: number;
  lineTotal: number;
}

export type OrderStatus =
  | "placed"
  | "confirmed"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface Order {
  id: string;
  items: OrderLine[];
  subtotal: number;
  savings: number;
  discount: number;
  delivery: number;
  total: number;
  zone: DeliveryZone;
  eta: string;
  payment: "cod";
  status: OrderStatus;
  customer: {
    name: string;
    phone: string;
    altPhone?: string;
    email?: string;
    division: string;
    district: string;
    address: string;
    note?: string;
  };
  createdAt: string;
}

/* Promo codes (§7.1) live in settings (admin-managed since Phase 9).
   An unknown/inactive code is rejected, never silently applied. */

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "orders.json");

interface Store {
  orders: Order[];
  idempotency: Record<string, string>; // key -> order id
}

async function readStore(): Promise<Store> {
  if (dbEnabled) return (await readDoc<Store>("orders")) ?? { orders: [], idempotency: {} };
  try {
    return JSON.parse(await fs.readFile(DATA_FILE, "utf8")) as Store;
  } catch {
    return { orders: [], idempotency: {} };
  }
}

async function writeStore(store: Store) {
  if (dbEnabled) return writeDoc("orders", store);
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2));
}

export interface OrderPayload {
  items?: { id?: string; size?: string; qty?: number }[];
  customer?: Partial<Order["customer"]>;
  zone?: string;
  payment?: string;
  promoCode?: string;
  idempotencyKey?: string;
}

export type OrderResult =
  | { ok: true; order: Order; duplicate: boolean }
  | { ok: false; errors: Record<string, string> };

export async function placeOrder(payload: OrderPayload): Promise<OrderResult> {
  const settings = getSettings();
  const ship = settings.shipping;
  const errors: Record<string, string> = {};

  const key = payload.idempotencyKey;
  if (!key || typeof key !== "string" || key.length < 8 || key.length > 64) {
    errors.idempotencyKey = "Missing order reference — please reload and try again.";
  }

  /* --- items: recompute everything from the catalog --- */
  const rawItems = Array.isArray(payload.items) ? payload.items : [];
  if (rawItems.length === 0) errors.items = "Your bag is empty.";
  if (rawItems.length > 20) errors.items = "Too many lines in one order.";

  const lines: OrderLine[] = [];
  let subtotal = 0;
  let savings = 0;
  if (!errors.items) {
    for (const [i, raw] of rawItems.entries()) {
      const p: Product | undefined = raw.id ? getCatalogProduct(raw.id) : undefined;
      if (!p) {
        errors[`items.${i}`] = "An item in your bag is no longer available.";
        break;
      }
      if (p.soldOut) {
        errors[`items.${i}`] = `${p.name} is sold out — please remove it from your bag.`;
        break;
      }
      if (!raw.size || !p.sizes.includes(raw.size)) {
        errors[`items.${i}`] = `Please choose a valid size for ${p.name}.`;
        break;
      }
      const qty = Number(raw.qty);
      if (!Number.isInteger(qty) || qty < 1 || qty > 9) {
        errors[`items.${i}`] = `Quantity for ${p.name} must be between 1 and 9.`;
        break;
      }
      lines.push({ id: p.id, name: p.name, size: raw.size, qty, price: p.price, lineTotal: p.price * qty });
      subtotal += p.price * qty;
      if (p.compareAt) savings += (p.compareAt - p.price) * qty;
    }
  }

  /* --- customer --- */
  const c = payload.customer ?? {};
  const name = (c.name ?? "").trim();
  if (name.length < 3) errors.name = "Please enter your full name.";
  const phone = c.phone ? normalizeBDPhone(c.phone) : null;
  if (!phone) errors.phone = PHONE_ERROR;
  let altPhone: string | undefined;
  if (c.altPhone && c.altPhone.trim()) {
    altPhone = normalizeBDPhone(c.altPhone) ?? undefined;
    if (!altPhone) errors.altPhone = PHONE_ERROR;
  }
  const email = (c.email ?? "").trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address.";
  const division = c.division ?? "";
  if (!divisions[division]) errors.division = "Select your division.";
  const district = c.district ?? "";
  if (divisions[division] && !divisions[division].includes(district))
    errors.district = "Select your district.";
  const address = (c.address ?? "").trim();
  if (address.length < 8) errors.address = "Please enter your full address (house, road, area).";

  /* --- zone, payment, promo --- */
  const zone: DeliveryZone | null =
    payload.zone === "inside" || payload.zone === "outside" ? payload.zone : null;
  if (!zone) errors.zone = "Select a delivery zone.";
  const delivery =
    zone && subtotal > 0 && subtotal < ship.freeAbove
      ? zone === "inside"
        ? ship.insideDhaka
        : ship.outsideDhaka
      : 0;

  if (payload.payment !== "cod" || !settings.payments.cod)
    errors.payment = "Only Cash on Delivery is available right now.";

  let discount = 0;
  if (payload.promoCode && payload.promoCode.trim()) {
    const promo = settings.promos.find(
      (x) => x.code === payload.promoCode!.trim().toUpperCase() && x.active
    );
    if (!promo) errors.promoCode = "This code isn't active.";
    else discount = Math.round((subtotal * promo.pct) / 100);
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  /* --- idempotency: a retried submit returns the original order --- */
  const store = await readStore();
  if (key && store.idempotency[key]) {
    const existing = store.orders.find((o) => o.id === store.idempotency[key!]);
    if (existing) return { ok: true, order: existing, duplicate: true };
  }

  let id = "";
  do {
    id = "TRAC-" + Math.random().toString(36).slice(2, 8).toUpperCase();
  } while (store.orders.some((o) => o.id === id));

  const order: Order = {
    id,
    items: lines,
    subtotal,
    savings,
    discount,
    delivery,
    total: subtotal - discount + delivery,
    zone: zone!,
    eta: zone === "inside" ? ship.insideDays : ship.outsideDays,
    payment: "cod",
    status: "placed",
    customer: {
      name,
      phone: phone!,
      ...(altPhone ? { altPhone } : {}),
      ...(email ? { email } : {}),
      division,
      district,
      address,
      ...(c.note?.trim() ? { note: c.note.trim() } : {}),
    },
    createdAt: new Date().toISOString(),
  };

  store.orders.push(order);
  if (key) store.idempotency[key] = id;
  await writeStore(store);
  return { ok: true, order, duplicate: false };
}

/* Orders belonging to a customer (Phase 8 account history) — matched by
   canonical phone or account email; newest first. */
export async function ordersForContact(phone?: string, email?: string): Promise<Order[]> {
  const store = await readStore();
  return store.orders
    .filter(
      (o) =>
        (phone && o.customer.phone === phone) ||
        (email && o.customer.email?.toLowerCase() === email.toLowerCase())
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/* Admin (Phase 9): list + status updates on the same store. */
export async function listOrders(): Promise<Order[]> {
  const store = await readStore();
  return [...store.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order | null> {
  const store = await readStore();
  const order = store.orders.find((o) => o.id === id);
  if (!order) return null;
  order.status = status;
  await writeStore(store);
  return order;
}

export async function findOrder(id: string, phone: string): Promise<Order | null> {
  const store = await readStore();
  const o = store.orders.find((x) => x.id === id.trim().toUpperCase());
  if (!o) return null;
  const canonical = normalizeBDPhone(phone);
  return canonical && o.customer.phone === canonical ? o : null;
}
