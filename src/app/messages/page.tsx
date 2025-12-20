'use client'

import { auth } from '@/lib/firebase'
import {
  CheckCheck,
  Clock,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Trash2,
  User,
  X
} from 'lucide-react'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type Msg = {
  event: 'message' | 'status'
  id?: string
  messageId?: string
  from?: string
  to?: string | null
  name?: string
  type?: string
  text?: string | null
  timestamp?: string
  recipientId?: string
  recipient_id?: string
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
  client?: {
    id: string
    name: string
    phone: string
  }
  isLocal?: boolean
  metadata?: any
}

type Toast = {
  id: string
  title: string
  description?: string
  variant?: 'success' | 'error' | 'info'
}

// Normaliza telefone para comparação de threads (somente dígitos)
const normalizePhone = (value?: string | null) => value?.replace(/\D/g, '') || ''

// Exibe telefone em formato amigável
const formatPhoneDisplay = (value?: string | null) => {
  const n = normalizePhone(value)
  if (!n) return ''
  if (n.length >= 12) {
    return `+${n.slice(0, 2)} (${n.slice(2, 4)}) ${n.slice(4, 8)}-${n.slice(8, 12)}`
  }
  if (n.length >= 10) {
    return `+${n.slice(0, 2)} ${n.slice(2, 6)}-${n.slice(6, 10)}`
  }
  return `+${n}`
}

const showToast = (
  setToasts: React.Dispatch<React.SetStateAction<Toast[]>>,
  toast: Omit<Toast, 'id'>
) => {
  const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
  setToasts((prev) => [...prev, { ...toast, id }])
  setTimeout(() => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, 3500)
}

const toastSuccess = (setToasts: React.Dispatch<React.SetStateAction<Toast[]>>, title: string, description?: string) =>
  showToast(setToasts, { title, description, variant: 'success' })

const toastError = (setToasts: React.Dispatch<React.SetStateAction<Toast[]>>, title: string, description?: string) =>
  showToast(setToasts, { title, description, variant: 'error' })

const getStatusIcon = (status?: string) => {
  switch (status) {
    case 'sending':
      return <RefreshCw className="w-3.5 h-3.5 text-slate-400/70 animate-spin" />
    case 'sent':
      return <CheckCheck className="w-3.5 h-3.5 text-slate-300/70" />
    case 'delivered':
      return <CheckCheck className="w-3.5 h-3.5 text-slate-300/90" />
    case 'read':
      return <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
    case 'failed':
      return <X className="w-3.5 h-3.5 text-red-400" />
    default:
      return null
  }
}

const isTemplateMessage = (msg: Msg) => {
  return msg.type === 'template' || msg.text?.startsWith('[Template:')
}

const formatTemplateText = (msg: Msg) => {
  // Se tem texto real do template (conteúdo formatado), mostrar ele
  if (msg.text && !msg.text.startsWith('[Template:')) {
    return msg.text
  }

  // Se o metadata tem o conteúdo do template
  const metadata = msg.metadata as any
  if (metadata?.templateText) {
    return metadata.templateText
  }
  if (metadata?.content) {
    return metadata.content
  }
  if (metadata?.body) {
    return metadata.body
  }

  // Fallback: mostrar nome do template
  if (msg.text?.startsWith('[Template:')) {
    const match = msg.text.match(/\[Template: ([^\]]+)\]/)
    return match ? `📨 ${match[1]}` : '📨 Template'
  }

  return msg.text || '📨 Template'
}

const getThreadKey = (m: Msg) => {
  const clientPhone = normalizePhone(m.client?.phone)
  if (clientPhone) return clientPhone

  const from = normalizePhone(m.from)
  const to = normalizePhone(m.to)
  const recipient = normalizePhone(m.recipient_id || m.recipientId)

  if (from && m.from !== 'admin') return from
  if (to) return to
  if (recipient) return recipient
  return 'unknown'
}

