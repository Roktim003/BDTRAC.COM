/* Delivery rates — single source of truth.
   Values come from the store's existing cart logic (Phase 5 extraction);
   Phase 7 unifies checkout onto these constants (checkout currently
   charges a flat rate — known discrepancy, first fix item of Phase 7).
   Phase 9 makes the rates admin-configurable. */
export const shipping = {
  insideDhaka: 60,
  outsideDhaka: 120,
  freeAbove: 1500, // free delivery at/above this subtotal
  insideDays: "1–2 days",
  outsideDays: "3–5 days",
  packedWithin: "48 hours",
};
