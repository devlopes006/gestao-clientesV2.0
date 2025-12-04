'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { motion } from 'framer-motion'
import { TrendingUp, Trophy, Users } from 'lucide-react'

interface TopClientsCardProps {
  clients: Array<{
    clientId: string
    clientName: string
    totalRevenue: number
    invoiceCount: number
  }>
}

export function TopClientsCard({ clients }: TopClientsCardProps) {
  if (clients.length === 0) {
    return (
      <Card className="border-2 border-border/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Top Clientes por Receita
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-16 w-16 mx-auto mb-3 opacity-20" />
            <p className="font-medium">Nenhum cliente com receita no período</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalRevenue = clients.reduce((sum, c) => sum + c.totalRevenue, 0)
  const maxRevenue = Math.max(...clients.map((c) => c.totalRevenue))

  return (
    <Card className="border-2 border-border/50 shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-1" />
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <Trophy className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
              Top Clientes
              <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600">
                {clients.length}
              </Badge>
            </CardTitle>
            <CardDescription className="text-sm">
              Total de receita: {formatCurrency(totalRevenue)}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {clients.slice(0, 5).map((client, index) => {
            const percentage = (client.totalRevenue / maxRevenue) * 100
            const isTop3 = index < 3

            return (
              <motion.div
                key={client.clientId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card
                  className={`border-2 transition-all duration-300 hover:shadow-md hover:scale-[1.02] ${index === 0
                    ? 'border-yellow-400/50 bg-gradient-to-r from-yellow-50/80 to-amber-50/80 dark:from-yellow-950/30 dark:to-amber-950/30'
                    : index === 1
                      ? 'border-slate-300/50 bg-gradient-to-r from-slate-50/80 to-gray-50/80 dark:from-slate-950/30 dark:to-gray-950/30'
                      : index === 2
                        ? 'border-orange-300/50 bg-gradient-to-r from-orange-50/80 to-amber-50/80 dark:from-orange-950/30 dark:to-amber-950/30'
                        : 'border-blue-200/50 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-950/30 dark:to-indigo-950/30'
                    }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {/* Position Badge */}
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full font-black text-white shadow-lg flex-shrink-0 ${index === 0
                          ? 'bg-gradient-to-br from-yellow-400 to-orange-500'
                          : index === 1
                            ? 'bg-gradient-to-br from-slate-400 to-gray-500'
                            : index === 2
                              ? 'bg-gradient-to-br from-orange-400 to-amber-500'
                              : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                          }`}
                      >
                        {isTop3 ? (
                          <Trophy
                            className={`h-5 w-5 ${index === 0
                              ? 'animate-pulse'
                              : index === 1
                                ? 'opacity-90'
                                : 'opacity-80'
                              }`}
                          />
                        ) : (
                          <span className="text-sm">{index + 1}</span>
                        )}
                      </div>

                      {/* Client Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <p className="font-bold text-sm truncate">
                            {client.clientName}
                          </p>
                          {isTop3 && (
                            <Badge
                              variant="secondary"
                              className="text-xs font-bold"
                            >
                              TOP {index + 1}
                            </Badge>
                          )}
                        </div>

                        {/* Progress Bar */}
                        <div className="relative h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden mb-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className={`absolute top-0 left-0 h-full rounded-full ${index === 0
                              ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                              : index === 1
                                ? 'bg-gradient-to-r from-slate-400 to-gray-500'
                                : index === 2
                                  ? 'bg-gradient-to-r from-orange-400 to-amber-500'
                                  : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                              }`}
                          />
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {client.invoiceCount}{' '}
                            {client.invoiceCount === 1 ? 'fatura' : 'faturas'}
                          </span>
                          <span className="text-muted-foreground">
                            {percentage.toFixed(0)}% do total
                          </span>
                        </div>
                      </div>

                      {/* Revenue */}
                      <div className="text-right flex-shrink-0">
                        <p
                          className={`text-xl font-black ${index === 0
                            ? 'text-yellow-700 dark:text-yellow-400'
                            : index === 1
                              ? 'text-slate-700 dark:text-slate-400'
                              : index === 2
                                ? 'text-orange-700 dark:text-orange-400'
                                : 'text-blue-700 dark:text-blue-400'
                            }`}
                        >
                          {formatCurrency(client.totalRevenue)}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 mt-0.5">
                          <TrendingUp className="h-3 w-3" />
                          <span>Receita total</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
