"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Alert, Card, DataTable, EmptyState, FilterBar, PageHeader, Pagination, TableSkeleton } from "@/components/common/ui-kit";
import { SearchInput, Select } from "@/components/form/fields";
import { DownloadIcon, LaptopIcon } from "@/components/icons";
import EquipmentTypeIcon from "@/components/records/EquipmentTypeIcon";
import Badge, { ConditionBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { apiErrorMessage } from "@/lib/api";
import { CONDITION_OPTIONS, EQUIPMENT_TYPE_LABELS, PROBLEM_OPTIONS, RECORD_STATUS_LABELS } from "@/lib/constants";
import { EQUIPMENT_TYPE_ORDER } from "@/lib/equipment-rules";
import { recordCode } from "@/lib/format";
import { EquipmentService, ReportService } from "@/lib/services";
import { useDebounce } from "@/lib/use-debounce";
import { useUrlFilters } from "@/lib/use-url-filters";
import useAppStore from "@/stores/app.store";
import type { EquipmentRow, Paginated } from "@/types";

const LIMIT = 25;
const DEFAULTS = {
  search: "",
  type: "",
  condition: "",
  locationId: "",
  departmentId: "",
  recordStatus: "",
  problem: "",
  hasProblems: "",
  missingSerial: "",
  incomplete: "",
  needsMaintenance: "",
  needsReplacement: "",
};

const YES_NO = (yes: string, no: string) => [
  { value: "true", label: yes },
  { value: "false", label: no },
];

function EquipmentList() {
  const { inspectionId, locations, departments } = useAppStore();
  const { filters, page, update, reset, activeCount } = useUrlFilters(DEFAULTS);
  const [search, setSearch] = useState(filters.search);
  const debounced = useDebounce(search, 350);
  const [data, setData] = useState<Paginated<EquipmentRow> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<"xlsx" | "csv" | null>(null);

  useEffect(() => {
    if (debounced !== filters.search) update({ search: debounced });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  useEffect(() => {
    if (!inspectionId) return;
    let cancelled = false;
    setError(null);
    EquipmentService.list({ ...filters, inspectionId, page, limit: LIMIT })
      .then((r) => !cancelled && setData(r))
      .catch((e) => !cancelled && setError(apiErrorMessage(e)));
    return () => {
      cancelled = true;
    };
  }, [filters, page, inspectionId]);

  const exportFile = async (format: "xlsx" | "csv") => {
    if (!inspectionId) return;
    setExporting(format);
    try {
      await ReportService.export({ ...filters, inspectionId, format });
      toast.success("Exportação concluída");
    } catch (e) {
      toast.error(apiErrorMessage(e, "Falha na exportação"));
    } finally {
      setExporting(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Equipamentos"
        crumbs={[{ label: "Equipamentos" }]}
        description="Cada equipamento individualizado, com filtros por tipo, estado, localização e problemas."
        actions={
          <>
            <Button variant="outline" startIcon={<DownloadIcon />} loading={exporting === "csv"} onClick={() => exportFile("csv")}>
              CSV
            </Button>
            <Button startIcon={<DownloadIcon />} loading={exporting === "xlsx"} onClick={() => exportFile("xlsx")}>
              Exportar Excel{activeCount > 0 ? " (filtrado)" : ""}
            </Button>
          </>
        }
      />

      <Card bodyClassName="p-0 sm:p-0">
        <FilterBar>
          <SearchInput value={search} onChange={setSearch} placeholder="Nº série, marca, modelo, hostname, colaborador…" />
          <Select value={filters.type} onChange={(e) => update({ type: e.target.value })} placeholder="Todos os tipos" options={EQUIPMENT_TYPE_ORDER.map((t) => ({ value: t, label: EQUIPMENT_TYPE_LABELS[t] }))} aria-label="Tipo" />
          <Select value={filters.condition} onChange={(e) => update({ condition: e.target.value })} placeholder="Todos os estados" options={CONDITION_OPTIONS} aria-label="Estado físico" />
          <Select value={filters.locationId} onChange={(e) => update({ locationId: e.target.value })} placeholder="Todas as localizações" options={locations.map((l) => ({ value: l.id, label: l.name }))} aria-label="Localização" />
          <Select value={filters.departmentId} onChange={(e) => update({ departmentId: e.target.value })} placeholder="Todos os departamentos" options={departments.map((d) => ({ value: d.id, label: d.name }))} aria-label="Departamento" />
          <Select value={filters.problem} onChange={(e) => update({ problem: e.target.value })} placeholder="Qualquer problema" options={PROBLEM_OPTIONS} aria-label="Problema" />
          <Select value={filters.hasProblems} onChange={(e) => update({ hasProblems: e.target.value })} placeholder="Problemas: todos" options={YES_NO("Com problemas", "Sem problemas")} aria-label="Com problemas" />
          <Select value={filters.missingSerial} onChange={(e) => update({ missingSerial: e.target.value })} placeholder="Nº de série: todos" options={YES_NO("Sem nº de série", "Com nº de série")} aria-label="Número de série" />
          <Select value={filters.incomplete} onChange={(e) => update({ incomplete: e.target.value })} placeholder="Completude: todos" options={YES_NO("Dados incompletos", "Dados completos")} aria-label="Completude" />
          <Select value={filters.needsMaintenance} onChange={(e) => update({ needsMaintenance: e.target.value })} placeholder="Manutenção: todos" options={YES_NO("Necessita manutenção", "Não necessita")} aria-label="Manutenção" />
          <Select value={filters.needsReplacement} onChange={(e) => update({ needsReplacement: e.target.value })} placeholder="Substituição: todos" options={YES_NO("Necessita substituição", "Não necessita")} aria-label="Substituição" />
          <Select value={filters.recordStatus} onChange={(e) => update({ recordStatus: e.target.value })} placeholder="Formulário: todos" options={Object.entries(RECORD_STATUS_LABELS).map(([value, label]) => ({ value, label }))} aria-label="Estado do formulário" />
          {activeCount > 0 && (
            <Button variant="ghost" onClick={() => { setSearch(""); reset(); }}>
              Limpar filtros ({activeCount})
            </Button>
          )}
        </FilterBar>

        {error ? (
          <div className="p-5"><Alert tone="error">{error}</Alert></div>
        ) : !data ? (
          <TableSkeleton cols={6} />
        ) : data.items.length === 0 ? (
          <EmptyState icon={<LaptopIcon />} title={activeCount ? "Nenhum equipamento corresponde aos filtros" : "Ainda não existem equipamentos registados"} />
        ) : (
          <>
            <div className="px-5 pt-3 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold text-gray-800 dark:text-white">{data.total}</span> equipamento(s)
            </div>
            <DataTable>
              <thead>
                <tr>
                  <th>Equipamento</th>
                  <th>Nº de série</th>
                  <th>Especificações</th>
                  <th>Estado</th>
                  <th>Colaborador</th>
                  <th>Formulário</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((e) => {
                  const r = e.record;
                  const computer = e.type === "laptop" || e.type === "desktop";
                  return (
                    <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                      <td>
                        <div className="flex items-center gap-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300">
                            <EquipmentTypeIcon type={e.type} size={18} />
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-800 dark:text-white/90">{[e.brand, e.model].filter(Boolean).join(" ") || "—"}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{e.type === "outro" && e.otherDescription ? e.otherDescription : EQUIPMENT_TYPE_LABELS[e.type]}</p>
                          </div>
                        </div>
                      </td>
                      <td className="font-mono text-xs">
                        {e.serialUnavailable ? <Badge color="warning">Indisponível</Badge> : e.serialNumber ?? <span className="text-gray-400">—</span>}
                        {e.hostname && <p className="mt-0.5 text-gray-500">{e.hostname}</p>}
                      </td>
                      <td className="text-xs text-gray-600 dark:text-gray-400">
                        {computer ? (
                          <>
                            <p>{e.processor ?? "—"}</p>
                            <p>
                              {e.ramGb ? `${e.ramGb} GB RAM` : "—"} · {e.storageCapacityGb ? `${e.storageCapacityGb} GB` : "—"} · {e.operatingSystem ?? "—"}
                            </p>
                          </>
                        ) : e.screenSizeInches ? (
                          `${e.screenSizeInches}"`
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          <ConditionBadge condition={e.condition} />
                          {e.hasProblems && <Badge color="error">Problemas</Badge>}
                          {e.needsMaintenance && <Badge color="warning">Manutenção</Badge>}
                          {e.needsReplacement && <Badge color="error">Substituição</Badge>}
                          {!e.isComplete && <Badge color="light">Incompleto</Badge>}
                        </div>
                      </td>
                      <td>
                        <p className="font-medium text-gray-800 dark:text-white/90">{r.collaborator.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {r.collaborator.department.name} · {r.collaborator.location.name}
                        </p>
                      </td>
                      <td>
                        <Link href={`/registos/${r.id}`} className="font-mono text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400">
                          {recordCode(r.number)}
                        </Link>
                        <p className="text-xs text-gray-500">{RECORD_STATUS_LABELS[r.status]}</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </DataTable>
            <Pagination page={page} limit={LIMIT} total={data.total} onChange={(p) => update({ ...filters, page: p })} />
          </>
        )}
      </Card>
    </>
  );
}

export default function EquipmentPage() {
  return (
    <Suspense>
      <EquipmentList />
    </Suspense>
  );
}
