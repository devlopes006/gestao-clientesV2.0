import { cn } from '@/lib/utils'
import React from 'react'

type SizeKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type Size = SizeKey | number

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  as: React.ComponentType<React.SVGProps<SVGSVGElement>>
  size?: Size
  decorative?: boolean
  ariaLabel?: string
}

const sizeMap: Record<SizeKey, string> = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
}

export function Icon({ as: As, size = 'md', className, decorative = false, ariaLabel, ...props }: IconProps) {
  const sizeClasses = typeof size === 'number' ? `w-[${size}px] h-[${size}px]` : sizeMap[size as SizeKey] ?? sizeMap.md
  const a11y = decorative ? { 'aria-hidden': true } : ariaLabel ? { role: 'img', 'aria-label': ariaLabel } : {}

  return <As className={cn(sizeClasses, className)} {...(a11y as any)} {...props} />
}

export default Icon
