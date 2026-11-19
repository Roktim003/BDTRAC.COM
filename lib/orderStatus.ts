/* Order status presentation (Phase 8) — shared by guest tracking and the
   account dashboard. Statuses are set by the store team (Phase 9 admin);
   customers only ever read them. */
export const ORDER_STEPS = [
  { id: "placed", label: "Order placed", hint: "We've received your order." },
  { id: "confirmed", label: "Confirmed", hint: "Our team confirmed it on a call." },
  { id: "packed", label: "Packed", hint: "Packed and ready for the courier." },
  { id: "shipped", label: "Shipped", hint: "On the way to you." },
  { id: "delivered", label: "Delivered", hint: "Delivered — enjoy!" },
] as const;

export type OrderStatusId = (typeof ORDER_STEPS)[number]["id"] | "cancelled";

export function stepIndex(status: string): number {
  return ORDER_STEPS.findIndex((s) => s.id === status);
}
