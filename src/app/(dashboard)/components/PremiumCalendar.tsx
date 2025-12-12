"use client";

import { createDashboardEvent, deleteDashboardEvent, updateDashboardEvent } from '@/modules/dashboard/actions/dashboardEvents';
import { DashboardEvent } from '@prisma/client';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit2,
  Filter,
  Grid3X3,
  List,
  Plus,
  Search,
  Trash2,
  X
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface PremiumCalendarProps {
  initialEvents: DashboardEvent[];
  monthKey: string;
}

type ViewMode = 'month' | 'week' | 'list';
type EventCategory = 'meeting' | 'task' | 'reminder' | 'other';

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const WEEKDAYS_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const EVENT_COLORS = [
  { name: 'Azul', value: 'blue', bg: 'bg-blue-500', text: 'text-blue-300', border: 'border-blue-500/30', ring: 'ring-blue-500/50' },
  { name: 'Verde', value: 'green', bg: 'bg-green-500', text: 'text-green-300', border: 'border-green-500/30', ring: 'ring-green-500/50' },
  { name: 'Roxo', value: 'purple', bg: 'bg-purple-500', text: 'text-purple-300', border: 'border-purple-500/30', ring: 'ring-purple-500/50' },
  { name: 'Rosa', value: 'pink', bg: 'bg-pink-500', text: 'text-pink-300', border: 'border-pink-500/30', ring: 'ring-pink-500/50' },
  { name: 'Laranja', value: 'orange', bg: 'bg-orange-500', text: 'text-orange-300', border: 'border-orange-500/30', ring: 'ring-orange-500/50' },
  { name: 'Amarelo', value: 'yellow', bg: 'bg-yellow-500', text: 'text-yellow-300', border: 'border-yellow-500/30', ring: 'ring-yellow-500/50' },
  { name: 'Vermelho', value: 'red', bg: 'bg-red-500', text: 'text-red-300', border: 'border-red-500/30', ring: 'ring-red-500/50' },
  { name: 'Ciano', value: 'cyan', bg: 'bg-cyan-500', text: 'text-cyan-300', border: 'border-cyan-500/30', ring: 'ring-cyan-500/50' },
];

const CATEGORIES: { name: string; value: EventCategory; icon: string }[] = [
  { name: 'Reunião', value: 'meeting', icon: '👥' },
  { name: 'Tarefa', value: 'task', icon: '✓' },
  { name: 'Lembrete', value: 'reminder', icon: '🔔' },
  { name: 'Outro', value: 'other', icon: '📌' },
];

