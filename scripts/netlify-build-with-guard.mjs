#!/usr/bin/env node
/**
 * Simplified build script for Netlify with Next.js 16
 * No longer needs middleware handling - using native Netlify Edge Functions
 */

import { spawn } from 'child_process'
import { cpSync, existsSync } from 'fs'
import { dirname, resolve } from 'path'
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

const child = spawn('next', ['build'], {
  stdio: 'inherit',
  env: process.env,
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
