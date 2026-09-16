"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Alert, Card, DataTable, PageHeader, Pagination, StatCard } from "@/components/common/ui-kit";
import { SearchInput } from "@/components/form/fields";
import { AlertIcon, ClipboardIcon, DownloadIcon, InfoIcon, LaptopIcon, RefreshIcon, WrenchIcon } from "@/components/icons";
import EquipmentTypeIcon from "@/components/records/EquipmentTypeIcon";
import { RecordStatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { apiErrorMessage } from "@/lib/api";
import { EQUIPMENT_TYPE_LABELS, ESET_OPTIONS, MODALITY_LABELS, PROBLEM_OPTIONS, UPDATES_OPTIONS, labelOf } from "@/lib/constants";
import { EQUIPMENT_TYPE_ORDER } from "@/lib/equipment-rules";
import { formatDateTime, formatNumber, percent, recordCode } from "@/lib/format";
import { ReportService } from "@/lib/services";
import { useSummary } from "@/lib/use-summary";
import useAppStore, { useCurrentInspection } from "@/stores/app.store";

const n = (v: number) => <span className="tabular-nums">{formatNumber(v)}</span>;

export default function ReportsPage() {
  const inspectionId = useAppStore((s) => s.inspectionId);
  const inspection = useCurrentInspection();
  const { data, error } = useSummary(inspectionId);
  const [exporting, setExporting] = useState<"xlsx" | "csv" | null>(null);
  const [collabSearch, setCollabSearch] = useState("");
  const [collabPage, setCollabPage] = useState(1);

  const exportFile = async (format: "xlsx" | "csv") => {
    if (!inspectionId) return;
    setExporting(format);
    try {
      await ReportService.export({ inspectionId, format });
      toast.success("Ficheiro gerado");
    } catch (e) {
      toast.error(apiErrorMessage(e, "Falha na exportação"));
    } finally {
      setExporting(null);
    }
  };

  const collaborators = useMemo(() => {
    const term = collabSearch.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
    return (data?.byCollaborator ?? []).filter((c) =>
      `${c.name} ${c.department} ${c.location}`.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().includes(term),
    );
  }, [data, collabSearch]);

  const eq = data?.equipment;
  const typeRows = data ? EQUIPMENT_TYPE_ORDER.map((t) => data.byType.find((b) => b.type === t)).filter((b): b is NonNullable<typeof b> => !!b) : [];

  return (
    <>
      <PageHeader
        title="Relatórios e exportação"
        crumbs={[{ label: "Relatórios" }]}
        description={inspection ? `Consolidação dos dados de: ${inspection.name}` : undefined}
        actions={
          <>
            <Button variant="outline" className="no-print" onClick={() => window.print()}>
              Imprimir
            </Button>
            <Button variant="outline" startIcon={<DownloadIcon />} loading={exporting === "csv"} onClick={() => exportFile("csv")}>
              CSV
            </Button>
            <Button startIcon={<DownloadIcon />} loading={exporting === "xlsx"} onClick={() => exportFile("xlsx")}>
              Exportar Excel
            </Button>
          </>
        }
      />

      {error && <Alert tone="error">{error}</Alert>}
      {!data ? (
        !error && <div className="skeleton h-96 rounded-2xl" />
      ) : (
        <div className="space-y-6">

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total de equipamentos inspeccionados" value={eq!.total} icon={<LaptopIcon />} />
            <StatCard label="Colaboradores com formulário" value={`${formatNumber(data.collaborators.withRecord)} / ${formatNumber(data.collaborators.total)}`} sub={`${percent(data.collaborators.completed, data.collaborators.total)}% concluídos`} icon={<ClipboardIcon />} />
            <StatCard label="Equipamentos com problemas" value={eq!.withProblems} sub={`${percent(eq!.withProblems, eq!.total)}% do total`} tone="error" icon={<AlertIcon />} href="/equipamentos?hasProblems=true" />
            <StatCard label="Sem número de série" value={eq!.missingSerial} tone="gray" icon={<InfoIcon />} href="/equipamentos?missingSerial=true" />
            <StatCard label="Com dados incompletos" value={eq!.incomplete} tone="gray" icon={<ClipboardIcon />} href="/equipamentos?incomplete=true" />
            <StatCard label="Necessidades de manutenção" value={eq!.needsMaintenance} tone="warning" icon={<WrenchIcon />} href="/equipamentos?needsMaintenance=true" />
            <StatCard label="Necessidades de substituição" value={eq!.needsReplacement} tone="error" icon={<RefreshIcon />} href="/equipamentos?needsReplacement=true" />
            <StatCard label="Computadores (laptop + desktop)" value={eq!.computers} icon={<LaptopIcon />} />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card title="Equipamentos por localização" bodyClassName="p-0 sm:p-0">
              <DataTable className="[&_table]:min-w-[560px]">
                <thead>
                  <tr>
                    <th>Localização</th>
                    <th className="text-right">Colaboradores</th>
                    <th className="text-right">Concluídos</th>
                    <th className="text-right">Equipamentos</th>
                    <th className="text-right">Com problemas</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byLocation.map((l) => (
                    <tr key={l.id}>
                      <td>
                        <Link href={`/equipamentos?locationId=${l.id}`} className="font-medium text-gray-800 hover:text-brand-600 dark:text-white/90">{l.name}</Link>
                        <span className="ml-2 text-xs text-gray-400">{MODALITY_LABELS[l.modality]}</span>
                      </td>
                      <td className="text-right">{n(l.collaborators)}</td>
                      <td className="text-right">{n(l.completed)} <span className="text-xs text-gray-400">({percent(l.completed, l.collaborators)}%)</span></td>
                      <td className="text-right">{n(l.equipment)}</td>
                      <td className="text-right">{n(l.withProblems)}</td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            </Card>

            <Card title="Equipamentos por departamento" bodyClassName="p-0 sm:p-0">
              <DataTable className="[&_table]:min-w-[560px]">
                <thead>
                  <tr>
                    <th>Departamento</th>
                    <th className="text-right">Colaboradores</th>
                    <th className="text-right">Concluídos</th>
                    <th className="text-right">Equipamentos</th>
                    <th className="text-right">Com problemas</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byDepartment.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <Link href={`/equipamentos?departmentId=${d.id}`} className="font-medium text-gray-800 hover:text-brand-600 dark:text-white/90">{d.name}</Link>
                      </td>
                      <td className="text-right">{n(d.collaborators)}</td>
                      <td className="text-right">{n(d.completed)}</td>
                      <td className="text-right">{n(d.equipment)}</td>
                      <td className="text-right">{n(d.withProblems)}</td>
                    </tr>
                  ))}
                </tbody>
              </DataTable>
            </Card>
          </div>

          <Card title="Equipamentos por tipo e estado" bodyClassName="p-0 sm:p-0">
            <DataTable>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th className="text-right">Total</th>
                  <th className="text-right">Bom</th>
                  <th className="text-right">Razoável</th>
                  <th className="text-right">Mau</th>
                  <th className="text-right">Não funciona</th>
                  <th className="text-right">Com problemas</th>
                  <th className="text-right">Manutenção</th>
                  <th className="text-right">Substituição</th>
                </tr>
              </thead>
              <tbody>
                {typeRows.length === 0 ? (
                  <tr><td colSpan={9} className="text-center text-gray-500">Sem equipamentos</td></tr>
                ) : (
                  <>
                    {typeRows.map((t) => (
                      <tr key={t.type}>
                        <td>
                          <Link href={`/equipamentos?type=${t.type}`} className="flex items-center gap-2 font-medium text-gray-800 hover:text-brand-600 dark:text-white/90">
                            <EquipmentTypeIcon type={t.type} size={18} className="text-gray-400" /> {EQUIPMENT_TYPE_LABELS[t.type]}
                          </Link>
                        </td>
                        <td className="text-right font-semibold">{n(t.total)}</td>
                        <td className="text-right">{n(t.bom)}</td>
                        <td className="text-right">{n(t.razoavel)}</td>
                        <td className="text-right">{n(t.mau)}</td>
                        <td className="text-right">{n(t.nao_funciona)}</td>
                        <td className="text-right">{n(t.withProblems)}</td>
                        <td className="text-right">{n(t.needsMaintenance)}</td>
                        <td className="text-right">{n(t.needsReplacement)}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-semibold dark:bg-white/[0.02]">
                      <td>Total</td>
                      {(["total", "bom", "razoavel", "mau", "nao_funciona", "withProblems", "needsMaintenance", "needsReplacement"] as const).map((k) => (
                        <td key={k} className="text-right">{n(typeRows.reduce((s, r) => s + r[k], 0))}</td>
                      ))}
                    </tr>
                  </>
                )}
              </tbody>
            </DataTable>
          </Card>

          <div className="grid gap-6 xl:grid-cols-3">
            <Card title="Problemas identificados">
              {data.byProblem.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhum problema registado.</p>
              ) : (
                <ul className="divide-y divide-gray-100 text-sm dark:divide-gray-800">
                  {data.byProblem.map((p) => (
                    <li key={p.problem} className="flex justify-between py-2">
                      <Link href={`/equipamentos?problem=${p.problem}`} className="text-gray-700 hover:text-brand-600 dark:text-gray-300">{labelOf(PROBLEM_OPTIONS, p.problem)}</Link>
                      {n(p.total)}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card title="Antivírus ESET" desc="Laptops e desktops">
              <ul className="divide-y divide-gray-100 text-sm dark:divide-gray-800">
                {data.software.eset.length === 0 && <li className="py-2 text-gray-500">Sem computadores.</li>}
                {data.software.eset.map((s) => (
                  <li key={s.status} className="flex justify-between py-2">
                    <span className="text-gray-700 dark:text-gray-300">{s.status === "sem_registo" ? "Sem registo" : labelOf(ESET_OPTIONS, s.status)}</span>
                    {n(s.total)}
                  </li>
                ))}
              </ul>
            </Card>
            <Card title="Actualizações do sistema" desc="Laptops e desktops">
              <ul className="divide-y divide-gray-100 text-sm dark:divide-gray-800">
                {data.software.updates.length === 0 && <li className="py-2 text-gray-500">Sem computadores.</li>}
                {data.software.updates.map((s) => (
                  <li key={s.status} className="flex justify-between py-2">
                    <span className="text-gray-700 dark:text-gray-300">{s.status === "sem_registo" ? "Sem registo" : labelOf(UPDATES_OPTIONS, s.status)}</span>
                    {n(s.total)}
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <Card
            title="Equipamentos por utilizador"
            desc={`${collaborators.length} colaborador(es) com formulário`}
            actions={<SearchInput value={collabSearch} onChange={(v) => { setCollabSearch(v); setCollabPage(1); }} placeholder="Filtrar…" className="w-64" />}
            bodyClassName="p-0 sm:p-0"
          >
            <DataTable>
              <thead>
                <tr>
                  <th>Colaborador</th>
                  <th>Departamento</th>
                  <th>Localização</th>
                  <th>Equipamentos</th>
                  <th className="text-right">Com problemas</th>
                  <th>Formulário</th>
                </tr>
              </thead>
              <tbody>
                {collaborators.slice((collabPage - 1) * 15, collabPage * 15).map((c) => (
                  <tr key={c.recordId}>
                    <td>
                      <p className="font-medium text-gray-800 dark:text-white/90">{c.name}</p>
                      <p className="text-xs text-gray-500">{c.position}</p>
                    </td>
                    <td className="text-gray-600 dark:text-gray-400">{c.department}</td>
                    <td className="text-gray-600 dark:text-gray-400">{c.location}</td>
                    <td>
                      <span className="flex items-center gap-1.5 text-gray-500">
                        {n(c.equipment)}
                        {c.types
                          .filter((t) => t !== "outro" || !c.others?.length)
                          .map((t) => (
                            <span key={t} title={EQUIPMENT_TYPE_LABELS[t]}><EquipmentTypeIcon type={t} size={16} /></span>
                          ))}
                        {c.others?.map((name) => (
                          <span key={`outro-${name}`} title={name}><EquipmentTypeIcon type="outro" description={name} size={16} /></span>
                        ))}
                      </span>
                    </td>
                    <td className="text-right">{n(c.withProblems)}</td>
                    <td>
                      <Link href={`/registos/${c.recordId}`} className="mr-2 font-mono text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400">{recordCode(c.number)}</Link>
                      <RecordStatusBadge status={c.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
            <Pagination page={collabPage} limit={15} total={collaborators.length} onChange={setCollabPage} />
          </Card>

          <p className="text-right text-xs text-gray-400">Dados consultados em {formatDateTime(new Date())}</p>
        </div>
      )}
    </>
  );
}
