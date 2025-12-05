// Analytics Value Objects - Métricas e Tipos

export enum MetricType {
  REVENUE = 'REVENUE',
  INVOICE_COUNT = 'INVOICE_COUNT',
  CLIENT_COUNT = 'CLIENT_COUNT',
  TASK_COMPLETION_RATE = 'TASK_COMPLETION_RATE',
  MEETING_ATTENDANCE = 'MEETING_ATTENDANCE',
  CUSTOMER_SATISFACTION = 'CUSTOMER_SATISFACTION',
  PAYMENT_VELOCITY = 'PAYMENT_VELOCITY',
  CHURN_RATE = 'CHURN_RATE',
  CONVERSION_RATE = 'CONVERSION_RATE',
  AVERAGE_INVOICE_VALUE = 'AVERAGE_INVOICE_VALUE',
}

export enum TimeRangeType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
  CUSTOM = 'CUSTOM',
}

export enum ReportStatus {
  SCHEDULED = 'SCHEDULED',
  GENERATING = 'GENERATING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  ARCHIVED = 'ARCHIVED',
}

export function isValidMetricType(type: any): type is MetricType {
  return Object.values(MetricType).includes(type)
}

export function isValidTimeRangeType(type: any): type is TimeRangeType {
  return Object.values(TimeRangeType).includes(type)
}

export function isValidReportStatus(status: any): status is ReportStatus {
  return Object.values(ReportStatus).includes(status)
}

export interface IMetricValue {
  value: number
  unit: string
  trend: 'UP' | 'DOWN' | 'STABLE'
  trendPercentage: number
  lastUpdated: Date
}
