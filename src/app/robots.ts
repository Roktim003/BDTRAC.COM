import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/* Robots (Phase 11) — utility/private routes stay out of the index. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api/",
          "/account",
          "/cart",
          "/checkout",
          "/track",
          "/search",
          "/wishlist",
          "/design-system",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
