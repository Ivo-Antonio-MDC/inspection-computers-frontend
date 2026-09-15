"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/common/ui-kit";
import RecordWizard from "@/components/records/RecordWizard";
import { useCurrentInspection } from "@/stores/app.store";

function NewRecord() {
  const inspection = useCurrentInspection();
  const collaboratorId = useSearchParams().get("colaborador");
  return (
    <>
      <PageHeader
        title="Novo formulário de inspecção"
        crumbs={[{ label: "Formulários", href: "/registos" }, { label: "Novo" }]}
        description={inspection ? `Inspecção: ${inspection.name}` : undefined}
      />
      <RecordWizard initialCollaboratorId={collaboratorId} />
    </>
  );
}

export default function NewRecordPage() {
  return (
    <Suspense>
      <NewRecord />
    </Suspense>
  );
}
