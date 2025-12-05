import { PrismaAnalyticsMetricRepository } from '@/infrastructure/database/repositories/prisma-analytics-metric.repository'
import { AnalyticsMetricController } from '@/infrastructure/http/controllers/analytics-metric.controller'
import { NextRequest, NextResponse } from 'next/server'

const repository = new PrismaAnalyticsMetricRepository()
const controller = new AnalyticsMetricController(repository)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const orgId = searchParams.get('orgId')
    const page = searchParams.get('page')
      ? parseInt(searchParams.get('page')!)
      : 1
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!)
      : 10
    const metricType = searchParams.get('metricType') || undefined
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined
    const source = searchParams.get('source') || undefined

    if (!orgId) {
      return NextResponse.json(
        { error: 'orgId é obrigatório' },
        { status: 400 }
      )
    }

    const result = await controller.list({
      orgId,
      page,
      limit,
      metricType,
      startDate,
      endDate,
      source,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('Erro ao listar métricas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.orgId || !body.name || !body.metricType) {
      return NextResponse.json(
        { error: 'orgId, name e metricType são obrigatórios' },
        { status: 400 }
      )
    }

    const result = await controller.create({
      orgId: body.orgId,
      name: body.name,
      metricType: body.metricType,
      value: body.value || 0,
      unit: body.unit || '',
      trend: body.trend || 'STABLE',
      trendPercentage: body.trendPercentage || 0,
      timeRange: body.timeRange || 'MONTHLY',
      startDate: body.startDate || new Date().toISOString(),
      endDate: body.endDate || new Date().toISOString(),
      source: body.source || 'manual',
      tags: body.tags,
      description: body.description,
      createdBy: body.createdBy || 'system',
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar métrica:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
