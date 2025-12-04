# APIs e Integrações

Este documento lista exaustivamente as rotas em `src/app/api/**`, com método, parâmetros e a resposta básica.

## Health

`src/app/api/health/route.ts`

- Endpoint: `GET /api/health`
- Parâmetros: nenhum
- Resposta: `{ status: 'healthy'|'unhealthy', timestamp: ISO, uptime: number, environment: string }`
- Status: 200, 503

## Members

`src/app/api/members/route.ts`

- Endpoint: `GET /api/members`
- Headers: sessão/guard (`OWNER` obrigatório)
- Parâmetros: nenhum
- Resposta: `{ data: Array<{ id, user_id, role, status, full_name, email, created_at, org_id, last_active_at, online }>}`
- Status: 200, 401, 403, 500

## Invites

`src/app/api/invites/route.ts`

- Endpoint: `GET /api/invites`
- Headers: sessão (`can(role, 'read', 'invite')`)
- Parâmetros: nenhum
- Resposta: `{ data: Invite[] }`
- Status: 200, 401, 403

`src/app/api/invites/accept/route.ts`

- Endpoint: `POST /api/invites/accept`
- Body: `{ token: string }`
- Resposta: `{ ok: true, nextPath }`; erros `{ error }`
- Status: 200, 400, 401, 403, 404, 500

- Endpoint: `GET /api/invites/accept?token=...`
- Query: `token`
- Resposta: `{ data: { id, email, roleRequested, status, expiresAt, createdAt } }`
- Status: 200, 400, 404, 500

## Invoices

`src/app/api/invoices/route.ts`

- Endpoint: `GET /api/invoices`
- Query: `clientId`, `status`, `dateFrom`, `dateTo`, `includeDeleted`, `page`, `limit`
- Resposta: `{ data: Invoice[], pagination: { page, limit, total }, totalPages, total }`
- Status: 200, 401, 500

- Endpoint: `POST /api/invoices`
- Body: `{ clientId, dueDate, items, discount, tax, notes, internalNotes, installmentId }`
- Resposta: `Invoice`
- Status: 201, 401, 400

`src/app/api/invoices/[id]/route.ts`

- Endpoint: `GET /api/invoices/[id]`
- Params: `{ id }`
- Resposta: `Invoice` | `{ error: 'Fatura não encontrada' }`
- Status: 200, 401, 404, 500

`src/app/api/invoices/[id]/approve-payment/route.ts`

- Endpoint: `POST /api/invoices/[id]/approve-payment`
- Params: `{ id }`
- Body: `{ paidAt?: ISO, notes?: string }`
- Resposta: `Invoice`
- Status: 200, 401, 400

`src/app/api/invoices/generate-monthly/route.ts`

- Endpoint: `POST /api/invoices/generate-monthly`
- Body/Query: ver implementação (gera faturas mensais)
- Resposta: resultado da geração

`src/app/api/invoices/update-overdue/route.ts`

- Endpoint: `POST /api/invoices/update-overdue`
- Função: atualiza status vencidas
- Resposta: contagem/resultado

## Transactions

`src/app/api/transactions/route.ts`

- Endpoint: `GET /api/transactions`
- Query: `type`, `subtype`, `status`, `clientId`, `invoiceId`, `costItemId`, `category`, `dateFrom`, `dateTo`, `includeDeleted`, `page`, `limit`, `orderBy`, `orderDirection`
- Resposta: `{ data: Array<Transaction & { clientName }>, pagination, totalPages, total }`
- Status: 200, 401, 500

- Endpoint: `POST /api/transactions`
- Body: `{ type, subtype, amount, description?, category?, date?, status, invoiceId?, clientId?, costItemId?, metadata? }`
- Resposta: `Transaction`
- Status: 201, 401, 400

## Recurring Expenses

`src/app/api/recurring-expenses/route.ts`

- Endpoint: `GET /api/recurring-expenses`
- Query: `active`, `cycle`, `includeDeleted`, `page` (1..n), `limit` (1..100), `search`
- Resposta: `{ data, page, limit, total, totalPages }`
- Status: 200, 401, 500

- Endpoint: `POST /api/recurring-expenses`
- Body: `{ name, description?, amount>0, category?, cycle: 'MONTHLY'|'ANNUAL', dayOfMonth?, active? }`
- Resposta: `RecurringExpense`
- Status: 201, 401, 400

`src/app/api/recurring-expenses/[id]/route.ts`

- Endpoint: `GET /api/recurring-expenses/[id]`
- Params: `{ id }`
- Resposta: `RecurringExpense` | `{ error: 'Despesa fixa não encontrada' }`
- Status: 200, 401, 404, 500

- Endpoint: `PATCH /api/recurring-expenses/[id]`
- Body: `{ name?, description?, amount?, category?, cycle?, dayOfMonth?, active? }`
- Resposta: `RecurringExpense`
- Status: 200, 401, 400

- Endpoint: `DELETE /api/recurring-expenses/[id]`
- Resposta: `RecurringExpense`
- Status: 200, 401, 400

`src/app/api/recurring-expenses/[id]/materialize/route.ts`

