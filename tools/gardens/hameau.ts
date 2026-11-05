/**
 * THE QUEEN'S HAMEAU (Mique, 1783–87): a working farm in an English garden. Its vineyards as rows of low vines, its kitchen
 * gardens as strips of beds between paths, and shrubs loosely round the Grand Lac's banks; the rest is the scatter's.
 * Outlines from OSM (hameau-outlines.ts).
 */
import type { GardenPlan, LL } from './plan.ts'
import { HAMEAU_OUTLINES } from './hameau-outlines.ts'

// ---- tunables
/** the vines: row spacing, height, width, their bearing (degrees from north) */
const VINES = { step: 1.8, h: 1.2, w: 0.5, bearing: 20 }
/** the potager: bed width, path between beds, edge margin, bearing */
const POTAGER = { bed: 1.4, path: 0.9, margin: 1, bearing: 20 }
/** shrubs round the lake: spacing along the bank, set back from it, heights, and how many places skip one (open views) */
const BANK = { step: 9, back: 5, h: [1.6, 3.2], skip: 0.35 }

const M_LAT = 111320
type V = [number, number]

/** a local metric frame about a ring's centroid: to [e, n] metres and back */
function local(r: LL[]) {
  const c: LL = [r.reduce((s, p) => s + p[0], 0) / r.length, r.reduce((s, p) => s + p[1], 0) / r.length]
  const mLon = M_LAT * Math.cos((c[0] * Math.PI) / 180)
  return { to: (p: LL): V => [(p[1] - c[1]) * mLon, (p[0] - c[0]) * M_LAT], back: (q: V): LL => [c[0] + q[1] / M_LAT, c[1] + q[0] / mLon] }
}

/** parallel lines across a polygon at `bearing`, `step` apart, each clipped to the polygon (scanline), as [a, b] in metres */
function stripes(poly: V[], bearing: number, step: number): [V, V][] {
  const b = (bearing * Math.PI) / 180, d: V = [Math.sin(b), Math.cos(b)], n: V = [d[1], -d[0]]
  const along = (p: V): number => p[0] * d[0] + p[1] * d[1], across = (p: V): number => p[0] * n[0] + p[1] * n[1]
  const cs = poly.map(across), lo = Math.min(...cs), hi = Math.max(...cs)
  const out: [V, V][] = []
  for (let c = lo + step / 2; c < hi; c += step) {
    const xs: number[] = []
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i], q = poly[(i + 1) % poly.length], a = across(p), e = across(q)
      if ((a <= c) !== (e <= c)) { const t = (c - a) / (e - a); xs.push(along(p) + t * (along(q) - along(p))) }
    }
    xs.sort((x, y) => x - y)
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const pt = (t: number): V => [d[0] * t + n[0] * c, d[1] * t + n[1] * c]
      out.push([pt(xs[k]), pt(xs[k + 1])])
    }
  }
  return out
}

/** a small fixed hash, so the bank's shrubs are the same every bake */
const rnd = (i: number): number => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }

function plan([id, kind, ring]: (typeof HAMEAU_OUTLINES)[number]): GardenPlan {
  const r = ring as LL[], L = local(r), poly = r.map(L.to)
  if (kind === 'vineyard') return {
    name: `Hameau: vineyard (${id})`, ring: r, clearMapped: true, lawn: [r],
    hedges: stripes(poly, VINES.bearing, VINES.step).filter(([a, b]) => Math.hypot(a[0] - b[0], a[1] - b[1]) > 1.5)
      .map(([a, b]) => ({ line: [L.back(a), L.back(b)], h: VINES.h, w: VINES.w })),
  }
  if (kind === 'farmland') {
    const P = POTAGER, beds: NonNullable<GardenPlan['beds']> = []
    for (const [a, b] of stripes(poly, P.bearing, P.bed + P.path)) {
      const len = Math.hypot(b[0] - a[0], b[1] - a[1])
      if (len < P.margin * 2 + 1) continue
      const t: V = [(b[0] - a[0]) / len, (b[1] - a[1]) / len], n: V = [t[1], -t[0]], h = P.bed / 2
      const s: V = [a[0] + t[0] * P.margin, a[1] + t[1] * P.margin], e: V = [b[0] - t[0] * P.margin, b[1] - t[1] * P.margin]
      beds.push({ ring: [[s[0] + n[0] * h, s[1] + n[1] * h], [e[0] + n[0] * h, e[1] + n[1] * h], [e[0] - n[0] * h, e[1] - n[1] * h], [s[0] - n[0] * h, s[1] - n[1] * h]].map((q) => L.back(q as V)) })
    }
    return { name: `Hameau: potager (${id})`, ring: r, clearMapped: true, gravel: [r], beds }
  }
  // the lake: shrubs along the bank, set back outward from the water
  const topiary: NonNullable<GardenPlan['topiary']> = []
  let k = 0
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length], len = Math.hypot(q[0] - p[0], q[1] - p[1])
    const nx = (q[1] - p[1]) / len, nz = -(q[0] - p[0]) / len
    for (let s = 0; s < len; s += BANK.step) {
      if (rnd(++k) < BANK.skip) continue
      const at: V = [p[0] + ((q[0] - p[0]) * s) / len, p[1] + ((q[1] - p[1]) * s) / len]
      // outward is the side away from the centroid (the frame's origin)
      const sg = at[0] * nx + at[1] * nz > 0 ? 1 : -1, back = BANK.back * (0.7 + rnd(k + 999) * 0.8)
      topiary.push({ at: L.back([at[0] + sg * nx * back, at[1] + sg * nz * back]), shape: 'shrub', h: BANK.h[0] + rnd(k + 77) * (BANK.h[1] - BANK.h[0]) })
    }
  }
  return { name: `Hameau: the Grand Lac's banks (${id})`, ring: r, topiary }
}

export const HAMEAU_GARDENS: GardenPlan[] = HAMEAU_OUTLINES.map(plan)
