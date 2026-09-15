"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

/**
 * Filtros sincronizados com a query string — permitem partilhar/abrir
 * listagens já filtradas (ex.: /equipamentos?hasProblems=true).
 */
export function useUrlFilters<T extends Record<string, string>>(defaults: T) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const filters = useMemo(() => {
    const out = { ...defaults };
    for (const key of Object.keys(defaults)) {
      const v = params.get(key);
      if (v !== null) (out as Record<string, string>)[key] = v;
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const page = Math.max(1, Number(params.get("page") ?? 1) || 1);

  const update = useCallback(
    (patch: Partial<T> & { page?: number }) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === "" || v === undefined || v === null || (k === "page" && v === 1)) next.delete(k);
        else next.set(k, String(v));
      }
      if (!("page" in patch)) next.delete("page");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  const reset = useCallback(() => router.replace(pathname, { scroll: false }), [pathname, router]);
  const activeCount = Object.entries(filters).filter(([k, v]) => v !== defaults[k]).length;

  return { filters, page, update, reset, activeCount };
}
