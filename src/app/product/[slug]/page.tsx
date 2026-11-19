import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailView } from "@/components/storefront/ProductDrawer";
import {
  EDITORIAL_PRODUCTS,
  getEditorialProduct,
} from "@/lib/editorial-catalog";
import { formatBDT } from "@/lib/bd-utils";

/**
 * Editorial product page (Part 3) — /product/[slug] for the Part 2/3
 * Prisma catalog. The legacy UUID PDP stays at /products/[id]; this
 * route serves the slug-based editorial catalog.
 */

export function generateStaticParams() {
  return EDITORIAL_PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getEditorialProduct(slug);
  if (!product) return { title: "Not found — TRAC" };
  return {
    title: `${product.title} — ${formatBDT(product.basePriceBdt)} | TRAC`,
    description: `${product.title}: ${product.gsmWeight} GSM ${product.fabricComposition}, ${product.fitLabel} fit. Studio stock live per size.`,
  };
}

export default async function EditorialProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getEditorialProduct(slug);
  if (!product) notFound();
  return (
    <div className="sf-product-page">
      <ProductDetailView product={product} />
    </div>
  );
}
