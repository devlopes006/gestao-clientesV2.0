# Guia de Integração - Componentes de Cliente

## Componentes Disponíveis

### 1. **ClientPageLayout**

Wrapper que envolve toda a página com gradiente de fundo e espaçamento consistente.

```tsx
import { ClientPageLayout } from '@/components/clients'

export default function MyPage() {
  return <ClientPageLayout>{/* Seu conteúdo aqui */}</ClientPageLayout>
}
```

### 2. **ClientCardHeader**

Cabeçalho com nome do cliente, status, navegação e ações.

```tsx
import { ClientCardHeader } from '@/components/clients'

;<ClientCardHeader
  clientName='Acme Corp'
  status='active'
  subtitle='Empresa de Tecnologia'
  onPrevious={() => goToPrevious()}
  onNext={() => goToNext()}
  hasPrevious={true}
  hasNext={true}
  actions={<YourActionsHere />}
/>
```

**Props:**

- `clientName`: string
- `status`: 'active' | 'inactive' | 'pending' | 'archived'
- `subtitle?`: string
- `onPrevious?`: () => void
- `onNext?`: () => void
- `hasPrevious?`: boolean
- `hasNext?`: boolean
- `actions?`: React.ReactNode

### 3. **ClientNavigationTabs**

Abas de navegação entre seções (Info, Tarefas, Mídia, etc.)

```tsx
import { ClientNavigationTabs } from '@/components/clients'
import {
  Info,
  CheckSquare,
  Image,
  Tv,
  Calendar,
  DollarSign,
} from 'lucide-react'

const tabs = [
  { id: 'info', label: 'Informações', icon: Info },
  { id: 'tasks', label: 'Tarefas', icon: CheckSquare },
  { id: 'media', label: 'Mídia', icon: Image },
  { id: 'meetings', label: 'Reuniões', icon: Calendar },
  { id: 'finance', label: 'Finanças', icon: DollarSign },
]

;<ClientNavigationTabs
  tabs={tabs}
  activeTab={activeTab}
  onTabChange={setActiveTab}
/>
```

### 4. **ClientKPICard**

Card para exibir KPIs (métricas-chave) com 9 cores disponíveis.

```tsx
import { ClientKPICard } from '@/components/clients'
import { CheckCircle2 } from 'lucide-react'

;<ClientKPICard
  icon={CheckCircle2}
  label='Taxa de Conclusão'
  value='85%'
  color='green'
  trend='up'
  trendValue='+5%'
/>
```

**Props:**

- `icon`: LucideIcon (obrigatório)
- `label`: string (obrigatório)
- `value`: string | number (obrigatório)
- `color?`: 'blue' | 'emerald' | 'purple' | 'orange' | 'amber' | 'red' | 'green' | 'cyan' | 'indigo'
- `trend?`: 'up' | 'down' | 'neutral'
- `trendValue?`: string

### 5. **ClientSectionCard**

Card genérico para seções de conteúdo com ícone e ações.

```tsx
import { ClientSectionCard } from '@/components/clients'
import { Users } from 'lucide-react'

;<ClientSectionCard
  title='Membros da Equipe'
  icon={Users}
  action={<AddButton />}
>
  {/* Conteúdo da seção */}
</ClientSectionCard>
```

**Props:**

- `title`: string (obrigatório)
- `icon?`: LucideIcon
- `children`: React.ReactNode (obrigatório)
- `action?`: React.ReactNode
- `className?`: string

### 6. **TaskItem**

Item para exibir tarefas em listas.

```tsx
import { TaskItem } from '@/components/clients'

;<TaskItem
  id='task-1'
  title='Implementar Dashboard'
  description='Criar dashboard com KPIs'
  status='pending'
  dueDate='2025-12-15'
  assignee='João Silva'
  priority='high'
  onClick={() => openTask('task-1')}
/>
```

**Props:**

- `id`: string (obrigatório)
- `title`: string (obrigatório)
- `description?`: string
- `status`: 'completed' | 'pending' | 'overdue' (obrigatório)
- `dueDate?`: string
- `assignee?`: string
- `priority?`: 'high' | 'medium' | 'low'
- `onClick?`: () => void

### 7. **MeetingItem**

Item para exibir reuniões em listas.

