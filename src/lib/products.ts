export interface ProductColor {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  compareAt?: number;
  category: "t-shirts" | "polos" | "hoodies";
  images: string[];
  soldOut?: boolean;
  isNew?: boolean;
  description: string;
  fabric: string;
  /* Phase 4 catalog schema — colours are curated from the product
     photography (admin-editable in Phase 9); sizes are the sizes the
     product is offered in (PDP + Quick View read this list); fit and
     collection are derived from the product's own name/description. */
  colors: ProductColor[];
  sizes: string[];
  fit: "Oversized" | "Regular" | "Relaxed";
  collection: string; // collection slug, see `collections` below
}

const SB =
  "https://ahrmcqirkteiphoaldyq.supabase.co/storage/v1/object/public/product-images/products";

// NOTE: The first three products are TRAC's real live products (same IDs as
// bdtrac.com/products/<id> so deep links keep working). The rest are samples
// reusing real TRAC photography — replace with your full catalog / Supabase
// query when you go live.
export const products: Product[] = [
  {
    id: "0e92ff74-0af9-4b77-9382-5b4b76a5e87d",
    name: "Ferrari Oversized T-Shirt",
    price: 699,
    compareAt: 899,
    category: "t-shirts",
    collection: "racing-series",
    fit: "Oversized",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [{ name: "Black", hex: "#111111" }, { name: "Red", hex: "#D62B2B" }, { name: "White", hex: "#FFFFFF" }],
    isNew: true,
    images: [
      `${SB}/0e92ff74-0af9-4b77-9382-5b4b76a5e87d/1779010189449-naal.JPG`,
      `${SB}/0e92ff74-0af9-4b77-9382-5b4b76a5e87d/1780510573893-y76v2e.jpg`,
      `${SB}/0e92ff74-0af9-4b77-9382-5b4b76a5e87d/1780510577285-awrqq7.jpg`,
      `${SB}/0e92ff74-0af9-4b77-9382-5b4b76a5e87d/1780510580703-l5l1hq.jpg`,
    ],
    description:
      "The Ferrari Oversized T-Shirt by TRAC is built for motion. A heavyweight, breathable cotton tee with a relaxed oversized fit — made for training days and street nights alike.",
    fabric: "100% combed cotton, 220 GSM. Machine wash cold, inside out.",
  },
  {
    id: "824ed6d4-f08a-407e-abb5-8d47ec7d7a35",
    name: "Ferrari T-Shirt",
    price: 699,
    category: "t-shirts",
    collection: "racing-series",
    fit: "Regular",
    sizes: ["S", "M", "L", "XL"],
    colors: [{ name: "Black", hex: "#111111" }, { name: "White", hex: "#FFFFFF" }],
    isNew: true,
    images: [
      `${SB}/824ed6d4-f08a-407e-abb5-8d47ec7d7a35/1780519163379-7cyhcl.jpeg`,
      `${SB}/824ed6d4-f08a-407e-abb5-8d47ec7d7a35/1780519476383-ac1waf.jpeg`,
      `${SB}/824ed6d4-f08a-407e-abb5-8d47ec7d7a35/1780519482440-ge6f5c.jpeg`,
      `${SB}/824ed6d4-f08a-407e-abb5-8d47ec7d7a35/1780519487697-lzsge.jpeg`,
    ],
    description:
      "A classic-fit Ferrari T-Shirt in premium cotton. Clean lines, sharp print, all-day comfort — the everyday essential from TRAC.",
    fabric: "100% combed cotton, 200 GSM. Machine wash cold, inside out.",
  },
  {
    id: "a307c8d1-70cb-4c7e-8e0f-0debdee8730f",
    name: "Ferrari Oversized T-Shirt",
    price: 699,
    compareAt: 899,
    category: "t-shirts",
    collection: "racing-series",
    fit: "Oversized",
    sizes: ["M", "L", "XL", "XXL"],
    colors: [{ name: "Maroon", hex: "#7A1F1F" }, { name: "Black", hex: "#111111" }],
    images: [
      `${SB}/a307c8d1-70cb-4c7e-8e0f-0debdee8730f/1778937307432-zaqmf.jpg`,
      `${SB}/a307c8d1-70cb-4c7e-8e0f-0debdee8730f/1778937341872-et4mv7.jpg`,
      `${SB}/a307c8d1-70cb-4c7e-8e0f-0debdee8730f/1778937346201-io3m7p.jpg`,
    ],
    description:
      "Oversized attitude, track-inspired graphics. The Ferrari Oversized T-Shirt pairs a boxy drop-shoulder cut with TRAC's signature heavyweight fabric.",
    fabric: "100% combed cotton, 220 GSM. Machine wash cold, inside out.",
  },
  {
    id: "sample-polo-01",
    name: "Ferrari Pique Polo",
    price: 899,
    compareAt: 1099,
    category: "polos",
    collection: "racing-series",
    fit: "Regular",
    sizes: ["M", "L", "XL"],
    colors: [{ name: "Black", hex: "#111111" }, { name: "White", hex: "#FFFFFF" }],
    isNew: true,
    images: [
      `${SB}/0e92ff74-0af9-4b77-9382-5b4b76a5e87d/1780510582971-q9sam7.jpg`,
      `${SB}/0e92ff74-0af9-4b77-9382-5b4b76a5e87d/1780510585632-rr42q5.jpg`,
    ],
    description:
      "A sport-luxe pique polo with a structured collar and breathable knit. From court to cafe without missing a beat.",
    fabric: "Cotton pique, 230 GSM. Machine wash cold.",
  },
  {
    id: "sample-hoodie-01",
    name: "Ferrari Training Hoodie",
    price: 1499,
    compareAt: 1799,
    category: "hoodies",
    collection: "racing-series",
    fit: "Relaxed",
    sizes: ["M", "L", "XL", "XXL"],
    colors: [{ name: "Black", hex: "#111111" }, { name: "Grey", hex: "#555555" }],
    images: [
      `${SB}/0e92ff74-0af9-4b77-9382-5b4b76a5e87d/1780510588493-9xyqim.jpg`,
      `${SB}/0e92ff74-0af9-4b77-9382-5b4b76a5e87d/1780510591827-j7bia.jpg`,
    ],
    description:
      "Heavyweight fleece hoodie with a double-layer hood and kangaroo pocket. Your pre-game uniform.",
    fabric: "400 GSM brushed fleece. Machine wash cold, inside out.",
  },
  {
    id: "sample-tshirt-04",
    name: "Ferrari Oversized T-Shirt",
    price: 749,
    category: "t-shirts",
    collection: "racing-series",
    fit: "Oversized",
    sizes: ["S", "M", "L"],
    colors: [{ name: "Black", hex: "#111111" }],
    soldOut: true,
    images: [
      `${SB}/0e92ff74-0af9-4b77-9382-5b4b76a5e87d/1780510595322-xc0tq.jpg`,
      `${SB}/0e92ff74-0af9-4b77-9382-5b4b76a5e87d/1779010189449-naal.JPG`,
    ],
    description:
      "Limited colourway of the Ferrari Oversized T-Shirt. Currently sold out — back soon.",
    fabric: "100% combed cotton, 220 GSM.",
  },
  {
    id: "sample-polo-02",
    name: "TRAC Sport Polo",
    price: 849,
    category: "polos",
    collection: "essentials",
    fit: "Regular",
    sizes: ["S", "M", "L", "XL"],
    colors: [{ name: "White", hex: "#FFFFFF" }, { name: "Black", hex: "#111111" }],
    images: [
      `${SB}/824ed6d4-f08a-407e-abb5-8d47ec7d7a35/1780519482440-ge6f5c.jpeg`,
      `${SB}/824ed6d4-f08a-407e-abb5-8d47ec7d7a35/1780519487697-lzsge.jpeg`,
    ],
    description:
      "Minimal TRAC branding on a clean pique polo. The quiet flex.",
    fabric: "Cotton pique, 230 GSM. Machine wash cold.",
  },
  {
    id: "sample-hoodie-02",
    name: "TRAC Essential Hoodie",
    price: 1399,
    category: "hoodies",
    collection: "essentials",
    fit: "Relaxed",
    sizes: ["M", "L"],
    colors: [{ name: "Charcoal", hex: "#222222" }],
    soldOut: true,
    images: [
      `${SB}/a307c8d1-70cb-4c7e-8e0f-0debdee8730f/1778937346201-io3m7p.jpg`,
      `${SB}/a307c8d1-70cb-4c7e-8e0f-0debdee8730f/1778937307432-zaqmf.jpg`,
    ],
    description:
      "The everyday heavyweight hoodie. Currently sold out — back soon.",
    fabric: "400 GSM brushed fleece.",
  },
];

