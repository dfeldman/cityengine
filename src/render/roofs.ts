/**
 * Roofs, which are most of a skyline.
 *
 * A city of flat-topped extrusions reads as a model of a city no matter how good the walls are, because the
 * line a building makes against the sky is the first thing the eye picks up and every flat roof makes the
 * same one. A Paris street is unmistakable largely because of its zinc mansards; a suburb is unmistakable
 * because of its gables.
 *
 * The hard way to do this properly is a straight skeleton — the general solution for putting a pitched roof
 * on an arbitrary polygon. It is a lot of code and it is fragile on the self-touching, near-degenerate rings
 * OSM is full of. What is here instead is four shapes that between them cover almost everything, each built
 * in a way that cannot fail on a bad ring:
 *
 *   **inset-and-raise** for hipped, pyramidal and mansard — walk the ring inwards by a fraction of its own
 *   size and lift it. That is exactly a hip on a rectangle, close enough on anything convex, and on a nasty
 *   concave ring it degenerates to something flatter rather than to garbage.
 *
 *   **ridge along the long axis** for gabled, using the footprint's own longest hull edge as the direction.
 *   Applied only when the footprint is nearly its own bounding box, which is when a gable is what a real
 *   roof would be; anything else falls back to a hip.
 *
 * The inset is done by moving each vertex along the bisector of its two edges, which keeps the shape rather
 * than shrinking it toward the centroid — the difference between a roof that follows the building and one
 * that slides off the end of a long terrace.
 */
import { MeshBuilder } from './buildings.ts'
import { capPolygon, capPolygonWithHoles } from './buildings.ts'
import type { RoofShape } from '../city/package.ts'

export type Pt = { x: number; z: number }

/** Signed area × 2; positive for one winding. */
function area2(ring: Pt[]): number {
  let a = 0
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i]
    const q = ring[(i + 1) % ring.length]
    a += p.x * q.z - q.x * p.z
  }
  return a
}

/**
 * Move every vertex inwards along the bisector of its two edges.
 *
 * Shrinking toward the centroid instead would pull the ends of a long terrace in as much as the sides, which
 * is not what a roof does. But a plain bisector offset has two traps, and both of them produce a roof with
 * its ridge BELOW its eaves — a funnel, which is exactly what appeared on the L-shaped and courtyard
 * footprints that OSM is full of:
 *
 *   * At a **reflex** corner — the inside of an L — the bisector points outwards, and the 1/cos term that
 *     makes a sharp convex corner travel further becomes an enormous step in the wrong direction.
 *   * Offsetting any concave ring far enough makes it **self-intersect**, and a bow-tie ring triangulates
 *     into a shape that folds through itself.
 *
 * So the step is never amplified where the corner turns the wrong way, and the result is checked: if it has
 * inverted, collapsed, or kept less than a quarter of its area, the ring falls back to a uniform shrink
 * toward the centroid, which cannot self-intersect on anything star-shaped.
 */
export function insetRing(ring: Pt[], by: number): Pt[] {
  const n = ring.length
  const a0 = area2(ring)
  const sign = a0 > 0 ? 1 : -1
  const out: Pt[] = []

  for (let i = 0; i < n; i++) {
    const prev = ring[(i - 1 + n) % n]
    const cur = ring[i]
    const next = ring[(i + 1) % n]

    const e1 = norm(cur.x - prev.x, cur.z - prev.z)
    const e2 = norm(next.x - cur.x, next.z - cur.z)
    const n1 = { x: -e1.z * sign, z: e1.x * sign }
    const n2 = { x: -e2.z * sign, z: e2.x * sign }
    let bx = n1.x + n2.x
    let bz = n1.z + n2.z
    const len = Math.hypot(bx, bz)
    if (len < 1e-4) {
      // the two edges double back on each other; step off one of them
      out.push({ x: cur.x + n1.x * by, z: cur.z + n1.z * by })
      continue
    }
    bx /= len
    bz /= len
    const cos = bx * n1.x + bz * n1.z
    // cos <= 0 is a reflex corner: step by `by` along the bisector and no further
    // clamped by magnitude, so a negative `by` (pushing outward) is limited the same way
    const step = cos > 0.45 ? Math.sign(by) * Math.min(Math.abs(by) / cos, Math.abs(by) * 2.2) : by
    out.push({ x: cur.x + bx * step, z: cur.z + bz * step })
  }

  const a1 = area2(out)
  const kept = Math.abs(a1) / Math.max(1e-6, Math.abs(a0))
  if (Math.sign(a1) !== Math.sign(a0) || kept < 0.25 || !out.every((p) => Number.isFinite(p.x) && Number.isFinite(p.z))) {
    return shrinkToCentroid(ring, by)
  }
  return out
}

