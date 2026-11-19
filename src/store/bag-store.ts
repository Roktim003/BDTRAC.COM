import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ApparelSize, Sku } from "@/types";

/**
 * Editorial bag (Part 3) — client state for the Part 2/3 Prisma catalog.
 *
 * This is deliberately separate from the legacy cart (`src/lib/cart.tsx`),
 * whose lines are validated against the legacy catalog and priced by the
 * server order engine. Editorial lines carry slug + SKU and will merge
 * into the order flow when the Prisma-backed checkout lands; until then
 * the bag is a storefront state (counter, drawer feedback), not an order.
 */

export interface BagLine {
  slug: string;
  title: string;
  sku: Sku;
  size: ApparelSize;
  color: string;
  unitPriceBdt: number;
  qty: number;
}

interface BagState {
  lines: BagLine[];
  addLine: (line: Omit<BagLine, "qty">, qty?: number) => void;
  removeLine: (sku: Sku, size: ApparelSize) => void;
  setQty: (sku: Sku, size: ApparelSize, qty: number) => void;
  clear: () => void;
  count: () => number;
  subtotalBdt: () => number;
}

export const useBagStore = create<BagState>()(
  persist(
    (set, get) => ({
      lines: [],
      addLine: (line, qty = 1) =>
        set((s) => {
          const i = s.lines.findIndex(
            (l) => l.sku === line.sku && l.size === line.size,
          );
          if (i >= 0) {
            const next = [...s.lines];
            next[i] = { ...next[i], qty: Math.min(9, next[i].qty + qty) };
            return { lines: next };
          }
          return { lines: [...s.lines, { ...line, qty }] };
        }),
      removeLine: (sku, size) =>
        set((s) => ({
          lines: s.lines.filter((l) => !(l.sku === sku && l.size === size)),
        })),
      setQty: (sku, size, qty) =>
        set((s) => ({
          lines:
            qty < 1
              ? s.lines.filter((l) => !(l.sku === sku && l.size === size))
              : s.lines.map((l) =>
                  l.sku === sku && l.size === size
                    ? { ...l, qty: Math.min(9, qty) }
                    : l,
                ),
        })),
      clear: () => set({ lines: [] }),
      count: () => get().lines.reduce((sum, l) => sum + l.qty, 0),
      subtotalBdt: () =>
        get().lines.reduce((sum, l) => sum + l.qty * l.unitPriceBdt, 0),
    }),
    { name: "trac-editorial-bag-v1" },
  ),
);

/** Live item counter hook (re-renders on change). */
export function useBagCount(): number {
  return useBagStore((s) => s.lines.reduce((sum, l) => sum + l.qty, 0));
}
