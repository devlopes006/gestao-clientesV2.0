'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Info
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface FinancialAlert {
  id: string
  type: 'warning' | 'success' | 'info' | 'danger'
  title: string
  message: string
  action?: {
    label: string
    href: string
  }
}

export function FinancialAlerts() {
  const [alerts, setAlerts] = useState<FinancialAlert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      const year = new Date().getFullYear()
      const month = new Date().getMonth() + 1
      const response = await fetch(`/api/reports/dashboard?year=${year}&month=${month}`)

      if (!response.ok) throw new Error('Erro ao carregar alertas')

      const result = await response.json()
      const data = result.data || result
      const newAlerts: FinancialAlert[] = []

      // Alerta: Faturas vencidas
      if (data?.invoices?.overdue?.count > 0) {
        newAlerts.push({
          id: 'overdue',
          type: 'danger',
          title: `${data.invoices.overdue.count} ${data.invoices.overdue.count === 1 ? 'fatura vencida' : 'faturas vencidas'}`,
          message: `Total de ${formatCurrency(data.invoices.overdue.total)} aguardando pagamento`,
          action: {
            label: 'Ver faturas',
            href: '/financeiro?tab=faturas&status=overdue'
          }
        })
      }

      // Alerta: Alta receita pendente
      if (data?.financial?.pendingIncome > (data?.financial?.totalIncome ?? 0) * 0.5) {
        newAlerts.push({
          id: 'pending-income',
          type: 'warning',
          title: 'Alta taxa de receita pendente',
          message: `${formatCurrency(data.financial.pendingIncome)} em receitas ainda não confirmadas`,
          action: {
            label: 'Ver transações',
            href: '/financeiro?tab=transacoes&status=PENDING&type=INCOME'
          }
        })
      }

      // Alerta: Resultado negativo
      if (data?.financial?.netProfit < 0) {
        newAlerts.push({
          id: 'negative-profit',
          type: 'danger',
          title: 'Resultado negativo no período',
          message: `Despesas excederam receitas em ${formatCurrency(Math.abs(data.financial.netProfit))}`,
        })
      }

      // Sucesso: Nenhuma fatura vencida
      if (data?.invoices?.overdue?.count === 0 && data?.invoices?.open?.count > 0) {
        newAlerts.push({
          id: 'all-good',
          type: 'success',
          title: 'Pagamentos em dia!',
          message: 'Nenhuma fatura vencida no momento',
        })
      }

      // Info: Total a receber
      if (data?.invoices?.totalReceivable > 0) {
        newAlerts.push({
          id: 'receivable',
          type: 'info',
          title: 'A receber',
          message: `${formatCurrency(data.invoices.totalReceivable)} em ${data.invoices.open.count} ${data.invoices.open.count === 1 ? 'fatura' : 'faturas'}`,
          action: {
            label: 'Ver faturas',
            href: '/financeiro?tab=faturas&status=OPEN'
          }
        })
      }

      setAlerts(newAlerts)
    } catch (err) {
      console.error('Erro ao carregar alertas:', err)
    } finally {
      setLoading(false)
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'danger': return <AlertTriangle className="h-5 w-5" />
      case 'warning': return <Bell className="h-5 w-5 animate-pulse" />
      case 'success': return <CheckCircle className="h-5 w-5" />
      case 'info': return <Info className="h-5 w-5" />
      default: return <Bell className="h-5 w-5" />
    }
  }

  const getAlertColors = (type: string) => {
    switch (type) {
      case 'danger':
        return {
          border: 'border-rose-500/30',
          bg: 'bg-gradient-to-br from-rose-500/10 via-red-500/5 to-slate-900/90 backdrop-blur-xl',
          iconBg: 'bg-rose-500/20 border border-rose-500/30',
          iconColor: 'text-rose-300',
          textColor: 'text-slate-100',
          subtextColor: 'text-slate-400',
          accent: 'from-rose-500 to-red-500'
        }
      case 'warning':
        return {
          border: 'border-amber-500/30',
          bg: 'bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-slate-900/90 backdrop-blur-xl',
          iconBg: 'bg-amber-500/20 border border-amber-500/30',
          iconColor: 'text-amber-300',
          textColor: 'text-slate-100',
          subtextColor: 'text-slate-400',
          accent: 'from-amber-500 to-yellow-500'
        }
      case 'success':
        return {
          border: 'border-emerald-500/30',
          bg: 'bg-gradient-to-br from-emerald-500/10 via-green-500/5 to-slate-900/90 backdrop-blur-xl',
          iconBg: 'bg-emerald-500/20 border border-emerald-500/30',
          iconColor: 'text-emerald-300',
          textColor: 'text-slate-100',
          subtextColor: 'text-slate-400',
          accent: 'from-emerald-500 to-green-500'
        }
      case 'info':
        return {
          border: 'border-blue-500/30',
          bg: 'bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-slate-900/90 backdrop-blur-xl',
          iconBg: 'bg-blue-500/20 border border-blue-500/30',
          iconColor: 'text-blue-300',
          textColor: 'text-slate-100',
          subtextColor: 'text-slate-400',
          accent: 'from-blue-500 to-indigo-500'
        }
      default:
        return {
          border: 'border-slate-600/30',
          bg: 'bg-slate-900/90 backdrop-blur-xl',
          iconBg: 'bg-slate-700/20 border border-slate-600/30',
          iconColor: 'text-slate-400',
          textColor: 'text-slate-100',
          subtextColor: 'text-slate-400',
          accent: 'from-slate-500 to-slate-500'
        }
    }
  }

  if (loading) {
    return (
      <Card size="sm" variant="elevated" className="border border-blue-500/20 bg-gradient-to-br from-slate-900 via-blue-950/20 to-slate-900/90 backdrop-blur-xl shadow-2xl">
        <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-1 animate-pulse" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-slate-100">
            <Bell className="h-5 w-5 animate-pulse text-blue-400" />
            Alertas Financeiros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400 animate-pulse">Carregando alertas...</p>
        </CardContent>
      </Card>
    )
  }

  if (alerts.length === 0) {
    return null
  }

  return (
    <Card size="sm" variant="elevated" className="overflow-hidden border border-indigo-500/20 bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-900/90 backdrop-blur-xl shadow-2xl">
      <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-1" />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500/30 to-indigo-500/30 rounded-xl shadow-lg shadow-blue-500/30">
              <Bell className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Alertas Financeiros
                <Badge className="text-xs px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">{alerts.length}</Badge>
              </CardTitle>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={fetchAlerts} className="text-xs text-slate-300 hover:text-slate-100 hover:bg-slate-800/50">
              Atualizar
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <AnimatePresence>
          <div className="flex flex-wrap gap-3">
            {alerts.map((alert, index) => {
              const colors = getAlertColors(alert.type)
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex-1 min-w-[280px]"
                >
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${colors.border} ${colors.bg} shadow-lg hover:shadow-xl transition-all duration-300 group`}>
                    <div className={`${colors.iconBg} rounded-xl p-2.5 flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                      <div className={colors.iconColor}>{getAlertIcon(alert.type)}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-bold ${colors.textColor} mb-0.5`}>{alert.title}</div>
                      <div className={`text-xs ${colors.subtextColor} leading-relaxed`}>{alert.message}</div>
                    </div>
                    {alert.action && (
                      <Link href={alert.action.href} className={`ml-2 text-xs font-semibold ${colors.iconColor} hover:underline whitespace-nowrap`}>
                        {alert.action.label} →
                      </Link>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
