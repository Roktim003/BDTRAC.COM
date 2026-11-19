import { NextResponse } from "next/server";
import { ensureStores } from "@/lib/ensureStores";
import { randomBytes } from "crypto";
import { publicUser, updateUser, userFromRequest } from "@/lib/users";
import { ordersForContact } from "@/lib/orders";
import { divisions, normalizeBDPhone, PHONE_ERROR } from "@/lib/bd";
import { getCatalogProduct } from "@/lib/catalogStore";

/* Account API (Phase 8) — every route requires a valid session and only
   ever touches the signed-in user's own data.
   GET  /api/account?part=orders|addresses|wishlist
   POST /api/account?part=addresses|wishlist|profile                  */
async function requireUser(req: Request) {
  const user = await userFromRequest(req);
  if (!user) return null;
  return user;
}

export async function GET(req: Request) {
  await ensureStores();
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const part = new URL(req.url).searchParams.get("part") ?? "";
  if (part === "orders") {
    const orders = await ordersForContact(user.phone, user.email);
    return NextResponse.json({ orders });
  }
  if (part === "addresses") return NextResponse.json({ addresses: user.addresses });
  if (part === "wishlist") return NextResponse.json({ ids: user.wishlist });
  return NextResponse.json({ error: "Unknown part." }, { status: 400 });
}

export async function POST(req: Request) {
  await ensureStores();
  const user = await requireUser(req);
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const part = new URL(req.url).searchParams.get("part") ?? "";
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  if (part === "addresses" && body.action === "delete") {
    const r = await updateUser(user.id, (u) => {
      u.addresses = u.addresses.filter((a) => a.id !== body.id);
      return null;
    });
    return r.ok
      ? NextResponse.json({ addresses: r.user.addresses })
      : NextResponse.json({ errors: r.errors }, { status: 400 });
  }

  if (part === "addresses") {
    const label = String(body.label ?? "").trim();
    const division = String(body.division ?? "");
    const district = String(body.district ?? "");
    const address = String(body.address ?? "").trim();
    const errors: Record<string, string> = {};
    if (label.length < 2) errors.label = "Give this address a label (e.g. Home).";
    if (!divisions[division]) errors.division = "Select your division.";
    else if (!divisions[division].includes(district)) errors.district = "Select your district.";
    if (address.length < 8) errors.address = "Enter the full address.";
    if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 400 });
    const r = await updateUser(user.id, (u) => {
      u.addresses.push({
        id: "a_" + randomBytes(6).toString("hex"),
        label,
        division,
        district,
        address,
      });
      return null;
    });
    return r.ok
      ? NextResponse.json({ addresses: r.user.addresses })
      : NextResponse.json({ errors: r.errors }, { status: 400 });
  }

  if (part === "wishlist") {
    const ids = (Array.isArray(body.ids) ? body.ids : [])
      .filter((id): id is string => typeof id === "string" && Boolean(getCatalogProduct(id)))
      .slice(0, 50);
    const r = await updateUser(user.id, (u) => {
      u.wishlist = Array.from(new Set(ids));
      return null;
    });
    return r.ok
      ? NextResponse.json({ ids: r.user.wishlist })
      : NextResponse.json({ errors: r.errors }, { status: 400 });
  }

  if (part === "profile") {
    const name = String(body.name ?? "").trim();
    const phoneRaw = String(body.phone ?? "");
    const phone = normalizeBDPhone(phoneRaw);
    const errors: Record<string, string> = {};
    if (name.length < 3) errors.name = "Please enter your full name.";
    if (!phone) errors.phone = PHONE_ERROR;
    if (Object.keys(errors).length) return NextResponse.json({ errors }, { status: 400 });
    const r = await updateUser(user.id, (u, store) => {
      if (store.users.some((x) => x.id !== u.id && x.phone === phone))
        return { phone: "Another account uses this mobile number." };
      u.name = name;
      u.phone = phone!;
      return null;
    });
    return r.ok
      ? NextResponse.json({ user: publicUser(r.user) })
      : NextResponse.json({ errors: r.errors }, { status: 400 });
  }

  return NextResponse.json({ error: "Unknown part." }, { status: 400 });
}
