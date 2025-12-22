import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

function safeDbInfo() {
  const url = process.env.DATABASE_URL
  if (!url) return { hasUrl: false }
  try {
    const parsed = new URL(url)
    return {
      hasUrl: true,
      host: parsed.host,
      database: parsed.pathname.replace(/^\//, ''),
    }
  } catch (err) {
    return {
      hasUrl: true,
      host: 'invalid-url',
      database: 'invalid-url',
      error: err instanceof Error ? err.message : 'invalid DATABASE_URL',
    }
  }
}

async function safeCount(label: string, fn: () => Promise<number>) {
  try {
    const count = await fn()
    return { ok: true, count }
  } catch (err: any) {
    return {
      ok: false,
      error: err?.code || err?.name || 'unknown',
      message: err?.message || String(err),
      label,
    }
  }
}

async function getAppliedMigrations() {
  try {
    const rows = await prisma.$queryRaw<{
      migration_name: string
      finished_at: Date | null
    }[]>`select migration_name, finished_at from "_prisma_migrations" order by finished_at desc nulls last`
    return {
      ok: true,
      appliedCount: rows.length,
      latest: rows[0]?.migration_name ?? null,
      applied: rows.map((r) => r.migration_name),
    }
  } catch (err: any) {
    return {
      ok: false,
      error: err?.code || err?.name || 'unknown',
      message: err?.message || String(err),
    }
  }
}

function getLocalMigrations() {
  try {
    const dir = path.join(process.cwd(), 'prisma', 'migrations')
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    const names = entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort()
    return { ok: true, count: names.length, names }
  } catch (err: any) {
    return {
      ok: false,
      error: err?.code || err?.name || 'unknown',
      message: err?.message || String(err),
    }
  }
}

export async function GET() {
  const dbInfo = safeDbInfo()

  const [migrations, locals, clientCount, orgCount, userCount] = await Promise.all([
    getAppliedMigrations(),
    Promise.resolve(getLocalMigrations()),
    safeCount('client', () => prisma.client.count()),
    safeCount('org', () => prisma.org.count()),
    safeCount('user', () => prisma.user.count()),
  ])

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    db: dbInfo,
    migrations: {
      localCount: locals.ok ? locals.count : null,
      localNames: locals.ok ? locals.names : undefined,
      localError: locals.ok ? null : locals,
      appliedCount: migrations.ok ? migrations.appliedCount : null,
      latestApplied: migrations.ok ? migrations.latest : null,
      appliedNames: migrations.ok ? migrations.applied : undefined,
      appliedError: migrations.ok ? null : migrations,
    },
    tables: {
      client: clientCount,
      org: orgCount,
      user: userCount,
    },
  })
}
