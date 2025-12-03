#!/usr/bin/env node
/**
 * Build wrapper that monitors for middleware-manifest.json
 * and generates middleware.js.nft.json as soon as it's available10:34 AM
 */

import { spawn } from 'child_process'
import { existsSync, watch } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = resolve(__dirname, '..')

const serverDir = resolve(projectRoot, '.next/server')
const manifestPath = resolve(serverDir, 'middleware-manifest.json')
const nftPath = resolve(serverDir, 'middleware.js.nft.json')

let watcher = null
let buildProcess = null
let nftGenerated = false

// Function to generate NFT file
async function generateNft() {
  if (nftGenerated || existsSync(nftPath)) {
    return
  }

  console.log(
    '[build-wrapper] Detected middleware-manifest.json, generating nft...'
  )

  try {
    // Import and run the workaround script
    await import('./netlify-middleware-workaround.mjs')
    nftGenerated = true
    console.log('[build-wrapper] NFT file generated successfully')
  } catch (error) {
    console.error('[build-wrapper] Failed to generate NFT:', error.message)
  }
}

// Watch for manifest file creation
function startWatching() {
  if (!existsSync(serverDir)) {
    // Wait for server dir to be created
    setTimeout(startWatching, 500)
    return
  }

  console.log('[build-wrapper] Watching for middleware-manifest.json...')

  watcher = watch(
    serverDir,
    { recursive: false },
    async (eventType, filename) => {
      if (filename === 'middleware-manifest.json' && existsSync(manifestPath)) {
        await generateNft()
        if (watcher) {
          watcher.close()
          watcher = null
        }
      }
    }
  )

  // Also check if file already exists
  if (existsSync(manifestPath)) {
    generateNft().then(() => {
      if (watcher) {
        watcher.close()
        watcher = null
      }
    })
  }
}

// Start Next.js build
console.log('[build-wrapper] Starting Next.js build...')
buildProcess = spawn('next', ['build'], {
  stdio: 'inherit',
  shell: true,
  cwd: projectRoot,
})

// Start watching immediately
startWatching()

// Handle build completion
buildProcess.on('close', (code) => {
  if (watcher) {
    watcher.close()
  }

  if (code !== 0) {
    console.error(`[build-wrapper] Build failed with code ${code}`)
    process.exit(code)
  }

  // Give a final check if NFT wasn't generated during build
  if (!nftGenerated && existsSync(manifestPath) && !existsSync(nftPath)) {
    console.log('[build-wrapper] Final NFT generation attempt...')
    generateNft().finally(() => {
      process.exit(0)
    })
  } else {
    process.exit(0)
  }
})

// Handle interrupts
process.on('SIGINT', () => {
  if (watcher) watcher.close()
  if (buildProcess) buildProcess.kill('SIGINT')
  process.exit(130)
})

process.on('SIGTERM', () => {
  if (watcher) watcher.close()
  if (buildProcess) buildProcess.kill('SIGTERM')
  process.exit(143)
})