export interface Collection {
  slug: string;
  name: string;
  description: string;
}

export const collections: Collection[] = [
  {
    slug: "racing-series",
    name: "Racing Series",
    description:
      "Track-born graphics on heavyweight cotton — the Ferrari tees and training pieces that started TRAC. Oversized cuts, bold prints, built for the streets of Bangladesh.",
  },
  {
    slug: "essentials",
    name: "Essentials",
    description:
      "The quiet staples: clean polos and everyday hoodies with minimal branding. Premium fabrics, honest prices, zero noise.",
  },
];

export const getCollection = (slug: string) => collections.find((c) => c.slug === slug);
export const collectionProducts = (slug: string) => products.filter((p) => p.collection === slug);

const SIZE_ORDER = ["S", "M", "L", "XL", "XXL"];
export const allSizes = SIZE_ORDER.filter((s) => products.some((p) => p.sizes.includes(s)));
export const allColors: ProductColor[] = Array.from(
  new Map(products.flatMap((p) => p.colors).map((c) => [c.name, c])).values()
);
export const allFits = Array.from(new Set(products.map((p) => p.fit)));

export const getProduct = (id: string) => products.find((p) => p.id === id);

export const categories = [
  { slug: "all", label: "All" },
  { slug: "t-shirts", label: "T-Shirts" },
  { slug: "polos", label: "Polos" },
  { slug: "hoodies", label: "Hoodies" },
] as const;

export const LOGO_URL = "https://www.bdtrac.com/trac-logo.png";
export const HERO_VIDEO_URL = "https://www.bdtrac.com/hero-image.mp4";
export const HERO_POSTER_URL = "https://www.bdtrac.com/hero-image.jpg";

export const taka = (n: number) => "৳" + n.toLocaleString("en-US");
export const discountPct = (p: Product) =>
  p.compareAt ? Math.round((1 - p.price / p.compareAt) * 100) : 0;


/* List-based helpers (Phase 9) — the functions above read the seed list;
   these take the effective catalog list (from the StorefrontProvider /
   catalog store) so admin edits apply everywhere. */
export const sizesOf = (list: Product[]) =>
  SIZE_ORDER.filter((s) => list.some((p) => p.sizes.includes(s)));
export const colorsOf = (list: Product[]): ProductColor[] =>
  Array.from(new Map(list.flatMap((p) => p.colors).map((c) => [c.name, c])).values());
export const fitsOf = (list: Product[]) => Array.from(new Set(list.map((p) => p.fit)));
export const collectionProductsFrom = (list: Product[], slug: string) =>
  list.filter((p) => p.collection === slug);
export const getCollectionFrom = (list: Collection[], slug: string) =>
  list.find((c) => c.slug === slug);
