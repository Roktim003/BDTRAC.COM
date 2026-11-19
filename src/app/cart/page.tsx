"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/cart";
import { taka } from "@/lib/products";
import Reveal from "@/components/Reveal";


import { deliveryCharge, useDeliveryZone } from "@/lib/zone";
import { useSettings } from "@/lib/storefront";



export default function CartPage() {
  const { items, subtotal, setQty, remove } = useCart();
  const [zone, setZone] = useDeliveryZone();
  const shipRates = useSettings().shipping;
  const shipping = deliveryCharge(zone, subtotal, shipRates);
  const hasSoldOut = items.some((c) => c.product.soldOut);

  return (
    <div className="wrap cartpage">
      <Reveal>
        <h1>Your Cart</h1>
      </Reveal>
      {items.length === 0 ? (
        <Reveal>
          <p style={{ color: "var(--muted)", marginBottom: 24 }}>
            Your cart is empty.
          </p>
          <Link className="btn black" href="/products">
            Continue Shopping
          </Link>
        </Reveal>
      ) : (
        <div className="cartlayout">
          <div>
            {items.map((c) => (
              <div className="cartrow" key={`${c.product.id}-${c.size}`}>
                <Image
                  src={c.product.images[0]}
                  alt={c.product.name}
                  width={220}
                  height={280}
                />
                <div className="grow">
                  <div className="nm">
                    <Link href={`/products/${c.product.id}`}>
                      {c.product.name}
                    </Link>
                  </div>
                  <div className="sz">Size: {c.size}</div>
                  {c.product.soldOut && (
                    <div className="cart-warn" role="alert">
                      Sold out — please remove this item before checkout.
                    </div>
                  )}
                  <span className="qty">
                    <button onClick={() => setQty(c.product.id, c.size, c.qty - 1)}>
                      &minus;
                    </button>
                    <span>{c.qty}</span>
                    <button onClick={() => setQty(c.product.id, c.size, c.qty + 1)}>
                      +
                    </button>
                  </span>
                </div>
                <div className="right">
                  <span className="pr">{taka(c.product.price * c.qty)}</span>
                  <button className="rm" onClick={() => remove(c.product.id, c.size)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="summary">
            <h3>Order Summary</h3>
            <div className="srow">
              <span>Subtotal</span>
              <span>{taka(subtotal)}</span>
            </div>
            <div className="zonepick" role="group" aria-label="Delivery zone">
              <span className="flabel">Delivery to</span>
              <div className="chips">
                <button className={zone === "inside" ? "on" : ""} onClick={() => setZone("inside")}>
                  Inside Dhaka
                </button>
                <button className={zone === "outside" ? "on" : ""} onClick={() => setZone("outside")}>
                  Outside Dhaka
                </button>
              </div>
            </div>
            <div className="srow">
              <span>Delivery ({zone === "inside" ? shipRates.insideDays : shipRates.outsideDays})</span>
              <span>{shipping === 0 ? "Free" : taka(shipping)}</span>
            </div>
            <div className="srow total">
              <span>Total</span>
              <span>{taka(subtotal + shipping)}</span>
            </div>
            <p className="note">
              Free delivery on orders of {taka(shipRates.freeAbove)} or more. Cash on Delivery
              available across Bangladesh.
            </p>
            {hasSoldOut ? (
              <p className="cart-warn" role="alert">
                Remove the sold-out item above to check out.
              </p>
            ) : (
              <Link className="btn black" href="/checkout">
                Proceed to Checkout
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
