"use client";

import {
  createDashboardNote,
  deleteDashboardNote,
  updateDashboardNote,
} from '@/modules/dashboard/actions/dashboardNotes';
import { DashboardNote } from '@prisma/client';
import { GripVertical, Plus, Trash2, X } from 'lucide-react';
import React, { useState } from 'react';

interface FunctionalNotesProps {
  initialNotes: DashboardNote[];
}

const NOTE_COLORS = [
  { name: 'yellow', bg: 'from-yellow-500/20 to-yellow-600/10', border: 'border-yellow-500/30', text: 'text-yellow-300' },
  { name: 'blue', bg: 'from-blue-500/20 to-blue-600/10', border: 'border-blue-500/30', text: 'text-blue-300' },
  { name: 'pink', bg: 'from-pink-500/20 to-pink-600/10', border: 'border-pink-500/30', text: 'text-pink-300' },
  { name: 'green', bg: 'from-green-500/20 to-green-600/10', border: 'border-green-500/30', text: 'text-green-300' },
  { name: 'purple', bg: 'from-purple-500/20 to-purple-600/10', border: 'border-purple-500/30', text: 'text-purple-300' },
  { name: 'orange', bg: 'from-orange-500/20 to-orange-600/10', border: 'border-orange-500/30', text: 'text-orange-300' },
  { name: 'red', bg: 'from-red-500/20 to-red-600/10', border: 'border-red-500/30', text: 'text-red-300' },
  { name: 'cyan', bg: 'from-cyan-500/20 to-cyan-600/10', border: 'border-cyan-500/30', text: 'text-cyan-300' },
];

export function FunctionalNotes({ initialNotes }: FunctionalNotesProps) {
  const [notes, setNotes] = useState<DashboardNote[]>(initialNotes);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState('yellow');
  const [loading, setLoading] = useState(false);
  const [draggedNote, setDraggedNote] = useState<string | null>(null);

  // Handle creating/updating note
  const handleSaveNote = async (): Promise<void> => {
    if (!title.trim() && !content.trim()) {
      alert('Escreva algo na nota');
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        // Update existing note
        const updated = await updateDashboardNote(editingId, {
          title: title.trim() || content.trim().slice(0, 60),
          content: content.trim(),
          color,
        });
        setNotes(notes.map(n => n.id === editingId ? updated : n));
      } else {
        // Create new note
        const newNote = await createDashboardNote({
          title: title.trim() || content.trim().slice(0, 60),
          content: content.trim(),
          color,
        });
        setNotes([...notes, newNote]);
      }

      setTitle('');
      setContent('');
      setColor('yellow');
      setShowModal(false);
      setEditingId(null);
    } catch (error) {
      console.error('Erro ao salvar nota:', error);
      alert('Erro ao salvar nota');
    } finally {
      setLoading(false);
    }
  };

  // Handle opening note for editing
  const handleEditNote = (note: DashboardNote) => {
    setEditingId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setColor(note.color || 'yellow');
    setShowModal(true);
  };

  // Handle deleting note with confirmation
  const handleDeleteNote = async (noteId: string) => {
    setLoading(true);
    try {
      await deleteDashboardNote(noteId);
      setNotes(notes.filter(n => n.id !== noteId));
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Erro ao deletar nota:', error);
      alert('Erro ao deletar nota');
    } finally {
      setLoading(false);
    }
  };

  // Handle drag and drop reordering
  const handleDragStart = (noteId: string) => {
    setDraggedNote(noteId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetId: string) => {
    if (!draggedNote || draggedNote === targetId) return;

    const draggedIndex = notes.findIndex(n => n.id === draggedNote);
    const targetIndex = notes.findIndex(n => n.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newNotes = [...notes];
    [newNotes[draggedIndex], newNotes[targetIndex]] = [newNotes[targetIndex], newNotes[draggedIndex]];

    setNotes(newNotes);
    setDraggedNote(null);

    // Update positions in database
    try {
      await Promise.all(
        newNotes.map((note, idx) =>
          updateDashboardNote(note.id, { position: idx })
        )
      );
    } catch (error) {
      console.error('Erro ao reordenar notas:', error);
    }
  };

  const getColorClasses = (colorName: string) => {
    return NOTE_COLORS.find(c => c.name === colorName) || NOTE_COLORS[0];
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          📝 Notas Rápidas
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500/20 to-pink-600/10 hover:from-pink-500/30 hover:to-pink-600/20 border border-pink-500/30 text-pink-300 rounded-lg text-sm font-semibold transition-all"
        >
          <Plus className="w-4 h-4" />
          Nova Nota
        </button>
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {notes.length > 0 ? (
          notes.map((note) => {
            const colorClass = getColorClasses(note.color || 'yellow');
            return (
              <div
                key={note.id}
                draggable
                onDragStart={() => handleDragStart(note.id)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(note.id)}
                className={`bg-gradient-to-br ${colorClass.bg} border-2 ${colorClass.border} rounded-xl p-4 cursor-move group transition-all hover:shadow-lg hover:shadow-slate-900`}
              >
                {/* Drag Handle */}
                <div className="flex items-start justify-between mb-3">
                  <GripVertical className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditNote(note)}
                      className="p-1 hover:bg-black/20 rounded transition-all opacity-0 group-hover:opacity-100"
                      disabled={loading}
                      title="Editar nota"
                    >
                      <Plus className="w-4 h-4 text-slate-400" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(note.id)}
                      className="p-1 hover:bg-black/20 rounded transition-all opacity-0 group-hover:opacity-100"
                      disabled={loading}
                      title="Deletar nota"
                    >
                      <Trash2 className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>

                {/* Title */}
                <h3 className={`font-bold text-sm mb-2 line-clamp-2 ${colorClass.text}`}>
                  {note.title}
                </h3>

                {/* Content */}
                <p className="text-slate-300 text-xs leading-relaxed line-clamp-4">
                  {note.content}
                </p>

                {/* Date */}
                <p className="text-[10px] text-slate-500 mt-3">
                  {new Date(note.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                  })}
                </p>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-8">
            <p className="text-slate-400">Nenhuma nota criada. Clique em &quot;Nova Nota&quot; para começar!</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">
                {editingId ? 'Editar Nota' : 'Nova Nota'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingId(null);
                  setTitle('');
                  setContent('');
                  setColor('yellow');
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
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Título (opcional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Revisão do projeto"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-pink-500 focus:outline-none"
                  autoFocus
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Conteúdo
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="O que você precisa lembrar?"
                  rows={5}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-pink-500 focus:outline-none resize-none"
                />
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Cor
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {NOTE_COLORS.map(c => (
                    <button
                      key={c.name}
                      onClick={() => setColor(c.name)}
                      className={`aspect-square rounded-lg border-2 transition-all ${color === c.name ? 'border-white scale-110' : 'border-slate-600'
                        } ${c.bg}`}
                      title={`Selecionar cor ${c.name}`}
                    />
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingId(null);
                    setTitle('');
                    setContent('');
                    setColor('yellow');
                  }}
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveNote}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-all disabled:opacity-50"
                >
                  {loading ? (editingId ? 'Atualizando...' : 'Criando...') : (editingId ? 'Atualizar' : 'Criar Nota')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-white mb-4">Deletar Nota?</h3>
            <p className="text-slate-400 text-sm mb-6">
              Tem certeza que deseja deletar esta nota? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteConfirmId && handleDeleteNote(deleteConfirmId)}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all disabled:opacity-50 font-semibold"
              >
                {loading ? 'Deletando...' : 'Deletar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
