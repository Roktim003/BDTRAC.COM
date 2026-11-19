"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import { EmptyState } from "@/components/ui";
import { useQuickView } from "@/components/Shell";
import {
  categories,
  colorsOf,
  fitsOf,
  sizesOf,
  taka,
  type Product,
} from "@/lib/products";
import { useCollections, useProducts } from "@/lib/storefront";

type Sort = "featured" | "new" | "low" | "high" | "discount";
const SORTS: Sort[] = ["featured", "new", "low", "high", "discount"];
const PAGE_SIZE = 8;

/* Price ranges derived from the actual catalog prices (§4.2: never offer a
   filter with no applicable products). */
const PRICE_RANGES_ALL = [
  { id: "under-800", label: "Under ৳800", test: (n: number) => n < 800 },
  { id: "800-1200", label: "৳800 – ৳1,200", test: (n: number) => n >= 800 && n <= 1200 },
  { id: "over-1200", label: "Over ৳1,200", test: (n: number) => n > 1200 },
];
function priceRanges(list: Product[]) {
  return PRICE_RANGES_ALL.filter((r) => list.some((p) => r.test(p.price)));
}

function Shop() {
  const products = useProducts();
  const collections = useCollections();
  const allSizes = sizesOf(products);
  const allColors = colorsOf(products);
  const allFits = fitsOf(products);
  const params = useSearchParams();
  const quickView = useQuickView();

  const [cat, setCat] = useState<string>(params.get("cat") || "all");
  const [sort, setSort] = useState<Sort>(
    SORTS.includes(params.get("sort") as Sort) ? (params.get("sort") as Sort) : "featured"
  );
  const [col, setCol] = useState<string>(params.get("col") || "all");
  const [size, setSize] = useState<string>(params.get("size") || "");
  const [color, setColor] = useState<string>(params.get("color") || "");
  const [fit, setFit] = useState<string>(params.get("fit") || "");
  const [price, setPrice] = useState<string>(params.get("price") || "");
  const [inStock, setInStock] = useState<boolean>(params.get("avail") === "1");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const firstWrite = useRef(true);

  /* Read URL → state when navigation changes the URL (header/footer links),
     and reset pagination whenever any filter changes. */
  useEffect(() => {
    setCat(params.get("cat") || "all");
    const s = params.get("sort");
    if (s && SORTS.includes(s as Sort)) setSort(s as Sort);
    setCol(params.get("col") || "all");
    setSize(params.get("size") || "");
    setColor(params.get("color") || "");
    setFit(params.get("fit") || "");
    setPrice(params.get("price") || "");
    setInStock(params.get("avail") === "1");
  }, [params]);

  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [cat, col, size, color, fit, price, inStock, sort]);

  /* State → URL (shareable filter links, browser back works via fresh reads). */
  useEffect(() => {
    if (firstWrite.current) {
      firstWrite.current = false;
      return;
    }
    const q = new URLSearchParams();
    if (cat !== "all") q.set("cat", cat);
    if (sort !== "featured") q.set("sort", sort);
    if (col !== "all") q.set("col", col);
    if (size) q.set("size", size);
    if (color) q.set("color", color);
    if (fit) q.set("fit", fit);
    if (price) q.set("price", price);
    if (inStock) q.set("avail", "1");
    const qs = q.toString();
    window.history.replaceState(null, "", qs ? `/products?${qs}` : "/products");
  }, [cat, sort, col, size, color, fit, price, inStock]);

  const list = useMemo(() => {
    const range = priceRanges(products).find((r) => r.id === price);
    let l = products.filter(
      (p) =>
        (cat === "all" || p.category === cat) &&
        (col === "all" || p.collection === col) &&
        (!size || p.sizes.includes(size)) &&
        (!color || p.colors.some((c) => c.name === color)) &&
        (!fit || p.fit === fit) &&
        (!range || range.test(p.price)) &&
        (!inStock || !p.soldOut)
    );
    switch (sort) {
      case "new":
        l = [...l].sort((a, b) => Number(b.isNew ?? false) - Number(a.isNew ?? false));
        break;
      case "low":
        l = [...l].sort((a, b) => a.price - b.price);
        break;
      case "high":
        l = [...l].sort((a, b) => b.price - a.price);
        break;
      case "discount":
        l = [...l].sort(
          (a, b) =>
            (b.compareAt ? 1 - b.price / b.compareAt : 0) - (a.compareAt ? 1 - a.price / a.compareAt : 0)
        );
        break;
    }
    return l;
  }, [cat, col, size, color, fit, price, inStock, sort]);

  const anyFilter = cat !== "all" || col !== "all" || size || color || fit || price || inStock;
  const clearAll = () => {
    setCat("all");
    setCol("all");
    setSize("");
    setColor("");
    setFit("");
    setPrice("");
    setInStock(false);
  };
  const shown = list.slice(0, visible);
  const title =
    col !== "all"
      ? collections.find((c) => c.slug === col)?.name ?? "Shop"
      : cat === "all"
        ? "All Products"
        : categories.find((c) => c.slug === cat)?.label;

  return (
    <div className="wrap">
      <div className="shop-head">
        <Reveal>
          <h1>{title}</h1>
          <p>
            {list.length} {list.length === 1 ? "product" : "products"}
            {anyFilter ? " match your filters" : ""}
          </p>
        </Reveal>
      </div>

      <div className="shop-tools">
        <div className="chips" role="group" aria-label="Category">
          {categories.map((c) => (
            <button key={c.slug} className={cat === c.slug ? "on" : ""} onClick={() => setCat(c.slug)}>
              {c.label}
            </button>
          ))}
        </div>
        <select
          className="sortsel"
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          aria-label="Sort products"
        >
          <option value="featured">Featured</option>
          <option value="new">Newest</option>
          <option value="low">Price: Low to High</option>
          <option value="high">Price: High to Low</option>
          <option value="discount">Biggest Discount</option>
        </select>
      </div>

      <div className="filters" aria-label="Product filters">
        <div className="fgroup">
          <span className="flabel">Collection</span>
          <div className="chips">
            <button className={col === "all" ? "on" : ""} onClick={() => setCol("all")}>
              All
            </button>
            {collections.map((c) => (
              <button key={c.slug} className={col === c.slug ? "on" : ""} onClick={() => setCol(c.slug)}>
                {c.name}
              </button>
            ))}
          </div>
        </div>
        <div className="fgroup">
          <span className="flabel">Size</span>
          <div className="chips">
            {allSizes.map((s) => (
              <button key={s} className={size === s ? "on" : ""} onClick={() => setSize(size === s ? "" : s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="fgroup">
          <span className="flabel">Colour</span>
          <div className="chips">
            {allColors.map((c) => (
              <button
                key={c.name}
                className={`colorchip${color === c.name ? " on" : ""}`}
                onClick={() => setColor(color === c.name ? "" : c.name)}
                aria-pressed={color === c.name}
              >
                <span className="card-dot" style={{ background: c.hex }} />
                {c.name}
              </button>
            ))}
          </div>
        </div>
        <div className="fgroup">
          <span className="flabel">Fit</span>
          <div className="chips">
            {allFits.map((f) => (
              <button key={f} className={fit === f ? "on" : ""} onClick={() => setFit(fit === f ? "" : f)}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="fgroup">
          <span className="flabel">Price</span>
          <div className="chips">
            {priceRanges(products).map((r) => (
              <button key={r.id} className={price === r.id ? "on" : ""} onClick={() => setPrice(price === r.id ? "" : r.id)}>
                {r.label}
              </button>
            ))}
            <button className={inStock ? "on" : ""} onClick={() => setInStock((v) => !v)} aria-pressed={inStock}>
              In stock only
            </button>
            {anyFilter && (
              <button className="clearf" onClick={clearAll}>
                Clear all ×
              </button>
            )}
          </div>
        </div>
      </div>

      {list.length === 0 ? (
        <div style={{ paddingBottom: 80, maxWidth: 560 }}>
          <EmptyState
            title="No products match"
            text="Try removing a filter or two — or browse the full catalog."
            action={
              <button className="ui-btn ui-btn-dark ui-btn-md" onClick={clearAll}>
                Clear Filters
              </button>
            }
          />
        </div>
      ) : (
        <>
          <div className="grid4">
            {shown.map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) as 0 | 1 | 2 | 3}>
                <ProductCard product={p} onQuickView={quickView} index={i} />
              </Reveal>
            ))}
          </div>
          <div className="loadmore">
            <p>
              Showing {shown.length} of {list.length} — prices in BDT ({taka(0).slice(0, 1)})
            </p>
            {visible < list.length && (
              <button className="ui-btn ui-btn-dark ui-btn-md" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                Load More
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense>
      <Shop />
    </Suspense>
  );
}
