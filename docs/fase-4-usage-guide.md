# 📚 Guia de Uso - Fase 4 Endpoints

## Revenue Projection

### Exemplo 1: Projeção dos últimos 12 meses

```bash
curl -X GET "https://seu-app.com/api/reports/revenue-projection?months=12" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalConfirmedRevenue": 250000,
      "totalProjectedRevenue": 150000,
      "totalAtRiskRevenue": 35000,
      "grandTotal": 435000,
      "averageMonthlyRevenue": 36250,
      "projectionAccuracy": 95
    },
    "monthlyData": [
      {
        "month": "2024-01",
        "confirmedRevenue": 45000,
        "projectedRevenue": 15000,
        "atRiskRevenue": 2000,
        "totalProjected": 62000,
        "invoiceCount": 25,
        "paidCount": 20,
        "openCount": 4,
        "overdueCount": 1
      }
    ],
    "clientBreakdown": [
      {
        "clientId": "c-123",
        "clientName": "ACME Corp",
        "confirmedRevenue": 85000,
        "projectedRevenue": 40000,
        "atRiskRevenue": 8000,
        "totalProjected": 133000,
        "invoiceCount": 45
      }
    ],
    "topClients": {
      "byRevenue": [
        {
          "clientId": "c-123",
          "clientName": "ACME Corp",
          "totalProjected": 133000
        }
      ],
      "byInvoiceCount": [...],
      "byOverdueAmount": [...]
    },
    "metadata": {
      "generatedAt": "2024-12-05T09:15:00Z",
      "monthsAnalyzed": 12,
      "totalClientsAnalyzed": 45,
      "currency": "BRL"
    }
  },
  "meta": {
    "count": 540,
    "fromDate": "2023-12-05",
    "toDate": "2024-12-05"
  }
}
```

---

### Exemplo 2: Projeção com datas customizadas

```bash
curl -X GET "https://seu-app.com/api/reports/revenue-projection?fromDate=2024-10-01T00:00:00Z&toDate=2024-12-31T23:59:59Z" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Delinquency Analysis

### Exemplo 1: Clientes com qualquer atraso

```bash
curl -X GET "https://seu-app.com/api/reports/delinquency-analysis?minDaysOverdue=0&limit=50" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalClientsAnalyzed": 12,
      "activeClientsCount": 10,
      "inactiveClientsCount": 2,
      "delinquentClientsCount": 12,
      "totalOverdueAmount": 95000,
      "averageOverdueDays": 28,
      "delinquencyRate": 27
    },
    "byRiskLevel": {
      "critical": [
        {
          "clientId": "c-456",
          "clientName": "Problem Client Ltd",
          "clientEmail": "problem@example.com",
          "clientStatus": "ACTIVE",
          "overdueDays": 85,
          "overdueAmount": 45000,
          "invoiceCount": 8,
          "paidCount": 2,
          "pendingCount": 1,
          "overdueCount": 5,
          "paymentSuccessRate": 25,
          "lastPaymentDate": "2024-08-15T00:00:00Z",
          "oldestOverdueDate": "2024-09-10T00:00:00Z",
          "riskLevel": "CRITICAL"
        }
      ],
      "high": [
        {
          "clientId": "c-789",
          "clientName": "Slow Payer Inc",
          "overdueDays": 42,
          "overdueAmount": 28000,
          "paymentSuccessRate": 50,
          "riskLevel": "HIGH"
        }
      ],
      "medium": [...],
      "low": [...]
    },
    "topDelinquents": [
      {
        "clientId": "c-456",
        "clientName": "Problem Client Ltd",
        "overdueAmount": 45000,
        "overdueDays": 85,
        "riskLevel": "CRITICAL"
      }
    ],
    "trends": [
      {
        "month": "2024-10",
        "delinquentCount": 8,
        "overdueAmount": 72000,
        "trend": "worsening"
      },
      {
        "month": "2024-11",
        "delinquentCount": 10,
        "overdueAmount": 85000,
        "trend": "worsening"
      },
      {
        "month": "2024-12",
        "delinquentCount": 12,
        "overdueAmount": 95000,
        "trend": "worsening"
      }
    ],
    "metadata": {
      "generatedAt": "2024-12-05T09:15:00Z",
      "analysisDate": "2024-12-05",
      "currency": "BRL"
    }
  },
  "meta": {
    "count": 12,
    "minDaysOverdue": 0
  }
}
```

---

### Exemplo 2: Apenas clientes muito atrasados (60+ dias)

```bash
curl -X GET "https://seu-app.com/api/reports/delinquency-analysis?minDaysOverdue=60&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Retorna apenas clientes com 60+ dias de atraso (para foco em cobrança urgente).

---

## CSV Export

### Exemplo 1: Exportar invoices OPEN

