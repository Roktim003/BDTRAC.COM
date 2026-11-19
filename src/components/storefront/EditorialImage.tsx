"use client";

import { useState } from "react";
import Image from "next/image";

/**
 * Editorial image frame (Part 3, optimized Part 6). Renders the
 * product/campaign asset through next/image — AVIF/WebP via
 * next.config, responsive `sizes`, lazy by default, `priority` for the
 * hero — inside a fixed-aspect frame, so the box is reserved before the
 * bytes arrive (zero layout shift) and a shimmering skeleton covers the
 * wait on slow 4G. Until TRAC photography is shot, a missing asset
 * falls back to an editorial typographic plate (title + GSM spec) —
 * never a broken-image icon, never a stock photo passed off as product.
 */
export default function EditorialImage({
  src,
  alt,
  title,
  spec,
  tone = 0,
  className = "",
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  priority = false,
}: {
  src: string;
  alt: string;
  title: string;
  spec?: string;
  tone?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={`sf-frame sf-tone-${tone % 4} ${className}`}>
      {!failed && !loaded ? <div className="sf-frame-skeleton" aria-hidden="true" /> : null}
      {!failed ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`sf-frame-img ${loaded ? "is-loaded" : ""}`}
        />
      ) : null}
      {failed ? (
        <div className="sf-frame-fallback" aria-hidden="true">
          <span className="sf-frame-fallback-title">{title}</span>
          {spec ? <span className="font-spec sf-frame-fallback-spec">{spec}</span> : null}
          <span className="font-spec sf-frame-fallback-note">IMAGE — STUDIO SHOOT PENDING</span>
        </div>
      ) : null}
    </div>
  );
}
