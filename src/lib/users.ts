import { promises as fs } from "fs";
import path from "path";
import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "crypto";
import { normalizeBDPhone, PHONE_ERROR } from "./bd";

/* Customer accounts (Phase 8). Same persistence seam as orders
   (.data/users.json locally; Supabase Auth + tables in production —
   API contracts stay identical).
   Security: passwords are scrypt-hashed with per-user salts (never stored
   or logged in plaintext); sessions are HMAC-signed httpOnly cookies;
   login attempts are rate-limited per email. */

export interface Address {
  id: string;
  label: string;
  division: string;
  district: string;
  address: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  passHash: string;
  salt: string;
  addresses: Address[];
  wishlist: string[];
  createdAt: string;
}

export type PublicUser = Omit<User, "passHash" | "salt">;

export function publicUser(u: User): PublicUser {
  const { passHash, salt, ...rest } = u;
  void passHash;
  void salt;
  return rest;
}

interface ResetToken {
  email: string;
  tokenHash: string;
  expires: number;
}

interface UserStore {
  users: User[];
  resetTokens: ResetToken[];
  outbox: { to: string; kind: string; link: string; at: string }[];
}

const DATA_FILE = path.join(process.cwd(), ".data", "users.json");
import { sessionSecret } from "./security";
import { dbEnabled, readDoc, writeDoc } from "./db";
export const SESSION_COOKIE = "trac_session";
const SESSION_DAYS = 7;

async function readStore(): Promise<UserStore> {
  if (dbEnabled) return (await readDoc<UserStore>("users")) ?? { users: [], resetTokens: [], outbox: [] };
  try {
    return JSON.parse(await fs.readFile(DATA_FILE, "utf8")) as UserStore;
  } catch {
    return { users: [], resetTokens: [], outbox: [] };
  }
}

async function writeStore(store: UserStore) {
  if (dbEnabled) return writeDoc("users", store);
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2));
}

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString("hex");
}

function verifyPassword(password: string, u: User): boolean {
  const a = Buffer.from(hashPassword(password, u.salt), "hex");
  const b = Buffer.from(u.passHash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

/* ---------- sessions ---------- */

export function signSession(uid: string): string {
  const payload = Buffer.from(
    JSON.stringify({ uid, exp: Date.now() + SESSION_DAYS * 86400_000 })
  ).toString("base64url");
  const sig = createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifySession(token: string | undefined): string | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
      uid: string;
      exp: number;
    };
    return data.exp > Date.now() ? data.uid : null;
  } catch {
    return null;
  }
}

