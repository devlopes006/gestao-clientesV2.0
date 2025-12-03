#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const { PNG } = require('pngjs')
const _pm = require('pixelmatch')
const pixelmatch = typeof _pm === 'function' ? _pm : (_pm && _pm.default) || _pm

const screenshotsDir = path.resolve(__dirname, '../e2e/screenshots')
const baselineDir = path.resolve(__dirname, '../e2e/baseline')
const diffsDir = path.resolve(__dirname, '../e2e/diffs')

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function readPng(filePath) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(new PNG())
      .on('parsed', function () {
        resolve(this)
      })
      .on('error', reject)
  })
}

async function run() {
  ensureDir(screenshotsDir)
  ensureDir(baselineDir)
  ensureDir(diffsDir)

  const screenshots = fs
    .readdirSync(screenshotsDir)
    .filter((f) => f.endsWith('.png'))
  if (screenshots.length === 0) {
    console.error('No screenshots found in', screenshotsDir)
    process.exit(2)
  }

  // If baseline is empty, seed it and exit
  const baselineFiles = fs
    .readdirSync(baselineDir)
    .filter((f) => f.endsWith('.png'))
  if (baselineFiles.length === 0) {
    console.log(
      'No baseline found. Seeding baseline with current screenshots...'
    )
    for (const f of screenshots) {
      fs.copyFileSync(path.join(screenshotsDir, f), path.join(baselineDir, f))
      console.log('Seeded baseline:', f)
    }
    console.log(
      'Baseline seeded. Re-run the script to compare and generate diffs.'
    )
    process.exit(0)
  }

  let totalDiffPixels = 0
  let filesCompared = 0
  const thresholdPixels = 50 // per-image tolerance (can be adjusted)
  const failures = []

  for (const f of screenshots) {
    const shotPath = path.join(screenshotsDir, f)
    const basePath = path.join(baselineDir, f)
    if (!fs.existsSync(basePath)) {
      console.warn(
        'Baseline missing for',
        f,
        '- copying current to baseline (first run for this page)'
      )
      fs.copyFileSync(shotPath, basePath)
      continue
    }

    const imgA = await readPng(basePath)
    const imgB = await readPng(shotPath)

    if (imgA.width !== imgB.width || imgA.height !== imgB.height) {
      console.warn(
        'Size mismatch for',
        f,
        `baseline=${imgA.width}x${imgA.height} current=${imgB.width}x${imgB.height}`
      )
    }

    const width = Math.max(imgA.width, imgB.width)
    const height = Math.max(imgA.height, imgB.height)

    const pngA = new PNG({ width, height })
    const pngB = new PNG({ width, height })

    // copy data into full-size buffers
    imgA.data.copy(pngA.data, 0, 0, imgA.data.length)
    imgB.data.copy(pngB.data, 0, 0, imgB.data.length)

    const diff = new PNG({ width, height })
    const diffPixels = pixelmatch(
      pngA.data,
      pngB.data,
      diff.data,
      width,
      height,
      { threshold: 0.12 }
    )
    totalDiffPixels += diffPixels
    filesCompared += 1

    const diffPath = path.join(diffsDir, f.replace('.png', '.diff.png'))
    diff.pack().pipe(fs.createWriteStream(diffPath))

    console.log(`${f}: diff pixels=${diffPixels} -> ${diffPath}`)
    if (diffPixels > thresholdPixels) failures.push({ file: f, diffPixels })
  }

  console.log('--- Summary ---')
  console.log('Files compared:', filesCompared)
  console.log('Total diff pixels:', totalDiffPixels)
  if (failures.length > 0) {
    console.error('Visual diffs exceeded threshold for files:')
    failures.forEach((f) =>
      console.error(` - ${f.file}: ${f.diffPixels} pixels`)
    )
    process.exit(3)
  }

  console.log('All comparisons within tolerance.')
  process.exit(0)
}

run().catch((err) => {
  console.error('Visual diff failed:', err)
  process.exit(1)
})
