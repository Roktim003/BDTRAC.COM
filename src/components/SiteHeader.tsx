"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { LOGO_URL } from "@/lib/products";
import { shopLinks, type NavLink } from "@/lib/site";
import { useCollections, useProducts, useSettings } from "@/lib/storefront";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";

function NavDropdown({
  label,
  links,
  open,
  setOpen,
  id,
}: {
  label: string;
  links: NavLink[];
  open: boolean;
  setOpen: (v: boolean) => void;
  id: string;
}) {
  return (
    <div className="navitem" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        className="navlink"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
      >
        {label}
        <span className="navcaret" aria-hidden>
          ▾
        </span>
      </button>
      <div className={`dropdown${open ? " show" : ""}`} id={id} role="menu">
        {links.map((l) => (
          <Link key={l.label} href={l.href} role="menuitem" onClick={() => setOpen(false)}>
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function SiteHeader({
  onSearch,
  onMenu,
  solid = false,
}: {
  onSearch: () => void;
  onMenu: () => void;
  solid?: boolean;
}) {
  const [scrolled, setScrolled] = useState(solid);
  const [menu, setMenu] = useState<"shop" | "collections" | null>(null);
  const { count, setOpen } = useCart();
  const { count: wishCount } = useWishlist();
  const settings = useSettings();
  const products = useProducts();
  const collections = useCollections();
  const ann = settings.announcement;
  const collectionLinks: NavLink[] = [
    ...(products.some((p) => p.isNew) ? [{ label: "Latest Drop", href: "/products?sort=new" }] : []),
    ...collections
      .filter((c) => products.some((p) => p.collection === c.slug))
      .map((c) => ({ label: c.name, href: `/collections/${c.slug}` })),
    ...(products.some((p) => p.compareAt) ? [{ label: "On Sale", href: "/products?sort=discount" }] : []),
  ];

  useEffect(() => {
    if (solid) {
      setScrolled(true);
      return;
    }
    const hero = document.querySelector(".hero");
    const onScroll = () => {
      const limit = hero ? hero.getBoundingClientRect().height - 90 : 200;
      setScrolled(window.scrollY > limit);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [solid]);

  return (
    <header className={`site${scrolled ? " scrolled" : ""}`}>
      {ann.enabled &&
        (ann.href ? (
          <Link className="announce" href={ann.href}>
            {ann.text}
          </Link>
        ) : (
          <div className="announce">{ann.text}</div>
        ))}
      <div className="wrap hrow">
        <div className="hleft">
          <nav className="main" aria-label="Primary">
            <Link className="navlink" href="/products?sort=new">
              New Drops
            </Link>
            <NavDropdown
              label="Shop"
              id="menu-shop"
              links={shopLinks}
              open={menu === "shop"}
              setOpen={(v) => setMenu(v ? "shop" : null)}
            />
            <NavDropdown
              label="Collections"
              id="menu-collections"
              links={collectionLinks}
              open={menu === "collections"}
              setOpen={(v) => setMenu(v ? "collections" : null)}
            />
            <Link className="navlink" href="/about">
              About TRAC
            </Link>
          </nav>
        </div>
        <Link className="logo" href="/" aria-label="TRAC home">
          <Image src={LOGO_URL} alt="TRAC Logo" width={120} height={40} priority />
        </Link>
        <div className="hicons">
          <Link className="iconbtn" href="/#stores" aria-label="Stores">
            <svg viewBox="0 0 24 24">
              <path d="M12 21s-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-7 11-7 11z" />
              <circle cx="12" cy="10" r="2.6" />
            </svg>
          </Link>
          <button className="iconbtn" onClick={onSearch} aria-label="Search">
            <svg viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
          </button>
          <Link className="iconbtn" href="/account" aria-label="Account">
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
            </svg>
          </Link>
          <Link className="iconbtn" href="/wishlist" aria-label="Wishlist">
            <svg viewBox="0 0 24 24">
              <path d="M7 3.5h10V21l-5-3.8L7 21z" />
            </svg>
            {wishCount > 0 && <span className="cartcount">{wishCount}</span>}
          </Link>
          <button className="iconbtn" onClick={() => setOpen(true)} aria-label="Shopping bag">
            <svg viewBox="0 0 24 24">
              <path d="M5.5 8h13l-1.2 11a1 1 0 0 1-1 .9H7.7a1 1 0 0 1-1-.9L5.5 8z" />
              <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
            </svg>
            {count > 0 && <span className="cartcount">{count}</span>}
          </button>
          <button className="pillmenu" onClick={onMenu} aria-label="Menu">
            <i />
            <i />
          </button>
        </div>
      </div>
    </header>
  );
}
