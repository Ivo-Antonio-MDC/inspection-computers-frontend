"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/Button";
import AppHeader from "@/components/layout/AppHeader";
import AppSidebar from "@/components/layout/AppSidebar";
import { SidebarProvider, useSidebar } from "@/context/providers";
import { apiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/format";
import useAppStore from "@/stores/app.store";
import useAuthStore from "@/stores/auth.store";

function Shell({ children }: { children: React.ReactNode }) {
  const { isExpanded, isHovered, isMobileOpen, toggleMobileSidebar } = useSidebar();
  return (
    <div className="min-h-screen xl:flex">
      <div>
        <AppSidebar />
        {isMobileOpen && (
          <div className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden" onClick={toggleMobileSidebar} aria-hidden />
        )}
      </div>
      <div className={cn("min-w-0 flex-1 transition-all duration-300 ease-in-out", isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]")}>
        <AppHeader />
        <main className="mx-auto max-w-(--breakpoint-2xl) p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

function FullScreenLoader({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
      <Spinner className="size-7 text-brand-500" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

/** Rotas protegidas: acesso restrito à Equipa de TI (TR §14). */
export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isInitializing, init } = useAuthStore();
  const { loaded, load } = useAppStore();
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    void init();
  }, [init]);

  useEffect(() => {
    if (isInitializing) return;
    if (!user) {
      router.replace(`/signin?next=${encodeURIComponent(pathname)}`);
    } else if (user.mustChangePassword && pathname !== "/perfil") {
      router.replace("/perfil?obrigatorio=1");
    }
  }, [isInitializing, user, pathname, router]);

  useEffect(() => {
    if (user && !user.mustChangePassword && !loaded) {
      load().catch((e) => setLoadError(apiErrorMessage(e)));
    }
  }, [user, loaded, load]);

  if (isInitializing || !user) return <FullScreenLoader label="A verificar a sessão…" />;
  if (user.mustChangePassword && pathname !== "/perfil") return <FullScreenLoader label="A redireccionar…" />;

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <div>
          <p className="font-semibold text-gray-800 dark:text-white">Não foi possível carregar os dados de referência</p>
          <p className="mt-1 text-sm text-gray-500">{loadError}</p>
          <button className="mt-4 text-sm font-medium text-brand-500" onClick={() => location.reload()}>
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Shell>{!loaded && !user.mustChangePassword ? <FullScreenLoader label="A carregar…" /> : children}</Shell>
    </SidebarProvider>
  );
}
