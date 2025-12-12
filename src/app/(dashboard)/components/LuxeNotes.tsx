"use client";

import {
  createDashboardNote,
  deleteDashboardNote,
  updateDashboardNote,
} from '@/modules/dashboard/actions/dashboardNotes';
import { DashboardNote } from '@prisma/client';
import {
  Plus,
  Trash2,
  X
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface LuxeNotesProps {
  initialNotes: DashboardNote[];
}

const NOTE_COLORS = [
  { value: 'yellow', name: 'Amarelo', bg: 'bg-yellow-500', light: 'bg-yellow-500/20', border: 'border-yellow-500/30' },
  { value: 'blue', name: 'Azul', bg: 'bg-blue-500', light: 'bg-blue-500/20', border: 'border-blue-500/30' },
  { value: 'pink', name: 'Rosa', bg: 'bg-pink-500', light: 'bg-pink-500/20', border: 'border-pink-500/30' },
  { value: 'green', name: 'Verde', bg: 'bg-green-500', light: 'bg-green-500/20', border: 'border-green-500/30' },
  { value: 'purple', name: 'Roxo', bg: 'bg-purple-500', light: 'bg-purple-500/20', border: 'border-purple-500/30' },
  { value: 'orange', name: 'Laranja', bg: 'bg-orange-500', light: 'bg-orange-500/20', border: 'border-orange-500/30' },
  { value: 'red', name: 'Vermelho', bg: 'bg-red-500', light: 'bg-red-500/20', border: 'border-red-500/30' },
  { value: 'cyan', name: 'Ciano', bg: 'bg-cyan-500', light: 'bg-cyan-500/20', border: 'border-cyan-500/30' },
];

export function LuxeNotes({ initialNotes }: LuxeNotesProps) {
  const [notes, setNotes] = useState<DashboardNote[]>(initialNotes);
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState<DashboardNote | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState('yellow');
  const [loading, setLoading] = useState(false);

  const handleSaveNote = async () => {
    if (!title.trim() && !content.trim()) {
      alert('Escreva algo na nota');
      return;
    }

    setLoading(true);
    try {
      if (editingNote) {
        const updated = await updateDashboardNote(editingNote.id, {
          title: title.trim() || content.trim().slice(0, 50),
          content: content.trim(),
          color,
        });
        setNotes(notes.map(n => n.id === editingNote.id ? updated : n));
      } else {
        const newNote = await createDashboardNote({
          title: title.trim() || content.trim().slice(0, 50),
          content: content.trim(),
          color,
        });
        setNotes([...notes, newNote]);
      }
      closeModal();
    } catch (error) {
      console.error('Erro ao salvar nota:', error);
      alert('Erro ao salvar nota');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Deletar esta nota?')) return;
    setLoading(true);
    try {
      await deleteDashboardNote(noteId);
      setNotes(notes.filter(n => n.id !== noteId));
    } catch (error) {
      console.error('Erro ao deletar nota:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingNote(null);
    setTitle('');
    setContent('');
    setColor('yellow');
    setShowModal(true);
  };

  const openEditModal = (note: DashboardNote) => {
    setEditingNote(note);
    setTitle(note.title || '');
    setContent(note.content || '');
    setColor(note.color || 'yellow');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingNote(null);
    setTitle('');
    setContent('');
    setColor('yellow');
  };

  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => (b.position || 0) - (a.position || 0));
  }, [notes]);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-white bg-gradient-to-r from-slate-600/20 to-slate-700/20 rounded-lg px-3 py-1.5 backdrop-blur-sm border border-slate-700/30">
          Notas Rápidas
        </h3>

        <button
          onClick={openCreateModal}
          className="px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-lg text-xs font-semibold transition-all duration-200 shadow-lg shadow-yellow-500/20 flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Nova
        </button>
      </div>

      {/* Grid de Notas */}
      {sortedNotes.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 max-h-[340px] overflow-y-auto pr-2">
          {sortedNotes.map((note) => {
            const colorObj = NOTE_COLORS.find(c => c.value === note.color) || NOTE_COLORS[0];

            return (
              <div
                key={note.id}
                onClick={() => openEditModal(note)}
                className={`group relative p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer hover:scale-105 hover:shadow-xl ${colorObj.light} ${colorObj.border} bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-sm`}
              >
                {/* Barra de cor no topo */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${colorObj.bg} rounded-t-lg`} />

                {/* Conteúdo */}
                <div className="mt-1 space-y-1.5">
                  {note.title && (
                    <h4 className="text-xs font-bold text-white line-clamp-2 leading-tight">
                      {note.title}
                    </h4>
                  )}
                  {note.content && (
                    <p className="text-[11px] text-slate-300 line-clamp-3 leading-relaxed">
                      {note.content}
                    </p>
                  )}
                </div>

                {/* Menu de ações - Hover */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNote(note.id);
                  }}
                  className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 transition-all bg-red-500/20 hover:bg-red-500/40 rounded-lg"
                  disabled={loading}
                >
                  <Trash2 className="w-3 h-3 text-red-400" />
                </button>

                {/* Data */}
                <p className="text-[9px] text-slate-400 mt-2 pt-2 border-t border-slate-600/20">
                  {new Date(note.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-sm text-slate-400 mb-3">Nenhuma nota ainda</p>
          <button
            onClick={openCreateModal}
            className="px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-300 rounded-lg text-xs font-semibold transition-all"
          >
            Criar primeira nota
          </button>
        </div>
      )}

      {/* Modal de criação/edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700/50 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-slate-700/30">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">
                  {editingNote ? 'Editar' : 'Nova'} Nota
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
                placeholder="Título (opcional)"
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-yellow-500 focus:outline-none transition-all"
                autoFocus
              />

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Escreva sua nota..."
                rows={4}
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-yellow-500 focus:outline-none resize-none transition-all"
              />

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-2 block">Cor</label>
                <div className="grid grid-cols-4 gap-2">
                  {NOTE_COLORS.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setColor(c.value)}
                      className={`h-8 rounded-lg border-2 transition-all ${color === c.value ? `${c.border} ring-2 ring-offset-2 ring-offset-slate-900` : 'border-slate-700'} ${c.bg}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-700/30 flex items-center gap-3">
              {editingNote && (
                <button
                  onClick={() => handleDeleteNote(editingNote.id)}
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
                onClick={handleSaveNote}
                disabled={loading || (!title.trim() && !content.trim())}
                className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-50 shadow-lg shadow-yellow-500/20"
              >
                {loading ? 'Salvando...' : editingNote ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .max-h-\[340px\]::-webkit-scrollbar {
          width: 4px;
        }
        .max-h-\[340px\]::-webkit-scrollbar-track {
          background: transparent;
        }
        .max-h-\[340px\]::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.2);
          border-radius: 2px;
        }
        .max-h-\[340px\]::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.4);
        }
      `}</style>
    </div>
  );
}
