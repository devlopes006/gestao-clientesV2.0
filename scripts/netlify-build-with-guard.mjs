#!/usr/bin/env node
/**
 * Simplified build script for Netlify with Next.js 16
 * No longer needs middleware handling - using native Netlify Edge Functions
 */

import { spawn } from 'child_process'
import { cpSync, existsSync } from 'fs'
import { delimiter, dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = resolve(__dirname, '..')

function copyHeaders() {
  try {
    const src = resolve(projectRoot, 'public/_headers')
    const dest = resolve(projectRoot, '.next/_headers')
    if (existsSync(src)) {
      cpSync(src, dest, { force: true })
      console.log('[netlify-build] copied _headers')
    }
  } catch (err) {
    console.warn('[netlify-build] headers copy failed:', err.message)
  }
}

const nodeBin = resolve(projectRoot, 'node_modules', '.bin')
const nextExecutable =
  process.platform === 'win32'
    ? resolve(nodeBin, 'next.cmd')
    : resolve(nodeBin, 'next')

const child = spawn(nextExecutable, ['build'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: {
    ...process.env,
    PATH: `${nodeBin}${delimiter}${process.env.PATH ?? ''}`,
  },
})

child.on('error', (err) => {
  console.error('[netlify-build] failed:', err)
  process.exit(1)
})

child.on('exit', (code, signal) => {
  if (code === 0) copyHeaders()
  if (signal) process.exit(1)
  process.exit(code ?? 1)
})
