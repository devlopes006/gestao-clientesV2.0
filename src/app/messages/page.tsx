'use client'

import { CheckCheck, MessageCircle, RefreshCw, Send, Trash2, User, Pencil } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

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
  const seen = new Set<string>()
  const all = [...prev.filter((m) => m.isLocal), ...remote]
  const result: Msg[] = []

  for (const m of all) {
    const key =
      m.id ||
      m.messageId ||
      `${normalizePhone(m.from)}-${normalizePhone(m.to)}-${m.timestamp || ''}-${m.text || ''}`

    if (seen.has(key)) continue
    seen.add(key)
    result.push(m)
  }

  return result
}

export default function MessagesPage() {
  const [items, setItems] = useState<Msg[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [compose, setCompose] = useState({ to: '', body: '' })
  const [sending, setSending] = useState(false)
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
    if (!t) return alert('Conversa inválida')
    const ok = confirm('Apagar toda a conversa? Esta ação não pode ser desfeita.')
    if (!ok) return
    try {
      const res = await fetch(`/api/integrations/whatsapp/messages?thread=+${t}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Falha ao apagar')
      // Remove localmente
      setItems(prev => prev.filter(m => getThreadKey(m) !== t))
      if (selected === t) {
        setSelected(null)
        setCompose({ to: '', body: '' })
      }
    } catch (e) {
      const err = e as Error
      alert(err?.message || 'Erro ao apagar conversa')
    }
  }

  async function renameThread(thread: string) {
    const t = normalizePhone(thread)
    if (!t) return alert('Conversa inválida')
    const current = selectedThread?.[1]?.[0]?.client?.name || selectedThread?.[1]?.[0]?.name || ''
    const name = prompt('Novo nome da conversa/cliente', current)
    if (!name || !name.trim()) return
    try {
      const res = await fetch('/api/integrations/whatsapp/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thread: `+${t}`, name: name.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Falha ao renomear')

      // Atualiza localmente
      setItems((prev) =>
        prev.map((m) =>
          getThreadKey(m) === t || getThreadKey(m) === `+${t}`
            ? { ...m, name: name.trim(), client: m.client ? { ...m.client, name: name.trim() } : m.client }
            : m
        )
      )
    } catch (e) {
      const err = e as Error
      alert(err?.message || 'Erro ao renomear conversa')
    }
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

  async function send() {
    const toNormalized = normalizePhone(compose.to)
    if (!toNormalized) {
      return alert('Informe o número E.164 (ex: +5541999998888)')
    }
    if (!compose.body.trim()) return alert('Digite uma mensagem')

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
      alert(err?.message || 'Falha ao enviar')
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
            <div className="p-4 border-b border-slate-800/70">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-500/20 p-2.5 rounded-xl ring-1 ring-emerald-500/20">
                    <MessageCircle className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="font-bold text-white">Conversas</h2>
                    <p className="text-xs text-slate-400">{threads.length} ativas</p>
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
            </div>

            {/* Lista de Conversas */}
            <div className="flex-1 overflow-y-auto">
              {threads.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageCircle className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">Nenhuma conversa ainda</p>
                </div>
              ) : (
                threads.map(([phone, arr]) => {
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
                <div className="p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{selectedName}</h3>
                      <p className="text-xs text-slate-400">{formatPhoneDisplay(selected)}</p>
                    </div>
                  </div>
                </div>

                {/* Mensagens - COM SCROLL PRÓPRIO */}
                <div className="flex-1 overflow-y-auto p-6 bg-[#0a0e14] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]">
                  <div className="max-w-4xl mx-auto space-y-3">
                    {selectedMessages.map((m, idx) => {
                      const fromKey = normalizePhone(m.from)
                      const toKey = normalizePhone(m.to)

                      // Entrada: from == cliente. Saída: qualquer outra combinação.
                      // Protege contra eco (nossas mensagens não viram entrada).
                      const isClient = fromKey === selectedKey && selectedKey !== ''
                      const isOutgoing = !isClient

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
                  <div className="max-w-4xl mx-auto flex gap-3">
                    <input
                      type="text"
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
                      className="flex-1 bg-slate-800 text-white px-4 py-3 rounded-xl border border-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition disabled:opacity-50"
                    />
                    <button
                      onClick={send}
                      disabled={sending || !compose.body.trim()}
                      className="bg-gradient-to-br from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white p-3 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-emerald-500/20"
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
    </div>
  )
}
