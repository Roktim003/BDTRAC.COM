import { promises as fs } from "fs";
import { readFileSync, statSync } from "fs";
import path from "path";
import { siteConfig } from "./site";
import { homepage, type HomeSectionId } from "./homepage";
import { shipping } from "./shipping";
import { dbEnabled, readDoc, writeDoc } from "./db";

/* Runtime settings store (Phase 9) — everything the admin CMS edits.
   Seeded from the code config (lib/site, lib/homepage, lib/shipping) so
   behaviour is identical until an admin changes something. Persisted to
   .data/settings.json (production: Supabase). */

export interface StoreInfo {
  city: string;
  address: string;
  phone: string;
}

export interface Settings {
  announcement: { enabled: boolean; text: string; href: string | null };
  socials: { instagram: string; facebook: string; youtube: string; whatsapp: string };
  newsletterEnabled: boolean;
  payments: { cod: boolean; bkash: boolean; nagad: boolean };
  hero: typeof homepage.hero;
  sections: { id: HomeSectionId; enabled: boolean }[];
  editorial: typeof homepage.editorial;
  story: typeof homepage.story;
  featuredProductIds: string[];
  shipping: typeof shipping;
  promos: { code: string; pct: number; active: boolean }[];
  stores: StoreInfo[];
}

export const defaultSettings: Settings = {
  announcement: { ...siteConfig.announcement },
  socials: { ...siteConfig.socials },
  newsletterEnabled: siteConfig.newsletterEnabled,
  payments: { ...siteConfig.payments },
  hero: JSON.parse(JSON.stringify(homepage.hero)),
  sections: homepage.sections.map((s) => ({ ...s })),
  editorial: JSON.parse(JSON.stringify(homepage.editorial)),
  story: JSON.parse(JSON.stringify(homepage.story)),
  featuredProductIds: [...homepage.featuredProductIds],
  shipping: { ...shipping },
  promos: [],
  /* Placeholder store data carried over from the October build — replace
     with TRAC's real addresses/phones in the admin (Phase 9) or code. */
  stores: [
    { city: "Dhaka — Banani", address: "House 12, Road 5, Banani,\nDhaka 1213", phone: "+880 1XXX-XXXXXX" },
    { city: "Chattogram", address: "GEC Circle, CDA Avenue,\nChattogram 4000", phone: "+880 1XXX-XXXXXX" },
    { city: "Dhaka — Uttara", address: "House 8, Road 12, Sector 7,\nUttara, Dhaka 1230", phone: "+880 1XXX-XXXXXX" },
  ],
};

const FILE = path.join(process.cwd(), ".data", "settings.json");
let cache: { mtimeMs: number; data: Settings } | null = null;

/* Phase 13: DB mode mirrors catalogStore — hydrated in-memory copy,
   seeded from the code defaults on first run. */
let dbCache: Settings | null = null;
let hydratePromise: Promise<void> | null = null;

export function ensureSettings(): Promise<void> {
  if (!dbEnabled) return Promise.resolve();
  if (!hydratePromise) {
    hydratePromise = (async () => {
      const existing = await readDoc<Partial<Settings>>("settings");
      dbCache = { ...defaultSettings, ...(existing ?? {}) };
      if (!existing) await writeDoc("settings", dbCache);
    })();
  }
  return hydratePromise;
}

export function getSettings(): Settings {
  if (dbEnabled) return dbCache ?? defaultSettings;
  try {
    const st = statSync(FILE);
    if (cache && cache.mtimeMs === st.mtimeMs) return cache.data;
    const raw = JSON.parse(readFileSync(FILE, "utf8")) as Partial<Settings>;
    const data: Settings = { ...defaultSettings, ...raw };
    cache = { mtimeMs: st.mtimeMs, data };
    return data;
  } catch {
    return defaultSettings;
  }
}

export async function saveSettings(next: Settings): Promise<void> {
  if (dbEnabled) {
    dbCache = next;
    await writeDoc("settings", next);
    return;
  }
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(next, null, 2));
  cache = null;
}
