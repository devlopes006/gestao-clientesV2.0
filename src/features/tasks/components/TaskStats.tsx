"use client";
import { CheckCircle2, Clock, Flag, ListTodo, LucideIcon } from "lucide-react";
import type { TaskStats } from "../types";

interface TaskStatsProps { stats: TaskStats }

type KPIColor = 'blue' | 'emerald' | 'purple' | 'amber';

interface TaskKPICardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  description?: string;
  color: KPIColor;
}

const colorMap: Record<KPIColor, { border: string; bg: string; icon: string; text: string }> = {
  blue: {
    border: 'border-blue-500/30',
    bg: 'from-blue-500/20 to-blue-600/10',
    icon: 'bg-blue-500/20 text-blue-400',
    text: 'text-blue-300',
  },
  emerald: {
    border: 'border-emerald-500/30',
    bg: 'from-emerald-500/20 to-emerald-600/10',
    icon: 'bg-emerald-500/20 text-emerald-400',
    text: 'text-emerald-300',
  },
  purple: {
    border: 'border-purple-500/30',
    bg: 'from-purple-500/20 to-purple-600/10',
    icon: 'bg-purple-500/20 text-purple-400',
    text: 'text-purple-300',
  },
  amber: {
    border: 'border-amber-500/30',
    bg: 'from-amber-500/20 to-amber-600/10',
    icon: 'bg-amber-500/20 text-amber-400',
    text: 'text-amber-300',
  },
};

function TaskKPICard({ icon: Icon, label, value, description, color }: TaskKPICardProps) {
  const colors = colorMap[color];

  return (
    <div className={`group relative overflow-hidden border ${colors.border} bg-gradient-to-br ${colors.bg} rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm cursor-default min-w-0`}>
      <div className="p-3 sm:p-4 lg:p-5 h-full">
        <div className="flex items-center gap-2 sm:gap-2.5 mb-1.5 sm:mb-2 min-w-0">
          <div className={`p-1.5 sm:p-2 ${colors.icon} rounded-lg group-hover:scale-105 transition-transform shadow-sm flex-shrink-0`}>
            <Icon className="h-4 w-4 sm:h-5 lg:h-6" />
          </div>
          <div className={`text-xl sm:text-2xl lg:text-3xl font-bold ${colors.text} truncate`}>
            {value}
          </div>
        </div>
        <h3 className="text-xs sm:text-sm font-medium text-slate-400 leading-tight truncate mb-0.5">
          {label}
        </h3>
        {description && (
          <p className="text-xs text-slate-500 truncate">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

export function TaskStats({ stats }: TaskStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
      <TaskKPICard
        color="blue"
        icon={ListTodo}
        value={stats.total}
        label="Total de Tarefas"
        description="No pipeline"
      />
      <TaskKPICard
        color="amber"
        icon={Clock}
        value={stats.todo}
        label="A Fazer"
        description="Pendentes"
      />
      <TaskKPICard
        color="purple"
        icon={Flag}
        value={stats.doing}
        label="Em Progresso"
        description="Ativas agora"
      />
      <TaskKPICard
        color="emerald"
        icon={CheckCircle2}
        value={stats.done}
        label="Concluídas"
        description={stats.total > 0 ? `${Math.round((stats.done / stats.total) * 100)}% completo` : "0% completo"}
      />
    </div>
  );
}
