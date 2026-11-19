import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/CheckoutModal";

export const metadata: Metadata = {
  title: "Checkout — TRAC Drop 04",
  description:
    "Bilingual checkout for TRAC Drop 04. Cash on Delivery available nationwide / সারাদেশে ক্যাশ অন ডেলিভারি সুবিধা.",
};

/**
 * Full-page editorial checkout (Part 4) — the same CheckoutForm as the
 * quick modal. It lives under /drop-04 because /checkout is the legacy
 * catalog's live Phase 7 checkout; this page takes that URL over when
 * the Prisma catalog cutover lands.
 */
export default function Drop04CheckoutPage() {
  return (
    <div className="co-page">
      <h1 className="co-page-title">
        Checkout <span className="font-bn co-bn-inline">/ চেকআউট</span>
      </h1>
      <CheckoutForm />
    </div>
  );
}
