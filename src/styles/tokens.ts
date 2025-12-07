/**
 * Design Tokens Centralizados
 * Fonte única de verdade para cores, espaçamentos, sombras, etc.
 * Usado para gerar CSS custom properties e configuração do Tailwind
 */

export const colors = {
  // Brand palette (mantém compatibilidade com código existente)
  brand: {
    50: '#f6f5ff',
    100: '#ede9ff',
    200: '#dbccff',
    300: '#c1a8ff',
    400: '#a07cff',
    500: '#7b4bff',
    600: '#6a3be6',
    700: '#562fb4',
    800: '#3f2388',
    900: '#2b1a5a',
    DEFAULT: '#5B4BFB',
    foreground: '#FFFFFF',
    subtle: '#F0EEFF',
  },
  // Semantic status colors
  status: {
    success: '#16A34A',
    warning: '#F59E0B',
    danger: '#DC2626',
    info: '#0EA5E9',
  },
} as const

export const spacing = {
  xs: '0.25rem', // 4px (small step for tight UI)
  sm: '0.5rem', // 8px
  md: '1rem', // 16px
  lg: '1.5rem', // 24px
  xl: '2rem', // 32px
  '2xl': '2.5rem', // 40px
  '3xl': '3.5rem', // 56px
  '4xl': '4.5rem', // 72px
} as const

export const radii = {
  xs: '0.125rem', // 2px (sharp controls)
  sm: '0.375rem', // 6px
  md: '0.5rem', // 8px
  lg: '0.75rem', // 12px (rounded containers)
  xl: '1rem', // 16px (cards and modals)
  '2xl': '1.5rem', // 24px (large panels)
  full: '9999px',
} as const

export const shadows = {
  xs: '0 1px 2px rgba(16,24,40,0.04)',
  sm: '0 4px 8px rgba(16,24,40,0.06)',
  md: '0 8px 20px rgba(16,24,40,0.08)',
  lg: '0 20px 40px rgba(16,24,40,0.12)',
  xl: '0 30px 80px rgba(16,24,40,0.18)',
  '2xl': '0 40px 120px rgba(16,24,40,0.22)',
  focus: '0 0 0 4px rgba(91,75,251,0.18)',
  soft: '0 6px 24px rgba(16,24,40,0.06)',
} as const

export const typography = {
  fontFamily: {
    sans: 'Inter, system-ui, -apple-system, sans-serif',
    mono: 'ui-monospace, monospace',
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }], // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }], // 14px
    base: ['1rem', { lineHeight: '1.6rem' }], // 16px
    md: ['1.125rem', { lineHeight: '1.75rem' }], // 18px
    lg: ['1.25rem', { lineHeight: '1.8rem' }], // 20px
    xl: ['1.5rem', { lineHeight: '2rem' }], // 24px
    '2xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '3xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
    '4xl': ['3rem', { lineHeight: '1' }], // 48px
  },
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
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

/**
 * Gradientes predefinidos
 */
export const gradients = {
  brand: 'linear-gradient(135deg, #5B4BFB 0%, #8E54E9 50%, #FF6EA6 100%)',
  warm: 'linear-gradient(135deg, #F97316, #EF4444)',
  cool: 'linear-gradient(135deg, #0EA5E9, #6366F1)',
  studio: 'linear-gradient(90deg, #2563eb, #7c3aed)',
} as const

/**
 * Tokens específicos do Branding Studio
 * (mantém compatibilidade com código existente)
 */
export const studioTokens = {
  cardBg: '#ffffff',
  cardBorder: '#e6e9ee',
  cardRadius: '0.75rem',
  cardShadow: '0 6px 18px rgba(15, 23, 42, 0.06)',
  accentGradient: 'linear-gradient(90deg, #2563eb, #7c3aed)',
} as const
