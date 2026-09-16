"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Alert, Card, DataTable, EmptyState, PageHeader } from "@/components/common/ui-kit";
import { Input, Select, TextArea } from "@/components/form/fields";
import { CalendarIcon, EditIcon, PlusIcon, TrashIcon } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal, { ConfirmDialog } from "@/components/ui/Modal";
import { apiErrorMessage } from "@/lib/api";
import { INSPECTION_STATUS_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { InspectionService } from "@/lib/services";
import useAppStore from "@/stores/app.store";
import useAuthStore from "@/stores/auth.store";
import type { Inspection, InspectionStatus } from "@/types";

const EMPTY = { name: "", description: "", startDate: "", endDate: "", status: "planeada" as InspectionStatus };

export default function InspectionsAdminPage() {
  const { inspections, inspectionId, selectInspection, reloadLookups } = useAppStore();
  const isAdmin = useAuthStore((s) => s.user?.role === "admin");
  const [modal, setModal] = useState<{ open: boolean; edit?: Inspection }>({ open: false });
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState<Inspection | null>(null);

  const open = (edit?: Inspection) => {
    setError(null);
    setForm(
      edit
        ? { name: edit.name, description: edit.description ?? "", startDate: edit.startDate ?? "", endDate: edit.endDate ?? "", status: edit.status }
        : EMPTY,
    );
    setModal({ open: true, edit });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name.trim().length < 3) return setError("Indique o nome da inspecção");
    if (form.startDate && form.endDate && form.endDate < form.startDate) return setError("A data de fim é anterior à data de início");
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      status: form.status,
    } as Partial<Inspection>;
    try {
      const saved = modal.edit ? await InspectionService.update(modal.edit.id, payload) : await InspectionService.create(payload);
      await reloadLookups();
      if (!modal.edit) selectInspection(saved.id);
      toast.success(modal.edit ? "Inspecção actualizada" : "Inspecção criada e seleccionada");
      setModal({ open: false });
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!toDelete) return;
    setSaving(true);
    try {
      await InspectionService.remove(toDelete.id);
      await reloadLookups();
      if (toDelete.id === inspectionId) {
        const next = useAppStore.getState().inspections[0];
        if (next) selectInspection(next.id);
      }
      toast.success(`Inspecção "${toDelete.name}" eliminada`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSaving(false);
      setToDelete(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Inspecções"
        crumbs={[{ label: "Administração" }, { label: "Inspecções" }]}
        description="Cada inspecção agrupa os seus formulários, permitindo reutilizar o sistema em futuras inspecções."
        actions={isAdmin && <Button startIcon={<PlusIcon />} onClick={() => open()}>Nova inspecção</Button>}
      />
      <Card bodyClassName="p-0 sm:p-0">
        {inspections.length === 0 ? (
          <EmptyState icon={<CalendarIcon />} title="Nenhuma inspecção criada" />
        ) : (
          <DataTable>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Estado</th>
                <th>Período</th>
                <th className="text-right">Formulários</th>
                <th className="text-right">Acções</th>
              </tr>
            </thead>
            <tbody>
              {inspections.map((i) => (
                <tr key={i.id}>
                  <td>
                    <p className="font-medium text-gray-800 dark:text-white/90">{i.name}</p>
                    {i.description && <p className="max-w-xl truncate text-xs text-gray-500">{i.description}</p>}
                  </td>
                  <td>
                    <Badge color={i.status === "em_curso" ? "success" : i.status === "concluida" ? "dark" : "light"}>{INSPECTION_STATUS_LABELS[i.status]}</Badge>
                  </td>
                  <td className="whitespace-nowrap text-gray-600 dark:text-gray-400">
                    {formatDate(i.startDate)} — {formatDate(i.endDate)}
                  </td>
                  <td className="text-right tabular-nums">{i.recordCount ?? 0}</td>
                  <td>
                    <div className="flex justify-end gap-2">
                      {i.id === inspectionId ? (
                        <Badge color="primary">Seleccionada</Badge>
                      ) : (
                        <Button size="xs" variant="outline" onClick={() => selectInspection(i.id)}>Seleccionar</Button>
                      )}
                      {isAdmin && (
                        <button onClick={() => open(i)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5" aria-label={`Editar ${i.name}`}>
                          <EditIcon size={18} />
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => setToDelete(i)}
                          disabled={(i.recordCount ?? 0) > 0}
                          className="rounded-lg p-2 text-gray-500 hover:bg-error-50 hover:text-error-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-500 dark:hover:bg-error-500/10"
                          aria-label={`Eliminar ${i.name}`}
                          title={(i.recordCount ?? 0) > 0 ? "Não é possível eliminar: a inspecção já tem formulários" : "Eliminar"}
                        >
                          <TrashIcon size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </Card>

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false })}
        title={modal.edit ? "Editar inspecção" : "Nova inspecção"}
        footer={
          <>
            <Button variant="outline" onClick={() => setModal({ open: false })}>Cancelar</Button>
            <Button type="submit" form="inspection-form" loading={saving}>Guardar</Button>
          </>
        }
      >
        <form id="inspection-form" onSubmit={save} className="space-y-4" noValidate>
          {error && <Alert tone="error">{error}</Alert>}
          <Input label="Nome" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Inspecção Geral do Parque Informático 2027" />
          <TextArea label="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Início" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            <Input label="Fim" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            <Select label="Estado" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as InspectionStatus })} options={Object.entries(INSPECTION_STATUS_LABELS).map(([value, label]) => ({ value, label }))} />
          </div>
          {form.status === "concluida" && <Alert tone="warning">Numa inspecção concluída apenas o administrador pode alterar formulários.</Alert>}
        </form>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar inspecção"
        message={
          <>
            Eliminar a inspecção <strong>{toDelete?.name}</strong>? Esta acção não pode ser anulada.
            {toDelete?.id === inspectionId && " É a inspecção seleccionada — será seleccionada outra automaticamente."}
          </>
        }
        confirmLabel="Eliminar"
        danger
        loading={saving}
        onConfirm={doDelete}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}
