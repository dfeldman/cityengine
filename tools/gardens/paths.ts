/**
 * GARDEN WALKS RIDDEN where OSM maps none (owner, 2026-11-04: "add rideable paths on known walking paths in the major
 * paris plazas and gardens where none exist … OSM omits many walking paths, so we have to be a bit creative"). The
 * traced gardens (./paris-*.ts) draw their gravel; for each with next to nothing rideable inside, this lays the walks
 * a formal garden nearly always has — one round the inside of its ring, and the two cross walks through its middle on
 * its long and short axes — and joins the round walk to the nearest street or path outside. The ride graph only
 * (tools/bake.ts writeRides): the gravel is already drawn, so nothing new is rendered. A connector never crosses a
 * building; a garden none can reach is an island, and the ride graph's largest-component pass drops it.
 */
import { Projection } from '../../src/city/geo.ts'
import type { Edge } from '../../src/city/graph.ts'

type Point = { x: number; z: number }
import { inRing } from '../../src/map/zones.ts'
import { GARDENS } from './paris.ts'

/** a garden with fewer rideable metres a hectare inside it than this gets walks */
export const MIN_RIDDEN_M_PER_HA = 60
/** gardens smaller than this (m²) are a court, not a ride */
export const MIN_AREA = 400
/** the round walk, this far in from the ring */
export const INSET = 2.5
/** a connector reaches this far for a street or path */
export const CONNECT_M = 35
/** gardens not given walks: their "gravel" is a lake's shore, a forest's rides, or a forecourt OSM already paves */
export const SKIP = ['Bois de Boulogne', 'Parc de Saint-Cloud']
const BIKE_KINDS = /^(primary|secondary|tertiary|primary_link|secondary_link|tertiary_link|residential|unclassified|living_street|pedestrian|cycleway|service)$/

const len = (p: Point[]): number => p.reduce((s, q, i) => (i ? s + Math.hypot(q.x - p[i - 1].x, q.z - p[i - 1].z) : 0), 0)
const cross = (ax: number, az: number, bx: number, bz: number): number => ax * bz - az * bx

/** where segment p→p+d meets segment a→b, as the parameter along p→p+d, or null */
function hit(p: Point, d: Point, a: Point, b: Point): number | null {
  const e = { x: b.x - a.x, z: b.z - a.z }
  const den = cross(d.x, d.z, e.x, e.z)
  if (Math.abs(den) < 1e-9) return null
  const t = cross(a.x - p.x, a.z - p.z, e.x, e.z) / den
  const u = cross(a.x - p.x, a.z - p.z, d.x, d.z) / den
  return u >= 0 && u <= 1 ? t : null
}

