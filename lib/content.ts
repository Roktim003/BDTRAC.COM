import { taka } from "./products";
import type { Settings } from "./settingsStore";

/* Brand content & policies (Phase 10). Every operational claim here is
   derived from the implemented system (delivery rates/times come from
   settings, so the pages can never drift from what checkout charges).
   Policy WORDING is a business decision: the returns window below is a
   draft default for TRAC to confirm — edit in this one file. */

export interface PolicySection {
  heading: string;
  body: string[];
}

export interface FaqGroup {
  title: string;
  items: { q: string; a: string }[];
}

/** DRAFT business decision — confirm with TRAC before go-live. */
export const EXCHANGE_WINDOW_DAYS = 7;

export function faqGroups(ship: Settings["shipping"]): FaqGroup[] {
  return [
    {
      title: "Orders & Delivery",
      items: [
        {
          q: "How do I place an order?",
          a: "Add products to your bag, go to checkout, fill in your name, mobile number and address, and place the order. No account is needed. Our team calls your mobile to confirm before dispatch.",
        },
        {
          q: "How much is delivery?",
          a: `Inside Dhaka: ${taka(ship.insideDhaka)}. Outside Dhaka: ${taka(ship.outsideDhaka)}. Delivery is free on orders of ${taka(ship.freeAbove)} or more, anywhere in Bangladesh.`,
        },
        {
          q: "How long does delivery take?",
          a: `Orders are packed within ${ship.packedWithin}. After that, delivery takes ${ship.insideDays} inside Dhaka and ${ship.outsideDays} outside Dhaka.`,
        },
        {
          q: "How can I track my order?",
          a: "Use the Track Order page with your order ID (it looks like TRAC-XXXXXX, shown on your confirmation) and the mobile number you used at checkout. If you have an account, all your orders are listed there too.",
        },
        {
          q: "Can I change or cancel my order?",
          a: "Yes — before it is packed, contact us with your order ID and we'll update or cancel it. Once an order has shipped it can no longer be changed.",
        },
      ],
    },
    {
      title: "Payments",
      items: [
        {
          q: "How do I pay?",
          a: "Cash on Delivery — pay in cash when your order arrives. Please keep the exact total ready; the amount is shown on your confirmation and tracking page.",
        },
        {
          q: "Do you accept bKash or Nagad?",
          a: "Not yet. Mobile payments will be added when our merchant accounts are live — we won't ask you to send money to a personal number.",
        },
      ],
    },
    {
      title: "Sizes & Fit",
      items: [
        {
          q: "How do TRAC sizes fit?",
          a: "Each product page shows its fit: Oversized (drop shoulders, relaxed — size down for a regular fit), Regular (true to size) or Relaxed (roomy, true to size). The Size Guide on every product page explains more.",
        },
        {
          q: "I ordered the wrong size. Can I exchange it?",
          a: `Yes — size exchanges are available within ${EXCHANGE_WINDOW_DAYS} days of delivery for unworn items with tags on. Contact us with your order ID and the size you need, and we'll arrange the exchange. See the Returns & Exchange page for details.`,
        },
      ],
    },
    {
      title: "Returns & Problems",
      items: [
        {
          q: "What if my item is damaged or wrong?",
          a: "Contact us with your order ID and a photo of the problem. If we sent the wrong item or it arrived damaged, we will replace it or refund you — you won't pay return delivery for our mistakes.",
        },
        {
          q: "Can I return something because I changed my mind?",
          a: "We accept exchanges for size (above). For other returns, contact us within the exchange window and we'll confirm what we can do before you send anything back.",
        },
      ],
    },
    {
      title: "Accounts",
      items: [
        {
          q: "Do I need an account to shop?",
          a: "No — guest checkout and guest order tracking work fully. An account adds order history in one place, saved addresses for faster checkout, and a wishlist that syncs across your devices.",
        },
        {
          q: "I forgot my password.",
          a: "Use the Forgot Password link on the account page and we'll send you a reset link (valid for one hour).",
        },
      ],
    },
  ];
}

