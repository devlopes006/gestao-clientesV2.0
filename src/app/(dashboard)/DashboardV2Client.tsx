"use client";

import { MonthlyCalendar } from "@/features/dashboard/components/MonthlyCalendar";
import { useAssignees } from "@/features/tasks/hooks/useAssignees";
import { DashboardData } from "@/modules/dashboard/domain/schema";
import {
  Activity,
  AlertCircle,
  Calendar as CalendarIcon,
  CheckCircle,
  Flame,
  LineChart as LineChartIcon,
  NotebookPen,
  Search,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  Pie,
  PieChart,
  LineChart as RLineChart,
  Tooltip as RTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import styles from './dashboard.module.css';

type Props = {
  initialData: DashboardData;
  initialMonthKey: string;
  role?: string;
  orgId?: string;
};

type TaskLike = {
  id: string;
  title: string;
  dueDate?: string | Date | null;
  client?: string | { name?: string | null } | null;
  priority?: "Baixa" | "Média" | "Alta" | "Urgente" | string;
  isUrgent?: boolean;
};

type PriorityBucket = { name: string; value: number };

const PRIORITY_COLORS: Record<string, string> = {
  Urgente: "#ef4444",
  Alta: "#f59e0b",
  Média: "#a855f7",
  Baixa: "#22c55e",
};

function InsightCard({
  title,
  description,
  icon,
  badge,
  badgeColor = "blue",
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}) {
  return (
    <div className={`group relative rounded-2xl bg-gradient-to-br from-slate-900/40 via-slate-950/50 to-slate-950/60 dark:from-slate-900/60 dark:via-slate-950/70 dark:to-slate-950/80 border border-pink-500/30 dark:border-pink-500/20 p-4 hover:shadow-xl hover:shadow-pink-500/10 transition-all duration-300 overflow-hidden backdrop-blur-lg`}>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/20 rounded-full blur-2xl" />
      </div>
      <div className="relative">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-pink-500/30 to-pink-600/20 flex items-center justify-center text-pink-400 group-hover:scale-110 transition-transform">
            {icon}
          </div>
          {badge && (
            <span
              className={`text-xs font-bold px-2 py-1 rounded-full text-white ${badgeColor === "red"
                ? "bg-gradient-to-r from-red-500 to-pink-500"
                : badgeColor === "emerald"
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                  : "bg-gradient-to-r from-pink-500 to-pink-600"
                }`}
            >
              {badge}
            </span>
          )}
        </div>
        <h3 className="text-sm font-bold text-white mt-3">{title}</h3>
        <p className="text-xs text-slate-400 mt-1">{description}</p>
      </div>
    </div>
  );
}

function toBR(d?: string | Date | null) {
  if (!d) return "Sem data";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "Sem data";
  return date.toLocaleDateString("pt-BR");
}

function getClientName(client?: TaskLike["client"]) {
  if (!client) return "Sem cliente";
  if (typeof client === "string") return client;
  return client.name || "Sem cliente";
}

function isUrgentTask(t: TaskLike) {
  return t.isUrgent === true || t.priority === "Urgente" || t.priority === "URGENT";
}

export function DashboardV2Client({ initialData, role, orgId }: Props) {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [tasksTab, setTasksTab] = useState<"pendentes" | "urgentes">("pendentes");

  // Se não usa assignees nesse componente, pode remover.
  useAssignees(orgId);

  // AJUSTE AQUI: mapeie para o seu schema real
  const data = initialData;
  const loading = false;

  const {
    pendingTasks,
    urgentTasks,
    urgentCount,
    openTasks,
    totalClients,
    receitaTrend,
    totalReceitas,
    finSeries,
    tasksByPriority,
    tasksPerClient,
  } = useMemo(() => {
    // AJUSTE AQUI: origem real das tarefas
    const allTasks: TaskLike[] =
      // @ts-expect-error - ajuste para seu schema
      (data?.tasks ?? data?.openTasks ?? []) as TaskLike[];

    const pending = allTasks.filter((t) => !isUrgentTask(t));
    const urgent = allTasks.filter((t) => isUrgentTask(t));

    // Contadores (AJUSTE AQUI se você já recebe pronto do backend)
    const totalClients =
      // @ts-expect-error - ajuste para seu schema
      Number(data?.totalClients ?? data?.clientsCount ?? 0);

    const openTasks = allTasks.length;
    const urgentCount = urgent.length;

    // Financeiro (AJUSTE AQUI)
    const finSeries =
      // @ts-expect-error - ajuste para seu schema
      (data?.finSeries ?? []) as Array<{ month: string; receitas: number; saldo: number }>;

    const totalReceitas =
      // @ts-expect-error - ajuste para seu schema
      Number(data?.totalReceitas ?? 0);

    const receitaTrend =
      // @ts-expect-error - ajuste para seu schema
      Number(data?.receitaTrend ?? 0);

    // Distribuição por prioridade (derivada das tasks)
    const priorityCount: Record<string, number> = { Urgente: 0, Alta: 0, Média: 0, Baixa: 0 };
    for (const t of allTasks) {
      const p = t.priority || (isUrgentTask(t) ? "Urgente" : "Média");
      const key =
        p === "Urgente" || p === "URGENT"
          ? "Urgente"
          : p === "Alta" || p === "HIGH"
            ? "Alta"
            : p === "Baixa" || p === "LOW"
              ? "Baixa"
              : "Média";
      priorityCount[key] = (priorityCount[key] || 0) + 1;
    }
    const tasksByPriority: PriorityBucket[] = Object.entries(priorityCount).map(([name, value]) => ({
      name,
      value,
    }));

    // Tarefas por cliente (top N)
    const perClientMap = new Map<string, number>();
    for (const t of allTasks) {
      const name = getClientName(t.client);
      perClientMap.set(name, (perClientMap.get(name) || 0) + 1);
    }
    const tasksPerClient = Array.from(perClientMap.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);

    return {
      pendingTasks: pending,
      urgentTasks: urgent,
      urgentCount,
      openTasks,
      totalClients,
      receitaTrend,
      totalReceitas,
      finSeries,
      tasksByPriority,
      tasksPerClient,
    };
  }, [data]);

  return (
    <div className={`${styles.root} text-white`}>
      <div className={styles.container}>
        {/* Top bar */}
        <section className="flex items-center justify-between gap-3 h-12 flex-shrink-0">
          <div className="flex items-center gap-2 rounded-lg border border-pink-500/20 bg-slate-900/60 px-3 py-2 w-full md:w-[440px] backdrop-blur-lg">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              className="bg-transparent outline-none text-sm flex-1 text-white placeholder:text-slate-500"
              placeholder="Buscar clientes, tarefas..."
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              className="px-3 py-2 rounded-lg border border-pink-500/20 bg-slate-900/60 text-xs text-slate-200 hover:border-pink-500/40 transition"
              onClick={() =>
                setActiveFilters((f) => (f.includes("Hoje") ? f.filter((x) => x !== "Hoje") : [...f, "Hoje"]))
              }
            >
              Hoje
            </button>
            <button
              className="px-3 py-2 rounded-lg border border-pink-500/20 bg-slate-900/60 text-xs text-slate-200 hover:border-pink-500/40 transition"
              onClick={() =>
                setActiveFilters((f) =>
                  f.includes("Urgente") ? f.filter((x) => x !== "Urgente") : [...f, "Urgente"]
                )
              }
            >
              Urgente
            </button>
            {activeFilters.length > 0 && (
              <button
                className="px-3 py-2 rounded-lg bg-pink-500/20 border border-pink-500/30 text-xs text-pink-200 hover:bg-pink-500/30 transition"
                onClick={() => setActiveFilters([])}
              >
                Limpar
              </button>
            )}
          </div>
        </section>

        {/* Grid principal */}
        <div className={styles.gridTop}>
          {/* Calendário */}
          <section className={`${styles.leftCol} rounded-2xl border border-pink-500/25 bg-gradient-to-br from-slate-900/40 via-slate-950/50 to-slate-950/60 backdrop-blur-lg p-3 ${styles.noScroll}`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-lg bg-pink-500/15 flex items-center justify-center">
                <CalendarIcon className="h-4 w-4 text-pink-400" />
              </div>
              <h2 className="text-sm font-bold">Calendário</h2>
            </div>
            <div className="h-full">
              <MonthlyCalendar activities={data.activities ?? []} initialMonth={new Date()} />
            </div>
          </section>

          {/* Coluna Direita - Tarefas */}
          <section className={`${styles.rightCol} flex flex-col gap-3 ${styles.noScroll}`}>
            {/* Pendentes vs Urgentes (duas caixas) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {/* Pendentes */}
              <div className={`rounded-2xl bg-slate-900/60 border border-pink-500/20 p-2 overflow-hidden flex flex-col h-full`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
                    <h3 className="text-xs font-bold text-white">Pendentes</h3>
                  </div>
                  <span className="text-[10px] text-amber-400 font-bold">{pendingTasks.length}</span>
                </div>

                <div className={`flex-1 overflow-hidden space-y-1.5 pr-1`}>
                  {pendingTasks.slice(0, 4).map((t) => (
                    <div
                      key={t.id}
                      className="p-2 rounded bg-slate-800/40 border border-amber-400/20 hover:border-amber-400/40 transition-all"
                    >
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                        <p className="text-[10px] text-white line-clamp-1 flex-1">{t.title}</p>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-0.5">{toBR(t.dueDate)}</p>
                    </div>
                  ))}
                  {pendingTasks.length === 0 && (
                    <div className="text-center py-6 text-slate-400">
                      <CheckCircle className="h-6 w-6 mx-auto mb-2 opacity-50" />
                      <p className="text-[11px] font-medium text-white">Sem pendências</p>
                      <p className="text-[10px] mt-1">Você está em dia.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Urgentes */}
              <div className={`rounded-2xl bg-slate-900/60 border border-pink-500/20 p-2 overflow-hidden flex flex-col h-full`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Flame className="h-3.5 w-3.5 text-red-400" />
                    <h3 className="text-xs font-bold text-white">Urgentes</h3>
                  </div>
                  <span className="text-[10px] text-red-400 font-bold">{urgentTasks.length}</span>
                </div>

                <div className={`flex-1 overflow-hidden space-y-1.5 pr-1`}>
                  {urgentTasks.slice(0, 4).map((t) => (
                    <div
                      key={t.id}
                      className="p-2 rounded bg-slate-800/40 border border-red-400/20 hover:border-red-400/40 transition-all"
                    >
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0 animate-pulse" />
                        <p className="text-[10px] text-white line-clamp-1 flex-1">{t.title}</p>
                      </div>
                      <p className="text-[9px] text-slate-400 mt-0.5">{toBR(t.dueDate)}</p>
                    </div>
                  ))}
                  {urgentTasks.length === 0 && (
                    <div className="text-center py-6 text-slate-400">
                      <CheckCircle className="h-6 w-6 mx-auto mb-2 opacity-50" />
                      <p className="text-[11px] font-medium text-white">Sem urgências</p>
                      <p className="text-[10px] mt-1">Tudo sob controle.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Insights */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-pink-500" />
                <h2 className="text-base font-bold text-white">Insights & Recomendações</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                {urgentCount > 0 && (
                  <InsightCard
                    icon={<Flame className="h-5 w-5" />}
                    title="Tarefas Urgentes"
                    description={`Você tem ${urgentCount} tarefas urgentes que precisam de atenção imediata`}
                    badge="Urgente"
                    badgeColor="red"
                  />
                )}
                {openTasks > 10 && (
                  <InsightCard
                    icon={<Target className="h-5 w-5" />}
                    title="Carga de Trabalho"
                    description={`${openTasks} tarefas em aberto. Considere delegar ou priorizar.`}
                    badge="Alto"
                    badgeColor="red"
                  />
                )}
                {receitaTrend > 0 && (
                  <InsightCard
                    icon={<TrendingUp className="h-5 w-5" />}
                    title="Receita em Alta"
                    description={`Crescimento de ${Math.abs(receitaTrend).toFixed(1)}% comparado ao mês anterior`}
                    badge="Positivo"
                    badgeColor="emerald"
                  />
                )}
                <InsightCard
                  icon={<Users className="h-5 w-5" />}
                  title="Equipe Ativa"
                  description={`${totalClients} clientes ativos sendo gerenciados`}
                  badge="Premium"
                  badgeColor="blue"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Notas + Tarefas (tab) */}
        <div className={styles.rowNotes}>
          {/* Notas */}
          <section className={`${styles.fullCol2} rounded-2xl border border-pink-500/25 bg-gradient-to-br from-slate-900/40 via-slate-950/50 to-slate-950/60 backdrop-blur-lg p-4 ${styles.noScroll}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-pink-500/30 to-pink-600/20 flex items-center justify-center">
                  <NotebookPen className="h-4 w-4 text-pink-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Anotações</h2>
                  <p className="text-[10px] text-slate-400">Notas rápidas</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {(data.notes ?? []).slice(0, 3).map((note: any, idx: number) => (
                <div
                  key={idx}
                  className="group p-3 rounded-lg bg-gradient-to-br from-slate-800/40 to-slate-800/20 border border-pink-500/20 hover:border-pink-500/40 transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-pink-500 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-white line-clamp-1">
                        {(note.content?.split("\n")[0] || "Nota sem título").substring(0, 40)}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(note.updatedAt || note.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {(data.notes ?? []).length === 0 && (
                <div className="text-center py-4 text-slate-500">
                  <p className="text-[11px]">Nenhuma nota ainda</p>
                </div>
              )}
            </div>

            {(data.notes ?? []).length > 0 && (
              <button className="w-full mt-2 px-2 py-1 rounded-lg bg-gradient-to-r from-pink-500/20 to-pink-600/10 hover:from-pink-500/30 hover:to-pink-600/20 border border-pink-500/20 text-pink-400 text-[11px] font-semibold transition-all">
                + Ver todas ({(data.notes ?? []).length})
              </button>
            )}
          </section>

          {/* Tarefas com tab */}
          <section className={`${styles.fullCol4} rounded-2xl border border-pink-500/25 bg-gradient-to-br from-slate-900/40 via-slate-950/50 to-slate-950/60 backdrop-blur-lg p-4 ${styles.noScroll}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div
                  className={`h-8 w-8 rounded-lg flex items-center justify-center ${tasksTab === "pendentes"
                    ? "bg-gradient-to-br from-amber-500/30 to-amber-600/20"
                    : "bg-gradient-to-br from-red-500/30 to-red-600/20"
                    }`}
                >
                  <AlertCircle className={`h-4 w-4 ${tasksTab === "pendentes" ? "text-amber-400" : "text-red-400"}`} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">{tasksTab === "pendentes" ? "Pendentes" : "Urgentes"}</h2>
                  <p className="text-[10px] text-slate-400">
                    {tasksTab === "pendentes" ? "Tarefas aguardando ação" : "Ação imediata necessária"}
                  </p>
                </div>
              </div>

              <div className={`inline-flex rounded-lg border border-pink-500/20 bg-slate-800/30 overflow-hidden backdrop-blur-sm`}>
                <button
                  className={`px-3 py-2 text-xs font-semibold transition-all rounded ${tasksTab === "pendentes"
                    ? "bg-gradient-to-r from-pink-500/30 to-pink-600/20 border border-pink-500/30 text-pink-300 shadow-sm"
                    : "text-slate-400 hover:text-pink-300 border border-transparent"
                    }`}
                  onClick={() => setTasksTab("pendentes")}
                >
                  Pendentes ({pendingTasks.length})
                </button>
                <button
                  className={`px-3 py-2 text-xs font-semibold transition-all rounded ${tasksTab === "urgentes"
                    ? "bg-gradient-to-r from-pink-500/30 to-pink-600/20 border border-pink-500/30 text-pink-300 shadow-sm"
                    : "text-slate-400 hover:text-pink-300 border border-transparent"
                    }`}
                  onClick={() => setTasksTab("urgentes")}
                >
                  Urgentes ({urgentTasks.length})
                </button>
              </div>
            </div>

            <div className={`space-y-2 overflow-hidden pr-2`}>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-10 rounded-lg bg-gradient-to-r from-slate-800/40 to-slate-800/20 animate-pulse" />
                ))
              ) : tasksTab === "pendentes" ? (
                pendingTasks.length > 0 ? (
                  pendingTasks.slice(0, 4).map((t) => (
                    <div
                      key={t.id}
                      className="p-3 rounded-lg bg-gradient-to-r from-slate-800/40 to-slate-800/20 border border-amber-400/30 hover:border-amber-400/50 transition-all"
                    >
                      <p className="text-[11px] font-semibold text-white line-clamp-1">{t.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-400">{getClientName(t.client)}</span>
                        <span className="text-[10px] text-amber-400">•</span>
                        <span className="text-[10px] text-amber-400">{toBR(t.dueDate)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <CheckCircle className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    <p className="text-[11px] font-medium text-white">Sem tarefas pendentes</p>
                    <p className="text-[10px] mt-1">Você está em dia.</p>
                  </div>
                )
              ) : urgentTasks.length > 0 ? (
                urgentTasks.slice(0, 4).map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-lg bg-gradient-to-r from-slate-800/40 to-slate-800/20 border border-red-400/30 hover:border-red-400/50 transition-all"
                  >
                    <p className="text-[11px] font-bold text-white line-clamp-1">{t.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-400">{getClientName(t.client)}</span>
                      <span className="text-[10px] text-red-400">•</span>
                      <span className="text-[10px] text-red-400">{toBR(t.dueDate)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <CheckCircle className="h-6 w-6 mx-auto mb-2 opacity-50" />
                  <p className="text-[11px] font-medium text-white">Sem tarefas urgentes</p>
                  <p className="text-[10px] mt-1">Tudo sob controle.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Gráficos (layout 6 colunas) */}
        <div className={styles.rowCharts}>
          {/* Receitas por período */}
          <section className={`${styles.fullCol4} rounded-2xl border border-pink-500/25 bg-gradient-to-br from-slate-900/40 via-slate-950/50 to-slate-950/60 backdrop-blur-lg p-3 hover:border-pink-500/50 transition-all duration-300 ${styles.noScroll}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-yellow-500/30 to-yellow-600/20 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-yellow-400" />
                </div>
                <h2 className="text-base font-bold text-white">Receitas por Período</h2>
              </div>
              <div className="text-[11px] text-slate-400">
                Total: {Number(totalReceitas).toLocaleString("pt-BR")}
              </div>
            </div>

            <div className="h-full">
              <ResponsiveContainer width="100%" height="100%">
                <RLineChart data={finSeries ?? []} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <RTooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "1px solid #ec4899",
                      color: "#f8fafc",
                      borderRadius: "8px",
                    }}
                  />
                  <Line type="monotone" dataKey="receitas" stroke="#ec4899" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="saldo" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </RLineChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Prioridades */}
          <section className={`${styles.fullCol2} rounded-2xl border border-pink-500/25 bg-gradient-to-br from-slate-900/40 via-slate-950/50 to-slate-950/60 backdrop-blur-lg p-3 hover:border-pink-500/50 transition-all duration-300 ${styles.noScroll}`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500/30 to-purple-600/20 flex items-center justify-center">
                <Target className="h-4 w-4 text-purple-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Prioridades</h2>
                <p className="text-[10px] text-slate-400">Distribuição</p>
              </div>
            </div>

            <div className="h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={tasksByPriority} dataKey="value" nameKey="name" innerRadius={30} outerRadius={55} paddingAngle={2}>
                    {tasksByPriority.map((entry) => (
                      <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] || "#64748b"} />
                    ))}
                  </Pie>
                  <RTooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "1px solid #ec4899",
                      color: "#f8fafc",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {tasksByPriority.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[item.name] || "#64748b" }} />
                  <span className="text-[10px] font-medium text-slate-300">
                    {item.name} ({item.value})
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Tarefas por cliente */}
          <section className={`${styles.fullCol3} rounded-2xl border border-pink-500/25 bg-gradient-to-br from-slate-900/40 via-slate-950/50 to-slate-950/60 backdrop-blur-lg p-3 hover:border-pink-500/50 transition-all duration-300 ${styles.noScroll}`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500/30 to-emerald-600/20 flex items-center justify-center">
                <Activity className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Tarefas por Cliente</h2>
                <p className="text-[10px] text-slate-400">Carga de trabalho</p>
              </div>
            </div>

            <div className="h-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tasksPerClient.slice(0, 8)} margin={{ left: 8, right: 8, top: 8, bottom: 35 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} interval={0} angle={-45} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <Bar dataKey="total" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <RTooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "1px solid #ec4899",
                      color: "#f8fafc",
                      borderRadius: "8px",
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Atividades recentes */}
          <section className={`${styles.fullCol3} rounded-2xl border border-pink-500/25 bg-gradient-to-br from-slate-900/40 via-slate-950/50 to-slate-950/60 backdrop-blur-lg p-3 hover:border-pink-500/50 transition-all duration-300 ${styles.noScroll}`}>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-pink-500/30 to-pink-600/20 flex items-center justify-center">
                <LineChartIcon className="h-4 w-4 text-pink-400" />
              </div>
              <h2 className="text-base font-bold text-white">Atividades Recentes</h2>
            </div>

            <ul className={`space-y-2 overflow-hidden pr-1`}>
              {(data.activities ?? []).slice(0, 4).map((a: any) => (
                <li
                  key={a.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/40 border border-slate-700/50 hover:border-pink-500/30 transition-colors"
                >
                  <span className="h-2 w-2 rounded-full bg-pink-500" />
                  <span className="text-[11px] truncate flex-1 text-slate-300">{a.title}</span>
                  <span className="text-[10px] text-slate-500">{new Date(a.date).toLocaleDateString("pt-BR")}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      {/* Dock global é renderizado pelo layout */}
    </div>
  );
}

export default DashboardV2Client;
