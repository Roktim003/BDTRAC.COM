"use client";

import Link from "next/link";
import Image from "next/image";
import { discountPct, taka, type Product } from "@/lib/products";
import { useWishlist } from "@/lib/wishlist";
import Tilt from "./Tilt";

export default function ProductCard({
  product,
  onQuickView,
  index = 0,
}: {
  product: Product;
  onQuickView?: (p: Product) => void;
  index?: number;
}) {
  const off = discountPct(product);
  const { has, toggle } = useWishlist();
  const wished = has(product.id);

  return (
    <div className="card">
      <Tilt max={11}>
        <div className="lift">
          <div
            className="media"
            onClick={() => onQuickView?.(product)}
            role="button"
            aria-label={`Quick view ${product.name}`}
          >
            {product.soldOut ? (
              <span className="badge soldout">Sold out</span>
            ) : off > 0 ? (
              <span className="badge sale">-{off}%</span>
            ) : product.isNew ? (
              <span className="badge newb">New</span>
            ) : null}
            <button
              className={`wishbtn${wished ? " on" : ""}`}
              aria-label={wished ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
              aria-pressed={wished}
              onClick={(e) => {
                e.stopPropagation();
                toggle(product.id);
              }}
            >
              <svg viewBox="0 0 24 24">
                <path d="M7 3.5h10V21l-5-3.8L7 21z" />
              </svg>
            </button>
            <Image
              className="main"
              src={product.images[0]}
              alt={product.name}
              width={600}
              height={800}
              loading={index < 4 ? "eager" : "lazy"}
            />
            {product.images[1] && (
              <Image
                className="alt"
                src={product.images[1]}
                alt=""
                width={600}
                height={800}
                loading="lazy"
              />
            )}
            {!product.soldOut && (
              <button
                className="quick"
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickView?.(product);
                }}
              >
                Quick view
              </button>
            )}
          </div>
        </div>
      </Tilt>
      <div className="info">
        <h3>
          <Link href={`/products/${product.id}`}>{product.name}</Link>
        </h3>
        <div className="price">
          <span className="now">{taka(product.price)}</span>
          {product.compareAt && (
            <span className="was">{taka(product.compareAt)}</span>
          )}
        </div>
        {product.colors.length > 0 && (
          <div className="card-dots" aria-label={`Available in ${product.colors.map((c) => c.name).join(", ")}`}>
            {product.colors.map((c) => (
              <span key={c.name} className="card-dot" style={{ background: c.hex }} title={c.name} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
