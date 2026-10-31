/**
 * Writes public/landmarks/paris/portals.json: a mouth wherever a surface railway goes under something (owner, 2026-10-30: "then it
 * goes into a tunnel irl, while in our version it just ends"). What is under something is not baked, so the track stopped dead there. Reads
 * the Île-de-France extract for those ways and the bake's tiles for the tracks that are drawn, one tile at a time (the 200 MB package cost
 * 4 GB of a machine that has none to spare). Tracks side by side share a mouth (tools/rail-levels.ts `railMouths`). Rerun after a bake.
 *   node --experimental-strip-types tools/paris-portals.ts [--rails=<dry-rails.json>]
 * (--rails: a dry run's tracks, tools/rail-audit.ts check <dir> --dry, in place of the last bake's: so the mouths go in with the bake that draws them)
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { railFate, railMouths } from './rail-levels.ts'

const ROOT = resolve(import.meta.dirname, '..')
const dir = mkdtempSync(resolve(tmpdir(), 'portals-'))
const box = resolve(dir, 'box.pbf'), railsPbf = resolve(dir, 'rails.pbf')
execFileSync('osmium', ['extract', '-b', '2.20,48.80,2.43,48.92', '--overwrite', '-o', box, resolve(ROOT, 'tools/cache/osm/ile-de-france-latest.osm.pbf')], { stdio: 'ignore' })
execFileSync('osmium', ['tags-filter', box, 'w/railway=rail,light_rail,tram,subway,disused', '--overwrite', '-o', railsPbf], { stdio: 'ignore' })
const text = execFileSync('osmium', ['export', railsPbf, '-f', 'geojsonseq'], { maxBuffer: 1 << 30 }).toString()
rmSync(dir, { recursive: true, force: true })
const X = (lon: number): number => (lon - 2.332) * 73270
const Z = (lat: number): number => (lat - 48.8605) * 111320

interface Way { id: number; a: number; b: number; kind?: string; name?: string; width: number; foot?: boolean; tunnel?: boolean; bore?: boolean; points: number[] }
const tileDir = resolve(ROOT, 'tools/cache/bake/paris-centre/tiles')
const railsById = new Map<number, { kind: string; points: number[]; heights?: number[] }>()
const edgesById = new Map<number, Way>()
for (const f of readdirSync(tileDir)) {
  if (!f.endsWith('.json')) continue
  const t = JSON.parse(readFileSync(resolve(tileDir, f), 'utf8')) as { rails?: { id: number; kind: string; points: number[]; heights?: number[] }[]; edges: Way[] }
  for (const r of t.rails ?? []) railsById.set(r.id, { kind: r.kind, points: r.points, heights: r.heights })
  for (const e of t.edges) if (!edgesById.has(e.id)) edgesById.set(e.id, { id: e.id, a: e.a, b: e.b, kind: e.kind, name: e.name, width: e.width, foot: e.foot, tunnel: e.tunnel, bore: e.bore, points: e.points })
}
const railsArg = process.argv.find((a) => a.startsWith('--rails='))?.slice(8)
const pkg = { rails: railsArg ? (JSON.parse(readFileSync(railsArg, 'utf8')) as { rails: { kind: string; points: number[]; heights?: number[] }[] }).rails : [...railsById.values()], edges: [...edgesById.values()] }
// (a métro's own yard or trench, or a way the bake kept, is not under anything: only what is left undrawn)
const drawnNear = (x: number, z: number): boolean => pkg.rails.some((r) => {
  const p = r.points
  for (let i = 2; i < p.length; i += 2) {
    const dx = p[i] - p[i - 2], dz = p[i + 1] - p[i - 1], t = Math.max(0, Math.min(1, ((x - p[i - 2]) * dx + (z - p[i - 1]) * dz) / (dx * dx + dz * dz || 1)))
    if (Math.hypot(p[i - 2] + dx * t - x, p[i - 1] + dz * t - z) < 2) return true
  }
  return false
})
const under: { points: number[] }[] = []
for (const l of text.split('\n')) {
  const s = l.replace(/^\x1e/, '').trim()
  if (!s) continue
  const f = JSON.parse(s) as { properties: Record<string, string>; geometry: { type: string; coordinates: number[][] } }
  if (f.geometry.type !== 'LineString') continue
  const fate = railFate(f.properties)
  if (fate === 'open') continue
  const c = f.geometry.coordinates
  const m = c[c.length >> 1]
  if (fate === 'sunk' && drawnNear(X(m[0]), Z(m[1]))) continue
  under.push({ points: c.flatMap((q) => [X(q[0]), Z(q[1])]) })
}
const made = railMouths(under, pkg.rails)
const out = made.map((m, i) => {
  // (a point entry's `front` turns local −z to that bearing, and this model's opening is on +z: it looks out along the track, so the other way)
  const front = Math.round(((Math.atan2(m.ox, m.oz) * 180) / Math.PI + 540) % 360)
  return { name: `railway tunnel mouth ${i + 1}`, procedural: 'railPortal', lat: +(48.8605 + (m.z - m.oz * 3) / 111320).toFixed(6), lon: +(2.332 + (m.x - m.ox * 3) / 73270).toFixed(6),
    size: [Math.round(2 * m.half), 6], front, height: 8, shadow: false, sign: false, note: 'Written by tools/paris-portals.ts: where OSM takes this track under something.' }
})
/*
 * …and the roads' (owner, 2026-10-30, the Périphérique under the Parc des Princes' end of the Bois, 48.847060, 2.254609: "this is actually a
 * tunnel under part of the park, not ends to all the roads"; at Auteuil, 48.851278, 2.252183: "another tunnel entrance not a wall"). A road
 * tunnel no bore took (tools/tunnels.ts: not a street, or not under a hill) is neither drawn nor ridden, and the road ran up to the hillside
 * and stopped. Every end of one that meets a road in the open gets a mouth, the two carriageways of a dual road sharing it. Not a service
 * way, unless it is named for a tunnel: those are the ramps into car parks, of which OSM has hundreds.
 */
