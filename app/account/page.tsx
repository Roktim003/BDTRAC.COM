"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import OrderStatusView from "@/components/OrderStatusView";
import { EmptyState, Tabs } from "@/components/ui";
import { useQuickView } from "@/components/Shell";
import { useCart } from "@/lib/cart";
import { divisions, divisionNames } from "@/lib/bd";
import { taka, type Product } from "@/lib/products";
import { registryGetProduct } from "@/lib/storefront";
import type { Order } from "@/lib/orders";
import type { Address, PublicUser } from "@/lib/users";

/* Customer account (Phase 8): sign up / log in, order history with status,
   address book, synced wishlist, profile. Guest checkout and guest
   tracking (/track) keep working without an account. */

type Me = PublicUser;

function AuthForms({ onAuthed }: { onAuthed: (u: Me) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      const res = await fetch(`/api/auth?action=${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors(data.errors ?? { form: "Something went wrong." });
        return;
      }
      onAuthed(data.user as Me);
    } catch {
      setErrors({ form: "Network problem — try again." });
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

  return (
    <div style={{ maxWidth: 460 }}>
      <div className="chips" style={{ marginBottom: 22 }} role="group" aria-label="Sign in or create account">
        <button className={mode === "login" ? "on" : ""} onClick={() => setMode("login")}>
          Log In
        </button>
        <button className={mode === "signup" ? "on" : ""} onClick={() => setMode("signup")}>
          Create Account
        </button>
      </div>
      <form onSubmit={submit} noValidate>
        {mode === "signup" && (
          <>
            <div className="field">
              <label>Full name</label>
              <input value={form.name} onChange={set("name")} placeholder="Your name" autoComplete="name" />
              {err("name")}
            </div>
            <div className="field">
              <label>Mobile number</label>
              <input value={form.phone} onChange={set("phone")} placeholder="01XXXXXXXXX" inputMode="tel" autoComplete="tel" />
              {err("phone")}
            </div>
          </>
        )}
        <div className="field">
          <label>Email</label>
          <input value={form.email} onChange={set("email")} placeholder="you@example.com" inputMode="email" autoComplete="email" />
          {err("email")}
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" value={form.password} onChange={set("password")} placeholder={mode === "signup" ? "At least 8 characters" : "Your password"} autoComplete={mode === "signup" ? "new-password" : "current-password"} />
          {err("password")}
        </div>
        {err("form")}
        <button className="btn black" type="submit" disabled={busy} style={{ width: "100%" }}>
          {busy ? "Please wait…" : mode === "login" ? "Log In" : "Create Account"}
        </button>
      </form>
      <p style={{ marginTop: 14, fontSize: 13.5, color: "var(--muted)" }}>
        <Link href="/forgot">Forgot your password?</Link> · No account needed to shop —{" "}
        <Link href="/track">track a guest order</Link> any time.
      </p>
    </div>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const { add, setOpen } = useCart();

  useEffect(() => {
    fetch("/api/account?part=orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .catch(() => setOrders([]));
  }, []);

  const reorder = (o: Order) => {
    let added = 0;
    for (const l of o.items) {
      const p = registryGetProduct(l.id);
      if (p && !p.soldOut && p.sizes.includes(l.size)) {
        add(p, l.size, l.qty);
        added++;
      }
    }
    if (added > 0) setOpen(true);
  };

  if (orders === null) return <p style={{ color: "var(--muted)" }}>Loading your orders…</p>;
  if (orders.length === 0)
    return (
      <EmptyState
        title="No orders yet"
        text="Orders you place with this account's mobile number or email will appear here."
        action={
          <Link className="ui-btn ui-btn-dark ui-btn-md" href="/products">
            Start Shopping
          </Link>
        }
      />
    );
  return (
    <div className="acct-orders">
      {orders.map((o) => (
        <div key={o.id} className="acct-order">
          <button className="acct-order-head" onClick={() => setOpenId(openId === o.id ? null : o.id)} aria-expanded={openId === o.id}>
            <span>
              <b>{o.id}</b> · {new Date(o.createdAt).toLocaleDateString("en-GB")}
            </span>
            <span className={`status-chip st-${o.status}`}>{o.status}</span>
            <span>{taka(o.total)}</span>
          </button>
          {openId === o.id && (
            <div style={{ paddingTop: 14 }}>
              <OrderStatusView order={o} />
              <button className="ui-btn ui-btn-dark ui-btn-sm" style={{ marginTop: 12 }} onClick={() => reorder(o)}>
                Reorder Available Items
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function AddressesTab({ user, refresh }: { user: Me; refresh: () => void }) {
  const [form, setForm] = useState({ label: "", division: "Dhaka", district: "Dhaka", address: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) =>
    setForm((f) => {
      const next = { ...f, [k]: e.target.value };
      if (k === "division") next.district = divisions[next.division]?.[0] ?? "";
      return next;
    });

  const addAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/account?part=addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setErrors(data.errors ?? {});
    setForm({ label: "", division: "Dhaka", district: "Dhaka", address: "" });
    setErrors({});
    refresh();
  };
  const remove = async (id: string) => {
    await fetch("/api/account?part=addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id }),
    });
    refresh();
  };

  return (
    <div>
      {user.addresses.length === 0 ? (
        <p style={{ color: "var(--muted)", marginBottom: 18 }}>No saved addresses yet.</p>
      ) : (
        <div className="addr-list">
          {user.addresses.map((a: Address) => (
            <div className="addr-card" key={a.id}>
              <b>{a.label}</b>
              <span>
                {a.address}, {a.district}, {a.division}
              </span>
              <button className="wish-remove" onClick={() => remove(a.id)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={addAddress} style={{ maxWidth: 520, marginTop: 10 }} noValidate>
        <div className="frow">
          <div className="field">
            <label>Label</label>
            <input value={form.label} onChange={set("label")} placeholder="Home / Office" />
            {errors.label && <p className="ferror">{errors.label}</p>}
          </div>
          <div className="field">
            <label>Division</label>
            <select value={form.division} onChange={set("division")}>
              {divisionNames.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="frow">
          <div className="field">
            <label>District</label>
            <select value={form.district} onChange={set("district")}>
              {(divisions[form.division] ?? []).map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Full address</label>
            <input value={form.address} onChange={set("address")} placeholder="House, Road, Area" />
            {errors.address && <p className="ferror">{errors.address}</p>}
          </div>
        </div>
        <button className="ui-btn ui-btn-dark ui-btn-md" type="submit">
          Save Address
        </button>
      </form>
    </div>
  );
}

function WishlistTab({ user }: { user: Me }) {
  const quickView = useQuickView();
  const [items, setItems] = useState<Product[]>([]);
  useEffect(() => {
    fetch("/api/account?part=wishlist")
      .then((r) => r.json())
      .then((d) => {
        const ids = (d.ids ?? user.wishlist) as string[];
        setItems(ids.map((id) => registryGetProduct(id)).filter((p): p is Product => Boolean(p)));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (items.length === 0)
    return (
      <EmptyState
        title="Wishlist is empty"
        text="Anything you save while signed in syncs here and to your other devices."
        action={
          <Link className="ui-btn ui-btn-dark ui-btn-md" href="/products">
            Browse Products
          </Link>
        }
      />
    );
  return (
    <div className="grid4">
      {items.map((p, i) => (
        <ProductCard key={p.id} product={p} onQuickView={quickView} index={i} />
      ))}
    </div>
  );
}

function ProfileTab({ user, refresh }: { user: Me; refresh: () => void }) {
  const [form, setForm] = useState({ name: user.name, phone: user.phone });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/account?part=profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setErrors(data.errors ?? {});
    setErrors({});
    setSaved(true);
    refresh();
  };
  return (
    <form onSubmit={save} style={{ maxWidth: 460 }} noValidate>
      <div className="field">
        <label>Full name</label>
        <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        {errors.name && <p className="ferror">{errors.name}</p>}
      </div>
      <div className="field">
        <label>Mobile number</label>
        <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} inputMode="tel" />
        {errors.phone && <p className="ferror">{errors.phone}</p>}
      </div>
      <div className="field">
        <label>Email (sign-in)</label>
        <input value={user.email} disabled />
      </div>
      <button className="ui-btn ui-btn-dark ui-btn-md" type="submit">
        Save Changes
      </button>
      {saved && <p style={{ color: "#1d7a3a", marginTop: 10, fontWeight: 600 }}>Saved ✓</p>}
    </form>
  );
}

export default function AccountPage() {
  const [user, setUser] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    fetch("/api/auth?action=me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setUser(d?.user ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(refresh, [refresh]);

  const logout = async () => {
    await fetch("/api/auth?action=logout", { method: "POST" });
    setUser(null);
  };

  return (
    <div className="wrap contact">
      <Reveal>
        <p className="eyebrow" style={{ color: "var(--color-accent)", marginBottom: 12 }}>
          Your Account
        </p>
        <h1>{user ? `Hi, ${user.name.split(" ")[0]}` : "Welcome to TRAC"}</h1>
      </Reveal>

      {loading ? (
        <p style={{ color: "var(--muted)", marginTop: 20 }}>Loading…</p>
      ) : !user ? (
        <div style={{ marginTop: 24 }}>
          <AuthForms
            onAuthed={(u) => {
              setUser(u);
              refresh();
            }}
          />
        </div>
      ) : (
        <div style={{ marginTop: 22 }}>
          <Tabs
            label="Account sections"
            tabs={[
              { id: "orders", label: "Orders", content: <OrdersTab /> },
              { id: "addresses", label: "Addresses", content: <AddressesTab user={user} refresh={refresh} /> },
              { id: "wishlist", label: "Wishlist", content: <WishlistTab user={user} /> },
              { id: "profile", label: "Profile", content: <ProfileTab user={user} refresh={refresh} /> },
            ]}
          />
          <button className="ui-btn ui-btn-ghost ui-btn-md" style={{ marginTop: 26 }} onClick={logout}>
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}
