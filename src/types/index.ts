/**
 * BDTRAC — shared foundation types (Part 1).
 *
 * Single home for cross-cutting types used by storefront, checkout and API
 * code. Feature-specific types live beside their feature and are re-exported
 * here only when they become genuinely shared. See CLAUDE.md for the strict
 * TypeScript rules every file in this project follows.
 */

/** UI / content language. Bengali copy renders in Noto Sans Bengali. */
export type Locale = "en" | "bn";

/** All money on BDTRAC is Bangladeshi taka — never float-format ad hoc. */
export type CurrencyCode = "BDT";

/** A monetary amount in whole taka (BDT has no minor unit in storefront use). */
export interface Money {
  readonly amount: number;
  readonly currency: CurrencyCode;
}

/** Stock-keeping unit, e.g. "BDT-TEE-BLK-M". Spec data renders in JetBrains Mono. */
export type Sku = string;

/** Fabric weight in grams per square metre — the headline spec for BDTRAC tees. */
export type Gsm = number;

/** Standard BDTRAC apparel sizes. */
export type ApparelSize = "S" | "M" | "L" | "XL" | "XXL";
