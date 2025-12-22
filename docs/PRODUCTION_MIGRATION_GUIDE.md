# 🚨 Production Schema Migration Guide

**Issue**: Production DB schema is out of sync with codebase  
**Timestamp**: December 22, 2025  
**Severity**: HIGH - Multiple P2021/P2022 errors in production

## 📊 Current Status

### Missing in Production

- ❌ `WhatsAppMessage` table
- ❌ `TransactionStatus` enum type
- ❌ `TransactionType` enum type
- ❌ Multiple columns in existing tables (Invoice, Task, Client)

### Root Cause

**Migrations not applied to production database**. The Netlify build runs `prisma:generate` but NOT `prisma migrate deploy`.

## 🔧 Immediate Fix

### Step 1: Verify Production Database URL

Check Netlify environment variables:

1. Go to Netlify Dashboard → Site Settings → Environment Variables
2. Verify `DATABASE_URL` is set correctly
3. **Critical**: Ensure it points to your **production** Neon database

Current local `.env.production`:

```
DATABASE_URL='postgresql://neondb_owner:npg_Dna5cbuifP8g@ep-spring-glade-acb51twk-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
```

### Step 2: Apply Migrations to Production

**Option A: Manual Migration (Recommended for first time)**

```bash
# Set production DATABASE_URL
$env:DATABASE_URL = "postgresql://neondb_owner:npg_Dna5cbuifP8g@ep-spring-glade-acb51twk-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Check status
pnpm prisma migrate status

# Deploy all pending migrations
pnpm prisma migrate deploy

# Verify schema
pnpm prisma db pull --force
```

**Option B: Add to Netlify Build (Permanent fix)**

Update [netlify.toml](netlify.toml):

```toml
[build]
  command = "pnpm install --frozen-lockfile && pnpm run prisma:migrate:deploy && pnpm run prisma:generate && pnpm run build"
  publish = ".next"
```

Add script to [package.json](package.json):

```json
{
  "scripts": {
    "prisma:migrate:deploy": "prisma migrate deploy"
  }
}
```

### Step 3: Test Locally Against Production DB

```bash
# Use production DB URL
$env:DATABASE_URL = "your-production-url"

# Run dev server
pnpm dev

# Test critical endpoints:
# - GET /api/dashboard
# - GET /api/notifications
# - GET /api/leads
# - GET /api/whatsapp/messages
```

## 📋 Migration Checklist

- [ ] Backup production database (Neon automatic backups enabled?)
- [ ] Verify `DATABASE_URL` in Netlify matches production
- [ ] Run `prisma migrate deploy` against production
- [ ] Verify all 36 migrations applied
- [ ] Test production site (dashboard, invoices, tasks, WhatsApp)
- [ ] Update Netlify build command to include migrations
- [ ] Monitor Netlify logs for next deploy

## 🔍 Verification Commands

After migration:

```bash
# Check applied migrations
pnpm prisma migrate status

# Verify tables exist
psql $DATABASE_URL -c "\dt public.*"

# Verify enums
psql $DATABASE_URL -c "\dT public.*"

# Test WhatsAppMessage table
psql $DATABASE_URL -c "SELECT count(*) FROM \"WhatsAppMessage\";"
```

## ⚠️ Important Notes

1. **Neon DB Pooler**: Your DATABASE_URL uses `-pooler` which is correct for serverless. Migrations work with pooled connections.

2. **Schema Drift**: If you see "schema drift" errors:

   ```bash
   pnpm prisma migrate resolve --applied <migration-name>
   ```

3. **Firestore Sync**: After migration, verify `FirestoreSync` queue processes correctly.

4. **Redis Cache**: Permission cache will rebuild automatically after migration.

## 🚀 Post-Migration

1. Clear any cached Prisma client in Netlify:
   - Trigger a new deploy or clear cache manually

2. Verify production logs:

   ```bash
   netlify logs
   ```

3. Test RBAC features:
   - Permission checks should work
   - Audit logging should capture events

## 📞 Rollback Plan

If migration fails:

```bash
# Restore from Neon backup
# (use Neon dashboard to restore to a point-in-time)

# Or reset specific migrations:
pnpm prisma migrate resolve --rolled-back <failed-migration>
```

## 🔗 Related Files

- [prisma/schema.prisma](prisma/schema.prisma) - Current schema
- [netlify.toml](netlify.toml) - Build config
- [.env.production](.env.production) - Production env vars
- [scripts/netlify-build-with-guard.mjs](scripts/netlify-build-with-guard.mjs) - Build script

---

**Next Steps**: Run `prisma migrate deploy` with production DATABASE_URL set.
