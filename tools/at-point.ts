/** What the package puts near a local point (no browser): ways, quay walls, bridge outlines, ground. npx tsx tools/at-point.ts <city> x,z [R=8] */
import { readPackage, readV2 } from './bake-files.ts'
import { Terrain } from '../src/city/terrain.ts'
import { unpackPoints } from '../src/city/package.ts'
const [city, xz, Rs] = process.argv.slice(2), [x, z] = xz.split(',').map(Number), R = Number(Rs ?? 8)
const pkg = readPackage(city), terrain = new Terrain(pkg.terrain)
for (const t of readV2(city).tiles) { const [tx, tz] = t.key.split(',').map(Number); terrain.addTile(tx, tz, t.terrain) }
const sd = (ax: number, az: number, bx: number, bz: number) => { const dx = bx - ax, dz = bz - az, l = dx * dx + dz * dz || 1e-9, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l)); return { d: Math.hypot(ax + dx * t - x, az + dz * t - z), t } }
console.log(`ground ${terrain.rawHeightAt(x, z).toFixed(2)}`)
for (const e of pkg.edges) { const p = unpackPoints(e.points); let b = { d: R, i: -1, t: 0 }; for (let i = 1; i < p.length; i++) { const q = sd(p[i - 1].x, p[i - 1].z, p[i].x, p[i].z); if (q.d < b.d) b = { d: q.d, i, t: q.t } }
  if (b.i > 0) { const h = e.heights ? e.heights[b.i - 1] + (e.heights[b.i] - e.heights[b.i - 1]) * b.t : NaN; console.log(`edge ${e.id} ${e.kind} ${e.name ?? ''} ${e.bridge ? 'B' : ''}${e.tunnel ? 'T' : ''}${e.cut ? 'C' : ''}${e.trench ? 'Tr' : ''}${e.ramp ? 'R' : ''}${e.lid ? 'Li' : ''}${e.bore ? 'O' : ''} L${e.layer ?? 0} w${e.width} ${b.d.toFixed(1)}m h ${h.toFixed(2)}`) } }
for (const q of pkg.quayWalls ?? []) { const s = sd(q.ax, q.az, q.bx, q.bz); if (s.d < R) console.log(`wall ${s.d.toFixed(1)}m top ${q.top?.toFixed?.(2)} low ${q.low?.toFixed?.(2)} ${JSON.stringify(q).slice(0, 160)}`) }
for (const b of pkg.bridges ?? []) { const p = unpackPoints(b.ring); let d = Infinity; for (let i = 0; i < p.length; i++) { const j = (i + 1) % p.length; d = Math.min(d, sd(p[i].x, p[i].z, p[j].x, p[j].z).d) } if (d < R * 3) console.log(`bridge ${b.id} ${b.name ?? ''} ${b.lid ? 'LID y ' + b.lid.y : ''} edge ${d.toFixed(1)}m`) }
