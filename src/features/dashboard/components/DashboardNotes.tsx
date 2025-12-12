"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createDashboardNote, deleteDashboardNote, updateDashboardNote } from "@/modules/dashboard/actions/dashboardNotes";
import { Edit, GripVertical, Loader2, Plus, Search, StickyNote, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
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

type ColorValue = "yellow" | "blue" | "green" | "pink" | "purple";
type FilterColor = ColorValue | "all";

const colorOptions: { value: ColorValue; label: string }[] = [
  { value: "yellow", label: "Amarelo" },
  { value: "blue", label: "Azul" },
  { value: "green", label: "Verde" },
  { value: "pink", label: "Rosa" },
  { value: "purple", label: "Roxo" },
];

interface DashboardNotesProps {
  initialNotes?: Note[];
}

export function DashboardNotes({ initialNotes = [] }: DashboardNotesProps) {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [query, setQuery] = useState("");
  const [filterColor, setFilterColor] = useState<FilterColor>("all");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState<null | "create" | "edit">(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<{ title: string; description: string; color: string }>({ title: "", description: "", color: "yellow" });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  const filteredNotes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return notes
      .filter((n) => (filterColor === "all" ? true : n.color === filterColor))
      .filter((n) => (q ? n.title?.toLowerCase().includes(q) || n.content?.toLowerCase().includes(q) : true))
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }, [notes, query, filterColor]);

  const startCreate = () => {
    setForm({ title: "", description: "", color: filterColor === "all" ? "yellow" : (filterColor as string) });
    setEditingId(null);
    setFormOpen("create");
    setErrorMsg(null);
  };

  const startEdit = (n: Note) => {
    setEditingId(n.id);
    setForm({ title: n.title || "", description: n.content || "", color: n.color || "yellow" });
    setFormOpen("edit");
    setErrorMsg(null);
  };

  const closeForm = () => {
    setFormOpen(null);
    setEditingId(null);
    setErrorMsg(null);
  };

  const validate = () => {
    const t = form.title.trim();
    const d = form.description.trim();
    if (!t) {
      setErrorMsg("Título é obrigatório");
      return false;
    }
    if (!d) {
      setErrorMsg("Descrição é obrigatória");
      return false;
    }
    if (t.length > 100) {
      setErrorMsg("Título deve ter até 100 caracteres");
      return false;
    }
    if (d.length > 2000) {
      setErrorMsg("Descrição deve ter até 2000 caracteres");
      return false;
    }
    setErrorMsg(null);
    return true;
  };

  const submitForm = async () => {
    if (!validate()) return;
    setSubmitting(true);
    const toastId = toast.loading(formOpen === "edit" ? "Atualizando nota..." : "Criando nota...");
    try {
      if (formOpen === "edit" && editingId) {
        const updated = await updateDashboardNote(editingId, { title: form.title.trim(), content: form.description.trim(), color: form.color });
        setNotes((prev) => prev.map((n) => (n.id === editingId ? ({ ...n, ...updated } as Note) : n)));
        toast.success("Nota atualizada", { id: toastId });
      } else {
        const created = await createDashboardNote({ title: form.title.trim(), content: form.description.trim(), color: form.color });
        setNotes((prev) => [{ ...created }, ...prev]);
        toast.success("Nota criada", { id: toastId });
      }
      router.refresh();
      closeForm();
    } catch {
      toast.error("Falha ao salvar nota", { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreate = () => startCreate();

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir esta nota?")) return;
    setDeleting(id);
    const toastId = toast.loading("Excluindo nota...");
    try {
      await deleteDashboardNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      toast.success("Nota excluída", { id: toastId });
    } catch {
      toast.error("Erro ao excluir nota", { id: toastId });
    } finally {
      setDeleting(null);
    }
  };

  // Drag & drop reordering
  const dragId = useRef<string | null>(null);
  const onDragStart = (id: string) => (e: React.DragEvent) => {
    dragId.current = id;
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const onDrop = (targetId: string) => async (e: React.DragEvent) => {
    e.preventDefault();
    const sourceId = dragId.current;
    dragId.current = null;
    if (!sourceId || sourceId === targetId) return;
    let newOrder: Note[] = [];
    setNotes((prev) => {
      const srcIdx = prev.findIndex((n) => n.id === sourceId);
      const tgtIdx = prev.findIndex((n) => n.id === targetId);
      if (srcIdx < 0 || tgtIdx < 0) return prev;
      const copy = [...prev];
      const [item] = copy.splice(srcIdx, 1);
      copy.splice(tgtIdx, 0, item);
      newOrder = copy.map((n, idx) => ({ ...n, position: idx }));
      return newOrder;
    });
    try {
      for (let i = 0; i < newOrder.length; i++) {
        const n = newOrder[i];
        await updateDashboardNote(n.id, { position: i });
      }
      router.refresh();
    } catch {
      toast.error("Falha ao reordenar notas");
    }
  };

  const getGradient = (color: string) => {
    const gradients: Record<string, string> = {
      yellow: "bg-yellow-50 dark:bg-yellow-900/20",
      blue: "bg-blue-50 dark:bg-blue-900/20",
      green: "bg-green-50 dark:bg-green-900/20",
      pink: "bg-pink-50 dark:bg-pink-900/20",
      purple: "bg-purple-50 dark:bg-purple-900/20",
    };
    return gradients[color] || gradients.yellow;
  };

  const getAccent = (color: string) => {
    const accents: Record<string, string> = {
      yellow: "bg-yellow-300 dark:bg-yellow-500",
      blue: "bg-blue-300 dark:bg-blue-500",
      green: "bg-green-300 dark:bg-green-500",
      pink: "bg-pink-300 dark:bg-pink-500",
      purple: "bg-purple-300 dark:bg-purple-500",
    };
    return accents[color] || accents.yellow;
  };

  return (
    <Card className="h-full border border-slate-200 dark:border-slate-800">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 px-3 py-2 w-full sm:w-[280px]">
            <Search className="w-4 h-4 text-slate-500" />
            <input className="bg-transparent outline-none text-sm flex-1" placeholder="Buscar notas..." value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <Select value={filterColor} onValueChange={(v) => setFilterColor(v as FilterColor)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Cor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {colorOptions.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" className="gap-2" onClick={handleCreate} disabled={submitting && formOpen === "create"}>
          {submitting && formOpen === "create" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Nova
        </Button>
      </div>

      {/* Form (Create/Edit) with live preview */}
      {formOpen && (
        <div className="px-3 pb-3">
          {errorMsg && <div className="mb-2 text-sm text-red-600">{errorMsg}</div>}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Input aria-label="Título" placeholder="Título da nota" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={100} />
              <textarea aria-label="Descrição" placeholder="Descrição da nota" className="w-full text-sm rounded-md border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 p-2 min-h-[100px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <Select value={form.color} onValueChange={(v) => setForm({ ...form, color: v })}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Cor" /></SelectTrigger>
                <SelectContent>
                  {colorOptions.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button size="sm" onClick={submitForm} disabled={submitting}>{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Salvar</Button>
                <Button size="sm" variant="outline" onClick={closeForm}>Cancelar</Button>
              </div>
            </div>
            <div className={`rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-gradient-to-br ${getGradient(form.color)} resize-y`}>
              <div className="font-semibold text-sm text-slate-900 dark:text-white mb-1">{form.title || "Prévia da nota"}</div>
              <div className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{form.description || "A descrição aparecerá aqui."}</div>
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="p-3 grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Left: cards grid (2 cols on large) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:col-span-2">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-8 col-span-full">
              <StickyNote className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">Nenhuma nota encontrada</p>
            </div>
          ) : (
            filteredNotes.map((note) => {
              const isDeleting = deleting === note.id;
              return (
                <div
                  key={note.id}
                  draggable
                  onDragStart={onDragStart(note.id)}
                  onDragOver={onDragOver}
                  onDrop={onDrop(note.id)}
                  className={`group relative overflow-hidden rounded-xl ${getGradient(note.color)} border border-slate-200 dark:border-slate-800 p-3 hover:shadow-md transition-all ${isDeleting ? "opacity-50 pointer-events-none" : ""} resize-y`}
                >
                  <div className={`absolute left-0 top-0 h-full w-1 ${getAccent(note.color)}`} />
                  <div className="absolute top-2 left-2 text-slate-400">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(note)} disabled={isDeleting} aria-label="Editar">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDelete(note.id)} disabled={isDeleting} aria-label="Excluir">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="text-left w-full">
                    <div className="font-semibold text-sm text-slate-900 dark:text-white mb-1">{note.title?.trim() || (note.content?.split('\n')[0] ?? "Sem título")}</div>
                    <div className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{note.content}</div>
                    <div className="text-[10px] mt-2 text-slate-500">Atualizada {new Date(note.updatedAt).toLocaleDateString("pt-BR")}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: side panel editor */}
        <div className="lg:col-span-1">
          {formOpen && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-3">
              {errorMsg && <div className="mb-2 text-sm text-red-600">{errorMsg}</div>}
              <div className="space-y-2">
                <Input aria-label="Título" placeholder="Título da nota" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={100} />
                <textarea aria-label="Descrição" placeholder="Descrição da nota" className="w-full text-sm rounded-md border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 p-2 min-h-[140px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                <div className="flex items-center gap-2">
                  <Select value={form.color} onValueChange={(v) => setForm({ ...form, color: v })}>
                    <SelectTrigger className="w-[160px]"><SelectValue placeholder="Cor" /></SelectTrigger>
                    <SelectContent>
                      {colorOptions.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className={`flex-1 rounded-lg p-2 border bg-gradient-to-br ${getGradient(form.color)} border-slate-200 dark:border-slate-800`}>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300">Prévia</div>
                    <div className="font-medium text-sm text-slate-900 dark:text-white">{form.title || "Título"}</div>
                    <div className="text-xs text-slate-700 dark:text-slate-300">{form.description || "Descrição..."}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={submitForm} disabled={submitting}>{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Salvar</Button>
                  <Button size="sm" variant="outline" onClick={closeForm}>Cancelar</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
