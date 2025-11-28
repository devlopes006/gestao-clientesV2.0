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
import { createDashboardEvent } from "@/modules/dashboard/actions/dashboardEvents";
import { Calendar, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: Date;
  onSuccess?: () => void;
  onEventCreated?: (event: {
    title: string;
    description: string;
    date: Date;
    color: string;
  }) => void;
}

const colorOptions = [
  { value: "blue", label: "Azul", bg: "bg-blue-500" },
  { value: "purple", label: "Roxo", bg: "bg-purple-500" },
  { value: "green", label: "Verde", bg: "bg-green-500" },
  { value: "red", label: "Vermelho", bg: "bg-red-500" },
  { value: "orange", label: "Laranja", bg: "bg-orange-500" },
  { value: "pink", label: "Rosa", bg: "bg-pink-500" },
];

export function CreateEventDialog({
  open,
  onOpenChange,
  selectedDate,
  onSuccess,
  onEventCreated,
}: CreateEventDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: selectedDate
      ? selectedDate.toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    color: "blue",
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
      const [year, month, day] = formData.date.split('-').map(Number);
      const dateUTC = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

      const newEvent = {
        title: formData.title,
        description: formData.description,
        date: dateUTC,
        color: formData.color,
      };

      await createDashboardEvent(newEvent);

      toast.success("Evento criado com sucesso!");
      setFormData({
        title: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
        color: "blue",
      });
      onOpenChange(false);
      onSuccess?.();
      onEventCreated?.(newEvent);
    } catch (error) {
      console.error("Erro ao criar evento:", error);
      toast.error("Erro ao criar evento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Criar Evento Avulso
          </DialogTitle>
          <DialogDescription>
            Adicione um evento personalizado ao calendário
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Ex: Reunião, Entrega, Evento..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Data *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Cor</Label>
            <Select
              value={formData.color}
              onValueChange={(value) =>
                setFormData({ ...formData, color: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {colorOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${option.bg}`} />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Detalhes do evento..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Evento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
