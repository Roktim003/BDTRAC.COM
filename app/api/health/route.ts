import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalogStore";
import { dbEnabled } from "@/lib/db";
import { ensureStores } from "@/lib/ensureStores";

/* Health check (Phase 12) — for uptime monitoring after deployment.
   Exposes no sensitive data: status + catalog size only. */
export async function GET() {
  await ensureStores();
  const { products } = getCatalog();
  return NextResponse.json({
    ok: true,
    storage: dbEnabled ? "postgres" : "file",
    products: products.length,
    time: new Date().toISOString(),
  });
}
