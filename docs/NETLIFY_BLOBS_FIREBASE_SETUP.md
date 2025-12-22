# Configuração Firebase via Netlify Blobs

## Contexto

O Firebase Admin SDK requer uma chave privada de ~1.7KB. Quando somada às outras 30+ variáveis de ambiente, ultrapassávamos o limite de 4KB do AWS Lambda, causando falhas nos deploys do Netlify.

**Solução:** Mover as credenciais Firebase para Netlify Blobs, economizando ~1700 bytes de env vars.

## Arquitetura

```
┌─────────────────────────────────────────────┐
│ src/lib/firebase-credentials.ts             │
│ ┌─────────────────────────────────────────┐ │
│ │ getFirebaseCredentials() [ASYNC]        │ │
│ │  1. Tenta Netlify Blobs primeiro         │ │
│ │  2. Fallback para env vars               │ │
│ │  3. Cache in-memory                      │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ getFirebaseCredentialsSync() [SYNC]     │ │
│ │  - Usa apenas env vars                   │ │
│ │  - Para contextos sem async              │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
           │                │
           ▼                ▼
    ┌─────────┐      ┌──────────┐
    │ Netlify │      │   .env   │
    │  Blobs  │      │   vars   │
    │ (prod)  │      │  (dev)   │
    └─────────┘      └──────────┘
```

## Benefícios

✅ **Economia:** Remove ~1700 bytes de env vars  
✅ **Segurança:** Chaves privadas não ficam em env vars públicas  
✅ **Compatibilidade:** Fallback automático para dev local  
✅ **Performance:** Cache in-memory evita lookups repetidos

## Passo a Passo

### 1. Instalar Dependência

```bash
pnpm add @netlify/blobs
```

### 2. Fazer Upload das Credenciais

**Opção A: Via Script (Recomendado)**

```bash
# Certifique-se de ter as credenciais em .env.local
node scripts/upload-firebase-to-blobs.mjs
```

**Opção B: Via Netlify CLI Manual**

```bash
# Instalar e autenticar Netlify CLI
npm install -g netlify-cli
netlify login
netlify link

# Fazer upload das credenciais
netlify blobs:set firebase-secrets project_id "seu-project-id"
netlify blobs:set firebase-secrets client_email "email@serviceaccount.com"
netlify blobs:set firebase-secrets private_key "-----BEGIN PRIVATE KEY-----\n..."
```

### 3. Remover Env Vars do Netlify

No Netlify Dashboard → Site Settings → Environment Variables:

**REMOVER:**

- ❌ `FIREBASE_PRIVATE_KEY`
- ❌ `FIREBASE_CLIENT_EMAIL`

**MANTER:**

- ✅ `NEXT_PUBLIC_FIREBASE_PROJECT_ID` (ainda necessária no client-side)

### 4. Deploy

```bash
git add .
git commit -m "feat: move Firebase credentials to Netlify Blobs"
git push origin master
```

## Como Funciona

### Em Produção (Netlify)

```typescript
// src/lib/firebaseAdmin.ts
const creds = getFirebaseCredentialsSync()
// 1. Tenta carregar do Netlify Blobs (async)
// 2. Se disponível, usa as credenciais do Blobs
// 3. Cache in-memory para próximas chamadas
```

### Em Desenvolvimento (Local)

```typescript
// Fallback automático para .env.local
const creds = getFirebaseCredentialsSync()
// 1. Netlify Blobs não disponível localmente
// 2. Usa FIREBASE_PRIVATE_KEY e FIREBASE_CLIENT_EMAIL
// 3. Nenhuma mudança necessária no workflow dev
```

## Verificação

### Testar Localmente (deve usar env vars)

```bash
pnpm dev
# Deve ver nos logs: "Firebase initialized successfully (source: env)"
```

### Verificar em Produção (deve usar Blobs)

```bash
# Deploy e verificar logs do Netlify
# Deve ver: "Firebase initialized successfully (source: blobs)"
```

### Listar Secrets no Netlify Blobs

```bash
netlify blobs:list firebase-secrets
# Deve mostrar: project_id, client_email, private_key
```

## Troubleshooting

### ❌ Erro: "Cannot find module '@netlify/blobs'"

```bash
pnpm add @netlify/blobs
```

### ❌ Erro: "NETLIFY_SITE_ID not found"

```bash
# Opção 1: Linkar site
netlify link

# Opção 2: Definir manualmente
export NETLIFY_SITE_ID="seu-site-id"
export NETLIFY_AUTH_TOKEN="seu-token"
```

### ❌ Deploy falha com "Firebase credentials not found"

1. Verifique se o upload foi feito corretamente:
   ```bash
   netlify blobs:get firebase-secrets project_id
   ```
2. Certifique-se de NÃO ter removido `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
3. Verifique logs do Netlify para mensagens específicas

### ❌ Local funciona, mas produção falha

1. Verifique se as credenciais foram removidas das env vars do Netlify
2. Confirme que o upload para Blobs foi bem-sucedido
3. Trigger novo deploy após mudanças

## Migração de Volta (Rollback)

Se precisar reverter para env vars:

1. No Netlify Dashboard, adicione de volta:

   ```
   FIREBASE_PRIVATE_KEY=...
   FIREBASE_CLIENT_EMAIL=...
   ```

2. Remova a lógica de Blobs:
   ```bash
   git revert <commit-hash>
   ```

O código tem fallback automático, então ambos os métodos podem coexistir.

## Estimativa de Economia

### Antes

```
Total env vars: ~4350 bytes
Lambda limit:    4096 bytes
Status: ❌ Deploy fails
```

### Depois

```
Total env vars: ~2650 bytes (removido FIREBASE_PRIVATE_KEY ~1700 bytes)
Lambda limit:    4096 bytes
Status: ✅ Deploy succeeds
Margem: ~1400 bytes livres
```

## Referências

- [Netlify Blobs Documentation](https://docs.netlify.com/blobs/overview/)
- [AWS Lambda Environment Variables Limits](https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html)
- [Firebase Admin SDK Setup](https://firebase.google.com/docs/admin/setup)

## Changelog

- **2024-01**: Implementação inicial do Netlify Blobs para Firebase credentials
- **Issue:** Deploy falhando por exceder 4KB de env vars
- **Solution:** Move private_key (~1.7KB) e client_email para Netlify Blobs
