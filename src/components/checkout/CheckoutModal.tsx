"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Banknote, Check, Smartphone, CreditCard, X } from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { divisions } from "@/lib/bd";
import {
  SHIPPING_FEE_INSIDE_DHAKA_BDT,
  SHIPPING_FEE_OUTSIDE_DHAKA_BDT,
  districtToZone,
  formatBDT,
  type DeliveryZone,
} from "@/lib/bd-utils";
import {
  createOrderSchema,
  type OrderReceipt,
  type CreateOrderInput,
} from "@/lib/order-schema";

/**
 * CheckoutModal + CheckoutForm (Part 4) — bilingual EN/BN checkout for
 * the editorial catalog. English carries the streetwear voice; Bangla
 * helper labels (Noto Sans Bengali) sit beside every field a first-time
 * COD buyer might hesitate on. One form, two hosts: the quick modal
 * (from the CartDrawer) and the full /checkout page.
 *
 * The form validates with the SAME zod schema the API enforces, posts
 * SKU/size/qty only (never prices), and shows the server receipt.
 */

type PaymentMethod = CreateOrderInput["paymentMethod"];

const PAYMENTS: {
  value: PaymentMethod;
  label: string;
  bn: string;
  note: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "COD",
    label: "Cash on Delivery",
    bn: "ক্যাশ অন ডেলিভারি",
    note: "Pay the courier when your order arrives.",
    icon: <Banknote size={18} />,
  },
  {
    value: "BKASH",
    label: "bKash",
    bn: "বিকাশ",
    note: "Pay now with bKash — instructions by SMS after ordering.",
    icon: <Smartphone size={18} />,
  },
  {
    value: "NAGAD",
    label: "Nagad",
    bn: "নগদ",
    note: "Pay now with Nagad — instructions by SMS after ordering.",
    icon: <Smartphone size={18} />,
  },
  {
    value: "SSLCOMMERZ",
    label: "SSLCommerz",
    bn: "কার্ড / মোবাইল ব্যাংকিং",
    note: "Cards and mobile banking via SSLCommerz secure payment.",
    icon: <CreditCard size={18} />,
  },
];

const DISTRICT_GROUPS = Object.entries(divisions);

