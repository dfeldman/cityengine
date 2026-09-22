/**
 * Cut the remaining work into batch lists, one per district slice, from the register (docs/sf-buildings.csv,
 * written by tools/sf-status.ts). Only buildings still `todo` go in, so two agents can never be handed the same
 * building — the first slicing was geographic and overlapped, and two districts modelled seven buildings twice.
 *
 *   node --experimental-strip-types tools/sf-status.ts          (first: refresh the register)
 *   node --experimental-strip-types tools/sf-batches.ts fidi 3 --south=37.7885 --north=37.7975 --west=-122.4060 --east=-122.3930
 *
 * Writes docs/sf-batches/<name>-1.md … -<n>.md, tallest first, dealt round-robin so every slice has a mix.
 * `--names=named|unnamed`, `--minh=`, `--maxh=` and `--limit=` choose which work to cut: the named and tall ones
 * are worth a model, the unnamed low ones a facade style.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const arg = (n: string, f = ''): string => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? `=${f}`).split('=').slice(1).join('=')
const rest = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const name = rest[0] ?? 'batch'
const parts = Number(rest[1] ?? 1)
const maxh = Number(arg('maxh', 'Infinity'))
const minh = Number(arg('minh', '0'))
const want = arg('names', 'any')      // any | named | unnamed
const limit = Number(arg('limit', 'Infinity'))
const box = { south: Number(arg('south', '-90')), north: Number(arg('north', '90')), west: Number(arg('west', '-180')), east: Number(arg('east', '180')) }

const rows = readFileSync(resolve(ROOT, 'docs', 'sf-buildings.csv'), 'utf8').split('\n').slice(1).filter(Boolean)
const cells = (line: string): string[] => {
  const out: string[] = []
  let cur = ''
  let q = false
  for (const ch of line) {
    if (ch === '"') q = !q
    else if (ch === ',' && !q) { out.push(cur); cur = '' }
    else cur += ch
  }
  out.push(cur)
  return out
}
const todo = rows.map(cells).filter((c) => c[7] === 'todo')
  .filter((c) => Number(c[5]) <= maxh && Number(c[5]) >= minh)
  .filter((c) => (want === 'named' ? !!c[1] : want === 'unnamed' ? !c[1] : true))
  .filter((c) => { const la = Number(c[3]); const lo = Number(c[4]); return la >= box.south && la <= box.north && lo >= box.west && lo <= box.east })
  .sort((a, b) => Number(b[5]) - Number(a[5]))
const slices: string[][][] = Array.from({ length: parts }, () => [])
todo.slice(0, limit).forEach((c, i) => slices[i % parts].push(c))
slices.forEach((slice, k) => {
  const file = parts === 1 ? `${name}.md` : `${name}-${k + 1}.md`
  const head = [`# ${file.replace(/\.md$/, '')}: buildings to model one by one\n`,
    'Cut from the register (docs/sf-buildings.csv) by tools/sf-batches.ts: only buildings nobody has claimed, tallest',
    'first. Each gets its own model or a facade style — see docs/sf-batches/BRIEF-RECIPE.md.\n',
    '| # | kind | name | osm | height m | levels | lat, lon | note |', '|---|---|---|---|---|---|---|---|']
  const body = slice.map((c, i) => `| ${i + 1} | ${c[2]} | ${c[1] || '(unnamed)'} | ${c[0]} | ${c[5]} | ${c[6]} | ${c[3]}, ${c[4]} | ${c[10]} |`)
  writeFileSync(resolve(ROOT, 'docs', 'sf-batches', file), [...head, ...body].join('\n') + '\n')
  console.log(`${file}: ${slice.length}`)
})
