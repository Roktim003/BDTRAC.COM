import type { Metadata } from "next";
import { ensureStores } from "@/lib/ensureStores";
import PolicyPage from "@/components/PolicyPage";
import { shippingPolicy } from "@/lib/content";
import { getSettings } from "@/lib/settingsStore";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shipping & Delivery — TRAC",
  description: "TRAC delivery charges, zones and times for inside and outside Dhaka, and our free-delivery threshold.",
  alternates: { canonical: "/shipping-policy" },
};

export default async function ShippingPolicyPage() {
  await ensureStores();
  const ship = getSettings().shipping;
  return (
    <PolicyPage
      eyebrow="Help & Policies"
      title="Shipping & Delivery"
      intro="How delivery works at TRAC — charges, zones and times. These are the same rates the checkout charges; if they ever change, this page changes with them."
      sections={shippingPolicy(ship)}
    />
  );
}
