"use client";

import { useEffect, useRef, type ReactNode } from "react";

/* Shared overlay behaviour: Escape closes, scrim click closes, focus moves
   into the panel on open and returns on close (basic focus management). */
function useOverlay(open: boolean, onClose: () => void, ref: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("button, [href], input, select, [tabIndex]")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prev?.focus?.();
    };
  }, [open, onClose, ref]);
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useOverlay(open, onClose, ref);
  if (!open) return null;
  return (
    <div className="ui-scrim" onClick={onClose}>
      <div
        ref={ref}
        className="ui-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ui-panel-head">
          <h3>{title}</h3>
          <button className="ui-iconbtn" aria-label="Close dialog" onClick={onClose}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Drawer({
  open,
  onClose,
  title,
  side = "right",
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  side?: "right" | "left";
  children: ReactNode;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useOverlay(open, onClose, ref);
  return (
    <>
      <div className={`ui-scrim ui-scrim-thin${open ? " show" : ""}`} onClick={onClose} aria-hidden={!open} />
      <aside
        ref={ref}
        className={`ui-drawer ui-drawer-${side}${open ? " show" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        aria-hidden={!open}
      >
        <div className="ui-panel-head">
          <h3>{title}</h3>
          <button className="ui-iconbtn" aria-label={`Close ${title}`} onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="ui-drawer-body">{children}</div>
        {footer && <div className="ui-drawer-foot">{footer}</div>}
      </aside>
    </>
  );
}
