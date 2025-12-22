# 🔥 URGENT: Production Database Mismatch Resolution

## Problem Identified

**Production Netlify is using a DIFFERENT database than your local `.env` files.**

### Evidence

- Local: All migrations applied successfully (36 migrations)
- Netlify Production: Schema errors (tables/enums missing)
- Same DATABASE_URL in local files but different behavior

### Root Cause

Netlify environment variables are **NOT synced with your local .env files**. Netlify has its own DATABASE_URL that points to an outdated or empty database.

## ✅ IMMEDIATE ACTION REQUIRED

### 1. Check Netlify Environment Variables

1. Go to: https://app.netlify.com/sites/[your-site-name]/configuration/env
2. Find `DATABASE_URL` variable
3. **Compare** with your local `.env.production`:
   ```
   postgresql://neondb_owner:npg_Dna5cbuifP8g@ep-spring-glade-acb51twk-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   ```

### 2. Two Possible Scenarios

#### Scenario A: Netlify DATABASE_URL is DIFFERENT

**Solution**: Update Netlify env var to match production:

1. Copy DATABASE_URL from `.env.production`
2. Update in Netlify dashboard
3. Trigger new deploy
4. Migrations will run automatically (we added `prisma:migrate:deploy` to build)

#### Scenario B: Netlify DATABASE_URL is SAME but DB is empty

**Solution**: The Neon database might have been reset or you're using branch/separate DB:

1. Run migrations against Netlify's DATABASE_URL manually:

   ```bash
   # Set Netlify's DATABASE_URL (get from dashboard)
   $env:DATABASE_URL = "netlify-database-url-here"

   # Apply migrations
   pnpm prisma migrate deploy
   ```

### 3. Verify Netlify Build Logs

Check if migrations run during build:

1. Go to Netlify Deploys
2. Check latest deploy log
3. Look for: `prisma migrate deploy`
4. If missing, our netlify.toml update didn't apply yet

## 🔧 Quick Fix Commands

### Get Netlify Environment Variables (CLI)

```bash
# Install Netlify CLI if needed
npm install -g netlify-cli

# Login
netlify login

# Link to site
netlify link

# Check env vars
netlify env:list
```

### Manual Migration to Netlify DB

```bash
# 1. Get DATABASE_URL from Netlify dashboard
# 2. Set it temporarily
$env:DATABASE_URL = "your-netlify-database-url"

# 3. Check status
pnpm prisma migrate status

# 4. Deploy migrations
pnpm prisma migrate deploy

# 5. Verify
pnpm prisma db pull
```

## 📊 Verification Steps

After fixing:

1. Check Netlify deploy logs for migration success
2. Test production endpoints:
   - https://your-site.netlify.app/api/health
   - https://your-site.netlify.app/api/dashboard
3. Verify no more Prisma errors in logs
4. Check Sentry for reduced error rate

## 🎯 Root Cause Analysis

The build command now includes migrations:

```toml
command = "pnpm install --frozen-lockfile && pnpm run prisma:migrate:deploy && pnpm run prisma:generate && pnpm run build"
```

This will:

1. Install dependencies
2. **Apply pending migrations** (NEW - this fixes the issue)
3. Generate Prisma Client
4. Build Next.js

## 📝 Next Deploy Checklist

- [ ] Verify Netlify DATABASE_URL matches production
- [ ] Commit and push netlify.toml changes
- [ ] Trigger new Netlify deploy
- [ ] Monitor build logs for "36 migrations found"
- [ ] Verify "No pending migrations" or "X migrations applied"
- [ ] Test production site
- [ ] Verify Redis cache works (or falls back gracefully)
- [ ] Check permission audit logging

## ⚠️ Important Notes

1. **Neon Branching**: If you use Neon database branching, ensure production points to `main` branch
2. **Connection Pooler**: `-pooler` suffix is correct for serverless/Netlify
3. **Build-time vs Runtime**: Migrations run at build time; verify DATABASE_URL is available during build
4. **Prisma Client**: Must regenerate after schema changes

## 🔗 Related Updates Made

- ✅ [netlify.toml](netlify.toml) - Added `prisma:migrate:deploy` to build
- ✅ [package.json](package.json) - Added explicit migration script
- ✅ [docs/PRODUCTION_MIGRATION_GUIDE.md](docs/PRODUCTION_MIGRATION_GUIDE.md) - Detailed guide
- ✅ [scripts/check-db-urls.mjs](scripts/check-db-urls.mjs) - DB URL diagnostic tool

---

**Action Required**: Check Netlify DATABASE_URL and trigger a new deploy.
