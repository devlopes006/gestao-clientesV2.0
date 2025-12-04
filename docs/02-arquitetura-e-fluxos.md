# Arquitetura e Fluxos

## Arquitetura Next.js

- Router: App Router (`src/app/**`).
- Componentes Server vs Client: mistura (hipótese). Presença de hooks/client libs (React Query, next-themes) indica componentes Client em páginas de dashboard e mídia.
- Camadas lógicas:
  - `src/lib/`: utilitários base (ex.: `src/lib/prisma.ts`).
  - `src/services/**`: lógica de domínio (finanças, org, pagamentos, notificações).
  - `src/app/api/**`: endpoints HTTP (rota por feature).
  - `src/components/**`: UI e layouts.

## Fluxos Principais

### Autenticação/Login (Hipótese)

- Rota: `src/app/login/page.tsx`.
- Autenticação via Firebase (`next-firebase-auth-edge`) e Sentry/Edge config presente. Tokens/sessão validados em rotas `src/app/api/session/**`.

### Gestão de Clientes

- Páginas: `src/app/client/**`.
- Serviços: `src/services/repositories/clients.ts` usando Prisma.
- API: `src/app/api/clients/**` (CRUD, listagem, filtros).

### Finanças

- Faturas: `src/app/api/invoices/**`, `src/services/financial/InvoiceService.ts`.
- Transações: `src/app/api/transactions/**`, `src/services/financial/TransactionService.ts`.
- Despesas Recorrentes: `src/app/api/recurring-expenses/**`, `src/services/financial/RecurringExpenseService.ts`.
- Relatórios: `src/app/api/reports/**`, `src/services/financial/ReportingService.ts`.

### Mídia e Branding

- Mídia: `src/app/media/**`, `src/app/api/uploads/**`, `src/app/api/branding/**`, `src/services/**` auxiliares.
- Pastas de mídia: `MediaFolder` no Prisma; organização hierárquica.

### Convites/Membros

- Convites: `src/app/api/invites/**`.
- Membros: `src/app/api/members/route.ts`.

## Diagramas Textuais

- Usuário acessa `src/app/dashboard/page.tsx` → componente Dashboard → consulta `src/app/api/reports/dashboard/route.ts` → `ReportingService` → Prisma `Transaction`, `Invoice` → retorna métricas.
- Usuário acessa `src/app/media/page.tsx` → componente Media Library → chama `src/app/api/uploads/*` → Armazenamento (R2/S3) → grava `Media` em Prisma.
- Usuário cria fatura em `src/app/invoices/page.tsx` → POST `src/app/api/invoices/route.ts` → `InvoiceService` → cria `Invoice` + `InvoiceItem` → retorna fatura.

## Padrões de Arquitetura

- Separação por features nas rotas `app/api`.
- Prisma client centralizado (`src/lib/prisma.ts`) com pool `pg`.
- Serviços por contexto de domínio em `src/services/financial/**`.
