# CLAUDE.md — BDTRAC project rules

> This file is the contract for every change to BDTRAC (`bdtrac.com`).
> (On case-insensitive filesystems this is the same file as `MUSE.md`;
> keep exactly one copy — never create both.)
> Read it before writing code. When a request conflicts with a rule here,
> say so explicitly and record the agreed override in this file.

## 1. What BDTRAC is

- Dhaka-based streetwear eCommerce store. Next.js 15 (App Router) + React 19,
  deployed on Vercel (`vercel.json`, region `sin1`).
- Design inspiration: the editorial minimalism of `turn1.in` — layout mood
  only. **100% original code, copy and assets. Never copy `turn1.in` source
  code, logos, images or text, and never copy any other site's assets.**
  BDTRAC's own product photos, prices and product IDs are the real data.
- Live URL structure is preserved: shop is `/products`, product pages are
  `/products/<uuid>`, `/shop` permanently redirects to `/products`.

## 2. Brand rules (non-negotiable)

### Colour — use the tokens, never hardcode hex in components

| Token | Value | Name / use |
| --- | --- | --- |
| `--color-background` (`--color-bg`) | `#F7F6F2` | Gallery Off-White — page background |
| `--color-surface` | `#EFECE6` | Warm editorial surface — cards, inputs, panels |
| `--color-ink` | `#0D0D0D` | Obsidian — primary text |
| `--color-border` (`--color-line`) | `#E2E0D8` | Hairline borders |
| `--color-accent` | `#D9381E` | Industrial Crimson — CTAs, sale, focus |

Canonical definitions live in `src/app/globals.css` (Part 1 block) and the
extended system (spacing, radius, shadow, motion, breakpoints) lives in
`src/app/tokens.css`. Change a colour in both places, in the same commit.

### Typography — three-font system (configured in `src/app/layout.tsx`)

- **Space Grotesk** (`--font-display`, `--font-body`) — display headlines and
  primary UI text. Editorial, uppercase labels use `--tracking-label`.
- **JetBrains Mono** (`.font-spec`, `--font-mono`) — all spec data: GSM,
  SKU, measurements, order numbers. Tabular numerals.
- **Noto Sans Bengali** (`.font-bn`, `:lang(bn)`, `--font-bengali`) — all
  Bengali copy: bilingual checkout, SMS/notification text, `lang="bn"` spans.

Fonts are self-hosted through `next/font/google` — no `<link>` to Google
Fonts and no external font requests at runtime.

### Voice and data honesty

- Prices are BDT (৳), formatted through the helpers in `src/lib` — never
  hand-format amounts in components.
- No fake products, fake discounts, fake store addresses or fake reviews.
  If real data is missing, render nothing (or an honest empty state), and
  flag the gap — do not invent it.
- Cash on Delivery is the default payment story; bKash/Nagad are only shown
  when a real merchant integration is configured.

## 3. Project structure (src/ layout, Part 1)

```
src/
  app/                  routes, layouts, globals.css, tokens.css, api/
    api/                route handlers (account, admin, auth, contact,
                        health, orders) — validate all input with zod
  components/
    storefront/         public storefront components (new work goes here)
    checkout/           checkout-only components (new work goes here)
    ui/                 shared UI primitives (legacy, token-driven)
    *.tsx               legacy shared components — migrate, never duplicate
  lib/                  server/data layer, stores, helpers (existing)
  store/                Zustand client stores (UI state only — see §4)
  types/                shared foundation types (Locale, Money, Sku, Gsm…)
prisma/                 (arrives with the data-model part — see §4)
docs/                   DEPLOY.md is the production runbook
scripts/                backup + DB migration utilities (plain .mjs)
```

Import alias: `@/*` maps to `./src/*` (tsconfig `paths`). No relative
`../../` imports across folders.

## 4. Stack and data rules

- Installed foundation packages (Part 1): `zustand` (client UI state),
  `lucide-react` (icons — the only icon source; no inline SVG icon sets),
  `zod` (runtime validation), `@prisma/client` (data layer, next parts).
- **Zustand owns ephemeral UI state only** (open overlay, drawer, menu) —
  see `src/store/ui-store.ts`. Server data never goes in Zustand.
- **Zod validates every external boundary**: API route bodies, query
  params, form submissions, env vars. Parse, don't cast.
