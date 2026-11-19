# TRAC Rebuild — Deployment Runbook (Phase 13)

The rebuild is deploy-ready. Production cutover replaces the current
bdtrac.com site, so it runs as a **staging-first** process: deploy to a
preview URL, verify, then point the domain. Estimated hands-on time:
30–45 minutes.

## 0. What you need before starting
- Access to the Vercel account that hosts bdtrac.com (team `roktim003`).
- Access to the Supabase project (for the Postgres connection string) —
  or a free Neon database; either works.
- Two secrets you invent/store safely (password manager):
  `ADMIN_PASSWORD` (your /admin login) and `AUTH_SECRET`
  (generate: `openssl rand -hex 32`, or any 40+ random characters).

## 1. Create the database (5 min)
Supabase route: Project → Settings → Database → Connection string (URI,
"Transaction" pooler is fine). It looks like
`postgres://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres`.
Nothing else to create — the app creates its `trac_docs` table and seeds
the catalog/settings on first request.

## 2. Deploy to staging (10 min)
1. Vercel → Add New → Project → upload/import THIS project
   (`trac-store-phase13.zip` contents, or the project folder).
2. Framework preset: Next.js (vercel.json already sets region `sin1` —
   Singapore, the closest Vercel region to Bangladesh).
3. Environment Variables (Production + Preview):
   - `DATABASE_URL` = the connection string from step 1
   - `ADMIN_PASSWORD` = your chosen admin password
   - `AUTH_SECRET` = your generated secret
   - `NEXT_PUBLIC_SITE_URL` = `https://www.bdtrac.com`
   - Optional (password-reset email): `RESEND_API_KEY`, `MAIL_FROM`
4. Deploy. You get a `*.vercel.app` staging URL — the live domain is
   NOT touched yet.

## 3. Verify staging (10 min) — the go/no-go gate
- `GET <staging>/api/health` → `{ "ok": true, "storage": "postgres", "products": 8 }`
  (storage MUST say postgres; "file" means DATABASE_URL didn't apply).
- Place a test order end-to-end (COD) → check Admin → Orders.
- Log into /admin with ADMIN_PASSWORD; edit a price; confirm the PDP
  shows it (this proves DB writes work).
- Sign up a test account; request a password reset (with Resend vars
  set, the email arrives; without them, the link is in the users doc
  outbox for manual handling).
- Browse the staging site on a phone: hero, shop filters, PDP, cart,
  checkout. This is the visual pass that couldn't run in the build
  environment.

## 4. Load the real business data (Admin, 10 min)
- Delete the 5 sample products (Admin → Products) — they are labelled
  `sample-*`; the 3 Ferrari tees are the real live products.
- Fix store addresses/phones (Admin → Settings → Stores) — still the
  October placeholders.
- Add social URLs (Admin → Settings) — footer icons appear automatically.
- Confirm the exchange window: 7 days is the drafted default
  (lib/content.ts `EXCHANGE_WINDOW_DAYS`) — tell Muse to change it, or
  edit that one constant and redeploy.
- Optional: import a fuller catalog — paste product rows via Admin, or
  ask Muse for a bulk import from your Supabase export.

## 5. Cut over the domain (5 min)
In the EXISTING bdtrac.com Vercel project this is a redeploy decision,
not DNS surgery:
- Option A (recommended): in Vercel, open the project that owns
  bdtrac.com and deploy this codebase to it (same project → the domain
  follows automatically, zero DNS changes).
- Option B: deploy as a new project, then move the domain
  (Project → Settings → Domains) from old to new — a few minutes of
  propagation.
Take a backup first (step 6) and keep the old deployment: Vercel keeps
previous deployments — rollback = Deployments → ⋯ → Promote/Rollback to
the previous one (instant).

## 6. Backups & rollback
- Data: the database is the backup target now — enable Supabase
  point-in-time recovery / daily backups in the Supabase dashboard.
  (For file-mode/self-host, `npm run backup` — docs/BACKUP.md.)
- Code: every phase zip is a restore point; Vercel deployment rollback
  is instant (step 5).

## 7. After go-live (first week)
- `npm audit` once in CI/local (couldn't run in the build sandbox).
- Watch /admin orders + Vercel runtime logs for the first orders.
- bKash/Nagad: only after merchant onboarding — then flip the toggles
  in Admin → Settings (gateway wiring is a follow-up project; the
  storefront copy already explains COD-only honestly).
- When Roktim says it's live, Muse verifies the production URL
  (health, sitemap, order flow smoke test) and closes the project.

## Known limits at go-live (accepted, documented)
- Doc-store persistence: whole-store JSON documents in Postgres —
  right-sized for launch volume; row-level tables are the scaling step.
- In-memory rate limits are per-instance best-effort; the login lockout
  is persistent.
- Password resets email only with Resend configured; otherwise support
  sends the link manually from the outbox.
