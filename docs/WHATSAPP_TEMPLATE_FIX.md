# Fix para Templates WhatsApp

## Problema Identificado

Dos logs fornecidos:

```
[WhatsApp API] ❌ Erro ao enviar template novo_lead_interno: Error: Error sending template: (#100) Invalid parameter
```

### Template: `lead_confirmation` ✅ FUNCIONANDO

- Parâmetros enviados: **4**
- Status: **Sucesso**

### Template: `novo_lead_interno` ❌ FALHANDO

- Parâmetros enviados: **10**
  1. name
  2. email
  3. phone
  4. service
  5. shift1
  6. shift2
  7. traffic_type
  8. traffic_source
  9. url
  10. timestamp

- Erro: `(#100) Invalid parameter`

## Causas Possíveis

1. **Template no Meta aceita menos de 10 parâmetros**  
   O template `novo_lead_interno` configurado no Meta Business Manager tem menos placeholders ({{1}}, {{2}}, etc.) do que os 10 parâmetros sendo enviados.

2. **Ordem dos parâmetros incorreta**  
   Os parâmetros estão sendo enviados em ordem diferente da configurada no template.

3. **Tipo de componente errado**  
   Parâmetros de BODY, HEADER ou BUTTON não estão alinhados com a estrutura do template.

## Solução

### Opção 1: Ajustar Template no Meta Business Manager

1. Acesse: [Meta Business Manager](https://business.facebook.com/)
2. Vá em **WhatsApp Manager** → **Message Templates**
3. Encontre o template `novo_lead_interno`
4. Verifique quantos placeholders existem no template:
   - Body: {{1}}, {{2}}, {{3}}...
   - Header: se tem placeholder
   - Buttons: se tem placeholder dinâmico

5. **Compare com os 10 parâmetros enviados**

6. Se o template tem menos de 10 placeholders, você tem 2 opções:
   - **A)** Adicionar mais placeholders no template
   - **B)** Reduzir parâmetros na Landing Page (ver Opção 2)

### Opção 2: Reduzir Parâmetros na Landing Page

Se você não quer/pode editar o template no Meta, ajuste a Landing Page para enviar apenas os parâmetros necessários.

**Exemplo:** Se o template aceita apenas 5 parâmetros:

```typescript
// Landing Page - ajustar para enviar menos parâmetros
const templateParams = [
  name,
  email,
  phone,
  service,
  timestamp, // apenas 5 em vez de 10
]
```

### Opção 3: Verificar Estrutura do Template

O template pode ter uma estrutura como:

```
HEADER: Sem placeholder (imagem fixa)
BODY:
Novo lead recebido!
Nome: {{1}}
Email: {{2}}
Telefone: {{3}}
Serviço: {{4}}
Horários: {{5}} e {{6}}

FOOTER: Atendimento automatizado
BUTTONS: [Ver detalhes]
```

Se esse é o caso, são **6 parâmetros no BODY**, não 10.

## Verificação Rápida

1. **Conte os placeholders no template original:**

   ```
   {{1}}, {{2}}, {{3}}... quantos tem?
   ```

2. **Se tem 6 placeholders mas está enviando 10:**
   - Ajuste Landing Page para enviar apenas 6
   - Ou adicione 4 placeholders no template

3. **Teste com `lead_confirmation` como referência:**
   - Ele funciona com 4 parâmetros
   - Use a mesma estrutura para `novo_lead_interno`

## Como Verificar o Template no Meta

```bash
# Via Meta API (se tiver token):
curl -X GET "https://graph.facebook.com/v18.0/{WABA_ID}/message_templates?name=novo_lead_interno" \
  -H "Authorization: Bearer {ACCESS_TOKEN}"
```

Isso retorna a estrutura exata do template, incluindo:

- Número de componentes (header, body, footer, buttons)
- Número de placeholders em cada componente
- Tipo de cada parâmetro (text, currency, date_time)

## Próximos Passos

1. ✅ Prisma Client regenerado (campo `isRead` agora funciona)
2. ⏳ Verificar configuração do template `novo_lead_interno` no Meta
3. ⏳ Ajustar parâmetros na Landing Page **OU** no Meta
4. ⏳ Testar novamente o envio do formulário

## Contato

Se precisar de ajuda para ajustar a Landing Page, me avise e vou precisar de:

- Acesso ao código da Landing Page (repo/arquivo onde envia o template)
- Ou acesso ao Meta Business Manager para verificar o template
