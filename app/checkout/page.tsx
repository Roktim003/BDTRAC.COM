"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/cart";
import { taka } from "@/lib/products";

import { divisions, divisionNames, normalizeBDPhone, PHONE_ERROR } from "@/lib/bd";
import { deliveryCharge, useDeliveryZone } from "@/lib/zone";
import { useSettings } from "@/lib/storefront";
import type { Order } from "@/lib/orders";
import Reveal from "@/components/Reveal";

/* Checkout (Phase 7) — the client collects; the server decides.
   All prices/totals/stock are revalidated by POST /api/orders; this page
   never invents an order. Draft persists locally so an interrupted
   checkout resumes where it stopped (§7.2). */
const DRAFT_KEY = "trac-checkout-draft-v1";
const IDEM_KEY = "trac-idem-v1";

interface Form {
  name: string;
  phone: string;
  altPhone: string;
  email: string;
  division: string;
  district: string;
  address: string;
  note: string;
}

const EMPTY: Form = {
  name: "",
  phone: "",
  altPhone: "",
  email: "",
  division: "Dhaka",
  district: "Dhaka",
  address: "",
  note: "",
};

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const settings = useSettings();
  const shipping = settings.shipping;
  const [zone, setZone] = useDeliveryZone();
  const [form, setForm] = useState<Form>(EMPTY);
  const [promo, setPromo] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState<Order | null>(null);

  const delivery = deliveryCharge(zone, subtotal, shipping);
  const savings = useMemo(
    () =>
      items.reduce(
        (s, c) => s + (c.product.compareAt ? (c.product.compareAt - c.product.price) * c.qty : 0),
        0
      ),
    [items]
  );
  const total = subtotal + delivery;

  /* draft: load once, save on change. With no draft, a signed-in customer
     gets profile + first saved address prefilled (Phase 8). */
  useEffect(() => {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(DRAFT_KEY);
    } catch {}
    if (raw) {
      setForm({ ...EMPTY, ...JSON.parse(raw) });
      return;
    }
    fetch("/api/auth?action=me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const u = d?.user;
        if (!u) return;
        const a = u.addresses?.[0];
        setForm({
          ...EMPTY,
          name: u.name ?? "",
          phone: u.phone ?? "",
          email: u.email ?? "",
          ...(a
            ? { division: a.division, district: a.district, address: a.address }
            : {}),
        });
        if (a) setZone(a.district === "Dhaka" ? "inside" : "outside");
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    } catch {}
  }, [form]);

  const set = (k: keyof Form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const v = e.target.value;
    setForm((f) => {
      const next = { ...f, [k]: v };
      if (k === "division") {
        next.district = divisions[v]?.[0] ?? "";
        /* zone suggestion follows the district; the customer can override */
        setZone(next.district === "Dhaka" ? "inside" : "outside");
      }
      if (k === "district") setZone(v === "Dhaka" ? "inside" : "outside");
      return next;
    });
    setErrors((er) => {
      const next = { ...er };
      delete next[k];
      return next;
    });
  };

  const clientValidate = (): Record<string, string> => {
    const er: Record<string, string> = {};
    if (form.name.trim().length < 3) er.name = "Please enter your full name.";
    if (!normalizeBDPhone(form.phone)) er.phone = PHONE_ERROR;
    if (form.altPhone.trim() && !normalizeBDPhone(form.altPhone)) er.altPhone = PHONE_ERROR;
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      er.email = "Enter a valid email address.";
    if (!divisions[form.division]) er.division = "Select your division.";
    if (divisions[form.division] && !divisions[form.division].includes(form.district))
      er.district = "Select your district.";
    if (form.address.trim().length < 8)
      er.address = "Please enter your full address (house, road, area).";
    return er;
  };

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner("");
    const er = clientValidate();
    setErrors(er);
    if (Object.keys(er).length > 0) return;
    if (items.length === 0) return;
    if (items.some((c) => c.product.soldOut)) {
      setBanner("An item in your bag has sold out. Please remove it from your bag and try again.");
      return;
    }
    setSubmitting(true);
    try {
      let idem = sessionStorage.getItem(IDEM_KEY);
      if (!idem) {
        idem = `web-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
        sessionStorage.setItem(IDEM_KEY, idem);
      }
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((c) => ({ id: c.product.id, size: c.size, qty: c.qty })),
          customer: form,
          zone,
          payment: "cod",
          promoCode: promo.trim() || undefined,
          idempotencyKey: idem,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const serverErrors = (data.errors ?? {}) as Record<string, string>;
        const fieldErrors: Record<string, string> = {};
        for (const [k, v] of Object.entries(serverErrors)) {
          if (k.startsWith("items")) setBanner(v);
          else fieldErrors[k] = v;
        }
        if (serverErrors.promoCode) fieldErrors.promoCode = serverErrors.promoCode;
        setErrors(fieldErrors);
        if (!banner && Object.keys(fieldErrors).length === 0 && !serverErrors.items)
          setBanner("The order couldn't be placed. Please check the form and try again.");
        return;
      }
      setPlaced(data.order as Order);
      clear();
      try {
        localStorage.removeItem(DRAFT_KEY);
        sessionStorage.removeItem(IDEM_KEY);
      } catch {}
    } catch {
      setBanner("Network problem — your bag and details are saved. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (placed) {
    return (
      <div className="wrap checkout">
        <div className="success">
          <div className="tick">&#10003;</div>
          <h1>Order Placed!</h1>
          <p>
            Thank you, {placed.customer.name.split(" ")[0]}. Your order is confirmed and will be
            packed within {shipping.packedWithin}.
          </p>
          <div className="oid">{placed.id}</div>
          <div className="confirm-lines">
            {placed.items.map((l) => (
              <div className="srow" key={`${l.id}-${l.size}`}>
                <span>
                  {l.name} — Size {l.size} × {l.qty}
                </span>
                <span>{taka(l.lineTotal)}</span>
              </div>
            ))}
            <div className="srow">
              <span>Delivery ({placed.zone === "inside" ? "Inside Dhaka" : "Outside Dhaka"})</span>
              <span>{placed.delivery === 0 ? "Free" : taka(placed.delivery)}</span>
            </div>
            <div className="srow total">
              <span>Total (Cash on Delivery)</span>
              <span>{taka(placed.total)}</span>
            </div>
          </div>
          <p>
            Our team will call <b>{placed.customer.phone}</b> to confirm before delivery. Expected
            in {placed.eta}. Please keep {taka(placed.total)} ready for Cash on Delivery.
          </p>
          <div style={{ marginTop: 28 }}>
            <Link className="btn black" href="/products">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="wrap checkout">
        <h1>Checkout</h1>
        <p style={{ color: "var(--muted)", marginBottom: 24 }}>Your bag is empty.</p>
        <Link className="btn black" href="/products">
          Shop Products
        </Link>
      </div>
    );
  }

  const field = (k: keyof Form) =>
    errors[k] ? (
      <p className="ferror" role="alert">
        {errors[k]}
      </p>
    ) : null;

  return (
    <div className="wrap checkout">
      <Reveal>
        <h1>Checkout</h1>
      </Reveal>
      {banner && (
        <div className="order-banner" role="alert">
          {banner}
        </div>
      )}
      <form className="colayout" onSubmit={placeOrder} noValidate>
        <div>
          <div className="frow">
            <div className="field">
              <label>Full name *</label>
              <input value={form.name} onChange={set("name")} placeholder="e.g. Tanvir Ahmed" autoComplete="name" />
              {field("name")}
            </div>
            <div className="field">
              <label>Mobile number *</label>
              <input
                value={form.phone}
                onChange={set("phone")}
                placeholder="01XXXXXXXXX"
                inputMode="tel"
                autoComplete="tel"
              />
              {field("phone")}
            </div>
          </div>
          <div className="frow">
            <div className="field">
              <label>Alternative mobile (optional)</label>
              <input value={form.altPhone} onChange={set("altPhone")} placeholder="01XXXXXXXXX" inputMode="tel" />
              {field("altPhone")}
            </div>
            <div className="field">
              <label>Email (optional)</label>
              <input value={form.email} onChange={set("email")} placeholder="you@example.com" inputMode="email" autoComplete="email" />
              {field("email")}
            </div>
          </div>
          <div className="frow">
            <div className="field">
              <label>Division *</label>
              <select value={form.division} onChange={set("division")}>
                {divisionNames.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
              {field("division")}
            </div>
            <div className="field">
              <label>District *</label>
              <select value={form.district} onChange={set("district")}>
                {(divisions[form.division] ?? []).map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
              {field("district")}
            </div>
          </div>
          <div className="field">
            <label>Full address *</label>
            <textarea
              value={form.address}
              onChange={set("address")}
              rows={3}
              placeholder="House, Road, Block, Area"
              autoComplete="street-address"
            />
            {field("address")}
          </div>
          <div className="field">
            <label>Delivery instructions (optional)</label>
            <input value={form.note} onChange={set("note")} placeholder="e.g. Call before arriving" />
          </div>

          <div className="field" style={{ marginTop: 8 }}>
            <label>Delivery zone *</label>
            <div className="paybox">
              <label className="radio">
                <input type="radio" checked={zone === "inside"} onChange={() => setZone("inside")} style={{ width: 18, marginTop: 2 }} />
                <div>
                  <b>Inside Dhaka</b>
                  <p>
                    {taka(shipping.insideDhaka)} · arrives in {shipping.insideDays}
                    {subtotal >= shipping.freeAbove ? " · FREE for this order" : ""}
                  </p>
                </div>
              </label>
              <label className="radio">
                <input type="radio" checked={zone === "outside"} onChange={() => setZone("outside")} style={{ width: 18, marginTop: 2 }} />
                <div>
                  <b>Outside Dhaka</b>
                  <p>
                    {taka(shipping.outsideDhaka)} · arrives in {shipping.outsideDays}
                    {subtotal >= shipping.freeAbove ? " · FREE for this order" : ""}
                  </p>
                </div>
              </label>
            </div>
            {errors.zone && (
              <p className="ferror" role="alert">
                {errors.zone}
              </p>
            )}
          </div>

          <div className="field" style={{ marginTop: 8 }}>
            <label>Payment method</label>
            <div className="paybox">
              <label className="radio">
                <input type="radio" checked readOnly style={{ width: 18, marginTop: 2 }} />
                <div>
                  <b>Cash on Delivery</b>
                  <p>Pay in cash when your order arrives. Available across Bangladesh.</p>
                </div>
              </label>
              {!settings.payments.bkash && (
                <div className="radio off">
                  <input type="radio" disabled style={{ width: 18, marginTop: 2 }} />
                  <div>
                    <b>bKash</b>
                    <p>Coming soon — not available yet.</p>
                  </div>
                </div>
              )}
              {!settings.payments.nagad && (
                <div className="radio off">
                  <input type="radio" disabled style={{ width: 18, marginTop: 2 }} />
                  <div>
                    <b>Nagad</b>
                    <p>Coming soon — not available yet.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button className="btn black" type="submit" disabled={submitting}>
            {submitting ? "Placing Order…" : `Place Order — ${taka(total)}`}
          </button>
          <p className="note" style={{ marginTop: 10 }}>
            Prices and stock are verified by our server when you place the order. Your details are
            saved on this device if you need to come back.
          </p>
        </div>

        <div className="summary">
          <h3>Your Order</h3>
          {items.map((c) => (
            <div key={`${c.product.id}-${c.size}`} style={{ display: "flex", gap: 12, marginBottom: 14, alignItems: "center" }}>
              <Image src={c.product.images[0]} alt="" width={56} height={70} style={{ objectFit: "cover", background: "var(--grey2)" }} />
              <div style={{ flex: 1, fontSize: 13 }}>
                <div style={{ fontWeight: 700 }}>{c.product.name}</div>
                <div style={{ color: "var(--muted)" }}>
                  Size {c.size} × {c.qty}
                  {c.product.soldOut && <span style={{ color: "var(--color-accent)" }}> · Sold out</span>}
                </div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{taka(c.product.price * c.qty)}</div>
            </div>
          ))}
          <div className="srow" style={{ marginTop: 16 }}>
            <span>Subtotal</span>
            <span>{taka(subtotal)}</span>
          </div>
          {savings > 0 && (
            <div className="srow" style={{ color: "#1d7a3a" }}>
              <span>You save</span>
              <span>−{taka(savings)}</span>
            </div>
          )}
          <div className="srow">
            <span>Delivery ({zone === "inside" ? "Inside Dhaka" : "Outside Dhaka"})</span>
            <span>{delivery === 0 ? "Free" : taka(delivery)}</span>
          </div>
          <div className="srow total">
            <span>Total</span>
            <span>{taka(total)}</span>
          </div>
          <div className="field" style={{ marginTop: 14 }}>
            <label>Promo code</label>
            <input value={promo} onChange={(e) => setPromo(e.target.value)} placeholder="Enter code if you have one" />
            {errors.promoCode && (
              <p className="ferror" role="alert">
                {errors.promoCode}
              </p>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
