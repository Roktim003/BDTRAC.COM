"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { shopLinks } from "@/lib/site";
import { useCollections, useProducts } from "@/lib/storefront";
import { useWishlist } from "@/lib/wishlist";

export default function MobileMenu({
  open,
  onClose,
  onSearch,
}: {
  open: boolean;
  onClose: () => void;
  onSearch: () => void;
}) {
  const [shopOpen, setShopOpen] = useState(true);
  const { count: wishCount } = useWishlist();
  const products = useProducts();
  const collections = useCollections();
  const collectionLinks = [
    ...(products.some((p) => p.isNew) ? [{ label: "Latest Drop", href: "/products?sort=new" }] : []),
    ...collections
      .filter((c) => products.some((p) => p.collection === c.slug))
      .map((c) => ({ label: c.name, href: `/collections/${c.slug}` })),
    ...(products.some((p) => p.compareAt) ? [{ label: "On Sale", href: "/products?sort=discount" }] : []),
  ];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <div className={`overlay${open ? " show" : ""}`} onClick={onClose} />
      <aside className={`drawer left${open ? " show" : ""}`} aria-label="Menu" aria-hidden={!open}>
        <div className="dhead">
          <h3>Menu</h3>
          <button className="xbtn" onClick={onClose} aria-label="Close menu">
            &times;
          </button>
        </div>
        <div className="dbody">
          <Link className="mlink" href="/products?sort=new" onClick={onClose}>
            New Drops
          </Link>

          <button
            className="mlink macc"
            aria-expanded={shopOpen}
            onClick={() => setShopOpen((v) => !v)}
          >
            Shop
            <span aria-hidden>{shopOpen ? "−" : "+"}</span>
          </button>
          {shopOpen && (
            <div className="msub">
              {shopLinks.map((l) => (
                <Link key={l.label} href={l.href} onClick={onClose}>
                  {l.label}
                </Link>
              ))}
            </div>
          )}

          <div className="mgroup">Collections</div>
          {collectionLinks.map((l) => (
            <Link key={l.label} className="mlink" href={l.href} onClick={onClose}>
              {l.label}
            </Link>
          ))}

          <div className="mgroup">Your TRAC</div>
          <button
            className="mlink mbtn"
            onClick={() => {
              onClose();
              onSearch();
            }}
          >
            Search
          </button>
          <Link className="mlink" href="/account" onClick={onClose}>
            Account
          </Link>
          <Link className="mlink" href="/wishlist" onClick={onClose}>
            Wishlist{wishCount > 0 ? ` (${wishCount})` : ""}
          </Link>
          <Link className="mlink" href="/about" onClick={onClose}>
            About TRAC
          </Link>
          <Link className="mlink" href="/contact" onClick={onClose}>
            Contact & Support
          </Link>
        </div>
      </aside>
    </>
  );
}
