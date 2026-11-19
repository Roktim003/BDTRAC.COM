import { createHash } from "crypto";

/* Security primitives (Phase 12 hardening).
   - sessionSecret(): FAIL-CLOSED in production. Previously a shared dev
     fallback secret shipped in the code; in production that would let
     anyone who read the code forge session/admin cookies. Now, if
     AUTH_SECRET is unset in production, signing throws and login is
     impossible until the env var is set (Phase 13 checklist item #1).
   - rateLimit(): simple in-memory per-key throttle for public POST
     endpoints (orders, contact). Per-instance memory — on serverless it
     is best-effort per instance, which is stated honestly in the QA
     report; account-level login lockout (lib/users.ts) is persistent. */

export function sessionSecret(): string {
  const env = process.env.AUTH_SECRET;
  if (env) return env;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET must be set in production (see Phase 13 checklist).");
  }
  return "trac-dev-secret-change-in-production";
}

export function secretHash(value: string): string {
  return createHash("sha256").update(sessionSecret() + ":" + value).digest("hex");
}

const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now > b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count >= max) return false;
  b.count++;
  return true;
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd ? fwd.split(",")[0].trim() : "local";
}
