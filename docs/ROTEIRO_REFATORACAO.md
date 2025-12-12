# 🚀 Próximos Passos - Refatoração das Páginas

**Data:** 12 de Dezembro de 2025  
**Prioridade:** ALTA  
**Duração Estimada:** 2-3 horas por página

---

## 📋 Roadmap de Refatoração

### Fase 1: Página Piloto (Hoje)
**Objetivo:** Validar o sistema com uma página real

#### 1.1 - Refatorar `/clients/[id]/info`
```bash
# 1. Fazer backup (git stash)
git stash

# 2. Abrir a página
code src/app/(dashboard)/clients/[id]/info/page.tsx

# 3. Simplificar mantendo dados importantes:
# - Remover componentes Card antigos
# - Substituir por ClientKPICard para métricas
# - Usar ClientSectionCard para ClientInfoDisplay
# - Manter a lógica de dados (getClientDashboard, etc)

# 4. Testar
pnpm dev
# Acessar: http://localhost:3000/clients/[id]/info

# 5. Commit se funcionar
git add src/app/(dashboard)/clients/[id]/info/page.tsx
git commit -m "refactor(client-info): use new component system"
```

#### 1.2 - Validação Visual
- [ ] Verificar se layouts estão alinhados
- [ ] Conferir espaçamento (sm/lg)
- [ ] Testar em mobile (DevTools)
- [ ] Testar em tablet
- [ ] Testar em desktop
- [ ] Revisar cores e contraste

#### 1.3 - Code Review
- [ ] Limpar imports antigos
- [ ] Verificar types
- [ ] Remover commented code
- [ ] Format com prettier

---

## 📝 Template de Refatoração

Use este template para refatorar cada página:

```tsx
'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
  ClientPageLayout,
  ClientKPICard,
  ClientSectionCard,
  ClientNavigationTabs,
  // Import apenas o que precisa
} from '@/components/clients';
import { can } from '@/lib/permissions';
import { getSessionProfile } from '@/services/auth/session';
import { getClientDashboard } from '@/services/clients/getClientDashboard';
import { getClientById } from '@/services/repositories/clients';
import { CheckCircle2, Calendar, ... } from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const { orgId, role } = await getSessionProfile();

  if (!role) return null;

  const client = await getClientById(id);
  if (!client || client.orgId !== orgId) return null;

  const dash = await getClientDashboard(orgId, id);
  const canEdit = can(role, 'update', 'client');

  return (
    <ProtectedRoute>
      <ClientPageLayout>
        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <ClientKPICard
            icon={CheckCircle2}
            label="Métrica"
            value={dash?.counts.tasks.done ?? 0}
            color="blue"
          />
          {/* Mais KPIs */}
        </div>

        {/* Content Sections */}
        <ClientSectionCard title="Título">
          {/* Seu conteúdo aqui */}
        </ClientSectionCard>
      </ClientPageLayout>
    </ProtectedRoute>
  );
}
```

---

## 📑 Páginas para Refatorar

### Priority 1 (Esta semana)
1. **`/clients/[id]/info`** ← PILOTO
   - Status: Pronto
   - Complexidade: Média
   - Tempo estimado: 30 min
   - Ação: Usar ClientKPICard + ClientSectionCard

2. **`/clients/[id]/tasks`**
   - Status: Pronto
   - Complexidade: Média
   - Tempo estimado: 45 min
   - Ação: Usar ClientSectionCard + TaskItem

3. **`/clients/[id]/meetings`**
   - Status: Pronto
   - Complexidade: Média
   - Tempo estimado: 45 min
   - Ação: Usar ClientSectionCard + MeetingItem

### Priority 2 (Semana seguinte)
4. **`/clients/[id]/finance`**
   - Status: Pronto
   - Complexidade: Alta
   - Tempo estimado: 1 hora
   - Ação: Usar FinanceCard + ClientSectionCard

5. **`/clients/[id]/media`**
   - Status: Pronto
   - Complexidade: Média
   - Tempo estimado: 45 min
   - Ação: Usar ClientSectionCard como galeria

### Priority 3 (Semana seguinte)
6. **`/clients/[id]/strategy`**
   - Status: Pronto
   - Complexidade: Média
   - Tempo estimado: 45 min
   - Ação: Usar ClientSectionCard + custom content

7. **`/clients/[id]/branding`**
   - Status: Pronto
   - Complexidade: Média
   - Tempo estimado: 45 min
   - Ação: Usar ClientSectionCard + custom content

8. **`/clients/[id]/billing`**
   - Status: Pronto
   - Complexidade: Média
   - Tempo estimado: 45 min
   - Ação: Usar FinanceCard + ClientSectionCard

---

## 🔧 Passo a Passo Detalhado

### Para cada página:

#### 1. Análise Inicial
```bash
# Abrir página atual
code src/app/(dashboard)/clients/[id]/tasks/page.tsx

# Identificar:
# - Que dados são mostrados
# - Que componentes estão sendo usados
# - Que actions/interações existem
```

#### 2. Planejamento
```
[ ] Quais KPIs mostrar no topo?
[ ] Que seções criar com ClientSectionCard?
[ ] Usar quais item components (TaskItem/MeetingItem)?
[ ] Qual cor usar para cards?
```

