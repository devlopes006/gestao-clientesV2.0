'use client'

import { AlertCircle, MessageCircle, RefreshCw, Send } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

type Msg = {
  event: 'message' | 'status'
  id?: string
  from?: string
  to?: string | null
  name?: string
  type?: string
  text?: string | null
  timestamp?: string
  recipient_id?: string
  clientName?: string
  clientPhone?: string
}

export default function MessagesPage() {
  const [items, setItems] = useState<Msg[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [compose, setCompose] = useState({ to: '', body: '' })

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

  const threads = useMemo(() => {
    const map = new Map<string, Msg[]>()
    for (const m of items) {
      const key = m.from || m.recipient_id || 'unknown'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(m)
    }
    for (const [, arr] of map.entries()) {
      arr.sort((a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime())
    }
    return Array.from(map.entries())
  }, [items])

  // Se há erro, mostrar
  if (error && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-8">
        <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 rounded-2xl p-8 max-w-2xl backdrop-blur-lg">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <h1 className="text-2xl font-bold text-red-400">⚠️ Erro na API</h1>
          </div>
          <p className="text-slate-300 mb-4">{error}</p>
          <button
            onClick={load}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  async function send() {
    if (!compose.to) return alert('Informe o número E.164 (ex: +5541999998888)')
    if (!compose.body.trim()) return alert('Digite uma mensagem')

    try {
      // Usa endpoint local que faz proxy para a Landing Page
      const res = await fetch('/api/integrations/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: compose.to, body: compose.body }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao enviar')
      setCompose({ to: compose.to, body: '' })
      load()
      alert('Enviado com sucesso!')
    } catch (e) {
      const err = e as Error
      alert(err?.message || 'Falha ao enviar')
    }
  }

  function formatTime(timestamp?: string) {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)

    if (diffMins < 1) return 'agora'
    if (diffMins < 60) return `${diffMins}m atrás`
    if (diffHours < 24) return `${diffHours}h atrás`

    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="grid grid-cols-[400px_1fr] h-screen">
        {/* Sidebar - Lista de Conversas */}
        <aside className="border-r border-slate-700/50 bg-slate-900/50 backdrop-blur-lg overflow-y-auto">
          <div className="sticky top-0 z-10 bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-b border-blue-500/30 backdrop-blur-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-500/20 text-blue-400 p-3 rounded-xl">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Conversas</h2>
                  <p className="text-sm text-slate-400">{threads.length} conversas</p>
                </div>
              </div>
              {loading && (
                <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
              )}
            </div>
            <button
              onClick={load}
              className="w-full bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 font-semibold py-3 px-4 rounded-xl border border-blue-500/30 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </button>
          </div>

          {error && (
            <div className="m-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="p-4 space-y-2">
            {threads.map(([phone, arr]) => {
              const last = arr[arr.length - 1]
              const name = last?.name || phone
              return (
                <button
                  key={phone}
                  onClick={() => {
                    setSelected(phone)
                    setCompose((c) => ({ ...c, to: `+${phone}`.replace(/^\+?\+/, '+') }))
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${selected === phone
                    ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/30'
                    : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/80 hover:border-slate-600/50'
                    }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-semibold text-white truncate flex-1">{name}</div>
                    <div className="text-xs text-slate-400 ml-2">{formatTime(last?.timestamp)}</div>
                  </div>
                  <div className="text-sm text-slate-400 truncate">
                    {last?.text || `(${last?.type})`}
                  </div>
                </button>
              )
            })}
          </div>
        </aside>

        {/* Main - Área de Mensagens */}
        <main className="flex flex-col bg-slate-900/30">
          {/* Header da Conversa */}
          {selected && (
            <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-b border-purple-500/30 backdrop-blur-lg p-6">
              <div className="flex items-center gap-3">
                <div className="bg-purple-500/20 text-purple-400 p-2 rounded-lg">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white">
                    {threads.find(([p]) => p === selected)?.[1][0]?.name || selected}
                  </h3>
                  <p className="text-sm text-slate-400">{selected}</p>
                </div>
              </div>
            </div>
          )}

          {/* Área de Mensagens */}
          <div className="flex-1 overflow-y-auto p-6">
            {!selected ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 text-lg">Selecione uma conversa ao lado</p>
                  <p className="text-slate-500 text-sm mt-2">ou comece uma nova conversa abaixo</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {(threads.find(([p]) => p === selected)?.[1] || []).map((m) => {
                  const isClient = m.from === selected
                  return (
                    <div
                      key={m.id || m.timestamp}
                      className={`flex ${isClient ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl p-4 ${isClient
                          ? 'bg-gradient-to-br from-slate-700/50 to-slate-800/50 border border-slate-600/50'
                          : 'bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30'
                          }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold text-slate-400">
                            {isClient ? 'Cliente' : 'Você'}
                          </span>
                          <span className="text-xs text-slate-500">
                            {formatTime(m.timestamp)}
                          </span>
                        </div>
                        <p className="text-white">{m.text || `(${m.type})`}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Input de Mensagem */}
          <div className="border-t border-slate-700/50 bg-slate-900/80 backdrop-blur-lg p-6">
            <div className="grid grid-cols-[240px_1fr_auto] gap-3">
              <input
                type="tel"
                placeholder="+55DDDNÚMERO"
                value={compose.to}
                onChange={(e) => setCompose((c) => ({ ...c, to: e.target.value }))}
                className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              />
              <input
                type="text"
                placeholder="Escreva uma mensagem…"
                value={compose.body}
                onChange={(e) => setCompose((c) => ({ ...c, body: e.target.value }))}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              />
              <button
                onClick={send}
                className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 hover:from-blue-500/30 hover:to-blue-600/20 text-blue-400 font-semibold px-6 py-3 rounded-xl border border-blue-500/30 transition-all duration-200 flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Enviar
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
