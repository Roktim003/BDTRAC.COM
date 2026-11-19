"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { discountPct, taka, type Product } from "@/lib/products";
import { useCart } from "@/lib/cart";

export default function QuickView({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const { add, setOpen } = useCart();
  const [size, setSize] = useState("M");
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setSize("M");
    if (product) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [product]);

  if (!product) return null;
  const off = discountPct(product);

  /** 3D tilt on the quick-view image */
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const img = imgRef.current;
    if (!img) return;
    const r = img.parentElement!.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    img.style.transition = "transform .08s ease-out";
    img.style.transform = `perspective(1000px) rotateX(${(-py * 16).toFixed(
      2
    )}deg) rotateY(${(px * 16).toFixed(2)}deg) scale(1.04)`;
  };
  const onLeave = () => {
    const img = imgRef.current;
    if (!img) return;
    img.style.transition = "transform .6s cubic-bezier(.22,1,.36,1)";
    img.style.transform =
      "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)";
  };

  const addToCart = () => {
    add(product, size, 1);
    onClose();
    setTimeout(() => setOpen(true), 200);
  };

  return (
    <>
      <div className="overlay show" onClick={onClose} />
      <div className="qv show">
        <div className="box">
          <button className="xbtn" onClick={onClose}>
            &times;
          </button>
          <div className="qimg" onPointerMove={onMove} onPointerLeave={onLeave}>
            <Image
              ref={imgRef}
              src={product.images[0]}
              alt={product.name}
              width={700}
              height={900}
            />
          </div>
          <div className="detail">
            <div className="eyebrow" style={{ color: "var(--muted)" }}>
              TRAC &mdash; New In
            </div>
            <h2>{product.name}</h2>
            <div className="price">
              <span className="now">{taka(product.price)}</span>
              {product.compareAt && (
                <span className="was">{taka(product.compareAt)}</span>
              )}
              {off > 0 && <span className="off">-{off}%</span>}
            </div>
            <label className="lbl">Select size</label>
            <div className="sizes">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  className={s === size ? "sel" : ""}
                  onClick={() => setSize(s)}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="meta">
              <b>Cash on Delivery</b> available across Bangladesh.
              <br />
              Delivery inside Dhaka: 1&ndash;2 days &middot; Outside Dhaka:
              3&ndash;5 days.
            </div>
            <button
              className="btn black"
              onClick={addToCart}
              disabled={product.soldOut}
            >
              {product.soldOut ? "Sold Out" : "Add to Cart"}
            </button>
            <div style={{ marginTop: 14, textAlign: "center" }}>
              <Link
                href={`/products/${product.id}`}
                onClick={onClose}
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  letterSpacing: ".12em",
                  textTransform: "uppercase",
                  borderBottom: "1px solid #000",
                  paddingBottom: 2,
                }}
              >
                View full details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
