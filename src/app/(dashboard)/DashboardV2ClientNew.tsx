"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { LuxeCalendar } from "@/app/(dashboard)/components/LuxeCalendar";
import { LuxeNotes } from "@/app/(dashboard)/components/LuxeNotes";
import { useActivityFeed } from '@/hooks/useActivityFeed';
import { useDashboardKPIs } from '@/hooks/useDashboardKPIs';
import { useFinanceChart } from '@/hooks/useFinanceChart';
import { useMeetingsUpcoming } from '@/hooks/useMeetingsUpcoming';
import { DashboardData } from "@/modules/dashboard/domain/schema";
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Flame,
  Plus,
  TrendingUp,
  Users
} from "lucide-react";
import React, { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import styles from './dashboard-new.module.css';

type Props = {
  initialData: DashboardData;
  initialMonthKey: string;
  role?: string;
  orgId?: string;
};

const STATUS_COLORS: Record<string, string> = {
  TODO: "#64748b",
  IN_PROGRESS: "#3b82f6",
  REVIEW: "#f59e0b",
  DONE: "#10b981",
  CANCELLED: "#6b7280",
};

// Simple reminder type (local-only for now)
// Lembretes locais removidos

// KPI Card - Header executivo
function KPICard({
  icon: Icon,
  label,
  value,
  trend,
  trendLabel,
  color = "blue",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  color?: "blue" | "emerald" | "purple" | "orange" | "red" | "pink";
}) {
  const colorMap = {
    blue: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
    emerald: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30",
    purple: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
    orange: "from-orange-500/20 to-orange-600/10 border-orange-500/30",
    red: "from-red-500/20 to-red-600/10 border-red-500/30",
    pink: "from-pink-500/20 to-pink-600/10 border-pink-500/30",
  };

  const iconColorMap = {
    blue: "bg-blue-500/20 text-blue-400",
    emerald: "bg-emerald-500/20 text-emerald-400",
    purple: "bg-purple-500/20 text-purple-400",
    orange: "bg-orange-500/20 text-orange-400",
    red: "bg-red-500/20 text-red-400",
    pink: "bg-pink-500/20 text-pink-400",
  };

  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} border rounded-2xl p-6 backdrop-blur-lg`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`${iconColorMap[color]} p-3 rounded-xl`}>{Icon}</div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-slate-400"
            }`}>
            {trend === "up" && <ArrowUpRight className="w-3 h-3" />}
            {trend === "down" && <ArrowDownRight className="w-3 h-3" />}
            {trendLabel}
          </div>
        )}
      </div>
      <p className="text-slate-400 text-sm font-medium mb-1">{label}</p>
      <h3 className="text-2xl font-bold text-white">{value}</h3>
    </div>
  );
}

