"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { SearchInput, Select } from "@/components/form/fields";
import { FilterIcon, XIcon } from "@/components/icons";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/format";

export interface FilterDef {
  key: string;
  label: string;
  options: { value: string; label: string }[];
  /** Secção do painel onde o filtro aparece (ex.: "Geral", "Condição"). */
  group?: string;
  /** "choice" mostra as opções como botões segmentados — ideal para sim/não. */
  kind?: "select" | "choice";
  /** Texto da opção vazia (por omissão "Todos"). */
  allLabel?: string;
}

/** Opções sim/não para filtros booleanos da API ("true" / "false"). */
export const yesNo = (yes: string, no: string) => [
  { value: "true", label: yes },
  { value: "false", label: no },
];

/**
 * Barra de filtros compacta: pesquisa + botão "Filtros" que abre um painel
 * agrupado. Os filtros aplicados aparecem como chips removíveis, por isso a
 * barra mantém o mesmo tamanho independentemente do número de filtros.
 */
export function FilterToolbar({
  search,
  filters,
  values,
  onChange,
  onReset,
  summary,
}: {
  search?: { value: string; onChange: (v: string) => void; placeholder?: string };
  filters: FilterDef[];
  values: Record<string, string>;
  onChange: (patch: Record<string, string>) => void;
  onReset: () => void;
  /** Conteúdo à direita da linha de chips (ex.: total de resultados). */
  summary?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const rootRef = useRef<HTMLDivElement>(null);

  const active = filters.filter((f) => values[f.key]);
  const searchActive = !!search?.value.trim();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = () => {
    if (!open) setDraft(Object.fromEntries(filters.map((f) => [f.key, values[f.key] ?? ""])));
    setOpen((o) => !o);
  };

  const apply = () => {
    onChange(draft);
    setOpen(false);
  };

  const groups = filters.reduce<{ name: string; items: FilterDef[] }[]>((acc, f) => {
    const name = f.group ?? "";
    const g = acc.find((x) => x.name === name);
    if (g) g.items.push(f);
    else acc.push({ name, items: [f] });
    return acc;
  }, []);

  const draftCount = filters.filter((f) => draft[f.key]).length;
  const chipLabel = (f: FilterDef) => {
    const opt = f.options.find((o) => o.value === values[f.key])?.label ?? values[f.key];
    return f.kind === "choice" ? opt : `${f.label}: ${opt}`;
  };

  return (
    <div className="border-b border-gray-100 dark:border-gray-800">
      <div ref={rootRef} className="relative flex flex-wrap items-center gap-3 p-4">
        {search && (
          <SearchInput value={search.value} onChange={search.onChange} placeholder={search.placeholder} className="min-w-0 flex-1 basis-60 sm:max-w-md" />
        )}
        <div className={cn("flex items-center gap-2", search ? "ml-auto" : "")}>
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            aria-haspopup="dialog"
            className={cn(
              "inline-flex h-11 items-center gap-2 rounded-lg border px-4 text-sm font-medium shadow-theme-xs transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20",
              open || active.length
                ? "border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-800 dark:bg-brand-500/10 dark:text-brand-400"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/5",
            )}
          >
            <FilterIcon size={18} />
            Filtros
            {active.length > 0 && (
              <span className="flex min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 text-xs font-semibold leading-5 text-white">
                {active.length}
              </span>
            )}
          </button>
        </div>

        {open && (
          <div
            role="dialog"
            aria-label="Filtros"
            className="animate-fade-up absolute right-4 top-full z-40 -mt-1 flex max-h-[min(70vh,40rem)] w-[min(44rem,calc(100vw-2rem))] flex-col rounded-2xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5 dark:border-gray-800">
              <p className="text-sm font-semibold text-gray-800 dark:text-white/90">Filtros</p>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5" aria-label="Fechar">
                <XIcon size={18} />
              </button>
            </div>

            <div className="custom-scrollbar space-y-5 overflow-y-auto px-5 py-4">
              {groups.map((g) => (
                <fieldset key={g.name}>
                  {g.name && <legend className="mb-2.5 text-theme-xs font-semibold uppercase tracking-wide text-gray-400">{g.name}</legend>}
                  <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
                    {g.items.map((f) =>
                      f.kind === "choice" ? (
                        <div key={f.key}>
                          <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">{f.label}</p>
                          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={f.label}>
                            {[{ value: "", label: f.allLabel ?? "Todos" }, ...f.options].map((o) => {
                              const selected = (draft[f.key] ?? "") === o.value;
                              return (
                                <button
                                  key={o.value}
                                  type="button"
                                  role="radio"
                                  aria-checked={selected}
                                  onClick={() => setDraft((d) => ({ ...d, [f.key]: o.value }))}
                                  className={cn(
                                    "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                                    selected
                                      ? "border-brand-500 bg-brand-500 text-white"
                                      : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5",
                                  )}
                                >
                                  {o.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <Select
                          key={f.key}
                          label={f.label}
                          value={draft[f.key] ?? ""}
                          onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                          placeholder={f.allLabel ?? "Todos"}
                          options={f.options}
                        />
                      ),
                    )}
                  </div>
                </fieldset>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-5 py-3 dark:border-gray-800">
              <Button variant="ghost" size="xs" disabled={draftCount === 0} onClick={() => setDraft({})}>
                Limpar selecção
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="xs" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button size="xs" onClick={apply}>
                  Aplicar filtros
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {(active.length > 0 || searchActive || summary) && (
        <div className="flex flex-wrap items-center gap-2 px-4 pb-3">
          {searchActive && search && (
            <Chip onRemove={() => search.onChange("")}>Pesquisa: “{search.value.trim()}”</Chip>
          )}
          {active.map((f) => (
            <Chip key={f.key} onRemove={() => onChange({ [f.key]: "" })}>
              {chipLabel(f)}
            </Chip>
          ))}
          {(active.length > 0 || searchActive) && (
            <button type="button" onClick={onReset} className="px-1 text-xs font-medium text-gray-500 hover:text-gray-800 hover:underline dark:text-gray-400 dark:hover:text-white">
              Limpar tudo
            </button>
          )}
          {summary && <div className="ml-auto text-sm text-gray-500 dark:text-gray-400">{summary}</div>}
        </div>
      )}
    </div>
  );
}

function Chip({ children, onRemove }: { children: ReactNode; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-brand-100 bg-brand-50 py-1 pl-3 pr-1 text-xs font-medium text-brand-700 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-400">
      {children}
      <button type="button" onClick={onRemove} className="rounded-full p-0.5 hover:bg-brand-100 dark:hover:bg-brand-500/20" aria-label="Remover filtro">
        <XIcon size={12} strokeWidth={2.2} />
      </button>
    </span>
  );
}
