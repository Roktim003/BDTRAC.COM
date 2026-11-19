"use client";

import { taka } from "@/lib/products";
import { ORDER_STEPS, stepIndex } from "@/lib/orderStatus";
import type { Order } from "@/lib/orders";

/* Shared order status display — guest tracking page + account history.
   Type-only import of Order: no server code reaches the browser. */
export default function OrderStatusView({ order }: { order: Order }) {
  const idx = stepIndex(order.status);
  const cancelled = order.status === "cancelled";
  return (
    <div className="track-card">
      <div className="track-head">
        <div>
          <b>{order.id}</b>
          <span>
            Placed {new Date(order.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}{" "}
            · {order.customer.division} / {order.customer.district}
          </span>
        </div>
        <b>{taka(order.total)}</b>
      </div>

      {cancelled ? (
        <p className="track-cancelled" role="alert">
          This order was cancelled. If that wasn't expected, contact us and quote {order.id}.
        </p>
      ) : (
        <ol className="track-steps">
          {ORDER_STEPS.map((s, i) => (
            <li key={s.id} className={i < idx ? "done" : i === idx ? "now" : ""}>
              <span className="dot" />
              <div>
                <b>{s.label}</b>
                {i === idx && <span>{s.hint}</span>}
              </div>
            </li>
          ))}
        </ol>
      )}

      <div className="track-lines">
        {order.items.map((l) => (
          <div className="srow" key={`${l.id}-${l.size}`}>
            <span>
              {l.name} — Size {l.size} × {l.qty}
            </span>
            <span>{taka(l.lineTotal)}</span>
          </div>
        ))}
        <div className="srow">
          <span>Delivery ({order.zone === "inside" ? "Inside Dhaka" : "Outside Dhaka"})</span>
          <span>{order.delivery === 0 ? "Free" : taka(order.delivery)}</span>
        </div>
        <div className="srow total">
          <span>Total (COD)</span>
          <span>{taka(order.total)}</span>
        </div>
      </div>
      {!cancelled && (
        <p className="note">Expected delivery: {order.eta} from packing (within 48 hours).</p>
      )}
    </div>
  );
}
