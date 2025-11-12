'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { CalendarDays, CheckCircle2, Clock, Edit, Flag, ListTodo, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

type TaskStatus = 'todo' | 'in-progress' | 'done'
type TaskPriority = 'low' | 'medium' | 'high'

interface TaskItem {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  assignee?: string
  dueDate?: string // ISO date string
  createdAt: Date
}

interface TasksManagerProps {
  clientId: string
  initialTasks?: TaskItem[]
}

export function TasksManager({ clientId, initialTasks = [] }: TasksManagerProps) {
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing] = useState<TaskItem | null>(null)
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'todo' as TaskStatus,
    priority: 'medium' as TaskPriority,
    assignee: '',
    dueDate: '',
  })

  // Fetch tasks from API
  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const res = await fetch(`/api/clients/${clientId}/tasks`, { cache: 'no-store' })
        if (!res.ok) throw new Error('Falha ao carregar tarefas')
        const data: unknown = await res.json()
        if (!active) return
        if (!Array.isArray(data)) throw new Error('Resposta inválida')
        const parsed: TaskItem[] = (data as Array<Record<string, unknown>>).map((t) => ({
          id: String(t.id),
          title: String(t.title ?? ''),
          description: (t.description as string | undefined) ?? undefined,
          status: (t.status as TaskStatus) ?? 'todo',
          priority: ((t.priority as TaskPriority) ?? 'medium'),
          assignee: (t.assignee as string | undefined) ?? undefined,
          dueDate: t.dueDate ? new Date(String(t.dueDate)).toISOString().slice(0, 10) : undefined,
          createdAt: new Date(String(t.createdAt)),
        }))
        setTasks(parsed)
      } catch {
        // fallback: keep initialTasks if provided
        if (initialTasks.length) setTasks(initialTasks)
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [clientId, initialTasks])

  const stats = useMemo(() => {
    const total = tasks.length
    const todo = tasks.filter(t => t.status === 'todo').length
    const doing = tasks.filter(t => t.status === 'in-progress').length
    const done = tasks.filter(t => t.status === 'done').length
    return { total, todo, doing, done }
  }, [tasks])

  const filtered = tasks.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const resetForm = () => {
    setForm({ title: '', description: '', status: 'todo', priority: 'medium', assignee: '', dueDate: '' })
    setEditing(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      try {
        const res = await fetch(`/api/clients/${clientId}/tasks?taskId=${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error('Falha ao atualizar tarefa')
        const updated = await res.json()
        setTasks(prev => prev.map(t => (t.id === editing.id ? {
          ...t,
          title: updated.title,
          description: updated.description ?? undefined,
          status: updated.status,
          priority: updated.priority,
          assignee: updated.assignee ?? undefined,
          dueDate: updated.dueDate ? new Date(updated.dueDate).toISOString().slice(0, 10) : undefined,
        } : t)))
      } catch {
        // noop; could show toast
      }
    } else {
      try {
        const res = await fetch(`/api/clients/${clientId}/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error('Falha ao criar tarefa')
        const created = await res.json()
        setTasks(prev => [{
          id: created.id,
          title: created.title,
          description: created.description ?? undefined,
          status: created.status,
          priority: created.priority,
          assignee: created.assignee ?? undefined,
          dueDate: created.dueDate ? new Date(created.dueDate).toISOString().slice(0, 10) : undefined,
          createdAt: new Date(created.createdAt),
        }, ...prev])
      } catch {
        // noop; could show toast
      }
    }
    setIsModalOpen(false)
    resetForm()
  }

  const handleEdit = (task: TaskItem) => {
    setEditing(task)
    setForm({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      assignee: task.assignee || '',
      dueDate: task.dueDate || '',
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir tarefa?')) return
    try {
      const res = await fetch(`/api/clients/${clientId}/tasks?taskId=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Falha ao excluir tarefa')
      setTasks(prev => prev.filter(t => t.id !== id))
    } catch {
      // noop
    }
  }

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    try {
      const res = await fetch(`/api/clients/${clientId}/tasks?taskId=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Falha ao atualizar status')
      setTasks(prev => prev.map(t => (t.id === id ? { ...t, status } : t)))
    } catch {
      // noop
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-slate-500">Carregando tarefas...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Tarefas</h2>
            <p className="text-sm text-slate-500 mt-1">Gerencie as tarefas deste cliente</p>
          </div>
          <Button className="gap-2" onClick={() => { resetForm(); setIsModalOpen(true) }}>
            <Plus className="h-4 w-4" /> Nova Tarefa
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><ListTodo className="h-4 w-4" /> Total</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{stats.total}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" /> A Fazer</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{stats.todo}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Flag className="h-4 w-4" /> Em Progresso</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{stats.doing}</CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Concluídas</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">{stats.done}</CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListTodo className="h-5 w-5" /> Lista de Tarefas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
              <div className="flex gap-2">
                {(['all', 'todo', 'in-progress', 'done'] as const).map(s => (
                  <Button key={s} size="sm" variant={statusFilter === s ? 'default' : 'outline'} onClick={() => setStatusFilter(s)}>
                    {s === 'all' ? 'Todas' : s === 'todo' ? 'A Fazer' : s === 'in-progress' ? 'Em Progresso' : 'Concluídas'}
                  </Button>
                ))}
              </div>
              <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="md:w-64" />
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                <ListTodo className="h-10 w-10 mx-auto mb-3 opacity-50" />
                Nenhuma tarefa encontrada
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(task => (
                  <div key={task.id} className="p-3 border rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs text-slate-600 mb-1">
                          <span className="inline-flex items-center gap-1">
                            <Flag className="h-3 w-3" /> {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                          </span>
                          {task.dueDate && (
                            <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {new Date(task.dueDate).toLocaleDateString()}</span>
                          )}
                        </div>
                        <h4 className="font-medium text-sm text-slate-900 truncate">{task.title}</h4>
                        {task.assignee && (
                          <p className="text-xs text-slate-600 mt-1">Responsável: {task.assignee}</p>
                        )}
                        {task.description && (
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2">{task.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          aria-label="Status da tarefa"
                          className="border rounded-md px-2 py-1 text-xs"
                          value={task.status}
                          onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                        >
                          <option value="todo">A Fazer</option>
                          <option value="in-progress">Em Progresso</option>
                          <option value="done">Concluída</option>
                        </select>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleEdit(task)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-600 hover:text-red-700" onClick={() => handleDelete(task.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xl max-h-[90vh] overflow-auto m-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{editing ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
                  <p className="text-sm text-slate-500 mt-1">Defina título, prioridade, prazo e descrição.</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input id="title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Criar landing page" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição (opcional)</Label>
                  <Textarea id="description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignee">Responsável (opcional)</Label>
                  <Input id="assignee" value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })} placeholder="Nome do responsável" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select id="status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}>
                      <option value="todo">A Fazer</option>
                      <option value="in-progress">Em Progresso</option>
                      <option value="done">Concluída</option>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioridade</Label>
                    <Select id="priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}>
                      <option value="low">Baixa</option>
                      <option value="medium">Média</option>
                      <option value="high">Alta</option>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Prazo</Label>
                    <Input id="dueDate" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                  <Button type="submit">{editing ? 'Atualizar' : 'Salvar'}</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
