import { z } from "zod";
import { bdPhoneSchema, deliveryZoneSchema } from "./bd-utils";

/**
 * Editorial order payload — ONE zod schema shared by the checkout form
 * (client-side validation) and /api/editorial-orders (server-side
 * validation), so the two can never drift. Prices are NEVER accepted
 * from the client: lines carry SKU + size + qty only, and the server
 * recomputes every taka from the database.
 */

export const orderItemSchema = z.object({
  sku: z.string().min(3).max(40),
  size: z.enum(["S", "M", "L", "XL", "XXL"]),
  quantity: z.number().int().min(1).max(9),
});

export const paymentMethodSchema = z.enum(["COD", "BKASH", "NAGAD", "SSLCOMMERZ"]);

export const createOrderSchema = z.object({
  customerName: z.string().trim().min(3).max(80),
  phone: bdPhoneSchema,
  district: z.string().trim().min(2).max(60),
  address: z.string().trim().min(8).max(300),
  deliveryZone: deliveryZoneSchema,
  paymentMethod: paymentMethodSchema,
  promoCode: z.string().trim().max(20).optional(),
  items: z.array(orderItemSchema).min(1).max(20),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type OrderItemInput = z.infer<typeof orderItemSchema>;

/** Active promo codes for the editorial store. Server is the authority;
    the cart store mirrors TRAC10 only for display math. */
export const PROMO_CODES: Record<string, { percentOff: number }> = {
  TRAC10: { percentOff: 10 },
};

export function promoDiscountBdt(subtotalBdt: number, promoCode?: string): number {
  if (!promoCode) return 0;
  const promo = PROMO_CODES[promoCode.trim().toUpperCase()];
  if (!promo) return 0;
  return Math.floor((subtotalBdt * promo.percentOff) / 100);
}

export function isValidPromoCode(promoCode: string): boolean {
  return promoCode.trim().toUpperCase() in PROMO_CODES;
}

/** The receipt the API returns on success. */
export interface OrderReceipt {
  orderNumber: string;
  customerName: string;
  phone: string;
  district: string;
  deliveryZone: "INSIDE_DHAKA" | "OUTSIDE_DHAKA";
  paymentMethod: z.infer<typeof paymentMethodSchema>;
  paymentStatus: "PENDING";
  items: { sku: string; size: string; quantity: number; unitPriceBdt: number }[];
  subtotalBdt: number;
  discountBdt: number;
  shippingFeeBdt: number;
  totalBdt: number;
}
