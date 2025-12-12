import { Resend } from 'resend'
import { renderInviteEmailHtml } from './templates/inviteHtml'

const apiKey = process.env.RESEND_API_KEY

// Sanitiza o remetente: bloqueia domínios gratuitos não verificáveis e força fallback seguro
function getSafeFromEmail(): string {
  const envFrom = process.env.EMAIL_FROM?.trim()
  if (!envFrom) return 'Convites <onboarding@resend.dev>'

  // Lista de domínios gratuitos que não podem ser verificados na Resend
  const freeDomains = [
    'gmail.com',
    'outlook.com',
    'hotmail.com',
    'yahoo.com',
    'live.com',
    'icloud.com',
  ]
  const fromLower = envFrom.toLowerCase()

  for (const domain of freeDomains) {
    if (fromLower.includes(`@${domain}`)) {
      console.warn(
        `[Resend] EMAIL_FROM usa domínio gratuito (${domain}); usando onboarding@resend.dev`
      )
      return 'Convites <onboarding@resend.dev>'
    }
  }

  return envFrom
}

const fromEmail = getSafeFromEmail()
// Resolve application base URL in order of preference:
// 1. NEXT_PUBLIC_APP_URL (client-safe override)
// 2. APP_BASE_URL (explicit server config)
// 3. Netlify `URL` (production site URL)
// 4. Vercel `VERCEL_URL` (preview/production)
// 5. fallback to localhost for local dev
const appBaseUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.APP_BASE_URL ||
  (process.env.URL ? process.env.URL : null) ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
  'http://localhost:3000'

let client: Resend | null = null
if (apiKey) {
  client = new Resend(apiKey)
}

export type InviteEmailParams = {
  to: string
  token: string
  orgName: string
  roleRequested: 'STAFF' | 'CLIENT'
  clientName?: string | null
}

export async function sendInviteEmail(
  params: InviteEmailParams
): Promise<{ skipped: boolean; id?: string }> {
  if (!client) {
    console.warn('[Resend] RESEND_API_KEY not set; skipping email send')
    return { skipped: true }
  }

  const { to, token, orgName, roleRequested, clientName } = params
  const link = `${appBaseUrl}/invite/${encodeURIComponent(token)}`

  const subject =
    roleRequested === 'STAFF'
      ? `[Convite] Equipe - ${orgName}`
      : `[Convite] Cliente${clientName ? `: ${clientName}` : ''} - ${orgName}`

  const html = renderInviteEmailHtml({
    orgName,
    roleRequested,
    clientName: clientName || null,
    inviteLink: link,
  })

  const text =
    roleRequested === 'STAFF'
      ? `Você foi convidado(a) para a equipe da organização ${orgName}.\n\nPara aceitar o convite, acesse: ${link}`
      : `Você foi convidado(a) como cliente${clientName ? ` (${clientName})` : ''} na organização ${orgName}.\n\nPara aceitar o convite, acesse: ${link}`

  const result = await client.emails.send({
    from: fromEmail,
    to,
    subject,
    html,
    text,
  })
  try {
    type ResendResponseShape =
      | { id?: string }
      | { data?: { id?: string } | null }
    const res = result as ResendResponseShape
    let id: string | undefined
    if ('id' in res && typeof res.id === 'string') {
      id = res.id
    } else if ('data' in res && res.data && typeof res.data.id === 'string') {
      id = res.data.id
    }
    return { skipped: false, id }
  } catch {
    return { skipped: false }
  }
}

export type TaskAssignmentEmailParams = {
  to: string
  assigneeName?: string | null
  assignerName?: string | null
  taskTitle: string
  clientName?: string | null
  orgName?: string | null
  dueDate?: Date | null
  taskLink?: string | null
}

