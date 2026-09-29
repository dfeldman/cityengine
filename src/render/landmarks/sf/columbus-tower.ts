/**
 * Columbus Tower, also called the Sentinel Building — 916 Kearny Street at Columbus Avenue (way/288485994),
 * 1905–07, the copper-green flatiron on the wedge where Columbus Avenue cuts across the Kearny grid. The
 * owner: *"one of the top buildings in SF … a very prominent building on a sharp corner (exposed from 3
 * sides)"*. It had no builder at all and wore the classifier's `chicago` restyle, so it rendered as a box.
 *
 * WHY IT IS FROM SCRATCH. `tools/ring-forms.ts` flags it from the outline alone: 9 m of true arc and only
 * 17% of its vertices orthogonal. Its nose is not a chamfer or a rounded corner — the footprint's twelve
 * short vertices lie on a circle to within a centimetre, through 210° of it, so the prow is a DRUM that the
 * two street walls run tangent into. `facade()` and `faceBand()` put flat walls on polygon edges, and a
 * `crown` sits on the ring's centroid, which is a third of the plan away from where this building's cupola
 * actually stands. Neither the prow nor the cupola on it is sayable in slots.
 *
 * Modelled from photographs (reference only; nothing here is traced or sampled from an image) —
 * `docs/shots/refs/sf-commons/288485994/way-288485994-02.jpg` (three-quarter from the Columbus/Kearny
 * crossing, the apex and the Columbus flank at once) and `-03.jpg` (the prow and the cupola close, from
 * Kearny). What they show, and what the model therefore carries:
 *
 * - The PROW is a full round tower the height of the building, in oxidised copper, and it does not stop at
 *   the roofline: it carries straight on as a drum above it, and the dome stands on that. The silhouette
 *   down Columbus is that cylinder and its dome, so everything here is placed on the FITTED CIRCLE's centre
 *   rather than the footprint's.
 * - Every storey of the prow is a band of curved glass between two projecting copper rings, so the round
 *   tower reads as a stack of hoops rather than as a smooth pipe. That banding is most of what makes it
 *   recognisable at a distance, after the colour.
 * - The two street flanks are SAN FRANCISCO BAY WINDOWS, copper and rounded, running the whole height —
 *   `kind: 'bays'` is exactly this, so the flanks are the kit doing what it is good at.
 * - Above the prow's roof drum: a ring cornice with little finials round it, a hemispherical dome, then a
 *   lantern of a small drum, a small dome, a gilt ball and a slim spire. The gilt is the only warm thing
 *   on the building and it is what catches the eye from three streets away.
 * - The party-wall end (the +x back, against its neighbour) is cream stucco, not copper, and the ground
 *   floor is a dark shopfront under a red awning (Café Zoetrope) that wraps the prow.
 *
 * Every dimension comes from `fit.hx`/`fit.hz`/`fit.height` and from the circle LEAST-SQUARES FITTED to the
 * footprint's own arc. Nothing is typed in metres; the only integers are counts (storeys, segments, courses).
 *
 * Local frame: the fit's, +y up.
 */
import { capPolygon, type MeshBuilder } from '../../buildings.ts'
import { box, prism, type Rgb } from '../../models.ts'
import type { Fit } from '../fit.ts'
import { towerRing, faceBand, type Face } from '../tower.ts'
import { faceOn } from '../parts.ts'
import { dome } from '../kit.ts'
import { surfaceTag } from '../../cartoon-material.ts'

type P2 = { x: number; z: number }

/** oxidised copper: the whole building except its party wall and its shopfront */
const COPPER: Rgb = [0.56, 0.78, 0.68]
const COPPER_DARK: Rgb = [0.36, 0.55, 0.48]
const COPPER_LIT: Rgb = [0.70, 0.89, 0.78]
/** the party-wall end, and the plastered upper storeys against the neighbour */
const STUCCO: Rgb = [0.86, 0.84, 0.77]
const GLASS: Rgb = [0.28, 0.35, 0.36]
const GLASS_SHOP: Rgb = [0.12, 0.13, 0.14]
const AWNING: Rgb = [0.52, 0.13, 0.12]
const GILT: Rgb = [0.82, 0.66, 0.24]
const ROOF: Rgb = [0.26, 0.27, 0.27]

