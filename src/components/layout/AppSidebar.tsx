"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useSidebar } from "@/context/providers";
import { cn } from "@/lib/format";
import useAuthStore from "@/stores/auth.store";
import type { UserRole } from "@/types";
import {
  ChartIcon,
  ChevronDownIcon,
  ClipboardIcon,
  DotsIcon,
  GridIcon,
  LaptopIcon,
  SettingsIcon,
  UsersIcon,
} from "../icons";

interface NavItem {
  name: string;
  icon: ReactNode;
  path?: string;
  roles?: UserRole[];
  subItems?: { name: string; path: string; roles?: UserRole[] }[];
}

const NAV: { title: string; items: NavItem[] }[] = [
  {
    title: "Inspecção",
    items: [
      { name: "Painel", icon: <GridIcon />, path: "/" },
      {
        name: "Formulários",
        icon: <ClipboardIcon />,
        subItems: [
          { name: "Novo formulário", path: "/registos/novo" },
          { name: "Todos os formulários", path: "/registos" },
        ],
      },
      { name: "Colaboradores", icon: <UsersIcon />, path: "/colaboradores" },
      { name: "Equipamentos", icon: <LaptopIcon />, path: "/equipamentos" },
      { name: "Relatórios", icon: <ChartIcon />, path: "/relatorios" },
    ],
  },
  {
    title: "Gestão",
    items: [
      {
        name: "Administração",
        icon: <SettingsIcon />,
        subItems: [
          { name: "Inspecções", path: "/administracao/inspeccoes" },
          { name: "Localizações", path: "/administracao/localizacoes" },
          { name: "Departamentos", path: "/administracao/departamentos" },
          { name: "Catálogo de equipamentos", path: "/administracao/equipamentos" },
          { name: "Equipa de TI", path: "/administracao/utilizadores", roles: ["admin"] },
          { name: "Auditoria", path: "/administracao/auditoria", roles: ["admin"] },
        ],
      },
    ],
  },
];

function isActivePath(pathname: string, path: string) {
  if (path === "/") return pathname === "/";
  if (path === "/registos") return pathname === "/registos" || (/^\/registos\/[^/]+/.test(pathname) && !pathname.startsWith("/registos/novo"));
  return pathname === path || pathname.startsWith(`${path}/`);
}

export default function AppSidebar() {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, closeMobileSidebar } = useSidebar();
  const pathname = usePathname();
  const role = useAuthStore((s) => s.user?.role);
  const open = isExpanded || isHovered || isMobileOpen;

  const sections = useMemo(
    () =>
      NAV.map((section) => ({
        ...section,
        items: section.items
          .map((item) => {
            if (item.roles && (!role || !item.roles.includes(role))) return null;
            if (!item.subItems) return item;
            const subItems = item.subItems.filter((s) => !s.roles || (role && s.roles.includes(role)));
            return subItems.length ? { ...item, subItems } : null;
          })
          .filter((i): i is NavItem => i !== null),
      })),
    [role],
  );

  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  useEffect(() => {
    const match = sections.flatMap((s) => s.items).find((i) => i.subItems?.some((s) => isActivePath(pathname, s.path)));
    setOpenSubmenu(match?.name ?? null);
    closeMobileSidebar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-50 mt-16 flex h-screen flex-col border-r border-gray-200 bg-white px-5 text-gray-900 transition-all duration-300 ease-in-out lg:mt-0 dark:border-gray-800 dark:bg-gray-900",
        open ? "w-[290px]" : "w-[90px]",
        isMobileOpen ? "translate-x-0" : "-translate-x-full",
        "lg:translate-x-0",
      )}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={cn("flex py-7", !open ? "lg:justify-center" : "justify-start")}>
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white shadow-theme-xs">
            <LaptopIcon size={22} />
          </span>
          {open && (
            <span className="leading-tight">
              <span className="block text-base font-bold tracking-tight text-gray-900 dark:text-white">Inspecção TI</span>
              <span className="block text-xs text-gray-500 dark:text-gray-400">MD Consultores</span>
            </span>
          )}
        </Link>
      </div>

      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
        <nav className="mb-6 flex flex-col gap-6" aria-label="Menu principal">
          {sections.map((section) =>
            section.items.length ? (
              <div key={section.title}>
                <h2 className={cn("mb-4 flex text-xs uppercase leading-5 text-gray-400", !open ? "lg:justify-center" : "justify-start")}>
                  {open ? section.title : <DotsIcon size={20} />}
                </h2>
                <ul className="flex flex-col gap-2">
                  {section.items.map((nav) => {
                    const subOpen = openSubmenu === nav.name;
                    const anySubActive = nav.subItems?.some((s) => isActivePath(pathname, s.path));
                    return (
                      <li key={nav.name}>
                        {nav.subItems ? (
                          <button
                            type="button"
                            onClick={() => setOpenSubmenu(subOpen ? null : nav.name)}
                            aria-expanded={subOpen}
                            className={cn(
                              "menu-item group",
                              subOpen || anySubActive ? "menu-item-active" : "menu-item-inactive",
                              !open ? "lg:justify-center" : "lg:justify-start",
                            )}
                          >
                            <span className={cn("menu-item-icon-size", subOpen || anySubActive ? "menu-item-icon-active" : "menu-item-icon-inactive")}>
                              {nav.icon}
                            </span>
                            {open && <span>{nav.name}</span>}
                            {open && (
                              <ChevronDownIcon
                                size={20}
                                className={cn("ml-auto transition-transform duration-200", subOpen && "rotate-180 text-brand-500")}
                              />
                            )}
                          </button>
                        ) : (
                          nav.path && (
                            <Link
                              href={nav.path}
                              className={cn(
                                "menu-item group",
                                isActivePath(pathname, nav.path) ? "menu-item-active" : "menu-item-inactive",
                                !open && "lg:justify-center",
                              )}
                              title={!open ? nav.name : undefined}
                            >
                              <span className={cn("menu-item-icon-size", isActivePath(pathname, nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive")}>
                                {nav.icon}
                              </span>
                              {open && <span>{nav.name}</span>}
                            </Link>
                          )
                        )}
                        {nav.subItems && open && (
                          <div className={cn("overflow-hidden transition-all duration-300", subOpen ? "max-h-72" : "max-h-0")}>
                            <ul className="ml-9 mt-2 space-y-1">
                              {nav.subItems.map((sub) => (
                                <li key={sub.path}>
                                  <Link
                                    href={sub.path}
                                    className={cn(
                                      "menu-dropdown-item",
                                      isActivePath(pathname, sub.path) ? "menu-dropdown-item-active" : "menu-dropdown-item-inactive",
                                    )}
                                  >
                                    {sub.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null,
          )}
        </nav>
      </div>
    </aside>
  );
}
