import { LucideIcon } from 'lucide-react';

interface NavTab {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface ClientNavigationTabsProps {
  tabs: NavTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function ClientNavigationTabs({
  tabs,
  activeTab,
  onTabChange,
  className = '',
}: ClientNavigationTabsProps) {
  return (
    <div className={`bg-gradient-to-r from-slate-900/40 via-slate-950/40 to-slate-900/40 border border-slate-700/50 rounded-xl sm:rounded-2xl overflow-hidden ${className}`}>
      <div className="flex overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 lg:px-6 py-2.5 sm:py-3 lg:py-4 text-xs sm:text-sm lg:text-base font-semibold whitespace-nowrap border-b-2 transition-all duration-200 ${isActive
                  ? 'border-blue-500 text-blue-300 bg-blue-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-800/20'
                }`}
            >
              <Icon className="h-4 w-4 sm:h-5 lg:h-6 flex-shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
