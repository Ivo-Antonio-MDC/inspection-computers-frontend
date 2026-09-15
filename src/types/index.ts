import type { EquipmentTypeKey } from "@/lib/equipment-rules";

export type UserRole = "admin" | "tecnico";
export type Modality = "presencial" | "remota";
export type InspectionStatus = "planeada" | "em_curso" | "concluida";
export type RecordStatus = "rascunho" | "submetido" | "validado" | "requer_correccao";
export type Condition = "bom" | "razoavel" | "mau" | "nao_funciona";
export type StorageType = "hdd" | "ssd" | "nvme" | "emmc" | "hibrido";
export type BatteryStatus = "bom" | "razoavel" | "fraca" | "nao_segura_carga" | "sem_bateria";
export type ProblemType =
  | "lento" | "bloqueia" | "reinicia" | "arranque" | "bateria"
  | "teclado" | "ecra" | "conectividade" | "aplicacoes" | "outro";
export type UpdatesStatus = "actualizado" | "pendente" | "desactualizado" | "desconhecido";
export type EsetStatus = "activo" | "desactualizado" | "expirado" | "nao_instalado" | "desconhecido";

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  mustChangePassword: boolean;
  lastLoginAt?: string | null;
}

export interface TeamUser extends AuthUser {
  isActive: boolean;
  createdAt: string;
}

export interface Location {
  id: string;
  name: string;
  modality: Modality;
  isActive: boolean;
}

export interface Department {
  id: string;
  name: string;
  isActive: boolean;
}

export interface Inspection {
  id: string;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  status: InspectionStatus;
  recordCount?: number;
  createdAt: string;
}

export interface RecordRef {
  id: string;
  number: number;
  status: RecordStatus;
  updatedAt?: string;
  incompleteCount?: number;
}

export interface Collaborator {
  id: string;
  name: string;
  position: string;
  departmentId: string;
  locationId: string;
  department: Department;
  location: Location;
  createdAt: string;
  record?: RecordRef | null;
  records?: (InspectionRecord & { inspection: Inspection })[];
}

export interface Equipment {
  id: string;
  recordId: string;
  type: EquipmentTypeKey;
  position: number;
  otherDescription: string | null;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  serialUnavailable: boolean;
  assetTag: string | null;
  processor: string | null;
  ramGb: number | null;
  storageType: StorageType | null;
  storageCapacityGb: number | null;
  operatingSystem: string | null;
  hostname: string | null;
  ipAddress: string | null;
  screenSizeInches: number | null;
  condition: Condition | null;
  conditionNotes: string | null;
  batteryStatus: BatteryStatus | null;
  problems: ProblemType[];
  problemDescription: string | null;
  observations: string | null;
  updatesStatus: UpdatesStatus | null;
  esetStatus: EsetStatus | null;
  appIssues: string | null;
  softwareNotes: string | null;
  softwareVerified: boolean;
  needsMaintenance: boolean;
  needsReplacement: boolean;
  hasProblems: boolean;
  isComplete: boolean;
  updatedAt: string;
}

export interface EquipmentRow extends Equipment {
  record: RecordRef & {
    inspectionId: string;
    collaborator: Pick<Collaborator, "id" | "name" | "position" | "department" | "location">;
    createdBy: { id: string; name: string } | null;
  };
}

export interface InspectionRecord {
  id: string;
  number: number;
  inspectionId: string;
  collaboratorId: string;
  status: RecordStatus;
  generalNotes: string | null;
  incompleteCount: number;
  submittedAt: string | null;
  validatedAt: string | null;
  reviewComment: string | null;
  createdAt: string;
  updatedAt: string;
  collaborator: Collaborator;
  inspection?: Inspection;
  createdBy: { id: string; name: string } | null;
  updatedBy?: { id: string; name: string } | null;
  validatedBy?: { id: string; name: string } | null;
  equipment: Equipment[];
}

export interface AuditEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  summary: string | null;
  changes: Record<string, unknown> | null;
  ip: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string } | null;
}

export interface ReportSummary {
  inspection: Inspection;
  collaborators: { total: number; withRecord: number; completed: number };
  equipment: {
    total: number;
    withProblems: number;
    missingSerial: number;
    incomplete: number;
    needsMaintenance: number;
    needsReplacement: number;
    computers: number;
  };
  recordsByStatus: { status: RecordStatus; total: number }[];
  byLocation: {
    id: string; name: string; modality: Modality; collaborators: number; records: number;
    completed: number; equipment: number; withProblems: number;
  }[];
  byDepartment: {
    id: string; name: string; collaborators: number; records: number;
    completed: number; equipment: number; withProblems: number;
  }[];
  byType: {
    type: EquipmentTypeKey; total: number; bom: number; razoavel: number; mau: number;
    nao_funciona: number; withProblems: number; needsMaintenance: number; needsReplacement: number;
  }[];
  byCondition: { condition: Condition | "sem_estado"; total: number }[];
  byProblem: { problem: ProblemType; total: number }[];
  software: {
    eset: { status: EsetStatus | "sem_registo"; total: number }[];
    updates: { status: UpdatesStatus | "sem_registo"; total: number }[];
  };
  byTechnician: { id: string; name: string; records: number }[];
  byCollaborator: {
    id: string; name: string; position: string; department: string; location: string;
    recordId: string; number: number; status: RecordStatus; equipment: number;
    withProblems: number; types: EquipmentTypeKey[];
  }[];
  timeline: { day: string; total: number }[];
  recent: {
    id: string; number: number; status: RecordStatus; updatedAt: string; collaborator: string;
    location: string; technician: string | null; equipment: number;
  }[];
}

export type { EquipmentTypeKey };
