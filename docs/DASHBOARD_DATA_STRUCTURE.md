# 📦 Estrutura de Dados - Dashboard V2

## 🔍 Formato DashboardData Esperado

O dashboard V2 espera receber dados no formato `DashboardData` da ação `getDashboardData()`. Esta documentação detalha a estrutura completa.

---

## 📋 Tipo Completo

```typescript
interface DashboardData {
  clients: ClientSummary[]
  tasks: Task[]
  metrics: Metrics
  clientsHealth: ClientHealth[]
  activities: Activity[]
  financialData: FinancialPoint[]
  notes: Note[]
  events: Event[]
}
```

---

## 🧩 Estruturas Individuais

### 1. `ClientSummary`

Informações básicas de clientes ativos.

```typescript
interface ClientSummary {
  id: string
  name: string
  email: string
  createdAt: Date | string
}
```

**Exemplo:**

```json
{
  "id": "client_123",
  "name": "Acme Corp",
  "email": "contact@acme.com",
  "createdAt": "2024-01-10T10:30:00Z"
}
```

**Utilização no Dashboard:**

- ✅ Contagem de clientes (header KPI)
- ✅ Nome do cliente em cards de saúde
- ✅ Dropdown de filtros

---

### 2. `Task`

Tarefas individuais com prioridade e status.

```typescript
interface Task {
  id: string
  title: string
  description?: string
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'CANCELLED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  dueDate?: Date | string
  assigneeId?: string
  clientId?: string
  client?: {
    id: string
    name: string
  }
  createdAt: Date | string
  updatedAt: Date | string
}
```

**Exemplo:**

```json
{
  "id": "task_456",
  "title": "Implementar novo módulo de pagamento",
  "description": "Adicionar suporte a PIX",
  "status": "IN_PROGRESS",
  "priority": "URGENT",
  "dueDate": "2025-01-25T23:59:00Z",
  "clientId": "client_123",
  "client": {
    "id": "client_123",
    "name": "Acme Corp"
  },
  "createdAt": "2025-01-10T10:00:00Z",
  "updatedAt": "2025-01-24T15:30:00Z"
}
```

**Utilização:**

- ✅ Contagem total de tarefas (header)
- ✅ Tarefas urgentes (seção esquerda)
- ✅ Gráfico de status (BarChart)
- ✅ Taxa de conclusão (percentual)
- ✅ Tarefas em atraso

**Status Distribution:**

```
TODO          → Não iniciadas (cinza)
IN_PROGRESS   → Em andamento (azul)
REVIEW        → Em revisão (amarelo)
DONE          → Concluídas (verde)
CANCELLED     → Canceladas (cinza escuro)
```

**Prioridades:**

```
LOW           → Baixa (verde)
MEDIUM        → Média (roxo)
HIGH          → Alta (laranja)
URGENT        → Urgente (vermelho)
```

---

### 3. `Metrics`

Métricas agregadas e insights.

```typescript
interface Metrics {
  totals: {
    clients: number
    tasks: number
    tasksCompleted: number
    tasksPending: number
    tasksOverdue: number
  }
  mostPendingClient?: {
    clientId: string
    clientName: string
    pendingCount: number
  }
  mostUrgentClient?: {
    clientId: string
    clientName: string
    urgentCount: number
  }
  urgentTasks: Array<{
    taskId: string
    title: string
    clientName: string
    urgencyScore: number
  }>
  taskAggByClient: Record<string, number>
}
```

**Exemplo:**

```json
{
  "totals": {
    "clients": 24,
    "tasks": 156,
    "tasksCompleted": 98,
    "tasksPending": 45,
    "tasksOverdue": 13
  },
  "mostPendingClient": {
    "clientId": "client_789",
    "clientName": "TechStart Inc",
    "pendingCount": 8
  },
  "mostUrgentClient": {
    "clientId": "client_456",
    "clientName": "Beta Solutions",
    "urgentCount": 5
  },
  "urgentTasks": [
    {
      "taskId": "task_001",
      "title": "Critical bug fix",
      "clientName": "Acme Corp",
      "urgencyScore": 95
    }
  ],
  "taskAggByClient": {
    "client_123": 12,
    "client_456": 8,
    "client_789": 15
  }
}
```

**Utilização:**

- ✅ Cálculos derivados dos KPIs
- ✅ Detecção de clientes problemáticos
- ✅ Ranking de urgência

---

### 4. `ClientHealth`

Saúde/performance de cada cliente.

```typescript
interface ClientHealth {
  clientId: string
  clientName: string
  completionRate: number // 0-100
  tasksTotal: number
  tasksCompleted: number
  tasksPending: number
  tasksOverdue: number
  balance?: number
  daysActive?: number
  lastActivityDate?: Date | string
}
```

