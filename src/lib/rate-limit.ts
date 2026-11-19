/**
 * Rate limiting for the editorial order API (Part 4).
 *
 * Fixed-window counters keyed by an arbitrary string. The order route
 * checks TWO keys per request — the client IP and the normalized +880
 * phone — because fake COD spam in Bangladesh typically rotates one of
 * the two while reusing the other.
 *
 * Storage is in-memory per process, which is correct for a single
 * instance and a safe fail-closed default elsewhere; swap the bucket
 * map for Redis/Upstash when the deployment scales horizontally
 * (same function signature).
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): RateLimitResult {
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }
  if (bucket.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }
  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count, retryAfterSeconds: 0 };
}

/** Order-creation policy: strict, because every fake order costs a courier call. */
export const ORDER_RATE_LIMITS = {
  perIp: { limit: 5, windowMs: 10 * 60 * 1000 },
  perPhone: { limit: 3, windowMs: 10 * 60 * 1000 },
} as const;

export function checkOrderRateLimits(
  ip: string,
  normalizedPhone: string,
): { allowed: true } | { allowed: false; scope: "ip" | "phone"; retryAfterSeconds: number } {
  const byIp = checkRateLimit(
    `editorial-order:ip:${ip}`,
    ORDER_RATE_LIMITS.perIp.limit,
    ORDER_RATE_LIMITS.perIp.windowMs,
  );
  if (!byIp.allowed) {
    return { allowed: false, scope: "ip", retryAfterSeconds: byIp.retryAfterSeconds };
  }
  const byPhone = checkRateLimit(
    `editorial-order:phone:${normalizedPhone}`,
    ORDER_RATE_LIMITS.perPhone.limit,
    ORDER_RATE_LIMITS.perPhone.windowMs,
  );
  if (!byPhone.allowed) {
    return { allowed: false, scope: "phone", retryAfterSeconds: byPhone.retryAfterSeconds };
  }
  return { allowed: true };
}

/** Client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIpFromHeaders(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}

/** Test helper — clears all buckets. */
export function __resetRateLimits(): void {
  buckets.clear();
}
