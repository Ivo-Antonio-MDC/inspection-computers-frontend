"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import CollaboratorFormModal from "@/components/collaborators/CollaboratorFormModal";
import { Alert, Card, EmptyState } from "@/components/common/ui-kit";
import { SearchInput, TextArea } from "@/components/form/fields";
import {
  AlertIcon,
  ArrowLeftIcon,
  BuildingIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronRightIcon,
  EditIcon,
  MapPinIcon,
  UserIcon,
  UsersIcon,
} from "@/components/icons";
import Badge, { ConditionBadge, RecordStatusBadge } from "@/components/ui/Badge";
import Button, { Spinner } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/Modal";
import { useSidebar } from "@/context/providers";
import { apiErrorDetails, apiErrorMessage } from "@/lib/api";
import { EQUIPMENT_TYPE_HINTS, EQUIPMENT_TYPE_LABELS, MODALITY_LABELS } from "@/lib/constants";
import {
  EQUIPMENT_TYPE_ORDER,
  FIELD_LABELS,
  validateRecord,
  type EquipmentField,
  type EquipmentTypeKey,
  type RecordValidation,
} from "@/lib/equipment-rules";
import { cn, recordCode } from "@/lib/format";
import { draftFromEquipment, emptyDraft, equipmentTitle, toPayload, toRuleInput, type EquipmentDraft } from "@/lib/record-form";
import { CollaboratorService, RecordService } from "@/lib/services";
import { useDebounce } from "@/lib/use-debounce";
import useAppStore, { useCurrentInspection } from "@/stores/app.store";
import useAuthStore from "@/stores/auth.store";
import type { Collaborator, InspectionRecord, RecordRef } from "@/types";
import EquipmentFormSection from "./EquipmentFormSection";
import EquipmentTypeIcon from "./EquipmentTypeIcon";

const STEPS = [
  { title: "Identificação", desc: "Dados do colaborador" },
  { title: "Equipamentos", desc: "Equipamentos em posse" },
  { title: "Recolha de dados", desc: "Características, estado e problemas" },
  { title: "Validação e submissão", desc: "Verificação final" },
];

const MAX_PER_TYPE = 10;

type ServerValidation = RecordValidation & { missingCount?: number };

function hasUserData(d: EquipmentDraft) {
  const blank = emptyDraft(d.type);
  return Object.entries(d).some(([k, v]) => k !== "key" && k !== "id" && k !== "type" && JSON.stringify(v) !== JSON.stringify((blank as unknown as Record<string, unknown>)[k]));
}

function sortDrafts(list: EquipmentDraft[]) {
  return [...list].sort((a, b) => EQUIPMENT_TYPE_ORDER.indexOf(a.type) - EQUIPMENT_TYPE_ORDER.indexOf(b.type));
}

