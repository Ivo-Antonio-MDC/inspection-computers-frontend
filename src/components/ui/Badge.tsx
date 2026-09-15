import type { ReactNode } from "react";
import { CONDITION_OPTIONS, RECORD_STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/format";
import type { Condition, RecordStatus } from "@/types";

export type BadgeColor = "primary" | "success" | "error" | "warning" | "info" | "light" | "dark";

const colors: Record<BadgeColor, string> = {
  primary: "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400",
  success: "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
  error: "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400",
  warning: "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-orange-400",
  info: "bg-blue-light-50 text-blue-light-700 dark:bg-blue-light-500/15 dark:text-blue-light-500",
  light: "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-white/80",
  dark: "bg-gray-600 text-white dark:bg-white/10 dark:text-white",
};

export default function Badge({
  color = "primary",
  size = "sm",
  children,
  dot,
  className,
}: {
  color?: BadgeColor;
  size?: "sm" | "md";
  children: ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 font-outfit font-medium",
        size === "sm" ? "text-theme-xs" : "text-sm",
        colors[color],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}

const STATUS_COLORS: Record<RecordStatus, BadgeColor> = {
  rascunho: "light",
  submetido: "info",
  validado: "success",
  requer_correccao: "warning",
};

export function RecordStatusBadge({ status }: { status: RecordStatus }) {
  return (
    <Badge color={STATUS_COLORS[status]} dot>
      {RECORD_STATUS_LABELS[status]}
    </Badge>
  );
}

const CONDITION_COLORS: Record<Condition, BadgeColor> = {
  bom: "success",
  razoavel: "warning",
  mau: "error",
  nao_funciona: "dark",
};

export function ConditionBadge({ condition }: { condition: Condition | null }) {
  if (!condition) return <Badge color="light">Sem estado</Badge>;
  return (
    <Badge color={CONDITION_COLORS[condition]}>
      {CONDITION_OPTIONS.find((o) => o.value === condition)?.label}
    </Badge>
  );
}
