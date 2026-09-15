"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Alert, Card, DataTable, EmptyState, PageHeader } from "@/components/common/ui-kit";
import { Checkbox, Input, Select } from "@/components/form/fields";
import { EditIcon, PlusIcon, TrashIcon } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal, { ConfirmDialog } from "@/components/ui/Modal";
import { apiErrorMessage } from "@/lib/api";
import { MODALITY_LABELS } from "@/lib/constants";
import useAppStore from "@/stores/app.store";
import useAuthStore from "@/stores/auth.store";
import type { Modality } from "@/types";

interface Row {
  id: string;
  name: string;
  isActive: boolean;
  modality?: Modality;
}

interface Props {
  title: string;
  singular: string;
  description: string;
  withModality?: boolean;
  list: (includeInactive: boolean) => Promise<Row[]>;
  create: (data: Partial<Row>) => Promise<unknown>;
  update: (id: string, data: Partial<Row>) => Promise<unknown>;
  remove: (id: string) => Promise<unknown>;
}

/** Gestão de listas de referência (localizações e departamentos). */
export default function LookupAdmin({ title, singular, description, withModality, list, create, update, remove }: Props) {
  const isAdmin = useAuthStore((s) => s.user?.role === "admin");
  const reloadLookups = useAppStore((s) => s.reloadLookups);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [modal, setModal] = useState<{ open: boolean; edit?: Row }>({ open: false });
  const [form, setForm] = useState<{ name: string; modality: Modality; isActive: boolean }>({ name: "", modality: "remota", isActive: true });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Row | null>(null);

  const load = useCallback(() => list(true).then(setRows).catch((e) => toast.error(apiErrorMessage(e))), [list]);
  useEffect(() => {
    void load();
  }, [load]);

  const open = (edit?: Row) => {
    setError(null);
    setForm({ name: edit?.name ?? "", modality: edit?.modality ?? "remota", isActive: edit?.isActive ?? true });
    setModal({ open: true, edit });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name.trim().length < 2) return setError("Indique o nome");
    setSaving(true);
    setError(null);
    const payload: Partial<Row> = { name: form.name.trim(), isActive: form.isActive, ...(withModality ? { modality: form.modality } : {}) };
    try {
      if (modal.edit) await update(modal.edit.id, payload);
      else await create(payload);
      toast.success(`${singular} guardado(a)`);
      setModal({ open: false });
      await Promise.all([load(), reloadLookups()]);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!toDelete) return;
    try {
      await remove(toDelete.id);
      toast.success(`${singular} eliminado(a)`);
      setToDelete(null);
      await Promise.all([load(), reloadLookups()]);
    } catch (err) {
      toast.error(apiErrorMessage(err));
      setToDelete(null);
    }
  };

  return (
    <>
      <PageHeader
        title={title}
        crumbs={[{ label: "Administração" }, { label: title }]}
        description={description}
        actions={isAdmin && <Button startIcon={<PlusIcon />} onClick={() => open()}>Adicionar</Button>}
      />
      {!isAdmin && <Alert tone="info" className="mb-4">Consulta apenas. A gestão destas listas está reservada ao administrador.</Alert>}
      <Card bodyClassName="p-0 sm:p-0">
        {!rows ? (
          <div className="skeleton m-5 h-40" />
        ) : rows.length === 0 ? (
          <EmptyState title="Lista vazia" />
        ) : (
          <DataTable className="[&_table]:min-w-[480px]">
            <thead>
              <tr>
                <th>Nome</th>
                {withModality && <th>Modalidade</th>}
                <th>Estado</th>
                {isAdmin && <th className="text-right">Acções</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="font-medium text-gray-800 dark:text-white/90">{r.name}</td>
                  {withModality && <td className="text-gray-600 dark:text-gray-400">{r.modality ? MODALITY_LABELS[r.modality] : "—"}</td>}
                  <td>{r.isActive ? <Badge color="success">Activo</Badge> : <Badge color="light">Inactivo</Badge>}</td>
                  {isAdmin && (
                    <td>
                      <div className="flex justify-end gap-1">
                        <button onClick={() => open(r)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5" aria-label={`Editar ${r.name}`}>
                          <EditIcon size={18} />
                        </button>
                        <button onClick={() => setToDelete(r)} className="rounded-lg p-2 text-gray-500 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/10" aria-label={`Eliminar ${r.name}`}>
                          <TrashIcon size={18} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </Card>

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false })}
        title={modal.edit ? `Editar ${singular.toLowerCase()}` : `Adicionar ${singular.toLowerCase()}`}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setModal({ open: false })}>Cancelar</Button>
            <Button type="submit" form="lookup-form" loading={saving}>Guardar</Button>
          </>
        }
      >
        <form id="lookup-form" onSubmit={save} className="space-y-4" noValidate>
          {error && <Alert tone="error">{error}</Alert>}
          <Input label="Nome" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
          {withModality && (
            <Select label="Modalidade da inspecção" value={form.modality} onChange={(e) => setForm({ ...form, modality: e.target.value as Modality })} options={Object.entries(MODALITY_LABELS).map(([value, label]) => ({ value, label }))} />
          )}
          <Checkbox checked={form.isActive} onChange={(v) => setForm({ ...form, isActive: v })} label="Activo" description="Os itens inactivos deixam de aparecer nas listas de selecção." />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title={`Eliminar ${singular.toLowerCase()}`}
        message={<>Eliminar <strong>{toDelete?.name}</strong>? Se existirem colaboradores associados, desactive-o em vez de eliminar.</>}
        confirmLabel="Eliminar"
        danger
        onConfirm={doDelete}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}
