"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Collection, Product } from "./products";
import type { Settings } from "./settingsStore";

/* Storefront data (Phase 9) — the effective catalog + settings, read on the
   server from the admin-editable stores and passed down by the root layout.
   Admin edits therefore appear on the storefront on the next page load,
   with no rebuild. */

interface StorefrontData {
  products: Product[];
  collections: Collection[];
  settings: Settings;
}

const Ctx = createContext<StorefrontData | null>(null);

/* Module registry for non-component code (cart refresh, recent list,
   reorder) that needs catalog lookups outside React. Set during provider
   render — parents render before children mount, so lookups are safe. */
let registry: { products: Product[] } = { products: [] };
export function registryGetProduct(id: string): Product | undefined {
  return registry.products.find((p) => p.id === id);
}

export function StorefrontProvider({
  data,
  children,
}: {
  data: StorefrontData;
  children: ReactNode;
}) {
  registry = { products: data.products };
  return <Ctx.Provider value={data}>{children}</Ctx.Provider>;
}

export function useStorefront(): StorefrontData {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStorefront must be used inside StorefrontProvider");
  return ctx;
}

export function useProducts(): Product[] {
  return useStorefront().products;
}

export function useCollections(): Collection[] {
  return useStorefront().collections;
}

export function useSettings(): Settings {
  return useStorefront().settings;
}

export function useGetProduct(): (id: string) => Product | undefined {
  const products = useProducts();
  return (id: string) => products.find((p) => p.id === id);
}
