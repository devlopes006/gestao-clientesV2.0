#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const repoRoot = path.resolve(__dirname, '..')
const tailwindConfigPath = path.join(repoRoot, 'tailwind.config.ts')
const generatedVarsPath = path.join(
  repoRoot,
  'src',
  'styles',
  'generated-vars.css'
)

function extractReferencedVars(content) {
  const re = /var\(--([a-zA-Z0-9-_]+)\)/g
  const vars = new Set()
  let m
  while ((m = re.exec(content))) vars.add(m[1])
  return vars
}

function extractDefinedVars(content) {
  const re = /^\s*--([a-zA-Z0-9-_]+)\s*:/gm
  const vars = new Set()
  let m
  while ((m = re.exec(content))) vars.add(m[1])
  return vars
}

try {
  const tw = fs.readFileSync(tailwindConfigPath, 'utf8')
  const gen = fs.readFileSync(generatedVarsPath, 'utf8')

  const referenced = extractReferencedVars(tw)
  const defined = extractDefinedVars(gen)

  // Filter to a sensible subset: only variables that tailwind is expected to use
  // We'll check all referenced vars but ignore those that look like dynamic runtime-only names
  const missing = []
  for (const v of referenced) {
    if (!defined.has(v)) missing.push(v)
  }

  if (missing.length) {
    console.error('\nMissing CSS variables in src/styles/generated-vars.css:')
    missing.sort().forEach((m) => console.error('  -', m))
    console.error(
      '\nThis may cause Tailwind tokens that use hsl(var(--...)) to generate invalid values.'
    )
    process.exitCode = 2
    process.exit(2)
  }

  console.log(
    'OK — all referenced CSS variables in tailwind.config.ts are defined in generated-vars.css'
  )
  process.exit(0)
} catch (err) {
  console.error(
    'Error running validate-generated-vars.js:',
    err && err.stack ? err.stack : err
  )
  process.exit(3)
}
