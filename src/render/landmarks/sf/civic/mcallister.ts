/**
 * The McAllister Tower (100 McAllister Street; Lewis P. Hobart with Miller & Pflueger, 1929–30): the William P. Temple
 * Methodist "skyscraper church", now UC Law San Francisco's residence. A buff/tan brick Gothic Art Deco slab seen from
 * all of Civic Center (Mapillary way-256042681-01..08, way-1258861097-01/02):
 *
 * - the SHAFT: continuous brick piers running the whole height, the windows in narrow RECESSED STRIPS between them
 *   with darker spandrels at every floor, solid corner piers with a single window a floor; the strips end under
 *   pointed (Gothic) heads;
 * - the BASE: two storeys of pointed Gothic arches in cast-stone hoods over a granite plinth, a string course;
 * - the CROWN: above the 96 m line the middle of every face carries on up while the corners step back in three
 *   stages, every pier standing up through each stage's crenellated parapet under a short pointed cap, and the
 *   flagpole on top (the photographs show no spire);
 * - the WINGS (OSM building:parts of the same outline): two 15-storey wings flush with the tower's McAllister and
 *   Leavenworth fronts, and a 6-storey base wing behind, all in the same brick, strips and pinnacled parapets.
 *
 * The parts share walls. Each builder recognises which part it was fitted to by matching its ring against the real
 * part outlines (below, metres east/north), which tells it where its neighbours stand: on a shared wall only the
 * TALLER part draws (plainly up to the neighbour's roof, dressed above it), so no two faces ever lie in one plane.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { capPolygon } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { box, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { simplifyRing } from '../../tower.ts'

type P2 = { x: number; z: number }
type V3 = [number, number, number]

const BRICK: Rgb = [0.7, 0.675, 0.63]
const BASE: Rgb = [0.66, 0.635, 0.59]
const TRIM: Rgb = [0.83, 0.79, 0.7]
const PLINTH: Rgb = [0.56, 0.54, 0.5]
const SPANDREL: Rgb = [0.42, 0.4, 0.37]
const GLASS: Rgb = [0.13, 0.15, 0.18]
const OPENING: Rgb = [0.1, 0.1, 0.11]
const ROOF: Rgb = [0.46, 0.44, 0.41]
const METAL: Rgb = [0.72, 0.72, 0.72]
const T_BRICK = surfaceTag('brick')
const T_STONE = surfaceTag('ashlar')
const T_GLASS = surfaceTag('glass')
const T_GRANITE = surfaceTag('granite')

/** the ground storey's top: two storeys of arches */
const GROUND = 8.6
/** recess of the window strips behind the pier faces */
const D = 0.42
/** the wings' and the base wing's heights (OSM gives levels only: 15 and 6 storeys) */
const WING_H = 56
const BASE_H = 24
const TOWER_H = 114
/** the shaft's top, where the crown's setbacks begin */
const SHAFT = 96

/**
 * The four building:parts of way/256042681, metres east and north of a common origin (OSM nodes; the shared walls
 * share their nodes). Heights as above.
 */
const PARTS: { key: 'tower' | 'north' | 'south' | 'base'; h: number; ring: [number, number][] }[] = [
  { key: 'tower', h: TOWER_H, ring: [[208.6, -1.7], [209.6, -8.1], [212.3, -24.3], [234.4, -20.8], [230.8, 2.0], [214.8, -0.6]] },
  { key: 'north', h: WING_H, ring: [[214.8, -0.6], [212.1, 18.1], [227.9, 20.6], [230.8, 2.0]] },
  { key: 'base', h: BASE_H, ring: [[212.1, 18.1], [186.6, 14.1], [190.6, -11.3], [209.6, -8.1], [208.6, -1.7], [214.8, -0.6]] },
  { key: 'south', h: WING_H, ring: [[209.6, -8.1], [212.3, -24.3], [193.1, -27.3], [190.6, -11.3]] },
]

/**
 * The two street fronts, McAllister (south) and Leavenworth (east), as the polyline of the outline's corners along
 * them. The other outside walls stand on lot lines: plain brick with punched windows over the neighbours' roofs
 * (way-256042681-02, -06), not the dressed fronts.
 */
const STREETS: [number, number][] = [[193.1, -27.3], [234.4, -20.8], [227.9, 20.6]]

