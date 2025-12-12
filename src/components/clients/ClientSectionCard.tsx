import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import React from 'react';

interface ClientSectionCardProps {
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function ClientSectionCard({
  title,
  icon: Icon,
  children,
  action,
  className = '',
}: ClientSectionCardProps) {
  return (
    <Card className={`border border-slate-700/80 rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-lg shadow-blue-900/20 hover:shadow-xl transition-all duration-300 backdrop-blur-sm bg-gradient-to-br from-slate-900/50 via-slate-950/50 to-slate-900/50 ${className}`}>
      <CardHeader className="pb-2 sm:pb-3">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            {Icon && (
              <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-950/50 to-blue-950/30 rounded-lg sm:rounded-xl lg:rounded-2xl shadow-sm flex-shrink-0">
                <Icon className="h-4 w-4 sm:h-5 lg:h-6 text-blue-400" />
              </div>
            )}
            <CardTitle className="text-sm sm:text-base lg:text-lg font-bold text-slate-50 truncate">
              {title}
            </CardTitle>
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-3 lg:px-4 pb-2 sm:pb-3 lg:pb-4">
        {children}
      </CardContent>
    </Card>
  );
}