#### 3. Implementação
```tsx
// 1. Manter importações de dados
import { getClientDashboard } from '@/services/clients/getClientDashboard';

// 2. Substituir Card antigos por novos
- Card antigo → ClientKPICard/ClientSectionCard
- Lista antiga → ClientSectionCard + TaskItem loop

// 3. Manter lógica de negócio
- Filtros
- Permissões
- Data transformations
```

#### 4. Testes
```bash
# Testar em desenvolvimento
pnpm dev

# Verificar:
✓ Dados aparecem corretamente
✓ Layout responsivo em mobile/tablet/desktop
✓ Cores e contraste OK
✓ Sem erros no console
```

#### 5. Commit
```bash
git add src/app/(dashboard)/clients/[id]/tasks/page.tsx
git commit -m "refactor(client-tasks): use new component system"
```

---

## 💡 Dicas Importantes

### Mantém o máximo de código existente
```tsx
// ✅ BOM: Reutilizar lógica de dados
const dash = await getClientDashboard(orgId, id);
const taskStats = {
  total: dash?.counts.tasks.total ?? 0,
  completed: dash?.counts.tasks.done ?? 0,
};

// ✅ BOM: Usar dados no novo componente
<ClientKPICard value={taskStats.completed} />
```

### Não quebra funcionalidade
```tsx
// ❌ NÃO FAÇA: Remover actions/handlers
onClick={() => deleteTask(id)}

// ✅ FAÇA: Manter actions nos componentes
<TaskItem
  {...task}
  onClick={() => openTaskDetail(task.id)}
/>
```

### Testa antes de fazer commit
```bash
# 1. Iniciar dev server
pnpm dev

# 2. Abrir página em browser
# 3. Testar todas as funcionalidades
# 4. Testar em mobile (F12)
# 5. Só então fazer commit
```

---

## 🎨 Guia de Cores por Página

### Info Page
```tsx
<ClientKPICard color="green" />  // Conclusão
<ClientKPICard color="blue" />   // Ativas
<ClientKPICard color="purple" /> // Mídias
<ClientKPICard color="amber" />  // Reuniões
```

### Tasks Page
```tsx
<ClientKPICard color="blue" />    // Total
<ClientKPICard color="green" />   // Completadas
<ClientKPICard color="red" />     // Atrasadas
<TaskItem status="pending" />     // Item
```

### Finance Page
```tsx
<FinanceCard type="income" />     // Receitas
<FinanceCard type="expense" />    // Despesas
<FinanceCard type="balance" />    // Balanço
<FinanceCard type="forecast" />   // Previsão
```

### Meetings Page
```tsx
<ClientKPICard color="amber" />   // Próximas
<ClientKPICard color="emerald" /> // Passadas
<MeetingItem type="video" />      // Item
```

---

## ⚡ Troubleshooting Comum

### Problema: "Component not found"
```
Solução: Verificar imports em index.ts
import { ClientKPICard } from '@/components/clients';
```

### Problema: "Type error"
```
Solução: Verificar props interface
<ClientKPICard
  icon={IconComponent}  // Obrigatório
  label="Texto"         // Obrigatório
  value="100"           // Obrigatório
  color="blue"          // Opcional
/>
```

### Problema: "Styling quebrado"
```
Solução: Verificar se Tailwind está sendo compilado
pnpm build:next
```

### Problema: "Dados não aparecem"
```
Solução: Verificar se dados estão sendo passados
console.log(data) // Debug
// Depois remover logs
```

---

## 📈 Progress Tracking

Usar este template para acompanhar progresso:

```markdown
## Refatoração - Semana 1

- [x] Info Page (30 min) - PRONTO
- [x] Tasks Page (45 min) - PRONTO
- [x] Meetings Page (45 min) - PRONTO
- [ ] Finance Page (1h) - TODO
- [ ] Media Page (45 min) - TODO

Total: 150 min (~2.5 horas) ✅
```

---

## 🚀 Launch Checklist

Antes de fazer push para staging:

- [ ] Todas as 8 páginas refatoradas
- [ ] Sem erros no console
- [ ] Responsivo em todos os tamanhos
- [ ] Teste visual com designer
- [ ] Code review
- [ ] Performance OK (Lighthouse)
- [ ] Accessibility OK (axe DevTools)
- [ ] Tests passando (se houver)
- [ ] Branch criado de develop
- [ ] PR aberto e aprovado

---

## 📞 Referências

- **Componentes Docs:** `docs/COMPONENTES_CLIENTE.md`
- **Exemplo Prático:** `src/app/(dashboard)/clients/example-refactored-detail.tsx`
- **Sumário Executivo:** `docs/SISTEMA_COMPONENTES_CLIENTE_SUMARIO.md`
- **Quick Start:** `docs/QUICK_START_COMPONENTES.md`

---

## 🎯 Meta Final

**Todas as páginas de cliente usando o novo sistema de componentes**

- Consistência visual
- Manutenção mais fácil
- Experiência do usuário melhorada
- Code mais limpo

---

**Próximo passo:** Começar com `/clients/[id]/info` como piloto! 🚀
