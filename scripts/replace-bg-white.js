const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const exts = new Set(['.ts', '.tsx', '.js', '.jsx', '.css', '.scss', '.md'])
let filesChanged = 0
let totalReplacements = 0

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) {
      if (['node_modules', '.git', 'dist', 'build', 'out'].includes(e.name))
        continue
      walk(full)
      continue
    }
    const ext = path.extname(e.name).toLowerCase()
    if (!exts.has(ext)) continue
    let content = fs.readFileSync(full, 'utf8')
    const original = content
    // Replace plain bg-slate-900 and variants bg-slate-900/XX -> bg-slate-900[/XX]
    content = content.replace(/\bbg-white(\/\d{1,3})?/g, (m, g1) => {
      return 'bg-slate-900' + (g1 || '')
    })

    // Also handle bg-slate-900/xx with decimals (rare)
    content = content.replace(/\bbg-white\/(\d{1,3})%/g, (m, g1) => {
      return `bg-slate-900/${g1}`
    })

    if (content !== original) {
      fs.writeFileSync(full, content, 'utf8')
      filesChanged++
      const diffCount =
        (content.match(/bg-slate-900/g) || []).length -
        (original.match(/bg-slate-900/g) || []).length
      totalReplacements += diffCount > 0 ? diffCount : 0
      console.log(`Updated ${full} -> ${diffCount} replacements`)
    }
  }
}

console.log('Starting replace of bg-slate-900 -> bg-slate-900 under', ROOT)
walk(ROOT)
console.log(
  `Done. Files changed: ${filesChanged}. Total replacements (approx): ${totalReplacements}`
)

if (filesChanged === 0) process.exit(1)
process.exit(0)