/** Whether the wall a→b lies along the street polyline (both its ends within half a metre of one leg). */
function onStreet(a: P2, b: P2, st: P2[]): boolean {
  const d = (p: P2, c: P2, e: P2): number => {
    const L2 = (e.x - c.x) ** 2 + (e.z - c.z) ** 2 || 1
    const t = Math.max(0, Math.min(1, ((p.x - c.x) * (e.x - c.x) + (p.z - c.z) * (e.z - c.z)) / L2))
    return Math.hypot(c.x + (e.x - c.x) * t - p.x, c.z + (e.z - c.z) * t - p.z)
  }
  for (let i = 0; i + 1 < st.length; i++) if (d(a, st[i], st[i + 1]) < 0.6 && d(b, st[i], st[i + 1]) < 0.6) return true
  return false
}

const area2 = (r: P2[]): number => r.reduce((s, p, i) => { const q = r[(i + 1) % r.length]; return s + p.x * q.z - q.x * p.z }, 0)
const ccw = (r: P2[]): P2[] => (area2(r) >= 0 ? r : [...r].reverse())
function areaCentroid(r: P2[]): P2 {
  let a = 0, cx = 0, cz = 0
  for (let i = 0; i < r.length; i++) {
    const p = r[i], q = r[(i + 1) % r.length]
    const c = p.x * q.z - q.x * p.z
    a += c; cx += (p.x + q.x) * c; cz += (p.z + q.z) * c
  }
  if (Math.abs(a) < 1e-6) return { x: r.reduce((s, p) => s + p.x, 0) / r.length, z: r.reduce((s, p) => s + p.z, 0) / r.length }
  return { x: cx / (3 * a), z: cz / (3 * a) }
}

/**
 * Where the four parts stand in THIS model's frame: the part whose outline the fitted ring is (any of `keys`), found
 * by a rigid fit (rotation about the area centroid, mirrored or not), and every part carried by the same transform.
 * Null when the ring is none of them (a test fit, a changed OSM outline): the caller then builds on the ring alone.
 */
function locate(fit: Fit, keys: string[]): { self: number; rings: P2[][]; streets: P2[] } | null {
  const q = fit.ring && fit.ring.length >= 3 ? ccw(fit.ring) : null
  if (!q) return null
  const cq = areaCentroid(q)
  let best: { err: number; self: number; mirror: boolean; th: number } | null = null
  for (const mirror of [false, true]) {
    const world = PARTS.map((p) => ccw(p.ring.map(([x, z]) => ({ x, z: mirror ? -z : z }))))
    for (let s = 0; s < PARTS.length; s++) {
      if (!keys.includes(PARTS[s].key)) continue
      const cp = areaCentroid(world[s])
      const rel = world[s].map((p) => ({ x: p.x - cp.x, z: p.z - cp.z }))
      const score = (th: number): number => {
        const c = Math.cos(th), sn = Math.sin(th)
        const m = rel.map((p) => ({ x: cq.x + p.x * c - p.z * sn, z: cq.z + p.x * sn + p.z * c }))
        let worst = 0
        for (const v of q) worst = Math.max(worst, Math.min(...m.map((w) => Math.hypot(w.x - v.x, w.z - v.z))))
        // and every corner of the part must be on the fitted outline's corners or edges (no smaller ring matches)
        for (const w of m) {
          let near = Infinity
          for (let i = 0; i < q.length; i++) {
            const a = q[i], b = q[(i + 1) % q.length]
            const L2 = (b.x - a.x) ** 2 + (b.z - a.z) ** 2 || 1
            const t = Math.max(0, Math.min(1, ((w.x - a.x) * (b.x - a.x) + (w.z - a.z) * (b.z - a.z)) / L2))
            near = Math.min(near, Math.hypot(a.x + (b.x - a.x) * t - w.x, a.z + (b.z - a.z) * t - w.z))
          }
          worst = Math.max(worst, near)
        }
        return worst
      }
      let bt = 0, be = Infinity
      for (let k = 0; k < 720; k++) { const th = (k / 720) * Math.PI * 2; const e = score(th); if (e < be) { be = e; bt = th } }
      for (let k = -10; k <= 10; k++) { const th = bt + k * 0.0005 * Math.PI * 2 / 1; const e = score(th); if (e < be) { be = e; bt = th } }
      if (!best || be < best.err) best = { err: be, self: s, mirror, th: bt }
    }
  }
  if (!best || best.err > 1.5) return null
  const world = PARTS.map((p) => ccw(p.ring.map(([x, z]) => ({ x, z: best!.mirror ? -z : z }))))
  const cp = areaCentroid(world[best.self])
  const c = Math.cos(best.th), sn = Math.sin(best.th)
  const move = (p: P2): P2 => {
    const x = p.x - cp.x, z = p.z - cp.z
    return { x: cq.x + x * c - z * sn, z: cq.z + x * sn + z * c }
  }
  const rings = world.map((r) => r.map(move))
  const streets = STREETS.map(([x, z]) => move({ x, z: best!.mirror ? -z : z }))
  return { self: best.self, rings, streets }
}

