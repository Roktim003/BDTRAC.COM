/* Site-wide configuration for Phase 2 (header / navigation / footer).
   Later phases move these values into the admin CMS (Phase 9) — components
   must read from here, never hardcode nav or announcement content. */

export const siteConfig = {
  /* 2.1 Announcement bar — OFF by default: the approved TRAC interface
     (demo v2 / BLUORNG photo) has no bar over the hero. Set enabled: true
     (admin-controlled in Phase 9) to show a promo / delivery message. */
  announcement: {
    enabled: false,
    text: "New drop live — Racing Series · Cash on Delivery across Bangladesh",
    href: "/products?sort=new" as string | null,
  },

  /* Social profiles — empty string = hidden in the footer. Fill in the real
     URLs when TRAC confirms them; never link to "#" or a guessed profile. */
  socials: {
    instagram: "",
    facebook: "",
    youtube: "",
    whatsapp: "",
  },

  /* 2.6 Footer newsletter — rendered only when enabled. Submissions are
     interim client-side confirmations until the Phase 3/9 backend lands. */
  newsletterEnabled: true,

  /* Payment methods (Phase 7, §7.6) — a method renders as selectable ONLY
     when its merchant integration is live and tested. bKash/Nagad stay
     false until TRAC's merchant accounts are connected; they render as
     "Coming soon" and can never be chosen or simulated. */
  payments: {
    cod: true,
    bkash: false,
    nagad: false,
  },
};

/* Navigation derived from the real catalog (lib/products) — Phase 2 rule:
   only show categories / views that actually exist. */
import { categories, products } from "./products";

/** Canonical site origin (Phase 11) — override with NEXT_PUBLIC_SITE_URL. */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.bdtrac.com";

export interface NavLink {
  label: string;
  href: string;
}

export const shopLinks: NavLink[] = [
  { label: "Shop All", href: "/products" },
  ...categories
    .filter((c) => c.slug !== "all")
    .filter((c) => products.some((p) => p.category === c.slug))
    .map((c) => ({ label: c.label, href: `/products?cat=${c.slug}` })),
];

/* "Collections" menu — from the catalog's real collections (Phase 4 added
   the collection field + /collections/[slug] pages), plus derived views. */
import { collections } from "./products";

export const collectionLinks: NavLink[] = [
  ...(products.some((p) => p.isNew) ? [{ label: "Latest Drop", href: "/products?sort=new" }] : []),
  ...collections
    .filter((c) => products.some((p) => p.collection === c.slug))
    .map((c) => ({ label: c.name, href: `/collections/${c.slug}` })),
  ...(products.some((p) => p.compareAt) ? [{ label: "On Sale", href: "/products?sort=discount" }] : []),
];
