"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, Ruler, X } from "lucide-react";
import EditorialImage from "./EditorialImage";
import { useUiStore } from "@/store/ui-store";
import { useCartStore } from "@/store/useCartStore";
import {
  getEditorialProduct,
  stockBySize,
  type EditorialProduct,
} from "@/lib/editorial-catalog";
import {
  FREE_SHIPPING_THRESHOLD_BDT,
  SHIPPING_FEE_INSIDE_DHAKA_BDT,
  SHIPPING_FEE_OUTSIDE_DHAKA_BDT,
  formatBDT,
} from "@/lib/bd-utils";
import type { ApparelSize } from "@/types";

/**
 * ProductDrawer + product detail view (Part 3).
 *
 * One detail implementation, two hosts: the quick-view drawer (opened
 * from the grid/lookbook via the UI store) and the full /product/[slug]
 * page (`ProductDetailView`). Includes the gallery switcher, live studio
 * stock per size, the IN/CM size guide for boxy/oversized cuts, the
 * fabric/care accordion, and the sticky mobile Add to Bag bar.
 */

/* ——— Size guide: TRAC boxy / oversized studio spec, inches are the
   source of truth; centimetres are computed (in × 2.54). Studio
   reference for the boxy/oversized block — confirm against the final
   pattern before bulk production. ——— */
const SIZE_GUIDE_IN: Record<
  ApparelSize,
  { chest: number; length: number; shoulder: number; sleeve: number }
> = {
  S: { chest: 42, length: 26.5, shoulder: 20, sleeve: 9 },
  M: { chest: 44, length: 27.5, shoulder: 21, sleeve: 9.5 },
  L: { chest: 46, length: 28.5, shoulder: 22, sleeve: 10 },
  XL: { chest: 48, length: 29.5, shoulder: 23, sleeve: 10.5 },
  XXL: { chest: 50, length: 30.5, shoulder: 24, sleeve: 11 },
};

