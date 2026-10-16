/**
 * 555 California Street — the Bank of America Center (SOM/Wurster, 1969), 52 storeys of carnelian granite.
 *
 * Why this is a model and not a preset (BUGS.md #120): the building's whole identity is that every face is a
 * SAWTOOTH. A projecting faceted bay window stands at every bay, the full height of the tower, so the wall
 * is a triangle wave in plan and the silhouette against the sky is a zigzag from any angle. `facade()` and
 * the tower grammar vary depth per STOREY and never per BAY, so no arrangement of slots can say it; the old
 * `fiveFiveFiveCalifornia` preset was a flat box with fins and reviewed 0.
 *
 * Where the teeth come from. They are NOT in the footprint the renderer hands a builder, whatever
 * `tools/ring-forms.ts` says: ring-forms scores the RAW OSM outline (65 vertices, 21 teeth, 76 m of saw),
 * but this building's outline is superseded by its `building:part`s, so `landmarks.ts` fits it to
 * `partsUnion(...).hull` — a convex 21-CORNER hull with the teeth smoothed away (84 x 44 m). The hull is the
 * envelope of the bay TIPS, which is exactly the right thing to follow: `serrate()` cuts the teeth INTO it,
 * tips on the hull line and valleys a bay-depth inside, so the model never grows outside its footprint and
 * the corners stay shared between edges.
 *
 * The bay is built once, in plan, and repeated: `serrate()` walks `towerRing(fit)` and returns one polyline
 * for the whole tower, and every band of the building (podium ledge, shaft, dark top, crenellated parapet)
 * is drawn against that same polyline. A tooth costs three quads over the tower's full height — the floors
 * are read by the landmark shader out of the UVs (uv in ROOMS, as in tower.ts), not cut as geometry, which
 * is what keeps 71 bays x 52 storeys inside the budget.
 *
 * Local frame: the fitted footprint's, +y up.
 */
import { capPolygon, type MeshBuilder } from '../../buildings.ts'
import { box, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import type { Fit } from '../fit.ts'
import { towerRing } from '../tower.ts'

type P2 = { x: number; z: number }

/** polished carnelian granite — red-brown, not grey and not black (the point of the building) */
const STONE: Rgb = [0.25, 0.12, 0.1]   // 0.6/0.255/0.19, then 0.4/…, still read brick-red in the city: the landmark material lifts reds a lot (skyline pass 2026-10-16)
/** the same stone in the shade: the recessed band under the parapet, the reveals */
const SHADE: Rgb = [0.16, 0.08, 0.065]
/** bronze-tinted glass, dark enough that the teeth read as stone edges against it */
const GLASS_C: Rgb = [0.13, 0.115, 0.12]
const ROOF_C: Rgb = [0.3, 0.29, 0.29]

const G = surfaceTag('granite')
const W = surfaceTag('glass')

/**
 * The facade's own constants — the same kind of number every tower preset carries (pitch, solid), not a
 * dimension of THIS building: the size, the plan and the height all come from the fit.
 */
/** bay (tooth) pitch, metres */
const BAY = 3.7
/** storey height, metres */
const FLOOR = 4.1
/** how deep the valley runs, as a share of the pitch */
const DEEP = 0.62
/** the stone pier at each tooth's tip, as a share of the pitch */
const TIP = 0.17

interface Profile {
  /** the serrated outline, anticlockwise */
  pts: P2[]
  /** true where segment i (pts[i] -> pts[i+1]) is the stone pier at a tooth's tip */
  stone: boolean[]
  /** the width of one tooth actually used, metres (for the UVs and the crenellations) */
  bay: number
}

/**
 * The footprint cut into teeth. Every edge of the hull is divided into whole bays; each bay runs from the
 * hull line (a narrow stone pier at the tip) in to `DEEP * pitch` at its middle and back out again. Both
 * ends of every edge sit ON the hull, so neighbouring edges share their corner and nothing has to be
 * patched there. An edge shorter than a bay — the chamfers at the two ends of the plan — stays flat stone.
 */
function serrate(ring: P2[]): Profile {
  const pts: P2[] = []
  const stone: boolean[] = []
  let bayUsed = BAY
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L < 0.2) continue
    const tx = (b.x - a.x) / L
    const tz = (b.z - a.z) / L
    // the OUTWARD normal: the ring is anticlockwise, so (dz, -dx) points out — a valley is a negative offset
    const nx = tz
    const nz = -tx
    const at = (u: number, o: number): P2 => ({ x: a.x + tx * u + nx * o, z: a.z + tz * u + nz * o })
    if (L < BAY) { pts.push(at(0, 0)); stone.push(true); continue }
    const n = Math.max(1, Math.round(L / BAY))
    const bw = L / n
    bayUsed = bw
    const q = bw * TIP
    const d = bw * DEEP
    // 0 -- q (pier) -- mid (valley) -- bw-q (pier) -- bw+q (pier) -- ...
    pts.push(at(0, 0)); stone.push(true)          // the half pier at the corner
    for (let k = 0; k < n; k++) {
      const u0 = k * bw
      const mid = u0 + bw / 2
      const t0 = u0 + q
      const t1 = u0 + bw - q
      // Each flank is STONE for the outer half and GLASS for the half nearest the valley: the granite is what
      // the building is, and the window sits in the fold, which is where the photographs put it. Keeping the
      // stone dominant is also what keeps the tower carnelian rather than a black mirror — with the flanks
      // wholly glazed it rendered as a dark slab whatever colour the stone was given.
      pts.push(at(t0, 0)); stone.push(true)
      pts.push(at(t0 + (mid - t0) * 0.5, -d * 0.5)); stone.push(false)
      pts.push(at(mid, -d)); stone.push(false)
      pts.push(at(mid + (t1 - mid) * 0.5, -d * 0.5)); stone.push(true)
      pts.push(at(t1, 0)); stone.push(true)          // across the tip, into the next bay
    }
  }
  return { pts, stone, bay: bayUsed }
}

