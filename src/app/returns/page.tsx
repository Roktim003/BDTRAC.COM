import type { Metadata } from "next";
import PolicyPage from "@/components/PolicyPage";
import { returnsPolicy } from "@/lib/content";

export const metadata: Metadata = {
  title: "Returns & Exchange — TRAC",
  description: "TRAC size exchanges, wrong/damaged item handling and refunds.",
  alternates: { canonical: "/returns" },
};

export default function ReturnsPage() {
  return (
    <PolicyPage
      eyebrow="Help & Policies"
      title="Returns & Exchange"
      intro="Wrong size? Wrong item? Here's exactly how exchanges, replacements and refunds work at TRAC."
      sections={returnsPolicy()}
    />
  );
}
