"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { useBagCount } from "@/store/bag-store";
import { useUiStore } from "@/store/ui-store";
import { EDITORIAL_PRODUCTS } from "@/lib/editorial-catalog";
import { formatBDT } from "@/lib/bd-utils";

/**
 * Navbar (Part 3) — minimal sticky editorial header.
 * TRAC monogram wordmark, collection links, search toggle (searches the
 * editorial catalog, results route to /product/[slug]) and a live bag
 * counter driven by the editorial bag store.
 */

const LINKS = [
  { label: "Drop 04", href: "/drop-04" },
  { label: "The Grid", href: "/drop-04#grid" },
  { label: "Lookbook", href: "/drop-04#lookbook" },
  { label: "Shop All TRAC", href: "/products" },
];

export default function Navbar() {
  const count = useBagCount();
  const overlay = useUiStore((s) => s.overlay);
  const toggleOverlay = useUiStore((s) => s.toggleOverlay);
  const closeOverlay = useUiStore((s) => s.closeOverlay);
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return EDITORIAL_PRODUCTS.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.categoryLabel.toLowerCase().includes(q) ||
        p.fabricComposition.toLowerCase().includes(q),
    ).slice(0, 5);
  }, [query]);

  const searchOpen = overlay === "search";
  const menuOpen = overlay === "menu";

  return (
    <header className="sf-nav">
      <div className="sf-nav-row">
        <button
          type="button"
          className="sf-nav-icon sf-nav-menu-btn"
          aria-label="Toggle menu"
          onClick={() => toggleOverlay("menu")}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <nav className="sf-nav-links" aria-label="Collections">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="sf-nav-link">
              {l.label}
            </Link>
          ))}
        </nav>

        <Link href="/drop-04" className="sf-wordmark" aria-label="TRAC home">
          <span className="sf-monogram font-spec">T.</span>
          <span className="sf-wordmark-text">TRAC</span>
        </Link>

        <div className="sf-nav-actions">
          <button
            type="button"
            className="sf-nav-icon"
            aria-label="Toggle search"
            aria-expanded={searchOpen}
            onClick={() => toggleOverlay("search")}
          >
            {searchOpen ? <X size={20} /> : <Search size={20} />}
          </button>
          <Link href="/drop-04#grid" className="sf-nav-bag" aria-label={`Bag, ${count} items`}>
            <ShoppingBag size={20} />
            <span className="sf-nav-bag-count font-spec">{count}</span>
          </Link>
        </div>
      </div>

      {menuOpen ? (
        <nav className="sf-nav-mobile-links" aria-label="Collections mobile">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="sf-nav-mobile-link" onClick={closeOverlay}>
              {l.label}
            </Link>
          ))}
        </nav>
      ) : null}

      {searchOpen ? (
        <div className="sf-nav-search">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tees, hoodies, GSM…"
            className="sf-nav-search-input"
            aria-label="Search the editorial catalog"
          />
          {query.trim() ? (
            <ul className="sf-nav-search-results">
              {results.length === 0 ? (
                <li className="sf-nav-search-empty font-spec">NO MATCHES IN DROP 04</li>
              ) : (
                results.map((p) => (
                  <li key={p.slug}>
                    <Link
                      href={`/product/${p.slug}`}
                      className="sf-nav-search-row"
                      onClick={closeOverlay}
                    >
                      <span>{p.title}</span>
                      <span className="font-spec">
                        {p.gsmWeight} GSM — {formatBDT(p.basePriceBdt)}
                      </span>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
