'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AppRole, can } from '@/lib/permissions'
import { fetcher } from '@/lib/swr'
import { Edit, FileImage, FileText, Film, Image as ImageIcon, Trash2, Upload, X } from 'lucide-react'
import { useState } from 'react'
import useSWR from 'swr'

type MediaType = 'image' | 'video' | 'document'

interface MediaItem {
  id: string
  type: MediaType
  title: string
  url: string
  description?: string
  createdAt: Date
}

interface MediaManagerProps {
  clientId: string
  initialMedia?: MediaItem[]
}

export function MediaManager({ clientId, initialMedia = [] }: MediaManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing] = useState<MediaItem | null>(null)
  const [filter, setFilter] = useState<MediaType | 'all'>('all')
  const [search, setSearch] = useState('')

  const [form, setForm] = useState({
    type: 'image' as MediaType,
    title: '',
    url: '',
    description: '',
  })

  // SWR session + media list
  const { data: session } = useSWR<{ user: unknown; orgId: string | null; role: AppRole | null }>(
    '/api/session',
    fetcher,
  )
  const { data, error, isLoading, mutate } = useSWR<MediaItem[]>(
    `/api/clients/${clientId}/media`,
    fetcher,
    { fallbackData: initialMedia },
  )
  const items = data ?? []
  const role = session?.role ?? null
  const canCreate = role ? can(role, 'create', 'media') : false
  const canUpdate = role ? can(role, 'update', 'media') : false
  const canDelete = role ? can(role, 'delete', 'media') : false

  const resetForm = () => {
    setForm({ type: 'image', title: '', url: '', description: '' })
    setEditing(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      try {
        const res = await fetch(`/api/clients/${clientId}/media?mediaId=${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error('Falha ao atualizar mídia')
        const updated = await res.json()
        await mutate(
          (prev) =>
            (prev ?? []).map((i) =>
              i.id === editing.id
                ? {
                  ...i,
                  title: String(updated.title ?? i.title),
                  description: (updated.description as string | undefined) ?? i.description,
                  url: String(updated.url ?? i.url),
                  type: (updated.type as MediaType) ?? i.type,
                }
                : i,
            ),
          { revalidate: false },
        )
      } catch {
        // noop
      }
    } else {
      try {
        const res = await fetch(`/api/clients/${clientId}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error('Falha ao criar mídia')
        const created = await res.json()
        const newItem: MediaItem = {
          id: String(created.id),
          title: String(created.title ?? form.title),
          type: (created.type as MediaType) ?? form.type,
          url: String(created.url ?? form.url),
          description: (created.description as string | undefined) ?? (form.description || undefined),
          createdAt: new Date(String(created.createdAt ?? new Date().toISOString())),
        }
        await mutate([newItem, ...(items ?? [])], { revalidate: false })
      } catch {
        // noop
      }
    }
    setIsModalOpen(false)
    resetForm()
  }

  const handleEdit = (item: MediaItem) => {
    setEditing(item)
    setForm({ type: item.type, title: item.title, url: item.url, description: item.description || '' })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir mídia?')) return
    try {
      const res = await fetch(`/api/clients/${clientId}/media?mediaId=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Falha ao excluir mídia')
      await mutate((prev) => (prev ?? []).filter((i) => i.id !== id), { revalidate: false })
    } catch {
      // noop
    }
  }

  const filtered = items.filter(i => {
    if (filter !== 'all' && i.type !== filter) return false
    if (search && !i.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const iconFor = (type: MediaType) => {
    switch (type) {
      case 'image':
        return <FileImage className="h-4 w-4" />
      case 'video':
        return <Film className="h-4 w-4" />
      case 'document':
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Mídias</h2>
            <p className="text-sm text-slate-500 mt-1">Biblioteca de imagens e arquivos do cliente</p>
          </div>
          {canCreate && (
            <Button className="gap-2" onClick={() => { resetForm(); setIsModalOpen(true) }}>
              <Upload className="h-4 w-4" /> Upload
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" /> Galeria de Mídias
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
              <div className="flex gap-2">
                {(['all', 'image', 'video', 'document'] as const).map(t => (
                  <Button
                    key={t}
                    size="sm"
                    variant={filter === t ? 'default' : 'outline'}
                    onClick={() => setFilter(t)}
                  >
                    {t === 'all' ? 'Todos' : t === 'image' ? 'Imagens' : t === 'video' ? 'Vídeos' : 'Docs'}
                  </Button>
                ))}
              </div>
              <Input
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="md:w-64"
              />
            </div>
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">Nenhuma mídia encontrada</p>
                <p className="text-sm mt-1">Faça upload de imagens, vídeos ou documentos</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {filtered.map(item => (
                  <div key={item.id} className="group relative border rounded-lg p-3 bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1 text-xs text-slate-600">
                          {iconFor(item.type)}
                          <span>{item.type === 'image' ? 'Imagem' : item.type === 'video' ? 'Vídeo' : 'Documento'}</span>
                        </div>
                        <h4 className="font-medium text-sm text-slate-900 truncate">{item.title}</h4>
                        {item.description && (
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2">{item.description}</p>
                        )}
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline mt-2 inline-block"
                          aria-label={`Abrir mídia ${item.title}`}
                        >Abrir</a>
                      </div>
                      <div className="flex gap-1">
                        {canUpdate && (
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => handleEdit(item)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-600 hover:text-red-700" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Loading and error states */}
      {isLoading && (
        <div className="text-sm text-slate-500">Carregando mídias…</div>
      )}
      {error && (
        <div className="text-sm text-red-600">Falha ao carregar mídias</div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xl max-h-[90vh] overflow-auto m-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{editing ? 'Editar Mídia' : 'Nova Mídia'}</h2>
                  <p className="text-sm text-slate-500 mt-1">Adicione uma referência de imagem, vídeo ou documento (URL).</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <select
                    id="type"
                    aria-label="Tipo de mídia"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as MediaType })}
                    className="border rounded-md px-3 py-2 text-sm"
                  >
                    <option value="image">Imagem</option>
                    <option value="video">Vídeo</option>
                    <option value="document">Documento</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input id="title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Banner principal" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url">URL</Label>
                  <Input id="url" type="url" required value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição (opcional)</Label>
                  <Textarea id="description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Breve descrição" />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={editing ? !canUpdate : !canCreate}>{editing ? 'Atualizar' : 'Salvar'}</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
