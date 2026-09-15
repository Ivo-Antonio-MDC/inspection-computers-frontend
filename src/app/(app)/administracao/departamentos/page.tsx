"use client";

import LookupAdmin from "@/components/admin/LookupAdmin";
import { LookupService } from "@/lib/services";

export default function DepartmentsAdminPage() {
  return (
    <LookupAdmin
      title="Departamentos"
      singular="Departamento"
      description="Departamentos da MD Consultores usados na identificação dos colaboradores."
      list={LookupService.departments}
      create={LookupService.createDepartment}
      update={LookupService.updateDepartment}
      remove={LookupService.deleteDepartment}
    />
  );
}
