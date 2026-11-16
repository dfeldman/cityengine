/**
 * A top-down diagnostic of a baked city's levels (docs/SEINE-MULTILEVEL.md, 2026-11-15):
 *   background = shipped ground − IGN lidar MNT (blue: ground under the lidar, red: over it, white ±0.5 m; grey hatch = water/no MNT)
 *   ways       = how each segment sits on the ground it is draped on:
 *                black at grade (|way − ground| < LM_TOL), orange RAISED (not a bridge), magenta BURIED (not a tunnel/cut),
 *                blue bridge deck, green tunnel/cut, red outline = `ramp` flag, cyan = rails
 *   npx tsx tools/level-map.ts <city> <lat> <lon> [R=120] [px=600] [out.png]
 *   (GROUND=shipped|mnt|diff, default diff; ABS=1 colours the ground by absolute height instead)
 */
import { writeFileSync } from 'node:fs'
import { PNG } from 'pngjs'
import { readPackage, readV2 } from './bake-files.ts'
import { Terrain } from '../src/city/terrain.ts'
import { unpackPoints } from '../src/city/package.ts'
import { Projection } from '../src/city/geo.ts'
import { ignLidar } from './ign-lidar.ts'

const LM_TOL = 0.7
const [city, la, lo, Rs, pxs, outArg] = process.argv.slice(2)
const lat = Number(la), lon = Number(lo), R = Number(Rs ?? 120), PX = Number(pxs ?? 600)
const out = outArg ?? `/tmp/level-map-${city}.png`
const pkg = readPackage(city), v2 = readV2(city), terrain = new Terrain(pkg.terrain)
for (const t of v2.tiles) { const [tx, tz] = t.key.split(',').map(Number); terrain.addTile(tx, tz, t.terrain) }
const proj = new Projection(v2.index.origin), c = proj.toLocal({ lat, lon })
const datum = (v2.index as unknown as { datumMsl?: number }).datumMsl ?? 32.94
const d = (R / 111320) * 1.3
const mnt = await ignLidar({ south: lat - d, north: lat + d, west: lon - d * 1.5, east: lon + d * 1.5 }, 1024)
const M = (x: number, z: number): number => { const q = proj.toLatLon({ x, z }), v = mnt.at(q.lat, q.lon); return v === null ? NaN : v - datum }
const png = new PNG({ width: PX, height: PX }), s = (2 * R) / PX
const toPx = (x: number, z: number): [number, number] => [(x - (c.x - R)) / s, ((c.z + R) - z) / s]
const set = (i: number, j: number, r: number, g: number, b: number): void => {
  if (i < 0 || j < 0 || i >= PX || j >= PX) return
  const k = (j * PX + i) * 4; png.data[k] = r; png.data[k + 1] = g; png.data[k + 2] = b; png.data[k + 3] = 255
}
const mode = process.env.GROUND ?? 'diff', ABS = process.env.ABS === '1'
let lo2 = Infinity, hi2 = -Infinity
if (ABS) for (let j = 0; j < PX; j += 4) for (let i = 0; i < PX; i += 4) { const h = terrain.rawHeightAt(c.x - R + i * s, c.z + R - j * s); lo2 = Math.min(lo2, h); hi2 = Math.max(hi2, h) }
for (let j = 0; j < PX; j++) for (let i = 0; i < PX; i++) {
  const x = c.x - R + (i + 0.5) * s, z = c.z + R - (j + 0.5) * s
  const g = terrain.rawHeightAt(x, z), m = M(x, z)
  if (ABS) { const t = (g - lo2) / Math.max(1, hi2 - lo2); set(i, j, 40 + 200 * t, 40 + 200 * t, 60 + 180 * t); continue }
  if (!Number.isFinite(m) || m < -5.2) { const hatch = (i + j) % 8 < 2; set(i, j, hatch ? 150 : 200, hatch ? 150 : 205, hatch ? 160 : 215); continue }
  const v = mode === 'mnt' ? 0 : mode === 'shipped' ? 0 : g - m
  const t = Math.max(-1, Math.min(1, v / 4))
  if (Math.abs(v) < 0.5) set(i, j, 245, 245, 245)
  else if (t > 0) set(i, j, 255, 245 - 200 * t, 245 - 200 * t)
  else set(i, j, 245 + 200 * t, 245 + 200 * t, 255)
}
const line = (x0: number, z0: number, x1: number, z1: number, col: [number, number, number], w: number): void => {
  const [a, b] = toPx(x0, z0), [e, f] = toPx(x1, z1), n = Math.ceil(Math.hypot(e - a, f - b)) + 1
  for (let k = 0; k <= n; k++) {
    const u = a + ((e - a) * k) / n, v = b + ((f - b) * k) / n
    for (let di = -w; di <= w; di++) for (let dj = -w; dj <= w; dj++) if (di * di + dj * dj <= w * w) set(Math.round(u + di), Math.round(v + dj), ...col)
  }
}
const W = Math.max(1, Math.round(1.2 / s))
const counts: Record<string, number> = {}
for (const e of pkg.edges) {
  if (!e.heights) continue
  const p = unpackPoints(e.points)
  if (!p.some((q) => Math.abs(q.x - c.x) < R + 20 && Math.abs(q.z - c.z) < R + 20)) continue
  for (let i = 1; i < p.length; i++) {
    const L = Math.hypot(p[i].x - p[i - 1].x, p[i].z - p[i - 1].z), n = Math.max(1, Math.ceil(L / 2))
    for (let k = 0; k < n; k++) {
      const t0 = k / n, t1 = (k + 1) / n, tm = (t0 + t1) / 2
      const x = p[i - 1].x + (p[i].x - p[i - 1].x) * tm, z = p[i - 1].z + (p[i].z - p[i - 1].z) * tm
      const h: number = e.heights[i - 1] + (e.heights[i] - e.heights[i - 1]) * tm, g = terrain.rawHeightAt(x, z)
      const cls = e.bridge ? 'deck' : e.tunnel || e.cut || e.bore ? 'tunnel' : h - g > LM_TOL ? 'raised' : g - h > LM_TOL ? 'buried' : 'grade'
      counts[cls] = (counts[cls] ?? 0) + 1
      const col: [number, number, number] = cls === 'deck' ? [30, 80, 230] : cls === 'tunnel' ? [20, 160, 60] : cls === 'raised' ? [255, 140, 0] : cls === 'buried' ? [220, 0, 220] : [20, 20, 20]
      const xa = p[i - 1].x + (p[i].x - p[i - 1].x) * t0, za = p[i - 1].z + (p[i].z - p[i - 1].z) * t0
      const xb = p[i - 1].x + (p[i].x - p[i - 1].x) * t1, zb = p[i - 1].z + (p[i].z - p[i - 1].z) * t1
      if (e.ramp) line(xa, za, xb, zb, [255, 0, 0], W + 1)
      line(xa, za, xb, zb, col, e.foot ? Math.max(0, W - 1) : W)
    }
  }
}
for (const r of pkg.rails ?? []) for (let i = 2; i < r.points.length; i += 2) line(r.points[i - 2], r.points[i - 1], r.points[i], r.points[i + 1], [0, 200, 220], 0)
// a 50 m scale bar, north up
line(c.x - R + 10, c.z - R + 10, c.x - R + 60, c.z - R + 10, [0, 0, 0], 1)
writeFileSync(out, PNG.sync.write(png))
console.log(`${out}: ${PX}px over ${2 * R} m (${s.toFixed(2)} m/px); segments (2 m) ${JSON.stringify(counts)}`)