export function CheckoutForm({
  onSuccess,
}: {
  onSuccess?: (receipt: OrderReceipt) => void;
}) {
  const items = useCartStore((s) => s.items);
  const promoCode = useCartStore((s) => s.promoCode);
  const zone = useCartStore((s) => s.deliveryZone);
  const setZone = useCartStore((s) => s.setDeliveryZone);
  const subtotal = useCartStore((s) => s.subtotalBdt());
  const discount = useCartStore((s) => s.discountBdt());
  const shipping = useCartStore((s) => s.shippingFeeBdt());
  const total = useCartStore((s) => s.totalBdt());
  const clear = useCartStore((s) => s.clear);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [district, setDistrict] = useState("Dhaka");
  const [address, setAddress] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("COD");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<OrderReceipt | null>(null);

  const itemCount = useMemo(() => items.reduce((n, l) => n + l.qty, 0), [items]);

  if (receipt) {
    return (
      <div className="co-receipt">
        <span className="co-receipt-check">
          <Check size={22} />
        </span>
        <h3 className="co-receipt-title">Order placed — ধন্যবাদ!</h3>
        <p className="font-spec co-receipt-number">{receipt.orderNumber}</p>
        <p>
          Confirmation SMS is on its way to {receipt.phone}.{" "}
          {receipt.paymentMethod === "COD"
            ? `Keep ${formatBDT(receipt.totalBdt)} ready for the courier.`
            : "Payment instructions were sent by SMS."}
        </p>
        <dl className="co-summary font-spec">
          <div>
            <dt>SUBTOTAL</dt>
            <dd>{formatBDT(receipt.subtotalBdt)}</dd>
          </div>
          {receipt.discountBdt > 0 ? (
            <div>
              <dt>DISCOUNT</dt>
              <dd>−{formatBDT(receipt.discountBdt)}</dd>
            </div>
          ) : null}
          <div>
            <dt>DELIVERY</dt>
            <dd>{receipt.shippingFeeBdt === 0 ? "FREE" : formatBDT(receipt.shippingFeeBdt)}</dd>
          </div>
          <div className="co-summary-total">
            <dt>TOTAL</dt>
            <dd>{formatBDT(receipt.totalBdt)}</dd>
          </div>
        </dl>
        <Link href="/drop-04#grid" className="sf-btn sf-btn-accent">
          Continue shopping
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="co-empty">
        <p>Your bag is empty — add something heavy first.</p>
        <Link href="/drop-04#grid" className="sf-btn sf-btn-accent">
          Shop Drop 04
        </Link>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);
    const payload = {
      customerName: name,
      phone,
      district,
      address,
      deliveryZone: zone,
      paymentMethod: payment,
      promoCode: promoCode ?? undefined,
      items: items.map((l) => ({ sku: l.sku, size: l.size, quantity: l.qty })),
    };
    const parsed = createOrderSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const res = await fetch("/api/editorial-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        receipt?: OrderReceipt;
        error?: string;
        fieldErrors?: Record<string, string>;
      };
      if (res.status === 201 && data.receipt) {
        setReceipt(data.receipt);
        clear();
        onSuccess?.(data.receipt);
      } else if (res.status === 429) {
        setBanner("Too many order attempts — please wait a few minutes and try again. / কিছুক্ষণ পর আবার চেষ্টা করুন");
      } else if (res.status === 503) {
        setBanner("Ordering is briefly unavailable. Your bag is saved — please try again shortly.");
      } else {
        if (data.fieldErrors) setErrors(data.fieldErrors);
        setBanner(data.error ?? "Something went wrong placing the order.");
      }
    } catch {
      setBanner("Network error — check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="co-form" onSubmit={submit} noValidate>
      <div className="co-trust font-bn-ready">
        <Banknote size={17} />
        <span>
          Cash on Delivery available nationwide /{" "}
          <span className="font-bn">সারাদেশে ক্যাশ অন ডেলিভারি সুবিধা</span>
        </span>
      </div>

      {banner ? <p className="co-banner" role="alert">{banner}</p> : null}

      <label className="co-field">
        <span className="co-label">
          Full name <span className="font-bn co-bn">/ আপনার নাম</span>
        </span>
        <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name"
          placeholder="e.g. Tanvir Hasan" className="co-input" />
        {errors.customerName ? <span className="co-error">{errors.customerName}</span> : null}
      </label>

      <label className="co-field">
        <span className="co-label">
          Mobile number <span className="font-bn co-bn">/ মোবাইল নম্বর</span>
        </span>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel"
          autoComplete="tel" placeholder="01XXXXXXXXX" className="co-input" />
        {errors.phone ? <span className="co-error">Enter a valid BD mobile (01[3-9]…).</span> : null}
      </label>

      <label className="co-field">
        <span className="co-label">
          District <span className="font-bn co-bn">/ জেলা</span>
        </span>
        <select
          value={district}
          onChange={(e) => {
            setDistrict(e.target.value);
            setZone(districtToZone(e.target.value));
          }}
          className="co-input"
        >
          {DISTRICT_GROUPS.map(([division, districts]) => (
            <optgroup key={division} label={division}>
              {districts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>

      <fieldset className="co-field">
        <legend className="co-label">
          Delivery zone <span className="font-bn co-bn">/ ডেলিভারি এলাকা</span>
        </legend>
        <div className="co-zones">
          <label className={`co-zone ${zone === "INSIDE_DHAKA" ? "is-active" : ""}`}>
            <input type="radio" name="zone" checked={zone === "INSIDE_DHAKA"}
              onChange={() => setZone("INSIDE_DHAKA" as DeliveryZone)} />
            <span>Inside Dhaka</span>
            <span className="font-bn">ঢাকার ভেতরে</span>
            <span className="font-spec">{formatBDT(SHIPPING_FEE_INSIDE_DHAKA_BDT)}</span>
          </label>
          <label className={`co-zone ${zone === "OUTSIDE_DHAKA" ? "is-active" : ""}`}>
            <input type="radio" name="zone" checked={zone === "OUTSIDE_DHAKA"}
              onChange={() => setZone("OUTSIDE_DHAKA" as DeliveryZone)} />
            <span>Outside Dhaka</span>
            <span className="font-bn">ঢাকার বাইরে</span>
            <span className="font-spec">{formatBDT(SHIPPING_FEE_OUTSIDE_DHAKA_BDT)}</span>
          </label>
        </div>
      </fieldset>

      <label className="co-field">
        <span className="co-label">
          Full address <span className="font-bn co-bn">/ সম্পূর্ণ ঠিকানা</span>
        </span>
        <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3}
          placeholder="House, road, area, landmark…" className="co-input" />
        {errors.address ? <span className="co-error">{errors.address}</span> : null}
      </label>

      <fieldset className="co-field">
        <legend className="co-label">
          Payment <span className="font-bn co-bn">/ পেমেন্ট</span>
        </legend>
        <div className="co-payments">
          {PAYMENTS.map((p) => (
            <label key={p.value} className={`co-payment ${payment === p.value ? "is-active" : ""}`}>
              <input type="radio" name="payment" checked={payment === p.value}
                onChange={() => setPayment(p.value)} />
              {p.icon}
              <span className="co-payment-main">
                <span className="co-payment-label">
                  {p.label} <span className="font-bn co-bn">/ {p.bn}</span>
                </span>
                <span className="co-payment-note">{p.note}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <dl className="co-summary font-spec">
        <div><dt>ITEMS ({itemCount})</dt><dd>{formatBDT(subtotal)}</dd></div>
        {discount > 0 ? (
          <div><dt>DISCOUNT (TRAC10)</dt><dd>−{formatBDT(discount)}</dd></div>
        ) : null}
        <div><dt>DELIVERY</dt><dd>{shipping === 0 ? "FREE" : formatBDT(shipping)}</dd></div>
        <div className="co-summary-total"><dt>TOTAL</dt><dd>{formatBDT(total)}</dd></div>
      </dl>

      <button type="submit" className="sf-btn sf-btn-accent co-submit" disabled={submitting}>
        {submitting ? "Placing order…" : `Place order — ${formatBDT(total)}`}
      </button>
    </form>
  );
}

export default function CheckoutModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess?: (receipt: OrderReceipt) => void;
}) {
  return (
    <div className="co-modal-root" role="dialog" aria-modal="true" aria-label="Checkout">
      <button type="button" className="co-backdrop" aria-label="Close checkout" onClick={onClose} />
      <div className="co-modal">
        <div className="co-drawer-head">
          <h2 className="co-drawer-title">
            Checkout <span className="font-bn co-bn-inline">/ চেকআউট</span>
          </h2>
          <button type="button" className="sf-nav-icon" aria-label="Close checkout" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <CheckoutForm onSuccess={onSuccess} />
      </div>
    </div>
  );
}