export function shippingPolicy(ship: Settings["shipping"]): PolicySection[] {
  return [
    {
      heading: "Delivery areas & charges",
      body: [
        `Inside Dhaka: ${taka(ship.insideDhaka)} per order. Outside Dhaka: ${taka(ship.outsideDhaka)} per order. Delivery is FREE on every order of ${taka(ship.freeAbove)} or more, anywhere in Bangladesh.`,
        "The charge for your order is calculated at checkout from the delivery zone you select, and is shown on your confirmation and tracking page. It never changes after you place the order.",
      ],
    },
    {
      heading: "Processing & delivery times",
      body: [
        `Orders are packed within ${ship.packedWithin} of confirmation. Estimated delivery: ${ship.insideDays} inside Dhaka, ${ship.outsideDays} outside Dhaka, counted from packing.`,
        "Our team calls your mobile number to confirm the order before dispatch. If we cannot reach you, the order may be delayed or cancelled.",
      ],
    },
    {
      heading: "Payment on delivery",
      body: [
        "All orders are Cash on Delivery. Please keep the order total ready when the courier arrives.",
      ],
    },
    {
      heading: "Delivery problems",
      body: [
        "If your parcel arrives damaged, or delivery is unusually delayed, contact us with your order ID via the Contact page and we will sort it out.",
      ],
    },
  ];
}

export function returnsPolicy(): PolicySection[] {
  return [
    {
      heading: "Size exchanges",
      body: [
        `If the size isn't right, you can exchange it within ${EXCHANGE_WINDOW_DAYS} days of delivery. Items must be unworn, unwashed and have their tags on.`,
        "To start an exchange, contact us with your order ID and the size you need. We'll arrange the swap when the replacement size is in stock.",
      ],
    },
    {
      heading: "Wrong or damaged items",
      body: [
        "If we sent the wrong item, or your item arrived damaged or defective, contact us with your order ID and a photo. We will replace the item or refund you in full, and return delivery is on us.",
      ],
    },
    {
      heading: "Refunds",
      body: [
        "Approved refunds are made to the original payment method (for Cash on Delivery orders, by bank transfer or mobile banking to an account you provide) after we receive and inspect the returned item.",
      ],
    },
    {
      heading: "Non-returnable",
      body: [
        "For hygiene reasons, items that have been worn or washed cannot be exchanged or returned unless they are defective.",
      ],
    },
  ];
}

export function privacyPolicy(): PolicySection[] {
  return [
    {
      heading: "What we collect",
      body: [
        "When you place an order we collect your name, mobile number, optional email, and delivery address so we can fulfil and support your order. If you create an account, we also store your saved addresses and wishlist.",
        "Your bag, wishlist and checkout draft are stored on your own device (browser storage) when you shop as a guest.",
      ],
    },
    {
      heading: "How we use it",
      body: [
        "We use your details only to process orders, arrange delivery, provide customer support and — with an account — show your order history. We do not sell your personal information to third parties.",
        "Delivery partners receive your name, phone number and address solely to deliver your order.",
      ],
    },
    {
      heading: "Cookies & sessions",
      body: [
        "Signed-in accounts and the admin panel use essential session cookies. We do not use advertising trackers on this store.",
      ],
    },
    {
      heading: "Your choices",
      body: [
        "You can update your account details any time from your account page. To delete your account and associated personal data, contact us via the Contact page and we will action it.",
      ],
    },
  ];
}

export function termsOfService(): PolicySection[] {
  return [
    {
      heading: "Orders",
      body: [
        "Placing an order is an offer to buy. Your order is confirmed when our team verifies it with you by phone; we may cancel an order that cannot be verified or fulfilled (for example, if an item goes out of stock) and will let you know.",
        "You must provide an accurate mobile number and address. Delivery failures caused by incorrect details are the customer's responsibility.",
      ],
    },
    {
      heading: "Prices & payment",
      body: [
        "All prices are in Bangladeshi Taka (BDT) and include the product price shown on the product page at the time you order. Delivery charges are shown separately at checkout. Payment is Cash on Delivery unless another method is explicitly offered at checkout.",
      ],
    },
    {
      heading: "Products",
      body: [
        "We work to show products accurately, including colours and fabric details. Slight colour differences can occur due to photography and screens.",
      ],
    },
    {
      heading: "Returns",
      body: ["Exchanges, returns and refunds follow our Returns & Exchange policy."],
    },
    {
      heading: "Governing law",
      body: ["These terms are governed by the laws of Bangladesh."],
    },
  ];
}
