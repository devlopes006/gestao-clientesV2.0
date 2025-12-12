import { DollarSign, TrendingDown, TrendingUp } from 'lucide-react';

type FinanceCardType = 'income' | 'expense' | 'balance' | 'forecast';

interface FinanceCardProps {
  type: FinanceCardType;
  label: string;
  amount: string | number;
  currency?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  period?: string;
  description?: string;
  onClick?: () => void;
}

const typeConfig = {
  income: {
    bg: 'from-emerald-950/40 to-emerald-950/30',
    border: 'border-emerald-700/50',
    icon: 'text-emerald-400',
    iconBg: 'bg-emerald-900/40',
  },
  expense: {
    bg: 'from-red-950/40 to-red-950/30',
    border: 'border-red-700/50',
    icon: 'text-red-400',
    iconBg: 'bg-red-900/40',
  },
  balance: {
    bg: 'from-blue-950/40 to-blue-950/30',
    border: 'border-blue-700/50',
    icon: 'text-blue-400',
    iconBg: 'bg-blue-900/40',
  },
  forecast: {
    bg: 'from-amber-950/40 to-amber-950/30',
    border: 'border-amber-700/50',
    icon: 'text-amber-400',
    iconBg: 'bg-amber-900/40',
  },
};

export function FinanceCard({
  type,
  label,
  amount,
  currency = 'R$',
  trend,
  trendValue,
  period,
  description,
  onClick,
}: FinanceCardProps) {
  const config = typeConfig[type];
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null;

  return (
    <div
      onClick={onClick}
      className={`group border ${config.border} bg-gradient-to-br ${config.bg} rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-5 hover:border-slate-600/80 hover:bg-slate-900/50 transition-all duration-200 cursor-pointer`}
    >
      <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
        <div className={`p-2 sm:p-2.5 rounded-lg flex-shrink-0 ${config.iconBg}`}>
          <DollarSign className={`h-5 w-5 sm:h-6 lg:h-7 ${config.icon}`} />
        </div>

        {TrendIcon && trendValue && (
          <div className={`flex items-center gap-0.5 text-xs sm:text-sm font-semibold ${trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400'
            }`}>
            <TrendIcon className="h-4 w-4" />
            {trendValue}
          </div>
        )}
      </div>

      <p className="text-xs sm:text-sm text-slate-400 font-medium mb-1">
        {label}
      </p>

      <h3 className="text-lg sm:text-2xl lg:text-3xl font-bold text-white group-hover:text-blue-300 transition-colors">
        {currency} {amount}
      </h3>

      {(period || description) && (
        <p className="text-xs sm:text-sm text-slate-400 mt-2">
          {period && <span>{period}</span>}
          {period && description && ' • '}
          {description && <span>{description}</span>}
        </p>
      )}
    </div>
  );
}
