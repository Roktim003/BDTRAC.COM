/* Data backup (Phase 12) — copies the .data store (catalog, settings,
   orders, users, messages) to backups/<timestamp>/ next to the project.
   Run: npm run backup. Restore: stop the server, copy the files back
   into .data/, start again. See docs/BACKUP.md. */
import { cp, mkdir, readdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const src = path.join(root, ".data");
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const dest = path.join(root, "backups", stamp);

try {
  const files = await readdir(src);
  if (files.length === 0) throw new Error("empty");
  await mkdir(dest, { recursive: true });
  await cp(src, dest, { recursive: true });
  console.log(`Backed up ${files.length} data files → backups/${stamp}/`);
} catch {
  console.log("No .data directory yet — nothing to back up (the store seeds itself on first run).");
}
