/**
 * Public stairways (SF_PLAN.md §10; user, 2026-09-22: "there are SO MANY public stairs… we need to have a way to
 * insert stairs"), drawn as stairs: every `highway=steps` edge, and the region's own (tools/bake.ts), as a flight of
 * concrete treads following the ground, the rise quantised to real risers so a steep slope comes out as steps and
 * not a ramp, with a low cheek wall and a handrail each side. A landing where the slope eases. Shared: any
 * city's stairways.
 *
 * A per-tile layer (render/city.ts `TileLayer`), clipped to the tile, in the landmark material so the concrete
 * has its texture.
 */
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import type { Scene } from '@babylonjs/core/scene'
import { MeshBuilder } from './buildings.ts'
import { strut, type Rgb } from './models.ts'
import { cartoonMaterial, surfaceTag } from './cartoon-material.ts'
import type { TileLayer } from './city.ts'
import type { Terrain } from '../city/terrain.ts'
import { unpackPoints } from '../city/package.ts'
import { stairway, type NamedStairway, type StairPoint } from './landmarks/stairway.ts'

const CONCRETE: Rgb = [0.68, 0.67, 0.64]
const NOSING: Rgb = [0.58, 0.57, 0.55]
const RAIL: Rgb = [0.2, 0.22, 0.2]
const TREAD = 0.32
const RISER = 0.17

/**
 * `named` is the region's table of stairways built as LANDMARKS (render/landmarks/stairway.ts), keyed by the
 * OSM name on the way — San Francisco's is `landmarks/sf/stairways.ts`, passed in by `game.ts` so this shared
 * layer never imports a city's own builders (feedback-region-files). Everything not in it gets the generic
 * treatment below, unchanged.
 */
/** a park's trail steps: packed earth, and the timber edging each step */
const TRAIL_EARTH: [number, number, number] = [0.34, 0.28, 0.2]
const TRAIL_TIMBER: [number, number, number] = [0.33, 0.24, 0.16]

/** a painted stairway's risers, bottom up (Ghirardelli Square's steps from Beach Street, owner's Street View 2026-10-06) */
const RAINBOW: Rgb[] = [[0.62, 0.16, 0.5], [0.85, 0.15, 0.15], [0.93, 0.45, 0.12], [0.95, 0.8, 0.15], [0.6, 0.8, 0.15], [0.15, 0.6, 0.3], [0.15, 0.7, 0.7], [0.15, 0.35, 0.85]]
const PAINTED_TREAD: Rgb = [0.5, 0.26, 0.2]

