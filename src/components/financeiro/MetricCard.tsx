'use client'

import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { motion } from 'framer-motion'
import {
  ArrowDownRight,
  ArrowUpRight
} from 'lucide-react'

interface MetricCardProps {
  title: string
  value: number
  subtitle?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  type: 'income' | 'expense' | 'profit' | 'receivable'
  icon: React.ReactNode
  delay?: number
}

const colorSchemes = {
  income: {
    gradient: 'from-emerald-500 via-green-500 to-teal-500',
    bg: 'from-emerald-500/5 via-green-500/5 to-slate-900/95',
    glowBg: 'bg-emerald-500/10',
    iconBg: 'bg-gradient-to-br from-emerald-500/30 to-green-500/30 backdrop-blur-sm',
    iconGlow: 'shadow-lg shadow-emerald-500/50',
    text: 'text-emerald-300',
    valueText: 'text-white',
    border: 'border-emerald-500/30',
    hoverBorder: 'hover:border-emerald-400/50',
  },
  expense: {
    gradient: 'from-rose-500 via-red-500 to-pink-500',
    bg: 'from-rose-500/5 via-red-500/5 to-slate-900/95',
    glowBg: 'bg-rose-500/10',
    iconBg: 'bg-gradient-to-br from-rose-500/30 to-red-500/30 backdrop-blur-sm',
    iconGlow: 'shadow-lg shadow-rose-500/50',
    text: 'text-rose-300',
    valueText: 'text-white',
    border: 'border-rose-500/30',
    hoverBorder: 'hover:border-rose-400/50',
  },
  profit: {
    gradient: 'from-blue-500 via-indigo-500 to-violet-500',
    bg: 'from-blue-500/5 via-indigo-500/5 to-slate-900/95',
    glowBg: 'bg-blue-500/10',
    iconBg: 'bg-gradient-to-br from-blue-500/30 to-indigo-500/30 backdrop-blur-sm',
    iconGlow: 'shadow-lg shadow-blue-500/50',
    text: 'text-blue-300',
    valueText: 'text-white',
    border: 'border-blue-500/30',
    hoverBorder: 'hover:border-blue-400/50',
  },
  receivable: {
    gradient: 'from-amber-500 via-orange-500 to-yellow-500',
    bg: 'from-amber-500/5 via-orange-500/5 to-slate-900/95',
    glowBg: 'bg-amber-500/10',
    iconBg: 'bg-gradient-to-br from-amber-500/30 to-orange-500/30 backdrop-blur-sm',
    iconGlow: 'shadow-lg shadow-amber-500/50',
    text: 'text-amber-300',
    valueText: 'text-white',
    border: 'border-amber-500/30',
    hoverBorder: 'hover:border-amber-400/50',
  },
}

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  type,
  icon,
  delay = 0,
}: MetricCardProps) {
  const scheme = colorSchemes[type]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="h-full"
    >
      <Card
        size="md"
        variant="elevated"
        className={`relative overflow-hidden h-full border ${scheme.border} ${scheme.hoverBorder} bg-gradient-to-br ${scheme.bg} backdrop-blur-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 group`}
      >
        {/* Barra de gradiente superior */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${scheme.gradient} opacity-80`} />

        {/* Glow effect de fundo */}
        <div className={`absolute -top-24 -right-24 w-48 h-48 ${scheme.glowBg} rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-500`} />
        <div className={`absolute -bottom-24 -left-24 w-48 h-48 ${scheme.glowBg} rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-500`} />

        <CardContent className="relative h-full flex flex-col pt-5 pb-5 px-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold uppercase tracking-widest ${scheme.text} mb-1.5 truncate`}>
                {title}
              </p>
              {subtitle && (
                <p className="text-xs text-slate-400 leading-tight line-clamp-1">{subtitle}</p>
              )}
            </div>
            <div className={`p-3 rounded-2xl ${scheme.iconBg} ${scheme.iconGlow} group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 flex-shrink-0`}>
              <div className="text-white h-5 w-5">{icon}</div>
            </div>
          </div>

          <div className="mt-auto space-y-2">
            <p className={`text-xl font-black tracking-tight ${scheme.valueText} drop-shadow-lg whitespace-nowrap overflow-hidden text-ellipsis`}>
              {typeof value === 'number' ? formatCurrency(value) : value}
            </p>

            {trend && (
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${trend.isPositive
                ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}>
                {trend.isPositive ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                <span>
                  {trend.isPositive ? '+' : ''}
                  {trend.value.toFixed(1)}%
                </span>
              </div>
            )}
          </div>

          {/* Shine effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
        </CardContent>
      </Card>
    </motion.div>
  )
}

// Grid pattern for background
const gridPatternStyle = `
  .bg-grid-pattern {
    background-image: linear-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 0, 0, 0.05) 1px, transparent 1px);
    background-size: 20px 20px;
  }
`

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.textContent = gridPatternStyle
  document.head.appendChild(styleSheet)
}
