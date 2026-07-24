// 输入框原语：标签在上、错误在下（不拿 placeholder 当标签）。
// 形状锁定：rounded-lg；焦点环使用 info 语义色，满足对比度。

import { useId, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export default function Input({
  label,
  hint,
  error,
  className = "",
  id,
  ...rest
}: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error
    ? `${inputId}-error`
    : hint
      ? `${inputId}-hint`
      : undefined;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        id={inputId}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        className={[
          "w-full rounded-lg border bg-surface px-3 py-2 text-sm text-foreground",
          "placeholder:text-muted/60",
          "focus:outline-none focus:ring-2 focus:ring-info/50",
          error ? "border-danger/60" : "border-border",
          className,
        ].join(" ")}
        {...rest}
      />
      {error ? (
        <span id={`${inputId}-error`} className="text-sm text-danger">
          {error}
        </span>
      ) : hint ? (
        <span id={`${inputId}-hint`} className="text-sm text-muted">
          {hint}
        </span>
      ) : null}
    </div>
  );
}
