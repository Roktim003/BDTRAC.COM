"use client";

import { useEffect, useState } from "react";
import type { Product } from "./products";

/* Recently viewed (Phase 6, §6.5) — device-local, like the guest wishlist.
   PDP visits record here; rows render on the homepage and search page. */
const KEY = "trac-recent-v1";
const MAX = 8;

export function recordRecent(id: string) {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]") as string[];
    const next = [id, ...raw.filter((x) => x !== id)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("trac-recent"));
  } catch {
    /* storage unavailable — recently-viewed is an enhancement only */
  }
}

export function useRecent(list: Product[], excludeId?: string): Product[] {
  const [items, setItems] = useState<Product[]>([]);
  useEffect(() => {
    const read = () => {
      try {
        const raw = JSON.parse(localStorage.getItem(KEY) || "[]") as string[];
        setItems(
          raw
            .filter((id) => id !== excludeId)
            .map((id) => list.find((p) => p.id === id))
            .filter((p): p is Product => Boolean(p))
        );
      } catch {
        setItems([]);
      }
    };
    read();
    window.addEventListener("trac-recent", read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener("trac-recent", read);
      window.removeEventListener("storage", read);
    };
  }, [excludeId, list]);
  return items;
}
