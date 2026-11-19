import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

/* Button — variants: primary (racing red), dark, ghost (on dark), light (outline) */
type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "dark" | "ghost" | "light";
  size?: "md" | "lg" | "sm";
};
export function Button({ variant = "primary", size = "md", className = "", ...rest }: BtnProps) {
  return <button className={`ui-btn ui-btn-${variant} ui-btn-${size} ${className}`} {...rest} />;
}

export function IconButton({
  label,
  className = "",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return <button aria-label={label} title={label} className={`ui-iconbtn ${className}`} {...rest} />;
}

export function Badge({
  tone = "dark",
  children,
}: {
  tone?: "dark" | "red" | "light" | "success";
  children: ReactNode;
}) {
  return <span className={`ui-badge ui-badge-${tone}`}>{children}</span>;
}

/* Field — label + control + error/hint, with aria wiring */
export function Field({
  label,
  id,
  error,
  hint,
  children,
}: {
  label: string;
  id: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="ui-field">
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && !error && (
        <p className="ui-hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      {error && (
        <p className="ui-error" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function Input({
  id,
  error,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  return (
    <input
      id={id}
      className={`ui-input${error ? " ui-input-error" : ""}`}
      aria-invalid={error || undefined}
      aria-describedby={error ? `${id}-error` : undefined}
      {...rest}
    />
  );
}

export function Select({
  id,
  error,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }) {
  return (
    <select
      id={id}
      className={`ui-input ui-select${error ? " ui-input-error" : ""}`}
      aria-invalid={error || undefined}
      aria-describedby={error ? `${id}-error` : undefined}
      {...rest}
    >
      {children}
    </select>
  );
}
