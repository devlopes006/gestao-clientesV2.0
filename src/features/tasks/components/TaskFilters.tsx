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
    <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between p-4 rounded-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-2 border-slate-200 dark:border-slate-700 shadow-lg">
      <div className="flex gap-2 flex-wrap">
        {(['all', 'todo', 'in-progress', 'done'] as const).map(s => (
          <Button
            key={s}
            size="sm"
            variant={statusFilter === s ? 'default' : 'outline'}
            onClick={() => setStatusFilter(s)}
          >
            {s === 'all' ? 'Todas' : s === 'todo' ? 'A Fazer' : s === 'in-progress' ? 'Em Progresso' : 'Concluídas'}
          </Button>
        ))}
      </div>
      <div className="relative md:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Buscar tarefas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700"
        />
      </div>
    </div>
  );
}
