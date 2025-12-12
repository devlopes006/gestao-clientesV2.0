import React from 'react';

interface ClientPageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function ClientPageLayout({ children, className = '' }: ClientPageLayoutProps) {
  return (
    <main className={`min-h-screen bg-gradient-to-br from-slate-900/95 via-slate-950/98 to-slate-900/95 p-4 sm:p-6 lg:p-8 ${className}`}>
      <div className="max-w-7xl mx-auto space-y-1.5 sm:space-y-2 lg:space-y-3">
        {children}
      </div>
    </main>
  );
}
