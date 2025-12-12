"use client";

import {
  createDashboardNote,
  deleteDashboardNote,
  updateDashboardNote,
} from '@/modules/dashboard/actions/dashboardNotes';
import { DashboardNote } from '@prisma/client';
import {
  Edit2,
  MoreVertical,
  Plus,
  Search,
  StickyNote,
  Trash2,
  X
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface PremiumNotesProps {
  initialNotes: DashboardNote[];
}

const NOTE_COLORS = [
  { name: 'Amarelo', value: 'yellow', bg: 'bg-yellow-500', border: 'border-yellow-500/30', light: 'bg-yellow-500/10' },
  { name: 'Azul', value: 'blue', bg: 'bg-blue-500', border: 'border-blue-500/30', light: 'bg-blue-500/10' },
  { name: 'Rosa', value: 'pink', bg: 'bg-pink-500', border: 'border-pink-500/30', light: 'bg-pink-500/10' },
  { name: 'Verde', value: 'green', bg: 'bg-green-500', border: 'border-green-500/30', light: 'bg-green-500/10' },
  { name: 'Roxo', value: 'purple', bg: 'bg-purple-500', border: 'border-purple-500/30', light: 'bg-purple-500/10' },
  { name: 'Laranja', value: 'orange', bg: 'bg-orange-500', border: 'border-orange-500/30', light: 'bg-orange-500/10' },
  { name: 'Vermelho', value: 'red', bg: 'bg-red-500', border: 'border-red-500/30', light: 'bg-red-500/10' },
  { name: 'Ciano', value: 'cyan', bg: 'bg-cyan-500', border: 'border-cyan-500/30', light: 'bg-cyan-500/10' },
];

export function PremiumNotes({ initialNotes }: PremiumNotesProps) {
  const [notes, setNotes] = useState<DashboardNote[]>(initialNotes);
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState<DashboardNote | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState('yellow');
  const [loading, setLoading] = useState(false);

  // Filtrar notas
  const filteredNotes = useMemo(() => {
    return notes
      .filter(note => {
        const matchesSearch =
          note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.content?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesColor = !selectedColor || note.color === selectedColor;
        return matchesSearch && matchesColor;
      })
      .sort((a, b) => (b.position || 0) - (a.position || 0));
  }, [notes, searchQuery, selectedColor]);

  // Abrir modal para criar nota
  const openCreateModal = () => {
    setEditingNote(null);
    setTitle('');
    setContent('');
    setColor('yellow');
    setShowModal(true);
  };

  // Abrir modal para editar nota
  const openEditModal = (note: DashboardNote) => {
    setEditingNote(note);
    setTitle(note.title || '');
    setContent(note.content || '');
    setColor(note.color || 'yellow');
    setShowModal(true);
    setShowMenu(null);
  };

  // Salvar nota (criar ou atualizar)
  const handleSaveNote = async () => {
    if (!title.trim() && !content.trim()) {
      alert('Escreva algo na nota');
      return;
    }

    setLoading(true);
    try {
      if (editingNote) {
        // Atualizar nota existente
        const updated = await updateDashboardNote(editingNote.id, {
          title: title.trim() || content.trim().slice(0, 50),
          content: content.trim(),
          color,
        });
        setNotes(notes.map(n => n.id === editingNote.id ? updated : n));
      } else {
        // Criar nova nota
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

  // Deletar nota
  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta nota?')) return;

    setLoading(true);
    try {
      await deleteDashboardNote(noteId);
      setNotes(notes.filter(n => n.id !== noteId));
      setShowMenu(null);
    } catch (error) {
      console.error('Erro ao deletar nota:', error);
      alert('Erro ao deletar nota');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingNote(null);
    setTitle('');
    setContent('');
    setColor('yellow');
  };

  // Obter classe de cor
  const getColorClasses = (colorValue: string) => {
    const colorObj = NOTE_COLORS.find(c => c.value === colorValue) || NOTE_COLORS[0];
    return colorObj;
  };

  return (
    <div className="space-y-4">
      {/* Cabeçalho com controles */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3 flex-1">
          <StickyNote className="w-5 h-5 text-yellow-400" />
          <h3 className="text-lg font-bold text-white">Notas Rápidas</h3>

          {/* Contador */}
          <span className="px-2 py-1 text-xs bg-slate-800/50 text-slate-400 rounded-full font-semibold">
            {filteredNotes.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar..."
              className="pl-8 pr-3 py-1.5 bg-slate-800/50 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none w-32"
            />
          </div>

          {/* Filtro de cor */}
          <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1">
            <button
              onClick={() => setSelectedColor(null)}
              className={`px-2 py-1 rounded text-xs transition-all ${!selectedColor ? 'bg-blue-500/20 text-blue-300' : 'text-slate-400 hover:text-white'}`}
            >
              Todas
            </button>
            {NOTE_COLORS.slice(0, 4).map(c => (
              <button
                key={c.value}
                onClick={() => setSelectedColor(selectedColor === c.value ? null : c.value)}
                className={`w-6 h-6 rounded border-2 transition-all ${selectedColor === c.value ? 'border-white scale-110' : 'border-slate-700'}`}
                style={{ backgroundColor: c.bg.replace('bg-', '#').replace('500', '') }}
                title={c.name}
              />
            ))}
          </div>

          {/* Botão criar */}
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-300 rounded-lg transition-all font-semibold text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova
          </button>
        </div>
      </div>

      {/* Grid de notas */}
      {filteredNotes.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {filteredNotes.map((note) => {
            const colorClasses = getColorClasses(note.color || 'yellow');

            return (
              <div
                key={note.id}
                className={`${colorClasses.light} border ${colorClasses.border} rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg group relative`}
                onClick={() => openEditModal(note)}
              >
                {/* Barra de cor no topo */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${colorClasses.bg} rounded-t-xl`} />

                {/* Menu de ações */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(showMenu === note.id ? null : note.id);
                    }}
                    className="p-1 hover:bg-black/20 rounded transition-all"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {showMenu === note.id && (
                    <div className="absolute right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-10 min-w-[120px]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(note);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 transition-all"
                      >
                        <Edit2 className="w-3 h-3" />
                        Editar
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note.id);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                        Deletar
                      </button>
                    </div>
                  )}
                </div>

                {/* Conteúdo da nota */}
                <div className="mt-2">
                  {note.title && (
                    <h4 className="text-sm font-bold text-white mb-2 line-clamp-2 pr-6">
                      {note.title}
                    </h4>
                  )}
                  {note.content && (
                    <p className="text-xs text-slate-300 line-clamp-4 leading-relaxed">
                      {note.content}
                    </p>
                  )}
                </div>

                {/* Rodapé com data */}
                <div className="mt-3 pt-2 border-t border-slate-700/30">
                  <p className="text-[10px] text-slate-400">
                    {new Date(note.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short'
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <StickyNote className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <p className="text-slate-400 text-sm">
            {searchQuery || selectedColor ? 'Nenhuma nota encontrada' : 'Nenhuma nota ainda'}
          </p>
          <button
            onClick={openCreateModal}
            className="mt-3 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 rounded-lg transition-all text-xs font-semibold"
          >
            Criar primeira nota
          </button>
        </div>
      )}

      {/* Modal de criação/edição */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <StickyNote className="w-5 h-5 text-yellow-400" />
                {editingNote ? 'Editar Nota' : 'Nova Nota'}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-slate-800 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo */}
            <div className="p-6 space-y-4">
              {/* Título */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Título (opcional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Ideias para projeto..."
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-yellow-500 focus:outline-none"
                  autoFocus
                />
              </div>

              {/* Conteúdo */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Conteúdo *
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Escreva sua nota aqui..."
                  rows={6}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-yellow-500 focus:outline-none resize-none"
                />
              </div>

              {/* Cor */}
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-3">
                  Cor da Nota
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {NOTE_COLORS.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setColor(c.value)}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${color === c.value
                          ? `${c.border} ${c.light} ring-2 ring-offset-2 ring-offset-slate-900`
                          : 'border-slate-700/50 hover:border-slate-600'
                        }`}
                    >
                      <div className={`w-6 h-6 rounded-full ${c.bg}`} />
                      <span className={`text-xs font-medium ${color === c.value ? 'text-white' : 'text-slate-400'}`}>
                        {c.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Rodapé */}
            <div className="flex items-center justify-between gap-3 p-6 border-t border-slate-700/50">
              {editingNote && (
                <button
                  onClick={() => handleDeleteNote(editingNote.id)}
                  disabled={loading}
                  className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl transition-all disabled:opacity-50 font-semibold text-sm"
                >
                  Deletar
                </button>
              )}

              <div className="flex items-center gap-3 ml-auto">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveNote}
                  disabled={loading || (!title.trim() && !content.trim())}
                  className="px-5 py-2 bg-yellow-500 hover:bg-yellow-600 text-slate-900 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                >
                  {loading ? 'Salvando...' : editingNote ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.5);
        }
      `}</style>
    </div>
  );
}
