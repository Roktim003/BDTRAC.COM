"use client";

import { useState } from "react";
import { products, taka } from "@/lib/products";
import {
  Accordion,
  Badge,
  Breadcrumbs,
  Button,
  CollectionCard,
  Drawer,
  EmptyState,
  ErrorState,
  Field,
  Gallery,
  IconButton,
  Input,
  Modal,
  Pagination,
  ProductCardUI,
  Select,
  Skeleton,
  Tabs,
  ToastProvider,
  useToast,
} from "./index";

const SWATCHES: [string, string][] = [
  ["Background — Off-white", "#F6F5F1"],
  ["Surface — White", "#FFFFFF"],
  ["Ink — Near-black", "#111111"],
  ["Accent — Racing red", "#D62B2B"],
  ["Neutral — Gray", "#A3A3A3"],
  ["Muted text", "#6F6F6A"],
  ["Success", "#1E7D46"],
  ["Error", "#B3261E"],
];

function Inner() {
  const toast = useToast();
  const [modal, setModal] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [page, setPage] = useState(2);
  const [wished, setWished] = useState(false);
  const [phone, setPhone] = useState("");
  const p = products[0];
  const phoneErr = phone.length > 0 && !/^01[3-9]\d{8}$/.test(phone) ? "Enter a valid BD number, e.g. 01712345678." : undefined;

  return (
    <div className="ds">
      <p className="eyebrow" style={{ color: "var(--color-accent)" }}>
        TRAC · Phase 1
      </p>
      <h1>Design System</h1>
      <p className="ds-note" style={{ marginTop: 10 }}>
        Foundation for the premium rebuild — tokens in <code>app/tokens.css</code>, components in{" "}
        <code>components/ui/</code>. Every element on this page is a live component, not a mockup.
      </p>

      <section className="ds-sec">
        <h2>Colour Tokens</h2>
        <div className="ds-grid">
          {SWATCHES.map(([name, hex]) => (
            <div className="ds-swatch" key={hex}>
              <i style={{ background: hex }} />
              <p>
                <b>{name}</b>
                <br />
                {hex}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="ds-sec">
        <h2>Typography</h2>
        <p style={{ fontSize: "var(--text-display)", fontWeight: 900, fontFamily: "var(--font-display)", textTransform: "uppercase", lineHeight: 1.02 }}>
          Built for the Bold
        </p>
        <p style={{ fontSize: "var(--text-h2)", fontWeight: 800, fontFamily: "var(--font-display)", marginTop: 10 }}>
          Section headline — Archivo 800
        </p>
        <p className="ds-note" style={{ marginTop: 8 }}>
          Body copy — Inter. Readable at every size, quiet under the photography. Prices, labels and navigation all
          have dedicated tokens so the hierarchy never drifts between pages.
        </p>
      </section>

      <section className="ds-sec">
        <h2>Buttons & Badges</h2>
        <div className="ds-row">
          <Button onClick={() => toast("Primary action")}>Primary</Button>
          <Button variant="dark">Dark</Button>
          <Button variant="light">Light</Button>
          <Button variant="primary" size="sm">
            Small
          </Button>
          <Button variant="dark" disabled>
            Disabled
          </Button>
          <IconButton label="Search (demo)">⌕</IconButton>
        </div>
        <div className="ds-row" style={{ marginTop: 14 }}>
          <Badge>New In</Badge>
          <Badge tone="red">−22%</Badge>
          <Badge tone="light">Sold Out</Badge>
          <Badge tone="success">In Stock</Badge>
        </div>
      </section>

      <section className="ds-sec">
        <h2>Form Fields</h2>
        <div style={{ maxWidth: 420 }}>
          <Field label="Phone (BD)" id="ds-phone" error={phoneErr} hint="Used for order confirmation.">
            <Input id="ds-phone" placeholder="01XXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} error={!!phoneErr} inputMode="tel" />
          </Field>
          <Field label="District" id="ds-district">
            <Select id="ds-district" defaultValue="dhaka">
              <option value="dhaka">Dhaka</option>
              <option value="ctg">Chattogram</option>
              <option value="other">Other district</option>
            </Select>
          </Field>
        </div>
      </section>

      <section className="ds-sec">
        <h2>Product & Collection Cards</h2>
        <div className="ds-grid">
          <ProductCardUI
            name={p.name}
            categoryLabel="T-Shirts · Racing Series"
            priceLabel={taka(p.price)}
            compareLabel={p.compareAt ? taka(p.compareAt) : undefined}
            discountPct={p.compareAt ? Math.round((1 - p.price / p.compareAt) * 100) : undefined}
            isNew={p.isNew}
            colors={["#111", "#D62B2B", "#fff"]}
            image={p.images[0]}
            altImage={p.images[1]}
            href={`/products/${p.id}`}
            wished={wished}
            onToggleWish={() => setWished((w) => !w)}
            onQuickAdd={() => toast("Quick Add — wired to the cart in Phase 4/7")}
          />
          <CollectionCard
            name="Racing Series"
            blurb="Track-born graphics, heavyweight cotton."
            image={p.images[1]}
            href="/products"
          />
        </div>
      </section>

      <section className="ds-sec">
        <h2>Gallery</h2>
        <div style={{ maxWidth: 430 }}>
          <Gallery images={p.images} alt={p.name} />
        </div>
        <p className="ds-note">Tip: focus the gallery and use ← → arrow keys.</p>
      </section>

      <section className="ds-sec">
        <h2>Accordion & Tabs</h2>
        <div style={{ maxWidth: 560 }}>
          <Accordion
            items={[
              { title: "Fabric & Care", content: <p>{p.fabric}</p> },
              { title: "Shipping", content: <p>Demo copy — approved policy text lands in Phase 10.</p> },
            ]}
          />
        </div>
        <div style={{ maxWidth: 560, marginTop: 24 }}>
          <Tabs
            tabs={[
              { id: "d", label: "Description", content: <p>{p.description}</p> },
              { id: "f", label: "Fit", content: <p>Oversized, drop-shoulder fit.</p> },
            ]}
          />
        </div>
      </section>

      <section className="ds-sec">
        <h2>Overlays & Toast</h2>
        <div className="ds-row">
          <Button variant="dark" onClick={() => setModal(true)}>
            Open Modal
          </Button>
          <Button variant="light" onClick={() => setDrawer(true)}>
            Open Drawer
          </Button>
          <Button variant="primary" onClick={() => toast("Saved — toast notification demo")}>
            Show Toast
          </Button>
        </div>
        <Modal open={modal} onClose={() => setModal(false)} title="Modal Dialog">
          <p style={{ lineHeight: 1.65 }}>
            Accessible dialog: Escape closes, focus moves in on open and back on close, scrim click dismisses.
          </p>
          <div className="ds-row" style={{ marginTop: 16 }}>
            <Button size="sm" onClick={() => setModal(false)}>
              Got it
            </Button>
          </div>
        </Modal>
        <Drawer open={drawer} onClose={() => setDrawer(false)} title="Drawer" footer={<Button style={{ width: "100%" }} onClick={() => setDrawer(false)}>Close Drawer</Button>}>
          <p style={{ lineHeight: 1.65 }}>The cart and mobile menu in later phases are built on this drawer pattern.</p>
        </Drawer>
      </section>

      <section className="ds-sec">
        <h2>Breadcrumbs & Pagination</h2>
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Shop", href: "/products" }, { label: p.name }]} />
        <div style={{ marginTop: 16 }}>
          <Pagination page={page} totalPages={5} onPage={setPage} />
        </div>
      </section>

      <section className="ds-sec">
        <h2>Empty, Error & Loading States</h2>
        <div className="ds-grid">
          <EmptyState title="Your bag is empty" text="Nothing saved yet — start with the Latest Drop." action={<Button size="sm" variant="dark">Shop Now</Button>} />
          <ErrorState text="We could not load this section." onRetry={() => toast("Retry — demo only")} />
          <Skeleton card />
        </div>
      </section>
    </div>
  );
}

export default function Showcase() {
  return (
    <ToastProvider>
      <Inner />
    </ToastProvider>
  );
}
