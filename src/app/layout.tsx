import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono, Noto_Sans_Bengali } from "next/font/google";
import "./globals.css";
import SiteShell from "@/components/SiteShell";
import { StorefrontProvider } from "@/lib/storefront";
import { getCatalog } from "@/lib/catalogStore";
import { getSettings } from "@/lib/settingsStore";
import { ensureStores } from "@/lib/ensureStores";

/* Phase 11: fonts are self-hosted via next/font (no render-blocking
   Google Fonts request — matters on BD mobile networks), metadataBase +
   OG defaults are site-wide, and Organization/WebSite structured data
   ships in the root layout. */
/* Part 1 (BDTRAC foundation): three-font system, self-hosted via next/font.
   - Space_Grotesk  -> display / editorial headlines and primary UI text
   - JetBrains_Mono -> GSM / SKU / spec data (utility class .font-spec)
   - Noto_Sans_Bengali -> Bengali glyphs: bilingual checkout + SMS copy
     (utility class .font-bn and :lang(bn) elements) */
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});
const notoSansBengali = Noto_Sans_Bengali({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-bengali",
  display: "swap",
});

import { SITE_URL } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  await ensureStores();
  const { products } = getCatalog();
  const ogImage = products.find((p) => p.isNew)?.images[0] ?? products[0]?.images[0];
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: "TRAC — Premium Sports Clothing in Bangladesh",
      template: "%s",
    },
    description:
      "Premium sports clothing designed in Bangladesh. Heavyweight fabrics, athletic fits, cash on delivery across Bangladesh.",
    openGraph: {
      type: "website",
      siteName: "TRAC",
      locale: "en_US",
      url: SITE_URL,
      title: "TRAC — Premium Sports Clothing in Bangladesh",
      description:
        "Racing-inspired streetwear designed in Bangladesh. COD across Bangladesh.",
      images: ogImage ? [{ url: ogImage, alt: "TRAC — latest drop" }] : undefined,
    },
    twitter: { card: "summary_large_image" },
    robots: { index: true, follow: true },
  };
}

/* Phase 9: the layout reads the effective (admin-editable) catalog and
   settings on the server and hands them to the client storefront, so
   admin changes go live without a rebuild. */
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await ensureStores();
  const catalog = getCatalog();
  const settings = getSettings();
  const orgLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "TRAC",
        url: SITE_URL,
        logo: `${SITE_URL}/trac-logo.png`,
        sameAs: Object.values(settings.socials).filter(Boolean),
      },
      {
        "@type": "WebSite",
        name: "TRAC",
        url: SITE_URL,
        potentialAction: {
          "@type": "SearchAction",
          target: `${SITE_URL}/search?q={query}`,
          "query-input": "required name=query",
        },
      },
    ],
  };
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} ${notoSansBengali.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
        />
        <StorefrontProvider
          data={{ products: catalog.products, collections: catalog.collections, settings }}
        >
          <SiteShell>{children}</SiteShell>
        </StorefrontProvider>
      </body>
    </html>
  );
}
