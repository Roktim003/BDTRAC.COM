import type { MetadataRoute } from "next";
import { getCatalog } from "@/lib/catalogStore";
import { ensureStores } from "@/lib/ensureStores";
import { SITE_URL } from "@/lib/site";

/* Dynamic sitemap (Phase 11) — generated from the live catalog, so admin
   product/collection changes appear without a rebuild. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await ensureStores();
  const { products, collections } = getCatalog();
  const now = new Date();
  const statik: [string, number][] = [
    ["/", 1],
    ["/products", 0.9],
    ["/about", 0.6],
    ["/faq", 0.5],
    ["/contact", 0.5],
    ["/shipping-policy", 0.3],
    ["/returns", 0.3],
    ["/privacy", 0.2],
    ["/terms", 0.2],
  ];
  return [
    ...statik.map(([path, priority]) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      priority,
    })),
    ...collections.map((c) => ({
      url: `${SITE_URL}/collections/${c.slug}`,
      lastModified: now,
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: `${SITE_URL}/products/${p.id}`,
      lastModified: now,
      priority: 0.7,
    })),
  ];
}
