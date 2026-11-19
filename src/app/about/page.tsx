import type { Metadata } from "next";
import { ensureStores } from "@/lib/ensureStores";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import Stores from "@/components/Stores";
import { getSettings } from "@/lib/settingsStore";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About TRAC — Premium Streetwear, Bangladesh",
  description:
    "TRAC is a Bangladesh streetwear label built around motion: racing-inspired design, heavyweight fabrics, honest prices.",
  alternates: { canonical: "/about" },
};

/* About TRAC (Phase 10) — brand story from settings (admin-editable),
   values from the same story config the homepage uses, real store data,
   support channels. No invented history, dates or numbers. */
export default async function AboutPage() {
  await ensureStores();
  const { story } = getSettings();
  return (
    <div>
      <div className="wrap contact">
        <Reveal>
          <p className="eyebrow" style={{ color: "var(--color-accent)", marginBottom: 12 }}>
            {story.kicker}
          </p>
          <h1>{story.title}</h1>
          <p style={{ fontSize: 17, lineHeight: 1.75, maxWidth: 680 }}>{story.text}</p>
          <p style={{ color: "var(--muted)", lineHeight: 1.75, margin: "16px 0 8px", maxWidth: 680 }}>
            Not just another T-shirt. Every TRAC piece starts from a simple test — would we wear
            it on the street, at training, and out at night? If it only works in one place, it
            doesn't make the drop.
          </p>
          <div className="story-ticks" style={{ margin: "18px 0 26px" }}>
            {story.ticks.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </Reveal>

        <Reveal>
          <div className="about-grid">
            <div>
              <h2>Design philosophy</h2>
              <p>
                Motion first. Racing lines, bold graphics and cuts that move with you — oversized
                where it should be, clean where it counts. We design in Bangladesh, for
                Bangladesh weather and streets.
              </p>
            </div>
            <div>
              <h2>Fabric & quality</h2>
              <p>
                Heavyweight cotton that holds its shape — our tees run up to 240 GSM, hoodies to
                400 GSM brushed fleece. Every product page lists its exact fabric and GSM; we
                don't print numbers we haven't measured.
              </p>
            </div>
            <div>
              <h2>Honest pricing</h2>
              <p>
                We sell direct with Cash on Delivery across the country. When you see a
                compare-at price, it's a real earlier price — no invented discounts, no fake
                scarcity, no countdown timers.
              </p>
            </div>
            <div>
              <h2>Support that answers</h2>
              <p>
                Questions about sizing, an order, or an exchange? Message us any time — and track
                any order yourself, instantly, with your order ID and mobile number.
              </p>
              <p style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link className="ui-btn ui-btn-dark ui-btn-sm" href="/contact">
                  Contact Us
                </Link>
                <Link className="ui-btn ui-btn-ghost ui-btn-sm" href="/track">
                  Track Order
                </Link>
                <Link className="ui-btn ui-btn-ghost ui-btn-sm" href="/faq">
                  FAQ
                </Link>
              </p>
            </div>
          </div>
        </Reveal>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
          <Link className="ui-btn ui-btn-primary ui-btn-md" href="/products?sort=new">
            Shop the Latest Drop
          </Link>
          <Link className="ui-btn ui-btn-light ui-btn-md" href="/collections/racing-series">
            The Racing Series
          </Link>
        </div>
      </div>
      <Stores />
    </div>
  );
}