**Exemplo:**

```json
{
  "clientId": "client_123",
  "clientName": "Acme Corp",
  "completionRate": 85,
  "tasksTotal": 12,
  "tasksCompleted": 10,
  "tasksPending": 2,
  "tasksOverdue": 0,
  "balance": 15000.0,
  "daysActive": 180,
  "lastActivityDate": "2025-01-24T18:00:00Z"
}
```

**Utilização:**

- ✅ Cards de saúde individual (grid)
- ✅ Barra de progresso (completion rate)
- ✅ Cor de saúde (verde/amarelo/laranja/vermelho)

**Fórmula de Cor:**

```
completionRate >= 80%  → Verde (Ótimo)
completionRate >= 60%  → Amarelo (Bom)
completionRate >= 40%  → Laranja (Médio)
completionRate < 40%   → Vermelho (Baixo)
```

---

### 5. `Activity`

Log de atividades recentes.

```typescript
interface Activity {
  id: string
  type: 'meeting' | 'task' | 'event' | 'note' | 'call'
  title: string
  description?: string
  clientId?: string
  clientName?: string
  date: Date | string
  userId?: string
  metadata?: Record<string, any>
}
```

**Exemplo:**

```json
{
  "id": "act_001",
  "type": "meeting",
  "title": "Reunião de planejamento Q1",
  "description": "Discutir roadmap do projeto",
  "clientId": "client_123",
  "clientName": "Acme Corp",
  "date": "2025-01-24T14:00:00Z",
  "userId": "user_456",
  "metadata": {
    "duration": 60,
    "attendees": 3
  }
}
```

**Tipos de Atividade:**

```
meeting → Azul (#3b82f6)
task    → Roxo (#a855f7)
event   → Verde (#10b981)
note    → Cyan (#06b6d4)
call    → Laranja (#f97316)
```

**Utilização:**

- ✅ Timeline visual (esquerda)
- ✅ 5 últimas atividades mostradas
- ✅ Ordenação por data decrescente

---

### 6. `FinancialPoint`

Dados financeiros por período.

```typescript
interface FinancialPoint {
  month: string // "2025-01", "2025-02", etc
  receitas: number
  despesas: number
  saldo: number
  lucro?: number
}
```

**Exemplo:**

```json
[
  {
    "month": "2024-11",
    "receitas": 45000.0,
    "despesas": 28000.0,
    "saldo": 17000.0,
    "lucro": 17000.0
  },
  {
    "month": "2024-12",
    "receitas": 52000.0,
    "despesas": 31000.0,
    "saldo": 21000.0,
    "lucro": 21000.0
  },
  {
    "month": "2025-01",
    "receitas": 48500.0,
    "despesas": 29500.0,
    "saldo": 19000.0,
    "lucro": 19000.0
  }
]
```

**Utilização:**

- ✅ Gráfico de Receitas vs Despesas (AreaChart)
- ✅ Últimos 6-12 meses
- ✅ Cálculo de tendências

**Formatação de Mês:**

- ✅ ISO: "2025-01"
- ✅ Exibição: "JAN", "FEV", "MAR", etc (primeiro 3 caracteres)

---

### 7. `Note`

Notas/anotações rápidas.

```typescript
interface Note {
  id: string
  title: string
  content: string
  color?: string
  clientId?: string
  clientName?: string
  createdAt: Date | string
  updatedAt: Date | string
  isPinned?: boolean
}
```

**Exemplo:**

```json
{
  "id": "note_123",
  "title": "Lembrete: Reunião agendada",
  "content": "Confirmar presença com Acme Corp",
  "color": "yellow",
  "clientId": "client_123",
  "clientName": "Acme Corp",
  "createdAt": "2025-01-24T10:00:00Z",
  "updatedAt": "2025-01-24T10:00:00Z",
  "isPinned": true
}
```

**Cores Suportadas:**

```
yellow, blue, pink, green, purple, orange
```

**Utilização:**

- ✅ Componente DashboardNotes (futuro)
- ✅ Filtro por cor
- ✅ Drag-drop reordering

---

### 8. `Event`

Eventos de calendário.

```typescript
interface Event {
  id: string
  title: string
  description?: string
  startDate: Date | string
  endDate?: Date | string
  type: 'meeting' | 'deadline' | 'reminder' | 'other'
  clientId?: string
  clientName?: string
  isAllDay?: boolean
  location?: string
  attendees?: string[]
  reminder?: '15min' | '1hour' | '1day'
}
```

**Exemplo:**

