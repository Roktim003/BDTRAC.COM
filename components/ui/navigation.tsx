"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";

export function Accordion({
  items,
  defaultOpen = 0,
}: {
  items: { title: string; content: ReactNode }[];
  defaultOpen?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="ui-acc">
      {items.map((it, i) => (
        <div key={i} className="ui-acc-item">
          <button
            className="ui-acc-btn"
            aria-expanded={open === i}
            aria-controls={`acc-panel-${i}`}
            onClick={() => setOpen(open === i ? -1 : i)}
          >
            {it.title}
            <span aria-hidden>{open === i ? "−" : "+"}</span>
          </button>
          {open === i && (
            <div className="ui-acc-panel" id={`acc-panel-${i}`} role="region">
              {it.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function Tabs({
  tabs,
  label = "Sections",
}: {
  tabs: { id: string; label: string; content: ReactNode }[];
  label?: string;
}) {
  const [active, setActive] = useState(tabs[0]?.id);
  return (
    <div>
      <div className="ui-tabs" role="tablist" aria-label={label}>
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={active === t.id}
            className={`ui-tab${active === t.id ? " on" : ""}`}
            onClick={() => setActive(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="ui-tabpanel">
        {tabs.find((t) => t.id === active)?.content}
      </div>
    </div>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="ui-crumbs">
      {items.map((it, i) => (
        <span key={i} className="ui-crumb">
          {it.href && i < items.length - 1 ? (
            <Link href={it.href}>{it.label}</Link>
          ) : (
            <span aria-current="page">{it.label}</span>
          )}
          {i < items.length - 1 && (
            <span className="ui-crumb-sep" aria-hidden>
              /
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  if (totalPages < 2) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <nav aria-label="Pagination" className="ui-pager">
      <button className="ui-pagebtn" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
        ←
      </button>
      {pages.map((p) => (
        <button
          key={p}
          className={`ui-pagebtn${p === page ? " on" : ""}`}
          aria-current={p === page ? "page" : undefined}
          onClick={() => onPage(p)}
        >
          {p}
        </button>
      ))}
      <button
        className="ui-pagebtn"
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
        aria-label="Next page"
      >
        →
      </button>
    </nav>
  );
}