/** For each edge of part `self`, the height of the part on its other side (0: none, a street or a neighbour's lot). */
function neighbours(rings: P2[][], self: number): number[] {
  const r = rings[self]
  return r.map((a, i) => {
    const b = r[(i + 1) % r.length]
    let h = 0
    rings.forEach((o, j) => {
      if (j === self) return
      for (let k = 0; k < o.length; k++) {
        const c = o[k], d = o[(k + 1) % o.length]
        if (Math.hypot(c.x - b.x, c.z - b.z) < 0.4 && Math.hypot(d.x - a.x, d.z - a.z) < 0.4) h = Math.max(h, PARTS[j].h)
      }
    })
    return h
  })
}

/* ---------------------------------------------------------------- drawing on one straight wall */

/** A straight wall from a to b (outward normal on its right, the ring being anticlockwise): u along, o outward. */
class Wall {
  readonly L: number
  readonly tx: number
  readonly tz: number
  readonly nx: number
  readonly nz: number
  constructor(readonly out: MeshBuilder, readonly a: P2, b: P2) {
    this.L = Math.hypot(b.x - a.x, b.z - a.z)
    this.tx = (b.x - a.x) / (this.L || 1)
    this.tz = (b.z - a.z) / (this.L || 1)
    this.nx = this.tz
    this.nz = -this.tx
  }
  P(u: number, y: number, o: number): V3 {
    return [this.a.x + this.tx * u + this.nx * o, y, this.a.z + this.tz * u + this.nz * o]
  }
  /** a rectangle facing out, `o` metres out of the wall's plane */
  rect(u0: number, u1: number, y0: number, y1: number, o: number, c: Rgb, tag: number, uv?: [number, number][]): void {
    if (u1 - u0 < 0.01 || y1 - y0 < 0.01) return
    this.out.quad([this.P(u0, y0, o), this.P(u1, y0, o), this.P(u1, y1, o), this.P(u0, y1, o)], [this.nx, 0, this.nz],
      uv ?? [[0, 0], [1, 0], [1, 1], [0, 1]], c, tag)
  }
  /** a polygon in the wall's plane, fanned from its first point (convex) */
  fan(pts: [number, number][], o: number, c: Rgb, tag: number): void {
    for (let i = 1; i + 1 < pts.length; i += 2) {
      const p3 = pts[Math.min(i + 2, pts.length - 1)]
      this.out.quad([this.P(pts[0][0], pts[0][1], o), this.P(pts[i][0], pts[i][1], o), this.P(pts[i + 1][0], pts[i + 1][1], o),
        this.P(p3[0], p3[1], o)], [this.nx, 0, this.nz], [[0, 0], [1, 0], [1, 1], [0, 1]], c, tag)
    }
  }
  /** a side face at u, between offsets o0..o1, facing +u (s = 1) or −u (s = −1) */
  cheek(u: number, y0: number, y1: number, o0: number, o1: number, s: number, c: Rgb, tag: number): void {
    this.out.quad([this.P(u, y0, o0), this.P(u, y0, o1), this.P(u, y1, o1), this.P(u, y1, o0)], [this.tx * s, 0, this.tz * s],
      [[0, 0], [1, 0], [1, 1], [0, 1]], c, tag)
  }
  /** a level face at y over u0..u1 and offsets o0..o1, facing up (or down) */
  flat(u0: number, u1: number, y: number, o0: number, o1: number, up: boolean, c: Rgb, tag: number): void {
    this.out.quad([this.P(u0, y, o0), this.P(u1, y, o0), this.P(u1, y, o1), this.P(u0, y, o1)], [0, up ? 1 : -1, 0],
      [[0, 0], [1, 0], [1, 1], [0, 1]], c, tag)
  }
  /** a band standing `d` proud between y0 and y1 (front, top, soffit, and the cheeks asked for) */
  band(u0: number, u1: number, y0: number, y1: number, d: number, c: Rgb, tag: number, cheeks: [boolean, boolean]): void {
    this.rect(u0, u1, y0, y1, d, c, tag)
    this.flat(u0, u1, y1, 0, d, true, c, tag)
    this.flat(u0, u1, y0, 0, d, false, c, tag)
    if (cheeks[0]) this.cheek(u0, y0, y1, 0, d, -1, c, tag)
    if (cheeks[1]) this.cheek(u1, y0, y1, 0, d, 1, c, tag)
  }
  /**
   * A pier's pinnacle standing off the parapet: a square shaft (its back `o0`, its face `o1`) and a pointed cap —
   * the Gothic termination every pier of the building has.
   */
  pinnacle(u: number, y0: number, w: number, o0: number, o1: number, shaft: number, cap: number, c: Rgb): void {
    const u0 = u - w / 2, u1 = u + w / 2
    const y1 = y0 + shaft
    this.rect(u0, u1, y0, y1, o1, c, T_STONE)
    this.cheek(u0, y0, y1, o0, o1, -1, c, T_STONE)
    this.cheek(u1, y0, y1, o0, o1, 1, c, T_STONE)
    // the back, seen from the tier above
    this.out.quad([this.P(u1, y0, o0), this.P(u0, y0, o0), this.P(u0, y1, o0), this.P(u1, y1, o0)], [-this.nx, 0, -this.nz],
      [[0, 0], [1, 0], [1, 1], [0, 1]], c, T_STONE)
    const apex = this.P(u, y1 + cap, (o0 + o1) / 2)
    const ring = [this.P(u0, y1, o1), this.P(u1, y1, o1), this.P(u1, y1, o0), this.P(u0, y1, o0)]
    const mid: P2 = { x: (ring[0][0] + ring[2][0]) / 2, z: (ring[0][2] + ring[2][2]) / 2 }
    for (let i = 0; i < 4; i++) {
      const p = ring[i], q = ring[(i + 1) % 4]
      const nx = (p[0] + q[0]) / 2 - mid.x, nz = (p[2] + q[2]) / 2 - mid.z
      const l = Math.hypot(nx, nz) || 1
      this.out.quad([p, q, apex, apex], [nx / l, 0.5, nz / l], [[0, 0], [1, 0], [0.5, 1], [0.5, 1]], c, T_STONE)
    }
  }
}

