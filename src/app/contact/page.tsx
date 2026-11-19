"use client";

import { useState } from "react";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { useSettings } from "@/lib/storefront";

/* Contact (Phase 10) — the form really sends now (POST /api/contact,
   readable in Admin → Messages). The old version showed a success state
   without sending anything. */
export default function ContactPage() {
  const { stores } = useSettings();
  const [form, setForm] = useState({ name: "", phone: "", subject: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors(data.errors ?? { form: "Could not send — please try again." });
        return;
      }
      setSent(true);
    } catch {
      setErrors({ form: "Network problem — check your connection and try again." });
    } finally {
      setBusy(false);
    }
  };

  const err = (k: string) =>
    errors[k] ? (
      <p className="ferror" role="alert">
        {errors[k]}
      </p>
    ) : null;
  const realPhones = stores.map((s) => s.phone).filter((p) => p && !p.includes("XXX"));

  return (
    <div className="wrap contact">
      <Reveal>
        <h1>Contact Us</h1>
        <p>
          Questions about an order, sizing or stock? Send us a message — for order questions,
          include your order ID so we can help faster. You can also{" "}
          <Link href="/track">track your order</Link> instantly.
        </p>
      </Reveal>
      {sent ? (
        <Reveal>
          <div className="success" style={{ padding: "20px 0" }}>
            <div className="tick">&#10003;</div>
            <h1 style={{ fontSize: 26 }}>Message Sent</h1>
            <p>
              Thanks, {form.name.split(" ")[0] || "friend"} — your message is with our team.
              We&apos;ll reply on <b>{form.phone}</b>.
            </p>
          </div>
        </Reveal>
      ) : (
        <form onSubmit={submit} noValidate>
          <div className="frow">
            <div className="field">
              <label>Name</label>
              <input value={form.name} onChange={set("name")} placeholder="Your name" autoComplete="name" />
              {err("name")}
            </div>
            <div className="field">
              <label>Mobile number</label>
              <input value={form.phone} onChange={set("phone")} placeholder="01XXXXXXXXX" inputMode="tel" autoComplete="tel" />
              {err("phone")}
            </div>
          </div>
          <div className="field">
            <label>Subject</label>
            <input value={form.subject} onChange={set("subject")} placeholder="e.g. Order TRAC-XXXXXX — size exchange" />
            {err("subject")}
          </div>
          <div className="field">
            <label>Message</label>
            <textarea value={form.message} onChange={set("message")} rows={5} placeholder="How can we help?" />
            {err("message")}
          </div>
          {err("form")}
          <button className="btn black" type="submit" disabled={busy}>
            {busy ? "Sending…" : "Send Message"}
          </button>
        </form>
      )}
      <Reveal>
        <div className="delivery-box" style={{ marginTop: 40 }}>
          <b>Visit a store</b>
          <br />
          {stores.map((s) => (
            <span key={s.city}>
              {s.city} — {s.address.replace(/\n/g, ", ")}
              <br />
            </span>
          ))}
          {realPhones.length > 0 && (
            <>
              <b style={{ marginTop: 10 }}>Call us:</b> {realPhones[0]}
            </>
          )}
        </div>
      </Reveal>
    </div>
  );
}
