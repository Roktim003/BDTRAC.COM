import type { Metadata } from "next";
import { ensureStores } from "@/lib/ensureStores";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { Accordion } from "@/components/ui";
import { faqGroups } from "@/lib/content";
import { getSettings } from "@/lib/settingsStore";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "FAQ — TRAC",
  description: "Delivery, payments, sizes, exchanges and accounts — TRAC customer questions answered.",
  alternates: { canonical: "/faq" },
};

/* FAQ (Phase 10) — answers are generated from the live settings, so
   delivery figures quoted here always match checkout. */
export default async function FaqPage() {
  await ensureStores();
  const groups = faqGroups(getSettings().shipping);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: groups.flatMap((g) =>
      g.items.map((i) => ({
        "@type": "Question",
        name: i.q,
        acceptedAnswer: { "@type": "Answer", text: i.a },
      }))
    ),
  };
  return (
    <div className="wrap contact">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Reveal>
        <p className="eyebrow" style={{ color: "var(--color-accent)", marginBottom: 12 }}>
          Help Centre
        </p>
        <h1>Frequently Asked Questions</h1>
        <p style={{ color: "var(--muted)", lineHeight: 1.7, maxWidth: 620 }}>
          Everything about ordering, delivery, payments, sizes and exchanges. Still stuck?{" "}
          <Link href="/contact">Contact us</Link> or <Link href="/track">track your order</Link>.
        </p>
      </Reveal>
      {groups.map((g) => (
        <section key={g.title} className="faq-group">
          <h2>{g.title}</h2>
          <Accordion
            items={g.items.map((i) => ({ title: i.q, content: <p>{i.a}</p> }))}
            defaultOpen={-1}
          />
        </section>
      ))}
    </div>
  );
}
