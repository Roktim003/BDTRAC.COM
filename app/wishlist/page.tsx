"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import { EmptyState } from "@/components/ui";
import { useQuickView } from "@/components/Shell";
import type { Product } from "@/lib/products";
import { useGetProduct, useProducts } from "@/lib/storefront";
import { useWishlist } from "@/lib/wishlist";
import { useCart } from "@/lib/cart";

/* One wishlist entry with inline size pick + move-to-bag (§6.4). */
function WishlistItem({ product }: { product: Product }) {
  const quickView = useQuickView();
  const { toggle } = useWishlist();
  const { add, setOpen } = useCart();
  const [size, setSize] = useState<string>("");
  const [error, setError] = useState("");

  return (
    <div>
      <ProductCard product={product} onQuickView={quickView} />
      <div className="wish-actions">
        <select
          value={size}
          onChange={(e) => {
            setSize(e.target.value);
            setError("");
          }}
          aria-label={`Size for ${product.name}`}
          disabled={product.soldOut}
        >
          <option value="">Size…</option>
          {product.sizes.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          className="ui-btn ui-btn-dark ui-btn-sm"
          disabled={product.soldOut}
          onClick={() => {
            if (!size) return setError("Pick a size");
            add(product, size, 1);
            toggle(product.id); // moved to bag → leave the wishlist
            setOpen(true);
          }}
        >
          {product.soldOut ? "Sold Out" : "Add to Bag"}
        </button>
        <button className="wish-remove" onClick={() => toggle(product.id)}>
          Remove
        </button>
      </div>
      {error && (
        <p className="pd-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/* Guest wishlist (Phase 2) formalised in Phase 6: inline move-to-bag,
   shareable link (?ids=… opens a shared view that can be saved locally).
   Account sync arrives with Phase 8 accounts. */
function WishlistInner() {
  const { ids, toggle } = useWishlist();
  const products = useProducts();
  const getProduct = useGetProduct();
  const params = useSearchParams();
  const [copied, setCopied] = useState(false);

  const sharedParam = params.get("ids");
  const sharedIds = sharedParam ? sharedParam.split(",").filter(Boolean) : [];
  const sharedItems = sharedIds
    .map((id) => getProduct(id))
    .filter((p): p is Product => Boolean(p));
  const sharedMode = sharedItems.length > 0;

  const saved = products.filter((p) => ids.includes(p.id));
  const share = async () => {
    const url = `${window.location.origin}/wishlist?ids=${ids.join(",")}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy your wishlist link:", url);
    }
  };

  if (sharedMode) {
    return (
      <div className="wrap">
        <div className="shop-head">
          <Reveal>
            <h1>Shared Wishlist</h1>
            <p>
              {sharedItems.length} saved {sharedItems.length === 1 ? "piece" : "pieces"} someone
              shared with you
            </p>
          </Reveal>
        </div>
        <div style={{ marginBottom: 22 }}>
          <button
            className="ui-btn ui-btn-primary ui-btn-md"
            onClick={() => sharedItems.forEach((p) => !ids.includes(p.id) && toggle(p.id))}
          >
            Save All to My Wishlist
          </button>{" "}
          <Link className="ui-btn ui-btn-ghost ui-btn-md" href="/wishlist">
            View My Wishlist
          </Link>
        </div>
        <div className="grid4" style={{ paddingBottom: 80 }}>
          {sharedItems.map((p, i) => (
            <Reveal key={p.id} delay={(i % 4) as 0 | 1 | 2 | 3}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="wrap">
      <div className="shop-head">
        <Reveal>
          <h1>Wishlist</h1>
          <p>
            {saved.length} saved {saved.length === 1 ? "piece" : "pieces"} — stored on this device
          </p>
        </Reveal>
      </div>
      {saved.length === 0 ? (
        <div style={{ paddingBottom: 80, maxWidth: 560 }}>
          <EmptyState
            title="Your wishlist is empty"
            text="Tap the bookmark on any product to save it here for later."
            action={
              <Link className="ui-btn ui-btn-dark ui-btn-md" href="/products">
                Start Shopping
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 22 }}>
            <button className="ui-btn ui-btn-dark ui-btn-md" onClick={share}>
              {copied ? "Link Copied ✓" : "Share Wishlist"}
            </button>
          </div>
          <div className="grid4" style={{ paddingBottom: 80 }}>
            {saved.map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) as 0 | 1 | 2 | 3}>
                <WishlistItem product={p} />
              </Reveal>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function WishlistPage() {
  return (
    <Suspense>
      <WishlistInner />
    </Suspense>
  );
}
