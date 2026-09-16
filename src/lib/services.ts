import type { RecordValidation } from "./equipment-rules";
import api, { bareApi, cleanParams, downloadFile } from "./api";
import type {
  AuditEntry,
  AuthUser,
  Collaborator,
  Department,
  EquipmentCategory,
  EquipmentRow,
  Inspection,
  InspectionRecord,
  Location,
  Paginated,
  RecordRef,
  ReportSummary,
  TeamUser,
} from "@/types";

type Query = Record<string, string | number | boolean | undefined | null>;
const q = (params?: Query) => ({ params: params ? cleanParams(params) : undefined });

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export const AuthService = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>("/auth/login", { email, password }).then((r) => r.data),
  refresh: () => bareApi.post<{ data: AuthResponse }>("/auth/refresh").then((r) => r.data.data),
  logout: () => bareApi.post("/auth/logout"),
  me: () => api.get<AuthUser>("/auth/me").then((r) => r.data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch<AuthResponse>("/auth/password", { currentPassword, newPassword }).then((r) => r.data),
};

export const LookupService = {
  locations: (includeInactive = false) =>
    api.get<Location[]>("/locations", q({ includeInactive })).then((r) => r.data),
  departments: (includeInactive = false) =>
    api.get<Department[]>("/departments", q({ includeInactive })).then((r) => r.data),
  createLocation: (data: Partial<Location>) => api.post<Location>("/locations", data).then((r) => r.data),
  updateLocation: (id: string, data: Partial<Location>) =>
    api.patch<Location>(`/locations/${id}`, data).then((r) => r.data),
  deleteLocation: (id: string) => api.delete(`/locations/${id}`),
  createDepartment: (data: Partial<Department>) =>
    api.post<Department>("/departments", data).then((r) => r.data),
  updateDepartment: (id: string, data: Partial<Department>) =>
    api.patch<Department>(`/departments/${id}`, data).then((r) => r.data),
  deleteDepartment: (id: string) => api.delete(`/departments/${id}`),
  equipmentCategories: (includeInactive = false) =>
    api.get<EquipmentCategory[]>("/equipment-categories", q({ includeInactive })).then((r) => r.data),
  createEquipmentCategory: (data: Partial<EquipmentCategory>) =>
    api.post<EquipmentCategory>("/equipment-categories", data).then((r) => r.data),
  updateEquipmentCategory: (id: string, data: Partial<EquipmentCategory>) =>
    api.patch<EquipmentCategory>(`/equipment-categories/${id}`, data).then((r) => r.data),
  deleteEquipmentCategory: (id: string) => api.delete(`/equipment-categories/${id}`),
};

export const InspectionService = {
  list: () => api.get<Inspection[]>("/inspections").then((r) => r.data),
  current: () => api.get<Inspection | null>("/inspections/current").then((r) => r.data),
  create: (data: Partial<Inspection>) => api.post<Inspection>("/inspections", data).then((r) => r.data),
  update: (id: string, data: Partial<Inspection>) =>
    api.patch<Inspection>(`/inspections/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/inspections/${id}`),
};

export interface CollaboratorInput {
  name: string;
  departmentId: string;
  locationId: string;
  position: string;
}

export const CollaboratorService = {
  list: (params: Query) => api.get<Paginated<Collaborator>>("/collaborators", q(params)).then((r) => r.data),
  get: (id: string) => api.get<Collaborator>(`/collaborators/${id}`).then((r) => r.data),
  create: (data: CollaboratorInput) => api.post<Collaborator>("/collaborators", data).then((r) => r.data),
  update: (id: string, data: Partial<CollaboratorInput>) =>
    api.patch<Collaborator>(`/collaborators/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/collaborators/${id}`),
};

export interface RecordPayload {
  equipment: Record<string, unknown>[];
  generalNotes?: string | null;
  submit: boolean;
}

export const RecordService = {
  list: (params: Query) => api.get<Paginated<InspectionRecord>>("/records", q(params)).then((r) => r.data),
  get: (id: string) => api.get<InspectionRecord>(`/records/${id}`).then((r) => r.data),
  lookup: (inspectionId: string, collaboratorId: string) =>
    api.get<RecordRef | null>("/records/lookup", q({ inspectionId, collaboratorId })).then((r) => r.data),
  validate: (data: { inspectionId: string; recordId?: string; equipment: Record<string, unknown>[] }) =>
    api
      .post<RecordValidation & { missingCount: number }>("/records/validate", data)
      .then((r) => r.data),
  create: (data: RecordPayload & { inspectionId: string; collaboratorId: string }) =>
    api.post<InspectionRecord>("/records", data).then((r) => r.data),
  update: (id: string, data: RecordPayload) => api.put<InspectionRecord>(`/records/${id}`, data).then((r) => r.data),
  review: (id: string, decision: "validar" | "corrigir", comment?: string) =>
    api.post<InspectionRecord>(`/records/${id}/review`, { decision, comment }).then((r) => r.data),
  remove: (id: string) => api.delete(`/records/${id}`),
};

export const EquipmentService = {
  list: (params: Query) => api.get<Paginated<EquipmentRow>>("/equipment", q(params)).then((r) => r.data),
};

export const ReportService = {
  summary: (inspectionId: string) =>
    api.get<ReportSummary>("/reports/summary", q({ inspectionId })).then((r) => r.data),
  export: (params: Query & { inspectionId: string; format: "xlsx" | "csv" }) =>
    downloadFile("/reports/export", cleanParams(params), `inspeccao.${params.format}`),
};

export const UserService = {
  list: () => api.get<TeamUser[]>("/users").then((r) => r.data),
  create: (data: { name: string; email: string; role: string; password: string }) =>
    api.post<TeamUser>("/users", data).then((r) => r.data),
  update: (id: string, data: Partial<Pick<TeamUser, "name" | "email" | "role" | "isActive">>) =>
    api.patch<TeamUser>(`/users/${id}`, data).then((r) => r.data),
  resetPassword: (id: string, password: string) => api.post(`/users/${id}/reset-password`, { password }),
  remove: (id: string) => api.delete(`/users/${id}`),
};

export const AuditService = {
  list: (params: Query) => api.get<Paginated<AuditEntry>>("/audit", q(params)).then((r) => r.data),
};
