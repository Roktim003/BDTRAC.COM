# TRAC — Architecture (recommendation)

Keep production stack: **Next.js App Router + TypeScript on Vercel, Supabase (Postgres + Storage + Auth)** — it is live and working; the master prompt §4 says prefer the existing proven stack unless the audit justifies change, and it does not.

Modules (server-enforced business rules): Catalog · Collections · Inventory (per variant size×colour) · Cart · Checkout · Payments (COD now; bKash/Nagad after merchant testing) · Orders · Customers · Promotions · Shipping zones · CMS (homepage sections) · Admin (role-based: Owner, Manager, Fulfillment, Content).

Demo (`../index.html`) is a static, client-side reference implementation of the Phase 1–3/4/5/6/7 *interfaces only* — no backend, no real orders, no simulated payment success.
