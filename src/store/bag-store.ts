/**
 * @deprecated Part 3 bag store — superseded by useCartStore (Part 4),
 * which adds variant stock limits, promo codes and free-shipping
 * progress. This module remains only as a compatibility re-export;
 * new code must import from "./useCartStore".
 */
export { useCartStore as useBagStore, useCartCount as useBagCount } from "./useCartStore";
export type { CartLine as BagLine } from "./useCartStore";
