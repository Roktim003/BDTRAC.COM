# Implementation Progress — TRAC Premium Rebuild

Workflow per phase: Inspect → Plan → Implement → Test → Review → Document → Stop for approval.

## Pre-work — Audit + Demo (2026-10-25) ✅
Live audit of bdtrac.com / bluorng.com + existing codebase (see PROJECT_AUDIT.md).
Demo v2 (photo-exact floating header + TRAC video hero) approved by Roktim as the visual reference.
Stack decision: keep Next.js + Supabase + Vercel.

## Phase 1 — Foundation & Design System (2026-10-25) ✅ COMPLETED
- **Plan:** tokens first (colour/type/spacing/layout/radius/shadow/motion/z-index), then the 18
  shared components from the master prompt, all `ui-`-prefixed to protect legacy pages; verified
  via a living `/design-system` showcase route.
- **Implemented:**
  - `app/tokens.css` — full token set (Master Prompt §2 palette, Archivo/Inter type scale,
    breakpoints 480–1536 documented).
  - `app/layout.tsx` — fonts extended (Archivo 400–900 + Inter 400–700).
  - `app/globals.css` — tokens imported; body now token bg/ink + Inter body / Archivo headings;
    global `:focus-visible` ring, accent selection, `prefers-reduced-motion` support; legacy sale
    badge moved to racing red; ~200-line `ui-` component stylesheet appended.
  - `components/ui/` — primitives (Button, IconButton, Badge, Field, Input, Select), overlay
    (Modal, Drawer), navigation (Accordion, Tabs, Breadcrumbs, Pagination), feedback (Toast,
    EmptyState, ErrorState, Skeleton), cards (ProductCardUI, CollectionCard), Gallery, barrel
    export, and `Showcase.tsx`.
  - `app/design-system/page.tsx` — showcase route (noindex).
  - `docs/` — PROJECT_AUDIT, ARCHITECTURE, FEATURE_ROADMAP copied in; DESIGN_SYSTEM written.
- **Tests:** `npm run build` clean (TypeScript + lint pass; 9/9 pages generated; `/design-system`
  6.32 kB). Production server route check: `/`, `/design-system`, `/products`, `/products/<real-id>`,
  `/cart`, `/checkout`, `/contact` all **200**; showcase HTML contains the token swatches and live
  components; homepage hero video intact.
- **Known limitations:** legacy pages still use pre-Phase-1 component styles internally (they sit on
  the new tokens, migration happens phase-by-phase: header/footer Phase 2, catalog Phase 4, PDP
  Phase 5). Modal/Drawer focus management is basic (focus-in + restore + Escape), full focus-trap
  hardening is scheduled with the Phase 12 security/QA pass. No visual screenshot check in this
  environment — first visual pass of `/design-system` is Roktim's.
- **Status: COMPLETED** — stopped for approval. Next: Phase 2 (Header, Navigation & Footer).

## Phase 2 — Header, Navigation & Footer (2026-10-25) ✅ COMPLETED
- **Inspect findings:** header Account/Wishlist buttons were dead (no action); footer Help links
  all pointed at /contact under misleading labels, socials were `href="#"`, phone was a
  `+880 1XXX` placeholder; stores "Get Direction" links were `#`. Shop page already read `?cat=`
  but did not re-sync when navigated to while mounted, and had no "Newest" sort.
