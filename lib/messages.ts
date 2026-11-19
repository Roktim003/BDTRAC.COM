import { promises as fs } from "fs";
import path from "path";
import { normalizeBDPhone, PHONE_ERROR } from "./bd";
import { dbEnabled, readDoc, writeDoc } from "./db";

/* Contact messages (Phase 10) — the contact form used to show a success
   state without sending anything. Messages now persist to
   .data/messages.json and are readable in the admin (Phase 9 panel).
   Production: same seam — Supabase table or the support inbox. */

export interface ContactMessage {
  id: string;
  name: string;
  phone: string;
  subject: string;
  message: string;
  at: string;
}

const FILE = path.join(process.cwd(), ".data", "messages.json");

export async function listMessages(): Promise<ContactMessage[]> {
  try {
    const list = dbEnabled
      ? ((await readDoc<ContactMessage[]>("messages")) ?? [])
      : (JSON.parse(await fs.readFile(FILE, "utf8")) as ContactMessage[]);
    return list.sort((a, b) => b.at.localeCompare(a.at));
  } catch {
    return [];
  }
}

export async function addMessage(input: {
  name?: string;
  phone?: string;
  subject?: string;
  message?: string;
}): Promise<{ ok: true } | { ok: false; errors: Record<string, string> }> {
  const errors: Record<string, string> = {};
  const name = (input.name ?? "").trim();
  const phone = input.phone ? normalizeBDPhone(input.phone) : null;
  const subject = (input.subject ?? "").trim();
  const message = (input.message ?? "").trim();
  if (name.length < 3) errors.name = "Please enter your name.";
  if (!phone) errors.phone = PHONE_ERROR;
  if (subject.length < 3) errors.subject = "Add a short subject.";
  if (message.length < 10) errors.message = "Tell us a little more (min 10 characters).";
  if (Object.keys(errors).length) return { ok: false, errors };

  const list = await listMessages();
  list.push({
    id: "m_" + Math.random().toString(36).slice(2, 10),
    name,
    phone: phone!,
    subject,
    message,
    at: new Date().toISOString(),
  });
  if (dbEnabled) {
    await writeDoc("messages", list);
  } else {
    await fs.mkdir(path.dirname(FILE), { recursive: true });
    await fs.writeFile(FILE, JSON.stringify(list, null, 2));
  }
  return { ok: true };
}
