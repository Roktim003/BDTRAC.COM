import type { Metadata } from "next";
import Showcase from "@/components/ui/Showcase";

export const metadata: Metadata = {
  title: "Design System — TRAC",
  description: "TRAC Phase 1 foundation: design tokens and shared UI components.",
  robots: { index: false },
};

export default function DesignSystemPage() {
  return <Showcase />;
}
