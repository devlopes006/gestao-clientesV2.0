# 🧪 Guia de Testes - Dashboard Funcional

**Objetivo:** Validar o funcionamento do Calendário e Bloco de Notas integrados ao dashboard.

---

## 📋 Checklist de Testes

### ✅ 1. Acesso ao Dashboard

**Pré-requisito:** Estar logado como usuário com acesso ao dashboard

```bash
# 1. Iniciar o servidor
pnpm dev

# 2. Abrir no navegador
http://localhost:3000/dashboard

# 3. Verificar se a página carrega sem erros
```

**Esperado:**

- Página carrega em < 3 segundos
- Sem erros no console (F12)
- Componentes de calendário e notas são visíveis

---

### ✅ 2. Teste do Calendário

#### 2.1 Criar Evento

**Passos:**

1. Localizar a seção "Calendário" no dashboard (esquerda)
2. Clicar em um dia do calendário
3. Preencher os campos:
   - **Título:** "Reunião com cliente X" (obrigatório)
   - **Descrição:** "Discussão sobre novo projeto" (opcional)
   - **Cor:** Selecionar uma cor (ex: Blue)
4. Clicar em "Criar Evento"

**Esperado:**

- ✅ Modal fecha automaticamente
- ✅ Evento aparece no calendário (com badge colorida)
- ✅ Sem erros no console

**Comando de Debug (console):**

```javascript
// Abrir F12 > Console e executar:
localStorage.setItem('_test_calendar', 'true')
console.log('Teste iniciado')
```

---

#### 2.2 Visualizar Evento

**Passos:**

1. Clicar novamente no dia que tem o evento
2. Modal abre mostrando os eventos do dia

**Esperado:**

- ✅ Título e descrição aparecem
- ✅ Badge com cor do evento
- ✅ Data formatada corretamente (ex: "11/12")

---

#### 2.3 Deletar Evento

**Passos:**

1. No modal de visualização, clicar no ícone 🗑️ (Trash)
2. Confirmar a exclusão na janela de confirmação

**Esperado:**

- ✅ Evento desaparece do calendário
- ✅ Modal fecha
- ✅ Evento é removido do banco de dados

**Teste Crítico:** Voltar para o dashboard (refresh F5) e verificar se o evento NÃO reaparece.

---

#### 2.4 Teste de Cores

**Passos:**

1. Criar um evento para cada cor: Blue, Red, Green, Yellow, Purple, Pink, Orange, Cyan
2. Verificar se as cores aparecem corretamente

**Esperado:**

- ✅ 8 eventos, cada um com sua cor
- ✅ As cores são visíveis na badge do calendário

---

#### 2.5 Teste de Navegação de Mês

**Passos:**

1. Verificar mês atual exibido (ex: "December 2024")
2. Criar eventos em múltiplos dias
3. (Futuro) Implementar botões de navegação de mês

**Esperado:**

- ✅ Calendário mostra todas as semanas do mês
- ✅ Eventos aparecem no dia correto

---

### ✅ 3. Teste do Bloco de Notas

#### 3.1 Criar Nota

**Passos:**

1. Localizar "Nova Nota" botão (lado direito)
2. Clicar para abrir modal
3. Preencher:
   - **Título:** "Ideias para projeto" (opcional)
   - **Conteúdo:** "Implementar dark mode, melhorar performance" (obrigatório)
   - **Cor:** Selecionar cor (ex: Yellow)
4. Clicar "Criar Nota"

**Esperado:**

- ✅ Nota aparece na grade
- ✅ Cores de fundo e borda aparecem
- ✅ Texto é visível
- ✅ Data de criação é exibida (canto inferior)

---

#### 3.2 Auto-preenchimento de Título

**Passos:**

1. Criar nota com:
   - **Título:** Deixar vazio
   - **Conteúdo:** "Esta é uma nota sem título"
2. Submeter

**Esperado:**

- ✅ Título auto-preenche com: "Esta é uma nota s..." (primeiros 60 caracteres)
- ✅ Nota é criada com sucesso

---

#### 3.3 Deletar Nota

**Passos:**

1. Passar mouse sobre uma nota
2. Clicar no ícone 🗑️ que aparece (superior direito)
3. A nota é deletada

**Esperado:**

- ✅ Nota desaparece imediatamente
- ✅ Grade se reorganiza (grid reflow)
- ✅ Deletado do banco de dados (persistência)

---

#### 3.4 Reordenação (Drag-and-Drop)

**Passos:**

1. Criar 3-5 notas
2. Clicar e arrastar uma nota para outra posição
3. Soltar o mouse

**Esperado:**

