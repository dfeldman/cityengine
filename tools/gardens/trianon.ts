/**
 * THE GARDENS OF THE TRIANONS, drawn from OSM's outlines (trianon-outlines.ts) rather than a frame: the Grand Trianon's salles
 * vertes (rooms walled in charmille, a lawn in each), its flower parterres (borders of flowers, box edging, yews at the corners),
 * and the lawns of both Trianons' French gardens, edged in box. The Hameau's English garden is left to the scatter, as it is informal.
 */
import type { GardenPlan, LL } from './plan.ts'
import { TRIANON } from './trianon-outlines.ts'

// ---- tunables
/** a salle verte: its charmille wall, the walk inside it before the lawn */
const SALLE = { h: 4, w: 1.2, walk: 3 }
/** a flower parterre: the border's width, the box edging inside it, the yews at sharp corners (only past `coneMin` m²) */
const FLOWER = { border: 1.4, box: { h: 0.5, w: 0.35 }, cone: 2.2, coneMin: 100 }
/** a lawn of the French gardens: box edging set in from its edge, cones at its corners past `coneMin` m² */
const LAWN = { inset: 0.6, box: { h: 0.45, w: 0.35 }, cone: 1.8, coneMin: 400 }
/** how sharp a corner must turn (degrees) to get a yew */
const CORNER = 50

const M_LAT = 111320
const mLon = M_LAT * Math.cos((48.816 * Math.PI) / 180)

/** a ring pulled in by d metres toward its centroid: good enough for the convex beds and lawns here */
function shrink(r: LL[], d: number): LL[] | null {
  const c: LL = [r.reduce((s, p) => s + p[0], 0) / r.length, r.reduce((s, p) => s + p[1], 0) / r.length]
  const rad = r.reduce((s, p) => s + Math.hypot((p[0] - c[0]) * M_LAT, (p[1] - c[1]) * mLon), 0) / r.length
  if (rad <= d * 1.5) return null
  const k = 1 - d / rad
  return r.map((p) => [c[0] + (p[0] - c[0]) * k, c[1] + (p[1] - c[1]) * k])
}

/** the ring's corners that turn by more than CORNER degrees */
function corners(r: LL[]): LL[] {
  const out: LL[] = []
  for (let i = 0; i < r.length; i++) {
    const a = r[(i + r.length - 1) % r.length], b = r[i], c = r[(i + 1) % r.length]
    const h1 = Math.atan2((b[0] - a[0]) * M_LAT, (b[1] - a[1]) * mLon), h2 = Math.atan2((c[0] - b[0]) * M_LAT, (c[1] - b[1]) * mLon)
    let t = Math.abs(((h2 - h1) * 180) / Math.PI) % 360
    if (t > 180) t = 360 - t
    if (t > CORNER) out.push(b)
  }
  return out
}
const closed = (r: LL[]): LL[] => [...r, r[0]]

function plan([id, kind, name, area, ring]: (typeof TRIANON)[number]): GardenPlan | null {
  const r = ring as LL[]
  const label = `Trianon: ${name || (kind === 'grass' ? 'lawn' : 'parterre')} (${id})`
  if (kind === 'garden' && /salle/i.test(name)) {
    const lawn = shrink(r, SALLE.w + SALLE.walk)
    return { name: label, ring: r, gravel: [r], lawn: lawn ? [lawn] : [], hedges: [{ line: closed(r), h: SALLE.h, w: SALLE.w }] }
  }
  if (kind === 'garden') {
    const inner = shrink(r, FLOWER.border)
    if (!inner) return { name: label, ring: r, beds: [{ ring: r }] }
    return {
      name: label, ring: r, beds: [{ ring: r, rim: true }], lawn: [inner],
      hedges: [{ line: closed(inner), ...FLOWER.box }],
      topiary: area >= FLOWER.coneMin ? corners(r).map((at) => ({ at, shape: 'cone' as const, h: FLOWER.cone })) : [],
    }
  }
  const edge = shrink(r, LAWN.inset)
  if (!edge) return null
  return {
    name: label, ring: r, hedges: [{ line: closed(edge), ...LAWN.box }],
    topiary: area >= LAWN.coneMin ? corners(edge).map((at) => ({ at, shape: 'cone' as const, h: LAWN.cone })) : [],
  }
}

export const TRIANON_GARDENS: GardenPlan[] = TRIANON.map(plan).filter((g): g is GardenPlan => g !== null)
