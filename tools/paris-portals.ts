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
const pkg = JSON.parse(readFileSync(resolve(ROOT, 'tools/cache/bake/paris-centre/package.json'), 'utf8')) as { rails: { kind: string; points: number[] }[] }
const ends: { x: number; z: number }[] = []
for (const r of pkg.rails) {
  if (r.kind !== 'rail') continue
  ends.push({ x: r.points[0], z: r.points[1] }, { x: r.points[r.points.length - 2], z: r.points[r.points.length - 1] })
}
const mouths = tunnels.filter((t) => ends.some((e) => Math.hypot(e.x - t.x, e.z - t.z) < 3))
// tracks side by side, one mouth: within 22 m and facing the same way
const groups: (typeof mouths)[] = []
for (const m of mouths) {
  const g = groups.find((q) => q.some((o) => Math.hypot(o.x - m.x, o.z - m.z) < 22 && o.ox * m.ox + o.oz * m.oz > 0.7))
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
writeFileSync(resolve(ROOT, 'public/landmarks/paris/portals.json'), `${JSON.stringify(out, null, 1)}\n`)
console.log(`${tunnels.length / 2} rail tunnels; ${mouths.length} ends meet a drawn track; ${out.length} mouths → public/landmarks/paris/portals.json`)
