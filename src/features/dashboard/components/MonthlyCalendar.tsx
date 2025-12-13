"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit2,
  Plus,
  Sparkles,
  X
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CreateEventDialog } from "./CreateEventDialog";
import { EditEventDialog } from "./EditEventDialog";

export type CalendarActivity = {
  id: string;
  title: string;
  type: "meeting" | "task" | "event";
  date: string | Date;
  clientId?: string;
  clientName?: string;
  status?: string;
  color?: string;
  description?: string | null;
};

export function MonthlyCalendar({
  activities,
  onMonthChange,
  initialMonth,
  onEventCreated,
  userRole,
}: {
  activities: CalendarActivity[];
  onMonthChange?: (month: Date) => void;
  initialMonth?: Date;
  onEventCreated?: () => void;
  userRole?: string | null;
}) {
  const [cursor, setCursor] = useState(() => {
    const d = initialMonth ? new Date(initialMonth) : new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filter, setFilter] = useState<"all" | "meeting" | "task" | "event">("all");
  const [createEventDialogOpen, setCreateEventDialogOpen] = useState(false);
  const [eventDialogDate, setEventDialogDate] = useState<Date | undefined>();
  const [editEventDialogOpen, setEditEventDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarActivity | null>(null);
  // view toggle removed (not currently used)

  const isOwner = userRole === 'OWNER';

  const monthInfo = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    const gridStart = new Date(startOfMonth);
    gridStart.setDate(startOfMonth.getDate() - startOfMonth.getDay());
    gridStart.setHours(0, 0, 0, 0);
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      days.push(d);
    }
    return { startOfMonth, endOfMonth, days };
  }, [cursor]);

  const normalized = useMemo(() => {
    return activities.map((a) => {
      let dateObj: Date;
      if (typeof a.date === "string") {
        if (/^\d{4}-\d{2}-\d{2}$/.test(a.date)) {
          const [y, m, d] = a.date.split("-").map((n) => Number(n));
          dateObj = new Date(y, (m || 1) - 1, d || 1);
        } else {
          dateObj = new Date(a.date);
        }
      } else {
        dateObj = new Date(a.date);
      }
      return { ...a, dateObj };
    });
  }, [activities]);

  const monthLabel = cursor.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const prevMonth = () => {
    const d = new Date(cursor);
    d.setMonth(d.getMonth() - 1);
    setCursor(d);
    onMonthChange?.(new Date(d));
  };

  const nextMonth = () => {
    const d = new Date(cursor);
    d.setMonth(d.getMonth() + 1);
    setCursor(d);
    onMonthChange?.(new Date(d));
  };

  const goToday = () => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    setCursor(d);
    onMonthChange?.(new Date(d));
    setSelectedDate(new Date());
  };

  const isSameDay = (a: Date | null, b: Date | null) => {
    if (!a || !b) return false;
    return a.toDateString() === b.toDateString();
  };
  const isToday = (d: Date) => isSameDay(d, new Date());
  const inCurrentMonth = (d: Date) => d.getMonth() === cursor.getMonth();

  const activitiesByDay = useMemo(() => {
    const map = new Map<string, CalendarActivity[]>();
    normalized.forEach((a) => {
      if (filter !== "all" && a.type !== filter) return;
      const key = `${a.dateObj.getFullYear()}-${String(a.dateObj.getMonth() + 1).padStart(2, "0")}-${String(a.dateObj.getDate()).padStart(2, "0")}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    });
    return map;
  }, [normalized, filter]);

  const selectedKey = selectedDate
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`
    : null;
  const selectedActivities = selectedKey
    ? activitiesByDay.get(selectedKey) || []
    : [];

  // Estatísticas do mês
  const monthStats = useMemo(() => {
    const currentMonthActivities = normalized.filter(
      (a) =>
        a.dateObj.getMonth() === cursor.getMonth() &&
        a.dateObj.getFullYear() === cursor.getFullYear(),
    );

    const meetings = currentMonthActivities.filter(
      (a) => a.type === "meeting",
    ).length;
    const tasks = currentMonthActivities.filter(
      (a) => a.type === "task",
    ).length;
    const events = currentMonthActivities.filter(
      (a) => a.type === "event",
    ).length;
    const completed = currentMonthActivities.filter(
      (a) => a.status === "done" || a.status === "completed",
    ).length;

    return { total: currentMonthActivities.length, meetings, tasks, events, completed };
  }, [normalized, cursor]);

  const handleOpenCreateEvent = (date?: Date) => {
    setEventDialogDate(date);
    setCreateEventDialogOpen(true);
  };

  const handleEventCreated = () => {
    onEventCreated?.();
  };

  return (
    <div className="space-y-4">
      {/* Header aprimorado */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white capitalize">
              {monthLabel}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {monthStats.total} eventos • {monthStats.meetings} reuniões •{" "}
              {monthStats.tasks} tarefas • {monthStats.events} avulsos
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenCreateEvent()}
              className="h-9 px-4 gap-2 rounded-xl border-slate-300 dark:border-slate-700 hover:bg-gradient-to-r hover:from-blue-600 hover:to-cyan-600 hover:text-white hover:border-transparent transition-all duration-300 font-semibold"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Evento</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={prevMonth}
              className="h-9 w-9 p-0 rounded-xl border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToday}
              className="h-9 px-4 text-xs rounded-xl border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
            >
              Hoje
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={nextMonth}
              className="h-9 w-9 p-0 rounded-xl border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filtros e visualização */}
        <div className="flex items-center justify-between gap-2">
          <Select
            value={filter}
            onValueChange={(value) =>
              setFilter(value as "all" | "meeting" | "task" | "event")
            }
          >
            <SelectTrigger className="h-8 w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-400" />
                  Todos ({monthStats.total})
                </div>
              </SelectItem>
              <SelectItem value="meeting">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  Reuniões ({monthStats.meetings})
                </div>
              </SelectItem>
              <SelectItem value="task">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                  Tarefas ({monthStats.tasks})
                </div>
              </SelectItem>
              <SelectItem value="event">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Avulsos ({monthStats.events})
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Legenda compacta */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-sm" />
              <span className="text-slate-600 dark:text-slate-400 font-medium">
                Reuniões
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-500 shadow-sm" />
              <span className="text-slate-600 dark:text-slate-400 font-medium">
                Tarefas
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 shadow-sm" />
              <span className="text-slate-600 dark:text-slate-400 font-medium">
                Avulsos
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cabeçalho dos dias da semana */}
      <div className="grid grid-cols-7 gap-1">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day, idx) => (
          <div
            key={day}
            className={`text-center py-2 text-xs font-semibold ${idx === 0 || idx === 6
              ? "text-slate-400 dark:text-slate-500"
              : "text-slate-600 dark:text-slate-400"
              }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grid do calendário melhorado */}
      <div className="grid grid-cols-7 gap-1">
        {monthInfo.days.map((day) => {
          const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
          const dayActs = activitiesByDay.get(key) || [];
          const today = isToday(day);
          const current = inCurrentMonth(day);
          const selected = selectedDate && isSameDay(day, selectedDate);
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;

          return (
            <button
              key={key}
              onClick={() =>
                setSelectedDate(
                  isSameDay(day, selectedDate) ? null : new Date(day),
                )
              }
              className={`
                relative min-h-20 p-2 rounded-lg border transition-all
                ${today
                  ? "bg-blue-50 dark:bg-blue-950/30 border-blue-400 dark:border-blue-600 shadow-sm"
                  : "bg-slate-900 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                }
                ${!current ? "opacity-40" : ""}
                ${selected ? "ring-2 ring-blue-500 shadow-md" : ""}
                ${isWeekend && current ? "bg-slate-50 dark:bg-slate-800/30" : ""}
                hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600
                focus:outline-none focus:ring-2 focus:ring-blue-400
              `}
              aria-label={`${day.getDate()} de ${monthLabel}`}
            >
              {/* Número do dia */}
              <div
                className={`
                text-sm font-bold mb-1
                ${today ? "text-blue-600 dark:text-blue-400" : ""}
                ${!current ? "text-slate-400" : "text-slate-700 dark:text-slate-300"}
              `}
              >
                {day.getDate()}
              </div>

              {/* Indicadores de atividades */}
              {dayActs.length > 0 && (
                <div className="space-y-0.5">
                  {dayActs.slice(0, 2).map((a) => {
                    let bgColor: string;
                    if (a.type === "meeting") {
                      bgColor = "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300";
                    } else if (a.type === "task") {
                      bgColor = "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300";
                    } else {
                      // Evento avulso - usa a cor customizada (mapeamento estático)
                      const colorMap: Record<string, string> = {
                        blue: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
                        purple: "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300",
                        green: "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300",
                        red: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
                        orange: "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300",
                        pink: "bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300",
                      };
                      bgColor = colorMap[a.color || "green"] || colorMap.green;
                    }

                    return (
                      <div
                        key={a.id}
                        className={`text-[10px] px-1.5 py-0.5 rounded truncate ${bgColor}`}
                        title={`${a.title}${a.clientName ? ` - ${a.clientName}` : ""}`}
                      >
                        {a.title}
                      </div>
                    );
                  })}
                  {dayActs.length > 2 && (
                    <div className="text-[10px] text-center text-slate-500 dark:text-slate-400 font-medium">
                      +{dayActs.length - 2} mais
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Painel de detalhes do dia selecionado */}
      {selectedDate && (
        <div className="mt-4 p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              {selectedDate.toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDate(null)}
              className="h-7 w-7 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {selectedActivities.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
              Nenhuma atividade agendada para este dia
            </p>
          ) : (
            <div className="space-y-2">
              {selectedActivities.map((activity) => {
                // Define o link de acordo com o tipo
                const href = activity.type === "meeting"
                  ? `/clients/${activity.clientId}/meetings`
                  : activity.type === "task"
                    ? `/clients/${activity.clientId}/tasks`
                    : undefined;

                const content = (
                  <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-800 border 
                  border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all group">
                    <div
                      className={`
                      h-10 w-10 rounded-lg flex items-center justify-center shrink-0
                      ${activity.type === "meeting"
                          ? "bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
                          : activity.type === "task"
                            ? "bg-purple-100 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400"
                            : (() => {
                              const colorMap: Record<string, string> = {
                                blue: "bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
                                purple: "bg-purple-100 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400",
                                green: "bg-green-100 text-green-600 dark:bg-green-950/50 dark:text-green-400",
                                red: "bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400",
                                orange: "bg-orange-100 text-orange-600 dark:bg-orange-950/50 dark:text-orange-400",
                                pink: "bg-pink-100 text-pink-600 dark:bg-pink-950/50 dark:text-pink-400",
                              };
                              return colorMap[activity.color || "green"] || colorMap.green;
                            })()
                        }
                    `}
                    >
                      {activity.type === "meeting" ? (
                        <Clock className="h-5 w-5" />
                      ) : activity.type === "task" ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Sparkles className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {activity.title}
                      </p>
                      {activity.clientName && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                          {activity.clientName}
                        </p>
                      )}
                      {activity.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                          {activity.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`
                          text-[10px] px-2 py-0.5 rounded-full font-medium
                          ${activity.type === "meeting"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                              : activity.type === "task"
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300"
                                : (() => {
                                  const colorMap: Record<string, string> = {
                                    blue: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
                                    purple: "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300",
                                    green: "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300",
                                    red: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
                                    orange: "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300",
                                    pink: "bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300",
                                  };
                                  return colorMap[activity.color || "green"] || colorMap.green;
                                })()
                            }
                        `}
                        >
                          {activity.type === "meeting" ? "Reunião" : activity.type === "task" ? "Tarefa" : "Evento Avulso"}
                        </span>
                        {activity.status && (
                          <span
                            className={`
                            text-[10px] px-2 py-0.5 rounded-full font-medium
                            ${activity.status === "done" ||
                                activity.status === "completed"
                                ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                              }
                          `}
                          >
                            {activity.status === "done" ||
                              activity.status === "completed"
                              ? "Concluída"
                              : "Pendente"}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Botão de editar para eventos avulsos (só OWNER) */}
                    {activity.type === "event" && isOwner && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setEditingEvent(activity);
                          setEditEventDialogOpen(true);
                        }}
                        aria-label="Editar evento"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );

                return href ? (
                  <Link key={activity.id} href={href} className="block">
                    {content}
                  </Link>
                ) : (
                  <div key={activity.id}>
                    {content}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Mensagem quando não há atividades */}
      {normalized.length === 0 && (
        <div className="text-center py-8">
          <CalendarIcon className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
            Nenhuma atividade neste mês
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
            Adicione reuniões e tarefas aos seus clientes
          </p>
        </div>
      )}

      <CreateEventDialog
        open={createEventDialogOpen}
        onOpenChange={setCreateEventDialogOpen}
        selectedDate={eventDialogDate}
        onSuccess={handleEventCreated}
      />

      {editingEvent && (
        <EditEventDialog
          open={editEventDialogOpen}
          onOpenChange={setEditEventDialogOpen}
          event={{
            id: editingEvent.id,
            title: editingEvent.title,
            description: editingEvent.description || null,
            date: editingEvent.date,
            color: editingEvent.color || "blue",
          }}
          canDelete={isOwner}
          onSuccess={handleEventCreated}
        />
      )}
    </div>
  );
}