```bash
curl -X GET "https://seu-app.com/api/invoices/export?status=OPEN&sortBy=dueDate&sortOrder=asc" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**

- Header: `Content-Type: text/csv; charset=utf-8`
- Header: `Content-Disposition: attachment; filename="invoices-2024-12-05.csv"`
- Body: CSV com invoices em OPEN status

---

### Exemplo 2: Exportar com filtros avançados

```bash
curl -X GET "https://seu-app.com/api/invoices/export?status=OVERDUE&dateFrom=2024-10-01&dateTo=2024-12-05&sortBy=dueDate&sortOrder=asc&limit=100" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Email Notifications

### Automáticas (sem ação necessária)

1. **Invoice Created**
   - Triggered: POST `/api/invoices`
   - Recipient: Cliente
   - Conteúdo: Número da fatura, data vencimento, valor

2. **Payment Confirmed**
   - Triggered: POST `/api/invoices/[id]/approve-payment`
   - Recipient: Cliente
   - Conteúdo: Confirmação de recebimento, valor, data

3. **Invoice Overdue Alert**
   - Triggered: Daily (9 AM UTC) via Cron
   - Recipient: Cliente
   - Frequency: A cada 7 dias (evita spam)

4. **Client Overdue Alert**
   - Triggered: Daily (9 AM UTC) via Cron
   - Recipient: Staff (support@...)
   - Condition: Cliente com 2+ faturas vencidas

---

## Filtros de Invoice

### Query Parameters

```
status         → DRAFT|OPEN|PAID|OVERDUE|CANCELLED
dateFrom       → ISO datetime (2024-10-01T00:00:00Z)
dateTo         → ISO datetime (2024-12-31T23:59:59Z)
amountMin      → Número (ex: 1000.50)
amountMax      → Número (ex: 5000.00)
search         → Texto livre (invoice #, client name)
clientStatus   → ACTIVE|INACTIVE|SUSPENDED
sortBy         → dueDate|amount|issueDate|status (default: dueDate)
sortOrder      → asc|desc (default: desc)
page           → Número (default: 1, 1-based)
limit          → Número (1-100, default: 20)
```

### Exemplos

```bash
# Invoices vencidas em range de valores
GET /api/invoices/export?status=OVERDUE&amountMin=5000&amountMax=50000

# Busca por cliente específico
GET /api/invoices/export?search=ACME&sortBy=dueDate&sortOrder=asc

# Última página de pendentes
GET /api/invoices/export?status=OPEN&page=10&limit=50
```

---

## Validações e Erros

### 401 Unauthorized

```json
{
  "success": false,
  "error": "Não autorizado",
  "code": "UNAUTHORIZED"
}
```

**Solução:** Enviar token válido no header Authorization

### 403 Forbidden

```json
{
  "success": false,
  "error": "Acesso negado",
  "code": "FORBIDDEN"
}
```

**Solução:** Apenas OWNER pode acessar /api/reports/\*

### 400 Validation Error

```json
{
  "success": false,
  "error": "Parâmetros inválidos",
  "code": "VALIDATION_ERROR",
  "details": {
    "field": "query_params"
  }
}
```

**Solução:** Revisar query parameters

---

## Exemplo Completo: Dashboard Backend

```typescript
// src/modules/dashboard/actions/getFinancialDashboard.ts

import { getSessionProfile } from '@/services/auth/session'

export async function getFinancialDashboard() {
  const profile = await getSessionProfile()
  if (!profile?.orgId) throw new Error('Unauthorized')

  // Obter projeção
  const projectionRes = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/reports/revenue-projection?months=12`,
    {
      headers: { Authorization: `Bearer ${getToken()}` },
    }
  )
  const { data: projection } = await projectionRes.json()

  // Obter delinquência
  const delinquencyRes = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/reports/delinquency-analysis`,
    {
      headers: { Authorization: `Bearer ${getToken()}` },
    }
  )
  const { data: delinquency } = await delinquencyRes.json()

  return {
    revenue: {
      confirmed: projection.summary.totalConfirmedRevenue,
      projected: projection.summary.totalProjectedRevenue,
      atRisk: projection.summary.totalAtRiskRevenue,
      average: projection.summary.averageMonthlyRevenue,
    },
    delinquency: {
      totalClients: delinquency.summary.totalClientsAnalyzed,
      criticalCount: delinquency.byRiskLevel.critical.length,
      totalAmount: delinquency.summary.totalOverdueAmount,
      trend: delinquency.trends[delinquency.trends.length - 1]?.trend,
    },
    charts: {
      monthlyRevenue: projection.monthlyData,
      delinquencyTrends: delinquency.trends,
      topClients: projection.topClients.byRevenue,
    },
  }
}
```

---

## Rate Limiting

- Todos endpoints: 100 requisições/minuto por user
- Cron jobs: 1 requisição/dia (Vercel)
- CSV export: 10 requisições/minuto

---

## Documentação Adicional

- Tasks Details: `docs/fase-4-task-*.md`
- API Reference: `docs/AUDITORIA_COMPLETA_2024.md`
- Schema Prisma: `prisma/schema.prisma`

---

**Happy Hacking! 🚀**