- Endpoint: `POST /api/recurring-expenses/[id]/materialize`
- Params: `{ id }`
- Função: materializar despesas (detalhe no serviço)
- Resposta: resultado da materialização

## Uploads

`src/app/api/uploads/presign/route.ts`

- Endpoint: `POST /api/uploads/presign`
- Body: `{ clientId, filename, mimeType, size? }`
- Resposta: `{ originalKey, uploadUrl, willGenerateOptimized }`
- Status: 200, 400, 413, 415, 500

`src/app/api/uploads/finalize/route.ts`

- Endpoint: `POST /api/uploads/finalize`
- Body: `{ orgId, clientId, originalKey, mimeType, size?, title?, description? }`
- Resposta: `{ success, media, downloadUrl, optimizedUrl, thumbUrl }`
- Status: 200, 400, 500

## Reports

`src/app/api/reports/summary/route.ts`

- Endpoint: `GET /api/reports/summary`
- Query: `year?`
- Resposta: `summary`
- Status: 200, 401, 500

## Verses

`src/app/api/verse/route.ts`

- Endpoint: `GET /api/verse`
- Resposta: conteúdo

`src/app/api/verses/random/route.ts`

- Endpoint: `GET /api/verses/random`
- Resposta: verso aleatório

`src/app/api/verses/[id]/route.ts`

- Endpoint: `GET /api/verses/[id]`
- Params: `{ id }`
- Resposta: verso específico

`src/app/api/verses/[id]/next/route.ts`

- Endpoint: `GET /api/verses/[id]/next`
- Params: `{ id }`
- Resposta: próximo verso

`src/app/api/verses/[id]/previous/route.ts`

- Endpoint: `GET /api/verses/[id]/previous`
- Params: `{ id }`
- Resposta: verso anterior

## Pendentes a detalhar

- Clients (`src/app/api/clients/**`): listar/search/sync-financial/by-status.
- Admin (`src/app/api/admin/**`): `process-payments`, `financial/*`, `billing/*`.
- Branding (`src/app/api/branding/**`).
- Finance (`src/app/api/finance/**`), reconciliation (`src/app/api/reconciliation/**`).
- Org/Session/Notifications/Google-fonts/Diagnostics/Webhooks/Whatsapp.

Atualizarei esta lista conforme a leitura restante dos arquivos.

### Outros endpoints e integrações

#### Sidebar Stats

- `GET /api/sidebar-stats`
- Retorna: `{ orgName: string|null, role: AppRole|null, alertsCount: number }`
- Auth: sessão válida; aplica `guardAccess` e security headers.
- Lógica: busca `org.name` e conta faturas `OVERDUE` para `alertsCount`.

#### Activity Heartbeat

- `POST /api/activity/heartbeat`
- Body: none.
- Retorna: `{ ok: true }` ou `{ error: 'Unauthorized' }`
- Efeito: atualiza `user.lastActiveAt = now`.

#### Instagram OAuth

- `GET /api/instagram/connect?clientId`
- Resposta: `{ authUrl }` com URL de autorização.
- Modo: `INSTAGRAM_OAUTH_MODE` = `basic` (Instagram Basic Display) ou `graph` (Facebook Login + IG Graph API).
- Vars: usa `FACEBOOK_APP_ID/REDIRECT_URI` (ou `INSTAGRAM_*` legados). Valida App ID numérico.

- `GET /api/instagram/callback?code&state=clientId`
- Troca `code` por token (short/long-lived), descobre `instagramUserId` e opcional `username`, salva em `Client`:
  - Campos: `instagramAccessToken`, `instagramUserId`, `instagramTokenExpiresAt`, `instagramUsername`.
- Redireciona para `/clients/{clientId}/info?instagram_success=true` ou `instagram_error`.

- `GET /api/instagram/feed?clientId&limit=12`
- Requer cliente com `instagramAccessToken` e `instagramUserId` válidos (não expirados).
- Retorna: `{ items: Array<media> }` vindo de Graph API (fields: id, caption, media_type, media_url, thumbnail_url, permalink, timestamp) ou Basic Display (fields reduzidos).

#### Perfil do Usuário

- `GET /api/profile`
- Retorna: `{ id, email, name, image }` do usuário logado.

- `PATCH /api/profile`
- Body: `{ name?: string, image?: string }`
- Atualiza no banco e tenta sincronizar `displayName/photoURL` no Firebase Auth.

#### Avatar Upload

- `POST /api/profile/avatar`
- Multipart/form-data: `file` imagem (máx 5MB; tipos permitidos).
- Valida MIME e magic bytes; faz upload via storage (`uploadFile`) em `avatars/{userId}/{timestamp}.ext`.
- Retorna: `{ url, thumbUrl }`.

#### Logout

- `POST /api/logout`
- Efeito: remove cookies `auth` e `role` (expira imediatamente) com mesmas opções de criação.
- Retorna: `{ ok: true }`.

#### Diagnostics Finance

- `GET /api/diagnostics/financial`
- Apenas `OWNER`.
- Retorna: `{ success, counts, installmentClients: { count, samples }, recentInvoices, recentTransactions, timestamp }`.

