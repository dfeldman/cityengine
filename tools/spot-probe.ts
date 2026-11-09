/** What stands at a spot in a baked city: ways (heights vs shipped ground vs lidar MNT/MNS), rails, building outlines, BD TOPO troncons.
 *   npx tsx tools/spot-probe.ts <city> <lat> <lon> [R=25] */
import { readPackage, readV2 } from './bake-files.ts'
import { Terrain } from '../src/city/terrain.ts'
import { unpackPoints } from '../src/city/package.ts'
import { Projection } from '../src/city/geo.ts'
import { ignLidar, MNS_LAYER } from './ign-lidar.ts'
import { fetchBdTopo, fillNoZ, btSol } from './bdtopo-zones.ts'
const [city, la, lo, Rs] = process.argv.slice(2), lat = Number(la), lon = Number(lo), R = Number(Rs ?? 25)
const pkg = readPackage(city), v2 = readV2(city), terrain = new Terrain(pkg.terrain)
for (const t of v2.tiles) { const [tx, tz] = t.key.split(',').map(Number); terrain.addTile(tx, tz, t.terrain) }
const proj = new Projection(v2.index.origin), c = proj.toLocal({ lat, lon })
const datum = (v2.index as unknown as { datumMsl?: number }).datumMsl ?? 32.94
const d = 0.002, box = { south: lat - d, north: lat + d, west: lon - d * 1.5, east: lon + d * 1.5 }
const mnt = await ignLidar(box, 1024), mns = await ignLidar(box, 1024, MNS_LAYER)
const L = (x: number, z: number, m: typeof mnt) => { const q = proj.toLatLon({ x, z }), v = m.at(q.lat, q.lon); return v === null ? NaN : v - datum }
const f = (v: number) => Number.isFinite(v) ? v.toFixed(1) : '-'
console.log(`spot ${lat},${lon} local ${c.x.toFixed(1)},${c.z.toFixed(1)} ground ${f(terrain.rawHeightAt(c.x, c.z))} mnt ${f(L(c.x, c.z, mnt))} mns ${f(L(c.x, c.z, mns))}`)
for (const e of pkg.edges) {
  const p = unpackPoints(e.points); let bi = -1, bd = R
  p.forEach((q, i) => { const dd = Math.hypot(q.x - c.x, q.z - c.z); if (dd < bd) { bd = dd; bi = i } })
  if (bi < 0) continue
  const rows = p.map((q, i) => `${f(e.heights?.[i] ?? NaN)}/${f(terrain.rawHeightAt(q.x, q.z))}/${f(L(q.x, q.z, mnt))}`)
  console.log(`edge ${e.id} ${e.kind} ${e.name ?? ''} br${e.bridge ? 1 : 0} tun${e.tunnel ? 1 : 0} L${e.layer ?? 0} ramp${e.ramp ? 1 : 0} n${p.length} near v${bi} ${bd.toFixed(1)}m  way/ground/mnt: ${rows.slice(Math.max(0, bi - 3), bi + 4).join(' ')}`)
}
for (const r of pkg.rails ?? []) {
  const n = r.points.length / 2; let bi = -1, bd = R
  for (let i = 0; i < n; i++) { const dd = Math.hypot(r.points[2 * i] - c.x, r.points[2 * i + 1] - c.z); if (dd < bd) { bd = dd; bi = i } }
  if (bi < 0) continue
  const rows = [...Array(n).keys()].map((i) => `${f(r.heights?.[i] ?? NaN)}/${f(terrain.rawHeightAt(r.points[2 * i], r.points[2 * i + 1]))}/${f(L(r.points[2 * i], r.points[2 * i + 1], mnt))}`)
  console.log(`rail ${r.id} ${r.kind} br${r.bridge ? 1 : 0} L${r.layer ?? 0} n${n} near v${bi} ${bd.toFixed(1)}m h/ground/mnt: ${rows.join(' ')}`)
}
const inRing = (ring: number[], x: number, z: number) => { let o = false; for (let i = 0, j = ring.length / 2 - 1; i < ring.length / 2; j = i++) { const xi = ring[2 * i], zi = ring[2 * i + 1], xj = ring[2 * j], zj = ring[2 * j + 1]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) o = !o } return o }
for (const b of pkg.buildings) if (b.ring && inRing(b.ring, c.x, c.z)) console.log(`building ${b.id} ${JSON.stringify(b).slice(0, 200)}`)
for (const layer of ['troncon_de_route', 'troncon_de_voie_ferree'] as const) {
  const fs = await fetchBdTopo(layer, lat - d, lon - d * 1.5, lat + d, lon + d * 1.5); fillNoZ(fs)
  for (const ft of fs) for (const line of ft.coords) {
    let bd = R, bz = NaN
    for (const q of line) { const l = proj.toLocal({ lat: q[1], lon: q[0] }); const dd = Math.hypot(l.x - c.x, l.z - c.z); if (dd < bd) { bd = dd; bz = q[2] - datum } }
    if (bd < R) console.log(`bt ${layer.slice(10)} ${ft.id} sol${btSol(ft)} ${ft.props.nature} ${ft.props.nom_collaboratif_gauche ?? ''} ${bd.toFixed(1)}m z ${f(bz)} [${line.map((q) => f(q[2] - datum)).join(' ')}]`)
  }
}
