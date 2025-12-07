'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { motion } from 'framer-motion'
import { TrendingUp, Zap } from 'lucide-react'
import { useId } from 'react'

const MONTHS_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

interface MonthlyData {
  month: number
  net: number
  income: number
}

interface MonthlyPerformanceChartProps {
  data: MonthlyData[]
  year: number
}

export function MonthlyPerformanceChart({ data, year }: MonthlyPerformanceChartProps) {
  // Generate unique IDs
  const chartId = useId()
  const areaGradientId = `area-${chartId}`
  const lineGradientId = `line-${chartId}`
  const glowId = `glow-${chartId}`
  const bgGradientId = `bg-${chartId}`

  if (!data || data.length === 0) {
    return (
      <Card size="md" variant="elevated" className="overflow-hidden border-0 bg-gradient-to-br from-background to-muted/20">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Desempenho Mensal
              </span>
              <p className="text-xs text-muted-foreground font-normal">{year} • Evolução do lucro</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium text-muted-foreground">Sem dados para o ano</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const values = data.map((x) => x.net)
  const w = 1200
  const h = 200
  const padding = 30
  const min = Math.min(...values, 0)
  const max = Math.max(...values, 0)
  const range = max - min || 1
  const stepX = (w - padding * 2) / (values.length - 1 || 1)

  // Calculate stats
  const best = data.reduce((a, b) => (b.net > a.net ? b : a))
  const worst = data.reduce((a, b) => (b.net < a.net ? b : a))
  const avgIncome = data.reduce((s, x) => s + x.income, 0) / data.length
  const totalNet = data.reduce((s, x) => s + x.net, 0)

  // Points for main line
  const points = values
    .map((v, i) => {
      const x = padding + i * stepX
      const y = h - padding - ((v - min) / range) * (h - padding * 2)
      return `${x},${y}`
    })
    .join(' ')

  // Area gradient fill
  const areaPoints = `${padding},${h - padding} ${points} ${padding + (values.length - 1) * stepX},${h - padding}`

  return (
    <Card size="md" variant="elevated" className="overflow-hidden border-0 bg-gradient-to-br from-background via-blue-50/5 to-indigo-50/10 dark:via-blue-950/5 dark:to-indigo-950/10">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/3 via-transparent to-indigo-500/3 pointer-events-none" />

      <CardHeader className="relative pb-4 sm:pb-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Desempenho Mensal
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {year} • Evolução do lucro líquido • Total: {formatCurrency(totalNet)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
              <Badge className="bg-gradient-to-r from-emerald-600 to-green-600 text-white border-0 shadow-md font-bold whitespace-nowrap">
                <Zap className="h-3 w-3 mr-1" />
                Melhor: {MONTHS_NAMES[best.month - 1]}
              </Badge>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25 }}>
              <Badge className="bg-gradient-to-r from-orange-600 to-red-600 text-white border-0 shadow-md font-bold whitespace-nowrap">
                Pior: {MONTHS_NAMES[worst.month - 1]}
              </Badge>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
              <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 shadow-md font-bold whitespace-nowrap">
                Média: {formatCurrency(avgIncome)}
              </Badge>
            </motion.div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4 sm:space-y-5">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}>
          <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-40 sm:h-48 md:h-56 drop-shadow-sm">
            <defs>
              <linearGradient id={areaGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: 'rgb(59, 130, 246)', stopOpacity: 0.35 }} />
                <stop offset="50%" style={{ stopColor: 'rgb(99, 102, 241)', stopOpacity: 0.15 }} />
                <stop offset="100%" style={{ stopColor: 'rgb(139, 92, 246)', stopOpacity: 0.05 }} />
              </linearGradient>

              <linearGradient id={lineGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: 'rgb(59, 130, 246)' }} />
                <stop offset="50%" style={{ stopColor: 'rgb(99, 102, 241)' }} />
                <stop offset="100%" style={{ stopColor: 'rgb(139, 92, 246)' }} />
              </linearGradient>

              <filter id={glowId}>
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <linearGradient id={bgGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.1" />
                <stop offset="100%" stopColor="rgb(139, 92, 246)" stopOpacity="0.1" />
              </linearGradient>
            </defs>

            {/* Background gradient bars */}
            <rect x={padding} y={padding} width={w - padding * 2} height={h - padding * 2} fill={`url(#${bgGradientId})`} opacity="0.3" />

            {/* Horizontal grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
              const y = h - padding - ratio * (h - padding * 2)
              return (
                <line
                  key={idx}
                  x1={padding}
                  y1={y}
                  x2={w - padding}
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-slate-200 dark:text-slate-700"
                  strokeDasharray="5 5"
                  opacity="0.4"
                />
              )
            })}

            {/* Vertical grid lines (months) */}
            {values.map((_, i) => {
              const x = padding + i * stepX
              return (
                <line
                  key={`v${i}`}
                  x1={x}
                  y1={h - padding}
                  x2={x}
                  y2={h - padding + 4}
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-slate-300 dark:text-slate-700"
                  opacity="0.6"
                />
              )
            })}

            {/* Area fill */}
            <polygon fill={`url(#${areaGradientId})`} points={areaPoints} />

            {/* Main line */}
            <polyline
              fill="none"
              stroke={`url(#${lineGradientId})`}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
              filter={`url(#${glowId})`}
              vectorEffect="non-scaling-stroke"
            />

            {/* Data points with hover effects */}
            {values.map((v, i) => {
              const x = padding + i * stepX
              const y = h - padding - ((v - min) / range) * (h - padding * 2)
              const isPositive = v >= 0
              const isExtreme = v === max || v === min

              return (
                <g key={i}>
                  {/* Outer glow circle */}
                  <circle
                    cx={x}
                    cy={y}
                    r="7"
                    fill={isPositive ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'}
                    opacity="0.15"
                  />

                  {/* Main circle with border */}
                  <circle
                    cx={x}
                    cy={y}
                    r="5.5"
                    fill="white"
                    stroke={isPositive ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'}
                    strokeWidth="2.5"
                    className="transition-all duration-200"
                    style={{
                      filter: isExtreme ? 'drop-shadow(0 0 4px currentColor)' : 'none',
                    }}
                  />

                  {/* Inner circle */}
                  <circle
                    cx={x}
                    cy={y}
                    r="2.5"
                    fill={isPositive ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'}
                  />

                  {/* Invisible larger circle for hover area */}
                  <circle
                    cx={x}
                    cy={y}
                    r="12"
                    fill="transparent"
                    className="cursor-pointer hover:fill-white/20 transition-all"
                  />
                </g>
              )
            })}
          </svg>
        </motion.div>

        {/* Month labels */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="flex justify-between px-2 text-xs font-semibold text-muted-foreground"
        >
          {MONTHS_NAMES.map((name, i) => (
            <span key={i} className="w-8 text-center">
              {name}
            </span>
          ))}
        </motion.div>

        {/* Stats grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="grid grid-cols-3 gap-2 sm:gap-3 pt-2 border-t border-border"
        >
          {[
            { label: 'Máximo', value: formatCurrency(max), icon: '📈', color: 'from-green-500 to-emerald-500' },
            { label: 'Total', value: formatCurrency(totalNet), icon: '💰', color: 'from-blue-500 to-indigo-500' },
            { label: 'Mínimo', value: formatCurrency(min), icon: '📉', color: 'from-orange-500 to-red-500' },
          ].map((stat, idx) => (
            <div key={idx} className="text-center">
              <div className="text-lg sm:text-xl font-bold mb-0.5">{stat.icon}</div>
              <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
              <p className={`text-sm sm:text-base font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                {stat.value}
              </p>
            </div>
          ))}
        </motion.div>
      </CardContent>
    </Card>
  )
}
