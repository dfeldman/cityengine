/** One way's heights against the raw ground under it, every metre: npx tsx tools/edge-profile.ts <edgeId> [city] */
import { readPackage, readV2 } from './bake-files.ts'
import { Terrain } from '../src/city/terrain.ts'
import { unpackPoints } from '../src/city/package.ts'
const id = Number(process.argv[2]), city = process.argv[3] ?? 'san-francisco'
const pkg = readPackage(city), terrain = new Terrain(pkg.terrain)
for (const t of readV2(city).tiles) { const [tx, tz] = t.key.split(',').map(Number); terrain.addTile(tx, tz, t.terrain) }
const e = pkg.edges.find((x) => x.id === id)!
const p = unpackPoints(e.points)
console.log(id, e.name ?? e.kind, 'tunnel', e.tunnel, 'bore', e.bore, 'cut', e.cut, 'layer', e.layer, 'bridge', e.bridge)
let d = 0
for (let i = 0; i < p.length; i++) {
  if (i) d += Math.hypot(p[i].x - p[i - 1].x, p[i].z - p[i - 1].z)
  console.log(`  v${i} at ${d.toFixed(1)} m: way ${e.heights![i].toFixed(2)}  ground ${terrain.rawHeightAt(p[i].x, p[i].z).toFixed(2)}`)
}
