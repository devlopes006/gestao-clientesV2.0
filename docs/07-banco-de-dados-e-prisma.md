# Banco de Dados e Prisma

## Tipo de Banco

- PostgreSQL (`datasource db { provider = "postgresql" }`).

## Models (Resumo)

- `User`: id, email (unique), firebaseUid (unique), relações com `Org` (owner), `Member`, `Notification`, `Client?`.
- `Org`: ownerId, clientes, custos, eventos, notas, invites, invoices, media, members, notifications, expenses, tasks, transactions.
- `Member`: `@@unique([userId, orgId])` (um vínculo por org).
- `Client`: dados pessoais, contrato, parcelamento, instagram, `cpf/cnpj @unique`, índices por `orgId`, `status`, etc.
- `Task`: tarefas por cliente/org.
- `Media`/`MediaFolder`: hierarquia com relação `FolderHierarchy`.
- `Invite`: token único, status, relacionamento opcional com `Client`.
- `Strategy`/`Branding`: conteúdos por cliente.
- `CostItem`/`ClientCostSubscription`: custos e assinaturas, índices e `@@unique([clientId, costItemId, startDate])`.
- `Meeting`: agendamentos do cliente.
- `Installment`: parcela com possível relação 1-1 com `Invoice`.
- `Transaction`: transações com tipo/subtipo/status, relacionamentos e índices.
- `Invoice`/`InvoiceItem`: faturas e itens, índices e relações com `Transaction`.
- `RecurringExpense`: despesas recorrentes por org.
- `WebhookEvent`, `Notification`, `DashboardEvent`, `DashboardNote`: utilitários.

## Prisma Client

- Inicialização: `src/lib/prisma.ts` com `pg.Pool` e `@prisma/adapter-pg`.
- Uso principal em `src/services/**` (finanças, org, pagamentos, clientes) e rotas API.

## Migrations

- Pasta: `prisma/migrations/**` (não detalhada aqui; analisar nomes para evolução quando necessário).

## Pontos de Atenção

- Relações opcionais `Invoice ↔ Installment` e `Transaction ↔ Invoice` exigem consistência transacional.
- Uniques em `Client` (`cpf/cnpj`, `clientUserId`) devem ter validação na API.
- Índices podem ser revisados para queries frequentes (relatórios por período e status já atendidos).
