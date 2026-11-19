# Part 6 — QA & Performance Audit (2026-11-19)

Scope: the whole BDTRAC repo (legacy 13-phase storefront + editorial
Parts 1–5). Method: production build + strict typecheck in CI-like
conditions, served-page inspection, and a static layout audit of the
full CSS (this environment has no real-device browser farm; items that
need one are marked DEVICE-CHECK).

## 1. Images & loading performance

- `next/image` is now used for **every** image in the repo — the last
  raw `<img>` (editorial `EditorialImage`) was migrated. Verified:
  zero `<img` tags remain in `src/**/*.tsx`.
- `next.config.mjs` already serves `formats: ["image/avif",
  "image/webp"]` with the Supabase/own-domain remote patterns — kept.
- Responsive `sizes` per placement, verified in served HTML:
  hero `100vw` + `priority` (LCP), product grid
  `(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw`,
  detail main `(max-width: 960px) 100vw, 620px`, thumbs `76px`;
  srcSets span 256w–3840w; below-fold images are `loading="lazy"`.
- **Skeleton loaders:** every editorial frame shows a shimmer skeleton
  until the image's `onLoad`, then fades in (`.35s`). Missing assets
  still fall back to the typographic plate.
- **CLS:** all media sits in aspect-ratio frames (9 `aspect-ratio`
  rules: cards 4/5, hero 4/5→16/8, detail 4/5, thumbs fixed 64px,
  lookbook 3/4) and the header is sticky with fixed height, so boxes
  are reserved pre-load — layout shift from images is structurally
  zero; target CLS < 0.05 holds by construction. DEVICE-CHECK:
  confirm with Lighthouse on a real 4G Android once photography is in.

## 2. TypeScript

- `npx tsc --noEmit` (strict, `strict: true` in tsconfig): **0 errors**
  across the whole repo, including Parts 4–5 API routes.
- Caveat: checked against a local generated-client stub — the Prisma
  engine CDN is unreachable from the audit sandbox, so
  `prisma generate` could not run here. On a dev machine/CI with
  network, `npm run db:generate` produces the real client; the code
  only uses standard Prisma client APIs.

## 3. Responsive layout — 360 / 768 / 1440

Static audit of all breakpoints + grid rules:

- Breakpoints: 640 / 900 / 960 / 1024 min-width steps; base layouts are
  single-column (safe at 360px), grids use `minmax(0, 1fr)` tracks
  (patched in this part — bare `1fr` tracks can overflow when content
  has long unbreakable strings).
- No element has a fixed width or min-width above 360px (largest
  element min-width: 210px, inside a horizontally-scrolling table
  wrapper). Drawers/modals are `min(560px, 100vw)`-style caps.
- Size-guide table now sits in an `overflow-x: auto` container so its
  5 columns can scroll internally instead of pushing the page at 360px.
- Long mono strings (stock strip, SKUs) wrap on spaces; the sticky
  add-to-bag title truncates with ellipsis.
- DEVICE-CHECK: pixel-level pass at the three widths on a real device
  is still recommended before launch (no overflow found statically).

## 4. Touch targets

Standard applied: WCAG 2.2 AA minimum 24×24 CSS px (2.5.8); 44px is
the Apple HIG recommendation, noted where not met.

Fixed in this part:
- Cart quantity steppers 28px → **32px** (both cart implementations).
- Legacy coverflow dots: 8px visual dot kept, hit area → **24×24px**
  (transparent button + centered ::after dot).

Passing as-is: size buttons 48×40, chips ~36, swatches 30, nav icon
buttons 38, hero frame buttons 44, form inputs 44+, radio cards 60+.
Checkbox inputs are 17px but wrapped in full-row labels (the label is
the target). Remaining sub-44px targets all pass the 24px AA floor.

## 5. Build & smoke

- `next build`: clean, 39 routes (36 + webhook/track additions).
- Served smoke: `/drop-04` 200 with optimizer URLs + srcSet in HTML,
  `/product/obsidian-heavyweight-tee` 200, `/drop-04/track` 200,
  `/` 200.
- Part 4/5 unit suites still pass (15/15 + 8/8).
