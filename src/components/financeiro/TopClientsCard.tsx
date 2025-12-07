'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { motion } from 'framer-motion'
import { ArrowUpRight, Trophy, Users } from 'lucide-react'

interface LegacyClient {
  clientId: string
  clientName: string
  totalRevenue: number
  invoiceCount: number
}

interface TopClientsCardProps {
  clients?: LegacyClient[]
  items?: Array<Record<string, unknown>>
  title?: string
  type?: string
}

const MEDAL_COLORS = {
  gold: {
    bg: 'from-yellow-50/60 to-amber-50/30 dark:from-yellow-950/50 dark:to-amber-950/30',
    border: 'border-yellow-300/70 dark:border-yellow-700/50',
    medal: 'from-yellow-400 to-amber-500',
    text: 'text-yellow-800 dark:text-yellow-200',
    accent: 'from-yellow-500 to-amber-600',
  },
  silver: {
    bg: 'from-slate-100/60 to-gray-100/30 dark:from-slate-900/50 dark:to-gray-900/30',
    border: 'border-slate-300/70 dark:border-slate-700/50',
    medal: 'from-slate-300 to-gray-400',
    text: 'text-slate-800 dark:text-slate-200',
    accent: 'from-slate-500 to-gray-600',
  },
  bronze: {
    bg: 'from-orange-50/60 to-amber-50/30 dark:from-orange-950/50 dark:to-amber-950/30',
    border: 'border-orange-300/70 dark:border-orange-700/50',
    medal: 'from-orange-400 to-amber-500',
    text: 'text-orange-800 dark:text-orange-200',
    accent: 'from-orange-500 to-amber-600',
  },
  default: {
    bg: 'from-blue-50/60 to-indigo-50/30 dark:from-blue-950/50 dark:to-indigo-950/30',
    border: 'border-blue-300/70 dark:border-blue-700/50',
    medal: 'from-blue-500 to-indigo-600',
    text: 'text-blue-800 dark:text-blue-200',
    accent: 'from-blue-500 to-indigo-600',
  },
}

const medalOrder = ['gold', 'silver', 'bronze']

export function TopClientsCard({ clients, items, title }: TopClientsCardProps) {
  const source = (items ?? clients ?? []) as Array<Record<string, unknown>>

  const normalized = source.map((c) => ({
    clientId: (c.clientId ?? c.id ?? 'unknown') as string,
    clientName: (c.clientName ?? c.name ?? 'Cliente') as string,
    totalRevenue: Number(c.totalRevenue ?? c.revenue ?? c.total ?? 0),
    invoiceCount: Number(c.invoiceCount ?? c.transactionCount ?? c._count ?? 0),
  }))

  if (!normalized || normalized.length === 0) {
    return (
      <Card size="md" variant="elevated" className="overflow-hidden border-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-indigo-500/5 pointer-events-none" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20">
              <Trophy className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            {title ?? 'Top Clientes'}
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="text-center py-8 sm:py-12">
            <Users className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium text-muted-foreground">Nenhum cliente com receita no período</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalRevenue = normalized.reduce((s, c) => s + (c.totalRevenue || 0), 0)
  const maxRevenue = Math.max(...normalized.map((c) => c.totalRevenue || 0), 0)

  return (
    <Card size="md" variant="elevated" className="overflow-hidden border-0 bg-gradient-to-br from-background via-background to-muted/30">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-indigo-500/5 pointer-events-none" />

      <CardHeader className="relative pb-4 sm:pb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                <Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <CardTitle className="text-base sm:text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {title ?? 'Top Clientes'}
              </CardTitle>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {formatCurrency(totalRevenue)} • {normalized.length} cliente{normalized.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md flex-shrink-0">
            {normalized.length}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-3 sm:space-y-3.5">
        {normalized.slice(0, 5).map((client, index) => {
          const percentage = maxRevenue > 0 ? (client.totalRevenue / maxRevenue) * 100 : 0
          const medalKey = medalOrder[index] || 'default'
          const colors = MEDAL_COLORS[medalKey as keyof typeof MEDAL_COLORS]

          return (
            <motion.div
              key={client.clientId}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
            >
              <div
                className={`group relative rounded-xl border-2 ${colors.border} bg-gradient-to-r ${colors.bg} p-5 sm:p-6 lg:p-7 transition-all duration-300 hover:shadow-lg hover:border-opacity-100 hover:-translate-y-1`}
              >
                {/* Background shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative flex items-center gap-3 sm:gap-4">
                  {/* Medal/Ranking Badge */}
                  <div className="relative flex-shrink-0">
                    <div
                      className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br ${colors.medal} shadow-lg text-white font-black text-sm sm:text-base`}
                    >
                      {index < 3 ? (
                        <Trophy className={`h-5 w-5 sm:h-6 sm:w-6 ${index === 0 ? 'animate-bounce' : ''}`} />
                      ) : (
                        index + 1
                      )}
                    </div>
                    {index < 3 && (
                      <div
                        className={`absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-r ${colors.accent} shadow-lg flex items-center justify-center text-white text-xs font-bold`}
                      >
                        {index + 1}
                      </div>
                    )}
                  </div>

                  {/* Client Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-2">
                      <p className={`font-bold text-sm sm:text-base truncate ${colors.text}`}>
                        {client.clientName}
                      </p>
                      {index < 3 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.1 + 0.2, type: 'spring' }}
                        >
                          <Badge
                            variant="secondary"
                            className={`text-xs font-bold flex-shrink-0 bg-gradient-to-r ${colors.accent} text-white border-0`}
                          >
                            #{index + 1}
                          </Badge>
                        </motion.div>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="hidden sm:block space-y-1.5 mb-2">
                      <div className="relative h-2 w-full bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.7, delay: index * 0.1 + 0.2, ease: 'easeOut' }}
                          className={`h-full rounded-full bg-gradient-to-r ${colors.accent} shadow-sm`}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{client.invoiceCount} fatura{client.invoiceCount !== 1 ? 's' : ''}</span>
                        <span className="font-semibold">{percentage.toFixed(0)}%</span>
                      </div>
                    </div>

                    {/* Mobile info */}
                    <div className="sm:hidden flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{client.invoiceCount}F</span>
                      <span>•</span>
                      <span>{percentage.toFixed(0)}%</span>
                    </div>
                  </div>

                  {/* Revenue Value */}
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.15, duration: 0.3 }}
                    className="flex-shrink-0 text-right"
                  >
                    <p className={`text-sm sm:text-base font-bold ${colors.text} whitespace-nowrap`}>
                      {formatCurrency(client.totalRevenue)}
                    </p>
                    <div className={`flex items-center justify-end gap-0.5 text-xs ${colors.text} opacity-70`}>
                      <ArrowUpRight className="h-3 w-3" />
                      <span>receita</span>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </CardContent>
    </Card>
  )
}
