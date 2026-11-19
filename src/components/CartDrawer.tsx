"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/cart";
import { taka } from "@/lib/products";

export default function CartDrawer() {
  const { items, count, subtotal, setQty, remove, isOpen, setOpen } = useCart();

  return (
    <>
      <div
        className={`overlay${isOpen ? " show" : ""}`}
        onClick={() => setOpen(false)}
      />
      <aside className={`drawer${isOpen ? " show" : ""}`} aria-label="Cart">
        <div className="dhead">
          <h3>Your Cart ({count})</h3>
          <button className="xbtn" onClick={() => setOpen(false)}>
            &times;
          </button>
        </div>
        <div className="dbody">
          {items.length === 0 ? (
            <div className="empty">Your cart is empty.</div>
          ) : (
            items.map((c) => (
              <div className="citem" key={`${c.product.id}-${c.size}`}>
                <Image
                  src={c.product.images[0]}
                  alt={c.product.name}
                  width={168}
                  height={208}
                />
                <div>
                  <div className="nm">{c.product.name}</div>
                  <div className="sz">Size: {c.size}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span className="qty">
                      <button
                        onClick={() =>
                          setQty(c.product.id, c.size, c.qty - 1)
                        }
                      >
                        &minus;
                      </button>
                      <span>{c.qty}</span>
                      <button
                        onClick={() =>
                          setQty(c.product.id, c.size, c.qty + 1)
                        }
                      >
                        +
                      </button>
                    </span>
                    <span className="pr">{taka(c.product.price * c.qty)}</span>
                  </div>
                </div>
                <button
                  className="rm"
                  onClick={() => remove(c.product.id, c.size)}
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>
        {items.length > 0 && (
          <div className="dfoot">
            <div className="subtotal">
              <span>Subtotal</span>
              <span>{taka(subtotal)}</span>
            </div>
            <p className="note">
              Shipping calculated at checkout. Cash on Delivery available.
            </p>
            <Link
              className="btn black"
              href="/checkout"
              onClick={() => setOpen(false)}
            >
              Checkout
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
