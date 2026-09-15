"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Alert, PageHeader } from "@/components/common/ui-kit";
import RecordWizard from "@/components/records/RecordWizard";
import { Spinner } from "@/components/ui/Button";
import { apiErrorMessage } from "@/lib/api";
import { recordCode } from "@/lib/format";
import { RecordService } from "@/lib/services";
import type { InspectionRecord } from "@/types";

export default function EditRecordPage() {
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<InspectionRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    RecordService.get(id).then(setRecord).catch((e) => setError(apiErrorMessage(e)));
  }, [id]);

  return (
    <>
      <PageHeader
        title={record ? `Editar ${recordCode(record.number)}` : "Editar formulário"}
        crumbs={[
          { label: "Formulários", href: "/registos" },
          { label: record ? recordCode(record.number) : "…", href: `/registos/${id}` },
          { label: "Editar" },
        ]}
        description={record ? `${record.collaborator.name} · ${record.inspection?.name}` : undefined}
      />
      {error ? (
        <Alert tone="error">{error}</Alert>
      ) : !record ? (
        <div className="flex justify-center py-20">
          <Spinner className="size-7 text-brand-500" />
        </div>
      ) : (
        <RecordWizard record={record} />
      )}
    </>
  );
}
