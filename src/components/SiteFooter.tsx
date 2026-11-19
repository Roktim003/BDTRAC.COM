import Link from "next/link";
import Image from "next/image";
import { LOGO_URL } from "@/lib/products";
import { shopLinks } from "@/lib/site";
import { useCollections, useProducts, useSettings } from "@/lib/storefront";
import Reveal from "./Reveal";
import NewsletterForm from "./NewsletterForm";

/* Footer rule: every link must land on a real page. Policy pages were
   published in Phase 10 (draft wording in lib/content.ts, pending TRAC's
   final approval); socials render only when a real URL is set in settings. */
const helpLinks = [
  { label: "Track Order", href: "/track" },
  { label: "FAQ", href: "/faq" },
  { label: "Shipping & Delivery", href: "/shipping-policy" },
  { label: "Returns & Exchange", href: "/returns" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Contact Us", href: "/contact" },
  { label: "About TRAC", href: "/about" },
  { label: "Wishlist", href: "/wishlist" },
  { label: "Your Account", href: "/account" },
  { label: "Shopping Bag", href: "/cart" },
];

export default function SiteFooter() {
  const settings = useSettings();
  const products = useProducts();
  const collections = useCollections();
  const siteConfig = settings;
  const socials = [
    { key: "instagram", label: "Instagram", href: settings.socials.instagram },
    { key: "facebook", label: "Facebook", href: settings.socials.facebook },
    { key: "youtube", label: "YouTube", href: settings.socials.youtube },
    { key: "whatsapp", label: "WhatsApp", href: settings.socials.whatsapp },
  ].filter((s) => s.href);
  const collectionLinks = [
    ...(products.some((p) => p.isNew) ? [{ label: "Latest Drop", href: "/products?sort=new" }] : []),
    ...collections
      .filter((c) => products.some((p) => p.collection === c.slug))
      .map((c) => ({ label: c.name, href: `/collections/${c.slug}` })),
    ...(products.some((p) => p.compareAt) ? [{ label: "On Sale", href: "/products?sort=discount" }] : []),
  ];
  return (
    <footer className="site">
      <div className="wrap">
        <Reveal>
          <div className="fgrid">
            <div>
              <Link className="flogo" href="/">
                <Image src={LOGO_URL} alt="TRAC" width={120} height={40} />
              </Link>
              <p className="fabout">
                Premium streetwear from Bangladesh — racing-inspired design, heavyweight fabrics,
                honest prices. Built for the bold.
              </p>
              {siteConfig.newsletterEnabled && <NewsletterForm />}
            </div>
            <div>
              <h4>Shop</h4>
              <ul>
                {shopLinks.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4>Collections</h4>
              <ul>
                {collectionLinks.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
                <li>
                  <Link href="/products?sort=new">New Drops</Link>
                </li>
              </ul>
            </div>
            <div>
              <h4>Support</h4>
              <ul>
                {helpLinks.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
              {socials.length > 0 && (
                <>
                  <h4 style={{ marginTop: 26 }}>Connect With Us</h4>
                  <ul>
                    {socials.map((s) => (
                      <li key={s.key}>
                        <a href={s.href} target="_blank" rel="noreferrer">
                          {s.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </Reveal>
        <div className="fbottom">
          <span>&copy; {new Date().getFullYear()} TRAC. All rights reserved.</span>
          <span>Cash on Delivery available across Bangladesh</span>
          <Link href="/design-system">Design System</Link>
        </div>
      </div>
    </footer>
  );
}
