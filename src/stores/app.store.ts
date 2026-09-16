"use client";

import { create } from "zustand";
import { InspectionService, LookupService } from "@/lib/services";
import type { Department, EquipmentCategory, Inspection, Location } from "@/types";

const STORAGE_KEY = "inspeccao:selected";

interface AppState {
  inspections: Inspection[];
  inspectionId: string | null;
  locations: Location[];
  departments: Department[];
  equipmentCategories: EquipmentCategory[];
  loaded: boolean;
  load: (force?: boolean) => Promise<void>;
  selectInspection: (id: string) => void;
  reloadLookups: () => Promise<void>;
  addEquipmentCategory: (category: EquipmentCategory) => void;
}

/** Dados de referência partilhados: inspecção seleccionada, localizações e departamentos. */
const useAppStore = create<AppState>()((set, get) => ({
  inspections: [],
  inspectionId: null,
  locations: [],
  departments: [],
  equipmentCategories: [],
  loaded: false,

  load: async (force = false) => {
    if (get().loaded && !force) return;
    const [inspections, current, locations, departments, equipmentCategories] = await Promise.all([
      InspectionService.list(),
      InspectionService.current(),
      LookupService.locations(),
      LookupService.departments(),
      LookupService.equipmentCategories().catch(() => []),
    ]);
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* armazenamento indisponível */
    }
    const selected =
      (stored && inspections.some((i) => i.id === stored) ? stored : null) ?? current?.id ?? inspections[0]?.id ?? null;
    set({ inspections, inspectionId: selected, locations, departments, equipmentCategories, loaded: true });
  },

  selectInspection: (id) => {
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* ignora */
    }
    set({ inspectionId: id });
  },

  reloadLookups: async () => {
    const [inspections, locations, departments, equipmentCategories] = await Promise.all([
      InspectionService.list(),
      LookupService.locations(),
      LookupService.departments(),
      LookupService.equipmentCategories(),
    ]);
    set({ inspections, locations, departments, equipmentCategories });
  },

  addEquipmentCategory: (category) =>
    set((s) => ({ equipmentCategories: [...s.equipmentCategories, category].sort((a, b) => a.name.localeCompare(b.name, "pt")) })),
}));

export function useCurrentInspection() {
  return useAppStore((s) => s.inspections.find((i) => i.id === s.inspectionId) ?? null);
}

export default useAppStore;
