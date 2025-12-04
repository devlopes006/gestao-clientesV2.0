# Ambiente e Scripts

## Scripts

- `dev`: inicia ambiente de desenvolvimento.
- `build`: build Next e cópia de `_headers`.
- `start`: inicia servidor de produção.
- `lint`: ESLint.
- `type-check`: TypeScript sem emissão.
- `format`: Prettier.
- Prisma: `prisma:generate`, `prisma:migrate`, `prisma:deploy`, `db:push`, `prisma:studio`, `db:seed`.
- Testes: `test` (vitest), `e2e` (playwright), `e2e:smoke`, `e2e:ui`.
- Docker: `docker:*`.

## Desenvolvimento

```bash
pnpm install
pnpm dev
```

## Build Produção

```bash
pnpm build
pnpm start
```

## Prisma

```bash
# Gerar client
pnpm prisma:generate
# Migrar desenvolvimento
pnpm prisma:migrate
# Deploy migrations produção
pnpm prisma:deploy
# Studio
pnpm prisma:studio
```

## Lint e Testes

```bash
pnpm lint
pnpm type-check
pnpm test
pnpm e2e
```

## Dependências Principais

- Next.js, React, Tailwind, Prisma, React Query, Zod, Radix UI, Firebase, AWS SDK, PostHog, Resend.

## Requisitos

- Node.js: não especificado em `engines`. Assumir LTS atual.

## Variáveis de Ambiente (inferidas)

- `DATABASE_URL`: conexão Postgres.
- `S3_BUCKET`, `AWS_REGION`: domínio de imagens/armazenamento.
- Chaves Firebase, Resend, PostHog conforme integrações.
