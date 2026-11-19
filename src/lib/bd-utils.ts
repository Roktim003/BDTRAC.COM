/**
 * BDTRAC — Bangladesh eCommerce utilities (Part 2).
 *
 * Canonical helpers for the Prisma data layer and all new checkout/order
 * code. Contents:
 *   - formatBDT            — whole-taka money formatting ("৳1,850")
 *   - BD mobile validation — strict operator-prefix rules + normalization
 *                            to +8801XXXXXXXXX, as a zod schema and helpers
 *   - Shipping calculator  — Inside Dhaka ৳70 / Outside Dhaka ৳130,
 *                            free over ৳3,500 (see src/lib/bd-utils tests)
 *
 * Relationship to older modules: src/lib/bd.ts keeps division/district
 * reference data and the storefront's phone helper; src/lib/shipping.ts
 * still drives the CURRENT storefront cart/checkout rates (৳60/৳120, free
 * ≥ ৳1,500). The rates in THIS file are the Part 2 backend rates — do not
 * mix the two in one calculation. Aligning the storefront onto these
 * rates is a separate, explicitly-approved change.
 */
import { z } from "zod";

// ---------------------------------------------------------------------------
// Money
// ---------------------------------------------------------------------------

const bdtGrouping = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

/** Format a whole-taka amount: formatBDT(1850) === "৳1,850". */
export function formatBDT(amount: number): string {
  if (!Number.isFinite(amount)) {
    throw new TypeError(`formatBDT: amount must be finite, got ${amount}`);
  }
  const rounded = Math.round(amount);
  const sign = rounded < 0 ? "-" : "";
  return `${sign}৳${bdtGrouping.format(Math.abs(rounded))}`;
}

/** Whole-taka money amount as stored in Prisma (Int, >= 0). */
export const bdtAmountSchema = z
  .number()
  .int("Amount must be whole taka")
  .nonnegative("Amount cannot be negative");

// ---------------------------------------------------------------------------
// Bangladesh mobile numbers
// ---------------------------------------------------------------------------

/**
 * Strict BD mobile shape, after spaces/dashes/parentheses are stripped:
 *   +8801[3-9]XXXXXXXX  or  01[3-9]XXXXXXXX   (bare 8801… also accepted)
 * Operator prefixes 013–019 only — landlines and short codes never pass.
 */
export const BD_PHONE_PATTERN = /^(?:\+880|880|0)(1[3-9]\d{8})$/;

/** Normalize any accepted BD mobile format to +8801XXXXXXXXX, else null. */
export function normalizeBdPhone(raw: string): string | null {
  const stripped = raw.replace(/[\s\-()]/g, "");
  const match = BD_PHONE_PATTERN.exec(stripped);
  return match ? `+880${match[1]}` : null;
}

export function isValidBdPhone(raw: string): boolean {
  return normalizeBdPhone(raw) !== null;
}

export const BD_PHONE_ERROR =
  "Enter a valid Bangladeshi mobile number (e.g. 01712345678).";

/** Zod schema: validates a BD mobile and outputs the normalized form. */
export const bdPhoneSchema = z
  .string()
  .trim()
  .transform((value, ctx) => {
    const normalized = normalizeBdPhone(value);
    if (!normalized) {
      ctx.addIssue({ code: "custom", message: BD_PHONE_ERROR });
      return z.NEVER;
    }
    return normalized;
  });

export type BdPhone = z.infer<typeof bdPhoneSchema>;

// ---------------------------------------------------------------------------
// Shipping (Part 2 backend rates)
// ---------------------------------------------------------------------------

/** Mirrors the DeliveryZone enum in prisma/schema.prisma. */
export const deliveryZoneSchema = z.enum(["INSIDE_DHAKA", "OUTSIDE_DHAKA"]);
export type DeliveryZone = z.infer<typeof deliveryZoneSchema>;

export const SHIPPING_FEE_INSIDE_DHAKA_BDT = 70;
export const SHIPPING_FEE_OUTSIDE_DHAKA_BDT = 130;
/** Free shipping when the subtotal is OVER this amount (strictly greater). */
export const FREE_SHIPPING_THRESHOLD_BDT = 3500;

export function isFreeShipping(subtotalBdt: number): boolean {
  return subtotalBdt > FREE_SHIPPING_THRESHOLD_BDT;
}

/** Shipping fee in whole BDT for a subtotal + zone. Pure — no I/O. */
export function calculateShippingFeeBdt(
  subtotalBdt: number,
  zone: DeliveryZone,
): number {
  if (!Number.isFinite(subtotalBdt) || subtotalBdt < 0) {
    throw new TypeError(
      `calculateShippingFeeBdt: invalid subtotal ${subtotalBdt}`,
    );
  }
  if (isFreeShipping(subtotalBdt)) return 0;
  return zone === "INSIDE_DHAKA"
    ? SHIPPING_FEE_INSIDE_DHAKA_BDT
    : SHIPPING_FEE_OUTSIDE_DHAKA_BDT;
}

/** "Dhaka" district (any case/whitespace) is inside; everything else outside. */
export function districtToZone(district: string): DeliveryZone {
  return district.trim().toLowerCase() === "dhaka"
    ? "INSIDE_DHAKA"
    : "OUTSIDE_DHAKA";
}

export const shippingQuoteInputSchema = z.object({
  subtotalBdt: bdtAmountSchema,
  deliveryZone: deliveryZoneSchema,
});
export type ShippingQuoteInput = z.infer<typeof shippingQuoteInputSchema>;

export interface ShippingQuote {
  readonly subtotalBdt: number;
  readonly deliveryZone: DeliveryZone;
  readonly shippingFeeBdt: number;
  readonly freeShipping: boolean;
  readonly totalBdt: number;
}

/** Validated shipping quote: parses input with zod, then computes the fee. */
export function getShippingQuote(input: ShippingQuoteInput): ShippingQuote {
  const { subtotalBdt, deliveryZone } = shippingQuoteInputSchema.parse(input);
  const shippingFeeBdt = calculateShippingFeeBdt(subtotalBdt, deliveryZone);
  return {
    subtotalBdt,
    deliveryZone,
    shippingFeeBdt,
    freeShipping: shippingFeeBdt === 0,
    totalBdt: subtotalBdt + shippingFeeBdt,
  };
}
