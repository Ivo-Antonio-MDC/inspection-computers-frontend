"use client";

import Link from "next/link";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { cn, formatNumber, percent } from "@/lib/format";

/*
 * Gráficos leves em HTML/SVG, sem bibliotecas:
 *  - uma só cor (brand) para magnitudes; paleta de estado apenas para o estado físico;
 *  - marcas finas (≤ 24px) com 4px de arredondamento na extremidade de dados;
 *  - valores e rótulos em tons de texto, nunca na cor da série;
 *  - tooltip ao passar o rato/focar em cada marca.
 */

// ── Tooltip ──────────────────────────────────────────────────────────────────
interface TipState {
  x: number;
  y: number;
  content: ReactNode;
}

function useTooltip() {
  const ref = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<TipState | null>(null);
  const show = (e: React.MouseEvent | React.FocusEvent, content: ReactNode) => {
    const box = ref.current?.getBoundingClientRect();
    if (!box) return;
    const target = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clientX = "clientX" in e ? e.clientX : target.left + target.width / 2;
    const clientY = "clientY" in e ? e.clientY : target.top;
    setTip({ x: clientX - box.left, y: clientY - box.top, content });
  };
  const hide = () => setTip(null);
  const node = tip ? (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-20 min-w-36 -translate-x-1/2 -translate-y-[calc(100%+12px)] rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 shadow-theme-lg dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
      style={{ left: tip.x, top: tip.y }}
    >
      {tip.content}
    </div>
  ) : null;
  return { ref, show, hide, node };
}

