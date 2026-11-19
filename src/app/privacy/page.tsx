import type { Metadata } from "next";
import PolicyPage from "@/components/PolicyPage";
import { privacyPolicy } from "@/lib/content";

export const metadata: Metadata = {
  title: "Privacy Policy — TRAC",
  description: "What TRAC collects when you shop, how it is used, and your choices.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <PolicyPage
      eyebrow="Help & Policies"
      title="Privacy Policy"
      intro="What we collect, why, and what we never do with it."
      sections={privacyPolicy()}
    />
  );
}
