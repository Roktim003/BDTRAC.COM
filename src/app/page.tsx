"use client";

import Link from "next/link";
import Hero from "@/components/Hero";
import Coverflow from "@/components/Coverflow";
import ProductCard from "@/components/ProductCard";
import EditorialBanner from "@/components/EditorialBanner";
import HomeCategories from "@/components/HomeCategories";
import BrandStory from "@/components/BrandStory";
import Stores from "@/components/Stores";
import RecentRow from "@/components/RecentRow";
import Reveal from "@/components/Reveal";
import { useQuickView } from "@/components/Shell";

import type { HomeSectionId } from "@/lib/homepage";
import { useProducts, useSettings } from "@/lib/storefront";

/* Phase 3 homepage — campaign-driven storefront. Section order and
   visibility come from lib/homepage (the Phase 9 CMS data layer). */
export default function Home() {
  const quickView = useQuickView();
  const products = useProducts();
  const settings = useSettings();

  const latest = [...products]
    .sort((a, b) => Number(b.isNew ?? false) - Number(a.isNew ?? false))
    .slice(0, 6);

  const featured = settings.featuredProductIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p)
    .slice(0, 4);

  const sections: Record<HomeSectionId, React.ReactNode> = {
    latest: (
      <section className="cf-section" id="latest" key="latest">
        <div className="wrap">
          <Reveal>
            <div className="sechead">
              <h2>Latest Drop</h2>
              <Link className="more" href="/products?sort=new">
                View all &rarr;
              </Link>
            </div>
          </Reveal>
        </div>
        <Reveal>
          <Coverflow products={latest} />
        </Reveal>
      </section>
    ),
    editorial: <EditorialBanner key="editorial" />,
    categories: <HomeCategories key="categories" />,
    featured: (
      <section className="block" key="featured">
        <div className="wrap">
          <Reveal>
            <div className="sechead">
              <h2>Featured Products</h2>
              <Link className="more" href="/products">
                View all &rarr;
              </Link>
            </div>
          </Reveal>
          <div className="grid4">
            {featured.map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) as 0 | 1 | 2 | 3}>
                <ProductCard product={p} onQuickView={quickView} index={i} />
              </Reveal>
            ))}
          </div>
          <Reveal className="center">
            <Link className="btn black" href="/products" style={{ marginTop: 34 }}>
              Shop All Products
            </Link>
          </Reveal>
        </div>
      </section>
    ),
    story: <BrandStory key="story" />,
    stores: <Stores key="stores" />,
    recent: (
      <div className="wrap" key="recent">
        <RecentRow />
      </div>
    ),
  };

  return (
    <>
      <Hero />
      {settings.sections
        .filter((s) => s.enabled)
        .map((s) => sections[s.id])}
    </>
  );
}