/** One band of the serrated wall between y0 and y1: stone at the tips, glass on the flanks. */
function shaft(out: MeshBuilder, p: Profile, y0: number, y1: number, glass: Rgb, wall: Rgb, allStone = false): void {
  const floors = Math.max(1, Math.round((y1 - y0) / FLOOR))
  for (let i = 0; i < p.pts.length; i++) {
    const a = p.pts[i]
    const b = p.pts[(i + 1) % p.pts.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L < 0.05) continue
    const n: [number, number, number] = [(b.z - a.z) / L, 0, -(b.x - a.x) / L]
    const isStone = allStone || p.stone[i]
    const c = isStone ? wall : glass
    // uv in ROOMS along the face and up the floors, so the landmark shader lights a window at a time
    const u1 = L / (p.bay * 0.5)
    const v1 = floors
    out.quad([[a.x, y0, a.z], [b.x, y0, b.z], [b.x, y1, b.z], [a.x, y1, a.z]], n,
      [[0, 0], [u1, 0], [u1, v1], [0, v1]], c, isStone ? G : W)
  }
}

/**
 * The crown. In the photographs the bays do not stop at a cornice: the last storey is a recessed dark band
 * and then the stone of each tooth carries on past the roofline, so the top of the tower is crenellated —
 * a row of granite teeth against the sky, notched over the glass in the folds. Every STONE segment of the
 * profile is carried up, which is the tip pier and the outer half of each flank with it.
 */
