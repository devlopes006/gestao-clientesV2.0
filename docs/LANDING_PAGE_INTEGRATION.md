# Landing Page Integration - /api/leads

## Implementação completa do envio de leads com HMAC

### 1. Variáveis de ambiente na Landing Page

```bash
# .env ou .env.local
GESTAO_CLIENTES_LEADS_URL=https://mygest.netlify.app/api/leads
GESTAO_CLIENTES_WEBHOOK_SECRET=seu-secret-compartilhado-aqui
```

### 2. Código TypeScript/JavaScript (Landing Page)

```typescript
// lib/gestaoClientesAPI.ts
import crypto from 'crypto'

interface LeadData {
  name: string
  email?: string
  phone?: string
  plan?: string
  bestTime?: string
  utmParams?: {
    utm_source?: string
    utm_medium?: string
    utm_campaign?: string
    utm_term?: string
    utm_content?: string
  }
  origin?: string
}

/**
 * Envia lead capturado para o sistema Gestão de Clientes
 */
export async function sendLeadToGestao(leadData: LeadData) {
  const url = process.env.GESTAO_CLIENTES_LEADS_URL
  const secret = process.env.GESTAO_CLIENTES_WEBHOOK_SECRET

  if (!url || !secret) {
    console.error('GESTAO_CLIENTES_LEADS_URL ou SECRET não configurados')
    throw new Error('Configuração de integração faltando')
  }

  // Validação básica
  if (!leadData.name) {
    throw new Error('Nome é obrigatório')
  }

  if (!leadData.email && !leadData.phone) {
    throw new Error('Email ou telefone é obrigatório')
  }

  // Preparar payload
  const payload = JSON.stringify({
    name: leadData.name,
    email: leadData.email || null,
    phone: leadData.phone || null,
    plan: leadData.plan || null,
    bestTime: leadData.bestTime || null,
    utmParams: leadData.utmParams || {},
    origin: leadData.origin || 'landing_page_conversao_extrema',
  })

  // Calcular HMAC-SHA256 signature
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')

  console.log('[Gestão API] Enviando lead:', {
    name: leadData.name,
    hasEmail: !!leadData.email,
    hasPhone: !!leadData.phone,
  })

  // Enviar requisição
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Signature': signature, // ou 'X-Webhook-Signature': `sha256=${signature}`
    },
    body: payload,
  })

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Unknown error' }))
    console.error('[Gestão API] Erro ao enviar lead:', error)
    throw new Error(`Erro ao enviar lead: ${response.status}`)
  }

  const result = await response.json()
  console.log('[Gestão API] Lead enviado com sucesso:', result)

  return result
}
```

### 3. Uso no formulário da Landing Page

```typescript
// app/api/submit-form/route.ts (Next.js API Route)
import { NextRequest, NextResponse } from 'next/server'
import { sendLeadToGestao } from '@/lib/gestaoClientesAPI'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Capturar UTM params da URL ou cookies
    const utmParams = {
      utm_source: body.utm_source || request.cookies.get('utm_source')?.value,
      utm_medium: body.utm_medium || request.cookies.get('utm_medium')?.value,
      utm_campaign:
        body.utm_campaign || request.cookies.get('utm_campaign')?.value,
    }

    // Enviar para Gestão de Clientes (em paralelo com WhatsApp)
    const [gestaoResult] = await Promise.allSettled([
      sendLeadToGestao({
        name: body.name,
        email: body.email,
        phone: body.phone,
        plan: body.plan,
        bestTime: body.bestTime,
        utmParams,
        origin: 'landing_page_conversao_extrema',
      }),
      // Aqui você mantém o envio do template WhatsApp como antes
      // sendWhatsAppTemplate(body.phone, 'lead_confirmation', {...})
    ])

    if (gestaoResult.status === 'rejected') {
      console.error('Erro ao enviar para Gestão:', gestaoResult.reason)
      // Não falhar a requisição se só o Gestão falhou
    }

    return NextResponse.json({
      success: true,
      message: 'Formulário enviado com sucesso',
      gestaoSynced: gestaoResult.status === 'fulfilled',
    })
  } catch (error) {
    console.error('Erro ao processar formulário:', error)
    return NextResponse.json(
      { success: false, error: 'Erro ao processar formulário' },
      { status: 500 }
    )
  }
}
```

### 4. Exemplo com React Client Component