#### Cron: Monthly Payments

- `GET|POST /api/cron/process-monthly-payments`
- Auth: `Authorization: Bearer ${CRON_SECRET}`.
- Para cada organização, cria `transaction` de receita mensal ou parcela vencida do mês quando não existir.
- Retorna: `{ success, message, results: { processed, created, errors, details: [{ client, amount, type }] }, timestamp }`.

#### Maintenance

- `POST /api/maintenance/auto-materialize-costs`
- Stub: migrado para `POST /api/cost-subscriptions/materialize`; retorna `{ status: 'migrated', newEndpoint }`.

- `POST /api/maintenance/reset-finance-range`
- Body: `{ start: ISO, end: ISO, scope?: 'all'|'finance'|'payments'|'invoices', dryRun?: boolean }`
- Conta e opcionalmente deleta registros dentro do intervalo conforme `scope`.
- Retorna: `{ scope, start, end, dryRun?, summary|deleted }`.

- `POST /api/maintenance/update-finance-records`
- Body: `Array<{ id, date?: ISO, amount?: number, type?: 'INCOME'|'EXPENSE', invoiceId?: string|null }>`
- Atualiza campos dos `transactions`; retorna `{ updated: Array<{ id, ok, error? }> }`.

- `POST /api/maintenance/delete-finances`
- Stub: oper. movida; retorna `{ success: true, deletedCount: 0, skippedCount: 0 }`.

- `GET /api/maintenance/analyze-september`
- Stub: redirecionada para `/api/reports/monthly`.

- `POST /api/maintenance/normalize-finance-types`
- Apenas `OWNER`.
- Normaliza `Finance.type` para `INCOME`/`EXPENSE` maiúsculo via SQL; retorna `{ updatedIncome, updatedExpense, distribution }`.

- `POST /api/maintenance/materialize-internal-costs`
- Body: `Array<{ clientId, amount, month: 'YYYY-MM', description? }>`
- Cria `transaction` EXPENSE `INTERNAL_COST` por mês; retorna `{ created: Array<{ clientId, ok, error?, financeId? }> }`.

#### Test Email

- `POST /api/test-email`
- Body: `{ to: string, subject?: string, html?: string }`
- Usa Resend para envio; retorna `{ ok: true, skipped }`.

#### Sentry Example

- `GET /api/sentry-example-api`
- Lança erro intencional para validar monitoramento do Sentry.

#### Branding: Extract Colors

- `POST /api/branding/extract-colors`
- Body: `{ imageUrl: string }`
- Busca imagem, quantiza cores com `sharp`, retorna `{ colors: string[] }` (top 6).

#### Reports: Audit e Análises

- `GET /api/reports/audit?year&months=10,11`
- OWNER ou token admin `Bearer ${ADMIN_API_TOKEN}` + `orgId` por header/query.
- Retorna auditoria financeira multi-mês gerada por `ReportingService.auditFinancial`.

- `GET /api/reports/client-analysis/{clientId}?year`
- OWNER; janela anual; `ReportingService.getClientAnalysis`.

- `GET /api/reports/client-margin/{clientId}?year&month`
- OWNER; calcula margem do cliente via `CostTrackingService.calculateClientMargin` no mês.

#### Webhooks: Nubank Pix

- `POST /api/webhooks/nubank/pix`
- Verifica assinatura `x-nubank-signature` via HMAC SHA256 com `NUBANK_WEBHOOK_SECRET`.
- Fluxo: tenta identificar cliente por CPF/CNPJ; se há fatura aberta com valor ~ Pix, registra via `PaymentOrchestrator.recordInvoicePayment`; senão cria `transaction` de receita genérica.
- Retorna: `{ success: true }`.

#### WhatsApp Integrations

- `POST /api/whatsapp/fake-gateway`
- Simula envio (logs) para testes locais; retorna `{ ok: true, messageId }`.

- `POST /api/whatsapp/twilio-proxy`
- Converte `{ to, body }` para Twilio API usando `TWILIO_*`; retorna `{ ok, messageSid, data }`.

## Clients

`src/app/api/clients/route.ts`

- Endpoint: `POST /api/clients`
- Headers: sessão (`OWNER`)
- Body (Zod `createClientSchema`): `{ name, email?, phone?, status, plan?, mainChannel?, contractStart?, contractEnd?, paymentDay?, contractValue?, isInstallment?, installmentCount?, installmentValue?, installmentPaymentDays? }`
- Resposta: `Client` criado; se parcelado, cria `Installment` via `prisma.installment.createMany`
- Status: 201, 401, 403, 400 (Zod), 500

- Endpoint: `GET /api/clients`
- Headers: sessão; `CLIENT` retorna apenas seu registro; `OWNER/STAFF` listam
- Query: `lite=1` para listagem leve (`id,name`)
- Resposta: `{ data: Client[] }` (select otimizado)
- Status: 200, 401, 500

`src/app/api/clients/[id]/route.ts`

