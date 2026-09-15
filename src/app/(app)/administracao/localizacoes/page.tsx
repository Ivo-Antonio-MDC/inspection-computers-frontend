"use client";

import LookupAdmin from "@/components/admin/LookupAdmin";
import { LookupService } from "@/lib/services";

export default function LocationsAdminPage() {
  return (
    <LookupAdmin
      title="Localizações"
      singular="Localização"
      description="Localidades abrangidas pela inspecção e respectiva modalidade (presencial ou remota)."
      withModality
      list={LookupService.locations}
      create={LookupService.createLocation}
      update={LookupService.updateLocation}
      remove={LookupService.deleteLocation}
    />
  );
}
