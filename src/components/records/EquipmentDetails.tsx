import type { ReactNode } from "react";
import {
  BATTERY_OPTIONS,
  EQUIPMENT_TYPE_LABELS,
  ESET_OPTIONS,
  PROBLEM_OPTIONS,
  STORAGE_OPTIONS,
  UPDATES_OPTIONS,
  labelOf,
} from "@/lib/constants";
import { EQUIPMENT_RULES } from "@/lib/equipment-rules";
import { storageLabel } from "@/lib/format";
import { equipmentTitle } from "@/lib/record-form";
import type { Equipment } from "@/types";
import { AlertIcon, CheckCircleIcon, ShieldIcon, WrenchIcon } from "../icons";
import Badge, { ConditionBadge } from "../ui/Badge";
import EquipmentTypeIcon from "./EquipmentTypeIcon";

function Item({ label, value, mono, wide }: { label: string; value: ReactNode; mono?: boolean; wide?: boolean }) {
  const empty = value === null || value === undefined || value === "";
  return (
    <div className={wide ? "sm:col-span-2 lg:col-span-3" : undefined}>
      <dt className="text-xs text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className={`mt-0.5 text-sm ${empty ? "text-gray-400" : "text-gray-800 dark:text-white/90"} ${mono ? "font-mono" : ""} whitespace-pre-line break-words`}>
        {empty ? "—" : value}
      </dd>
    </div>
  );
}

/** Ficha de leitura de um equipamento — só mostra os campos aplicáveis ao tipo. */
export default function EquipmentDetails({ equipment, index }: { equipment: Equipment; index: number }) {
  const e = equipment;
  const rules = EQUIPMENT_RULES[e.type];
  const has = (f: (typeof rules.fields)[number]) => rules.fields.includes(f);
  const computer = e.type === "laptop" || e.type === "desktop";

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <header className="flex flex-wrap items-center gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
        <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
          <EquipmentTypeIcon type={e.type} description={e.otherDescription} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-800 dark:text-white/90">
            <span className="text-gray-400">{index + 1}.</span> {equipmentTitle({ ...e, brand: e.brand ?? "", model: e.model ?? "", otherDescription: e.otherDescription ?? "" }, EQUIPMENT_TYPE_LABELS[e.type])}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{EQUIPMENT_TYPE_LABELS[e.type]}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <ConditionBadge condition={e.condition} />
          {e.hasProblems && (
            <Badge color="error">
              <AlertIcon size={12} /> Com problemas
            </Badge>
          )}
          {e.needsMaintenance && (
            <Badge color="warning">
              <WrenchIcon size={12} /> Manutenção
            </Badge>
          )}
          {e.needsReplacement && <Badge color="error">Substituição</Badge>}
          {!e.isComplete && <Badge color="light">Incompleto</Badge>}
        </div>
      </header>

      <div className="space-y-6 px-5 py-5">
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          {has("otherDescription") && <Item label="Tipo/descrição" value={e.otherDescription} />}
          <Item label="Marca" value={e.brand} />
          <Item label="Modelo" value={e.model} />
          {has("screenSizeInches") && <Item label="Tamanho" value={e.screenSizeInches ? `${e.screenSizeInches.toLocaleString("pt-PT")}"` : null} />}
          <Item label="Número de série" mono value={e.serialUnavailable ? <Badge color="warning">Indisponível / ilegível</Badge> : e.serialNumber} />
          {has("assetTag") && <Item label="Nº/ID do activo" mono value={e.assetTag} />}
          {computer && (
            <>
              <Item label="Processador" value={e.processor} />
              <Item label="Memória RAM" value={e.ramGb ? `${e.ramGb.toLocaleString("pt-PT")} GB` : null} />
              <Item label="Armazenamento" value={e.storageType ? `${labelOf(STORAGE_OPTIONS, e.storageType)} · ${storageLabel(e.storageCapacityGb)}` : null} />
              <Item label="Sistema operativo" value={e.operatingSystem} />
              <Item label="Hostname" mono value={e.hostname} />
              <Item label="Endereço IP" mono value={e.ipAddress} />
            </>
          )}
          {has("batteryStatus") && <Item label="Estado da bateria" value={labelOf(BATTERY_OPTIONS, e.batteryStatus)} />}
          {e.conditionNotes && <Item wide label="Descrição do estado" value={e.conditionNotes} />}
        </dl>

        {(e.problems.length > 0 || e.problemDescription) && (
          <div className="rounded-xl border border-error-100 bg-error-25 p-4 dark:border-error-500/20 dark:bg-error-500/5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-error-700 dark:text-error-400">Problemas identificados</p>
            {e.problems.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {e.problems.map((p) => (
                  <Badge key={p} color="error">
                    {labelOf(PROBLEM_OPTIONS, p)}
                  </Badge>
                ))}
              </div>
            )}
            {e.problemDescription && <p className="whitespace-pre-line text-sm text-gray-700 dark:text-gray-300">{e.problemDescription}</p>}
          </div>
        )}

        {rules.software && (
          <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                <ShieldIcon size={16} /> Informações de software
              </p>
              {e.softwareVerified ? (
                <span className="flex items-center gap-1 text-xs text-success-600 dark:text-success-500">
                  <CheckCircleIcon size={14} /> Verificado pela TI
                </span>
              ) : (
                <span className="text-xs text-gray-400">Por verificar pela TI</span>
              )}
            </div>
            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
              <Item label="Estado das actualizações" value={labelOf(UPDATES_OPTIONS, e.updatesStatus)} />
              <Item label="Estado do ESET" value={labelOf(ESET_OPTIONS, e.esetStatus)} />
              {e.appIssues && <Item label="Problemas com aplicações" value={e.appIssues} />}
              {e.softwareNotes && <Item label="Outras observações" value={e.softwareNotes} />}
            </dl>
          </div>
        )}

        {e.observations && (
          <dl>
            <Item label="Observações" value={e.observations} />
          </dl>
        )}
      </div>
    </section>
  );
}
