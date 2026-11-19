/* Homepage configuration (Phase 3) — the data layer the Phase 9 CMS will edit.
   Section visibility + ordering, hero media/CTAs, editorial content and the
   curated Featured Products list all live here, never hardcoded in pages. */

export type HomeSectionId =
  | "latest"
  | "editorial"
  | "categories"
  | "featured"
  | "story"
  | "stores"
  | "recent";

export const homepage = {
  hero: {
    videoUrl: "https://www.bdtrac.com/hero-image.mp4",
    posterUrl: "https://www.bdtrac.com/hero-image.jpg",
    /* Prompt §3.1 example campaign ("BUILT FOR THE BOLD") — capability kept,
       but display is OFF: Roktim's approved interface (demo v2, twice
       confirmed) is the minimal video hero with only the underlined
       "Shop now". Flip enabled to show the headline treatment instead. */
    headline: {
      enabled: false,
      kicker: "Racing Series",
      title: "Built for the Bold",
      text: "Inspired by motion. Designed for the streets.",
      secondaryCta: { label: "Our Story", href: "/about" } as { label: string; href: string } | null,
    },
    cta: { label: "Shop now", href: "/products?sort=new" },
  },

  /* §3.9 section ordering + visibility (hero and footer are fixed) */
  sections: [
    { id: "latest", enabled: true },
    { id: "editorial", enabled: true },
    { id: "categories", enabled: true },
    { id: "featured", enabled: true },
    { id: "story", enabled: true },
    { id: "stores", enabled: true },
    /* Recently Viewed (Phase 6) — self-hides until the visitor has history */
    { id: "recent", enabled: true },
  ] as { id: HomeSectionId; enabled: boolean }[],

  /* §3.3 Featured collection editorial — grounded in the real catalog
     (the Ferrari tees), not an invented collection name. */
  editorial: {
    eyebrow: "Featured — The Ferrari Tees",
    title: "Engineered\nFor Motion",
    text: "Breathable, heavyweight cotton built to move with you — from morning training to late-night streets.",
    cta: { label: "Shop the Tees", href: "/products?cat=t-shirts" },
    productIndex: 0,
    imageIndex: 3,
  },

  /* §3.5 Bestsellers — no sales data exists yet, so per the prompt this is a
     manually curated Featured Products list: the 3 real live products first. */
  featuredProductIds: [
    "0e92ff74-0af9-4b77-9382-5b4b76a5e87d",
    "824ed6d4-f08a-407e-abb5-8d47ec7d7a35",
    "a307c8d1-70cb-4c7e-8e0f-0debdee8730f",
    "sample-polo-01",
  ],

  /* §3.6 Brand story */
  story: {
    kicker: "The TRAC Identity",
    title: "Not Just Another T-Shirt.",
    text: "TRAC is a Bangladesh streetwear label built around motion — racing lines, bold graphics and fabrics that hold up in Dhaka heat. Designed here. Worn everywhere.",
    ticks: ["Heavyweight Cotton", "Oversized Fits", "COD Nationwide", "Designed in Bangladesh"],
    cta: { label: "About TRAC", href: "/about" },
  },
};
