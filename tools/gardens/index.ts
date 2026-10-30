/**
 * The bake's gardens: OSM's hedges, flower beds and tree rows, and the plans traced from the aerial photographs (./paris-*.ts),
 * made into the package's PackedGarden and the rows of trees that go with it.
 */
import { packPoints, type PackedGarden } from '../../src/city/package.ts'
import { GARDENS } from './paris.ts'
import type { LL } from './plan.ts'

type Local = { x: number; z: number }
type Way = { id: number; geometry?: { lat: number; lon: number }[]; tags?: Record<string, string> }

export interface TreeRow { points: Local[]; spacing: number; h?: number; form?: 'plane'; /** OSM's: a plan's clearMapped takes it, as it takes the mapped trees */ osm?: true }
export interface GardenBake {
  garden: PackedGarden
  rows: TreeRow[]
  /** the rings whose mapped trees go, because a plan's rows are those trees */
  clearMapped: Local[][]
  counts: { hedges: number; beds: number; rows: number; plans: number }
}

const metres = (s: string | undefined): number | undefined => {
  const v = s ? Number.parseFloat(s) : NaN
  return Number.isFinite(v) && v > 0 ? v : undefined
}
const lengthOf = (p: Local[]): number => p.reduce((s, q, i) => (i ? s + Math.hypot(q.x - p[i - 1].x, q.z - p[i - 1].z) : 0), 0)
const areaOf = (p: Local[]): number => {
  let a = 0
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) a += p[j].x * p[i].z - p[i].x * p[j].z
  return Math.abs(a) / 2
}

export function bakeGardens(ways: Way[], toLocal: (g: { lat: number; lon: number }) => Local): GardenBake {
  const garden: PackedGarden = { hedges: [], flats: [], topiary: [], formal: [] }
  const rows: TreeRow[] = []
  const clearMapped: Local[][] = []
  const counts = { hedges: 0, beds: 0, rows: 0, plans: 0 }
  const L = (ll: LL): Local => toLocal({ lat: ll[0], lon: ll[1] })

  for (const w of ways) {
    if (!w.geometry || w.geometry.length < 2) continue
    const pts = w.geometry.map(toLocal)
    const closed = pts.length > 3 && Math.hypot(pts[0].x - pts[pts.length - 1].x, pts[0].z - pts[pts.length - 1].z) < 0.5
    const t = w.tags ?? {}
    if (t.barrier === 'hedge') {
      // (a hedge drawn as an area: its outline clipped, the block filled by the width of a hedge either side. A mapped outline
      //  under 2 m across is one short hedge, and reads as one)
      const h = Math.min(3.5, metres(t.height) ?? 1.1)
      garden.hedges.push({ points: packPoints(pts), h, w: Math.min(2, metres(t.width) ?? 0.8) })
      counts.hedges++
    } else if (t.natural === 'tree_row') {
      if (lengthOf(pts) < 6) continue
      rows.push({ points: pts, spacing: 8, h: metres(t.height), osm: true })
      counts.rows++
    } else if ((t.landuse === 'flowerbed' || t.natural === 'shrubbery') && closed) {
      const ring = pts.slice(0, -1)
      // (a bed the size of a car park is a mapper's outline of a whole planted garden, and flowers on it read as a carpet)
      if (areaOf(ring) < 1 || areaOf(ring) > 12000) continue
      garden.flats.push({ ring: packPoints(ring), kind: 'bed' })
      counts.beds++
    }
  }

  for (const g of GARDENS) {
    const ring = g.ring.map(L)
    garden.formal.push(packPoints(ring))
    if (g.clearMapped) clearMapped.push(ring)
    for (const r of g.gravel ?? []) garden.flats.push({ ring: packPoints(r.map(L)), kind: 'gravel' })
    for (const r of g.lawn ?? []) garden.flats.push({ ring: packPoints(r.map(L)), kind: 'lawn' })
    for (const b of g.beds ?? []) garden.flats.push({ ring: packPoints(b.ring.map(L)), kind: 'bed', ...(b.rim ? { rim: true as const } : {}) })
    for (const h of g.hedges ?? []) garden.hedges.push({ points: packPoints(h.line.map(L)), h: h.h ?? 1, w: h.w ?? 0.7 })
    for (const p of g.pleached ?? []) {
      garden.hedges.push({ points: packPoints(p.line.map(L)), y0: p.y0 ?? 3.5, h: p.h ?? 5, w: p.w ?? 5, spacing: p.spacing ?? 4 })
    }
    for (const r of g.rows ?? []) rows.push({ points: r.line.map(L), spacing: r.spacing ?? 7, h: r.h, form: r.form })
    for (const t of g.topiary ?? []) {
      const p = L(t.at)
      garden.topiary.push(p.x, p.z, t.h, t.shape === 'cone' ? 0 : t.shape === 'ball' ? 1 : 2)
    }
    counts.plans++
  }
  return { garden, rows, clearMapped, counts }
}

/** A row of trees as points along its line, the first half a spacing in. */
export function rowPoints(r: TreeRow): Local[] {
  const out: Local[] = []
  const total = lengthOf(r.points)
  const n = Math.max(1, Math.round(total / r.spacing))
  const step = total / n
  let next = step / 2, run = 0
  for (let i = 1; i < r.points.length; i++) {
    const a = r.points[i - 1], b = r.points[i]
    const s = Math.hypot(b.x - a.x, b.z - a.z)
    while (next < run + s && out.length < n) {
      const t = (next - run) / s
      out.push({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t })
      next += step
    }
    run += s
  }
  return out
}
