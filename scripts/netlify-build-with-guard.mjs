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
const middlewarePath = resolve(serverDir, 'middleware.js')

function ensureMiddlewareStub() {
  try {
    // Next 16 with Turbopack may not emit middleware.js at all. Netlify's
    // plugin still tries to copy it into the standalone bundle, so create a
    // harmless placeholder when missing.
    if (!existsSync(serverDir)) {
      mkdirSync(serverDir, { recursive: true })
    }

    if (!existsSync(middlewarePath)) {
      // Use ES Module syntax for Netlify Edge Functions compatibility
      writeFileSync(
        middlewarePath,
        'export function middleware(request) { return; }\nexport default middleware;\n',
        'utf-8'
      )
      console.log('[netlify-guard] created placeholder middleware.js')
    }
  } catch (err) {
    console.warn('[netlify-guard] failed to ensure middleware.js:', err.message)
  }
}

function buildNft() {
  // Make sure middleware.js exists even if the NFT already does
  ensureMiddlewareStub()

  // If NFT file already there, nothing else to do
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

  // Always include middleware.js if it exists (Next.js 16 generates it in edge-chunks)
  if (existsSync(resolve(serverDir, 'middleware.js'))) {
    files.add('middleware.js')
  }

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

  // Ensure the Netlify plugin finds a middleware.js to copy into standalone
  // output even when Next.js skips emitting it.
  ensureMiddlewareStub()
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
buildNft()
const interval = setInterval(() => {
  try {
    buildNft()
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
    buildNft()
  } catch (err) {
    console.warn('[netlify-guard] final ensure failed:', err.message)
  }
  if (code === 0) {
    copyHeaders()
  }

  if (signal) {
    console.error('[netlify-guard] next build terminated by signal', signal)
    process.exit(1)
  }
  process.exit(code ?? 1)
})
