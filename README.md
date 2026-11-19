# TRAC — Premium Streetwear Storefront (13-Phase Rebuild, Oct 2025)

The complete rebuild of **bdtrac.com**: Next.js 15 + React 19, server-validated
commerce, customer accounts, a full admin CMS, and production persistence.
Built phase-by-phase with a gate after each phase — see
`docs/IMPLEMENTATION_PROGRESS.md` for the full log and `docs/QA_REPORT.md`
for the final test results (65/65 checks).

## Run it locally

```bash
npm install
npm run dev        # http://localhost:3000
```

No configuration needed locally: data persists to `.data/` JSON files and
the admin password falls back to `admin123` **with a warning banner**
(development only — production fails closed without env vars, see below).

- Storefront: `/` — Shop: `/products` — Product: `/products/<id>`
- Track order: `/track` (order ID + mobile number)
- Account: `/account` — Admin CMS: `/admin`

## How the store runs (no code needed)

Everything commercial is edited in **/admin**: products (prices, photos,
sizes, colours, stock flags), collections, orders + fulfilment status,
delivery charges, promo codes, homepage sections/featured products,
announcement bar, social links, store list, and the brand story.
Changes go live on the next page load — the order engine reads the same
data, so a price edited in admin is the price the next checkout charges.

## Production

Full runbook: **`docs/DEPLOY.md`** (staging-first, ~30–45 min).
In short: set `DATABASE_URL` (Postgres — Supabase/Neon) and all stores
persist there instead of `.data/`; set `ADMIN_PASSWORD` and
`AUTH_SECRET` (the app refuses to run auth without them in production);
optionally `RESEND_API_KEY` + `MAIL_FROM` for password-reset emails.
`vercel.json` pins the Singapore region (closest to Bangladesh).
Migrate existing local data with `npm run db:migrate`.

## Backups

Database backups via Supabase/Neon in production; `npm run backup` for
file mode. See `docs/BACKUP.md`.

## Project docs

- `docs/PROJECT_AUDIT.md` — the live-site audit the rebuild started from
- `docs/DESIGN_SYSTEM.md` / route `/design-system` — the component system
- `docs/ARCHITECTURE.md`, `docs/FEATURE_ROADMAP.md`
- `docs/QA_REPORT.md` — Phase 12 full regression + security results
- `docs/DEPLOY.md` — go-live runbook & rollback

## Notes / accepted limits

- Payments: Cash on Delivery is live. bKash/Nagad toggles exist in admin
  but the gateways wire only after real merchant onboarding — the site
  never simulates a payment.
- The 5 `sample-*` products in the seed catalog are placeholders for
  layout/testing — delete them in admin before go-live; the 3 Ferrari
  tees are the real products (live IDs preserved).
- Store addresses in seed settings are placeholders — fix in
  Admin → Settings → Stores.
