# Melhorias e Implementações

## Técnicas

- Padronizar responses nas rotas (`{ success, data, error }`).
- Centralizar autenticação/autorização: middleware utilitário para obter `user/org`.
- Prisma: usar transações (`prisma.$transaction`) em operações Invoice/Transaction/Installment.
- DTOs com Zod para todas as APIs; validações de `cpf/cnpj` e `number` de fatura.
- Paginação e filtros nas listagens (React Query + server-side params).
- Observabilidade: habilitar Sentry (`@sentry/nextjs`) com performance.

## Experiência

- Feedbacks claros em uploads e geração de presigned URLs.
- Estados de carregamento/esqueleto nas páginas de lista.
- Tabela de faturas com filtros por status/período, export CSV.

## Novas Funcionalidades

- Relatórios avançados: projeções de receita, inadimplência por cliente.
- Tarefas agendadas: normalização/reconciliação mensal via cron (rota `cron` existente).
- Notificações por e-mail usando Resend em eventos financeiros.

## Roadmap

- Curto prazo: responses padronizadas, transações Prisma, validações Zod.
- Médio prazo: filtros/paginação, exportações, Sentry.
- Longo prazo: automações e integrações adicionais (contabilidade, gateways de pagamento).
