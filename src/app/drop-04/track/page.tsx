"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, PackageSearch } from "lucide-react";
import { formatBDT } from "@/lib/bd-utils";

/**
 * Editorial order tracking (Part 5) — /drop-04/track.
 * Order ID + checkout phone → live fulfillment status from
 * /api/editorial-orders/track. (The legacy /track page keeps serving
 * legacy-catalog orders; this page takes over at cutover — the SMS
 * template already points customers at bdtrac.com/track.)
 */

const STEPS = ["PENDING", "CONFIRMED", "PACKED", "SHIPPED", "DELIVERED"] as const;
const STEP_LABELS: Record<string, string> = {
  PENDING: "Placed",
  CONFIRMED: "Confirmed",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};

interface Tracking {
  orderNumber: string;
  orderStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  courierProvider: string | null;
  trackingCode: string | null;
  district: string;
  deliveryZone: string;
  subtotalBdt: number;
  discountBdt: number;
  shippingFeeBdt: number;
  totalBdt: number;
  placedAt: string;
  items: { title: string; sku: string; size: string; quantity: number; unitPriceBdt: number }[];
}

export default function TrackPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [tracking, setTracking] = useState<Tracking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setTracking(null);
    setLoading(true);
    try {
      const qs = new URLSearchParams({ orderNumber, phone });
      const res = await fetch(`/api/editorial-orders/track?${qs.toString()}`);
      const data = (await res.json()) as { tracking?: Tracking; error?: string };
      if (res.ok && data.tracking) setTracking(data.tracking);
      else setError(data.error ?? "Lookup failed.");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  };

  const stepIndex = tracking ? STEPS.indexOf(tracking.orderStatus as (typeof STEPS)[number]) : -1;
  const isTerminal = tracking && (tracking.orderStatus === "CANCELLED" || tracking.orderStatus === "RETURNED");

  return (
    <div className="tk-page">
      <h1 className="co-page-title">
        Track order <span className="font-bn co-bn-inline">/ অর্ডার ট্র্যাক করুন</span>
      </h1>
      <form className="co-form tk-form" onSubmit={submit}>
        <label className="co-field">
          <span className="co-label">
            Order ID <span className="font-bn co-bn">/ অর্ডার নম্বর</span>
          </span>
          <input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="TRAC-1025" className="co-input" autoComplete="off" />
        </label>
        <label className="co-field">
          <span className="co-label">
            Mobile number <span className="font-bn co-bn">/ মোবাইল নম্বর</span>
          </span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)}
            placeholder="01XXXXXXXXX" inputMode="tel" className="co-input" />
        </label>
        {error ? <p className="co-banner" role="alert">{error}</p> : null}
        <button type="submit" className="sf-btn sf-btn-accent co-submit" disabled={loading}>
          <PackageSearch size={16} /> {loading ? "Looking up…" : "Track"}
        </button>
      </form>

      {tracking ? (
        <section className="tk-result" aria-label="Order status">
          <div className="tk-result-head">
            <span className="font-spec tk-number">{tracking.orderNumber}</span>
            <span className="font-spec tk-placed">
              {new Date(tracking.placedAt).toLocaleDateString("en-GB")} — {tracking.district}
            </span>
          </div>

          {isTerminal ? (
            <p className="tk-terminal">
              This order was {STEP_LABELS[tracking.orderStatus].toLowerCase()}. For help, message us
              with your order number.
            </p>
          ) : (
            <ol className="tk-steps">
              {STEPS.map((step, i) => (
                <li key={step} className={`tk-step ${i <= stepIndex ? "is-done" : ""}`}>
                  <span className="tk-step-dot">{i <= stepIndex ? <Check size={13} /> : null}</span>
                  <span className="tk-step-label">{STEP_LABELS[step]}</span>
                </li>
              ))}
            </ol>
          )}

          <p className="font-spec tk-meta">
            PAYMENT: {tracking.paymentMethod} — {tracking.paymentStatus}
            {tracking.courierProvider
              ? ` · COURIER: ${tracking.courierProvider}${tracking.trackingCode ? ` ${tracking.trackingCode}` : ""}`
              : " · COURIER: ASSIGNED AT DISPATCH"}
          </p>

          <ul className="tk-items">
            {tracking.items.map((i) => (
              <li key={i.sku} className="tk-item">
                <span>
                  {i.title} <span className="font-spec tk-item-spec">{i.sku} — {i.size} × {i.quantity}</span>
                </span>
                <span className="font-spec">{formatBDT(i.unitPriceBdt * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="co-summary font-spec">
            <div><dt>SUBTOTAL</dt><dd>{formatBDT(tracking.subtotalBdt)}</dd></div>
            {tracking.discountBdt > 0 ? (
              <div><dt>DISCOUNT</dt><dd>−{formatBDT(tracking.discountBdt)}</dd></div>
            ) : null}
            <div><dt>DELIVERY</dt><dd>{tracking.shippingFeeBdt === 0 ? "FREE" : formatBDT(tracking.shippingFeeBdt)}</dd></div>
            <div className="co-summary-total"><dt>TOTAL</dt><dd>{formatBDT(tracking.totalBdt)}</dd></div>
          </dl>
          <Link href="/drop-04#grid" className="sf-detail-back font-spec">← BACK TO THE GRID</Link>
        </section>
      ) : null}
    </div>
  );
}
