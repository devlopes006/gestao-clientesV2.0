import {
  formatDateInput,
  parseDateInput,
  parseISOToLocal,
  toLocalISOString,
} from '@/lib/utils'
import { describe, expect, it } from 'vitest'

describe('utils date helpers', () => {
  it('parseDateInput parses YYYY-MM-DD correctly', () => {
    const d = parseDateInput('2024-12-05')
    expect(d.getFullYear()).toBe(2024)
    expect(d.getMonth()).toBe(11)
    expect(d.getDate()).toBe(5)
  })

  it('formatDateInput formats Date to YYYY-MM-DD', () => {
    const d = new Date(2024, 0, 9) // Jan is 0
    expect(formatDateInput(d)).toBe('2024-01-09')
  })

  it('toLocalISOString preserves local components', () => {
    const d = new Date(2024, 6, 1, 12, 34, 56, 789)
    const s = toLocalISOString(d)
    expect(s).toMatch(/^2024-07-01T12:34:56.789Z$/)
  })

  it('parseISOToLocal parses date-only strings as local date', () => {
    const d = parseISOToLocal('2024-02-01')
    expect(d.getFullYear()).toBe(2024)
    expect(d.getMonth()).toBe(1)
    expect(d.getDate()).toBe(1)
  })
})
