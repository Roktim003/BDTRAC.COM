import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop All Products — TRAC",
  description:
    "Shop TRAC t-shirts, polos and hoodies — racing-inspired streetwear, heavyweight fabrics, Cash on Delivery across Bangladesh.",
  alternates: { canonical: "/products" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