const T_COPPER = surfaceTag('copper')
const T_STUCCO = surfaceTag('stucco')
const T_GLASS = surfaceTag('glass')
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const UP: [number, number, number] = [0, 1, 0]
const DOWN: [number, number, number] = [0, -1, 0]

/** storeys above the pavement, counted off the photographs (a count, not a dimension) */
const STOREYS = 8
/** how many facets the prow's drum is drawn with, over a full turn */
const DRUM_SEG = 24

/* ------------------------------------------------------------------ reading the prow out of the footprint */

interface Nose { cx: number; cz: number; r: number; a0: number; a1: number; from: number; to: number }

/**
 * The circle the footprint's arc lies on, found from the outline alone.
 *
 * The run is detected the way `tools/ring-forms.ts` scores one — consecutive vertices whose two incident
 * edges are far shorter than the longest edge and which all turn the same way by a sane amount — and the
 * circle is then a least-squares fit to those vertices. Both halves matter: without the short-edge test a
 * chamfered corner between two long walls scores as an arc, and without the fit the "centre" would be the
 * ring's centroid, which on a wedge is nowhere near the nose.
 *
 * Returns null when there is no arc, in which case the caller falls back to the plain outline and the
 * building is a wedge without a drum — wrong, but not broken.
 */
function fitNose(ring: P2[]): Nose | null {
  const n = ring.length
  if (n < 8) return null
  const len = (i: number): number => Math.hypot(ring[(i + 1) % n].x - ring[i].x, ring[(i + 1) % n].z - ring[i].z)
  const longest = Math.max(...ring.map((_, i) => len(i)))
  const short = (i: number): boolean => len(i) < longest * 0.25
  const turn = (i: number): number => {
    const a = ring[(i - 1 + n) % n]
    const b = ring[i]
    const c = ring[(i + 1) % n]
    let d = Math.atan2(c.z - b.z, c.x - b.x) - Math.atan2(b.z - a.z, b.x - a.x)
    while (d > Math.PI) d -= Math.PI * 2
    while (d < -Math.PI) d += Math.PI * 2
    return d
  }
  // the longest run, allowed to wrap once round the start
  let best: number[] = []
  let cur: number[] = []
  for (let k = 0; k < n * 2; k++) {
    const i = k % n
    const ok = short((i - 1 + n) % n) && short(i) && turn(i) > 0.05 && turn(i) < 0.9
    if (ok && cur.length < n) cur.push(i)
    else { if (cur.length > best.length) best = cur; cur = [] }
  }
  if (cur.length > best.length) best = cur
  if (best.length < 4) return null
  const pts = best.map((i) => ring[i])
  // least squares circle through them (Kåsa): solve for the centre, then average the radius
  let Sx = 0, Sz = 0, Sxx = 0, Szz = 0, Sxz = 0, Sxxx = 0, Szzz = 0, Sxzz = 0, Szxx = 0
  for (const q of pts) {
    Sx += q.x; Sz += q.z; Sxx += q.x * q.x; Szz += q.z * q.z; Sxz += q.x * q.z
    Sxxx += q.x ** 3; Szzz += q.z ** 3; Sxzz += q.x * q.z * q.z; Szxx += q.z * q.x * q.x
  }
  const N = pts.length
  const C = N * Sxx - Sx * Sx
  const D = N * Sxz - Sx * Sz
  const E = N * Sxxx + N * Sxzz - (Sxx + Szz) * Sx
  const G = N * Szz - Sz * Sz
  const Hh = N * Szzz + N * Szxx - (Sxx + Szz) * Sz
  const det = C * G - D * D
  if (Math.abs(det) < 1e-9) return null
  const cx = ((E * G - Hh * D) / det) / 2
  const cz = ((C * Hh - D * E) / det) / 2
  const r = pts.reduce((s, q) => s + Math.hypot(q.x - cx, q.z - cz), 0) / N
  // the vertices must really be ON it, or this is a jog that happened to turn one way
  if (!(r > 0.3) || pts.some((q) => Math.abs(Math.hypot(q.x - cx, q.z - cz) - r) > r * 0.12)) return null
  // the angles the run spans, unwrapped in the ring's own (anticlockwise) direction
  let a0 = Math.atan2(pts[0].z - cz, pts[0].x - cx)
  let a = a0
  for (const q of pts.slice(1)) {
    let t = Math.atan2(q.z - cz, q.x - cx)
    while (t < a) t += Math.PI * 2
    a = t
  }
  const a1 = a
  if (a1 - a0 < Math.PI * 0.5) return null
  // out to the tangent points on the two walls: half a facet each side, so the drum meets them cleanly
  const pad = (a1 - a0) / (best.length * 2)
  a0 -= pad
  return { cx, cz, r, a0, a1: a1 + pad, from: best[0], to: best[best.length - 1] }
}

