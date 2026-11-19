# TRAC — Design System (Phase 1, implemented)

Source of truth in code: `app/tokens.css` (tokens) + `components/ui/` (components) + the
`ui-` section of `app/globals.css`. Live showcase: `/design-system` (noindex).

## Tokens
- **Colour:** bg `#F6F5F1`, surface `#FFFFFF`, surface-2 `#EFEDE7`, ink `#111111`, ink-2 `#3D3D3A`,
  muted `#6F6F6A`, neutral `#A3A3A3`, line `#E4E1D9`, accent (racing red) `#D62B2B`, accent-dark
  `#B81F1F`, accent-soft `#FBECEC`, success `#1E7D46`, warning `#B7791F`, error `#B3261E`,
  info `#175CD3`, focus = accent. Accent is rationed: CTAs, sale badges, focus rings, small highlights.
- **Type:** display = Archivo (500–900), body = Inter (400–700). Scale tokens: `--text-hero`
  clamp(3rem, 9vw, 7.375rem), `--text-display`, `--text-h2`, `--text-h3`, product 15px, body 16px,
  sm 14px, xs 12px, price 16px. Uppercase labels use `--tracking-label` 0.12em.
- **Layout:** container 1280px (wide legacy pages 1440px), gutters 24px / 14px mobile, grid gap 18px,
  section rhythm 64px, header height 76px. Breakpoints: 480 / 640 / 768 / 1024 / 1280 / 1536.
- **Spacing:** 4px base scale `--space-1…20`. **Radius:** 10 / 14 / 20 / pill. **Shadows:** sm/md/lg.
- **Motion:** 150 / 250 / 400ms, ease `cubic-bezier(.22,.61,.36,1)`; `prefers-reduced-motion`
  disables transitions/animations globally.

## Components (`components/ui/`, barrel `index.ts`)
| File | Components |
|---|---|
| primitives.tsx | Button (primary/dark/ghost/light × sm/md/lg), IconButton, Badge (dark/red/light/success), Field, Input, Select |
| overlay.tsx | Modal, Drawer (left/right) — Escape + scrim close, focus-in on open, focus restore, scroll-lock |
| navigation.tsx | Accordion, Tabs, Breadcrumbs, Pagination |
| feedback.tsx | ToastProvider + useToast, EmptyState, ErrorState, Skeleton (lines + card) |
| cards.tsx | ProductCardUI (alt-image hover, real-state badges, colour dots, wishlist, Quick Add), CollectionCard |
| Gallery.tsx | Gallery — thumbnails, arrow-key navigation |
| Showcase.tsx | Living documentation used by `/design-system` |

## Conventions
- All UI classes are prefixed `ui-` so they never collide with legacy page styles.
- Components consume tokens only — no hardcoded colours/sizes that a token covers.
- Legacy variables (`--black`, `--white`, …) remain as aliases for pre-Phase-1 pages; new code must not use them.
- Existing `components/ProductCard` stays in service until Phase 4 migrates the catalog to `ProductCardUI` tokens (already aligned: it now sits on token bg + red sale badge).

## Accessibility (Phase 1 implementation)
Visible `:focus-visible` ring (accent, 2px), semantic landmarks/headings, aria labels on icon
buttons, `role=dialog aria-modal` + labelled overlays, `aria-expanded/selected/current/pressed`
where applicable, labelled form fields with `aria-describedby` error wiring, ≥40px touch targets
(44px primary controls), colour contrast: ink on off-white ≈ 15:1; white on racing red ≈ 4.6:1
(bold/large use). Full WCAG 2.2 AA audit is Phase 11.
