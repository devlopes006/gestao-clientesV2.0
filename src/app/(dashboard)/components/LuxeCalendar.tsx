"use client";

import { createDashboardEvent, deleteDashboardEvent, updateDashboardEvent } from '@/modules/dashboard/actions/dashboardEvents';
import { DashboardEvent } from '@prisma/client';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Trash2,
  X
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface LuxeCalendarProps {
  initialEvents: DashboardEvent[];
  monthKey: string;
}

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const EVENT_COLORS = [
  { value: 'blue', bg: 'bg-blue-500', light: 'bg-blue-500/20', border: 'border-blue-500/30' },
  { value: 'green', bg: 'bg-green-500', light: 'bg-green-500/20', border: 'border-green-500/30' },
  { value: 'purple', bg: 'bg-purple-500', light: 'bg-purple-500/20', border: 'border-purple-500/30' },
  { value: 'pink', bg: 'bg-pink-500', light: 'bg-pink-500/20', border: 'border-pink-500/30' },
  { value: 'orange', bg: 'bg-orange-500', light: 'bg-orange-500/20', border: 'border-orange-500/30' },
  { value: 'yellow', bg: 'bg-yellow-500', light: 'bg-yellow-500/20', border: 'border-yellow-500/30' },
  { value: 'red', bg: 'bg-red-500', light: 'bg-red-500/20', border: 'border-red-500/30' },
  { value: 'cyan', bg: 'bg-cyan-500', light: 'bg-cyan-500/20', border: 'border-cyan-500/30' },
];

