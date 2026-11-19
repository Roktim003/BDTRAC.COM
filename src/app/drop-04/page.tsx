import type { Metadata } from "next";
import EditorialHero from "@/components/storefront/EditorialHero";
import ProductGrid from "@/components/storefront/ProductGrid";

export const metadata: Metadata = {
  title: "DROP 04 // Concrete & Monsoon — TRAC",
  description:
    "TRAC Drop 04: heavyweight tees, boxy hoodies, cargo trousers and monsoon shell jackets, 320–480 GSM. Cut in Dhaka, worn in the rain.",
};

/** Editorial campaign page (Part 3): hero + product grid + lookbook. */
export default function Drop04Page() {
  return (
    <>
      <EditorialHero />
      <ProductGrid />
    </>
  );
}
