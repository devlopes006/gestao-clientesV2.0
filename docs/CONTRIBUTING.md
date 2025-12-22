# Contribuindo

Este projeto segue uma arquitetura por domínios com separação clara de camadas e contratos. Use este guia para manter consistência.

## Estrutura de pastas

- `src/domain/<recurso>/validators.ts`: Schemas Zod e contratos de entrada para APIs e UI.
- `src/services/*`: Serviços de domínio (regras de negócio) e casos de uso.
- `src/app/api/*`: Handlers finos – validação, autorização, chamada de serviços e montagem de resposta.
- `src/types/api.ts`: DTOs tipados derivados dos schemas Zod para compartilhar no front/back.
- `src/components/ui/*`: Biblioteca base de componentes (Button, Input, Card, Badge, etc.).

## Padrões de API

- Sempre validar entrada com Zod a partir de `src/domain/<recurso>/validators`.
- Paginação cursor-based: suportar `cursor` e `limit`, retornar `{ meta: { nextCursor, hasNextPage, limit } }`.
- Rate limiting: aplicar `checkRateLimit` em rotas sensíveis (auth, import/export, financeiro).
- Observabilidade: capturar exceções com Sentry (`@sentry/nextjs`) e adicionar breadcrumbs.

## Autorização e multi-tenant

- Usar `middleware.ts`/`src/proxy.ts` para proteger rotas e padronizar headers de segurança.
- Dentro dos handlers, checar `getSessionProfile()` e `orgId` antes de acessar dados.
- Regras de acesso por `role`: `OWNER` para `admin/billing`; `CLIENT` com acesso restrito ao próprio escopo.

## Regras de negócio

- Extrair lógica de domínio para serviços (ex.: geração de parcelas em `ClientBillingService.generateInstallments`).
- Handlers não devem conter loops/lógicas complexas; apenas orquestram validação, autorização e chamadas.

## Banco de dados (Prisma)

- Preferir `Decimal`/`@db.Numeric` para valores monetários.
- Usar `deletedAt` para soft-delete e filtrar em repositórios quando aplicável.
- Definir `onDelete` explícito em relações sensíveis.

## Testes

- Unit (Vitest): cobrir serviços e casos críticos de domínio.
- Integração (Vitest): cobrir contratos de APIs, autorização e validação.
- E2E (Playwright): cenários mínimos estáveis (auth, dashboard, fluxos principais).
