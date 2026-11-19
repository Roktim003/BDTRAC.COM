/**
 * BDTRAC — storefront components barrel (Part 1 scaffold).
 *
 * Public-facing storefront components (header, hero, product rows, PDP)
 * live in this folder from the next parts onward and are re-exported here.
 * Legacy components still live in src/components and src/components/ui and
 * migrate here feature by feature — do not duplicate them.
 */
export { default as Navbar } from "./Navbar";
export { default as EditorialHero } from "./EditorialHero";
export { default as ProductGrid } from "./ProductGrid";
export { default as ProductDrawer, ProductDetailView, SizeGuide } from "./ProductDrawer";
export { default as EditorialShell } from "./EditorialShell";
export { default as EditorialImage } from "./EditorialImage";