export async function sendTaskAssignmentEmail(
  params: TaskAssignmentEmailParams
): Promise<{ skipped: boolean; id?: string }> {
  if (!client) {
    console.warn(
      '[Resend] RESEND_API_KEY not set; skipping task assignment email'
    )
    return { skipped: true }
  }

  const {
    to,
    assigneeName,
    assignerName,
    taskTitle,
    clientName,
    orgName,
    dueDate,
    taskLink,
  } = params

  const subject = `[Tarefa atribuída] ${taskTitle}`
  const safeAssignee = assigneeName || 'Você'
  const safeAssigner = assignerName || 'Gestão de Clientes'
  const safeOrg = orgName || 'sua organização'
  const safeClient = clientName ? ` • Cliente: ${clientName}` : ''
  const dueText = dueDate ? `Prazo: ${dueDate.toLocaleDateString('pt-BR')}` : ''
  const link = taskLink || `${appBaseUrl}`

  const html = `
    <html>
      <body style="margin:0;padding:24px;background:#0b1220;font-family:Inter,system-ui,-apple-system,Segoe UI,Arial;color:#e2e8f0;">
        <div style="max-width:640px;margin:0 auto;border-radius:16px;overflow:hidden;border:1px solid #1f2937;box-shadow:0 18px 60px rgba(0,0,0,0.35);background:linear-gradient(135deg,#0f172a 0%,#0b1220 40%,#111827 100%);">
          <div style="padding:18px 20px;border-bottom:1px solid #1f2937;background:linear-gradient(135deg,#111827,#0b1220);">
            <p style="margin:0;font-size:13px;color:#94a3b8;letter-spacing:0.3px;">${safeOrg}</p>
            <h1 style="margin:6px 0 0 0;font-size:20px;color:#f8fafc;">${safeAssignee}, você recebeu uma nova tarefa</h1>
          </div>
          <div style="padding:22px 24px;">
            <p style="margin:0 0 10px 0;font-size:15px;color:#e2e8f0;line-height:1.5;"><strong style="color:#93c5fd;">Tarefa:</strong> ${taskTitle}</p>
            ${clientName ? `<p style="margin:0 0 8px 0;font-size:14px;color:#cbd5e1;line-height:1.5;"><strong style=\"color:#93c5fd;\">Cliente:</strong> ${clientName}</p>` : ''}
            ${dueText ? `<p style="margin:0 0 12px 0;font-size:14px;color:#cbd5e1;line-height:1.5;"><strong style=\"color:#93c5fd;\">Prazo:</strong> ${dueText.replace('Prazo: ', '')}</p>` : ''}
            <p style="margin:0 0 16px 0;font-size:14px;color:#cbd5e1;">Atribuída por <strong style="color:#f8fafc;">${safeAssigner}</strong>.</p>
            <a href="${link}" style="display:inline-block;padding:12px 18px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:12px;font-weight:700;box-shadow:0 10px 35px rgba(59,130,246,0.35);">Ver tarefa</a>
            <p style="margin:16px 0 0 0;font-size:12px;color:#94a3b8;line-height:1.5;">Se o botão não funcionar, copie e cole este link no navegador:<br/><span style="color:#60a5fa;word-break:break-all;">${link}</span></p>
          </div>
        </div>
      </body>
    </html>
  `

  const text = `${safeAssignee}, você recebeu uma nova tarefa: ${taskTitle} ${safeClient}\n${dueText}\nAtribuída por: ${safeAssigner}\n${link}`

  const result = await client.emails.send({
    from: fromEmail,
    to,
    subject,
    html,
    text,
  })

  try {
    type ResendResponseShape =
      | { id?: string }
      | { data?: { id?: string } | null }
    const res = result as ResendResponseShape
    let id: string | undefined
    if ('id' in res && typeof res.id === 'string') id = res.id
    else if ('data' in res && res.data && typeof res.data.id === 'string')
      id = res.data.id
    return { skipped: false, id }
  } catch {
    return { skipped: false }
  }
}

// Using string renderer with internal HTML escaper

export async function sendTestEmail(
  to: string,
  subject = 'Teste de envio - Gestão de Clientes',
  html?: string
): Promise<{ skipped: boolean; result?: unknown }> {
  if (!client) {
    console.warn('[Resend] RESEND_API_KEY not set; skipping test email')
    return { skipped: true }
  }

  const safeHtml =
    html ||
    `<html><body style="font-family: Inter, system-ui, -apple-system, Segoe UI, Arial;">
      <div style="max-width:640px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px">
        <h1 style="margin:0 0 8px 0;font-size:18px;color:#0f172a">Teste de Email</h1>
        <p style="margin:0;color:#334155">Se você recebeu esta mensagem, o envio via Resend está funcionando.</p>
      </div>
    </body></html>`

  const result = await client.emails.send({
    from: fromEmail,
    to,
    subject,
    html: safeHtml,
  })
  return { skipped: false, result }
}
