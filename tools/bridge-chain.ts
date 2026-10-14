/**
 * THE WAYS HANGING OFF A BRIDGE: from the ways on a model's deck, outward along every connected freeway, ramp and
 * raised way, in chain order — what each is flagged, where it runs in the model's frame, the heights the bake gave
 * it and the ground under it. What the approach regrading (src/city/bridge-decks.ts) has to work with.
 *
 *   npx vite-node tools/bridge-chain.ts -- <procedural> [--reach=1500] [city=san-francisco]
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Projection } from '../src/city/geo.ts'
import { unpackPoints, type PackedEdge } from '../src/city/package.ts'
import { placement, toModel } from '../src/city/bridge-decks.ts'
import { Terrain } from '../src/city/terrain.ts'
import { readPackage } from './bake-files.ts'

const args = process.argv.slice(2).filter((a) => !a.startsWith('--') )
const which = args[0]
const city = args[1] ?? 'san-francisco'
const num = (k: string, d: number): number => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? Number(a.split('=')[1]) : d }
const reach = num('reach', 1500)
const root = resolve(import.meta.dirname, '..', 'public')
// the ways from the bake-private package (tools/bake-files.ts), checked fresh
const pkg = readPackage(city)
const entry = (JSON.parse(readFileSync(resolve(root, 'landmarks', city, 'bridges.json'), 'utf8')) as { procedural: string; lat: number; lon: number; rotateDeg?: number; baseY?: number }[])
  .find((e) => e.procedural === which) ?? { procedural: which, lat: num('lat', 0), lon: num('lon', 0), rotateDeg: num('rot', 0), baseY: 0 }
const p = placement(entry, new Projection(pkg.origin))
const terrain = new Terrain(pkg.terrain)
const z0 = num('from', -1e9)
const z1 = num('to', 1e9)
const FREEWAY = new Set(['motorway', 'motorway_link', 'trunk', 'trunk_link', 'busway'])
const chainable = (e: PackedEdge): boolean => !!e.bridge || !!e.ramp || FREEWAY.has(e.kind ?? '') || (e.layer ?? 0) > 0
const at = new Map<number, PackedEdge[]>()
for (const e of pkg.edges) for (const n of [e.a, e.b]) { let l = at.get(n); if (!l) at.set(n, l = []); l.push(e) }
const len = (e: PackedEdge): number => { const q = unpackPoints(e.points); let s = 0; for (let i = 1; i < q.length; i++) s += Math.hypot(q[i].x - q[i - 1].x, q[i].z - q[i - 1].z); return s }
const seeds = pkg.edges.filter((e) => chainable(e) && unpackPoints(e.points).some((q) => { const m = toModel(p, q); return m.z >= z0 && m.z <= z1 && Math.abs(m.x) < num('half', 20) }))
const depth = new Map<number, number>(seeds.map((e) => [e.id, 0]))
const queue = [...seeds]
const order: PackedEdge[] = []
while (queue.length) {
  queue.sort((a, b) => depth.get(a.id)! - depth.get(b.id)!)
  const e = queue.shift()!
  order.push(e)
  const d = depth.get(e.id)! + (seeds.includes(e) ? 0 : len(e))
  if (d > reach) continue
  for (const n of [e.a, e.b]) for (const x of at.get(n) ?? []) if (chainable(x) && !depth.has(x.id)) { depth.set(x.id, d); queue.push(x) }
}
console.log(`${seeds.length} ways on the deck, ${order.length} in the chain within ${reach} m`)
for (const e of order) {
  const q = unpackPoints(e.points)
  const h = e.heights ?? q.map(() => NaN)
  const m0 = toModel(p, q[0])
  const m1 = toModel(p, q[q.length - 1])
  const g0 = terrain.rawHeightAt(q[0].x, q[0].z)
  const g1 = terrain.rawHeightAt(q[q.length - 1].x, q[q.length - 1].z)
  // what else is at each end: G a way on the ground (a touchdown), - nothing (a dead end)
  const end = (n: number): string => { const o = (at.get(n) ?? []).filter((x) => x !== e); return o.length === 0 ? '-' : o.some((x) => !chainable(x)) ? 'G' : String(o.length) }
  const mid = Math.floor(q.length / 2)
  console.log(`${String(Math.round(depth.get(e.id)!)).padStart(5)} ${String(e.id).padStart(6)} ${(e.kind ?? '').padEnd(13)} L${e.layer ?? 0} ${e.bridge ? 'br' : '  '}${e.ramp ? ' rp' : '   '}${e.tunnel ? ' tu' : '   '}${e.oneway ? ' 1w' : '   '} ${String(Math.round(len(e))).padStart(4)}m `
    + `z ${m0.z.toFixed(0).padStart(6)}→${m1.z.toFixed(0).padStart(6)} x ${m0.x.toFixed(0).padStart(5)}→${m1.x.toFixed(0).padStart(5)} `
    + `h ${h[0].toFixed(1).padStart(6)} ${h[mid].toFixed(1).padStart(6)} ${h[h.length - 1].toFixed(1).padStart(6)} ground ${g0.toFixed(1).padStart(6)} ${terrain.rawHeightAt(q[mid].x, q[mid].z).toFixed(1).padStart(6)} ${g1.toFixed(1).padStart(6)} `
    + `ends ${end(e.a)}${end(e.b)} n${e.a}→${e.b} ${(e.name ?? '').slice(0, 24)}`)
}
