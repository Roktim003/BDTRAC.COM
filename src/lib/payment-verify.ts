import { createHash, createVerify } from "node:crypto";

/**
 * Payment callback verification primitives (Part 5), kept out of the
 * route file (Next.js route modules may only export handlers) and
 * unit-testable in isolation.
 */

/** SSLCommerz verify_sign: md5 of `key=value&…&store_passwd=md5(pass)`. */
export function verifySslcommerzSign(
  body: Record<string, string>,
  storePassword: string,
): boolean {
  const keys = (body.verify_key ?? "").split(",").map((k) => k.trim()).filter(Boolean);
  if (keys.length === 0 || !body.verify_sign) return false;
  const parts = keys.map((k) => `${k}=${body[k] ?? ""}`);
  parts.push(`store_passwd=${createHash("md5").update(storePassword).digest("hex")}`);
  const expected = createHash("md5").update(parts.join("&")).digest("hex");
  return expected === body.verify_sign;
}

/** Nagad: RSA-SHA256 signature over the sensitive data string. */
export function verifyNagadSignature(
  sensitiveData: string,
  signatureBase64: string,
  publicKeyPem: string,
): boolean {
  try {
    const verifier = createVerify("RSA-SHA256");
    verifier.update(sensitiveData);
    verifier.end();
    return verifier.verify(publicKeyPem, signatureBase64, "base64");
  } catch {
    return false;
  }
}

