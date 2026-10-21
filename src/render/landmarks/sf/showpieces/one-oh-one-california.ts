/**
 * 101 California Street (Johnson/Burgee, 1982): 48 storeys, 183 m, the block of California, Davis, Pine and Front.
 * From the Mapillary frames (p3/refs/way-1279505488) and the Commons photographs "101 California Street 2021
 * front.jpg", "101 California Street entrance side.JPG" and "101 California St plaza.jpg" (2026-10-21).
 *
 * What the photographs show — and it is not the banded granite drum the old preset drew:
 *  - the TOWER is a SAWTOOTH cylinder ~58 m across: some eighty narrow facets of dark reflective glass, each
 *    returned to the next by a short, nearly radial face of pink-grey granite, so the drum reads as fine pale
 *    vertical ribs on glass — glass where it faces you, ribs closing up toward the edges;
 *  - the top is flat, but the drum STEPS IN three times over its last ten storeys, which rounds its shoulders
 *    in every distant view;
 *  - the drum does not come down to the ground: its lowest seven storeys are cut back, and its soffit, ~28 m up,
 *    stands on a ring of tall square pink-granite PIERS — "the exposed structural columns";
 *  - inside the pier line on the plaza side, the seven-storey glass LOBBY: white-framed glass walls, and above
 *    them a glazed roof that climbs in a CASCADE of sloping tiers into the cut-back drum. OSM draws its front as
 *    a notch in the tower part (way/436484078): a radial wall in line with the annex's plaza face, and a long
 *    wall facing north-west onto the plaza;
 *  - the ANNEX (two `building:part`s, 4 storeys): plain pink-beige granite with square punched windows, along
 *    Front Street and the plaza's diagonal, and a sliver of it on the Pine side;
 *  - the granite plaza (California and Davis) with terraced planters, here only the terrace along the annex.
 *
 * THE FRAME. The city hands this entry the CONVEX HULL of its four parts (the outline is superseded by them at
 * bake, and the manifest asks for no `plan: "union"`), while the showcase hands it the real outline; neither has
 * the tower's own edge. So the building is drawn from OSM's own coordinates (metres east/north of the outline's
 * label point, from the Overpass cache, 2026-10-21) and placed by matching their hull to the hull of `fit.ring` —
 * the same in both, whatever the ring's detail.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import type { Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'

type P2 = { x: number; z: number }
type V3 = [number, number, number]
const T = { granite: surfaceTag('granite'), glass: surfaceTag('glass'), concrete: surfaceTag('concrete') }
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

const RIB: Rgb = [0.76, 0.68, 0.65]        // the drum's granite returns, pink-grey
const GLASS: Rgb = [0.2, 0.26, 0.32]      // its dark reflective glass
const PIER: Rgb = [0.78, 0.7, 0.67]
const SOFFIT: Rgb = [0.7, 0.64, 0.6]
const CORE: Rgb = [0.66, 0.6, 0.57]        // the granite walls deep in the cut-back storeys
const LOBBY: Rgb = [0.38, 0.45, 0.5]       // clear lobby glass, lighter than the tower's
const FRAME: Rgb = [0.9, 0.9, 0.88]        // the lobby's white frames
const ANNEX: Rgb = [0.8, 0.73, 0.67]
const HOLE: Rgb = [0.13, 0.14, 0.16]
const ROOF: Rgb = [0.5, 0.49, 0.48]
const PAVE: Rgb = [0.7, 0.67, 0.63]

// ------------------------------------------------------------------------------------- OSM, metres E/N

/** The outline, way/1279505488 (tower part + annex), its sawtooth thinned to every other point. */
const OUTLINE: [number, number][] = [
  [-69.6, 44.1], [-60.4, -16.8], [-56.7, -38.3], [-27.3, -34.0], [-29.6, -19.1], [-26.2, -22.0], [-22.3, -24.7],
  [-17.6, -26.1], [-12.6, -27.0], [-7.0, -26.9], [-2.8, -26.1], [1.4, -25.4], [1.9, -29.0], [24.6, -25.2],
  [14.3, -17.5], [17.8, -12.6], [19.8, -6.5], [20.8, 0.2], [20.2, 6.2], [17.9, 10.3], [14.6, 16.7], [10.4, 20.9],
  [3.9, 25.4], [-2.2, 27.7], [-8.7, 28.7], [-14.8, 27.9], [-25.6, 12.6], [-29.7, 15.6],
]
/** The drum, fitted (least squares) to the tower part's sawtooth: centre, nose radius, root radius. */
const C0: P2 = { x: -8.12, z: 0.32 }
const R_NOSE = 29.2
const R_ROOT = 28.3
const TEETH = 80
/** The lobby's notch: the radial wall's outer end, the inner corner, the plaza wall's outer end. */
const N1: P2 = { x: -29.7, z: 15.6 }
const N2: P2 = { x: -25.6, z: 12.6 }
const N3: P2 = { x: -14.8, z: 27.9 }
/** The annex, simplified: along Front Street and the plaza diagonal (436484073), and the Pine sliver (1279505487). */
const ANNEX_W: [number, number][] = [
  [-69.6, 44.1], [-60.4, -16.8], [-56.7, -38.3], [-27.3, -34.0], [-29.6, -19.1], [-33.0, -13.1], [-35.8, -6.1],
  [-36.6, 0.5], [-35.3, 6.7], [-33.4, 12.7], [-29.7, 15.6],
]
const ANNEX_S: [number, number][] = [[1.9, -29.0], [24.6, -25.2], [14.3, -17.5], [10.2, -20.5], [5.7, -23.0], [1.4, -25.4]]

