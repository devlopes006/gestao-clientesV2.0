import { render } from '@testing-library/react'
import { useEffect } from 'react'
import { describe, expect, it } from 'vitest'
import { useClientKPI } from '../../src/hooks/useClientKPI'

const dashMock = {
  counts: {
    tasks: { total: 10, done: 7 },
    media: 5,
    strategies: 2,
    brandings: 3,
  },
}

describe('useClientKPI', () => {
  it('retorna KPIs corretos', () => {
    let result: ReturnType<typeof useClientKPI> | undefined
    function TestComponent() {
      const kpi = useClientKPI(dashMock)
      useEffect(() => {
        result = kpi
      }, [kpi])
      return null
    }
    render(<TestComponent />)
    expect(result).toBeDefined()
    expect(result!.activeTasks).toBe(3)
    expect(result!.completedTasks).toBe(7)
    expect(result!.media).toBe(5)
    expect(result!.strategies).toBe(2)
    expect(result!.brandings).toBe(3)
    expect(result!.strategiesDescription).toContain('2 planos ativos')
  })

  it('retorna descrição correta para zero estratégias', () => {
    const dashZero = {
      ...dashMock,
      counts: { ...dashMock.counts, strategies: 0 },
    }
    let result: ReturnType<typeof useClientKPI> | undefined
    function TestComponent() {
      const kpi = useClientKPI(dashZero)
      useEffect(() => {
        result = kpi
      }, [kpi])
      return null
    }
    render(<TestComponent />)
    expect(result).toBeDefined()
    expect(result!.strategiesDescription).toBe('Nenhuma estratégia cadastrada')
  })
})
