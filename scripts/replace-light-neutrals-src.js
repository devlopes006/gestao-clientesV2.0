const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', 'src');
const exts = new Set(['.ts', '.tsx', '.js', '.jsx', '.css', '.scss']);
let filesChanged = 0;
let totalReplacements = 0;

function replaceAll(content) {
  let original = content;
  // bg-white -> bg-slate-900
  content = content.replace(/\bbg-white(\/\d{1,3})?/g, (m, g1) => `bg-slate-900${g1||''}`);
  // bg-slate-50 / 100 -> dark variant
  content = content.replace(/\bbg-slate-(50|100)(\/\d{1,3})?/g, (m, g1, g2) => `bg-slate-900/${g2 ? g2.slice(1) : '60'}`);
  // bg-gray-50/100 -> bg-slate-900/60
  content = content.replace(/\bbg-gray-(50|100)(\/\d{1,3})?/g, (m, g1, g2) => `bg-slate-900/${g2 ? g2.slice(1) : '60'}`);
  // from-white / via-white / to-white -> slate equivalents
  content = content.replace(/\bfrom-white(\/\d{1,3})?/g, (m, g1) => `from-slate-900${g1||''}`);
  content = content.replace(/\bvia-white(\/\d{1,3})?/g, (m, g1) => `via-slate-900${g1||''}`);
  content = content.replace(/\bto-white(\/\d{1,3})?/g, (m, g1) => `to-slate-900${g1||''}`);
  // to-slate-50 -> to-slate-900
  content = content.replace(/\bto-slate-50(\/\d{1,3})?/g, (m, g1) => `to-slate-900${g1||'/60'}`);
  // from-slate-50 -> from-slate-900
  content = content.replace(/\bfrom-slate-50(\/\d{1,3})?/g, (m, g1) => `from-slate-900${g1||'/60'}`);

  return { content, changed: content !== original, diff: (content.match(/bg-slate-900/g)||[]).length - (original.match(/bg-slate-900/g)||[]).length };
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (['node_modules', '.git', 'dist', 'build', 'out', '.next'].includes(e.name)) continue;
      walk(full);
      continue;
    }
    const ext = path.extname(e.name).toLowerCase();
    if (!exts.has(ext)) continue;
    let content = fs.readFileSync(full, 'utf8');
    const { content: newContent, changed, diff } = replaceAll(content);
    if (changed) {
      fs.writeFileSync(full, newContent, 'utf8');
      filesChanged++;
      totalReplacements += diff > 0 ? diff : 0;
      console.log(`Updated ${full} -> approx ${diff} replacements`);
    }
  }
}

console.log('Starting neutral light-bg replacements under', ROOT);
walk(ROOT);
console.log(`Done. Files changed: ${filesChanged}. Total replacements (approx): ${totalReplacements}`);
process.exit(0);
