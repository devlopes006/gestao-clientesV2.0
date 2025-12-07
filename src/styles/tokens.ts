/**
 * Design Tokens centralizados
 * Fonte única para gerar CSS vars e Tailwind theme
 */

export const colors = {
  brand: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
    DEFAULT: '#4f46e5',
    foreground: '#ffffff',
  },
  accent: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    DEFAULT: '#0ea5e9',
  },
  semantic: {
    success: '#16a34a',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#0ea5e9',
  },
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
} as const

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '2.5rem',
  '3xl': '3.5rem',
  '4xl': '4.5rem',
} as const

export const radii = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '0.75rem',
  lg: '1rem',
  xl: '1.25rem',
  '2xl': '1.75rem',
  full: '9999px',
} as const

export const shadows = {
  xs: '0 1px 2px rgba(15, 23, 42, 0.05)',
  sm: '0 4px 10px rgba(15, 23, 42, 0.06)',
  md: '0 10px 24px rgba(15, 23, 42, 0.08)',
  lg: '0 16px 40px rgba(15, 23, 42, 0.12)',
  xl: '0 24px 60px rgba(15, 23, 42, 0.16)',
  focus: '0 0 0 4px rgba(79, 70, 229, 0.2)',
  soft: '0 8px 28px rgba(15, 23, 42, 0.08)',
} as const

export const typography = {
  fontFamily: {
    sans: 'Inter, system-ui, -apple-system, sans-serif',
    mono: 'ui-monospace, monospace',
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1.1rem' }],
    sm: ['0.875rem', { lineHeight: '1.35rem' }],
    base: ['1rem', { lineHeight: '1.6rem' }],
    md: ['1.125rem', { lineHeight: '1.8rem' }],
    lg: ['1.25rem', { lineHeight: '1.9rem' }],
    xl: ['1.5rem', { lineHeight: '2.1rem' }],
    '2xl': ['1.875rem', { lineHeight: '2.4rem' }],
    '3xl': ['2.25rem', { lineHeight: '2.6rem' }],
    '4xl': ['2.75rem', { lineHeight: '1' }],
  },
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
} as const

export const transitions = {
  fast: '150ms',
  base: '200ms',
  slow: '300ms',
  slower: '500ms',
} as const

export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  modal: 1200,
  popover: 1300,
  toast: 1400,
  tooltip: 1500,
} as const

export const gradients = {
  brand: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #0ea5e9 100%)',
  warm: 'linear-gradient(135deg, #f97316, #ef4444)',
  cool: 'linear-gradient(135deg, #0ea5e9, #6366f1)',
  emerald: 'linear-gradient(135deg, #10b981, #059669)',
} as const

export const studioTokens = {
  cardBg: '#ffffff',
  cardBorder: '#e2e8f0',
  cardRadius: '0.75rem',
  cardShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
  accentGradient: 'linear-gradient(90deg, #2563eb, #7c3aed)',
} as const
