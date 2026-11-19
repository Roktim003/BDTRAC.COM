import { createHmac, timingSafeEqual } from "crypto";

/* Admin authentication (Phase 9) — separate from customer accounts.
   Password comes from the ADMIN_PASSWORD environment variable. When it is
   not set (local development), the fallback password is "admin123" and
   the admin UI shows a prominent warning; production MUST set the env var.
   Sessions are HMAC-signed httpOnly cookies, 12 hours. */

export const ADMIN_COOKIE = "trac_admin";
import { sessionSecret } from "./security";

export function adminPassword(): { password: string | null; devMode: boolean } {
  const env = process.env.ADMIN_PASSWORD;
  if (env) return { password: env, devMode: false };
  /* Phase 12 fail-closed: in production with no ADMIN_PASSWORD the admin
     is LOCKED (no fallback). Locally, admin123 + devMode banner. */
  if (process.env.NODE_ENV === "production") return { password: null, devMode: false };
  return { password: "admin123", devMode: true };
}

export function checkAdminPassword(candidate: string): boolean {
  const { password } = adminPassword();
  if (password === null) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(password);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function signAdmin(): string {
  const payload = Buffer.from(
    JSON.stringify({ role: "admin", exp: Date.now() + 12 * 3600_000 })
  ).toString("base64url");
  const sig = createHmac("sha256", sessionSecret()).update("admin:" + payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyAdmin(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = createHmac("sha256", sessionSecret()).update("admin:" + payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { exp: number };
    return data.exp > Date.now();
  } catch {
    return false;
  }
}

export function isAdminRequest(req: Request): boolean {
  const cookie = req.headers.get("cookie") ?? "";
  const token = cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${ADMIN_COOKIE}=`))
    ?.slice(ADMIN_COOKIE.length + 1);
  return verifyAdmin(token);
}

export function adminCookie(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${ADMIN_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${12 * 3600}${secure}`;
}

export function adminClearedCookie(): string {
  return `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
