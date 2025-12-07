import { AnalyticsMetric } from '@/core/domain/analytics/entities/analytics-metric.entity'
import {
  MetricType,
  TimeRangeType,
} from '@/core/domain/analytics/value-objects/analytics-metric.vo'
import { beforeEach, describe, expect, it } from 'vitest'

describe('AnalyticsMetric Entity', () => {
  describe('criar', () => {
    it('Deve criar métrica com sucesso', () => {
      const metric = AnalyticsMetric.create({
        orgId: 'org-1',
        name: 'Revenue Total',
        metricType: MetricType.REVENUE,
        value: 10000,
        unit: 'BRL',
        trend: 'UP',
        trendPercentage: 15.5,
        timeRange: TimeRangeType.MONTHLY,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        source: 'sales_system',
        createdBy: 'admin',
        updatedBy: 'admin',
      })

      expect(metric).toBeDefined()
      expect(metric.name).toBe('Revenue Total')
      expect(metric.value).toBe(10000)
      expect(metric.metricType).toBe(MetricType.REVENUE)
      expect(metric.orgId).toBe('org-1')
    })

    it('Deve lançar erro se nome vazio', () => {
      expect(() => {
        AnalyticsMetric.create({
          orgId: 'org-1',
          name: '',
          metricType: MetricType.REVENUE,
          value: 10000,
          unit: 'BRL',
          trend: 'UP',
          trendPercentage: 0,
          timeRange: TimeRangeType.MONTHLY,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
          source: 'sales_system',
          createdBy: 'admin',
          updatedBy: 'admin',
        })
      }).toThrow('Nome da métrica é obrigatório')
    })

    it('Deve lançar erro se tipo de métrica inválido', () => {
      expect(() => {
        AnalyticsMetric.create({
          orgId: 'org-1',
          name: 'Revenue',
          metricType: 'INVALID_TYPE' as MetricType,
          value: 10000,
          unit: 'BRL',
          trend: 'UP',
          trendPercentage: 0,
          timeRange: TimeRangeType.MONTHLY,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
          source: 'sales_system',
          createdBy: 'admin',
          updatedBy: 'admin',
        })
      }).toThrow('Tipo de métrica inválido')
    })

    it('Deve lançar erro se valor negativo', () => {
      expect(() => {
        AnalyticsMetric.create({
          orgId: 'org-1',
          name: 'Revenue',
          metricType: MetricType.REVENUE,
          value: -100,
          unit: 'BRL',
          trend: 'DOWN',
          trendPercentage: 0,
          timeRange: TimeRangeType.MONTHLY,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
          source: 'sales_system',
          createdBy: 'admin',
          updatedBy: 'admin',
        })
      }).toThrow('Valor da métrica não pode ser negativo')
    })

    it('Deve lançar erro se data fim < data início', () => {
      expect(() => {
        AnalyticsMetric.create({
          orgId: 'org-1',
          name: 'Revenue',
          metricType: MetricType.REVENUE,
          value: 10000,
          unit: 'BRL',
          trend: 'UP',
          trendPercentage: 0,
          timeRange: TimeRangeType.MONTHLY,
          startDate: new Date('2024-01-31'),
          endDate: new Date('2024-01-01'),
          source: 'sales_system',
          createdBy: 'admin',
          updatedBy: 'admin',
        })
      }).toThrow('Data final não pode ser anterior à data inicial')
    })
  })

  describe('workflow de métricas', () => {
    let metric: AnalyticsMetric

    beforeEach(() => {
      metric = AnalyticsMetric.create({
        orgId: 'org-1',
        name: 'Revenue Total',
        metricType: MetricType.REVENUE,
        value: 10000,
        unit: 'BRL',
        trend: 'UP',
        trendPercentage: 0,
        timeRange: TimeRangeType.MONTHLY,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        source: 'sales_system',
        createdBy: 'admin',
        updatedBy: 'admin',
      })
    })

    it('Deve atualizar valor e calcular tendência UP', () => {
      metric.updateValue(12000, 10000, 'admin')

      expect(metric.value).toBe(12000)
      expect(metric.trend).toBe('UP')
      expect(metric.trendPercentage).toBeCloseTo(20, 1)
      expect(metric.previousValue).toBe(10000)
    })

    it('Deve atualizar valor e calcular tendência DOWN', () => {
      metric.updateValue(8000, 10000, 'admin')

      expect(metric.value).toBe(8000)
      expect(metric.trend).toBe('DOWN')
      expect(metric.trendPercentage).toBeCloseTo(-20, 1)
    })

    it('Deve atualizar valor e manter tendência STABLE', () => {
      metric.updateValue(10000, 10000, 'admin')

      expect(metric.value).toBe(10000)
      expect(metric.trend).toBe('STABLE')
      expect(metric.trendPercentage).toBe(0)
    })

    it('Deve lançar erro se novo valor negativo', () => {
      expect(() => {
        metric.updateValue(-100, 10000, 'admin')
      }).toThrow('Novo valor não pode ser negativo')
    })

    it('Deve calcular percentual de tendência com valor anterior zero', () => {
      metric.updateValue(100, 0, 'admin')

      expect(metric.value).toBe(100)
      expect(metric.trend).toBe('UP')
      expect(metric.trendPercentage).toBe(0)
    })
  })

  describe('gerenciamento de tags', () => {
    let metric: AnalyticsMetric

    beforeEach(() => {
      metric = AnalyticsMetric.create({
        orgId: 'org-1',
        name: 'Revenue Total',
        metricType: MetricType.REVENUE,
        value: 10000,
        unit: 'BRL',
        trend: 'UP',
        trendPercentage: 0,
        timeRange: TimeRangeType.MONTHLY,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        source: 'sales_system',
        tags: ['important'],
        createdBy: 'admin',
        updatedBy: 'admin',
      })
    })

    it('Deve adicionar tag com sucesso', () => {
      metric.addTag('critical')

      expect(metric.tags).toContain('critical')
      expect(metric.tags.length).toBe(2)
    })

    it('Deve lançar erro ao adicionar tag duplicada', () => {
      expect(() => {
        metric.addTag('important')
      }).toThrow('Tag duplicada')
    })

    it('Deve remover tag com sucesso', () => {
      metric.removeTag('important')

      expect(metric.tags).not.toContain('important')
      expect(metric.tags.length).toBe(0)
    })

    it('Deve lançar erro ao remover tag inexistente', () => {
      expect(() => {
        metric.removeTag('non-existent')
      }).toThrow('Tag não encontrada')
    })

    it('Deve lançar erro ao adicionar tag vazia', () => {
      expect(() => {
        metric.addTag('')
      }).toThrow('Tag não pode ser vazia')
    })
  })

  describe('utilitários e cálculos', () => {
    let metric: AnalyticsMetric

    beforeEach(() => {
      metric = AnalyticsMetric.create({
        orgId: 'org-1',
        name: 'Revenue Total',
        metricType: MetricType.REVENUE,
        value: 10000,
        unit: 'BRL',
        trend: 'UP',
        trendPercentage: 15.5,
        timeRange: TimeRangeType.MONTHLY,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        source: 'sales_system',
        createdBy: 'admin',
        updatedBy: 'admin',
      })
    })

    it('Deve calcular percentual de comparação corretamente', () => {
      const comparison = metric.calculateComparisonPercentage(8000)

      expect(comparison).toBeCloseTo(25, 1)
    })

    it('Deve retornar 0 ao comparar dois zeros', () => {
      metric = AnalyticsMetric.create({
        orgId: 'org-1',
        name: 'Revenue Total',
        metricType: MetricType.REVENUE,
        value: 0,
        unit: 'BRL',
        trend: 'STABLE',
        trendPercentage: 0,
        timeRange: TimeRangeType.MONTHLY,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        source: 'sales_system',
        createdBy: 'admin',
        updatedBy: 'admin',
      })

      const comparison = metric.calculateComparisonPercentage(0)

      expect(comparison).toBe(0)
    })

    it('Deve verificar se data está no intervalo', () => {
      const dateInRange = new Date('2024-01-15')
      const dateOutOfRange = new Date('2024-02-01')

      expect(metric.isInDateRange(dateInRange)).toBe(true)
      expect(metric.isInDateRange(dateOutOfRange)).toBe(false)
    })

    it('Deve verificar se data está nos limites do intervalo', () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      expect(metric.isInDateRange(startDate)).toBe(true)
      expect(metric.isInDateRange(endDate)).toBe(true)
    })

    it('Deve retornar 100 se comparar valor > 0 com outro valor 0', () => {
      const comparison = metric.calculateComparisonPercentage(0)

      expect(comparison).toBe(100)
    })
  })

  describe('descrição e metadados', () => {
    let metric: AnalyticsMetric

    beforeEach(() => {
      metric = AnalyticsMetric.create({
        orgId: 'org-1',
        name: 'Revenue Total',
        metricType: MetricType.REVENUE,
        value: 10000,
        unit: 'BRL',
        trend: 'UP',
        trendPercentage: 0,
        timeRange: TimeRangeType.MONTHLY,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        source: 'sales_system',
        createdBy: 'admin',
        updatedBy: 'admin',
      })
    })

    it('Deve atualizar descrição com sucesso', () => {
      const newDescription = 'Nova descrição da métrica'
      metric.updateDescription(newDescription, 'admin')

      expect(metric.description).toBe(newDescription)
    })

    it('Deve limpar descrição se passado undefined', () => {
      metric.updateDescription('Initial description', 'admin')
      metric.updateDescription(undefined, 'admin')

      expect(metric.description).toBeUndefined()
    })

    it('Deve manter dados de auditoria ao criar', () => {
      expect(metric.createdBy).toBe('admin')
      expect(metric.updatedBy).toBe('admin')
      expect(metric.createdAt).toBeDefined()
      expect(metric.updatedAt).toBeDefined()
    })

    it('Deve atualizar timestamp ao modificar', () => {
      const originalUpdatedAt = metric.updatedAt

      // Aguarda um pouco para garantir que o tempo avançou
      const newUpdatedAt = new Date(Date.now() + 100)
      metric.updateDescription('Descrição modificada', 'user2')

      expect(metric.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      )
      expect(metric.updatedBy).toBe('user2')
    })
  })

  describe('restore de métrica', () => {
    it('Deve restaurar métrica de dados persistidos', () => {
      const data = {
        id: 'metric-1',
        orgId: 'org-1',
        name: 'Revenue Total',
        metricType: MetricType.REVENUE as MetricType,
        value: 10000,
        unit: 'BRL',
        trend: 'UP' as const,
        trendPercentage: 15.5,
        previousValue: 8500,
        timeRange: TimeRangeType.MONTHLY as TimeRangeType,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        source: 'sales_system',
        tags: ['important'],
        description: 'Receita total do mês',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-15'),
        createdBy: 'admin',
        updatedBy: 'admin',
      }

      const metric = AnalyticsMetric.restore(data)

      expect(metric.id).toBe('metric-1')
      expect(metric.name).toBe('Revenue Total')
      expect(metric.value).toBe(10000)
      expect(metric.previousValue).toBe(8500)
      expect(metric.tags).toContain('important')
    })
  })

  describe('validações de período', () => {
    it('Deve suportar todos os tipos de períodos', () => {
      const periods = [
        TimeRangeType.DAILY,
        TimeRangeType.WEEKLY,
        TimeRangeType.MONTHLY,
        TimeRangeType.QUARTERLY,
        TimeRangeType.YEARLY,
        TimeRangeType.CUSTOM,
      ]

      periods.forEach((period) => {
        const metric = AnalyticsMetric.create({
          orgId: 'org-1',
          name: 'Test Metric',
          metricType: MetricType.REVENUE,
          value: 1000,
          unit: 'BRL',
          trend: 'STABLE',
          trendPercentage: 0,
          timeRange: period,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
          source: 'test',
          createdBy: 'admin',
          updatedBy: 'admin',
        })

        expect(metric.timeRange).toBe(period)
      })
    })

    it('Deve suportar todos os tipos de métricas', () => {
      const metricTypes = [
        MetricType.REVENUE,
        MetricType.INVOICE_COUNT,
        MetricType.CLIENT_COUNT,
        MetricType.TASK_COMPLETION_RATE,
        MetricType.MEETING_ATTENDANCE,
        MetricType.CUSTOMER_SATISFACTION,
        MetricType.PAYMENT_VELOCITY,
        MetricType.CHURN_RATE,
        MetricType.CONVERSION_RATE,
        MetricType.AVERAGE_INVOICE_VALUE,
      ]

      metricTypes.forEach((type) => {
        const metric = AnalyticsMetric.create({
          orgId: 'org-1',
          name: `Test ${type}`,
          metricType: type,
          value: 100,
          unit: '%',
          trend: 'STABLE',
          trendPercentage: 0,
          timeRange: TimeRangeType.MONTHLY,
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
          source: 'test',
          createdBy: 'admin',
          updatedBy: 'admin',
        })

        expect(metric.metricType).toBe(type)
      })
    })
  })
})
