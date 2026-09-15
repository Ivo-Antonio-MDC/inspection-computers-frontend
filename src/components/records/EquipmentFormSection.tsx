"use client";

import { memo, useId, type ReactNode } from "react";
import {
  BATTERY_OPTIONS,
  CONDITION_OPTIONS,
  EQUIPMENT_TYPE_LABELS,
  ESET_OPTIONS,
  OS_SUGGESTIONS,
  PROBLEM_OPTIONS,
  STORAGE_OPTIONS,
  UPDATES_OPTIONS,
} from "@/lib/constants";
import {
  CONDITIONS_REQUIRING_NOTES,
  EQUIPMENT_RULES,
  FIELD_LABELS,
  requiredFieldsFor,
  type ConditionKey,
  type EquipmentField,
  type ItemValidation,
} from "@/lib/equipment-rules";
import { cn } from "@/lib/format";
import { BRAND_SUGGESTIONS, PLACEHOLDERS, equipmentTitle, toRuleInput, type EquipmentDraft } from "@/lib/record-form";
import { Checkbox, ChoiceGroup, FieldMessage, Input, Select, TextArea } from "../form/fields";
import { AlertIcon, CheckCircleIcon, ChevronDownIcon, TrashIcon } from "../icons";
import EquipmentTypeIcon from "./EquipmentTypeIcon";

interface Props {
  draft: EquipmentDraft;
  index: number;
  typeIndex: number;
  typeCount: number;
  validation?: ItemValidation;
  showErrors: boolean;
  collapsed: boolean;
  onToggle: (key: string) => void;
  onChange: (key: string, patch: Partial<EquipmentDraft>) => void;
  onRemove: (key: string) => void;
}

function Group({ title, children, description }: { title: string; description?: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="mb-3 w-full border-b border-gray-100 pb-2 dark:border-gray-800">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{title}</span>
        {description && <span className="mt-0.5 block text-xs text-gray-400">{description}</span>}
      </legend>
      {children}
    </fieldset>
  );
}