- Endpoint: `PATCH /api/clients/[id]`
- Headers: sessão (`OWNER`)
- Params: `{ id }`
- Body: parcial (`clientSchema.partial()`): campos de cliente e de parcelamento
- Resposta: `Client` atualizado; se mudou parcelamento, recria `Installment`
- Status: 200, 401, 403, 404, 400 (Zod), 500

- Endpoint: `GET /api/clients/[id]`
- Headers: sessão
- Params: `{ id }`
- Resposta: `Client` | 404
- Status: 200, 401, 404, 500

`src/app/api/clients/search/route.ts`

- Endpoint: `GET /api/clients/search`
- Headers: sessão + permissão `can(role,'read','client')`
- Query: `q`, `take` (1..50)
- Resposta: `Array<{ id, name }>`
- Status: 200, 401, 403

`src/app/api/clients/by-status/route.ts`

- Endpoint: `GET /api/clients/by-status`
- Headers: `x-org-id` obrigatório
- Query: `status` (default 'active')
- Resposta: `{ clients: Client[] }` utilizando `withOrgScope`
- Status: 200, 400

`src/app/api/clients/sync-financial/route.ts`

- Endpoint: `POST /api/clients/sync-financial`
- Headers: sessão (`OWNER`)
- Body: nenhum
- Resposta: `{ success, updated, clients: string[], message }`
- Status: 200, 401, 500

## Admin

`src/app/api/admin/process-payments/route.ts`

- Endpoint: `POST /api/admin/process-payments`
- Headers: sessão (`OWNER`)
- Body: nenhum
- Resposta: `{ success, message, results: { processed, created, updated, errors, details[] }, month, timestamp }`
- Status: 200, 403, 400, 500

`src/app/api/admin/financial/normalize-month/route.ts`

- Endpoint: `POST /api/admin/financial/normalize-month`
- Headers: sessão (`OWNER`) ou `Authorization: Bearer <ADMIN_API_TOKEN>` + `orgId` no body/header
- Body: `{ year: number, month: number, orgId? }`
- Resposta: `{ ok: true, result }`
- Status: 200, 401, 400, 500

## Session

`src/app/api/session/route.ts`

- Endpoint: `GET /api/session`
- Headers: sessão válida
- Parâmetros: nenhum
- Resposta: `{ user: { id, email, name }, orgId, role }` ou `{ error: 'Not authenticated' }`
- Status: 200, 401, 500

- Endpoint: `POST /api/session`
- Body: `{ idToken: string, skipOrgCreation?: boolean, inviteToken?: string|null }`
- Funções:
  - Verifica rate limit (`authRatelimit`), valida `idToken` via Firebase Admin.
  - Seta cookie `auth` (httpOnly, sameSite 'strict') e opcional `role`.
  - Executa onboarding (`handleUserOnboarding`).
  - Se `inviteToken` válido e correspondente ao email, cria associação `Member` e opcionalmente vincula/gera `Client`; atualiza `Invite` para `ACCEPTED` e Firestore.
- Resposta: `{ ok: true, nextPath?: string|null, inviteStatus?: { status: 'accepted'|'expired'|'mismatch'|'not_found'|'invalid_status', email?: string, reason?: string } }` ou `{ error: 'Invalid token' }`
- Status: 200, 400, 401, 500

## Org

`src/app/api/org/route.ts`

- Endpoint: `GET /api/org`
- Headers: sessão válida
- Parâmetros: nenhum
- Resposta: `{ id, name, description?, cnpj?, phone?, website?, addressLine1?, addressLine2?, city?, state?, postalCode?, country? }`
- Status: 200, 401, 404

- Endpoint: `PATCH /api/org`
- Headers: sessão (`OWNER`)
- Body: campos parciais de organização; valida CNPJ (14 dígitos) e CEP (8 dígitos)
- Resposta: `{ id }` do registro atualizado
- Status: 200, 401, 403, 400

## Notifications

`src/app/api/notifications/route.ts`

- Endpoint: `GET /api/notifications`
- Headers: sessão válida
- Query: `unread=true|false`, `limit` (default 50), `offset` (default 0), `type?`
- Resposta: `{ notifications: Array<{ id, type, title, message, time, unread, link, priority?, clientId, createdAt }>, total, unreadCount, hasMore }` (combina notificações persistidas + dinâmicas: tasks, meetings, installments)
- Status: 200, 401, 404, 500

- Endpoint: `POST /api/notifications`
- Headers: sessão válida
- Body: `{ action: 'mark_read'|'mark_multiple_read'|'mark_all_read'|'delete', id?, ids? }`
- Resposta: `{ ok: true }` ou `{ error }`
- Status: 200, 400, 401, 404, 500

## Google Fonts

`src/app/api/google-fonts/route.ts`

- Endpoint: `GET /api/google-fonts`
- Rate limit: `publicRatelimit`
- Resposta: `{ families: Array<{ family: string, variants: string[] }> }`; sem API key usa fallback interno
- Status: 200, 429, 502, 500

## Reports (complemento)

`src/app/api/reports/dashboard/route.ts`

- Endpoint: `GET /api/reports/dashboard`
- Headers: sessão (`OWNER`)
- Query: `year`, `month`
- Resposta: `dashboard` via `ReportingService.getDashboard(dateFrom,dateTo)`
- Status: 200, 401, 500