export function stairsLayer(scene: Scene, terrain: Terrain, named: Record<string, NamedStairway> = {}, drawnBy?: (x: number, z: number) => boolean,
                            painted: { x: number; z: number; radius: number }[] = []): TileLayer {
  const concrete = surfaceTag('concrete')
  return {
    name: 'stairs',
    range: 3,
    build(near, rect) {
      /*
       * Not underground (a tunnel, a layer below: the stairs down into a station), and ONE flight where OSM maps several
       * side by side — Powell Station's stairs and escalators are four `steps` ways a few metres apart, and drawn each
       * as its own flight with cheek walls and rails they made a bank of white blocks on Hallidie Plaza (owner,
       * 2026-10-03: "overlapping walkways that can't possibly look like that"). A flight whose middle lies within 4 m of
       * one already kept, running the same way, is the same stair.
       */
      const kept: { mx: number; mz: number; dx: number; dz: number }[] = []
      /*
       * …nor IN A BORE's width (2026-10-15, the Stockton Tunnel's north portal: OSM maps its stairwells as little loops of
       * steps, half of each at layer 0, right at the mouth — drawn, their treads hung inside the tube beside the road).
       */
      const bores = (near.around.edges ?? []).filter((r) => r.bore && !r.foot).map((r) => ({ half: r.width / 2 + Math.max(r.walk ?? 0, 0.6) + 1, pts: unpackPoints(r.points) }))
      const inBore = (q: { x: number; z: number }): boolean => bores.some((b) => {
        for (let i = 1; i < b.pts.length; i++) {
          const a = b.pts[i - 1], c = b.pts[i], dx = c.x - a.x, dz = c.z - a.z, l2 = dx * dx + dz * dz || 1e-9
          const t = ((q.x - a.x) * dx + (q.z - a.z) * dz) / l2
          if (t < -0.02 || t > 1.02) continue
          if (Math.hypot(a.x + dx * Math.max(0, Math.min(1, t)) - q.x, a.z + dz * Math.max(0, Math.min(1, t)) - q.z) < b.half) return true
        }
        return false
      })
      const flights = (near.tile.edges ?? []).filter((e) => e.kind === 'steps' && !e.tunnel && !((e.layer ?? 0) < 0))
        .filter((e) => !(bores.length && unpackPoints(e.points).some(inBore)))
        // (nor a flight a hand-built model draws itself: the stairs down into the open BART plazas, #248)
        .filter((e) => !drawnBy?.(e.points[Math.floor(e.points.length / 4) * 2], e.points[Math.floor(e.points.length / 4) * 2 + 1])).filter((e) => {
        const p = unpackPoints(e.points)
        if (p.length < 2) return false
        const a = p[0], b = p[p.length - 1]
        const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
        const f = { mx: (a.x + b.x) / 2, mz: (a.z + b.z) / 2, dx: (b.x - a.x) / L, dz: (b.z - a.z) / L }
        if (kept.some((k) => Math.hypot(k.mx - f.mx, k.mz - f.mz) < 4 && Math.abs(k.dx * f.dx + k.dz * f.dz) > 0.9)) return false
        kept.push(f)
        return true
      })
      if (flights.length === 0) return []
      const out = new MeshBuilder()
      const inRect = (x: number, z: number): boolean => x >= rect.x0 && x < rect.x1 && z >= rect.z0 && z < rect.z1
      // the carriageways round about: a flight must stop at their kerb (below)
      // (not one passing over or under: a flight beneath a ramp is not on it)
      const roads = (near.around.edges ?? []).filter((r) => !r.foot && r.kind !== 'steps' && (r.width ?? 0) > 0 && !r.tunnel && !r.bridge && !r.ramp && !r.layer)
        .map((r) => ({ half: r.width / 2, pts: unpackPoints(r.points) }))
      for (const e of flights) {
        const raw = unpackPoints(e.points)
        if (raw.length < 2) continue
        /*
         * STOP AT THE KERB (owner, 2026-09-29, the Macondray Lane steps at Taylor Street: "stairs extend into the
         * street, visually blocking it… we need to prevent this in our stairs renderer"). OSM ends a stairway on the
         * street's centre line, where the footway joins it, so the last half-street of the flight was built across
         * the carriageway. Each end is cut back to where it leaves every carriageway's corridor.
         */
        // (a NAMED landmark stairway is hand-built and decorated to its own ends: left as it is)
        const heights = raw.map((p, i) => e.heights?.[i] ?? terrain.heightAt(p.x, p.z))
        const cut = e.name && named[e.name] ? { pts: raw, ys: heights } : kerbTrim(raw, heights, roads)
        if (!cut) continue
        const pts = cut.pts
        /*
         * A NAMED landmark stairway. Built WHOLE, from the way's own polyline, and anchored on the tile its
         * midpoint falls in rather than clipped per tread: the flights, the cheek walls' stepped coping and
         * the decoration only make sense as one object, and a piece of a flight is worse than none. The ways
         * are short (the Lyon Street run is six of them over 140 m) and the layer's reach is three tiles, so
         * nothing is ever far enough outside its anchor tile to pop.
         */
        const spec = e.name ? named[e.name] : undefined
        if (spec) {
          const mid = pts[Math.floor(pts.length / 2)]
          if (!inRect(mid.x, mid.z)) continue
          /*
           * The heights are the RIDE EDGE'S OWN PROFILE where the bake gave it one, which is what the runner's
           * feet follow (BUGS.md #207) — the terrain grid is only the fallback for a city baked flat.
           */
          const line: StairPoint[] = pts.map((p, i) => ({ x: p.x, z: p.z, y: cut.ys[i] }))
          const res = stairway(out, line, spec.width ?? Math.max(1.6, e.width || 2.4), spec.style)
          spec.decorate?.(out, res)
          continue
        }
        const half = Math.max(0.8, Math.min(3, (e.width || 2.4) / 2))
        /*
         * …and BESIDE THE KERB, not over it (owner, 2026-10-16, Lombard's crooked block: "because of the path shape a car
         * is actually on the stairs"). OSM draws a sidewalk stair 2 m from the centre of a 4 m street at the hairpins, so
         * the flight's middle lay across the carriageway the trimmed ends had left. Every point is kept a stair's
         * half-width and a kerb outside each carriageway.
         */
        keepOffRoads(pts, roads, half)
        // resample the polyline at the tread's pitch
        const at: { x: number; z: number; dx: number; dz: number }[] = []
        for (let i = 1; i < pts.length; i++) {
          const a = pts[i - 1]
          const b = pts[i]
          const L = Math.hypot(b.x - a.x, b.z - a.z)
          if (L < 0.05) continue
          const n = Math.max(1, Math.round(L / TREAD))
          for (let k = 0; k < n; k++) at.push({ x: a.x + ((b.x - a.x) * k) / n, z: a.z + ((b.z - a.z) * k) / n, dx: (b.x - a.x) / L, dz: (b.z - a.z) / L })
        }
        const last = pts[pts.length - 1]
        at.push({ x: last.x, z: last.z, dx: at[at.length - 1]?.dx ?? 1, dz: at[at.length - 1]?.dz ?? 0 })
        if (at.length < 2) continue
        // the ground under each tread, quantised to risers from the lower end, so the treads step
        // (a park's steps on the hill as it is: the park ground is draped raw, and on the levelled corridor height the
        //  flights stood ~2 m clear of Strawberry Hill's slopes, 2026-10-04)
        const park = !!e.park
        // a stairway whose risers are painted in bands of colour (Region `rainbowStairs`), on brick-red treads
        const mid0 = at[Math.floor(at.length / 2)]
        const rainbow = painted.some((r) => Math.hypot(mid0.x - r.x, mid0.z - r.z) < r.radius)
        let riserNo = 0
        const g = at.map((p) => (park ? terrain.rawHeightAt(p.x, p.z) : terrain.heightAt(p.x, p.z)))
        const base = Math.min(g[0], g[g.length - 1])
        const y = g.map((h) => base + Math.round((h - base) / RISER) * RISER + 0.15)
        for (let i = 0; i < at.length - 1; i++) {
          const p = at[i]
          const q = at[i + 1]
          if (!inRect((p.x + q.x) / 2, (p.z + q.z) / 2)) continue
          const nx = -p.dz
          const nz = p.dx
          const top = Math.max(y[i], y[i + 1])
          const ya = y[i]
          const P = (r: { x: number; z: number }, o: number, h: number): [number, number, number] => [r.x + nx * o, h, r.z + nz * o]
          /*
           * A park's trail steps: an earth tread lying ON the slope from this point to the next, and a timber edge across
           * it — no level treads and risers, which on a raw hillside stood as white blocks and dark slabs (Strawberry
           * Hill, 2026-10-04).
           */
          if (park) {
            const ga = g[i] + 0.06, gb = g[i + 1] + 0.06
            out.quad([P(p, -half, ga), P(p, half, ga), P(q, half, gb), P(q, -half, gb)], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], TRAIL_EARTH, 0)
            out.quad([P(p, -half, ga), P(p, half, ga), P(p, half, ga + 0.14), P(p, -half, ga + 0.14)], [-p.dx, 0, -p.dz], [[0, 0], [1, 0], [1, 1], [0, 1]], TRAIL_TIMBER, 0)
            out.quad([P(p, -half, ga + 0.14), P(p, half, ga + 0.14), P(p, half, ga + 0.14), P(p, -half, ga + 0.14)], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], TRAIL_TIMBER, 0)
            continue
          }
          // the tread, level, from this point to the next
          out.quad([P(p, -half, ya), P(p, half, ya), P(q, half, ya), P(q, -half, ya)], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], rainbow ? PAINTED_TREAD : CONCRETE, concrete)
          // the riser up to the next tread (or down from it), facing the lower side
          if (Math.abs(y[i + 1] - ya) > 0.01) {
            const lo = Math.min(ya, y[i + 1])
            const hi = Math.max(ya, y[i + 1])
            const f = y[i + 1] > ya ? -1 : 1
            out.quad([P(q, -half, lo), P(q, half, lo), P(q, half, hi), P(q, -half, hi)], [p.dx * f, 0, p.dz * f], [[0, 0], [1, 0], [1, 1], [0, 1]],
              rainbow ? RAINBOW[riserNo++ % RAINBOW.length] : NOSING, rainbow ? 0 : concrete)
          }
          // the cheek walls, from the ground up past the tread, each side (a park's trail steps have none)
          for (const s of park ? [] : [-1, 1]) {
            const o = s * (half + 0.15)
            const gl = Math.min(g[i], g[i + 1]) - 0.3
            const wn: [number, number, number] = [nx * s, 0, nz * s]
            out.quad([P(p, o, gl), P(q, o, gl), P(q, o, top + 0.35), P(p, o, ya + 0.35)], wn, [[0, 0], [1, 0], [1, 1], [0, 1]], CONCRETE, concrete)
            out.quad([P(q, o - 0.3 * s, gl), P(p, o - 0.3 * s, gl), P(p, o - 0.3 * s, ya + 0.35), P(q, o - 0.3 * s, top + 0.35)],
              [-wn[0], 0, -wn[2]], [[0, 0], [1, 0], [1, 1], [0, 1]], CONCRETE, concrete)
            out.quad([P(p, o - 0.3 * s, ya + 0.35), P(p, o, ya + 0.35), P(q, o, top + 0.35), P(q, o - 0.3 * s, top + 0.35)], [0, 1, 0],
              [[0, 0], [1, 0], [1, 1], [0, 1]], NOSING, concrete)
          }
        }
        // the handrails: a steel tube on posts, 0.9 m over the treads, down each side (not on a park's trail steps)
        for (const s of park ? [] : [-1, 1]) {
          const o = s * (half - 0.1)
          for (let i = 0; i < at.length - 1; i += 6) {
            const j = Math.min(at.length - 1, i + 6)
            const p = at[i]
            const q = at[j]
            if (!inRect(p.x, p.z)) continue
            const P = (r: { x: number; z: number; dx: number; dz: number }, h: number): [number, number, number] => [r.x - r.dz * o, h, r.z + r.dx * o]
            strut(out, P(p, y[i] + 0.9), P(q, y[j] + 0.9), 0.03, 0.03, RAIL, 0, false)
            strut(out, P(p, y[i]), P(p, y[i] + 0.9), 0.025, 0.025, RAIL, 0, false)
          }
        }
      }
      if (out.triangles === 0) return []
      const m = new Mesh(`stairs:${near.key}`, scene)
      out.toVertexData().applyToMesh(m)
      m.material = cartoonMaterial(scene, 'cartoonLandmark', false)
      m.renderingGroupId = 3
      m.isPickable = false
      m.freezeWorldMatrix()
      return [m]
    },
  }
}

