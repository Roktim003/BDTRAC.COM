import type { Metadata } from "next";
import { ensureStores } from "@/lib/ensureStores";
import { notFound } from "next/navigation";
import ProductDetail from "@/components/ProductDetail";
import { getCatalogCollection, getCatalogProduct } from "@/lib/catalogStore";

/* Phase 5: the product page is a server component so it gets real SEO —
   per-product metadata, canonical URL, OpenGraph and Product JSON-LD (§5.7).
   The interactive detail UI lives in components/ProductDetail.tsx. */
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.bdtrac.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  await ensureStores();
  const { id } = await params;
  const p = getCatalogProduct(id);
  if (!p) return { title: "Product — TRAC" };
  const description = p.description.slice(0, 155);
  return {
    title: `${p.name} — TRAC`,
    description,
    alternates: { canonical: `/products/${p.id}` },
    openGraph: {
      title: `${p.name} — TRAC`,
      description,
      url: `${SITE}/products/${p.id}`,
      images: [{ url: p.images[0] }],
      type: "website",
    },
    twitter: { card: "summary_large_image", title: `${p.name} — TRAC`, description, images: [p.images[0]] },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await ensureStores();
  const { id } = await params;
  const product = getCatalogProduct(id);
  if (!product) notFound();
  const collection = getCatalogCollection(product.collection);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images,
    sku: product.id,
    brand: { "@type": "Brand", name: "TRAC" },
    offers: {
      "@type": "Offer",
      url: `${SITE}/products/${product.id}`,
      priceCurrency: "BDT",
      price: product.price,
      availability: product.soldOut
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
    },
  };
  const crumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Shop", item: `${SITE}/products` },
      ...(collection
        ? [{ "@type": "ListItem", position: 3, name: collection.name, item: `${SITE}/collections/${collection.slug}` }]
        : []),
      {
        "@type": "ListItem",
        position: collection ? 4 : 3,
        name: product.name,
        item: `${SITE}/products/${product.id}`,
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />
      <ProductDetail product={product} />
    </>
  );
}
