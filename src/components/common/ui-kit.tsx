"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { cn, formatNumber } from "@/lib/format";
import { AlertIcon, ChevronLeftIcon, ChevronRightIcon, InfoIcon } from "../icons";

const Chevron = () => (
  <svg className="shrink-0 stroke-current" width="17" height="16" viewBox="0 0 17 16" fill="none" aria-hidden>
    <path d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Título da página + trilho de navegação (mesmo padrão do PageBreadCrumb da Biscate258). */
export function PageHeader({
  title,
  crumbs,
  description,
  actions,
}: {
  title: string;
  crumbs?: { label: string; href?: string }[];
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 space-y-3">
      <nav aria-label="Trilho de navegação">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" href="/">
              Início
              <Chevron />
            </Link>
          </li>
          {(crumbs ?? [{ label: title }]).map((crumb, i, arr) => {
            const last = i === arr.length - 1;
            return (
              <li key={i} className="flex items-center gap-1.5">
                {crumb.href && !last ? (
                  <Link className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" href={crumb.href}>
                    <span className="max-w-[180px] truncate">{crumb.label}</span>
                    <Chevron />
                  </Link>
                ) : last ? (
                  <span className="max-w-[220px] truncate text-sm text-gray-800 dark:text-white/90" aria-current="page">
                    {crumb.label}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                    {crumb.label}
                    <Chevron />
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 sm:text-2xl dark:text-white/90">{title}</h1>
          {description && <p className="mt-1 max-w-3xl text-sm text-gray-500 dark:text-gray-400">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function Card({
  title,
  desc,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  desc?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]", className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4 sm:px-6">
          <div>
            {title && <h2 className="text-base font-semibold text-gray-800 dark:text-white/90">{title}</h2>}
            {desc && <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{desc}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn(title || actions ? "border-t border-gray-100 p-5 sm:p-6 dark:border-gray-800" : "p-5 sm:p-6", bodyClassName)}>
        {children}
      </div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  tone = "brand",
  href,
  delay = 0,
}: {
  label: string;
  value: number | string;
  sub?: ReactNode;
  icon?: ReactNode;
  tone?: "brand" | "success" | "warning" | "error" | "gray";
  href?: string;
  delay?: number;
}) {
  const tones = {
    brand: "bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400",
    success: "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500",
    warning: "bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-orange-400",
    error: "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500",
    gray: "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300",
  };
  const content = (
    <div
      className={cn(
        "animate-fade-up flex h-full items-start justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-5 transition-shadow dark:border-gray-800 dark:bg-white/[0.03]",
        href && "hover:shadow-theme-md",
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="min-w-0">
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="mt-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
          {typeof value === "number" ? formatNumber(value) : value}
        </p>
        {sub && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{sub}</p>}
      </div>
      {icon && <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl [&_svg]:size-6", tones[tone])}>{icon}</span>}
    </div>
  );
  return href ? (
    <Link href={href} className="block rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20">
      {content}
    </Link>
  ) : (
    content
  );
}

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      {icon && (
        <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400 [&_svg]:size-7">
          {icon}
        </span>
      )}
      <p className="text-base font-medium text-gray-800 dark:text-white/90">{title}</p>
      {description && <p className="mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: "info" | "warning" | "error" | "success";
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const tones = {
    info: "border-blue-light-100 bg-blue-light-50 text-blue-light-700 dark:border-blue-light-500/30 dark:bg-blue-light-500/10 dark:text-blue-light-500",
    warning: "border-warning-200 bg-warning-50 text-warning-800 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-orange-300",
    error: "border-error-200 bg-error-50 text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400",
    success: "border-success-200 bg-success-50 text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400",
  };
  return (
    <div className={cn("flex gap-3 rounded-xl border p-4 text-sm", tones[tone], className)} role={tone === "error" ? "alert" : "status"}>
      <span className="mt-0.5 shrink-0">{tone === "info" ? <InfoIcon size={18} /> : <AlertIcon size={18} />}</span>
      <div className="min-w-0 space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="text-current/90">{children}</div>}
      </div>
    </div>
  );
}

export function Pagination({
  page,
  limit,
  total,
  onChange,
}: {
  page: number;
  limit: number;
  total: number;
  onChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const btn =
    "flex size-9 items-center justify-center rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5";
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-3 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
      <span>
        {formatNumber(from)}–{formatNumber(to)} de {formatNumber(total)}
      </span>
      <div className="flex items-center gap-2">
        <button className={btn} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Página anterior">
          <ChevronLeftIcon size={18} />
        </button>
        <span className="min-w-16 text-center tabular-nums">
          {page} / {pages}
        </span>
        <button className={btn} disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Página seguinte">
          <ChevronRightIcon size={18} />
        </button>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="skeleton h-5 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Contentor de tabela com scroll horizontal próprio e estilos TailAdmin. */
export function DataTable({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto custom-scrollbar", className)}>
      <table className="w-full min-w-[720px] text-left text-sm [&_td]:px-5 [&_td]:py-3.5 [&_td]:align-middle [&_th]:whitespace-nowrap [&_th]:px-5 [&_th]:py-3 [&_th]:text-theme-xs [&_th]:font-medium [&_th]:text-gray-500 dark:[&_th]:text-gray-400 [&_tbody_tr]:border-t [&_tbody_tr]:border-gray-100 dark:[&_tbody_tr]:border-gray-800 [&_thead]:bg-gray-50 dark:[&_thead]:bg-white/[0.02]">
        {children}
      </table>
    </div>
  );
}
