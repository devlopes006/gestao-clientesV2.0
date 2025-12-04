# Visão Geral

- Nome do projeto: Gestão Clientes V2.0
- Objetivo: Plataforma de gestão de clientes, finanças e mídia para pequenas agências/consultorias, com controle de contratos, faturas, despesas recorrentes, mídia e colaboração entre membros e clientes.

## Stack de Tecnologias

- Next.js: `16.0.1`
- React: `19.2.0`
- Tailwind CSS: `^3.4.13`
- Prisma: `^7.0.1`
  - Banco: PostgreSQL (`datasource db { provider = "postgresql" }`)
- Principais libs:
  - `@tanstack/react-query` (fetch/cache de dados no cliente)
  - `zod` (validação)
  - `pg` + `@prisma/adapter-pg` (pool manual com Prisma)
  - Radix UI (`@radix-ui/*`) componentes acessíveis
  - `firebase` / `firebase-admin` (auth/integrações)
  - `@aws-sdk/*` (S3/R2 upload/assinado)
  - `next-themes` (tema dark/light)
  - `posthog-js` (analytics)
  - `resend` (email)
  - `framer-motion`, `lucide-react`, `clsx`, `class-variance-authority`

## Scripts (package.json)

- `dev`, `build`, `start`, `lint`, `type-check`, `format`
- Prisma: `prisma:generate`, `prisma:migrate`, `prisma:deploy`, `db:push`, `prisma:studio`, `db:seed`
- Testes: `test` (vitest), `e2e` (playwright), `e2e:smoke`, `e2e:ui`, `visual:diff`
- Docker: `docker:build`, `docker:up`, `docker:down`, `docker:logs`
- Deploy: `deploy:prod` (Netlify/Docker), `health`

## Estrutura Geral de Pastas

- Páginas/rotas: `src/app/` (App Router)
- Componentes: `src/components/**`
- Hooks/serviços: `src/services/**`, `src/lib/**`, `src/styles/**`
- API interna: `src/app/api/**`
- Banco/Prisma: `prisma/schema.prisma`, `prisma/migrations/**`, client em `src/lib/prisma.ts`

## Principais Módulos/Features

- Clientes, Mídia, Branding: `src/app/client/**`, `src/app/media/**`, `src/app/api/branding/**`
- Finanças: faturas, transações, despesas recorrentes, relatórios
  - APIs: `src/app/api/invoices/**`, `transactions/**`, `recurring-expenses/**`, `reports/**`
  - Serviços: `src/services/financial/**`
- Convites e Membros: `src/app/api/invites/**`, `members/**`
- Sessão/Org: `src/app/api/session/**`, `org/**`, `src/services/org/session.ts`
- Uploads/Storage: `src/app/api/uploads/**` (R2/S3), `next.config.ts` `images.remotePatterns`
- Notificações/Dashboard: `src/app/api/notifications/**`, `dashboard/**`

## Interação do Usuário (Visão de Produto)

- Usuário acessa `src/app/login/page.tsx` para autenticação (Firebase/Edge, hipótese baseada em dependências).
- Membros da organização gerenciam clientes, mídia, tarefas e finanças via `src/app/dashboard/**` e páginas específicas.
- Clientes podem receber convites (`invites`) e acessar conteúdos e faturas.
- Upload de mídias e geração de paleta/branding, organização por pastas.
- Relatórios financeiros diários/mensais e reconciliação administrativa.
