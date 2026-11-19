import { NextResponse } from "next/server";
import { addMessage } from "@/lib/messages";
import { rateLimit, clientIp } from "@/lib/security";

/* Contact form endpoint (Phase 10). */
export async function POST(req: Request) {
  if (!rateLimit(`contact:${clientIp(req)}`, 10, 60_000))
    return NextResponse.json({ errors: { form: "Too many messages — wait a minute and try again." } }, { status: 429 });
  const body = (await req.json().catch(() => ({}))) as Record<string, string>;
  const r = await addMessage(body);
  if (!r.ok) return NextResponse.json({ errors: r.errors }, { status: 400 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
