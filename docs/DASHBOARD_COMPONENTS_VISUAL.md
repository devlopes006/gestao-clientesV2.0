# 🎨 Exemplos de Componentes - Dashboard V2

## 1️⃣ KPI Card Component

### Características:

- Gradiente de fundo customizado por tipo
- Ícone com background colorido
- Indicador de tendência (↑/↓)
- Hover com scale animation

### Exemplo Visual (HTML/CSS):

```html
<!-- KPI Card - Clientes Ativos (Blue) -->
<div
  class="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/30 rounded-2xl p-6"
>
  <div class="flex items-start justify-between mb-4">
    <!-- Icon Container -->
    <div class="bg-blue-500/20 text-blue-400 p-3 rounded-xl">
      <Users class="w-6 h-6" />
    </div>
    <!-- Trend Indicator -->
    <div class="flex items-center gap-1 text-xs font-semibold text-emerald-400">
      <ArrowUpRight class="w-3 h-3" />
      Crescendo
    </div>
  </div>
  <p class="text-slate-400 text-sm font-medium">Clientes Ativos</p>
  <h3 class="text-2xl font-bold text-white">24</h3>
</div>
```

### Variações de Cores:

```
Blue    → Clientes, Info
Emerald → Taxa Conclusão, Sucesso
Red     → Urgentes, Crítico
Orange  → Atrasos, Warning
Purple  → Total Tarefas, Info
```

---

## 2️⃣ Priority Badge Component

### Cores por Prioridade:

```
URGENT   → Red (#ef4444)       🔴 Vermelho
HIGH     → Orange (#f59e0b)    🟠 Laranja
MEDIUM   → Purple (#a855f7)    🟣 Roxo
LOW      → Emerald (#22c55e)   🟢 Verde
```

### Exemplo:

```html
<span
  class="px-2 py-1 rounded-full text-xs font-semibold border bg-red-500/20 text-red-300 border-red-500/30"
>
  URGENT
</span>
```

---

## 3️⃣ Client Health Card

### Layout:

```
┌─────────────────────────────────┐
│  Cliente Name      │   [85%]     │  Header
├─────────────────────────────────┤
│ Ótimo desempenho                │  Status
├─────────────────────────────────┤
│ ██████████░░░░░░░░░░            │  Progress Bar
├─────────────────────────────────┤
│  3 Pendentes │  8 Concluídas    │  Metrics
│  0 Atrasadas                    │
└─────────────────────────────────┘
```

### Cores de Saúde:

```
80%+ → Verde (#10b981)   Ótimo
60%+ → Amarelo (#eab308) Bom
40%+ → Laranja (#ea580c) Médio
<40% → Vermelho (#ef4444) Baixo
```

### Exemplo:

```html
<div
  class="bg-gradient-to-br from-emerald-500/10 to-slate-900/20 border border-slate-700/50 rounded-xl p-4"
>
  <div class="flex items-start justify-between mb-3">
    <div class="flex-1">
      <h4 class="text-white font-semibold text-sm">Acme Corp</h4>
      <p class="text-xs font-medium text-emerald-400 mt-1">Ótimo desempenho</p>
    </div>
    <div
      class="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center"
    >
      <span class="text-sm font-bold text-white">85%</span>
    </div>
  </div>
  <!-- Progress Bar -->
  <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
    <div class="h-full bg-emerald-500" style="width: 85%"></div>
  </div>
  <!-- Metrics Grid -->
  <div class="grid grid-cols-3 gap-2 mt-3 text-[10px] text-slate-400">
    <div class="text-center">
      <p class="font-semibold text-white">3</p>
      <p>Pendentes</p>
    </div>
    <div class="text-center">
      <p class="font-semibold text-white">8</p>
      <p>Concluídas</p>
    </div>
    <div class="text-center">
      <p class="font-semibold text-emerald-400">0</p>
      <p>Atrasadas</p>
    </div>
  </div>
</div>
```

---

## 4️⃣ Urgent Task Card

### Características:

- Ícone de fogo (🔥)
- Fundo vermelho escuro
- Due date highlighting
- Border hover effect

### Exemplo:

```html
<div
  class="bg-gradient-to-br from-red-500/10 to-slate-900/20 border border-red-500/20 rounded-lg p-4 hover:border-red-500/40"
>
  <div class="flex items-start gap-3 mb-2">
    <Flame class="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
    <div class="flex-1 min-w-0">
      <h4 class="text-white font-semibold text-sm">
        Implementar novo módulo de pagamento
      </h4>
      <p class="text-xs text-slate-400 mt-1">Acme Corp</p>
    </div>
  </div>
  <div class="flex items-center justify-between mt-3">
    <span
      class="px-2 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-300"
      >URGENT</span
    >
    <span class="text-[10px] text-red-400 font-medium"
      >Vencimento: 25/01/2025</span
    >
  </div>
</div>
```

---

