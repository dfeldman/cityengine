/*
 * LEVEL PLANS (2026-11-07, pilot: Pont National's right bank). Where the ground the bake guesses is wrong in tiers — a quai under a
 * bridgehead's embankment, a lower quai under its wall — a region's `levelPlans` AUTHORS the levels instead: a few named flat
 * `surfaces` (a lat/lon ring and a `y` on the bake's datum, ≈ IGN − 32.8 by Pont National) and graded `ramps`.
 *
 *   surface { name, y, ring, ways?: name regex, kinds?: kind regex (unnamed ways), fade?: m (12), bridges?: bool,
 *             ground?: true | ring (runtime `level` terrain tweak, city/terrain-tweaks.ts levelPlanTweaks), groundFade?: m (4) }
 *     Every matching way's points INSIDE the ring take `y` — a hard edge: no survey/IDW blend. Points of matching ways outside it are
 *     eased back to their own height over `fade` m (a road leaving the tier along its length must not step), except where they lie
 *     in another surface of the same plan (a different tier: the edge between them is a wall). Bridges never, unless `bridges`.
 *   ramp { name, ways?, kinds?, from: [lat, lon, y?], to: [lat, lon, y?] }
 *     The shortest path along the matching ways (bridges included: a slip road is one) between the way points nearest `from` and
 *     `to`, graded linearly by distance along it. An end with no y keeps the height the way has there — after the surfaces and the
 *     ramps before it, so chained ramps meet at one height (a slip road
 *     inherits the quai's height where it lands, not its own). Shared nodes of every way on the path move together.
 *
 * Run right after the survey pins, last in the full bake and again by `bake --rides` (LEVEL_PLANS=0 off). Only the ways the regexes
 * name inside the configured rings and paths move, so other bridges are untouched.
 */
import type { PackedEdge } from '../src/city/package.ts'
import type { Region } from '../src/city/region.ts'

type Plan = NonNullable<Region['levelPlans']>[number]
type LL = (lat: number, lon: number) => { x: number; z: number }

const inRing = (r: number[], x: number, z: number): boolean => {
  let c = false
  for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2)
    if ((r[i + 1] > z) !== (r[j + 1] > z) && x < ((r[j] - r[i]) * (z - r[i + 1])) / (r[j + 1] - r[i + 1]) + r[i]) c = !c
  return c
}
const distToRing = (r: number[], x: number, z: number): number => {
  if (inRing(r, x, z)) return 0
  let d = Infinity
  for (let i = 0; i < r.length; i += 2) {
    const j = (i + 2) % r.length, dx = r[j] - r[i], dz = r[j + 1] - r[i + 1]
    const t = Math.max(0, Math.min(1, ((x - r[i]) * dx + (z - r[i + 1]) * dz) / (dx * dx + dz * dz || 1)))
    d = Math.min(d, Math.hypot(r[i] + dx * t - x, r[i + 1] + dz * t - z))
  }
  return d
}
const matcher = (ways?: string, kinds?: string) => {
  const rn = ways ? new RegExp(ways) : null, rk = kinds ? new RegExp(kinds) : null
  return (e: PackedEdge): boolean => !!((rn && rn.test(e.name ?? '')) || (rk && !e.name && rk.test(e.kind ?? '')))
}
const usable = (e: PackedEdge): boolean => !e.bikeRamp && !!e.heights && e.heights.length * 2 === e.points.length
const r2 = (v: number): number => Math.round(v * 100) / 100

