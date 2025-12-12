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
  green: {
    border: 'border-green-500/30',
    bg: 'from-green-500/20 to-green-600/10',
    icon: 'bg-green-500/20 text-green-400',
    text: 'text-green-300',
  },
  purple: {
    border: 'border-purple-500/30',
    bg: 'from-purple-500/20 to-purple-600/10',
    icon: 'bg-purple-500/20 text-purple-400',
    text: 'text-purple-300',
  },
  orange: {
    border: 'border-orange-500/30',
    bg: 'from-orange-500/20 to-orange-600/10',
    icon: 'bg-orange-500/20 text-orange-400',
    text: 'text-orange-300',
  },
  amber: {
    border: 'border-amber-500/30',
    bg: 'from-amber-500/20 to-amber-600/10',
    icon: 'bg-amber-500/20 text-amber-400',
    text: 'text-amber-300',
  },
  red: {
    border: 'border-red-500/30',
    bg: 'from-red-500/20 to-red-600/10',
    icon: 'bg-red-500/20 text-red-400',
    text: 'text-red-300',
  },
  cyan: {
    border: 'border-cyan-500/30',
    bg: 'from-cyan-500/20 to-cyan-600/10',
    icon: 'bg-cyan-500/20 text-cyan-400',
    text: 'text-cyan-300',
  },
  indigo: {
    border: 'border-indigo-500/30',
    bg: 'from-indigo-500/20 to-indigo-600/10',
    icon: 'bg-indigo-500/20 text-indigo-400',
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
    <div className={`group relative overflow-hidden border ${colors.border} bg-gradient-to-br ${colors.bg} rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm cursor-default min-w-0`}>
      <div className="p-2 sm:p-3 lg:p-4 h-full">
        <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-1.5 lg:mb-2 min-w-0">
          <div className={`p-1 sm:p-1.5 lg:p-2 ${colors.icon} rounded sm:rounded-lg group-hover:scale-105 transition-transform shadow-sm flex-shrink-0`}>
            <Icon className="h-4 w-4 sm:h-5 lg:h-6" />
          </div>
          <div className={`text-base sm:text-2xl lg:text-3xl font-bold ${colors.text} truncate`}>
            {value}
          </div>
        </div>
        <h3 className={`text-xs sm:text-sm font-medium text-slate-400 leading-tight truncate`}>
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
