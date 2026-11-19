import type { ApparelSize, Gsm } from "@/types";

/**
 * Editorial storefront catalog (Part 3).
 *
 * This mirrors `prisma/seed.ts` EXACTLY — same slugs, titles, GSM, fabric,
 * fit, prices, colourways, SKU scheme and deterministic studio stock — so
 * the Part 3 editorial surface renders the same catalog the Prisma layer
 * seeds. When the Prisma-backed API lands, this module is replaced by a
 * fetch against the same shapes; components consume only these types.
 *
 * Image paths are the seed's reserved asset paths (`/products/<slug>-N.jpg`).
 * Photography has not been shot yet; `EditorialImage` renders an editorial
 * typographic frame when an asset is missing instead of a broken image.
 */

export type EditorialCategory =
  | "HEAVYWEIGHT_TEE"
  | "BOXY_HOODIE"
  | "CARGO_TROUSER"
  | "MONSOON_SHELL_JACKET";

export interface EditorialVariant {
  size: ApparelSize;
  color: string;
  sku: string;
  stockCount: number;
}

export interface EditorialProduct {
  slug: string;
  title: string;
  category: EditorialCategory;
  categoryLabel: string;
  gsmWeight: Gsm;
  fabricComposition: string;
  care: string;
  fitType: "BOXY" | "RELAXED" | "REGULAR" | "TAPERED";
  fitLabel: string;
  basePriceBdt: number;
  images: string[];
  dropTag: string | null;
  skuPrefix: string;
  colors: { name: string; hex: string }[];
  variants: EditorialVariant[];
}

export const EDITORIAL_SIZES: ApparelSize[] = ["S", "M", "L", "XL", "XXL"];

/** Same deterministic studio stock as prisma/seed.ts. */
function seedStock(sizeIndex: number, colorIndex: number): number {
  return 8 + sizeIndex * 3 + colorIndex * 5;
}

interface ProductSeed {
  slug: string;
  title: string;
  category: EditorialCategory;
  categoryLabel: string;
  gsmWeight: Gsm;
  fabricComposition: string;
  care: string;
  fitType: EditorialProduct["fitType"];
  fitLabel: string;
  basePriceBdt: number;
  dropTag: string | null;
  skuPrefix: string;
  colors: { name: string; hex: string }[];
}