/** A point on the prow's circle. */
const onNose = (nz: Nose, ang: number, rr: number): P2 => ({ x: nz.cx + Math.cos(ang) * rr, z: nz.cz + Math.sin(ang) * rr })

/**
 * The building's outline with the footprint's sampled arc replaced by the fitted circle's, at a segment
 * COUNT of our choosing — so the prow is as round as we want it rather than as round as a mapper traced it,
 * and `simplifyRing` (which merges anything under 1.5 m and would eat two thirds of the arc) never sees it.
 */
function noseRing(ring: P2[], nz: Nose, seg: number): P2[] {
  const n = ring.length
  const out: P2[] = []
  for (let i = 0; i < n; i++) {
    const inArc = nz.from <= nz.to ? i >= nz.from && i <= nz.to : i >= nz.from || i <= nz.to
    if (inArc) continue
    out.push(ring[i])
    const next = (i + 1) % n
    const nextInArc = nz.from <= nz.to ? next >= nz.from && next <= nz.to : next >= nz.from || next <= nz.to
    if (!nextInArc) continue
    for (let k = 0; k <= seg; k++) out.push(onNose(nz, nz.a0 + ((nz.a1 - nz.a0) * k) / seg, nz.r))
  }
  return out
}

/** Anticlockwise, so every edge's (dz, −dx) points out of the building. */
function ccw(ring: P2[]): P2[] {
  let a = 0
  for (let i = 0; i < ring.length; i++) { const p = ring[i]; const q = ring[(i + 1) % ring.length]; a += p.x * q.z - q.x * p.z }
  return a >= 0 ? ring : [...ring].reverse()
}

/**
 * The ring pushed `d` metres outwards (negative: inwards) along each vertex's MITRE — the bisector of its
 * two edge normals. `insetRing()` in the tower grammar moves radially from the vertex average, which on a
 * plan with twenty points bunched at one end drags the whole offset toward that end; on this building that
 * put the roof cornice through the prow's windows.
 */
function offsetRing(ring: P2[], d: number): P2[] {
  const n = ring.length
  return ring.map((p, i) => {
    const prev = ring[(i - 1 + n) % n]
    const next = ring[(i + 1) % n]
    const e0 = Math.hypot(p.x - prev.x, p.z - prev.z) || 1
    const e1 = Math.hypot(next.x - p.x, next.z - p.z) || 1
    const n0 = { x: (p.z - prev.z) / e0, z: -(p.x - prev.x) / e0 }
    const n1 = { x: (next.z - p.z) / e1, z: -(next.x - p.x) / e1 }
    const mx = n0.x + n1.x
    const mz = n0.z + n1.z
    const m = Math.hypot(mx, mz) || 1
    // 1/cos(half the turn) keeps the offset parallel to both walls at a sharp corner
    const k = Math.min(3, 2 / m)
    return { x: p.x + (mx / m) * d * k, z: p.z + (mz / m) * d * k }
  })
}

