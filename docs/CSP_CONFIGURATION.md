# 🛡️ Configuração de Content Security Policy (CSP)

## 📋 Visão Geral

O projeto utiliza uma **fonte única de CSP** no middleware Next.js para evitar conflitos com o Netlify plugin.

## 🎯 Arquitetura Escolhida

**✅ Opção Implementada: Fonte Única no Middleware**

### Por que essa arquitetura?

1. **Evita conflitos**: Netlify plugin (`@netlify/plugin-nextjs`) injeta CSP automaticamente em Edge Functions
2. **Controle total**: Middleware Next.js tem acesso completo ao request/response
3. **Flexibilidade**: Pode ajustar CSP dinamicamente baseado em condições
4. **Sem nonce**: Elimina problemas de sincronização entre build e runtime

## 📁 Estrutura de Arquivos

```
src/
├── proxy.ts              ← ✅ CSP definido AQUI (única fonte)
└── lib/nonce.ts          ← Simplificado (retorna undefined)

public/
└── _headers              ← ❌ Sem CSP, apenas security headers básicos

next.config.ts            ← ❌ Sem CSP, apenas security headers básicos

netlify.toml              ← Configuração básica do plugin
```

## 🔧 Arquivo Principal: `src/proxy.ts`

```typescript
// CSP Header completo com unsafe-inline
const cspHeader = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com ...",
  "script-src-elem 'self' 'unsafe-inline' https://accounts.google.com ...",
  "connect-src 'self' https://*.googleapis.com ...",
  // ... demais diretivas
].join('; ')

response.headers.set('Content-Security-Policy', cspHeader)
```

### Diretivas Importantes

| Diretiva          | Valor                         | Motivo                           |
| ----------------- | ----------------------------- | -------------------------------- |
| `script-src`      | `'unsafe-inline'`             | Next.js inline scripts           |
| `script-src-elem` | `'unsafe-inline'`             | External scripts do Google OAuth |
| `connect-src`     | Firebase + R2 + Sentry        | APIs de terceiros                |
| `frame-src`       | `https://accounts.google.com` | Login OAuth                      |
| `img-src`         | `data: https: blob:`          | Imagens dinâmicas                |

## 🚫 O que NÃO fazer

### ❌ Não adicionar CSP em múltiplos lugares

```typescript
// ❌ ERRADO - Causa conflitos
// public/_headers
Content-Security-Policy: ...

// next.config.ts
{ key: 'Content-Security-Policy', value: '...' }

// src/proxy.ts
response.headers.set('Content-Security-Policy', ...)
```

### ❌ Não usar nonces com Netlify

```typescript
// ❌ ERRADO - Netlify gera nonce próprio que Next.js não acessa
const nonce = crypto.randomUUID();
script-src 'nonce-${nonce}'
```

## ✅ Como Modificar CSP

### 1. Adicionar novo domínio permitido

Edite `src/proxy.ts`:

```typescript
const cspHeader = [
  // ...
  "connect-src 'self' https://novo-dominio.com https://*.googleapis.com ...",
  // ...
].join('; ')
```

### 2. Adicionar nova diretiva

```typescript
const cspHeader = [
  // ...
  "object-src 'none'", // Nova diretiva
  // ...
].join('; ')
```

### 3. Testar localmente

```bash
pnpm run build
pnpm run start
# Abrir http://localhost:3000 e verificar DevTools > Network > Headers
```

### 4. Validar no Netlify

```bash
git add src/proxy.ts
git commit -m "feat: update CSP configuration"
git push
# Aguardar deploy e verificar console do navegador
```

## 🔍 Debug de CSP

### Verificar headers no navegador

1. DevTools > Network > (Selecionar página)
2. Headers > Response Headers > `content-security-policy`
3. Deve mostrar **apenas um** CSP (do middleware)

### Erros comuns

| Erro                               | Causa                   | Solução                          |
| ---------------------------------- | ----------------------- | -------------------------------- |
| `Refused to execute inline script` | CSP muito restritivo    | Adicionar `'unsafe-inline'`      |
| `Multiple CSP headers`             | CSP duplicado           | Remover de \_headers/next.config |
| `Nonce mismatch`                   | Netlify nonce ≠ Next.js | Não usar nonces                  |

## 📊 Comparação com outras abordagens

| Abordagem              | Prós                                                 | Contras                                     | Veredicto        |
| ---------------------- | ---------------------------------------------------- | ------------------------------------------- | ---------------- |
| **Middleware (atual)** | ✅ Controle total<br>✅ Sem conflitos<br>✅ Dinâmico | ⚠️ Requer Edge Functions                    | ✅ **ESCOLHIDA** |
| Múltiplos arquivos     | ✅ Familiar                                          | ❌ Conflitos<br>❌ Precedência imprevisível | ❌ Evitar        |
| Apenas \_headers       | ✅ Simples                                           | ❌ Estático<br>❌ Sem contexto              | ⚠️ Backup        |

## 🔐 Security Checklist

- [x] CSP definido em apenas um local
- [x] `'unsafe-inline'` presente apenas onde necessário
- [x] Domínios de terceiros explicitamente listados
- [x] `frame-ancestors 'self'` para prevenir clickjacking
- [x] `form-action` restrito
- [x] `object-src 'none'` para desabilitar plugins

## 📚 Referências

- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Netlify Next.js Plugin](https://github.com/netlify/netlify-plugin-nextjs)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Auditoria Completa](./AUDITORIA_NETLIFY_CSP.md)

## 📝 Changelog

| Data       | Mudança                               | Autor |
| ---------- | ------------------------------------- | ----- |
| 2024-01-XX | Migração para CSP único no middleware | -     |
| 2024-01-XX | Remoção de nonces                     | -     |
| 2024-01-XX | Documentação criada                   | -     |

---

**⚠️ IMPORTANTE**: Sempre testar mudanças de CSP localmente antes do deploy!