function EquipmentFormSection({
  draft,
  index,
  typeIndex,
  typeCount,
  validation,
  showErrors,
  collapsed,
  onToggle,
  onChange,
  onRemove,
}: Props) {
  const rules = EQUIPMENT_RULES[draft.type];
  const has = (f: EquipmentField) => rules.fields.includes(f);
  const required = new Set(requiredFieldsFor(toRuleInput(draft)));
  const err = (f: EquipmentField) => (showErrors ? validation?.errors[f] : undefined);
  const set = (patch: Partial<EquipmentDraft>) => onChange(draft.key, patch);
  const listId = useId();

  const text = (field: keyof EquipmentDraft & EquipmentField, extra?: Partial<React.ComponentProps<typeof Input>>) => (
    <Input
      label={FIELD_LABELS[field]}
      required={required.has(field)}
      value={draft[field] as string}
      onChange={(e) => set({ [field]: e.target.value } as Partial<EquipmentDraft>)}
      error={err(field)}
      {...extra}
    />
  );

  const label = EQUIPMENT_TYPE_LABELS[draft.type];
  const title = equipmentTitle(draft, typeCount > 1 ? `${label} ${typeIndex + 1}` : label);
  const missing = validation?.missing.length ?? 0;
  const errorCount = validation ? Object.keys(validation.errors).length : 0;
  const isComputer = draft.type === "laptop" || draft.type === "desktop";
  const showConditionNotes = !!draft.condition && draft.condition !== "bom";

  return (
    <section id={`equipamento-${draft.key}`} className="scroll-mt-28 overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <header className="flex items-center gap-3 px-4 py-3 sm:px-5">
        <button type="button" onClick={() => onToggle(draft.key)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-expanded={!collapsed}>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
            <EquipmentTypeIcon type={draft.type} />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-semibold text-gray-800 dark:text-white/90">
              <span className="mr-1 text-gray-400">{index + 1}.</span> {title}
            </span>
            <span className="mt-0.5 flex items-center gap-1.5 text-xs">
              {showErrors && errorCount > 0 ? (
                <span className="flex items-center gap-1 text-error-600 dark:text-error-400">
                  <AlertIcon size={14} /> {errorCount} {errorCount === 1 ? "campo a corrigir" : "campos a corrigir"}
                </span>
              ) : missing > 0 ? (
                <span className="text-gray-500 dark:text-gray-400">
                  {missing} {missing === 1 ? "campo obrigatório por preencher" : "campos obrigatórios por preencher"}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-success-600 dark:text-success-500">
                  <CheckCircleIcon size={14} /> Campos obrigatórios preenchidos
                </span>
              )}
            </span>
          </span>
          <ChevronDownIcon size={20} className={cn("ml-auto shrink-0 text-gray-400 transition-transform", !collapsed && "rotate-180")} />
        </button>
        <button
          type="button"
          onClick={() => onRemove(draft.key)}
          className="rounded-lg p-2 text-gray-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/10"
          aria-label={`Remover ${title}`}
          title="Remover equipamento"
        >
          <TrashIcon size={18} />
        </button>
      </header>

      {!collapsed && (
        <div className="space-y-8 border-t border-gray-100 px-4 py-5 sm:px-5 dark:border-gray-800">
          <Group title="Identificação">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {has("otherDescription") && text("otherDescription", { placeholder: "Ex.: Impressora multifunções", className: "sm:col-span-2 lg:col-span-3" })}
              {text("brand", { list: `${listId}-brands`, placeholder: PLACEHOLDERS[draft.type].brand, autoComplete: "off" })}
              <datalist id={`${listId}-brands`}>
                {(BRAND_SUGGESTIONS[draft.type] ?? []).map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
              {text("model", { placeholder: PLACEHOLDERS[draft.type].model })}
              {has("screenSizeInches") &&
                text("screenSizeInches", { inputMode: "decimal", placeholder: "Ex.: 24" })}
              <div>
                {text("serialNumber", {
                  placeholder: draft.serialUnavailable ? "Indisponível" : "Conforme a etiqueta",
                  disabled: draft.serialUnavailable,
                  autoComplete: "off",
                  spellCheck: false,
                })}
                {has("serialUnavailable") && (
                  <Checkbox
                    className="mt-2"
                    checked={draft.serialUnavailable}
                    onChange={(v) => set({ serialUnavailable: v, ...(v ? { serialNumber: "" } : {}) })}
                    label="Sem número de série / etiqueta ilegível"
                  />
                )}
              </div>
              {has("assetTag") && text("assetTag", { placeholder: "Quando disponível" })}
            </div>
          </Group>

          {isComputer && (
            <Group title="Especificações">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {text("processor", { placeholder: "Ex.: Intel Core i5-1135G7" })}
                {text("ramGb", { inputMode: "decimal", placeholder: "Ex.: 8" })}
                <Select
                  label={FIELD_LABELS.storageType}
                  required={required.has("storageType")}
                  value={draft.storageType}
                  onChange={(e) => set({ storageType: e.target.value })}
                  placeholder="Seleccione…"
                  options={STORAGE_OPTIONS}
                  error={err("storageType")}
                />
                {text("storageCapacityGb", { inputMode: "numeric", placeholder: "Ex.: 512", hint: "Em GB (1 TB = 1000 GB)" })}
                {text("operatingSystem", { list: `${listId}-os`, placeholder: "Ex.: Windows 11 Pro", autoComplete: "off" })}
                <datalist id={`${listId}-os`}>
                  {OS_SUGGESTIONS.map((o) => (
                    <option key={o} value={o} />
                  ))}
                </datalist>
                {text("hostname", { placeholder: "Quando aplicável", spellCheck: false, autoComplete: "off" })}
                {text("ipAddress", { placeholder: "Quando aplicável · ex.: 192.168.1.25", inputMode: "decimal", autoComplete: "off" })}
              </div>
            </Group>
          )}

          <Group title="Estado" description="Classificação padronizada (Bom · Razoável · Mau · Não funciona)">
            <ChoiceGroup
              label={draft.type === "teclado" || draft.type === "rato" || draft.type === "headphones" ? "Estado" : FIELD_LABELS.condition}
              required
              value={draft.condition as ConditionKey}
              onChange={(v) => set({ condition: v, ...(v === "bom" ? { needsReplacement: false, conditionNotes: "" } : {}) })}
              options={CONDITION_OPTIONS}
              error={err("condition")}
              hint={CONDITION_OPTIONS.find((o) => o.value === draft.condition)?.hint}
            />
            {showConditionNotes && (
              <TextArea
                label={FIELD_LABELS.conditionNotes}
                required={CONDITIONS_REQUIRING_NOTES.includes(draft.condition as ConditionKey)}
                value={draft.conditionNotes}
                onChange={(e) => set({ conditionNotes: e.target.value })}
                placeholder="Descreva os danos, desgaste ou limitações observadas"
                error={err("conditionNotes")}
                rows={2}
              />
            )}
            {has("batteryStatus") && (
              <ChoiceGroup
                label={FIELD_LABELS.batteryStatus}
                required
                value={draft.batteryStatus}
                onChange={(v) => set({ batteryStatus: v })}
                options={BATTERY_OPTIONS}
                error={err("batteryStatus")}
              />
            )}
          </Group>

          <Group title="Problemas identificados">
            {rules.problemChecklist && (
              <div>
                <div className="grid gap-x-4 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {PROBLEM_OPTIONS.filter((p) => p.value !== "bateria" || draft.type === "laptop").map((p) => (
                    <Checkbox
                      key={p.value}
                      label={p.label}
                      checked={draft.problems.includes(p.value)}
                      onChange={(checked) =>
                        set({ problems: checked ? [...draft.problems, p.value] : draft.problems.filter((x) => x !== p.value) })
                      }
                    />
                  ))}
                </div>
                <FieldMessage error={err("problems")} />
              </div>
            )}
            <TextArea
              label={rules.problemChecklist ? FIELD_LABELS.problemDescription : "Problemas identificados"}
              required={required.has("problemDescription")}
              value={draft.problemDescription}
              onChange={(e) => set({ problemDescription: e.target.value })}
              placeholder={rules.problemChecklist ? "Descrição livre dos problemas reportados pelo utilizador" : "Descreva os problemas, se existirem"}
              error={err("problemDescription")}
              rows={2}
            />
          </Group>

          {rules.software && (
            <Group title="Informações de software" description="Sempre que possível, confirmar posteriormente pela equipa de TI">
              <ChoiceGroup label={FIELD_LABELS.updatesStatus} required value={draft.updatesStatus} onChange={(v) => set({ updatesStatus: v })} options={UPDATES_OPTIONS} error={err("updatesStatus")} />
              <ChoiceGroup label={FIELD_LABELS.esetStatus} required value={draft.esetStatus} onChange={(v) => set({ esetStatus: v })} options={ESET_OPTIONS} error={err("esetStatus")} />
              <div className="grid gap-4 lg:grid-cols-2">
                <TextArea label={FIELD_LABELS.appIssues} value={draft.appIssues} onChange={(e) => set({ appIssues: e.target.value })} placeholder="Aplicações com erros, lentas ou em falta" rows={2} error={err("appIssues")} />
                <TextArea label={FIELD_LABELS.softwareNotes} value={draft.softwareNotes} onChange={(e) => set({ softwareNotes: e.target.value })} rows={2} error={err("softwareNotes")} />
              </div>
              <Checkbox
                checked={draft.softwareVerified}
                onChange={(v) => set({ softwareVerified: v })}
                label={FIELD_LABELS.softwareVerified}
                description="Marque apenas quando a informação foi confirmada directamente no equipamento"
              />
            </Group>
          )}

          <Group title="Necessidades e observações">
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              <Checkbox checked={draft.needsMaintenance} onChange={(v) => set({ needsMaintenance: v })} label={FIELD_LABELS.needsMaintenance} />
              <Checkbox
                checked={draft.needsReplacement}
                onChange={(v) => set({ needsReplacement: v })}
                label={FIELD_LABELS.needsReplacement}
                disabled={draft.condition === "bom"}
                description={draft.condition === "bom" ? "Indisponível para equipamentos em bom estado" : undefined}
              />
            </div>
            <FieldMessage error={err("needsReplacement")} />
            <TextArea label={FIELD_LABELS.observations} value={draft.observations} onChange={(e) => set({ observations: e.target.value })} rows={2} error={err("observations")} />
          </Group>
        </div>
      )}
    </section>
  );
}

export default memo(EquipmentFormSection);
