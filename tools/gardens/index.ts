/**
 * The bake's gardens: OSM's hedges, flower beds and tree rows, and the plans traced from the aerial photographs (./paris-*.ts),
 * made into the package's PackedGarden and the rows of trees that go with it.
 */
import { packPoints, type PackedGarden } from '../../src/city/package.ts'
import { GARDENS } from './paris.ts'
import type { GardenPlan, LL } from './plan.ts'
import { inside } from '../../src/city/park-planting.ts'

type Local = { x: number; z: number }
type Way = { id: number; geometry?: { lat: number; lon: number }[]; tags?: Record<string, string> }

export interface TreeRow { points: Local[]; spacing: number; h?: number; form?: 'plane'; /** OSM's: a plan's clearMapped takes it, as it takes the mapped trees */ osm?: true
  /** where a tree of the row may stand (a plan's `rowClear`): the bake drops the others */
  keep?: (p: Local) => boolean }

/** What the bake already knows when the gardens are made: the ways (hedges are cut where they cross one) and OSM's open ground. */
export interface GardenContext {
  ways: { points: Local[]; half: number; kind: string; bridge?: boolean; tunnel?: boolean }[]
  /** water, lawn, paving and pitches: rings */
  open: Local[][]
}

// ---- tunables
/** a hedge is cut where its line comes within a way's half-width + `margin` of the way; runs shorter than `minRun` go */
export const HEDGE_CUT = { margin: 0.4, step: 0.5, minRun: 1 }
/** the ways a plan's `pathWalls` line: OSM's footpaths, not its roads */
const WALLED = new Set(['footway', 'path', 'bridleway', 'track', 'cycleway'])

/** segments bucketed in a grid, for "how far is this point from the nearest way's edge" */
class SegGrid {
  private readonly cells = new Map<string, number[]>()
  private readonly segs: number[] = []
  private readonly cell: number
  constructor(cell = 16) { this.cell = cell }
  add(a: Local, b: Local, half: number): void {
    const i = this.segs.length / 5
    this.segs.push(a.x, a.z, b.x, b.z, half)
    const c = this.cell
    for (let x = Math.floor((Math.min(a.x, b.x) - half) / c); x <= Math.floor((Math.max(a.x, b.x) + half) / c); x++) {
      for (let z = Math.floor((Math.min(a.z, b.z) - half) / c); z <= Math.floor((Math.max(a.z, b.z) + half) / c); z++) {
        const k = `${x},${z}`, l = this.cells.get(k)
        if (l) l.push(i); else this.cells.set(k, [i])
      }
    }
  }
  /** the distance from (x, z) to the nearest segment's edge (its line minus its half-width), up to `r` */
  clearance(x: number, z: number, r: number): number {
    let best = r
    const c = this.cell, s = this.segs
    for (let gx = Math.floor((x - r) / c); gx <= Math.floor((x + r) / c); gx++) {
      for (let gz = Math.floor((z - r) / c); gz <= Math.floor((z + r) / c); gz++) {
        for (const i of this.cells.get(`${gx},${gz}`) ?? []) {
          const ax = s[i * 5], az = s[i * 5 + 1], dx = s[i * 5 + 2] - ax, dz = s[i * 5 + 3] - az, l = dx * dx + dz * dz || 1e-9
          const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / l))
          const d = Math.hypot(ax + dx * t - x, az + dz * t - z) - s[i * 5 + 4]
          if (d < best) best = d
        }
      }
    }
    return best
  }
}

/** a polyline cut into the runs where `blocked` is false, sampled every `step` metres; runs under `minRun` go */
export function cutLine(pts: Local[], blocked: (p: Local) => boolean, step = HEDGE_CUT.step, minRun = HEDGE_CUT.minRun): Local[][] {
  const runs: Local[][] = []
  let cur: Local[] | null = null, last: Local | null = null
  const close = (): void => {
    if (cur && last && cur[cur.length - 1] !== last) cur.push(last)
    if (cur && cur.length > 1 && lengthOf(cur) >= minRun) runs.push(cur)
    cur = null
  }
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / step))
    for (let k = i === 1 ? 0 : 1; k <= n; k++) {
      const p = { x: a.x + ((b.x - a.x) * k) / n, z: a.z + ((b.z - a.z) * k) / n }
      if (blocked(p)) { close(); last = null; continue }
      if (!cur) cur = [p]
      else if (k === n) cur.push(p)
      last = p
    }
  }
  close()
  return runs
}

