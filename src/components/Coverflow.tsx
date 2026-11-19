"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { discountPct, taka, type Product } from "@/lib/products";

/**
 * 3D coverflow carousel — products arranged on a 3D arc with
 * perspective depth. Drag, arrows or dots to spin through the drop.
 */
export default function Coverflow({ products }: { products: Product[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = products.length;
  const drag = useRef<{ x: number; moved: boolean } | null>(null);

  const go = useCallback(
    (dir: number) => setActive((a) => (a + dir + n) % n),
    [n]
  );

  useEffect(() => {
    if (paused || n < 2) return;
    const t = setInterval(() => setActive((a) => (a + 1) % n), 4200);
    return () => clearInterval(t);
  }, [paused, n]);

  const onDown = (x: number) => (drag.current = { x, moved: false });
  const onMove = (x: number) => {
    const d = drag.current;
    if (!d) return;
    const dx = x - d.x;
    if (Math.abs(dx) > 60) {
      d.moved = true;
      go(dx < 0 ? 1 : -1);
      d.x = x;
    }
  };
  const onUp = () => (drag.current = null);

  const cardStyle = (i: number): React.CSSProperties => {
    let off = i - active;
    // take the shorter way around for a looping feel
    if (off > n / 2) off -= n;
    if (off < -n / 2) off += n;
    const c = Math.max(-2.4, Math.min(2.4, off));
    const abs = Math.abs(c);
    return {
      transform: `translateX(-50%) translateX(${(c * 62).toFixed(1)}%) rotateY(${(
        c * -46
      ).toFixed(1)}deg) translateZ(${(-abs * 170).toFixed(0)}px)`,
      zIndex: 100 - Math.round(abs * 20),
      opacity: abs > 2.2 ? 0 : 1 - abs * 0.22,
      filter: `brightness(${(1 - abs * 0.18).toFixed(2)})`,
      pointerEvents: abs > 2.2 ? "none" : "auto",
    };
  };

  return (
    <div>
      <div
        className="cf-stage"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => {
          setPaused(false);
          onUp();
        }}
        onPointerDown={(e) => onDown(e.clientX)}
        onPointerMove={(e) => onMove(e.clientX)}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <div className="cf-floor" />
        {products.map((p, i) => {
          const off = discountPct(p);
          return (
            <div key={p.id} className="cf-card" style={cardStyle(i)}>
              <div className="card">
                <div
                  className="media"
                  onClick={() => {
                    const d = drag.current;
                    if (d?.moved) return;
                    if (i !== active) setActive(i);
                  }}
                >
                  {p.soldOut ? (
                    <span className="badge soldout">Sold out</span>
                  ) : off > 0 ? (
                    <span className="badge sale">-{off}%</span>
                  ) : (
                    <span className="badge newb">New</span>
                  )}
                  <Image
                    className="main"
                    src={p.images[0]}
                    alt={p.name}
                    width={600}
                    height={800}
                    draggable={false}
                    priority={i === 0}
                  />
                </div>
                <div className="info">
                  <h3>
                    <Link href={`/products/${p.id}`}>{p.name}</Link>
                  </h3>
                  <div className="price" style={{ justifyContent: "center" }}>
                    <span className="now">{taka(p.price)}</span>
                    {p.compareAt && (
                      <span className="was">{taka(p.compareAt)}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="cf-nav">
        <button className="cf-arrow" onClick={() => go(-1)} aria-label="Previous">
          <svg viewBox="0 0 24 24">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </button>
        <div className="cf-dots">
          {products.map((p, i) => (
            <button
              key={p.id}
              className={i === active ? "on" : ""}
              onClick={() => setActive(i)}
              aria-label={`Go to ${p.name}`}
            />
          ))}
        </div>
        <button className="cf-arrow" onClick={() => go(1)} aria-label="Next">
          <svg viewBox="0 0 24 24">
            <path d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
