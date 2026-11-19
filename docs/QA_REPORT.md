# QA Report — Phase 12 (2026-10-25)

Full regression of the rebuilt TRAC storefront against a production build
(`next build` + `next start`, AUTH_SECRET/ADMIN_PASSWORD set as production
requires). **Result: 65/65 API & route checks passed, 5/5 search-engine
checks passed, 2/2 rate-limit proofs passed, backup script verified.**

## A. Routes & platform (26 checks)
All public routes 200: /, /products, PDP, both collections, /search,
/cart, /checkout, /account, /track, /wishlist, /contact, /about, /faq,
/shipping-policy, /returns, /privacy, /terms, /admin, /sitemap.xml,
/robots.txt, /api/health. Bad product/collection → branded 404. Health
endpoint reports catalog size. `.data/` is NOT web-accessible (404).

## B. Orders (11 checks)
Valid order total exact (2×৳699 + ৳60 = ৳1,458); tampered client price
ignored; sold-out/bad phone/bad size/unavailable payment → 400; duplicate
submit returns the original order (idempotency); outside-Dhaka ৳1,619;
free delivery at ≥৳1,500 (2×৳1,499 → delivery 0, total ৳2,998); tracking
lookup works with id+phone and 404s on the wrong phone.

## C. Accounts (12 checks)
Signup 201; duplicate 400; wrong password 401; session accepted;
address saved; wishlist sync exact; forgot-password returns a generic
200 (no account enumeration); **no plaintext password anywhere in the
store**; reset with a bad token 400; reset with the real (outbox) token
200; login with the new password 200; **5 failed logins → 429 lockout**.

## D. Admin & CMS (9 checks)
Unauthenticated 401; wrong password 401; env-password login with devMode
off; **price edit ৳699→৳799 flows into the next order's total (৳859)**;
status change flows into customer tracking; admin-created promo applies
exactly (৳779); everything restores exactly (৳759); `javascript:` image
URL rejected by the new URL validation.

## E. Contact (3 checks)
Valid message 201 and readable in Admin → Messages; invalid → 400 with
field errors.

## F. Security (headers + hardening)
CSP, X-Content-Type-Options, X-Frame-Options: DENY, HSTS,
Referrer-Policy, Permissions-Policy all present on responses.
Hardening shipped this phase:
- **Fail-closed secrets:** production without AUTH_SECRET → session
  signing throws (caught in QA as signup 500 until the env var was set —
  the control working as designed); production without ADMIN_PASSWORD →
  admin locked, no `admin123` fallback.
- Cookie flags verified: HttpOnly + SameSite=Lax + Secure in production.
- Rate limits: orders 60/min/IP (BD carrier-grade NAT shares IPs across
  many customers, so the limit is set generously), contact 10/min/IP —
  proven: request 61/11 returns 429. In-memory per instance
  (best-effort on serverless); the persistent control is the account
  login lockout.
- URL validation on admin product images + settings media (https only).
- Branded error boundary (app/error.tsx); /api/health for monitoring.
- Backup: `npm run backup` → timestamped `.data` copy (verified);
  restore/rollback documented in docs/BACKUP.md.

## Search engine regression (5 checks, engine run directly)
ferrari→6, ferari (typo)→6, hoodie→2, black→7, nonsense→0. All exact.

## Not executed here (honest limits)
- `npm audit` — the sandbox's registry policy blocks the audit endpoint.
  Runtime dependencies are only next/react/react-dom; run `npm audit`
  in CI or at deploy time (Phase 13 checklist).
- Browser/device testing (visual, touch, real-network) — no browser in
  this environment; Roktim's device pass remains the visual gate, as in
  every phase.
