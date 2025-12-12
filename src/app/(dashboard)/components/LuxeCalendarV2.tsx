"use client";

import { createDashboardEvent, deleteDashboardEvent, updateDashboardEvent } from '@/modules/dashboard/actions/dashboardEvents';
import { DashboardEvent } from '@prisma/client';
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Users,
  X
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface LuxeCalendarProps {
  initialEvents: DashboardEvent[];
  monthKey: string;
  tasks?: any[];
  meetings?: any[];
}

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const EVENT_COLORS = [
  { value: 'blue', bg: 'bg-blue-500', light: 'bg-blue-500/20', border: 'border-blue-500/30', dot: 'bg-blue-500' },
  { value: 'green', bg: 'bg-green-500', light: 'bg-green-500/20', border: 'border-green-500/30', dot: 'bg-green-500' },
  { value: 'purple', bg: 'bg-purple-500', light: 'bg-purple-500/20', border: 'border-purple-500/30', dot: 'bg-purple-500' },
  { value: 'pink', bg: 'bg-pink-500', light: 'bg-pink-500/20', border: 'border-pink-500/30', dot: 'bg-pink-500' },
  { value: 'orange', bg: 'bg-orange-500', light: 'bg-orange-500/20', border: 'border-orange-500/30', dot: 'bg-orange-500' },
  { value: 'yellow', bg: 'bg-yellow-500', light: 'bg-yellow-500/20', border: 'border-yellow-500/30', dot: 'bg-yellow-500' },
  { value: 'red', bg: 'bg-red-500', light: 'bg-red-500/20', border: 'border-red-500/30', dot: 'bg-red-500' },
  { value: 'cyan', bg: 'bg-cyan-500', light: 'bg-cyan-500/20', border: 'border-cyan-500/30', dot: 'bg-cyan-500' },
];