// Priority badge
function PriorityBadge({ priority }: { priority: string }) {
  const bgColor = {
    URGENT: "bg-red-500/20 text-red-300 border-red-500/30",
    HIGH: "bg-orange-500/20 text-orange-300 border-orange-500/30",
    MEDIUM: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    LOW: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${bgColor[priority as keyof typeof bgColor] || bgColor.LOW}`}>
      {priority}
    </span>
  );
}

// Client health indicator
function ClientHealthCard({ health }: { health: Record<string, any> }) {
  const getHealthColor = (rate: number) => {
    if (rate >= 80) return { bg: "from-emerald-500/20", text: "text-emerald-400", label: "Ótimo" };
    if (rate >= 60) return { bg: "from-yellow-500/20", text: "text-yellow-400", label: "Bom" };
    if (rate >= 40) return { bg: "from-orange-500/20", text: "text-orange-400", label: "Médio" };
    return { bg: "from-red-500/20", text: "text-red-400", label: "Baixo" };
  };

  const healthColor = getHealthColor(health.completionRate);

  return (
    <div className={`bg-gradient-to-br ${healthColor.bg} to-slate-900/20 border border-slate-700/50 rounded-xl p-4`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="text-white font-semibold text-sm">{health.clientName}</h4>
          <p className={`text-xs font-medium ${healthColor.text} mt-1`}>{healthColor.label} desempenho</p>
        </div>
        <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center">
          <span className="text-sm font-bold text-white">{health.completionRate}%</span>
        </div>
      </div>
      <div className="w-full h-2 bg-slate-800/80 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${health.completionRate >= 80 ? 'bg-emerald-500' :
            health.completionRate >= 60 ? 'bg-yellow-500' :
              health.completionRate >= 40 ? 'bg-orange-500' : 'bg-red-500'
            }`}
          style={{ width: `${health.completionRate}%` }}
        />
      </div>
      <div className="grid grid-cols-4 gap-2 mt-3 text-[11px] text-slate-300">
        <div className="text-center">
          <p className="font-semibold text-white">{health.tasksPending}</p>
          <p>Pendentes</p>
        </div>
        <div className="text-center">
          <p className="font-semibold text-white">{health.tasksInProgress}</p>
          <p>Em Progresso</p>
        </div>
        <div className="text-center">
          <p className={`font-semibold ${health.tasksOverdue > 0 ? "text-red-400" : "text-emerald-400"}`}>{health.tasksOverdue}</p>
          <p>Atrasadas</p>
        </div>
        <div className="text-center">
          <p className="font-semibold text-white">{health.tasksCompleted}</p>
          <p>Concluídas</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-3">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-2">
          <p className="text-[10px] text-slate-400 mb-1">Satisfação</p>
          <p className="text-white font-semibold text-sm">{health.satisfaction ?? 0}%</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-2">
          <p className="text-[10px] text-slate-400 mb-1">Receita (M)</p>
          <p className="text-white font-semibold text-sm">R$ {health.monthlyRevenue ?? 0}</p>
        </div>
      </div>
    </div>
  );
}

// Urgent task card
function UrgentTaskCard({ task }: { task: Record<string, any> }) {
  return (
    <div className="bg-gradient-to-br from-red-500/10 to-slate-900/20 border border-red-500/20 rounded-lg p-4 hover:border-red-500/40 transition-all">
      <div className="flex items-start gap-3 mb-2">
        <Flame className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-semibold text-sm line-clamp-2">{task.title}</h4>
          <p className="text-xs text-slate-400 mt-1">{task.client?.name}</p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-3">
        <PriorityBadge priority={task.priority} />
        {task.dueDate && (
          <span className="text-[10px] text-red-400 font-medium">
            Vencimento: {new Date(task.dueDate).toLocaleDateString("pt-BR")}
          </span>
        )}
      </div>
    </div>
  );
}

