#!/usr/bin/env node
/**
 * Netlify Next.js Plugin Workaround for Next 16
 *
 * The plugin expects .next/server/middleware.js.nft.json but Next 16
 * uses edge chunks instead. This script generates a minimal nft trace
 * to satisfy the plugin's file existence check.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
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
// Next 16+ stores it in /middleware/ subdirectory
const manifestPath = resolve(
  projectRoot,
  '.next/server/middleware/middleware-manifest.json'
)

let manifest = null
const files = new Set()

if (existsSync(manifestPath)) {
  manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))

  // Extract all files from middleware entries
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

  // Add middleware manifest
  files.add('middleware/middleware-manifest.json')
} else {
  console.log(
    '[netlify-workaround] middleware-manifest.json not found. Creating minimal nft.json.'
  )
}

// Create a minimal nft.json with the edge chunks and common deps
// Paths must be relative to .next/server/ (where middleware.js.nft.json lives)
const nftContent = {
  version: 1,
  files: Array.from(files),
}

// Ensure the directory exists
const nftDir = dirname(middlewareNftPath)
if (!existsSync(nftDir)) {
  mkdirSync(nftDir, { recursive: true })
}

writeFileSync(middlewareNftPath, JSON.stringify(nftContent, null, 2), 'utf-8')
console.log(
  '[netlify-workaround] Created middleware.js.nft.json with',
  nftContent.files.length,
  'files.'
)

// Validate that all referenced files exist (warnings only, don't fail)
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
  console.warn(
    `[netlify-workaround] ${missingFiles} referenced files are missing (non-critical)`
  )
}

console.log('[netlify-workaround] Middleware NFT generation completed ✓')
