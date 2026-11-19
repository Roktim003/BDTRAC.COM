"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";
import EditorialImage from "./EditorialImage";
import { getEditorialProduct } from "@/lib/editorial-catalog";

/**
 * EditorialHero (Part 3) — full-viewport campaign hero for
 * DROP 04 // CONCRETE & MONSOON. Three switchable frames, a drop
 * manifesto strip, and a direct shop CTA. All copy is original TRAC copy.
 */

interface Frame {
  index: string;
  slug: string;
  kicker: string;
  line: string;
}

const FRAMES: Frame[] = [
  {
    index: "01",
    slug: "kalboishakhi-monsoon-shell-jacket",
    kicker: "FRAME 01 — MONSOON ARMOUR",
    line: "Built for the hour the sky breaks over Dhaka.",
  },
  {
    index: "02",
    slug: "rickshaw-line-boxy-hoodie",
    kicker: "FRAME 02 — CONCRETE WEIGHT",
    line: "480 GSM. Cut boxy. Worn like a wall you carry.",
  },
  {
    index: "03",
    slug: "obsidian-heavyweight-tee",
    kicker: "FRAME 03 — STUDIO STANDARD",
    line: "The heavyweight tee, rebuilt to a studio spec.",
  },
];

const MANIFESTO = [
  "HEAVY FABRIC ONLY — 320 GSM AND UP",
  "CUT IN DHAKA, WORN IN THE RAIN",
  "NO LOGOS LOUDER THAN THE CLOTH",
  "CONCRETE GREY / MONSOON BLACK / ONE CRIMSON",
];

export default function EditorialHero() {
  const [active, setActive] = useState(0);
  const frame = FRAMES[active];
  const product = getEditorialProduct(frame.slug);

  const step = (dir: 1 | -1) =>
    setActive((a) => (a + dir + FRAMES.length) % FRAMES.length);

  return (
    <section className="sf-hero" aria-label="Drop 04 campaign">
      <div className="sf-hero-media">
        {product ? (
          <EditorialImage
            key={frame.slug}
            src={product.images[0]}
            alt={product.title}
            title={product.title}
            spec={`${product.gsmWeight} GSM — ${product.fabricComposition}`}
            tone={active}
            sizes="100vw"
            priority
            className="sf-hero-frame"
          />
        ) : null}
        <div className="sf-hero-scrim" aria-hidden="true" />
      </div>

      <div className="sf-hero-copy">
        <p className="font-spec sf-hero-kicker">{frame.kicker}</p>
        <h1 className="sf-hero-title">
          DROP 04
          <span className="sf-hero-title-sub">// CONCRETE &amp; MONSOON</span>
        </h1>
        <p className="sf-hero-line">{frame.line}</p>
        <div className="sf-hero-ctas">
          <Link href="#grid" className="sf-btn sf-btn-accent">
            Shop the Drop <ArrowDown size={16} />
          </Link>
          <Link href="#lookbook" className="sf-btn sf-btn-ghost">
            Dhaka Studio Lookbook
          </Link>
        </div>
      </div>

      <div className="sf-hero-switcher">
        <button type="button" className="sf-nav-icon" aria-label="Previous frame" onClick={() => step(-1)}>
          <ArrowLeft size={18} />
        </button>
        <div className="sf-hero-dots" role="tablist" aria-label="Campaign frames">
          {FRAMES.map((f, i) => (
            <button
              key={f.index}
              type="button"
              role="tab"
              aria-selected={i === active}
              className={`sf-hero-dot font-spec ${i === active ? "is-active" : ""}`}
              onClick={() => setActive(i)}
            >
              {f.index}
            </button>
          ))}
        </div>
        <button type="button" className="sf-nav-icon" aria-label="Next frame" onClick={() => step(1)}>
          <ArrowRight size={18} />
        </button>
      </div>

      <div className="sf-manifesto" aria-label="Drop manifesto">
        {MANIFESTO.map((m) => (
          <span key={m} className="font-spec sf-manifesto-item">
            {m}
          </span>
        ))}
      </div>
    </section>
  );
}
