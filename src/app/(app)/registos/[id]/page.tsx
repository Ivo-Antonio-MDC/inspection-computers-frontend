"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Alert, Card, PageHeader } from "@/components/common/ui-kit";
import { TextArea } from "@/components/form/fields";
import { BuildingIcon, CheckCircleIcon, EditIcon, HistoryIcon, MapPinIcon, TrashIcon, UserIcon } from "@/components/icons";
import EquipmentDetails from "@/components/records/EquipmentDetails";
import Badge, { RecordStatusBadge } from "@/components/ui/Badge";
import Button, { ButtonLink, Spinner } from "@/components/ui/Button";
import Modal, { ConfirmDialog } from "@/components/ui/Modal";
import { apiErrorMessage } from "@/lib/api";
import { AUDIT_ACTION_LABELS, MODALITY_LABELS } from "@/lib/constants";
import { formatDateTime, recordCode } from "@/lib/format";
import { AuditService, RecordService } from "@/lib/services";
import useAuthStore from "@/stores/auth.store";
import type { AuditEntry, InspectionRecord } from "@/types";

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <dt className="text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="text-right font-medium text-gray-800 dark:text-white/90">{value}</dd>
    </div>
  );
}

export default function RecordDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const isAdmin = useAuthStore((s) => s.user?.role === "admin");
  const [record, setRecord] = useState<InspectionRecord | null>(null);
  const [history, setHistory] = useState<AuditEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<{ decision: "validar" | "corrigir"; comment: string } | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      setRecord(await RecordService.get(id));
      if (isAdmin) setHistory((await AuditService.list({ entity: "record", entityId: id, limit: 50 })).items);
    } catch (e) {
      setError(apiErrorMessage(e));
    }
  }, [id, isAdmin]);

  useEffect(() => {
    void load();
  }, [load]);

  const submitReview = async () => {
    if (!review || !record) return;
    if (review.decision === "corrigir" && !review.comment.trim()) {
      toast.error("Indique o que deve ser corrigido");
      return;
    }
    setReviewing(true);
    try {
      await RecordService.review(record.id, review.decision, review.comment.trim() || undefined);
      toast.success(review.decision === "validar" ? "Formulário validado" : "Pedido de correcção enviado");
      setReview(null);
      await load();
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setReviewing(false);
    }
  };

  const remove = async () => {
    if (!record) return;
    setDeleting(true);
    try {
      await RecordService.remove(record.id);
      toast.success("Formulário eliminado");
      router.replace("/registos");
    } catch (e) {
      toast.error(apiErrorMessage(e));
      setDeleting(false);
    }
  };

  if (error) return <Alert tone="error">{error}</Alert>;
  if (!record) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="size-7 text-brand-500" />
      </div>
    );
  }

  const c = record.collaborator;
  const inspectionClosed = record.inspection?.status === "concluida";
  const canEdit = isAdmin || (record.status !== "validado" && !inspectionClosed);
  const problems = record.equipment.filter((e) => e.hasProblems).length;

  return (
    <>
      <PageHeader
        title={`Formulário ${recordCode(record.number)}`}
        crumbs={[{ label: "Formulários", href: "/registos" }, { label: recordCode(record.number) }]}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <RecordStatusBadge status={record.status} /> {c.name} · {record.equipment.length} equipamento(s)
          </span>
        }
        actions={
          <>
            <Button variant="outline" className="no-print" onClick={() => window.print()}>
              Imprimir
            </Button>
            {canEdit && (
              <ButtonLink href={`/registos/${record.id}/editar`} variant="outline" startIcon={<EditIcon />}>
                Editar
              </ButtonLink>
            )}
            {isAdmin && record.status === "submetido" && (
              <>
                <Button variant="outline" onClick={() => setReview({ decision: "corrigir", comment: "" })}>
                  Pedir correcção
                </Button>
                <Button variant="success" startIcon={<CheckCircleIcon />} onClick={() => setReview({ decision: "validar", comment: "" })}>
                  Validar
                </Button>
              </>
            )}
            {isAdmin && record.status === "validado" && (
              <Button variant="outline" onClick={() => setReview({ decision: "corrigir", comment: "" })}>
                Reabrir para correcção
              </Button>
            )}
          </>
        }
      />

      <div className="space-y-4">
        {record.status === "rascunho" && (
          <Alert tone="info" title="Rascunho">
            {record.incompleteCount > 0
              ? `${record.incompleteCount} equipamento(s) com campos obrigatórios por preencher. Complete e submeta o formulário.`
              : "Os dados estão completos — falta submeter o formulário."}
          </Alert>
        )}
        {record.status === "requer_correccao" && (
          <Alert tone="warning" title="Correcção pedida">
            {record.reviewComment}
          </Alert>
        )}
        {record.status === "submetido" && isAdmin && (
          <Alert tone="info">Formulário submetido — aguarda validação pela equipa de TI.</Alert>
        )}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          {record.equipment.length === 0 ? (
            <Card>
              <p className="text-sm text-gray-500">Sem equipamentos registados.</p>
            </Card>
          ) : (
            record.equipment.map((e, i) => <EquipmentDetails key={e.id} equipment={e} index={i} />)
          )}
        </div>

        <div className="space-y-6">
          <Card title="Colaborador">
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-white/90">
                <UserIcon size={18} className="text-gray-400" /> {c.name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{c.position}</p>
              <p className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <BuildingIcon size={16} /> {c.department.name}
              </p>
              <p className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <MapPinIcon size={16} /> {c.location.name} <Badge color="light">{MODALITY_LABELS[c.location.modality]}</Badge>
              </p>
              <Link href={`/colaboradores?search=${encodeURIComponent(c.name)}`} className="inline-block pt-1 text-sm font-medium text-brand-500 hover:text-brand-600">
                Ver colaborador
              </Link>
            </div>
          </Card>

          <Card title="Registo">
            <dl className="divide-y divide-gray-100 dark:divide-gray-800">
              <Meta label="Inspecção" value={record.inspection?.name} />
              <Meta label="Equipamentos" value={record.equipment.length} />
              <Meta label="Com problemas" value={problems} />
              <Meta label="Registado por" value={record.createdBy?.name ?? "—"} />
              <Meta label="Criado em" value={formatDateTime(record.createdAt)} />
              <Meta label="Última alteração" value={`${formatDateTime(record.updatedAt)}${record.updatedBy ? ` · ${record.updatedBy.name}` : ""}`} />
              <Meta label="Submetido em" value={formatDateTime(record.submittedAt)} />
              {record.validatedAt && <Meta label="Validado" value={`${formatDateTime(record.validatedAt)} · ${record.validatedBy?.name ?? ""}`} />}
            </dl>
            {record.status === "validado" && record.reviewComment && (
              <p className="mt-3 rounded-lg bg-success-50 p-3 text-sm text-success-700 dark:bg-success-500/10 dark:text-success-400">{record.reviewComment}</p>
            )}
          </Card>

          {record.generalNotes && (
            <Card title="Observações gerais">
              <p className="whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">{record.generalNotes}</p>
            </Card>
          )}

          {isAdmin && (
            <Card title="Histórico de alterações">
              {history.length === 0 ? (
                <p className="text-sm text-gray-500">Sem registos.</p>
              ) : (
                <ol className="relative space-y-4 border-l border-gray-200 pl-5 dark:border-gray-800">
                  {history.map((h) => (
                    <li key={h.id} className="relative">
                      <span className="absolute -left-[26px] top-1 flex size-3 rounded-full border-2 border-white bg-brand-500 dark:border-gray-900" />
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90">{AUDIT_ACTION_LABELS[h.action] ?? h.action}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {h.user?.name ?? "Sistema"} · {formatDateTime(h.createdAt)}
                      </p>
                      {typeof h.changes?.comentario === "string" && (
                        <p className="mt-1 text-xs italic text-gray-600 dark:text-gray-400">“{h.changes.comentario}”</p>
                      )}
                    </li>
                  ))}
                </ol>
              )}
              <Link href={`/administracao/auditoria?entityId=${record.id}`} className="mt-4 flex items-center gap-1.5 text-sm font-medium text-brand-500">
                <HistoryIcon size={16} /> Ver detalhes na auditoria
              </Link>
            </Card>
          )}

          {isAdmin && (
            <Button variant="ghost" className="w-full text-error-600 hover:bg-error-50 dark:text-error-400" startIcon={<TrashIcon />} onClick={() => setConfirmDelete(true)}>
              Eliminar formulário
            </Button>
          )}
        </div>
      </div>

      <Modal
        open={!!review}
        onClose={() => setReview(null)}
        title={review?.decision === "validar" ? "Validar formulário" : "Pedir correcção"}
        description={`${recordCode(record.number)} · ${c.name}`}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setReview(null)}>
              Cancelar
            </Button>
            <Button variant={review?.decision === "validar" ? "success" : "primary"} loading={reviewing} onClick={submitReview}>
              {review?.decision === "validar" ? "Confirmar validação" : "Enviar pedido"}
            </Button>
          </>
        }
      >
        {review && (
          <TextArea
            label={review.decision === "validar" ? "Comentário (opcional)" : "O que deve ser corrigido?"}
            required={review.decision === "corrigir"}
            value={review.comment}
            onChange={(e) => setReview({ ...review, comment: e.target.value })}
            rows={4}
            autoFocus
            maxLength={2000}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={confirmDelete}
        title="Eliminar formulário"
        message={
          <>
            O formulário <strong>{recordCode(record.number)}</strong> e os seus {record.equipment.length} equipamentos serão eliminados
            definitivamente. A operação fica registada na auditoria.
          </>
        }
        confirmLabel="Eliminar"
        danger
        loading={deleting}
        onConfirm={remove}
        onClose={() => setConfirmDelete(false)}
      />
    </>
  );
}
