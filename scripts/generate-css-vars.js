#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const repoRoot = path.resolve(__dirname, '..')
const tokensPath = path.join(repoRoot, 'src', 'styles', 'tokens.ts')
const outPath = path.join(repoRoot, 'src', 'styles', 'generated-vars.css')

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  const shorthand = h.length === 3
  const r = parseInt(shorthand ? h[0] + h[0] : h.slice(0, 2), 16)
  const g = parseInt(shorthand ? h[1] + h[1] : h.slice(2, 4), 16)
  const b = parseInt(shorthand ? h[2] + h[2] : h.slice(4, 6), 16)
  return { r, g, b }
}

function rgbToHsl(r, g, b) {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b)
  let h = 0,
    s = 0,
    l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }
  return [
    Math.round(h * 360 * 10) / 10,
    Math.round(s * 1000) / 10,
    Math.round(l * 1000) / 10,
  ]
}

function toHslString(hex) {
  try {
    const { r, g, b } = hexToRgb(hex)
    const [h, s, l] = rgbToHsl(r, g, b)
    return `${h} ${s}% ${l}%`
  } catch (e) {
    return null
  }
}

const content = fs.readFileSync(tokensPath, 'utf8')
const designSystemPath = path.join(
  repoRoot,
  'src',
  'styles',
  'design-system.ts'
)
let designSystemContent = ''
try {
  designSystemContent = fs.readFileSync(designSystemPath, 'utf8')
} catch (e) {
  // ignore if file not present
}

// crude but practical extraction for common tokens: brand.*, status.*, studioTokens
const out = []
out.push('/* Generated variables — DO NOT EDIT BY HAND */')
out.push(':root {')

// Brand palette
const brandMatch = content.match(/brand:\s*\{([\s\S]*?)\}/m)
if (brandMatch) {
  const block = brandMatch[1]
  let primaryHsl = null
  const itemRe =
    /([0-9]{1,3}|DEFAULT)\s*:\s*'(#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}))'/g
  let m
  while ((m = itemRe.exec(block))) {
    const key = m[1]
    const hex = m[2]
    const varName = `--color-brand-${key.toString().toLowerCase()}`
    out.push(`  ${varName}: ${hex};`)
    const hsl = toHslString(hex)
    if (hsl) {
      out.push(`  ${varName}-h: ${hsl};`)
    }
  }
  // set primary runtime var from DEFAULT if present
  const defaultMatch = block.match(
    /DEFAULT\s*:\s*'(#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}))'/
  )
  if (defaultMatch) {
    const hex = defaultMatch[1]
    const hsl = toHslString(hex)
    if (hsl) {
      out.push(`  --primary: ${hsl};`)
      primaryHsl = hsl
      // pick a readable foreground (white) as default
      out.push(`  --primary-foreground: 0 0% 100%;`)
    }
  }
}

// status colors
const statusMatch = content.match(/status:\s*\{([\s\S]*?)\}/m)
if (statusMatch) {
  const block = statusMatch[1]
  const itemRe = /([a-zA-Z0-9_]+)\s*:\s*'(#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}))'/g
  let m
  while ((m = itemRe.exec(block))) {
    const key = m[1]
    const hex = m[2]
    const varName = `--status-${key}`
    out.push(`  ${varName}: ${hex};`)
    const hsl = toHslString(hex)
    if (hsl) {
      out.push(`  ${varName}-h: ${hsl};`)
    }
  }
}

// studioTokens
const studioMatch = content.match(
  /export const studioTokens = \{([\s\S]*?)\}\s*as const/m
)
if (studioMatch) {
  const block = studioMatch[1]
  const itemRe = /([a-zA-Z0-9_]+)\s*:\s*'([^']+)'/g
  let m
  while ((m = itemRe.exec(block))) {
    const key = m[1]
    const val = m[2]
    const varName = `--studio-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`
    out.push(`  ${varName}: ${val};`)
    // if value looks like hex, also produce hsl
    const hexMatch = val.match(/#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})/)
    if (hexMatch) {
      const hsl = toHslString(hexMatch[0])
      if (hsl) out.push(`  ${varName}-h: ${hsl};`)
    }
  }
}