/**
 * Is `top` a usable inset of `ring`: no edge crossing another, and every corner inside the original? The
 * area test in `insetRing` passes a ring that has FOLDED — on a U-shaped footprint (the Hôtel de Sully round
 * its courtyard) the mitred corners at the mouth of the U cross over, and the roof's slopes from the walls to
 * that folded top stretched across the courtyard as a thin slab in mid-air: the "floating lines" at cornice
 * height down Marais streets, whose buildings all default to hipped roofs.
 */
export function insetValid(ring: Pt[], top: Pt[]): boolean {
  const n = top.length
  const cross = (a: Pt, b: Pt, c: Pt, d: Pt): boolean => {
    const f = (p: Pt, q: Pt, r: Pt): number => (q.x - p.x) * (r.z - p.z) - (q.z - p.z) * (r.x - p.x)
    return f(a, b, c) * f(a, b, d) < 0 && f(c, d, a) * f(c, d, b) < 0
  }
  for (let i = 0; i < n; i++) {
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue
      if (cross(top[i], top[(i + 1) % n], top[j], top[(j + 1) % n])) return false
    }
  }
  const inside = (p: Pt): boolean => {
    let o = false
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      if ((ring[i].z > p.z) !== (ring[j].z > p.z) && p.x < ((ring[j].x - ring[i].x) * (p.z - ring[i].z)) / (ring[j].z - ring[i].z) + ring[i].x) o = !o
    }
    return o
  }
  return top.every(inside)
}

/** The deepest inset up to `by` that stays valid (halving down to a quarter), or null if none does. */
export function safeInset(ring: Pt[], by: number): Pt[] | null {
  for (let d = by; d >= by / 4 - 1e-6; d /= 2) {
    const top = insetRing(ring, d)
    if (insetValid(ring, top)) return top
  }
  return null
}

/** A uniform shrink about the centroid: cruder than an offset, but it cannot fold a ring through itself. */
function shrinkToCentroid(ring: Pt[], by: number): Pt[] {
  let cx = 0
  let cz = 0
  for (const p of ring) { cx += p.x; cz += p.z }
  cx /= ring.length
  cz /= ring.length
  let reach = 0
  for (const p of ring) reach = Math.max(reach, Math.hypot(p.x - cx, p.z - cz))
  const k = Math.max(0.35, Math.min(0.92, 1 - by / Math.max(1e-3, reach)))
  return ring.map((p) => ({ x: cx + (p.x - cx) * k, z: cz + (p.z - cz) * k }))
}

const norm = (x: number, z: number): Pt => {
  const l = Math.hypot(x, z) || 1
  return { x: x / l, z: z / l }
}

/** Roughly how wide the footprint is, used to scale insets so a roof suits its building. */
export function ringSize(ring: Pt[]): number {
  let minx = Infinity; let maxx = -Infinity; let minz = Infinity; let maxz = -Infinity
  for (const p of ring) {
    minx = Math.min(minx, p.x); maxx = Math.max(maxx, p.x)
    minz = Math.min(minz, p.z); maxz = Math.max(maxz, p.z)
  }
  return Math.min(maxx - minx, maxz - minz)
}

/** How nearly the footprint fills its own axis-aligned box, after rotating to its longest edge. */
function rectangularity(ring: Pt[], dir: number): number {
  const c = Math.cos(-dir)
  const s = Math.sin(-dir)
  let minu = Infinity; let maxu = -Infinity; let minv = Infinity; let maxv = -Infinity
  for (const p of ring) {
    const u = p.x * c - p.z * s
    const v = p.x * s + p.z * c
    minu = Math.min(minu, u); maxu = Math.max(maxu, u)
    minv = Math.min(minv, v); maxv = Math.max(maxv, v)
  }
  const box = (maxu - minu) * (maxv - minv)
  return box < 1e-6 ? 0 : Math.abs(area2(ring) / 2) / box
}

/** The bearing of the footprint's longest edge — a good enough ridge direction for a real building. */
export function longestEdgeDirection(ring: Pt[]): number {
  let best = 0
  let bestLen = -1
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    const l = Math.hypot(b.x - a.x, b.z - a.z)
    if (l > bestLen) { bestLen = l; best = Math.atan2(b.x - a.x, b.z - a.z) }
  }
  return best
}

/** A band of wall between two rings at different heights — the sloping part of every roof here. */
function skirt(out: MeshBuilder, lower: Pt[], upper: Pt[], y0: number, y1: number,
               colour: [number, number, number]): void {
  const n = lower.length
  for (let i = 0; i < n; i++) {
    const a = lower[i]
    const b = lower[(i + 1) % n]
    const c = upper[(i + 1) % n]
    const d = upper[i]
    // the face normal of the slope, so a roof catches the sun differently from the wall below it
    const ex = b.x - a.x
    const ez = b.z - a.z
    const ux = d.x - a.x
    const uy = y1 - y0
    const uz = d.z - a.z
    const nx = ez * uy - 0 * uz
    const ny = 0 * ux - ex * uz + ex * uz   // kept explicit; the slope's vertical component
    const nz = ex * uy * -1
    const len = Math.hypot(nx, ny, nz) || 1
    out.quad(
      [[a.x, y0, a.z], [b.x, y0, b.z], [c.x, y1, c.z], [d.x, y1, d.z]],
      [nx / len, Math.abs(uy) > 0 ? 0.55 : 0, nz / len],
      [[0, 0], [1, 0], [1, 1], [0, 1]], colour, 0,
    )
  }
}