- ✅ Nota muda de posição visualmente
- ✅ Posição é salva no banco de dados
- ✅ Ao refrescar (F5), ordem é mantida

**Teste Crítico:**

```bash
# Refrescar página e verificar
# Se ordem está preservada após reload
```

---

#### 3.5 Teste de Cores

**Passos:**

1. Criar uma nota para cada cor disponível
2. Verificar aparência visual

**Esperado:**

- ✅ 8 cores diferentes visíveis
- ✅ Bordas e fundos contrastam bem com tema escuro

---

### ✅ 4. Testes de Responsividade

#### 4.1 Desktop (>1024px)

**Passos:**

1. Abrir no navegador largura 1440px+
2. Verificar layout

**Esperado:**

- ✅ Calendário ocupa ~2/3 da largura (lg:col-span-2)
- ✅ Notas ocupam ~1/3 (ao lado direito)
- ✅ Sem overflow horizontal

---

#### 4.2 Tablet (768px-1023px)

**Passos:**

1. Redimensionar janela para 768px
2. ou Usar Device Emulation (F12 > Ctrl+Shift+M)
3. Selecionar "iPad" ou similar

**Esperado:**

- ✅ Calendário e Notas em coluna única (grid-cols-1)
- ✅ Notas em 2 colunas (md:grid-cols-2)
- ✅ Sem elementos escondidos

---

#### 4.3 Mobile (<768px)

**Passos:**

1. Redimensionar para 375px (iPhone)
2. Verificar legibilidade

**Esperado:**

- ✅ Tudo em coluna única
- ✅ Notas em 1 coluna
- ✅ Texto legível (não cortado)
- ✅ Botões clicáveis (>44px altura)

---

### ✅ 5. Testes de Validação

#### 5.1 Campos Obrigatórios

**Teste Calendário:**

1. Clicar em dia e deixar título vazio
2. Clicar "Criar Evento"

**Esperado:**

- ⚠️ Alerta: "Escreva algo no evento" (ou similar)
- ✅ Evento NÃO é criado

**Teste Notas:**

1. Clicar "Nova Nota" e deixar ambos vazios
2. Clicar "Criar Nota"

**Esperado:**

- ⚠️ Alerta: "Escreva algo na nota"
- ✅ Nota NÃO é criada

---

#### 5.2 Limite de Caracteres

**Passos:**

1. Criar evento com título muito longo (>100 caracteres)
2. Criar nota com conteúdo muito longo (>500 caracteres)

**Esperado:**

- ✅ Evento/Nota criado (sem truncamento no servidor)
- ✅ UI mostra apenas linhas visíveis (line-clamp)
- ⚠️ Texto não transborda

---

### ✅ 6. Testes de Performance

#### 6.1 Criação Rápida

**Passos:**

1. Criar 5 eventos em < 30 segundos
2. Criar 10 notas em < 1 minuto

**Esperado:**

- ✅ Nenhum lag
- ✅ Todos aparecem corretamente
- ✅ Console sem erros

---

#### 6.2 Scroll Performance

**Passos:**

1. Criar 50+ notas
2. Scroll rápido na seção de notas

**Esperado:**

- ✅ Scroll suave (60 fps)
- ✅ Sem travamento

**Debug:** Abrir DevTools > Performance e gravar:

```javascript
// Performance API
performance.mark('scroll-start')
// ... scroll...
performance.mark('scroll-end')
performance.measure('scroll-perf', 'scroll-start', 'scroll-end')
performance.getEntriesByType('measure').forEach((m) => console.log(m))
```

---

### ✅ 7. Testes de Dados Reais

#### 7.1 Persistência

**Passos:**

1. Criar evento + nota
2. Fechar aba/navegador
3. Reabrir dashboard

**Esperado:**

- ✅ Evento ainda existe
- ✅ Nota ainda existe
- ✅ Ordem de notas mantida

**Verificação SQL:**

```bash
# Se tiver acesso ao banco:
psql -U user -d gestao_clientes -c \
  "SELECT * FROM DashboardEvent ORDER BY createdAt DESC LIMIT 5;"
```

---

#### 7.2 Isolamento por Organização

**Passos (multi-tenant):**

1. Logar como usuário da Org A
2. Criar evento + nota
3. Logar como usuário da Org B
4. Verificar se eventos/notas não aparecem

**Esperado:**

- ✅ Evento/nota visível APENAS para Org A
- ✅ Isolamento de dados correto

---

### ✅ 8. Testes de Erros

#### 8.1 Erro de Criação (simular)

**Passos:**

