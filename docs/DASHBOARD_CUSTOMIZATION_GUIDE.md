# 🔧 Guia de Customização - Dashboard V2

## 📋 Índice

1. [Mudar Cores](#mudar-cores)
2. [Adicionar KPIs](#adicionar-kpis)
3. [Modificar Layout](#modificar-layout)
4. [Customizar Gráficos](#customizar-gráficos)
5. [Adicionar Componentes](#adicionar-componentes)
6. [Filtros & Períodos](#filtros--períodos)

---

## 🎨 Mudar Cores

### 1. Cores dos KPI Cards

**Arquivo**: `src/app/(dashboard)/DashboardV2ClientNew.tsx` (linhas 50-60)

```typescript
// Adicione uma nova cor ao mapa:
const colorMap = {
  blue: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
  emerald: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30",
  purple: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
  orange: "from-orange-500/20 to-orange-600/10 border-orange-500/30",
  red: "from-red-500/20 to-red-600/10 border-red-500/30",
  pink: "from-pink-500/20 to-pink-600/10 border-pink-500/30",
  // ↓ NOVO
  cyan: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30",
};

// Uso:
<KPICard
  icon={<Users className="w-6 h-6" />}
  label="Novo KPI"
  value={100}
  color="cyan"  // ← Agora disponível
/>
```

### 2. Tema Geral (Gradiente de Fundo)

**Arquivo**: `src/app/(dashboard)/dashboard-new.module.css`

```css
.root {
  background: linear-gradient(
    135deg,
    #0f172a 0%,
    /* ← Mude para: #1a1a2e, #0d1117, etc */ #1e1b4b 25%,
    /* ← Ou: #16213e, #1a1a3e, etc */ #1a1f35 50%,
    #0f172a 75%,
    #1e293b 100% /* ← Final: #2d2d4f, #1f1f3f, etc */
  );
}
```

### 3. Cores Específicas por Componente

```typescript
// Status das Tarefas (linhas 295-305)
const STATUS_COLORS: Record<string, string> = {
  TODO: '#64748b', // ← Mude cor cinza
  IN_PROGRESS: '#3b82f6', // ← Azul
  REVIEW: '#f59e0b', // ← Amarelo
  DONE: '#10b981', // ← Verde
  CANCELLED: '#6b7280', // ← Cinza
}

// Prioridade (linhas 100-112)
const PRIORITY_COLORS: Record<string, string> = {
  URGENT: 'red-500',
  HIGH: 'orange-500',
  MEDIUM: 'purple-500',
  LOW: 'emerald-500',
}
```

---

## 📊 Adicionar KPIs

### 1. Adicione o Cálculo no `useMemo`

**Arquivo**: `src/app/(dashboard)/DashboardV2ClientNew.tsx` (linhas ~240)

```typescript
const stats = useMemo(() => {
  const clients = initialData.clients?.length ?? 0
  const tasks = initialData.tasks?.length ?? 0
  const tasksCompleted =
    initialData.tasks?.filter((t) => t.status === 'DONE').length ?? 0
  const tasksUrgent =
    initialData.tasks?.filter((t) => t.priority === 'URGENT').length ?? 0
  const completionRate =
    tasks > 0 ? Math.round((tasksCompleted / tasks) * 100) : 0
  const overdueTasks =
    initialData.tasks?.filter(
      (t) =>
        t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE'
    ).length ?? 0

  // ↓ NOVO KPI: Receita média por cliente
  const totalRevenue =
    initialData.financialData?.reduce((acc, f) => acc + f.receitas, 0) ?? 0
  const revenuePerClient = clients > 0 ? Math.round(totalRevenue / clients) : 0

  return {
    clients,
    tasks,
    tasksCompleted,
    tasksUrgent,
    completionRate,
    overdueTasks,
    revenuePerClient, // ← Novo
  }
}, [initialData])
```

### 2. Renderize o Novo KPI Card

**Local**: Após o card de "Atrasos" (linhas ~330)

```jsx
<KPICard
  icon={<TrendingUp className='w-6 h-6' />}
  label='Receita por Cliente'
  value={`R$ ${stats.revenuePerClient.toLocaleString('pt-BR')}`}
  color='pink'
  trend='up'
  trendLabel='+12%'
/>
```

---

## 🎯 Modificar Layout

### 1. Mudar Proporção Coluna Esquerda/Direita

**Arquivo**: React JSX (linhas ~315)

```jsx
{/* Atualmente: lg:col-span-1 vs lg:col-span-2 */}
{/* Mudando para 1:1 proportion */}
<div className="lg:col-span-1 space-y-6"> {/* ← Era lg:col-span-1 */}
  {/* Esquerda */}
</div>

<div className="lg:col-span-1 space-y-6"> {/* ← Mude para lg:col-span-1 */}
  {/* Direita */}
</div>
```

### 2. Alterar Número de Colunas na Grid de Saúde

**Local**: Client Health Grid (linhas ~430)

```jsx
{
  /* Atualmente: lg:grid-cols-4 */
}
;<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
  {/* Mude para lg:grid-cols-3 (3 por linha) ou lg:grid-cols-6 (6 por linha) */}
</div>
```

### 3. Adicionar Nova Seção (exemplo: Notas)

```jsx
{
  /* Após a seção de Saúde dos Clientes */
}
;<section className='mb-8'>
  <h2 className='text-xl font-bold text-white flex items-center gap-2 mb-6'>
    <MessageSquare className='w-6 h-6 text-cyan-400' />
    Notas Rápidas
  </h2>
  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
    {initialData.notes?.map((note) => (
      <NoteCard key={note.id} note={note} />
    ))}
  </div>
</section>
```

---

## 📈 Customizar Gráficos

### 1. Mudar Tipo de Gráfico (AreaChart → LineChart)

**Arquivo**: `src/app/(dashboard)/DashboardV2ClientNew.tsx` (linhas ~360)

```jsx
// ANTES (AreaChart):
;<ResponsiveContainer width='100%' height={250}>
  <AreaChart data={chartData}>
    <Area type='monotone' dataKey='receitas' fill='#10b981' />
    <Area type='monotone' dataKey='despesas' fill='#ef4444' />
  </AreaChart>
</ResponsiveContainer>

// DEPOIS (LineChart):
import { LineChart, Line } from 'recharts'

;<ResponsiveContainer width='100%' height={250}>
  <LineChart data={chartData}>
    <Line type='monotone' dataKey='receitas' stroke='#10b981' strokeWidth={2} />
    <Line type='monotone' dataKey='despesas' stroke='#ef4444' strokeWidth={2} />
  </LineChart>
</ResponsiveContainer>
```

### 2. Adicionar Mais Dados ao Gráfico

```typescript
// Adicione 'saldo' ao chart data:
const chartData = useMemo(() => {
  return (initialData.financialData ?? []).map(d => ({
    month: d.month.substring(0, 3),
    receitas: d.receitas,
    despesas: d.despesas,
    saldo: d.saldo,  // ← NOVO
  }));
}, [initialData.financialData]);

// Render:
<Area type="monotone" dataKey="saldo" fill="#a855f7" stroke="#a855f7" fillOpacity={0.3} />
```

### 3. Customizar Tooltip

```jsx
<Tooltip
  contentStyle={{
    background: '#0f172a', // ← Mude cor
    border: '1px solid #ec4899', // ← Mude borda
    borderRadius: '8px',
  }}
  formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} // ← Formatter customizado
/>
```

---

## ✨ Adicionar Componentes

### 1. Criar Novo Card Component

**Arquivo**: `src/app/(dashboard)/components/NewCard.tsx`

```typescript
import { ReactNode } from "react";

interface NewCardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  value: string | number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function NewCard({ title, description, icon, value, action }: NewCardProps) {
  return (
    <div className="bg-gradient-to-br from-slate-900/50 to-slate-950/30 border border-slate-700/50 rounded-xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-white font-semibold text-sm">{title}</h3>
          {description && <p className="text-xs text-slate-400 mt-1">{description}</p>}
        </div>
        {icon && <div className="text-cyan-400">{icon}</div>}
      </div>
      <p className="text-2xl font-bold text-white mb-3">{value}</p>
      {action && (
        <button onClick={action.onClick} className="text-xs text-cyan-400 hover:text-cyan-300">
          {action.label} →
        </button>
      )}
    </div>
  );
}
```

### 2. Importar e Usar no Dashboard

```tsx
import { NewCard } from './components/NewCard'

// No render:
;<NewCard
  title='Próximas Reuniões'
  value='3'
  icon={<Calendar className='w-5 h-5' />}
  action={{ label: 'Ver todas', onClick: () => {} }}
/>
```

---

## 🔍 Filtros & Períodos

### 1. Adicionar Seletor de Período

**Arquivo**: `src/app/(dashboard)/DashboardV2ClientNew.tsx`

```typescript
import { useState } from "react";

export function DashboardV2ClientNew({ initialData }: Props) {
  const [period, setPeriod] = useState<"month" | "quarter" | "year">("month");

  const filteredData = useMemo(() => {
    // Filtrar dados baseado no período selecionado
    if (period === "quarter") {
      // Lógica de filtro por trimestre
    } else if (period === "year") {
      // Lógica de filtro por ano
    }
    return initialData;
  }, [initialData, period]);

  return (
    <div className={styles.root}>
      <div className="flex gap-2 mb-6">
        {(['month', 'quarter', 'year'] as const).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              period === p
                ? 'bg-pink-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {p === 'month' ? 'Mês' : p === 'quarter' ? 'Trimestre' : 'Ano'}
          </button>
        ))}
      </div>
      {/* Rest of component */}
    </div>
  );
}
```

### 2. Adicionar Filtro por Cliente

```jsx
<select
  value={selectedClient}
  onChange={(e) => setSelectedClient(e.target.value)}
  className='px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg'
>
  <option value=''>Todos os Clientes</option>
  {initialData.clients?.map((c) => (
    <option key={c.id} value={c.id}>
      {c.name}
    </option>
  ))}
</select>
```

---

## 🚀 Deployment Checklist

Antes de fazer deploy, verifique:

- [ ] `pnpm type-check` passando
- [ ] `pnpm build:next` completado
- [ ] Dados carregando corretamente
- [ ] Responsividade em mobile/tablet
- [ ] Performance (sem warnings de console)
- [ ] Cores acessíveis (contrast ratio)
- [ ] Sem console errors/warnings

---

## 🐛 Troubleshooting

### Problema: Gráficos não aparecem

```typescript
// Verifique se chartData tem dados:
console.log(chartData) // Deve ter array com objetos {month, receitas, despesas, saldo}
```

### Problema: Layout quebrado em mobile

```css
/* Adicione media query no CSS Module */
@media (max-width: 640px) {
  .container {
    gap: 0.75rem; /* Reduza gap */
  }
}
```

### Problema: Cores parecem erradas

```typescript
// Verifique classe Tailwind:
// Formato correto: text-{color}-{shade}
// Exemplo: text-emerald-400 (não: text-green-400)
```

---

## 📚 Recursos Adicionais

- [Tailwind CSS Docs](https://tailwindcss.com)
- [Recharts Documentation](https://recharts.org)
- [Lucide Icons](https://lucide.dev)
- [React Hooks API](https://react.dev/reference/react)

---

## 💡 Dicas Rápidas

1. **Para adicionar ícone**: Vá para `lucide.dev`, copie nome, importe em `lucide-react`
2. **Para mudar cor**: Use classes Tailwind `text-{color}-{shade}` (shade: 400-600)
3. **Para animar**: Use classes `hover:`, `transition-*`, `animate-*`
4. **Para responsive**: Use prefixes `sm:`, `md:`, `lg:`, `xl:`
5. **Para debugar dados**: Use `console.log(initialData)` em `useMemo`

---

**Última Atualização**: 24 de Janeiro de 2025  
**Status**: ✅ Guia Completo de Customização