## 5️⃣ Activity Timeline

### Layout:

```
● ─── Reunião com cliente - Acme Corp • 24/01
│
● ─── Tarefa concluída - Dashboard - TechStart • 23/01
│
● ─── Novo evento criado - Meeting - Beta • 22/01
│
● ─── ...
```

### Cores por Tipo:

```
Meeting → Azul (#3b82f6)      🔵
Task    → Roxo (#a855f7)      🟣
Event   → Verde (#10b981)     🟢
```

### Exemplo:

```html
<div class="space-y-3">
  <div class="flex gap-3">
    <!-- Timeline Dot -->
    <div class="flex flex-col items-center">
      <div class="w-3 h-3 rounded-full bg-blue-500 mt-1.5"></div>
      <div class="w-0.5 h-8 bg-slate-700/50 mt-1"></div>
    </div>
    <!-- Content -->
    <div class="flex-1 pt-1">
      <p class="text-sm text-white font-medium">Reunião com Acme Corp</p>
      <p class="text-xs text-slate-400 mt-0.5">Acme Corp • 24/01/2025</p>
    </div>
  </div>
  <!-- More items... -->
</div>
```

---

## 6️⃣ Financial Charts

### Area Chart (Receitas vs Despesas)

```
Receitas (Verde)  ╱════════════╲   ╱══════════╲
                 ╱              ╲ ╱            ╲
Despesas (Vermelho) ╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲

       jan  fev  mar  abr  mai  jun
```

### Bar Chart (Status das Tarefas)

```
TODO         ██████
IN_PROGRESS  ████████
REVIEW       ██████████
DONE         ███████████████
CANCELLED    ███

             0    5    10    15
```

---

## 7️⃣ Quick Action Buttons

### Características:

- Gradiente customizado por ação
- Ícone + Texto
- Chevron animado no hover
- 3 colunas responsive

### Exemplo:

```html
<!-- Nova Tarefa (Blue) -->
<button
  class="bg-gradient-to-r from-blue-500/20 to-blue-600/10 hover:from-blue-500/30 hover:to-blue-600/20 border border-blue-500/30 rounded-xl p-4"
>
  <div class="flex items-center gap-3">
    <Plus class="w-5 h-5" />
    Nova Tarefa
  </div>
  <ChevronRight class="w-5 h-5 opacity-0 group-hover:opacity-100" />
</button>

<!-- Novo Cliente (Green) -->
<button class="bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 ...">
  <Users class="w-5 h-5" />
  Novo Cliente
</button>

<!-- Agendar (Purple) -->
<button class="bg-gradient-to-r from-purple-500/20 to-purple-600/10 ...">
  <Calendar class="w-5 h-5" />
  Agendar
</button>
```

---

## 📱 Responsividade

### Desktop (lg screens)

```
┌─ KPI 1 ─┬─ KPI 2 ─┬─ KPI 3 ─┬─ KPI 4 ─┬─ KPI 5 ─┐
└─────────┴─────────┴─────────┴─────────┴─────────┘

┌─────────────────────┬────────────────────────┐
│ Left (1/3)          │ Center+Right (2/3)    │
├─────────────────────┼────────────────────────┤
│ Urgent Tasks        │ Financial Charts      │
│ Activity Timeline   │ Task Status Chart     │
└─────────────────────┴────────────────────────┘

┌──────────────────────────────────────────────┐
│ Client Health Grid (4 columns)               │
└──────────────────────────────────────────────┘
```

### Tablet (md screens)

```
2-3 KPI cards por linha
Left/Right layout simplificado
Client Health: 2 columns
```

### Mobile (sm screens)

```
1 KPI card por linha
Stack vertical de tudo
Client Health: 1 column
```

---

## 🎯 CSS Classes Chave

```css
/* Gradients */
.from-blue-500/20
.to-slate-900/20
.bg-gradient-to-br

/* Borders */
.border-blue-500/30
.border-slate-700/50
.hover:border-red-500/40

/* Text */
.text-slate-400
.text-white
.font-semibold

/* Effects */
.backdrop-blur-lg
.hover:scale-105
.transition-all

/* Grid */
.grid-cols-1
.md:grid-cols-2
.lg:grid-cols-4

/* Spacing */
.p-6
.mb-4
.gap-3
```

---

## ✨ Animações

```css
/* Hover Scale */
.hover:scale-105 .transition-transform .duration-300

/* Fade In */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Slide Up */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Pulse */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
```

---

## 🎨 Temas & Variações

Todos os componentes suportam variações de cores:

```typescript
// KPI Card Cores
color: 'blue' | 'emerald' | 'purple' | 'orange' | 'red' | 'pink'

// Insight Types
type: 'success' | 'warning' | 'info' | 'urgent'

// Health Rating
completionRate: number(0 - 100)
```

---

**Última Atualização**: 24 de Janeiro de 2025  
**Status**: ✅ Exemplos Visuais Documentados
