import { NextResponse } from "next/server";
import {
  clearedCookie,
  login,
  publicUser,
  requestReset,
  resetPassword,
  sessionCookie,
  signSession,
  signup,
  userFromRequest,
} from "@/lib/users";

/* Auth API (Phase 8): one route, action-based.
   POST /api/auth?action=signup|login|logout|forgot|reset
   GET  /api/auth?action=me                                        */
export async function GET(req: Request) {
  const user = await userFromRequest(req);
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  return NextResponse.json({ user: publicUser(user) });
}

export async function POST(req: Request) {
  const action = new URL(req.url).searchParams.get("action") ?? "";
  const body = (await req.json().catch(() => ({}))) as Record<string, string>;

  if (action === "logout") {
    return NextResponse.json(
      { ok: true },
      { headers: { "Set-Cookie": clearedCookie() } }
    );
  }
  if (action === "signup") {
    const r = await signup(body);
    if (!r.ok) return NextResponse.json({ errors: r.errors }, { status: 400 });
    return NextResponse.json(
      { user: publicUser(r.user) },
      { status: 201, headers: { "Set-Cookie": sessionCookie(signSession(r.user.id)) } }
    );
  }
  if (action === "login") {
    const r = await login(body.email ?? "", body.password ?? "");
    if (!r.ok)
      return NextResponse.json({ errors: r.errors }, { status: r.status ?? 400 });
    return NextResponse.json(
      { user: publicUser(r.user) },
      { headers: { "Set-Cookie": sessionCookie(signSession(r.user.id)) } }
    );
  }
  if (action === "forgot") {
    await requestReset(body.email ?? "");
    return NextResponse.json({ ok: true }); // never reveals account existence
  }
  if (action === "reset") {
    const r = await resetPassword(body.token ?? "", body.password ?? "");
    if (!r.ok) return NextResponse.json({ errors: r.errors }, { status: 400 });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
