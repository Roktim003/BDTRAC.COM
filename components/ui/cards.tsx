import Image from "next/image";
import Link from "next/link";
import { Badge } from "./primitives";

/* ProductCardUI — design-system product card (presentational).
   The live shop card (components/ProductCard) adopts these tokens in Phase 4;
   this component is the canonical pattern: consistent aspect, alt-image hover,
   badges only for real states (discount / new / sold out), colour dots, wishlist. */
export function ProductCardUI({
  name,
  categoryLabel,
  priceLabel,
  compareLabel,
  discountPct,
  isNew,
  soldOut,
  colors = [],
  image,
  altImage,
  href,
  wished = false,
  onToggleWish,
  onQuickAdd,
}: {
  name: string;
  categoryLabel: string;
  priceLabel: string;
  compareLabel?: string;
  discountPct?: number;
  isNew?: boolean;
  soldOut?: boolean;
  colors?: string[];
  image: string;
  altImage?: string;
  href: string;
  wished?: boolean;
  onToggleWish?: () => void;
  onQuickAdd?: () => void;
}) {
  return (
    <article className="ui-card">
      <Link href={href} className="ui-card-media" aria-label={name}>
        <Image src={image} alt={name} width={600} height={750} className="ui-card-img" />
        {altImage && <Image src={altImage} alt="" width={600} height={750} className="ui-card-img alt" />}
        {soldOut ? (
          <Badge tone="light">Sold Out</Badge>
        ) : discountPct ? (
          <Badge tone="red">−{discountPct}%</Badge>
        ) : isNew ? (
          <Badge>New In</Badge>
        ) : null}
      </Link>
      {onToggleWish && (
        <button
          className={`ui-heart${wished ? " on" : ""}`}
          onClick={onToggleWish}
          aria-label={wished ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
          aria-pressed={wished}
        >
          {wished ? "♥" : "♡"}
        </button>
      )}
      <div className="ui-card-info">
        <h3 className="ui-card-name">
          <Link href={href}>{name}</Link>
        </h3>
        <p className="ui-card-meta">{categoryLabel}</p>
        <p className="ui-card-price">
          {priceLabel}
          {compareLabel && <s>{compareLabel}</s>}
        </p>
        {colors.length > 0 && (
          <p className="ui-dots" aria-label={`Available in ${colors.length} colours`}>
            {colors.map((c) => (
              <span key={c} className="ui-dot" style={{ background: c }} />
            ))}
          </p>
        )}
        {onQuickAdd && (
          <button className="ui-quick" onClick={onQuickAdd} disabled={soldOut}>
            {soldOut ? "Sold Out" : "Quick Add"}
          </button>
        )}
      </div>
    </article>
  );
}

export function CollectionCard({
  name,
  blurb,
  image,
  href,
}: {
  name: string;
  blurb?: string;
  image: string;
  href: string;
}) {
  return (
    <Link href={href} className="ui-coll">
      <Image src={image} alt={name} width={900} height={675} className="ui-coll-img" />
      <span className="ui-coll-shade" aria-hidden />
      <span className="ui-coll-text">
        <span className="ui-coll-name">{name}</span>
        {blurb && <span className="ui-coll-blurb">{blurb}</span>}
        <span className="ui-coll-cta">Discover →</span>
      </span>
    </Link>
  );
}
