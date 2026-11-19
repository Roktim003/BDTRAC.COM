"use client";

import Link from "next/link";

/* Branded error boundary (Phase 12) — a failure shows help, not a stack. */
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="wrap" style={{ padding: "80px 20px 100px", textAlign: "center" }}>
      <p className="eyebrow" style={{ color: "var(--color-accent)", marginBottom: 10 }}>
        Something went wrong
      </p>
      <h1 style={{ fontSize: 32, marginBottom: 12 }}>We hit a bump in the road</h1>
      <p style={{ color: "var(--muted)", maxWidth: 440, margin: "0 auto 28px", lineHeight: 1.7 }}>
        The page failed to load. Your bag and account are safe — try again, or head back to the
        shop.
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <button className="ui-btn ui-btn-primary ui-btn-md" onClick={reset}>
          Try Again
        </button>
        <Link className="ui-btn ui-btn-light ui-btn-md" href="/products">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