function crenellations(out: MeshBuilder, p: Profile, y: number, h: number): void {
  for (let i = 0; i < p.pts.length; i++) {
    if (!p.stone[i]) continue
    const a = p.pts[i]
    const b = p.pts[(i + 1) % p.pts.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L < 0.05) continue
    const tx = (b.x - a.x) / L
    const tz = (b.z - a.z) / L
    const n: [number, number, number] = [tz, 0, -tx]
    const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
    out.quad([[a.x, y, a.z], [b.x, y, b.z], [b.x, y + h, b.z], [a.x, y + h, a.z]], n, uv, STONE, G)
    // the two cheeks, so a tooth has thickness seen along the parapet
    const ix = -tz * (p.bay * DEEP * 0.5)
    const iz = tx * (p.bay * DEEP * 0.5)
    out.quad([[a.x, y, a.z], [a.x + ix, y, a.z + iz], [a.x + ix, y + h, a.z + iz], [a.x, y + h, a.z]], [-tx, 0, -tz], uv, SHADE, G)
    out.quad([[b.x + ix, y, b.z + iz], [b.x, y, b.z], [b.x, y + h, b.z], [b.x + ix, y + h, b.z + iz]], [tx, 0, tz], uv, SHADE, G)
    out.quad([[a.x, y + h, a.z], [b.x, y + h, b.z], [b.x + ix, y + h, b.z + iz], [a.x + ix, y + h, a.z + iz]], [0, 1, 0], uv, STONE, G)
  }
}

/** The plaza-level storeys: a granite wall on the hull itself, its openings cut back between stone piers. */
function podium(out: MeshBuilder, ring: P2[], y0: number, y1: number): void {
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L < 0.2) continue
    const tx = (b.x - a.x) / L
    const tz = (b.z - a.z) / L
    const n: [number, number, number] = [tz, 0, -tx]
    const P = (u: number, y: number, o: number): [number, number, number] => [a.x + tx * u - tz * o, y, a.z + tz * u + tx * o]
    const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
    out.quad([P(0, y0, 0), P(L, y0, 0), P(L, y1, 0), P(0, y1, 0)], n, [[0, 0], [L / 3, 0], [L / 3, 2], [0, 2]], STONE, G)
    if (L < BAY) continue
    // The lobby glass between piers twice a bay apart. It is drawn a few centimetres PROUD of the granite,
    // the way `punched` does it in tower.ts: the wall behind it is a solid quad with no opening cut, so a
    // pane set back into it is simply hidden — which is how the first version of this podium came out.
    const n2 = Math.max(1, Math.round(L / (BAY * 2)))
    const bw = L / n2
    const o = -0.08
    for (let k = 0; k < n2; k++) {
      const u0 = k * bw + bw * 0.22
      const u1 = (k + 1) * bw - bw * 0.22
      out.quad([P(u0, y0, o), P(u1, y0, o), P(u1, y1 - (y1 - y0) * 0.18, o), P(u0, y1 - (y1 - y0) * 0.18, o)], n,
        [[0, 0], [2, 0], [2, 1], [0, 1]], GLASS_C, W)
      for (const [u, s] of [[u0, -1], [u1, 1]] as const) {
        out.quad([P(u, y0, 0), P(u, y0, o), P(u, y1, o), P(u, y1, 0)], [tx * s, 0, tz * s], uv, SHADE, G)
      }
    }
  }
}

export function fiveFiveFiveCalifornia(out: MeshBuilder, fit: Fit): void {
  const hull = towerRing(fit)
  const H = fit.height > 40 ? fit.height : 226
  const p = serrate(hull)
  // the plaza storeys, the ledge the bays stand on, the serrated shaft, the dark band under the parapet
  const base = FLOOR * 2.4
  const top = H - FLOOR * 0.9
  podium(out, hull, 0, base)
  capPolygon(out, hull, base, STONE, G)
  shaft(out, p, base, top, GLASS_C, STONE)
  shaft(out, p, top, H, SHADE, SHADE, true)
  crenellations(out, p, H, FLOOR * 0.55)
  capPolygon(out, p.pts, H, ROOF_C, 0)
  // the mechanical block on the roof, sized off the footprint rather than named
  const c = hull.reduce((acc, q) => ({ x: acc.x + q.x / hull.length, z: acc.z + q.z / hull.length }), { x: 0, z: 0 })
  box(out, c.x, H + FLOOR * 0.7, c.z, fit.hx * 0.24, FLOOR * 0.7, fit.hz * 0.4, SHADE, G)
}