export interface RoofSpec {
  shape: RoofShape
  /** eaves height, in metres */
  y: number
  height: number
  direction?: number
  colour: [number, number, number]
  /** a skillion's walls come up to its slope (see below) */
  walled?: boolean
}

/**
 * Build a roof on `ring`, returning the height it reaches. The wall builder uses that to know where the
 * building actually stops.
 */
export function buildRoof(out: MeshBuilder, ring: Pt[], spec: RoofSpec): number {
  const { y, colour } = spec
  const size = ringSize(ring)
  const h = Math.max(0, Math.min(spec.height, size * 0.9))

  if (spec.shape === 'flat' || h < 0.3 || ring.length < 3) {
    capPolygon(out, ring, y, colour, 0)
    return y
  }

  switch (spec.shape) {
    case 'pyramidal': {
      // every edge rises to a single point: a tower cap, a small pavilion
      let cx = 0
      let cz = 0
      for (const p of ring) { cx += p.x; cz += p.z }
      cx /= ring.length
      cz /= ring.length
      /*
       * Only where every edge can see the apex (the ring is star-shaped about it). Round a light court — an E or an L,
       * the Army and Navy YMCA on Steuart Street, OSM `roof:shape=pyramidal` on ten storeys — the fan's triangles
       * folded back over the apex and the roof turned inside out: from the street, no roof at all (owner, 2026-10-03).
       * Such a roof is flat.
       */
      let area = 0
      for (let i = 0; i < ring.length; i++) { const a = ring[i], b = ring[(i + 1) % ring.length]; area += a.x * b.z - b.x * a.z }
      for (let i = 0; i < ring.length; i++) {
        const a = ring[i], b = ring[(i + 1) % ring.length]
        if (((b.x - a.x) * (cz - a.z) - (b.z - a.z) * (cx - a.x)) * area <= 0) { capPolygon(out, ring, y, colour, 0); return y }
      }
      for (let i = 0; i < ring.length; i++) {
        const a = ring[i]
        const b = ring[(i + 1) % ring.length]
        const base = out.positions.length / 3
        const nx = (a.z - b.z)
        const nz = (b.x - a.x)
        const l = Math.hypot(nx, nz) || 1
        for (const v of [[a.x, y, a.z], [b.x, y, b.z], [cx, y + h, cz]] as [number, number, number][]) {
          out.positions.push(v[0], v[1], v[2])
          out.normals.push(nx / l * 0.7, 0.7, nz / l * 0.7)
          out.uvs.push(0, 0)
          out.colors.push(colour[0], colour[1], colour[2], 0)
        }
        out.indices.push(base, base + 2, base + 1)
      }
      return y + h
    }

    case 'mansard': {
      // Paris. A steep lower slope that is most of the roof's height, then a shallow deck on top. The steep
      // part is where the dormers go, and it is what makes a Paris roofline read from three streets away.
      // both insets checked for folding (see `insetValid`); failing that, a flat top — never a slab in the air
      const steep = safeInset(ring, Math.min(size * 0.16, h * 0.7))
      if (!steep) { capPolygon(out, ring, y, colour, 0); return y }
      skirt(out, ring, steep, y, y + h * 0.78, colour)
      const deck = safeInset(steep, Math.min(size * 0.1, h * 0.3))
      if (!deck) { capPolygon(out, steep, y + h * 0.78, colour, 0); return y + h * 0.78 }
      skirt(out, steep, deck, y + h * 0.78, y + h, colour)
      capPolygon(out, deck, y + h, colour, 0)
      return y + h
    }

    case 'skillion': {
      // one flat plane tilted to a single fall — a lean-to, a modern extension
      const dir = spec.direction ?? longestEdgeDirection(ring)
      const ux = Math.cos(dir)
      const uz = -Math.sin(dir)
      let lo = Infinity
      let hi = -Infinity
      for (const p of ring) {
        const t = p.x * ux + p.z * uz
        lo = Math.min(lo, t); hi = Math.max(hi, t)
      }
      const span = Math.max(1e-3, hi - lo)
      const raised = ring.map((p) => ({ ...p }))
      // build it as a cap whose vertices are lifted by where they fall across the slope
      const base = out.positions.length / 3
      const flat: number[] = []
      for (const p of raised) flat.push(p.x, p.z)
      for (const p of raised) {
        const t = (p.x * ux + p.z * uz - lo) / span
        out.positions.push(p.x, y + h * t, p.z)
        out.normals.push(-ux * 0.5, 0.86, -uz * 0.5)
        out.uvs.push(p.x / 2.4, p.z / 2.4)
        out.colors.push(colour[0], colour[1], colour[2], 0)
      }
      const tris = earcutRing(raised)
      const flip = area2(raised) > 0
      for (let i = 0; i < tris.length; i += 3) {
        if (flip) out.indices.push(base + tris[i], base + tris[i + 2], base + tris[i + 1])
        else out.indices.push(base + tris[i], base + tris[i + 1], base + tris[i + 2])
      }
      // and the gable wall it leaves at the high end
      skirt(out, ring, ring, y, y, colour)
      /*
       * …which had no height, and the walls stop at the eaves (owner, 2026-10-30, the Tours Société Générale, 48.891995, 2.230358: "the roofs
       * are tilted into the sky"): 30 m of open wedge under a plane in the air. Where a region asks (`walled`), up to the plane all round.
       */
      if (spec.walled) {
        for (let i = 0; i < ring.length; i++) {
          const a = ring[i], b = ring[(i + 1) % ring.length]
          const ya = y + h * ((a.x * ux + a.z * uz - lo) / span), yb = y + h * ((b.x * ux + b.z * uz - lo) / span)
          const ex = b.x - a.x, ez = b.z - a.z, l = Math.hypot(ex, ez) || 1
          const n: [number, number, number] = [ez / l * (area2(ring) > 0 ? 1 : -1), 0, -ex / l * (area2(ring) > 0 ? 1 : -1)]
          // (both ways round: a ring's winding is not promised here, and the wedge is seen from outside only)
          out.quad([[a.x, y, a.z], [b.x, y, b.z], [b.x, yb, b.z], [a.x, ya, a.z]], n, [[0, 0], [1, 0], [1, 1], [0, 1]], colour, 0)
          out.quad([[b.x, y, b.z], [a.x, y, a.z], [a.x, ya, a.z], [b.x, yb, b.z]], [-n[0], 0, -n[2]], [[0, 0], [1, 0], [1, 1], [0, 1]], colour, 0)
        }
      }
      return y + h
    }

    case 'gabled': {
      const dir = spec.direction ?? longestEdgeDirection(ring)
      // A gable only makes sense on something shaped like a box. On an L or a crescent the ridge would run
      // out through a wall, so those get a hip, which always fits.
      if (rectangularity(ring, dir) > 0.78) {
        const ridge = ridgeLine(ring, dir, h, y)
        gable(out, ring, dir, y, h, colour, ridge)
        return y + h
      }
      // fall through to hipped
    }
    // eslint-disable-next-line no-fallthrough
    case 'hipped':
    default: {
      const inset = Math.min(size * 0.38, h * 1.1)
      const top = safeInset(ring, inset)
      // nothing valid (a very concave footprint): a flat roof is wrong for the style but never floats
      if (!top) { capPolygon(out, ring, y, colour, 0); return y }
      // a shallower inset keeps the slope: the roof rises only as high as its reduced inset allows
      const got = ringSize(top) < size ? Math.min(h, (size - ringSize(top)) * 1.4) : h
      skirt(out, ring, top, y, y + got, colour)
      capPolygon(out, top, y + got, colour, 0)
      return y + got
    }
  }
}

