"use client";

import type { EquipmentTypeKey } from "@/lib/equipment-rules";
import useAppStore from "@/stores/app.store";
import { DesktopIcon, HeadphonesIcon, KeyboardIcon, LaptopIcon, MonitorIcon, MouseIcon } from "../icons";
import { CATALOG_ICONS, isCatalogIcon, suggestIcon, type CatalogIconKey } from "./equipment-icons";

const ICONS = {
  laptop: LaptopIcon,
  desktop: DesktopIcon,
  monitor: MonitorIcon,
  teclado: KeyboardIcon,
  rato: MouseIcon,
  headphones: HeadphonesIcon,
};

/** Ícone de um equipamento do catálogo: o escolhido ou, na falta dele, o sugerido pelo nome. */
export function catalogIconKey(icon: string | null | undefined, name: string | null | undefined): CatalogIconKey {
  return isCatalogIcon(icon) ? icon : suggestIcon(name);
}

/**
 * Ícone do tipo de equipamento. Para "outro", usa o ícone do catálogo cujo nome
 * corresponde à descrição (ou `icon`, quando indicado explicitamente).
 */
export default function EquipmentTypeIcon({
  type,
  description,
  icon,
  size = 20,
  className,
}: {
  type: EquipmentTypeKey;
  description?: string | null;
  icon?: string | null;
  size?: number;
  className?: string;
}) {
  const categories = useAppStore((s) => s.equipmentCategories);
  if (type !== "outro") {
    const Icon = ICONS[type];
    return <Icon size={size} className={className} />;
  }
  let key: CatalogIconKey;
  if (isCatalogIcon(icon)) key = icon;
  else {
    const name = description?.trim().toLowerCase();
    const category = name ? categories.find((c) => c.name.toLowerCase() === name) : undefined;
    key = catalogIconKey(category?.icon, description);
  }
  const Icon = CATALOG_ICONS[key].Icon;
  return <Icon size={size} className={className} />;
}
