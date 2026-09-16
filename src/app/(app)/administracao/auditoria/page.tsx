"use client";

import Link from "next/link";
import { Fragment, Suspense, useEffect, useState } from "react";
import { FilterToolbar } from "@/components/common/FilterToolbar";
import { Alert, Card, DataTable, EmptyState, PageHeader, Pagination, TableSkeleton } from "@/components/common/ui-kit";
import { ChevronDownIcon, HistoryIcon } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import { apiErrorMessage } from "@/lib/api";
import { AUDIT_ACTION_LABELS } from "@/lib/constants";
import { cn, formatDateTime } from "@/lib/format";
import { AuditService, UserService } from "@/lib/services";
import { useUrlFilters } from "@/lib/use-url-filters";
import useAuthStore from "@/stores/auth.store";
import type { AuditEntry, Paginated, TeamUser } from "@/types";

const LIMIT = 30;
const DEFAULTS = { action: "", entity: "", userId: "", entityId: "" };
const ENTITY_LABELS: Record<string, string> = {
  record: "Formulário",
  collaborator: "Colaborador",
  user: "Utilizador",
  location: "Localização",
  department: "Departamento",
  equipment_category: "Catálogo de equipamentos",
  inspection: "Inspecção",
};

function AuditList() {
  const isAdmin = useAuthStore((s) => s.user?.role === "admin");
  const { filters, page, update, reset, activeCount } = useUrlFilters(DEFAULTS);
  const [data, setData] = useState<Paginated<AuditEntry> | null>(null);
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    UserService.list().then(setUsers).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    AuditService.list({ ...filters, page, limit: LIMIT })
      .then((r) => !cancelled && setData(r))
      .catch((e) => !cancelled && setError(apiErrorMessage(e)));
    return () => {
      cancelled = true;
    };
  }, [filters, page, isAdmin]);

  if (!isAdmin) return <Alert tone="warning">Área reservada ao administrador.</Alert>;

  return (
    <>
      <PageHeader
        title="Auditoria"
        crumbs={[{ label: "Administração" }, { label: "Auditoria" }]}
        description="Registo das submissões, alterações, validações, exportações e acessos."
      />
      <Card bodyClassName="p-0 sm:p-0">
        <FilterToolbar
          filters={[
            { key: "action", label: "Acção", allLabel: "Todas", options: Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => ({ value, label })) },
            { key: "entity", label: "Entidade", allLabel: "Todas", options: Object.entries(ENTITY_LABELS).map(([value, label]) => ({ value, label })) },
            { key: "userId", label: "Utilizador", options: users.map((u) => ({ value: u.id, label: u.name })) },
          ]}
          values={filters}
          onChange={update}
          onReset={reset}
        />
        {error ? (
          <div className="p-5"><Alert tone="error">{error}</Alert></div>
        ) : !data ? (
          <TableSkeleton />
        ) : data.items.length === 0 ? (
          <EmptyState icon={<HistoryIcon />} title="Sem registos de auditoria" />
        ) : (
          <>
            <DataTable>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Utilizador</th>
                  <th>Acção</th>
                  <th>Descrição</th>
                  <th>IP</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.items.map((a) => (
                  <Fragment key={a.id}>
                    <tr>
                      <td className="whitespace-nowrap text-gray-600 dark:text-gray-400">{formatDateTime(a.createdAt)}</td>
                      <td className="text-gray-800 dark:text-white/90">{a.user?.name ?? "—"}</td>
                      <td>
                        <Badge color={a.action === "delete" ? "error" : a.action === "validate" ? "success" : a.action === "request_correction" ? "warning" : "light"}>
                          {AUDIT_ACTION_LABELS[a.action] ?? a.action}
                        </Badge>
                      </td>
                      <td className="max-w-md">
                        <p className="truncate text-gray-700 dark:text-gray-300" title={a.summary ?? ""}>{a.summary}</p>
                        {a.entity === "record" && a.entityId && a.action !== "delete" && (
                          <Link href={`/registos/${a.entityId}`} className="text-xs text-brand-500 hover:underline">Abrir formulário</Link>
                        )}
                      </td>
                      <td className="font-mono text-xs text-gray-500">{a.ip ?? "—"}</td>
                      <td className="text-right">
                        {a.changes && (
                          <button onClick={() => setExpanded(expanded === a.id ? null : a.id)} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5" aria-expanded={expanded === a.id} aria-label="Ver detalhes">
                            <ChevronDownIcon size={18} className={cn("transition-transform", expanded === a.id && "rotate-180")} />
                          </button>
                        )}
                      </td>
                    </tr>
                    {expanded === a.id && a.changes && (
                      <tr>
                        <td colSpan={6} className="bg-gray-50 dark:bg-white/[0.02]">
                          <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-lg text-xs text-gray-700 dark:text-gray-300">{JSON.stringify(a.changes, null, 2)}</pre>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </DataTable>
            <Pagination page={page} limit={LIMIT} total={data.total} onChange={(p) => update({ ...filters, page: p })} />
          </>
        )}
      </Card>
    </>
  );
}

export default function AuditPage() {
  return (
    <Suspense>
      <AuditList />
    </Suspense>
  );
}
