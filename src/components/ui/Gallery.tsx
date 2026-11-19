"use client";

import Image from "next/image";
import { useState } from "react";

/* Gallery — main image + thumbnails, arrow keys move between images,
   selected thumb is ringed and announced via aria. Zoom/full PDP behaviour
   lands in Phase 5; this is the foundation pattern. */
export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [i, setI] = useState(0);
  return (
    <div
      className="ui-gallery"
      tabIndex={0}
      role="group"
      aria-label={`${alt} image gallery`}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") setI((v) => Math.min(images.length - 1, v + 1));
        if (e.key === "ArrowLeft") setI((v) => Math.max(0, v - 1));
      }}
    >
      <div className="ui-gallery-main">
        <Image src={images[i]} alt={`${alt} — view ${i + 1}`} width={880} height={1100} />
      </div>
      <div className="ui-thumbs">
        {images.map((src, idx) => (
          <button
            key={src + idx}
            className={`ui-thumb${idx === i ? " on" : ""}`}
            onClick={() => setI(idx)}
            aria-label={`Show image ${idx + 1}`}
            aria-current={idx === i}
          >
            <Image src={src} alt="" width={120} height={150} />
          </button>
        ))}
      </div>
    </div>
  );
}
