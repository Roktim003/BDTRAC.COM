import { NextResponse } from "next/server";
import { getPrismaClient, isDatabaseConfigured } from "@/lib/prisma";
import { normalizeBdPhone } from "@/lib/bd-utils";
import { checkRateLimit, clientIpFromHeaders } from "@/lib/rate-limit";

/**
 * Editorial order tracking (Part 5) — GET
 * /api/editorial-orders/track?orderNumber=TRAC-1025&phone=01…
 *
 * The order number + the checkout phone are the credential pair (same
 * rule as the legacy tracker): a matching order number alone reveals
 * nothing, and a wrong phone gets the same 404 as a missing order.
 * Lookup attempts are rate-limited per IP.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const orderNumber = (url.searchParams.get("orderNumber") ?? "").trim().toUpperCase();
  const phoneRaw = url.searchParams.get("phone") ?? "";

  if (!/^TRAC-\d+$/.test(orderNumber)) {
    return NextResponse.json(
      { error: "Enter your order number, e.g. TRAC-1025." },
      { status: 400 },
    );
  }
  const phone = normalizeBdPhone(phoneRaw);
  if (!phone) {
    return NextResponse.json(
      { error: "Enter the mobile number used at checkout." },
      { status: 400 },
    );
  }

  const rate = checkRateLimit(`editorial-track:ip:${clientIpFromHeaders(req.headers)}`, 10, 10 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many lookups — please wait a few minutes." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Tracking is temporarily unavailable." },
      { status: 503 },
    );
  }

  const prisma = getPrismaClient();
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: { include: { variant: { include: { product: true } } } } },
  });
  if (!order || order.phone !== phone) {
    return NextResponse.json(
      { error: "No order found for that number + phone pair." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    tracking: {
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      courierProvider: order.courierProvider,
      trackingCode: order.trackingCode,
      district: order.district,
      deliveryZone: order.deliveryZone,
      subtotalBdt: order.subtotalBdt,
      discountBdt: order.discountBdt,
      shippingFeeBdt: order.shippingFeeBdt,
      totalBdt: order.totalBdt,
      placedAt: order.createdAt,
      items: order.items.map(
        (i: {
          quantity: number;
          unitPriceBdt: number;
          variant: { sku: string; size: string; product: { title: string } };
        }) => ({
        title: i.variant.product.title,
        sku: i.variant.sku,
        size: i.variant.size,
        quantity: i.quantity,
          unitPriceBdt: i.unitPriceBdt,
        }),
      ),
    },
  });
}