// Une mensagens locais com remotas e remove duplicatas
function mergeAndDedup(prev: Msg[], remote: Msg[]) {
  const result: Msg[] = []
  const strong = new Set<string>() // id/messageId
  const soft = new Set<string>() // from->to + text + minute bucket

  const timeBucket = (timestamp?: string) => {
    if (!timestamp) return 'no-time'
    const d = new Date(timestamp)
    return Number.isNaN(d.getTime()) ? 'no-time' : Math.floor(d.getTime() / 60000).toString()
  }

  const makeSoftKey = (m: Msg) => {
    // Usa a chave da thread (telefone) para deduplicar, ignorando direção
    const thread = normalizePhone(getThreadKey(m)) || 'unknown'
    const text = (m.text || m.name || '').trim()
    return `${thread}::${text}::${timeBucket(m.timestamp)}`
  }

  const add = (m: Msg) => {
    const strongKey = m.messageId || m.id || ''
    const softKey = makeSoftKey(m)

    if (strongKey && strong.has(strongKey)) return
    if (soft.has(softKey)) return

    if (strongKey) strong.add(strongKey)
    soft.add(softKey)
    result.push(m)
  }

  // Prefer remotos: mantemos ordem remota e só mantemos locais que não tenham par correspondente
  remote.forEach(add)
  prev.filter((m) => m.isLocal).forEach(add)

  return result
}