`src/app/api/reports/today/route.ts`

- Endpoint: `GET /api/reports/today`
- Headers: sessão (`OWNER`)
- Resposta: `{ date, totalIncomeToday, totalIncomeCount, totalExpenseToday, totalExpenseCount, netToday }`
- Status: 200, 401, 500

`src/app/api/reports/monthly/route.ts`

- Endpoint: `GET /api/reports/monthly`
- Headers: sessão (`OWNER`)
- Query: `year`, `month`
- Resposta: relatório mensal via `ReportingService.getMonthlyReport(orgId,year,month)`
- Status: 200, 401, 500

`src/app/api/reports/projections/route.ts`

- Endpoint: `GET /api/reports/projections`
- Headers: sessão (`OWNER`)
- Query: `months` (max 12)
- Resposta: projeções via `FinancialAutomationService.calculateProjection(orgId, months)`
- Status: 200, 401, 500

## Finance

`src/app/api/finance/route.ts`

- Endpoint: `GET /api/finance`
- Headers: sessão com permissão `can(role,'read','finance')`
- Resposta: `FinanceRecord[]` ordenado por `date desc`, incluindo `client`
- Status: 200, 401, 403

- Endpoint: `POST /api/finance`
- Headers: sessão com permissão `create`
- Body: `{ type: 'income'|'expense', subtype?, amount:number, description?, category?, clientId:string }`
- Resposta: registro criado (`include client`), `201`
- Status: 201, 401, 403, 400, 404

- Endpoint: `PATCH /api/finance?id=...`
- Headers: sessão com permissão `update`
- Resposta: registro atualizado
- Status: 200, 401, 403, 400, 404

- Endpoint: `DELETE /api/finance?id=...`
- Headers: sessão com permissão `delete`
- Resposta: `{ success: true }`
- Status: 200, 401, 403, 400, 404

## Reconciliation

`src/app/api/reconciliation/summary/route.ts`

- Endpoint: `GET /api/reconciliation/summary`
- Função: resumo mensal de reconciliação (faturas pagas sem vínculo; finanças sem `invoiceId`; totais mês)
- Resposta: `{ invoicesPaidWithoutLinks, financesIncomeWithoutInvoiceId, currentMonth: { paymentsTotal, financesIncomeTotal, delta } }`
- Status: 200

`src/app/api/reconciliation/details/route.ts`

- Endpoint: `GET /api/reconciliation/details`
- Função: detalhes para revisão manual
- Resposta: `{ invoicesPaidWithoutLinks: Array<{ id, number, clientId, total }>, orphanFinances: Array<{ id, amount, description, clientId, date }>, multiFinanceInvoices: Array<{ id, number, clientId, transactions: Array<{ id, amount }> }> }`
- Status: 200

## Transactions (complemento)

`src/app/api/transactions/summary/route.ts`

- Endpoint: `GET /api/transactions/summary`
- Headers: sessão (`OWNER`)
- Query: `dateFrom?`, `dateTo?`
- Resposta: `summary` via `TransactionService.getSummary`
- Status: 200, 401, 500

`src/app/api/transactions/[id]/route.ts`

- Endpoint: `GET /api/transactions/[id]`
- Headers: sessão (`OWNER`)
- Params: `{ id }`
- Resposta: `Transaction` ou 404
- Status: 200, 401, 404, 500

- Endpoint: `PATCH /api/transactions/[id]`
- Headers: sessão (`OWNER`)
- Body: `{ type, subtype, amount, description, category, date?, status, metadata }`
- Resposta: `Transaction` atualizado
- Status: 200, 401, 400

- Endpoint: `DELETE /api/transactions/[id]`
- Headers: sessão (`OWNER`)
- Resposta: `Transaction` (soft delete)
- Status: 200, 401, 400

`src/app/api/transactions/[id]/restore/route.ts`

- Endpoint: `POST /api/transactions/[id]/restore`
- Headers: sessão (`OWNER`)
- Resposta: `Transaction` restaurado
- Status: 200, 401, 400

## Uploads (multipart)

`src/app/api/uploads/multipart/initiate/route.ts`

- Endpoint: `POST /api/uploads/multipart/initiate`
- Headers: sessão válida
- Body: `{ clientId, filename, mimeType }`
- Resposta: `{ uploadId, originalKey }`
- Status: 200, 400, 500

`src/app/api/uploads/multipart/sign-part/route.ts`

- Endpoint: `POST /api/uploads/multipart/sign-part`
- Headers: sessão válida
- Body: `{ originalKey, uploadId, partNumber }`
- Resposta: `{ url }` presigned para enviar a parte
- Status: 200, 400, 500

`src/app/api/uploads/multipart/complete/route.ts`

- Endpoint: `POST /api/uploads/multipart/complete`
- Headers: sessão válida
- Body: `{ orgId, clientId, originalKey, uploadId, parts[], title?, description?, mimeType?, size? }`
- Resposta: `{ success, media, downloadUrl }`
- Status: 200, 400, 500

