"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import toast from "react-hot-toast";
import { Alert, Card, PageHeader } from "@/components/common/ui-kit";
import { Input } from "@/components/form/fields";
import Button from "@/components/ui/Button";
import { ROLE_LABELS } from "@/lib/constants";
import { formatDateTime, initials } from "@/lib/format";
import useAppStore from "@/stores/app.store";
import useAuthStore from "@/stores/auth.store";

const RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,128}$/;

function ProfileContent() {
  const router = useRouter();
  const mandatory = useSearchParams().get("obrigatorio") === "1";
  const { user, changePassword, loading, error, clearError } = useAuthStore();
  const loadApp = useAppStore((s) => s.load);
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!user) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.current) errs.current = "Indique a palavra-passe actual";
    if (!RULE.test(form.next)) errs.next = "Mínimo de 8 caracteres, com letras e números";
    if (form.next && form.next === form.current) errs.next = "A nova palavra-passe deve ser diferente da actual";
    if (form.confirm !== form.next) errs.confirm = "As palavras-passe não coincidem";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    clearError();
    if (await changePassword(form.current, form.next)) {
      toast.success("Palavra-passe alterada com sucesso");
      setForm({ current: "", next: "", confirm: "" });
      if (mandatory) {
        await loadApp(true);
        router.replace("/");
      }
    }
  };

  return (
    <>
      <PageHeader title="Perfil e palavra-passe" crumbs={[{ label: "Perfil" }]} />
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2" title="Os meus dados">
          <div className="flex items-center gap-4">
            <span className="flex size-16 items-center justify-center rounded-full bg-brand-500 text-xl font-bold text-white">
              {initials(user.name)}
            </span>
            <div>
              <p className="text-lg font-semibold text-gray-800 dark:text-white/90">{user.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
              <p className="mt-1 text-sm font-medium text-brand-500">{ROLE_LABELS[user.role]}</p>
            </div>
          </div>
          {user.lastLoginAt && (
            <p className="mt-5 text-sm text-gray-500 dark:text-gray-400">Último acesso: {formatDateTime(user.lastLoginAt)}</p>
          )}
        </Card>

        <Card className="lg:col-span-3" title="Alterar palavra-passe" desc="Use pelo menos 8 caracteres, combinando letras e números.">
          <form onSubmit={submit} className="space-y-5" noValidate>
            {(mandatory || user.mustChangePassword) && (
              <Alert tone="warning" title="Alteração obrigatória">
                Está a usar uma palavra-passe temporária. Defina uma palavra-passe pessoal para continuar a usar o sistema.
              </Alert>
            )}
            {error && <Alert tone="error">{error}</Alert>}
            <Input label="Palavra-passe actual" type="password" autoComplete="current-password" required value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} error={errors.current} />
            <div className="grid gap-5 sm:grid-cols-2">
              <Input label="Nova palavra-passe" type="password" autoComplete="new-password" required value={form.next} onChange={(e) => setForm({ ...form, next: e.target.value })} error={errors.next} />
              <Input label="Confirmar nova palavra-passe" type="password" autoComplete="new-password" required value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} error={errors.confirm} />
            </div>
            <div className="flex justify-end">
              <Button type="submit" loading={loading}>
                Guardar nova palavra-passe
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}

export default function ProfilePage() {
  return (
    <Suspense>
      <ProfileContent />
    </Suspense>
  );
}
