"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import RecentRow from "@/components/RecentRow";
import { EmptyState } from "@/components/ui";
import { useQuickView } from "@/components/Shell";
import { categories } from "@/lib/products";
import { useCollections, useProducts } from "@/lib/storefront";
import { searchProducts } from "@/lib/search";

type Sort = "relevance" | "new" | "low" | "high";

/* Dedicated search results page (§6.3) — shareable /search?q= URL,
   category filter, sorting and availability on top of the ranked results. */
function SearchResults() {
  const params = useSearchParams();
  const q = params.get("q") || "";
  const quickView = useQuickView();
  const [cat, setCat] = useState("all");
  const [sort, setSort] = useState<Sort>("relevance");
  const [inStock, setInStock] = useState(false);

  const products = useProducts();
  const collections = useCollections();
  const base = useMemo(() => searchProducts(q, products, collections), [q, products, collections]);
  const list = useMemo(() => {
    let l = base.filter(
      (p) => (cat === "all" || p.category === cat) && (!inStock || !p.soldOut)
    );
    if (sort === "low") l = [...l].sort((a, b) => a.price - b.price);
    if (sort === "high") l = [...l].sort((a, b) => b.price - a.price);
    if (sort === "new")
      l = [...l].sort((a, b) => Number(b.isNew ?? false) - Number(a.isNew ?? false));
    return l;
  }, [base, cat, inStock, sort]);

  const newIn = products.filter((p) => p.isNew);

  return (
    <div className="wrap">
      <div className="shop-head">
        <Reveal>
          <h1>{q ? `Results for “${q}”` : "Search"}</h1>
          <p>
            {q
              ? `${list.length} ${list.length === 1 ? "product" : "products"} found`
              : "Type in the search bar above to search the catalog."}
          </p>
        </Reveal>
      </div>

      {q && list.length > 0 && (
        <div className="shop-tools">
          <div className="chips" role="group" aria-label="Category">
            {categories.map((c) => (
              <button key={c.slug} className={cat === c.slug ? "on" : ""} onClick={() => setCat(c.slug)}>
                {c.label}
              </button>
            ))}
            <button className={inStock ? "on" : ""} onClick={() => setInStock((v) => !v)} aria-pressed={inStock}>
              In stock only
            </button>
          </div>
          <select className="sortsel" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort results">
            <option value="relevance">Most relevant</option>
            <option value="new">Newest</option>
            <option value="low">Price: Low to High</option>
            <option value="high">Price: High to Low</option>
          </select>
        </div>
      )}

      {q && list.length === 0 ? (
        <div style={{ maxWidth: 560, paddingBottom: 20 }}>
          <EmptyState
            title={`No matches for “${q}”`}
            text="Check the spelling, try a single word (try “ferrari” or “hoodie”), or browse a category."
            action={
              <Link className="ui-btn ui-btn-dark ui-btn-md" href="/products">
                Browse Shop All
              </Link>
            }
          />
        </div>
      ) : (
        <div className="grid4" style={{ paddingBottom: 40 }}>
          {list.map((p, i) => (
            <Reveal key={p.id} delay={(i % 4) as 0 | 1 | 2 | 3}>
              <ProductCard product={p} onQuickView={quickView} index={i} />
            </Reveal>
          ))}
        </div>
      )}

      {q && list.length === 0 && newIn.length > 0 && (
        <section className="block" style={{ paddingTop: 10, paddingBottom: 60 }}>
          <Reveal>
            <div className="sechead">
              <h2>New In Instead</h2>
              <Link className="more" href="/products?sort=new">
                View all &rarr;
              </Link>
            </div>
          </Reveal>
          <div className="grid4">
            {newIn.slice(0, 4).map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) as 0 | 1 | 2 | 3}>
                <ProductCard product={p} onQuickView={quickView} index={i} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <RecentRow />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchResults />
    </Suspense>
  );
}
