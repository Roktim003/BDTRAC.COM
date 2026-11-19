import Reveal from "@/components/Reveal";
import type { PolicySection } from "@/lib/content";

/* Shared policy layout (Phase 10) — server-rendered, printable. */
export default function PolicyPage({
  eyebrow,
  title,
  intro,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  sections: PolicySection[];
}) {
  return (
    <div className="wrap contact policy">
      <Reveal>
        <p className="eyebrow" style={{ color: "var(--color-accent)", marginBottom: 12 }}>
          {eyebrow}
        </p>
        <h1>{title}</h1>
        <p style={{ color: "var(--muted)", lineHeight: 1.7, maxWidth: 640 }}>{intro}</p>
      </Reveal>
      {sections.map((s) => (
        <section key={s.heading} className="policy-sec">
          <h2>{s.heading}</h2>
          {s.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </section>
      ))}
    </div>
  );
}
