# 🚀 Quick Start - Dashboard V2

## Em 2 Minutos

O novo dashboard **já está funcionando** no `/dashboard`. Não precisa fazer nada!

### ✅ O que mudou?

```
ANTES (V1):
├── Cards de layout rígido
├── Dados truncados (4 itens max)
└── Sem gráficos completos

AGORA (V2):
├── 5 KPI Cards no header
├── Coluna urgentes + timeline
├── Gráficos completos
├── Grid de saúde dos clientes
└── Quick actions
```

---

## 📸 Visual Rápido

```
┌─────────────────────────────────────────────────────┐
│  📊 Clientes │ ✓ Taxa │ 🔥 Urgentes │ ⏰ Atrasos │ 📋 Total │
└─────────────────────────────────────────────────────┘

┌────────────────────┬──────────────────────────────┐
│ Tarefas Urgentes   │  Gráficos                    │
│ Timeline           │  [Receitas vs Despesas]     │
│ Atividades         │  [Status das Tarefas]       │
└────────────────────┴──────────────────────────────┘

┌──────────────┬──────────────┬──────────────┬──────────────┐
│ Client 85%   │ Client 72%   │ Client 45%   │ Client 92%   │
│ ProgressBar  │ ProgressBar  │ ProgressBar  │ ProgressBar  │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

---

## 🎯 Arquivos Principais

| Arquivo                    | Função               | Modificar? |
| -------------------------- | -------------------- | ---------- |
| `DashboardV2ClientNew.tsx` | Componente principal | ✅ SIM     |
| `dashboard-new.module.css` | Estilos              | ✅ SIM     |
| `page.tsx`                 | Router page          | ❌ NÃO     |

---

## 🎨 5 Coisas Mais Fáceis de Customizar

### 1. Mudar Cores

```typescript
// Em DashboardV2ClientNew.tsx

// KPI Card color (linha ~60)
<KPICard color="emerald" /> // ← "blue" | "emerald" | "purple" | "orange" | "red" | "pink"

// Background (dashboard-new.module.css)
background: linear-gradient(135deg, #0f172a, #1e1b4b);
```

### 2. Adicionar KPI Card

```jsx
// Após "Total de Tarefas" KPI
<KPICard
  icon={<Dollar className='w-6 h-6' />}
  label='Receita Total'
  value='R$ 124.500'
  color='purple'
/>
```

### 3. Mudar Número de Colunas

```jsx
{
  /* Client Health Grid */
}
;<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
  {/* Mude lg:grid-cols-4 para lg:grid-cols-3, etc */}
</div>
```

### 4. Ajustar Altura dos Gráficos

```jsx
{
  /* Receitas vs Despesas */
}
;<ResponsiveContainer width='100%' height={250}>
  {/* Mude 250 para 300, 350, etc */}
</ResponsiveContainer>
```

### 5. Mudar Urgentes de Top 3 para Top 5

```typescript
const urgentTasks = useMemo(() => {
  return (initialData.tasks ?? [])
    .filter((t) => t.priority === 'URGENT')
    .sort(
      (a, b) =>
        new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime()
    )
    .slice(0, 5) // ← Mude de 3 para 5
}, [initialData.tasks])
```

---

## 🔧 Deploy

### Antes de Fazer Push:

```bash
pnpm type-check     # ✅ Sem erros?
pnpm build:next    # ✅ Build completo?
```

### Deploy:

```bash
git add src/app/\(dashboard\)/
git commit -m "feat: new dashboard redesign"
git push
```

---

## 📊 Dados Utilizados

O dashboard **automaticamente** usa:

- ✅ Clientes (contagem)
- ✅ Tarefas (status, prioridade, due date)
- ✅ Atividades (timeline)
- ✅ Dados financeiros (receitas/despesas)
- ✅ Saúde dos clientes (completion rate)

Tudo vem de `getDashboardData()` que já existe.

---

## 🎯 Próximos Passos (Opcional)

- [ ] Adicionar filtro por período (mês/ano)
- [ ] Adicionar modal de detalhes
- [ ] Integrar com WhatsApp notifications
- [ ] Adicionar export para PDF
- [ ] Dark/Light mode toggle

---

## 🆘 Problemas Comuns

### Gráficos vazios?

```typescript
// Adicionar console.log para debug
console.log(chartData) // Deve ter dados
```

### Cores erradas?

```typescript
// Verificar classes Tailwind
// Formato: text-{cor}-{shade}
// Correto: text-emerald-400 ❌ text-green-400
```

### Layout quebrado mobile?

```css
/* Já responsivo! Se quebrar, adicionar: */
@media (max-width: 640px) {
  .seu-elemento {
    font-size: 12px;
  }
}
```

---

## ✨ Recursos

- 📖 [Guia Completo de Customização](./DASHBOARD_CUSTOMIZATION_GUIDE.md)
- 📦 [Estrutura de Dados](./DASHBOARD_DATA_STRUCTURE.md)
- 🎨 [Exemplos de Componentes](./DASHBOARD_COMPONENTS_VISUAL.md)
- 📋 [Documentação Técnica](./DASHBOARD_REDESIGN_2024.md)

---

## 💬 Comandos Úteis

```bash
# Desenvolvimento
pnpm dev              # Rodar localhost:3000/dashboard

# Build
pnpm build:next      # Build apenas Next.js
pnpm build           # Build com Netlify wrapper

# Testes
pnpm type-check      # Type checking
pnpm test            # Unit tests
pnpm e2e             # E2E tests

# Format
pnpm format          # Prettier format
```

---

## 🎉 Você está Pronto!

O dashboard está **100% funcional** e **pronto para produção**.

**Status**: ✅ COMPLETO

Qualquer dúvida, veja os guias detalhados em `docs/`.

---

**Dashboard V2.0.0 - Janeiro 2025**