`src/app/api/uploads/multipart/abort/route.ts`

- Endpoint: `POST /api/uploads/multipart/abort`
- Headers: sessão válida
- Body: `{ originalKey, uploadId }`
- Resposta: `{ success: true }`
- Status: 200, 400, 500

## Cost Items

`src/app/api/cost-items/route.ts`

- Endpoint: `GET /api/cost-items`
- Headers: sessão (`OWNER`)
- Query: `active=true|false`, `category?`, `includeDeleted=true|false`
- Resposta: `{ data: CostItem[], totalPages:1, total }`
- Status: 200, 401, 500

- Endpoint: `POST /api/cost-items`
- Headers: sessão (`OWNER`)
- Body: `{ name, description?, amount, category?, active? }`
- Resposta: `CostItem` criado
- Status: 201, 401, 400

`src/app/api/cost-items/[id]/route.ts`

- Endpoint: `GET /api/cost-items/[id]`
- Headers: sessão (`OWNER`)
- Resposta: `CostItem` ou 404
- Status: 200, 401, 404, 500

- Endpoint: `PATCH /api/cost-items/[id]`
- Headers: sessão (`OWNER`)
- Body: `{ name?, description?, amount?, category?, active? }`
- Resposta: `CostItem` atualizado
- Status: 200, 401, 400

- Endpoint: `DELETE /api/cost-items/[id]`
- Headers: sessão (`OWNER`)
- Resposta: `CostItem` deletado
- Status: 200, 401, 400

## Cost Subscriptions

`src/app/api/cost-subscriptions/route.ts`

- Endpoint: `GET /api/cost-subscriptions`
- Headers: sessão (`OWNER`)
- Query: `clientId?`, `costItemId?`, `active?`, `includeDeleted?`
- Resposta: `{ data: ClientCostSubscription[], totalPages:1, currentPage:1, totalItems }`
- Status: 200, 401, 500

- Endpoint: `POST /api/cost-subscriptions`
- Headers: sessão (`OWNER`)
- Body: `{ clientId, costItemId, startDate: ISO, endDate?: ISO, active?, notes? }`
- Resposta: `ClientCostSubscription` criado
- Status: 201, 401, 400

`src/app/api/cost-subscriptions/[id]/route.ts`

- Endpoint: `GET /api/cost-subscriptions/[id]`
- Headers: sessão (`OWNER`)
- Resposta: `ClientCostSubscription` ou 404
- Status: 200, 401, 404, 500

- Endpoint: `PATCH /api/cost-subscriptions/[id]`
- Headers: sessão (`OWNER`)
- Body: `{ startDate?, endDate?, active?, notes? }`
- Resposta: `ClientCostSubscription` atualizado
- Status: 200, 401, 400

- Endpoint: `DELETE /api/cost-subscriptions/[id]`
- Headers: sessão (`OWNER`)
- Resposta: `ClientCostSubscription` deletado
- Status: 200, 401, 400

`src/app/api/cost-subscriptions/materialize/route.ts`

- Endpoint: `POST /api/cost-subscriptions/materialize`
- Headers: sessão (`OWNER`)
- Resposta: `{ success: number, skipped: number, errors: number, details }`
- Status: 200, 401, 500

## Clients (subrotas)

`src/app/api/clients/[id]/invoices/route.ts`

- Endpoint: `GET /api/clients/[id]/invoices`
- Headers: sessão
- Query: `page`, `limit`
- Resposta: `{ data: Invoice[], pagination: { page, limit, total, totalPages } }`
- Status: 200, 401, 500

- Endpoint: `POST /api/clients/[id]/invoices`
- Headers: sessão (`can(role,'create','finance')`)
- Resposta: `{ success: true, invoice }`
- Status: 200, 401, 403, 500

`src/app/api/clients/[id]/strategy/route.ts`

- Endpoint: `GET /api/clients/[id]/strategy`
- Headers: sessão (`can(role,'read','strategy')`)
- Resposta: `Strategy[]`
- Status: 200, 401, 403, 404, 500

- Endpoint: `POST /api/clients/[id]/strategy`
- Headers: sessão (`can(role,'create','strategy')`)
- Body: conforme `createStrategySchema`
- Resposta: `Strategy` criado
- Status: 200, 401, 403, 400, 404, 500

- Endpoint: `PATCH /api/clients/strategy?id=...`
- Headers: sessão (`can(role,'update','strategy')`)
- Body: conforme `updateStrategySchema`
- Resposta: `Strategy` atualizado
- Status: 200, 401, 403, 400, 404, 500

- Endpoint: `DELETE /api/clients/strategy?id=...`
- Headers: sessão (`can(role,'delete','strategy')`)
- Resposta: `{ success: true }`
- Status: 200, 401, 403, 404, 500

`src/app/api/clients/[id]/tasks/route.ts`

- Endpoint: `GET /api/clients/[id]/tasks`
- Headers: sessão (`can(role,'read','task')`)
- Resposta: `Task[]`
- Status: 200, 401, 403, 404, 500