/** A pointed (equilateral) Gothic arch's outline: the jambs from y0, springing at ys, the apex over centre c. */
function pointed(c: number, w: number, y0: number, ys: number): [number, number][] {
  const r = w
  const pts: [number, number][] = [[c, (y0 + ys) / 2], [c - w / 2, y0 + 0.001], [c - w / 2, ys]]
  // left arc: centred on the right springing point, from the left springing point up to the apex
  for (let k = 1; k <= 2; k++) {
    const a = Math.PI - (k / 2) * (Math.PI / 3)
    pts.push([c + w / 2 + Math.cos(a) * r, ys + Math.sin(a) * r])
  }
  for (let k = 1; k >= 0; k--) {
    const a = (k / 2) * (Math.PI / 3)
    pts.push([c - w / 2 + Math.cos(a) * r, ys + Math.sin(a) * r])
  }
  pts.push([c + w / 2, y0 + 0.001], [c - w / 2, y0 + 0.001])
  return pts
}

interface FaceOpts {
  /** a street front (piers, strips, arcade, pinnacles) or a lot-line wall (plain brick, punched windows) */
  street: boolean
  /** the run's ends: true where the wall turns a corner of the building, false where another part carries on */
  corner: [boolean, boolean]
  /** the run starts at the street: the arcaded ground storey */
  ground: boolean
  /** the run ends at this part's roof: the parapet and its pinnacles */
  top: boolean
  floor: number
  pitch: number
  /** corner pier width */
  cornerW: number
  /** pinnacle height over the parapet (0: a plain battlemented parapet) */
  pin: number
  /** windows in the corner piers */
  cornerWindows: boolean
}