```tsx
import { MeetingItem } from '@/components/clients'

;<MeetingItem
  id='meeting-1'
  title='Reunião Semanal'
  date='15/12/2025'
  time='14:00'
  duration='1h'
  attendees={['João', 'Maria']}
  location='Sala de Conferência A'
  type='in-person'
  status='scheduled'
  onClick={() => openMeeting('meeting-1')}
/>
```

**Props:**

- `id`: string (obrigatório)
- `title`: string (obrigatório)
- `date`: string (obrigatório)
- `time`: string (obrigatório)
- `duration?`: string
- `attendees?`: string[]
- `location?`: string
- `type?`: 'in-person' | 'video' | 'call'
- `status?`: 'scheduled' | 'completed' | 'cancelled'
- `onClick?`: () => void

### 8. **FinanceCard**

Card para exibir dados financeiros.

```tsx
import { FinanceCard } from '@/components/clients'

;<FinanceCard
  type='income'
  label='Receita Mensal'
  amount='12500'
  currency='R$'
  trend='up'
  trendValue='+10%'
  period='Novembro 2025'
/>
```

**Props:**

- `type`: 'income' | 'expense' | 'balance' | 'forecast' (obrigatório)
- `label`: string (obrigatório)
- `amount`: string | number (obrigatório)
- `currency?`: string (padrão: 'R$')
- `trend?`: 'up' | 'down' | 'neutral'
- `trendValue?`: string
- `period?`: string
- `description?`: string
- `onClick?`: () => void

## Exemplo Completo

```tsx
'use client'

import { useState } from 'react'
import {
  ClientPageLayout,
  ClientKPICard,
  ClientSectionCard,
  ClientNavigationTabs,
  TaskItem,
  MeetingItem,
} from '@/components/clients'
import { CheckCircle2, Calendar, FolderKanban } from 'lucide-react'

export default function ClientDetailPage() {
  const [activeTab, setActiveTab] = useState('info')

  const tabs = [
    { id: 'info', label: 'Informações', icon: CheckCircle2 },
    { id: 'tasks', label: 'Tarefas', icon: FolderKanban },
    { id: 'meetings', label: 'Reuniões', icon: Calendar },
  ]

  return (
    <ClientPageLayout>
      {/* KPI Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6'>
        <ClientKPICard
          icon={CheckCircle2}
          label='Taxa de Conclusão'
          value='85%'
          color='green'
        />
        <ClientKPICard
          icon={FolderKanban}
          label='Tarefas Ativas'
          value='12'
          color='blue'
        />
      </div>

      {/* Navigation Tabs */}
      <ClientNavigationTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Content Sections */}
      {activeTab === 'info' && (
        <ClientSectionCard title='Informações do Cliente'>
          <div className='space-y-2 text-slate-300'>
            <p>
              <strong>Nome:</strong> Acme Corp
            </p>
            <p>
              <strong>Email:</strong> contato@acme.com
            </p>
          </div>
        </ClientSectionCard>
      )}

      {activeTab === 'tasks' && (
        <ClientSectionCard title='Tarefas'>
          <div className='space-y-2'>
            <TaskItem
              id='1'
              title='Tarefa 1'
              status='pending'
              priority='high'
            />
            <TaskItem
              id='2'
              title='Tarefa 2'
              status='completed'
              priority='medium'
            />
          </div>
        </ClientSectionCard>
      )}

      {activeTab === 'meetings' && (
        <ClientSectionCard title='Reuniões'>
          <div className='space-y-2'>
            <MeetingItem
              id='1'
              title='Reunião Semanal'
              date='15/12/2025'
              time='14:00'
              type='video'
              status='scheduled'
            />
          </div>
        </ClientSectionCard>
      )}
    </ClientPageLayout>
  )
}
```

## Cores Disponíveis para KPICard

- `blue` - Azul (padrão)
- `emerald` - Esmeralda
- `green` - Verde
- `purple` - Púrpura
- `orange` - Laranja
- `amber` - Âmbar
- `red` - Vermelho
- `cyan` - Ciano
- `indigo` - Índigo

## Responsividade

Todos os componentes são totalmente responsivos com suporte a:

- Móvel (sm)
- Tablet (lg)
- Desktop

Use as classes Tailwind `sm:` e `lg:` para customizar o espaçamento e tamanhos quando necessário.
