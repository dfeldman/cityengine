/** What refineAtWalls (city/wall-ground.ts) costs: every tile's base plane built as render/city.ts builds it (50 m cells, finer where the
 *  ground bends, 1.5 m on tiles shipped finer than 2 m), refined, triangles counted. npx tsx tools/wall-tess-cost.ts <city> [maxTiles] */
import { readPackage, readV2 } from './bake-files.ts'
import { Terrain } from '../src/city/terrain.ts'
import { WallGround, refineAtWalls, WT_TUNE, type Mesh3 } from '../src/city/wall-ground.ts'
if (process.env.DROP === '0') WT_TUNE.drop = false
if (process.env.WALLS === '0') WT_TUNE.walls = false
const city = process.argv[2], maxT = Number(process.argv[3] ?? 1e9)
const pkg = readPackage(city), { index, tiles } = readV2(city)
const TILE = index.tile ?? 200, T = new Terrain(pkg.terrain, TILE)
for (const t of tiles) { const [tx, tz] = t.key.split(',').map(Number); T.addTile(tx, tz, t.terrain) }
if (process.env.WG !== '0' && pkg.quayWalls?.length) T.walls = new WallGround(pkg.quayWalls)
const quad = (m: Mesh3, ps: [number, number][]): void => { const k = m.positions.length / 3; for (const [x, z] of ps) { m.positions.push(x, 0, z); m.normals.push(0, 1, 0); m.uvs.push(0, 0); m.colors.push(1, 1, 1, 1) } m.indices.push(k, k + 1, k + 2, k, k + 2, k + 3) }
function split(m: Mesh3, maxEdge: number): void { // render/city.ts subdivideBuilder
  const P = m.positions, I = m.indices.splice(0)
  const mid = (a: number, b: number): number => { const k = P.length / 3; for (let d = 0; d < 3; d++) { P.push((P[a * 3 + d] + P[b * 3 + d]) / 2); m.normals.push(0) } m.uvs.push(0, 0); m.colors.push(1, 1, 1, 1); return k }
  const len = (a: number, b: number) => Math.hypot(P[a * 3] - P[b * 3], P[a * 3 + 2] - P[b * 3 + 2])
  const go = (a: number, b: number, c: number, d: number): void => { const ab = len(a, b), bc = len(b, c), ca = len(c, a), mm = Math.max(ab, bc, ca); if (mm <= maxEdge || d > 10) { m.indices.push(a, b, c); return }
    if (mm === ab) { const q = mid(a, b); go(a, q, c, d + 1); go(q, b, c, d + 1) } else if (mm === bc) { const q = mid(b, c); go(b, q, a, d + 1); go(q, c, a, d + 1) } else { const q = mid(c, a); go(c, q, b, d + 1); go(q, a, b, d + 1) } }
  for (let i = 0; i < I.length; i += 3) go(I[i], I[i + 1], I[i + 2], 0)
}
let n0 = 0, n1 = 0, nt = 0, ms = 0
for (const t of tiles.slice(0, maxT)) {
  const [tx, tz] = t.key.split(',').map(Number), stepK = T.stepIn(t.key) ?? 20, m: Mesh3 = { positions: [], normals: [], uvs: [], colors: [], indices: [] }, N = 4, W = TILE / N
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const x0 = tx * TILE + c * W, z0 = tz * TILE + r * W, h = (x: number, z: number) => T.rawHeightAt(x, z)
    const c00 = h(x0, z0), c10 = h(x0 + W, z0), c01 = h(x0, z0 + W), c11 = h(x0 + W, z0 + W)
    let err = 0; for (const [u, v] of [[0.5, 0.5], [0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75], [0.5, 0], [0, 0.5], [1, 0.5], [0.5, 1]]) err = Math.max(err, Math.abs(h(x0 + u * W, z0 + v * W) - (c00 * (1 - u) * (1 - v) + c10 * u * (1 - v) + c01 * (1 - u) * v + c11 * u * v)))
    const sub = err > 2.5 ? 8 : err > 0.8 ? 4 : 1, w = W / sub
    for (let j = 0; j < sub; j++) for (let i = 0; i < sub; i++) { const x = x0 + i * w, z = z0 + j * w; quad(m, [[x, z], [x + w, z], [x + w, z + w], [x, z + w]]) }
  }
  if (stepK < 2) split(m, 1.5)
  const a = m.indices.length / 3, t0 = performance.now(); refineAtWalls(m, T); ms += performance.now() - t0
  n0 += a; n1 += m.indices.length / 3; nt++
}
console.log(`${city}: ${nt} tiles, base plane ${n0} → ${n1} triangles (+${((n1 / n0 - 1) * 100).toFixed(1)} %, +${Math.round((n1 - n0) / nt)} a tile), refine ${Math.round(ms / nt)} ms a tile`)
