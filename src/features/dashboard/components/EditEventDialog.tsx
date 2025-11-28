"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  deleteDashboardEvent,
  updateDashboardEvent,
} from "@/modules/dashboard/actions/dashboardEvents";
import { AlertTriangle, Calendar, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface EditEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: {
    id: string;
    title: string;
    description: string | null;
    date: Date | string;
    color: string;
  };
  canDelete?: boolean;
  onSuccess?: () => void;
}

const colorOptions = [
  { value: "blue", label: "Azul", bg: "bg-blue-500" },
  { value: "purple", label: "Roxo", bg: "bg-purple-500" },
  { value: "green", label: "Verde", bg: "bg-green-500" },
  { value: "red", label: "Vermelho", bg: "bg-red-500" },
  { value: "orange", label: "Laranja", bg: "bg-orange-500" },
  { value: "pink", label: "Rosa", bg: "bg-pink-500" },
];

export function EditEventDialog({
  open,
  onOpenChange,
  event,
  canDelete = false,
  onSuccess,
}: EditEventDialogProps) {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Convert date to YYYY-MM-DD format
  const eventDate =
    typeof event.date === "string" ? event.date : event.date.toISOString();
  const dateOnly = eventDate.split("T")[0];

  const [formData, setFormData] = useState({
    title: event.title,
    description: event.description || "",
    date: dateOnly,
    color: event.color,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Por favor, insira um título");
      return;
    }

    setLoading(true);
    try {
      // Corrigir timezone: criar data em UTC noon para evitar problemas de fuso horário
      const [year, month, day] = formData.date.split("-").map(Number);
      const dateUTC = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

      await updateDashboardEvent(event.id, {
        title: formData.title,
        description: formData.description,
        date: dateUTC,
        color: formData.color,
      });

      toast.success("Evento atualizado com sucesso!");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Erro ao atualizar evento:", error);
      toast.error("Erro ao atualizar evento");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteDashboardEvent(event.id);
      toast.success("Evento excluído com sucesso!");
      onOpenChange(false);
      setShowDeleteConfirm(false);
      onSuccess?.();
    } catch (error) {
      console.error("Erro ao excluir evento:", error);
      toast.error("Erro ao excluir evento");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 bg-linear-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-b border-blue-100 dark:border-blue-900/50">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 dark:bg-blue-500 shadow-lg shadow-blue-600/20">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <span className="bg-linear-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent font-semibold">Editar Evento</span>
          </DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-400 ml-[52px]">
            Atualize as informações do evento no calendário
          </DialogDescription>
        </DialogHeader>

        {showDeleteConfirm ? (
          <div className="px-6 py-6 space-y-6">
            <div className="flex items-start gap-4 p-5 rounded-xl bg-linear-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border-2 border-red-200 dark:border-red-800/50 shadow-sm">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/50 shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 pt-1">
                <p className="font-semibold text-lg text-red-900 dark:text-red-100 mb-1">
                  Confirmar exclusão
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
                  Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita e o evento será removido permanentemente do calendário.
                </p>
              </div>
            </div>

            <DialogFooter className="flex gap-3 sm:gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 h-11 border-2 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
                aria-label="Confirmar exclusão do evento"
                className="flex-1 h-11 bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg shadow-red-600/30"
              >
                {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {deleting ? "Excluindo..." : "Confirmar Exclusão"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Título *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Ex: Reunião, Entrega, Evento..."
                required
                className="h-11 border-2 focus:border-blue-500 dark:focus:border-blue-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Data *
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  required
                  className="h-11 border-2 focus:border-blue-500 dark:focus:border-blue-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Cor
                </Label>
                <Select
                  value={formData.color}
                  onValueChange={(value) =>
                    setFormData({ ...formData, color: value })
                  }
                >
                  <SelectTrigger className="h-11 border-2 focus:border-blue-500">
                    <SelectValue>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-5 h-5 rounded-full ${colorOptions.find(c => c.value === formData.color)?.bg || 'bg-gray-400'} shadow-md ring-2 ring-white dark:ring-slate-800 border-2 border-white dark:border-slate-700`} />
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {colorOptions.find(c => c.value === formData.color)?.label || 'Selecione'}
                        </span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="py-3 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full ${option.bg} shadow-lg ring-2 ring-white dark:ring-slate-800 border-2 border-white dark:border-slate-700`} />
                          <span className="font-medium text-slate-700 dark:text-slate-300">{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Descrição <span className="text-slate-400 dark:text-slate-500 font-normal">(opcional)</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Adicione detalhes sobre o evento..."
                rows={3}
                className="border-2 focus:border-blue-500 dark:focus:border-blue-400 resize-none"
              />
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
              {canDelete && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto h-11 border-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-300 dark:hover:border-red-800 font-medium"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={loading}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir Evento
                </Button>
              )}
              <div className="flex gap-3 w-full sm:w-auto sm:ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                  className="flex-1 sm:flex-initial h-11 border-2 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 sm:flex-initial h-11 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-600/30 font-medium"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
