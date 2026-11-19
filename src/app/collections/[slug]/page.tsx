import type { Metadata } from "next";
import { ensureStores } from "@/lib/ensureStores";
import Image from "next/image";
import { notFound } from "next/navigation";
import CollectionGrid from "@/components/CollectionGrid";
import { Breadcrumbs } from "@/components/ui";
import { getCatalog } from "@/lib/catalogStore";
import { collectionProductsFrom, getCollectionFrom } from "@/lib/products";

/* Phase 13: no generateStaticParams — in DB mode the catalog is runtime
   data, so collection pages render dynamically like product pages. */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  await ensureStores();
  const { slug } = await params;
  const c = getCollectionFrom(getCatalog().collections, slug);
  if (!c) return { title: "Collection — TRAC" };
  return {
    title: `${c.name} — TRAC`,
    description: c.description,
    alternates: { canonical: `/collections/${c.slug}` },
    openGraph: { title: `${c.name} — TRAC`, description: c.description },
  };
}

/* §4.5 Collection landing page — banner, description, grid, sort, filters. */
export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await ensureStores();
  const { slug } = await params;
  const catalog = getCatalog();
  const c = getCollectionFrom(catalog.collections, slug);
  if (!c) notFound();
  const items = collectionProductsFrom(catalog.products, slug);
  const banner = items[0]?.images[1] ?? items[0]?.images[0];

  return (
    <div>
      <div className="coll-hero">
        {banner && <Image src={banner} alt={c.name} fill style={{ objectFit: "cover", opacity: 0.5 }} priority />}
        <div className="coll-hero-in wrap">
          <p className="eyebrow" style={{ color: "#ffb3b3" }}>
            Collection
          </p>
          <h1>{c.name}</h1>
          <p>{c.description}</p>
        </div>
      </div>
      <div className="wrap" style={{ paddingTop: 26 }}>
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Shop", href: "/products" },
            { label: c.name },
          ]}
        />
        <CollectionGrid items={items} />
      </div>
    </div>
  );
}
