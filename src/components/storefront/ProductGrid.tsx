"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import EditorialImage from "./EditorialImage";
import { useUiStore } from "@/store/ui-store";
import {
  EDITORIAL_CATEGORIES,
  EDITORIAL_PRODUCTS,
  getEditorialProduct,
  type EditorialCategory,
  type EditorialProduct,
} from "@/lib/editorial-catalog";
import { formatBDT } from "@/lib/bd-utils";

/**
 * ProductGrid (Part 3) — minimal category filter bar, lookbook grid with
 * hover alternate-angle swap, monospace GSM/price metadata, and the
 * 3-frame Dhaka Studio Lookbook. Cards open the ProductDrawer; each card
 * also links to its full /product/[slug] page.
 */

function ProductCard({ product, tone }: { product: EditorialProduct; tone: number }) {
  const openDrawer = useUiStore((s) => s.openDrawer);
  return (
    <article className="sf-card">
      <button
        type="button"
        className="sf-card-media"
        onClick={() => openDrawer(product.slug)}
        aria-label={`Quick view ${product.title}`}
      >
        <EditorialImage
          src={product.images[0]}
          alt={product.title}
          title={product.title}
          spec={`${product.gsmWeight} GSM`}
          tone={tone}
          className="sf-card-img sf-card-img-a"
        />
        <EditorialImage
          src={product.images[1]}
          alt={`${product.title} alternate angle`}
          title={product.title}
          spec="ALT ANGLE"
          tone={tone + 1}
          className="sf-card-img sf-card-img-b"
        />
        {product.dropTag ? (
          <span className="font-spec sf-card-tag">{product.dropTag}</span>
        ) : null}
        <span className="font-spec sf-card-quick">QUICK VIEW +</span>
      </button>
      <div className="sf-card-meta">
        <Link href={`/product/${product.slug}`} className="sf-card-title">
          {product.title}
        </Link>
        <p className="font-spec sf-card-spec">
          {product.gsmWeight} GSM — {product.skuPrefix} — {product.fitLabel.toUpperCase()} FIT
        </p>
        <p className="font-spec sf-card-price">{formatBDT(product.basePriceBdt)}</p>
      </div>
    </article>
  );
}

const LOOKBOOK: { slug: string; frame: string; caption: string }[] = [
  {
    slug: "old-town-cargo-trouser",
    frame: "STUDIO 01",
    caption: "Cargo, shot flat against raw concrete. Old Town light, no retouch.",
  },
  {
    slug: "kalboishakhi-monsoon-shell-jacket",
    frame: "STUDIO 02",
    caption: "Shell jacket under studio rain rig. Taped seams, tested wet.",
  },
  {
    slug: "buriganga-fog-boxy-hoodie",
    frame: "STUDIO 03",
    caption: "Fog Grey fleece at dawn settings — the river at 6 AM, bottled.",
  },
];

export default function ProductGrid() {
  const [filter, setFilter] = useState<EditorialCategory | "ALL">("ALL");
  const openDrawer = useUiStore((s) => s.openDrawer);

  const visible = useMemo(
    () =>
      filter === "ALL"
        ? EDITORIAL_PRODUCTS
        : EDITORIAL_PRODUCTS.filter((p) => p.category === filter),
    [filter],
  );

  return (
    <>
      <section id="grid" className="sf-grid-section" aria-label="Drop 04 products">
        <div className="sf-section-head">
          <h2 className="sf-section-title">The Grid</h2>
          <p className="font-spec sf-section-note">DROP 04 — {visible.length} STYLES</p>
        </div>

        <div className="sf-filter-bar" role="tablist" aria-label="Filter by category">
          {EDITORIAL_CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              role="tab"
              aria-selected={filter === c.value}
              className={`sf-filter-chip ${filter === c.value ? "is-active" : ""}`}
              onClick={() => setFilter(c.value)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="sf-grid">
          {visible.map((p, i) => (
            <ProductCard key={p.slug} product={p} tone={i} />
          ))}
        </div>
      </section>

      <section id="lookbook" className="sf-lookbook" aria-label="Dhaka Studio Lookbook">
        <div className="sf-section-head">
          <h2 className="sf-section-title">Dhaka Studio Lookbook</h2>
          <p className="font-spec sf-section-note">SHOT IN-STUDIO — DHAKA, BANGLADESH</p>
        </div>
        <div className="sf-lookbook-grid">
          {LOOKBOOK.map((shot, i) => {
            const product = getEditorialProduct(shot.slug);
            if (!product) return null;
            return (
              <figure key={shot.frame} className="sf-look-frame">
                <button
                  type="button"
                  className="sf-look-media"
                  onClick={() => openDrawer(product.slug)}
                  aria-label={`Open ${product.title}`}
                >
                  <EditorialImage
                    src={product.images[i % product.images.length]}
                    alt={product.title}
                    title={product.title}
                    spec={shot.frame}
                    tone={i + 1}
                  />
                </button>
                <figcaption className="sf-look-caption">
                  <span className="font-spec sf-look-frame-label">{shot.frame}</span>
                  <span>{shot.caption}</span>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </section>
    </>
  );
}
