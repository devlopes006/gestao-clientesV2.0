"use client";

import { DashboardNotes } from '@/features/dashboard/components/DashboardNotes';
import { MonthlyCalendar } from '@/features/dashboard/components/MonthlyCalendar';
import { AppRole } from '@/lib/permissions';
import { DashboardData } from '@/modules/dashboard/domain/schema';
import { Calendar, CheckCircle2, ListTodo, Users } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

interface DashboardClientProps { initialData: DashboardData; initialMonthKey: string; role: AppRole | null }

function formatDate(date?: Date | null) {
  if (!date) return 'Sem prazo';
  return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function statusLabel(status: string) {
  const normalized = status.toUpperCase().replace(/-/g, '_');
  const map: Record<string, string> = {
    TODO: 'Pendente',
    PENDING: 'Pendente',
    IN_PROGRESS: 'Em progresso',
    REVIEW: 'Revisão',
    DONE: 'Concluída',
    CANCELLED: 'Cancelada',
  };
  return map[normalized] ?? status;
}

function priorityLabel(priority: string) {
  const normalized = priority.toUpperCase();
  const map: Record<string, string> = {
    LOW: 'Baixa',
    MEDIUM: 'Média',
    HIGH: 'Alta',
    URGENT: 'Urgente',
  };
  return map[normalized] ?? priority;
}

export function DashboardClient({ initialData, initialMonthKey, role }: DashboardClientProps) {
  const searchParams = useSearchParams();
  const [data, setData] = useState<DashboardData | null>(initialData);
  const [monthKey, setMonthKey] = useState(initialMonthKey);
  const [loadingMonth, setLoadingMonth] = useState(false);

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  useEffect(() => {
    const m = searchParams?.get('month');
    if (m && m !== monthKey) {
      setMonthKey(m);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (!monthKey || !data) return;
    setLoadingMonth(true);
    fetch(`/api/dashboard?month=${encodeURIComponent(monthKey)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject('Falha ao atualizar mês')))
      .then((j) => setData(j))
      .catch(() => {})
      .finally(() => setLoadingMonth(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthKey]);

  if (!data) {
    return <div className="p-8 text-sm text-slate-700">Falha ao carregar</div>;
  }

  const tasks = data.tasks;
  const clients = data.clients;
  const metrics = data.metrics;
  const totalClients = metrics?.totals.clients ?? clients.length;
  const totalTasks = metrics?.totals.tasks ?? tasks.length;

  const isPendingStatus = (s: string) => {
    const normalized = s.toUpperCase().replace(/-/g, '_');
    return normalized === 'TODO' || normalized === 'PENDING';
  };
  const isInProgressStatus = (s: string) => {
    const normalized = s.toUpperCase().replace(/-/g, '_');
    return normalized === 'IN_PROGRESS' || normalized === 'REVIEW';
  };
  const isDoneStatus = (s: string) => {
    const normalized = s.toUpperCase().replace(/-/g, '_');
    return normalized === 'DONE' || normalized === 'CANCELLED';
  };

  const pendingTasks = tasks.filter((t) => isPendingStatus(t.status));
  const inProgressTasks = tasks.filter((t) => isInProgressStatus(t.status));
  const completedTasks = tasks.filter((t) => isDoneStatus(t.status));

  const totalPendingTasks = metrics?.taskAggByClient
    ? Object.values(metrics.taskAggByClient).reduce((sum, agg) => sum + agg.pending, 0)
    : pendingTasks.length;
  const totalInProgressTasks = metrics?.taskAggByClient
    ? Object.values(metrics.taskAggByClient).reduce((sum, agg) => sum + agg.inProgress, 0)
    : inProgressTasks.length;
  const totalCompletedTasks = metrics?.taskAggByClient
    ? Object.values(metrics.taskAggByClient).reduce((sum, agg) => sum + agg.done, 0)
    : completedTasks.length;

  const priorities = useMemo(() => pendingTasks.slice(0, 6), [pendingTasks]);
  const completedPercent = totalTasks > 0 ? Math.round((totalCompletedTasks / totalTasks) * 100) : 0;

  const monthLabel = (() => {
    const [year, month] = monthKey.split('-');
    if (!month) return monthKey;
    return `${month}/${year}`;
  })();

  return (
    <main className="min-h-screen bg-neutral-50 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Painel</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold">Visão geral</h1>
              <p className="text-sm text-slate-600">Resumo rápido de clientes, tarefas e agenda.</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar className="h-4 w-4" />
              <span>Mês: {monthLabel}</span>
              {loadingMonth && <span className="text-xs text-slate-500">atualizando...</span>}
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[{ label: 'Clientes ativos', value: totalClients, icon: Users }, { label: 'Tarefas pendentes', value: totalPendingTasks, icon: ListTodo }, { label: 'Em progresso', value: totalInProgressTasks, icon: Calendar }, { label: 'Concluídas', value: `${completedPercent}%`, icon: CheckCircle2 }].map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-lg border bg-slate-900 p-4 shadow-sm">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">{item.label}</p>
                <p className="text-2xl font-semibold text-slate-900">{item.value}</p>
              </div>
              <item.icon className="h-5 w-5 text-slate-700" />
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-3">
            <div className="rounded-lg border bg-slate-900 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Calendário</h2>
                  <p className="text-sm text-slate-600">Compromissos e entregas do mês.</p>
                </div>
              </div>
              {data.activities && (
                <div className="mt-3">
                  <MonthlyCalendar
                    key={monthKey}
                    activities={data.activities.map((a) => ({
                      ...a,
                      description: a.description === null ? undefined : a.description,
                    })) as typeof data.activities}
                    initialMonth={(() => {
                      const [y, m] = monthKey.split('-').map(Number);
                      return new Date(y, (m || 1) - 1, 1);
                    })()}
                    onMonthChange={(d) => {
                      const mm = String(d.getMonth() + 1).padStart(2, '0');
                      const value = `${d.getFullYear()}-${mm}`;
                      setMonthKey(value);
                      try {
                        const url = new URL(window.location.href);
                        url.searchParams.set('month', value);
                        window.history.replaceState(null, '', url.toString());
                      } catch {
                        /* noop */
                      }
                    }}
                    userRole={role}
                  />
                </div>
              )}
            </div>

            <div className="rounded-lg border bg-slate-900 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Prioridades</h2>
                <span className="text-xs text-slate-600">{priorities.length} selecionadas</span>
              </div>
              <div className="mt-3 space-y-3">
                {priorities.length === 0 && <p className="text-sm text-slate-600">Nenhuma tarefa pendente.</p>}
                {priorities.map((task) => (
                  <div key={task.id} className="rounded-md border border-slate-200 bg-slate-900/60 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-slate-900">{task.title}</p>
                      <span className="text-xs font-semibold text-slate-600">{priorityLabel(task.priority)}</span>
                    </div>
                    <p className="text-xs text-slate-600">Cliente: {task.client.name}</p>
                    <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-600">
                      <span>Status: {statusLabel(task.status)}</span>
                      <span>Prazo: {formatDate(task.dueDate)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-lg border bg-slate-900 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Notas rápidas</h2>
              </div>
              <div className="mt-3">
                <DashboardNotes
                  initialNotes={(data.notes || []).map((note) => {
                    const n = note as unknown as { title?: string; color?: string; position?: number };
                    return {
                      id: note.id,
                      title: n.title ?? '',
                      content: note.content,
                      color: n.color ?? 'yellow',
                      position: n.position ?? 0,
                      createdAt: note.createdAt,
                      updatedAt: note.updatedAt || note.createdAt,
                    };
                  })}
                />
              </div>
            </div>

            <div className="rounded-lg border bg-slate-900 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Clientes em foco</h2>
                <span className="text-xs text-slate-600">{clients.length} clientes</span>
              </div>
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                {metrics?.mostPendingClient ? (
                  <p>
                    Mais pendências: <span className="font-semibold">{metrics.mostPendingClient.name}</span> ({metrics.mostPendingClient.pending} tarefas)
                  </p>
                ) : (
                  <p>Nenhum cliente com pendências altas.</p>
                )}
                {metrics?.mostUrgentClient && (
                  <p>
                    Urgência: <span className="font-semibold">{metrics.mostUrgentClient.name}</span> ({metrics.mostUrgentClient.urgent} urgentes)
                  </p>
                )}
                {metrics?.urgentTasks?.length ? (
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-800">Tarefas urgentes</p>
                    {metrics.urgentTasks.slice(0, 3).map((task) => (
                      <div key={task.id} className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs">
                        <p className="font-medium text-slate-900">{task.title}</p>
                        <p className="text-slate-700">Cliente: {task.client.name}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-lg border bg-slate-900 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Lista de clientes</h2>
            <span className="text-xs text-slate-600">Últimos cadastrados</span>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            {clients.slice(0, 6).map((client) => (
              <div key={client.id} className="rounded-md border border-slate-200 bg-slate-900/60 px-3 py-2">
                <p className="font-semibold text-slate-900">{client.name}</p>
                <p className="text-xs text-slate-600">{client.email || 'Sem email'}</p>
                <p className="text-xs text-slate-600">Criado em {formatDate(client.createdAt)}</p>
              </div>
            ))}
            {clients.length === 0 && <p className="text-sm text-slate-600">Nenhum cliente cadastrado.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
