# TRAC — Project Audit (checked 2026-10-25)

## 1. Current architecture summary
- **Live site bdtrac.com** (verified live 2026-10-25): Next.js App Router on Vercel (`www` redirect), product images on Supabase Storage bucket `ahrmcqirkteiphoaldyq`, logo `/trac-logo.png`, hero video `/hero-image.mp4` + poster.
- **Live homepage today:** hero video + "Shop Now", a single "New In" row — only 3 live products visible, all Ferrari tees at ৳699 (one with ৳899 compare-at, −22%).
- **Existing Muse rebuild `~/workspace/trac-store`** (2026-10-19, Next.js 15 + React 19, plain CSS): floating bluorng-style header, video hero, 3D coverflow, product pages, shop filters, cart drawer, COD checkout (client-side), contact, search, stores. Production build passed, all routes 200. Orders are NOT yet posted to Supabase (TODO in checkout), store addresses were placeholders, 5 of 8 catalog items are samples reusing real photography.
- **Inspiration bluorng.com** (verified live 2026-10-25): Shopify, editorial "Latest drop" rows, sold-out labelling, stores section, connect footer. Principles to adopt: editorial layout, photography-first, minimal UI — NOT its code, images, or assets.

## 2. Existing features inventory (live + prior rebuild)
Hero video, product grid/detail, category rows, cart (localStorage), COD checkout form with BD phone validation, search overlay, wishlist (rebuild), store locator (rebuild, placeholder data), contact page.

## 3. Current UI/UX weaknesses
- Live homepage has no collection storytelling, no category browsing, no brand story, no featured-collection editorial — it reads as a product list, not a fashion storefront (exactly what Phase 3 of the master prompt targets).
- No visible filters/sorting/search depth on live; no size-guide, no delivery transparency on product pages.
- Prior rebuild's visual identity predates the new design tokens in this prompt (off-white #F6F5F1 / near-black #111 / racing red #D62B2B).

## 4. Functionality that must be preserved
Real product IDs/URLs (`/products/<uuid>` for the 3 live products), Supabase image URLs, hero video, BDT pricing, COD, BD phone format, existing customer/order data in Supabase (never migrated destructively).

## 5. Technology recommendations
Keep the proven stack — do NOT replace the backend: Next.js App Router + TypeScript + Supabase (Postgres + Storage, as already in production), deploy on Vercel as today. The master prompt's greenfield list (Prisma/Auth.js/etc.) is unnecessary churn; Supabase Auth covers Phase 8. Add Tailwind or keep CSS modules — decide in Phase 1; design tokens in DESIGN_SYSTEM.md are stack-agnostic.

## 6. Data migration risks
Low if stack is kept: no migration needed. Main risks: (a) 5 sample products leaking into production, (b) placeholder store addresses, (c) checkout orders currently client-side only — must be server-validated (price/stock) before any relaunch, (d) any URL change needs permanent redirects for the 3 live product UUIDs.

## 7. Phase 1 plan (Foundation & Design System) — summary
Tokens first (type scale, colours, spacing, breakpoints), then the 18 shared components listed in the prompt, each accessible (focus rings, semantic HTML, reduced-motion) and responsive at 360/768/1024/1440. Gate: components documented + demo pages render identically in the new tokens. Full plan: IMPLEMENTATION_PROGRESS.md + DESIGN_SYSTEM.md.

## 8. Component architecture (proposed)
`components/ui/` (Button, IconButton, Input, Select, Badge, Modal, Drawer, Accordion, Tabs, Toast, Skeleton, EmptyState, Pagination, Breadcrumbs) · `components/shop/` (ProductCard, CollectionCard, Gallery, SizeSelector, Price) · `components/layout/` (AnnouncementBar, Header, NavDropdowns, MobileMenu, Footer) · `lib/` (catalog, cart, checkout, shipping — business rules server-side).

## 9. Design tokens (proposed, from prompt §2)
See DESIGN_SYSTEM.md — implemented already in the demo (`index.html :root`).

## 10. Roadmap & dependencies
13 phases as per master prompt, one at a time, stop-and-approve after each. Dependencies: full real catalog export from Supabase (before Phase 4), approved policy texts (Phase 10), payment merchant confirmation for bKash/Nagad/cards (Phase 7 — never simulate success), real store addresses (Phase 2 footer/locator).