/** Heights, metres. */
const Y = { sink: -2, soffit: 28, lobbyGlass: 9, annex: 16.5 }

// ------------------------------------------------------------------------------------- placing it

const area = (r: P2[]): number => { let a = 0; for (let i = 0; i < r.length; i++) { const p = r[i], q = r[(i + 1) % r.length]; a += p.x * q.z - q.x * p.z } return a / 2 }
const ccw = (r: P2[]): P2[] => (area(r) >= 0 ? r : [...r].reverse())

function hull(pts: P2[]): P2[] {
  const p = [...pts].sort((a, b) => a.x - b.x || a.z - b.z)
  const cross = (o: P2, a: P2, b: P2): number => (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x)
  const lo: P2[] = [], hi: P2[] = []
  for (const q of p) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q) }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (hi.length >= 2 && cross(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop(); hi.push(q) }
  return [...lo.slice(0, -1), ...hi.slice(0, -1)]
}

function centroid(r: P2[]): P2 {
  let a = 0, x = 0, z = 0
  for (let i = 0; i < r.length; i++) {
    const p = r[i], q = r[(i + 1) % r.length]
    const k = p.x * q.z - q.x * p.z
    a += k; x += (p.x + q.x) * k; z += (p.z + q.z) * k
  }
  return { x: x / (3 * a), z: z / (3 * a) }
}

/** Distance from p to the polygon's boundary. */
function toBoundary(p: P2, r: P2[]): number {
  let best = Infinity
  for (let i = 0; i < r.length; i++) {
    const a = r[i], b = r[(i + 1) % r.length]
    const dx = b.x - a.x, dz = b.z - a.z
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / (dx * dx + dz * dz || 1)))
    best = Math.min(best, Math.hypot(p.x - a.x - dx * t, p.z - a.z - dz * t))
  }
  return best
}

/**
 * The map from OSM's metres east/north into the model's frame: the rotation (the city's frame is a pure rotation
 * of east/north, inFrame in render/landmarks.ts) and translation that lay the hull of OUTLINE on the hull of
 * `fit.ring`. Searched over the whole turn and refined; a few hundred point-to-edge distances each step.
 */
