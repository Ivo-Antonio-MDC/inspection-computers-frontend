"use client";

import Link from "next/link";
import { BarList, ColumnChart, ConditionStacks, MeterList, ProgressRing } from "@/components/charts/charts";
import { Alert, Card, EmptyState, PageHeader, StatCard } from "@/components/common/ui-kit";
import { AlertIcon, ClipboardIcon, InfoIcon, LaptopIcon, PlusIcon, RefreshIcon, WrenchIcon } from "@/components/icons";
import EquipmentTypeIcon from "@/components/records/EquipmentTypeIcon";
import Badge, { RecordStatusBadge } from "@/components/ui/Badge";
import Button, { ButtonLink } from "@/components/ui/Button";
import { EQUIPMENT_TYPE_LABELS, INSPECTION_STATUS_LABELS, MODALITY_LABELS, PROBLEM_OPTIONS, RECORD_STATUS_LABELS, labelOf } from "@/lib/constants";
import { EQUIPMENT_TYPE_ORDER } from "@/lib/equipment-rules";
import { formatDate, recordCode, relativeTime } from "@/lib/format";
import { fillTimeline, useSummary } from "@/lib/use-summary";
import useAppStore, { useCurrentInspection } from "@/stores/app.store";
import useAuthStore from "@/stores/auth.store";
import type { RecordStatus } from "@/types";

function Skeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="skeleton h-32 rounded-2xl" />
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const inspectionId = useAppStore((s) => s.inspectionId);
  const inspection = useCurrentInspection();
  const user = useAuthStore((s) => s.user);
  const { data, error, loading, reload } = useSummary(inspectionId);

  if (!inspectionId) {
    return (
      <Card>
        <EmptyState
          icon={<ClipboardIcon />}
          title="Nenhuma inspecção configurada"
          description="Crie a primeira inspecção em Administração → Inspecções."
          action={user?.role === "admin" && <ButtonLink href="/administracao/inspeccoes">Criar inspecção</ButtonLink>}
        />
      </Card>
    );
  }

  const eq = data?.equipment;
  const statusCount = (s: RecordStatus) => data?.recordsByStatus.find((r) => r.status === s)?.total ?? 0;

  return (
    <>
      <PageHeader
        title={`Olá, ${user?.name.split(" ")[0] ?? ""}`}
        crumbs={[{ label: "Painel" }]}
        description={
          inspection && (
            <span className="flex flex-wrap items-center gap-2">
              {inspection.name}
              <Badge color={inspection.status === "em_curso" ? "success" : inspection.status === "concluida" ? "dark" : "light"}>
                {INSPECTION_STATUS_LABELS[inspection.status]}
              </Badge>
              {inspection.startDate && <span className="text-gray-400">desde {formatDate(inspection.startDate)}</span>}
            </span>
          )
        }
        actions={
          <>
            <Button variant="outline" startIcon={<RefreshIcon />} onClick={() => void reload()} loading={loading && !!data}>
              Actualizar
            </Button>
            <ButtonLink href="/registos/novo" startIcon={<PlusIcon />}>
              Novo formulário
            </ButtonLink>
          </>
        }
      />

      {error && <Alert tone="error" className="mb-6">{error}</Alert>}
      {!data ? (
        !error && <Skeleton />
      ) : (
        <div className="space-y-6">
          {/* Progresso + indicadores */}
          <div className="grid gap-6 xl:grid-cols-3">
            <Card title="Progresso da inspecção" desc="Colaboradores com formulário submetido ou validado">
              <ProgressRing value={data.collaborators.completed} total={data.collaborators.total} label="Colaboradores inspeccionados" />
              <ul className="mt-6 grid grid-cols-2 gap-3 text-sm">
                {(["rascunho", "submetido", "validado", "requer_correccao"] as RecordStatus[]).map((s) => (
                  <li key={s}>
                    <Link href={`/registos?status=${s}`} className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.03]">
                      <span className="truncate text-gray-500 dark:text-gray-400">{RECORD_STATUS_LABELS[s]}</span>
                      <span className="font-semibold tabular-nums text-gray-800 dark:text-white/90">{statusCount(s)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              {data.collaborators.total > data.collaborators.withRecord && (
                <Link href="/colaboradores?recordStatus=sem_registo" className="mt-4 block text-sm font-medium text-brand-500 hover:text-brand-600">
                  {data.collaborators.total - data.collaborators.withRecord} colaborador(es) ainda sem formulário →
                </Link>
              )}
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 xl:col-span-2">
              <StatCard label="Equipamentos inspeccionados" value={eq!.total} sub={`${eq!.computers} computadores`} icon={<LaptopIcon />} href="/equipamentos" />
              <StatCard label="Equipamentos com problemas" value={eq!.withProblems} tone="error" icon={<AlertIcon />} href="/equipamentos?hasProblems=true" delay={40} />
              <StatCard label="Necessidades de manutenção" value={eq!.needsMaintenance} tone="warning" icon={<WrenchIcon />} href="/equipamentos?needsMaintenance=true" delay={80} />
              <StatCard label="Necessidades de substituição" value={eq!.needsReplacement} tone="error" icon={<RefreshIcon />} href="/equipamentos?needsReplacement=true" delay={120} />
              <StatCard label="Sem número de série" value={eq!.missingSerial} tone="gray" icon={<InfoIcon />} href="/equipamentos?missingSerial=true" delay={160} />
              <StatCard label="Com dados incompletos" value={eq!.incomplete} tone="gray" icon={<ClipboardIcon />} href="/equipamentos?incomplete=true" delay={200} />
            </div>
          </div>

          {/* Localizações + estado por tipo */}
          <div className="grid gap-6 xl:grid-cols-2">
            <Card title="Progresso por localização" desc="Colaboradores inspeccionados em cada localidade">
              {data.byLocation.length === 0 ? (
                <p className="text-sm text-gray-500">Sem localizações.</p>
              ) : (
                <MeterList
                  valueLabel="Inspeccionados"
                  totalLabel="Colaboradores"
                  data={data.byLocation.map((l) => ({
                    key: l.id,
                    label: (
                      <>
                        {l.name} <span className="text-xs text-gray-400">· {MODALITY_LABELS[l.modality]}</span>
                      </>
                    ),
                    value: l.completed,
                    total: l.collaborators,
                    href: `/registos?locationId=${l.id}`,
                    detail: (
                      <span className="text-gray-500">
                        {l.equipment} equipamentos · {l.withProblems} com problemas
                      </span>
                    ),
                  }))}
                />
              )}
            </Card>

            <Card title="Estado dos equipamentos por tipo" desc="Classificação padronizada do estado físico">
              <ConditionStacks
                data={EQUIPMENT_TYPE_ORDER.map((t) => data.byType.find((b) => b.type === t))
                  .filter((b): b is NonNullable<typeof b> => !!b)
                  .map((b) => ({
                    key: b.type,
                    label: EQUIPMENT_TYPE_LABELS[b.type],
                    icon: <EquipmentTypeIcon type={b.type} size={16} />,
                    values: { bom: b.bom, razoavel: b.razoavel, mau: b.mau, nao_funciona: b.nao_funciona },
                    href: (condition) => `/equipamentos?type=${b.type}&condition=${condition}`,
                  }))}
              />
            </Card>
          </div>

          {/* Actividade + problemas */}
          <div className="grid gap-6 xl:grid-cols-5">
            <Card className="xl:col-span-3" title="Formulários submetidos por dia">
              <ColumnChart data={fillTimeline(data.timeline)} label="Submissões" />
            </Card>
            <Card className="xl:col-span-2" title="Problemas mais frequentes" desc="Computadores (laptop e desktop)">
              <BarList
                emptyLabel="Nenhum problema registado"
                data={data.byProblem.slice(0, 6).map((p) => ({
                  key: p.problem,
                  label: labelOf(PROBLEM_OPTIONS, p.problem),
                  value: p.total,
                  href: `/equipamentos?problem=${p.problem}`,
                }))}
              />
            </Card>
          </div>

          {/* Recentes + técnicos */}
          <div className="grid gap-6 xl:grid-cols-3">
            <Card className="xl:col-span-2" title="Actividade recente" actions={<ButtonLink href="/registos" variant="outline" size="xs">Ver todos</ButtonLink>} bodyClassName="p-0 sm:p-0">
              {data.recent.length === 0 ? (
                <EmptyState icon={<ClipboardIcon />} title="Ainda sem formulários" action={<ButtonLink href="/registos/novo">Registar o primeiro</ButtonLink>} />
              ) : (
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {data.recent.map((r) => (
                    <li key={r.id}>
                      <Link href={`/registos/${r.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                        <span className="font-mono text-xs font-semibold text-brand-600 dark:text-brand-400">{recordCode(r.number)}</span>
                        <span className="min-w-[12rem] flex-1">
                          <span className="block truncate font-medium text-gray-800 dark:text-white/90">{r.collaborator}</span>
                          <span className="block text-xs text-gray-500 dark:text-gray-400">
                            {r.location} · {r.equipment} equipamento(s) · {r.technician ?? "—"}
                          </span>
                        </span>
                        <RecordStatusBadge status={r.status} />
                        <span className="text-xs text-gray-400 sm:w-24 sm:text-right">{relativeTime(r.updatedAt)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card title="Formulários por técnico">
              <BarList data={data.byTechnician.map((t) => ({ key: t.id, label: t.name, value: t.records, href: `/registos?createdById=${t.id}` }))} emptyLabel="Sem formulários registados" />
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