- **Implemented:**
  - `lib/site.ts` — central config: announcement (capability built, **default OFF** to preserve the
    approved photo interface; admin-controlled in Phase 9), socials (empty = hidden, never `#`),
    newsletter toggle. `lib/site` also derives nav from the real catalog: `shopLinks` (only
    categories with products) and `collectionLinks` (Latest Drop / On Sale — honest derived views;
    named collections wait for a catalog collection field).
  - Header: New Drops / Shop ▾ / Collections ▾ / About TRAC per prompt §2.2; dropdowns work on
    hover, click and keyboard (aria-expanded, Escape); compact 60px bar on scroll; announcement slot;
    stores pin, search, **Account → /account**, **Wishlist → /wishlist with live count badge**, bag.
  - `lib/wishlist.tsx` + product-card bookmark toggle + `/wishlist` page (guest, localStorage
    `trac-wishlist-v1`) — pulled forward from Phase 6 so the header icon is real, not a placeholder.
  - `/account` interim page — states plainly that accounts arrive in Phase 8 and guest checkout
    works today (no fake sign-in form).
  - `/about` interim brand page (Phase 10 expands with approved copy).
  - Mobile menu: expandable Shop accordion, Collections group, Search / Account / Wishlist (with
    count) / About / Contact; Escape closes.
  - Footer rebuilt: brand + newsletter (interim client-side confirmation, copy says subscriptions
    open later — backend in Phase 3/9), Shop + Collections columns from the same derived nav,
    Support column with only real routes; fake phone and `#` socials removed; policy links hidden
    until Phase 10 publishes approved text.
  - Shop page: URL params now stay in sync (`?cat=`, `?sort=` incl. new **Newest** sort).
  - Stores cards: direction links now open a real Google Maps search (data itself still placeholder).
- **Tests:** production build clean (12/12 pages; new routes /about, /account, /wishlist). Prod
  server check: 10 routes incl. `/products?cat=polos&sort=new` all **200**; SSR HTML contains the
  dropdown menus (Latest Drop / On Sale), About and Account content; zero `href="#"` left in
  components after the Stores fix.
- **Known limitations / inputs needed from Roktim:** (1) store addresses + phones in
  `components/Stores.tsx` are still the October placeholders — need the real ones; (2) real social
  profile URLs for `lib/site.ts` (footer shows them automatically once set); (3) announcement bar is
  built but disabled by design until there's a real campaign to announce.
- **Status: COMPLETED** — stopped for approval. Next: Phase 3 (Premium Homepage).

