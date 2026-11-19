import { NextResponse } from "next/server";
import { placeOrder, findOrder, type OrderPayload } from "@/lib/orders";
import { rateLimit, clientIp } from "@/lib/security";
import { ensureStores } from "@/lib/ensureStores";

/* Order API (Phase 7). POST creates an order with full server-side
   validation (prices recomputed from the catalog — client totals are never
   trusted). GET ?id=&phone= looks an order up for the customer
   (Phase 8 tracking builds on this). */
export async function POST(req: Request) {
  await ensureStores();
  if (!rateLimit(`orders:${clientIp(req)}`, 60, 60_000))
    return NextResponse.json({ error: "Too many requests — wait a minute and try again." }, { status: 429 });
  let payload: OrderPayload;
  try {
    payload = (await req.json()) as OrderPayload;
  } catch {
    return NextResponse.json({ errors: { body: "Invalid request." } }, { status: 400 });
  }
  const result = await placeOrder(payload);
  if (!result.ok) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }
  return NextResponse.json(
    { order: result.order, duplicate: result.duplicate },
    { status: result.duplicate ? 200 : 201 }
  );
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id") ?? "";
  const phone = url.searchParams.get("phone") ?? "";
  if (!id || !phone) {
    return NextResponse.json({ error: "Order ID and phone are required." }, { status: 400 });
  }
  const order = await findOrder(id, phone);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  return NextResponse.json({ order });
}