const SEEDS: ProductSeed[] = [
  {
    slug: "obsidian-heavyweight-tee",
    title: "Obsidian Heavyweight Tee",
    category: "HEAVYWEIGHT_TEE",
    categoryLabel: "Heavyweight Tee",
    gsmWeight: 400,
    fabricComposition: "100% combed ring-spun cotton",
    care: "Machine wash cold, inside out. Do not bleach. Line dry in shade.",
    fitType: "BOXY",
    fitLabel: "Boxy",
    basePriceBdt: 1850,
    dropTag: "DROP-001",
    skuPrefix: "TRAC-HT1",
    colors: [
      { name: "Jet Black", hex: "#141414" },
      { name: "Bone White", hex: "#EDEAE2" },
    ],
  },
  {
    slug: "monsoon-wash-heavyweight-tee",
    title: "Monsoon Wash Heavyweight Tee",
    category: "HEAVYWEIGHT_TEE",
    categoryLabel: "Heavyweight Tee",
    gsmWeight: 320,
    fabricComposition: "100% cotton slub, garment-washed",
    care: "Machine wash cold with like colours. Line dry in shade.",
    fitType: "RELAXED",
    fitLabel: "Relaxed",
    basePriceBdt: 1650,
    dropTag: "MONSOON-EDIT",
    skuPrefix: "TRAC-HT2",
    colors: [
      { name: "Slate Grey", hex: "#6E7378" },
      { name: "Deep Olive", hex: "#4A5138" },
    ],
  },
  {
    slug: "rickshaw-line-boxy-hoodie",
    title: "Rickshaw Line Boxy Hoodie",
    category: "BOXY_HOODIE",
    categoryLabel: "Boxy Hoodie",
    gsmWeight: 480,
    fabricComposition: "80% cotton / 20% polyester brushed fleece",
    care: "Machine wash cold, inside out. Do not tumble dry.",
    fitType: "BOXY",
    fitLabel: "Boxy",
    basePriceBdt: 3450,
    dropTag: "DROP-001",
    skuPrefix: "TRAC-BH1",
    colors: [
      { name: "Jet Black", hex: "#141414" },
      { name: "Industrial Crimson", hex: "#D9381E" },
    ],
  },
  {
    slug: "buriganga-fog-boxy-hoodie",
    title: "Buriganga Fog Boxy Hoodie",
    category: "BOXY_HOODIE",
    categoryLabel: "Boxy Hoodie",
    gsmWeight: 420,
    fabricComposition: "80% cotton / 20% polyester brushed fleece",
    care: "Machine wash cold, inside out. Do not tumble dry.",
    fitType: "BOXY",
    fitLabel: "Boxy",
    basePriceBdt: 3250,
    dropTag: null,
    skuPrefix: "TRAC-BH2",
    colors: [
      { name: "Fog Grey", hex: "#B9BCBE" },
      { name: "Midnight Navy", hex: "#232C3D" },
    ],
  },
  {
    slug: "old-town-cargo-trouser",
    title: "Old Town Cargo Trouser",
    category: "CARGO_TROUSER",
    categoryLabel: "Cargo Trouser",
    gsmWeight: 360,
    fabricComposition: "98% cotton twill / 2% elastane",
    care: "Machine wash cold. Warm iron if needed.",
    fitType: "TAPERED",
    fitLabel: "Tapered",
    basePriceBdt: 2850,
    dropTag: "DROP-001",
    skuPrefix: "TRAC-CT1",
    colors: [
      { name: "Washed Khaki", hex: "#A79B7E" },
      { name: "Jet Black", hex: "#141414" },
    ],
  },
  {
    slug: "kalboishakhi-monsoon-shell-jacket",
    title: "Kalboishakhi Monsoon Shell Jacket",
    category: "MONSOON_SHELL_JACKET",
    categoryLabel: "Monsoon Shell Jacket",
    gsmWeight: 340,
    fabricComposition: "Bonded softshell with PU membrane, taped seams",
    care: "Wipe clean or gentle machine wash cold. Do not iron membrane.",
    fitType: "REGULAR",
    fitLabel: "Regular",
    basePriceBdt: 4950,
    dropTag: "MONSOON-EDIT",
    skuPrefix: "TRAC-MJ1",
    colors: [
      { name: "Storm Black", hex: "#1C1E20" },
      { name: "Industrial Crimson", hex: "#D9381E" },
    ],
  },
];

function buildProduct(seed: ProductSeed): EditorialProduct {
  const variants: EditorialVariant[] = [];
  seed.colors.forEach((color, colorIndex) => {
    EDITORIAL_SIZES.forEach((size, sizeIndex) => {
      variants.push({
        size,
        color: color.name,
        sku: `${seed.skuPrefix}-${color.name.split(" ").map((w) => w.charAt(0)).join("")}-${size}`,
        stockCount: seedStock(sizeIndex, colorIndex),
      });
    });
  });
  return {
    ...seed,
    images: [`/products/${seed.slug}-1.jpg`, `/products/${seed.slug}-2.jpg`],
    variants,
  };
}

export const EDITORIAL_PRODUCTS: EditorialProduct[] = SEEDS.map(buildProduct);

export function getEditorialProduct(slug: string): EditorialProduct | undefined {
  return EDITORIAL_PRODUCTS.find((p) => p.slug === slug);
}

/** Studio stock for one colourway, keyed by size (S–XXL, prompt range S–XL included). */
export function stockBySize(
  product: EditorialProduct,
  color: string,
): { size: ApparelSize; sku: string; stockCount: number }[] {
  return EDITORIAL_SIZES.map((size) => {
    const v = product.variants.find((x) => x.size === size && x.color === color);
    return { size, sku: v?.sku ?? "", stockCount: v?.stockCount ?? 0 };
  });
}

/** Resolve a variant (with its product) by SKU — used by the cart
    store for stock limits and by checkout line rendering. */
export function getVariantBySku(
  sku: string,
): { product: EditorialProduct; variant: EditorialVariant } | undefined {
  for (const product of EDITORIAL_PRODUCTS) {
    const variant = product.variants.find((v) => v.sku === sku);
    if (variant) return { product, variant };
  }
  return undefined;
}

export const EDITORIAL_CATEGORIES: { value: EditorialCategory | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "HEAVYWEIGHT_TEE", label: "Heavyweight Tees" },
  { value: "BOXY_HOODIE", label: "Boxy Hoodies" },
  { value: "CARGO_TROUSER", label: "Cargo Trousers" },
  { value: "MONSOON_SHELL_JACKET", label: "Shell Jackets" },
];
