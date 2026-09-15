import type {
  BatteryStatus,
  Condition,
  EsetStatus,
  InspectionStatus,
  Modality,
  ProblemType,
  RecordStatus,
  StorageType,
  UpdatesStatus,
  UserRole,
} from "@/types";
import type { EquipmentTypeKey } from "./equipment-rules";

export interface Option<T extends string = string> {
  value: T;
  label: string;
  hint?: string;
}

export const EQUIPMENT_TYPE_LABELS: Record<EquipmentTypeKey, string> = {
  laptop: "Laptop",
  desktop: "Desktop",
  monitor: "Monitor",
  teclado: "Teclado",
  rato: "Rato",
  headphones: "Headphones",
  outro: "Outro",
};

export const EQUIPMENT_TYPE_HINTS: Record<EquipmentTypeKey, string> = {
  laptop: "Portátil com bateria",
  desktop: "Computador de secretária",
  monitor: "Ecrã externo",
  teclado: "Teclado externo",
  rato: "Rato externo",
  headphones: "Auscultadores / headset",
  outro: "Impressora, scanner, tablet, projector…",
};

/** TR §9 — com as descrições padronizadas */
export const CONDITION_OPTIONS: Option<Condition>[] = [
  { value: "bom", label: "Bom", hint: "Em boas condições de utilização" },
  { value: "razoavel", label: "Razoável", hint: "Funcional, com desgaste ou pequenas limitações" },
  { value: "mau", label: "Mau", hint: "Danos ou problemas que afectam a utilização" },
  { value: "nao_funciona", label: "Não funciona", hint: "Sem funcionamento ou indisponível" },
];

export const STORAGE_OPTIONS: Option<StorageType>[] = [
  { value: "ssd", label: "SSD (SATA)" },
  { value: "nvme", label: "SSD NVMe" },
  { value: "hdd", label: "HDD" },
  { value: "hibrido", label: "Híbrido (SSD + HDD)" },
  { value: "emmc", label: "eMMC" },
];

export const BATTERY_OPTIONS: Option<BatteryStatus>[] = [
  { value: "bom", label: "Boa" },
  { value: "razoavel", label: "Razoável" },
  { value: "fraca", label: "Fraca" },
  { value: "nao_segura_carga", label: "Não segura carga" },
  { value: "sem_bateria", label: "Sem bateria" },
];

/** TR §10 */
export const PROBLEM_OPTIONS: Option<ProblemType>[] = [
  { value: "lento", label: "Computador lento" },
  { value: "bloqueia", label: "Bloqueia/congela" },
  { value: "reinicia", label: "Reinicia sozinho" },
  { value: "arranque", label: "Problemas no arranque" },
  { value: "bateria", label: "Problemas de bateria" },
  { value: "teclado", label: "Problemas de teclado" },
  { value: "ecra", label: "Problemas de ecrã" },
  { value: "conectividade", label: "Problemas de conectividade" },
  { value: "aplicacoes", label: "Problemas com aplicações" },
  { value: "outro", label: "Outro" },
];

export const UPDATES_OPTIONS: Option<UpdatesStatus>[] = [
  { value: "actualizado", label: "Actualizado" },
  { value: "pendente", label: "Actualizações pendentes" },
  { value: "desactualizado", label: "Desactualizado" },
  { value: "desconhecido", label: "Desconhecido" },
];

export const ESET_OPTIONS: Option<EsetStatus>[] = [
  { value: "activo", label: "Instalado e activo" },
  { value: "desactualizado", label: "Instalado, desactualizado" },
  { value: "expirado", label: "Licença expirada" },
  { value: "nao_instalado", label: "Não instalado" },
  { value: "desconhecido", label: "Desconhecido" },
];

export const OS_SUGGESTIONS = [
  "Windows 11 Pro",
  "Windows 11 Home",
  "Windows 10 Pro",
  "Windows 10 Home",
  "Windows 7",
  "macOS",
  "Ubuntu Linux",
];

export const RECORD_STATUS_LABELS: Record<RecordStatus, string> = {
  rascunho: "Rascunho",
  submetido: "Submetido",
  validado: "Validado",
  requer_correccao: "Requer correcção",
};

export const INSPECTION_STATUS_LABELS: Record<InspectionStatus, string> = {
  planeada: "Planeada",
  em_curso: "Em curso",
  concluida: "Concluída",
};

export const MODALITY_LABELS: Record<Modality, string> = {
  presencial: "Presencial",
  remota: "Remota",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  tecnico: "Técnico de recolha",
};

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  login: "Início de sessão",
  logout: "Fim de sessão",
  create: "Criação",
  update: "Alteração",
  delete: "Eliminação",
  submit: "Submissão",
  validate: "Validação",
  request_correction: "Pedido de correcção",
  export: "Exportação",
  password_change: "Palavra-passe",
};

export function labelOf<T extends string>(options: Option<T>[], value: T | null | undefined): string {
  if (!value) return "—";
  return options.find((o) => o.value === value)?.label ?? value;
}
