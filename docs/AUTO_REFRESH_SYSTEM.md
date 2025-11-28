# Sistema de Atualização Automática

## Visão Geral

O sistema de atualização automática foi implementado para manter os dados da aplicação sempre atualizados sem a necessidade de o usuário pressionar F5 manualmente.

## Componentes Implementados

### 1. Hook `useAutoRefresh`

**Localização:** `src/hooks/useAutoRefresh.ts`

Hook customizado que gerencia a atualização automática de dados do servidor.

**Funcionalidades:**

- ✅ **Polling Periódico**: Atualiza os dados a cada 30 segundos (configurável)
- ✅ **Refresh ao Focar**: Atualiza automaticamente quando o usuário volta para a aba
- ✅ **Refresh ao Reconectar**: Atualiza quando a conexão com a internet é restaurada
- ✅ **Throttling**: Evita refreshes muito próximos (mínimo de 5 segundos entre atualizações)

**Uso:**

```tsx
useAutoRefresh({
  interval: 30000, // 30 segundos
  refreshOnFocus: true,
  refreshOnReconnect: true,
  enabled: true,
})
```

### 2. Componente `RefreshIndicator`

**Localização:** `src/components/ui/refresh-indicator.tsx`

Indicador visual que mostra quando os dados foram atualizados pela última vez.

**Funcionalidades:**

- Mostra "agora" para atualizações recentes (< 10 segundos)
- Mostra "Xs atrás" para atualizações entre 10-60 segundos
- Mostra "Xm atrás" para atualizações maiores que 1 minuto
- Ícone animado (rotação lenta)

### 3. Integração no Dashboard

**Localização:** `src/app/(dashboard)/DashboardClient.tsx`

O hook foi integrado no componente principal do dashboard para manter todos os dados atualizados.

## Como Funciona

### Fluxo de Atualização

1. **Polling Periódico (30 segundos)**
   - A cada 30 segundos, o hook chama `router.refresh()`
   - O Next.js revalida os dados no servidor
   - O componente recebe os novos dados via props

2. **Atualização ao Focar**
   - Quando o usuário volta para a aba (event: `visibilitychange`)
   - Quando a janela recebe foco (event: `focus`)
   - Garante dados frescos após o usuário voltar

3. **Atualização ao Reconectar**
   - Quando a conexão é restaurada (event: `online`)
   - Sincroniza dados após perda de conexão

### Server Actions com Revalidação

Todos os server actions já usam `revalidatePath()` para invalidar o cache:

```typescript
// Exemplo: src/modules/dashboard/actions/dashboardEvents.ts
export async function createDashboardEvent(formData: FormData) {
  // ... lógica de criação
  revalidatePath('/dashboard')
  return { success: true }
}
```

**Actions que invalidam o cache:**

- ✅ `createDashboardEvent` → revalida `/dashboard`
- ✅ `updateDashboardEvent` → revalida `/dashboard`
- ✅ `deleteDashboardEvent` → revalida `/dashboard`
- ✅ `createDashboardNote` → revalida `/dashboard`
- ✅ `updateDashboardNote` → revalida `/dashboard`
- ✅ `deleteDashboardNote` → revalida `/dashboard`

## Vantagens

### Para o Usuário

- ✅ **Não precisa pressionar F5**: Dados sempre atualizados automaticamente
- ✅ **Sincronização em múltiplas abas**: Mudanças aparecem em todas as abas abertas
- ✅ **Feedback visual**: Indicador mostra quando foi a última atualização
- ✅ **Experiência fluida**: Atualizações acontecem em background

### Para o Desenvolvedor

- ✅ **Fácil de usar**: Basta chamar o hook `useAutoRefresh()`
- ✅ **Configurável**: Intervalo e comportamentos personalizáveis
- ✅ **Otimizado**: Throttling evita refreshes desnecessários
- ✅ **Performático**: Usa `router.refresh()` do Next.js (otimizado)

## Performance

### Otimizações Implementadas

1. **Throttling (5 segundos)**
   - Evita múltiplas atualizações simultâneas
   - Reduz carga no servidor e cliente

2. **Conditional Refresh**
   - Só atualiza quando necessário (foco, reconexão, intervalo)
   - Não atualiza se já foi atualizado recentemente

3. **Server-Side Caching**
   - Next.js cacheia dados automaticamente
   - `revalidatePath()` invalida apenas o necessário

4. **Client-Side Optimization**
   - `router.refresh()` é otimizado pelo Next.js
   - Atualiza apenas o que mudou no servidor

## Customização

### Alterar Intervalo de Atualização

```tsx
// Atualizar a cada 1 minuto ao invés de 30 segundos
useAutoRefresh({
  interval: 60000, // 1 minuto
})
```

### Desabilitar Refresh ao Focar

```tsx
useAutoRefresh({
  refreshOnFocus: false,
})
```

### Desabilitar Completamente

```tsx
useAutoRefresh({
  enabled: false,
})
```

## Considerações

### Custo de Requisições

- **30 segundos** = ~120 requisições/hora por usuário
- Servidor deve suportar carga de múltiplos usuários
- Considerar aumentar intervalo se necessário

### Uso de Dados Móveis

- Usuários em 3G/4G podem preferir intervalos maiores
- Futura implementação: detectar conexão e ajustar intervalo

### Bateria em Dispositivos Móveis

- Polling constante pode impactar bateria
- Considerar: só atualizar quando aba está visível

## Próximas Melhorias (Futuro)

1. **WebSockets / Server-Sent Events**
   - Push de atualizações do servidor
   - Elimina necessidade de polling

2. **Detecção de Conexão**
   - Ajustar intervalo baseado em tipo de conexão
   - Pausar em conexões lentas

3. **Configuração por Usuário**
   - Permitir usuário escolher intervalo
   - Opção de desabilitar auto-refresh

4. **Sincronização Cross-Tab**
   - Usar BroadcastChannel API
   - Evitar múltiplos polls da mesma sessão

## Testando

### Verificar Atualização Automática

1. Abra o dashboard
2. Observe o indicador "Atualizado agora"
3. Aguarde 30 segundos
4. O indicador deve atualizar automaticamente

### Verificar Atualização ao Focar

1. Abra o dashboard
2. Mude para outra aba
3. Aguarde alguns segundos
4. Volte para a aba do dashboard
5. Dados devem atualizar imediatamente

### Verificar Atualização de Dados

1. Crie um evento no calendário
2. Abra outra aba do dashboard
3. Aguarde ~30 segundos
4. O evento deve aparecer na segunda aba

## Suporte

Em caso de problemas:

1. Verifique o console do navegador
2. Confirme que `revalidatePath()` está sendo chamado
3. Teste com Network tab aberta (aba Rede)
4. Verifique logs do servidor

## Resumo

✅ **Implementado e funcionando**

- Atualização automática a cada 30 segundos
- Atualização ao focar na aba
- Atualização ao reconectar
- Indicador visual de última atualização
- Throttling para evitar refreshes excessivos
- Integrado no dashboard principal

O sistema está pronto para uso e manterá os dados sempre atualizados sem intervenção do usuário!
