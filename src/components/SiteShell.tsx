"use client";

import { usePathname } from "next/navigation";
import Shell from "./Shell";
import EditorialShell from "./storefront/EditorialShell";

export default function SiteShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  /* Admin (Phase 9) renders its own chrome — no storefront header/footer. */
  if (pathname?.startsWith("/admin")) return <>{children}</>;
  /* Editorial surface (Part 3) renders its own Navbar/footer chrome. */
  if (pathname === "/drop-04" || pathname?.startsWith("/product/"))
    return <EditorialShell>{children}</EditorialShell>;
  return <Shell solidHeader={pathname !== "/"}>{children}</Shell>;
}