export function SizeGuide() {
  const [unit, setUnit] = useState<"IN" | "CM">("IN");
  const conv = (inches: number) =>
    unit === "IN" ? `${inches}` : `${(inches * 2.54).toFixed(1)}`;
  return (
    <div className="sf-guide">
      <div className="sf-guide-head">
        <span className="sf-guide-title">
          <Ruler size={15} /> Size Guide — Boxy / Oversized
        </span>
        <div className="sf-guide-units" role="group" aria-label="Measurement unit">
          {(["IN", "CM"] as const).map((u) => (
            <button
              key={u}
              type="button"
              className={`font-spec sf-guide-unit ${unit === u ? "is-active" : ""}`}
              aria-pressed={unit === u}
              onClick={() => setUnit(u)}
            >
              {u}
            </button>
          ))}
        </div>
      </div>
      <table className="sf-guide-table">
        <thead>
          <tr className="font-spec">
            <th>SIZE</th>
            <th>CHEST</th>
            <th>LENGTH</th>
            <th>SHOULDER</th>
            <th>SLEEVE</th>
          </tr>
        </thead>
        <tbody className="font-spec">
          {(Object.keys(SIZE_GUIDE_IN) as ApparelSize[]).map((size) => {
            const m = SIZE_GUIDE_IN[size];
            return (
              <tr key={size}>
                <td>{size}</td>
                <td>{conv(m.chest)}</td>
                <td>{conv(m.length)}</td>
                <td>{conv(m.shoulder)}</td>
                <td>{conv(m.sleeve)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="sf-guide-note">
        Dropped shoulder, wide body — size down for a regular fit. Studio
        reference for TRAC boxy/oversized cuts; measured flat, in{" "}
        {unit === "IN" ? "inches" : "centimetres"}.
      </p>
    </div>
  );
}

function Accordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="sf-acc">
      <button
        type="button"
        className="sf-acc-head"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{title}</span>
        <ChevronDown size={16} className={open ? "sf-acc-chev is-open" : "sf-acc-chev"} />
      </button>
      {open ? <div className="sf-acc-body">{children}</div> : null}
    </div>
  );
}

export function ProductDetailView({ product }: { product: EditorialProduct }) {
  const addItem = useCartStore((s) => s.addItem);
  const [color, setColor] = useState(product.colors[0].name);
  const [size, setSize] = useState<ApparelSize>("M");
  const [imageIndex, setImageIndex] = useState(0);
  const [guideOpen, setGuideOpen] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setColor(product.colors[0].name);
    setSize("M");
    setImageIndex(0);
    setAdded(false);
  }, [product]);

  const stock = useMemo(() => stockBySize(product, color), [product, color]);
  const selected = stock.find((s) => s.size === size);
  const variant = product.variants.find(
    (v) => v.color === color && v.size === size,
  );

  const addToBag = () => {
    if (!variant) return;
    addItem({
      slug: product.slug,
      title: product.title,
      sku: variant.sku,
      size,
      color,
      unitPriceBdt: product.basePriceBdt,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="sf-detail">
      <div className="sf-detail-gallery">
        <EditorialImage
          src={product.images[imageIndex]}
          alt={product.title}
          title={product.title}
          spec={`${product.gsmWeight} GSM — ANGLE ${imageIndex + 1}`}
          tone={imageIndex}
          className="sf-detail-main"
        />
        <div className="sf-detail-thumbs">
          {product.images.map((img, i) => (
            <button
              key={img}
              type="button"
              className={`sf-detail-thumb ${i === imageIndex ? "is-active" : ""}`}
              aria-label={`View angle ${i + 1}`}
              aria-pressed={i === imageIndex}
              onClick={() => setImageIndex(i)}
            >
              <EditorialImage
                src={img}
                alt=""
                title={product.title}
                spec={`0${i + 1}`}
                tone={i}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="sf-detail-info">
        <p className="font-spec sf-detail-kicker">
          {product.categoryLabel.toUpperCase()}
          {product.dropTag ? ` — ${product.dropTag}` : ""}
        </p>
        <h2 className="sf-detail-title">{product.title}</h2>
        <p className="font-spec sf-detail-price">{formatBDT(product.basePriceBdt)}</p>
        <p className="font-spec sf-detail-spec">
          {product.gsmWeight} GSM — {product.skuPrefix} — {product.fitLabel.toUpperCase()} FIT
        </p>

        <div className="sf-field">
          <span className="font-spec sf-field-label">COLOUR — {color.toUpperCase()}</span>
          <div className="sf-swatches">
            {product.colors.map((c) => (
              <button
                key={c.name}
                type="button"
                className={`sf-swatch ${c.name === color ? "is-active" : ""}`}
                style={{ background: c.hex }}
                aria-label={`Colour ${c.name}`}
                aria-pressed={c.name === color}
                onClick={() => setColor(c.name)}
              />
            ))}
          </div>
        </div>

        <div className="sf-field">
          <span className="font-spec sf-field-label">
            SIZE — {size}
            {selected ? ` — ${selected.stockCount} IN STUDIO` : ""}
          </span>
          <div className="sf-sizes">
            {stock.map((s) => (
              <button
                key={s.size}
                type="button"
                className={`sf-size font-spec ${s.size === size ? "is-active" : ""}`}
                aria-pressed={s.size === size}
                onClick={() => setSize(s.size)}
              >
                {s.size}
              </button>
            ))}
          </div>
          <p className="font-spec sf-stock-strip" aria-label="Studio stock by size">
            STUDIO STOCK:{" "}
            {stock.map((s) => `${s.size} ${s.stockCount}`).join(" · ")}
          </p>
          <button
            type="button"
            className="sf-guide-toggle"
            aria-expanded={guideOpen}
            onClick={() => setGuideOpen((o) => !o)}
          >
            <Ruler size={14} /> Size guide (IN / CM)
          </button>
          {guideOpen ? <SizeGuide /> : null}
        </div>

        <button type="button" className="sf-btn sf-btn-accent sf-add" onClick={addToBag}>
          {added ? (
            <>
              <Check size={16} /> Added to Bag
            </>
          ) : (
            "Add to Bag"
          )}
        </button>

        <div className="sf-accordions">
          <Accordion title="Fabric & GSM" defaultOpen>
            <p>
              {product.fabricComposition}. {product.gsmWeight} GSM — woven and
              finished for the TRAC heavyweight block, {product.fitLabel.toLowerCase()} fit.
            </p>
          </Accordion>
          <Accordion title="Care">
            <p>{product.care}</p>
          </Accordion>
          <Accordion title="Shipping & Returns">
            <p>
              Inside Dhaka {formatBDT(SHIPPING_FEE_INSIDE_DHAKA_BDT)} · Outside Dhaka{" "}
              {formatBDT(SHIPPING_FEE_OUTSIDE_DHAKA_BDT)} · Free over{" "}
              {formatBDT(FREE_SHIPPING_THRESHOLD_BDT)}. Cash on delivery across
              Bangladesh. Size exchange within 7 days, unworn with tags.
            </p>
          </Accordion>
        </div>

        <Link href="/drop-04#grid" className="sf-detail-back font-spec">
          ← BACK TO THE GRID
        </Link>
      </div>

      <div className="sf-sticky-bar">
        <div className="sf-sticky-info">
          <span className="sf-sticky-title">{product.title}</span>
          <span className="font-spec sf-sticky-price">
            {formatBDT(product.basePriceBdt)} — {size} / {color}
          </span>
        </div>
        <button type="button" className="sf-btn sf-btn-accent" onClick={addToBag}>
          {added ? "Added ✓" : "Add to Bag"}
        </button>
      </div>
    </div>
  );
}

/** Quick-view drawer host — reads the target slug from the UI store. */
export default function ProductDrawer() {
  const drawerSlug = useUiStore((s) => s.drawerSlug);
  const closeDrawer = useUiStore((s) => s.closeDrawer);
  const product = drawerSlug ? getEditorialProduct(drawerSlug) : undefined;

  useEffect(() => {
    if (!drawerSlug) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerSlug, closeDrawer]);

  if (!product) return null;

  return (
    <div className="sf-drawer-root" role="dialog" aria-modal="true" aria-label={product.title}>
      <button
        type="button"
        className="sf-drawer-backdrop"
        aria-label="Close quick view"
        onClick={closeDrawer}
      />
      <div className="sf-drawer-panel">
        <button
          type="button"
          className="sf-drawer-close"
          aria-label="Close quick view"
          onClick={closeDrawer}
        >
          <X size={20} />
        </button>
        <ProductDetailView product={product} />
        <p className="sf-drawer-page-link">
          <Link href={`/product/${product.slug}`} onClick={closeDrawer}>
            Open full product page →
          </Link>
        </p>
      </div>
    </div>
  );
}
