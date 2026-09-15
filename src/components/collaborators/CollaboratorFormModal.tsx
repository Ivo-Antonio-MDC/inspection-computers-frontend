"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Alert } from "@/components/common/ui-kit";
import { Input, Select } from "@/components/form/fields";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { apiErrorMessage } from "@/lib/api";
import { MODALITY_LABELS } from "@/lib/constants";
import { CollaboratorService } from "@/lib/services";
import useAppStore from "@/stores/app.store";
import type { Collaborator } from "@/types";

interface Props {
  open: boolean;
  collaborator?: Collaborator | null;
  initialName?: string;
  onClose: () => void;
  onSaved: (c: Collaborator) => void;
}

/** TR §7.1 — Identificação do utilizador: nome, departamento, localização e cargo/função. */
export default function CollaboratorFormModal({ open, collaborator, initialName, onClose, onSaved }: Props) {
  const { locations, departments } = useAppStore();
  const [form, setForm] = useState({ name: "", departmentId: "", locationId: "", position: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setServerError(null);
    setForm({
      name: collaborator?.name ?? initialName ?? "",
      departmentId: collaborator?.departmentId ?? "",
      locationId: collaborator?.locationId ?? "",
      position: collaborator?.position ?? "",
    });
  }, [open, collaborator, initialName]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (form.name.trim().replace(/\s+/g, " ").length < 3) errs.name = "Indique o nome completo (mín. 3 caracteres)";
    if (!form.departmentId) errs.departmentId = "Seleccione o departamento";
    if (!form.locationId) errs.locationId = "Seleccione a localização";
    if (form.position.trim().length < 2) errs.position = "Indique o cargo/função";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    setServerError(null);
    try {
      const payload = { ...form, name: form.name.trim(), position: form.position.trim() };
      const saved = collaborator
        ? await CollaboratorService.update(collaborator.id, payload)
        : await CollaboratorService.create(payload);
      toast.success(collaborator ? "Dados do colaborador actualizados" : "Colaborador registado");
      onSaved(saved);
    } catch (err) {
      setServerError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={collaborator ? "Editar colaborador" : "Novo colaborador"}
      description="Identificação do utilizador do equipamento"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="collaborator-form" loading={saving}>
            {collaborator ? "Guardar alterações" : "Registar colaborador"}
          </Button>
        </>
      }
    >
      <form id="collaborator-form" onSubmit={submit} className="space-y-4" noValidate>
        {serverError && <Alert tone="error">{serverError}</Alert>}
        <Input label="Nome do utilizador" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} autoFocus placeholder="Nome e apelido" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Departamento"
            required
            value={form.departmentId}
            onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
            placeholder="Seleccione…"
            options={departments.map((d) => ({ value: d.id, label: d.name }))}
            error={errors.departmentId}
          />
          <Select
            label="Localização"
            required
            value={form.locationId}
            onChange={(e) => setForm({ ...form, locationId: e.target.value })}
            placeholder="Seleccione…"
            options={locations.map((l) => ({ value: l.id, label: `${l.name} (${MODALITY_LABELS[l.modality]})` }))}
            error={errors.locationId}
          />
        </div>
        <Input label="Cargo/Função" required value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} error={errors.position} placeholder="Ex.: Técnico de Contabilidade" />
      </form>
    </Modal>
  );
}
