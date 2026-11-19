"use client";

import { useState } from "react";

/**
 * Editorial image frame (Part 3). Renders the product/campaign asset when
 * it exists; until TRAC photography is shot, the frame falls back to an
 * editorial typographic plate (title + GSM spec on the surface tone) —
 * never a broken-image icon, never a stock photo passed off as product.
 */
export default function EditorialImage({
  src,
  alt,
  title,
  spec,
  tone = 0,
  className = "",
}: {
  src: string;
  alt: string;
  title: string;
  spec?: string;
  tone?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`sf-frame sf-tone-${tone % 4} ${className}`}>
      {!failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className="sf-frame-img"
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