/** The two ends of the ridge, along `dir`, centred across the footprint. */
function ridgeLine(ring: Pt[], dir: number, _h: number, _y: number): [Pt, Pt] {
  const ux = Math.sin(dir)
  const uz = Math.cos(dir)
  const px = Math.cos(dir)
  const pz = -Math.sin(dir)
  let lo = Infinity
  let hi = -Infinity
  let cross = 0
  let n = 0
  for (const p of ring) {
    const t = p.x * ux + p.z * uz
    lo = Math.min(lo, t); hi = Math.max(hi, t)
    cross += p.x * px + p.z * pz
    n++
  }
  // the middle of the footprint across the ridge, not the mean of its corners — a run of extra vertices down one
  // side pulled the ridge off centre and the two slopes came out unequal
  void cross; void n
  let clo = Infinity, chi = -Infinity
  for (const p of ring) { const v = p.x * px + p.z * pz; clo = Math.min(clo, v); chi = Math.max(chi, v) }
  const c = (clo + chi) / 2
  const shrink = (hi - lo) * 0.0
  return [
    { x: ux * (lo + shrink) + px * c, z: uz * (lo + shrink) + pz * c },
    { x: ux * (hi - shrink) + px * c, z: uz * (hi - shrink) + pz * c },
  ]
}

