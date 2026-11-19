import { promises as fs } from "fs";
import { readFileSync, statSync } from "fs";
import path from "path";
import { dbEnabled, readDoc, writeDoc } from "./db";
import {
  collections as seedCollections,
  products as seedProducts,
  type Collection,
  type Product,
} from "./products";

/* Runtime catalog store (Phase 9) — the admin-editable source of truth.
   Seeded from lib/products.ts on first run, persisted to .data/catalog.json
   (production: Supabase tables; the storefront reads through this module
   and the StorefrontProvider either way).
   Reads are synchronous with an mtime cache so server components and the
   order engine always see the latest admin edits. */

export interface CatalogData {
  products: Product[];
  collections: Collection[];
}

const FILE = path.join(process.cwd(), ".data", "catalog.json");
let cache: { mtimeMs: number; data: CatalogData } | null = null;

/* Phase 13: in DB mode the catalog lives in Postgres. Sync readers use
   the hydrated in-memory copy; ensureCatalog() (called by the root
   layout and API routes) loads it once per instance, seeding the DB
   from lib/products.ts on first run. */
let dbCache: CatalogData | null = null;
let hydratePromise: Promise<void> | null = null;

export function ensureCatalog(): Promise<void> {
  if (!dbEnabled) return Promise.resolve();
  if (!hydratePromise) {
    hydratePromise = (async () => {
      const existing = await readDoc<CatalogData>("catalog");
      if (existing) {
        dbCache = existing;
      } else {
        dbCache = seed();
        await writeDoc("catalog", dbCache);
      }
    })();
  }
  return hydratePromise;
}

function seed(): CatalogData {
  return {
    products: JSON.parse(JSON.stringify(seedProducts)) as Product[],
    collections: JSON.parse(JSON.stringify(seedCollections)) as Collection[],
  };
}

export function getCatalog(): CatalogData {
  if (dbEnabled) return dbCache ?? seed();
  try {
    const st = statSync(FILE);
    if (cache && cache.mtimeMs === st.mtimeMs) return cache.data;
    const data = JSON.parse(readFileSync(FILE, "utf8")) as CatalogData;
    cache = { mtimeMs: st.mtimeMs, data };
    return data;
  } catch {
    return seed();
  }
}

export function getCatalogProduct(id: string): Product | undefined {
  return getCatalog().products.find((p) => p.id === id);
}

export function getCatalogCollection(slug: string): Collection | undefined {
  return getCatalog().collections.find((c) => c.slug === slug);
}

export async function saveCatalog(data: CatalogData): Promise<void> {
  if (dbEnabled) {
    dbCache = data;
    await writeDoc("catalog", data);
    return;
  }
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(data, null, 2));
  cache = null;
}
