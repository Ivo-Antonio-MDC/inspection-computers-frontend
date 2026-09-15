"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Alert } from "@/components/common/ui-kit";
import { Input } from "@/components/form/fields";
import { CheckCircleIcon, EyeIcon, EyeOffIcon, LaptopIcon, MoonIcon, SunIcon } from "@/components/icons";
import Button from "@/components/ui/Button";
import { useTheme } from "@/context/providers";
import useAuthStore from "@/stores/auth.store";

function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { login, loading, error, clearError, user, isInitializing, init } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    void init();
  }, [init]);

  useEffect(() => {
    if (!isInitializing && user) router.replace(user.mustChangePassword ? "/perfil?obrigatorio=1" : safeNext(params.get("next")));
  }, [isInitializing, user, router, params]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof fieldErrors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = "Indique um email válido";
    if (!password) errs.password = "Indique a palavra-passe";
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;
    clearError();
    await login(email.trim().toLowerCase(), password);
  };

  return (
    <div className="flex w-full flex-1 flex-col justify-center lg:w-1/2">
      <div className="mx-auto w-full max-w-md px-6 py-10">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-brand-500 text-white">
            <LaptopIcon size={24} />
          </span>
          <div className="leading-tight">
            <p className="font-bold text-gray-900 dark:text-white">Inspecção de Computadores</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">MD Consultores · Tecnologia de Informática</p>
          </div>
        </div>

        <h1 className="mb-2 text-title-sm font-semibold text-gray-800 dark:text-white/90">Iniciar sessão</h1>
        <p className="mb-7 text-sm text-gray-500 dark:text-gray-400">
          Acesso exclusivo à Equipa de Tecnologia de Informática.
        </p>

        <form onSubmit={submit} className="space-y-5" noValidate>
          {params.get("expired") && !error && <Alert tone="warning">A sessão expirou. Inicie sessão novamente.</Alert>}
          {error && <Alert tone="error">{error}</Alert>}

          <Input
            label="Email"
            required
            type="email"
            autoComplete="username"
            placeholder="nome.apelido@mdconsultores.co.mz"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
            autoFocus
          />

          <div className="relative">
            <Input
              label="Palavra-passe"
              required
              type={show ? "text" : "password"}
              autoComplete="current-password"
              placeholder="A sua palavra-passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={fieldErrors.password}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-3 top-[38px] rounded p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400"
              aria-label={show ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
            >
              {show ? <EyeIcon size={20} /> : <EyeOffIcon size={20} />}
            </button>
          </div>

          <Button type="submit" size="md" className="w-full" loading={loading}>
            {loading ? "A entrar…" : "Entrar"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          Esqueceu-se da palavra-passe? Contacte o administrador do sistema.
        </p>
      </div>
    </div>
  );
}

function BrandPanel() {
  const points = [
    "Formulário dinâmico por equipamento",
    "Validação dos dados antes da submissão",
    "Consolidação nacional e exportação para Excel",
  ];
  return (
    <div className="relative hidden h-full overflow-hidden bg-brand-950 lg:flex lg:w-1/2 lg:items-center lg:justify-center">
      <svg className="absolute inset-0 h-full w-full opacity-[0.12]" aria-hidden>
        <defs>
          <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M48 0H0V48" fill="none" stroke="white" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      <div className="absolute -right-24 -top-24 size-96 rounded-full bg-brand-500/30 blur-3xl" aria-hidden />
      <div className="absolute -bottom-32 -left-20 size-96 rounded-full bg-brand-400/20 blur-3xl" aria-hidden />
      <div className="relative max-w-md px-10 text-white">
        <p className="text-sm font-medium uppercase tracking-widest text-brand-300">Inspecção Geral do Parque Informático</p>
        <h2 className="mt-4 text-title-md font-semibold leading-tight">
          Um utilizador, vários equipamentos, um único formulário.
        </h2>
        <ul className="mt-8 space-y-3">
          {points.map((p) => (
            <li key={p} className="flex items-center gap-3 text-brand-100">
              <CheckCircleIcon size={20} className="shrink-0 text-brand-300" />
              {p}
            </li>
          ))}
        </ul>
        <p className="mt-10 text-sm text-brand-300">Maputo · Tete · Nacala · Nampula · Cuamba · Beira</p>
      </div>
    </div>
  );
}

function ThemeFab() {
  const { toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      aria-label="Alternar tema"
      className="fixed bottom-6 right-6 z-50 hidden size-14 items-center justify-center rounded-full bg-brand-500 text-white shadow-theme-lg transition-colors hover:bg-brand-600 sm:flex"
    >
      <SunIcon className="hidden dark:block" />
      <MoonIcon className="dark:hidden" />
    </button>
  );
}

export default function SignInPage() {
  return (
    <div className="relative z-1 bg-white dark:bg-gray-900">
      <div className="relative flex min-h-screen w-full flex-col justify-center lg:h-screen lg:flex-row">
        <Suspense>
          <SignInForm />
        </Suspense>
        <BrandPanel />
        <ThemeFab />
      </div>
    </div>
  );
}
