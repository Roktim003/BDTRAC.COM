import { ensureCatalog } from "./catalogStore";
import { ensureSettings } from "./settingsStore";

/* Hydrate the sync stores from Postgres (Phase 13). No-op in file mode.
   Called by the root layout and every API route / dynamic page that
   reads catalog or settings server-side, before those reads happen. */
export async function ensureStores(): Promise<void> {
  await Promise.all([ensureCatalog(), ensureSettings()]);
}