/** A lot-line wall: plain brick, a window a bay a floor, a coped parapet. */
function rear(w: Wall, y0: number, y1: number, f: FaceOpts): void {
  const L = w.L
  w.rect(0, L, y0, y1, 0, BRICK, T_BRICK)
  const ys = f.ground ? GROUND : y0 + 0.5
  const ye = f.top ? y1 - 0.6 : y1 - 0.3
  const nf = Math.max(0, Math.floor((ye - ys) / f.floor))
  const nb = Math.floor((L - 1.6) / 3.2)
  if (nf && nb > 0) {
    const bw = (L - 1.6) / nb
    for (let i = 0; i < nb; i++) {
      const c = 0.8 + bw * (i + 0.5)
      for (let k = 0; k < nf; k++) {
        const y = ys + k * f.floor
        w.rect(c - 0.55, c + 0.55, y + 0.9, y + f.floor - 0.6, 0.03, GLASS, T_GLASS)
      }
    }
  }
  if (f.top) {
    const PH = 0.9
    w.rect(0, L, y1, y1 + PH, 0, BRICK, T_BRICK)
    const back0 = f.corner[0] ? 0.3 : 0
    w.out.quad([w.P(L, y1, -0.3), w.P(back0, y1, -0.3), w.P(back0, y1 + PH, -0.3), w.P(L, y1 + PH, -0.3)], [-w.nx, 0, -w.nz],
      [[0, 0], [1, 0], [1, 1], [0, 1]], BRICK, T_BRICK)
    w.flat(back0, L, y1 + PH, -0.3, 0, true, TRIM, T_STONE)
  }
}

