import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/format";

type Variant = "primary" | "outline" | "ghost" | "danger" | "success";
type Size = "xs" | "sm" | "md";

const sizes: Record<Size, string> = {
  xs: "px-3 py-2 text-xs",
  sm: "px-4 py-2.5 text-sm",
  md: "px-5 py-3 text-sm",
};

const variants: Record<Variant, string> = {
  primary: "bg-brand-500 text-white shadow-theme-xs hover:bg-brand-600 disabled:bg-brand-300",
  outline:
    "bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-white/[0.03]",
  ghost: "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5",
  danger: "bg-error-500 text-white shadow-theme-xs hover:bg-error-600",
  success: "bg-success-600 text-white shadow-theme-xs hover:bg-success-700",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  loading?: boolean;
}

export function buttonClass(variant: Variant = "primary", size: Size = "sm", className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20",
    sizes[size],
    variants[variant],
    className,
  );
}

export default function Button({
  variant = "primary",
  size = "sm",
  startIcon,
  endIcon,
  loading,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={buttonClass(variant, size, className)} disabled={disabled || loading} {...rest}>
      {loading ? <Spinner /> : startIcon && <span className="flex items-center [&_svg]:size-4">{startIcon}</span>}
      {children}
      {endIcon && <span className="flex items-center [&_svg]:size-4">{endIcon}</span>}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "sm",
  startIcon,
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  startIcon?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)}>
      {startIcon && <span className="flex items-center [&_svg]:size-4">{startIcon}</span>}
      {children}
    </Link>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent", className)}
      role="status"
      aria-label="A carregar"
    />
  );
}
