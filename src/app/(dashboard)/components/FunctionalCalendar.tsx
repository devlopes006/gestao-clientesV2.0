"use client";

import { createDashboardEvent, deleteDashboardEvent } from '@/modules/dashboard/actions/dashboardEvents';
import { DashboardEvent } from '@prisma/client';
import { Trash2, X } from 'lucide-react';
import { useState } from 'react';

interface FunctionalCalendarProps {
  initialEvents: DashboardEvent[];
  monthKey: string;
}

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
const COLORS = ['blue', 'red', 'green', 'yellow', 'purple', 'pink', 'orange', 'cyan'];

export function FunctionalCalendar({ initialEvents, monthKey }: FunctionalCalendarProps) {
  const [events, setEvents] = useState<DashboardEvent[]>(initialEvents);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('blue');
  const [loading, setLoading] = useState(false);

  const [year, month] = monthKey.split('-').map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  // Get events for a specific date
  const getEventsForDate = (date: number) => {
    const dateStr = new Date(year, month - 1, date).toISOString().split('T')[0];
    return events.filter(e => e.date.toString().split('T')[0] === dateStr);
  };

  // Handle creating event
  const handleCreateEvent = async () => {
    if (!selectedDate || !title.trim()) {
      alert('Preencha o título e selecione uma data');
      return;
    }

    setLoading(true);
    try {
      const newEvent = await createDashboardEvent({
        title: title.trim(),
        description: description.trim() || undefined,
        date: selectedDate,
        color,
      });
      setEvents([...events, newEvent]);
      setTitle('');
      setDescription('');
      setColor('blue');
      setShowModal(false);
      setSelectedDate(null);
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      alert('Erro ao criar evento');
    } finally {
      setLoading(false);
    }
  };

  // Handle deleting event
  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Tem certeza que deseja deletar este evento?')) return;

    setLoading(true);
    try {
      await deleteDashboardEvent(eventId);
      setEvents(events.filter(e => e.id !== eventId));
    } catch (error) {
      console.error('Erro ao deletar evento:', error);
      alert('Erro ao deletar evento');
    } finally {
      setLoading(false);
    }
  };

  // Render calendar days
  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800 border-blue-300',
    red: 'bg-red-100 text-red-800 border-red-300',
    green: 'bg-green-100 text-green-800 border-green-300',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    purple: 'bg-purple-100 text-purple-800 border-purple-300',
    pink: 'bg-pink-100 text-pink-800 border-pink-300',
    orange: 'bg-orange-100 text-orange-800 border-orange-300',
    cyan: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  };

  return (
    <div className="bg-gradient-to-br from-slate-900/50 via-slate-950/50 to-slate-950/30 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-white">
          {MONTHS[month - 1]} {year}
        </h2>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {WEEKDAYS.map(day => (
          <div key={day} className="text-center text-sm font-semibold text-slate-400 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {calendarDays.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="aspect-square" />;
          }

          const dateObj = new Date(year, month - 1, day);
          const dayEvents = getEventsForDate(day);
          const isSelected = selectedDate?.getDate() === day &&
            selectedDate?.getMonth() === month - 1 &&
            selectedDate?.getFullYear() === year;

          return (
            <button
              key={day}
              onClick={() => {
                setSelectedDate(dateObj);
                setShowModal(true);
              }}
              className={`aspect-square rounded-lg border-2 p-2 text-xs transition-all ${isSelected
                ? 'border-pink-500 bg-pink-500/20'
                : 'border-slate-600 hover:border-slate-500'
                } ${dayEvents.length > 0 ? 'bg-slate-800/50' : 'bg-slate-800/20'}`}
            >
              <div className="font-semibold text-white">{day}</div>
              <div className="mt-1 space-y-0.5">
                {dayEvents.slice(0, 2).map(event => (
                  <div
                    key={event.id}
                    className={`text-[10px] px-1 py-0.5 rounded truncate border ${colorClasses[event.color as keyof typeof colorClasses] || colorClasses.blue
                      }`}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-[9px] text-slate-400">+{dayEvents.length - 2}</div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Date Events */}
      {selectedDate && (
        <div className="bg-slate-800/50 rounded-lg p-4 mb-4 border border-slate-700/50">
          <h3 className="text-white font-semibold mb-3">
            {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
          </h3>
          {getEventsForDate(selectedDate.getDate()).length > 0 ? (
            <div className="space-y-2">
              {getEventsForDate(selectedDate.getDate()).map(event => (
                <div
                  key={event.id}
                  className={`p-3 rounded-lg border-l-4 flex items-start justify-between ${colorClasses[event.color as keyof typeof colorClasses] || colorClasses.blue
                    }`}
                >
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{event.title}</p>
                    {event.description && <p className="text-xs mt-1 opacity-75">{event.description}</p>}
                  </div>
                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    className="ml-2 p-1 hover:bg-black/20 rounded transition-all"
                    disabled={loading}
                    title="Deletar evento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm">Sem eventos neste dia</p>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Novo Lembrete</h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setTitle('');
                  setDescription('');
                  setColor('blue');
                }}
                className="text-slate-400 hover:text-white"
                title="Fechar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Título</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Reunião com cliente"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-pink-500 focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Descrição (opcional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Adicione detalhes..."
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-pink-500 focus:outline-none resize-none"
                />
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Cor</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-white scale-110' : 'border-slate-600'
                        } bg-${c}-500`}
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
                        }[c as keyof typeof COLORS],
                      }}
                      title={`Selecionar cor ${c}`}
                    />
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setTitle('');
                    setDescription('');
                    setColor('blue');
                  }}
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateEvent}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-all disabled:opacity-50"
                >
                  {loading ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
