"use client";

import { useCallback, useEffect, useState } from "react";
import { apiErrorMessage } from "./api";
import { ReportService } from "./services";
import type { ReportSummary } from "@/types";

export function useSummary(inspectionId: string | null) {
  const [data, setData] = useState<ReportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!inspectionId) return;
    setLoading(true);
    setError(null);
    try {
      setData(await ReportService.summary(inspectionId));
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [inspectionId]);

  useEffect(() => {
    setData(null);
    void load();
  }, [load]);

  return { data, error, loading, reload: load };
}

/** Preenche os dias sem submissões para o eixo temporal ser contínuo. */
export function fillTimeline(rows: { day: string; total: number }[]) {
  if (rows.length === 0) return [];
  const byDay = new Map(rows.map((r) => [r.day, r.total]));
  const start = new Date(`${rows[0].day}T00:00:00`);
  const end = new Date(`${rows[rows.length - 1].day}T00:00:00`);
  const out: { key: string; label: string; value: number }[] = [];
  for (let d = new Date(start); d <= end && out.length < 120; d.setDate(d.getDate() + 1)) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    out.push({ key, label: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`, value: byDay.get(key) ?? 0 });
  }
  return out;
}