// Extract neutral slate palette from design-system (if present) and create foreground/background
if (designSystemContent) {
  const slateMatch = designSystemContent.match(/slate:\s*\{([\s\S]*?)\}/m)
  if (slateMatch) {
    const block = slateMatch[1]
    const itemRe =
      /([0-9]{1,3}|[A-Za-z0-9_]+)\s*:\s*'(#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}))'/g
    let m
    const slateVals = {}
    while ((m = itemRe.exec(block))) {
      const key = m[1]
      const hex = m[2]
      slateVals[key.toString()] = hex
      const varName = `--slate-${key.toString().toLowerCase()}`
      out.push(`  ${varName}: ${hex};`)
      const hsl = toHslString(hex)
      if (hsl) out.push(`  ${varName}-h: ${hsl};`)
    }
    // set foreground/background from typical tokens if available
    const fgMatch = block.match(
      /900\s*:\s*'(#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}))'/
    )
    const bgMatch = block.match(
      /50\s*:\s*'(#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}))'/
    )
    if (fgMatch) {
      const fgHex = fgMatch[1]
      const h = toHslString(fgHex)
      if (h) {
        out.push(`  --foreground: ${h};`)
        out.push(`  --foreground-hex: ${fgHex};`)
      } else {
        out.push(`  --foreground-hex: ${fgHex};`)
      }
    }
    if (bgMatch) {
      const bgHex = bgMatch[1]
      const h = toHslString(bgHex)
      if (h) {
        out.push(`  --background: ${h};`)
        out.push(`  --background-hex: ${bgHex};`)
      } else {
        out.push(`  --background-hex: ${bgHex};`)
      }
    }

    // Derive border/input/ring tokens commonly referenced by tailwind.config
    // prefer explicit slate tokens when available
    if (slateVals['200']) {
      const hex = slateVals['200']
      const h = toHslString(hex)
      if (h) {
        out.push(`  --border: ${h};`)
        out.push(`  --border-hex: ${hex};`)
        out.push(`  --input: ${h};`)
        out.push(`  --input-hex: ${hex};`)
      }
    }
    // ring: prefer slate-400, else fallback to primary if available
    if (slateVals['400']) {
      const hex = slateVals['400']
      const h = toHslString(hex)
      if (h) {
        out.push(`  --ring: ${h};`)
        out.push(`  --ring-hex: ${hex};`)
      }
    } else if (primaryHsl) {
      out.push(`  --ring: ${primaryHsl};`)
    }

    // radius token: if there's a studio card radius or token radius, export as --radius
    if (slateVals['50']) {
      // fallback radius from design token if none explicit available
      out.push(`  --radius: 0.625rem;`)
    }

    // Derive additional semantic tokens expected by tailwind.config
    // secondary -> brand 500
    const brand500Match = content.match(
      /brand:\s*\{[\s\S]*?500\s*:\s*'(#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}))'/m
    )
    if (brand500Match) {
      const hex = brand500Match[1]
      const h = toHslString(hex)
      if (h) {
        out.push(`  --secondary: ${h};`)
        out.push(`  --secondary-hex: ${hex};`)
        out.push(`  --secondary-foreground: 0 0% 100%;`)
      }
      // accent defaults to brand 500
      if (h) {
        out.push(`  --accent: ${h};`)
        out.push(`  --accent-hex: ${hex};`)
        out.push(`  --accent-foreground: 0 0% 100%;`)
      }
    }

    // destructive -> status.danger if available
    const statusDangerMatch = content.match(
      /status:\s*\{[\s\S]*?danger\s*:\s*'(#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}))'/m
    )
    if (statusDangerMatch) {
      const hex = statusDangerMatch[1]
      const h = toHslString(hex)
      if (h) {
        out.push(`  --destructive: ${h};`)
        out.push(`  --destructive-hex: ${hex};`)
        out.push(`  --destructive-foreground: 0 0% 100%;`)
      }
    }

    // muted -> slate-200; muted-foreground -> slate-700
    if (slateVals['200']) {
      const hex = slateVals['200']
      const h = toHslString(hex)
      if (h) {
        out.push(`  --muted: ${h};`)
        out.push(`  --muted-hex: ${hex};`)
      }
    }
    if (slateVals['700']) {
      const hex = slateVals['700']
      const h = toHslString(hex)
      if (h) {
        out.push(`  --muted-foreground: ${h};`)
        out.push(`  --muted-foreground-hex: ${hex};`)
      }
    }

    // popover/card defaults
    if (slateVals['50']) {
      const hex = slateVals['50']
      const h = toHslString(hex)
      if (h) {
        out.push(`  --card: ${h};`)
        out.push(`  --card-hex: ${hex};`)
        out.push(`  --popover: ${h};`)
        out.push(`  --popover-hex: ${hex};`)
      }
    }
    if (slateVals['900']) {
      const hex = slateVals['900']
      const h = toHslString(hex)
      if (h) {
        out.push(`  --card-foreground: ${h};`)
        out.push(`  --card-foreground-hex: ${hex};`)
        out.push(`  --popover-foreground: ${h};`)
        out.push(`  --popover-foreground-hex: ${hex};`)
      }
    }

    // sidebar tokens (derive sensible defaults)
    if (slateVals['50']) {
      const hex = slateVals['50']
      const h = toHslString(hex)
      if (h) {
        out.push(`  --sidebar-background: ${h};`)
        out.push(`  --sidebar-background-hex: ${hex};`)
      }
    }
    if (slateVals['900']) {
      const hex = slateVals['900']
      const h = toHslString(hex)
      if (h) {
        out.push(`  --sidebar-foreground: ${h};`)
        out.push(`  --sidebar-foreground-hex: ${hex};`)
      }
    }
    // sidebar primary -> brand 500 if available
    if (brand500Match) {
      const hex = brand500Match[1]
      const h = toHslString(hex)
      if (h) {
        out.push(`  --sidebar-primary: ${h};`)
        out.push(`  --sidebar-primary-hex: ${hex};`)
        out.push(`  --sidebar-primary-foreground: 0 0% 100%;`)
      }
    }
    // sidebar accent -> brand 400 if present, else brand 500
    const brand400Match = content.match(
      /brand:\s*\{[\s\S]*?400\s*:\s*'(#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}))'/m
    )
    if (brand400Match) {
      const hex = brand400Match[1]
      const h = toHslString(hex)
      if (h) {
        out.push(`  --sidebar-accent: ${h};`)
        out.push(`  --sidebar-accent-hex: ${hex};`)
        out.push(`  --sidebar-accent-foreground: 0 0% 100%;`)
      }
    } else if (brand500Match) {
      const hex = brand500Match[1]
      const h = toHslString(hex)
      if (h) {
        out.push(`  --sidebar-accent: ${h};`)
        out.push(`  --sidebar-accent-hex: ${hex};`)
        out.push(`  --sidebar-accent-foreground: 0 0% 100%;`)
      }
    }
    // sidebar border/ring
    if (slateVals['200']) {
      const hex = slateVals['200']
      const h = toHslString(hex)
      if (h) out.push(`  --sidebar-border: ${h};`)
    }
    if (slateVals['400']) {
      const hex = slateVals['400']
      const h = toHslString(hex)
      if (h) out.push(`  --sidebar-ring: ${h};`)
    }
  }
}

out.push('}')
out.push('')
out.push(
  '/* dark mode placeholder — keep values in sync with :root when ready */'
)
out.push('.dark {')
out.push('  /* add dark-mode overrides here */')
out.push('}')

fs.writeFileSync(outPath, out.join('\n') + '\n', 'utf8')
console.log('Wrote', outPath)
