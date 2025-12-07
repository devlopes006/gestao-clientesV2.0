#!/usr/bin/env node
/**
 * Runs `next build` while continuously ensuring the Netlify plugin's
 * expected middleware NFT file exists. This guards against Turbopack/Next 16
 * cleaning `.next/server` before the plugin reads `middleware.js.nft.json`.
 */

import { spawn } from 'child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'fs'
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

function convertMiddlewareToESM() {
  try {
    // Convert main middleware.js
    if (existsSync(middlewarePath)) {
      let content = readFileSync(middlewarePath, 'utf-8')

      // Check if already ES Module
      if (!content.includes('export ')) {
        // Convert CommonJS to ES Modules
        content = content.replace(
          /exports\.middleware\s*=\s*/g,
          'export const middleware = '
        )
        content = content.replace(/exports\.default\s*=\s*/g, 'export default ')
        content = content.replace(/module\.exports\s*=\s*/g, 'export default ')
        content = content.replace(
          /exports\.config\s*=\s*/g,
          'export const config = '
        )
        content = content.replace(/["']use strict["'];?\n?/g, '')

        writeFileSync(middlewarePath, content, 'utf-8')
        console.log('[netlify-guard] converted middleware.js to ES modules')
      } else {
        console.log('[netlify-guard] middleware.js already uses ES modules')
      }
    } else {
      console.log('[netlify-guard] no middleware.js to convert')
    }

    // Also convert any middleware in edge-chunks (Next.js 16 puts it there)
    const edgeChunksDir = resolve(serverDir, 'edge-chunks')
    if (existsSync(edgeChunksDir)) {
      const middlewareFiles = []
      const findMiddleware = (dir) => {
        try {
          const entries = readdirSync(dir, { withFileTypes: true })
          for (const entry of entries) {
            const fullPath = resolve(dir, entry.name)
            if (entry.isDirectory()) {
              findMiddleware(fullPath)
            } else if (
              entry.name.includes('middleware') &&
              entry.name.endsWith('.js')
            ) {
              middlewareFiles.push(fullPath)
            }
          }
        } catch (err) {
          // Ignore errors
        }
      }
      findMiddleware(edgeChunksDir)

      for (const file of middlewareFiles) {
        try {
          let content = readFileSync(file, 'utf-8')
          if (!content.includes('export ')) {
            content = content.replace(
              /exports\.middleware\s*=\s*/g,
              'export const middleware = '
            )
            content = content.replace(
              /exports\.default\s*=\s*/g,
              'export default '
            )
            content = content.replace(
              /module\.exports\s*=\s*/g,
              'export default '
            )
            content = content.replace(
              /exports\.config\s*=\s*/g,
              'export const config = '
            )
            content = content.replace(/["']use strict["'];?\n?/g, '')
            writeFileSync(file, content, 'utf-8')
            console.log('[netlify-guard] converted', file, 'to ES modules')
          }
        } catch (err) {
          console.warn(
            '[netlify-guard] failed to convert',
            file,
            ':',
            err.message
          )
        }
      }
    }
  } catch (err) {
    console.warn(
      '[netlify-guard] failed to convert middleware.js:',
      err.message
    )
  }
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
    // Convert middleware.js to ES modules after build
    convertMiddlewareToESM()
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