- **Prisma** (landed in Part 2): schema in `prisma/schema.prisma`
  (Product, ProductVariant, Order, OrderItem, SmsLog — money is Int BDT,
  phones stored normalized, status fields are enums). Prisma 7 rules:
  generator is `prisma-client` with `output = "../src/generated/prisma"`,
  the datasource has NO url (connection lives in `prisma.config.ts`,
  which loads `.env` via dotenv), and the client singleton in
  `src/lib/prisma.ts` is built with the `@prisma/adapter-pg` adapter.
  CLI is the `prisma` package pinned to the client version (7.10.1);
  commands: `npm run db:validate | db:generate | db:push | db:seed`.
  The generated client is gitignored and regenerated per build
  (`npm run build` runs `prisma generate` first). Until the route-by-route
  migration lands, the existing Postgres doc-store in `src/lib/db.ts`
  (`pg`, JSONB) remains the live data layer — do not half-migrate tables.
- **BD utilities** (`src/lib/bd-utils.ts`, Part 2): canonical `formatBDT`,
  BD phone zod schema/normalizer (+8801[3-9]…), and the backend shipping
  rates — Inside Dhaka ৳70, Outside Dhaka ৳130, free when subtotal is
  OVER ৳3,500. NOTE: the live storefront still uses `src/lib/shipping.ts`
  rates (৳60/৳120, free ≥ ৳1,500); the two must not be mixed in one
  calculation, and switching the storefront to the Part 2 rates needs an
  explicit decision.
- Icons: `lucide-react` only, sized via props, `aria-hidden` when decorative.

## 5. Strict TypeScript standards

- `strict: true` stays on (tsconfig). Never loosen a compiler flag to make
  an error go away — fix the type.
- **No `any`.** Unknown data is `unknown` until a zod schema or a type guard
  narrows it. No `as` casts on external data.
- `import type { … }` for type-only imports (`isolatedModules` is on).
- Exported functions and React components declare explicit prop/return
  types. Props interfaces are named `<Component>Props`.
- Prefer `readonly` on shared data shapes (see `src/types`) and string
  union types over `enum` for UI-level values.
- Non-null assertions (`!`) need a one-line comment proving why it is safe.
- Every API handler returns typed JSON and an explicit status code; errors
  are objects with a `error` message string — never a bare thrown string.
- File naming: components `PascalCase.tsx`, stores `kebab-case-store.ts`,
  types and lib modules `camelCase.ts` (legacy files keep their names
  until they are migrated).

## 6. Workflow (per part / phase)

1. Build the part, keep the change scoped to what was asked.
2. Gate: `npm run build` must pass clean (TypeScript + lint) before upload.
3. Push to GitHub `Roktim003/BDTRAC.COM` (`main`) and verify the commit.
4. Upload a zip of the cumulative project to Google Drive folder
   **BDTRAC WEB** and verify the file is listed there.
5. Report: what changed, gate result, commit SHA, Drive file name — plus
   any honest caveats (what was not verified, what data is still missing).

## 7. Known state at Part 1 (2026-11-19)

- Codebase migrated from root `app/ components/ lib/` to `src/…`;
  all `@/` imports resolve unchanged via tsconfig paths.
- Fonts changed from Archivo/Inter to the three-font system in §2;
  colour tokens changed to the §2 palette (previous accent was `#D62B2B`).
- The project does **not** use the Tailwind framework; design tokens are
  CSS variables using Tailwind-style token names. Adding Tailwind itself
  is a separate, explicitly-approved step if a later part requires it.
- Production `bdtrac.com` still serves the previous site; deploying this
  codebase follows `docs/DEPLOY.md` and is a separate approved step.
- Part 3 (2026-11-19): editorial storefront in src/components/storefront
  (Navbar, EditorialHero, ProductGrid, ProductDrawer, EditorialShell),
  assembled at /drop-04; slug PDPs at /product/[slug] (SSG). Editorial
  data mirrors the Prisma seed via src/lib/editorial-catalog.ts and the
  editorial bag is the zustand bag-store (separate from the legacy cart
  until the Prisma checkout lands). SiteShell routes /drop-04 and
  /product/* to EditorialShell; all other routes keep the legacy Shell.
  Product photography is not shot yet — EditorialImage renders a
  typographic frame instead of a broken image. Size-guide measurements
  are the studio reference for the boxy block, pending pattern sign-off.
- Part 2 (2026-11-19): Prisma data layer + bd-utils added (see §4).
  Seed (`prisma/seed.ts`) holds 6 original TRAC products, 320–480 GSM,
  10 variants each. Known verification limit: the Prisma engine CDN is
  unreachable from the Muse VM, so `prisma validate/generate` and the
  seed itself run on Roktim's PC / Vercel (DATABASE_URL required);
  in-VM gates were tsc (clean except the two expected generated-client
  import errors before generate), 29/29 bd-utils unit tests, and static
  schema/seed checks.
