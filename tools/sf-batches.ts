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
 *
 * `--tier=A|B` sorts by how likely a rider is to see the building (user, 2026-09-22: "a building that the user is
 * likely to see should be more likely to get a full treatment… further out… even tallish buildings can just get a
 * reface"). The score is its height, a bonus for being civic or named, and a penalty for distance from the routes
 * people actually ride: the Embarcadero, Market Street, the Financial District, Union Square, the Wharf and the
 * park panhandle. Tier A is what earns a model; tier B is the reface sweep.
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

/** the corridors a rider is on, as polylines of [lat, lon] */
const ROUTES: [number, number][][] = [
  // the Embarcadero, Ferry Building to Aquatic Park
  [[37.7920, -122.3880], [37.7955, -122.3935], [37.8005, -122.3975], [37.8065, -122.4055], [37.8085, -122.4160], [37.8065, -122.4230], [37.8055, -122.4310]],
  // Market Street, and on through Civic Center
  [[37.7945, -122.3945], [37.7895, -122.4015], [37.7845, -122.4070], [37.7790, -122.4140], [37.7755, -122.4195], [37.7770, -122.4240]],
  // the Financial District's grid (Montgomery, Kearny, Sansome, California, Bush, Pine)
  [[37.7885, -122.4025], [37.7935, -122.4030], [37.7975, -122.4020]], [[37.7900, -122.3990], [37.7960, -122.3985]],
  [[37.7930, -122.4060], [37.7930, -122.3960]], [[37.7905, -122.4060], [37.7905, -122.3950]],
  // Union Square and the shopping streets
  [[37.7875, -122.4090], [37.7885, -122.4045]], [[37.7885, -122.4095], [37.7905, -122.4040]],
  // Chinatown's Grant and Stockton, up to North Beach and the Wharf
  [[37.7910, -122.4060], [37.7965, -122.4075], [37.8010, -122.4100], [37.8055, -122.4145]],
  // the Panhandle and the park's eastern end
  [[37.7715, -122.4415], [37.7725, -122.4510]],
]
const distToRoutes = (la: number, lo: number): number => {
  const kx = 88000
  const kz = 111000
  let best = Infinity
  for (const line of ROUTES) {
    for (let i = 1; i < line.length; i++) {
      const [la0, lo0] = line[i - 1]
      const [la1, lo1] = line[i]
      const ax = (lo - lo0) * kx
      const az = (la - la0) * kz
      const bx = (lo1 - lo0) * kx
      const bz = (la1 - la0) * kz
      const t = Math.max(0, Math.min(1, (ax * bx + az * bz) / (bx * bx + bz * bz || 1)))
      best = Math.min(best, Math.hypot(ax - bx * t, az - bz * t))
    }
  }
  return best
}
/** how much a building deserves its own model: tall, civic or named, and near a route people ride */
const seenScore = (c: string[]): number => {
  const h = Number(c[5]) || Number(c[6]) * 3.4 || 12
  // a named civic building — a church, a theatre, a museum, a library — is a landmark wherever it stands, and
  // always earns its own model (user, 2026-09-22: "any major landmarks, churches, unique buildings that people
  // love and recognize")
  const civic = c[2] === 'civic' ? (c[1] ? 200 : 30) : 0
  const named = c[1] ? 12 : 0
  const park = c[2] === 'park' || c[2] === 'garden' ? 20 : 0
  const d = distToRoutes(Number(c[3]), Number(c[4]))
  return h + civic + named + park - d / 12
}

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
// parks, gardens and playgrounds are not buildings: they are modelled as places, by hand (SF_PLAN.md §10)
const todo = rows.map(cells).filter((c) => c[7] === 'todo' && c[10] !== 'part' && !['park', 'garden', 'playground'].includes(c[2]))
  .filter((c) => (arg('tier') === 'A' ? seenScore(c) >= Number(arg('cut', '40')) : arg('tier') === 'B' ? seenScore(c) < Number(arg('cut', '40')) : true))
  .filter((c) => Number(c[5]) <= maxh && Number(c[5]) >= minh)
  .filter((c) => (want === 'named' ? !!c[1] : want === 'unnamed' ? !c[1] : true))
  .filter((c) => { const la = Number(c[3]); const lo = Number(c[4]); return la >= box.south && la <= box.north && lo >= box.west && lo <= box.east })
  .sort((a, b) => (arg('tier') ? seenScore(b) - seenScore(a) : Number(b[5]) - Number(a[5])))
const slices: string[][][] = Array.from({ length: parts }, () => [])
todo.slice(0, limit).forEach((c, i) => slices[i % parts].push(c))
slices.forEach((slice, k) => {
  const file = parts === 1 ? `${name}.md` : `${name}-${k + 1}.md`
  const head = [`# ${file.replace(/\.md$/, '')}: buildings to model one by one\n`,
    'Cut from the register (docs/sf-buildings.csv) by tools/sf-batches.ts: only buildings nobody has claimed, tallest',
    'first. Each gets its own model or a facade style — see docs/sf-batches/BRIEF-RECIPE.md.\n',
    '| # | kind | name | osm | height m | levels | lat, lon | note |', '|---|---|---|---|---|---|---|---|']
  const body = slice.map((c, i) => `| ${i + 1} | ${c[2]} | ${c[1] || '(unnamed)'} | ${c[0]} | ${c[5]} | ${c[6]} | ${c[3]}, ${c[4]} | ${c[11]} |`)
  writeFileSync(resolve(ROOT, 'docs', 'sf-batches', file), [...head, ...body].join('\n') + '\n')
  console.log(`${file}: ${slice.length}`)
})
