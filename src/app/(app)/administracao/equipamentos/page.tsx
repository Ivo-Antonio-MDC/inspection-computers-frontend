"use client";

import LookupAdmin from "@/components/admin/LookupAdmin";
import { LookupService } from "@/lib/services";

export default function EquipmentCatalogAdminPage() {
  return (
    <LookupAdmin
      title="Catálogo de equipamentos"
      singular="Equipamento"
      withIcon
      description="Equipamentos adicionais (impressora, tablet, projector…) que aparecem como opção nos formulários, além dos tipos padrão. Os técnicos podem adicionar novos durante a recolha."
      deleteHint="Os formulários que já registaram este equipamento não são afectados."
      list={LookupService.equipmentCategories}
      create={LookupService.createEquipmentCategory}
      update={LookupService.updateEquipmentCategory}
      remove={LookupService.deleteEquipmentCategory}
    />
  );
}
