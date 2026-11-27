/** Ways near a point that run under (or float over) the shipped ground: buried/floating runs, sampled every 1 m.
 *  npx tsx tools/zone-way-audit.ts <city> x,z [R=250] [buried=0.4] [float=1.2] */
import { readPackage, readV2 } from './bake-files.ts'
import { Terrain } from '../src/city/terrain.ts'
import { unpackPoints } from '../src/city/package.ts'
const [city, xz, Rs, Bs, Fs] = process.argv.slice(2), [cx, cz] = xz.split(',').map(Number)
const R = Number(Rs ?? 250), BUR = Number(Bs ?? 0.4), FLT = Number(Fs ?? 1.2)
const pkg = readPackage(city), terrain = new Terrain(pkg.terrain)
for (const t of readV2(city).tiles) { const [tx, tz] = t.key.split(',').map(Number); terrain.addTile(tx, tz, t.terrain) }
for (const e of pkg.edges as any[]) {
  const under = process.env.UNDER === "1"; if (!e.heights || e.bridge) continue
  if (under !== !!(e.tunnel || e.cut || e.trench || e.lid || e.bore || (e.layer ?? 0) < 0)) continue
  const p = unpackPoints(e.points)
  if (!p.some((q) => Math.hypot(q.x - cx, q.z - cz) < R)) continue
  const runs: string[] = []
  let cur: { k: string; s0: number; s1: number; worst: number; x: number; z: number } | null = null, s = 0
  for (let i = 1; i < p.length; i++) {
    const L = Math.hypot(p[i].x - p[i - 1].x, p[i].z - p[i - 1].z), n = Math.max(1, Math.ceil(L))
    for (let j = 0; j < n; j++) {
      const t = j / n, x = p[i - 1].x + (p[i].x - p[i - 1].x) * t, z = p[i - 1].z + (p[i].z - p[i - 1].z) * t
      const h = e.heights[i - 1] + (e.heights[i] - e.heights[i - 1]) * t, d = h - terrain.rawHeightAt(x, z)
      const k = d < -BUR ? 'BURIED' : d > FLT ? 'FLOAT' : ''
      const ss = s + L * t
      if (k && cur && cur.k === k) { cur.s1 = ss; if (Math.abs(d) > Math.abs(cur.worst)) { cur.worst = d; cur.x = x; cur.z = z } }
      else { if (cur && cur.s1 - cur.s0 >= 1) runs.push(`${cur.k} s${cur.s0.toFixed(0)}-${cur.s1.toFixed(0)} worst ${cur.worst.toFixed(2)} @${cur.x.toFixed(0)},${cur.z.toFixed(0)}`); cur = k ? { k, s0: ss, s1: ss, worst: d, x, z } : null }
    }
    s += L
  }
  if (cur && cur.s1 - cur.s0 >= 1) runs.push(`${cur.k} s${cur.s0.toFixed(0)}-${cur.s1.toFixed(0)} worst ${cur.worst.toFixed(2)} @${cur.x.toFixed(0)},${cur.z.toFixed(0)}`)
  if (runs.length) console.log(`${e.id} ${e.kind} ${e.name ?? ''} ${e.ramp ? 'R' : ''} L${e.layer ?? 0}${e.tunnel ? "T" : ""}${e.cut ? "C" : ""}${e.trench ? "Tr" : ""}${e.lid ? "Li" : ""} len ${s.toFixed(0)}: ${runs.join('; ')}`)
}
