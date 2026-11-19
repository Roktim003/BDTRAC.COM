import { NextResponse } from "next/server";
import {
  adminClearedCookie,
  adminCookie,
  adminPassword,
  checkAdminPassword,
  isAdminRequest,
  signAdmin,
} from "@/lib/admin";
import { getCatalog, saveCatalog } from "@/lib/catalogStore";
import { getSettings, saveSettings, type Settings } from "@/lib/settingsStore";
import { listOrders, updateOrderStatus, type OrderStatus } from "@/lib/orders";
import { listMessages } from "@/lib/messages";
import { ensureStores } from "@/lib/ensureStores";
import type { Product } from "@/lib/products";

const STATUSES: OrderStatus[] = ["placed", "confirmed", "packed", "shipped", "delivered", "cancelled"];
const CATEGORIES = ["t-shirts", "polos", "hoodies"];
const FITS = ["Oversized", "Regular", "Relaxed"];

/* Admin API (Phase 9). Every data action requires the admin session.
   GET  /api/admin?part=me|dashboard|products|orders|settings
   POST /api/admin?part=login|logout|product|product-delete|order-status|collections|settings */
export async function GET(req: Request) {
  await ensureStores();
  const part = new URL(req.url).searchParams.get("part") ?? "";
  if (part === "me") {
    return isAdminRequest(req)
      ? NextResponse.json({ admin: true, devMode: adminPassword().devMode })
      : NextResponse.json({ admin: false }, { status: 401 });
  }
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Admin sign-in required." }, { status: 401 });

  if (part === "products") return NextResponse.json(getCatalog());
  if (part === "orders") return NextResponse.json({ orders: await listOrders() });
  if (part === "settings") return NextResponse.json({ settings: getSettings() });
  if (part === "messages") return NextResponse.json({ messages: await listMessages() });
  if (part === "dashboard") {
    const catalog = getCatalog();
    const orders = await listOrders();
    const revenue = orders
      .filter((o) => o.status !== "cancelled")
      .reduce((s, o) => s + o.total, 0);
    return NextResponse.json({
      productCount: catalog.products.length,
      collectionCount: catalog.collections.length,
      orderCount: orders.length,
      revenue,
      recentOrders: orders.slice(0, 5),
    });
  }
  return NextResponse.json({ error: "Unknown part." }, { status: 400 });
}

function validateProduct(raw: Record<string, unknown>): { product?: Product; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const name = String(raw.name ?? "").trim();
  const price = Number(raw.price);
  const compareAt = raw.compareAt === "" || raw.compareAt == null ? undefined : Number(raw.compareAt);
  const category = String(raw.category ?? "");
  const images = Array.isArray(raw.images) ? raw.images.map(String).filter(Boolean) : [];
  const sizes = Array.isArray(raw.sizes) ? raw.sizes.map(String) : [];
  const colors = Array.isArray(raw.colors)
    ? (raw.colors as { name?: string; hex?: string }[])
        .filter((c) => c.name && c.hex)
        .map((c) => ({ name: String(c.name), hex: String(c.hex) }))
    : [];
  if (name.length < 3) errors.name = "Name is required (min 3 characters).";
  if (!Number.isFinite(price) || price < 0) errors.price = "Price must be 0 or more.";
  if (compareAt !== undefined && (!Number.isFinite(compareAt) || compareAt <= price))
    errors.compareAt = "Compare-at price must be higher than the price.";
  if (!CATEGORIES.includes(category)) errors.category = "Choose a category.";
  if (images.length === 0) errors.images = "Add at least one image URL.";
  else if (images.some((u) => !/^(https:\/\/|\/)/.test(u)))
    errors.images = "Image URLs must start with https:// (or / for local files).";
  if (sizes.length === 0) errors.sizes = "Select at least one size.";
  if (!FITS.includes(String(raw.fit))) errors.fit = "Choose a fit.";
  if (Object.keys(errors).length) return { errors };
  return {
    errors,
    product: {
      id: String(raw.id ?? ""),
      name,
      price: Math.round(price),
      ...(compareAt !== undefined ? { compareAt: Math.round(compareAt) } : {}),
      category: category as Product["category"],
      images,
      soldOut: Boolean(raw.soldOut),
      isNew: Boolean(raw.isNew),
      description: String(raw.description ?? ""),
      fabric: String(raw.fabric ?? ""),
      colors,
      sizes,
      fit: String(raw.fit) as Product["fit"],
      collection: String(raw.collection ?? ""),
    },
  };
}

export async function POST(req: Request) {
  await ensureStores();
  const part = new URL(req.url).searchParams.get("part") ?? "";
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  if (part === "login") {
    if (!checkAdminPassword(String(body.password ?? "")))
      return NextResponse.json({ error: "Incorrect admin password." }, { status: 401 });
    return NextResponse.json(
      { admin: true, devMode: adminPassword().devMode },
      { headers: { "Set-Cookie": adminCookie(signAdmin()) } }
    );
  }
  if (part === "logout") {
    return NextResponse.json({ ok: true }, { headers: { "Set-Cookie": adminClearedCookie() } });
  }
  if (!isAdminRequest(req)) return NextResponse.json({ error: "Admin sign-in required." }, { status: 401 });

  if (part === "product") {
    const { product, errors } = validateProduct(body);
    if (!product) return NextResponse.json({ errors }, { status: 400 });
    const catalog = getCatalog();
    if (!product.id) {
      product.id = "p-" + Math.random().toString(36).slice(2, 10);
      catalog.products.push(product);
    } else {
      const i = catalog.products.findIndex((p) => p.id === product.id);
      if (i === -1) return NextResponse.json({ errors: { id: "Product not found." } }, { status: 404 });
      catalog.products[i] = product;
    }
    await saveCatalog(catalog);
    return NextResponse.json({ product });
  }

  if (part === "product-delete") {
    const catalog = getCatalog();
    catalog.products = catalog.products.filter((p) => p.id !== body.id);
    await saveCatalog(catalog);
    return NextResponse.json({ ok: true });
  }

  if (part === "collections") {
    const list = Array.isArray(body.collections) ? body.collections : [];
    const clean = list
      .map((c) => {
        const x = c as Record<string, unknown>;
        return {
          slug: String(x.slug ?? "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
          name: String(x.name ?? "").trim(),
          description: String(x.description ?? "").trim(),
        };
      })
      .filter((c) => c.slug && c.name);
    const catalog = getCatalog();
    catalog.collections = clean;
    await saveCatalog(catalog);
    return NextResponse.json({ collections: clean });
  }

  if (part === "order-status") {
    const status = String(body.status ?? "") as OrderStatus;
    if (!STATUSES.includes(status))
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    const order = await updateOrderStatus(String(body.id ?? ""), status);
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    return NextResponse.json({ order });
  }

  if (part === "settings") {
    const next = body.settings as Settings;
    if (!next || typeof next !== "object")
      return NextResponse.json({ error: "Invalid settings." }, { status: 400 });
    /* trust-but-verify the numeric shipping fields */
    const s = next.shipping;
    if (!s || !(s.insideDhaka >= 0) || !(s.outsideDhaka >= 0) || !(s.freeAbove >= 0))
      return NextResponse.json({ error: "Shipping rates must be 0 or more." }, { status: 400 });
    const media = [next.hero?.videoUrl, next.hero?.posterUrl];
    if (media.some((u) => u && !/^https:\/\//.test(u)))
      return NextResponse.json({ error: "Media URLs must start with https://." }, { status: 400 });
    await saveSettings(next);
    return NextResponse.json({ settings: getSettings() });
  }

  return NextResponse.json({ error: "Unknown part." }, { status: 400 });
}
