/**
 * Helpers para trabalhar com Prisma Decimal
 * Converte entre Decimal e number para compatibilidade
 */

import { Prisma } from '@prisma/client'

type Decimal = Prisma.Decimal

/**
 * Converte Prisma Decimal para number
 */
export function decimalToNumber(
  value: Decimal | null | undefined
): number | null {
  if (value === null || value === undefined) return null
  return value.toNumber()
}

/**
 * Converte number para Prisma Decimal
 */
export function numberToDecimal(
  value: number | null | undefined
): Prisma.Decimal | null {
  if (value === null || value === undefined) return null
  return new Prisma.Decimal(value)
}

/**
 * Soma valores Decimal de forma segura
 */
export function sumDecimals(values: (Decimal | null | undefined)[]): number {
  return values.reduce((sum, val) => {
    if (!val) return sum
    return sum + val.toNumber()
  }, 0)
}

/**
 * Converte Decimal ou number para number
 */
export function toNumber(value: Decimal | number | null | undefined): number {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return value
  return value.toNumber()
}

/**
 * Helper para operações aritméticas com Decimal
 */
export const DecimalMath = {
  add: (a: Decimal | number, b: Decimal | number): number => {
    return toNumber(a) + toNumber(b)
  },

  subtract: (a: Decimal | number, b: Decimal | number): number => {
    return toNumber(a) - toNumber(b)
  },

  multiply: (a: Decimal | number, b: Decimal | number): number => {
    return toNumber(a) * toNumber(b)
  },

  divide: (a: Decimal | number, b: Decimal | number): number => {
    const bNum = toNumber(b)
    if (bNum === 0) return 0
    return toNumber(a) / bNum
  },

  isGreaterThan: (a: Decimal | number, b: Decimal | number): boolean => {
    return toNumber(a) > toNumber(b)
  },

  isLessThan: (a: Decimal | number, b: Decimal | number): boolean => {
    return toNumber(a) < toNumber(b)
  },
}
