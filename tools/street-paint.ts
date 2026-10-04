/**
 * MARKET STREET'S PAVEMENT, and any city's like it (owner, 2026-10-04): "all the sidewalks are a distinctive brick,
 * including in UN Plaza, Embarcadero Plaza, and other open sidewalk places. Even though the whole street is buses and
 * taxis only, the lanes are not actually all red. Instead the centre lanes with the streetcars is red between Gough
 * St and 3rd St, then after 3rd St there is no more red pavement. There are also distinctive green bike lanes between
 * Gough and 8th St, but the bike lanes disappear at 8th St."
 *
 * Two bake passes, both driven by region data (src/city/regions.json):
 *  - `brickStreets`: the paved squares that open off a brick street are brick too (PackedArea `brick`);
 *  - `streetPaint`: a named street's lanes painted over a stretch between two points (PackedEdge `paint`: 1 the
 *    transit lanes in the middle, 2 the bike lanes at the kerbs). A street painted for transit loses its kerbside
 *    bus-lane red: the red is where the region says it is, not wherever OSM tags a bus lane.
 */
import type { PackedArea } from '../src/city/package.ts'

type Pt = { x: number; z: number }
const pts = (flat: number[]): Pt[] => {
  const out: Pt[] = []
  for (let i = 0; i + 1 < flat.length; i += 2) out.push({ x: flat[i], z: flat[i + 1] })
  return out
}

/** distance from p to the segment a–b */
function segDist(p: Pt, a: Pt, b: Pt): number {
  const dx = b.x - a.x, dz = b.z - a.z
  const L2 = dx * dx + dz * dz
  const t = L2 > 0 ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / L2)) : 0
  return Math.hypot(p.x - (a.x + dx * t), p.z - (a.z + dz * t))
}

export const PAINT_TRANSIT = 1
export const PAINT_BIKE = 2

/**
 * Paved squares with any corner within `reach` metres of a brick street's centre line (plus half its pavement), marked
 * `brick`. A square is open sidewalk running off the street — UN Plaza, Embarcadero Plaza — and it is laid the same.
 * Returns how many were marked.
 */
export function markBrickSquares(areas: PackedArea[], edges: { name?: string; foot?: boolean; points: number[]; width: number; walk: number }[],
  names: string[], reach = 12): number {
  if (names.length === 0) return 0
  const streets = edges.filter((e) => !e.foot && names.includes(e.name ?? '')).map((e) => ({ p: pts(e.points), half: e.width / 2 + e.walk }))
  if (streets.length === 0) return 0
  // a coarse grid over the streets' segments, so each square tests only what is near it
  const CELL = 100
  const grid = new Map<string, { a: Pt; b: Pt; half: number }[]>()
  for (const s of streets) {
    for (let i = 1; i < s.p.length; i++) {
      const a = s.p[i - 1], b = s.p[i]
      for (let gx = Math.floor((Math.min(a.x, b.x) - reach - s.half) / CELL); gx <= Math.floor((Math.max(a.x, b.x) + reach + s.half) / CELL); gx++) {
        for (let gz = Math.floor((Math.min(a.z, b.z) - reach - s.half) / CELL); gz <= Math.floor((Math.max(a.z, b.z) + reach + s.half) / CELL); gz++) {
          const k = `${gx},${gz}`
          ;(grid.get(k) ?? grid.set(k, []).get(k)!).push({ a, b, half: s.half })
        }
      }
    }
  }
  let n = 0
  for (const ar of areas) {
    if (ar.kind !== 'paved' || ar.top) continue
    const ring = pts(ar.ring)
    const near = ring.some((q) => (grid.get(`${Math.floor(q.x / CELL)},${Math.floor(q.z / CELL)}`) ?? []).some((s) => segDist(q, s.a, s.b) <= s.half + reach))
    if (near) { ar.brick = true; n++ }
  }
  return n
}

export interface PaintRule { street: string; from: Pt; to: Pt; paint: 'transit' | 'bike' }

/**
 * Each edge of a rule's street whose middle lies between the rule's two points — along the line from one to the
 * other, and within 80 m of it — gets the rule's paint. Returns the edges painted per rule.
 */
export function applyStreetPaint(edges: { name?: string; foot?: boolean; points: number[]; paint?: number; busSide?: 1 | 2 | 3 }[], rules: PaintRule[]): number[] {
  return rules.map((r) => {
    const dx = r.to.x - r.from.x, dz = r.to.z - r.from.z
    const L = Math.hypot(dx, dz) || 1
    let n = 0
    for (const e of edges) {
      if (e.foot || e.name !== r.street) continue
      const p = pts(e.points)
      if (p.length < 2) continue
      const m = p[Math.floor(p.length / 2)]
      const mid = p.length % 2 === 0 ? { x: (p[p.length / 2 - 1].x + m.x) / 2, z: (p[p.length / 2 - 1].z + m.z) / 2 } : m
      const t = ((mid.x - r.from.x) * dx + (mid.z - r.from.z) * dz) / (L * L)
      const off = Math.abs((mid.x - r.from.x) * dz - (mid.z - r.from.z) * dx) / L
      if (t < 0 || t > 1 || off > 80) continue
      e.paint = (e.paint ?? 0) | (r.paint === 'transit' ? PAINT_TRANSIT : PAINT_BIKE)
      n++
    }
    // the street's red is where the rule puts it, not wherever OSM tags a bus lane
    if (r.paint === 'transit') for (const e of edges) if (e.name === r.street) delete e.busSide
    return n
  })
}
