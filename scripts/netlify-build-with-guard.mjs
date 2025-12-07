#!/usr/bin/env node
/**
 * Runs `next build` while continuously ensuring the Netlify plugin's
 * expected middleware NFT file exists. This guards against Turbopack/Next 16
 * cleaning `.next/server` before the plugin reads `middleware.js.nft.json`.
 */

import { spawn } from 'child_process'
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = resolve(__dirname, '..')
const serverDir = resolve(projectRoot, '.next/server')
const nftPath = resolve(serverDir, 'middleware.js.nft.json')
const manifestPath = resolve(serverDir, 'middleware/middleware-manifest.json')
const middlewareJsPath = resolve(serverDir, 'middleware.js')
const standaloneMiddlewarePath = resolve(
  projectRoot,
  '.next/standalone/.next/server/middleware.js'
)

function buildNft() {
  // If file already there, nothing to do
  if (existsSync(nftPath)) return

  const files = new Set()

  if (existsSync(manifestPath)) {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
    for (const cfg of Object.values(manifest.middleware || {})) {
      if (cfg.files) {
        cfg.files.forEach((file) => {
          const relative = file.replace(/^server\//, '')
          files.add(relative)
        })
      }
    }
    files.add('middleware/middleware-manifest.json')
  }

  // Always include middleware.js so the plugin trace sees it
  files.add('middleware.js')

  const nftDir = dirname(nftPath)
  if (!existsSync(nftDir)) {
    mkdirSync(nftDir, { recursive: true })
  }

  const content = {
    version: 1,
    files: Array.from(files),
  }

  writeFileSync(nftPath, JSON.stringify(content, null, 2), 'utf-8')
  console.log(
    '[netlify-guard] ensured middleware.js.nft.json (files:',
    content.files.length,
    ')'
  )
}

function ensureMiddlewareJs() {
  // Next 16+ (Turbopack) no longer outputs .next/server/middleware.js by default.
  // The Netlify Next.js plugin still attempts to copy this file when packaging
  // the standalone output, so we create a harmless placeholder to satisfy the
  // copy step and avoid ENOENT failures during the build.
  if (existsSync(middlewareJsPath)) return
  if (!existsSync(serverDir)) return

  // CJS stub to satisfy Netlify plugin copy step. It is never executed.
  const content = `function middleware(req, res) { return null; }
module.exports = middleware;
module.exports.config = { matcher: [] };
`

  writeFileSync(middlewareJsPath, content, 'utf-8')
  console.log('[netlify-guard] created placeholder middleware.js')
}

function copyHeaders() {
  try {
    const src = resolve(projectRoot, 'public/_headers')
    const dest = resolve(projectRoot, '.next/_headers')
    cpSync(src, dest, { force: true })
    console.log('[netlify-guard] copied public/_headers to .next/_headers')
  } catch (err) {
    console.warn('[netlify-guard] skip copying _headers:', err.message)
  }
}

// Kick off guard loop
ensureMiddlewareJs()
buildNft()
ensureMiddlewareJs()
const interval = setInterval(() => {
  try {
    ensureMiddlewareJs()
    buildNft()
    ensureMiddlewareJs()
  } catch (err) {
    console.warn('[netlify-guard] ensure failed:', err.message)
  }
}, 500)

const child = spawn('next', ['build'], {
  stdio: 'inherit',
  env: process.env,
})

child.on('error', (err) => {
  clearInterval(interval)
  console.error('[netlify-guard] failed to start next build:', err)
  process.exit(1)
})

child.on('exit', (code, signal) => {
  clearInterval(interval)
  try {
    ensureMiddlewareJs()
    buildNft()
    ensureMiddlewareJs()
  } catch (err) {
    console.warn('[netlify-guard] final ensure failed:', err.message)
  }
  if (code === 0) {
    try {
      // Mirror stub into standalone bundle expected by Netlify
      mkdirSync(dirname(standaloneMiddlewarePath), { recursive: true })
      cpSync(middlewareJsPath, standaloneMiddlewarePath, { force: true })
      console.log('[netlify-guard] copied middleware.js stub into standalone')
    } catch (err) {
      console.warn(
        '[netlify-guard] failed to copy middleware.js stub:',
        err.message
      )
    }
    copyHeaders()
  }

  if (signal) {
    console.error('[netlify-guard] next build terminated by signal', signal)
    process.exit(1)
  }
  process.exit(code ?? 1)
})
