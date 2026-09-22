/**
 * Every building fronting a street (SF_PLAN.md §10: each building on a major street gets its own model or a
 * facade style, decided one by one): from the Overpass cache, the building ways and relations whose outline comes
 * within `--reach` metres (default 24: Market is 36 m wall to wall) of the named street's ways, between two points along it, in order along
 * the street, with the side, the address, the name, levels/height and the tags that help decide. Also says which
 * the landmark manifest already has.
 *   node --experimental-strip-types tools/street-buildings.ts --street="Market Street" --from=37.7955,-122.3937 --to=37.7890,-122.4020
 */
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { readManifestFile } from '../src/city/manifest.ts'

const arg = (n: string, f = ''): string => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? `=${f}`).split('=').slice(1).join('=')
const street = arg('street')
const [la0, lo0] = arg('from').split(',').map(Number)
const [la1, lo1] = arg('to').split(',').map(Number)
const reach = Number(arg('reach', '24'))
if (!street || Number.isNaN(la0) || Number.isNaN(la1)) { console.error('need --street, --from=lat,lon, --to=lat,lon'); process.exit(1) }
const kx = 111320 * Math.cos((la0 * Math.PI) / 180)
const kz = 110540
const loc = (g: { lat: number; lon: number }): { x: number; z: number } => ({ x: (g.lon - lo0) * kx, z: (g.lat - la0) * kz })
const end = loc({ lat: la1, lon: lo1 })
const len = Math.hypot(end.x, end.z)
const ux = end.x / len
const uz = end.z / len

type G = { lat: number; lon: number }
type El = { type: string; id: number; tags?: Record<string, string>; geometry?: G[]; members?: { role: string; geometry?: G[] }[] }
const els = new Map<string, El>()
const dir = resolve(import.meta.dirname, 'cache')
for (const f of readdirSync(dir)) {
  if (!f.startsWith('overpass-')) continue
  let d: { elements?: El[] }
  try { d = JSON.parse(readFileSync(resolve(dir, f), 'utf8')) } catch { continue }
  for (const e of d.elements ?? []) if (e.tags) els.set(`${e.type}/${e.id}`, e)
}
// the street's segments, local metres, those along the stretch
const segs: [{ x: number; z: number }, { x: number; z: number }][] = []
for (const e of els.values()) {
  if (e.tags!.name !== street || !e.tags!.highway || !e.geometry) continue
  const p = e.geometry.map(loc)
  for (let i = 1; i < p.length; i++) {
    const t = ((p[i].x + p[i - 1].x) / 2) * ux + ((p[i].z + p[i - 1].z) / 2) * uz
    if (t > -20 && t < len + 20) segs.push([p[i - 1], p[i]])
  }
}
if (segs.length === 0) { console.error(`no ways named "${street}" there`); process.exit(1) }
const distSeg = (q: { x: number; z: number }, a: { x: number; z: number }, b: { x: number; z: number }): number => {
  const dx = b.x - a.x
  const dz = b.z - a.z
  const t = Math.max(0, Math.min(1, ((q.x - a.x) * dx + (q.z - a.z) * dz) / (dx * dx + dz * dz || 1)))
  return Math.hypot(q.x - a.x - dx * t, q.z - a.z - dz * t)
}
const manifest = await readManifestFile<{ osm?: string | string[]; name: string; restyle?: string; procedural?: string }>(resolve(import.meta.dirname, '..', 'public', 'landmarks', 'san-francisco.json'))
const had = new Map<string, string>()
for (const m of manifest) for (const id of Array.isArray(m.osm) ? m.osm : m.osm ? [m.osm] : []) had.set(id, m.procedural ? `model ${m.procedural}` : m.restyle ? `restyle ${m.restyle}` : m.name)
const rows: { t: number; side: string; line: string }[] = []
for (const [id, e] of els) {
  const t = e.tags!
  if (!t.building) continue
  const g = e.geometry ?? (e.members ?? []).filter((m) => m.role === 'outer').flatMap((m) => m.geometry ?? [])
  if (g.length < 3) continue
  const p = g.map(loc)
  let best = Infinity
  for (const q of p) for (const [a, b] of segs) best = Math.min(best, distSeg(q, a, b))
  if (best > reach) continue
  const cx = p.reduce((s, q) => s + q.x, 0) / p.length
  const cz = p.reduce((s, q) => s + q.z, 0) / p.length
  const along = cx * ux + cz * uz
  if (along < -10 || along > len + 10) continue
  const side = cx * uz - cz * ux > 0 ? 'R' : 'L'
  const c = { lat: g.reduce((s, q) => s + q.lat, 0) / g.length, lon: g.reduce((s, q) => s + q.lon, 0) / g.length }
  const addr = [t['addr:housenumber'], t['addr:street']].filter(Boolean).join(' ')
  const levels = t['building:levels'] ?? ''
  const h = t.height ?? ''
  rows.push({ t: along, side, line: `${String(Math.round(along)).padStart(5)} m ${side}  ${id.padEnd(18)} ${(t.name ?? '').slice(0, 34).padEnd(34)} ${addr.slice(0, 22).padEnd(22)} ${String(levels).padStart(3)} fl ${String(h).padStart(5)} m  ${c.lat.toFixed(6)},${c.lon.toFixed(6)}  ${[t.building !== 'yes' && `building=${t.building}`, t['building:material'] && `material=${t['building:material']}`, t.start_date && `built ${t.start_date}`, t.amenity, t.shop && `shop=${t.shop}`].filter(Boolean).join(' ')}${had.has(id) ? `   [HAS: ${had.get(id)}]` : ''}` })
}
rows.sort((a, b) => a.t - b.t)
console.log(`${rows.length} buildings on ${street} (along from ${la0},${lo0}; L/R looking toward ${la1},${lo1})`)
for (const r of rows) console.log(r.line)
