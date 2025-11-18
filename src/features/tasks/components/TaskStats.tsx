"use client";
import { KpiCard, KpiGrid } from "@/components/ui/kpi-card";
import { CheckCircle2, Clock, Flag, ListTodo } from "lucide-react";
import type { TaskStats } from "../types";

interface TaskStatsProps { stats: TaskStats }

export function TaskStats({ stats }: TaskStatsProps) {
  return (
    <KpiGrid columns={4}>
      <KpiCard
        variant="blue"
        icon={ListTodo}
        value={stats.total}
        label="Total de Tarefas"
        description="No pipeline"
      />
      <KpiCard
        variant="amber"
        icon={Clock}
        value={stats.todo}
        label="A Fazer"
        description="Pendentes"
      />
      <KpiCard
        variant="purple"
        icon={Flag}
        value={stats.doing}
        label="Em Progresso"
        description="Ativas agora"
      />
      <KpiCard
        variant="emerald"
        icon={CheckCircle2}
        value={stats.done}
        label="Concluídas"
        description={stats.total > 0 ? `${Math.round((stats.done / stats.total) * 100)}% completo` : "0% completo"}
        progress={stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0}
      />
    </KpiGrid>
  );
}
