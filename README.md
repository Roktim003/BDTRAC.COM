# BDTRAC — TRAC Streetwear Commerce (bdtrac.com)

Next.js 15 + React 19 + TypeScript (strict). Two storefronts in one codebase:

- **Legacy storefront** (`/`, `/products`, `/checkout`, `/track`, `/admin`) —
  the 13-phase rebuild: admin CMS, accounts, doc-store persistence
  (Postgres JSONB when `DATABASE_URL` is set, `.data/` files otherwise).
- **Editorial storefront** (Parts 1–6, Nov 2026) — DROP 04 // CONCRETE &
  MONSOON: `/drop-04`, `/product/[slug]`, `/drop-04/checkout`,
  `/drop-04/track`, backed by a Prisma/PostgreSQL data layer, a bilingual
  EN/BN checkout, a fraud-protected order API, and BD payment / courier /
  SMS integrations. It takes over the canonical paths at cutover.

## Quick start

```bash
npm install
npm run dev            # http://localhost:3000 — no env needed locally
```

Editorial data layer (needs a PostgreSQL `DATABASE_URL`):

```bash
npm run db:validate    # prisma validate
npm run db:generate    # generate the Prisma client
npm run db:push        # create tables
npm run db:seed        # 6 products, 60 variants (idempotent)
npm run build          # prisma generate && next build
```

## Architecture (editorial)

| Area | Where |
|---|---|
| Data models | `prisma/schema.prisma` — Product, ProductVariant, Order, OrderItem, SmsLog (money = integer BDT) |
| BD utilities | `src/lib/bd-utils.ts` — `formatBDT`, BD phone validation/normalization, shipping ৳70 Dhaka / ৳130 outside, free over ৳3,500 |
| Catalog mirror | `src/lib/editorial-catalog.ts` — mirrors the seed exactly until the Prisma read API lands |
| Cart | `src/store/useCartStore.ts` — Zustand, persisted, stock-clamped, `TRAC10` = 10% off |
| Order API | `POST /api/editorial-orders` — shared zod schema, IP + phone rate limits, atomic stock decrement |
| Payments | `POST /api/payments/webhook?provider=sslcommerz\|bkash\|nagad` — verified signatures, idempotent PAID flip |
| SMS | `src/lib/sms.ts` — SSL Wireless / BulkSMSBD adapters, `SmsLog`, log-only until configured |
| Couriers | `src/lib/couriers.ts` — Pathao / Steadfast / RedX mappers, zone routing, credential-gated dispatch |
| Tracking | `GET /api/editorial-orders/track` + `/drop-04/track` — order number + phone credential pair |
| Images | `next/image` everywhere, AVIF/WebP, responsive `sizes`, skeleton shimmer, aspect-ratio frames (CLS-safe) |

## Environment variables

Copy `.env.example` to `.env.local`. Everything fails closed: a missing
secret disables that integration instead of simulating it.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL (Prisma editorial layer + legacy doc-store) |
| `ADMIN_PASSWORD`, `AUTH_SECRET` | Admin CMS + account sessions |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL |
| `RESEND_API_KEY`, `MAIL_FROM` | Transactional email (legacy) |
| `SMS_PROVIDER` | `ssl-wireless` (default) or `bulksmsbd` |
| `SMS_API_KEY` | SMS gateway token (alias for the SSL Wireless API token) |
| `SSL_WIRELESS_API_TOKEN`, `SSL_WIRELESS_SID` | SSL Wireless credentials |
| `BULKSMSBD_API_KEY`, `BULKSMSBD_SENDER_ID` | BulkSMSBD credentials |
| `BKASH_APP_KEY`, `BKASH_APP_SECRET`, `BKASH_USERNAME`, `BKASH_PASSWORD`, `BKASH_BASE_URL` | bKash tokenized checkout (webhook verifies by query-back) |
| `NAGAD_PUBLIC_KEY` | Nagad RSA public key (PEM) for callback verification |
| `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD` | SSLCommerz (IPN `verify_sign` MD5 chain) |
| `STEADFAST_API_KEY`, `STEADFAST_SECRET_KEY` | Steadfast courier (Inside Dhaka default) |
| `PATHAO_CLIENT_ID`, `PATHAO_CLIENT_SECRET`, `PATHAO_USERNAME`, `PATHAO_PASSWORD`, `PATHAO_STORE_ID` | Pathao courier (Outside Dhaka default) |
| `REDX_ACCESS_TOKEN` | RedX courier (fallback) |
| `COURIER_DEFAULT`, `COURIER_FALLBACK` | Optional courier routing overrides |

## Commerce rules (single source of truth)

- Shipping: Inside Dhaka ৳70 · Outside Dhaka ৳130 · **free over ৳3,500**
  (editorial, `bd-utils.ts`). The legacy storefront still uses its admin
  delivery settings until cutover.
- Promo: `TRAC10` = 10% off the editorial subtotal.
- Phones: BD mobiles only, normalized to `+8801XXXXXXXXX`.
- Orders: stock is decremented atomically inside the order transaction;
  order numbers are sequential `TRAC-1025+`.

## Deploy

Vercel (region `sin1`), staging first — full runbook in `docs/DEPLOY.md`.
Set the env vars above, run the four `db:*` commands once against the
production database, then deploy. `vercel.json` is already configured.

## Docs

- `CLAUDE.md` — project conventions and per-part build notes (read first)
- `docs/DEPLOY.md` — staging → production runbook
- `docs/PART6_QA_AUDIT.md` — QA & performance audit (images, CLS,
  responsive breakpoints, touch targets, typecheck)
- `docs/QA_REPORT.md`, `docs/IMPLEMENTATION_PROGRESS.md` — 13-phase log
