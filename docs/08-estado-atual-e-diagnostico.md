# Estado Atual e Diagnóstico

## Frontend

- Descrição: App Router com páginas de dashboard, mídia, cliente e login; Tailwind e Design System customizados.
- Status: Parcial — estrutura bem definida, mas faltam confirmações de autenticação e algumas páginas não analisadas integralmente.
- Evidências: `src/app/**`, `tailwind.config.ts`, dependências de UI.

## Back/API

- Descrição: Rotas em `src/app/api/**` separadas por domínio (finanças, uploads, invites, etc.).
- Status: OK — variedade de rotas e serviços; precisa padronização de responses.
- Evidências: múltiplas `route.ts` encontradas.

## Banco/Prisma

- Descrição: Schema robusto com relações e índices adequados ao domínio.
- Status: OK — boa modelagem; pontos de atenção em integrações transacionais.
- Evidências: `prisma/schema.prisma`, `src/lib/prisma.ts`.

## Regras de Negócio

- Descrição: espalhadas entre serviços e API; coerentes com domínio.
- Status: Parcial — exige documentação e testes de unidade.
- Evidências: `src/services/financial/**`, `src/services/org/session.ts`.

## Riscos Técnicos

- Autenticação e autorização entre rotas (garantir uso consistente).
- Operações financeiras sem transação podem gerar inconsistência (Invoice/Transaction/Installment).
- Upload/Storage: garantir segurança dos presigned URLs e validação de MIME.
- Uso de React 19 e Next 16: atenção a compatibilidades de libs e React Compiler.