function TipRow({ swatch, label, value }: { swatch?: string; label: ReactNode; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-0.5">
      <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
        {swatch && <span className="size-2 rounded-full" style={{ background: swatch }} />}
        {label}
      </span>
      <span className="font-semibold tabular-nums text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}

// ── Barras horizontais (magnitude, uma série) ────────────────────────────────
export interface BarDatum {
  key: string;
  label: string;
  value: number;
  sub?: string;
  href?: string;
  icon?: ReactNode;
}

export function BarList({ data, unit = "", emptyLabel = "Sem dados" }: { data: BarDatum[]; unit?: string; emptyLabel?: string }) {
  const tip = useTooltip();
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((s, d) => s + d.value, 0);

  if (data.length === 0 || total === 0) return <p className="py-6 text-center text-sm text-gray-500">{emptyLabel}</p>;

  return (
    <div ref={tip.ref} className="relative">
      <ul className="space-y-1">
        {data.map((d) => {
          const inner = (
            <>
              <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                <span className="flex min-w-0 items-center gap-2 text-gray-700 dark:text-gray-300">
                  {d.icon && <span className="shrink-0 text-gray-400">{d.icon}</span>}
                  <span className="truncate">{d.label}</span>
                </span>
                <span className="shrink-0 font-semibold tabular-nums text-gray-800 dark:text-white/90">
                  {formatNumber(d.value)}
                  {unit}
                </span>
              </div>
              <div className="h-2.5 w-full">
                <div className="h-full rounded-r-[4px] bg-brand-500 transition-[width] duration-500 dark:bg-brand-400" style={{ width: `${Math.max((d.value / max) * 100, d.value > 0 ? 1.5 : 0)}%` }} />
              </div>
            </>
          );
          const handlers = {
            onMouseMove: (e: React.MouseEvent) =>
              tip.show(e, (
                <>
                  <p className="mb-1 font-semibold text-gray-900 dark:text-white">{d.label}</p>
                  <TipRow label="Total" value={`${formatNumber(d.value)}${unit}`} />
                  <TipRow label="Percentagem" value={`${percent(d.value, total)}%`} />
                  {d.sub && <p className="mt-1 text-gray-500">{d.sub}</p>}
                </>
              )),
            onMouseLeave: tip.hide,
          };
          const cls = "block rounded-lg px-2 py-2 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 dark:hover:bg-white/[0.03]";
          return (
            <li key={d.key}>
              {d.href ? (
                <Link href={d.href} className={cls} {...handlers}>
                  {inner}
                </Link>
              ) : (
                <div className={cls} {...handlers}>
                  {inner}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {tip.node}
    </div>
  );
}

// ── Medidores de progresso (parte de um todo) ────────────────────────────────
export interface MeterDatum {
  key: string;
  label: ReactNode;
  value: number;
  total: number;
  detail?: ReactNode;
  href?: string;
}

export function MeterList({ data, valueLabel, totalLabel }: { data: MeterDatum[]; valueLabel: string; totalLabel: string }) {
  const tip = useTooltip();
  return (
    <div ref={tip.ref} className="relative">
      <ul className="space-y-1">
        {data.map((d) => {
          const pct = percent(d.value, d.total);
          const body = (
            <>
              <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-gray-700 dark:text-gray-300">{d.label}</span>
                <span className="shrink-0 tabular-nums text-gray-500 dark:text-gray-400">
                  <span className="font-semibold text-gray-800 dark:text-white/90">{formatNumber(d.value)}</span> / {formatNumber(d.total)}
                  <span className="ml-2 inline-block w-10 text-right font-semibold text-gray-800 dark:text-white/90">{pct}%</span>
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-[4px] bg-brand-100 dark:bg-brand-500/15">
                <div className="h-full rounded-[4px] bg-brand-500 transition-[width] duration-500 dark:bg-brand-400" style={{ width: `${pct}%` }} />
              </div>
            </>
          );
          const handlers = {
            onMouseMove: (e: React.MouseEvent) =>
              tip.show(e, (
                <>
                  <p className="mb-1 font-semibold text-gray-900 dark:text-white">{d.label}</p>
                  <TipRow label={valueLabel} value={formatNumber(d.value)} />
                  <TipRow label={totalLabel} value={formatNumber(d.total)} />
                  {d.detail && <div className="mt-1 border-t border-gray-100 pt-1 dark:border-gray-700">{d.detail}</div>}
                </>
              )),
            onMouseLeave: tip.hide,
          };
          const cls = "block rounded-lg px-2 py-2 hover:bg-gray-50 dark:hover:bg-white/[0.03]";
          return (
            <li key={d.key}>
              {d.href ? (
                <Link href={d.href} className={cls} {...handlers}>
                  {body}
                </Link>
              ) : (
                <div className={cls} {...handlers}>
                  {body}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {tip.node}
    </div>
  );
}

// ── Barras empilhadas por estado físico ──────────────────────────────────────
export const CONDITION_SERIES = [
  { key: "bom", label: "Bom", color: "var(--color-status-good)" },
  { key: "razoavel", label: "Razoável", color: "var(--color-status-warning)" },
  { key: "mau", label: "Mau", color: "var(--color-status-serious)" },
  { key: "nao_funciona", label: "Não funciona", color: "var(--color-status-critical)" },
] as const;

export type ConditionKey = (typeof CONDITION_SERIES)[number]["key"];

export interface StackDatum {
  key: string;
  label: string;
  icon?: ReactNode;
  values: Record<ConditionKey, number>;
  href?: (condition: ConditionKey) => string;
}

export function ConditionLegend({ totals }: { totals?: Record<ConditionKey, number> }) {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
      {CONDITION_SERIES.map((s) => (
        <li key={s.key} className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <span className="size-3 rounded-[3px]" style={{ background: s.color }} aria-hidden />
          {s.label}
          {totals && <span className="font-semibold tabular-nums text-gray-800 dark:text-white/90">{formatNumber(totals[s.key])}</span>}
        </li>
      ))}
    </ul>
  );
}

export function ConditionStacks({ data }: { data: StackDatum[] }) {
  const tip = useTooltip();
  const max = Math.max(1, ...data.map((d) => CONDITION_SERIES.reduce((s, c) => s + d.values[c.key], 0)));
  const totals = useMemo(
    () => Object.fromEntries(CONDITION_SERIES.map((c) => [c.key, data.reduce((s, d) => s + d.values[c.key], 0)])) as Record<ConditionKey, number>,
    [data],
  );

  if (data.length === 0) return <p className="py-6 text-center text-sm text-gray-500">Sem equipamentos registados</p>;

  return (
    <div ref={tip.ref} className="relative space-y-4">
      <ConditionLegend totals={totals} />
      <ul className="space-y-3">
        {data.map((d) => {
          const total = CONDITION_SERIES.reduce((s, c) => s + d.values[c.key], 0);
          return (
            <li key={d.key}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  {d.icon && <span className="text-gray-400">{d.icon}</span>}
                  {d.label}
                </span>
                <span className="font-semibold tabular-nums text-gray-800 dark:text-white/90">{formatNumber(total)}</span>
              </div>
              {/* gap-[2px] = espaço de superfície entre segmentos */}
              <div className="flex h-3.5 gap-[2px]" style={{ width: `${(total / max) * 100}%`, minWidth: total ? 8 : 0 }}>
                {CONDITION_SERIES.map((c, i) => {
                  const v = d.values[c.key];
                  if (!v) return null;
                  const isLast = CONDITION_SERIES.slice(i + 1).every((n) => !d.values[n.key]);
                  const seg = (
                    <span
                      className={cn("block h-full w-full transition-opacity hover:opacity-80", isLast && "rounded-r-[4px]")}
                      style={{ background: c.color }}
                    />
                  );
                  const common = {
                    className: "block h-full focus-visible:outline-2 focus-visible:outline-brand-500",
                    style: { flexGrow: v, flexBasis: 0 },
                    "aria-label": `${d.label} — ${c.label}: ${v}`,
                    onMouseMove: (e: React.MouseEvent) =>
                      tip.show(e, (
                        <>
                          <p className="mb-1 font-semibold text-gray-900 dark:text-white">{d.label}</p>
                          <TipRow swatch={c.color} label={c.label} value={`${formatNumber(v)} (${percent(v, total)}%)`} />
                        </>
                      )),
                    onMouseLeave: tip.hide,
                  };
                  return d.href ? (
                    <Link key={c.key} href={d.href(c.key)} {...common}>
                      {seg}
                    </Link>
                  ) : (
                    <span key={c.key} {...common}>
                      {seg}
                    </span>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>
      {tip.node}
    </div>
  );
}

// ── Colunas temporais (submissões por dia) ───────────────────────────────────
export function ColumnChart({ data, label }: { data: { key: string; label: string; value: number }[]; label: string }) {
  const tip = useTooltip();
  const [active, setActive] = useState<string | null>(null);
  const H = 160;
  const max = Math.max(1, ...data.map((d) => d.value));
  const step = max <= 4 ? 1 : Math.ceil(max / 4);
  const top = Math.ceil(max / step) * step;
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step);

  if (data.length === 0) return <p className="py-10 text-center text-sm text-gray-500">Ainda não existem submissões</p>;

  const labelEvery = Math.ceil(data.length / 8);

  return (
    <div ref={tip.ref} className="relative">
      <div className="flex gap-2">
        <div className="relative w-7 shrink-0 text-right text-[11px] tabular-nums text-gray-400" style={{ height: H }}>
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 -translate-y-1/2" style={{ top: H - (t / top) * H }}>
              {t}
            </span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          <div className="relative" style={{ height: H }}>
            {ticks.map((t) => (
              <div key={t} className={cn("absolute inset-x-0 h-px", t === 0 ? "bg-gray-300 dark:bg-gray-700" : "bg-gray-100 dark:bg-gray-800")} style={{ top: H - (t / top) * H }} />
            ))}
            <div className="absolute inset-0 flex items-end gap-[2px]">
              {data.map((d) => (
                <button
                  key={d.key}
                  type="button"
                  className="group relative flex h-full flex-1 items-end justify-center focus-visible:outline-none"
                  aria-label={`${d.label}: ${d.value} ${label}`}
                  onMouseMove={(e) => {
                    setActive(d.key);
                    tip.show(e, (
                      <>
                        <p className="mb-1 font-semibold text-gray-900 dark:text-white">{d.label}</p>
                        <TipRow label={label} value={formatNumber(d.value)} />
                      </>
                    ));
                  }}
                  onFocus={(e) => {
                    setActive(d.key);
                    tip.show(e, <TipRow label={d.label} value={formatNumber(d.value)} />);
                  }}
                  onMouseLeave={() => {
                    setActive(null);
                    tip.hide();
                  }}
                  onBlur={() => {
                    setActive(null);
                    tip.hide();
                  }}
                >
                  <span className={cn("absolute inset-0 rounded-md transition-colors", active === d.key && "bg-gray-100/70 dark:bg-white/5")} />
                  <span
                    className={cn("relative w-full max-w-6 rounded-t-[4px] transition-colors", active === d.key ? "bg-brand-600 dark:bg-brand-300" : "bg-brand-500 dark:bg-brand-400")}
                    style={{ height: `${(d.value / top) * 100}%`, minHeight: d.value ? 2 : 0 }}
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="mt-2 flex gap-[2px] text-[11px] text-gray-400">
            {data.map((d, i) => (
              <span key={d.key} className="flex-1 truncate text-center">
                {i % labelEvery === 0 ? d.label : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
      {tip.node}
    </div>
  );
}

// ── Anel de progresso (figura única) ─────────────────────────────────────────
export function ProgressRing({ value, total, label }: { value: number; total: number; label: string }) {
  const pct = percent(value, total);
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-5">
      <svg width="128" height="128" viewBox="0 0 128 128" role="img" aria-label={`${label}: ${pct}%`}>
        <circle cx="64" cy="64" r={r} fill="none" strokeWidth="12" className="stroke-brand-100 dark:stroke-brand-500/15" />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          strokeWidth="12"
          strokeLinecap="round"
          className="stroke-brand-500 transition-[stroke-dashoffset] duration-700 dark:stroke-brand-400"
          strokeDasharray={c}
          strokeDashoffset={c - (pct / 100) * c}
          transform="rotate(-90 64 64)"
        />
        <text x="64" y="70" textAnchor="middle" className="fill-gray-800 text-[24px] font-semibold dark:fill-white">
          {pct}%
        </text>
      </svg>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-gray-800 dark:text-white/90">
          {formatNumber(value)} <span className="text-base font-normal text-gray-400">/ {formatNumber(total)}</span>
        </p>
      </div>
    </div>
  );
}