export default function RecordWizard({ record, initialCollaboratorId }: { record?: InspectionRecord; initialCollaboratorId?: string | null }) {
  const router = useRouter();
  const isEdit = !!record;
  const user = useAuthStore((s) => s.user);
  const currentInspection = useCurrentInspection();
  const inspectionsLoaded = useAppStore((s) => s.loaded);
  const inspection = record?.inspection ?? currentInspection;

  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(isEdit ? 3 : 0);
  const [collaborator, setCollaborator] = useState<Collaborator | null>(record?.collaborator ?? null);
  const [existing, setExisting] = useState<RecordRef | null>(null);
  const [drafts, setDrafts] = useState<EquipmentDraft[]>(() => (record ? record.equipment.map(draftFromEquipment) : []));
  const [generalNotes, setGeneralNotes] = useState(record?.generalNotes ?? "");
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set(record && record.equipment.length > 2 ? record.equipment.map((e) => e.id) : []));
  const [showErrors, setShowErrors] = useState(isEdit && record?.status !== "rascunho");
  const [serverValidation, setServerValidation] = useState<ServerValidation | null>(null);
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState<"draft" | "submit" | null>(null);
  const [dirty, setDirty] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<{ keys: string[]; label: string } | null>(null);
  const [collabModal, setCollabModal] = useState<{ open: boolean; edit?: Collaborator | null; name?: string }>({ open: false });
  const [saveError, setSaveError] = useState<{ message: string; recordId?: string } | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const { isExpanded, isHovered } = useSidebar();

  const locked = !!inspection && inspection.status === "concluida" && user?.role !== "admin";
  const validatedLocked = record?.status === "validado" && user?.role !== "admin";
  const draftAllowed = !record || record.status === "rascunho" || record.status === "requer_correccao";

  // ── Aviso de alterações por guardar ────────────────────────────────────────
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // ── Validação local (mesmas regras do backend) ─────────────────────────────
  const localValidation = useMemo(() => validateRecord(drafts.map(toRuleInput), "submit"), [drafts]);

  const merged: ServerValidation = useMemo(() => {
    if (!serverValidation || serverValidation.items.length !== drafts.length) return localValidation;
    return {
      ...localValidation,
      formErrors: [...new Set([...localValidation.formErrors, ...serverValidation.formErrors])],
      items: localValidation.items.map((it, i) => ({
        ...it,
        errors: { ...serverValidation.items[i]?.errors, ...it.errors },
      })),
    };
  }, [localValidation, serverValidation, drafts.length]);

  const totalErrors = merged.items.reduce((n, i) => n + Object.keys(i.errors).length, 0) + merged.formErrors.length;
  const isValid = totalErrors === 0;

  const goTo = useCallback((s: number) => {
    setStep(s);
    setMaxStep((m) => Math.max(m, s));
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, []);

  // ── Equipamentos ───────────────────────────────────────────────────────────
  const counts = useMemo(() => {
    const c = Object.fromEntries(EQUIPMENT_TYPE_ORDER.map((t) => [t, 0])) as Record<EquipmentTypeKey, number>;
    drafts.forEach((d) => c[d.type]++);
    return c;
  }, [drafts]);

  const addType = (type: EquipmentTypeKey) => {
    if (counts[type] >= MAX_PER_TYPE) return;
    setDrafts((ds) => sortDrafts([...ds, emptyDraft(type)]));
    setServerValidation(null);
    setDirty(true);
  };

  const requestRemove = (keys: string[]) => {
    const targets = drafts.filter((d) => keys.includes(d.key));
    if (targets.length === 0) return;
    if (targets.some(hasUserData)) {
      const label = targets.length === 1 ? equipmentTitle(targets[0], EQUIPMENT_TYPE_LABELS[targets[0].type]) : `${targets.length} equipamentos`;
      setPendingRemoval({ keys, label });
    } else {
      removeNow(keys);
    }
  };

  const removeNow = (keys: string[]) => {
    setDrafts((ds) => ds.filter((d) => !keys.includes(d.key)));
    setServerValidation(null);
    setDirty(true);
    setPendingRemoval(null);
  };

  const onChange = useCallback((key: string, patch: Partial<EquipmentDraft>) => {
    setDrafts((ds) => ds.map((d) => (d.key === key ? { ...d, ...patch } : d)));
    setServerValidation(null);
    setDirty(true);
  }, []);

  const onToggle = useCallback((key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const onRemove = useCallback((key: string) => requestRemove([key]), [drafts]); // eslint-disable-line react-hooks/exhaustive-deps

  const focusItem = (key: string) => {
    setShowErrors(true);
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
    setStep(2);
    setTimeout(() => {
      const el = document.getElementById(`equipamento-${key}`);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
      (el?.querySelector("[aria-invalid='true']") as HTMLElement | null)?.focus({ preventScroll: true });
    }, 80);
  };

  // ── Identificação ──────────────────────────────────────────────────────────
  const selectCollaborator = async (c: Collaborator) => {
    setSaveError(null);
    if (c.record) {
      setExisting(c.record);
      setCollaborator(c);
      return;
    }
    setCollaborator(c);
    setExisting(null);
    setDirty(true);
    if (inspection) {
      const found = await RecordService.lookup(inspection.id, c.id).catch(() => null);
      setExisting(found);
    }
  };

  const inspectionId = inspection?.id;
  useEffect(() => {
    if (record || !initialCollaboratorId || !inspectionId) return;
    CollaboratorService.get(initialCollaboratorId)
      .then((c) => selectCollaborator({ ...c, record: undefined }))
      .catch(() => toast.error("Colaborador não encontrado"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCollaboratorId, inspectionId, record]);

  // ── Validação no servidor (inclui duplicados na base de dados) ─────────────
  const runServerValidation = useCallback(async () => {
    if (!inspection) return;
    setValidating(true);
    try {
      const result = await RecordService.validate({
        inspectionId: inspection.id,
        recordId: record?.id,
        equipment: drafts.map(toPayload),
      });
      setServerValidation(result);
    } catch (e) {
      const details = apiErrorDetails<unknown>(e);
      toast.error(details ? "Existem valores com formato inválido" : apiErrorMessage(e));
    } finally {
      setValidating(false);
    }
  }, [inspection, drafts, record?.id]);

  useEffect(() => {
    if (step === 3 && !serverValidation && drafts.length > 0) void runServerValidation();
  }, [step, serverValidation, drafts.length, runServerValidation]);

  // ── Gravação ───────────────────────────────────────────────────────────────
  const save = async (submit: boolean) => {
    if (!inspection || !collaborator) return;
    if (submit && !isValid) {
      setShowErrors(true);
      toast.error("Corrija os campos assinalados antes de submeter");
      return;
    }
    setSaving(submit ? "submit" : "draft");
    setSaveError(null);
    try {
      const payload = { equipment: drafts.map(toPayload), generalNotes: generalNotes.trim() || null, submit };
      const saved = record
        ? await RecordService.update(record.id, payload)
        : await RecordService.create({ ...payload, inspectionId: inspection.id, collaboratorId: collaborator.id });
      setDirty(false);
      toast.success(
        submit ? `Formulário ${recordCode(saved.number)} submetido` : `Rascunho ${recordCode(saved.number)} guardado`,
      );
      router.push(`/registos/${saved.id}`);
    } catch (e) {
      const details = apiErrorDetails<ServerValidation & { recordId?: string }>(e);
      if (details && "items" in details) {
        setServerValidation(details);
        setShowErrors(true);
        goTo(3);
      }
      setSaveError({ message: apiErrorMessage(e), recordId: details?.recordId });
      toast.error(apiErrorMessage(e));
    } finally {
      setSaving(null);
    }
  };

  // ── Navegação ──────────────────────────────────────────────────────────────
  const next = () => {
    if (step === 0) {
      if (!collaborator) return toast.error("Seleccione ou registe o colaborador");
      if (existing && !isEdit) return toast.error("Este colaborador já tem formulário nesta inspecção");
    }
    if (step === 1 && drafts.length === 0) return toast.error("Seleccione pelo menos um equipamento");
    if (step === 2) setShowErrors(true);
    goTo(step + 1);
  };

  if (!inspectionsLoaded && !record) return null;

  if (!inspection) {
    return (
      <Card>
        <EmptyState title="Nenhuma inspecção disponível" description="Peça ao administrador para criar uma inspecção antes de registar formulários." />
      </Card>
    );
  }

  if (locked || validatedLocked) {
    return (
      <Alert tone="warning" title="Formulário só de leitura">
        {locked
          ? "Esta inspecção está concluída. Apenas o administrador pode alterar registos."
          : "Este formulário já foi validado. Apenas o administrador o pode alterar."}
      </Alert>
    );
  }

  const canSaveDraft = !!collaborator && (!existing || isEdit) && draftAllowed;

  return (
    <div ref={topRef} className="scroll-mt-24 space-y-6 pb-28">
      {/* Stepper */}
      <ol className="grid grid-cols-4 gap-2 rounded-2xl border border-gray-200 bg-white p-3 sm:p-4 dark:border-gray-800 dark:bg-white/[0.03]">
        {STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          const reachable = i <= maxStep && !(i > 0 && !collaborator) && !(i > 1 && drafts.length === 0);
          return (
            <li key={s.title} className="min-w-0">
              <button
                type="button"
                disabled={!reachable}
                onClick={() => goTo(i)}
                className={cn("flex w-full items-center gap-3 rounded-xl p-1.5 text-left transition sm:p-2", reachable && !active && "hover:bg-gray-50 dark:hover:bg-white/5", !reachable && "cursor-not-allowed")}
                aria-current={active ? "step" : undefined}
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                    active && "bg-brand-500 text-white",
                    done && "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400",
                    !active && !done && "bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400",
                  )}
                >
                  {done ? <CheckIcon size={16} strokeWidth={2.5} /> : i + 1}
                </span>
                <span className="hidden min-w-0 md:block">
                  <span className={cn("block truncate text-sm font-medium", active ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-400")}>{s.title}</span>
                  <span className="block truncate text-xs text-gray-400">{s.desc}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="-mt-3 text-sm text-gray-500 md:hidden">
        Passo {step + 1} de {STEPS.length}: <span className="font-medium text-gray-700 dark:text-gray-300">{STEPS[step].title}</span>
      </p>

      {record?.status === "requer_correccao" && record.reviewComment && (
        <Alert tone="warning" title="Correcção pedida pelo administrador">
          {record.reviewComment}
        </Alert>
      )}
      {record?.status === "validado" && (
        <Alert tone="info">Este formulário está validado. Ao guardar alterações voltará ao estado “Submetido” e terá de ser validado novamente.</Alert>
      )}

      {/* Passo 1 — Identificação */}
      {step === 0 && (
        <IdentificationStep
          inspectionId={inspection.id}
          collaborator={collaborator}
          existing={isEdit ? null : existing}
          isEdit={isEdit}
          onSelect={selectCollaborator}
          onClear={() => {
            setCollaborator(null);
            setExisting(null);
          }}
          onCreate={(name) => setCollabModal({ open: true, name })}
          onEdit={(c) => setCollabModal({ open: true, edit: c })}
        />
      )}

      {/* Passo 2 — Equipamentos em posse */}
      {step === 1 && (
        <Card title="Equipamentos em posse do colaborador" desc="Seleccione os equipamentos. O formulário apresentará apenas as secções correspondentes.">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {EQUIPMENT_TYPE_ORDER.map((type) => {
              const count = counts[type];
              const selected = count > 0;
              return (
                <div
                  key={type}
                  className={cn(
                    "relative flex flex-col rounded-xl border p-4 transition",
                    selected ? "border-brand-500 bg-brand-25 ring-1 ring-brand-500 dark:bg-brand-500/10" : "border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700",
                  )}
                >
                  <button
                    type="button"
                    className="flex items-start gap-3 text-left"
                    aria-pressed={selected}
                    onClick={() => (selected ? requestRemove(drafts.filter((d) => d.type === type).map((d) => d.key)) : addType(type))}
                  >
                    <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", selected ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300")}>
                      <EquipmentTypeIcon type={type} size={22} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-gray-800 dark:text-white/90">{EQUIPMENT_TYPE_LABELS[type]}</span>
                      <span className="block text-xs text-gray-500 dark:text-gray-400">{EQUIPMENT_TYPE_HINTS[type]}</span>
                    </span>
                    <span className={cn("flex size-5 shrink-0 items-center justify-center rounded-md border", selected ? "border-brand-500 bg-brand-500 text-white" : "border-gray-300 dark:border-gray-700")}>
                      {selected && <CheckIcon size={14} strokeWidth={3} />}
                    </span>
                  </button>
                  {selected && (
                    <div className="mt-4 flex items-center justify-between border-t border-brand-100 pt-3 dark:border-brand-500/20">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Quantidade</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => requestRemove([drafts.filter((d) => d.type === type).at(-1)!.key])}
                          className="flex size-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-lg leading-none text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                          aria-label={`Remover um ${EQUIPMENT_TYPE_LABELS[type]}`}
                        >
                          −
                        </button>
                        <span className="w-6 text-center font-semibold tabular-nums text-gray-800 dark:text-white" aria-live="polite">
                          {count}
                        </span>
                        <button
                          type="button"
                          disabled={count >= MAX_PER_TYPE}
                          onClick={() => addType(type)}
                          className="flex size-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-lg leading-none text-gray-700 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                          aria-label={`Adicionar outro ${EQUIPMENT_TYPE_LABELS[type]}`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {drafts.length > 0 && (
            <p className="mt-5 text-sm text-gray-600 dark:text-gray-400">
              <span className="font-semibold text-gray-800 dark:text-white">{drafts.length}</span>{" "}
              {drafts.length === 1 ? "equipamento seleccionado" : "equipamentos seleccionados"}:{" "}
              {EQUIPMENT_TYPE_ORDER.filter((t) => counts[t] > 0)
                .map((t) => `${counts[t]}× ${EQUIPMENT_TYPE_LABELS[t]}`)
                .join(" · ")}
            </p>
          )}
        </Card>
      )}

      {/* Passo 3 — Formulário dinâmico / recolha */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {drafts.map((d, i) => {
                const errs = Object.keys(merged.items[i]?.errors ?? {}).length;
                const ok = (merged.items[i]?.missing.length ?? 0) === 0 && errs === 0;
                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => focusItem(d.key)}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"
                  >
                    <EquipmentTypeIcon type={d.type} size={16} />
                    {i + 1}. {EQUIPMENT_TYPE_LABELS[d.type]}
                    <span className={cn("size-2 rounded-full", ok ? "bg-success-500" : showErrors && errs ? "bg-error-500" : "bg-gray-300 dark:bg-gray-600")} aria-label={ok ? "completo" : "incompleto"} />
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="xs" onClick={() => setCollapsed(new Set())}>Expandir tudo</Button>
              <Button variant="ghost" size="xs" onClick={() => setCollapsed(new Set(drafts.map((d) => d.key)))}>Recolher tudo</Button>
            </div>
          </div>

          {drafts.map((d, i) => {
            const sameType = drafts.filter((x) => x.type === d.type);
            return (
              <EquipmentFormSection
                key={d.key}
                draft={d}
                index={i}
                typeIndex={sameType.indexOf(d)}
                typeCount={sameType.length}
                validation={merged.items[i]}
                showErrors={showErrors}
                collapsed={collapsed.has(d.key)}
                onToggle={onToggle}
                onChange={onChange}
                onRemove={onRemove}
              />
            );
          })}

          <button
            type="button"
            onClick={() => goTo(1)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-300 p-4 text-sm font-medium text-gray-600 hover:border-brand-400 hover:text-brand-600 dark:border-gray-700 dark:text-gray-400"
          >
            + Adicionar ou remover equipamentos
          </button>
        </div>
      )}

      {/* Passo 4 — Validação e submissão */}
      {step === 3 && collaborator && (
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <Card
              title="Verificação da completude e coerência"
              desc="Os campos obrigatórios, formatos e duplicados são verificados antes do registo."
              actions={
                <Button variant="outline" size="xs" onClick={() => void runServerValidation()} loading={validating}>
                  Verificar novamente
                </Button>
              }
            >
              {validating && !serverValidation ? (
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <Spinner className="text-brand-500" /> A validar os dados…
                </div>
              ) : isValid ? (
                <Alert tone="success" title="Dados completos e coerentes">
                  O formulário está pronto para ser submetido.
                </Alert>
              ) : (
                <div className="space-y-4">
                  <Alert tone="error" title={`${totalErrors} ${totalErrors === 1 ? "problema impede" : "problemas impedem"} a submissão`}>
                    Pode guardar como rascunho e completar mais tarde.
                  </Alert>
                  {merged.formErrors.map((m) => (
                    <p key={m} className="flex items-center gap-2 text-sm text-error-600 dark:text-error-400">
                      <AlertIcon size={16} /> {m}
                    </p>
                  ))}
                  <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
                    {drafts.map((d, i) => {
                      const errs = Object.entries(merged.items[i]?.errors ?? {}) as [EquipmentField, string][];
                      if (errs.length === 0) return null;
                      return (
                        <li key={d.key} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
                          <div className="flex min-w-0 flex-1 gap-3">
                            <EquipmentTypeIcon type={d.type} className="mt-0.5 shrink-0 text-gray-500" />
                            <div className="min-w-0">
                              <p className="font-medium text-gray-800 dark:text-white/90">
                                {i + 1}. {equipmentTitle(d, EQUIPMENT_TYPE_LABELS[d.type])}
                              </p>
                              <ul className="mt-1 space-y-0.5 text-sm text-gray-600 dark:text-gray-400">
                                {errs.map(([f, m]) => (
                                  <li key={f}>
                                    <span className="text-error-600 dark:text-error-400">•</span> {m.startsWith(FIELD_LABELS[f]) ? m : `${FIELD_LABELS[f]}: ${m}`}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          <Button variant="outline" size="xs" startIcon={<EditIcon />} onClick={() => focusItem(d.key)}>
                            Corrigir
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </Card>

            <Card title="Resumo dos equipamentos" bodyClassName="p-0 sm:p-0">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-gray-50 text-theme-xs text-gray-500 dark:bg-white/[0.02] dark:text-gray-400">
                    <tr>
                      <th className="px-5 py-3 font-medium">Equipamento</th>
                      <th className="px-5 py-3 font-medium">Nº de série</th>
                      <th className="px-5 py-3 font-medium">Estado</th>
                      <th className="px-5 py-3 font-medium">Verificação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drafts.map((d, i) => {
                      const errs = Object.keys(merged.items[i]?.errors ?? {}).length;
                      return (
                        <tr key={d.key} className="border-t border-gray-100 dark:border-gray-800">
                          <td className="px-5 py-3">
                            <span className="flex items-center gap-2 font-medium text-gray-800 dark:text-white/90">
                              <EquipmentTypeIcon type={d.type} size={18} className="text-gray-500" />
                              {equipmentTitle(d, EQUIPMENT_TYPE_LABELS[d.type])}
                            </span>
                          </td>
                          <td className="px-5 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">
                            {d.serialUnavailable ? <Badge color="warning">Sem nº de série</Badge> : d.serialNumber || "—"}
                          </td>
                          <td className="px-5 py-3">
                            <ConditionBadge condition={(d.condition || null) as never} />
                          </td>
                          <td className="px-5 py-3">
                            {errs === 0 ? (
                              <span className="flex items-center gap-1.5 text-success-600 dark:text-success-500">
                                <CheckCircleIcon size={16} /> OK
                              </span>
                            ) : (
                              <button type="button" onClick={() => focusItem(d.key)} className="flex items-center gap-1.5 text-error-600 hover:underline dark:text-error-400">
                                <AlertIcon size={16} /> {errs} a corrigir
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <CollaboratorSummary collaborator={collaborator} />
            <Card title="Observações gerais">
              <TextArea
                value={generalNotes}
                onChange={(e) => {
                  setGeneralNotes(e.target.value);
                  setDirty(true);
                }}
                placeholder="Contexto da inspecção, entrevista, verificação remota…"
                rows={4}
                maxLength={4000}
              />
            </Card>
            <Card title="Submissão">
              <div className="space-y-3">
                {saveError && (
                  <Alert tone="error">
                    {saveError.message}
                    {saveError.recordId && (
                      <Link href={`/registos/${saveError.recordId}`} className="mt-1 block font-semibold underline">
                        Abrir o formulário existente
                      </Link>
                    )}
                  </Alert>
                )}
                <Button className="w-full" size="md" variant="success" disabled={!isValid || validating} loading={saving === "submit"} onClick={() => save(true)}>
                  {record && record.status !== "rascunho" && record.status !== "requer_correccao" ? "Guardar alterações" : "Submeter formulário"}
                </Button>
                {canSaveDraft && (
                  <Button className="w-full" variant="outline" loading={saving === "draft"} onClick={() => save(false)}>
                    Guardar como rascunho
                  </Button>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Inspecção: <span className="font-medium">{inspection.name}</span>
                </p>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Barra de navegação fixa */}
      <div
        className={cn(
          "no-print fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur transition-all duration-300 dark:border-gray-800 dark:bg-gray-900/95",
          isExpanded || isHovered ? "lg:left-[290px]" : "lg:left-[90px]",
        )}
      >
        <div className="mx-auto flex max-w-(--breakpoint-2xl) items-center justify-between gap-3 px-4 py-3 md:px-6">
          <Button variant="outline" startIcon={<ArrowLeftIcon />} onClick={() => (step === 0 ? router.back() : goTo(step - 1))}>
            {step === 0 ? "Cancelar" : "Anterior"}
          </Button>
          <div className="flex items-center gap-2">
            {step < 3 && canSaveDraft && (
              <Button variant="ghost" className="hidden sm:inline-flex" loading={saving === "draft"} onClick={() => save(false)}>
                Guardar rascunho
              </Button>
            )}
            {step < 3 && (
              <Button endIcon={<ChevronRightIcon />} onClick={next}>
                {step === 2 ? "Validar dados" : "Seguinte"}
              </Button>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!pendingRemoval}
        title="Remover equipamento"
        message={
          <>
            Os dados já preenchidos de <strong>{pendingRemoval?.label}</strong> serão descartados.
          </>
        }
        confirmLabel="Remover"
        danger
        onConfirm={() => pendingRemoval && removeNow(pendingRemoval.keys)}
        onClose={() => setPendingRemoval(null)}
      />

      <CollaboratorFormModal
        open={collabModal.open}
        collaborator={collabModal.edit}
        initialName={collabModal.name}
        onClose={() => setCollabModal({ open: false })}
        onSaved={(c) => {
          setCollabModal({ open: false });
          void selectCollaborator(c);
        }}
      />
    </div>
  );
}

// ── Sub-componentes ──────────────────────────────────────────────────────────

function CollaboratorSummary({ collaborator, action }: { collaborator: Collaborator; action?: React.ReactNode }) {
  return (
    <Card title="Colaborador" actions={action}>
      <div className="flex items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
          <UserIcon />
        </span>
        <div className="min-w-0 space-y-1.5">
          <p className="text-base font-semibold text-gray-800 dark:text-white/90">{collaborator.name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{collaborator.position}</p>
          <p className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
            <BuildingIcon size={16} /> {collaborator.department?.name}
          </p>
          <p className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
            <MapPinIcon size={16} /> {collaborator.location?.name}
            {collaborator.location && <Badge color="light">{MODALITY_LABELS[collaborator.location.modality]}</Badge>}
          </p>
        </div>
      </div>
    </Card>
  );
}

function IdentificationStep({
  inspectionId,
  collaborator,
  existing,
  isEdit,
  onSelect,
  onClear,
  onCreate,
  onEdit,
}: {
  inspectionId: string;
  collaborator: Collaborator | null;
  existing: RecordRef | null;
  isEdit: boolean;
  onSelect: (c: Collaborator) => void;
  onClear: () => void;
  onCreate: (name: string) => void;
  onEdit: (c: Collaborator) => void;
}) {
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search, 250);
  const [results, setResults] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (collaborator && !existing) return;
    let cancelled = false;
    setLoading(true);
    CollaboratorService.list({ search: debounced, inspectionId, limit: 8 })
      .then((r) => !cancelled && setResults(r.items))
      .catch(() => !cancelled && setResults([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [debounced, inspectionId, collaborator, existing]);

  if (collaborator) {
    return (
      <div className="space-y-4">
        <CollaboratorSummary
          collaborator={collaborator}
          action={
            <>
              <Button variant="outline" size="xs" startIcon={<EditIcon />} onClick={() => onEdit(collaborator)}>
                Editar dados
              </Button>
              {!isEdit && (
                <Button variant="ghost" size="xs" onClick={onClear}>
                  Alterar colaborador
                </Button>
              )}
            </>
          }
        />
        {existing && (
          <Alert tone="warning" title="Formulário já existente">
            <span className="flex flex-wrap items-center gap-1.5">
              {collaborator.name} já tem o formulário {recordCode(existing.number)} nesta inspecção
              <RecordStatusBadge status={existing.status} />
            </span>
            <span className="block">Para evitar duplicados, edite o formulário existente.</span>
            <Link href={`/registos/${existing.id}`} className="mt-2 block font-semibold underline">
              Abrir {recordCode(existing.number)}
            </Link>
          </Alert>
        )}
      </div>
    );
  }

  return (
    <Card title="Identificação do utilizador" desc="Pesquise o colaborador. Se ainda não estiver registado, registe-o com nome, departamento, localização e cargo.">
      <div className="flex flex-col gap-3 sm:flex-row">
        <SearchInput value={search} onChange={setSearch} placeholder="Pesquisar por nome ou cargo…" className="flex-1" />
        <Button variant="outline" startIcon={<UsersIcon />} onClick={() => onCreate(search)}>
          Registar novo colaborador
        </Button>
      </div>
      <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
        {loading && results.length === 0 ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton h-10" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <EmptyState
            icon={<UsersIcon />}
            title={search ? "Nenhum colaborador encontrado" : "Ainda não existem colaboradores registados"}
            description="Registe o colaborador para continuar."
            action={<Button onClick={() => onCreate(search)}>Registar colaborador</Button>}
          />
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {results.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => onSelect(c)} className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-white/[0.03]">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300">
                    <UserIcon size={20} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-gray-800 dark:text-white/90">{c.name}</span>
                    <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                      {c.position} · {c.department.name} · {c.location.name}
                    </span>
                  </span>
                  {c.record ? (
                    <span className="flex flex-col items-end gap-1">
                      <RecordStatusBadge status={c.record.status} />
                      <span className="text-xs text-gray-400">{recordCode(c.record.number)}</span>
                    </span>
                  ) : (
                    <Badge color="primary">Sem formulário</Badge>
                  )}
                  <ChevronRightIcon size={18} className="text-gray-400" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