/** One dressed run of wall from a to b between y0 and y1: piers, recessed strips, spandrels, base and parapet. */
function face(out: MeshBuilder, a: P2, b: P2, y0: number, y1: number, f: FaceOpts): void {
  const w = new Wall(out, a, b)
  const L = w.L
  if (L < 0.5) return
  const JOINT = 0.45
  const mS = f.corner[0] ? Math.min(f.cornerW, L * 0.22) : JOINT
  const mE = f.corner[1] ? Math.min(f.cornerW, L * 0.22) : JOINT
  const span = L - mS - mE
  const n = span < 1.6 ? 0 : Math.max(1, Math.round(span / f.pitch))
  const pitch = n ? span / n : 0
  const sw = Math.min(1.4, pitch * 0.6)
  const strips: [number, number][] = []
  for (let i = 0; i < n; i++) { const c = mS + pitch * (i + 0.5); strips.push([c - sw / 2, c + sw / 2]) }

  if (!f.street) { rear(w, y0, y1, f); return }
  const yb = f.ground ? GROUND : y0
  const PARA = 1.9
  const ys = f.ground ? GROUND + 0.9 : y0 + 0.45
  const ye = f.top ? y1 - PARA : y1 - 0.45
  const nf = Math.max(1, Math.round((ye - ys) / f.floor))
  const fh = (ye - ys) / nf

  // the piers and the wall over and under each strip, flush with the outline
  if (!n) w.rect(0, L, yb, y1, 0, BRICK, T_BRICK)
  else {
    let u = 0
    for (const [s0, s1] of strips) {
      w.rect(u, s0, yb, y1, 0, BRICK, T_BRICK)
      w.rect(s0, s1, yb, ys, 0, BRICK, T_BRICK)
      w.rect(s0, s1, ye, y1, 0, BRICK, T_BRICK)
      u = s1
    }
    w.rect(u, L, yb, y1, 0, BRICK, T_BRICK)
  }
  // the strips: dark glass in a deep reveal, a darker spandrel at each floor, a pointed head at the top
  if (ye - ys > 1.5) {
    for (const [s0, s1] of strips) {
      w.rect(s0, s1, ys, ye, -D, GLASS, T_GLASS, [[0, 0], [1, 0], [1, nf], [0, nf]])
      w.cheek(s0, ys, ye, -D, 0, 1, BRICK, T_BRICK)
      w.cheek(s1, ys, ye, -D, 0, -1, BRICK, T_BRICK)
      w.flat(s0, s1, ye, -D, 0, false, BRICK, T_BRICK)
      w.flat(s0, s1, ys, -D, 0, true, TRIM, T_STONE)
      for (let k = 1; k < nf; k++) w.rect(s0, s1, ys + k * fh - 0.6, ys + k * fh + 0.45, -D + 0.03, SPANDREL, T_BRICK)
      if (f.top) {
        const c = (s0 + s1) / 2
        const hh = Math.min(1.3, fh * 0.45)
        w.fan([[s0, ye - hh], [s0, ye], [c, ye], [c, ye]], -D + 0.04, BRICK, T_BRICK)
        w.fan([[s1, ye - hh], [c, ye], [s1, ye], [s1, ye]], -D + 0.04, BRICK, T_BRICK)
      }
    }
  }
  // one window a floor in each corner pier
  if (f.cornerWindows && ye - ys > 3) {
    for (const [on, m, at] of [[f.corner[0], mS, mS / 2], [f.corner[1], mE, L - mE / 2]] as const) {
      if (!on || m < 1.8) continue
      for (let k = 0; k < nf; k++) {
        const y = ys + k * fh
        w.rect(at - 0.48, at + 0.48, y + 0.55, y + fh - 0.55, 0.03, GLASS, T_GLASS)
      }
    }
  }

  // the ground storey: a granite plinth, the brick wall and its pointed arches in cast-stone hoods, a string course
  if (f.ground) {
    w.rect(0, L, 0, GROUND, 0, BASE, T_BRICK)
    w.band(0, L, 0, 0.9, 0.14, PLINTH, T_GRANITE, [f.corner[0], f.corner[1]])
    const arches = n ? strips.map(([s0, s1]) => (s0 + s1) / 2) : L > 3 ? [L / 2] : []
    const aw = Math.min(2.3, (n ? pitch : L) * 0.78)
    const apex = GROUND - 0.7
    const spring = apex - aw * 0.866
    for (const c of arches) {
      const hood = aw + 0.5
      w.fan(pointed(c, hood, 0.9, apex + 0.25 - hood * 0.866), 0.03, TRIM, T_STONE)
      w.fan(pointed(c, aw, 0.9, spring), 0.06, OPENING, T_GLASS)
      // the transom across the arch, where the second storey's floor is
      w.rect(c - aw / 2, c + aw / 2, spring - 2.2, spring - 1.95, 0.08, TRIM, T_STONE)
    }
    w.band(0, L, GROUND - 0.15, GROUND + 0.45, 0.3, TRIM, T_STONE, [f.corner[0], f.corner[1]])
  }

  // the parapet: a cast-stone coping over a band, and every pier carried up as a pinnacle
  if (f.top) {
    const ext = f.corner[1] ? 0.22 : 0
    w.band(0, L + ext, y1 - 1.0, y1 - 0.55, 0.22, TRIM, T_STONE, [false, f.corner[1]])
    const PH = 1.0
    w.rect(0, L, y1, y1 + PH, 0, BRICK, T_BRICK)
    const back0 = f.corner[0] ? 0.3 : 0
    w.out.quad([w.P(L, y1, -0.3), w.P(back0, y1, -0.3), w.P(back0, y1 + PH, -0.3), w.P(L, y1 + PH, -0.3)], [-w.nx, 0, -w.nz],
      [[0, 0], [1, 0], [1, 1], [0, 1]], BRICK, T_BRICK)
    w.flat(back0, L, y1 + PH, -0.3, 0, true, TRIM, T_STONE)
    if (f.pin > 0) {
      const piers: number[] = []
      for (let i = 0; i + 1 < strips.length; i++) piers.push((strips[i][1] + strips[i + 1][0]) / 2)
      if (strips.length) {
        if (f.corner[0]) piers.push(Math.max(0.5, strips[0][0] - 0.55))
        if (f.corner[1]) piers.push(Math.min(L - 0.5, strips[strips.length - 1][1] + 0.55))
      }
      for (const u of piers) w.pinnacle(u, y1 + PH, 0.75, -0.55, 0.12, f.pin * 0.6, f.pin * 0.4, TRIM)
      // the corner's own, bigger, where this run ends at a corner (the next run starts there and leaves it)
      if (f.corner[1]) w.pinnacle(L - 0.55, y1 + PH, 1.1, -1.1, 0.0, f.pin * 0.75, f.pin * 0.55, TRIM)
    }
  }
}

/* ---------------------------------------------------------------- one part */

const collinear = (r: P2[], i: number, j: number): boolean => {
  const a = r[i], b = r[(i + 1) % r.length], c = r[j], d = r[(j + 1) % r.length]
  const t1 = Math.atan2(b.z - a.z, b.x - a.x), t2 = Math.atan2(d.z - c.z, d.x - c.x)
  let dd = Math.abs(t1 - t2)
  if (dd > Math.PI) dd = 2 * Math.PI - dd
  return dd < 0.07
}

