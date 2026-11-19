"use client";

import { useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import { EmptyState } from "@/components/ui";
import { useQuickView } from "@/components/Shell";
import type { Product } from "@/lib/products";

type Sort = "featured" | "new" | "low" | "high";

/* Collection product grid with sorting + availability filter (§4.5).
   Category/colour/size filters live on /products; collections stay focused. */
export default function CollectionGrid({ items }: { items: Product[] }) {
  const quickView = useQuickView();
  const [sort, setSort] = useState<Sort>("featured");
  const [inStock, setInStock] = useState(false);

  const list = useMemo(() => {
    let l = inStock ? items.filter((p) => !p.soldOut) : [...items];
    switch (sort) {
      case "new":
        l.sort((a, b) => Number(b.isNew ?? false) - Number(a.isNew ?? false));
        break;
      case "low":
        l.sort((a, b) => a.price - b.price);
        break;
      case "high":
        l.sort((a, b) => b.price - a.price);
        break;
    }
    return l;
  }, [items, sort, inStock]);

  return (
    <>
      <div className="shop-tools">
        <div className="chips">
          <button className={inStock ? "on" : ""} onClick={() => setInStock((v) => !v)} aria-pressed={inStock}>
            In stock only
          </button>
        </div>
        <select className="sortsel" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort products">
          <option value="featured">Featured</option>
          <option value="new">Newest</option>
          <option value="low">Price: Low to High</option>
          <option value="high">Price: High to Low</option>
        </select>
      </div>
      <p className="coll-count">
        {list.length} {list.length === 1 ? "product" : "products"}
      </p>
      {list.length === 0 ? (
        <div style={{ paddingBottom: 80, maxWidth: 560 }}>
          <EmptyState title="Nothing in stock right now" text="Everything in this collection is currently sold out — check back soon." />
        </div>
      ) : (
        <div className="grid4" style={{ paddingBottom: 80 }}>
          {list.map((p, i) => (
            <Reveal key={p.id} delay={(i % 4) as 0 | 1 | 2 | 3}>
              <ProductCard product={p} onQuickView={quickView} index={i} />
            </Reveal>
          ))}
        </div>
      )}
    </>
  );
}
