/**
 * ResponsiveWrapper - Componente global para garantir responsividade
 * 
 * Aplica automaticamente:
 * - Overflow-x prevention
 * - Min-width constraints
 * - Responsive padding/spacing
 * - Mobile-first breakpoints
 * 
 * Use este componente para envolver conteúdo que precisa de proteção contra overflow
 */

import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface ResponsiveWrapperProps {
  children: ReactNode
  className?: string
  /** Aplica padding responsivo automaticamente */
  withPadding?: boolean
  /** Aplica espaçamento vertical responsivo entre elementos filhos */
  withSpacing?: boolean
  /** Tipo de espaçamento: 'small' | 'medium' | 'large' */
  spacing?: 'small' | 'medium' | 'large'
  /** Limita a largura máxima */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full'
  /** Remove margens horizontais negativas (útil em alguns contextos) */
  noNegativeMargin?: boolean
  /** Aplica como elemento pai de lista */
  asList?: boolean
}

const spacingClasses = {
  small: 'space-y-2 sm:space-y-3',
  medium: 'space-y-3 sm:space-y-4 lg:space-y-6',
  large: 'space-y-4 sm:space-y-6 lg:space-y-8',
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full',
}

export function ResponsiveWrapper({
  children,
  className,
  withPadding = false,
  withSpacing = false,
  spacing = 'medium',
  maxWidth = 'full',
  noNegativeMargin = false,
  asList = false,
}: ResponsiveWrapperProps) {
  const Component = asList ? 'ul' : 'div'

  return (
    <Component
      className={cn(
        // Proteção global contra overflow
        'w-full max-w-full overflow-x-hidden',
        'box-border',

        // Padding responsivo opcional
        withPadding && 'px-2 sm:px-4 lg:px-6',

        // Espaçamento vertical responsivo
        withSpacing && spacingClasses[spacing],

        // Largura máxima
        maxWidth !== 'full' && maxWidthClasses[maxWidth],
        maxWidth !== 'full' && 'mx-auto',

        // Remove margens negativas se necessário
        noNegativeMargin && 'mx-0',

        className
      )}
    >
      {children}
    </Component>
  )
}

/**
 * ResponsiveListItem - Item de lista responsivo com proteção contra overflow
 * Use para itens de lista, cards, etc que precisam ajustar entre mobile e desktop
 */
interface ResponsiveListItemProps {
  children: ReactNode
  className?: string
  /** Se true, usa layout de coluna em mobile e linha em desktop */
  stackOnMobile?: boolean
  /** Espaçamento interno */
  padding?: 'small' | 'medium' | 'large'
  onClick?: () => void
}

const paddingClasses = {
  small: 'p-2 sm:p-3',
  medium: 'p-3 sm:p-4 lg:p-5',
  large: 'p-4 sm:p-6 lg:p-8',
}

export function ResponsiveListItem({
  children,
  className,
  stackOnMobile = true,
  padding = 'medium',
  onClick,
}: ResponsiveListItemProps) {
  return (
    <div
      className={cn(
        // Layout responsivo
        'flex gap-3 sm:gap-4',
        stackOnMobile ? 'flex-col sm:flex-row sm:items-center sm:justify-between' : 'items-center justify-between',

        // Padding responsivo
        paddingClasses[padding],

        // Proteção contra overflow
        'min-w-0 w-full max-w-full overflow-hidden',

        // Interatividade
        onClick && 'cursor-pointer transition-all hover:shadow-md',

        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

/**
 * ResponsiveGrid - Grid responsivo com colunas automáticas
 */
interface ResponsiveGridProps {
  children: ReactNode
  className?: string
  /** Número de colunas em desktop */
  cols?: 1 | 2 | 3 | 4 | 5 | 6
  /** Gap entre itens */
  gap?: 'small' | 'medium' | 'large'
}

const colsClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  5: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
  6: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
}

const gapClasses = {
  small: 'gap-2 sm:gap-3',
  medium: 'gap-3 sm:gap-4 lg:gap-6',
  large: 'gap-4 sm:gap-6 lg:gap-8',
}

export function ResponsiveGrid({
  children,
  className,
  cols = 3,
  gap = 'medium',
}: ResponsiveGridProps) {
  return (
    <div
      className={cn(
        'grid w-full',
        colsClasses[cols],
        gapClasses[gap],
        'overflow-x-hidden',
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * ResponsiveText - Texto com truncamento automático
 */
interface ResponsiveTextProps {
  children: ReactNode
  className?: string
  /** Se true, trunca o texto com ellipsis */
  truncate?: boolean
  /** Número máximo de linhas antes de truncar */
  lines?: number
}

export function ResponsiveText({
  children,
  className,
  truncate = false,
  lines,
}: ResponsiveTextProps) {
  return (
    <span
      className={cn(
        'min-w-0 max-w-full',
        truncate && 'truncate',
        lines && `line-clamp-${lines}`,
        className
      )}
    >
      {children}
    </span>
  )
}