/** a polyline moved `d` metres to its left (negative: right), each vertex along its corner's mitre, capped */
function offsetLine(p: Local[], d: number): Local[] {
  const nrm = (a: Local, b: Local): Local => { const l = Math.hypot(b.x - a.x, b.z - a.z) || 1; return { x: -(b.z - a.z) / l, z: (b.x - a.x) / l } }
  return p.map((q, i) => {
    const n0 = i > 0 ? nrm(p[i - 1], q) : nrm(q, p[i + 1]), n1 = i < p.length - 1 ? nrm(q, p[i + 1]) : n0
    let mx = n0.x + n1.x, mz = n0.z + n1.z
    const ml = Math.hypot(mx, mz) || 1
    mx /= ml; mz /= ml
    const k = Math.min(2, 1 / Math.max(0.5, mx * n0.x + mz * n0.z))
    return { x: q.x + mx * d * k, z: q.z + mz * d * k }
  })
}
const bboxOf = (r: Local[]): [number, number, number, number] => [Math.min(...r.map((p) => p.x)), Math.min(...r.map((p) => p.z)), Math.max(...r.map((p) => p.x)), Math.max(...r.map((p) => p.z))]
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

export function bakeGardens(ways: Way[], toLocal: (g: { lat: number; lon: number }) => Local, ctx?: GardenContext, plans: GardenPlan[] = GARDENS): GardenBake {
  const garden: PackedGarden = { hedges: [], flats: [], topiary: [], formal: [] }
  const rows: TreeRow[] = []
  const clearMapped: Local[][] = []
  const counts = { hedges: 0, beds: 0, rows: 0, plans: 0 }
  const L = (ll: LL): Local => toLocal({ lat: ll[0], lon: ll[1] })
  /** every hedge, in local metres until the end, when they are cut where ways cross them and packed */
  const hedges: { pts: Local[]; h: number; w: number; y0?: number; spacing?: number; osmSized?: boolean }[] = []

  for (const w of ways) {
    if (!w.geometry || w.geometry.length < 2) continue
    const pts = w.geometry.map(toLocal)
    const closed = pts.length > 3 && Math.hypot(pts[0].x - pts[pts.length - 1].x, pts[0].z - pts[pts.length - 1].z) < 0.5
    const t = w.tags ?? {}
    if (t.barrier === 'hedge') {
      // (a hedge drawn as an area: its outline clipped, the block filled by the width of a hedge either side. A mapped outline
      //  under 2 m across is one short hedge, and reads as one)
      const h = Math.min(3.5, metres(t.height) ?? 1.1)
      hedges.push({ pts, h, w: Math.min(2, metres(t.width) ?? 0.8), osmSized: metres(t.height) === undefined })
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
  const osmCount = hedges.length

  // the ways, for cutting hedges and keeping a plan's trees off them
  const wayGrid = new SegGrid()
  for (const e of ctx?.ways ?? []) {
    if (e.bridge || e.tunnel) continue
    for (let i = 1; i < e.points.length; i++) wayGrid.add(e.points[i - 1], e.points[i], e.half)
  }
  // OSM's own hedges, for telling whether a plan's outline is mapped already
  const osmGrid = new SegGrid()
  for (let k = 0; k < osmCount; k++) { const p = hedges[k].pts; for (let i = 1; i < p.length; i++) osmGrid.add(p[i - 1], p[i], 0) }

  const allRooms: Local[][] = []
  for (const g of plans) {
    const ring = g.ring.map(L)
    const bb = bboxOf(ring)
    const inRing = (p: Local): boolean => p.x >= bb[0] && p.x <= bb[2] && p.z >= bb[1] && p.z <= bb[3] && inside(ring, p.x, p.z)
    const rooms = (g.rooms ?? []).map((r) => r.map(L))
    allRooms.push(...rooms)
    const inRoom = (p: Local): boolean => rooms.some((r) => inside(r, p.x, p.z))
    garden.formal.push(packPoints(ring))
    if (g.clearMapped) clearMapped.push(ring)
    for (const r of g.gravel ?? []) garden.flats.push({ ring: packPoints(r.map(L)), kind: 'gravel' })
    for (const r of g.lawn ?? []) garden.flats.push({ ring: packPoints(r.map(L)), kind: 'lawn' })
    for (const b of g.beds ?? []) garden.flats.push({ ring: packPoints(b.ring.map(L)), kind: 'bed', ...(b.rim ? { rim: true as const } : {}) })
    for (const h of g.hedges ?? []) hedges.push({ pts: h.line.map(L), h: h.h ?? 1, w: h.w ?? 0.7 })
    for (const p of g.pleached ?? []) hedges.push({ pts: p.line.map(L), y0: p.y0 ?? 3.5, h: p.h ?? 5, w: p.w ?? 5, spacing: p.spacing ?? 4 })
    if (g.osmHedge) {
      for (let k = 0; k < osmCount; k++) {
        const hd = hedges[k], m = hd.pts[Math.floor(hd.pts.length / 2)]
        if (hd.osmSized && inRing(m)) { hd.h = g.osmHedge.h; hd.w = g.osmHedge.w; hd.osmSized = false }
      }
    }
    if (g.outlineHedge) {
      const line = [...ring, ring[0]]
      let n = 0, hit = 0
      for (const run of cutLine(line, () => false, 4, 0)) for (const p of run) { n++; if (osmGrid.clearance(p.x, p.z, 6) < 6) hit++ }
      if (!n || hit / n < 0.5) hedges.push({ pts: line, ...g.outlineHedge })
    }
    if (g.pathWalls) {
      const { h, w, gap = 0.6 } = g.pathWalls
      for (const e of ctx?.ways ?? []) {
        if (!WALLED.has(e.kind) || e.bridge || e.tunnel || e.points.length < 2) continue
        // (a path may cross the plan with no vertex inside it: overlap of the boxes, then the walls are clipped to the ring)
        const eb = bboxOf(e.points)
        if (eb[2] < bb[0] || eb[0] > bb[2] || eb[3] < bb[1] || eb[1] > bb[3]) continue
        for (const s of [-1, 1]) {
          for (const run of cutLine(offsetLine(e.points, s * (e.half + gap + w / 2)), (p) => !inRing(p) || inRoom(p))) hedges.push({ pts: run, h, w })
        }
      }
    }
    let keep: ((p: Local) => boolean) | undefined
    if (g.rowClear) {
      const rc = g.rowClear
      const open = rc.open ? (ctx?.open ?? []).filter((r) => { const b = bboxOf(r); return b[2] >= bb[0] && b[0] <= bb[2] && b[3] >= bb[1] && b[1] <= bb[3] }) : []
      keep = (p) => wayGrid.clearance(p.x, p.z, rc.path + 1) > rc.path && !open.some((r) => inside(r, p.x, p.z)) && !inRoom(p)
    }
    for (const r of g.rows ?? []) rows.push({ points: r.line.map(L), spacing: r.spacing ?? 7, h: r.h, form: r.form, ...(keep ? { keep } : {}) })
    for (const t of g.topiary ?? []) {
      const p = L(t.at)
      garden.topiary.push(p.x, p.z, t.h, t.shape === 'cone' ? 0 : t.shape === 'ball' ? 1 : t.shape === 'shrub' ? 3 : 2)
    }
    counts.plans++
  }

  // a hedge does not stand across a way: cut where any way crosses it (pleached rows stand on trunks, and are left alone)
  for (const hd of hedges) {
    const runs = hd.y0 !== undefined || !ctx ? [hd.pts]
      : cutLine(hd.pts, (p) => wayGrid.clearance(p.x, p.z, HEDGE_CUT.margin + 0.01) <= HEDGE_CUT.margin || allRooms.some((r) => inside(r, p.x, p.z)))
    for (const run of runs) {
      garden.hedges.push({ points: packPoints(run), h: hd.h, w: hd.w, ...(hd.y0 !== undefined ? { y0: hd.y0, spacing: hd.spacing } : {}) })
    }
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
