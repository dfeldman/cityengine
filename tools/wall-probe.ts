/** Quay wall audit (deck-zone walls, parapet set): runs, gaps, kinks, and the shipped ground against each piece.
 *  npx tsx tools/wall-probe.ts <city> [lat,lon,R] — slot: ground just behind the face under the top; poke: ground over the top inside
 *  the stone; wedge: ground in front of the toe well over the foot. */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { readPackage, readV2, shippedDir } from './bake-files.ts'
import { Terrain } from '../src/city/terrain.ts'
import { Projection } from '../src/city/geo.ts'
import { WallGround } from '../src/city/wall-ground.ts'
const city = process.argv[2], spot = process.argv[3]?.split(',').map(Number)
const dir = shippedDir(city), index = JSON.parse(readFileSync(resolve(dir, 'index.json'), 'utf8'))
const pkg = readPackage(city), T = new Terrain(pkg.terrain, index.tile ?? 200)
for (const t of readV2(city).tiles) { const [tx, tz] = t.key.split(',').map(Number); T.addTile(tx, tz, t.terrain) }
if (process.env.WG !== '0') T.walls = new WallGround(pkg.quayWalls ?? [])
const CITYW = process.env.CITYW === '1'
let ws = (pkg.quayWalls ?? []).filter((w) => (w.parapet !== undefined) !== CITYW)
if (spot) { const c = new Projection(index.origin).toLocal({ lat: spot[0], lon: spot[1] }); ws = ws.filter((w) => Math.hypot((w.ax + w.bx) / 2 - c.x, (w.az + w.bz) / 2 - c.z) < spot[2]) }
const TOE = CITYW ? 0 : 1.1, TH = 0.6
let slot = 0, poke = 0, wedge = 0, kinks = 0, runs = 0, gaps = 0, short = 0, jump = 0, len = 0
const st: Record<string, number> = {}
for (const w of ws) {
  const L = Math.hypot(w.bx - w.ax, w.bz - w.az); len += L
  const ux = (w.bx - w.ax) / L, uz = (w.bz - w.az) / L, nx = uz, nz = -ux, mx = (w.ax + w.bx) / 2, mz = (w.az + w.bz) / 2
  const g = (s: number, t = 0) => T.rawHeightAt(mx + nx * s + ux * t * L / 2, mz + nz * s + uz * t * L / 2)
  if ([-1, 0, 1].some((t) => [TH + 0.05, TH + 0.4].some((s) => g(s, t) < w.top - 0.3))) slot++
  if ([-1, 0, 1].some((t) => [-TOE + 0.1, 0, TH - 0.1].some((s) => g(s, t) > w.top + 0.1))) poke++
  if ([-1, 0, 1].some((t) => [-TOE - 0.05, -TOE - 0.4].some((s) => g(s, t) > w.low + 0.5))) wedge++
  st[T.stepIn(`${Math.floor(mx / 200)},${Math.floor(mz / 200)}`) ?? 'coarse'] = (st[T.stepIn(`${Math.floor(mx / 200)},${Math.floor(mz / 200)}`) ?? 'coarse'] ?? 0) + 1
}
// runs: chain pieces end-to-start within 0.3 m (either orientation)
const key = (x: number, z: number) => `${Math.round(x * 2)},${Math.round(z * 2)}`
const ends = new Map<string, number[]>()
ws.forEach((w, i) => { for (const k of [key(w.ax, w.az), key(w.bx, w.bz)]) (ends.get(k) ?? ends.set(k, []).get(k)!).push(i) })
const deg = (w: typeof ws[number]) => Math.atan2(w.bz - w.az, w.bx - w.ax)
const runLen: number[] = [], kh: Record<string, number> = {}
const seen = new Set<number>()
for (let i = 0; i < ws.length; i++) {
  if (seen.has(i)) continue
  runs++; let n = 0; const q = [i]; seen.add(i)
  while (q.length) { const j = q.pop()!; n++; const w = ws[j]
    for (const k of [key(w.ax, w.az), key(w.bx, w.bz)]) for (const o of ends.get(k) ?? []) if (!seen.has(o)) {
      seen.add(o); q.push(o); const v = ws[o]
      let d = Math.abs(deg(v) - deg(w)) % (2 * Math.PI); d = Math.min(d, 2 * Math.PI - d); d = Math.min(d, Math.PI - d)
      if (d > 8 * Math.PI / 180) { kinks++; const b = d > 50 * Math.PI / 180 ? '>50' : d > 20 * Math.PI / 180 ? '20-50' : '8-20'; kh[b] = (kh[b] ?? 0) + 1 }
      if (Math.abs(v.top - w.top) > 0.3 || Math.abs(v.low - w.low) > 0.3) jump++
    } }
  runLen.push(n)
  if (process.env.SHORT && n <= 3 && runLen.filter((m) => m <= 3).length <= +process.env.SHORT) { const w = ws[i], g = new Projection(index.origin).toLatLon({ x: w.ax, z: w.az }); console.log(`short run ${n} at ${g.lat.toFixed(6)},${g.lon.toFixed(6)} top ${w.top} low ${w.low} len ${Math.hypot(w.bx - w.ax, w.bz - w.az).toFixed(1)}`) }
}
short = runLen.filter((n) => n <= 3).length
// gaps: a run end within 8 m of another run's end along the same direction
const endsOnly: { x: number; z: number; r: number }[] = []
{ const runOf = new Map<number, number>(); let r = 0; const s2 = new Set<number>()
  for (let i = 0; i < ws.length; i++) { if (s2.has(i)) continue; const q = [i]; s2.add(i); while (q.length) { const j = q.pop()!; runOf.set(j, r); const w = ws[j]; for (const k of [key(w.ax, w.az), key(w.bx, w.bz)]) for (const o of ends.get(k) ?? []) if (!s2.has(o)) { s2.add(o); q.push(o) } } r++ }
  for (const [k, l] of ends) if (l.length === 1) { const w = ws[l[0]]; const [x, z] = key(w.ax, w.az) === k ? [w.ax, w.az] : [w.bx, w.bz]; endsOnly.push({ x, z, r: runOf.get(l[0])! }) }
  for (let i = 0; i < endsOnly.length; i++) for (let j = i + 1; j < endsOnly.length; j++) if (endsOnly[i].r !== endsOnly[j].r && Math.hypot(endsOnly[i].x - endsOnly[j].x, endsOnly[i].z - endsOnly[j].z) < 8) gaps++
}
console.log(`${city}${spot ? ' @' + spot.join(',') : ''}: ${ws.length} pieces ${Math.round(len)} m; runs ${runs} (${short} of ≤3 pieces), gaps<8m ${gaps}, kinks>8° ${kinks} ${JSON.stringify(kh)}, top/low jumps>0.3 ${jump}; slot ${slot} poke ${poke} wedge ${wedge}; tiles by step ${JSON.stringify(st)}`)
const sel = process.env.SLOT ? ws.filter((w) => { const L = Math.hypot(w.bx - w.ax, w.bz - w.az); return T.rawHeightAt((w.ax + w.bx) / 2 + (w.bz - w.az) / L * (TH + 0.4), (w.az + w.bz) / 2 - (w.bx - w.ax) / L * (TH + 0.4)) < w.top - 0.3 }) : process.env.WEDGE ? ws.filter((w) => { const L = Math.hypot(w.bx - w.ax, w.bz - w.az); return T.rawHeightAt((w.ax + w.bx) / 2 + (w.bz - w.az) / L * (-TOE - 0.4), (w.az + w.bz) / 2 - (w.bx - w.ax) / L * (-TOE - 0.4)) > w.low + 0.5 }) : ws
if (process.env.PROFILE) for (const w of sel.filter((_, i) => i % Math.max(1, Math.floor(sel.length / +process.env.PROFILE!)) === 0)) {
  const L = Math.hypot(w.bx - w.ax, w.bz - w.az), ux = (w.bx - w.ax) / L, uz = (w.bz - w.az) / L, mx = (w.ax + w.bx) / 2, mz = (w.az + w.bz) / 2
  const pr = [-6, -4, -3, -2, -1.5, -1, 0, 1, 2, 3].map((s) => T.rawHeightAt(mx + uz * s, mz - ux * s).toFixed(1)).join(' ')
  console.log(`(${mx.toFixed(0)},${mz.toFixed(0)}) low ${w.low} top ${w.top} | s=-3..3: ${pr}`)
}
if (process.env.WATER) {
  const { unpackPoints, wholeWater } = await import('../src/city/package.ts')
  const rings = wholeWater(pkg).map((a) => unpackPoints(a.ring))
  console.log(`water rings ${rings.length}, points ${rings.reduce((s, r) => s + r.length, 0)}`)
  const inR = (r: { x: number; z: number }[], x: number, z: number) => { let o = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i].z > z) !== (r[j].z > z) && x < (r[j].x - r[i].x) * (z - r[i].z) / (r[j].z - r[i].z) + r[i].x) o = !o; return o }
  const wet = (x: number, z: number) => rings.some((r) => inR(r, x, z))
  let n = 0, at2 = 0, atToe = 0, under = 0
  for (const w of ws) { if (w.low > -5.5) continue; n++; const L = Math.hypot(w.bx - w.ax, w.bz - w.az), mx = (w.ax + w.bx) / 2, mz = (w.az + w.bz) / 2, P = (s: number) => [mx + (w.bz - w.az) / L * s, mz - (w.bx - w.ax) / L * s] as const
    if (wet(...P(-TOE - 2))) at2++; if (wet(...P(-TOE - 0.2))) atToe++; if (wet(...P(TH + 1))) under++ }
  console.log(`river walls ${n}: water 2 m out from the toe ${at2}, at the toe ${atToe}, water polygon on past the stone ${under}`)
}
if (process.env.ROADGAP) {
  const { unpackPoints } = await import('../src/city/package.ts')
  const segs: number[] = []
  for (const e of pkg.edges) { if (e.tunnel || e.bridge) continue; const p = unpackPoints(e.points); for (let i = 1; i < p.length; i++) segs.push(p[i - 1].x, p[i - 1].z, p[i].x, p[i].z, e.width / 2 + (e.walk ?? 0)) }
  const roadNear = (x: number, z: number, r: number) => { for (let i = 0; i < segs.length; i += 5) { const ax = segs[i], az = segs[i + 1], dx = segs[i + 2] - ax, dz = segs[i + 3] - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1))); if (Math.hypot(ax + dx * t - x, az + dz * t - z) < segs[i + 4] + r) return true } return false }
  const pr = new Projection(index.origin)
  let nr = 0, gr = 0, nn = 0, gn = 0; const ex: string[] = []
  for (const w of ws) {
    const L = Math.hypot(w.bx - w.ax, w.bz - w.az), nx = (w.bz - w.az) / L, nz = -(w.bx - w.ax) / L, mx = (w.ax + w.bx) / 2, mz = (w.az + w.bz) / 2
    const road = roadNear(mx + nx * 3, mz + nz * 3, 3)
    let lo = Infinity; for (const s of [0.7, 1, 1.5, 2, 2.5, 3]) lo = Math.min(lo, T.rawHeightAt(mx + nx * s, mz + nz * s))
    const gap = lo < w.top - 0.5
    if (road) { nr++; if (gap) { gr++; if (ex.length < 6) { const g = pr.toLatLon({ x: mx, z: mz }); ex.push(`${g.lat.toFixed(5)},${g.lon.toFixed(5)} top ${w.top} min-behind ${lo.toFixed(2)}`) } } } else { nn++; if (gap) gn++ }
  }
  console.log(`high side dips > 0.5 under the top within 3 m: road beside ${gr}/${nr}, no road ${gn}/${nn}\n  ${ex.join('\n  ')}`)
}
if (process.env.WATERCOVER) {
  const { unpackPoints, wholeWater } = await import('../src/city/package.ts')
  const ww = wholeWater(pkg), rings = ww.map((a) => unpackPoints(a.ring)), lv = ww.map((a) => (a.level ?? -6.04) + 0.03)
  const inR = (r: { x: number; z: number }[], x: number, z: number) => { let o = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i].z > z) !== (r[j].z > z) && x < (r[j].x - r[i].x) * (z - r[i].z) / (r[j].z - r[i].z) + r[i].x) o = !o; return o }
  const W = T.walls!
  let before = 0, after = 0, n = 0
  for (const w of ws) { const L = Math.hypot(w.bx - w.ax, w.bz - w.az), mx = (w.ax + w.bx) / 2, mz = (w.az + w.bz) / 2
    for (const s of [-1.3, -2, -3, -4, -5, -6]) { const x = mx + (w.bz - w.az) / L * s, z = mz - (w.bx - w.ax) / L * s
      const k = rings.findIndex((r) => inR(r, x, z)); if (k < 0) continue; n++; const h = T.rawHeightAt(x, z), y = lv[k]
      if (h > y + 0.3 && h <= y + 1.5) before++
      if (h > y + 0.3 && h <= y + (W.side(x, z, 4) !== 0 ? 0.25 : 1.5)) after++ } }
  console.log(`low-side samples in the water polygon ${n}: water sheet over dry ground (0.3 m+) before ${before}, after ${after}`)
}
