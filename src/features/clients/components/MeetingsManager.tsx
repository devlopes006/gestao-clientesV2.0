'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useState, useMemo } from 'react'
import { Calendar, Clock, Plus, Video, MapPin, Trash2, Edit, X, CheckCircle2, XCircle } from 'lucide-react'

interface Meeting {
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  location?: string
  status: 'scheduled' | 'completed' | 'cancelled'
  notes?: string
  createdAt: Date
}

interface MeetingsManagerProps {
  clientId: string
  initialMeetings?: Meeting[]
}

export function MeetingsManager({ clientId, initialMeetings = [] }: MeetingsManagerProps) {
  const [meetings, setMeetings] = useState<Meeting[]>(initialMeetings)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Meeting | null>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endTime: '',
    location: '',
    status: 'scheduled' as Meeting['status'],
    notes: '',
  })

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      startDate: '',
      startTime: '',
      endTime: '',
      location: '',
      status: 'scheduled',
      notes: '',
    })
    setEditingItem(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.startDate || !formData.startTime || !formData.endTime) {
      alert('Por favor, preencha data e horários')
      return
    }

    const startTime = new Date(`${formData.startDate}T${formData.startTime}`)
    const endTime = new Date(`${formData.startDate}T${formData.endTime}`)

    if (endTime <= startTime) {
      alert('O horário de término deve ser posterior ao de início')
      return
    }

    if (editingItem) {
      setMeetings(prev =>
        prev.map(item =>
          item.id === editingItem.id
            ? {
                ...item,
                title: formData.title,
                description: formData.description,
                startTime,
                endTime,
                location: formData.location,
                status: formData.status,
                notes: formData.notes,
              }
            : item
        )
      )
    } else {
      const newItem: Meeting = {
        id: Date.now().toString(),
        title: formData.title,
        description: formData.description,
        startTime,
        endTime,
        location: formData.location,
        status: formData.status,
        notes: formData.notes,
        createdAt: new Date(),
      }
      setMeetings(prev => [newItem, ...prev])
    }
    
    setIsModalOpen(false)
    resetForm()
  }

  const handleEdit = (item: Meeting) => {
    setEditingItem(item)
    setFormData({
      title: item.title,
      description: item.description || '',
      startDate: item.startTime.toISOString().split('T')[0],
      startTime: item.startTime.toTimeString().slice(0, 5),
      endTime: item.endTime.toTimeString().slice(0, 5),
      location: item.location || '',
      status: item.status,
      notes: item.notes || '',
    })
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja deletar esta reunião?')) {
      setMeetings(prev => prev.filter(item => item.id !== id))
    }
  }

  const stats = useMemo(() => {
    const now = new Date()
    const upcoming = meetings.filter(m => m.status === 'scheduled' && m.startTime > now).length
    const thisMonth = meetings.filter(m => {
      const date = m.startTime
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear() && m.status === 'completed'
    }).length
    
    const totalHours = meetings
      .filter(m => m.status === 'completed')
      .reduce((sum, m) => {
        const duration = (m.endTime.getTime() - m.startTime.getTime()) / (1000 * 60 * 60)
        return sum + duration
      }, 0)

    return { upcoming, thisMonth, totalHours }
  }, [meetings])

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const sortedMeetings = useMemo(() => {
    return [...meetings].sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
  }, [meetings])

  const getStatusIcon = (status: Meeting['status']) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="h-4 w-4 text-blue-600" />
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />
    }
  }

  const getStatusLabel = (status: Meeting['status']) => {
    switch (status) {
      case 'scheduled':
        return 'Agendada'
      case 'completed':
        return 'Realizada'
      case 'cancelled':
        return 'Cancelada'
    }
  }

  const getStatusColor = (status: Meeting['status']) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-700'
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'cancelled':
        return 'bg-red-100 text-red-700'
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Reuniões</h2>
            <p className="text-sm text-slate-500 mt-1">Agende e gerencie reuniões com o cliente</p>
          </div>
          <Button className="gap-2" onClick={() => { resetForm(); setIsModalOpen(true) }}>
            <Plus className="h-4 w-4" />
            Agendar Reunião
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próximas</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.upcoming}</div>
              <p className="text-xs text-slate-500 mt-1">Reuniões agendadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Realizadas</CardTitle>
              <Video className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.thisMonth}</div>
              <p className="text-xs text-slate-500 mt-1">Este mês</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Horas</CardTitle>
              <Calendar className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.totalHours.toFixed(1)}h</div>
              <p className="text-xs text-slate-500 mt-1">Tempo investido</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Calendário de Reuniões
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sortedMeetings.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">Nenhuma reunião agendada</p>
                <p className="text-sm mt-1">Agende a primeira reunião com este cliente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedMeetings.map(item => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between p-4 border rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-2 rounded-full bg-slate-200">
                        {getStatusIcon(item.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-slate-900">{item.title}</h4>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(item.status)}`}>
                            {getStatusLabel(item.status)}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-sm text-slate-600 mt-1">{item.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDateTime(item.startTime)}
                          </span>
                          <span>até {formatTime(item.endTime)}</span>
                        </div>
                        {item.location && (
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {item.location}
                          </p>
                        )}
                        {item.notes && (
                          <p className="text-sm text-slate-600 mt-2 p-2 bg-white rounded border border-slate-200">
                            <span className="font-medium">Notas:</span> {item.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto m-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">
                    {editingItem ? 'Editar Reunião' : 'Agendar Reunião'}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Programe uma reunião com o cliente.
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título da Reunião</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="Ex: Reunião de Planejamento"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição (opcional)</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Breve descrição"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Data</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Início</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">Término</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Local (opcional)</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Ex: Escritório, Google Meet, Zoom..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as Meeting['status'] })}
                  >
                    <option value="scheduled">Agendada</option>
                    <option value="completed">Realizada</option>
                    <option value="cancelled">Cancelada</option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notas da Reunião (opcional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                    placeholder="Anotações, decisões, próximos passos..."
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingItem ? 'Atualizar' : 'Agendar'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