export function applyLevelPlans(edges: PackedEdge[], plans: Plan[], toLocal: LL): { moved: Set<PackedEdge>; log: string[] } {
  const moved = new Set<PackedEdge>(), log: string[] = []
  for (const plan of plans) {
    // heights this plan has laid, by point (0.1 m): a ramp end with no y takes the one laid there first
    const laid = new Map<string, number>()
    const key = (x: number, z: number): string => `${Math.round(x * 10)},${Math.round(z * 10)}`
    const rings = (plan.surfaces ?? []).map((s) => s.ring.flatMap(([lat, lon]) => { const q = toLocal(lat, lon); return [q.x, q.z] }))
    ;(plan.surfaces ?? []).forEach((s, si) => {
      const ring = rings[si], FADE = s.fade ?? 12, hit = matcher(s.ways, s.kinds)
      let n = 0, inside = 0, eased = 0
      for (const e of edges) {
        if (!usable(e) || (e.bridge && !s.bridges) || !hit(e)) continue
        let any = false
        for (let i = 0; i < e.heights!.length; i++) {
          const x = e.points[2 * i], z = e.points[2 * i + 1], d = distToRing(ring, x, z)
          if (d >= FADE) continue
          if (d > 0 && rings.some((o, oi) => oi !== si && inRing(o, x, z))) continue
          const h = e.heights![i], y = d === 0 ? s.y : h + (s.y - h) * (1 - d / FADE)
          if (d === 0) inside++; else eased++
          if (Math.abs(y - h) > 0.01) { e.heights![i] = r2(y); any = true }
          laid.set(key(x, z), e.heights![i])
        }
        if (any) { n++; moved.add(e); if (!e.bridge) delete e.ramp }
      }
      log.push(`level plan ${plan.name}, ${s.name} at ${s.y}: ${n} ways moved, ${inside} points on it, ${eased} eased`)
    })
    for (const rp of plan.ramps ?? []) {
      const hit = matcher(rp.ways, rp.kinds)
      // the matching ways' vertices, joined where they share a point (0.1 m)
      const at = new Map<string, { x: number; z: number; refs: [PackedEdge, number][]; nb: Map<string, number> }>()
      for (const e of edges) {
        if (!usable(e) || !hit(e)) continue
        let prev: string | null = null
        for (let i = 0; i < e.heights!.length; i++) {
          const x = e.points[2 * i], z = e.points[2 * i + 1], k = key(x, z)
          const v = at.get(k) ?? at.set(k, { x, z, refs: [], nb: new Map() }).get(k)!
          v.refs.push([e, i])
          if (prev && prev !== k) { const p = at.get(prev)!, d = Math.hypot(p.x - x, p.z - z); p.nb.set(k, d); v.nb.set(prev, d) }
          prev = k
        }
      }
      const nearest = (lat: number, lon: number): string | null => {
        const q = toLocal(lat, lon); let best: string | null = null, bd = Infinity
        for (const [k, v] of at) { const d = Math.hypot(v.x - q.x, v.z - q.z); if (d < bd) { bd = d; best = k } }
        return bd <= (rp.snap ?? 25) ? best : null
      }
      const a = nearest(rp.from[0], rp.from[1]), b = nearest(rp.to[0], rp.to[1])
      if (!a || !b) { log.push(`level plan ${plan.name}, ramp ${rp.name}: no way within ${rp.snap ?? 25} m of its ${a ? 'to' : 'from'} end`); continue }
      // Dijkstra a → b (a few hundred vertices: a plain scan is fine)
      const dist = new Map<string, number>([[a, 0]]), back = new Map<string, string>(), done = new Set<string>()
      for (;;) {
        let u: string | null = null, du = Infinity
        for (const [k, d] of dist) if (!done.has(k) && d < du) { du = d; u = k }
        if (!u || u === b) break
        done.add(u)
        for (const [k, d] of at.get(u)!.nb) if (du + d < (dist.get(k) ?? Infinity)) { dist.set(k, du + d); back.set(k, u) }
      }
      if (!dist.has(b)) { log.push(`level plan ${plan.name}, ramp ${rp.name}: its ends are not joined along the ways it names`); continue }
      const path: string[] = [b]
      while (path[0] !== a) path.unshift(back.get(path[0])!)
      const L = dist.get(b)!, hOf = (k: string): number => { const [e, i] = at.get(k)!.refs[0]; return laid.get(k) ?? e.heights![i] }
      const y0 = rp.from[2] ?? hOf(a), y1 = rp.to[2] ?? hOf(b)
      let n = 0
      for (const k of path) {
        const y = r2(y0 + (y1 - y0) * (dist.get(k)! / (L || 1)))
        laid.set(k, y)
        for (const [e, i] of at.get(k)!.refs) if (Math.abs(e.heights![i] - y) > 0.01) { e.heights![i] = y; moved.add(e); n++ }
      }
      log.push(`level plan ${plan.name}, ramp ${rp.name}: ${Math.round(L)} m ${y0.toFixed(1)} → ${y1.toFixed(1)} (${((Math.abs(y1 - y0) / (L || 1)) * 100).toFixed(1)} %), ${n} points`)
    }
  }
  return { moved, log }
}
