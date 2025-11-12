#!/usr/bin/env node
import { execSync } from 'node:child_process'

const tryRun = (cmd) => {
  try {
    execSync(cmd, { stdio: 'inherit' })
    return true
  } catch {
    return false
  }
}

const cmds = [
  'pnpm prisma generate',
  'yarn prisma generate',
  'npm run prisma generate',
  'npx prisma generate',
  'prisma generate',
]

for (const cmd of cmds) {
  if (tryRun(cmd)) {
    process.exit(0)
  }
}

console.warn(
  '[postinstall] Failed to run `prisma generate` with known package managers.'
)
process.exit(0)
