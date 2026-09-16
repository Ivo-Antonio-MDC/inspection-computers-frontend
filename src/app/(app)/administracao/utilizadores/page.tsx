"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Alert, Card, DataTable, PageHeader } from "@/components/common/ui-kit";
import { Input, Select } from "@/components/form/fields";
import { EditIcon, LockIcon, PlusIcon, TrashIcon } from "@/components/icons";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal, { ConfirmDialog } from "@/components/ui/Modal";
import { apiErrorMessage } from "@/lib/api";
import { ROLE_LABELS } from "@/lib/constants";
import { formatDateTime, initials } from "@/lib/format";
import { UserService } from "@/lib/services";
import useAuthStore from "@/stores/auth.store";
import type { TeamUser, UserRole } from "@/types";

const RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,128}$/;

function tempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  const body = Array.from(bytes, (b) => chars[b % chars.length]).join("");
  return `${body}${(bytes[0] % 90) + 10}`;
}

export default function UsersAdminPage() {
  const me = useAuthStore((s) => s.user);
  const [users, setUsers] = useState<TeamUser[] | null>(null);
  const [modal, setModal] = useState<{ open: boolean; edit?: TeamUser }>({ open: false });
  const [form, setForm] = useState({ name: "", email: "", role: "tecnico" as UserRole, password: "", isActive: true });
  const [reset, setReset] = useState<{ user: TeamUser; password: string } | null>(null);
  const [toDelete, setToDelete] = useState<TeamUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => UserService.list().then(setUsers).catch((e) => toast.error(apiErrorMessage(e))), []);
  useEffect(() => {
    void load();
  }, [load]);

  if (me?.role !== "admin") {
    return <Alert tone="warning">Área reservada ao administrador.</Alert>;
  }

  const open = (edit?: TeamUser) => {
    setError(null);
    setForm({ name: edit?.name ?? "", email: edit?.email ?? "", role: edit?.role ?? "tecnico", password: edit ? "" : tempPassword(), isActive: edit?.isActive ?? true });
    setModal({ open: true, edit });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name.trim().length < 3) return setError("Indique o nome");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return setError("Email inválido");
    if (!modal.edit && !RULE.test(form.password)) return setError("A palavra-passe temporária deve ter 8+ caracteres com letras e números");
    setSaving(true);
    setError(null);
    try {
      if (modal.edit) {
        await UserService.update(modal.edit.id, { name: form.name.trim(), email: form.email.trim(), role: form.role, isActive: form.isActive });
        toast.success("Utilizador actualizado");
      } else {
        await UserService.create({ name: form.name.trim(), email: form.email.trim(), role: form.role, password: form.password });
        toast.success("Utilizador criado — comunique a palavra-passe temporária em privado");
      }
      setModal({ open: false });
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const doReset = async () => {
    if (!reset) return;
    if (!RULE.test(reset.password)) return toast.error("Palavra-passe temporária inválida");
    setSaving(true);
    try {
      await UserService.resetPassword(reset.user.id, reset.password);
      toast.success(`Palavra-passe redefinida. ${reset.user.name.split(" ")[0]} terá de a alterar no próximo acesso.`);
      setReset(null);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!toDelete) return;
    setSaving(true);
    try {
      await UserService.remove(toDelete.id);
      toast.success(`Utilizador ${toDelete.name} eliminado`);
      setToDelete(null);
      await load();
    } catch (err) {
      toast.error(apiErrorMessage(err));
      setToDelete(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Equipa de Tecnologia de Informática"
        crumbs={[{ label: "Administração" }, { label: "Equipa de TI" }]}
        description="Apenas estes utilizadores têm acesso ao sistema. Os colaboradores não são utilizadores."
        actions={<Button startIcon={<PlusIcon />} onClick={() => open()}>Novo utilizador</Button>}
      />

      <Card bodyClassName="p-0 sm:p-0">
        {!users ? (
          <div className="skeleton m-5 h-40" />
        ) : (
          <DataTable>
            <thead>
              <tr>
                <th>Utilizador</th>
                <th>Perfil</th>
                <th>Estado</th>
                <th>Último acesso</th>
                <th className="text-right">Acções</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">{initials(u.name)}</span>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white/90">
                          {u.name} {u.id === me.id && <span className="text-xs text-gray-400">(eu)</span>}
                        </p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Badge color={u.role === "admin" ? "primary" : "light"}>{ROLE_LABELS[u.role]}</Badge>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {u.isActive ? <Badge color="success">Activo</Badge> : <Badge color="light">Desactivado</Badge>}
                      {u.mustChangePassword && <Badge color="warning">Palavra-passe temporária</Badge>}
                    </div>
                  </td>
                  <td className="whitespace-nowrap text-gray-600 dark:text-gray-400">{formatDateTime(u.lastLoginAt)}</td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <button onClick={() => open(u)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5" aria-label={`Editar ${u.name}`} title="Editar">
                        <EditIcon size={18} />
                      </button>
                      {u.id !== me.id && (
                        <button onClick={() => setReset({ user: u, password: tempPassword() })} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5" aria-label={`Redefinir palavra-passe de ${u.name}`} title="Redefinir palavra-passe">
                          <LockIcon size={18} />
                        </button>
                      )}
                      {u.id !== me.id && (
                        <button onClick={() => setToDelete(u)} className="rounded-lg p-2 text-gray-500 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/10" aria-label={`Eliminar ${u.name}`} title="Eliminar">
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
        title={modal.edit ? "Editar utilizador" : "Novo utilizador"}
        footer={
          <>
            <Button variant="outline" onClick={() => setModal({ open: false })}>Cancelar</Button>
            <Button type="submit" form="user-form" loading={saving}>Guardar</Button>
          </>
        }
      >
        <form id="user-form" onSubmit={save} className="space-y-4" noValidate>
          {error && <Alert tone="error">{error}</Alert>}
          <Input label="Nome" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Select
            label="Perfil"
            value={form.role}
            disabled={modal.edit?.id === me.id}
            onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
            options={Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }))}
            hint={form.role === "admin" ? "Pode validar formulários, eliminar registos e gerir o sistema." : "Regista e edita formulários de inspecção."}
          />
          {!modal.edit && (
            <Input label="Palavra-passe temporária" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} hint="Gerada automaticamente. O utilizador terá de a alterar no primeiro acesso." className="font-mono" />
          )}
          {modal.edit && modal.edit.id !== me.id && (
            <Select
              label="Estado da conta"
              value={form.isActive ? "1" : "0"}
              onChange={(e) => setForm({ ...form, isActive: e.target.value === "1" })}
              options={[{ value: "1", label: "Activa" }, { value: "0", label: "Desactivada (sem acesso)" }]}
            />
          )}
        </form>
      </Modal>

      <Modal
        open={!!reset}
        onClose={() => setReset(null)}
        title="Redefinir palavra-passe"
        description={reset?.user.name}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setReset(null)}>Cancelar</Button>
            <Button loading={saving} onClick={doReset}>Redefinir</Button>
          </>
        }
      >
        {reset && (
          <div className="space-y-3">
            <Input label="Nova palavra-passe temporária" value={reset.password} onChange={(e) => setReset({ ...reset, password: e.target.value })} className="font-mono" />
            <p className="text-sm text-gray-500">As sessões activas do utilizador serão terminadas.</p>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Eliminar utilizador"
        message={
          <>
            Eliminar <strong>{toDelete?.name}</strong> ({toDelete?.email})? A conta deixa de existir e as sessões activas são terminadas.
            Se o utilizador já registou formulários, não pode ser eliminado — desactive a conta em vez disso.
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
