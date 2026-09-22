/**
 * The river's centre line, for the boats that move on it (render/river-traffic.ts): written to
 * `public/cities/<id>/river.json` as local metres, west to east.
 *
 * Made from what the city already knows: the midpoint of every bridge over the water (`pkg.bridges`, where it
 * crosses), ordered along the river and joined, then sampled every 15 m and each sample moved to the middle of
 * the channel there (scanning across the local direction for the banks in the whole water bodies), and
 * smoothed. Where the river splits round an island the bridges of the main arm are the ones on its line.
 *   node --experimental-strip-types tools/river.ts [city]
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { unpackPoints, type CityPackage } from '../src/city/package.ts'
import { axisOf } from '../src/city/bridge-axis.ts'

const city = process.argv[2] ?? 'paris-centre'
const pkg = JSON.parse(readFileSync(`public/cities/${city}.json`, 'utf8')) as CityPackage
const water = pkg.areas.filter((a) => a.kind === 'water').map((a) => ({ ring: unpackPoints(a.ring), holes: (a.holes ?? []).map(unpackPoints) }))
const inside = (r: { x: number; z: number }[], x: number, z: number): boolean => {
  let o = false
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i].z > z) !== (r[j].z > z) && x < ((r[j].x - r[i].x) * (z - r[i].z)) / (r[j].z - r[i].z) + r[i].x) o = !o
  return o
}
const wet = (x: number, z: number): boolean => water.some((w) => inside(w.ring, x, z) && !w.holes.some((h) => inside(h, x, z)))
// the bridges' midpoints over water (the Seine's are the long ones with water under their middle)
const mids: { x: number; z: number; name: string }[] = []
for (const b of pkg.bridges ?? []) {
  const ax = axisOf(unpackPoints(b.ring))
  if (!ax || ax.L < 50) continue
  const m = { x: ax.o.x + ax.ux * ax.L / 2, z: ax.o.z + ax.uz * ax.L / 2 }
  if (!wet(m.x, m.z)) continue
  // skip the small arm south of the Île de la Cité: a boat follows the main channel
  // (and the Pont Morland, over the Arsenal basin, not the river)
  if (/Petit-Pont|Double|Saint-Michel|Archevêché|Tournelle|Saint-Louis|Morland/.test(b.name ?? '')) continue
  // a bridge in two halves across an island's tip (Pont Neuf, Pont de Sully): the northern half, on the main arm
  const twin = mids.findIndex((q) => q.name && q.name === b.name)
  if (twin >= 0) { if (m.z > mids[twin].z) mids[twin] = { ...m, name: b.name ?? '' }; continue }
  mids.push({ ...m, name: b.name ?? '' })
}
// in order along the river: by the longest-axis projection, roughly west → east; then fix by nearest neighbour
mids.sort((a, b) => a.x - b.x)
const line: { x: number; z: number }[] = []
for (let i = 1; i < mids.length; i++) {
  const a = mids[i - 1]
  const b = mids[i]
  const l = Math.hypot(b.x - a.x, b.z - a.z)
  for (let s = 0; s < l; s += 15) line.push({ x: a.x + ((b.x - a.x) * s) / l, z: a.z + ((b.z - a.z) * s) / l })
}
line.push(mids[mids.length - 1])
// beyond the last bridge at each end, on down the channel while there is water (the boats turn at the ends)
const across = (p: { x: number; z: number }, dx: number, dz: number): { x: number; z: number } | null => {
  const nx = -dz
  const nz = dx
  if (!wet(p.x, p.z)) return null
  let lo = 0, hi = 0
  while (lo > -250 && wet(p.x + nx * (lo - 2), p.z + nz * (lo - 2))) lo -= 2
  while (hi < 250 && wet(p.x + nx * (hi + 2), p.z + nz * (hi + 2))) hi += 2
  return hi - lo < 40 ? null : { x: p.x + nx * (lo + hi) / 2, z: p.z + nz * (lo + hi) / 2 }
}
for (const end of [0, 1]) {
  const pts = end ? line : [...line].reverse()
  for (let k = 0; k < 200; k++) {
    const a = pts[pts.length - 4]
    const b = pts[pts.length - 1]
    const l = Math.hypot(b.x - a.x, b.z - a.z) || 1
    const q = across({ x: b.x + ((b.x - a.x) / l) * 15, z: b.z + ((b.z - a.z) / l) * 15 }, (b.x - a.x) / l, (b.z - a.z) / l)
    if (!q) break
    pts.push(q)
  }
  if (!end) { line.length = 0; line.push(...pts.reverse()) }
}
// each sample to the middle of the channel across the local direction
const mid = line.map((p, i) => {
  const a = line[Math.max(0, i - 2)]
  const b = line[Math.min(line.length - 1, i + 2)]
  const l = Math.hypot(b.x - a.x, b.z - a.z) || 1
  const nx = -(b.z - a.z) / l
  const nz = (b.x - a.x) / l
  if (!wet(p.x, p.z)) {
    // off the water between two bridges: find the nearest water across
    for (let o = 5; o < 200; o += 5) for (const sgn of [1, -1]) if (wet(p.x + nx * o * sgn, p.z + nz * o * sgn)) return { x: p.x + nx * o * sgn, z: p.z + nz * o * sgn }
    return p
  }
  let lo = 0, hi = 0
  while (lo > -250 && wet(p.x + nx * (lo - 2), p.z + nz * (lo - 2))) lo -= 2
  while (hi < 250 && wet(p.x + nx * (hi + 2), p.z + nz * (hi + 2))) hi += 2
  const c = (lo + hi) / 2
  return { x: p.x + nx * c, z: p.z + nz * c, w: hi - lo }
})
const smooth = mid.map((p, i) => {
  let x = 0, z = 0, n = 0
  for (let k = -3; k <= 3; k++) { const q = mid[Math.max(0, Math.min(mid.length - 1, i + k))]; x += q.x; z += q.z; n++ }
  return { x: Math.round((x / n) * 10) / 10, z: Math.round((z / n) * 10) / 10 }
})
writeFileSync(`public/cities/${city}/river.json`, JSON.stringify({ name: 'Seine', points: smooth.flatMap((p) => [p.x, p.z]) }))
let L = 0
for (let i = 1; i < smooth.length; i++) L += Math.hypot(smooth[i].x - smooth[i - 1].x, smooth[i].z - smooth[i - 1].z)
console.log(`${city}: ${mids.length} bridges (${mids.map((m) => m.name).join(', ')}), ${smooth.length} points, ${(L / 1000).toFixed(1)} km; ${smooth.filter((p) => !wet(p.x, p.z)).length} off the water`)
