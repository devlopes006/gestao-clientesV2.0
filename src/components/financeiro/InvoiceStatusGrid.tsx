"use client"

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { AlertCircle, AlertTriangle, CheckCircle, Clock, FileText } from 'lucide-react'

interface InvoiceStatusGridProps {
  invoices?: {
    open?: { count: number; total: number }
    paid?: { count: number; total: number }
    overdue?: { count: number; total: number }
    cancelled?: { count: number; total: number }
  } | null
}

const STATUS = [
  { key: 'open', label: 'Em Aberto', icon: Clock, color: 'amber' },
  { key: 'paid', label: 'Pagas', icon: CheckCircle, color: 'emerald' },
  { key: 'overdue', label: 'Vencidas', icon: AlertTriangle, color: 'rose' },
  { key: 'cancelled', label: 'Canceladas', icon: AlertCircle, color: 'slate' },
]

function colorClasses(color: string) {
  switch (color) {
    case 'amber':
      return {
        bg: 'from-slate-900 via-amber-950/30 to-slate-900/90',
        iconBg: 'bg-amber-500/20 border border-amber-500/30',
        text: 'text-amber-400',
        value: 'text-amber-100',
        border: 'border-amber-500/20'
      }
    case 'emerald':
      return {
        bg: 'from-slate-900 via-emerald-950/30 to-slate-900/90',
        iconBg: 'bg-emerald-500/20 border border-emerald-500/30',
        text: 'text-emerald-400',
        value: 'text-emerald-100',
        border: 'border-emerald-500/20'
      }
    case 'rose':
      return {
        bg: 'from-slate-900 via-rose-950/30 to-slate-900/90',
        iconBg: 'bg-rose-500/20 border border-rose-500/30',
        text: 'text-rose-400',
        value: 'text-rose-100',
        border: 'border-rose-500/20'
      }
    default:
      return {
        bg: 'from-slate-900 via-slate-950/30 to-slate-900/90',
        iconBg: 'bg-slate-700/20 border border-slate-600/30',
        text: 'text-slate-400',
        value: 'text-slate-100',
        border: 'border-slate-600/20'
      }
  }
}

export function InvoiceStatusGrid({ invoices }: InvoiceStatusGridProps) {
  if (!invoices) return null

  return (
    <Card size="md" variant="elevated" className="overflow-visible border border-blue-500/20 bg-gradient-to-br from-slate-900 via-blue-950/20 to-slate-900/90 backdrop-blur-xl shadow-2xl">
      <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-1 rounded-t-xl" />
      <CardHeader className="pb-3 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border-b border-blue-500/20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/20 border border-blue-500/30 rounded-xl shadow-sm">
            <FileText className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-slate-100">Status das Faturas</CardTitle>
            <CardDescription className="text-sm text-slate-400">Visão geral completa do status de todas as faturas</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STATUS.map((s) => {
            const Icon = s.icon as any
            const classes = colorClasses(s.color)
            const data = invoices[s.key as keyof typeof invoices]
            const count = data?.count ?? 0
            const total = data?.total ?? 0

            return (
              <Card key={s.key} size="sm" variant="elevated" className={`h-full border ${classes.border} bg-gradient-to-br ${classes.bg} backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 p-0 overflow-visible`}>
                <CardContent className="py-6 px-6 flex flex-col justify-between h-full">
                  <div className="flex items-start gap-3">
                    <div className={`${classes.iconBg} p-3 rounded-lg shadow-sm flex items-center justify-center`}>
                      <Icon className={`${classes.text} h-6 w-6`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`${classes.text} text-sm font-semibold uppercase tracking-wider`}>{s.label}</p>
                        <span className="ml-auto" />
                      </div>
                    </div>
                    <div />
                  </div>

                  <div>
                    <div className={`${classes.value} font-extrabold leading-tight text-[clamp(1.2rem,2.2vw,2.6rem)]`}>{formatCurrency(total)}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs px-2 py-0.5">{count}</Badge>
                      <div className="text-xs text-muted-foreground">{count} {count === 1 ? 'fatura' : 'faturas'}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export default InvoiceStatusGrid


