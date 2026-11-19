import Link from "next/link";
import Image from "next/image";
import { useProducts, useSettings } from "@/lib/storefront";

import Reveal from "./Reveal";

/* §3.3 Featured collection editorial — content from lib/homepage config. */
export default function EditorialBanner() {
  const ed = useSettings().editorial;
  const products = useProducts();
  const product = products[ed.productIndex] ?? products[0];
  const img = product?.images[ed.imageIndex] ?? product?.images[0];
  if (!product || !img) return null;
  return (
    <section className="banner">
      <Image src={img} alt={ed.eyebrow} fill style={{ objectFit: "cover", opacity: 0.55 }} />
      <div className="in">
        <Reveal>
          <div className="eyebrow" style={{ marginBottom: 14 }}>
            {ed.eyebrow}
          </div>
          <h2 style={{ whiteSpace: "pre-line" }}>{ed.title}</h2>
          <p>{ed.text}</p>
          <Link className="btn white" href={ed.cta.href}>
            {ed.cta.label}
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
