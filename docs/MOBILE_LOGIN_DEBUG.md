# 🔧 Diagnostic: Login em Mobile

## Problema Relatado

- Usuário clica para fazer login em mobile
- Aparece tela de escolher conta do Google
- Após seleção, volta para página de login (não faz o login)

## Ferramentas de Debug

### 1. Verificar Estado (Browser Console)

Em desktop, abra DevTools (F12) e execute no console:

```javascript
// Ver se o app detectou como mobile
fetch('/api/debug/auth-flow')
  .then((r) => r.json())
  .then(console.log)
```

### 2. Ativar Logs Detalhados

```bash
# No arquivo .env.local, adicione:
NEXT_PUBLIC_DEBUG_AUTH=true

# Depois rode:
npm run dev
```

Isso vai ativar logs no console mostrando:

- Se foi detectado mobile
- Qual método está sendo usado (redirect vs popup)
- Sucesso/erro em cada etapa

### 3. Ver Debug Visual

Em desenvolvimento, há um badge no canto inferior direito mostrando:

- ✓/✗ Mobile detection
- ✓/✗ Loading status
- User email (se logado)
- Pending redirect flag
- Invite token status

### 4. Teste Passo-a-Passo em Mobile

#### Setup

1. `npm run dev` (rodando em localhost)
2. No celular (mesmo Wi-Fi): `http://192.168.X.X:3000/login`
   - Encontre o IP rodando: `ipconfig getifaddr en0` (Mac) ou `ipconfig` (Windows)

#### Teste 1: Login Simples

1. Abra Console do navegador (Safari: develop, Chrome: DevTools)
2. Clique "Continuar com Google"
3. Selecione conta
4. Observe:
   - ✓ Volta para a página?
   - ✓ Badge mostra "User: seu@email.com"?
   - ✓ Redireciona para dashboard?

#### Teste 2: Verificar Logs

1. No console, execute:
   ```javascript
   localStorage.getItem('pendingAuthRedirect') // Deve ser 'true' durante redirect
   sessionStorage.getItem('pendingInviteToken') // Null se sem convite
   document.cookie // Ver se cookie 'auth' existe
   ```

#### Teste 3: Testar Session API

1. No console do navegador:
   ```javascript
   fetch('/api/session')
     .then((r) => r.json())
     .then(console.log)
   ```

   - Deve retornar user, orgId, role
   - Se 401, sessão não foi criada

#### Teste 4: Testar Debug Endpoint

1. No console:
   ```javascript
   fetch('/api/debug/auth-flow')
     .then((r) => r.json())
     .then(console.log)
   ```

   - Deve mostrar mobile: true
   - Session user: null ou email
   - Auth cookie: true/false

### Possíveis Causas

#### 1. **CSP bloqueando redirect**

- Sintomas: Redirect começa mas para na metade
- Solução: Verificar console do navegador por erro CSP
- Verificar se `https://accounts.google.com` está em `frame-src`

#### 2. **Cookies não sendo salvos**

- Sintomas: Volta do Google mas não loga
- Solução: Verificar `Secure`, `SameSite` settings
- Em development sem HTTPS, `secure: false` é OK
- Mas `sameSite: 'strict'` pode bloquear

#### 3. **Sessão API falhando silenciosamente**

- Sintomas: Token é válido mas /api/session retorna 401
- Verificar logs do servidor
- POST /api/session pode estar falhando

#### 4. **Rate limit ou validação**

- Sintomas: Primeira tentativa funciona, segunda não
- Verificar /api/session rate limit
- Verificar Firebase rate limits

## Próximos Passos

1. **Execute os testes acima** e compartilhe:
   - O que aparece no console?
   - Qual erro você vê?
   - Mobile é detectado como `true`?

2. **Se conseguir reproduzir localmente**, ative debug:

   ```bash
   NEXT_PUBLIC_DEBUG_AUTH=true npm run dev
   ```

   E compartilhe os logs do console

3. **Verifique em produção também**:
   - O erro ocorre em produção (Netlify)?
   - Ou apenas em localhost em mobile?

## Suspeitamos

- [ ] CSP está bloqueando o callback do Google
- [ ] Cookies não estão sendo salvos em mobile
- [ ] Session API está retornando erro silenciosamente
- [ ] Rate limit está bloqueando após primeira tentativa
