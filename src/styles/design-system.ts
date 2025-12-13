/**
 * 🎨 DESIGN SYSTEM - resetado e mobile-first
 */

import {
  colors as tokenColors,
  gradients as tokenGradients,
  radii as tokenRadii,
  shadows as tokenShadows,
  spacing as tokenSpacing,
  typography as tokenTypography,
} from './tokens'

/**
 * 📐 ESPAÇAMENTO — mantém escala 4px e adiciona aliases legíveis
 */
export const spacing = {
  0: '0',
  px: '1px',
  0.5: '0.125rem',
  1: '0.25rem',
  1.5: '0.375rem',
  2: '0.5rem',
  2.5: '0.625rem',
  3: '0.75rem',
  3.5: '0.875rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  7: '1.75rem',
  8: '2rem',
  9: '2.25rem',
  10: '2.5rem',
  11: '2.75rem',
  12: '3rem',
  14: '3.5rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  28: '7rem',
  32: '8rem',
  ...tokenSpacing,
} as const

/**
 * 🎨 CORES — brand + semânticas + gradientes
 */
export const colors = {
  brand: {
    primary: tokenColors.brand.DEFAULT,
    secondary: tokenColors.brand[600],
    gradient: tokenGradients.brand,
  },
  semantic: {
    success: tokenColors.semantic.success,
    warning: tokenColors.semantic.warning,
    danger: tokenColors.semantic.danger,
    info: tokenColors.semantic.info,
  },
  slate: tokenColors.slate,
  gradients: {
    brand: tokenGradients.brand,
    warm: tokenGradients.warm,
    cool: tokenGradients.cool,
    emerald: tokenGradients.emerald,
    purple: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
    blue: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
    amber: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
  },
  backgrounds: {
    light: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 60%, #e0f2fe 100%)',
    dark: 'linear-gradient(135deg, #0b1220 0%, #0f172a 60%, #020617 100%)',
  },
} as const

/**
 * 📏 RAIOS
 */
export const radius = {
  none: '0',
  ...tokenRadii,
} as const

/**
 * 🌗 SOMBRAS
 */
export const shadows = {
  ...tokenShadows,
  dark: {
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.22), 0 1px 2px -1px rgba(0, 0, 0, 0.26)',
    md: '0 4px 10px rgba(0, 0, 0, 0.32)',
    lg: '0 10px 24px rgba(0, 0, 0, 0.4)',
    xl: '0 20px 45px rgba(0, 0, 0, 0.5)',
  },
} as const

/**
 * 📝 TIPOGRAFIA
 */
export const typography = {
  ...tokenTypography,
  fontWeight: {
    ...(tokenTypography.fontWeight ?? {}),
    extrabold: '800',
  },
} as const

/**
 * ⏱️ TRANSIÇÕES E ANIMAÇÕES
 */
export const animations = {
  duration: {
    fastest: '120ms',
    fast: '160ms',
    normal: '220ms',
    slow: '320ms',
    slower: '520ms',
    slowest: '720ms',
  },
  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
  keyframes: {
    fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
    slideUp: {
      from: { transform: 'translateY(10px)', opacity: '0' },
      to: { transform: 'translateY(0)', opacity: '1' },
    },
    slideDown: {
      from: { transform: 'translateY(-10px)', opacity: '0' },
      to: { transform: 'translateY(0)', opacity: '1' },
    },
    scaleIn: {
      from: { transform: 'scale(0.96)', opacity: '0' },
      to: { transform: 'scale(1)', opacity: '1' },
    },
    blob: {
      '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
      '33%': { transform: 'translate(26px, -42px) scale(1.08)' },
      '66%': { transform: 'translate(-18px, 18px) scale(0.94)' },
    },
  },
} as const

/**
 * 🎯 COMPONENTES PADRÃO
 */
export const components = {
  card: {
    base: 'rounded-xl border bg-slate-900 dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-200',
    elevated: 'shadow-md hover:shadow-lg',
    interactive: 'cursor-pointer hover:scale-[1.01] active:scale-[0.99]',
  },
  button: {
    base: 'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    sizes: {
      sm: 'h-9 px-4 text-sm',
      md: 'h-10 px-6 text-base',
      lg: 'h-12 px-8 text-lg',
      xl: 'h-14 px-10 text-xl',
    },
    variants: {
      primary:
        'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.01]',
      secondary:
        'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white',
      success:
        'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.01]',
      danger:
        'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.01]',
      outline:
        'border border-slate-300 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-600 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50',
      ghost: 'hover:bg-slate-100 dark:hover:bg-slate-800',
    },
  },
  input: {
    base: 'w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-900 dark:bg-slate-900 px-4 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200',
    error: 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
  },
  badge: {
    base: 'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-colors',
    variants: {
      default:
        'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100',
      success:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
      warning:
        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
      danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
      info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      outline:
        'border border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300',
    },
  },
  kpiCard: {
    emerald:
      'group border border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/50 dark:to-green-950/30 hover:shadow-xl transition-all hover:scale-[1.01]',
    blue: 'group border border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/30 hover:shadow-xl transition-all hover:scale-[1.01]',
    purple:
      'group border border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/30 hover:shadow-xl transition-all hover:scale-[1.01]',
    amber:
      'group border border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/30 hover:shadow-xl transition-all hover:scale-[1.01]',
  },
} as const

/**
 * 📱 BREAKPOINTS
 */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

/**
 * 🎪 LAYOUTS
 */
export const layouts = {
  container: {
    sm: 'max-w-screen-sm mx-auto px-4 sm:px-6',
    md: 'max-w-screen-md mx-auto px-4 sm:px-6',
    lg: 'max-w-screen-lg mx-auto px-4 sm:px-6 lg:px-8',
    xl: 'max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8',
    '2xl': 'max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8',
    full: 'w-full px-4 sm:px-6 lg:px-8',
  },
  section: {
    spacing: 'py-6 space-y-6',
  },
  grid: {
    kpi: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4',
    twoColumn: 'grid grid-cols-1 xl:grid-cols-3 gap-6',
    threeColumn: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  },
} as const

/**
 * 🎭 UTILITÁRIOS
 */
export const utilities = {
  gradientText: {
    primary:
      'bg-gradient-to-r from-slate-900 via-indigo-800 to-blue-700 dark:from-white dark:via-indigo-200 dark:to-blue-200 bg-clip-text text-transparent',
    brand:
      'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent',
    emerald:
      'bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent',
  },
  pageBackground:
    'min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/25 to-purple-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950',
  iconContainer: {
    emerald:
      'p-2.5 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl group-hover:scale-110 transition-transform',
    blue: 'p-2.5 bg-blue-100 dark:bg-blue-900/50 rounded-xl group-hover:scale-110 transition-transform',
    purple:
      'p-2.5 bg-purple-100 dark:bg-purple-900/50 rounded-xl group-hover:scale-110 transition-transform',
    amber:
      'p-2.5 bg-amber-100 dark:bg-amber-900/50 rounded-xl group-hover:scale-110 transition-transform',
    slate:
      'p-2.5 bg-slate-100 dark:bg-slate-800/50 rounded-xl group-hover:scale-110 transition-transform',
  },
  statusDot: {
    success: 'h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse',
    warning: 'h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse',
    danger: 'h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse',
    info: 'h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse',
  },
} as const

export const designSystem = {
  spacing,
  colors,
  radius,
  shadows,
  typography,
  animations,
  components,
  breakpoints,
  layouts,
  utilities,
} as const

export default designSystem
