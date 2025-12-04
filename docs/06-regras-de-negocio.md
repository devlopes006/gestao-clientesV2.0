# Regras de Negócio

## Principais Regras (Prisma)

- Clientes possuem plano (`ClientPlan`) e canal principal (`SocialChannel`).
- Pagamentos/Parcelas: `Installment` com `PaymentStatus` e relação opcional com `Invoice`.
- Faturas: `Invoice` com `InvoiceItem`, status (`InvoiceStatus`), índices por `orgId`, `clientId`, `status`.
- Transações: `Transaction` com `TransactionType` e `TransactionSubtype`, ligação opcional a `Invoice`/`Client`/`CostItem`.
- Despesas Recorrentes: `RecurringExpense` com ciclo (`ExpenseCycle`).
- Membros e Convites: `Member` com `Role`, `Invite` com `InviteStatus`.
- Mídia e Pastas: `Media` e `MediaFolder` com hierarquia (`FolderHierarchy`).

## Implementações

- Validações: uso de índices/uniques no Prisma (ex.: `Client.cpf/cnpj @unique`, `Invoice.number @unique`).
- Restrições: relações cascade em mídia/faturas/itens.

## Pontos de Atenção

- Regras espalhadas entre API e serviços: consolidar em `src/services/**` com testes.
- Evitar lógica financeira na UI.
- Adotar Zod para DTOs de entrada em APIs.