```typescript
// components/LeadForm.tsx
'use client'

import { useState } from 'react'

export function LeadForm() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      plan: formData.get('plan') as string,
      bestTime: formData.get('bestTime') as string,
    }

    try {
      const response = await fetch('/api/submit-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Erro ao enviar')

      setSuccess(true)
    } catch (error) {
      console.error('Erro:', error)
      alert('Erro ao enviar formulário')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-lg bg-green-100 p-4 text-green-800">
        <h3 className="font-bold">Obrigado!</h3>
        <p>Entraremos em contato em breve.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        name="name"
        placeholder="Nome completo"
        required
        className="w-full rounded border p-2"
      />

      <input
        type="email"
        name="email"
        placeholder="E-mail"
        className="w-full rounded border p-2"
      />

      <input
        type="tel"
        name="phone"
        placeholder="Telefone (11987654321)"
        required
        className="w-full rounded border p-2"
      />

      <select name="plan" className="w-full rounded border p-2">
        <option value="">Selecione um plano</option>
        <option value="basico">Básico</option>
        <option value="premium">Premium</option>
        <option value="empresarial">Empresarial</option>
      </select>

      <select name="bestTime" className="w-full rounded border p-2">
        <option value="">Melhor horário para contato</option>
        <option value="Manhã (9h-12h)">Manhã (9h-12h)</option>
        <option value="Tarde (14h-18h)">Tarde (14h-18h)</option>
        <option value="Noite (19h-21h)">Noite (19h-21h)</option>
      </select>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Enviando...' : 'Quero ser cliente'}
      </button>
    </form>
  )
}
```

### 5. Verificação de HMAC (já implementado no Gestão)

O sistema Gestão já valida automaticamente a assinatura HMAC:

```typescript
// src/app/api/leads/route.ts (já implementado)
const signature = request.headers.get('x-webhook-signature')
const [algorithm, receivedSignature] = signature?.split('=') || []

const computedSignature = crypto
  .createHmac('sha256', secret)
  .update(bodyText)
  .digest('hex')

if (receivedSignature !== computedSignature) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
}
```

### 6. Teste manual via cURL

```bash
# Gerar signature (Linux/Mac)
SECRET="seu-secret-aqui"
PAYLOAD='{"name":"Teste","phone":"11987654321","email":"teste@example.com","plan":"premium"}'
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" | cut -d' ' -f2)

# Enviar requisição
curl -X POST https://mygest.netlify.app/api/leads \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: sha256=$SIGNATURE" \
  -d "$PAYLOAD"
```

```powershell
# Windows PowerShell
$secret = "seu-secret-aqui"
$payload = '{"name":"Teste","phone":"11987654321","email":"teste@example.com","plan":"premium"}'
$hmac = New-Object System.Security.Cryptography.HMACSHA256
$hmac.Key = [Text.Encoding]::UTF8.GetBytes($secret)
$hash = $hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes($payload))
$signature = [BitConverter]::ToString($hash).Replace("-", "").ToLower()

Invoke-RestMethod -Method Post -Uri "https://mygest.netlify.app/api/leads" `
  -Headers @{
    "Content-Type" = "application/json"
    "X-Webhook-Signature" = "sha256=$signature"
  } `
  -Body $payload
```

### 7. Resposta esperada

```json
{
  "success": true,
  "clientId": "cm5abc123xyz",
  "action": "created",
  "message": "Lead capturado com sucesso"
}
```

Se o lead já existir (mesmo email ou telefone):

```json
{
  "success": true,
  "clientId": "cm5abc123xyz",
  "action": "updated",
  "message": "Lead atualizado com sucesso"
}
```

### 8. Normalização automática

O sistema Gestão automaticamente:

- Adiciona `+55` ao telefone se não tiver
- Remove espaços e caracteres especiais
- Busca por email OU telefone para evitar duplicatas
- Armazena metadata completa (UTM params, origem, timestamp)

### 9. Checklist de integração

- [ ] Configurar `GESTAO_CLIENTES_LEADS_URL` na LP
- [ ] Configurar `GESTAO_CLIENTES_WEBHOOK_SECRET` (mesmo em ambos sistemas)
- [ ] Implementar função `sendLeadToGestao()`
- [ ] Adicionar chamada no submit do formulário
- [ ] Testar com cURL/Postman
- [ ] Verificar logs no Gestão (`/api/leads`)
- [ ] Confirmar lead aparecendo em `/leads`
- [ ] Manter envio de templates WhatsApp em paralelo (opcional)

### 10. Diferenças importantes

**ANTES (webhook):**

- LP enviava para `/api/integrations/whatsapp/webhook`
- Payload incluía `templates` object
- Criava mensagens duplicadas no sistema

**AGORA (/api/leads):**

- LP envia para `/api/leads` dedicado
- Payload limpo com dados do lead
- Cria/atualiza cliente com status="lead"
- Aparece na página `/leads` separado das mensagens
- Webhook continua recebendo mensagens reais do WhatsApp

### 11. Fluxo completo

```
[Landing Page Formulário]
        ↓
    [Submit]
        ↓
   ┌────┴────┐
   │         │
   ↓         ↓
[/api/leads] [WhatsApp Template]
   │         (opcional)
   ↓
[Gestão: Cria cliente com status="lead"]
   ↓
[Aparece em /leads]
   ↓
[Admin converte para cliente ativo]
```
