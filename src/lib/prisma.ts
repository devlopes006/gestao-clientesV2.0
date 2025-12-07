import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'

// Guard initialization: when running the Next.js build on CI or locally
// without a configured DATABASE_URL, avoid constructing a real PrismaClient
// (which would throw). Instead export a proxy that throws with a clear
// message if any DB access is attempted.

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient | any
  pool?: Pool
}

if (process.env.DATABASE_URL) {
  if (!globalForPrisma.pool) {
    globalForPrisma.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    })
  }

  const adapter = new PrismaPg(globalForPrisma.pool)

  globalForPrisma.prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
      adapter,
      log: ['error'],
    })

  if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = globalForPrisma.prisma
}

// If DATABASE_URL is not set, export a helpful proxy that fails fast when used.
const makeMissingDbProxy = () =>
  new Proxy(
    {},
    {
      get() {
        throw new Error(
          'Prisma client not initialized: set DATABASE_URL to enable DB access in this environment.'
        )
      },
    }
  )

export const prisma = globalForPrisma.prisma ?? makeMissingDbProxy()