/** Two slopes meeting at a ridge, with a triangular gable wall at each end. */
function gable(out: MeshBuilder, ring: Pt[], dir: number, y: number, h: number,
               colour: [number, number, number], ridge: [Pt, Pt]): void {
  const ux = Math.sin(dir)
  const uz = Math.cos(dir)
  const along = (p: Pt): number => p.x * ux + p.z * uz
  const r0 = along(ridge[0])
  const r1 = along(ridge[1])
  const lift = (p: Pt): Pt => p
  const wound = -area2(ring)

  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    // where each eave point projects onto the ridge
    const ta = Math.min(1, Math.max(0, (along(a) - r0) / (r1 - r0 || 1)))
    const tb = Math.min(1, Math.max(0, (along(b) - r0) / (r1 - r0 || 1)))
    const ra = { x: ridge[0].x + (ridge[1].x - ridge[0].x) * ta, z: ridge[0].z + (ridge[1].z - ridge[0].z) * ta }
    const rb = { x: ridge[0].x + (ridge[1].x - ridge[0].x) * tb, z: ridge[0].z + (ridge[1].z - ridge[0].z) * tb }
    // the slope's outward normal, whichever way the footprint is wound: wound clockwise, (a.z - b.z, b.x - a.x)
    // points INTO the building, the quad is turned to face down and culled — half a roof missing over the flat
    // top below (owner's screenshot of Sausalito's new revival blocks, 2026-10-02)
    const sgn = wound > 0 ? 1 : -1
    const nx = (a.z - b.z) * sgn
    const nz = (b.x - a.x) * sgn
    const l = Math.hypot(nx, nz) || 1
    out.quad(
      [[a.x, y, a.z], [b.x, y, b.z], [rb.x, y + h, rb.z], [ra.x, y + h, ra.z]],
      [(nx / l) * 0.6, 0.8, (nz / l) * 0.6],
      [[0, 0], [1, 0], [1, 1], [0, 1]], colour, 0,
    )
    void lift
  }
}

/** earcut on a single ring, kept here so roofs do not need to know about the atlas. */
function earcutRing(ring: Pt[]): number[] {
  const flat: number[] = []
  for (const p of ring) flat.push(p.x, p.z)
  return earcutImpl(flat)
}

import earcut from 'earcut'
const earcutImpl = (flat: number[]): number[] => earcut(flat)

/**
 * What stands on a roof, by region: Paris's terracotta chimney pots and its dormers (lucarnes). From any
 * raised view these are the single biggest "this is Paris" signal there is — a mansard with nothing on it
 * reads as a lid.
 */
export interface Roofscape { chimneys: boolean; dormers: boolean; pots?: string; waterTanks?: boolean }

export interface RoofscapeContext {
  /** the building's wall colour; the stacks are built of the same stone, darkened */
  wall: [number, number, number]
  /** the facade plan's bay width, so dormers line up with the windows below */
  bayWidth: number
  /** the atlas cell a dormer's face shows, or null to leave it plain */
  dormerUV: { u0: number; v0: number; u1: number; v1: number } | null
  seed: number
  /** storeys, for the rule that only a tall building carries a water tank */
  levels?: number
}

const KIND_WALL_PAGE = 0
const KIND_ATLAS_CELL = 1

/** Where a roof's slope is, `yo` metres above the eaves: how far in from the wall it has come. */
function slopeRun(spec: RoofSpec, ring: Pt[]): { run: number; rise: number } | null {
  const size = ringSize(ring)
  const h = Math.max(0, Math.min(spec.height, size * 0.9))
  if (h < 0.3) return null
  if (spec.shape === 'mansard') return { run: Math.min(size * 0.16, h * 0.7), rise: h * 0.78 }
  if (spec.shape === 'hipped') return { run: Math.min(size * 0.38, h * 1.1), rise: h }
  return null
}

/**
 * Chimney stacks and dormers, added to a roof `buildRoof` has already built. Returns where they went, for
 * the tests. Pure geometry into `out`, in the building's own material: the stacks and dormer cheeks on the
 * wall page, the dormer faces from the atlas.
 */
