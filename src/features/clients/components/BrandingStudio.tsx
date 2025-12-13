"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useState } from "react";
// React Query migration: removed SWR
import AssetCard from "./AssetCard";
import CanvasPreview from "./CanvasPreview";
import Uploader from "./Uploader";

interface BrandingItem {
  id: string;
  title: string;
  type: string;
  description?: string | null;
  fileUrl?: string | null;
  content?: string | null;
  thumbUrl?: string | null;
  palette?: string[] | null;
  createdAt?: string | null;
}

interface MediaUploadResult {
  url?: string;
  thumbUrl?: string;
  title?: string;
  fileName?: string;
  colors?: string[] | null;
}

interface BrandingStudioProps {
  clientId: string;
}

export default function BrandingStudio({ clientId }: BrandingStudioProps) {
  const queryClient = useQueryClient();
  const brandingQueryKey = ["branding", clientId];
  const { data } = useQuery<BrandingItem[]>({
    queryKey: brandingQueryKey,
    queryFn: async () => {
      const r = await fetch(`/api/clients/${clientId}/branding`, { credentials: "include" });
      if (!r.ok) throw new Error("Falha ao carregar branding");
      return r.json();
    },
    staleTime: 30_000,
  });
  const items = data ?? [];
  // Removed unused local updater to satisfy lint
  const invalidateBranding = () => queryClient.invalidateQueries({ queryKey: brandingQueryKey });
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name">("newest");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<BrandingItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<BrandingItem | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerItem, setViewerItem] = useState<BrandingItem | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "asset",
    fileUrl: "",
    content: "",
    thumbUrl: undefined as string | undefined,
    palette: undefined as string[] | undefined,
  });

  async function createBrandingFromMedia(media: { url?: string; thumbUrl?: string; title?: string; colors?: string[] | null }) {
    try {
      const body = {
        title: media.title ?? "Arquivo",
        type: "asset",
        description: null,
        fileUrl: media.url ?? null,
        content: null,
        thumbUrl: media.thumbUrl ?? null,
        palette: media.colors ?? null,
      };
      const res = await fetch(`/api/clients/${clientId}/branding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) return null;
      const created = await res.json();
      invalidateBranding();
      return created;
    } catch {
      return null;
    }
  }

  function openCreateModal() {
    setEditing(null);
    setForm({ title: "", description: "", type: "asset", fileUrl: "", content: "", thumbUrl: undefined, palette: undefined });
    setIsModalOpen(true);
  }

  function openEditModal(item: BrandingItem) {
    setEditing(item);
    setForm({ title: item.title ?? "", description: item.description ?? "", type: item.type ?? "asset", fileUrl: item.fileUrl ?? "", content: item.content ?? "", thumbUrl: item.thumbUrl ?? undefined, palette: item.palette ?? undefined });
    setIsModalOpen(true);
  }

  function openViewer(item: BrandingItem) {
    setViewerItem(item);
    setViewerOpen(true);
  }

  function closeViewer() {
    setViewerOpen(false);
    setViewerItem(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir item de branding?")) return;
    try {
      const res = await fetch(`/api/clients/${clientId}/branding?brandingId=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      invalidateBranding();
      setSelected((s) => (s && s.id === id ? null : s));
    } catch {
      // noop
    }
  }

  async function handleModalSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      try {
        const res = await fetch(`/api/clients/${clientId}/branding?brandingId=${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          invalidateBranding();
          setIsModalOpen(false);
          setEditing(null);
        }
      } catch {
        // noop
      }
    } else {
      try {
        const res = await fetch(`/api/clients/${clientId}/branding`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          invalidateBranding();
          setIsModalOpen(false);
        }
      } catch {
        // noop
      }
    }
  }

  // helper: upload a single file to media upload endpoint and return parsed result
  async function uploadFileToMedia(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("title", file.name);
    const res = await fetch(`/api/clients/${clientId}/media/upload`, { method: "POST", body: fd });
    if (!res.ok) return null;
    const obj = await res.json();
    return obj as MediaUploadResult;
  }

  async function saveSelected(updated: Partial<BrandingItem>) {
    if (!selected) return;
    try {
      const res = await fetch(`/api/clients/${clientId}/branding?brandingId=${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error("Failed");
      invalidateBranding();
      setSelected(null);
    } catch {
      // noop
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function bulkDelete() {
    if (!confirm(`Excluir ${selectedIds.size} itens?`)) return;
    try {
      for (const id of Array.from(selectedIds)) {
        await fetch(`/api/clients/${clientId}/branding?brandingId=${id}`, { method: "DELETE" });
      }
      invalidateBranding();
      clearSelection();
    } catch {
      // noop
    }
  }

  const filtered = items.filter((it) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (it.title && it.title.toLowerCase().includes(q)) || (it.type && it.type.toLowerCase().includes(q));
  }).sort((a, b) => {
    if (sortBy === 'name') return (a.title || '').localeCompare(b.title || '');
    const ta = new Date(a.createdAt ?? 0).getTime();
    const tb = new Date(b.createdAt ?? 0).getTime();
    if (sortBy === 'newest') return tb - ta;
    return ta - tb;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 text-transparent bg-clip-text">
          Branding Studio
        </h1>
        <p className="text-sm text-slate-400">Crie e gerencie a identidade visual do cliente</p>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button className="bg-purple-600 hover:bg-purple-500 text-white">Publicar Versão</Button>
        <Button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-500 text-white">Criar Item</Button>
      </div>

      {/* Toolbar */}
      <Card className="bg-slate-900 border border-slate-700/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <input aria-label="Pesquisar" placeholder="Pesquisar assets" className="flex-1 min-w-[200px] p-2 bg-slate-800 border border-slate-700 text-white placeholder:text-slate-400 rounded-lg focus:border-blue-500 focus:outline-none" value={query} onChange={(e) => setQuery(e.target.value)} />
            <select aria-label="Ordenar" value={sortBy} onChange={(e) => setSortBy(e.target.value as "newest" | "oldest" | "name")} className="p-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:border-blue-500 focus:outline-none">
              <option value="newest">Mais recentes</option>
              <option value="oldest">Mais antigos</option>
              <option value="name">Nome</option>
            </select>
            <div className="flex items-center gap-2">
              <button aria-label="Ver como grade" onClick={() => setViewMode('grid')} className={`p-2 px-3 border rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}>Grade</button>
              <button aria-label="Ver como lista" onClick={() => setViewMode('list')} className={`p-2 px-3 border rounded-lg transition-colors ${viewMode === 'list' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}>Lista</button>
            </div>
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <div className="text-sm text-slate-300">{selectedIds.size} selecionado(s)</div>
                <Button size="sm" variant="ghost" onClick={bulkDelete} className="text-red-400 hover:text-red-300 hover:bg-slate-800">Excluir</Button>
                <Button size="sm" onClick={clearSelection} className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">Limpar</Button>
              </div>
            )}
            {selectedIds.size === 0 && (
              <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set(filtered.map(i => i.id)))} className="text-slate-300 hover:bg-slate-800 ml-auto">Selecionar todos</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Canvas Preview */}
      <Card className="bg-slate-900 border border-slate-700/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-white">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span>Canvas Preview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CanvasPreview />
        </CardContent>
      </Card>

      {/* Grid de Assets e Inspector */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Assets */}
        <Card className="bg-slate-900 border border-slate-700/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-white">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <span>Assets</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p className="font-medium">Nenhum asset encontrado</p>
                <p className="text-sm mt-1">Crie seu primeiro item de branding</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filtered.map((it) => (
                  <div
                    key={it.id}
                    onClick={() => setSelected(it)}
                    onDoubleClick={() => openViewer(it)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={async (e) => {
                      e.preventDefault();
                      const f = e.dataTransfer?.files?.[0];
                      if (!f) return;
                      const media = await uploadFileToMedia(f);
                      if (media?.url) {
                        await fetch(`/api/clients/${clientId}/branding?brandingId=${it.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ fileUrl: media.url, thumbUrl: media.thumbUrl ?? undefined, palette: media.colors ?? undefined }),
                        });
                        invalidateBranding();
                      }
                    }}
                  >
                    <AssetCard title={it.title} thumb={it.thumbUrl ?? it.fileUrl ?? undefined} palette={it.palette ?? undefined} selected={selectedIds.has(it.id)} onToggleSelect={() => toggleSelect(it.id)} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inspector & Uploader */}
        <div className="space-y-4">
          <Card className="bg-slate-900 border border-slate-700/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-white">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <span>Inspector</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selected ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Título</label>
                    <input aria-label="Título" placeholder="Título" className="w-full p-2 bg-slate-800 border border-slate-700 text-white placeholder:text-slate-400 rounded-lg focus:border-blue-500 focus:outline-none" defaultValue={selected.title} onChange={(e) => setSelected({ ...selected, title: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Descrição</label>
                    <input aria-label="Descrição" placeholder="Descrição" className="w-full p-2 bg-slate-800 border border-slate-700 text-white placeholder:text-slate-400 rounded-lg focus:border-blue-500 focus:outline-none" defaultValue={selected.description ?? ""} onChange={(e) => setSelected({ ...selected, description: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Notas / Conteúdo</label>
                    <textarea aria-label="Notas" placeholder="Notas" className="w-full p-2 bg-slate-800 border border-slate-700 text-white placeholder:text-slate-400 rounded-lg focus:border-blue-500 focus:outline-none" rows={4} defaultValue={selected.content ?? ""} onChange={(e) => setSelected({ ...selected, content: e.target.value })} />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => setSelected(null)} className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">Cancelar</Button>
                    <Button size="sm" onClick={() => saveSelected({ title: selected.title, description: selected.description, content: selected.content })} className="bg-blue-600 hover:bg-blue-500 text-white">Salvar</Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-8">Selecione um asset para editar metadados</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border border-slate-700/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-white">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <span>Upload</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Uploader clientId={clientId} onUploaded={async (m: MediaUploadResult) => {
                await createBrandingFromMedia({ url: m.url, thumbUrl: m.thumbUrl, title: m.title ?? m.fileName, colors: m.colors ?? null });
              }} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* viewer modal */}
      {viewerOpen && viewerItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={closeViewer}>
          <div className="bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-auto m-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-xl font-semibold text-white truncate">{viewerItem.title}</h3>
                  {viewerItem.description && <p className="text-sm text-slate-400 mt-1">{viewerItem.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {viewerItem.fileUrl && (<a href={viewerItem.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 hover:underline"><span>Baixar</span></a>)}
                  <Button size="sm" onClick={() => { openEditModal(viewerItem); closeViewer(); }} className="bg-blue-600 hover:bg-blue-500 text-white">Editar</Button>
                  <Button variant="ghost" size="sm" onClick={() => closeViewer()} className="text-slate-300 hover:bg-slate-800">Fechar</Button>
                </div>
              </div>
              <div className="w-full bg-slate-800 rounded-lg p-4">
                {viewerItem.fileUrl && viewerItem.fileUrl.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff)$/) ? (
                  <Image src={viewerItem.fileUrl} alt={viewerItem.title} width={1200} height={720} className="w-full h-auto object-contain rounded" sizes="100vw" />
                ) : viewerItem.fileUrl && viewerItem.fileUrl.match(/\.(mp4|mov|avi|webm|mkv|flv|mpeg)$/) ? (
                  <video src={viewerItem.fileUrl} controls className="w-full h-auto rounded" />
                ) : viewerItem.fileUrl ? (
                  <iframe title={viewerItem.title} src={viewerItem.fileUrl} className="w-full h-[70vh] border rounded" />
                ) : (
                  <div className="text-sm text-slate-400">Sem arquivo para visualização.</div>
                )}
              </div>
              {viewerItem.palette && viewerItem.palette.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {viewerItem.palette.map((c) => (
                    <svg key={c} className="w-6 h-6 rounded" viewBox="0 0 16 16" role="img" aria-label={c}>
                      <title>{c}</title>
                      <rect width="16" height="16" fill={c} rx="3" ry="3" />
                    </svg>
                  ))}
                </div>
              )}
              {viewerItem.content && (<div className="text-sm text-slate-300">{viewerItem.content}</div>)}
              <div className="flex justify-end gap-2">
                <Button variant="destructive" onClick={() => { if (viewerItem) handleDelete(viewerItem.id); closeViewer(); }} className="bg-red-600 hover:bg-red-500 text-white">Excluir</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* create/edit modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
          <div className="bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto m-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">{editing ? 'Editar Item' : 'Novo Item de Branding'}</h2>
                <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:bg-slate-800">Fechar</Button>
              </div>
              <form onSubmit={handleModalSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Tipo</label>
                  <select aria-label="Tipo" title="Tipo" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full p-2 bg-slate-800 border border-slate-700 text-white rounded-lg">
                    <option value="logo">Logotipo</option>
                    <option value="color-palette">Paleta de Cores</option>
                    <option value="typography">Tipografia</option>
                    <option value="manual">Manual</option>
                    <option value="template">Template</option>
                    <option value="asset">Asset</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Título</label>
                  <input aria-label="Título" title="Título" placeholder="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full p-2 bg-slate-800 border border-slate-700 text-white placeholder:text-slate-400 rounded-lg" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Descrição</label>
                  <input aria-label="Descrição" title="Descrição" placeholder="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full p-2 bg-slate-800 border border-slate-700 text-white placeholder:text-slate-400 rounded-lg" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Arquivo (URL)</label>
                  <input value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} className="w-full p-2 bg-slate-800 border border-slate-700 text-white placeholder:text-slate-400 rounded-lg" placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Enviar Arquivo</label>
                  <input aria-label="Enviar arquivo" title="Enviar arquivo" type="file" className="w-full p-2 bg-slate-800 border border-slate-700 text-white rounded-lg file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer hover:file:bg-blue-500" onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const m = await uploadFileToMedia(f);
                    if (m) setForm({ ...form, fileUrl: m.url ?? '', thumbUrl: m.thumbUrl ?? undefined, palette: m.colors ?? undefined });
                  }} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Notas / Conteúdo</label>
                  <textarea aria-label="Notas" title="Notas" placeholder="Notas" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="w-full p-2 bg-slate-800 border border-slate-700 text-white placeholder:text-slate-400 rounded-lg" rows={4} />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)} className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">Cancelar</Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white">{editing ? 'Atualizar' : 'Criar'}</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
