"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { categories, taka, type Product } from "@/lib/products";
import { useCollections, useProducts } from "@/lib/storefront";
import { searchAll } from "@/lib/search";

/* Search overlay (Phase 6): instant ranked results with typo tolerance,
   grouped category/collection matches, an honest browse state (derived
   from the live catalog — no invented "trending" terms) and a clear
   no-results state. Enter or "See all results" opens /search?q=. */
export default function SearchOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
  onQuickView?: (p: Product) => void; // kept for Shell compatibility
}) {
  const [q, setQ] = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60);
  }, [open ]);

  const products = useProducts();
  const collections = useCollections();
  const groups = useMemo(() => (q.trim() ? searchAll(q, products, collections) : null), [q, products, collections]);
  const close = () => {
    onClose();
    setQ("");
  };
  const goSearch = () => {
    if (!q.trim()) return;
    close();
    router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <>
      <div className={`overlay${open ? " show" : ""}`} onClick={close} />
      <div className={`searchbar${open ? " show" : ""}`} role="dialog" aria-label="Search products">
        <div className="in">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search products, categories, collections..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && goSearch()}
            autoComplete="off"
            aria-label="Search products"
          />
          <button className="xbtn" onClick={close} aria-label="Close search">
            &times;
          </button>
        </div>

        <div className="sbody">
          {!q.trim() && (
            <div className="sbrowse">
              <span className="flabel">Browse</span>
              <div className="chips">
                {products.some((p) => p.isNew) && (
                  <Link className="schip" href="/products?sort=new" onClick={close}>
                    Latest Drop
                  </Link>
                )}
                {products.some((p) => p.compareAt) && (
                  <Link className="schip" href="/products?sort=discount" onClick={close}>
                    On Sale
                  </Link>
                )}
                {collections.map((c) => (
                  <Link key={c.slug} className="schip" href={`/collections/${c.slug}`} onClick={close}>
                    {c.name}
                  </Link>
                ))}
                {categories
                  .filter((c) => c.slug !== "all")
                  .map((c) => (
                    <Link key={c.slug} className="schip" href={`/products?cat=${c.slug}`} onClick={close}>
                      {c.label}
                    </Link>
                  ))}
              </div>
            </div>
          )}

          {groups && (
            <>
              {(groups.categories.length > 0 || groups.collections.length > 0) && (
                <div className="sgroups">
                  {groups.categories.map((c) => (
                    <Link key={c.slug} className="schip" href={`/products?cat=${c.slug}`} onClick={close}>
                      {c.label} · {c.count}
                    </Link>
                  ))}
                  {groups.collections.map((c) => (
                    <Link key={c.slug} className="schip" href={`/collections/${c.slug}`} onClick={close}>
                      {c.name} · {c.count}
                    </Link>
                  ))}
                </div>
              )}
              {groups.products.length === 0 ? (
                <div className="snone">
                  <p>
                    No matches for “{q.trim()}”. Check the spelling, or try a category:
                  </p>
                  <div className="chips" style={{ marginTop: 10 }}>
                    {categories
                      .filter((c) => c.slug !== "all")
                      .map((c) => (
                        <Link key={c.slug} className="schip" href={`/products?cat=${c.slug}`} onClick={close}>
                          {c.label}
                        </Link>
                      ))}
                    <Link className="schip" href="/products" onClick={close}>
                      Shop All
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  <div className="sr-rows">
                    {groups.products.slice(0, 6).map((p) => (
                      <Link key={p.id} className="sr-row" href={`/products/${p.id}`} onClick={close}>
                        <span className="sr-img">
                          <Image src={p.images[0]} alt="" width={64} height={84} />
                        </span>
                        <span className="sr-info">
                          <b>{p.name}</b>
                          <span>
                            {taka(p.price)}
                            {p.compareAt && <s> {taka(p.compareAt)}</s>}
                            {p.soldOut && <em> · Sold out</em>}
                          </span>
                        </span>
                      </Link>
                    ))}
                  </div>
                  <button className="sall" onClick={goSearch}>
                    See all {groups.products.length} result{groups.products.length === 1 ? "" : "s"} for
                    “{q.trim()}” &rarr;
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