function placement(fit: Fit): { at: (p: P2) => P2; dir: (x: number, z: number) => [number, number] } {
  const src = hull(OUTLINE.map(([x, z]) => ({ x, z })))
  const gs = centroid(src)
  const ring = fit.ring && fit.ring.length >= 3 ? fit.ring : null
  if (!ring) return { at: (p) => ({ x: p.x - gs.x, z: p.z - gs.z }), dir: (x, z) => [x, z] }
  const dst = ccw(hull(ring))
  const gd = centroid(dst)
  const err = (th: number): number => {
    const c = Math.cos(th), s = Math.sin(th)
    let e = 0
    for (const p of src) {
      const dx = p.x - gs.x, dz = p.z - gs.z
      e += toBoundary({ x: gd.x + dx * c - dz * s, z: gd.z + dx * s + dz * c }, dst)
    }
    return e
  }
  let best = 0, be = Infinity
  for (let k = 0; k < 360; k += 2) { const th = (k * Math.PI) / 180; const e = err(th); if (e < be) { be = e; best = th } }
  for (let step = 1; step > 0.02; step /= 2) {
    for (const d of [-step, step]) { const th = best + (d * Math.PI) / 180; const e = err(th); if (e < be) { be = e; best = th } }
  }
  const c = Math.cos(best), s = Math.sin(best)
  return {
    at: (p) => { const dx = p.x - gs.x, dz = p.z - gs.z; return { x: gd.x + dx * c - dz * s, z: gd.z + dx * s + dz * c } },
    dir: (x, z) => [x * c - z * s, x * s + z * c],
  }
}

// ------------------------------------------------------------------------------------- the builder

