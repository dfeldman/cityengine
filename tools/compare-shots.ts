/**
 * How different two folders of shots are, file by file: the share of pixels that changed by more than a
 * little, and the mean change. For "nothing should look different" (tiling), and for finding which views a
 * change touched without looking at every one.
 *   node --experimental-strip-types tools/compare-shots.ts <before-dir> <after-dir> [--threshold=24]
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { PNG } from 'pngjs'
const [a, b] = process.argv.slice(2).filter((x) => !x.startsWith('--'))
const th = Number((process.argv.find((x) => x.startsWith('--threshold=')) ?? '=24').split('=')[1])
const rows: [string, number, number][] = []
for (const f of readdirSync(a).filter((x) => x.endsWith('.png') && !x.startsWith('sheet'))) {
  if (!existsSync(resolve(b, f))) { rows.push([f, -1, -1]); continue }
  const p = PNG.sync.read(readFileSync(resolve(a, f)))
  const q = PNG.sync.read(readFileSync(resolve(b, f)))
  if (p.width !== q.width || p.height !== q.height) { rows.push([f, -2, -2]); continue }
  let changed = 0
  let sum = 0
  for (let i = 0; i < p.data.length; i += 4) {
    const d = (Math.abs(p.data[i] - q.data[i]) + Math.abs(p.data[i + 1] - q.data[i + 1]) + Math.abs(p.data[i + 2] - q.data[i + 2])) / 3
    sum += d
    if (d > th) changed++
  }
  const n = p.data.length / 4
  rows.push([f, (changed / n) * 100, sum / n])
}
for (const [f, pct, mean] of rows.sort((x, y) => y[1] - x[1])) {
  console.log(pct < 0 ? `  ${f}: ${pct === -1 ? 'missing after' : 'size differs'}` : `  ${pct.toFixed(2).padStart(6)}% changed  mean ${mean.toFixed(2).padStart(5)}  ${f}`)
}
