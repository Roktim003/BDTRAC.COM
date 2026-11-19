"use client";

import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import { useQuickView } from "@/components/Shell";
import { useRecent } from "@/lib/recent";
import { useProducts } from "@/lib/storefront";

/* Recently Viewed row (§6.5) — renders nothing until the visitor has
   actually viewed products on this device. */
export default function RecentRow({ excludeId }: { excludeId?: string }) {
  const products = useProducts();
  const items = useRecent(products, excludeId);
  const quickView = useQuickView();
  if (items.length === 0) return null;
  return (
    <section className="block">
      <Reveal>
        <div className="sechead">
          <h2>Recently Viewed</h2>
          <Link className="more" href="/products">
            Shop all &rarr;
          </Link>
        </div>
      </Reveal>
      <div className="grid4">
        {items.slice(0, 4).map((p, i) => (
          <Reveal key={p.id} delay={(i % 4) as 0 | 1 | 2 | 3}>
            <ProductCard product={p} onQuickView={quickView} index={i} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
