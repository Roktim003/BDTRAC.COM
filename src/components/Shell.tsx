"use client";

import { useState, type ReactNode } from "react";
import { CartProvider } from "@/lib/cart";
import { WishlistProvider } from "@/lib/wishlist";
import type { Product } from "@/lib/products";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import CartDrawer from "./CartDrawer";
import MobileMenu from "./MobileMenu";
import SearchOverlay from "./SearchOverlay";
import QuickView from "./QuickView";
import ChatBubble from "./ChatBubble";

/**
 * Client shell — owns global UI state (menu / search / quick-view)
 * so any page can trigger them via the context below.
 */
import { createContext, useContext } from "react";

const QuickViewCtx = createContext<(p: Product) => void>(() => {});
export const useQuickView = () => useContext(QuickViewCtx);

export default function Shell({
  children,
  solidHeader = false,
}: {
  children: ReactNode;
  solidHeader?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [qvProduct, setQvProduct] = useState<Product | null>(null);

  return (
    <CartProvider>
      <WishlistProvider>
      <QuickViewCtx.Provider value={setQvProduct}>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <SiteHeader
          onSearch={() => setSearchOpen(true)}
          onMenu={() => setMenuOpen(true)}
          solid={solidHeader}
        />
        <main id="main">{children}</main>
        <SiteFooter />
        <ChatBubble />
        <CartDrawer />
        <MobileMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          onSearch={() => setSearchOpen(true)}
        />
        <SearchOverlay
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          onQuickView={setQvProduct}
        />
        <QuickView product={qvProduct} onClose={() => setQvProduct(null)} />
      </QuickViewCtx.Provider>
      </WishlistProvider>
    </CartProvider>
  );
}
