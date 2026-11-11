/** The band's ground against the lidar and the ways: posts (every STEP m on tiles shipped at ≤ 1 m) standing more than MARGIN over
 *  the MNT where the MNS agrees with it (open ground), and way vertices (not bridge/tunnel/negative layer) under the shipped ground.
 *  npx tsx tools/ground-audit.ts <city> [step=4] [margin=1.5] */
import { readPackage, readV2 } from './bake-files.ts'
import { Terrain } from '../src/city/terrain.ts'
import { unpackPoints } from '../src/city/package.ts'
import { Projection } from '../src/city/geo.ts'
import { ignLidar, MNS_LAYER } from './ign-lidar.ts'
const [city, st, mg] = process.argv.slice(2), STEP = Number(st ?? 4), MARGIN = Number(mg ?? 1.5)
const pkg = readPackage(city), v2 = readV2(city), T = new Terrain(pkg.terrain), TILE = v2.index.tile ?? 200
for (const t of v2.tiles) { const [tx, tz] = t.key.split(',').map(Number); T.addTile(tx, tz, t.terrain) }
const proj = new Projection(v2.index.origin), datum = (v2.index as unknown as { datumMsl?: number }).datumMsl ?? 32.94
const fine = v2.tiles.filter((t) => (T.stepIn(t.key) ?? 99) <= 1)
let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
for (const t of fine) { const [tx, tz] = t.key.split(',').map(Number); x0 = Math.min(x0, tx * TILE); x1 = Math.max(x1, tx * TILE + TILE); z0 = Math.min(z0, tz * TILE); z1 = Math.max(z1, tz * TILE + TILE) }
const a = proj.toLatLon({ x: x0, z: z0 }), b = proj.toLatLon({ x: x1, z: z1 })
const box = { south: Math.min(a.lat, b.lat), north: Math.max(a.lat, b.lat), west: Math.min(a.lon, b.lon), east: Math.max(a.lon, b.lon) }
const mnt = await ignLidar(box, 1024), mns = await ignLidar(box, 1024, MNS_LAYER)
const L = (x: number, z: number, m: typeof mnt) => { const q = proj.toLatLon({ x, z }), v = m.at(q.lat, q.lon); return v === null ? NaN : v - datum }
let posts = 0, high = 0; const ex: string[] = []
for (const t of fine) { const [tx, tz] = t.key.split(',').map(Number)
  for (let z = tz * TILE; z < tz * TILE + TILE; z += STEP) for (let x = tx * TILE; x < tx * TILE + TILE; x += STEP) {
    const m = L(x, z, mnt), s = L(x, z, mns); if (!Number.isFinite(m) || !Number.isFinite(s) || Math.abs(s - m) > 0.5) continue
    posts++; const g = T.rawHeightAt(x, z); if (g > m + MARGIN) { high++; if (ex.length < 4) { const q = proj.toLatLon({ x, z }); ex.push(`${q.lat.toFixed(6)},${q.lon.toFixed(6)} ground ${g.toFixed(1)} mnt ${m.toFixed(1)}`) } } } }
let vs = 0, under = 0; const ew = new Set<number>()
for (const e of pkg.edges) { if (e.bridge || e.tunnel || (e.layer ?? 0) < 0 || !e.heights) continue
  const p = unpackPoints(e.points)
  p.forEach((q, i) => { if ((T.stepIn(`${Math.floor(q.x / TILE)},${Math.floor(q.z / TILE)}`) ?? 99) > 1) return; vs++; if (e.heights![i] < T.rawHeightAt(q.x, q.z) - 0.3) { under++; ew.add(e.id) } }) }
console.log(`${city}: open-ground posts over the MNT by > ${MARGIN} m: ${high}/${posts}; way vertices under the ground by > 0.3 m: ${under}/${vs} (${ew.size} ways)\n  ${ex.join('\n  ')}`)
