import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ApparelSize, Sku } from "@/types";
import { getVariantBySku } from "@/lib/editorial-catalog";
import {
  FREE_SHIPPING_THRESHOLD_BDT,
  calculateShippingFeeBdt,
  type DeliveryZone,
} from "@/lib/bd-utils";
import { isValidPromoCode, promoDiscountBdt } from "@/lib/order-schema";

/**
 * useCartStore (Part 4) — the canonical cart for the editorial catalog.
 *
 * Persistent Zustand store. Lines are keyed by SKU + size; quantities are
 * clamped to the variant's live studio stock (and the house cap of 9).
 * Promo: TRAC10 = 10% off the merchandise subtotal (server re-validates
 * at order time — this store's math is display math). Free-shipping
 * progress is measured on the discounted subtotal toward ৳3,500, the
 * same basis the order API charges on.
 *
 * Supersedes the Part 3 bag-store (kept as a deprecated re-export).
 */

export interface CartLine {
  slug: string;
  title: string;
  sku: Sku;
  size: ApparelSize;
  color: string;
  unitPriceBdt: number;
  stockCount: number;
  qty: number;
}

export interface FreeShippingProgress {
  thresholdBdt: number;
  currentBdt: number;
  remainingBdt: number;
  percent: number;
  unlocked: boolean;
}

interface CartState {
  items: CartLine[];
  promoCode: string | null;
  promoError: string | null;
  deliveryZone: DeliveryZone;
  addItem: (line: Omit<CartLine, "qty" | "stockCount">, qty?: number) => void;
  removeItem: (sku: Sku, size: ApparelSize) => void;
  setQty: (sku: Sku, size: ApparelSize, qty: number) => void;
  clear: () => void;
  applyPromo: (code: string) => boolean;
  clearPromo: () => void;
  setDeliveryZone: (zone: DeliveryZone) => void;
  count: () => number;
  subtotalBdt: () => number;
  discountBdt: () => number;
  shippingFeeBdt: () => number;
  totalBdt: () => number;
  freeShipping: () => FreeShippingProgress;
}

function stockFor(sku: Sku): number {
  return getVariantBySku(sku)?.variant.stockCount ?? 9;
}
function clampQty(qty: number, stock: number): number {
  return Math.max(1, Math.min(9, stock, qty));
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      promoCode: null,
      promoError: null,
      deliveryZone: "INSIDE_DHAKA",

      addItem: (line, qty = 1) =>
        set((s) => {
          const stock = stockFor(line.sku);
          const i = s.items.findIndex(
            (l) => l.sku === line.sku && l.size === line.size,
          );
          if (i >= 0) {
            const next = [...s.items];
            next[i] = {
              ...next[i],
              stockCount: stock,
              qty: clampQty(next[i].qty + qty, stock),
            };
            return { items: next };
          }
          return {
            items: [
              ...s.items,
              { ...line, stockCount: stock, qty: clampQty(qty, stock) },
            ],
          };
        }),
      removeItem: (sku, size) =>
        set((s) => ({
          items: s.items.filter((l) => !(l.sku === sku && l.size === size)),
        })),
      setQty: (sku, size, qty) =>
        set((s) => ({
          items:
            qty < 1
              ? s.items.filter((l) => !(l.sku === sku && l.size === size))
              : s.items.map((l) =>
                  l.sku === sku && l.size === size
                    ? { ...l, qty: clampQty(qty, stockFor(sku)) }
                    : l,
                ),
        })),
      clear: () => set({ items: [], promoCode: null, promoError: null }),
      applyPromo: (code) => {
        const normalized = code.trim().toUpperCase();
        if (isValidPromoCode(normalized)) {
          set({ promoCode: normalized, promoError: null });
          return true;
        }
        set({ promoError: "That code is not active." });
        return false;
      },
      clearPromo: () => set({ promoCode: null, promoError: null }),
      setDeliveryZone: (zone) => set({ deliveryZone: zone }),

      count: () => get().items.reduce((sum, l) => sum + l.qty, 0),
      subtotalBdt: () =>
        get().items.reduce((sum, l) => sum + l.qty * l.unitPriceBdt, 0),
      discountBdt: () => {
        const s = get();
        return s.promoCode ? promoDiscountBdt(s.subtotalBdt(), s.promoCode) : 0;
      },
      shippingFeeBdt: () => {
        const s = get();
        if (s.items.length === 0) return 0;
        return calculateShippingFeeBdt(
          s.subtotalBdt() - s.discountBdt(),
          s.deliveryZone,
        );
      },
      totalBdt: () => {
        const s = get();
        return s.subtotalBdt() - s.discountBdt() + s.shippingFeeBdt();
      },
      freeShipping: () => {
        const s = get();
        const current = s.subtotalBdt() - s.discountBdt();
        return {
          thresholdBdt: FREE_SHIPPING_THRESHOLD_BDT,
          currentBdt: current,
          remainingBdt: Math.max(0, FREE_SHIPPING_THRESHOLD_BDT - current),
          percent: Math.min(100, Math.round((current / FREE_SHIPPING_THRESHOLD_BDT) * 100)),
          unlocked: current > FREE_SHIPPING_THRESHOLD_BDT,
        };
      },
    }),
    {
      name: "trac-cart-v2",
      partialize: (s) => ({
        items: s.items,
        promoCode: s.promoCode,
        deliveryZone: s.deliveryZone,
      }),
    },
  ),
);

/** Live item counter hook (re-renders on change). */
export function useCartCount(): number {
  return useCartStore((s) => s.items.reduce((sum, l) => sum + l.qty, 0));
}
