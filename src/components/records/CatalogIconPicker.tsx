"use client";

import { cn } from "@/lib/format";
import { CATALOG_ICON_KEYS, CATALOG_ICONS, type CatalogIconKey } from "./equipment-icons";

/** Grelha de ícones para os equipamentos do catálogo. */
export default function CatalogIconPicker({ value, onChange }: { value: CatalogIconKey; onChange: (key: CatalogIconKey) => void }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
        Ícone <span className="font-normal text-gray-500 dark:text-gray-400">— {CATALOG_ICONS[value].label}</span>
      </p>
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-8" role="radiogroup" aria-label="Ícone">
        {CATALOG_ICON_KEYS.map((key) => {
          const { Icon, label } = CATALOG_ICONS[key];
          const selected = key === value;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={label}
              title={label}
              onClick={() => onChange(key)}
              className={cn(
                "flex aspect-square items-center justify-center rounded-lg border transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/20",
                selected
                  ? "border-brand-500 bg-brand-500 text-white"
                  : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5",
              )}
            >
              <Icon size={20} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
