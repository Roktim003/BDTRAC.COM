import { Pool } from "pg";

/* Postgres doc-store (Phase 13) — the production persistence layer.
   Dual mode, same pattern as the rest of this project's migrations:
   - DATABASE_URL set   → all stores persist as JSONB docs in one table
     (trac_docs), which survives Vercel's ephemeral filesystem.
   - DATABASE_URL unset → the original .data/ JSON files (local dev
     unchanged, fully offline).
   Every store module keeps its existing interface; only its read/write
   internals branch on dbEnabled. Docs are whole-store JSON documents —
   the right size for a single-store catalog/orders volume; row-level
   tables are the documented next step if order volume outgrows it. */

export const dbEnabled = Boolean(process.env.DATABASE_URL);

let pool: Pool | null = null;
let schemaPromise: Promise<void> | null = null;

export function getPool(): Pool {
  if (!pool) {
    const url = process.env.DATABASE_URL!;
    const local = /localhost|127\.0\.0\.1/.test(url);
    pool = new Pool({
      connectionString: url,
      ssl: local ? undefined : { rejectUnauthorized: false },
      max: 3,
    });
  }
  return pool;
}

export function ensureSchema(): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = getPool()
      .query(
        `CREATE TABLE IF NOT EXISTS trac_docs (
           key TEXT PRIMARY KEY,
           doc JSONB NOT NULL,
           updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
         )`
      )
      .then(() => undefined);
  }
  return schemaPromise;
}

export async function readDoc<T>(key: string): Promise<T | null> {
  await ensureSchema();
  const r = await getPool().query<{ doc: T }>(
    "SELECT doc FROM trac_docs WHERE key = $1",
    [key]
  );
  return r.rows[0]?.doc ?? null;
}

export async function writeDoc(key: string, doc: unknown): Promise<void> {
  await ensureSchema();
  await getPool().query(
    `INSERT INTO trac_docs (key, doc, updated_at) VALUES ($1, $2, now())
     ON CONFLICT (key) DO UPDATE SET doc = EXCLUDED.doc, updated_at = now()`,
    [key, JSON.stringify(doc)]
  );
}