export function LuxeCalendar({ initialEvents, monthKey }: LuxeCalendarProps) {
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
    return events.filter(e => e.date.toString().split('T')[0] === dateStr);
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
    setColor(event.color);
    const eventDate = new Date(event.date);
    const hours = eventDate.getHours().toString().padStart(2, '0');
    const minutes = eventDate.getMinutes().toString().padStart(2, '0');
    setTime(`${hours}:${minutes}`);
    setSelectedDate(eventDate);
    setShowEventModal(true);
  };

  const handleSaveEvent = async () => {
    if (!selectedDate || !title.trim()) {
      alert('Preencha o título e selecione uma data');
      return;
    }

    setLoading(true);
    try {
      const eventDate = new Date(selectedDate);
      if (time) {
        const [hh, mm] = time.split(':').map(Number);
        if (!isNaN(hh) && !isNaN(mm)) eventDate.setHours(hh, mm, 0, 0);
      }

      if (editingEvent) {
        const updated = await updateDashboardEvent(editingEvent.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          date: eventDate,
          color,
        });
        setEvents(prev => prev.map(e => e.id === editingEvent.id ? updated : e));
      } else {
        const newEvent = await createDashboardEvent({
          title: title.trim(),
          description: description.trim() || undefined,
          date: eventDate,
          color,
        });
        setEvents(prev => [...prev, newEvent]);
      }
      closeModal();
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
      setEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (error) {
      console.error('Erro ao deletar evento:', error);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowEventModal(false);
    setEditingEvent(null);
    setTitle('');
    setDescription('');
    setColor('blue');
    setTime('');
    setSelectedDate(null);
  };

  const isToday = (date: Date) => date.toDateString() === today.toDateString();

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-all duration-200"
          >
            <ChevronLeft className="w-4 h-4 text-slate-300" />
          </button>

          <h3 className="text-base font-bold text-white min-w-[140px] text-center bg-gradient-to-r from-slate-600/20 to-slate-700/20 rounded-lg px-3 py-1.5 backdrop-blur-sm">
            {MONTHS[month - 1]} {year}
          </h3>

          <button
            onClick={() => navigateMonth('next')}
            className="p-1.5 hover:bg-slate-700/50 rounded-lg transition-all duration-200"
          >
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </button>
        </div>

        <button
          onClick={() => openCreateModal()}
          className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg text-xs font-semibold transition-all duration-200 shadow-lg shadow-blue-500/20 flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Novo
        </button>
      </div>

      {/* Calendário Grid */}
      <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-md border border-slate-700/30 rounded-xl p-3 shadow-xl">
        {/* Weekdays */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map((day, idx) => (
            <div key={`weekday-${idx}`} className="text-center text-[10px] font-semibold text-slate-400 py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Dias */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, idx) => {
            if (!date) return <div key={idx} className="aspect-square" />;

            const dayEvents = getEventsForDate(date);
            const isCurrent = isToday(date);
            const isOtherMonth = date.getMonth() !== month - 1;

            return (
              <button
                key={idx}
                onClick={() => {
                  if (dayEvents.length > 0) {
                    setSelectedDayDate(date);
                    setShowDayModal(true);
                  }
                }}
                className={`
                  aspect-square rounded-lg border transition-all duration-200 p-1 flex flex-col items-center justify-center relative group
                  ${isCurrent
                    ? 'bg-blue-500/20 border-blue-500/50 shadow-lg shadow-blue-500/20'
                    : dayEvents.length > 0
                      ? 'bg-slate-700/30 border-slate-600/50 hover:bg-slate-700/50 hover:border-slate-500/50'
                      : 'bg-slate-800/20 border-slate-700/30 hover:bg-slate-800/40 hover:border-slate-600/30'
                  }
                  ${isOtherMonth ? 'opacity-30' : ''}
                `}
              >
                <span className={`text-[11px] font-bold ${isCurrent ? 'text-blue-300' : 'text-slate-200'}`}>
                  {date.getDate()}
                </span>

                {dayEvents.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayEvents.slice(0, 2).map((evt) => {
                      const colorObj = EVENT_COLORS.find(c => c.value === evt.color) || EVENT_COLORS[0];
                      return (
                        <div
                          key={evt.id}
                          className={`w-1.5 h-1.5 rounded-full ${colorObj.bg} shadow-md shadow-current/50`}
                          title={evt.title}
                        />
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <span className="text-[7px] text-slate-400">+{dayEvents.length - 2}</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal - Eventos do Dia */}
      {showDayModal && selectedDayDate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700/50 rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="p-4 border-b border-slate-700/30">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">
                  {selectedDayDate.getDate()} de {MONTHS[selectedDayDate.getMonth()]}
                </h3>
                <button onClick={() => setShowDayModal(false)} className="p-1 hover:bg-slate-800 rounded-lg">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="p-4 max-h-80 overflow-y-auto space-y-2">
              {getEventsForDate(selectedDayDate).map((event) => {
                const colorObj = EVENT_COLORS.find(c => c.value === event.color) || EVENT_COLORS[0];
                const eventTime = new Date(event.date);
                const timeStr = `${eventTime.getHours().toString().padStart(2, '0')}:${eventTime.getMinutes().toString().padStart(2, '0')}`;

                return (
                  <div
                    key={event.id}
                    className={`p-3 rounded-lg border ${colorObj.light} ${colorObj.border} hover:scale-105 transition-all duration-200 cursor-pointer group`}
                    onClick={() => {
                      setShowDayModal(false);
                      openEditModal(event);
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span className="text-xs font-mono font-semibold text-slate-300">{timeStr}</span>
                        </div>
                        <p className="text-sm font-semibold text-white truncate">{event.title}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEvent(event.id);
                        }}
                        className="p-1 hover:bg-red-500/20 rounded opacity-0 group-hover:opacity-100 transition-all"
                        disabled={loading}
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-slate-700/30">
              <button
                onClick={() => {
                  setShowDayModal(false);
                  openCreateModal(selectedDayDate);
                }}
                className="w-full px-3 py-2 bg-gradient-to-r from-blue-500/20 to-blue-600/20 hover:from-blue-500/30 hover:to-blue-600/30 border border-blue-500/30 text-blue-300 rounded-lg text-xs font-semibold transition-all duration-200"
              >
                + Novo Evento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal - Criar/Editar Evento */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700/50 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-slate-700/30">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">
                  {editingEvent ? 'Editar' : 'Novo'} Evento
                </h3>
                <button onClick={closeModal} className="p-1 hover:bg-slate-800 rounded-lg">
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

              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => setSelectedDate(e.target.value ? new Date(e.target.value) : null)}
                  className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição (opcional)"
                rows={2}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none resize-none transition-all"
              />

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-2 block">Cor</label>
                <div className="grid grid-cols-4 gap-2">
                  {EVENT_COLORS.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setColor(c.value)}
                      className={`w-8 h-8 rounded-lg border-2 transition-all ${color === c.value ? `${c.border} ring-2 ring-offset-2 ring-offset-slate-900` : 'border-slate-700'} ${c.bg}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-700/30 flex items-center gap-3">
              {editingEvent && (
                <button
                  onClick={() => handleDeleteEvent(editingEvent.id)}
                  disabled={loading}
                  className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                >
                  Deletar
                </button>
              )}
              <div className="flex-1" />
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEvent}
                disabled={loading || !title.trim() || !selectedDate}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-50 shadow-lg shadow-blue-500/20"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
