"use client";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { TaskStatus } from '../types';

interface TaskFiltersProps {
  statusFilter: TaskStatus | 'all';
  setStatusFilter: (s: TaskStatus | 'all') => void;
  search: string;
  setSearch: (s: string) => void;
}

export function TaskFilters({ statusFilter, setStatusFilter, search, setSearch }: TaskFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between p-4 sm:p-6 rounded-xl bg-slate-900 border border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex gap-2 flex-wrap">
        {(['all', 'TODO', 'IN_PROGRESS', 'DONE'] as const).map(s => (
          <Button
            key={s}
            size="sm"
            variant={statusFilter === s ? 'default' : 'outline'}
            onClick={() => setStatusFilter(s)}
          >
            {s === 'all' ? 'Todas' : s === 'TODO' ? 'A Fazer' : s === 'IN_PROGRESS' ? 'Em Progresso' : 'Concluídas'}
          </Button>
        ))}
      </div>
      <div className="relative md:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Buscar tarefas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-slate-800 border border-slate-700 text-white placeholder:text-slate-400 focus:border-blue-500"
        />
      </div>
    </div>
  );
}
