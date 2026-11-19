"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "./products";
import { registryGetProduct } from "./storefront";

export interface CartItem {
  product: Product;
  size: string;
  qty: number;
}

interface CartCtx {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (product: Product, size: string, qty?: number) => void;
  remove: (id: string, size: string) => void;
  setQty: (id: string, size: string, qty: number) => void;
  clear: () => void;
  isOpen: boolean;
  setOpen: (v: boolean) => void;
}

const Ctx = createContext<CartCtx | null>(null);
const KEY = "trac-cart-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        /* Phase 7 price integrity: never trust the stored snapshot — refresh
           every line against the live catalog (current price/name/images),
           drop products that no longer exist or sizes no longer offered. */
        const stored = JSON.parse(raw) as CartItem[];
        setItems(
          stored
            .map((c) => {
              const p = registryGetProduct(c.product.id);
              if (!p || !p.sizes.includes(c.size)) return null;
              return { product: p, size: c.size, qty: Math.min(9, Math.max(1, c.qty || 1)) };
            })
            .filter((c): c is CartItem => Boolean(c))
        );
      }
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem(KEY, JSON.stringify(items));
      } catch {}
    }
  }, [items, ready]);

  const add = useCallback((product: Product, size: string, qty = 1) => {
    setItems((prev) => {
      const i = prev.findIndex(
        (c) => c.product.id === product.id && c.size === size
      );
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], qty: Math.min(9, next[i].qty + qty) };
        return next;
      }
      return [...prev, { product, size, qty }];
    });
  }, []);

  const remove = useCallback((id: string, size: string) => {
    setItems((prev) =>
      prev.filter((c) => !(c.product.id === id && c.size === size))
    );
  }, []);

  const setQty = useCallback((id: string, size: string, qty: number) => {
    setItems((prev) =>
      qty < 1
        ? prev.filter((c) => !(c.product.id === id && c.size === size))
        : prev.map((c) =>
            c.product.id === id && c.size === size
              ? { ...c, qty: Math.min(9, qty) } // server order cap is 9 (§7.7)
              : c
          )
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const { count, subtotal } = useMemo(() => {
    return {
      count: items.reduce((s, c) => s + c.qty, 0),
      subtotal: items.reduce((s, c) => s + c.qty * c.product.price, 0),
    };
  }, [items]);

  const value = useMemo(
    () => ({
      items,
      count,
      subtotal,
      add,
      remove,
      setQty,
      clear,
      isOpen,
      setOpen,
    }),
    [items, count, subtotal, add, remove, setQty, clear, isOpen]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
