#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client')
;(async () => {
  const prisma = new PrismaClient()
  const clientId = process.argv[2]
  if (!clientId) {
    console.error('Usage: node get-client-orgid.js <clientId>')
    process.exit(2)
  }
  try {
    const c = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, orgId: true },
    })
    if (!c) {
      console.error('Client not found')
      process.exit(1)
    }
    console.log(c.orgId)
    await prisma.$disconnect()
  } catch (e) {
    console.error('Error', e)
    process.exit(1)
  }
})()
