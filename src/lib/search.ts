import {
  categories,
  getCollectionFrom,
  type Collection,
  type Product,
} from "./products";

/* Search engine (Phase 6) — client-side over the catalog, ranked and
   typo-tolerant. Ranking: name > category/collection > colour/fit >
   description. A product must match EVERY query token somewhere
   (AND semantics); a token with no exact hit falls back to a
   1-edit fuzzy match against product-name words (§6.1 typo handling).
   When the catalog moves server-side (Phase 9), this scoring moves with it. */

function levenshtein(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 1) return 2;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cur = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
  }
  return row[b.length];
}

function tokenScore(p: Product, token: string, cols: Collection[]): number {
  const name = p.name.toLowerCase();
  if (name.includes(token)) return name.startsWith(token) ? 14 : 10;
  const cat = categories.find((c) => c.slug === p.category)?.label.toLowerCase() ?? "";
  if (cat.includes(token) || p.category.includes(token)) return 6;
  const coll = getCollectionFrom(cols, p.collection)?.name.toLowerCase() ?? "";
  if (coll.includes(token)) return 6;
  if (p.colors.some((c) => c.name.toLowerCase().includes(token))) return 5;
  if (p.fit.toLowerCase().includes(token)) return 4;
  if (p.description.toLowerCase().includes(token)) return 2;
  /* fuzzy fallback — one typo away from a name word */
  if (token.length >= 4 && name.split(/[^a-z0-9]+/).some((w) => w && levenshtein(w, token) <= 1)) return 5;
  return 0;
}

export function searchProducts(query: string, list: Product[], cols: Collection[] = []): Product[] {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];
  return list
    .map((p) => {
      let total = 0;
      for (const t of tokens) {
        const s = tokenScore(p, t, cols);
        if (s === 0) return { p, total: -1 };
        total += s;
      }
      return { p, total };
    })
    .filter((r) => r.total >= 0)
    .sort(
      (a, b) =>
        b.total - a.total ||
        Number(b.p.isNew ?? false) - Number(a.p.isNew ?? false) ||
        a.p.name.localeCompare(b.p.name)
    )
    .map((r) => r.p);
}

export interface SearchGroups {
  products: Product[];
  categories: { slug: string; label: string; count: number }[];
  collections: { slug: string; name: string; count: number }[];
}

export function searchAll(query: string, list: Product[], cols: Collection[]): SearchGroups {
  const q = query.trim().toLowerCase();
  const found = searchProducts(query, list, cols);
  return {
    products: found,
    categories: categories
      .filter((c) => c.slug !== "all" && c.label.toLowerCase().includes(q))
      .map((c) => ({
        slug: c.slug,
        label: c.label,
        count: list.filter((p) => p.category === c.slug).length,
      }))
      .filter((c) => c.count > 0),
    collections: cols
      .filter((c) => c.name.toLowerCase().includes(q))
      .map((c) => ({
        slug: c.slug,
        name: c.name,
        count: list.filter((p) => p.collection === c.slug).length,
      }))
      .filter((c) => c.count > 0),
  };
}
