"use client";

import { createDashboardEvent, deleteDashboardEvent } from '@/modules/dashboard/actions/dashboardEvents';
import { DashboardEvent } from '@prisma/client';
import {
  Plus,
  Trash2,
  X
} from 'lucide-react';
import { useState } from 'react';

interface FunctionalCalendarProps {
  initialEvents: DashboardEvent[];
  monthKey: string;
  compact?: boolean;
}

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
const COLORS = ['blue', 'red', 'green', 'yellow', 'purple', 'pink', 'orange', 'cyan'];

export function FunctionalCalendar({ initialEvents, monthKey, compact = false }: FunctionalCalendarProps) {
  const [events, setEvents] = useState<DashboardEvent[]>(initialEvents);
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('blue');
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState('');

  const [year, month] = monthKey.split('-').map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const getEventsForDate = (date: number) => {
    const dateStr = new Date(year, month - 1, date).toISOString().split('T')[0];
    return events.filter(e => e.date.toString().split('T')[0] === dateStr);
  };

  const handleCreateEvent = async () => {
    if (!selectedDate || !title.trim()) {
      alert('Preencha o título');
      return;
    }

    setLoading(true);
    try {
      const eventDate = new Date(year, month - 1, selectedDate);
      if (time) {
        const [hh, mm] = time.split(':').map(Number);
        if (!Number.isNaN(hh) && !Number.isNaN(mm)) {
          eventDate.setHours(hh, mm, 0, 0);
        }
      }
      const newEvent = await createDashboardEvent({
        title: title.trim(),
        description: description.trim() || undefined,
        date: eventDate,
        color,
      });
      setEvents(prev => [...prev, newEvent]);
      setTitle('');
      setDescription('');
      setColor('blue');
      setTime('');
      setShowModal(false);
      setSelectedDate(null);
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      alert('Erro ao criar evento');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Tem certeza que deseja deletar este evento?')) return;

    setLoading(true);
    try {
      await deleteDashboardEvent(eventId);
      setEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (error) {
      console.error('Erro ao deletar evento:', error);
      alert('Erro ao deletar evento');
    } finally {
      setLoading(false);
    }
  };

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    red: 'bg-red-500/20 text-red-300 border-red-500/30',
    green: 'bg-green-500/20 text-green-300 border-green-500/30',
    yellow: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    purple: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    pink: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    orange: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    cyan: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h3 className={`${compact ? 'text-[11px]' : 'text-sm'} font-bold text-white`}>
          {MONTHS[month - 1]} {year}
        </h3>
        <button
          onClick={() => {
            setShowModal(true);
            setSelectedDate(null);
            setTitle('');
            setDescription('');
            setColor('blue');
          }}
          className={`flex items-center gap-1 ${compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-3 py-1.5 text-xs'} bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-300 rounded-lg font-semibold transition-all`}
        >
          <Plus className={`${compact ? 'w-2 h-2' : 'w-3 h-3'}`} />
          Novo
        </button>
      </div>

      <div className={`grid grid-cols-7 gap-0.5 ${compact ? 'mb-0.5' : 'mb-2'}`}>
        {WEEKDAYS.map(day => (
          <div key={day} className={`text-center ${compact ? 'text-[9px] py-0' : 'text-xs py-1'} font-semibold text-slate-400`}>
            {day}
          </div>
        ))}
      </div>

      <div className={`grid grid-cols-7 gap-0.5 bg-slate-800/30 rounded-lg ${compact ? 'p-0.5' : 'p-2'}`}>
        {calendarDays.map((day, idx) => (
          <div
            key={idx}
            onClick={() => {
              if (!day) return;
              const dayEvents = getEventsForDate(day);
              if (dayEvents.length > 0) {
                setSelectedDate(day);
                setShowEventDetails(true);
              }
            }}
            className={`${compact ? 'min-h-[50px] p-0.5' : 'aspect-square p-1'} rounded-md text-center ${compact ? 'text-[10px]' : 'text-xs'} font-semibold transition-all ${day
              ? 'bg-slate-700/40 border border-slate-600/30 hover:bg-slate-700/60 cursor-pointer'
              : ''
              } ${day && getEventsForDate(day).length > 0 ? 'ring-1 ring-pink-500/50' : ''}`}
          >
            {day && (
              <>
                <div className={`text-white ${compact ? 'text-[10px]' : 'text-xs'} font-bold mb-0.5`}>{day}</div>
                {getEventsForDate(day).length > 0 && (
                  <div className="space-y-0.5">
                    {getEventsForDate(day).slice(0, 2).map((e) => (
                      <div key={e.id} className={`truncate ${compact ? 'text-[8px]' : 'text-[10px]'} rounded px-0.5 border ${colorClasses[e.color as keyof typeof colorClasses]}`}>{e.title}</div>
                    ))}
                    {getEventsForDate(day).length > 2 && (
                      <div className={`${compact ? 'text-[8px]' : 'text-[10px]'} text-slate-400`}>+{getEventsForDate(day).length - 2}</div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {showEventDetails && selectedDate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">
                {new Date(year, month - 1, selectedDate).toLocaleDateString('pt-BR')}
              </h3>
              <button
                onClick={() => setShowEventDetails(false)}
                className="text-slate-400 hover:text-white"
                aria-label="Fechar detalhes do evento"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {getEventsForDate(selectedDate).length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {getEventsForDate(selectedDate).map((event) => (
                  <div
                    key={event.id}
                    className={`border-2 rounded-lg p-3 ${colorClasses[event.color as keyof typeof colorClasses]
                      }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm">{event.title}</p>
                        {event.description && (
                          <p className="text-xs mt-1 opacity-75">{event.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="flex-shrink-0 p-1 hover:bg-black/20 rounded transition-all"
                        disabled={loading}
                        aria-label="Excluir evento"
                        title="Excluir evento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-center py-4 text-sm">Sem eventos neste dia</p>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Novo Evento</h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setTitle('');
                  setDescription('');
                  setColor('blue');
                  setSelectedDate(null);
                }}
                className="text-slate-400 hover:text-white"
                aria-label="Fechar modal"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {selectedDate === null && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Selecione a data
                  </label>
                  <div className="grid grid-cols-7 gap-1 bg-slate-800 p-2 rounded-lg">
                    {WEEKDAYS.map(day => (
                      <div key={day} className="text-center text-xs font-semibold text-slate-400">
                        {day}
                      </div>
                    ))}
                    {calendarDays.map((day, idx) => (
                      <button
                        key={idx}
                        onClick={() => day && setSelectedDate(day)}
                        className={`aspect-square text-xs font-semibold rounded transition-all ${!day
                          ? ''
                          : 'bg-slate-700/50 hover:bg-blue-500/30 border border-slate-600'
                          }`}
                        aria-label={day ? `Selecionar dia ${day}` : 'Dia vazio'}
                        title={day ? `Selecionar dia ${day}` : 'Dia vazio'}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedDate !== null && (
                <>
                  <div>
                    <p className="text-sm font-medium text-slate-300 mb-2">
                      Data: {new Date(year, month - 1, selectedDate).toLocaleDateString('pt-BR')}
                    </p>
                    <button
                      onClick={() => setSelectedDate(null)}
                      className="text-xs text-blue-400 hover:underline"
                      aria-label="Mudar data"
                      title="Mudar data"
                    >
                      Mudar data
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Título *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ex: Reunião com cliente"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none text-sm"
                      autoFocus
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Horário</label>
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none text-sm"
                        aria-label="Horário do evento"
                        title="Horário"
                        placeholder="00:00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Cor</label>
                      <div className="flex gap-2 flex-wrap">
                        {COLORS.map(c => (
                          <button
                            key={c}
                            onClick={() => setColor(c)}
                            className={`w-6 h-6 rounded-full border-2 transition-all ${color === c ? 'border-white scale-110' : 'border-slate-600'}`}
                            style={{
                              backgroundColor: {
                                blue: '#3b82f6',
                                red: '#ef4444',
                                green: '#10b981',
                                yellow: '#eab308',
                                purple: '#a855f7',
                                pink: '#ec4899',
                                orange: '#f97316',
                                cyan: '#06b6d4',
                              }[c],
                            }}
                            aria-label={`Selecionar cor ${c}`}
                            title={`Selecionar cor ${c}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Descrição (opcional)
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Adicione detalhes..."
                      rows={2}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none resize-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Cor
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {COLORS.map(c => (
                        <button
                          key={c}
                          onClick={() => setColor(c)}
                          className={`w-7 h-7 rounded-full border-2 transition-all ${color === c ? 'border-white scale-110' : 'border-slate-600'
                            }`}
                          style={{
                            backgroundColor: {
                              blue: '#3b82f6',
                              red: '#ef4444',
                              green: '#10b981',
                              yellow: '#eab308',
                              purple: '#a855f7',
                              pink: '#ec4899',
                              orange: '#f97316',
                              cyan: '#06b6d4',
                            }[c],
                          }}
                          aria-label={`Selecionar cor ${c}`}
                          title={`Selecionar cor ${c}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        setShowModal(false);
                        setTitle('');
                        setDescription('');
                        setColor('blue');
                        setSelectedDate(null);
                      }}
                      className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all text-sm"
                      aria-label="Cancelar criação de evento"
                      title="Cancelar"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleCreateEvent}
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all disabled:opacity-50 text-sm font-semibold"
                      aria-label="Criar evento"
                      title="Criar evento"
                    >
                      {loading ? 'Criando...' : 'Criar'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
