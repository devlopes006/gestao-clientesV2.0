"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  createDashboardNote,
  deleteDashboardNote,
  updateDashboardNote,
} from "@/modules/dashboard/actions/dashboardNotes";
import { Edit, Loader2, Plus, StickyNote, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

const colorOptions = [
  { value: "yellow", label: "Amarelo", bg: "bg-yellow-100", border: "border-yellow-300", text: "text-yellow-900" },
  { value: "blue", label: "Azul", bg: "bg-blue-100", border: "border-blue-300", text: "text-blue-900" },
  { value: "green", label: "Verde", bg: "bg-green-100", border: "border-green-300", text: "text-green-900" },
  { value: "pink", label: "Rosa", bg: "bg-pink-100", border: "border-pink-300", text: "text-pink-900" },
  { value: "purple", label: "Roxo", bg: "bg-purple-100", border: "border-purple-300", text: "text-purple-900" },
];

interface DashboardNotesProps {
  initialNotes?: Note[];
}

export function DashboardNotes({ initialNotes = [] }: DashboardNotesProps) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  // keep local state in sync when server data updates
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setNotes(initialNotes); }, [initialNotes]);
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    color: "yellow",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleOpenDialog = (note?: Note) => {
    if (note) {
      setEditingNote(note);
      setFormData({
        title: note.title,
        content: note.content,
        color: note.color,
      });
    } else {
      setEditingNote(null);
      setFormData({
        title: "",
        content: "",
        color: "yellow",
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    setSubmitting(true);
    try {
      if (editingNote) {
        await updateDashboardNote(editingNote.id, formData);
        // optimistic local update
        setNotes((prev) => prev.map((n) => n.id === editingNote.id
          ? { ...n, title: formData.title.trim(), content: formData.content.trim(), color: formData.color }
          : n
        ));
        toast.success("Nota atualizada com sucesso!");
      } else {
        const created = await createDashboardNote(formData);
        // prepend new note optimistically
        setNotes((prev) => [{
          id: created.id,
          title: created.title,
          content: created.content,
          color: created.color || "yellow",
          position: created.position ?? 0,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        }, ...prev]);
        toast.success("Nota criada com sucesso!");
      }
      setDialogOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Erro ao salvar nota:", error);
      toast.error("Erro ao salvar nota");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir esta nota?")) return;

    try {
      await deleteDashboardNote(id);
      toast.success("Nota excluída com sucesso!");
      router.refresh();
    } catch (error) {
      console.error("Erro ao excluir nota:", error);
      toast.error("Erro ao excluir nota");
    }
  };

  const getColorClasses = (color: string) => {
    const colorOption = colorOptions.find((c) => c.value === color);
    return colorOption || colorOptions[0];
  };

  return (
    <>
      <Card variant="default" hover className="border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-full flex flex-col">
        <CardHeader className="shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-linear-to-br from-yellow-100 to-amber-100 dark:from-yellow-900/50 dark:to-amber-900/50 rounded-lg shadow-lg">
                <StickyNote className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <CardTitle className="text-base sm:text-lg">Notas Rápidas</CardTitle>
            </div>
            <Button
              size="sm"
              onClick={() => handleOpenDialog()}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nova</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          {notes.length === 0 ? (
            <div className="text-center py-8">
              <StickyNote className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                Nenhuma nota criada
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                Organize suas ideias e lembretes aqui
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {notes.map((note) => {
                const colorClasses = getColorClasses(note.color);
                const displayTitle = (note.title || '').trim().length > 0
                  ? (note.title || '').trim()
                  : (() => {
                    const firstLine = (note.content || '').split('\n')[0].trim()
                    return firstLine.length > 0 ? firstLine.slice(0, 60) : 'Sem título'
                  })()
                return (
                  <div
                    key={note.id}
                    className={`${colorClasses.bg} ${colorClasses.border} ${colorClasses.text} border-2 rounded-lg p-4 shadow-sm hover:shadow-md transition-all relative group`}
                  >
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenDialog(note)}
                        className="h-7 w-7 p-0 hover:bg-white/50"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(note.id)}
                        className="h-7 w-7 p-0 hover:bg-white/50 hover:text-red-600"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <h4 className="font-bold text-sm mb-2 pr-16 wrap-break-word">
                      {displayTitle}
                    </h4>
                    <p className="text-xs whitespace-pre-wrap wrap-break-word">
                      {note.content}
                    </p>
                    <p className="text-[10px] mt-3 opacity-60">
                      {new Date(note.updatedAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <StickyNote className="h-5 w-5 text-yellow-600" />
              {editingNote ? "Editar Nota" : "Nova Nota"}
            </DialogTitle>
            <DialogDescription>
              {editingNote
                ? "Atualize o conteúdo da sua nota"
                : "Crie uma nota rápida para organizar suas ideias"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Ex: Ideias, Tarefas, Lembretes..."
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
                        <div className={`w-4 h-4 rounded ${option.bg} ${option.border} border`} />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Conteúdo *</Label>
              <Textarea
                id="content"
                value={formData.content ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                placeholder="Digite o conteúdo da nota..."
                rows={6}
                required
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingNote ? "Atualizar" : "Criar Nota"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
