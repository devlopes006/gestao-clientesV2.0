"use client";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAssignees } from '@/features/tasks/hooks/useAssignees';
import { Sparkles, X } from 'lucide-react';
import { Task, TaskPriority, TaskStatus } from '../types';

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  editing: Task | null;
  orgId?: string;
  form: {
    title: string; description: string; status: TaskStatus; priority: TaskPriority; assignee: string; dueDate: string;
  };
  setForm: (f: TaskModalProps['form']) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function TaskModal({ open, onClose, editing, orgId, form, setForm, onSubmit }: TaskModalProps) {
  const { assignees, loading: loadingAssignees } = useAssignees(orgId);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto border border-slate-700/50" onClick={(e) => e.stopPropagation()}>
        {/* Header com gradiente escuro */}
        <div className="relative p-6 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 rounded-t-2xl border-b border-slate-700/50">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 rounded-t-2xl" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10">
                <Sparkles className="h-5 w-5 text-white" aria-hidden />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{editing ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
                <p className="text-sm text-blue-100 mt-1">Defina título, prioridade, prazo e descrição</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 shrink-0" onClick={onClose}>
              <X className="h-5 w-5" aria-hidden />
            </Button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-semibold text-slate-200">Título da Tarefa *</Label>
            <Input
              id="title"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex: Criar landing page"
              className="border border-slate-700 bg-slate-800 text-white placeholder:text-slate-400 focus:border-blue-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold text-slate-200">Descrição</Label>
            <Textarea
              id="description"
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Detalhes sobre a tarefa..."
              className="border border-slate-700 bg-slate-800 text-white placeholder:text-slate-400 focus:border-blue-500 resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignee" className="text-sm font-semibold text-slate-200">Responsável</Label>
            {loadingAssignees ? (
              <div className="border border-slate-700 rounded-md p-2 text-slate-400 text-sm bg-slate-800">
                Carregando responsáveis...
              </div>
            ) : assignees.length > 0 ? (
              <Select value={form.assignee || "none"} onValueChange={(value) => setForm({ ...form, assignee: value === "none" ? "" : value })}>
                <SelectTrigger className="border border-slate-700 bg-slate-900 text-white">
                  <SelectValue placeholder="Selecione um responsável" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem atribuição</SelectItem>
                  {assignees.map((assignee) => (
                    <SelectItem key={assignee.id} value={assignee.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{assignee.name}</span>
                        <span className="text-xs text-slate-500 ml-2">
                          {assignee.role === 'OWNER' ? '👑 Owner' : '👤 Staff'}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="border border-slate-700 rounded-md p-2 text-slate-400 text-sm bg-slate-800">
                Nenhum responsável cadastrado
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-semibold text-slate-200">Status *</Label>
              <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value as TaskStatus })}>
                <SelectTrigger className="border border-slate-700 bg-slate-800 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODO">A Fazer</SelectItem>
                  <SelectItem value="IN_PROGRESS">Em Progresso</SelectItem>
                  <SelectItem value="DONE">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority" className="text-sm font-semibold text-slate-200">Prioridade *</Label>
              <Select value={form.priority} onValueChange={(value) => setForm({ ...form, priority: value as TaskPriority })}>
                <SelectTrigger className="border border-slate-700 bg-slate-800 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Baixa</SelectItem>
                  <SelectItem value="MEDIUM">Média</SelectItem>
                  <SelectItem value="HIGH">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate" className="text-sm font-semibold text-slate-200">Prazo</Label>
              <Input
                id="dueDate"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="border border-slate-700 bg-slate-800 text-white focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/50">
            <Button type="button" variant="outline" onClick={onClose} size="lg" className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
              Cancelar
            </Button>
            <Button type="submit" size="lg" className="bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/60 shadow">
              {editing ? 'Atualizar Tarefa' : 'Criar Tarefa'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
