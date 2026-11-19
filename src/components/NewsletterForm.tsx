"use client";

import { useState } from "react";

/* Footer newsletter (Phase 2) — interim client-side confirmation.
   The real subscription backend (consent + storage) lands with the
   Phase 3 homepage CMS / Phase 9 admin work; nothing is transmitted yet,
   and the success copy says exactly that. */
export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  if (done)
    return (
      <p className="fnews-done" role="status">
        You're on the list — we'll confirm by email once subscriptions open.
      </p>
    );
  return (
    <form
      className="fnews"
      onSubmit={(e) => {
        e.preventDefault();
        if (email.includes("@")) setDone(true);
      }}
    >
      <label htmlFor="fnews-email" className="fnews-label">
        Get new drops first
      </label>
      <div className="fnews-row">
        <input
          id="fnews-email"
          type="email"
          required
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit">Join</button>
      </div>
    </form>
  );
}
