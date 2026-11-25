import { appendFileSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, join } from 'node:path'
import { gzipSync } from 'node:zlib'

const dist = new URL('../dist/', import.meta.url)
const distPath = decodeURIComponent(dist.pathname)
const html = readFileSync(join(distPath, 'index.html'), 'utf8')
const entryMatch = html.match(/<script\\b[^>]*src="([^"]+\\.js)"/)

if (!entryMatch) {
  console.error('[bundle-report] Could not identify the initial JavaScript entry in dist/index.html.')
  process.exit(1)
}

const entryName = basename(entryMatch[1].split('?')[0])
const assetsPath = join(distPath, 'assets')
const chunks = readdirSync(assetsPath)
  .filter(name => name.endsWith('.js'))
  .map(name => {
    const file = join(assetsPath, name)
    const bytes = statSync(file).size
    return { name, bytes, gzip: gzipSync(readFileSync(file)).length }
  })
  .sort((a, b) => b.bytes - a.bytes)

const entry = chunks.find(chunk => chunk.name === entryName)
if (!entry) {
  console.error(`[bundle-report] Entry chunk "${entryName}" was not found in dist/assets.`)
  process.exit(1)
}

const totalBytes = chunks.reduce((sum, chunk) => sum + chunk.bytes, 0)
const threshold = 500 * 1024
const lines = [
  '## JavaScript bundle report',
  '',
  `Initial entry: **${entry.name}** — ${(entry.bytes / 1024).toFixed(2)} KiB minified, ${(entry.gzip / 1024).toFixed(2)} KiB gzip.`,
  `All JavaScript chunks: ${chunks.length}; combined ${(totalBytes / 1024).toFixed(2)} KiB minified.`,
  '',
  '| Chunk | Minified KiB | Gzip KiB |',
  '|---|---:|---:|',
  ...chunks.slice(0, 12).map(chunk => `| ${chunk.name} | ${(chunk.bytes / 1024).toFixed(2)} | ${(chunk.gzip / 1024).toFixed(2)} |`),
  '',
  `Threshold: 500 KiB. Result: ${entry.bytes <= threshold ? 'PASS' : 'FAIL'}.`
]
const report = lines.join('\\n') + '\\n'
console.log(report)
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, report)
if (entry.bytes > threshold) {
  console.error('[bundle-report] Initial entry exceeds 500 KiB.')
  process.exitCode = 1
}
