"use client";

import { useRef, type ReactNode, type PointerEvent } from "react";

/**
 * 3D tilt wrapper — tracks the pointer and rotates the child in 3D
 * with a specular glare that follows the cursor. Springs back on leave.
 */
export default function Tilt({
  children,
  max = 13,
  className = "",
  scale = 1.03,
}: {
  children: ReactNode;
  max?: number;
  className?: string;
  scale?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.classList.add("tilting");
    el.style.transform = `perspective(950px) rotateX(${(-py * max).toFixed(
      2
    )}deg) rotateY(${(px * max).toFixed(2)}deg) translateY(-6px) scale(${scale})`;
    el.style.setProperty("--gx", `${((px + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty("--gy", `${((py + 0.5) * 100).toFixed(1)}%`);
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove("tilting");
    el.style.transform =
      "perspective(950px) rotateX(0deg) rotateY(0deg) translateY(0) scale(1)";
  };

  return (
    <div className={`tilt-scene ${className}`}>
      <div ref={ref} className="tilt" onPointerMove={onMove} onPointerLeave={onLeave}>
        {children}
        <div className="glare" />
      </div>
    </div>
  );
}
