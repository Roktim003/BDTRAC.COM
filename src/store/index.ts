/**
 * BDTRAC — client store barrel (Part 1 scaffold).
 * Add feature stores as siblings of ui-store.ts and re-export them here.
 */
export { useUiStore } from "./ui-store";
export type { OverlayKind } from "./ui-store";
export { useBagStore, useBagCount } from "./bag-store";
export type { BagLine } from "./bag-store";