export default function MessagesPage() {
  const [items, setItems] = useState<Msg[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [compose, setCompose] = useState({ to: '', body: '' })
  const [sending, setSending] = useState(false)
  const [filter, setFilter] = useState('')
  const [toasts, setToasts] = useState<Toast[]>([])
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; thread: string }>({ open: false, thread: '' })
  const [renameModal, setRenameModal] = useState<{ open: boolean; thread: string; value: string }>({ open: false, thread: '', value: '' })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Marcar mensagens como lidas quando a conversa é selecionada
  const markAsRead = useCallback(async (phone: string) => {
    try {
      if (!auth) return
      const currentUser = auth.currentUser
      if (!currentUser) return

      const token = await currentUser.getIdToken()
      if (!token) return

      await fetch('/api/integrations/whatsapp/messages/mark-read', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone })
      })
    } catch (error) {
      console.error('Erro ao marcar mensagens como lidas:', error)
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/integrations/whatsapp/messages', { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      const data = await res.json()
      setItems((prev) => mergeAndDedup(prev, data.messages || []))
    } catch (e) {
      console.error('[Messages] load error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  async function deleteThread(thread: string) {
    const t = normalizePhone(thread)
    if (!t) {
      toastError(setToasts, 'Conversa inválida')
      return
    }
    setConfirmDelete({ open: true, thread: t })
  }

  async function confirmDeleteAction() {
    const t = confirmDelete.thread
    if (!t) return setConfirmDelete({ open: false, thread: '' })
    try {
      const threadParam = t.startsWith('+') ? t : `+${t}`
      const res = await fetch(`/api/integrations/whatsapp/messages?thread=${encodeURIComponent(threadParam)}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || `Falha ao apagar (HTTP ${res.status})`)

      // Remove localmente
      const normalized = normalizePhone(threadParam)
      setItems(prev => prev.filter(m => getThreadKey(m) !== normalized))
      if (selected === normalized) {
        setSelected(null)
        setCompose({ to: '', body: '' })
      }
      toastSuccess(setToasts, 'Conversa apagada com sucesso')
    } catch (e) {
      const err = e as Error
      toastError(setToasts, 'Erro ao apagar conversa', err?.message)
    }
    setConfirmDelete({ open: false, thread: '' })
  }

  async function saveRename() {
    const t = renameModal.thread
    const name = renameModal.value.trim()
    if (!t) return setRenameModal({ open: false, thread: '', value: '' })
    if (!name) {
      toastError(setToasts, 'Nome não pode ser vazio')
      return
    }
    try {
      const threadParam = t.startsWith('+') ? t : `+${t}`
      const res = await fetch('/api/integrations/whatsapp/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thread: threadParam, name }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || `Falha ao renomear (HTTP ${res.status})`)

      const normalized = normalizePhone(threadParam)
      setItems((prev) =>
        prev.map((m) =>
          getThreadKey(m) === normalized || getThreadKey(m) === `+${normalized}`
            ? { ...m, name, client: m.client ? { ...m.client, name } : m.client }
            : m
        )
      )
      toastSuccess(setToasts, 'Conversa renomeada')
    } catch (e) {
      const err = e as Error
      toastError(setToasts, 'Erro ao renomear conversa', err?.message)
    }
    setRenameModal({ open: false, thread: '', value: '' })
  }

  async function renameThread(thread: string) {
    const t = normalizePhone(thread)
    if (!t) {
      toastError(setToasts, 'Conversa inválida')
      return
    }
    const current = selectedThread?.[1]?.[0]?.client?.name || selectedThread?.[1]?.[0]?.name || ''
    setRenameModal({ open: true, thread: t, value: current })
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 8000)
    return () => clearInterval(t)
  }, [load])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [items, selected])

  const threads = useMemo(() => {
    const map = new Map<string, Msg[]>()
    for (const m of items) {
      const key = getThreadKey(m)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(m)
    }
    for (const [, arr] of map.entries()) {
      arr.sort((a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime())
    }
    return Array.from(map.entries())
  }, [items])

  const filteredThreads = useMemo(() => {
    if (!filter.trim()) return threads
    const q = filter.trim().toLowerCase()
    return threads.filter(([phone, arr]) => {
      const last = arr[arr.length - 1]
      const name = last?.client?.name || last?.name || ''
      return phone.includes(q) || name.toLowerCase().includes(q)
    })
  }, [threads, filter])

  async function send() {
    const toNormalized = normalizePhone(compose.to)
    if (!toNormalized) {
      toastError(setToasts, 'Informe o número E.164', 'Ex: +5541999998888')
      return
    }
    if (!compose.body.trim()) {
      toastError(setToasts, 'Digite uma mensagem')
      return
    }

    const toE164 = `+${toNormalized}`
    setSending(true)

    // Mensagem local
    const localMsg: Msg = {
      id: `local-${Date.now()}`,
      event: 'message',
      from: 'admin',
      to: toNormalized,
      text: compose.body,
      timestamp: new Date().toISOString(),
      type: 'text',
      status: 'sending',
      isLocal: true,
    }

    setItems(prev => [...prev, localMsg])
    const bodyText = compose.body
    setCompose({ to: compose.to, body: '' })

    try {
      const res = await fetch('/api/integrations/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: toE164, body: bodyText }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao enviar')

      // Remove a mensagem local após envio bem-sucedido
      setItems(prev => prev.filter(m => m.id !== localMsg.id))

      // Recarrega mensagens para pegar a confirmação do servidor
      setTimeout(load, 1500)
    } catch (e) {
      const err = e as Error
      setItems(prev => prev.filter(m => m.id !== localMsg.id))
      toastError(setToasts, 'Falha ao enviar', err?.message)
    } finally {
      setSending(false)
    }
  }

  function formatTime(timestamp?: string) {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'agora'
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  function formatMessageTime(timestamp?: string) {
    if (!timestamp) return ''
    return new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const selectedThread = threads.find(([p]) => p === selected)
  const selectedMessages = selectedThread?.[1] || []
  const selectedName = selectedThread?.[1]?.[0]?.client?.name ||
    selectedThread?.[1]?.[0]?.name ||
    formatPhoneDisplay(selected)
  const selectedKey = normalizePhone(selected)

  return (
    <>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.3);
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

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Background Pattern */}
        <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />

        <div className="relative mx-auto max-w-7xl px-4 pt-6 pb-6">
          {/* Main Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur-xl opacity-50" />
                <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-2xl shadow-2xl">
                  <MessageCircle className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  WhatsApp Business
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                </h1>
                <p className="text-sm text-slate-400">Gerencie suas conversas em tempo real</p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 h-[calc(100vh-12rem)]">
            {/* Sidebar - Lista de Conversas */}
            <aside className="w-96 border border-slate-700/50 bg-slate-900/60 backdrop-blur-2xl rounded-3xl flex flex-col shadow-2xl shadow-black/20 overflow-hidden">
              {/* Header */}
              <div className="p-5 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="absolute inset-0 bg-emerald-500/30 rounded-xl blur-md" />
                      <div className="relative bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                        <Mail className="w-5 h-5 text-emerald-400" />
                      </div>
                    </div>
                    <div>
                      <h2 className="font-bold text-white text-lg">Conversas</h2>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                        {filteredThreads.length} ativas
                      </p>
                    </div>
                  </div>
                  <button
                    title="Atualizar"
                    aria-label="Atualizar conversas"
                    onClick={load}
                    disabled={loading}
                    className="p-2.5 hover:bg-slate-700/50 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50 group"
                  >
                    <RefreshCw className={`w-5 h-5 text-slate-400 group-hover:text-emerald-400 transition-colors ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="Buscar conversas..."
                    className="w-full bg-slate-800/60 text-white text-sm pl-10 pr-4 py-3 rounded-xl border border-slate-700/50 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Lista de Conversas */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {filteredThreads.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="relative inline-block mb-4">
                      <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl" />
                      <div className="relative bg-slate-800/50 p-6 rounded-full">
                        <MessageCircle className="w-12 h-12 text-slate-600" />
                      </div>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Nenhuma conversa encontrada</p>
                    <p className="text-slate-600 text-xs mt-1">As conversas aparecerão aqui</p>
                  </div>
                ) : (
                  filteredThreads.map(([phone, arr]) => {
                    const last = arr[arr.length - 1]
                    const name = last?.client?.name || last?.name || formatPhoneDisplay(phone)
                    const isSelected = selected === phone
                    const hasUnread = false // TODO: implementar lógica de não lidas

                    return (
                      <div
                        key={phone}
                        className={`relative group transition-all duration-200 ${isSelected
                          ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-l-4 border-emerald-500'
                          : 'hover:bg-slate-800/40 border-l-4 border-transparent'
                          }`}
                      >
                        <div className="p-4 flex gap-3 items-start">
                          <button
                            onClick={() => {
                              setSelected(phone)
                              setCompose((c) => ({ ...c, to: `+${phone}` }))
                              markAsRead(phone)
                            }}
                            className="flex-1 text-left min-w-0"
                          >
                            <div className="flex gap-3 items-center">
                              {/* Avatar */}
                              <div className="relative flex-shrink-0">
                                <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg ${hasUnread ? 'ring-2 ring-emerald-400/50' : ''}`}>
                                  <User className="w-6 h-6 text-white" />
                                </div>
                                {hasUnread && (
                                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-slate-900">
                                    3
                                  </span>
                                )}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1 gap-2">
                                  <span className={`font-semibold truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                                    {name}
                                  </span>
                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <Clock className="w-3 h-3 text-slate-500" />
                                    <span className="text-[11px] text-slate-500">
                                      {formatTime(last?.timestamp)}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-sm text-slate-400 truncate flex items-center gap-1">
                                  {last?.status === 'read' && <CheckCheck className="w-3 h-3 text-emerald-400 flex-shrink-0" />}
                                  {last?.status === 'sent' && <CheckCheck className="w-3 h-3 text-slate-500 flex-shrink-0" />}
                                  <span className="truncate">
                                    {last?.text || last?.name || `Mensagem ${last?.type || 'recebida'}`}
                                  </span>
                                </p>
                              </div>
                            </div>
                          </button>

                          {/* Actions */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              title="Renomear"
                              onClick={(e) => { e.stopPropagation(); renameThread(phone) }}
                              className="p-1.5 rounded-lg hover:bg-slate-700/50 text-slate-400 hover:text-emerald-400 transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              title="Apagar"
                              onClick={(e) => { e.stopPropagation(); deleteThread(phone) }}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Separator */}
                        <div className="mx-4 border-b border-slate-700/30" />
                      </div>
                    )
                  })
                )}
              </div>
            </aside>

            {/* Área Principal - Chat */}
            <main className="flex-1 flex flex-col border border-slate-700/50 bg-slate-900/40 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-black/20 overflow-hidden">
              {!selected ? (
                <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-900/50 to-slate-800/50">
                  <div className="text-center max-w-md px-6">
                    <div className="relative inline-block mb-6">
                      <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl animate-pulse" />
                      <div className="relative bg-slate-800/50 p-8 rounded-full border border-slate-700/50">
                        <MessageCircle className="w-16 h-16 text-slate-600" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">WhatsApp Web</h3>
                    <p className="text-slate-400">Selecione uma conversa para começar a enviar mensagens</p>
                    <p className="text-slate-500 text-sm mt-2">Todas as suas conversas estão sincronizadas</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Header da Conversa */}
                  <div className="p-5 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                            <User className="w-6 h-6 text-white" />
                          </div>
                          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-slate-900 rounded-full" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white text-lg">{selectedName}</h3>
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {formatPhoneDisplay(selected)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          title="Renomear"
                          onClick={() => renameThread(selected || '')}
                          className="px-4 py-2 text-sm rounded-xl border border-slate-700/50 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-slate-300 hover:text-emerald-400 transition-all duration-200 flex items-center gap-2"
                        >
                          <Pencil className="w-4 h-4" />
                          Renomear
                        </button>
                        <button
                          title="Apagar"
                          onClick={() => deleteThread(selected || '')}
                          className="px-4 py-2 text-sm rounded-xl border border-red-500/30 hover:border-red-500/50 hover:bg-red-500/5 text-red-400 transition-all duration-200 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Apagar
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Mensagens */}
                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0icGF0dGVybiIgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxnIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIgc3Ryb2tlLXdpZHRoPSIwLjUiPjxwb2x5bGluZSBwb2ludHM9IjAgMTAgMTAgMCAyMCAxMCIvPjxwb2x5bGluZSBwb2ludHM9IjEwIDAgMjAgMTAgMzAgMCIvPjxwb2x5bGluZSBwb2ludHM9IjAgMzAgMTAgMjAgMjAgMzAiLz48cG9seWxpbmUgcG9pbnRzPSIxMCAyMCAyMCAzMCAzMCAyMCIvPjwvZz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSJ1cmwoI3BhdHRlcm4pIi8+PC9zdmc+')]">
                    <div className="max-w-4xl mx-auto space-y-4">
                      {selectedMessages.map((m, idx) => {
                        const fromKey = normalizePhone(m.from)
                        const isClient = fromKey === selectedKey && selectedKey !== ''
                        const isTemplate = isTemplateMessage(m)

                        return (
                          <div
                            key={m.id || m.timestamp || idx}
                            className={`flex ${isClient ? 'justify-start' : 'justify-end'} animate-in slide-in-from-bottom-2 fade-in duration-300`}
                          >
                            <div
                              className={`max-w-[70%] rounded-2xl px-5 py-3 shadow-xl ${isClient
                                ? 'bg-slate-800/90 border border-slate-700/50 backdrop-blur-sm'
                                : m.status === 'failed'
                                  ? 'bg-red-900/30 border border-red-500/30'
                                  : 'bg-gradient-to-br from-emerald-600 to-teal-600 shadow-emerald-900/30'
                                }`}
                            >
                              {isTemplate && (
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xs text-slate-300/70 bg-slate-900/30 px-2.5 py-1 rounded-full font-medium">
                                    📨 Template
                                  </span>
                                </div>
                              )}
                              <p className="text-white text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                                {isTemplate
                                  ? formatTemplateText(m)
                                  : m.text?.trim()?.length
                                    ? m.text
                                    : m.name?.trim()?.length
                                      ? m.name
                                      : m.type && m.type !== 'text'
                                        ? `📎 ${m.type}`
                                        : ''}
                              </p>
                              <div className="flex items-center justify-end gap-1.5 mt-2">
                                <span className="text-[11px] text-slate-300/60 font-medium">
                                  {formatMessageTime(m.timestamp)}
                                </span>
                                {!isClient && getStatusIcon(m.status)}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>

                  {/* Input */}
                  <div className="p-5 border-t border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-900/50">
                    <div className="max-w-4xl mx-auto flex gap-3 items-end">
                      <div className="flex-1">
                        <textarea
                          rows={1}
                          value={compose.body}
                          onChange={(e) => {
                            e.target.style.height = 'auto'
                            e.target.style.height = e.target.scrollHeight + 'px'
                            setCompose((c) => ({ ...c, body: e.target.value }))
                          }}
                          onKeyDown={(e) => {
                            if (
                              e.key === 'Enter' && (!e.shiftKey || e.ctrlKey)
                            ) {
                              e.preventDefault()
                              send()
                            }
                          }}
                          placeholder="Digite sua mensagem..."
                          aria-label="Campo de mensagem"
                          autoComplete="off"
                          spellCheck={false}
                          disabled={sending}
                          style={{ overflow: 'hidden' }}
                          className="w-full bg-slate-800/60 text-white resize-none px-5 py-3.5 rounded-2xl border border-slate-700/50 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-500 disabled:opacity-50"
                        />
                      </div>
                      <button
                        onClick={send}
                        disabled={sending || !compose.body.trim()}
                        className="relative group bg-gradient-to-br from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white p-4 rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-emerald-500/30 disabled:hover:shadow-none"
                      >
                        {sending ? (
                          <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 text-center mt-3">
                      Pressione <kbd className="px-1.5 py-0.5 bg-slate-800/50 rounded border border-slate-700/50">Enter</kbd> para enviar, <kbd className="px-1.5 py-0.5 bg-slate-800/50 rounded border border-slate-700/50">Shift + Enter</kbd> para nova linha
                    </p>
                  </div>
                </>
              )}
            </main>
          </div>
        </div>

        {/* Toasts */}
        <div className="fixed top-6 right-6 space-y-3 z-50">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`min-w-[300px] max-w-md rounded-2xl border px-5 py-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-right-5 fade-in duration-300 ${t.variant === 'success'
                ? 'border-emerald-500/50 bg-emerald-950/90 text-emerald-50'
                : t.variant === 'error'
                  ? 'border-red-500/50 bg-red-950/90 text-red-50'
                  : 'border-slate-700/50 bg-slate-900/90 text-slate-100'
                }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${t.variant === 'success' ? 'bg-emerald-500/20' : t.variant === 'error' ? 'bg-red-500/20' : 'bg-slate-700/20'
                  }`}>
                  {t.variant === 'success' ? <CheckCheck className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{t.title}</p>
                  {t.description && <p className="text-xs text-slate-300 mt-1">{t.description}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal de confirmação de exclusão */}
        {confirmDelete.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-slate-900/95 border border-slate-700/50 rounded-3xl p-7 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-start gap-4 mb-5">
                <div className="p-3 bg-red-500/10 rounded-xl">
                  <Trash2 className="w-6 h-6 text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">Apagar conversa</h3>
                  <p className="text-sm text-slate-400">Esta ação não pode ser desfeita. Todas as mensagens serão permanentemente removidas.</p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirmDelete({ open: false, thread: '' })}
                  className="px-5 py-2.5 rounded-xl border border-slate-700/50 text-slate-200 hover:bg-slate-800/50 transition-all duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDeleteAction}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white transition-all duration-200 shadow-lg hover:shadow-red-500/30"
                >
                  Apagar conversa
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de renomear */}
        {renameModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-slate-900/95 border border-slate-700/50 rounded-3xl p-7 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-start gap-4 mb-5">
                <div className="p-3 bg-emerald-500/10 rounded-xl">
                  <Pencil className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">Renomear conversa</h3>
                  <p className="text-sm text-slate-400">Altere o nome exibido para este cliente.</p>
                </div>
              </div>
              <input
                value={renameModal.value}
                onChange={(e) => setRenameModal((p) => ({ ...p, value: e.target.value }))}
                className="w-full bg-slate-800/60 text-white px-4 py-3 rounded-xl border border-slate-700/50 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 mb-5 transition-all"
                placeholder="Nome do cliente"
                autoFocus
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setRenameModal({ open: false, thread: '', value: '' })}
                  className="px-5 py-2.5 rounded-xl border border-slate-700/50 text-slate-200 hover:bg-slate-800/50 transition-all duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveRename}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white transition-all duration-200 shadow-lg hover:shadow-emerald-500/30"
                >
                  Salvar alterações
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