export function PremiumCalendar({ initialEvents, monthKey }: PremiumCalendarProps) {
  const [events, setEvents] = useState<DashboardEvent[]>(initialEvents);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentMonthKey, setCurrentMonthKey] = useState(monthKey);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showDayEventsModal, setShowDayEventsModal] = useState(false);
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null);
  const [editingEvent, setEditingEvent] = useState<DashboardEvent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterColor, setFilterColor] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('blue');
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [category, setCategory] = useState<EventCategory>('other');
  const [loading, setLoading] = useState(false);

  const [year, month] = currentMonthKey.split('-').map(Number);
  const today = new Date();
  const isCurrentMonth = year === today.getFullYear() && month === (today.getMonth() + 1);

  // Filtrar eventos
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (event.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
      const matchesColor = !filterColor || event.color === filterColor;
      return matchesSearch && matchesColor;
    });
  }, [events, searchQuery, filterColor]);

  // Obter eventos do dia
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return filteredEvents.filter(e => e.date.toString().split('T')[0] === dateStr);
  };

  // Gerar dias do calendário
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Dias vazios antes do início do mês
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Dias do mês
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month - 1, i));
    }

    return days;
  }, [year, month]);

  // Obter semanas para visualização semanal
  const weekDays = useMemo(() => {
    if (!selectedDate) return [];

    const startOfWeek = new Date(selectedDate);
    startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }

    return days;
  }, [selectedDate]);

  // Navegação de mês
  const navigateMonth = (direction: 'prev' | 'next') => {
    let newYear = year;
    let newMonth = month;

    if (direction === 'prev') {
      newMonth--;
      if (newMonth < 1) {
        newMonth = 12;
        newYear--;
      }
    } else {
      newMonth++;
      if (newMonth > 12) {
        newMonth = 1;
        newYear++;
      }
    }

    setCurrentMonthKey(`${newYear}-${newMonth}`);
  };

  // Abrir modal para visualizar eventos do dia
  const openDayEventsModal = (date: Date) => {
    setSelectedDayDate(date);
    setShowDayEventsModal(true);
  };

  // Abrir modal para criar evento
  const openCreateModal = (date?: Date) => {
    setEditingEvent(null);
    setTitle('');
    setDescription('');
    setColor('blue');
    setTime('');
    setEndTime('');
    setCategory('other');
    setSelectedDate(date || null);
    setShowEventModal(true);
  };

  // Abrir modal para editar evento
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

  // Criar ou atualizar evento
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
        if (!isNaN(hh) && !isNaN(mm)) {
          eventDate.setHours(hh, mm, 0, 0);
        }
      }

      if (editingEvent) {
        // Atualizar evento existente
        const updated = await updateDashboardEvent(editingEvent.id, {
          title: title.trim(),
          description: description.trim() || undefined,
          date: eventDate,
          color,
        });
        setEvents(prev => prev.map(e => e.id === editingEvent.id ? updated : e));
      } else {
        // Criar novo evento
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

  // Deletar evento
  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Tem certeza que deseja deletar este evento?')) return;

    setLoading(true);
    try {
      await deleteDashboardEvent(eventId);
      setEvents(prev => prev.filter(e => e.id !== eventId));
      closeModal();
    } catch (error) {
      console.error('Erro ao deletar evento:', error);
      alert('Erro ao deletar evento');
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
    setEndTime('');
    setSelectedDate(null);
  };

  // Obter classe de cor
  const getColorClass = (colorValue: string) => {
    const colorObj = EVENT_COLORS.find(c => c.value === colorValue) || EVENT_COLORS[0];
    return `${colorObj.bg}/20 ${colorObj.text} ${colorObj.border}`;
  };

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const isSameMonth = (date: Date) => {
    return date.getMonth() === month - 1 && date.getFullYear() === year;
  };

  // Renderizar visualização de mês
  const renderMonthView = () => (
    <div className="grid grid-cols-7 gap-1.5">
      {/* Cabeçalho dos dias da semana */}
      {WEEKDAYS.map(day => (
        <div key={day} className="text-center py-2 text-xs font-bold text-slate-300 border-b border-slate-700/50 bg-slate-800/30">
          {day}
        </div>
      ))}

      {/* Dias do calendário */}
      {calendarDays.map((date, idx) => {
        if (!date) {
          return <div key={idx} className="min-h-[80px]" />;
        }

        const dayEvents = getEventsForDate(date);
        const isCurrentDay = isToday(date);
        const isOtherMonth = !isSameMonth(date);

        return (
          <div
            key={idx}
            onClick={() => openDayEventsModal(date)}
            className={`
              min-h-[80px] p-1.5 rounded-lg border transition-all cursor-pointer relative
              ${isCurrentDay
                ? 'bg-blue-500/10 border-blue-500/50 ring-1 ring-blue-500/30'
                : 'bg-slate-800/40 border-slate-700/30 hover:border-slate-600 hover:bg-slate-800/60'
              }
              ${isOtherMonth ? 'opacity-40' : ''}
            `}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs font-bold ${isCurrentDay ? 'text-blue-400' : 'text-white'}`}>
                {date.getDate()}
              </span>
              {dayEvents.length > 0 && (
                <div className="flex gap-1">
                  {dayEvents.slice(0, 3).map((evt) => {
                    const colorObj = EVENT_COLORS.find(c => c.value === evt.color) || EVENT_COLORS[0];
                    return (
                      <div
                        key={evt.id}
                        className={`w-2 h-2 rounded-full ${colorObj.bg}`}
                        title={evt.title}
                      />
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <span className="text-[9px] text-slate-400 ml-0.5">+{dayEvents.length - 3}</span>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-0.5">
              {dayEvents.slice(0, 2).map(event => {
                const eventTime = new Date(event.date);
                const timeStr = `${eventTime.getHours().toString().padStart(2, '0')}:${eventTime.getMinutes().toString().padStart(2, '0')}`;

                return (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(event);
                    }}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-medium border transition-all hover:scale-[1.02] ${getColorClass(event.color)}`}
                  >
                    <div className="flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                      <span className="font-mono text-[8px]">{timeStr}</span>
                    </div>
                    <div className="truncate text-[9px]">{event.title}</div>
                  </div>
                );
              })}

              {dayEvents.length > 2 && (
                <div className="text-[8px] text-slate-400 text-center py-0.5">
                  +{dayEvents.length - 2} mais
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  // Renderizar visualização de semana
  const renderWeekView = () => (
    <div className="grid grid-cols-7 gap-3">
      {weekDays.map((date, idx) => {
        const dayEvents = getEventsForDate(date);
        const isCurrentDay = isToday(date);

        return (
          <div key={idx} className="space-y-2">
            <div className={`text-center p-3 rounded-lg ${isCurrentDay ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-slate-800/40'}`}>
              <div className="text-xs text-slate-400 font-medium">{WEEKDAYS[idx]}</div>
              <div className={`text-2xl font-bold mt-1 ${isCurrentDay ? 'text-blue-400' : 'text-white'}`}>
                {date.getDate()}
              </div>
            </div>

            <div className="space-y-2">
              {dayEvents.map(event => {
                const eventTime = new Date(event.date);
                const timeStr = `${eventTime.getHours().toString().padStart(2, '0')}:${eventTime.getMinutes().toString().padStart(2, '0')}`;

                return (
                  <div
                    key={event.id}
                    onClick={() => openEditModal(event)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] ${getColorClass(event.color)}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="font-mono text-sm font-semibold">{timeStr}</span>
                    </div>
                    <div className="font-medium text-sm">{event.title}</div>
                    {event.description && (
                      <div className="text-xs opacity-75 mt-1 line-clamp-2">{event.description}</div>
                    )}
                  </div>
                );
              })}

              {dayEvents.length === 0 && (
                <button
                  onClick={() => openCreateModal(date)}
                  className="w-full p-3 rounded-lg border-2 border-dashed border-slate-700 text-slate-500 hover:border-blue-500/50 hover:text-blue-400 transition-all text-sm"
                >
                  + Adicionar evento
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  // Renderizar visualização de lista
  const renderListView = () => {
    const sortedEvents = [...filteredEvents].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    if (sortedEvents.length === 0) {
      return (
        <div className="text-center py-12">
          <CalendarIcon className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400">Nenhum evento encontrado</p>
          <button
            onClick={() => openCreateModal(new Date())}
            className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all text-sm font-semibold"
          >
            Criar evento
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {sortedEvents.map(event => {
          const eventDate = new Date(event.date);
          const timeStr = `${eventDate.getHours().toString().padStart(2, '0')}:${eventDate.getMinutes().toString().padStart(2, '0')}`;
          const dateStr = eventDate.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric'
          });

          return (
            <div
              key={event.id}
              className={`p-4 rounded-xl border-2 transition-all hover:scale-[1.01] cursor-pointer ${getColorClass(event.color)}`}
              onClick={() => openEditModal(event)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4" />
                    <span className="font-mono text-sm font-semibold">{timeStr}</span>
                    <span className="text-xs opacity-75">• {dateStr}</span>
                  </div>
                  <h4 className="font-bold text-lg mb-1">{event.title}</h4>
                  {event.description && (
                    <p className="text-sm opacity-90">{event.description}</p>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteEvent(event.id);
                  }}
                  className="p-2 hover:bg-black/20 rounded-lg transition-all"
                  disabled={loading}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Cabeçalho com controles */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          {/* Navegação de mês */}
          {viewMode === 'month' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-slate-800 rounded-lg transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <h3 className="text-2xl font-bold text-white min-w-[220px] text-center">
                {MONTHS[month - 1]} {year}
              </h3>

              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-slate-800 rounded-lg transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {viewMode === 'week' && selectedDate && (
            <h3 className="text-xl font-bold text-white">
              Semana de {selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
            </h3>
          )}

          {viewMode === 'list' && (
            <h3 className="text-xl font-bold text-white">
              Todos os Eventos
            </h3>
          )}

          {isCurrentMonth && viewMode === 'month' && (
            <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-300 rounded-full font-semibold">
              Hoje
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Pesquisa */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar eventos..."
              className="pl-9 pr-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none w-48"
            />
          </div>

          {/* Filtros */}
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-all ${showFilters || filterColor ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-slate-800 text-slate-400'}`}
            >
              <Filter className="w-5 h-5" />
            </button>

            {showFilters && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-10 p-3">
                <h4 className="text-xs font-semibold text-slate-400 mb-2">Filtrar por cor</h4>
                <div className="space-y-1">
                  <button
                    onClick={() => setFilterColor(null)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${!filterColor ? 'bg-blue-500/20 text-blue-300' : 'text-slate-300 hover:bg-slate-800'}`}
                  >
                    Todas
                  </button>
                  {EVENT_COLORS.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setFilterColor(c.value)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${filterColor === c.value ? 'bg-blue-500/20 text-blue-300' : 'text-slate-300 hover:bg-slate-800'}`}
                    >
                      <div className={`w-3 h-3 rounded-full ${c.bg}`} />
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Seletor de visualização */}
          <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'month' ? 'bg-blue-500/20 text-blue-300' : 'text-slate-400 hover:text-white'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setViewMode('week');
                setSelectedDate(new Date());
              }}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'week' ? 'bg-blue-500/20 text-blue-300' : 'text-slate-400 hover:text-white'}`}
            >
              <CalendarIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-blue-500/20 text-blue-300' : 'text-slate-400 hover:text-white'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Botão criar evento */}
          <button
            onClick={() => openCreateModal()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all font-semibold text-sm"
          >
            <Plus className="w-4 h-4" />
            Novo Evento
          </button>
        </div>
      </div>

      {/* Conteúdo do calendário */}
      <div>
        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'list' && renderListView()}
      </div>

      {/* Modal de criação/edição de evento */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Cabeçalho do modal */}
            <div className="sticky top-0 bg-slate-900 border-b border-slate-700/50 p-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                {editingEvent ? (
                  <>
                    <Edit2 className="w-6 h-6 text-blue-400" />
                    Editar Evento
                  </>
                ) : (
                  <>
                    <Plus className="w-6 h-6 text-blue-400" />
                    Novo Evento
                  </>
                )}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-slate-800 rounded-lg transition-all text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Conteúdo do modal */}
            <div className="p-6 space-y-6">
              {/* Título */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Título do Evento *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Reunião com cliente, Apresentação de projeto..."
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none text-base"
                  autoFocus
                />
              </div>

              {/* Data e horário */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Data *
                  </label>
                  <input
                    type="date"
                    value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => setSelectedDate(e.target.value ? new Date(e.target.value) : null)}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Horário de início
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Cor do evento */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">
                  Cor do Evento
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {EVENT_COLORS.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setColor(c.value)}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${color === c.value
                        ? `${c.border} ${c.bg}/20 ring-2 ${c.ring}`
                        : 'border-slate-700/50 hover:border-slate-600'
                        }`}
                    >
                      <div className={`w-6 h-6 rounded-full ${c.bg}`} />
                      <span className={`text-sm font-medium ${color === c.value ? c.text : 'text-slate-400'}`}>
                        {c.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Descrição
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Adicione detalhes, notas ou informações adicionais..."
                  rows={4}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>
            </div>

            {/* Rodapé do modal */}
            <div className="sticky bottom-0 bg-slate-900 border-t border-slate-700/50 p-6 flex items-center justify-between gap-3">
              {editingEvent && (
                <button
                  onClick={() => handleDeleteEvent(editingEvent.id)}
                  disabled={loading}
                  className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl transition-all disabled:opacity-50 font-semibold flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Deletar
                </button>
              )}

              <div className="flex items-center gap-3 ml-auto">
                <button
                  onClick={closeModal}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEvent}
                  disabled={loading || !title.trim() || !selectedDate}
                  className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                >
                  {loading ? 'Salvando...' : editingEvent ? 'Salvar Alterações' : 'Criar Evento'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de visualização de eventos do dia */}
      {showDayEventsModal && selectedDayDate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
            {/* Cabeçalho */}
            <div className="sticky top-0 bg-slate-900 border-b border-slate-700/50 p-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white">
                  {selectedDayDate.toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  {getEventsForDate(selectedDayDate).length} evento(s)
                </p>
              </div>
              <button
                onClick={() => setShowDayEventsModal(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-all text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Lista de eventos */}
            <div className="p-6 space-y-3">
              {getEventsForDate(selectedDayDate).length > 0 ? (
                getEventsForDate(selectedDayDate).map((event) => {
                  const eventTime = new Date(event.date);
                  const timeStr = `${eventTime.getHours().toString().padStart(2, '0')}:${eventTime.getMinutes().toString().padStart(2, '0')}`;

                  return (
                    <div
                      key={event.id}
                      className={`p-4 rounded-xl border-2 transition-all hover:scale-[1.02] cursor-pointer ${getColorClass(event.color || 'blue')}`}
                      onClick={() => {
                        setShowDayEventsModal(false);
                        openEditModal(event);
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4" />
                            <span className="font-mono text-sm font-semibold">{timeStr}</span>
                          </div>
                          <h4 className="font-bold text-lg mb-1">{event.title}</h4>
                          {event.description && (
                            <p className="text-sm opacity-90 mt-2">{event.description}</p>
                          )}
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEvent(event.id);
                            if (getEventsForDate(selectedDayDate).length === 1) {
                              setShowDayEventsModal(false);
                            }
                          }}
                          className="p-2 hover:bg-black/20 rounded-lg transition-all"
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <CalendarIcon className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                  <p className="text-slate-400">Nenhum evento neste dia</p>
                </div>
              )}
            </div>

            {/* Rodapé com botão de criar */}
            <div className="sticky bottom-0 bg-slate-900 border-t border-slate-700/50 p-6">
              <button
                onClick={() => {
                  setShowDayEventsModal(false);
                  openCreateModal(selectedDayDate);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all font-semibold"
              >
                <Plus className="w-5 h-5" />
                Criar Evento Neste Dia
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
