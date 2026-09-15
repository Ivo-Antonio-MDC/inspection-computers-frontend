import type { Equipment } from "@/types";
import {
  EQUIPMENT_RULES,
  type EquipmentField,
  type EquipmentInput,
  type EquipmentTypeKey,
} from "./equipment-rules";

/** Estado de um equipamento no formulário — valores de texto tal como escritos. */
export interface EquipmentDraft {
  key: string;
  id?: string;
  type: EquipmentTypeKey;
  otherDescription: string;
  brand: string;
  model: string;
  serialNumber: string;
  serialUnavailable: boolean;
  assetTag: string;
  processor: string;
  ramGb: string;
  storageType: string;
  storageCapacityGb: string;
  operatingSystem: string;
  hostname: string;
  ipAddress: string;
  screenSizeInches: string;
  condition: string;
  conditionNotes: string;
  batteryStatus: string;
  problems: string[];
  problemDescription: string;
  observations: string;
  updatesStatus: string;
  esetStatus: string;
  appIssues: string;
  softwareNotes: string;
  softwareVerified: boolean;
  needsMaintenance: boolean;
  needsReplacement: boolean;
}

const NUMERIC: EquipmentField[] = ["ramGb", "storageCapacityGb", "screenSizeInches"];
const BOOLEAN: EquipmentField[] = ["serialUnavailable", "softwareVerified", "needsMaintenance", "needsReplacement"];

let seq = 0;
export const newKey = () => `eq-${Date.now().toString(36)}-${(seq++).toString(36)}`;

export function emptyDraft(type: EquipmentTypeKey): EquipmentDraft {
  return {
    key: newKey(),
    type,
    otherDescription: "",
    brand: "",
    model: "",
    serialNumber: "",
    serialUnavailable: false,
    assetTag: "",
    processor: "",
    ramGb: "",
    storageType: "",
    storageCapacityGb: "",
    operatingSystem: "",
    hostname: "",
    ipAddress: "",
    screenSizeInches: "",
    condition: "",
    conditionNotes: "",
    batteryStatus: "",
    problems: [],
    problemDescription: "",
    observations: "",
    updatesStatus: "",
    esetStatus: "",
    appIssues: "",
    softwareNotes: "",
    softwareVerified: false,
    needsMaintenance: false,
    needsReplacement: false,
  };
}

export function draftFromEquipment(e: Equipment): EquipmentDraft {
  const d = emptyDraft(e.type);
  const src = e as unknown as Record<string, unknown>;
  const out = d as unknown as Record<string, unknown>;
  for (const key of Object.keys(d)) {
    if (key === "key" || key === "type") continue;
    const v = src[key];
    if (key === "problems") out.problems = (v as string[]) ?? [];
    else if (BOOLEAN.includes(key as EquipmentField)) out[key] = Boolean(v);
    else out[key] = v === null || v === undefined ? "" : String(v);
  }
  d.id = e.id;
  d.key = e.id;
  return d;
}

function toNumber(v: string): number | null {
  const t = v.trim().replace(",", ".");
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : (t as unknown as number);
}

/** Converte o estado do formulário no payload da API (apenas campos aplicáveis ao tipo). */
export function toPayload(d: EquipmentDraft): Record<string, unknown> {
  const allowed = new Set<EquipmentField>(EQUIPMENT_RULES[d.type].fields);
  const out: Record<string, unknown> = { type: d.type };
  if (d.id) out.id = d.id;
  const src = d as unknown as Record<string, unknown>;

  for (const field of allowed) {
    const v = src[field];
    if (field === "problems") out.problems = d.problems;
    else if (BOOLEAN.includes(field)) out[field] = Boolean(v);
    else if (NUMERIC.includes(field)) out[field] = toNumber(String(v ?? ""));
    else {
      const s = String(v ?? "").trim();
      out[field] = s.length ? s : null;
    }
  }
  return out;
}

export function toRuleInput(d: EquipmentDraft): EquipmentInput {
  return toPayload(d) as unknown as EquipmentInput;
}

export const BRAND_SUGGESTIONS: Partial<Record<EquipmentTypeKey, string[]>> = {
  laptop: ["HP", "Dell", "Lenovo", "Acer", "Asus", "Apple", "Toshiba", "Microsoft", "Huawei"],
  desktop: ["HP", "Dell", "Lenovo", "Acer", "Asus", "Apple"],
  monitor: ["HP", "Dell", "Lenovo", "Samsung", "LG", "Philips", "AOC", "Acer", "Asus"],
  teclado: ["Logitech", "HP", "Dell", "Lenovo", "Microsoft", "Genius"],
  rato: ["Logitech", "HP", "Dell", "Lenovo", "Microsoft", "Genius"],
  headphones: ["Logitech", "Jabra", "JBL", "Sony", "Poly", "HP"],
  outro: ["HP", "Canon", "Epson", "Brother", "Samsung", "Lenovo"],
};

export const PLACEHOLDERS: Record<EquipmentTypeKey, { brand: string; model: string }> = {
  laptop: { brand: "Ex.: HP", model: "Ex.: EliteBook 840 G8" },
  desktop: { brand: "Ex.: Dell", model: "Ex.: OptiPlex 7090" },
  monitor: { brand: "Ex.: Dell", model: "Ex.: P2419H" },
  teclado: { brand: "Ex.: Logitech", model: "Ex.: K120" },
  rato: { brand: "Ex.: Logitech", model: "Ex.: M185" },
  headphones: { brand: "Ex.: Jabra", model: "Ex.: Evolve 20" },
  outro: { brand: "Ex.: Epson", model: "Ex.: L3250" },
};

export function equipmentTitle(d: Pick<EquipmentDraft, "type" | "brand" | "model" | "otherDescription">, label: string) {
  const name = [d.brand, d.model].map((s) => s?.trim()).filter(Boolean).join(" ");
  const base = d.type === "outro" && d.otherDescription?.trim() ? d.otherDescription.trim() : label;
  return name ? `${base} · ${name}` : base;
}