## Phase 3 — Premium Homepage (2026-10-25) ✅ COMPLETED
- **Conflict stated + resolved:** prompt §3.1 asks for a hero headline + CTA buttons ("BUILT FOR
  THE BOLD"). Roktim's approved interface (demo v2, confirmed twice) is the minimal video hero with
  only the underlined "Shop now". **His approval wins for appearance; the prompt wins for
  capability** — the headline treatment is fully built and config-switchable, default OFF.
- **Implemented:**
  - `lib/homepage.ts` — homepage config layer (§3.9 foundation; Phase 9 CMS will edit this data):
    hero media + CTA + optional headline, section order/visibility, editorial content, curated
    Featured Product IDs, brand-story copy.
  - Hero now config-driven; "Shop now" → `/products?sort=new` (was an in-page anchor).
  - Homepage renders sections in config order: Latest Drop (existing 3D coverflow, isNew-first,
    shows name/price/compare-at/sold-out; Quick Add path = Quick View size picker) → Featured
    editorial ("The Ferrari Tees — Engineered For Motion", config-driven, real product photo) →
    **Shop by Category** (new: cards generated from real catalog categories with their own product
    photography + counts) → **Featured Products** (§3.5: no sales data exists, so the prompt's
    curated fallback — the 3 real live products + 1 sample) → **Brand Story** (new dark panel,
    "Not Just Another T-Shirt.") → Stores.
  - Removed the old generic T-Shirts / Polos & Hoodies rows (superseded by Category cards +
    Featured grid — nothing lost, categories remain one tap away).
  - Newsletter (§3.8): served by the Phase 2 footer form (interim client-side, honest copy);
    no duplicate homepage form.
- **Deliberately omitted:** Community Gallery (§3.7) — no approved customer/brand social photos
  exist, and stock imagery passed off as community content would be fabrication. Section can be
  enabled when TRAC supplies approved photos.
- **Data gaps noted:** catalog products have no colour data, so Latest Drop cards can't show
  colour dots yet (the Phase 1 ProductCardUI supports them); colours join the catalog schema in
  Phase 4. Store data remains placeholder (Roktim's real addresses still needed).
- **Tests:** production build clean (12/12 pages). Prod server: `/` 200 with all six sections in
  SSR HTML (Latest Drop, editorial, Shop by Category, Featured Products, brand story, hero video,
  Shop now); regression routes /products, /about, /wishlist, /design-system all 200.
- **Status: COMPLETED** — stopped for approval. Next: Phase 4 (Product Catalog & Collections).

## Phase 4 — Product Catalog & Collections (2026-10-25) ✅ COMPLETED
- **Schema extended** (`lib/products.ts`): every product now carries `colors` ({name, hex} —
  curated from its photography, admin-editable Phase 9), `sizes` (the sizes it is actually offered
  in), `fit` (Oversized/Regular/Relaxed, from its own description) and `collection` slug.
  PDP + Quick View now read `product.sizes` instead of a global list, so filters, PDP and cart can
  never disagree. Collections data added: **Racing Series** (6 products) and **Essentials** (2).
- **Shop page rebuilt:** filters for Category, Collection, Size, Colour, Fit, Price range and
  In-stock — every option derived from the catalog (a filter with zero applicable products is
  never offered; price ranges computed from real prices). Sorts: Featured, Newest, Low→High,
  High→Low, Biggest Discount (Bestselling omitted — no sales data exists; the prompt forbids
  inventing it). All state is URL-synced both ways (`?cat=&col=&size=&color=&fit=&price=&avail=&sort=`)
  so filter links are shareable and header/footer navigation re-syncs a mounted page. Empty state
  with one-tap Clear; incremental Load-More pagination (page size 8).
- **Collection landing pages** `/collections/[slug]`: banner, description, breadcrumbs, product
  grid with sort + in-stock filter, per-collection SEO metadata (title/description/OpenGraph),
  statically generated; unknown slug → 404.
- **Nav updated automatically:** header/footer Collections menus now list the real collection
  pages (Racing Series, Essentials) alongside Latest Drop / On Sale.
- **Product cards** now show colour dots (with accessible colour names).
- **URL decision (§4.6):** the prompt's example suggests `/shop` + slug product URLs, but live
  bdtrac.com runs on `/products` + `/products/<uuid>` — existing live URLs win (data-preservation
  rule). `/shop` permanently redirects (308) to `/products`; collection pages use slugs.
- **Known limitation:** stock is product-level (`soldOut`), not per-variant — the size filter
  therefore matches *offered* sizes. True per-variant inventory arrives with the Phase 9 admin /
  inventory schema, and checkout re-validates server-side in Phase 7.
- **Tests:** build clean (14 routes; both collection pages SSG). Data checks: racing=6,
  essentials=2 product assignments. Prod server: both collections 200, bad slug 404, /shop → 308 →
  /products, /, /products, /wishlist 200; header SSR now contains Racing Series links.
- **Status: COMPLETED** — stopped for approval. Next: Phase 5 (Premium Product Detail Page).

## Phase 5 — Premium Product Detail Page (2026-10-25) ✅ COMPLETED
- **Architecture:** PDP split — `app/products/[id]/page.tsx` is now a **server component**
  (per-product metadata: title, description, canonical, OpenGraph, Twitter card; Product +
  BreadcrumbList JSON-LD with BDT price and true availability). Interactive UI moved to
  `components/ProductDetail.tsx`. Invalid product id → 404 (verified).
- **Gallery (§5.1):** existing 3D tilt kept; added click-to-zoom pan view, touch swipe,
  keyboard arrows, descriptive alt text, aria labels on thumbs.
- **Purchase panel (§5.2/§5.4):** availability line (In stock / Sold out), colour selector
  (swatches from the Phase 4 schema — presentational; photography is per-product, not per-colour),
  fit note per product, **size now starts unselected** — Add to Bag / Buy Now without a size shows
  a helpful error and scrolls to the selector (invalid-selection scenario from the phase gate).
  Sold-out products disable sizes and all purchase buttons. Buy Now (adds + goes to checkout),
  Wishlist toggle (Phase 2 system), quantity capped at 9, **sticky mobile purchase bar**.
- **Size Guide modal:** fit guidance + between-sizes advice. NO garment measurements are printed
  — none have been verified; the modal says so plainly. **Input needed from Roktim: measured
  chest/length per size** to complete the guide (§5.3 requires verified measurements only).
- **Delivery (§5.5):** rates extracted to `lib/shipping.ts` (Inside Dhaka ৳60 / 1–2 days,
  Outside ৳120 / 3–5 days, free ≥ ৳1,500 — the store's existing cart values); cart page now imports
  the same constants; PDP panel + shipping accordion read them too. **Discrepancy flagged:**
  checkout still charges a flat ৳60 regardless of zone — Phase 7 fix item #1 (checkout is Phase 7
  scope; not silently changed here).
- **Recommendations (§5.6):** "More from {Collection}" row + "You May Also Like" (same category,
  de-duplicated, self excluded).
- Small fix: the old accordion toggle rendered a literal "&minus;" string; now a real −.
- **Tests:** build clean (14 routes). Prod server: PDP 200 with per-product <title>, canonical,
  2 JSON-LD blocks (BDT 699 offer verified), availability/Size Guide/Buy Now in SSR; sold-out PDP
  shows "Sold out — back soon"; bad id 404; /, /products, collection, /cart, /wishlist all 200.
- **Status: COMPLETED** — stopped for approval. Next: Phase 6 (Search, Wishlist & Discovery).

## Phase 6 — Search, Wishlist & Discovery (2026-10-25) ✅ COMPLETED
- **Search engine** (`lib/search.ts`): ranked, AND-token semantics; field weights name >
  category/collection > colour/fit > description; **typo tolerance** via 1-edit Levenshtein
  fallback against product-name words; deterministic ties (New first, then name).
  Verified by direct execution: "ferrari"→6 ranked (3 name matches first, then description
  matches), "ferari" (typo)→6, "hoodie"→2, "black"→7 (colour), "zzzz"→0; grouped matches
  racing→Racing Series (6), t-shirts→T-Shirts (4).
- **Overlay rebuilt:** compact result rows (thumb, price, compare-at, sold-out), grouped
  category/collection chips with counts, browse state when empty (Latest Drop / On Sale /
  collections / categories — all derived from the live catalog; no invented "trending"
  searches), no-results state with category suggestions, Enter / "See all results" → /search.
- **/search page (§6.3):** shareable `?q=` URL, category chips, relevance/newest/price sorts,
  in-stock toggle, honest no-results state with "New In Instead" recommendations.
- **Recently viewed (§6.5):** `lib/recent.ts` (device-local, cap 8, recorded on PDP view);
  Recently Viewed rows on the homepage (config section, self-hiding) and the search page.
- **Wishlist (§6.4):** per-item size picker + Add to Bag (moves the item out of the wishlist,
  opens the bag; size required with inline error), Remove, current price/sold-out state via the
  live catalog cards, **shareable wishlist link** (`/wishlist?ids=…` opens a shared view with
  "Save all to my wishlist"). Account sync remains Phase 8 (needs real accounts).
- **Tests:** build clean (15 routes). Logic tests above all pass. Prod server: /search?q=,
  shared wishlist URL, /, /products, /wishlist all 200.
- **Status: COMPLETED** — stopped for approval. Next: Phase 7 (Shopping Bag & Checkout — Bangladesh).

## Phase 7 — Shopping Bag & Checkout, Bangladesh (2026-10-25) ✅ COMPLETED
- **Server order engine** (`lib/orders.ts` + `POST /api/orders`): the client sends only ids /
  sizes / quantities — **prices are recomputed from the catalog server-side**; sold-out items,
  sizes not offered, and quantities outside 1–9 are rejected with field errors. Order ids are
  generated server-side. **Idempotency-key** support: a retried/double submit returns the
  original order instead of creating a duplicate.
- **API test battery (all 11 pass):** valid order 201 with exact totals (2×৳699 inside Dhaka =
  1398 + 60 = **৳1,458**, phone canonicalised to +880…); **tampered client price (price:1)
  ignored**; sold-out → 400; invalid phone → 400; duplicate submit → 200 same order id;
  outside Dhaka ৳1,499 + 120 = **৳1,619**; subtotal ≥ ৳1,500 → delivery 0; invalid size → 400;
  inactive promo → 400; payment=bkash → 400 ("Only Cash on Delivery"); order lookup by id+phone
  200, wrong phone 404.
- **BD phone rules** (`lib/bd.ts`): accepts 01…/880…/+880… formats, normalises to +8801…,
  valid operator prefixes 013–019 only. Divisions + all 64 districts data included.
- **Checkout rebuilt:** full name, mobile, alt mobile, optional email, division → district
  (dependent selects), full address, delivery instructions; **delivery zone radios** (the
  Phase 5 flat-৳60 discrepancy is FIXED — checkout now charges by zone from `lib/shipping`);
  district selection suggests the zone, customer can override; **draft auto-saves locally** and
  restores after interruption; per-field errors (client mirror + server), banner for bag-level
  errors; cart is cleared ONLY on confirmed success — failures keep bag + form intact.
  Confirmation shows the server order: id, lines, delivery, total, ETA, canonical phone.
- **Payments honesty (§7.6):** COD fully functional; bKash/Nagad render disabled as
  "Coming soon" (config `siteConfig.payments`, both false) and the API rejects them — no
  simulated payment anywhere.
- **Bag integrity:** stored cart snapshots are refreshed against the live catalog on load
  (current prices; dead products/sizes dropped); quantities capped at 9 everywhere; cart page
  gained the zone toggle (shared `trac-zone-v1` with checkout, so totals can't drift between
  screens) + sold-out warnings that block checkout until removed. Promo field exists with the
  server mechanism — **no codes are active** (none invented; TRAC adds real ones, Phase 9 admin).
- **Persistence seam (honest limitation):** orders persist to `.data/orders.json` (local /
  self-hosted). On Vercel the FS is ephemeral — at deployment, `saveOrder` swaps to a Supabase
  `orders` insert (the live backend) with the same API contract. Noted in GO-LIVE terms for
  Phase 13. GET /api/orders?id=&phone= lookup is in place for Phase 8 tracking.
- **Status: COMPLETED** — stopped for approval. Next: Phase 8 (Customer Accounts & Order Tracking).

## Phase 8 — Customer Accounts & Order Tracking (2026-10-25) ✅ COMPLETED
- **Guest tracking** (`/track`, footer-linked): order ID + checkout mobile → full status view
  (stepper: Placed → Confirmed → Packed → Shipped → Delivered, cancelled state, lines, totals,
  ETA). The ID+phone pair is the credential — an ID alone reveals nothing (API 404s wrong phone,
  verified in Phase 7). Status model added to orders (`placed|confirmed|packed|shipped|
  delivered|cancelled`); statuses are advanced by the store team (Phase 9 admin).
- **Accounts** (`lib/users.ts` + `/api/auth`, `/api/account`): signup/login/logout, signed
  HMAC httpOnly session cookie (7 days), **scrypt-hashed passwords with per-user salts** —
  verified no plaintext and no hash fields leak in any response. Duplicate email/phone rejected;
  login rate-limited (5 fails → 10-min lock; sequence verified 401×5 → 429).
- **Password reset:** token flow (1-hour, single-use, stored hashed) with `/forgot` + `/reset`
  pages; the request response never reveals whether an email exists. **Email delivery seam:**
  no mail provider is configured in this project, so reset links are written to a server outbox
  (`.data/users.json → outbox`) — production wires the same link through the mail provider /
  Supabase Auth (Phase 13 go-live item). Reset verified end-to-end: token → new password →
  old password rejected, new accepted.
- **Account dashboard** (`/account`): Orders tab (history matched by account phone OR email —
  including guest orders placed with the same phone; expandable status view; **Reorder**
  re-adds still-available items), Addresses tab (book with division/district validation +
  delete), Wishlist tab, Profile tab (name/phone edit with uniqueness checks).
- **Wishlist account sync:** signed-in visitors get server sync — guest + account lists merge
  without duplicates on load, toggles write through. Checkout **prefills** profile + first
  saved address for signed-in customers when no local draft exists.
- **Test battery:** signup 201 (no hash leak), dup email 400, short password 400, guest /me 401,
  session /me 200 (curl cookie jar), account orders linkage, address add/delete, wishlist sync
  (invalid ids filtered), logout → 401, wrong password 401, forgot→outbox token→reset→login,
  rate-limit 429, /track /account /forgot 200. Note: the Python test harness's CookieJar
  wouldn't resend the session cookie (harness quirk) — the full cookie flow was re-verified
  with curl, which browsers match.
- **Persistence note:** same seam as orders — `.data/users.json` locally; production =
  Supabase Auth. The interim /account page and its "accounts are coming" copy are gone.
- **Status: COMPLETED** — stopped for approval. Next: Phase 9 (Admin & CMS).

## Phase 9 — Admin & CMS (2026-10-25) ✅ COMPLETED
- **Architecture change (the point of the phase):** catalog and settings stopped being code.
  `lib/catalogStore.ts` + `lib/settingsStore.ts` are the runtime source of truth (seeded from the
  old code config on first run, persisted to `.data/`). The root layout reads them server-side
  and feeds a `StorefrontProvider`; ~20 storefront consumers were migrated (shop, home, hero,
  editorial, categories, search engine + overlay + page, PDP + recommendations, collections,
  header/footer/mobile nav, stores, wishlist, account, cart/checkout rates, recently-viewed).
  **Admin edits are live on the next page load — no rebuild.** The order engine reads the same
  stores, so price/rate/promo edits apply to new orders immediately.
- **Admin auth:** separate from customer accounts. `ADMIN_PASSWORD` env; when unset, dev fallback
  `admin123` + a prominent warning banner in the admin and a devMode flag from the API
  (production MUST set the env var — Phase 13 checklist). HMAC httpOnly cookie, 12h.
- **Admin UI** (`/admin`, own chrome, storefront header/footer bypassed): Dashboard (product /
  collection / order counts, revenue, recent orders), Products (full CRUD — name, prices,
  category, collection, fit, sizes, colours with swatches, image URLs, description, fabric,
  new/sold-out flags; server-side validation incl. compare-at > price), Orders (list + status
  select feeding customer tracking), Collections (CRUD), Settings (announcement, delivery rates,
  payment toggles, promo codes, hero headline toggle, featured IDs, section visibility, socials,
  store list).
- **E2E test battery (all pass):** unauth admin API 401; wrong password 401; login + devMode;
  seed catalog 8 products / 2 collections; **price edit 699→799 → next order totals ৳859**;
  status set to shipped → guest tracking shows shipped; **delivery rate 60→70 → order total
  follows (869)**; **promo created in admin (TRAC10 10%) → order discount ৳80, total 779**;
  everything restored and re-verified (order back to ৳759, PDP JSON-LD back to 699); dashboard
  revenue exact (3,266 across the 4 test orders).
- Notes: order engine accepts COD only even if an admin enables bKash in settings (the settings
  copy says so) — the gateway itself is a merchant-integration step, never simulated. Product
  images are URL-based (the catalog's photography already lives on Supabase/CDN); media upload
  arrives with the production backend. Stores data moved into settings (still the placeholder
  addresses until TRAC supplies real ones — now editable in the admin, no code needed).
- **Status: COMPLETED** — stopped for approval. Next: Phase 10 (Brand Content & Trust Pages).

## Phase 10 — Brand Content, Trust Pages & Support (2026-10-25) ✅ COMPLETED
- **Content engine** `lib/content.ts`: FAQ groups and all four policies are functions of the live
  settings — delivery figures quoted on /faq and /shipping-policy are interpolated from the same
  settings the checkout charges, so the pages can never drift from reality (verified: pages show
  ৳60 / free at ৳1,500 from settings).
- **New pages (all server-rendered):** /faq (grouped accordion: Orders & Delivery, Payments,
  Sizes & Fit, Returns, Accounts + FAQPage JSON-LD), /shipping-policy, /returns, /privacy,
  /terms. Footer Support column now links all of them (they were hidden until the pages existed);
  PDP delivery box links Returns & Exchange.
- **Policy honesty:** texts describe only implemented behaviour (COD, phone confirmation,
  tracking, guest vs account, no trackers). **One draft business decision flagged:
  `EXCHANGE_WINDOW_DAYS = 7`** in lib/content.ts — size-exchange window used by /returns and the
  FAQ; TRAC to confirm or change before go-live (single constant).
- **About rebuilt:** story now lives in settings (admin-editable, incl. a Story section in Admin →
  Settings) and feeds both the homepage BrandStory and /about; plus design philosophy, fabric &
  quality (GSM claims taken from the catalog's measured fabric data), honest pricing, support
  channels, stores.
- **Contact form fixed:** it previously showed "Message Sent" without sending anything
  (fake success). Now POSTs to /api/contact with server validation, persists to
  .data/messages.json, and is readable in **Admin → Messages** (verified end to end: 201 + stored,
  bad phone → 400 with field error). The fake "+880 1XXX" call line is gone — the page shows real
  store data and only prints a phone when a non-placeholder one is configured.
- Incidental fix: the Phase 9 rewrite of Stores.tsx had dropped its "use client" directive (it
  only worked inside the client-rendered home page); the server-rendered About exposed it and
  it's restored.
- Verified: build clean (29 pages), all 7 content routes 200, FAQ JSON-LD present, contact
  round-trip through admin, footer links live.
- **Status: COMPLETED** — stopped for approval. Next: Phase 11 (Performance, SEO & Accessibility).

## Phase 11 — Performance, SEO & Accessibility (2026-10-25) ✅ COMPLETED
- **SEO:** metadataBase (SITE_URL from `NEXT_PUBLIC_SITE_URL`, default https://www.bdtrac.com) +
  site-wide OG/Twitter defaults with the OG image taken from the live catalog's newest product.
  Canonicals on shop, collections, PDP, about, FAQ, contact and all policy pages. Dynamic
  **sitemap.xml from the live catalog** (verified: 19 URLs = 9 static + 2 collections + 8
  products, updates when the admin changes the catalog). **robots.txt** disallows admin/api/
  account/cart/checkout/track/search/wishlist/design-system. Utility routes got `noindex`
  layouts (verified meta on /cart); /search noindexed (results pages shouldn't rank).
  Organization + WebSite (SearchAction) JSON-LD in the root layout — joins the existing Product,
  BreadcrumbList and FAQPage schemas. Branded 404 page (was the framework default).
- **Performance:** fonts moved from a render-blocking Google Fonts stylesheet to **next/font
  self-hosting** (verified: zero fonts.googleapis requests in the served HTML) — the biggest
  single win for BD mobile networks. next/image gains AVIF/WebP formats (all product imagery
  already runs through next/image with remote patterns). Hero video already preload="metadata".
  Build sizes healthy: policy pages 465 B page JS (pure server components), home 128 kB first
  load, shared baseline 103 kB. No route regressed.
- **Accessibility:** skip-to-content link (focus-visible) + existing `<main id="main">` landmark;
  muted text tokens darkened to pass WCAG AA on the off-white background for small text
  (--muted #737373 → #636363, --color-muted → #5f5f59); brand red measured ≈4.9:1 on white
  (passes AA for normal text). Focus-visible rings, aria labels, dialog Esc handling were
  already in place from Phases 1–2.
- Honest limit: no browser/Lighthouse in this environment — scores are Roktim's visual pass
  (or Phase 12 QA with a real device). Everything measurable from the build/runtime was measured.
- **Status: COMPLETED** — stopped for approval. Next: Phase 12 (QA, Security & Hardening).

## Phase 12 — QA, Security & Hardening (2026-10-25) ✅ COMPLETED
- **Full regression: 65/65 checks pass** (routes 26, orders 11, accounts 12, admin 9, contact 3,
  security headers 5 — full detail in docs/QA_REPORT.md), plus search-engine regression 5/5 run
  directly against the engine, and both rate limiters proven at their thresholds. Three QA-script
  bugs were found and fixed along the way (short idempotency keys, auth action as query param,
  address length) — each time the app was right and the test was wrong; one expectations fix
  (free delivery is ≥৳1,500, so a single ৳1,499 hoodie correctly pays delivery).
- **Fail-closed secrets (the phase's real catch):** the shared dev fallback secret would have
  let anyone who read the code forge cookies in production if AUTH_SECRET were forgotten. Now:
  production + no AUTH_SECRET → signing throws; production + no ADMIN_PASSWORD → admin locked
  (no admin123). QA caught this live (signup 500 under `next start` until env was set — the
  control working). `.env.example` documents both.
- **More hardening:** security headers site-wide (CSP with documented 'unsafe-inline' rationale,
  nosniff, X-Frame-Options DENY, HSTS, Referrer-Policy, Permissions-Policy); rate limits
  (orders 60/min/IP — sized for BD carrier-grade NAT — contact 10/min/IP; in-memory, best-effort
  per instance, login lockout is the persistent control); admin URL validation (https-only
  images/media, `javascript:` rejected in test); branded error boundary; /api/health;
  `npm run backup` + docs/BACKUP.md (verified).
- Not executed: npm audit (sandbox registry policy blocks the endpoint — runtime deps are only
  next/react/react-dom; run in CI/Phase 13); browser/device testing (standing caveat).
- **Status: COMPLETED** — stopped for approval. Next: Phase 13 (Deployment & Go-Live) — requires
  Roktim's explicit approval plus decisions: Supabase data migration, env secrets, email delivery
  for password resets, real catalog/stores/socials data, ADMIN_PASSWORD.

## Phase 13 — Deployment Readiness & Handover (2026-10-25) ✅ COMPLETED (deploy execution = Roktim's dashboard steps)
- **Persistence migrated (the production blocker, closed):** dual-mode Postgres doc-store
  (`lib/db.ts`, `trac_docs` JSONB table). DATABASE_URL set → catalog/settings/orders/users/
  messages all persist in Postgres; unset → original .data files, local dev untouched. Sync
  stores (catalog/settings) hydrate into memory via `ensureStores()` (root layout + all API
  routes + dynamic pages); collections pages dropped SSG for dynamic rendering so runtime
  catalog data is never baked at build time. **Verified 7/7 against a Postgres-compatible
  engine** (seed, persistence, admin price edit → order total ৳859, signup, messages) and the
  full Phase 12 battery re-run in file mode: **65/65, zero regressions**.
  `npm run db:migrate` moves existing .data into the DB (idempotent upserts).
- **Password-reset email:** Resend delivery wired behind RESEND_API_KEY + MAIL_FROM
  (fetch, no new dependency); without them the outbox behaviour is unchanged.
- **Deploy package:** vercel.json (Next.js, sin1 region, API maxDuration), .env.example
  completed, README rewritten as an accurate handover, and **docs/DEPLOY.md** — the staging-
  first runbook: DB creation → staging deploy → verification gate (/api/health must report
  storage:"postgres") → real-data loading (delete samples, real stores/socials, exchange-
  window confirmation) → domain cutover options → rollback (Vercel previous-deployment
  promote; phase zips as restore points).
- **Deploy execution — blocked on Roktim's side, stated plainly:** the Vercel connector is
  connected (tanjimalomroktim@gmail.com) but the `roktim003` team scope returns 403 asking for
  a team-access authorization that the connector's reviewed toolset doesn't expose, and
  git-less deployment of ~200 files via MCP uploads isn't practical. So the cutover itself is
  Roktim's 30–45 min dashboard run following DEPLOY.md (same pattern as WatchDrama) — when he
  says it's live, Muse verifies production (health/sitemap/smoke) and closes the goal.
- **Status: COMPLETED (rebuild complete — all 13 phases).** Go-live verification pending
  Roktim's deploy.