export function gardenPaths(origin: { lat: number; lon: number }, edges: Edge[], heightAt: (x: number, z: number) => number,
  buildings: number[][]): { edges: Edge[]; gardens: string[]; skipped: string[] } {
  const proj = new Projection(origin)
  const out: Edge[] = []
  const gardens: string[] = []
  const skipped: string[] = []
  const pending: { name: string; walk: string; order: { n: number; p: Point }[] }[] = []
  let nextNode = -900_000_000, nextEdge = -900_000_000
  // the nodes a connector may end on: those of a way the bike rides
  const ends: { n: number; p: Point }[] = []
  for (const e of edges) {
    if (!(BIKE_KINDS.test(e.kind ?? '') || e.trail) || e.tunnel || e.bridge) continue
    ends.push({ n: e.a, p: e.points[0] }, { n: e.b, p: e.points[e.points.length - 1] })
  }
  const bboxes = buildings.map((r) => {
    let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity
    for (let i = 0; i < r.length; i += 2) { x0 = Math.min(x0, r[i]); x1 = Math.max(x1, r[i]); z0 = Math.min(z0, r[i + 1]); z1 = Math.max(z1, r[i + 1]) }
    return [x0, z0, x1, z1]
  })
  const throughBuilding = (a: Point, b: Point): boolean => {
    const d = { x: b.x - a.x, z: b.z - a.z }
    for (let k = 0; k < buildings.length; k++) {
      const [x0, z0, x1, z1] = bboxes[k]
      if (Math.max(a.x, b.x) < x0 || Math.min(a.x, b.x) > x1 || Math.max(a.z, b.z) < z0 || Math.min(a.z, b.z) > z1) continue
      const r = buildings[k]
      for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
        const t = hit(a, d, { x: r[j], z: r[j + 1] }, { x: r[i], z: r[i + 1] })
        if (t !== null && t > 0.02 && t < 0.98) return true
      }
    }
    return false
  }
  const edge = (a: number, b: number, points: Point[], name: string): Edge => ({
    id: nextEdge--, a, b, points, length: len(points), surface: 'gravel', width: 3, walk: 0, name, foot: true, kind: 'footway', trail: true,
    heights: points.map((q) => Math.round(heightAt(q.x, q.z) * 100) / 100),
  })

  for (const g of GARDENS) {
    if (g.ringOnly || !g.gravel?.length || SKIP.some((s) => g.name.startsWith(s))) continue
    const ring = g.ring.map(([lat, lon]) => proj.toLocal({ lat, lon }))
    const flat = ring.flatMap((p) => [p.x, p.z])
    let A = 0, cx = 0, cz = 0
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const f = ring[j].x * ring[i].z - ring[i].x * ring[j].z
      A += f; cx += (ring[j].x + ring[i].x) * f; cz += (ring[j].z + ring[i].z) * f
    }
    if (Math.abs(A / 2) < MIN_AREA) continue
    const c = { x: cx / (3 * A), z: cz / (3 * A) }
    if (!inRing(flat, c.x, c.z)) { skipped.push(`${g.name} (middle outside)`); continue }
    // what is ridden inside already
    let ridden = 0
    for (const e of edges) {
      if (!(BIKE_KINDS.test(e.kind ?? '') || e.trail)) continue
      for (let i = 1; i < e.points.length; i++) {
        const p = e.points[i - 1], q = e.points[i]
        if (inRing(flat, (p.x + q.x) / 2, (p.z + q.z) / 2)) ridden += Math.hypot(q.x - p.x, q.z - p.z)
      }
    }
    if (ridden / (Math.abs(A / 2) / 1e4) >= MIN_RIDDEN_M_PER_HA) continue

    // the round walk: each corner pulled INSET towards the middle
    const loop = ring.map((p) => {
      const d = Math.hypot(p.x - c.x, p.z - c.z)
      const k = d > INSET * 2 ? (d - INSET) / d : 0.5
      return { x: c.x + (p.x - c.x) * k, z: c.z + (p.z - c.z) * k }
    })
    // the garden's axes: the principal directions of its ring
    let sxx = 0, szz = 0, sxz = 0
    for (const p of loop) { sxx += (p.x - c.x) ** 2; szz += (p.z - c.z) ** 2; sxz += (p.x - c.x) * (p.z - c.z) }
    const th = 0.5 * Math.atan2(2 * sxz, sxx - szz)
    // the four points where the axes meet the round walk, as (segment index, point)
    const meets: { seg: number; t: number; p: Point }[] = []
    for (const ang of [th, th + Math.PI / 2, th + Math.PI, th + (3 * Math.PI) / 2]) {
      const d = { x: Math.cos(ang) * 1e4, z: Math.sin(ang) * 1e4 }
      let best: { seg: number; t: number; s: number } | null = null
      for (let i = 0; i < loop.length; i++) {
        const a = loop[i], b = loop[(i + 1) % loop.length]
        const s = hit(c, d, a, b)
        if (s === null || s <= 0 || (best && s >= best.s)) continue
        const e = { x: b.x - a.x, z: b.z - a.z }
        const t = Math.abs(e.x) > Math.abs(e.z) ? (c.x + d.x * s - a.x) / e.x : (c.z + d.z * s - a.z) / e.z
        best = { seg: i, t, s }
      }
      if (best) meets.push({ seg: best.seg, t: best.t, p: { x: c.x + d.x * best.s, z: c.z + d.z * best.s } })
    }
    if (meets.length !== 4) { skipped.push(`${g.name} (axes)`); continue }
    const name = `${g.name.split(':')[0]}: walk`
    const centre = nextNode--
    const nodes = meets.map(() => nextNode--)
    // the cross walks, each meeting point to the middle
    meets.forEach((m, i) => out.push(edge(nodes[i], centre, [m.p, c], name)))
    // the round walk, in four pieces: the meeting points put into the loop in order, the loop cut at them
    const order = meets.map((m, i) => ({ ...m, n: nodes[i] })).sort((x, y) => x.seg + x.t - (y.seg + y.t))
    const seq: { p: Point; n?: number }[] = []
    for (let i = 0; i < loop.length; i++) {
      seq.push({ p: loop[i] })
      for (const m of order) if (m.seg === i) seq.push({ p: m.p, n: m.n })
    }
    const first = seq.findIndex((q) => q.n !== undefined)
    const rot = [...seq.slice(first), ...seq.slice(0, first), seq[first]]
    let piece: Point[] = [rot[0].p], from = rot[0].n!
    for (let i = 1; i < rot.length; i++) {
      piece.push(rot[i].p)
      if (rot[i].n !== undefined) { out.push(edge(from, rot[i].n!, piece, name)); piece = [rot[i].p]; from = rot[i].n! }
    }
    pending.push({ name: g.name, walk: name, order })
  }
  // the gates: each meeting point to the nearest way outside it, round no building — first within CONNECT_M, then the
  // gardens left with none at twice that, when the others' walks are there to reach too (the Rodin parterres, the courts)
  const gate = (gd: (typeof pending)[number], reach: number): number => {
    let joined = 0
    for (const m of gd.order) {
      let best: { n: number; p: Point; d: number } | null = null
      for (const e of ends) {
        if (gd.order.some((o) => o.n === e.n)) continue
        const d = Math.hypot(e.p.x - m.p.x, e.p.z - m.p.z)
        if (d < reach && (!best || d < best.d) && !throughBuilding(m.p, e.p)) best = { ...e, d }
      }
      if (best) { out.push(edge(m.n, best.n, [m.p, best.p], gd.walk)); joined++ }
    }
    return joined
  }
  const left: typeof pending = []
  for (const gd of pending) {
    const j = gate(gd, CONNECT_M)
    if (j) gardens.push(`${gd.name} (${j} gate${j > 1 ? 's' : ''})`)
    else left.push(gd)
  }
  for (const gd of pending) for (const m of gd.order) ends.push({ n: m.n, p: m.p })
  for (const gd of left) {
    const j = gate(gd, CONNECT_M * 2)
    if (j) gardens.push(`${gd.name} (${j} far gate${j > 1 ? 's' : ''})`)
    else skipped.push(`${gd.name} (no gate)`)
  }
  return { edges: out, gardens, skipped }
}