- Endpoint: `POST /api/clients/[id]/tasks`
- Headers: sessão (`can(role,'create','task')`)
- Body: conforme `createTaskSchema`
- Resposta: `Task` criado
- Status: 200, 401, 403, 400, 404, 500

- Endpoint: `PATCH /api/clients/tasks?taskId=...`
- Headers: sessão (`can(role,'update','task')`)
- Body: conforme `updateTaskSchema`
- Resposta: `Task` atualizado
- Status: 200, 401, 403, 400, 404, 500

- Endpoint: `DELETE /api/clients/tasks?taskId=...`
- Headers: sessão (`can(role,'delete','task')`)
- Resposta: `{ success: true }`
- Status: 200, 401, 403, 404, 500

`src/app/api/clients/[id]/meetings/route.ts`

- Endpoint: `GET /api/clients/[id]/meetings`
- Headers: sessão (`can(role,'read','meeting')`)
- Resposta: `Meeting[]`
- Status: 200, 401, 403, 404, 500

- Endpoint: `POST /api/clients/[id]/meetings`
- Headers: sessão (`can(role,'create','meeting')`)
- Body: `{ title, description?, startTime, endTime, location?, status?, notes? }`
- Resposta: `Meeting` criado
- Status: 200, 401, 403, 400, 404, 500

- Endpoint: `PATCH /api/clients/[id]/meetings`
- Headers: sessão (`can(role,'update','meeting')`)
- Body: `{ id, ...campos }`
- Resposta: `Meeting` atualizado
- Status: 200, 401, 403, 400, 404, 500

- Endpoint: `DELETE /api/clients/[id]/meetings`
- Headers: sessão (`can(role,'delete','meeting')`)
- Body: `{ id }`
- Resposta: `{ success: true }`
- Status: 200, 401, 403, 404, 500

`src/app/api/clients/[id]/payment/route.ts`

- Endpoint: `GET /api/clients/[id]/payment`
- Headers: sessão (`can(role,'read','finance')`)
- Resposta: status mensal de pagamento
- Status: 200, 401, 403, 500

- Endpoint: `POST /api/clients/[id]/payment`
- Headers: sessão (`can(role,'create','finance')`)
- Body: `{ amount? }`
- Resposta: `{ success: true, message, status }`
- Status: 200, 401, 403, 404, 500

`src/app/api/clients/[id]/media/route.ts`

- Endpoint: `GET /api/clients/[id]/media`
- Headers: sessão (`can(role,'read','media')`)
- Query: `folderId` (vazio para raiz; específico para pasta)
- Resposta: `Media[]` com URLs atualizadas
- Status: 200, 401, 403, 404, 500

- Endpoint: `POST /api/clients/[id]/media`
- Headers: sessão (`can(role,'create','media')`)
- Body: `{ title, description?, url?, type, folderId? }`
- Resposta: `Media` criado (legado)
- Status: 200, 401, 403, 404, 500

- Endpoint: `PATCH /api/clients/media?mediaId=...`
- Headers: sessão (`can(role,'update','media')`)
- Body: `{ title?, description?, tags?, folderId? }`
- Resposta: `Media` atualizado
- Status: 200, 401, 403, 400, 404, 500

- Endpoint: `DELETE /api/clients/media?mediaId=...`
- Headers: sessão (`can(role,'delete','media')`)
- Resposta: `{ success: true }`
- Status: 200, 401, 403, 400, 404, 500

`src/app/api/admin/financial/reconcile-month/route.ts`

- Endpoint: `POST /api/admin/financial/reconcile-month`
- Headers: sessão (`OWNER`) ou `Authorization: Bearer <ADMIN_API_TOKEN>` + `orgId` no body/header
- Body: `{ year: number, month: number, targetIncome?: number, targetExpense?: number, orgId? }`
- Resposta: `{ ok: true, result }`
- Status: 200, 401, 400, 500

`src/app/api/clients/[id]/dashboard/route.ts`

- Endpoint: `GET /api/clients/[id]/dashboard`
- Headers: sessão (`can(role,'read','client')`)
- Resposta: dashboard do cliente via `getClientDashboard(orgId, clientId)`
- Status: 200, 401, 403, 404, 500

`src/app/api/clients/[id]/finance/route.ts`

- Endpoint: `GET /api/clients/[id]/finance`
- Headers: sessão (`can(role,'read','finance')`)
- Resposta: `Transaction[]` do cliente
- Status: 200, 401, 403, 404, 500

- Endpoint: `POST /api/clients/[id]/finance`
- Headers: sessão (`can(role,'create','finance')`)
- Body: `{ type, amount, description?, category?, date? }`
- Resposta: `Transaction` criado
- Status: 201, 401, 403, 404, 400, 500

- Endpoint: `PATCH /api/clients/[id]/finance?id=...`
- Headers: sessão (`can(role,'update','finance')`)
- Body: `{ type?, amount?, description?, category?, date? }`
- Resposta: `Transaction` atualizado
- Status: 200, 401, 403, 404, 500

- Endpoint: `DELETE /api/clients/[id]/finance?id=...`
- Headers: sessão (`can(role,'delete','finance')`)
- Resposta: `{ success: true }`
- Status: 200, 401, 403, 404, 500

