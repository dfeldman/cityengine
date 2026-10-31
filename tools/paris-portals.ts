/**
 * Writes public/landmarks/paris/portals.json: a mouth wherever a surface railway goes into a tunnel (owner, 2026-10-30: "then it
 * goes into a tunnel irl, while in our version it just ends"). Tunnel ways are not baked, so the track stopped dead there. Reads
 * the Île-de-France extract for the tunnels and the bake's package for the tracks that are drawn; tracks side by side share a
 * mouth. Rerun after a bake.
 *   node --experimental-strip-types tools/paris-portals.ts
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const dir = mkdtempSync(resolve(tmpdir(), 'portals-'))
const box = resolve(dir, 'box.pbf'), rails = resolve(dir, 'rails.pbf')
execFileSync('osmium', ['extract', '-b', '2.20,48.80,2.43,48.92', '--overwrite', '-o', box, resolve(ROOT, 'tools/cache/osm/ile-de-france-latest.osm.pbf')], { stdio: 'ignore' })
execFileSync('osmium', ['tags-filter', box, 'w/railway=rail', '--overwrite', '-o', rails], { stdio: 'ignore' })
const text = execFileSync('osmium', ['export', rails, '-f', 'geojsonseq'], { maxBuffer: 1 << 30 }).toString()
rmSync(dir, { recursive: true, force: true })
const X = (lon: number): number => (lon - 2.332) * 73270
const Z = (lat: number): number => (lat - 48.8605) * 111320
const tunnels: { x: number; z: number; ox: number; oz: number }[] = []
for (const l of text.split('\n')) {
  const s = l.replace(/^\x1e/, '').trim()
  if (!s) continue
  const f = JSON.parse(s) as { properties: Record<string, string>; geometry: { type: string; coordinates: number[][] } }
  if (f.geometry.type !== 'LineString' || !f.properties.tunnel || f.properties.tunnel === 'no') continue
  const c = f.geometry.coordinates
  // each end, with the direction out of the tunnel there
  const end = (a: number[], b: number[]): void => {
    const x = X(a[0]), z = Z(a[1]), dx = x - X(b[0]), dz = z - Z(b[1]), L = Math.hypot(dx, dz) || 1
    tunnels.push({ x, z, ox: dx / L, oz: dz / L })
  }
  end(c[0], c[1])
  end(c[c.length - 1], c[c.length - 2])
}
interface Way { id: number; a: number; b: number; kind?: string; name?: string; width: number; foot?: boolean; tunnel?: boolean; bore?: boolean; points: number[] }
const pkg = JSON.parse(readFileSync(resolve(ROOT, 'tools/cache/bake/paris-centre/package.json'), 'utf8')) as { rails: { kind: string; points: number[] }[]; edges: Way[] }
const ends: { x: number; z: number }[] = []
for (const r of pkg.rails) {
  if (r.kind !== 'rail') continue
  ends.push({ x: r.points[0], z: r.points[1] }, { x: r.points[r.points.length - 2], z: r.points[r.points.length - 1] })
}
const mouths = tunnels.filter((t) => ends.some((e) => Math.hypot(e.x - t.x, e.z - t.z) < 3))
// tracks side by side, one mouth: within 12 m and facing the same way. (Not 22: the two EOLE mouths in the Gare de l'Est's yard, 48.888912,
// 2.365957, are 22 m apart with the running lines between them, and the one wall across all of it had trains passing through it: owner, "i
// assume this is a train tunnel entrance but it doesn't go anywhere and looks like a wall")
const groups: (typeof mouths)[] = []
for (const m of mouths) {
  const g = groups.find((q) => q.some((o) => Math.hypot(o.x - m.x, o.z - m.z) < 12 && o.ox * m.ox + o.oz * m.oz > 0.7))
  if (g) g.push(m)
  else groups.push([m])
}
const out = groups.map((g, i) => {
  const x = g.reduce((a, m) => a + m.x, 0) / g.length, z = g.reduce((a, m) => a + m.z, 0) / g.length
  const ox = g[0].ox, oz = g[0].oz
  let wide = 0
  for (const m of g) wide = Math.max(wide, Math.abs((m.x - x) * oz - (m.z - z) * ox))
  // (a point entry's `front` turns local −z to that bearing, and this model's opening is on +z: it looks out along the track, so the other way)
  const front = Math.round(((Math.atan2(ox, oz) * 180) / Math.PI + 540) % 360)
  return { name: `railway tunnel mouth ${i + 1}`, procedural: 'railPortal', lat: +(48.8605 + (z - oz * 3) / 111320).toFixed(6), lon: +(2.332 + (x - ox * 3) / 73270).toFixed(6),
    size: [Math.round(2 * wide + 12), 6], front, height: 8, shadow: false, sign: false, note: 'Written by tools/paris-portals.ts: where OSM takes this track into a tunnel.' }
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
console.log(`${tunnels.length / 2} rail tunnels; ${mouths.length} ends meet a drawn track; ${out.length} mouths; ${roadMouths.length} road tunnel ends, ${roads.length} mouths → public/landmarks/paris/portals.json`)