/** A band standing `proud` outside the ring between y0 and y1, with its lit top and its dark soffit. */
function slab(out: MeshBuilder, ring: P2[], y0: number, y1: number, proud: number, face: Rgb, top: Rgb, soffit: Rgb,
              material: 'copper' | 'stucco' = 'copper'): void {
  const outer = offsetRing(ring, proud)
  faceBand(out, outer, y0, y1, { kind: 'blank', wall: face, material })
  const tag = material === 'copper' ? T_COPPER : T_STUCCO
  for (let i = 0; i < ring.length; i++) {
    const j = (i + 1) % ring.length
    out.quad([[ring[i].x, y1, ring[i].z], [ring[j].x, y1, ring[j].z], [outer[j].x, y1, outer[j].z], [outer[i].x, y1, outer[i].z]], UP, UV, top, tag)
    out.quad([[outer[i].x, y0, outer[i].z], [outer[j].x, y0, outer[j].z], [ring[j].x, y0, ring[j].z], [ring[i].x, y0, ring[i].z]], DOWN, UV, soffit, tag)
  }
}

/** One course of the prow's drum: a band of the circle from y0 to y1 at radius rr, over the arc a0..a1. */
function arcBand(out: MeshBuilder, nz: Nose, a0: number, a1: number, seg: number, y0: number, y1: number, rr: number,
                 c: Rgb, tag: number): void {
  for (let k = 0; k < seg; k++) {
    const b0 = a0 + ((a1 - a0) * k) / seg
    const b1 = a0 + ((a1 - a0) * (k + 1)) / seg
    const p = onNose(nz, b0, rr)
    const q = onNose(nz, b1, rr)
    const am = (b0 + b1) / 2
    out.quad([[p.x, y0, p.z], [q.x, y0, q.z], [q.x, y1, q.z], [p.x, y1, p.z]], [Math.cos(am), 0, Math.sin(am)], UV, c, tag)
  }
}

/** A projecting ring round the prow at y: its face, its top and its soffit — the hoop between two storeys. */
function arcRing(out: MeshBuilder, nz: Nose, a0: number, a1: number, seg: number, y0: number, y1: number, r0: number,
                 proud: number, c: Rgb): void {
  arcBand(out, nz, a0, a1, seg, y0, y1, r0 + proud, c, T_COPPER)
  for (let k = 0; k < seg; k++) {
    const b0 = a0 + ((a1 - a0) * k) / seg
    const b1 = a0 + ((a1 - a0) * (k + 1)) / seg
    const pi = onNose(nz, b0, r0)
    const qi = onNose(nz, b1, r0)
    const po = onNose(nz, b0, r0 + proud)
    const qo = onNose(nz, b1, r0 + proud)
    out.quad([[pi.x, y1, pi.z], [qi.x, y1, qi.z], [qo.x, y1, qo.z], [po.x, y1, po.z]], UP, UV, COPPER_LIT, T_COPPER)
    out.quad([[po.x, y0, po.z], [qo.x, y0, qo.z], [qi.x, y0, qi.z], [pi.x, y0, pi.z]], DOWN, UV, COPPER_DARK, T_COPPER)
  }
}

/* ------------------------------------------------------------------------------------------- the building */

