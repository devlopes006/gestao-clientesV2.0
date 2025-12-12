import { LucideIcon } from 'lucide-react';

type KPIColor = 'blue' | 'emerald' | 'purple' | 'orange' | 'amber' | 'red' | 'green' | 'cyan' | 'indigo';

interface ClientKPICardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color?: KPIColor;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

const colorMap: Record<KPIColor, { border: string; bg: string; icon: string; text: string }> = {
  blue: {
    border: 'border-blue-700/50',
    bg: 'from-blue-950/40 to-blue-950/30',
    icon: 'bg-blue-900/40 text-blue-400',
    text: 'text-blue-300',
  },
  emerald: {
    border: 'border-emerald-700/50',
    bg: 'from-emerald-950/40 to-emerald-950/30',
    icon: 'bg-emerald-900/40 text-emerald-400',
    text: 'text-emerald-300',
  },
  green: {
    border: 'border-green-700/50',
    bg: 'from-green-950/40 to-green-950/30',
    icon: 'bg-green-900/40 text-green-400',
    text: 'text-green-300',
  },
  purple: {
    border: 'border-purple-700/50',
    bg: 'from-purple-950/40 to-purple-950/30',
    icon: 'bg-purple-900/40 text-purple-400',
    text: 'text-purple-300',
  },
  orange: {
    border: 'border-orange-700/50',
    bg: 'from-orange-950/40 to-orange-950/30',
    icon: 'bg-orange-900/40 text-orange-400',
    text: 'text-orange-300',
  },
  amber: {
    border: 'border-amber-700/50',
    bg: 'from-amber-950/40 to-amber-950/30',
    icon: 'bg-amber-900/40 text-amber-400',
    text: 'text-amber-300',
  },
  red: {
    border: 'border-red-700/50',
    bg: 'from-red-950/40 to-red-950/30',
    icon: 'bg-red-900/40 text-red-400',
    text: 'text-red-300',
  },
  cyan: {
    border: 'border-cyan-700/50',
    bg: 'from-cyan-950/40 to-cyan-950/30',
    icon: 'bg-cyan-900/40 text-cyan-400',
    text: 'text-cyan-300',
  },
  indigo: {
    border: 'border-indigo-700/50',
    bg: 'from-indigo-950/40 to-indigo-950/30',
    icon: 'bg-indigo-900/40 text-indigo-400',
    text: 'text-indigo-300',
  },
};

export function ClientKPICard({
  icon: Icon,
  label,
  value,
  color = 'blue',
  trend,
  trendValue,
}: ClientKPICardProps) {
  const colors = colorMap[color];

  return (
    <div className={`group relative overflow-hidden border ${colors.border} bg-gradient-to-br ${colors.bg} rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg shadow-blue-900/20 hover:shadow-xl hover:shadow-blue-500/20 transition-all duration-300 backdrop-blur-sm cursor-default min-w-0`}>
      <div className="p-2 sm:p-3 lg:p-4 h-full">
        <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-1.5 lg:mb-2 min-w-0">
          <div className={`p-1 sm:p-1.5 lg:p-2 ${colors.icon} rounded sm:rounded-lg group-hover:scale-105 transition-transform shadow-sm flex-shrink-0`}>
            <Icon className="h-4 w-4 sm:h-5 lg:h-6" />
          </div>
          <div className={`text-base sm:text-2xl lg:text-3xl font-bold ${colors.text} truncate`}>
            {value}
          </div>
        </div>
        <h3 className={`text-xs sm:text-sm font-semibold text-slate-300 leading-tight truncate`}>
          {label}
        </h3>
        {trend && trendValue && (
          <p className={`text-xs mt-1 font-medium ${trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400'
            }`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
          </p>
        )}
      </div>
    </div>
  );
}
