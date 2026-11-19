"use client";

import { useState } from "react";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import OrderStatusView from "@/components/OrderStatusView";
import type { Order } from "@/lib/orders";

/* Guest order tracking (§8.1) — order ID + the mobile number used at
   checkout. The pair acts as the credential: no account needed, and an
   order can't be viewed with the ID alone. */
export default function TrackPage() {
  const [id, setId] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setOrder(null);
    setBusy(true);
    try {
      const res = await fetch(
        `/api/orders?id=${encodeURIComponent(id.trim())}&phone=${encodeURIComponent(phone.trim())}`
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          res.status === 404
            ? "We couldn't find an order with that ID and mobile number. Check both and try again."
            : "Something went wrong — please try again."
        );
        return;
      }
      setOrder(data.order as Order);
    } catch {
      setError("Network problem — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wrap contact">
      <Reveal>
        <p className="eyebrow" style={{ color: "var(--color-accent)", marginBottom: 12 }}>
          Order Tracking
        </p>
        <h1>Track your order</h1>
        <p style={{ color: "var(--muted)", lineHeight: 1.7, maxWidth: 560 }}>
          Enter the order ID from your confirmation (it looks like TRAC-XXXXXX) and the mobile
          number you used at checkout.
        </p>
      </Reveal>
      <form onSubmit={submit} style={{ maxWidth: 480, marginTop: 26 }} noValidate>
        <div className="field">
          <label>Order ID</label>
          <input value={id} onChange={(e) => setId(e.target.value)} placeholder="TRAC-XXXXXX" required />
        </div>
        <div className="field">
          <label>Mobile number</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" inputMode="tel" required />
        </div>
        {error && (
          <p className="ferror" role="alert" style={{ marginBottom: 12 }}>
            {error}
          </p>
        )}
        <button className="btn black" type="submit" disabled={busy}>
          {busy ? "Checking…" : "Track Order"}
        </button>
      </form>

      {order && (
        <div style={{ maxWidth: 640, marginTop: 30 }}>
          <OrderStatusView order={order} />
        </div>
      )}

      <p style={{ marginTop: 34, color: "var(--muted)", fontSize: 14 }}>
        Have an account? <Link href="/account">See all your orders in one place</Link> — or{" "}
        <Link href="/contact">contact us</Link> if you need help.
      </p>
    </div>
  );
}