interface PartOpts { floor: number; pitch: number; cornerW: number; pin: number; cornerWindows: boolean }

/**
 * A part on its ring up to `top`: every edge dressed where it is exposed, plain where a lower neighbour hides its
 * foot, left out where a taller neighbour's wall stands in it; then its roof.
 */
function dressPart(out: MeshBuilder, ring: P2[], cover: number[], street: boolean[], H: number, top: number, o: PartOpts): void {
  const N = ring.length
  // the edge's state at height y: 'out' (dressed), 'plain' (a lower neighbour in front), 'none' (a taller one owns it)
  const state = (i: number, y: number): 'out' | 'plain' | 'none' => cover[i] >= H ? 'none' : y < cover[i] ? 'plain' : 'out'
  const breaks = [...new Set([0, top, ...cover.filter((c) => c > 0 && c < top)])].sort((p, q) => p - q)
  type Run = { s: number; e: number; c: [boolean, boolean]; y0: number; y1: number }
  const runs: Run[] = []
  for (let bi = 0; bi + 1 < breaks.length; bi++) {
    const y0 = breaks[bi], y1 = breaks[bi + 1], ym = (y0 + y1) / 2
    for (let i = 0; i < N; i++) {
      const st = state(i, ym)
      if (st === 'plain') new Wall(out, ring[i], ring[(i + 1) % N]).rect(0, Math.hypot(ring[(i + 1) % N].x - ring[i].x, ring[(i + 1) % N].z - ring[i].z), y0, y1, 0, BRICK, T_BRICK)
    }
    // runs of exposed, collinear edges, started where the edge before is not part of one
    const exposed = (i: number): boolean => state(((i % N) + N) % N, ym) === 'out'
    for (let i = 0; i < N; i++) {
      if (!exposed(i)) continue
      const p = (i - 1 + N) % N
      if (exposed(p) && collinear(ring, p, i) && street[p] === street[i]) {
        // a run's middle, unless the whole ring is one collinear loop (never, for a building)
        continue
      }
      let e = i
      while (exposed((e + 1) % N) && collinear(ring, e, (e + 1) % N) && street[(e + 1) % N] === street[i] && (e + 1) % N !== i) e = (e + 1) % N
      const run: Run = { s: i, e, c: [exposed(p), exposed((e + 1) % N)], y0, y1 }
      const prev = runs.find((r) => r.s === run.s && r.e === run.e && r.c[0] === run.c[0] && r.c[1] === run.c[1] && r.y1 === y0)
      if (prev) prev.y1 = y1
      else runs.push(run)
    }
  }
  for (const r of runs) {
    face(out, ring[r.s], ring[(r.e + 1) % N], r.y0, r.y1, {
      street: street[r.s], corner: r.c, ground: r.y0 === 0, top: r.y1 === top, floor: o.floor, pitch: o.pitch, cornerW: o.cornerW, pin: o.pin,
      cornerWindows: o.cornerWindows,
    })
  }
  capPolygon(out, ring, top, ROOF, 0)
}

/** The ring as built on: the fitted part from `locate`, or the fitted ring itself when it matched nothing. */
function partOf(fit: Fit, keys: string[]): { ring: P2[]; cover: number[]; street: boolean[]; key: string } {
  const at = locate(fit, keys)
  if (at) {
    const ring = at.rings[at.self]
    return { ring, cover: neighbours(at.rings, at.self), street: ring.map((p, i) => onStreet(p, ring[(i + 1) % ring.length], at.streets)),
      key: PARTS[at.self].key }
  }
  const ring = fit.ring && fit.ring.length >= 3 ? ccw(simplifyRing(fit.ring)) : ccw([
    { x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }])
  return { ring, cover: ring.map(() => 0), street: ring.map(() => true), key: '' }
}

/** Consecutive collinear edges merged: the crown's tiers are drawn in from the plain shape. */
function merged(ring: P2[]): P2[] {
  const keep = ring.filter((_, i) => !collinear(ring, (i - 1 + ring.length) % ring.length, i))
  return keep.length >= 3 ? keep : ring
}

/**
 * The plain outline with every convex corner cut back `c` metres each way: the stepped-corner plan of a Gothic deco
 * crown. Returns which of its corners are convex (a real corner of the building) and which are the re-entrant ones.
 */