`src/app/api/clients/[id]/installments/route.ts`

- Endpoint: `GET /api/clients/[id]/installments`
- Headers: sessão
- Resposta: `Installment[]`
- Status: 200, 401, 400, 404, 500

- Endpoint: `POST /api/clients/[id]/installments`
- Headers: sessão (`OWNER`)
- Body: `{ installmentCount, startDate }`
- Resposta: `{ message, count }`
- Status: 200, 403, 400, 404, 500

- Endpoint: `PATCH /api/clients/[id]/installments?installmentId=...`
- Headers: sessão (`OWNER`)
- Body: `{ status?, paidAt?, notes?, dueDate?, amount? }` (CONFIRMED chama PaymentService)
- Resposta: parcela atualizada
- Status: 200, 403, 400, 404, 500

- Endpoint: `DELETE /api/clients/[id]/installments[?installmentId=...]`
- Headers: sessão (`OWNER`)
- Resposta: mensagem de remoção única ou total
- Status: 200, 403, 400, 404, 500

`src/app/api/clients/[id]/installments-v2/route.ts`

- Endpoint: `GET /api/clients/[id]/installments-v2`
- Headers: sessão (`can(role,'read','finance')`)
- Resposta: parcelas via `PaymentService.getClientInstallments`
- Status: 200, 401, 403, 500

- Endpoint: `POST /api/clients/[id]/installments-v2?installmentId=...`
- Headers: sessão (`can(role,'create','finance')`)
- Resposta: `{ success, message, installments, monthStatus }`
- Status: 200, 401, 403, 400, 404, 500

`src/app/api/clients/[id]/payments/confirm/route.ts`

- Endpoint: `POST /api/clients/[id]/payments/confirm`
- Headers: sessão (`OWNER|STAFF`)
- Resposta: `{ success, finance, client }`
- Status: 200, 401, 403, 404, 400, 500

`src/app/api/clients/[id]/branding/route.ts`

- Endpoint: `GET /api/clients/[id]/branding`
- Headers: sessão (`can(role,'read','branding')`)
- Resposta: `Branding[]`
- Status: 200, 401, 403, 404, 500

- Endpoint: `POST /api/clients/[id]/branding`
- Headers: sessão (`can(role,'create','branding')`)
- Body: `{ title, type, description?, fileUrl?, content?, thumbUrl?, palette? }`
- Resposta: `Branding` criado
- Status: 200, 401, 403, 404, 500

- Endpoint: `PATCH /api/clients/branding?brandingId=...`
- Headers: sessão (`can(role,'update','branding')`)
- Body: campos parciais, aceita `null` explícito
- Resposta: `Branding` atualizado
- Status: 200, 401, 403, 400, 404, 500

- Endpoint: `DELETE /api/clients/branding?brandingId=...`
- Headers: sessão (`can(role,'delete','branding')`)
- Resposta: `{ success: true }`
- Status: 200, 401, 403, 400, 404, 500

`src/app/api/clients/[id]/media/upload-url/route.ts`

- Endpoint: `POST /api/clients/[id]/media/upload-url`
- Headers: sessão válida
- Body: `{ name, mime }`
- Resposta: `{ url, fileKey, expiresIn }`
- Status: 200, 401, 404, 400, 501, 500

`src/app/api/clients/[id]/media/upload/route.ts`

- Endpoint: `POST /api/clients/[id]/media/upload`
- Headers: sessão válida; form-data com `file`, `title?`, `description?`, `folderId?`, `tags?`, `isLogo?`, `colors?`
- Resposta: `Media` com URLs atualizadas
- Status: 200, 401, 403, 404, 400, 500

`src/app/api/clients/[id]/media/folders/route.ts`

- Endpoint: `GET /api/clients/[id]/media/folders`
- Headers: sessão (`can(role,'read','media')`)
- Resposta: `MediaFolder[]` com `_count`
- Status: 200, 401, 403, 404, 500

- Endpoint: `POST /api/clients/[id]/media/folders`
- Headers: sessão (`can(role,'create','media')`)
- Body: `{ name, description?, parentId? }`
- Resposta: `MediaFolder` criado
- Status: 200, 401, 403, 404, 409, 400, 500

- Endpoint: `PATCH /api/clients/[id]/media/folders?folderId=...`
- Headers: sessão (`can(role,'update','media')`)
- Body: `{ name?, description?, parentId? }` (valida parent)
- Resposta: `MediaFolder` atualizado
- Status: 200, 401, 403, 404, 400, 500

- Endpoint: `DELETE /api/clients/[id]/media/folders?folderId=...`
- Headers: sessão (`can(role,'delete','media')`)
- Resposta: `{ success: true }`
- Status: 200, 401, 403, 404, 400, 500

`src/app/api/clients/[id]/media/register/route.ts`

- Endpoint: `POST /api/clients/[id]/media/register`
- Headers: sessão válida
- Body: `{ fileKey, mimeType, title?, description?, tags?, folderId?, fileSize? }`
- Resposta: `Media` registrado com URL
- Status: 200, 401, 404, 400, 500
