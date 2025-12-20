'use client'

import { Button } from '@/components/ui/button'
import { useUser } from '@/context/UserContext'
import {
  Calendar,
  ExternalLink,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  TrendingUp,
  UserPlus,
  Users
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Lead {
  id: string
  name: string
  email: string | null
  phone: string | null
  status: string
  createdAt: string
  metadata: {
    leadSource?: string
    capturedAt?: string
    plan?: string
    bestTime?: string
    origin?: string
    utm_source?: string
    utm_medium?: string
    utm_campaign?: string
  }
}

export default function LeadsPage() {
  const { user } = useUser()
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    if (user) {
      fetchLeads()
    }
  }, [user, router])

  const fetchLeads = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/leads', {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Erro ao carregar leads')
      }

      const data = await response.json()
      setLeads(data.leads || [])
    } catch (err) {
      console.error('Erro ao buscar leads:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const convertToClient = async (leadId: string) => {
    try {
      const response = await fetch(`/api/clients/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'active' }),
      })

      if (!response.ok) {
        throw new Error('Erro ao converter lead')
      }

      // Atualizar lista
      fetchLeads()
    } catch (err) {
      console.error('Erro ao converter lead:', err)
      alert('Erro ao converter lead em cliente')
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">Carregando leads...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        <div className="max-w-2xl mx-auto mt-20">
          <div className="bg-gradient-to-br from-red-500/20 to-slate-900/20 border border-red-500/30 rounded-2xl p-8 backdrop-blur-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-red-500/20 p-3 rounded-xl">
                <ExternalLink className="w-6 h-6 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Erro ao carregar</h2>
            </div>
            <p className="text-slate-300 mb-6">{error}</p>
            <Button
              onClick={fetchLeads}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar novamente
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {/* Header com KPIs */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Leads Capturados
            </h1>
            <p className="text-slate-400">
              Gerencie leads vindos da Landing Page e outras fontes
            </p>
          </div>
          <Button
            onClick={fetchLeads}
            className="bg-slate-800/80 hover:bg-slate-700 border border-slate-600/50 text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-2xl p-6 backdrop-blur-lg">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-blue-500/20 text-blue-400 p-3 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <p className="text-slate-400 text-sm font-medium mb-1">Total de Leads</p>
            <h3 className="text-3xl font-bold text-white">{leads.length}</h3>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 rounded-2xl p-6 backdrop-blur-lg">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-emerald-500/20 text-emerald-400 p-3 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <p className="text-slate-400 text-sm font-medium mb-1">Hoje</p>
            <h3 className="text-3xl font-bold text-white">
              {leads.filter(l => {
                const date = new Date(l.metadata?.capturedAt || l.createdAt)
                const today = new Date()
                return date.toDateString() === today.toDateString()
              }).length}
            </h3>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-2xl p-6 backdrop-blur-lg">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-purple-500/20 text-purple-400 p-3 rounded-xl">
                <UserPlus className="w-5 h-5" />
              </div>
            </div>
            <p className="text-slate-400 text-sm font-medium mb-1">Aguardando Conversão</p>
            <h3 className="text-3xl font-bold text-white">{leads.length}</h3>
          </div>
        </div>
      </div>

      {/* Tabela de Leads */}
      {leads.length === 0 ? (
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-2xl p-12 text-center backdrop-blur-lg">
            <div className="bg-slate-800/50 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <Users className="w-10 h-10 text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Nenhum lead encontrado</h3>
            <p className="text-slate-400">
              Leads capturados pela Landing Page aparecerão aqui automaticamente
            </p>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-2xl backdrop-blur-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left p-4 font-semibold text-slate-300 text-sm">Nome</th>
                    <th className="text-left p-4 font-semibold text-slate-300 text-sm">Contato</th>
                    <th className="text-left p-4 font-semibold text-slate-300 text-sm">Plano</th>
                    <th className="text-left p-4 font-semibold text-slate-300 text-sm">Melhor Horário</th>
                    <th className="text-left p-4 font-semibold text-slate-300 text-sm">Origem</th>
                    <th className="text-left p-4 font-semibold text-slate-300 text-sm">Data</th>
                    <th className="text-right p-4 font-semibold text-slate-300 text-sm">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead, index) => (
                    <tr
                      key={lead.id}
                      className={`border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors ${index % 2 === 0 ? 'bg-slate-800/20' : 'bg-slate-800/40'
                        }`}
                    >
                      <td className="p-4">
                        <div className="font-semibold text-white">{lead.name}</div>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1 text-sm">
                          {lead.email && (
                            <div className="flex items-center gap-2 text-slate-400">
                              <Mail className="h-3.5 w-3.5 text-blue-400" />
                              <span>{lead.email}</span>
                            </div>
                          )}
                          {lead.phone && (
                            <div className="flex items-center gap-2 text-slate-400">
                              <Phone className="h-3.5 w-3.5 text-emerald-400" />
                              <span>{lead.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {lead.metadata?.plan ? (
                          <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            {lead.metadata.plan}
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        {lead.metadata?.bestTime ? (
                          <div className="flex items-center gap-2 text-sm text-slate-300">
                            <Calendar className="h-3.5 w-3.5 text-orange-400" />
                            <span>{lead.metadata.bestTime}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            {lead.metadata?.leadSource || 'Desconhecido'}
                          </span>
                          {lead.metadata?.utm_source && (
                            <div className="text-xs text-slate-500">
                              {lead.metadata.utm_source}
                              {lead.metadata.utm_medium && ` / ${lead.metadata.utm_medium}`}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-400">
                        {new Date(
                          lead.metadata?.capturedAt || lead.createdAt
                        ).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/clients/${lead.id}`)}
                            className="bg-slate-700/50 hover:bg-slate-600 border-slate-600/50 text-slate-300"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => convertToClient(lead.id)}
                            className="bg-emerald-600/80 hover:bg-emerald-600 text-white border-0"
                          >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Converter
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
