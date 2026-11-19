/* Migrate local .data/*.json stores into Postgres (Phase 13).
   Usage: DATABASE_URL="postgres://…" node scripts/migrate-to-db.mjs
   Idempotent: upserts each store doc by key; safe to re-run. Files that
   don't exist locally are skipped (the app seeds those stores itself). */
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}
const local = /localhost|127\.0\.0\.1/.test(url);
const pool = new pg.Pool({
  connectionString: url,
  ssl: local ? undefined : { rejectUnauthorized: false },
});
await pool.query(`CREATE TABLE IF NOT EXISTS trac_docs (
  key TEXT PRIMARY KEY, doc JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now())`);

for (const key of ["catalog", "settings", "orders", "users", "messages"]) {
  try {
    const raw = await readFile(path.join(root, ".data", `${key}.json`), "utf8");
    const doc = JSON.parse(raw);
    await pool.query(
      `INSERT INTO trac_docs (key, doc, updated_at) VALUES ($1, $2, now())
       ON CONFLICT (key) DO UPDATE SET doc = EXCLUDED.doc, updated_at = now()`,
      [key, JSON.stringify(doc)]
    );
    console.log(`migrated: ${key}`);
  } catch {
    console.log(`skipped: ${key} (no local file)`);
  }
}
await pool.end();
console.log("Done.");
