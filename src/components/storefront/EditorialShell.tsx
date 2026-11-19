"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Navbar from "./Navbar";
import ProductDrawer from "./ProductDrawer";
import CartDrawer from "@/components/checkout/CartDrawer";

/**
 * EditorialShell (Part 3) — chrome for the editorial surface
 * (/drop-04 and /product/[slug]): the Part 3 Navbar, a minimal footer,
 * and the quick-view drawer host. Legacy pages keep the Phase 1–13
 * Shell; SiteShell routes between them.
 */
export default function EditorialShell({ children }: { children: ReactNode }) {
  return (
    <div className="sf-shell">
      <Navbar />
      <main>{children}</main>
      <footer className="sf-footer">
        <span className="sf-footer-brand">TRAC — DHAKA</span>
        <span className="font-spec sf-footer-note">
          DROP 04 // CONCRETE &amp; MONSOON — HEAVYWEIGHT ONLY
        </span>
        <Link href="/products" className="sf-footer-link">
          Full TRAC store →
        </Link>
      </footer>
      <ProductDrawer />
      <CartDrawer />
    </div>
  );
}
