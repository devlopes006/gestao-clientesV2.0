# Database Query Optimization Analysis

## Current State Analysis

The Prisma schema has good index coverage for most common queries. Below is an analysis of existing indexes and recommendations for further optimization.

## Existing Indexes (Well-Optimized)

### ✅ Client Model

- `@@index([orgId, status])` - List clients by org and status
- `@@index([orgId, createdAt])` - Client creation timeline
- `@@index([email])` - Email lookups
- `@@index([cpf])` - CPF lookups
- `@@index([cnpj])` - CNPJ lookups
- `@@index([orgId, plan])` - Clients by plan type
- `@@index([orgId, mainChannel])` - Clients by social channel
- `@@index([orgId, paymentStatus])` - Payment status filtering

### ✅ Transaction Model

- `@@index([orgId, date])` - Date range queries (dashboard)
- `@@index([orgId, type, date])` - Income/expense by date
- `@@index([clientId, date])` - Client transaction history
- `@@index([invoiceId])` - Invoice-related transactions
- `@@index([orgId, status])` - Transaction status filtering
- `@@index([deletedAt])` - Soft-delete queries

### ✅ Invoice Model

- `@@index([orgId, clientId, status])` - Composite query optimization
- `@@index([orgId, dueDate])` - Due date filtering (overdue detection)
- `@@index([clientId, status])` - Client-specific invoice status
- `@@index([deletedAt])` - Soft-delete queries

### ✅ Task Model

- `@@index([clientId, status])` - Client task lists
- `@@index([orgId, dueDate])` - Org-wide deadline tracking
- `@@index([orgId, status, dueDate])` - Composite task filtering
- `@@index([assignee, status])` - User task management

## Additional Indexes Recommended

### 1. Transaction Model - Missing Indexes

**Add composite index for cost tracking queries:**

```prisma
@@index([orgId, costItemId, date])
```

**Reason:** Cost tracking queries often filter by org + cost item + date range. This composite index will speed up cost analysis and monthly materialization queries.

**Add composite index for subtype queries:**

```prisma
@@index([orgId, subtype, date])
```

**Reason:** Reports often group by transaction subtype (INVOICE_PAYMENT, INTERNAL_COST, etc.). This helps with categorized reporting.

### 2. Invoice Model - Additional Optimization

**Add index for overdue detection:**

```prisma
@@index([orgId, status, dueDate])
```

**Reason:** The overdue detection query filters by org + status (OPEN) + dueDate < now. A composite index covering all three fields will eliminate table scans.

### 3. DashboardEvent Model

**Existing index is good:**

```prisma
@@index([orgId, date]) // Already present
```

### 4. RecurringExpense Model

**Add composite index for active expense queries:**

```prisma
@@index([orgId, cycle, active])
```

**Reason:** Monthly/annual expense calculation queries filter by org + cycle + active status. This composite index will speed up recurring expense processing.

## Query Pattern Analysis

### Most Common Query Patterns (from domain services):

1. **Dashboard Queries** (ReportingService.getDashboard):
   - Transaction aggregations by orgId + date range
   - Invoice counts by orgId + status + date range
   - Client counts by orgId + paymentStatus
   - **Current indexes are sufficient** ✅

2. **Transaction Summary** (TransactionService.summary):
   - Aggregations by orgId + date range + type
   - **Current indexes are sufficient** ✅

3. **Cost Tracking** (CostTrackingService):
   - ClientCostSubscription by clientId + active
   - CostItem transactions by orgId + costItemId + date
   - **Needs improvement:** Add `@@index([orgId, costItemId, date])` to Transaction model

4. **Invoice Automation** (FinancialAutomationService):
   - Overdue detection: orgId + status + dueDate
   - **Needs improvement:** Add `@@index([orgId, status, dueDate])` to Invoice model

5. **Client Analysis**:
   - Client transactions by clientId + date (already indexed) ✅
   - Client invoices by clientId + status (already indexed) ✅

## Eager Loading Recommendations

### Current Service Layer Analysis

Most domain services use repository pattern with explicit `include` clauses. This is good for avoiding N+1 queries.

### Recommended Improvements:

1. **TransactionService.list** - Already includes client relation ✅
2. **InvoiceService.list** - Already includes client relation ✅
3. **CostTrackingService.calculateClientMargin**:
   - Ensure `include: { client: true }` when fetching subscriptions
   - Include cost item details to avoid additional queries

## Migration Plan

### Step 1: Add Missing Indexes

Create migration file to add recommended indexes:

```prisma
// Add to Transaction model:
@@index([orgId, costItemId, date])
@@index([orgId, subtype, date])

// Add to Invoice model:
@@index([orgId, status, dueDate])

// Add to RecurringExpense model:
@@index([orgId, cycle, active])
```

### Step 2: Test Query Performance

After adding indexes:

1. Run production-like queries with `EXPLAIN ANALYZE`
2. Monitor Prisma query logs
3. Check query execution times in dashboard

### Step 3: Monitor Production Metrics

- Track P95/P99 query latency
- Monitor index usage stats
- Identify slow query patterns with Sentry

## Estimated Performance Impact

- **Dashboard queries**: 20-30% faster (already well-indexed, cache will help more)
- **Cost tracking queries**: 40-60% faster (new index eliminates table scan)
- **Overdue detection**: 30-50% faster (composite index covers entire query)
- **Transaction summary**: 15-25% faster (subtype index helps categorization)

## Additional Recommendations

### 1. Connection Pooling

Current setup appears to be using Prisma default pooling. Consider:

- Verify `connection_limit` in DATABASE_URL (default: num_cpus \* 2 + 1)
- Monitor active connections in production
- Use PgBouncer for serverless environments if needed

### 2. Query Logging

Enable Prisma query logging in development:

```typescript
// prisma.config.ts or .env
log: ['query', 'info', 'warn', 'error']
```

### 3. Pagination Best Practices

- Current limit: max 100 items per page (good!) ✅
- Consider cursor-based pagination for very large result sets
- Cache total counts separately (already using cache for reports) ✅

### 4. Soft Delete Performance

Multiple models use `deletedAt` for soft deletes. Current indexes cover this well:

- Transaction: `@@index([deletedAt])` ✅
- Invoice: `@@index([deletedAt])` ✅
- ClientCostSubscription: `@@index([deletedAt])` ✅

Consider adding a composite index if frequently querying active records:

```prisma
@@index([orgId, deletedAt])  // If deletedAt IS NULL is common
```

## Summary

✅ **Strong existing index coverage** - Most common queries are well-optimized
⚠️ **4 additional indexes recommended** - Will improve cost tracking and overdue detection
✅ **Caching strategy implemented** - Offsets need for aggressive DB optimization
✅ **Repository pattern** - Prevents N+1 queries with explicit includes

**Priority Actions:**

1. Add 4 recommended indexes via migration
2. Monitor query performance with Prisma logs
3. Validate cache hit rates in production
4. Consider PgBouncer for serverless deployments
