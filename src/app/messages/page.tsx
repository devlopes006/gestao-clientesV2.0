'use client'

import { CheckCheck, MessageCircle, RefreshCw, Send, User } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

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

export default function MessagesPage() {
  const [items, setItems] = useState<Msg[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [compose, setCompose] = useState({ to: '', body: '' })
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/integrations/whatsapp/messages', { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      const data = await res.json()
      setItems(data.messages || [])
    } catch (e) {
      const err = e as Error
      setError(err?.message || 'Falha ao carregar mensagens')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 8000)
    return () => clearInterval(t)
  }, [])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [items, selected])

  const threads = useMemo(() => {
    const map = new Map<string, Msg[]>()
    for (const m of items) {
      const key = m.client?.phone || m.from || m.recipient_id || m.recipientId || 'unknown'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(m)
    }
    for (const [, arr] of map.entries()) {
      arr.sort((a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime())
    }
    return Array.from(map.entries())
  }, [items])

  async function send() {
    if (!compose.to || compose.to.trim() === '') {
      return alert('Informe o número E.164 (ex: +5541999998888)')
    }
    if (!compose.body.trim()) return alert('Digite uma mensagem')

    setSending(true)

    // Mensagem local
    const localMsg: Msg = {
      id: `local-${Date.now()}`,
      event: 'message',
      from: 'admin',
      to: compose.to,
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
        body: JSON.stringify({ to: compose.to, body: bodyText }),
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

  const selectedMessages = threads.find(([p]) => p === selected)?.[1] || []
  const selectedName = threads.find(([p]) => p === selected)?.[1][0]?.client?.name ||
    threads.find(([p]) => p === selected)?.[1][0]?.name ||
    selected

  return (
    <div className="h-screen flex flex-col bg-slate-950 pb-20">
      {/* Sidebar - Lista de Conversas */}
      <aside className="w-96 border-r border-slate-800 flex flex-col bg-slate-900">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/20 p-2.5 rounded-xl">
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
              className="p-2 hover:bg-slate-800 rounded-lg transition"
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
              const name = last?.client?.name || last?.name || phone
              const isSelected = selected === phone

              return (
                <button
                  key={phone}
                  onClick={() => {
                    setSelected(phone)
                    setCompose((c) => ({ ...c, to: `+${phone}`.replace(/^\+?\+/, '+') }))
                  }}
                  className={`w-full p-4 border-b border-slate-800 hover:bg-slate-800/50 transition ${isSelected ? 'bg-slate-800/70' : ''
                    }`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-white truncate">{name}</span>
                        <span className="text-xs text-slate-500">{formatTime(last?.timestamp)}</span>
                      </div>
                      <p className="text-sm text-slate-400 truncate">
                        {last?.text || last?.name || `Mensagem ${last?.type || 'recebida'}`}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </aside>

      {/* Área Principal - Chat */}
      <main className="flex-1 flex flex-col">
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
                  <p className="text-xs text-slate-400">{selected}</p>
                </div>
              </div>
            </div>

            {/* Mensagens - COM SCROLL PRÓPRIO */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#0a0e14] bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]">
              <div className="max-w-4xl mx-auto space-y-3">
                {selectedMessages.map((m, idx) => {
                  const isClient = m.from === selected || !m.isLocal

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
  )
}
