"use client";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { TaskFilters } from "@/features/tasks/components/TaskFilters";
import { TaskModal } from "@/features/tasks/components/TaskModal";
import { TaskStats as StatsCards } from "@/features/tasks/components/TaskStats";
import { useTasks } from "@/features/tasks/hooks/useTasks";
import { Task, TaskPriority, TaskStatus } from "@/features/tasks/types";
import { parseDateInput, toLocalISOString } from "@/lib/utils";
import type { DragEndEvent, DragStartEvent, UniqueIdentifier } from '@dnd-kit/core';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { AlertCircle, ListTodo, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (id: string) => void;
}

type StatusStyle = {
  bg: string
  border: string
  text: string
  dot: string
  badge: string
  header?: string
}

function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const { setNodeRef, listeners, attributes, isDragging } = useSortable({ id: task.id });

  // Cores sofisticadas por status
  const statusStyles: Record<TaskStatus, StatusStyle> = {
    'TODO': {
      bg: 'bg-slate-900',
      border: 'border-amber-500/30',
      text: 'text-white',
      dot: 'bg-amber-400',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    },
    'IN_PROGRESS': {
      bg: 'bg-slate-900',
      border: 'border-blue-500/30',
      text: 'text-white',
      dot: 'bg-blue-400',
      badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    },
    'DONE': {
      bg: 'bg-slate-900',
      border: 'border-emerald-500/30',
      text: 'text-white',
      dot: 'bg-emerald-400',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    },
    'REVIEW': {
      bg: 'bg-slate-900',
      border: 'border-purple-500/30',
      text: 'text-white',
      dot: 'bg-purple-400',
      badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    },
    'CANCELLED': {
      bg: 'bg-slate-900',
      border: 'border-slate-700/50',
      text: 'text-slate-300',
      dot: 'bg-slate-400',
      badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30'
    },
  };

  const style = statusStyles[task.status];

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`rounded-lg sm:rounded-xl p-2 sm:p-3 mb-1.5 sm:mb-2 shadow-md hover:shadow-xl transition-all duration-200 cursor-move border ${style.bg} ${style.border}${isDragging ? ' opacity-80 scale-95 ring-2 ring-blue-500 shadow-2xl' : ''}`}
      style={{ zIndex: isDragging ? 50 : undefined }}
    >
      {/* Header com título e ações - Mobile First */}
      <div className="flex items-start gap-1.5 sm:gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 sm:gap-1.5 mb-0.5 sm:mb-1">
            <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${style.dot} animate-pulse flex-shrink-0`} />
            <h4 className={`font-bold text-[10px] sm:text-xs line-clamp-2 ${style.text}`}>
              {task.title}
            </h4>
          </div>
          {task.description && (
            <p className="text-[9px] sm:text-xs text-slate-300 line-clamp-2 mt-1">
              {task.description}
            </p>
          )}
        </div>
        <div className="flex gap-0.5 shrink-0">
          <button
            type="button"
            aria-label="Editar tarefa"
            className="p-1 rounded hover:bg-blue-900/60 transition-colors group"
            onClick={e => { e.stopPropagation(); onEdit?.(task); }}
          >
            <Pencil className="w-3 h-3 text-blue-500 dark:text-blue-400 group-hover:scale-110 transition-transform" />
          </button>
          <button
            type="button"
            aria-label="Excluir tarefa"
            className="p-1 rounded hover:bg-red-900/60 transition-colors group"
            onClick={e => { e.stopPropagation(); onDelete?.(task.id); }}
          >
            <Trash2 className="w-3 h-3 text-red-500 dark:text-red-400 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      {/* Footer com badges - Mobile First */}
      <div className="flex items-center gap-1 flex-wrap">
        <span className={`text-[9px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-semibold border ${style.badge}`}>
          {task.priority === 'URGENT' ? 'Urgente' : task.priority === 'HIGH' ? 'Alta' : task.priority === 'MEDIUM' ? 'Média' : 'Baixa'}
        </span>
        {task.dueDate && (
          <span className={`text-[9px] sm:text-xs flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-slate-800 text-slate-200`}>
            <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="5" cy="5" r="4" />
            </svg>
            <span className="whitespace-nowrap">{task.dueDate}</span>
          </span>
        )}
      </div>
    </div>
  );
}

interface KanbanColumnProps {
  column: { id: TaskStatus; title: string; color: string };
  tasks: Task[];
  handleEdit: (task: Task) => void;
  handleDelete: (id: string) => void;
}

function KanbanColumn({ column, tasks, handleEdit, handleDelete }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  // Estilos sofisticados por coluna
  const columnStyles: Record<TaskStatus, StatusStyle> = {
    'TODO': {
      bg: 'bg-slate-900/50',
      border: 'border-amber-500/30',
      header: 'bg-gradient-to-r from-amber-500/20 to-amber-600/10',
      text: 'text-white',
      dot: 'bg-amber-400',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    },
    'IN_PROGRESS': {
      bg: 'bg-slate-900/50',
      border: 'border-blue-500/30',
      header: 'bg-gradient-to-r from-blue-500/20 to-blue-600/10',
      text: 'text-white',
      dot: 'bg-blue-400',
      badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    },
    'REVIEW': {
      bg: 'bg-slate-900/50',
      border: 'border-purple-500/30',
      header: 'bg-gradient-to-r from-purple-500/20 to-purple-600/10',
      text: 'text-white',
      dot: 'bg-purple-400',
      badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    },
    'DONE': {
      bg: 'bg-slate-900/50',
      border: 'border-emerald-500/30',
      header: 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/10',
      text: 'text-white',
      dot: 'bg-emerald-400',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    },
    'CANCELLED': {
      bg: 'bg-slate-900/50',
      border: 'border-slate-700/50',
      header: 'bg-gradient-to-r from-slate-800/50 to-slate-700/30',
      text: 'text-slate-300',
      dot: 'bg-slate-400',
      badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30'
    },
  };

  const style = columnStyles[column.id] || columnStyles['TODO'];

  return (
    <div ref={setNodeRef} className="h-full flex flex-col">
      <div
        className={`h-full rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl border transition-all duration-200 flex flex-col ${style.bg} ${style.border}${isOver ? ' ring-2 sm:ring-4 ring-blue-400 ring-offset-1 sm:ring-offset-2 ring-offset-slate-950 scale-[1.01] sm:scale-[1.02] shadow-xl sm:shadow-2xl' : ''}`}
      >
        {/* Header da coluna - Mobile First */}
        <div className={`${style.header ?? style.bg} rounded-t-xl sm:rounded-t-2xl p-2 sm:p-3 lg:p-4 border-b ${style.border}`}>
          <div className="flex items-center justify-between gap-1 sm:gap-2">
            <h3 className={`font-bold text-xs sm:text-sm lg:text-base ${style.text} flex items-center gap-1 sm:gap-1.5 truncate`}>
              {column.title}
            </h3>
            <span className={`text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${style.badge} shadow-sm flex-shrink-0`}>
              {tasks.length}
            </span>
          </div>
        </div>

        {/* Área de conteúdo - Mobile First */}
        <div className="flex-1 overflow-y-auto p-1.5 sm:p-2 lg:p-3 min-h-[180px] sm:min-h-[220px] lg:min-h-[280px]">
          <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.length === 0 ? (
              <div className="text-center py-6 sm:py-8 lg:py-12 flex flex-col items-center justify-center h-full">
                <div className={`w-10 sm:w-12 lg:w-16 h-10 sm:h-12 lg:h-16 mx-auto mb-1.5 sm:mb-2 lg:mb-3 rounded-full ${style.bg} border ${style.border} flex items-center justify-center flex-shrink-0`}>
                  <ListTodo className={`w-5 sm:w-6 lg:w-8 h-5 sm:h-6 lg:h-8 ${style.text} opacity-30`} />
                </div>
                <p className={`text-[10px] sm:text-xs lg:text-sm ${style.text} opacity-60 font-medium`}>
                  Nenhuma tarefa
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 sm:space-y-2">
                {tasks.map((task: Task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </SortableContext>
        </div>
      </div>
    </div>
  );
}

interface TasksPanelProps { clientId: string; initialTasks?: Task[]; orgId?: string }

export function TasksPanel({ clientId, initialTasks = [], orgId }: TasksPanelProps) {
  const { tasks, filtered, stats, isLoading, refetch, invalidate, search, setSearch, statusFilter, setStatusFilter, error } = useTasks({ clientId, initial: initialTasks })

  // Kanban columns
  const columns = [
    { id: 'TODO' as TaskStatus, title: 'A Fazer', color: 'bg-slate-100 dark:bg-slate-800' },
    { id: 'IN_PROGRESS' as TaskStatus, title: 'Em Progresso', color: 'bg-blue-100 dark:bg-blue-950/30' },
    { id: 'REVIEW' as TaskStatus, title: 'Em Revisão', color: 'bg-purple-100 dark:bg-purple-950/30' },
    { id: 'DONE' as TaskStatus, title: 'Concluído', color: 'bg-emerald-100 dark:bg-emerald-950/30' },
  ];

  // Drag and drop logic
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  // Dnd-kit sensors
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const filteredKanbanTasks = columns.map(col => ({
    ...col,
    tasks: filtered.filter(t => t.status === col.id)
  }));

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [form, setForm] = useState({ title: "", description: "", status: "TODO" as TaskStatus, priority: "MEDIUM" as TaskPriority, assignee: "", dueDate: "" })

  const resetForm = () => { setForm({ title: "", description: "", status: "TODO", priority: "MEDIUM", assignee: "", dueDate: "" }); setEditing(null) }
  const handleEdit = (task: Task) => { setEditing(task); setForm({ title: task.title, description: task.description || "", status: task.status, priority: task.priority, assignee: task.assignee || "", dueDate: task.dueDate || "" }); setIsModalOpen(true) }

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir tarefa?")) return
    try {
      const res = await fetch(`/api/clients/${clientId}/tasks?taskId=${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Falha ao excluir tarefa")
      await invalidate()
      toast.success("Tarefa excluída")
    } catch (err) {
      console.error(err)
      toast.error("Não foi possível excluir a tarefa")
    }
  }

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    try {
      const res = await fetch(`/api/clients/${clientId}/tasks?taskId=${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) })
      if (!res.ok) throw new Error("Falha ao atualizar status")
      await invalidate()
      toast.success("Status atualizado")
    } catch (err) {
      console.error(err)
      toast.error("Não foi possível atualizar o status")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { ...form, clientId, dueDate: form.dueDate ? toLocalISOString(parseDateInput(form.dueDate)) : null };
    if (editing) {
      try {
        const res = await fetch(`/api/clients/${clientId}/tasks?taskId=${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || errData.message || "Falha ao atualizar tarefa");
        }
        toast.success("Tarefa atualizada com sucesso");
        await invalidate();
        toast.success("Tarefa atualizada")
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao atualizar tarefa";
        console.error(err);
        toast.error("Não foi possível atualizar a tarefa");
      }
    } else {
      try {
        const res = await fetch(`/api/clients/${clientId}/tasks`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || errData.message || "Falha ao criar tarefa");
        }
        toast.success("Tarefa criada com sucesso");
        await invalidate();
        toast.success("Tarefa criada")
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao criar tarefa";
        console.error(err);
        toast.error("Não foi possível criar a tarefa");
      }
    }
    setIsModalOpen(false); resetForm();
  }


  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id);
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const activeTask = tasks.find((t: Task) => t.id === active.id);
    if (!activeTask) return;
    const overColumn = columns.find((c) => c.id === over.id);
    const newStatus = overColumn ? overColumn.id : activeTask.status;
    if (columns.some((c) => c.id === newStatus) && activeTask.status !== newStatus) {
      await handleStatusChange(activeTask.id, newStatus as TaskStatus);
    }
  };

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

  if (isLoading) {
    return (
      <div className="page-background">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <Spinner size="lg" variant="primary" />
              <p className="text-sm text-slate-600 dark:text-slate-400">Carregando tarefas...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-background">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div role="alert" aria-live="polite">
            <div className="flex items-start gap-3 rounded-xl border border-red-800 bg-red-950 p-6 shadow-lg">
              <AlertCircle className="h-5 w-5 text-red-300 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-red-100">Erro ao carregar tarefas</p>
                <p className="text-xs text-red-200">
                  {error.message} {error.status ? `(status ${error.status})` : ''}
                </p>
                {(error.body && typeof error.body === 'object') ? (
                  <pre className="mt-2 max-h-40 overflow-auto text-xs text-red-200 bg-red-900 p-2 rounded border border-red-800">
                    {JSON.stringify(error.body as Record<string, unknown>, null, 2)}
                  </pre>
                ) : null}
                <Button size="sm" variant="outline" onClick={() => refetch()} className="mt-2 bg-red-950 border-red-800 text-red-100 hover:bg-red-900">Tentar novamente</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-4 sm:space-y-6">
        {/* Header - Mobile First */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 text-transparent bg-clip-text">Tarefas</h1>
            <p className="text-sm text-slate-400">Gerencie as tarefas deste cliente</p>
          </div>
          <Button
            className="w-full sm:w-auto gap-2 font-semibold bg-blue-600 hover:bg-blue-500 text-white"
            size="default"
            onClick={() => { resetForm(); setIsModalOpen(true) }}
          >
            <Plus className="h-4 w-4" /> Nova Tarefa
          </Button>
        </div>

        {/* Stats - Mobile First Grid */}
        <div>
          <StatsCards stats={stats} />
        </div>

        {/* Filters - Mobile First */}
        <div className="space-y-2 sm:space-y-3">
          <TaskFilters statusFilter={statusFilter} setStatusFilter={setStatusFilter} search={search} setSearch={setSearch} />
        </div>

        {/* Kanban Board - Mobile Vertical, Desktop Grid */}
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="w-full">
            <div className="flex flex-col gap-2 sm:gap-3 md:grid md:grid-cols-2 lg:grid-cols-4 lg:gap-4">
              {filteredKanbanTasks.map(col => (
                <div key={col.id} className="w-full">
                  <KanbanColumn
                    column={col}
                    tasks={col.tasks}
                    handleEdit={handleEdit}
                    handleDelete={handleDelete}
                  />
                </div>
              ))}
            </div>
          </div>
          <DragOverlay>
            {activeTask ? (
              <div className="scale-110 drop-shadow-2xl">
                <TaskCard task={activeTask} onEdit={() => { }} onDelete={() => { }} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        <TaskModal open={isModalOpen} onClose={() => setIsModalOpen(false)} editing={editing} orgId={orgId} form={form} setForm={setForm} onSubmit={handleSubmit} />
      </div>
    </div>
  )
}