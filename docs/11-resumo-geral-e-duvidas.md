# Resumo Geral e Dúvidas

## Resumo Executivo

- Estado: Projeto robusto com domínios de clientes, finanças e mídia; App Router e Prisma bem estruturados.
- Pontos fortes: modelagem de dados, separação de serviços, variedade de rotas.
- Fragilidades: padronização de respostas, autenticação/autorização centralizada, transações em fluxos financeiros.

## Dúvidas para o Time

- Autenticação: fluxo exato (Firebase Edge? cookies? middleware?), escopos por `Role`.
- Permissões: regras claras para `OWNER`, `STAFF`, `CLIENT` em cada rota.
- Uploads: estratégia final (S3 vs R2), limites e políticas de expiração.
- Financeiro: origem dos números de fatura, reconciliação com sistemas externos.
- Branding: processo de geração de paleta e aprovação pelo cliente.
- Relatórios: KPIs prioritários e periodicidade.
