import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import React from 'react';

interface ClientCardHeaderProps {
  clientName: string;
  status?: 'active' | 'inactive' | 'pending' | 'archived';
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

const statusConfig = {
  active: { label: 'Ativo', bg: 'bg-emerald-900/40', border: 'border-emerald-700/60', text: 'text-emerald-300' },
  inactive: { label: 'Inativo', bg: 'bg-slate-700/40', border: 'border-slate-600/60', text: 'text-slate-300' },
  pending: { label: 'Pendente', bg: 'bg-amber-900/40', border: 'border-amber-700/60', text: 'text-amber-300' },
  archived: { label: 'Arquivado', bg: 'bg-red-900/40', border: 'border-red-700/60', text: 'text-red-300' },
};

export function ClientCardHeader({
  clientName,
  status = 'active',
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
  subtitle,
  actions,
  className = '',
}: ClientCardHeaderProps) {
  const statusInfo = statusConfig[status];

  return (
    <div className={`bg-gradient-to-r from-slate-900/60 via-slate-950/60 to-slate-900/60 border border-slate-700/50 rounded-xl sm:rounded-2xl lg:rounded-3xl p-3 sm:p-4 lg:p-6 shadow-lg shadow-blue-900/20 backdrop-blur-sm ${className}`}>
      {/* Navigation & Main Content */}
      <div className="flex items-start justify-between gap-2 sm:gap-3 lg:gap-4">
        {/* Left Navigation */}
        <button
          onClick={onPrevious}
          disabled={!hasPrevious}
          className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          aria-label="Anterior"
        >
          <ChevronLeft className="h-5 w-5 sm:h-6 lg:h-7 text-slate-400" />
        </button>

        {/* Client Info */}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold text-slate-50 truncate">
            {clientName}
          </h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-400 mt-1 truncate">
              {subtitle}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge
              variant="outline"
              className={`${statusInfo.bg} border ${statusInfo.border} ${statusInfo.text} text-xs sm:text-sm font-semibold`}
            >
              {statusInfo.label}
            </Badge>
          </div>
        </div>

        {/* Actions & Right Navigation */}
        <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 flex-shrink-0">
          {actions}
          <button
            onClick={onNext}
            disabled={!hasNext}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Próximo"
          >
            <ChevronRight className="h-5 w-5 sm:h-6 lg:h-7 text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