function notched(r: P2[], c: number): { ring: P2[]; convex: boolean[] } {
  const N = r.length
  const out: P2[] = []
  const convex: boolean[] = []
  for (let i = 0; i < N; i++) {
    const a = r[(i - 1 + N) % N], p = r[i], b = r[(i + 1) % N]
    const li = Math.hypot(p.x - a.x, p.z - a.z), lo = Math.hypot(b.x - p.x, b.z - p.z)
    const ti = { x: (p.x - a.x) / li, z: (p.z - a.z) / li }, to = { x: (b.x - p.x) / lo, z: (b.z - p.z) / lo }
    const cc = Math.min(c, li * 0.4, lo * 0.4)
    if (ti.x * to.z - ti.z * to.x <= 0.2 || cc < 0.8) { out.push(p); convex.push(ti.x * to.z - ti.z * to.x > 0); continue }
    const A = { x: p.x - ti.x * cc, z: p.z - ti.z * cc }
    out.push(A, { x: A.x + to.x * cc, z: A.z + to.z * cc }, { x: p.x + to.x * cc, z: p.z + to.z * cc })
    convex.push(true, false, true)
  }
  return { ring: out, convex }
}

const near = (h: number, want: number): number => (h > want * 0.85 && h < want * 1.15 ? h : want)

export const MCALLISTER_TOWER: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** The tower: the dressed shaft to 96 m over its arcaded base, then the crown's three corner setbacks and the flag. */
  mcallisterTower: (out: MeshBuilder, fit: Fit): void => {
    const H = near(fit.height, TOWER_H)
    const k = H / TOWER_H
    const shaft = SHAFT * k
    // the tower is dressed all round: above the wings every face of it is seen across Civic Center
    const { ring, cover } = partOf(fit, ['tower'])
    dressPart(out, ring, cover, ring.map(() => true), H, shaft, { floor: 3.3, pitch: 2.35, cornerW: 2.7, pin: 1.7, cornerWindows: true })
    // the crown: the middle of every face carries on up while the corners step back in three stages (the profile
    // way-256042681-03 and -08 show), each stage under its own crenellated, pier-capped parapet
    const plain = merged(ring)
    const stages = [{ notch: 2.6, to: 103 }, { notch: 5.0, to: 109.5 }, { notch: 7.2, to: TOWER_H }]
    let y = shaft
    let tr = plain
    for (const st of stages) {
      const { ring: nr, convex } = notched(plain, st.notch)
      tr = nr
      const y1 = st.to * k
      for (let i = 0; i < tr.length; i++) {
        face(out, tr[i], tr[(i + 1) % tr.length], y, y1, {
          street: true, corner: [convex[i], convex[(i + 1) % tr.length]], ground: false, top: true, floor: 3.3, pitch: 2.4, cornerW: 1.4,
          pin: 1.5, cornerWindows: false,
        })
      }
      capPolygon(out, tr, y1, ROOF, 0)
      y = y1
    }
    // the flagpole the photographs show over the crown, and its flag
    let cx = 0, cz = 0
    for (const p of plain) { cx += p.x; cz += p.z }
    cx /= plain.length; cz /= plain.length
    box(out, cx, y + 5, cz, 0.08, 5, 0.08, METAL, surfaceTag('metal'))
    const e0 = { x: plain[1].x - plain[0].x, z: plain[1].z - plain[0].z }
    const l0 = Math.hypot(e0.x, e0.z) || 1
    new Wall(out, { x: cx, z: cz }, { x: cx + (e0.x / l0) * 2.4, z: cz + (e0.z / l0) * 2.4 }).rect(0, 2.4, y + 8.4, y + 9.9, 0, [0.68, 0.24, 0.2], 0)
  },

  /**
   * The wings (north, south and the six-storey base wing): the same brick, strips and pinnacled parapet, dressed
   * only where they are not against the tower or each other.
   */
  mcallisterWing: (out: MeshBuilder, fit: Fit): void => {
    const { ring, cover, street, key } = partOf(fit, ['north', 'south', 'base'])
    // a recognised part stands at its own height, so the shared walls' bookkeeping matches what its neighbours draw;
    // an unrecognised ring at the manifest's
    const H = key === 'base' ? BASE_H : key ? WING_H : fit.height || WING_H
    dressPart(out, ring, cover, street, H, H, {
      floor: 3.3, pitch: 2.35, cornerW: 2.4, pin: key === "base" ? 1.0 : 1.4, cornerWindows: true,
    })
  },
}