export function addRoofscape(out: MeshBuilder, ring: Pt[], spec: RoofSpec, rs: Roofscape, ctx: RoofscapeContext)
  : { stacks: { x: number; z: number; top: number }[]; dormers: { x: number; z: number; y: number }[] } {
  const stacks: { x: number; z: number; top: number }[] = []
  const dormers: { x: number; z: number; y: number }[] = []
  if (ring.length < 3) return { stacks, dormers }
  const size = ringSize(ring)
  const h = Math.max(0, Math.min(spec.height, size * 0.9))
  const top = spec.y + (spec.shape === 'flat' ? 0 : h)
  const r = rngOf(ctx.seed ^ 0x3c6ef372)

  // the walls, outward normal (uz, −ux) for a counter-clockwise ring
  const walls = ring.map((a, i) => {
    const b = ring[(i + 1) % ring.length]
    const len = Math.hypot(b.x - a.x, b.z - a.z)
    return { a, b, len, ux: (b.x - a.x) / (len || 1), uz: (b.z - a.z) / (len || 1) }
  })
  // (uz, −ux) points out of a ring whose signed area is positive, which is how the bake packs them
  const ccw = area2(ring) > 0 ? 1 : -1

  if (rs.chimneys) {
    /*
     * One stack per 9 m of the longest wall, 0.5 m in from it, rising 1.6 m clear of the roof. A Paris
     * stack stands on the party wall and carries a row of pots; the pots, not the stack, are what the eye
     * reads from the street.
     */
    const w = walls.reduce((p, q) => (q.len > p.len ? q : p))
    const n = Math.max(1, Math.floor(w.len / 9))
    const stone: [number, number, number] = [ctx.wall[0] * 0.8, ctx.wall[1] * 0.8, ctx.wall[2] * 0.8]
    const pot = hexToRgb(rs.pots === 'terracotta' || !rs.pots ? '#b4532a' : rs.pots)
    const nx = w.uz * ccw
    const nz = -w.ux * ccw
    // clear of the roof, but no taller than a real stack: on a steep pavilion roof ridge + 1.6 m is a pillar
    const stackTop = Math.min(top + 1.6, spec.y + 5.5)
    for (let k = 0; k < n; k++) {
      const t = (w.len * (k + 0.5)) / n
      const cx = w.a.x + w.ux * t - nx * 0.8
      const cz = w.a.z + w.uz * t - nz * 0.8
      const ang = Math.atan2(w.ux, w.uz)
      box(out, cx, cz, spec.y - 0.2, stackTop, 0.9, 0.6, ang, stone)
      // a coping slab, a little proud, then the pots
      box(out, cx, cz, stackTop, stackTop + 0.08, 1.0, 0.7, ang, [stone[0] * 0.9, stone[1] * 0.9, stone[2] * 0.9])
      const pots = 2 + Math.floor(r() * 3)
      for (let j = 0; j < pots; j++) {
        const along = ((j + 0.5) / pots - 0.5) * 0.7
        cylinder(out, cx + w.ux * along, cz + w.uz * along, stackTop + 0.08, stackTop + 0.58, 0.125, pot)
      }
      stacks.push({ x: cx, z: cz, top: stackTop + 0.58 })
    }
  }

  /*
   * New York's rooftop water tanks: a cedar barrel on a steel stand with a conical cap, on one flat roof in
   * three above four storeys, set back from the parapet. The skyline of every New York neighbourhood.
   */
  if (rs.waterTanks && spec.shape === 'flat' && (ctx.levels ?? 0) > 4 && r() < 1 / 3 && size > 9) {
    // somewhere inside the roof, 3 m in from the edge: a point on the ring moved inwards
    const inner = insetRing(ring, 3)
    if (inner.length >= 3) {
      const p = inner[Math.floor(r() * inner.length)]
      const q = inner[(inner.indexOf(p) + 1) % inner.length]
      const cx = (p.x + q.x) / 2
      const cz = (p.z + q.z) / 2
      const steel: [number, number, number] = [0.2, 0.2, 0.22]
      const cedar: [number, number, number] = [0.45, 0.32, 0.22]
      for (const [dx, dz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) box(out, cx + dx * 1.1, cz + dz * 1.1, top, top + 2, 0.12, 0.12, 0, steel)
      box(out, cx, cz, top + 1.9, top + 2.05, 3.2, 3.2, 0, steel)
      cylinder(out, cx, cz, top + 2.05, top + 6.05, 1.5, cedar)
      cone(out, cx, cz, top + 6.05, top + 7.1, 1.6, steel)
      stacks.push({ x: cx, z: cz, top: top + 7.1 })
    }
  }

  const slope = rs.dormers ? slopeRun(spec, ring) : null
  if (slope) {
    /*
     * Dormers: one over every other bay of the wall below, set into the steep slope a metre above the
     * eaves. The face stands vertical where the slope is at that height, and the cheeks run back into the
     * roof until the slope has passed over the dormer's own top — so it always meets the roof, whatever the
     * pitch, and never pokes out behind it.
     */
    const W = 1.2
    const H = 1.5
    const base = 1.0
    const capRise = 0.45
    if (base + H + capRise < slope.rise) {
      const inAt = (yo: number): number => (slope.run * yo) / slope.rise
      for (const w of walls) {
        if (w.len < 4) continue
        const bays = Math.max(1, Math.round(w.len / Math.max(1.6, ctx.bayWidth)))
        const nx = w.uz * ccw
        const nz = -w.ux * ccw
        const face = inAt(base)
        const back = inAt(base + H + capRise) + 0.3
        // every other bay, never the end bays, where the hips meet
        for (let i = 1; i < bays - 1; i += 2) {
          const t = (w.len * (i + 0.5)) / bays
          const p = (dt: number, off: number, y: number): [number, number, number] =>
            [w.a.x + w.ux * (t + dt) - nx * off, spec.y + y, w.a.z + w.uz * (t + dt) - nz * off]
          const y0 = base
          const y1 = base + H
          const hw = W / 2
          // the face, with a window in it
          const uv = ctx.dormerUV
          out.quad([p(-hw, face, y0), p(hw, face, y0), p(hw, face, y1), p(-hw, face, y1)], [nx, 0, nz],
            uv ? [[uv.u0, uv.v1], [uv.u1, uv.v1], [uv.u1, uv.v0], [uv.u0, uv.v0]] : [[0, 0], [1, 0], [1, 1], [0, 1]],
            ctx.wall, uv ? KIND_ATLAS_CELL : KIND_WALL_PAGE)
          // the cheeks, running back into the slope
          out.quad([p(-hw, back, y0), p(-hw, face, y0), p(-hw, face, y1), p(-hw, back, y1)], [-w.ux, 0, -w.uz],
            [[0, 0], [0.4, 0], [0.4, 0.6], [0, 0.6]], ctx.wall, KIND_WALL_PAGE)
          out.quad([p(hw, face, y0), p(hw, back, y0), p(hw, back, y1), p(hw, face, y1)], [w.ux, 0, w.uz],
            [[0, 0], [0.4, 0], [0.4, 0.6], [0, 0.6]], ctx.wall, KIND_WALL_PAGE)
          // a small pitched cap in the roof's colour, ridge running back into the roof
          const ridge = y1 + capRise
          out.quad([p(-hw - 0.08, face - 0.1, y1), p(0, face - 0.1, ridge), p(0, back, ridge), p(-hw - 0.08, back, y1)],
            [-w.ux * 0.6, 0.8, -w.uz * 0.6], [[0, 0], [0.3, 0], [0.3, 0.6], [0, 0.6]], spec.colour, KIND_WALL_PAGE)
          out.quad([p(0, face - 0.1, ridge), p(hw + 0.08, face - 0.1, y1), p(hw + 0.08, back, y1), p(0, back, ridge)],
            [w.ux * 0.6, 0.8, w.uz * 0.6], [[0, 0], [0.3, 0], [0.3, 0.6], [0, 0.6]], spec.colour, KIND_WALL_PAGE)
          // and the little gable over the face
          out.quad([p(-hw - 0.08, face - 0.1, y1), p(hw + 0.08, face - 0.1, y1), p(0, face - 0.1, ridge), p(0, face - 0.1, ridge)],
            [nx, 0, nz], [[0, 0], [0.4, 0], [0.2, 0.2], [0.2, 0.2]], ctx.wall, KIND_WALL_PAGE)
          const c = p(0, face, y0)
          dormers.push({ x: c[0], z: c[2], y: c[1] })
        }
      }
    }
  }
  return { stacks, dormers }
}

/** An upright box on the wall page, rotated by `ang` (a bearing), no bottom. */
function box(out: MeshBuilder, cx: number, cz: number, y0: number, y1: number, w: number, d: number, ang: number,
             tint: [number, number, number]): void {
  const s = Math.sin(ang)
  const c = Math.cos(ang)
  // local x along the bearing's right, z along it
  const pt = (lx: number, lz: number, y: number): [number, number, number] =>
    [cx + lx * c + lz * s, y, cz - lx * s + lz * c]
  const hx = w / 2
  const hz = d / 2
  const sides: [number, number, number, number, [number, number, number]][] = [
    [-hx, -hz, hx, -hz, [-s, 0, -c]], [hx, -hz, hx, hz, [c, 0, -s]],
    [hx, hz, -hx, hz, [s, 0, c]], [-hx, hz, -hx, -hz, [-c, 0, s]],
  ]
  const tall = (y1 - y0) / 2.4
  for (const [ax, az, bx, bz, n] of sides) {
    out.quad([pt(ax, az, y0), pt(bx, bz, y0), pt(bx, bz, y1), pt(ax, az, y1)], n,
      [[0, 0], [w / 2.4, 0], [w / 2.4, tall], [0, tall]], tint, KIND_WALL_PAGE)
  }
  out.quad([pt(-hx, -hz, y1), pt(hx, -hz, y1), pt(hx, hz, y1), pt(-hx, hz, y1)], [0, 1, 0],
    [[0, 0], [0.3, 0], [0.3, 0.3], [0, 0.3]], tint, KIND_WALL_PAGE)
}

/** An eight-sided pot, open-topped look given by a darker rim. */
function cylinder(out: MeshBuilder, cx: number, cz: number, y0: number, y1: number, radius: number,
                  tint: [number, number, number]): void {
  const n = 8
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2
    const a1 = ((i + 1) / n) * Math.PI * 2
    const am = (a0 + a1) / 2
    out.quad([
      [cx + Math.sin(a0) * radius, y0, cz + Math.cos(a0) * radius],
      [cx + Math.sin(a1) * radius, y0, cz + Math.cos(a1) * radius],
      [cx + Math.sin(a1) * radius * 0.85, y1, cz + Math.cos(a1) * radius * 0.85],
      [cx + Math.sin(a0) * radius * 0.85, y1, cz + Math.cos(a0) * radius * 0.85],
    ], [Math.sin(am), 0.1, Math.cos(am)], [[0, 0], [0.1, 0], [0.1, 0.2], [0, 0.2]], tint, KIND_WALL_PAGE)
  }
  const dark: [number, number, number] = [tint[0] * 0.35, tint[1] * 0.35, tint[2] * 0.35]
  const pts: [number, number, number][] = []
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    pts.push([cx + Math.sin(a) * radius * 0.85, y1, cz + Math.cos(a) * radius * 0.85])
  }
  for (let i = 0; i < n; i += 2) {
    out.quad([pts[i], pts[(i + 1) % n], pts[(i + 2) % n], [cx, y1, cz]], [0, 1, 0],
      [[0, 0], [0.05, 0], [0.05, 0.05], [0, 0.05]], dark, KIND_WALL_PAGE)
  }
}

