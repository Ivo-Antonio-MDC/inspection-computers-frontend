"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { FilterToolbar, yesNo } from "@/components/common/FilterToolbar";
import { Alert, Card, DataTable, EmptyState, PageHeader, Pagination, TableSkeleton } from "@/components/common/ui-kit";
import { ClipboardIcon, PlusIcon } from "@/components/icons";
import EquipmentTypeIcon from "@/components/records/EquipmentTypeIcon";
import Badge, { RecordStatusBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { apiErrorMessage } from "@/lib/api";
import { EQUIPMENT_TYPE_LABELS, RECORD_STATUS_LABELS } from "@/lib/constants";
import { EQUIPMENT_TYPE_ORDER } from "@/lib/equipment-rules";
import { formatDateTime, recordCode } from "@/lib/format";
import { RecordService, UserService } from "@/lib/services";
import { useDebounce } from "@/lib/use-debounce";
import { useUrlFilters } from "@/lib/use-url-filters";
import useAppStore from "@/stores/app.store";
import type { InspectionRecord, Paginated, TeamUser } from "@/types";

const LIMIT = 20;
const DEFAULTS = { search: "", status: "", locationId: "", departmentId: "", createdById: "", equipmentType: "", hasProblems: "", incomplete: "" };

function RecordsList() {
  const { inspectionId, locations, departments } = useAppStore();
  const { filters, page, update, reset, activeCount } = useUrlFilters(DEFAULTS);
  const [search, setSearch] = useState(filters.search);
  const debounced = useDebounce(search, 350);
  const [data, setData] = useState<Paginated<InspectionRecord> | null>(null);
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    UserService.list().then(setUsers).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (debounced !== filters.search) update({ search: debounced });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  useEffect(() => {
    if (!inspectionId) return;
    let cancelled = false;
    setError(null);
    RecordService.list({ ...filters, inspectionId, page, limit: LIMIT })
      .then((r) => !cancelled && setData(r))
      .catch((e) => !cancelled && setError(apiErrorMessage(e)));
    return () => {
      cancelled = true;
    };
  }, [filters, page, inspectionId]);

  return (
    <>
      <PageHeader
        title="Formulários de inspecção"
        crumbs={[{ label: "Formulários" }]}
        description="Consulte, pesquise e filtre os formulários recolhidos na inspecção seleccionada."
        actions={
          <ButtonLink href="/registos/novo" startIcon={<PlusIcon />}>
            Novo formulário
          </ButtonLink>
        }
      />

      <Card bodyClassName="p-0 sm:p-0">
        <FilterToolbar
          search={{ value: search, onChange: setSearch, placeholder: "Colaborador, nº série, hostname, INS-…" }}
          filters={[
            { key: "status", label: "Estado", group: "Formulário", options: Object.entries(RECORD_STATUS_LABELS).map(([value, label]) => ({ value, label })) },
            { key: "createdById", label: "Técnico", group: "Formulário", options: users.map((u) => ({ value: u.id, label: u.name })) },
            { key: "locationId", label: "Localização", group: "Colaborador", allLabel: "Todas", options: locations.map((l) => ({ value: l.id, label: l.name })) },
            { key: "departmentId", label: "Departamento", group: "Colaborador", options: departments.map((d) => ({ value: d.id, label: d.name })) },
            { key: "equipmentType", label: "Inclui equipamento", group: "Equipamentos", allLabel: "Qualquer", options: EQUIPMENT_TYPE_ORDER.map((t) => ({ value: t, label: EQUIPMENT_TYPE_LABELS[t] })) },
            { key: "hasProblems", label: "Problemas", group: "Equipamentos", kind: "choice", options: yesNo("Com problemas", "Sem problemas") },
            { key: "incomplete", label: "Completude", group: "Equipamentos", kind: "choice", options: yesNo("Dados incompletos", "Completos") },
          ]}
          values={filters}
          onChange={update}
          onReset={() => { setSearch(""); reset(); }}
        />

        {error ? (
          <div className="p-5">
            <Alert tone="error">{error}</Alert>
          </div>
        ) : !data ? (
          <TableSkeleton />
        ) : data.items.length === 0 ? (
          <EmptyState
            icon={<ClipboardIcon />}
            title={activeCount ? "Nenhum formulário corresponde aos filtros" : "Ainda não existem formulários nesta inspecção"}
            description={activeCount ? "Ajuste ou limpe os filtros." : "Comece por registar o primeiro formulário de inspecção."}
            action={!activeCount && <ButtonLink href="/registos/novo" startIcon={<PlusIcon />}>Novo formulário</ButtonLink>}
          />
        ) : (
          <>
            <DataTable>
              <thead>
                <tr>
                  <th>Formulário</th>
                  <th>Colaborador</th>
                  <th>Localização</th>
                  <th>Equipamentos</th>
                  <th>Estado</th>
                  <th>Técnico</th>
                  <th>Actualizado</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((r) => {
                  const problems = r.equipment.filter((e) => e.hasProblems).length;
                  return (
                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                      <td>
                        <Link href={`/registos/${r.id}`} className="font-mono text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400">
                          {recordCode(r.number)}
                        </Link>
                      </td>
                      <td>
                        <p className="font-medium text-gray-800 dark:text-white/90">{r.collaborator.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {r.collaborator.position} · {r.collaborator.department.name}
                        </p>
                      </td>
                      <td className="text-gray-600 dark:text-gray-400">{r.collaborator.location.name}</td>
                      <td>
                        <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                          {r.equipment.slice(0, 6).map((e) => (
                            <span key={e.id} title={e.otherDescription || EQUIPMENT_TYPE_LABELS[e.type]}>
                              <EquipmentTypeIcon type={e.type} description={e.otherDescription} size={18} />
                            </span>
                          ))}
                          {r.equipment.length > 6 && <span className="text-xs">+{r.equipment.length - 6}</span>}
                          <span className="ml-1 text-xs tabular-nums">({r.equipment.length})</span>
                        </div>
                        {problems > 0 && (
                          <Badge color="error" className="mt-1">
                            {problems} com problemas
                          </Badge>
                        )}
                      </td>
                      <td>
                        <RecordStatusBadge status={r.status} />
                        {r.incompleteCount > 0 && <p className="mt-1 text-xs text-gray-500">{r.incompleteCount} incompleto(s)</p>}
                      </td>
                      <td className="text-gray-600 dark:text-gray-400">{r.createdBy?.name ?? "—"}</td>
                      <td className="whitespace-nowrap text-gray-500 dark:text-gray-400">{formatDateTime(r.updatedAt)}</td>
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

export default function RecordsPage() {
  return (
    <Suspense>
      <RecordsList />
    </Suspense>
  );
}
