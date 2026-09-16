"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import CollaboratorFormModal from "@/components/collaborators/CollaboratorFormModal";
import { FilterToolbar } from "@/components/common/FilterToolbar";
import { Alert, Card, DataTable, EmptyState, PageHeader, Pagination, TableSkeleton } from "@/components/common/ui-kit";
import { EditIcon, PlusIcon, TrashIcon, UsersIcon } from "@/components/icons";
import Badge, { RecordStatusBadge } from "@/components/ui/Badge";
import Button, { ButtonLink } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Modal";
import { apiErrorMessage } from "@/lib/api";
import { MODALITY_LABELS, RECORD_STATUS_LABELS } from "@/lib/constants";
import { recordCode } from "@/lib/format";
import { CollaboratorService } from "@/lib/services";
import { useDebounce } from "@/lib/use-debounce";
import { useUrlFilters } from "@/lib/use-url-filters";
import useAppStore from "@/stores/app.store";
import useAuthStore from "@/stores/auth.store";
import type { Collaborator, Paginated } from "@/types";

const LIMIT = 25;
const DEFAULTS = { search: "", departmentId: "", locationId: "", recordStatus: "" };

function CollaboratorsList() {
  const { inspectionId, locations, departments } = useAppStore();
  const isAdmin = useAuthStore((s) => s.user?.role === "admin");
  const { filters, page, update, reset, activeCount } = useUrlFilters(DEFAULTS);
  const [search, setSearch] = useState(filters.search);
  const debounced = useDebounce(search, 350);
  const [data, setData] = useState<Paginated<Collaborator> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<{ open: boolean; edit?: Collaborator | null }>({ open: false });
  const [toDelete, setToDelete] = useState<Collaborator | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (debounced !== filters.search) update({ search: debounced });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const load = useCallback(() => {
    setError(null);
    return CollaboratorService.list({ ...filters, inspectionId, page, limit: LIMIT })
      .then(setData)
      .catch((e) => setError(apiErrorMessage(e)));
  }, [filters, page, inspectionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const remove = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await CollaboratorService.remove(toDelete.id);
      toast.success("Colaborador eliminado");
      setToDelete(null);
      await load();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Colaboradores"
        crumbs={[{ label: "Colaboradores" }]}
        description="Colaboradores da MD Consultores e estado do respectivo formulário na inspecção seleccionada."
        actions={
          <Button startIcon={<PlusIcon />} onClick={() => setModal({ open: true })}>
            Novo colaborador
          </Button>
        }
      />

      <Card bodyClassName="p-0 sm:p-0">
        <FilterToolbar
          search={{ value: search, onChange: setSearch, placeholder: "Pesquisar por nome ou cargo…" }}
          filters={[
            { key: "departmentId", label: "Departamento", options: departments.map((d) => ({ value: d.id, label: d.name })) },
            { key: "locationId", label: "Localização", allLabel: "Todas", options: locations.map((l) => ({ value: l.id, label: l.name })) },
            { key: "recordStatus", label: "Estado do formulário", options: [{ value: "sem_registo", label: "Ainda não inspeccionado" }, ...Object.entries(RECORD_STATUS_LABELS).map(([value, label]) => ({ value, label }))] },
          ]}
          values={filters}
          onChange={update}
          onReset={() => { setSearch(""); reset(); }}
        />

        {error ? (
          <div className="p-5"><Alert tone="error">{error}</Alert></div>
        ) : !data ? (
          <TableSkeleton />
        ) : data.items.length === 0 ? (
          <EmptyState
            icon={<UsersIcon />}
            title={activeCount ? "Nenhum colaborador corresponde aos filtros" : "Ainda não existem colaboradores registados"}
            action={!activeCount && <Button startIcon={<PlusIcon />} onClick={() => setModal({ open: true })}>Registar colaborador</Button>}
          />
        ) : (
          <>
            <DataTable>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Cargo/Função</th>
                  <th>Departamento</th>
                  <th>Localização</th>
                  <th>Formulário</th>
                  <th className="text-right">Acções</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                    <td className="font-medium text-gray-800 dark:text-white/90">{c.name}</td>
                    <td className="text-gray-600 dark:text-gray-400">{c.position}</td>
                    <td className="text-gray-600 dark:text-gray-400">{c.department.name}</td>
                    <td className="text-gray-600 dark:text-gray-400">
                      {c.location.name} <Badge color="light" className="ml-1">{MODALITY_LABELS[c.location.modality]}</Badge>
                    </td>
                    <td>
                      {c.record ? (
                        <Link href={`/registos/${c.record.id}`} className="flex flex-col items-start gap-1">
                          <RecordStatusBadge status={c.record.status} />
                          <span className="font-mono text-xs text-brand-600 hover:underline dark:text-brand-400">{recordCode(c.record.number)}</span>
                        </Link>
                      ) : (
                        <ButtonLink href={`/registos/novo?colaborador=${c.id}`} size="xs" variant="outline" startIcon={<PlusIcon />}>
                          Iniciar formulário
                        </ButtonLink>
                      )}
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setModal({ open: true, edit: c })} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800 dark:hover:bg-white/5" aria-label={`Editar ${c.name}`} title="Editar">
                          <EditIcon size={18} />
                        </button>
                        {isAdmin && (
                          <button onClick={() => setToDelete(c)} className="rounded-lg p-2 text-gray-500 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/10" aria-label={`Eliminar ${c.name}`} title="Eliminar">
                            <TrashIcon size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
            <Pagination page={page} limit={LIMIT} total={data.total} onChange={(p) => update({ ...filters, page: p })} />
          </>
        )}
      </Card>

      <CollaboratorFormModal
        open={modal.open}
        collaborator={modal.edit}
        onClose={() => setModal({ open: false })}
        onSaved={() => {
          setModal({ open: false });
          void load();
        }}
      />

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar colaborador"
        message={<>Eliminar <strong>{toDelete?.name}</strong>? Só é possível se o colaborador não tiver formulários.</>}
        confirmLabel="Eliminar"
        danger
        loading={deleting}
        onConfirm={remove}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}

export default function CollaboratorsPage() {
  return (
    <Suspense>
      <CollaboratorsList />
    </Suspense>
  );
}
