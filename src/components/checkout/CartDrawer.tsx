"use client";

import { useState } from "react";
import Link from "next/link";
import { Minus, Plus, Trash2, Truck, X } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useUiStore } from "@/store/ui-store";
import { formatBDT } from "@/lib/bd-utils";
import CheckoutModal from "./CheckoutModal";

/**
 * CartDrawer (Part 4) — slide-out bag for the editorial catalog.
 * Free-delivery progress bar toward ৳3,500 (on the discounted subtotal,
 * the same basis the order API uses), quantity controls clamped to
 * variant stock, promo entry, and the quick checkout trigger that opens
 * the bilingual CheckoutModal. Visibility rides the UI store's "cart"
 * overlay so the Navbar bag button and this drawer never disagree.
 */
export default function CartDrawer() {
  const overlay = useUiStore((s) => s.overlay);
  const closeOverlay = useUiStore((s) => s.closeOverlay);
  const items = useCartStore((s) => s.items);
  const setQty = useCartStore((s) => s.setQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const subtotal = useCartStore((s) => s.subtotalBdt());
  const discount = useCartStore((s) => s.discountBdt());
  const shipping = useCartStore((s) => s.shippingFeeBdt());
  const total = useCartStore((s) => s.totalBdt());
  const progress = useCartStore((s) => s.freeShipping());
  const promoCode = useCartStore((s) => s.promoCode);
  const promoError = useCartStore((s) => s.promoError);
  const applyPromo = useCartStore((s) => s.applyPromo);
  const clearPromo = useCartStore((s) => s.clearPromo);
  const [promoInput, setPromoInput] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  if (overlay !== "cart") return null;
  const close = () => closeOverlay();

  return (
    <div className="co-drawer-root" role="dialog" aria-modal="true" aria-label="Shopping bag">
      <button type="button" className="co-backdrop" aria-label="Close bag" onClick={close} />
      <aside className="co-drawer">
        <div className="co-drawer-head">
          <h2 className="co-drawer-title">
            Your Bag{" "}
            <span className="font-bn co-bn-inline">/ আপনার ব্যাগ</span>
          </h2>
          <button type="button" className="sf-nav-icon" aria-label="Close bag" onClick={close}>
            <X size={20} />
          </button>
        </div>

        <div className="co-progress" aria-label="Free delivery progress">
          <p className="co-progress-label">
            <Truck size={15} />
            {progress.unlocked ? (
              <span>
                Free delivery unlocked <span className="font-bn">/ ফ্রি ডেলিভারি</span>
              </span>
            ) : (
              <span>
                Add {formatBDT(progress.remainingBdt)} more for free delivery{" "}
                <span className="font-bn">/ ফ্রি ডেলিভারির জন্য আরও যোগ করুন</span>
              </span>
            )}
          </p>
          <div className="co-progress-track">
            <div
              className={`co-progress-fill ${progress.unlocked ? "is-free" : ""}`}
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <p className="font-spec co-progress-note">
            {formatBDT(progress.currentBdt)} / {formatBDT(progress.thresholdBdt)} — FREE OVER{" "}
            {formatBDT(progress.thresholdBdt)}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="co-empty">
            <p>Your bag is empty.</p>
            <Link href="/drop-04#grid" className="sf-btn sf-btn-accent" onClick={close}>
              Shop Drop 04
            </Link>
          </div>
        ) : (
          <>
            <ul className="co-lines">
              {items.map((l) => (
                <li key={`${l.sku}-${l.size}`} className="co-line">
                  <div className="co-line-main">
                    <span className="co-line-title">{l.title}</span>
                    <span className="font-spec co-line-spec">
                      {l.sku} — {l.size} / {l.color.toUpperCase()}
                    </span>
                    <span className="font-spec co-line-stock">
                      {l.stockCount} IN STUDIO
                    </span>
                  </div>
                  <div className="co-line-side">
                    <div className="co-qty">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() => setQty(l.sku, l.size, l.qty - 1)}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="font-spec">{l.qty}</span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        disabled={l.qty >= Math.min(9, l.stockCount)}
                        onClick={() => setQty(l.sku, l.size, l.qty + 1)}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <span className="font-spec co-line-total">
                      {formatBDT(l.qty * l.unitPriceBdt)}
                    </span>
                    <button
                      type="button"
                      className="co-line-remove"
                      aria-label={`Remove ${l.title}`}
                      onClick={() => removeItem(l.sku, l.size)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="co-promo">
              {promoCode ? (
                <p className="co-promo-applied font-spec">
                  {promoCode} — 10% OFF APPLIED{" "}
                  <button type="button" onClick={clearPromo} className="co-promo-clear">
                    REMOVE
                  </button>
                </p>
              ) : (
                <form
                  className="co-promo-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (applyPromo(promoInput)) setPromoInput("");
                  }}
                >
                  <input
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder="Promo code (try TRAC10)"
                    className="co-promo-input"
                    aria-label="Promo code"
                  />
                  <button type="submit" className="co-promo-btn">
                    Apply
                  </button>
                </form>
              )}
              {promoError ? <p className="co-promo-error">{promoError}</p> : null}
            </div>

            <dl className="co-summary font-spec">
              <div>
                <dt>SUBTOTAL</dt>
                <dd>{formatBDT(subtotal)}</dd>
              </div>
              {discount > 0 ? (
                <div>
                  <dt>DISCOUNT (TRAC10)</dt>
                  <dd>−{formatBDT(discount)}</dd>
                </div>
              ) : null}
              <div>
                <dt>DELIVERY</dt>
                <dd>{shipping === 0 ? "FREE" : formatBDT(shipping)}</dd>
              </div>
              <div className="co-summary-total">
                <dt>TOTAL</dt>
                <dd>{formatBDT(total)}</dd>
              </div>
            </dl>

            <button
              type="button"
              className="sf-btn sf-btn-accent co-checkout-btn"
              onClick={() => setCheckoutOpen(true)}
            >
              Checkout — ক্যাশ অন ডেলিভারি
            </button>
            <Link href="/drop-04/checkout" className="co-full-checkout font-spec" onClick={close}>
              OPEN FULL CHECKOUT PAGE →
            </Link>
          </>
        )}
      </aside>

      {checkoutOpen ? (
        <CheckoutModal
          onClose={() => setCheckoutOpen(false)}
          onSuccess={() => setCheckoutOpen(false)}
        />
      ) : null}
    </div>
  );
}