/** A conical cap: eight sloping triangles to a point. */
function cone(out: MeshBuilder, cx: number, cz: number, y0: number, y1: number, radius: number,
              tint: [number, number, number]): void {
  const n = 8
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2
    const a1 = ((i + 1) / n) * Math.PI * 2
    const am = (a0 + a1) / 2
    out.quad([
      [cx + Math.sin(a0) * radius, y0, cz + Math.cos(a0) * radius],
      [cx + Math.sin(a1) * radius, y0, cz + Math.cos(a1) * radius],
      [cx, y1, cz], [cx, y1, cz],
    ], [Math.sin(am) * 0.7, 0.7, Math.cos(am) * 0.7], [[0, 0], [0.1, 0], [0.1, 0.1], [0, 0.1]], tint, KIND_WALL_PAGE)
  }
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255]
}

function rngOf(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * A roof round courtyards: the building is a band between its outer ring and its courts, so the roof slopes up
 * from the outer walls AND from the court walls to a flat top between them, with the courts open to the sky.
 * Pitched shapes (hipped, mansard, gabled…) all become this; the courts' own slopes face into the court.
 * Where the band is too thin for both slopes to fit (the insets would cross), a flat top with holes instead —
 * never a roof across a courtyard.
 */
export function buildRoofAroundCourts(out: MeshBuilder, ring: Pt[], holes: Pt[][], spec: RoofSpec): number {
  const { y, colour } = spec
  const flat = (): number => { capPolygonWithHoles(out, [ring, ...holes], y, colour, 0); return y }
  if (spec.shape === 'flat' || spec.height < 0.3) return flat()
  // how deep the slopes may run: tried deep first, then shallower until the band takes them
  const size = ringSize(ring)
  const inside = (r: Pt[], p: Pt): boolean => {
    let o = false
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      if ((r[i].z > p.z) !== (r[j].z > p.z) && p.x < ((r[j].x - r[i].x) * (p.z - r[i].z)) / (r[j].z - r[i].z) + r[i].x) o = !o
    }
    return o
  }
  for (let d = Math.min(size * 0.16, spec.height * 0.9, 4); d >= 0.75; d *= 0.7) {
    const outer = safeInset(ring, d)
    if (!outer) continue
    const grown = holes.map((h) => grow(h, d))
    const ok = grown.every((g, k) => g.every((p) => inside(outer, p))
      && grown.every((o, m) => m === k || g.every((p) => !inside(o, p)))
      // grown, not folded: the same winding as the court and a larger area
      && Math.sign(area2(g)) === Math.sign(area2(holes[k])) && Math.abs(area2(g)) > Math.abs(area2(holes[k])))
    if (!ok) continue
    // a steep roof whatever the depth: a mansard-like pitch, never a gentle slope on a narrow band
    const h = Math.min(spec.height, Math.max(d * 1.25, 2.5))
    skirt(out, ring, outer, y, y + h, colour)
    holes.forEach((hole, k) => skirt(out, hole, grown[k], y, y + h, colour))
    capPolygonWithHoles(out, [outer, ...grown], y + h, colour, 0)
    return y + h
  }
  return flat()
}

/** A clockwise court ring pushed outward (into the building) by `d`. */
function grow(hole: Pt[], d: number): Pt[] {
  // insetRing moves toward a ring's interior whatever its winding; the court's interior is the court itself,
  // so a negative inset pushes out into the building
  return insetRing(hole, -d)
}
