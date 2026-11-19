import Link from "next/link";

/* Branded 404 (Phase 11) — helpful exits instead of a dead end. */
export default function NotFound() {
  return (
    <div className="wrap" style={{ padding: "80px 20px 100px", textAlign: "center" }}>
      <p className="eyebrow" style={{ color: "var(--color-accent)", marginBottom: 10 }}>
        404
      </p>
      <h1 style={{ fontSize: 34, marginBottom: 12 }}>This page took a wrong turn</h1>
      <p style={{ color: "var(--muted)", maxWidth: 440, margin: "0 auto 28px", lineHeight: 1.7 }}>
        The page you're looking for doesn't exist — it may have moved with our latest drop.
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <Link className="ui-btn ui-btn-primary ui-btn-md" href="/products?sort=new">
          Shop the Latest Drop
        </Link>
        <Link className="ui-btn ui-btn-light ui-btn-md" href="/">
          Back Home
        </Link>
        <Link className="ui-btn ui-btn-ghost ui-btn-md" href="/track">
          Track an Order
        </Link>
      </div>
    </div>
  );
}
