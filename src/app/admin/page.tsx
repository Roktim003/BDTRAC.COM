"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { taka, type Collection, type Product } from "@/lib/products";
import type { Order } from "@/lib/orders";
import type { Settings } from "@/lib/settingsStore";

/* Admin & CMS (Phase 9) — password-gated (ADMIN_PASSWORD env; dev fallback
   with a warning banner). Manages the live catalog, collections, orders
   and site settings. Changes hit the storefront on next page load and the
   order engine immediately — no rebuild, no code edits. */

const api = async (part: string, body?: unknown) => {
  const res = await fetch(`/api/admin?part=${part}`, {
    method: body !== undefined ? "POST" : "GET",
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
};

const SIZES = ["S", "M", "L", "XL", "XXL"];
const emptyProduct: Product = {
  id: "",
  name: "",
  price: 0,
  category: "t-shirts",
  images: [],
  description: "",
  fabric: "",
  colors: [],
  sizes: ["M", "L"],
  fit: "Regular",
  collection: "",
};

function ProductsTab() {
  const [data, setData] = useState<{ products: Product[]; collections: Collection[] } | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");

  const load = useCallback(() => {
    api("products").then((r) => setData(r.data));
  }, []);
  useEffect(load, [load]);

  if (!data) return <p>Loading…</p>;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const r = await api("product", editing);
    if (!r.ok) return setErrors(r.data.errors ?? {});
    setErrors({});
    setEditing(null);
    setMsg("Product saved — live on the storefront now.");
    load();
  };
  const del = async (p: Product) => {
    if (!window.confirm(`Delete "${p.name}"? This removes it from the storefront.`)) return;
    await api("product-delete", { id: p.id });
    load();
  };

  return (
    <div>
      {msg && <p className="admin-ok">{msg}</p>}
      {!editing ? (
        <>
          <button className="ui-btn ui-btn-primary ui-btn-md" onClick={() => setEditing({ ...emptyProduct })}>
            + Add Product
          </button>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Category</th>
                <th>Collection</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.products.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>
                    {taka(p.price)}
                    {p.compareAt && <s> {taka(p.compareAt)}</s>}
                  </td>
                  <td>{p.category}</td>
                  <td>{p.collection || "—"}</td>
                  <td>{p.soldOut ? "Sold out" : p.isNew ? "New" : "Live"}</td>
                  <td className="admin-actions">
                    <button onClick={() => setEditing(JSON.parse(JSON.stringify(p)))}>Edit</button>
                    <button onClick={() => del(p)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <form onSubmit={save} className="admin-form" noValidate>
          <h3>{editing.id ? `Edit — ${editing.name}` : "New product"}</h3>
          <div className="frow">
            <div className="field">
              <label>Name *</label>
              <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              {errors.name && <p className="ferror">{errors.name}</p>}
            </div>
            <div className="field">
              <label>Category *</label>
              <select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value as Product["category"] })}>
                <option value="t-shirts">T-Shirts</option>
                <option value="polos">Polos</option>
                <option value="hoodies">Hoodies</option>
              </select>
            </div>
          </div>
          <div className="frow">
            <div className="field">
              <label>Price (BDT) *</label>
              <input type="number" value={editing.price || ""} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} />
              {errors.price && <p className="ferror">{errors.price}</p>}
            </div>
            <div className="field">
              <label>Compare-at price (optional)</label>
              <input
                type="number"
                value={editing.compareAt ?? ""}
                onChange={(e) =>
                  setEditing({ ...editing, compareAt: e.target.value === "" ? undefined : Number(e.target.value) })
                }
              />
              {errors.compareAt && <p className="ferror">{errors.compareAt}</p>}
            </div>
          </div>
          <div className="frow">
            <div className="field">
              <label>Collection (slug)</label>
              <select value={editing.collection} onChange={(e) => setEditing({ ...editing, collection: e.target.value })}>
                <option value="">— none —</option>
                {data.collections.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Fit</label>
              <select value={editing.fit} onChange={(e) => setEditing({ ...editing, fit: e.target.value as Product["fit"] })}>
                <option>Oversized</option>
                <option>Regular</option>
                <option>Relaxed</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>Sizes offered *</label>
            <div className="chips">
              {SIZES.map((s) => (
                <button
                  type="button"
                  key={s}
                  className={editing.sizes.includes(s) ? "on" : ""}
                  onClick={() =>
                    setEditing({
                      ...editing,
                      sizes: editing.sizes.includes(s)
                        ? editing.sizes.filter((x) => x !== s)
                        : SIZES.filter((x) => [...editing.sizes, s].includes(x)),
                    })
                  }
                >
                  {s}
                </button>
              ))}
            </div>
            {errors.sizes && <p className="ferror">{errors.sizes}</p>}
          </div>
          <div className="field">
            <label>Colours (name + swatch)</label>
            {editing.colors.map((c, i) => (
              <div className="frow" key={i}>
                <input
                  value={c.name}
                  placeholder="Colour name"
                  onChange={(e) => {
                    const colors = [...editing.colors];
                    colors[i] = { ...colors[i], name: e.target.value };
                    setEditing({ ...editing, colors });
                  }}
                />
                <input
                  type="color"
                  value={c.hex}
                  onChange={(e) => {
                    const colors = [...editing.colors];
                    colors[i] = { ...colors[i], hex: e.target.value };
                    setEditing({ ...editing, colors });
                  }}
                />
                <button type="button" className="wish-remove" onClick={() => setEditing({ ...editing, colors: editing.colors.filter((_, j) => j !== i) })}>
                  Remove
                </button>
              </div>
            ))}
            <button type="button" className="ui-btn ui-btn-ghost ui-btn-sm" onClick={() => setEditing({ ...editing, colors: [...editing.colors, { name: "", hex: "#111111" }] })}>
              + Colour
            </button>
          </div>
          <div className="field">
            <label>Image URLs (one per line) *</label>
            <textarea rows={3} value={editing.images.join("\n")} onChange={(e) => setEditing({ ...editing, images: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean) })} />
            {errors.images && <p className="ferror">{errors.images}</p>}
          </div>
          <div className="field">
            <label>Description</label>
            <textarea rows={3} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
          </div>
          <div className="field">
            <label>Fabric & care</label>
            <textarea rows={2} value={editing.fabric} onChange={(e) => setEditing({ ...editing, fabric: e.target.value })} />
          </div>
          <div className="frow">
            <label className="checkline">
              <input type="checkbox" checked={Boolean(editing.isNew)} onChange={(e) => setEditing({ ...editing, isNew: e.target.checked })} /> Mark as New
            </label>
            <label className="checkline">
              <input type="checkbox" checked={Boolean(editing.soldOut)} onChange={(e) => setEditing({ ...editing, soldOut: e.target.checked })} /> Sold out
            </label>
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <button className="ui-btn ui-btn-primary ui-btn-md" type="submit">
              Save Product
            </button>
            <button className="ui-btn ui-btn-ghost ui-btn-md" type="button" onClick={() => setEditing(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const load = useCallback(() => {
    api("orders").then((r) => setOrders(r.data.orders ?? []));
  }, []);
  useEffect(load, [load]);
  if (!orders) return <p>Loading…</p>;
  if (orders.length === 0) return <p>No orders yet.</p>;
  const setStatus = async (id: string, status: string) => {
    await api("order-status", { id, status });
    load();
  };
  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th>Order</th>
          <th>Customer</th>
          <th>Items</th>
          <th>Total</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((o) => (
          <tr key={o.id}>
            <td>
              <b>{o.id}</b>
              <br />
              <span className="admin-sub">{new Date(o.createdAt).toLocaleString("en-GB")}</span>
            </td>
            <td>
              {o.customer.name}
              <br />
              <span className="admin-sub">
                {o.customer.phone} · {o.customer.district}
              </span>
            </td>
            <td>
              {o.items.map((l) => `${l.name} (${l.size}) ×${l.qty}`).join(", ")}
            </td>
            <td>{taka(o.total)}</td>
            <td>
              <select value={o.status} onChange={(e) => setStatus(o.id, e.target.value)} aria-label={`Status for ${o.id}`}>
                {["placed", "confirmed", "packed", "shipped", "delivered", "cancelled"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CollectionsTab() {
  const [list, setList] = useState<Collection[] | null>(null);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    api("products").then((r) => setList(r.data.collections ?? []));
  }, []);
  if (!list) return <p>Loading…</p>;
  const save = async () => {
    const r = await api("collections", { collections: list });
    if (r.ok) setMsg("Collections saved — storefront navigation updates on next load.");
  };
  return (
    <div className="admin-form">
      {msg && <p className="admin-ok">{msg}</p>}
      {list.map((c, i) => (
        <div key={i} className="admin-collrow">
          <div className="frow">
            <div className="field">
              <label>Name</label>
              <input value={c.name} onChange={(e) => setList(list.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
            </div>
            <div className="field">
              <label>Slug</label>
              <input value={c.slug} onChange={(e) => setList(list.map((x, j) => (j === i ? { ...x, slug: e.target.value } : x)))} />
            </div>
          </div>
          <div className="field">
            <label>Description</label>
            <textarea rows={2} value={c.description} onChange={(e) => setList(list.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))} />
          </div>
          <button className="wish-remove" onClick={() => setList(list.filter((_, j) => j !== i))}>
            Delete collection
          </button>
        </div>
      ))}
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <button className="ui-btn ui-btn-ghost ui-btn-md" onClick={() => setList([...list, { slug: "", name: "", description: "" }])}>
          + Add Collection
        </button>
        <button className="ui-btn ui-btn-primary ui-btn-md" onClick={save}>
          Save Collections
        </button>
      </div>
      <p className="note">Note: a product's collection is set on the product itself (Products tab). Renaming a slug here means products keep pointing at the old slug until they're re-saved.</p>
    </div>
  );
}

function SettingsTab() {
  const [s, setS] = useState<Settings | null>(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  useEffect(() => {
    api("settings").then((r) => setS(r.data.settings));
  }, []);
  if (!s) return <p>Loading…</p>;
  const save = async () => {
    const r = await api("settings", { settings: s });
    if (r.ok) {
      setMsg("Settings saved — live on the storefront.");
      setErr("");
    } else setErr(r.data.error ?? "Could not save.");
  };
  const num = (v: string) => (v === "" ? 0 : Number(v));
  return (
    <div className="admin-form">
      {msg && <p className="admin-ok">{msg}</p>}
      {err && <p className="ferror">{err}</p>}

      <h3>Announcement bar</h3>
      <label className="checkline">
        <input type="checkbox" checked={s.announcement.enabled} onChange={(e) => setS({ ...s, announcement: { ...s.announcement, enabled: e.target.checked } })} /> Show announcement bar
      </label>
      <div className="field">
        <label>Text</label>
        <input value={s.announcement.text} onChange={(e) => setS({ ...s, announcement: { ...s.announcement, text: e.target.value } })} />
      </div>

      <h3>Delivery charges (BDT)</h3>
      <div className="frow">
        <div className="field">
          <label>Inside Dhaka</label>
          <input type="number" value={s.shipping.insideDhaka} onChange={(e) => setS({ ...s, shipping: { ...s.shipping, insideDhaka: num(e.target.value) } })} />
        </div>
        <div className="field">
          <label>Outside Dhaka</label>
          <input type="number" value={s.shipping.outsideDhaka} onChange={(e) => setS({ ...s, shipping: { ...s.shipping, outsideDhaka: num(e.target.value) } })} />
        </div>
        <div className="field">
          <label>Free delivery at/above</label>
          <input type="number" value={s.shipping.freeAbove} onChange={(e) => setS({ ...s, shipping: { ...s.shipping, freeAbove: num(e.target.value) } })} />
        </div>
      </div>

      <h3>Payments</h3>
      <p className="note">Only enable bKash/Nagad when the real merchant integration is connected and tested — enabling shows the option at checkout; the server still accepts COD only until the gateway is wired.</p>
      {(["cod", "bkash", "nagad"] as const).map((k) => (
        <label className="checkline" key={k}>
          <input type="checkbox" checked={s.payments[k]} onChange={(e) => setS({ ...s, payments: { ...s.payments, [k]: e.target.checked } })} /> {k === "cod" ? "Cash on Delivery" : k}
        </label>
      ))}

      <h3>Promo codes</h3>
      {s.promos.map((p, i) => (
        <div className="frow" key={i}>
          <input value={p.code} placeholder="CODE" onChange={(e) => setS({ ...s, promos: s.promos.map((x, j) => (j === i ? { ...x, code: e.target.value.toUpperCase() } : x)) })} />
          <input type="number" value={p.pct} placeholder="% off" onChange={(e) => setS({ ...s, promos: s.promos.map((x, j) => (j === i ? { ...x, pct: num(e.target.value) } : x)) })} />
          <label className="checkline">
            <input type="checkbox" checked={p.active} onChange={(e) => setS({ ...s, promos: s.promos.map((x, j) => (j === i ? { ...x, active: e.target.checked } : x)) })} /> Active
          </label>
          <button className="wish-remove" onClick={() => setS({ ...s, promos: s.promos.filter((_, j) => j !== i) })}>
            Remove
          </button>
        </div>
      ))}
      <button className="ui-btn ui-btn-ghost ui-btn-sm" onClick={() => setS({ ...s, promos: [...s.promos, { code: "", pct: 10, active: false }] })}>
        + Promo Code
      </button>

      <h3>Homepage</h3>
      <label className="checkline">
        <input type="checkbox" checked={s.hero.headline.enabled} onChange={(e) => setS({ ...s, hero: { ...s.hero, headline: { ...s.hero.headline, enabled: e.target.checked } } })} /> Show hero headline (off = approved minimal video hero)
      </label>
      <div className="field">
        <label>Featured product IDs (comma separated)</label>
        <input value={s.featuredProductIds.join(", ")} onChange={(e) => setS({ ...s, featuredProductIds: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} />
      </div>
      <div className="field">
        <label>Sections</label>
        {s.sections.map((sec, i) => (
          <label className="checkline" key={sec.id}>
            <input
              type="checkbox"
              checked={sec.enabled}
              onChange={(e) => setS({ ...s, sections: s.sections.map((x, j) => (j === i ? { ...x, enabled: e.target.checked } : x)) })}
            />{" "}
            {sec.id}
          </label>
        ))}
      </div>

      <h3>Brand story (homepage + About)</h3>
      <div className="frow">
        <div className="field">
          <label>Kicker</label>
          <input value={s.story.kicker} onChange={(e) => setS({ ...s, story: { ...s.story, kicker: e.target.value } })} />
        </div>
        <div className="field">
          <label>Title</label>
          <input value={s.story.title} onChange={(e) => setS({ ...s, story: { ...s.story, title: e.target.value } })} />
        </div>
      </div>
      <div className="field">
        <label>Text</label>
        <textarea rows={3} value={s.story.text} onChange={(e) => setS({ ...s, story: { ...s.story, text: e.target.value } })} />
      </div>
      <div className="field">
        <label>Value ticks (comma separated)</label>
        <input value={s.story.ticks.join(", ")} onChange={(e) => setS({ ...s, story: { ...s.story, ticks: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) } })} />
      </div>

      <h3>Social links (blank = hidden)</h3>
      <div className="frow">
        {(["instagram", "facebook", "youtube", "whatsapp"] as const).map((k) => (
          <div className="field" key={k}>
            <label>{k}</label>
            <input value={s.socials[k]} onChange={(e) => setS({ ...s, socials: { ...s.socials, [k]: e.target.value } })} placeholder="https://…" />
          </div>
        ))}
      </div>

      <h3>Stores</h3>
      {s.stores.map((st, i) => (
        <div key={i} className="admin-collrow">
          <div className="frow">
            <div className="field">
              <label>City / label</label>
              <input value={st.city} onChange={(e) => setS({ ...s, stores: s.stores.map((x, j) => (j === i ? { ...x, city: e.target.value } : x)) })} />
            </div>
            <div className="field">
              <label>Phone</label>
              <input value={st.phone} onChange={(e) => setS({ ...s, stores: s.stores.map((x, j) => (j === i ? { ...x, phone: e.target.value } : x)) })} />
            </div>
          </div>
          <div className="field">
            <label>Address</label>
            <textarea rows={2} value={st.address} onChange={(e) => setS({ ...s, stores: s.stores.map((x, j) => (j === i ? { ...x, address: e.target.value } : x)) })} />
          </div>
          <button className="wish-remove" onClick={() => setS({ ...s, stores: s.stores.filter((_, j) => j !== i) })}>
            Delete store
          </button>
        </div>
      ))}
      <button className="ui-btn ui-btn-ghost ui-btn-sm" onClick={() => setS({ ...s, stores: [...s.stores, { city: "", address: "", phone: "" }] })}>
        + Store
      </button>

      <div style={{ marginTop: 22 }}>
        <button className="ui-btn ui-btn-primary ui-btn-lg" onClick={save}>
          Save All Settings
        </button>
      </div>
    </div>
  );
}

function MessagesTab() {
  const [msgs, setMsgs] = useState<{ id: string; name: string; phone: string; subject: string; message: string; at: string }[] | null>(null);
  useEffect(() => {
    api("messages").then((r) => setMsgs(r.data.messages ?? []));
  }, []);
  if (!msgs) return <p>Loading…</p>;
  if (msgs.length === 0) return <p>No contact messages yet.</p>;
  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th>When</th>
          <th>From</th>
          <th>Subject</th>
          <th>Message</th>
        </tr>
      </thead>
      <tbody>
        {msgs.map((m) => (
          <tr key={m.id}>
            <td className="admin-sub">{new Date(m.at).toLocaleString("en-GB")}</td>
            <td>
              {m.name}
              <br />
              <span className="admin-sub">{m.phone}</span>
            </td>
            <td>{m.subject}</td>
            <td style={{ maxWidth: 380 }}>{m.message}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Dashboard() {
  const [d, setD] = useState<{ productCount: number; collectionCount: number; orderCount: number; revenue: number; recentOrders: Order[] } | null>(null);
  useEffect(() => {
    api("dashboard").then((r) => setD(r.data));
  }, []);
  if (!d) return <p>Loading…</p>;
  return (
    <div>
      <div className="admin-stats">
        <div>
          <b>{d.productCount}</b>
          <span>Products</span>
        </div>
        <div>
          <b>{d.collectionCount}</b>
          <span>Collections</span>
        </div>
        <div>
          <b>{d.orderCount}</b>
          <span>Orders</span>
        </div>
        <div>
          <b>{taka(d.revenue)}</b>
          <span>Revenue (non-cancelled)</span>
        </div>
      </div>
      <h3>Recent orders</h3>
      {d.recentOrders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        <table className="admin-table">
          <tbody>
            {d.recentOrders.map((o) => (
              <tr key={o.id}>
                <td>
                  <b>{o.id}</b>
                </td>
                <td>{o.customer.name}</td>
                <td>{o.status}</td>
                <td>{taka(o.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function AdminPage() {
  const [state, setState] = useState<"loading" | "login" | "ready">("loading");
  const [devMode, setDevMode] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    api("me").then((r) => {
      if (r.ok) {
        setDevMode(Boolean(r.data.devMode));
        setState("ready");
      } else setState("login");
    });
  }, []);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await api("login", { password });
    if (!r.ok) return setError("Incorrect admin password.");
    setDevMode(Boolean(r.data.devMode));
    setState("ready");
  };
  const logout = async () => {
    await api("logout", {});
    setState("login");
  };

  if (state === "loading")
    return (
      <div className="admin-shell">
        <p>Loading…</p>
      </div>
    );

  if (state === "login")
    return (
      <div className="admin-shell">
        <form onSubmit={login} className="admin-login" noValidate>
          <h1>TRAC Admin</h1>
          <p>Sign in to manage products, orders and site settings.</p>
          <div className="field">
            <label>Admin password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          </div>
          {error && (
            <p className="ferror" role="alert">
              {error}
            </p>
          )}
          <button className="btn black" type="submit" style={{ width: "100%" }}>
            Sign In
          </button>
          <p className="note" style={{ marginTop: 12 }}>
            <Link href="/">← Back to storefront</Link>
          </p>
        </form>
      </div>
    );

  return (
    <div className="admin-shell">
      <header className="admin-head">
        <b>TRAC Admin</b>
        <nav>
          {[
            ["dashboard", "Dashboard"],
            ["products", "Products"],
            ["orders", "Orders"],
            ["collections", "Collections"],
            ["messages", "Messages"],
            ["settings", "Settings"],
          ].map(([id, label]) => (
            <button key={id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </nav>
        <span>
          <Link href="/">Storefront</Link>{" "}
          <button className="wish-remove" onClick={logout}>
            Log out
          </button>
        </span>
      </header>
      {devMode && (
        <div className="order-banner" role="alert">
          Development mode: ADMIN_PASSWORD is not set, so the fallback password is in use. Set
          ADMIN_PASSWORD before going live.
        </div>
      )}
      {tab === "dashboard" && <Dashboard />}
      {tab === "products" && <ProductsTab />}
      {tab === "orders" && <OrdersTab />}
      {tab === "collections" && <CollectionsTab />}
      {tab === "messages" && <MessagesTab />}
      {tab === "settings" && <SettingsTab />}
    </div>
  );
}
