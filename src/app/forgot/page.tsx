"use client";

import { useState } from "react";
import Link from "next/link";
import Reveal from "@/components/Reveal";

/* Forgot password (§8.2). The response is identical whether or not the
   email has an account (no account enumeration). The reset link is emailed
   once a mail provider is configured; until then it is written to the
   server outbox (see docs/IMPLEMENTATION_PROGRESS.md, Phase 8). */
export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await fetch("/api/auth?action=forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {}
    setBusy(false);
    setSent(true);
  };

  return (
    <div className="wrap contact">
      <Reveal>
        <p className="eyebrow" style={{ color: "var(--color-accent)", marginBottom: 12 }}>
          Account Help
        </p>
        <h1>Forgot your password?</h1>
      </Reveal>
      {sent ? (
        <div style={{ maxWidth: 480, marginTop: 22 }}>
          <p style={{ lineHeight: 1.7 }}>
            If an account exists for <b>{email}</b>, a password reset link is on its way. The link
            works for one hour.
          </p>
          <p style={{ marginTop: 16 }}>
            <Link className="ui-btn ui-btn-dark ui-btn-md" href="/account">
              Back to Log In
            </Link>
          </p>
        </div>
      ) : (
        <form onSubmit={submit} style={{ maxWidth: 480, marginTop: 22 }}>
          <div className="field">
            <label>Email used for your account</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" inputMode="email" required />
          </div>
          <button className="btn black" type="submit" disabled={busy}>
            {busy ? "Sending…" : "Send Reset Link"}
          </button>
        </form>
      )}
    </div>
  );
}
