"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useSettings } from "@/lib/storefront";

/** Full-bleed video hero with scroll parallax.
 *  Content comes from lib/homepage (Phase 9 CMS data layer). The approved
 *  TRAC interface is the minimal treatment — video + underlined CTA; the
 *  headline treatment renders only when enabled in config. */
export default function Hero() {
  const vref = useRef<HTMLDivElement>(null);
  const { hero } = useSettings();

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = vref.current;
        if (!el) return;
        const y = Math.min(window.scrollY, window.innerHeight);
        el.style.transform = `translateY(${(y * 0.28).toFixed(1)}px) scale(${(1 + y * 0.00025).toFixed(4)})`;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="hero">
      <div className="vwrap" ref={vref}>
        <video
          src={hero.videoUrl}
          poster={hero.posterUrl}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
        />
      </div>
      <div className="shade" />
      {hero.headline.enabled ? (
        <div className="hero-copy">
          <p className="eyebrow">{hero.headline.kicker}</p>
          <h1>{hero.headline.title}</h1>
          <p className="hero-sub">{hero.headline.text}</p>
          <div className="hero-ctas">
            <Link className="ui-btn ui-btn-primary ui-btn-lg" href={hero.cta.href}>
              Shop the Collection
            </Link>
            {hero.headline.secondaryCta && (
              <Link className="ui-btn ui-btn-ghost ui-btn-lg" href={hero.headline.secondaryCta.href}>
                {hero.headline.secondaryCta.label}
              </Link>
            )}
          </div>
        </div>
      ) : (
        <Link className="shopnow" href={hero.cta.href}>
          {hero.cta.label}
        </Link>
      )}
    </section>
  );
}
