# Guia para Testar Login - Correção do Erro "exp" Claim

## Problema Corrigido

O erro "Developer claim 'exp' is reserved and cannot be specified" foi corrigido na Session API.

### O que foi o problema?
- O Firebase Admin SDK não permite configurar manualmente o claim "exp" (expiration)
- Este claim é calculado automaticamente pelo Firebase com base no TTL do token
- Tentamos forçar uma expiração customizada que não é permitida

### A Solução
- Removido o claim `exp` do custom token
- Agora usamos um claim `refreshExpiry` separado para armazenar a data de renovação esperada
- O Firebase calcula automaticamente o `exp` baseado no TTL padrão (1 hora)

## Como Testar

### 1. Limpar cache (já feito)
```bash
rm -rf .next
```

### 2. Iniciar o servidor dev
```bash
pnpm dev
```

### 3. Acessar o login
- Navegue para: `http://localhost:3000/login`
- O servidor deve compilar sem erros de source map
- Nenhum erro de Firebase "exp claim" deve aparecer

### 4. Fazer o login
1. Clique em "Login with Google" ou use suas credenciais
2. Confirme que:
   - ✅ Não há erro de claim "exp" no console
   - ✅ Cookies são criados (auth + refresh)
   - ✅ Você é redirecionado para a página apropriada
   - ✅ POST /api/session retorna status 200

### 5. Verificar a resposta da Session API
No console do navegador, a resposta deve ser:
```json
{
  "ok": true,
  "nextPath": "/dashboard",
  "accessToken": "...",
  "refreshToken": "...",
  "expiresIn": 3600
}
```

## Notas Técnicas

### Firebase Custom Token Behavior
- TTL padrão: 1 hora (3600 segundos)
- Claims customizados: Você pode adicionar qualquer claim EXCETO: `exp`, `nbf`, `iat`, `iss`, `aud`
- O Firebase calcula automaticamente `exp = iat + 3600`

### Refresh Token Strategy
- O custom token tem TTL de 1 hora (calculado automaticamente)
- Armazenamos a data esperada de expiração em `refreshExpiry` (30 dias)
- O cliente deve renovar o token ANTES de 1 hora
- Após 30 dias, será necessário fazer login novamente

## Próximos Passos

Se o login funcionar:
1. ✅ Testar navegação na dashboard
2. ✅ Testar logout
3. ✅ Testar refresh token (aguardar > 1 hora)
4. ✅ Proceder para Task 5 (Validação de Permissões)

## Troubleshooting

Se ainda houver erros:
1. Verifica se `.env.local` tem as credenciais Firebase corretas
2. Verifica se a conta Firebase está ativa no projeto
3. Limpa novamente com: `rm -rf .next && pnpm dev`
4. Verifica os logs do console do navegador (F12)
