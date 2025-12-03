#!/usr/bin/env node
/**
 * Netlify Next.js Plugin Workaround for Next 16
 *
 * The plugin expects .next/server/middleware.js.nft.json but Next 16
 * uses edge chunks instead. This script generates a minimal nft trace
 * to satisfy the plugin's file existence check.
 */

import { existsSync, readFileSync, writeFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = resolve(__dirname, '..')

const middlewareNftPath = resolve(
  projectRoot,
  '.next/server/middleware.js.nft.json'
)

// Check if file already exists (shouldn't with Next 16, but just in case)
if (existsSync(middlewareNftPath)) {
  console.log(
    '[netlify-workaround] middleware.js.nft.json already exists, skipping.'
  )
  process.exit(0)
}

// Read the middleware manifest to extract edge chunks
const manifestPath = resolve(
  projectRoot,
  '.next/server/middleware-manifest.json'
)
if (!existsSync(manifestPath)) {
  console.error(
    '[netlify-workaround] middleware-manifest.json not found. Build may have failed.'
  )
  process.exit(1)
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))

// Extract all files from middleware entries
const files = new Set()
for (const config of Object.values(manifest.middleware || {})) {
  if (config.files) {
    config.files.forEach((file) => {
      // Files in manifest have 'server/' prefix but nft.json is already in server/
      // so we need relative paths from server/ directory
      const relativePath = file.replace(/^server\//, '')
      files.add(relativePath)
    })
  }
}

// Create a minimal nft.json with the edge chunks and common deps
// Paths must be relative to .next/server/ (where middleware.js.nft.json lives)
const nftContent = {
  version: 1,
  files: [
    // Edge chunks are already in server/edge/chunks, no need to adjust
    ...Array.from(files),
    // Add common runtime deps that middleware might need
    'middleware-manifest.json',
    'middleware-build-manifest.js',
  ].filter(Boolean),
}

writeFileSync(middlewareNftPath, JSON.stringify(nftContent, null, 2), 'utf-8')
console.log(
  '[netlify-workaround] Created middleware.js.nft.json with',
  nftContent.files.length,
  'files.'
)

// Validate that all referenced files exist
let missingFiles = 0
const serverDir = resolve(projectRoot, '.next/server')
for (const file of nftContent.files) {
  const fullPath = resolve(serverDir, file)
  if (!existsSync(fullPath)) {
    console.warn(
      `[netlify-workaround] WARNING: Referenced file not found: ${file}`
    )
    missingFiles++
  }
}

if (missingFiles > 0) {
  console.error(
    `[netlify-workaround] ERROR: ${missingFiles} referenced files are missing!`
  )
  process.exit(1)
}

console.log('[netlify-workaround] All referenced files verified ✓')