/** distance from a point to a polyline */
function toLine(x: number, z: number, pts: { x: number; z: number }[]): number {
  let best = Infinity
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]
    const dx = pts[i].x - a.x
    const dz = pts[i].z - a.z
    const l2 = dx * dx + dz * dz || 1e-9
    const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / l2))
    best = Math.min(best, Math.hypot(a.x + dx * t - x, a.z + dz * t - z))
  }
  return best
}

/**
 * A flight's polyline (with its heights) cut back at each end to where it leaves every carriageway: the first
 * point, walking in from that end, more than the street's half-width (plus a kerb's 0.3 m) from its centre line.
 * Null when nothing is left (a "flight" wholly on a street).
 */
/**
 * Push each point of a flight out of every carriageway's corridor, to its kerb plus the flight's own half-width — on the
 * side of the road the flight as a whole runs along. Pushed straight away from the nearest point of the road, a point at
 * a hairpin went the wrong way, across the bend and into the bed inside it (Lombard, 2026-10-16).
 */
export function keepOffRoads(pts: { x: number; z: number }[], roads: { half: number; pts: { x: number; z: number }[] }[], half: number): void {
  for (const r of roads) {
    const need = r.half + half + 0.15
    // each point's nearest place on the road, its distance and which side it is on
    const near = pts.map((p) => {
      let best = Infinity, qx = 0, qz = 0, nx = 0, nz = 0, side = 0
      for (let i = 1; i < r.pts.length; i++) {
        const a = r.pts[i - 1], b = r.pts[i], dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz) || 1
        const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / (L * L)))
        const d = Math.hypot(a.x + dx * t - p.x, a.z + dz * t - p.z)
        if (d < best) { best = d; qx = a.x + dx * t; qz = a.z + dz * t; nx = -dz / L; nz = dx / L; side = Math.sign((p.x - qx) * nx + (p.z - qz) * nz) }
      }
      return { best, qx, qz, nx, nz, side }
    })
    if (!near.some((q) => q.best < need)) continue
    // the flight's side: where its points that are clear of the road lie (all of them, weighted by how clear, if none is)
    let vote = 0
    for (const q of near) vote += q.side * Math.max(0.05, q.best - r.half)
    const side = vote >= 0 ? 1 : -1
    pts.forEach((p, k) => {
      const q = near[k]
      if (q.best >= need && q.side === side) return
      p.x = q.qx + q.nx * side * need
      p.z = q.qz + q.nz * side * need
    })
  }
}

