"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDateInput, parseDateInput } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Edit,
  Loader2,
  MapPin,
  Plus,
  Trash2,
  Video,
  X,
  XCircle
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

interface Meeting {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  status: "scheduled" | "completed" | "cancelled";
  notes?: string;
  createdAt: Date;
}

interface MeetingsManagerProps {
  clientId: string;
}

interface MeetingResponse {
  id: string;
  title: string;
  description?: string | null;
  startTime: string;
  endTime: string;
  location?: string | null;
  status: "scheduled" | "completed" | "cancelled";
  notes?: string | null;
  createdAt: string;
  clientId: string;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Erro ao carregar reuniões");
  }
  const data: MeetingResponse[] = await res.json();
  // Convert date strings to Date objects
  return data.map((item) => ({
    ...item,
    description: item.description || undefined,
    location: item.location || undefined,
    notes: item.notes || undefined,
    startTime: new Date(item.startTime),
    endTime: new Date(item.endTime),
    createdAt: new Date(item.createdAt),
  }));
};

export function MeetingsManager({ clientId }: MeetingsManagerProps) {
  const queryClient = useQueryClient();
  const { data: meetings = [], isLoading } = useQuery<Meeting[]>({
    queryKey: ["meetings", clientId],
    queryFn: () => fetcher(`/api/clients/${clientId}/meetings`),
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Meeting | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    startTime: "",
    endTime: "",
    location: "",
    status: "scheduled" as Meeting["status"],
    notes: "",
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      startDate: "",
      startTime: "",
      endTime: "",
      location: "",
      status: "scheduled",
      notes: "",
    });
    setEditingItem(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.startDate || !formData.startTime || !formData.endTime) {
      toast.error("Por favor, preencha data e horários");
      return;
    }

    const baseDate = parseDateInput(formData.startDate);
    const [startHour, startMinute] = formData.startTime.split(":").map(Number);
    const [endHour, endMinute] = formData.endTime.split(":").map(Number);

    const startTime = new Date(baseDate);
    startTime.setHours(startHour, startMinute, 0, 0);

    const endTime = new Date(baseDate);
    endTime.setHours(endHour, endMinute, 0, 0);

    if (endTime <= startTime) {
      toast.error("O horário de término deve ser posterior ao de início");
      return;
    }

    try {
      if (editingItem) {
        // Update existing meeting
        const res = await fetch(`/api/clients/${clientId}/meetings`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingItem.id,
            title: formData.title,
            description: formData.description || null,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            location: formData.location || null,
            status: formData.status,
            notes: formData.notes || null,
          }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Erro ao atualizar reunião");
        }

        const updated = await res.json();
        // Optimistic update
        queryClient.setQueryData(["meetings", clientId], meetings.map((m) =>
          m.id === editingItem.id
            ? {
              ...updated,
              startTime: new Date(updated.startTime),
              endTime: new Date(updated.endTime),
              createdAt: new Date(updated.createdAt),
            }
            : m
        ));
        toast.success("Reunião atualizada com sucesso!");
      } else {
        // Create new meeting
        const res = await fetch(`/api/clients/${clientId}/meetings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formData.title,
            description: formData.description || null,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            location: formData.location || null,
            status: formData.status,
            notes: formData.notes || null,
          }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Erro ao criar reunião");
        }

        const created = await res.json();
        // Optimistic update
        queryClient.setQueryData(["meetings", clientId], [
          {
            ...created,
            startTime: new Date(created.startTime),
            endTime: new Date(created.endTime),
            createdAt: new Date(created.createdAt),
          },
          ...meetings,
        ]);
        toast.success("Reunião agendada com sucesso!");
      }

      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving meeting:", error);
      toast.error(
        error instanceof Error ? error.message : "Erro ao salvar reunião"
      );
    }
  };

  const handleEdit = (item: Meeting) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || "",
      startDate: formatDateInput(item.startTime),
      startTime: item.startTime.toTimeString().slice(0, 5),
      endTime: item.endTime.toTimeString().slice(0, 5),
      location: item.location || "",
      status: item.status,
      notes: item.notes || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar esta reunião?")) {
      return;
    }

    try {
      const res = await fetch(`/api/clients/${clientId}/meetings`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao deletar reunião");
      }

      // Optimistic update
      queryClient.setQueryData(["meetings", clientId], meetings.filter((m) => m.id !== id));
      toast.success("Reunião deletada com sucesso!");
    } catch (error) {
      console.error("Error deleting meeting:", error);
      toast.error(
        error instanceof Error ? error.message : "Erro ao deletar reunião"
      );
    }
  };

  const stats = useMemo(() => {
    const now = new Date();
    const upcoming = meetings.filter(
      (m) => m.status === "scheduled" && m.startTime > now,
    ).length;
    const thisMonth = meetings.filter((m) => {
      const date = m.startTime;
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear() &&
        m.status === "completed"
      );
    }).length;

    const totalHours = meetings
      .filter((m) => m.status === "completed")
      .reduce((sum, m) => {
        const duration =
          (m.endTime.getTime() - m.startTime.getTime()) / (1000 * 60 * 60);
        return sum + duration;
      }, 0);

    return { upcoming, thisMonth, totalHours };
  }, [meetings]);

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const sortedMeetings = useMemo(() => {
    return [...meetings].sort(
      (a, b) => b.startTime.getTime() - a.startTime.getTime(),
    );
  }, [meetings]);

  const getStatusIcon = (status: Meeting["status"]) => {
    switch (status) {
      case "scheduled":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusLabel = (status: Meeting["status"]) => {
    switch (status) {
      case "scheduled":
        return "Agendada";
      case "completed":
        return "Realizada";
      case "cancelled":
        return "Cancelada";
    }
  };

  const getStatusColor = (status: Meeting["status"]) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-700";
      case "completed":
        return "bg-green-100 text-green-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
    }
  };

  return (
    <>
      <div className="page-background">
        <div className="max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6 space-y-3 sm:space-y-4 lg:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gradient-primary mb-1 sm:mb-2">
                Reuniões
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Agende e gerencie reuniões
              </p>
            </div>
            <Button
              size="sm"
              className="gap-2 whitespace-nowrap"
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Agendar Reunião</span>
              <span className="sm:hidden">Agendar</span>
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-2 sm:gap-3 lg:gap-4 md:grid-cols-3">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-linear-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-all duration-200" />
              <div className="relative bg-blue-50/80 backdrop-blur-sm dark:bg-blue-950/30 rounded-2xl p-5 border-2 border-blue-200 dark:border-blue-800 hover:-translate-y-1 transition-all duration-200 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-linear-to-tr from-blue-600 to-purple-600 rounded-xl blur-md opacity-50" />
                    <div className="relative w-10 h-10 bg-linear-to-tr from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                    Próximas
                  </p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                    {stats.upcoming}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Reuniões agendadas
                  </p>
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-linear-to-r from-green-600 to-emerald-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-all duration-200" />
              <div className="relative bg-emerald-50/80 backdrop-blur-sm dark:bg-emerald-950/30 rounded-2xl p-5 border-2 border-emerald-200 dark:border-emerald-800 hover:-translate-y-1 transition-all duration-200 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-linear-to-tr from-green-600 to-emerald-500 rounded-xl blur-md opacity-50" />
                    <div className="relative w-10 h-10 bg-linear-to-tr from-green-600 to-emerald-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg">
                      <Video className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">
                    Realizadas
                  </p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-300">
                    {stats.thisMonth}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Este mês
                  </p>
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-linear-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-all duration-200" />
              <div className="relative bg-purple-50/80 backdrop-blur-sm dark:bg-purple-950/30 rounded-2xl p-5 border-2 border-purple-200 dark:border-purple-800 hover:-translate-y-1 transition-all duration-200 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-linear-to-tr from-purple-600 to-pink-600 rounded-xl blur-md opacity-50" />
                    <div className="relative w-10 h-10 bg-linear-to-tr from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-400">
                    Total de Horas
                  </p>
                  <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">
                    {stats.totalHours.toFixed(1)}h
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400">
                    Tempo investido
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Card */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur opacity-20 pointer-events-none" />
            <Card className="relative bg-white/90 backdrop-blur-md dark:bg-slate-900/90 border-2 border-slate-200/70 dark:border-slate-800/70 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 hover:shadow-2xl transition-all duration-300" variant="default" hover>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Calendário de Reuniões
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : sortedMeetings.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800 flex items-center justify-center">
                      <Calendar className="h-10 w-10 text-blue-400 dark:text-blue-500" />
                    </div>
                    <p className="font-semibold text-slate-900 dark:text-white mb-1">Nenhuma reunião agendada</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Agende a primeira reunião com este cliente
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sortedMeetings.map((item) => (
                      <div
                        key={item.id}
                        className="relative group p-5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-linear-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-800/50 hover:shadow-lg transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-700"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            {/* Icon status */}
                            <div className={`p-2.5 rounded-xl shrink-0 ${item.status === 'scheduled' ? 'bg-blue-100 dark:bg-blue-950/50' :
                              item.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-950/50' :
                                'bg-red-100 dark:bg-red-950/50'
                              }`}>
                              {getStatusIcon(item.status)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-2">
                                <h4 className="font-bold text-base text-slate-900 dark:text-white">
                                  {item.title}
                                </h4>
                                <span
                                  className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusColor(item.status)}`}
                                >
                                  {getStatusLabel(item.status)}
                                </span>
                              </div>

                              {item.description && (
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                                  {item.description}
                                </p>
                              )}

                              <div className="flex items-center gap-4 flex-wrap text-xs text-slate-500 dark:text-slate-400">
                                <span className="flex items-center gap-1.5 font-medium">
                                  <Calendar className="h-3.5 w-3.5" />
                                  {formatDateTime(item.startTime)}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5" />
                                  até {formatTime(item.endTime)}
                                </span>
                              </div>

                              {item.location && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5">
                                  <MapPin className="h-3.5 w-3.5" />
                                  {item.location}
                                </p>
                              )}

                              {item.notes && (
                                <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Notas:</p>
                                  <p className="text-sm text-slate-600 dark:text-slate-400">{item.notes}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-1 shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(item)}
                              className="hover:bg-blue-100 dark:hover:bg-blue-900/50"
                            >
                              <Edit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(item.id)}
                              className="hover:bg-red-100 dark:hover:bg-red-900/50"
                            >
                              <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
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
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
              onClick={() => setIsModalOpen(false)}
            >
              <div
                className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto m-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold">
                        {editingItem ? "Editar Reunião" : "Agendar Reunião"}
                      </h2>
                      <p className="text-sm text-slate-500 mt-1">
                        Programe uma reunião com o cliente.
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsModalOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Título da Reunião</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        required
                        placeholder="Ex: Reunião de Planejamento"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição (opcional)</Label>
                      <Input
                        id="description"
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
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
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              startDate: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="startTime">Início</Label>
                        <Input
                          id="startTime"
                          type="time"
                          value={formData.startTime}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              startTime: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endTime">Término</Label>
                        <Input
                          id="endTime"
                          type="time"
                          value={formData.endTime}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              endTime: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Local (opcional)</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) =>
                          setFormData({ ...formData, location: e.target.value })
                        }
                        placeholder="Ex: Escritório, Google Meet, Zoom..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            status: value as Meeting["status"],
                          })
                        }
                      >
                        <SelectTrigger className="border-border focus:border-blue-500 focus:ring-blue-500 bg-background transition-colors">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="scheduled">Agendada</SelectItem>
                          <SelectItem value="completed">Realizada</SelectItem>
                          <SelectItem value="cancelled">Cancelada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Notas da Reunião</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) =>
                          setFormData({ ...formData, notes: e.target.value })
                        }
                        rows={4}
                        placeholder="Anotações, decisões, próximos passos..."
                        className="border-2 border-slate-200 dark:border-slate-700 resize-none"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t-2 border-slate-200 dark:border-slate-700">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsModalOpen(false)}
                        size="lg"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        size="lg"
                      >
                        {editingItem ? "Atualizar Reunião" : "Agendar Reunião"}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