export function sessionCookie(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}${secure}`;
}

export function clearedCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export async function userFromRequest(req: Request): Promise<User | null> {
  const cookie = req.headers.get("cookie") ?? "";
  const token = cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);
  const uid = verifySession(token);
  if (!uid) return null;
  const store = await readStore();
  return store.users.find((u) => u.id === uid) ?? null;
}

/* ---------- login rate limiting (per-process) ---------- */

const attempts = new Map<string, { fails: number; lockedUntil: number }>();

export function loginLocked(email: string): boolean {
  const a = attempts.get(email);
  return Boolean(a && a.lockedUntil > Date.now());
}

function recordFail(email: string) {
  const a = attempts.get(email) ?? { fails: 0, lockedUntil: 0 };
  a.fails += 1;
  if (a.fails >= 5) {
    a.lockedUntil = Date.now() + 10 * 60_000;
    a.fails = 0;
  }
  attempts.set(email, a);
}

function recordSuccess(email: string) {
  attempts.delete(email);
}

/* ---------- account operations ---------- */

export type AuthResult =
  | { ok: true; user: User }
  | { ok: false; errors: Record<string, string>; status?: number };

export async function signup(input: {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
}): Promise<AuthResult> {
  const errors: Record<string, string> = {};
  const name = (input.name ?? "").trim();
  const email = (input.email ?? "").trim().toLowerCase();
  const phone = input.phone ? normalizeBDPhone(input.phone) : null;
  const password = input.password ?? "";
  if (name.length < 3) errors.name = "Please enter your full name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address.";
  if (!phone) errors.phone = PHONE_ERROR;
  if (password.length < 8) errors.password = "Use at least 8 characters.";
  if (Object.keys(errors).length) return { ok: false, errors };

  const store = await readStore();
  if (store.users.some((u) => u.email === email))
    return { ok: false, errors: { email: "An account with this email already exists." } };
  if (store.users.some((u) => u.phone === phone))
    return { ok: false, errors: { phone: "An account with this mobile number already exists." } };

  const salt = randomBytes(16).toString("hex");
  const user: User = {
    id: "u_" + randomBytes(8).toString("hex"),
    name,
    email,
    phone: phone!,
    passHash: hashPassword(password, salt),
    salt,
    addresses: [],
    wishlist: [],
    createdAt: new Date().toISOString(),
  };
  store.users.push(user);
  await writeStore(store);
  return { ok: true, user };
}

export async function login(emailRaw: string, password: string): Promise<AuthResult> {
  const email = emailRaw.trim().toLowerCase();
  if (loginLocked(email))
    return {
      ok: false,
      errors: { form: "Too many failed attempts — try again in 10 minutes." },
      status: 429,
    };
  const store = await readStore();
  const user = store.users.find((u) => u.email === email);
  if (!user || !verifyPassword(password, user)) {
    recordFail(email);
    return { ok: false, errors: { form: "Email or password is incorrect." }, status: 401 };
  }
  recordSuccess(email);
  return { ok: true, user };
}

/* Password reset: token is created and written to the dev outbox
   (.data/users.json → outbox) because no email provider is configured.
   In production the same token link is emailed via the mail provider /
   Supabase Auth. The request response never reveals whether an email
   has an account. */
export async function requestReset(emailRaw: string): Promise<void> {
  const email = emailRaw.trim().toLowerCase();
  const store = await readStore();
  const user = store.users.find((u) => u.email === email);
  if (!user) return;
  const token = randomBytes(32).toString("hex");
  store.resetTokens = store.resetTokens.filter((t) => t.email !== email);
  store.resetTokens.push({
    email,
    tokenHash: createHash("sha256").update(token).digest("hex"),
    expires: Date.now() + 3600_000,
  });
  const link = `/reset?token=${token}`;
  store.outbox.push({
    to: email,
    kind: "password-reset",
    link: `/reset?token=${token}`,
    at: new Date().toISOString(),
  });
  await writeStore(store);
  /* Phase 13: deliver by email when a provider is configured
     (RESEND_API_KEY + MAIL_FROM); otherwise the link stays in the
     outbox above for manual/support delivery. */
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  if (resendKey && from) {
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.bdtrac.com";
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to: email,
          subject: "Reset your TRAC password",
          text: `Reset your TRAC password (link valid for 1 hour): ${base}${link}`,
        }),
      });
    } catch {
      /* delivery failure must not break the generic response */
    }
  }

}

export async function resetPassword(token: string, password: string): Promise<AuthResult> {
  if (password.length < 8)
    return { ok: false, errors: { password: "Use at least 8 characters." } };
  const store = await readStore();
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const entry = store.resetTokens.find((t) => t.tokenHash === tokenHash);
  if (!entry || entry.expires < Date.now())
    return { ok: false, errors: { form: "This reset link is invalid or has expired." } };
  const user = store.users.find((u) => u.email === entry.email);
  if (!user) return { ok: false, errors: { form: "This reset link is invalid or has expired." } };
  user.salt = randomBytes(16).toString("hex");
  user.passHash = hashPassword(password, user.salt);
  store.resetTokens = store.resetTokens.filter((t) => t.email !== entry.email);
  await writeStore(store);
  return { ok: true, user };
}

/* ---------- mutations used by /api/account ---------- */

export async function updateUser(
  uid: string,
  patch: (u: User, store: UserStore) => Record<string, string> | null
): Promise<AuthResult> {
  const store = await readStore();
  const user = store.users.find((u) => u.id === uid);
  if (!user) return { ok: false, errors: { form: "Account not found." }, status: 404 };
  const errors = patch(user, store);
  if (errors) return { ok: false, errors };
  await writeStore(store);
  return { ok: true, user };
}
