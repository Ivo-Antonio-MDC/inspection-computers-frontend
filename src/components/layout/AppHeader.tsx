"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSidebar, useTheme } from "@/context/providers";
import { INSPECTION_STATUS_LABELS, ROLE_LABELS } from "@/lib/constants";
import { cn, initials } from "@/lib/format";
import useAppStore from "@/stores/app.store";
import useAuthStore from "@/stores/auth.store";
import { ChevronDownIcon, ClipboardIcon, LaptopIcon, LockIcon, LogoutIcon, MenuIcon, MoonIcon, SunIcon, XIcon } from "../icons";

function useClickOutside(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", esc);
    };
  }, [onClose]);
  return ref;
}

function InspectionSelector() {
  const { inspections, inspectionId, selectInspection } = useAppStore();
  if (inspections.length === 0) return null;
  return (
    <label className="relative flex w-full min-w-0 max-w-[420px] items-center">
      <span className="sr-only">Inspecção activa</span>
      <ClipboardIcon size={18} className="pointer-events-none absolute left-3 text-brand-500" />
      <select
        value={inspectionId ?? ""}
        onChange={(e) => selectInspection(e.target.value)}
        className="h-11 w-full appearance-none truncate rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-9 text-sm font-medium text-gray-700 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
      >
        {inspections.map((i) => (
          <option key={i.id} value={i.id}>
            {i.name} · {INSPECTION_STATUS_LABELS[i.status]}
          </option>
        ))}
      </select>
      <ChevronDownIcon size={16} className="pointer-events-none absolute right-3 text-gray-500" />
    </label>
  );
}

function ThemeToggle() {
  const { toggleTheme } = useTheme();
  return (
    <button
      aria-label="Alternar tema claro/escuro"
      onClick={toggleTheme}
      className="relative flex size-11 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
    >
      <SunIcon size={20} className="hidden dark:block" />
      <MoonIcon size={20} className="dark:hidden" />
    </button>
  );
}

function UserDropdown() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const ref = useClickOutside(() => setOpen(false));
  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} className="flex items-center text-gray-700 dark:text-gray-400" aria-expanded={open} aria-haspopup="menu">
        <span className="mr-3 flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white dark:bg-brand-600">
          {initials(user.name)}
        </span>
        <span className="mr-1 hidden text-theme-sm font-medium sm:block">{user.name.split(" ")[0]}</span>
        <ChevronDownIcon size={18} className={cn("transition-transform duration-200", open && "rotate-180")} />
      </button>

      {open && (
        <div className="animate-scale-in absolute right-0 mt-4 flex w-[270px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark" role="menu">
          <div className="flex items-center gap-3 px-1">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">{initials(user.name)}</span>
            <div className="min-w-0">
              <span className="block truncate text-theme-sm font-semibold text-gray-800 dark:text-gray-200">{user.name}</span>
              <span className="block truncate text-theme-xs text-gray-500 dark:text-gray-400">{user.email}</span>
              <span className="mt-0.5 block text-theme-xs text-brand-500">{ROLE_LABELS[user.role]}</span>
            </div>
          </div>
          <ul className="flex flex-col gap-1 border-b border-gray-200 pb-3 pt-4 dark:border-gray-800">
            <li>
              <Link
                href="/perfil"
                onClick={() => setOpen(false)}
                className="group flex items-center gap-3 rounded-lg px-3 py-2 text-theme-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
                role="menuitem"
              >
                <LockIcon size={22} className="text-gray-500" />
                Perfil e palavra-passe
              </Link>
            </li>
          </ul>
          <button
            onClick={async () => {
              setOpen(false);
              await logout();
              router.replace("/signin");
            }}
            className="mt-3 flex items-center gap-3 rounded-lg px-3 py-2 text-theme-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
            role="menuitem"
          >
            <LogoutIcon size={22} className="text-gray-500" />
            Terminar sessão
          </button>
        </div>
      )}
    </div>
  );
}

export default function AppHeader() {
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();

  return (
    <header className="sticky top-0 z-999 flex w-full border-gray-200 bg-white lg:border-b dark:border-gray-800 dark:bg-gray-900">
      <div className="flex grow flex-col items-center justify-between lg:flex-row lg:px-6">
        <div className="flex w-full items-center justify-between gap-3 border-b border-gray-200 px-3 py-3 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4 dark:border-gray-800">
          <button
            className="z-99999 flex size-10 items-center justify-center rounded-lg text-gray-500 lg:size-11 lg:border lg:border-gray-200 dark:text-gray-400 dark:lg:border-gray-800"
            onClick={() => (window.innerWidth >= 1024 ? toggleSidebar() : toggleMobileSidebar())}
            aria-label="Mostrar/ocultar menu"
          >
            {isMobileOpen ? <XIcon /> : <MenuIcon />}
          </button>

          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <span className="flex size-9 items-center justify-center rounded-lg bg-brand-500 text-white">
              <LaptopIcon size={20} />
            </span>
            <span className="text-base font-bold text-gray-900 dark:text-white">Inspecção TI</span>
          </Link>

          <div className="hidden min-w-0 flex-1 lg:block">
            <InspectionSelector />
          </div>

          <div className="lg:hidden">
            <ThemeToggle />
          </div>
        </div>

        <div className="flex w-full items-center justify-between gap-3 px-4 py-3 shadow-theme-md lg:w-auto lg:justify-end lg:px-0 lg:py-0 lg:shadow-none">
          <div className="min-w-0 flex-1 lg:hidden">
            <InspectionSelector />
          </div>
          <div className="hidden lg:block">
            <ThemeToggle />
          </div>
          <UserDropdown />
        </div>
      </div>
    </header>
  );
}
