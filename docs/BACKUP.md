# Backup & Rollback (Phase 12)

## What holds the business data
Everything the store accumulates lives in `.data/` (git-ignored):
`catalog.json` (products/collections), `settings.json`, `orders.json`,
`users.json`, `messages.json`. The code itself seeds these files on first
run if they're absent — deleting `.data` resets the store to the seed
catalog, which is why backups matter once real orders exist.

## Backup
`npm run backup` → copies `.data/` to `backups/<timestamp>/`.
Recommended cadence in production: daily (cron on the host), keeping at
least 14 days. On the production backend (Phase 13, Supabase) this becomes
the platform's point-in-time recovery; this script remains the local/
self-host equivalent.

## Restore
1. Stop the server.
2. Copy the chosen backup's files back into `.data/`.
3. Start the server. Verify /api/health and one product page.

## Code rollback
Every rebuild phase shipped as a zip (`trac-store-phaseN.zip`) and the
project is a normal Next.js app: deploy the previous phase's build to
roll back code. Data files are forward-compatible within this rebuild —
a rollback restores code only; never overwrite newer `.data` with an
older backup unless recovering from corruption (you would lose orders
placed in between).
