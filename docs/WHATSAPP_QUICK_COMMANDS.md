# ⚡ Comandos Rápidos - WhatsApp Integration

## Setup Inicial

```powershell
# 1. Execute o script de setup
.\setup-whatsapp-integration.ps1

# OU manualmente:
pnpm install
pnpm prisma:generate
pnpm prisma migrate dev --name add-whatsapp-messages
```

## Desenvolvimento

```bash
# Iniciar servidor dev
pnpm dev

# Abrir Prisma Studio (visualizar banco)
pnpm prisma studio

# Gerar tipos do Prisma novamente
pnpm prisma:generate
```

## Testes

```powershell
# Testar webhook
.\test-whatsapp-webhook.ps1

# Testar com URL customizada
.\test-whatsapp-webhook.ps1 -Url "http://localhost:3000/api/integrations/whatsapp/webhook" -Secret "sua-chave"
```

```bash
# Teste manual com curl (Linux/Mac/Git Bash)
curl -X POST http://localhost:3000/api/integrations/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -H "X-Signature: <calcular-hmac>" \
  -d '{"event":"message","data":{"from":"5541999998888","text":"Teste"}}'
```

## URLs Importantes

```
Local:
- Painel: http://localhost:3000/messages
- Webhook: http://localhost:3000/api/integrations/whatsapp/webhook
- API Mensagens: http://localhost:3000/api/integrations/whatsapp/messages
- Prisma Studio: http://localhost:5555

Produção:
- Painel: https://SEU-APP/messages
- Webhook: https://SEU-APP/api/integrations/whatsapp/webhook
```

## Configuração Landing Page (Vercel)

```env
# Adicionar no Vercel (Production)
GESTAO_CLIENTES_WEBHOOK_URL=https://SEU-APP/api/integrations/whatsapp/webhook
GESTAO_CLIENTES_WEBHOOK_SECRET=<mesma-chave-do-env-local>
```

Após adicionar, fazer redeploy:

```bash
vercel --prod
```

## Debugging

```bash
# Ver logs em tempo real (dev)
pnpm dev

# Ver mensagens no banco
pnpm prisma studio
# → Abra WhatsAppMessage

# Limpar banco de testes
pnpm prisma migrate reset
```

## Calcular HMAC (Node.js)

```javascript
// calcular-hmac.js
const crypto = require('crypto')

const payload = '{"event":"message","data":{"from":"5541999998888"}}'
const secret = 'sua-chave-compartilhada-hmac'

const signature = crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex')

console.log('X-Signature:', signature)
```

```bash
node calcular-hmac.js
```

## Troubleshooting Rápido

| Problema             | Solução                                                  |
| -------------------- | -------------------------------------------------------- |
| 401 Unauthorized     | Verificar `WHATSAPP_WEBHOOK_SECRET` igual nos 2 lados    |
| Painel vazio         | Confirmar `NEXT_PUBLIC_MESSAGES_GATEWAY` no `.env.local` |
| Erro no banco        | Executar `pnpm prisma:generate`                          |
| Prisma not found     | `pnpm install` novamente                                 |
| Variável não carrega | Reiniciar `pnpm dev` após mudar `.env.local`             |

## Checklist de Deploy

- [ ] Variáveis configuradas no `.env.local`
- [ ] Migração aplicada: `pnpm prisma migrate deploy`
- [ ] App acessível publicamente (não localhost)
- [ ] Landing Page configurada com webhook URL
- [ ] Mesma chave HMAC nos dois lados
- [ ] Testado com `test-whatsapp-webhook.ps1`
- [ ] Painel `/messages` funciona

## Recursos

- 📖 [Documentação Completa](docs/WHATSAPP_LP_INTEGRATION.md)
- ✨ [Criação Automática de Leads](docs/WHATSAPP_AUTO_LEAD_CREATION.md) - **NOVO!**
- 📖 [README Rápido](WHATSAPP_INTEGRATION_README.md)
- 🔧 [Schema Prisma](prisma/schema.prisma) - modelo `WhatsAppMessage`
- 🌐 [Painel](src/app/messages/page.tsx)
- 🔗 [Webhook](src/app/api/integrations/whatsapp/webhook/route.ts)

## Próximos Passos

1. **Autenticação**: Adicionar proteção ao painel `/messages`
2. **Notificações**: Implementar WebSockets para alertas em tempo real
3. **Associação**: Auto-link mensagens com clientes por telefone
4. **Templates**: Criar respostas rápidas predefinidas
5. **Métricas**: Dashboard com estatísticas de conversas