```json
{
  "id": "event_789",
  "title": "Apresentação final do projeto",
  "description": "Apresentar resultados para stakeholders",
  "startDate": "2025-02-15T10:00:00Z",
  "endDate": "2025-02-15T11:30:00Z",
  "type": "meeting",
  "clientId": "client_123",
  "clientName": "Acme Corp",
  "isAllDay": false,
  "location": "Sala de conferência",
  "attendees": ["user_1@acme.com", "user_2@acme.com"],
  "reminder": "1day"
}
```

**Tipos de Evento:**

```
meeting  → Reunião
deadline → Prazo importante
reminder → Lembrete
other    → Outro evento
```

**Utilização:**

- ✅ MonthlyCalendar component (futuro)
- ✅ Filtro por tipo
- ✅ Timeline visual

---

## 🔄 Fluxo de Dados

```
Page (server)
    ↓
getDashboardData() [Server Action]
    ↓
Prisma/Firestore Query
    ↓
DashboardData Object
    ↓
DashboardV2ClientNew (client)
    ↓
useMemo Calculations
    ↓
Render Components
```

---

## 📊 Cálculos Realizados no Dashboard

O dashboard calcula automaticamente:

| Cálculo             | Fórmula                         | Localização   |
| ------------------- | ------------------------------- | ------------- |
| Taxa Conclusão      | (tasksCompleted / tasks) \* 100 | KPI Header    |
| Saúde Cliente       | completionRate %                | Health Grid   |
| Urgência Score      | priority + due date             | Urgent Tasks  |
| Receita por Cliente | totalRevenue / clients          | Potencial KPI |
| Task Distribution   | count by status                 | BarChart      |

---

## ✅ Validação

Antes de usar o dashboard, valide os dados:

```typescript
// Verificar estrutura em getDashboardData()
import { DashboardDataSchema } from '@/modules/dashboard/domain/schema'

const validData = DashboardDataSchema.parse(data)
// Se error, os dados têm problemas na estrutura
```

---

## 🚨 Dados Obrigatórios vs Opcionais

| Campo         | Obrigatório | Fallback         |
| ------------- | ----------- | ---------------- |
| clients       | ❌          | [] (array vazio) |
| tasks         | ❌          | []               |
| metrics       | ❌          | {}               |
| clientsHealth | ❌          | []               |
| activities    | ❌          | []               |
| financialData | ❌          | []               |
| notes         | ❌          | []               |
| events        | ❌          | []               |

**Nota**: Todos podem ser vazios. O dashboard renderiza com graceful degradation.

---

## 🔧 Debug de Dados

Para debugar dados no console do navegador:

```javascript
// No browser console:
const data = window.__NEXT_DATA__?.props?.pageProps?.initialData
console.log(data)
console.table(data.tasks)
console.table(data.financialData)
```

---

## 📈 Exemplos de Respostas Completas

### Resposta Mínima (sem dados)

```json
{
  "clients": [],
  "tasks": [],
  "metrics": {},
  "clientsHealth": [],
  "activities": [],
  "financialData": [],
  "notes": [],
  "events": []
}
```

### Resposta Típica (com dados)

```json
{
  "clients": [
    {
      "id": "c1",
      "name": "Client A",
      "email": "a@test.com",
      "createdAt": "2025-01-01"
    },
    {
      "id": "c2",
      "name": "Client B",
      "email": "b@test.com",
      "createdAt": "2025-01-05"
    }
  ],
  "tasks": [
    {
      "id": "t1",
      "title": "Task 1",
      "status": "DONE",
      "priority": "HIGH",
      "dueDate": "2025-01-30"
    },
    {
      "id": "t2",
      "title": "Task 2",
      "status": "IN_PROGRESS",
      "priority": "URGENT",
      "dueDate": "2025-01-25"
    }
  ],
  "metrics": {
    "totals": {
      "clients": 2,
      "tasks": 2,
      "tasksCompleted": 1,
      "tasksPending": 1,
      "tasksOverdue": 0
    }
  },
  "clientsHealth": [
    {
      "clientId": "c1",
      "clientName": "Client A",
      "completionRate": 85,
      "tasksTotal": 1,
      "tasksCompleted": 1,
      "tasksPending": 0,
      "tasksOverdue": 0
    }
  ],
  "activities": [
    {
      "id": "a1",
      "type": "task",
      "title": "Task completed",
      "date": "2025-01-24",
      "clientName": "Client A"
    }
  ],
  "financialData": [
    { "month": "2025-01", "receitas": 50000, "despesas": 30000, "saldo": 20000 }
  ],
  "notes": [],
  "events": []
}
```

---

**Última Atualização**: 24 de Janeiro de 2025  
**Versão**: 2.0.0  
**Status**: ✅ Documentação Completa
