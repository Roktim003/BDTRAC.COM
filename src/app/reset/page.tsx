"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Reveal from "@/components/Reveal";

function ResetInner() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/auth?action=reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors(data.errors ?? { form: "Something went wrong." });
        return;
      }
      setDone(true);
    } catch {
      setErrors({ form: "Network problem — try again." });
    } finally {
      setBusy(false);
    }
  };

  if (!token)
    return (
      <p style={{ marginTop: 22, lineHeight: 1.7 }}>
        This page needs a reset link. <Link href="/forgot">Request a new one</Link>.
      </p>
    );

  if (done)
    return (
      <div style={{ maxWidth: 480, marginTop: 22 }}>
        <p style={{ lineHeight: 1.7 }}>Your password has been changed.</p>
        <p style={{ marginTop: 16 }}>
          <Link className="ui-btn ui-btn-primary ui-btn-md" href="/account">
            Log In
          </Link>
        </p>
      </div>
    );

  return (
    <form onSubmit={submit} style={{ maxWidth: 480, marginTop: 22 }} noValidate>
      <div className="field">
        <label>New password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" />
        {errors.password && <p className="ferror">{errors.password}</p>}
      </div>
      {errors.form && (
        <p className="ferror" role="alert" style={{ marginBottom: 12 }}>
          {errors.form}
        </p>
      )}
      <button className="btn black" type="submit" disabled={busy}>
        {busy ? "Saving…" : "Set New Password"}
      </button>
    </form>
  );
}

export default function ResetPage() {
  return (
    <div className="wrap contact">
      <Reveal>
        <p className="eyebrow" style={{ color: "var(--color-accent)", marginBottom: 12 }}>
          Account Help
        </p>
        <h1>Set a new password</h1>
      </Reveal>
      <Suspense>
        <ResetInner />
      </Suspense>
    </div>
  );
}
