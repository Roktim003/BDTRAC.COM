/**
 * BDTRAC — database seed (Part 2).
 *
 * Six ORIGINAL TRAC streetwear products, all 320–480 GSM, written for this
 * catalog (no copied names, copy or imagery). Image fields are storefront
 * paths under /products/ — the photo assets are added with the storefront
 * parts; the seed only reserves the canonical paths.
 *
 * Run:  npm run db:generate   (once, and after every schema change)
 *       npm run db:push       (create/sync tables)
 *       npm run db:seed
 * Idempotent: products upsert by slug, variants upsert by SKU, so re-running
 * updates prices/specs and restocks to the seed levels without duplicates.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  type ApparelSize,
  type FitType,
  type ProductCategory,
} from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set — cannot seed. See .env.example.");
}
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

interface SeedProduct {
  slug: string;
  title: string;
  category: ProductCategory;
  gsmWeight: number;
  fabricComposition: string;
  fitType: FitType;
  basePriceBdt: number;
  dropTag: string | null;
  skuPrefix: string;
  colors: ReadonlyArray<{ name: string; code: string }>;
}

const SIZES: readonly ApparelSize[] = ["S", "M", "L", "XL", "XXL"];

const CATALOG: readonly SeedProduct[] = [
  {
    slug: "obsidian-heavyweight-tee",
    title: "Obsidian Heavyweight Tee",
    category: "HEAVYWEIGHT_TEE",
    gsmWeight: 400,
    fabricComposition: "100% combed ring-spun cotton",
    fitType: "BOXY",
    basePriceBdt: 1850,
    dropTag: "DROP-001",
    skuPrefix: "TRAC-HT1",
    colors: [
      { name: "Jet Black", code: "BLK" },
      { name: "Bone White", code: "BNE" },
    ],
  },
  {
    slug: "monsoon-wash-heavyweight-tee",
    title: "Monsoon Wash Heavyweight Tee",
    category: "HEAVYWEIGHT_TEE",
    gsmWeight: 320,
    fabricComposition: "100% cotton slub jersey, garment-washed",
    fitType: "RELAXED",
    basePriceBdt: 1650,
    dropTag: "MONSOON-EDIT",
    skuPrefix: "TRAC-HT2",
    colors: [
      { name: "Slate Grey", code: "SLT" },
      { name: "Deep Olive", code: "OLV" },
    ],
  },
  {
    slug: "rickshaw-line-boxy-hoodie",
    title: "Rickshaw Line Boxy Hoodie",
    category: "BOXY_HOODIE",
    gsmWeight: 480,
    fabricComposition: "80% cotton, 20% polyester brushed fleece",
    fitType: "BOXY",
    basePriceBdt: 3450,
    dropTag: "DROP-001",
    skuPrefix: "TRAC-BH1",
    colors: [
      { name: "Jet Black", code: "BLK" },
      { name: "Industrial Crimson", code: "CRM" },
    ],
  },
  {
    slug: "buriganga-fog-boxy-hoodie",
    title: "Buriganga Fog Boxy Hoodie",
    category: "BOXY_HOODIE",
    gsmWeight: 420,
    fabricComposition: "80% cotton, 20% polyester brushed fleece",
    fitType: "BOXY",
    basePriceBdt: 3250,
    dropTag: null,
    skuPrefix: "TRAC-BH2",
    colors: [
      { name: "Fog Grey", code: "FOG" },
      { name: "Midnight Navy", code: "NVY" },
    ],
  },
  {
    slug: "old-town-cargo-trouser",
    title: "Old Town Cargo Trouser",
    category: "CARGO_TROUSER",
    gsmWeight: 360,
    fabricComposition: "98% cotton twill, 2% elastane",
    fitType: "TAPERED",
    basePriceBdt: 2850,
    dropTag: "DROP-001",
    skuPrefix: "TRAC-CT1",
    colors: [
      { name: "Washed Khaki", code: "KHK" },
      { name: "Jet Black", code: "BLK" },
    ],
  },
  {
    slug: "kalboishakhi-monsoon-shell-jacket",
    title: "Kalboishakhi Monsoon Shell Jacket",
    category: "MONSOON_SHELL_JACKET",
    gsmWeight: 340,
    fabricComposition: "100% polyester bonded softshell, PU membrane",
    fitType: "REGULAR",
    basePriceBdt: 4950,
    dropTag: "MONSOON-EDIT",
    skuPrefix: "TRAC-MJ1",
    colors: [
      { name: "Storm Black", code: "BLK" },
      { name: "Industrial Crimson", code: "CRM" },
    ],
  },
];

/** Deterministic seed stock so re-runs restock to known levels. */
function seedStock(sizeIndex: number, colorIndex: number): number {
  return 8 + sizeIndex * 3 + colorIndex * 5;
}

async function main(): Promise<void> {
  let variantCount = 0;
  for (const item of CATALOG) {
    const product = await prisma.product.upsert({
      where: { slug: item.slug },
      create: {
        slug: item.slug,
        title: item.title,
        category: item.category,
        gsmWeight: item.gsmWeight,
        fabricComposition: item.fabricComposition,
        fitType: item.fitType,
        basePriceBdt: item.basePriceBdt,
        images: [
          `/products/${item.slug}-1.jpg`,
          `/products/${item.slug}-2.jpg`,
        ],
        dropTag: item.dropTag,
        isActive: true,
      },
      update: {
        title: item.title,
        category: item.category,
        gsmWeight: item.gsmWeight,
        fabricComposition: item.fabricComposition,
        fitType: item.fitType,
        basePriceBdt: item.basePriceBdt,
        dropTag: item.dropTag,
        isActive: true,
      },
    });

    for (const [colorIndex, color] of item.colors.entries()) {
      for (const [sizeIndex, size] of SIZES.entries()) {
        const sku = `${item.skuPrefix}-${color.code}-${size}`;
        await prisma.productVariant.upsert({
          where: { sku },
          create: {
            productId: product.id,
            size,
            color: color.name,
            sku,
            stockCount: seedStock(sizeIndex, colorIndex),
          },
          update: {
            productId: product.id,
            size,
            color: color.name,
            stockCount: seedStock(sizeIndex, colorIndex),
          },
        });
        variantCount += 1;
      }
    }
  }
  console.log(
    `BDTRAC seed complete: ${CATALOG.length} products, ${variantCount} variants.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error("BDTRAC seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
