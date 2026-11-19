"use client";

import { useCallback, useEffect, useState } from "react";
import type { DeliveryZone } from "./bd";
import { shipping } from "./shipping";

/* Delivery zone preference — shared by the cart page and checkout so the
   delivery charge never changes between screens (§7.4 consistency). */
const KEY = "trac-zone-v1";

export function useDeliveryZone(): [DeliveryZone, (z: DeliveryZone) => void] {
  const [zone, setZoneState] = useState<DeliveryZone>("inside");
  useEffect(() => {
    try {
      const v = localStorage.getItem(KEY);
      if (v === "inside" || v === "outside") setZoneState(v);
    } catch {}
  }, []);
  const setZone = useCallback((z: DeliveryZone) => {
    setZoneState(z);
    try {
      localStorage.setItem(KEY, z);
    } catch {}
  }, []);
  return [zone, setZone];
}

export function deliveryCharge(
  zone: DeliveryZone,
  subtotal: number,
  rates: typeof shipping = shipping
): number {
  if (subtotal === 0 || subtotal >= rates.freeAbove) return 0;
  return zone === "inside" ? rates.insideDhaka : rates.outsideDhaka;
}