1. Abrir DevTools > Network
2. Marcar "Offline"
3. Criar evento
4. Remarcar "Online"

**Esperado:**

- ⚠️ Mensagem de erro ao usuário
- ✅ Retentativa automática (se implementado)
- ✅ Sem estado inconsistente

---

#### 8.2 Erro de Deleção

**Passos:**

1. Colocar offline
2. Tentar deletar evento
3. Remarcar online

**Esperado:**

- ⚠️ "Erro ao deletar evento"
- ✅ Evento permanece visível
- ✅ Estado não fica inconsistente

---

### ✅ 9. Testes de Acessibilidade

#### 9.1 Navegação com Teclado

**Passos:**

1. Abrir dashboard
2. Usar TAB para navegar entre elementos
3. Usar ENTER para ativar botões

**Esperado:**

- ✅ Ordem de TAB lógica
- ✅ Focus visível (outline)
- ✅ Botões ativáveis com ENTER

---

#### 9.2 Leitores de Tela

**Passos:**

1. Usar Windows Narrator (Win + Enter) ou similar
2. Navegar por eventos e notas

**Esperado:**

- ✅ Títulos lidos corretamente
- ✅ Botões descriminados ("Deletar evento", "Nova nota")
- ✅ Datas anunciadas

---

## 📊 Relatório de Testes

Usar template abaixo para documentar:

```markdown
# Relatório de Testes - Dashboard Funcional

**Data:** 2024-12-11
**Testador:** [Seu Nome]
**Navegador:** Chrome 120 / Firefox 121 / Safari 17
**SO:** Windows 11 / macOS / Linux

## Testes Executados

| #   | Teste             | Status  | Notas                       |
| --- | ----------------- | ------- | --------------------------- |
| 2.1 | Criar Evento      | ✅ PASS | Evento aparece corretamente |
| 2.2 | Visualizar Evento | ✅ PASS | -                           |
| 2.3 | Deletar Evento    | ✅ PASS | Persistência confirmada     |
| 3.1 | Criar Nota        | ✅ PASS | -                           |
| 3.2 | Auto-fill Título  | ✅ PASS | Funciona como esperado      |
| 3.3 | Deletar Nota      | ✅ PASS | -                           |
| 3.4 | Drag-Drop         | ✅ PASS | Ordem persiste após reload  |
| 4.1 | Desktop Layout    | ✅ PASS | 2/3 + 1/3 correto           |
| 4.2 | Tablet Layout     | ✅ PASS | Coluna única funciona       |
| 4.3 | Mobile Layout     | ✅ PASS | Tudo visível em 375px       |

## Problemas Encontrados

Nenhum

## Melhorias Sugeridas

- [ ] Editar evento/nota existente
- [ ] Notificações de lembretes
- [ ] Integração com Google Calendar

## Assinado

**Testador:** ******\_\_\_\_******
**Data:** ******\_\_\_\_******
**Versão do Dashboard:** 2.0.0 (Funcional)
```

---

## 🔍 Debugging Avançado

### Console Commands

```javascript
// Limpar localStorage
localStorage.clear()

// Ver todos os eventos
const events = JSON.parse(localStorage.getItem('dashboard_events') || '[]')
console.table(events)

// Ver todas as notas
const notes = JSON.parse(localStorage.getItem('dashboard_notes') || '[]')
console.table(notes)

// Simular erro
fetch('/api/dashboard/events', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: '' }),
})
  .then((r) => r.json())
  .then(console.log)
```

### Monitorar Network Requests

1. Abrir DevTools (F12)
2. Ir para aba "Network"
3. Filtro: `event|note` (ctrl+f na lista)
4. Executar ações (criar, deletar, etc)

**Esperado:**

- POST `/api/dashboard/events` (201 Created)
- POST `/api/dashboard/notes` (201 Created)
- DELETE `/api/dashboard/events/[id]` (200 OK)

---

## ✅ Checklist Final

- [ ] Todos os 9 grupos de testes executados
- [ ] Nenhum erro crítico encontrado
- [ ] Relatório de testes preenchido
- [ ] Performance aceitável (<100ms por operação)
- [ ] Responsividade confirmada em 3 tamanhos
- [ ] Dados persistem após reload
- [ ] Build passa sem erros: `pnpm build:next`

---

**Próximas Etapas:**

1. ✅ Testes funcionais (este documento)
2. 🔄 Testes de integração (E2E com Playwright)
3. 🔄 Testes de carga (k6 ou JMeter)
4. 🔄 Testes de segurança (OWASP Top 10)

---

**Documento criado em:** Dezembro 11, 2024
**Última atualização:** Dezembro 11, 2024
