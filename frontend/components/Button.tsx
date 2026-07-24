// 按钮原语（本项目首个表单控件）。
// 形状锁定：rounded-lg；一处强调色 = foreground（深底白字），语义色仅用于 danger。
// 对比度：primary 深底白字、danger 白底红字描边，均满足 WCAG AA。

import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-foreground text-surface hover:bg-foreground/90 border border-transparent",
  secondary:
    "bg-surface text-foreground border border-border hover:bg-surface-muted",
  danger:
    "bg-surface text-danger border border-danger/40 hover:bg-danger-soft",
  ghost: "bg-transparent text-muted hover:text-foreground border border-transparent",
};

const SIZES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium",
        "transition active:translate-y-px",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info/50 focus-visible:ring-offset-1",
        "disabled:cursor-not-allowed disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        className,
      ].join(" ")}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}
