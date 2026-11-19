import { categories } from "@/lib/products";
import { useProducts } from "@/lib/storefront";
import { CollectionCard } from "@/components/ui";
import Reveal from "./Reveal";

/* §3.4 Shop by Category — cards built from real catalog data only:
   a category appears when it has products, with that category's own
   product photography. Images become admin-editable in Phase 9. */
export default function HomeCategories() {
  const products = useProducts();
  const cats = categories
    .filter((c) => c.slug !== "all")
    .map((c) => ({
      ...c,
      image: products.find((p) => p.category === c.slug)?.images[0],
      count: products.filter((p) => p.category === c.slug).length,
    }))
    .filter((c) => c.image && c.count > 0);
  if (cats.length === 0) return null;
  return (
    <section className="block">
      <div className="wrap">
        <Reveal>
          <div className="sechead">
            <h2>Shop by Category</h2>
          </div>
        </Reveal>
        <div className="catgrid">
          {cats.map((c, i) => (
            <Reveal key={c.slug} delay={(i % 3) as 0 | 1 | 2}>
              <CollectionCard
                name={c.label}
                blurb={`${c.count} ${c.count === 1 ? "product" : "products"}`}
                image={c.image!}
                href={`/products?cat=${c.slug}`}
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