function oneOhOneCalifornia(out: MeshBuilder, fit: Fit): void {
  const H = fit.height >= 100 ? fit.height : 183
  const M = placement(fit)
  /** a point given in OSM metres, at height y, in the model's frame */
  const V = (p: P2, y: number): V3 => { const q = M.at(p); return [q.x, y, q.z] }
  const N = (x: number, y: number, z: number): V3 => { const [a, b] = M.dir(x, z); return [a, y, b] }
  /** a vertical quad on the segment a→b (OSM metres) from y0 to y1, facing its right-hand side (outward on a ccw ring) */
  const wall = (a: P2, b: P2, y0: number, y1: number, c: Rgb, tag: number, uv: [number, number][] = UV, flip = false): void => {
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L < 0.02) return
    const s = flip ? -1 : 1
    out.quad([V(a, y0), V(b, y0), V(b, y1), V(a, y1)], N(s * (b.z - a.z) / L, 0, -s * (b.x - a.x) / L), uv, c, tag)
  }
  const polar = (r: number, ang: number): P2 => ({ x: C0.x + r * Math.sin(ang), z: C0.z + r * Math.cos(ang) })
  const bearingOf = (p: P2): number => Math.atan2(p.x - C0.x, p.z - C0.z)

  // ---- the drum: a sawtooth ring, nose then root, the glass face from each root out to the next nose
  const tooth = (2 * Math.PI) / TEETH
  const drum = (inset: number): P2[] => {
    const r: P2[] = []
    for (let k = 0; k < TEETH; k++) {
      const a = k * tooth
      // the nose a narrow flat of granite, so a pale line shows from either hand
      r.push(polar(R_NOSE - inset, a - 0.2 / R_NOSE))
      r.push(polar(R_NOSE - inset, a + 0.2 / R_NOSE))
      r.push(polar(R_ROOT - inset, a + tooth * 0.14))
    }
    return r
  }
  // a bearing increasing clockwise from north: the ring runs clockwise in east/north, so its outward side is
  // on the LEFT of each edge — `wall(..., flip)`
  const drumBand = (ring: P2[], y0: number, y1: number): void => {
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i], b = ring[(i + 1) % ring.length]
      if (i % 3 !== 2) wall(a, b, y0, y1, RIB, T.granite, UV, true)   // the nose and its short granite return
      else {
        const k = (i - 2) / 3
        // uv: bays along, floors up, so the glass lights room by room after dark (cartoon-material.ts)
        wall(a, b, y0, y1, GLASS, T.glass, [[k, y0 / 3.8], [k + 1, y0 / 3.8], [k + 1, y1 / 3.8], [k, y1 / 3.8]], true)
      }
    }
  }
  /** the flat ring between two drums of the same teeth at y (a ledge facing up, or the soffit facing down) */
  const annulus = (outer: P2[], inner: P2[] | null, y: number, c: Rgb, down: boolean): void => {
    for (let i = 0; i < outer.length; i++) {
      const j = (i + 1) % outer.length
      const a = outer[i], b = outer[j]
      if (inner) out.quad([V(a, y), V(b, y), V(inner[j], y), V(inner[i], y)], [0, down ? -1 : 1, 0], UV, c, T.granite)
      else out.quad([V(a, y), V(b, y), V(C0, y), V(C0, y)], [0, down ? -1 : 1, 0], UV, c, down ? T.granite : T.concrete)
    }
  }
  const tiers: [number, number][] = [[Y.soffit, 0], [H - 34, 0.8], [H - 22, 1.7], [H - 11, 2.7]]
  let prev: P2[] | null = null
  for (let t = 0; t < tiers.length; t++) {
    const [y0, inset] = tiers[t]
    const y1 = t + 1 < tiers.length ? tiers[t + 1][0] : H
    const ring = drum(inset)
    if (prev) annulus(prev, ring, y0, ROOF, false)
    drumBand(ring, y0, y1)
    prev = ring
  }
  annulus(prev!, null, H, ROOF, false)                                         // the flat roof
  const base = drum(0)
  annulus(base, null, Y.soffit, SOFFIT, true)                                  // the soffit over the piers
  // the pavement under the drum: the colonnade and the notch are open plaza, not the lot's grass
  {
    const pave: P2[] = []
    for (let k = 0; k < 48; k++) pave.push(M.at(polar(R_NOSE + 0.5, (k * 2 * Math.PI) / 48)))
    out.grounds.push(ccw(pave))
  }
  // a granite fascia under the drum's first floor, the line the piers carry
  for (let i = 0; i < base.length; i += 3) wall(base[i], base[(i + 3) % base.length], Y.soffit - 1.2, Y.soffit, PIER, T.granite, UV, true)

  // ---- the lobby's notch, the cut-back storeys' enclosure, and the cascade
  const R_ENC = R_NOSE - 5.5
  const aA = bearingOf(N2)                                     // the radial wall's bearing (in line with the annex face)
  // the plaza wall N2→N3 crosses the enclosure's circle at C2
  const cross = (p: P2, q: P2, r: number): P2 => {
    const dx = q.x - p.x, dz = q.z - p.z, fx = p.x - C0.x, fz = p.z - C0.z
    const a = dx * dx + dz * dz, b = 2 * (fx * dx + fz * dz), c = fx * fx + fz * fz - r * r
    const t = (-b + Math.sqrt(Math.max(0, b * b - 4 * a * c))) / (2 * a)
    return { x: p.x + dx * t, z: p.z + dz * t }
  }
  const C2 = cross(N2, N3, R_NOSE - 2.5)   // the plaza wall runs out to just inside the piers
  const aB = bearingOf(C2)
  const C1 = polar(R_ENC, aA)
  // the enclosure: clockwise from C2 round the far side to C1, glass storeys below, granite above
  const seg = 48
  let span = aA - aB
  while (span <= 0) span += 2 * Math.PI
  for (let k = 0; k < seg; k++) {
    const p = polar(R_ENC, aB + (span * k) / seg), q = polar(R_ENC, aB + (span * (k + 1)) / seg)
    // the lobby glass the full height of the cut-back storeys, two white transoms across it
    const L = Math.hypot(q.x - p.x, q.z - p.z) / 1.5
    wall(p, q, Y.sink, Y.soffit, LOBBY, T.glass, [[k * L, Y.sink / 3.8], [(k + 1) * L, Y.sink / 3.8], [(k + 1) * L, Y.soffit / 3.8], [k * L, Y.soffit / 3.8]], true)
    const pp = polar(R_ENC + 0.08, aB + (span * k) / seg), qq = polar(R_ENC + 0.08, aB + (span * (k + 1)) / seg)
    for (const yt of [Y.lobbyGlass, 18.5]) wall(pp, qq, yt - 0.4, yt, FRAME, 0, UV, true)
  }
  // the radial wall, C1 in to the inner corner: lobby glass under the granite (it faces the notch)
  wall(C1, N2, Y.sink, Y.lobbyGlass, LOBBY, T.glass, UV, true)
  wall(C1, N2, Y.lobbyGlass, Y.soffit, CORE, T.granite, UV, true)

  // the cascade: the plaza wall's line stepped in d metres, a vertical glass riser then a sloping glass roof, to
  // the soffit; each tier clipped to the radial lines through N2 and C2
  const ux = (N3.x - N2.x), uz = (N3.z - N2.z)
  const ul = Math.hypot(ux, uz)
  const inx = ux / ul, inz = uz / ul
  const nIn = { x: inz, z: -inx }                               // into the building, away from the plaza
  if ((C0.x - N2.x) * nIn.x + (C0.z - N2.z) * nIn.z < 0) { nIn.x = -nIn.x; nIn.z = -nIn.z }
  /** the tier line stepped in d, met by the radial line at bearing ang */
  const onRay = (d: number, ang: number): P2 => {
    const px = N2.x + nIn.x * d, pz = N2.z + nIn.z * d
    const rx = Math.sin(ang), rz = Math.cos(ang)
    // C0 + s r = p + t u
    const det = rx * -inz - rz * -inx
    const s = ((px - C0.x) * -inz - (pz - C0.z) * -inx) / det
    return { x: C0.x + rx * s, z: C0.z + rz * s }
  }
  // [inward step, riser height, rise of the slope over it]
  const steps: [number, number, number][] = [[0, 8, 5], [3.6, 2.5, 5], [7.2, 2.5, 5]]
  let y = 0
  const profileA: { p: P2; y: number }[] = []
  const profileB: { p: P2; y: number }[] = []
  for (let k = 0; k < steps.length; k++) {
    const [d, riser, rise] = steps[k]
    const dn = k + 1 < steps.length ? steps[k + 1][0] : d + 3.6
    const a0 = onRay(d, aA), b0 = onRay(d, aB)
    const a1 = onRay(dn, aA), b1 = onRay(dn, aB)
    const yb = k === 0 ? Y.sink : y
    const yr = y + riser
    // the riser: lobby glass in white frames, facing the plaza
    const nOut = N(-nIn.x, 0, -nIn.z)
    const L = Math.hypot(b0.x - a0.x, b0.z - a0.z)
    out.quad([V(a0, yb), V(b0, yb), V(b0, yr), V(a0, yr)], nOut, [[0, yb / 3.8], [L / 1.5, yb / 3.8], [L / 1.5, yr / 3.8], [0, yr / 3.8]], LOBBY, T.glass)
    out.quad([V(a0, yr - 0.35), V(b0, yr - 0.35), V(b0, yr + 0.05), V(a0, yr + 0.05)], nOut, UV, FRAME, 0)
    // its white mullions, every 3 m, a hand's depth proud
    for (let u = 3; u < L - 0.5; u += 3) {
      const t = u / L
      const m = { x: a0.x + (b0.x - a0.x) * t - nIn.x * 0.12, z: a0.z + (b0.z - a0.z) * t - nIn.z * 0.12 }
      const m2 = { x: m.x + inx * 0.25, z: m.z + inz * 0.25 }
      out.quad([V(m, yb), V(m2, yb), V(m2, yr), V(m, yr)], nOut, UV, FRAME, 0)
    }
    // the sloping glass, riser top to the next tier's foot
    const yt = Math.min(Y.soffit, yr + rise)
    const sn: V3 = (() => { const run = dn - d; const l = Math.hypot(run, rise); return N(-nIn.x * rise / l, run / l, -nIn.z * rise / l) })()
    out.quad([V(a0, yr), V(b0, yr), V(b1, yt), V(a1, yt)], sn, [[0, 0], [L / 1.5, 0], [L / 1.5, 2], [0, 2]], LOBBY, T.glass)
    out.quad([V(a0, yr), V(b0, yr), V(b0, yr + 0.3), V(a0, yr + 0.3)], nOut, UV, FRAME, 0)
    profileA.push({ p: a0, y: yr }, { p: a1, y: yt })
    profileB.push({ p: b0, y: yr }, { p: b1, y: yt })
    y = yt
  }
  // the last tier's back wall up to the soffit (granite: the drum's cut-back face)
  {
    const d = steps[steps.length - 1][0] + 3.6
    const a = onRay(d, aA), b = onRay(d, aB)
    out.quad([V(a, y), V(b, y), V(b, Y.soffit), V(a, Y.soffit)], N(-nIn.x, 0, -nIn.z), UV, CORE, T.granite)
  }
  // the cheeks: granite above the cascade's profile on the two radial lines, closing the void beside it
  // — inside the enclosure's circle only; out in the colonnade the cascade's flank is glass, down to the pavement
  const rOf = (p: P2): number => Math.hypot(p.x - C0.x, p.z - C0.z)
  for (const [prof, sgn] of [[profileA, 1], [profileB, -1]] as const) {
    const ang = sgn > 0 ? aA : aB
    const nx = Math.cos(ang) * sgn, nz = -Math.sin(ang) * sgn
    for (let i = 0; i + 1 < prof.length; i++) {
      let p = prof[i], q = prof[i + 1]
      const rp = rOf(p.p), rq = rOf(q.p)
      if (rp - rq < 0.05) continue                                  // a riser: no width on the radial line
      const at = (r: number): { p: P2; y: number } => {
        const t = (rp - r) / (rp - rq)
        return { p: { x: p.p.x + (q.p.x - p.p.x) * t, z: p.p.z + (q.p.z - p.p.z) * t }, y: p.y + (q.y - p.y) * t }
      }
      // the glass flank under the slope, where it is out past the enclosure
      if (rp > R_ENC) {
        const e = rq < R_ENC ? at(R_ENC) : q
        out.quad([V(p.p, Y.sink), V(e.p, Y.sink), V(e.p, e.y), V(p.p, p.y)], N(-nx, 0, -nz), UV, LOBBY, T.glass)
        if (rq >= R_ENC) continue
        p = e
      }
      out.quad([V(p.p, p.y), V(q.p, q.y), V(q.p, Y.soffit), V(p.p, Y.soffit)], N(nx, 0, nz), UV, CORE, T.granite)
    }
  }

  // ---- the piers: square granite shafts on the drum's line, from the pavement to the soffit
  const PIERS = 28
  const annexW = ANNEX_W.map(([x, z]) => ({ x, z }))
  const annexS = ANNEX_S.map(([x, z]) => ({ x, z }))
  const inside = (p: P2, r: P2[]): boolean => {
    let s = false
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const a = r[i], b = r[j]
      if ((a.z > p.z) !== (b.z > p.z) && p.x < ((b.x - a.x) * (p.z - a.z)) / (b.z - a.z) + a.x) s = !s
    }
    return s
  }
  for (let k = 0; k < PIERS; k++) {
    const ang = (k + 0.5) * (2 * Math.PI) / PIERS
    const c = polar(R_ROOT - 1.2, ang)
    if (inside(c, annexW) || inside(c, annexS)) continue
    const h = 0.8
    const r = { x: Math.sin(ang), z: Math.cos(ang) }, t = { x: Math.cos(ang), z: -Math.sin(ang) }
    const corner = (i: number, j: number): P2 => ({ x: c.x + (r.x * i + t.x * j) * h, z: c.z + (r.z * i + t.z * j) * h })
    const sq = [corner(1, 1), corner(1, -1), corner(-1, -1), corner(-1, 1)]
    for (let i = 0; i < 4; i++) wall(sq[i], sq[(i + 1) % 4], Y.sink, Y.soffit - 1.2, PIER, T.granite)
  }

  // ---- the annex: pink-beige granite, four storeys of square punched windows on its long faces
  for (const raw of [ANNEX_W, ANNEX_S]) {
    const ring = ccw(raw.map(([x, z]) => ({ x, z })))
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i], b = ring[(i + 1) % ring.length]
      const L = Math.hypot(b.x - a.x, b.z - a.z)
      wall(a, b, Y.sink, Y.annex, ANNEX, T.granite)
      wall(a, b, Y.annex, Y.annex + 1, ANNEX, T.granite)          // the parapet
      // the windows: on the long faces only (the short ones are against the drum or are corners)
      if (L < 9 || toBoundary({ x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 }, base) < 4) continue
      const nx = (b.z - a.z) / L, nz = -(b.x - a.x) / L
      const n = Math.floor((L - 3) / 4.2)
      const u0 = (L - (n - 1) * 4.2) / 2
      for (let f = 0; f < 4; f++) {
        const y0 = 1.6 + f * 3.8, y1 = y0 + 2.1
        for (let w = 0; w < n; w++) {
          const u = u0 + w * 4.2
          const p = { x: a.x + (b.x - a.x) * (u - 1.05) / L + nx * 0.04, z: a.z + (b.z - a.z) * (u - 1.05) / L + nz * 0.04 }
          const q = { x: a.x + (b.x - a.x) * (u + 1.05) / L + nx * 0.04, z: a.z + (b.z - a.z) * (u + 1.05) / L + nz * 0.04 }
          wall(p, q, y0, y1, HOLE, T.glass, [[0, f], [1, f], [1, f + 0.99], [0, f + 0.99]])
        }
      }
    }
    // the roof, a fan from the centroid (both are near-convex)
    const g = centroid(ring)
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i], b = ring[(i + 1) % ring.length]
      out.quad([V(a, Y.annex), V(b, Y.annex), V(g, Y.annex), V(g, Y.annex)], [0, 1, 0], UV, ROOF, T.concrete)
    }
    // the parapet's inner face
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i], b = ring[(i + 1) % ring.length]
      const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
      const o = (p: P2): P2 => ({ x: p.x - (b.z - a.z) / L * 0.4, z: p.z + (b.x - a.x) / L * 0.4 })
      wall(o(a), o(b), Y.annex, Y.annex + 1, ANNEX, T.granite, UV, true)
      out.quad([V(a, Y.annex + 1), V(b, Y.annex + 1), V(o(b), Y.annex + 1), V(o(a), Y.annex + 1)], [0, 1, 0], UV, ANNEX, T.granite)
    }
  }

  // ---- the terraced planters along the annex's plaza face (the plaza photograph): three granite steps
  {
    const a = { x: -69.6, z: 44.1 }, b = N1
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    const tx = (b.x - a.x) / L, tz = (b.z - a.z) / L
    // outward: away from the annex (toward the plaza, north-east)
    let nx = tz, nz = -tx
    if (nx * 1 + nz * 1 < 0) { nx = -nx; nz = -nz }
    for (let s = 0; s < 3; s++) {
      const o0 = 0, o1 = 3.6 - s * 1.2, top = 0.5 * (s + 1)
      const u0 = 8 + s * 1.2, u1 = L - 6 - s * 1.2
      const P = (u: number, o: number): P2 => ({ x: a.x + tx * u + nx * o, z: a.z + tz * u + nz * o })
      const q = [P(u0, o0), P(u1, o0), P(u1, o1), P(u0, o1)]
      // its front, ends and top
      out.quad([V(q[3], Y.sink), V(q[2], Y.sink), V(q[2], top), V(q[3], top)], N(nx, 0, nz), UV, PAVE, T.granite)
      out.quad([V(q[0], Y.sink), V(q[3], Y.sink), V(q[3], top), V(q[0], top)], N(-tx, 0, -tz), UV, PAVE, T.granite)
      out.quad([V(q[1], Y.sink), V(q[2], Y.sink), V(q[2], top), V(q[1], top)], N(tx, 0, tz), UV, PAVE, T.granite)
      out.quad([V(q[0], top), V(q[1], top), V(q[2], top), V(q[3], top)], [0, 1, 0], UV, PAVE, T.granite)
    }
  }
}

export const ONE_OH_ONE_CALIFORNIA: Record<string, (out: MeshBuilder, fit: Fit) => void> = { oneOhOneCalifornia }
