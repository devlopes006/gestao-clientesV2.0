"use client";

import { AlertTriangle, CheckCircle, Clock, TrendingUp, Zap } from "lucide-react";
import React from "react";

interface Insight {
  id: string;
  type: "success" | "warning" | "info" | "urgent";
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function DashboardInsights({ data }: { data: any }) {
  const generateInsights = React.useMemo((): Insight[] => {
    const insights: Insight[] = [];

    // Check for overdue tasks
    const overdueTasks = data.tasks?.filter(
      (t: any) =>
        t.dueDate &&
        new Date(t.dueDate) < new Date() &&
        t.status !== "DONE"
    ) || [];

    if (overdueTasks.length > 0) {
      insights.push({
        id: "overdue",
        type: "urgent",
        title: `${overdueTasks.length} tarefa(s) vencida(s)`,
        description: "Você tem tarefas que ultrapassaram o prazo de entrega",
        icon: <AlertTriangle className="w-5 h-5" />,
      });
    }

    // Check for high completion rate
    const tasks = data.tasks || [];
    const completed = tasks.filter((t: any) => t.status === "DONE").length;
    const completionRate = tasks.length > 0 ? (completed / tasks.length) * 100 : 0;

    if (completionRate >= 80) {
      insights.push({
        id: "completion",
        type: "success",
        title: "Ótima taxa de conclusão!",
        description: `Você completou ${completionRate.toFixed(0)}% das tarefas este mês`,
        icon: <CheckCircle className="w-5 h-5" />,
      });
    }

    // Check for urgent tasks
    const urgentTasks = tasks.filter((t: any) => t.priority === "URGENT") || [];
    if (urgentTasks.length > 2) {
      insights.push({
        id: "urgent",
        type: "warning",
        title: `${urgentTasks.length} tarefas urgentes`,
        description: "Considere priorizar essas tarefas importantes",
        icon: <Zap className="w-5 h-5" />,
      });
    }

    // Clients with low completion
    const healthData = data.clientsHealth || [];
    const lowHealth = healthData.filter((h: any) => h.completionRate < 40);
    if (lowHealth.length > 0) {
      insights.push({
        id: "client-health",
        type: "warning",
        title: `${lowHealth.length} cliente(s) com baixo desempenho`,
        description: "Esses clientes precisam de mais atenção",
        icon: <Clock className="w-5 h-5" />,
      });
    }

    // Revenue trend
    const financialData = data.financialData || [];
    if (financialData.length >= 2) {
      const latest = financialData[financialData.length - 1];
      const previous = financialData[financialData.length - 2];
      if (latest.receitas > previous.receitas) {
        insights.push({
          id: "revenue",
          type: "success",
          title: "Receitas em crescimento",
          description: `+${((latest.receitas - previous.receitas) / previous.receitas * 100).toFixed(1)}% em relação ao mês anterior`,
          icon: <TrendingUp className="w-5 h-5" />,
        });
      }
    }

    return insights;
  }, [data]);

  const iconByType = {
    success: "text-emerald-400",
    warning: "text-yellow-400",
    info: "text-blue-400",
    urgent: "text-red-400",
  };

  const borderByType = {
    success: "border-emerald-500/30",
    warning: "border-yellow-500/30",
    info: "border-blue-500/30",
    urgent: "border-red-500/30",
  };

  const bgByType = {
    success: "from-emerald-500/10",
    warning: "from-yellow-500/10",
    info: "from-blue-500/10",
    urgent: "from-red-500/10",
  };

  if (generateInsights.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-white mb-4">Insights Inteligentes</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {generateInsights.map((insight) => (
          <div
            key={insight.id}
            className={`bg-gradient-to-br ${bgByType[insight.type]} to-slate-900/20 border ${borderByType[insight.type]} rounded-xl p-4 hover:scale-105 transition-transform`}
          >
            <div className={`${iconByType[insight.type]} mb-3`}>
              {insight.icon}
            </div>
            <h3 className="text-white font-semibold text-sm mb-1">
              {insight.title}
            </h3>
            <p className="text-slate-400 text-xs mb-3">{insight.description}</p>
            {insight.action && (
              <button className="text-xs font-semibold text-slate-300 hover:text-white transition-colors">
                {insight.action.label} →
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