export function kerbTrim(pts: { x: number; z: number }[], ys: number[], roads: { half: number; pts: { x: number; z: number }[] }[]):
  { pts: { x: number; z: number }[]; ys: number[] } | null {
  const onRoad = (x: number, z: number): boolean => roads.some((r) => toLine(x, z, r.pts) < r.half + 0.3)
  // cumulative distance along the flight
  const cum = [0]
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z))
  const total = cum[cum.length - 1]
  const at = (d: number): { x: number; z: number; y: number } => {
    let i = 1
    while (i < pts.length - 1 && cum[i] < d) i++
    const t = Math.max(0, Math.min(1, (d - cum[i - 1]) / (cum[i] - cum[i - 1] || 1)))
    return { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t, z: pts[i - 1].z + (pts[i].z - pts[i - 1].z) * t, y: ys[i - 1] + (ys[i] - ys[i - 1]) * t }
  }
  let d0 = 0
  while (d0 < total && onRoad(at(d0).x, at(d0).z)) d0 += 0.25
  let d1 = total
  while (d1 > d0 && onRoad(at(d1).x, at(d1).z)) d1 -= 0.25
  if (d1 - d0 < 1) return null
  if (d0 === 0 && d1 === total) return { pts, ys }
  const a = at(d0)
  const b = at(d1)
  const out = [{ x: a.x, z: a.z }]
  const oy = [a.y]
  for (let i = 1; i < pts.length - 1; i++) if (cum[i] > d0 && cum[i] < d1) { out.push(pts[i]); oy.push(ys[i]) }
  out.push({ x: b.x, z: b.z })
  oy.push(b.y)
  return { pts: out, ys: oy }
}
