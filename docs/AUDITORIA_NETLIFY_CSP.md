# 🔍 Auditoria Completa: Problemas de Deploy no Netlify

**Data:** 07/12/2025  
**Ambiente:** Netlify + Next.js 16 + Middleware

---

## 📋 Problemas Identificados

### 1. **Conflito de CSP entre Netlify e Next.js**

**Sintoma:**

```
Refused to execute inline script because it violates the following Content Security Policy directive:
"script-src-elem 'self' 'nonce-XXX' ..."
```

**Causa Raiz:**

- O Netlify Next.js plugin (`@netlify/plugin-nextjs` v5.15.1) injeta automaticamente um CSP com nonce dinâmico
- O middleware do Next.js também tenta aplicar CSP
- Os nonces não são sincronizados, causando conflito
- Scripts inline do Next.js não têm acesso ao nonce do Netlify

**Evidências:**

- `public/_headers`: Define CSP com `'unsafe-inline'`
- `next.config.ts`: Define CSP com `'unsafe-inline'`
- `src/proxy.ts`: Define CSP com `'unsafe-inline'`
- Netlify sobrescreve tudo com CSP próprio usando nonce

---

### 2. **Múltiplas Fontes de CSP (Redundância)**

**Configurações Atuais:**

1. `public/_headers` → CSP estático
2. `next.config.ts` → CSP via Next.js headers()
3. `src/proxy.ts` → CSP via middleware
4. Netlify plugin → CSP automático com nonce

**Problema:** Ordem de precedência não é clara, causando conflitos

---

### 3. **Middleware vs Edge Functions**

**Status Atual:**

- Middleware está ativo e sendo compilado
- Netlify converte middleware para Edge Functions
- Edge Functions têm limitações diferentes do Node.js

**Risco:** Possíveis incompatibilidades futuras com código Node.js no middleware

---

## ✅ Solução Definitiva Recomendada

### **Opção A: Desabilitar CSP do Netlify (RECOMENDADO)**

**Ação:** Configurar o Netlify para não injetar CSP automático

**Implementação:**

1. **Criar arquivo `netlify.toml` atualizado:**

```toml
[build]
  command = "pnpm install --frozen-lockfile && pnpm run prisma:generate && pnpm run build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "20"
  PNPM_VERSION = "9"
  SECRETS_SCAN_SMART_DETECTION_ENABLED = "false"

# Desabilitar injeção automática de headers pelo plugin
[[plugins]]
  package = "@netlify/plugin-nextjs"

# Apenas para rotas específicas que não passam pelo middleware
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "SAMEORIGIN"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
```

2. **Remover CSP de `public/_headers`:**

```
# Security headers for production (SEM CSP - gerenciado pelo middleware)
/*
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
```

3. **Remover CSP de `next.config.ts`:**

```typescript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        {
          key: 'Permissions-Policy',
          value: 'accelerometer=(), camera=(), geolocation=(), microphone=(), payment=(), usb=()',
        },
        // CSP removido - gerenciado pelo middleware
      ],
    },
  ]
}
```

4. **Manter CSP APENAS no middleware (`src/proxy.ts`):**

O middleware já está correto com `'unsafe-inline'`.

---

### **Opção B: Remover Middleware (Alternativa)**

**Ação:** Mover lógica de autenticação do middleware para Server Components

**Vantagens:**

- Sem conflitos com Edge Functions
- Mais controle sobre CSP
- Melhor para Netlify

**Desvantagens:**

- Refatoração significativa
- Perda de proteção global de rotas
- Cada página precisa validar auth individualmente

---

### **Opção C: Usar apenas Headers Estáticos**

**Ação:** Desabilitar middleware completamente e usar apenas `_headers`

```toml
# netlify.toml - adicionar
[[edge_functions]]
  path = "/*"
  function = "next"
```

```
# _headers
/*
  X-Frame-Options: SAMEORIGIN
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com https://*.googletagmanager.com https://www.gstatic.com https://us.i.posthog.com; script-src-elem 'self' 'unsafe-inline' https://accounts.google.com https://apis.google.com https://*.googletagmanager.com https://www.gstatic.com https://us.i.posthog.com; worker-src 'self' blob:; connect-src 'self' https://*.googleapis.com https://apis.google.com https://*.firebaseio.com https://*.cloudfunctions.net wss://*.firebaseio.com https://*.ingest.us.sentry.io https://*.ingest.sentry.io https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://*.google.com https://www.googleapis.com https://*.r2.cloudflarestorage.com https://us.i.posthog.com https://*.posthog.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.gstatic.com; font-src 'self' data: https://fonts.gstatic.com https://www.gstatic.com; img-src 'self' data: https: blob:; media-src 'self' https://*.r2.cloudflarestorage.com blob: data:; frame-src 'self' https://accounts.google.com https://*.firebaseapp.com; form-action 'self' https://accounts.google.com; frame-ancestors 'self'
```

