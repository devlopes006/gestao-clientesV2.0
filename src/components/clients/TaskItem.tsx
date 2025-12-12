import { Badge } from '@/components/ui/badge';
import { AlertCircle, Check, Clock } from 'lucide-react';

interface TaskItemProps {
  id: string;
  title: string;
  description?: string;
  status: 'completed' | 'pending' | 'overdue';
  dueDate?: string;
  assignee?: string;
  priority?: 'high' | 'medium' | 'low';
  onClick?: () => void;
}

const statusConfig = {
  completed: { icon: Check, bg: 'bg-emerald-950/30', border: 'border-emerald-700/50', text: 'text-emerald-300', label: 'Concluída' },
  pending: { icon: Clock, bg: 'bg-blue-950/30', border: 'border-blue-700/50', text: 'text-blue-300', label: 'Pendente' },
  overdue: { icon: AlertCircle, bg: 'bg-red-950/30', border: 'border-red-700/50', text: 'text-red-300', label: 'Atrasada' },
};

const priorityConfig = {
  high: { bg: 'bg-red-900/40', border: 'border-red-700/60', text: 'text-red-300', label: 'Alta' },
  medium: { bg: 'bg-amber-900/40', border: 'border-amber-700/60', text: 'text-amber-300', label: 'Média' },
  low: { bg: 'bg-blue-900/40', border: 'border-blue-700/60', text: 'text-blue-300', label: 'Baixa' },
};

export function TaskItem({ id, title, description, status, dueDate, assignee, priority = 'medium', onClick }: TaskItemProps) {
  const statusInfo = statusConfig[status];
  const StatusIcon = statusInfo.icon;
  const priorityInfo = priority ? priorityConfig[priority] : null;

  return (
    <div
      onClick={onClick}
      className="group border border-slate-700/50 bg-gradient-to-br from-slate-900/40 to-slate-950/40 rounded-lg sm:rounded-xl p-2.5 sm:p-3 lg:p-4 hover:border-slate-600/80 hover:bg-slate-900/50 transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-start gap-2 sm:gap-3">
        <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${statusInfo.bg} border ${statusInfo.border}`}>
          <StatusIcon className={`h-4 w-4 sm:h-5 lg:h-6 ${statusInfo.text}`} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-slate-50 group-hover:text-blue-300 transition-colors truncate">
            {title}
          </h3>
          {description && (
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5 line-clamp-2">
              {description}
            </p>
          )}

          <div className="flex items-center gap-1.5 sm:gap-2 mt-2 flex-wrap">
            <Badge variant="outline" className={`${statusInfo.bg} border ${statusInfo.border} ${statusInfo.text} text-xs font-semibold`}>
              {statusInfo.label}
            </Badge>
            {priority && (
              <Badge variant="outline" className={`${priorityInfo!.bg} border ${priorityInfo!.border} ${priorityInfo!.text} text-xs font-semibold`}>
                {priorityInfo!.label}
              </Badge>
            )}
            {dueDate && (
              <span className="text-xs text-slate-400">
                Vence: {dueDate}
              </span>
            )}
          </div>

          {assignee && (
            <p className="text-xs text-slate-400 mt-1">
              Atribuído a: <span className="text-slate-300">{assignee}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
