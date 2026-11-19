"use client";

import { usePathname } from "next/navigation";
import Shell from "./Shell";

export default function SiteShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  /* Admin (Phase 9) renders its own chrome — no storefront header/footer. */
  if (pathname?.startsWith("/admin")) return <>{children}</>;
  return <Shell solidHeader={pathname !== "/"}>{children}</Shell>;
}
