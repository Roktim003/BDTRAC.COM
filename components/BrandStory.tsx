import Link from "next/link";
import { useSettings } from "@/lib/storefront";
import Reveal from "./Reveal";

/* §3.6 Brand story — copy from settings (admin-editable since Phase 10). */
export default function BrandStory() {
  const s = useSettings().story;
  return (
    <section className="block">
      <div className="wrap">
        <Reveal>
          <div className="story">
            <p className="eyebrow" style={{ color: "var(--color-accent)" }}>
              {s.kicker}
            </p>
            <h2>{s.title}</h2>
            <p className="story-text">{s.text}</p>
            <div className="story-ticks">
              {s.ticks.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
            <Link className="ui-btn ui-btn-primary ui-btn-md" href={s.cta.href}>
              {s.cta.label}
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
