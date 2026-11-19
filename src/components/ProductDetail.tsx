"use client";

import { useEffect, useRef, useState, type PointerEvent, type TouchEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  discountPct,
  getCollectionFrom,
  taka,
  type Product,
} from "@/lib/products";
import { useCollections, useProducts, useSettings } from "@/lib/storefront";

import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { Breadcrumbs, Modal } from "@/components/ui";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import { useQuickView } from "@/components/Shell";
import { recordRecent } from "@/lib/recent";

const FIT_NOTES: Record<Product["fit"], string> = {
  Oversized: "Oversized fit — drop shoulders, relaxed through the body. Size down for a regular fit.",
  Regular: "Regular fit — true to size, clean through the body.",
  Relaxed: "Relaxed fit — roomy and easy, true to size.",
};

export default function ProductDetail({ product }: { product: Product }) {
  const router = useRouter();
  const { add, setOpen } = useCart();
  const { has, toggle } = useWishlist();
  const quickView = useQuickView();

  const [img, setImg] = useState(0);
  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState(product.colors[0]?.name ?? "");
  const [qty, setQtyN] = useState(1);
  const [error, setError] = useState("");
  const [guideOpen, setGuideOpen] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [openAcc, setOpenAcc] = useState<string | null>("details");
  const mainRef = useRef<HTMLImageElement>(null);
  const touchX = useRef<number | null>(null);

  /* Recently viewed (§6.5) — record this visit on this device */
  useEffect(() => {
    recordRecent(product.id);
  }, [product.id]);

  const off = discountPct(product);
  const wished = has(product.id);
  const products = useProducts();
  const collectionsList = useCollections();
  const { shipping } = useSettings();
  const collection = getCollectionFrom(collectionsList, product.collection);
  const fromCollection = products
    .filter((p) => p.id !== product.id && p.collection === product.collection)
    .slice(0, 4);
  const alsoLike = products
    .filter(
      (p) =>
        p.id !== product.id &&
        p.category === product.category &&
        !fromCollection.some((c) => c.id === p.id)
    )
    .slice(0, 4);

  /* Gallery: subtle 3D tilt; click toggles a zoomed pan view */
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = mainRef.current;
    if (!el) return;
    const r = el.parentElement!.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    if (zoom) {
      el.style.transform = `scale(1.9)`;
      el.style.transformOrigin = `${(px * 100).toFixed(1)}% ${(py * 100).toFixed(1)}%`;
    } else {
      el.style.transform = `perspective(1100px) rotateX(${(-(py - 0.5) * 10).toFixed(2)}deg) rotateY(${((px - 0.5) * 12).toFixed(2)}deg) scale(1.03)`;
    }
  };
  const onLeave = () => {
    if (mainRef.current) mainRef.current.style.transform = "";
    setZoom(false);
  };
  const onTouchStart = (e: TouchEvent) => {
    touchX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: TouchEvent) => {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 42) {
      setImg((i) =>
        dx < 0 ? Math.min(product.images.length - 1, i + 1) : Math.max(0, i - 1)
      );
    }
    touchX.current = null;
  };

  const requireSize = () => {
    if (product.soldOut) return false;
    if (!size) {
      setError("Please select a size first.");
      document.getElementById("pd-sizes")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
    setError("");
    return true;
  };
  const addToBag = (buyNow: boolean) => {
    if (!requireSize() || !size) return;
    add(product, size, qty);
    if (buyNow) router.push("/checkout");
    else setOpen(true);
  };

  const acc = [
    {
      id: "details",
      title: "Details & Description",
      body: `${product.description}\nFit: ${FIT_NOTES[product.fit]}`,
    },
    { id: "fabric", title: "Fabric & Washcare", body: product.fabric },
    {
      id: "shipping",
      title: "Shipping & Delivery",
      body: `Packed within ${shipping.packedWithin}.\nInside Dhaka: ${shipping.insideDays}, ${taka(shipping.insideDhaka)}.\nOutside Dhaka: ${shipping.outsideDays}, ${taka(shipping.outsideDhaka)}.\nFree delivery on orders of ${taka(shipping.freeAbove)} or more.\nCash on Delivery available across Bangladesh.`,
    },
  ];

  return (
    <div className="wrap pd-wrap">
      <div style={{ paddingTop: 104 }}>
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Shop", href: "/products" },
            ...(collection
              ? [{ label: collection.name, href: `/collections/${collection.slug}` }]
              : []),
            { label: product.name },
          ]}
        />
      </div>

      <div className="pd" style={{ paddingTop: 18 }}>
        <Reveal className="pd-gallery">
          <div
            className={`pd-main${zoom ? " zoomed" : ""}`}
            onPointerMove={onMove}
            onPointerLeave={onLeave}
            onClick={() => setZoom((z) => !z)}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            role="button"
            aria-label={`${product.name} image ${img + 1} of ${product.images.length} — click to ${zoom ? "exit zoom" : "zoom"}, swipe to change image`}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") setImg((i) => Math.min(product.images.length - 1, i + 1));
              if (e.key === "ArrowLeft") setImg((i) => Math.max(0, i - 1));
            }}
          >
            {product.soldOut ? (
              <span className="badge soldout">Sold out</span>
            ) : (
              off > 0 && <span className="badge sale">-{off}%</span>
            )}
            <Image
              ref={mainRef}
              src={product.images[img]}
              alt={`${product.name} — view ${img + 1}`}
              width={900}
              height={1200}
              priority
            />
          </div>
          <div className="pd-thumbs">
            {product.images.map((src, i) => (
              <button
                key={src}
                className={i === img ? "on" : ""}
                onClick={() => setImg(i)}
                aria-label={`Show image ${i + 1}`}
                aria-current={i === img}
              >
                <Image src={src} alt="" width={200} height={266} />
              </button>
            ))}
          </div>
        </Reveal>

        <div className="pd-info">
          <Reveal>
            <div className="eyebrow" style={{ color: "var(--muted)" }}>
              TRAC — {collection?.name ?? product.category}
            </div>
            <h1 className="pname">{product.name}</h1>
            <div className="pprice">
              <span className="now">{taka(product.price)}</span>
              {product.compareAt && <span className="was">{taka(product.compareAt)}</span>}
              {off > 0 && <span className="off">-{off}%</span>}
            </div>
            <p className={`pd-avail${product.soldOut ? " out" : ""}`} role="status">
              {product.soldOut ? "● Sold out — back soon" : "● In stock, ready to ship"}
            </p>
            <p className="pd-desc">{product.description}</p>

            {product.colors.length > 0 && (
              <>
                <span className="lbl pd-lbl">
                  Colour — <b>{color}</b>
                </span>
                <div className="pd-colors" role="group" aria-label="Colour">
                  {product.colors.map((c) => (
                    <button
                      key={c.name}
                      className={`pd-swatch${color === c.name ? " on" : ""}`}
                      style={{ background: c.hex }}
                      onClick={() => setColor(c.name)}
                      aria-label={`Colour ${c.name}`}
                      aria-pressed={color === c.name}
                      title={c.name}
                    />
                  ))}
                </div>
              </>
            )}

            <span className="lbl pd-lbl">
              Select size —{" "}
              <button className="pd-guide" onClick={() => setGuideOpen(true)}>
                Size Guide
              </button>
            </span>
            <div className="sizes" id="pd-sizes">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  className={s === size ? "sel" : ""}
                  onClick={() => {
                    setSize(s);
                    setError("");
                  }}
                  disabled={product.soldOut}
                  aria-pressed={s === size}
                >
                  {s}
                </button>
              ))}
            </div>
            {error && (
              <p className="pd-error" role="alert">
                {error}
              </p>
            )}
            <p className="pd-fitnote">{FIT_NOTES[product.fit]}</p>

            <div className="pd-actions">
              <span className="qty" style={{ height: 52 }}>
                <button onClick={() => setQtyN((q) => Math.max(1, q - 1))} style={{ width: 44, height: 50 }} aria-label="Decrease quantity">
                  &minus;
                </button>
                <span style={{ minWidth: 34 }}>{qty}</span>
                <button onClick={() => setQtyN((q) => Math.min(9, q + 1))} style={{ width: 44, height: 50 }} aria-label="Increase quantity">
                  +
                </button>
              </span>
              <button className="btn black" disabled={product.soldOut} onClick={() => addToBag(false)}>
                {product.soldOut ? "Sold Out" : "Add to Bag"}
              </button>
              <button className="pd-wish" onClick={() => toggle(product.id)} aria-pressed={wished}>
                {wished ? "♥ Saved" : "♡ Wishlist"}
              </button>
            </div>
            <button
              className="ui-btn ui-btn-primary ui-btn-lg pd-buynow"
              disabled={product.soldOut}
              onClick={() => addToBag(true)}
            >
              Buy Now
            </button>

            <div className="delivery-box">
              <b>Delivery</b>
              Inside Dhaka ({shipping.insideDays}): {taka(shipping.insideDhaka)} · Outside Dhaka (
              {shipping.outsideDays}): {taka(shipping.outsideDhaka)} ·{" "}
              <b>Free over {taka(shipping.freeAbove)}</b>
              <br />
              <b style={{ marginTop: 10 }}>Cash on Delivery</b> available across Bangladesh. Size
              exchange — see <Link href="/returns">Returns & Exchange</Link>.
            </div>

            <div className="acc">
              {acc.map((a) => (
                <div className="acc-item" key={a.id}>
                  <button
                    className="acc-head"
                    onClick={() => setOpenAcc(openAcc === a.id ? null : a.id)}
                    aria-expanded={openAcc === a.id}
                  >
                    <span>{a.title}</span>
                    <span>{openAcc === a.id ? "−" : "+"}</span>
                  </button>
                  {openAcc === a.id && <div className="acc-body">{a.body}</div>}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>

      {fromCollection.length > 0 && (
        <section className="block" style={{ paddingTop: 20 }}>
          <Reveal>
            <div className="sechead">
              <h2>More from {collection?.name}</h2>
              {collection && (
                <Link className="more" href={`/collections/${collection.slug}`}>
                  View collection &rarr;
                </Link>
              )}
            </div>
          </Reveal>
          <div className="grid4">
            {fromCollection.map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) as 0 | 1 | 2 | 3}>
                <ProductCard product={p} onQuickView={quickView} index={i} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {alsoLike.length > 0 && (
        <section className="block" style={{ paddingTop: 20, paddingBottom: 80 }}>
          <Reveal>
            <div className="sechead">
              <h2>You May Also Like</h2>
              <Link className="more" href="/products">
                View all &rarr;
              </Link>
            </div>
          </Reveal>
          <div className="grid4">
            {alsoLike.map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) as 0 | 1 | 2 | 3}>
                <ProductCard product={p} onQuickView={quickView} index={i} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Sticky mobile purchase bar (§5.4) */}
      <div className="pd-sticky">
        <div className="pd-sticky-info">
          <b>{taka(product.price)}</b>
          <span>{size ? `Size ${size}` : product.soldOut ? "Sold out" : "Select a size"}</span>
        </div>
        <button className="btn black" disabled={product.soldOut} onClick={() => addToBag(false)}>
          {product.soldOut ? "Sold Out" : "Add to Bag"}
        </button>
      </div>

      <Modal open={guideOpen} onClose={() => setGuideOpen(false)} title="Size Guide">
        <p style={{ lineHeight: 1.65 }}>
          <b>{product.name}</b> — {FIT_NOTES[product.fit]}
        </p>
        <p style={{ lineHeight: 1.65, marginTop: 10 }}>
          Offered in sizes: {product.sizes.join(", ")}. Between sizes? For oversized fits, take the
          smaller size for a cleaner look; for regular and relaxed fits, take your usual size.
        </p>
        <p style={{ lineHeight: 1.65, marginTop: 10, color: "var(--color-muted)" }}>
          Exact garment measurements (chest / length per size) will be published here as soon as
          TRAC confirms them — we don't print numbers we haven't measured.
        </p>
      </Modal>
    </div>
  );
}
