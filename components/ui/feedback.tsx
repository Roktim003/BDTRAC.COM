"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

/* Toast — provider + useToast() hook */
const ToastCtx = createContext<(msg: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState("");
  const [id, setId] = useState(0);
  const push = useCallback((m: string) => {
    setMsg(m);
    setId((v) => v + 1);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div key={id} className={`ui-toast${msg ? " show" : ""}`} role="status" aria-live="polite">
        {msg}
      </div>
    </ToastCtx.Provider>
  );
}

export function EmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="ui-empty">
      <p className="ui-empty-title">{title}</p>
      {text && <p className="ui-empty-text">{text}</p>}
      {action}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  text,
  onRetry,
}: {
  title?: string;
  text?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="ui-empty ui-errorstate" role="alert">
      <p className="ui-empty-title">{title}</p>
      {text && <p className="ui-empty-text">{text}</p>}
      {onRetry && (
        <button className="ui-btn ui-btn-dark ui-btn-md" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function Skeleton({ lines = 3, card = false }: { lines?: number; card?: boolean }) {
  if (card)
    return (
      <div className="ui-skel-card" role="status" aria-label="Loading">
        <div className="ui-skel ui-skel-media" />
        <div className="ui-skel" style={{ width: "70%" }} />
        <div className="ui-skel" style={{ width: "40%" }} />
      </div>
    );
  return (
    <div role="status" aria-label="Loading">
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="ui-skel" style={{ width: `${92 - i * 14}%` }} />
      ))}
    </div>
  );
}
