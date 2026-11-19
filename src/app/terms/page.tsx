import type { Metadata } from "next";
import PolicyPage from "@/components/PolicyPage";
import { termsOfService } from "@/lib/content";

export const metadata: Metadata = {
  title: "Terms of Service — TRAC",
  description: "The terms that apply when you order from TRAC.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <PolicyPage
      eyebrow="Help & Policies"
      title="Terms of Service"
      intro="The simple terms that apply to every TRAC order."
      sections={termsOfService()}
    />
  );
}
