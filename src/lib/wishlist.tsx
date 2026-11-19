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

/* Wishlist — device-local for guests; when signed in (Phase 8) it syncs
   with the account: on load the server list and local list are merged
   (no duplicates) and every toggle is written through to the account. */
interface WishlistCtx {
  ids: string[];
  count: number;
  has: (id: string) => boolean;
  toggle: (id: string) => void;
}

const Ctx = createContext<WishlistCtx | null>(null);
const KEY = "trac-wishlist-v1";

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setIds(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  /* Account sync (Phase 8): once local state is ready, pull the account
     wishlist, merge without duplicates, and push the merged list back. */
  useEffect(() => {
    if (!ready || synced) return;
    (async () => {
      try {
        const res = await fetch("/api/account?part=wishlist");
        if (!res.ok) return; // guest — device-local only
        const data = (await res.json()) as { ids: string[] };
        const merged = Array.from(new Set([...data.ids, ...ids]));
        setIds(merged);
        await fetch("/api/account?part=wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: merged }),
        });
        setSynced(true);
      } catch {
        /* offline — local wishlist keeps working */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  /* write-through on toggle while signed in */
  useEffect(() => {
    if (!synced || !ready) return;
    fetch("/api/account?part=wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    }).catch(() => {});
  }, [ids, synced, ready]);

  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem(KEY, JSON.stringify(ids));
      } catch {}
    }
  }, [ids, ready]);

  const toggle = useCallback((id: string) => {
    setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);
  const has = useCallback((id: string) => ids.includes(id), [ids]);

  const value = useMemo(() => ({ ids, count: ids.length, has, toggle }), [ids, has, toggle]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWishlist() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
}