// Activity timeline
function ActivityTimeline({ activities }: { activities: Array<Record<string, any>> }) {
  return (
    <div className="space-y-3">
      {activities.slice(0, 5).map((activity, idx) => (
        <div key={activity.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className={`w-3 h-3 rounded-full mt-1.5 ${activity.type === "meeting" ? "bg-blue-500" :
              activity.type === "task" ? "bg-purple-500" :
                "bg-emerald-500"
              }`} />
            {idx < activities.length - 1 && <div className="w-0.5 h-8 bg-slate-700/50 mt-1" />}
          </div>
          <div className="flex-1 pt-1">
            <p className="text-sm text-white font-medium">{activity.title}</p>
            <p className="text-xs text-slate-400 mt-0.5">{activity.clientName} • {new Date(activity.date).toLocaleDateString("pt-BR")}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardV2ClientNew({ initialData, initialMonthKey }: Props) {
  const kpis = useDashboardKPIs(initialData)
  const financePoints = useFinanceChart(initialData)
  const meetings = useMeetingsUpcoming(initialData)
  const activities = useActivityFeed(initialData)
  // Reminders removidos

  const stats = useMemo(() => {
    const clients = initialData.clients?.length ?? 0;
    const tasks = initialData.tasks?.length ?? 0;
    const tasksCompleted = initialData.tasks?.filter(t => t.status === "DONE").length ?? 0;
    const tasksUrgent = initialData.tasks?.filter(t => t.priority === "URGENT").length ?? 0;
    const completionRate = tasks > 0 ? Math.round((tasksCompleted / tasks) * 100) : 0;
    const overdueTasks = initialData.tasks?.filter(t =>
      t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "DONE"
    ).length ?? 0;

    return {
      clients,
      tasks,
      tasksCompleted,
      tasksUrgent,
      completionRate,
      overdueTasks,
    };
  }, [initialData]);

  const urgentTasks = useMemo(() => {
    return (initialData.tasks ?? [])
      .filter(t => t.priority === "URGENT")
      .sort((a, b) => (new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime()))
      .slice(0, 3);
  }, [initialData.tasks]);

  const chartData = useMemo(() => {
    return (initialData.financialData ?? []).map(d => ({
      month: d.month.substring(0, 3),
      receitas: d.receitas,
      despesas: d.despesas,
      saldo: d.saldo,
    }));
  }, [initialData.financialData]);

  const tasksByStatus = useMemo(() => {
    const statusMap = { TODO: 0, IN_PROGRESS: 0, REVIEW: 0, DONE: 0, CANCELLED: 0 };
    (initialData.tasks ?? []).forEach(t => {
      statusMap[t.status as keyof typeof statusMap]++;
    });
    return Object.entries(statusMap).map(([status, count]) => ({
      name: status.replace("_", " "),
      value: count,
      status,
    }));
  }, [initialData.tasks]);

  const topClients = useMemo(() => {
    const health = initialData.clientsHealth ?? [];
    return health.sort((a, b) => b.tasksTotal - a.tasksTotal).slice(0, 4);
  }, [initialData.clientsHealth]);

  return (
    <div className={styles.root}>
      <div className={styles.container}>
        {/* HEADER EXECUTIVO */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <KPICard
            icon={<Users className="w-6 h-6" />}
            label="Clientes Ativos"
            value={kpis.clientsActive}
            color="blue"
          />
          <KPICard
            icon={<CheckCircle2 className="w-6 h-6" />}
            label="Taxa de Conclusão"
            value={`${(kpis.tasksDone / (kpis.tasksTodo + kpis.tasksInProgress + kpis.tasksReview + kpis.tasksDone || 1) * 100).toFixed(0)}%`}
            trend="up"
            trendLabel="+5%"
            color="emerald"
          />
          <KPICard
            icon={<AlertCircle className="w-6 h-6" />}
            label="Tarefas Urgentes"
            value={stats.tasksUrgent}
            trend={stats.tasksUrgent > 0 ? "down" : "neutral"}
            trendLabel={stats.tasksUrgent > 0 ? "-2" : "Normal"}
            color={stats.tasksUrgent > 0 ? "red" : "emerald"}
          />
          <KPICard
            icon={<Clock className="w-6 h-6" />}
            label="Tarefas em Atraso"
            value={stats.overdueTasks}
            trend={stats.overdueTasks > 0 ? "down" : "up"}
            trendLabel={stats.overdueTasks > 0 ? "Ação" : "Sob controle"}
            color={stats.overdueTasks > 0 ? "orange" : "emerald"}
          />
          <KPICard
            icon={<TrendingUp className="w-6 h-6" />}
            label="Total de Tarefas"
            value={kpis.tasksTodo + kpis.tasksInProgress + kpis.tasksReview + kpis.tasksDone}
            color="purple"
          />
        </section>

        {/* SEÇÃO PRINCIPAL - GRID 2 COLUNAS */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* COLUNA ESQUERDA - AÇÕES URGENTES */}
          <div className="lg:col-span-1 space-y-6">
            {/* Tarefas Urgentes */}
            <div className="bg-gradient-to-br from-slate-900/50 via-slate-950/50 to-slate-950/30 border border-pink-500/20 rounded-2xl p-6 backdrop-blur-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Flame className="w-5 h-5 text-red-400" />
                  Urgentes
                </h2>
                <span className="bg-red-500/20 text-red-300 px-2 py-1 rounded-full text-xs font-semibold">
                  {stats.tasksUrgent}
                </span>
              </div>
              <div className="space-y-3">
                {urgentTasks.length > 0 ? (
                  urgentTasks.map(task => <UrgentTaskCard key={task.id} task={task} />)
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Nenhuma tarefa urgente!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Atividades Recentes */}
            <div className="bg-gradient-to-br from-slate-900/50 via-slate-950/50 to-slate-950/30 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-lg">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-cyan-400" />
                Atividades
              </h2>
              {initialData.activities && initialData.activities.length > 0 ? (
                <ActivityTimeline activities={initialData.activities} />
              ) : (
                <p className="text-slate-400 text-sm">Nenhuma atividade registrada</p>
              )}
            </div>
          </div>

          {/* COLUNA CENTRAL E DIREITA - GRÁFICO FINANCEIRO */}
          <div className="lg:col-span-2 space-y-6">
            {/* Financeiro */}
            <div className="bg-gradient-to-br from-slate-900/50 via-slate-950/50 to-slate-950/30 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-lg">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-yellow-400" />
                Receitas vs Despesas
              </h2>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={financePoints.map(p => ({ month: p.month.substring(0, 3), receitas: p.revenue, despesas: p.expenses }))} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="month" stroke="#94a3b8" style={{ fontSize: "12px" }} />
                  <YAxis
                    stroke="#94a3b8"
                    style={{ fontSize: "12px" }}
                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "1px solid #ec4899",
                      borderRadius: "8px",
                      padding: "12px"
                    }}
                    labelStyle={{ color: "#f1f5f9", fontWeight: "bold", marginBottom: "8px" }}
                    formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, '']}
                  />
                  <Area type="monotone" dataKey="receitas" name="Receitas" fill="#10b981" stroke="#10b981" fillOpacity={0.3} strokeWidth={2} />
                  <Area type="monotone" dataKey="despesas" name="Despesas" fill="#ef4444" stroke="#ef4444" fillOpacity={0.3} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Card de status de tarefas removido */}
          </div>
        </div>

        {/* SAÚDE DOS CLIENTES */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-amber-400" />
              Saúde dos Clientes
            </h2>
            <button className="flex items-center gap-2 px-4 py-2 bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/30 text-pink-300 rounded-lg text-sm font-semibold transition-all">
              <ChevronRight className="w-4 h-4" />
              Ver todos
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {topClients.length > 0 ? (
              topClients.map(health => <ClientHealthCard key={health.clientId} health={health} />)
            ) : (
              <div className="col-span-full text-center py-12 text-slate-400">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-sm">Nenhum cliente registrado</p>
              </div>
            )}
          </div>
        </section>

        {/* RODAPÉ - QUICK ACTIONS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button className="bg-gradient-to-r from-blue-500/20 to-blue-600/10 hover:from-blue-500/30 hover:to-blue-600/20 border border-blue-500/30 rounded-xl p-4 text-white font-semibold flex items-center justify-between group transition-all">
            <div className="flex items-center gap-3">
              <Plus className="w-5 h-5" />
              Nova Tarefa
            </div>
            <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          <button className="bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 hover:from-emerald-500/30 hover:to-emerald-600/20 border border-emerald-500/30 rounded-xl p-4 text-white font-semibold flex items-center justify-between group transition-all">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5" />
              Novo Cliente
            </div>
            <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          <button className="bg-gradient-to-r from-purple-500/20 to-purple-600/10 hover:from-purple-500/30 hover:to-purple-600/20 border border-purple-500/30 rounded-xl p-4 text-white font-semibold flex items-center justify-between group transition-all">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5" />
              Agendar
            </div>
            <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>

        {/* SEÇÃO FUNCIONAL - CALENDÁRIO E NOTAS */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
          {/* Calendário Premium */}
          <div className="lg:col-span-3">
            <LuxeCalendar
              initialEvents={(initialData.events as any) || []}
              monthKey={initialMonthKey}
            />
          </div>

          {/* Notas Premium */}
          <div className="lg:col-span-2">
            <LuxeNotes
              initialNotes={(initialData.notes as any) || []}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardV2ClientNew;
