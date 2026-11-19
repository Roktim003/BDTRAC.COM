import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us — TRAC",
  description: "Contact TRAC about orders, sizing, stock or exchanges.",
  alternates: { canonical: "/contact" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