export function LuxeCalendarV2({ initialEvents, monthKey, tasks = [], meetings = [] }: LuxeCalendarProps) {
  const [events, setEvents] = useState<DashboardEvent[]>(initialEvents);
  const [currentMonthKey, setCurrentMonthKey] = useState(monthKey);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showDayModal, setShowDayModal] = useState(false);
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null);
  const [editingEvent, setEditingEvent] = useState<DashboardEvent | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('blue');
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(false);

  const [year, month] = currentMonthKey.split('-').map(Number);
  const today = new Date();

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month - 1, i));
    return days;
  }, [year, month]);

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(e => {
      const eventDate = typeof e.date === 'string' ? e.date : new Date(e.date).toISOString().split('T')[0];
      return eventDate === dateStr;
    });
  };

  const getTasksForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return (tasks || []).filter(t => {
      if (!t.dueDate || t.status === 'DONE') return false;
      const taskDate = typeof t.dueDate === 'string' ? t.dueDate : new Date(t.dueDate).toISOString().split('T')[0];
      return taskDate === dateStr;
    });
  };

  const getMeetingsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return (meetings || []).filter(m => {
      if (!m.startTime && !m.date) return false;
      const meetingDate = typeof m.startTime === 'string' ? m.startTime : typeof m.date === 'string' ? m.date : new Date(m.startTime || m.date).toISOString().split('T')[0];
      return meetingDate === dateStr;
    });
  };

  const isToday = (date: Date) => {
    return date.toISOString().split('T')[0] === today.toISOString().split('T')[0];
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    let newYear = year, newMonth = month;
    if (direction === 'prev') {
      newMonth--;
      if (newMonth < 1) { newMonth = 12; newYear--; }
    } else {
      newMonth++;
      if (newMonth > 12) { newMonth = 1; newYear++; }
    }
    setCurrentMonthKey(`${newYear}-${newMonth}`);
  };

  const openCreateModal = (date?: Date) => {
    setEditingEvent(null);
    setTitle('');
    setDescription('');
    setColor('blue');
    setTime('');
    setSelectedDate(date || null);
    setShowEventModal(true);
  };

  const openEditModal = (event: DashboardEvent) => {
    setEditingEvent(event);
    setTitle(event.title);
    setDescription(event.description || '');
    setColor(event.color || 'blue');
    const eventDate = new Date(event.date);
    const hours = eventDate.getHours().toString().padStart(2, '0');
    const minutes = eventDate.getMinutes().toString().padStart(2, '0');
    setTime(`${hours}:${minutes}`);
    setShowEventModal(true);
  };

  const handleSaveEvent = async () => {
    if (!title.trim()) {
      alert('Digite um título');
      return;
    }

    setLoading(true);
    try {
      const eventDate = new Date(selectedDate || new Date());
      if (time) {
        const [hours, minutes] = time.split(':').map(Number);
        eventDate.setHours(hours, minutes);
      }

      if (editingEvent) {
        const updated = await updateDashboardEvent(editingEvent.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          date: eventDate,
          color: (color || 'blue') as string,
        });
        setEvents(events.map(e => e.id === editingEvent.id ? updated : e));
      } else {
        const newEvent = await createDashboardEvent({
          title: title.trim(),
          description: description.trim() || undefined,
          date: eventDate,
          color: (color || 'blue') as string,
        });
        setEvents([...events, newEvent]);
      }
      closeEventModal();
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      alert('Erro ao salvar evento');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Deletar este evento?')) return;
    setLoading(true);
    try {
      await deleteDashboardEvent(eventId);
      setEvents(events.filter(e => e.id !== eventId));
    } catch (error) {
      console.error('Erro ao deletar evento:', error);
    } finally {
      setLoading(false);
    }
  };

  const closeEventModal = () => {
    setShowEventModal(false);
    setEditingEvent(null);
    setTitle('');
    setDescription('');
    setColor('blue');
    setTime('');
    setSelectedDate(null);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-white">Calendário</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateMonth('prev')}
            aria-label="Mês anterior"
            className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-all"
          >
            <ChevronLeft className="w-4 h-4 text-slate-400" />
          </button>
          <span className="text-sm font-semibold text-slate-300 w-32 text-center">
            {MONTHS[month - 1]} {year}
          </span>
          <button
            onClick={() => navigateMonth('next')}
            aria-label="Próximo mês"
            className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-all"
          >
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>
        <button
          onClick={() => openCreateModal(new Date(year, month - 1, 1))}
          className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 rounded-lg text-xs font-semibold transition-all"
        >
          <Plus className="w-3.5 h-3.5 inline mr-1" />
          Novo
        </button>
      </div>

      {/* Calendário Grid - Mais leve e minimalista */}
      <div className="bg-slate-900/30 backdrop-blur-sm border border-slate-700/20 rounded-lg p-2.5 space-y-2">
        {/* Weekdays */}
        <div className="grid grid-cols-7 gap-0.5">
          {WEEKDAYS.map((day, idx) => (
            <div key={`weekday-${idx}`} className="text-center text-[9px] font-semibold text-slate-500 py-1.5">
              {day}
            </div>
          ))}
        </div>

        {/* Dias */}
        <div className="grid grid-cols-7 gap-0.5">
          {calendarDays.map((date, idx) => {
            if (!date) return <div key={idx} className="aspect-square" />;

            const dayEvents = getEventsForDate(date);
            const dayTasks = getTasksForDate(date);
            const dayMeetings = getMeetingsForDate(date);
            const isCurrent = isToday(date);
            const isOtherMonth = date.getMonth() !== month - 1;
            const totalActivities = dayEvents.length + dayTasks.length + dayMeetings.length;

            return (
              <button
                key={idx}
                onClick={() => {
                  setSelectedDayDate(date);
                  setShowDayModal(true);
                }}
                className={`
                  aspect-square rounded-lg border transition-all duration-200 p-1.5 flex flex-col items-start justify-between relative group
                  ${isCurrent
                    ? 'bg-blue-500/15 border-blue-500/40'
                    : totalActivities > 0
                      ? 'bg-slate-700/20 border-slate-600/40 hover:bg-slate-700/30'
                      : 'bg-slate-800/10 border-slate-700/20 hover:bg-slate-800/20'
                  }
                  ${isOtherMonth ? 'opacity-20' : ''}
                  cursor-pointer
                `}
              >
                <span className={`text-[10px] font-bold ${isCurrent ? 'text-blue-300' : 'text-slate-300'}`}>
                  {date.getDate()}
                </span>

                {/* Badges Premium de atividades */}
                {totalActivities > 0 && (
                  <div className="mt-auto w-full flex items-center gap-1">
                    {dayEvents.length > 0 && (
                      <div className="px-1.5 py-0.5 rounded-full text-[8px] font-semibold bg-gradient-to-r from-cyan-500/30 to-cyan-400/20 border border-cyan-400/40 text-cyan-200 shadow-sm hover:from-cyan-500/40 hover:to-cyan-400/30 transition-all" title={`${dayEvents.length} evento(s)`}>
                        E {dayEvents.length}
                      </div>
                    )}
                    {dayTasks.length > 0 && (
                      <div className="px-1.5 py-0.5 rounded-full text-[8px] font-semibold bg-gradient-to-r from-yellow-500/30 to-yellow-400/20 border border-yellow-400/40 text-yellow-200 shadow-sm hover:from-yellow-500/40 hover:to-yellow-400/30 transition-all" title={`${dayTasks.length} tarefa(s)`}>
                        T {dayTasks.length}
                      </div>
                    )}
                    {dayMeetings.length > 0 && (
                      <div className="px-1.5 py-0.5 rounded-full text-[8px] font-semibold bg-gradient-to-r from-pink-500/30 to-pink-400/20 border border-pink-400/40 text-pink-200 shadow-sm hover:from-pink-500/40 hover:to-pink-400/30 transition-all" title={`${dayMeetings.length} reunião(ões)`}>
                        R {dayMeetings.length}
                      </div>
                    )}
                  </div>
                )}

                {/* Hover indicator */}
                {totalActivities > 0 && (
                  <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-slate-400 opacity-0 group-hover:opacity-100 transition-all" />
                )}
              </button>
            );
          })}
        </div>

        {/* Modal do Dia - Atividades */}
        {showDayModal && selectedDayDate && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700/50 rounded-2xl w-full max-w-md shadow-2xl">
              <div className="p-6 border-b border-slate-700/30 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {selectedDayDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </h3>
                </div>
                <button
                  onClick={() => setShowDayModal(false)}
                  aria-label="Fechar"
                  className="p-1 hover:bg-slate-800 rounded-lg"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
                {/* Eventos */}
                {getEventsForDate(selectedDayDate).length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Eventos
                    </h4>
                    {getEventsForDate(selectedDayDate).map(evt => (
                      <div
                        key={evt.id}
                        className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 group hover:bg-cyan-500/20 cursor-pointer transition-all"
                        onClick={() => {
                          openEditModal(evt);
                          setShowDayModal(false);
                        }}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <p className="text-sm font-semibold text-white">{evt.title}</p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEvent(evt.id);
                              setShowDayModal(false);
                            }}
                            aria-label="Deletar evento"
                            className="opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-red-500/20 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>
                        {evt.description && (
                          <p className="text-xs text-slate-400 mb-1">{evt.description}</p>
                        )}
                        <p className="text-[10px] text-slate-500">
                          {new Date(evt.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tarefas */}
                {getTasksForDate(selectedDayDate).length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-yellow-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Tarefas
                    </h4>
                    {getTasksForDate(selectedDayDate).map(task => (
                      <div key={task.id} className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                        <p className="text-sm font-semibold text-white mb-1">{task.title}</p>
                        <p className="text-[10px] text-yellow-300 font-semibold">
                          {task.priority === 'URGENT' ? '🔴 Urgente' : task.priority === 'HIGH' ? '🟠 Alta' : task.priority === 'MEDIUM' ? '🟡 Média' : '🟢 Baixa'}
                        </p>
                        {task.client?.name && (
                          <p className="text-[10px] text-slate-400 mt-1">{task.client.name}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Reuniões */}
                {getMeetingsForDate(selectedDayDate).length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-pink-300 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Reuniões
                    </h4>
                    {getMeetingsForDate(selectedDayDate).map(meeting => (
                      <div key={meeting.id} className="bg-pink-500/10 border border-pink-500/20 rounded-lg p-3">
                        <p className="text-sm font-semibold text-white mb-1">{meeting.title}</p>
                        <p className="text-[10px] text-pink-300">
                          {new Date(meeting.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {meeting.client?.name && (
                          <p className="text-[10px] text-slate-400 mt-1">{meeting.client.name}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {getEventsForDate(selectedDayDate).length === 0 && getTasksForDate(selectedDayDate).length === 0 && getMeetingsForDate(selectedDayDate).length === 0 && (
                  <div className="text-center py-6">
                    <p className="text-sm text-slate-400">Nenhuma atividade neste dia</p>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-slate-700/30 flex gap-3">
                <button
                  onClick={() => {
                    openCreateModal(selectedDayDate);
                    setShowDayModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 rounded-lg text-sm font-semibold transition-all"
                >
                  <Plus className="w-3.5 h-3.5 inline mr-1" />
                  Novo Evento
                </button>
                <button
                  onClick={() => setShowDayModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold transition-all"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Evento */}
        {showEventModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700/50 rounded-2xl w-full max-w-md shadow-2xl">
              <div className="p-6 border-b border-slate-700/30">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">
                    {editingEvent ? 'Editar' : 'Novo'} Evento
                  </h3>
                  <button
                    onClick={closeEventModal}
                    aria-label="Fechar"
                    className="p-1 hover:bg-slate-800 rounded-lg"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Título do evento"
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-all"
                  autoFocus
                />

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição (opcional)"
                  rows={3}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none resize-none transition-all"
                />

                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  aria-label="Horário do evento"
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none transition-all"
                />

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-2 block">Cor</label>
                  <div className="grid grid-cols-4 gap-2">
                    {EVENT_COLORS.map(c => (
                      <button
                        key={c.value}
                        onClick={() => setColor(c.value)}
                        aria-label={`Selecionar cor ${c.value}`}
                        className={`h-8 rounded-lg border-2 transition-all ${color === c.value ? `${c.border} ring-2 ring-offset-2 ring-offset-slate-900` : 'border-slate-700'} ${c.bg}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-700/30 flex items-center gap-3">
                {editingEvent && (
                  <button
                    onClick={() => {
                      handleDeleteEvent(editingEvent.id);
                      closeEventModal();
                    }}
                    disabled={loading}
                    className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                  >
                    Deletar
                  </button>
                )}
                <div className="flex-1" />
                <button
                  onClick={closeEventModal}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEvent}
                  disabled={loading || !title.trim()}
                  className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : editingEvent ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
