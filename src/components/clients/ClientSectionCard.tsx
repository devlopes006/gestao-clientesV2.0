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
    <Card className={`border border-slate-700/50 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 bg-slate-900 ${className}`}>
      <CardHeader className="pb-2 sm:pb-3">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            {Icon && (
              <div className="p-1.5 sm:p-2 bg-blue-500/20 rounded-xl shadow-sm flex-shrink-0">
                <Icon className="h-4 w-4 sm:h-5 lg:h-6 text-blue-400" />
              </div>
            )}
            <CardTitle className="text-sm sm:text-base lg:text-lg font-bold text-white truncate">
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
