'use client'

import { CheckCheck, MessageCircle, Pencil, RefreshCw, Send, Trash2, User } from 'lucide-react'
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
  client?: {
    id: string
    name: string
    phone: string
  }
  isLocal?: boolean
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
  }, 3200)
}

const toastSuccess = (setToasts: React.Dispatch<React.SetStateAction<Toast[]>>, title: string, description?: string) =>
  showToast(setToasts, { title, description, variant: 'success' })

const toastError = (setToasts: React.Dispatch<React.SetStateAction<Toast[]>>, title: string, description?: string) =>
  showToast(setToasts, { title, description, variant: 'error' })

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
      toastSuccess(setToasts, 'Conversa apagada')
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

      setTimeout(load, 2000)
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
    <div className="min-h-screen bg-[#05070d] pb-28">
      <div className="mx-auto max-w-7xl px-6 pt-6">
        <div className="flex gap-6 h-[calc(100vh-9rem)]">
          {/* Sidebar - Lista de Conversas */}
          <aside className="w-80 border border-slate-800/70 bg-slate-900/70 backdrop-blur-xl rounded-2xl flex flex-col shadow-2xl shadow-emerald-900/10">
            {/* Header */}
            <div className="p-4 border-b border-slate-800/70 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-500/20 p-2.5 rounded-xl ring-1 ring-emerald-500/20">
                    <MessageCircle className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="font-bold text-white">Conversas</h2>
                    <p className="text-xs text-slate-400">{filteredThreads.length} visíveis</p>
                  </div>
                </div>
                <button
                  title="Atualizar"
                  aria-label="Atualizar conversas"
                  onClick={load}
                  disabled={loading}
                  className="p-2 hover:bg-slate-800 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-emerald-500/30 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="relative">
                <input
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Buscar por nome ou número..."
                  className="w-full bg-slate-800 text-white text-sm px-3 py-2 rounded-lg border border-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {/* Lista de Conversas */}
            <div className="flex-1 overflow-y-auto">
              {filteredThreads.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageCircle className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">Nenhuma conversa ainda</p>
                </div>
              ) : (
                filteredThreads.map(([phone, arr]) => {
                  const last = arr[arr.length - 1]
                  const name = last?.client?.name || last?.name || formatPhoneDisplay(phone)
                  const isSelected = selected === phone

                  return (
                    <div
                      key={phone}
                      className={`w-full p-4 border-b border-slate-800/60 hover:bg-slate-800/60 transition ${isSelected ? 'bg-slate-800/80' : ''}`}
                    >
                      <div className="flex gap-3 items-start">
                        <button
                          onClick={() => {
                            setSelected(phone)
                            setCompose((c) => ({ ...c, to: `+${phone}` }))
                          }}
                          className="flex-1 text-left"
                        >
                          <div className="flex gap-3 items-center">
                            <div className="flex-shrink-0">
                              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-900/30">
                                <User className="w-5 h-5 text-white" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1 gap-2">
                                <span className="font-semibold text-white truncate">{name}</span>
                                <span className="text-[11px] text-slate-500 flex-shrink-0">{formatTime(last?.timestamp)}</span>
                              </div>
                              <p className="text-sm text-slate-400 truncate">
                                {last?.text || last?.name || `Mensagem ${last?.type || 'recebida'}`}
                              </p>
                            </div>
                          </div>
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            title="Renomear conversa"
                            aria-label="Renomear conversa"
                            onClick={(e) => { e.stopPropagation(); renameThread(phone) }}
                            className="p-2 rounded-lg hover:bg-slate-800 text-slate-300"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            title="Apagar conversa"
                            aria-label="Apagar conversa"
                            onClick={(e) => { e.stopPropagation(); deleteThread(phone) }}
                            className="p-2 rounded-lg hover:bg-red-900/30 text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </aside>

          {/* Área Principal - Chat */}
          <main className="flex-1 flex flex-col border border-slate-800/70 bg-slate-900/70 backdrop-blur-xl rounded-2xl shadow-2xl shadow-emerald-900/10 overflow-hidden">
            {!selected ? (
              <div className="flex-1 flex items-center justify-center bg-slate-900/30">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-12 h-12 text-slate-600" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">WhatsApp Web</h3>
                  <p className="text-slate-400">Selecione uma conversa para começar</p>
                </div>
              </div>
            ) : (
              <>
                {/* Header da Conversa */}
                <div className="p-4 border-b border-slate-800 bg-slate-900/70 backdrop-blur flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{selectedName}</h3>
                      <p className="text-xs text-slate-400">{formatPhoneDisplay(selected)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      title="Renomear conversa"
                      aria-label="Renomear conversa"
                      onClick={() => renameThread(selected || '')}
                      className="px-3 py-2 text-sm rounded-lg border border-slate-700 hover:border-emerald-500 hover:text-emerald-300"
                    >
                      Renomear
                    </button>
                    <button
                      title="Apagar conversa"
                      aria-label="Apagar conversa"
                      onClick={() => deleteThread(selected || '')}
                      className="px-3 py-2 text-sm rounded-lg border border-red-500/60 text-red-300 hover:bg-red-900/30"
                    >
                      Apagar
                    </button>
                  </div>
                </div>

                {/* Mensagens - COM SCROLL PRÓPRIO */}
                <div className="flex-1 overflow-y-auto p-6 bg-[#060910] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0icGF0dGVybiIgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxnIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIwLjYiPjxwb2x5bGluZSBwb2ludHM9IjAgMTAgMTAgMCAyMCAxMCIvPjxwb2x5bGluZSBwb2ludHM9IjEwIDAgMjAgMTAgMzAgMCIvPjxwb2x5bGluZSBwb2ludHM9IjAgMzAgMTAgMjAgMjAgMzAiLz48cG9seWxpbmUgcG9pbnRzPSIxMCAyMCAyMCAzMCAzMCAyMCIvPjwvZz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSJ1cmwoI3BhdHRlcm4pIi8+PC9zdmc+')]">
                  <div className="max-w-4xl mx-auto space-y-3">
                    {selectedMessages.map((m, idx) => {
                      const fromKey = normalizePhone(m.from)

                      // Entrada: from == cliente. Saída: qualquer outra combinação.
                      // Protege contra eco (nossas mensagens não viram entrada).
                      const isClient = fromKey === selectedKey && selectedKey !== ''

                      return (
                        <div
                          key={m.id || m.timestamp || idx}
                          className={`flex ${isClient ? 'justify-start' : 'justify-end'} animate-in slide-in-from-bottom-2 duration-300`}
                        >
                          <div
                            className={`max-w-[65%] rounded-2xl px-4 py-2.5 shadow-lg ${isClient
                              ? 'bg-slate-800 border border-slate-700'
                              : 'bg-gradient-to-br from-emerald-600 to-teal-600'
                              }`}
                          >
                            <p className="text-white text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                              {m.text || m.name || `Mensagem do tipo ${m.type || 'desconhecido'}`}
                            </p>
                            <div className="flex items-center justify-end gap-1 mt-1">
                              <span className="text-[11px] text-slate-300/70">
                                {formatMessageTime(m.timestamp)}
                              </span>
                              {!isClient && (
                                <CheckCheck className="w-3.5 h-3.5 text-slate-300/70" />
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Input - FIXO NO RODAPÉ */}
                <div className="p-4 border-t border-slate-800 bg-slate-900/80 backdrop-blur">
                  <div className="max-w-4xl mx-auto flex gap-3 items-center">
                    <div className="flex-1 bg-slate-800/80 border border-slate-700 rounded-2xl px-4 py-3 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition">
                      <textarea
                        rows={1}
                        value={compose.body}
                        onChange={(e) => setCompose((c) => ({ ...c, body: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            send()
                          }
                        }}
                        placeholder="Digite sua mensagem..."
                        disabled={sending}
                        className="w-full bg-transparent text-white resize-none outline-none"
                      />
                    </div>
                    <button
                      onClick={send}
                      disabled={sending || !compose.body.trim()}
                      className="bg-gradient-to-br from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-3 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-emerald-500/20"
                    >
                      {sending ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      {/* Toasts */}
      <div className="fixed top-4 right-4 space-y-3 z-50">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`min-w-[260px] max-w-sm rounded-xl border px-4 py-3 shadow-lg backdrop-blur bg-slate-900/90 ${t.variant === 'success'
              ? 'border-emerald-500/50 text-emerald-50'
              : t.variant === 'error'
                ? 'border-red-500/50 text-red-50'
                : 'border-slate-700 text-slate-100'
              }`}
          >
            <p className="font-semibold">{t.title}</p>
            {t.description ? <p className="text-sm text-slate-300 mt-1">{t.description}</p> : null}
          </div>
        ))}
      </div>

      {/* Modal de confirmação de exclusão */}
      {confirmDelete.open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-2">Apagar conversa</h3>
            <p className="text-sm text-slate-300 mb-4">Esta ação não pode ser desfeita.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete({ open: false, thread: '' })}
                className="px-4 py-2 rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteAction}
                className="px-4 py-2 rounded-lg border border-red-500/60 text-red-200 hover:bg-red-900/40"
              >
                Apagar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de renomear */}
      {renameModal.open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-2">Renomear conversa</h3>
            <p className="text-sm text-slate-300 mb-4">Altere o nome exibido para este cliente.</p>
            <input
              value={renameModal.value}
              onChange={(e) => setRenameModal((p) => ({ ...p, value: e.target.value }))}
              className="w-full bg-slate-800 text-white px-3 py-2 rounded-lg border border-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 mb-4"
              placeholder="Nome do cliente"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setRenameModal({ open: false, thread: '', value: '' })}
                className="px-4 py-2 rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                onClick={saveRename}
                className="px-4 py-2 rounded-lg border border-emerald-500/60 text-emerald-100 hover:bg-emerald-900/30"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