---

## 🎯 Plano de Implementação Recomendado (Opção A)

### Passo 1: Limpar Configurações CSP

```bash
# 1. Remover CSP de public/_headers (manter apenas security headers básicos)
# 2. Remover CSP de next.config.ts
# 3. Manter CSP APENAS em src/proxy.ts
```

### Passo 2: Atualizar netlify.toml

Adicionar configuração para desabilitar injeção automática do plugin.

### Passo 3: Testar Localmente

```bash
pnpm run build
pnpm run start
# Verificar no browser: DevTools > Network > Headers
```

### Passo 4: Deploy de Teste

```bash
git add .
git commit -m "fix: simplify CSP configuration for Netlify"
git push
```

### Passo 5: Validar em Produção

1. Verificar console do browser (sem erros de CSP)
2. Testar login
3. Testar navegação entre páginas
4. Verificar headers com DevTools

---

## 📊 Comparação de Opções

| Aspecto                     | Opção A (Middleware CSP) | Opção B (Sem Middleware) | Opção C (Headers Estáticos) |
| --------------------------- | ------------------------ | ------------------------ | --------------------------- |
| **Complexidade**            | 🟢 Baixa                 | 🔴 Alta                  | 🟢 Baixa                    |
| **Segurança**               | 🟡 Média                 | 🟢 Alta\*                | 🟡 Média                    |
| **Manutenção**              | 🟢 Fácil                 | 🔴 Difícil               | 🟢 Fácil                    |
| **Performance**             | 🟢 Boa                   | 🟢 Ótima                 | 🟢 Boa                      |
| **Compatibilidade Netlify** | 🟡 Requer Config         | 🟢 Perfeita              | 🟢 Perfeita                 |
| **Refatoração**             | 🟢 Mínima                | 🔴 Extensa               | 🟡 Moderada                 |

\*Se implementado corretamente com nonces

---

## 🚨 Riscos e Mitigações

### Risco 1: CSP muito permissivo (`unsafe-inline`)

**Mitigação:**

- Listar explicitamente todos os domínios permitidos
- Monitorar violações de CSP
- Planejar migração para nonces no futuro

### Risco 2: Middleware não funcionar em Edge

**Mitigação:**

- Testar extensivamente no Netlify
- Ter fallback para headers estáticos
- Monitorar logs de Edge Functions

### Risco 3: Mudanças no Netlify plugin

**Mitigação:**

- Fixar versão do plugin
- Monitorar changelog
- Ter plano B (Opção C)

---

## 📝 Checklist de Implementação

- [ ] Fazer backup do código atual
- [ ] Remover CSP duplicado de `public/_headers`
- [ ] Remover CSP de `next.config.ts`
- [ ] Manter CSP apenas em `src/proxy.ts`
- [ ] Atualizar `netlify.toml` (se necessário)
- [ ] Testar build local
- [ ] Testar em ambiente de staging
- [ ] Deploy em produção
- [ ] Validar headers no browser
- [ ] Testar todas as funcionalidades
- [ ] Monitorar erros por 24h

---

## 🔧 Comandos Úteis

```bash
# Verificar CSP atual
curl -I https://seu-app.netlify.app | grep -i content-security

# Build local
pnpm run build

# Testar localmente
pnpm run start

# Ver logs do Netlify
netlify dev

# Deploy de teste
git push origin feature/fix-csp
```

---

## 📚 Referências

- [Next.js Middleware Docs](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Netlify Next.js Plugin](https://github.com/netlify/next-runtime)
- [CSP Best Practices](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Netlify Headers](https://docs.netlify.com/routing/headers/)

---

## 💡 Recomendação Final

**IMPLEMENTAR OPÇÃO A imediatamente:**

1. Simplificar para CSP em um único lugar (middleware)
2. Remover redundâncias em `_headers` e `next.config.ts`
3. Usar `'unsafe-inline'` temporariamente
4. Planejar migração para nonces depois que tudo estiver estável

**Tempo estimado:** 30 minutos  
**Risco:** Baixo  
**Impacto:** Resolve problema imediatamente