export function columbusTower_916_kearny(out: MeshBuilder, fit: Fit): void {
  const raw = ccw(fit.ring && fit.ring.length >= 3 ? fit.ring : towerRing(fit))
  const nose = fitNose(raw)
  // the arc's share of a full turn decides how many facets it gets, so the drum and the prow agree
  const arcSeg = nose ? Math.max(4, Math.round((DRUM_SEG * (nose.a1 - nose.a0)) / (Math.PI * 2))) : 0
  const ring = nose ? noseRing(raw, nose, arcSeg) : towerRing(fit)
  const H = fit.height > 1 ? fit.height : Math.max(fit.hx, fit.hz) * 3.3
  const fh = H / STOREYS
  // the shopfront storey is the tall one, as it is in every commercial building of the period
  const ground = fh * 1.15
  const R = nose ? nose.r : Math.min(fit.hx, fit.hz)

  // which edge is what: the two longest runs are the streets (Columbus and Kearny) and carry the bay
  // windows; the arc is the prow; everything else is the party wall against the neighbour
  const onArc = (i: number): boolean => {
    if (!nose) return false
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    const d = (p: P2): number => Math.abs(Math.hypot(p.x - nose.cx, p.z - nose.cz) - nose.r)
    return d(a) < nose.r * 0.1 && d(b) < nose.r * 0.1
  }
  /*
   * The STREET walls are the two the prow runs tangent into — the edge that ends where the arc begins and
   * the one that starts where it ends. Picking the two LONGEST edges instead, which is what this did first,
   * gave the bay windows to Columbus Avenue and to the PARTY WALL: the back of this plot is a 14 m run and
   * Kearny Street is only 13, so the one elevation nobody can see got the city's best facade and the one
   * facing the street got stucco. Adjacency to the arc cannot be fooled that way.
   */
  const arcIdx = ring.map((_, i) => i).filter(onArc)
  const n = ring.length
  const first = arcIdx.find((i) => !arcIdx.includes((i - 1 + n) % n)) ?? arcIdx[0]
  const last = arcIdx.find((i) => !arcIdx.includes((i + 1) % n)) ?? arcIdx[arcIdx.length - 1]
  const streets = nose ? [(first - 1 + n) % n, (last + 1) % n] : []

  /* ----------------------------------------------------------------------------------- the shopfront storey */
  // a dark glazed front behind a copper frame: the ground floor of this building is all window
  faceBand(out, ring, 0, ground, { kind: 'blank', wall: COPPER_DARK, material: 'copper' })
  const shop = offsetRing(ring, -R * 0.05)
  faceBand(out, shop, ground * 0.16, ground * 0.86, { kind: 'blank', wall: GLASS_SHOP, material: 'glass' })
  // the awning, right round the two streets and the prow — the one red thing on a green building
  slab(out, ring, ground * 0.80, ground * 0.93, R * 0.3, AWNING, AWNING, COPPER_DARK, 'copper')

  /* ------------------------------------------------------------------------------------------ the storeys */
  const bayFace: Face = {
    kind: 'bays', wall: COPPER, glass: GLASS, floor: fh, pitch: R * 1.25, material: 'copper',
    bay: { depth: R * 0.3, round: true },
  }
  const backFace: Face = { kind: 'punched', wall: STUCCO, glass: GLASS, floor: fh, pitch: R * 1.2, solid: 0.5, material: 'stucco', head: 'architrave' }
  for (let i = 0; i < ring.length; i++) {
    if (onArc(i)) continue
    faceOn(out, ring, i, ground, H - fh * 0.24, streets.includes(i) ? bayFace : backFace)
  }

  /* --------------------------------------------------------------------------------------------- the prow */
  if (nose) {
    const { a0, a1 } = nose
    for (let f = 0; f < STOREYS - 1; f++) {
      const y0 = ground + f * fh
      const y1 = y0 + fh
      // the spandrels, and between them a band of curved glass set back inside the wall. The wall is drawn
      // only where there is no window: a full-height band at R hides the glass behind it completely, which
      // is exactly how the first render came out — a smooth green pipe with no windows in it.
      arcBand(out, nose, a0, a1, arcSeg, y0, y0 + fh * 0.16, R, COPPER, T_COPPER)
      arcBand(out, nose, a0, a1, arcSeg, y0 + fh * 0.82, y1, R, COPPER, T_COPPER)
      arcBand(out, nose, a0, a1, arcSeg, y0 + fh * 0.16, y0 + fh * 0.82, R * 0.94, GLASS, T_GLASS)
      // the reveal at the head and the sill of the window band, so the glass reads as set INTO the drum
      for (let k = 0; k < arcSeg; k++) {
        const b0 = a0 + ((a1 - a0) * k) / arcSeg
        const b1 = a0 + ((a1 - a0) * (k + 1)) / arcSeg
        for (const [y, nrm] of [[y0 + fh * 0.16, DOWN], [y0 + fh * 0.82, UP]] as [number, [number, number, number]][]) {
          const pi = onNose(nose, b0, R * 0.94)
          const qi = onNose(nose, b1, R * 0.94)
          const po = onNose(nose, b0, R)
          const qo = onNose(nose, b1, R)
          out.quad([[pi.x, y, pi.z], [qi.x, y, qi.z], [qo.x, y, qo.z], [po.x, y, po.z]], nrm, UV, COPPER_DARK, T_COPPER)
        }
      }
      // the hoop between this storey and the next: what makes the prow read as stacked rather than smooth
      arcRing(out, nose, a0, a1, arcSeg, y1 - fh * 0.14, y1 + fh * 0.04, R, R * 0.1, COPPER)
      // a slim mullion on every other facet edge, standing just proud of the glass
      for (let k = 1; k < arcSeg; k += 2) {
        const ang = a0 + ((a1 - a0) * k) / arcSeg
        const p = onNose(nose, ang, R * 0.99)
        box(out, p.x, (y0 + y1) / 2, p.z, R * 0.05, fh * 0.42, R * 0.05, COPPER_LIT, T_COPPER)
      }
    }
  }

  /* ------------------------------------------------------------------------- the cornice, the roof, the top */
  // it must stand out further than the bay windows do, or their tops poke through it as battlements
  slab(out, ring, H - fh * 0.24, H, R * 0.38, COPPER, COPPER_LIT, COPPER_DARK, 'copper')
  capPolygon(out, ring, H, ROOF, 0)

  if (!nose) return
  const c: P2 = { x: nose.cx, z: nose.cz }
  // the prow carries on above the roof as a drum, a storey of it, with its own small openings
  const drumTop = H + fh * 1.05
  const drumR = R * 0.94
  prism(out, c.x, c.z, H - fh * 0.1, drumTop, drumR, DRUM_SEG, COPPER, T_COPPER, drumR, false)
  for (let k = 0; k < DRUM_SEG; k += 3) {
    const ang = (k / DRUM_SEG) * Math.PI * 2
    const p = onNose(nose, ang, drumR * 1.01)
    box(out, p.x, H + fh * 0.55, p.z, drumR * 0.1, fh * 0.2, drumR * 0.1, GLASS, T_GLASS)
  }
  // the ring cornice the dome springs from, and the little finials standing round it
  const ringOf = (rr: number): P2[] => Array.from({ length: DRUM_SEG }, (_, k) => onNose(nose, (k / DRUM_SEG) * Math.PI * 2, rr))
  slab(out, ringOf(drumR), drumTop - fh * 0.18, drumTop, R * 0.16, COPPER, COPPER_LIT, COPPER_DARK, 'copper')
  for (let k = 0; k < 8; k++) {
    const p = onNose(nose, ((k + 0.5) / 8) * Math.PI * 2, drumR * 1.1)
    box(out, p.x, drumTop + R * 0.1, p.z, R * 0.05, R * 0.1, R * 0.05, COPPER_DARK, T_COPPER)
  }
  // the dome, then the lantern on it: a small drum, a small dome, the gilt ball and the spire
  dome(out, c.x, c.z, drumTop, drumR * 0.98, drumR * 0.82, COPPER, DRUM_SEG)
  const domeTop = drumTop + drumR * 0.82
  prism(out, c.x, c.z, domeTop, domeTop + R * 0.26, drumR * 0.34, 12, COPPER_DARK, T_COPPER, drumR * 0.34, false)
  dome(out, c.x, c.z, domeTop + R * 0.26, drumR * 0.36, drumR * 0.3, COPPER, 12)
  const ballY = domeTop + R * 0.26 + drumR * 0.3
  prism(out, c.x, c.z, ballY, ballY + R * 0.16, drumR * 0.16, 10, GILT, T_COPPER, drumR * 0.1, true)
  prism(out, c.x, c.z, ballY + R * 0.16, ballY + R * 0.16 + drumR * 0.22, drumR * 0.16, 10, GILT, T_COPPER, 0.01, false)
  // the spire: a needle, and the pennant of a finial at the very top
  const spireY = ballY + R * 0.16 + drumR * 0.22
  prism(out, c.x, c.z, spireY, spireY + R * 0.9, R * 0.035, 6, COPPER_DARK, T_COPPER, R * 0.01, false)
}
