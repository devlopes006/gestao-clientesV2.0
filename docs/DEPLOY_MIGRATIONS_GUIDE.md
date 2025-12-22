# 🚀 Guia: Como Aplicar Migrações em Produção

## Por Que Removemos Migrações do Build?

**Problema**: Prisma precisa de um "lock" exclusivo no banco durante migrações. No Netlify:

- Builds paralelos competem pelo mesmo lock
- Neon (pooler) pode limitar conexões simultâneas
- Timeout de 10s é insuficiente em ambientes serverless

**Solução**: Aplicar migrações **manualmente** antes do deploy, não durante o build.

## 📋 Quando Aplicar Migrações

### Cenário 1: Nova Migração Criada Localmente

```bash
# 1. Crie a migração localmente
pnpm prisma migrate dev --name add_new_feature

# 2. Teste localmente
pnpm dev

# 3. Aplique em produção ANTES do deploy
$env:DATABASE_URL = "sua-url-producao"
pnpm prisma migrate deploy

# 4. Commit e push
git add prisma/migrations
git commit -m "feat: add new feature migration"
git push origin master
```

### Cenário 2: Pull de Novas Migrações do Repositório

```bash
# 1. Pull das alterações
git pull origin master

# 2. Verifique se há migrações pendentes em produção
$env:DATABASE_URL = "sua-url-producao"
pnpm prisma migrate status

# 3. Se houver pendentes, aplique
pnpm prisma migrate deploy

# 4. Deploy automático via push
git push origin master
```

## 🔧 Comandos Úteis

### Verificar Status das Migrações

```bash
# Local
pnpm prisma migrate status

# Produção (defina DATABASE_URL primeiro)
$env:DATABASE_URL = "postgresql://neondb_owner:npg_Dna5cbuifP8g@ep-spring-glade-acb51twk-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require"
pnpm prisma migrate status
```

### Aplicar Migrações Manualmente

```bash
# Produção
$env:DATABASE_URL = "sua-url-producao"
pnpm prisma migrate deploy
```

### Resolver Lock Travado

Se você ver erro de lock travado:

```sql
-- Conecte ao banco e execute:
SELECT pg_advisory_unlock_all();

-- Ou force liberação de locks específicos:
SELECT
  pid,
  locktype,
  mode,
  granted,
  query_start,
  state
FROM pg_stat_activity
WHERE state = 'active' AND query LIKE '%advisory%';

-- Kill processo travado (se necessário):
SELECT pg_terminate_backend(pid);
```

## ⚠️ Importante

### NÃO Faça

- ❌ Adicionar `prisma migrate deploy` de volta no build do Netlify
- ❌ Rodar migrações durante build automático
- ❌ Ignorar status de migrações antes do deploy

### FAÇA

- ✅ Aplique migrações manualmente em produção
- ✅ Verifique `prisma migrate status` antes de deploy importante
- ✅ Teste migrações localmente primeiro
- ✅ Documente migrações complexas (ex: que requerem dados)

## 🎯 Fluxo Recomendado

```mermaid
graph TD
    A[Criar migração local] --> B[Testar localmente]
    B --> C[Aplicar em produção manualmente]
    C --> D[Verificar com migrate status]
    D --> E[Commit e push]
    E --> F[Deploy automático Netlify]
```

## 📝 Checklist para Deploy com Migração

- [ ] Migração testada localmente
- [ ] `pnpm prisma migrate deploy` executado em produção
- [ ] `pnpm prisma migrate status` confirma "No pending migrations"
- [ ] Backup do banco feito (se migração destrutiva)
- [ ] Código committed e pushed
- [ ] Deploy Netlify monitorado
- [ ] Funcionalidades testadas em produção

## 🔗 Build Atual do Netlify

```toml
[build]
  command = "pnpm install --frozen-lockfile && pnpm run prisma:generate && pnpm run build"
  publish = ".next"
```

**Não inclui** `prisma:migrate:deploy` - migrações são manuais.

## 💡 Dica Pro

Configure variável de ambiente para facilitar:

```bash
# Windows PowerShell (.bashrc ou perfil PowerShell)
$env:DATABASE_URL_PROD = "postgresql://..."

# Depois use:
$env:DATABASE_URL = $env:DATABASE_URL_PROD
pnpm prisma migrate deploy
```

---

**Resumo**: Migrações são feitas **antes** do deploy, não **durante** o build.
