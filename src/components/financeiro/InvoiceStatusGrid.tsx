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
        bg: 'from-amber-50/80 to-orange-50/80 dark:from-amber-950/30 dark:to-orange-950/30',
        iconBg: 'bg-amber-100 dark:bg-amber-900/40',
        text: 'text-amber-700 dark:text-amber-400',
        value: 'text-amber-900 dark:text-amber-100',
      }
    case 'emerald':
      return {
        bg: 'from-emerald-50/80 to-green-50/80 dark:from-emerald-950/30 dark:to-green-950/30',
        iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
        text: 'text-emerald-700 dark:text-emerald-400',
        value: 'text-emerald-900 dark:text-emerald-100',
      }
    case 'rose':
      return {
        bg: 'from-rose-50/80 to-red-50/80 dark:from-rose-950/30 dark:to-red-950/30',
        iconBg: 'bg-rose-100 dark:bg-rose-900/40',
        text: 'text-rose-700 dark:text-rose-400',
        value: 'text-rose-900 dark:text-rose-100',
      }
    default:
      return {
        bg: 'from-slate-50/80 to-gray-50/80 dark:from-slate-950/30 dark:to-gray-950/30',
        iconBg: 'bg-slate-100 dark:bg-slate-900/40',
        text: 'text-slate-700 dark:text-slate-400',
        value: 'text-slate-900 dark:text-slate-100',
      }
  }
}

export function InvoiceStatusGrid({ invoices }: InvoiceStatusGridProps) {
  if (!invoices) return null

  return (
    <Card size="md" variant="elevated" className="overflow-visible">
      <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-1 rounded-t-xl" />
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-sm">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold">Status das Faturas</CardTitle>
            <CardDescription className="text-sm">Visão geral completa do status de todas as faturas</CardDescription>
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
              <Card key={s.key} size="sm" variant="elevated" className={`h-full ${classes.bg} p-0 overflow-visible`}>
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