// (a through road's. A residential street under a slab, the Olympiades's Rue du Javelot, has no wall for a mouth, and every model adds triangles)
const ROAD = /^(motorway|trunk|primary|secondary)(_link)?$/
const openAt = new Map<number, number>()
for (const e of pkg.edges) if (!e.foot && !e.tunnel) for (const n of [e.a, e.b]) openAt.set(n, (openAt.get(n) ?? 0) + 1)
const roadMouths: { x: number; z: number; ox: number; oz: number; width: number }[] = []
for (const e of pkg.edges) {
  if (e.foot || !e.tunnel || e.bore || !(ROAD.test(e.kind ?? '') || (e.kind === 'service' && /^tunnel/i.test(e.name ?? '')))) continue
  const p = e.points, n = p.length
  const end = (node: number, x: number, z: number, ix: number, iz: number): void => {
    if (!openAt.has(node)) return
    const dx = x - ix, dz = z - iz, L = Math.hypot(dx, dz) || 1
    roadMouths.push({ x, z, ox: dx / L, oz: dz / L, width: e.width })
  }
  end(e.a, p[0], p[1], p[2], p[3])
  end(e.b, p[n - 2], p[n - 1], p[n - 4], p[n - 3])
}
const roadGroups: (typeof roadMouths)[] = []
for (const m of roadMouths) {
  const g = roadGroups.find((q) => q.some((o) => Math.hypot(o.x - m.x, o.z - m.z) < 30 && o.ox * m.ox + o.oz * m.oz > 0.7))
  if (g) g.push(m)
  else roadGroups.push([m])
}
const roads = roadGroups.map((g, i) => {
  const x = g.reduce((a, m) => a + m.x, 0) / g.length, z = g.reduce((a, m) => a + m.z, 0) / g.length
  const ox = g[0].ox, oz = g[0].oz
  let half = 0
  for (const m of g) half = Math.max(half, Math.abs((m.x - x) * oz - (m.z - z) * ox) + m.width / 2)
  const front = Math.round(((Math.atan2(ox, oz) * 180) / Math.PI + 540) % 360)
  return { name: `road tunnel mouth ${i + 1}`, procedural: 'roadPortal', lat: +(48.8605 + (z - oz * 3) / 111320).toFixed(6), lon: +(2.332 + (x - ox * 3) / 73270).toFixed(6),
    size: [Math.round(2 * half + 7), 6], front, height: 7, shadow: false, sign: false, note: 'Written by tools/paris-portals.ts: where OSM takes this road into a tunnel no bore rides.' }
})
writeFileSync(resolve(ROOT, 'public/landmarks/paris/portals.json'), `${JSON.stringify([...out, ...roads], null, 1)}\n`)
console.log(`${under.length} railways under something; ${out.length} mouths, ${made.filter((m) => m.tight).length} tight between tracks; ${roadMouths.length} road tunnel ends, ${roads.length} mouths → public/landmarks/paris/portals.json`)
