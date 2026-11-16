/** Terrain against the Trocadéro parvis model's levels (region modelWalks): per level, ground minus paving. npx tsx tools/parvis-gap.ts [city]; ALL=1 also the lower levels, TWEAK=1 with the region's terrainTweaks applied, WHERE=1 each poke, GEN=1 prints the pits for regions.json */
import { readPackage, readV2 } from './bake-files.ts'
import { Terrain } from '../src/city/terrain.ts'
import { Projection } from '../src/city/geo.ts'
import { prepareTweaks } from '../src/city/terrain-tweaks.ts'
import regions from '../src/city/regions.json' with { type: 'json' }
const city = process.argv[2] ?? 'paris-centre'
const pkg = readPackage(city), v2 = readV2(city), terrain = new Terrain(pkg.terrain)
const proj = new Projection(v2.index.origin)
// TWEAK=1: with the region's runtime terrainTweaks applied, as the game streams the tiles in
if (process.env.TWEAK) terrain.tweaks = prepareTweaks((regions as any).paris.terrainTweaks, proj, (x, z) => terrain.rawHeightAt(x, z))
for (const t of v2.tiles) { const [tx, tz] = t.key.split(',').map(Number); terrain.addTile(tx, tz, t.terrain) }
const m = (regions as any).paris.modelWalks[0], c = proj.toLocal({ lat: m.at[0], lon: m.at[1] }), r = (m.rotateDeg * Math.PI) / 180
// local → world: inverse of bake's rotation
const toWorld = (lx: number, lz: number) => ({ x: c.x + lx * Math.cos(r) + lz * Math.sin(r), z: c.z - lx * Math.sin(r) + lz * Math.cos(r) })
const extra = [[-22, 22, 70, 82, -14, -14], [42, 52.5, 70, 82, -7, -7], [-52.5, -42, 70, 82, -7, -7], [-45, 45, 86, 111, -15, -15], [45.5, 55.6, 37.3, 55, -1.5, -1.5], [-55.6, -45.5, 37.3, 55, -1.5, -1.5]]
for (const [x0, x1, z0, z1, ya, yb] of [...m.levels, ...(process.env.ALL ? extra : [])]) {
  const d: number[] = []
  for (let lx = x0; lx <= x1; lx += 2) for (let lz = z0; lz <= z1; lz += 1) {
    const w = toWorld(lx, lz), y = m.baseY + ya + ((yb - ya) * (lz - z0)) / (z1 - z0 || 1)
    d.push(terrain.rawHeightAt(w.x, w.z) - y)
    if (process.env.WHERE && d[d.length - 1] > 0.1) console.log(`  poke ${lx.toFixed(1)},${lz.toFixed(1)} +${d[d.length - 1].toFixed(2)}`)
  }
  d.sort((a, b) => a - b)
  const q = (f: number) => d[Math.floor(f * (d.length - 1))].toFixed(2)
  console.log(`level x ${x0}..${x1} z ${z0}..${z1} y ${ya}: ground-pave min ${q(0)} p10 ${q(0.1)} med ${q(0.5)} p90 ${q(0.9)} max ${q(1)} above ${d.filter((v) => v > -0.05).length}/${d.length}`)
}
// GEN=1: the terrainTweaks pits that sink the ground under the model's paved levels (y = baseY + level − margin), as regions.json JSON
const PITS: [string, number, [number, number][]][] = [
  ['the parvis and its steps', -1, [[-27.4, -27], [27.4, -27], [27.4, 30], [55.6, 30], [55.6, 35.3], [-55.6, 35.3], [-55.6, 30], [-27.4, 30]]],
  ['the Place over the theatre', -2.1, [[-55.6, 35.3], [55.6, 35.3], [55.6, 55], [45.5, 55], [45.5, 68], [-45.5, 68], [-45.5, 55], [-55.6, 55]]],
  ['the east stair well and landing', -7.5, [[45.5, 55], [55.6, 55], [55.6, 82], [42, 82], [42, 69.5], [45.5, 69.5]]],
  ['the west stair well and landing', -7.5, [[-45.5, 55], [-55.6, 55], [-55.6, 82], [-42, 82], [-42, 69.5], [-45.5, 69.5]]],
  ["the theatre's terrace and its flights", -14.5, [[-42, 66], [42, 66], [42, 82], [-42, 82]]],
  ['the lower terrace', -15.5, [[-46.5, 82], [46.5, 82], [46.5, 111.3], [-46.5, 111.3]]],
]
if (process.env.GEN) console.log(JSON.stringify(PITS.map(([n, y, ring]) => ({ name: `Trocadéro: ${n} (the lidar ground sinks under the model's paving, tools/parvis-gap.ts)`, kind: 'pit', y: Math.round((m.baseY + y) * 10) / 10,
  ring: ring.map(([lx, lz]) => { const g = proj.toLatLon(toWorld(lx, lz)); return [Number(g.lat.toFixed(7)), Number(g.lon.toFixed(7))] }) }))))
