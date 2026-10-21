/**
 * NEMA (2014, Handel Architects; 8 Tenth Street at Market) and the San Francisco Proper Hotel (1904; 1100 Market at
 * McAllister and Jones), rebuilt to City Hall's standard (owner, 2026-10-21: "only City Hall looks right").
 *
 * NEMA, from Mapillary 1478296493589044, 1129828129004999, 1313585467143208 and the podium frames of way/397183505,
 * way/285840934:
 *   - the NORTH TOWER (37 storeys, 106 m): blue-green glass on a nine-sided plan, a curtain wall with dark vertical
 *     strips of spandrel panel scattered up its facets at staggered heights; a NOTCH running up one face, the stack
 *     of balconies set into it (slab edges and glass rails floor by floor); the top SLICED on a slant to a sharp
 *     point, the glass running up past the roof as a screen; a dark glazed lobby at its foot;
 *   - the SOUTH TOWER (24 storeys, 73 m): near-black panels with an irregular checkerboard of windows all round (the
 *     glass seen beside it in Mapillary 345047250645696 is the North tower behind);
 *   - the PODIUMS: dark panel walls with irregular punched windows, the street corners glazed full height, a dark
 *     glazed shopfront along the ground.
 * The two towers share the builder name `nemaTower` and are told apart by their height (North 106 m, South 73 m),
 * or failing that by their plan (the North is near square, the South a 45 × 20 m slab).
 *
 * THE PROPER HOTEL (Mapillary frames in audit/refs8/way-32864990; Commons "Hibernia Bank Building San Francisco
 * 2019.jpg"): a Renaissance flatiron, its plan a right-angled wedge with the PROW cut off at the sharp corner where
 * McAllister meets Market. A dark two-storey storefront base under a cream terracotta string course; four storeys of
 * warm tan brick with dark punched windows and cream QUOINS at the corners; a top storey of ARCHED windows; a deep
 * dark bracketed CORNICE with the green copper CRESTING along its top; the hotel's black banner by the prow.
 *
 * Built on the real outline (fit.ring); edges are found by their LENGTH, which no rotation changes.
 */
import { capPolygon, type MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import type { Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { faceBand, towerRing, type Face } from '../../tower.ts'
import { offsetRing } from '../../parts.ts'
import { sign } from '../../signage.ts'

type P2 = { x: number; z: number }
type V3 = [number, number, number]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

const T = {
  glass: surfaceTag('glass'), metal: surfaceTag('metal'), brick: surfaceTag('brick'), terracotta: surfaceTag('terracotta'),
  copper: surfaceTag('copper'), concrete: surfaceTag('concrete'), granite: surfaceTag('granite'),
}
/** a light source: keeps its colour and glows after dark (models.ts EMIT) */
const EMIT = 0.5

// ---------------------------------------------------------------------------------------------- the ring's edges

interface Edge { i: number; a: P2; b: P2; tx: number; tz: number; nx: number; nz: number; L: number }
/** edge i of an anticlockwise ring: unit direction, outward normal (tz, −tx), length */
function edgeOf(ring: P2[], i: number): Edge {
  const a = ring[i]
  const b = ring[(i + 1) % ring.length]
  const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
  const tx = (b.x - a.x) / L
  const tz = (b.z - a.z) / L
  return { i, a, b, tx, tz, nx: tz, nz: -tx, L }
}
const edges = (ring: P2[]): Edge[] => ring.map((_, i) => edgeOf(ring, i))
/** the edge nearest `len` metres long */
function edgeNear(ring: P2[], len: number): Edge {
  let best = edgeOf(ring, 0)
  for (const e of edges(ring)) if (Math.abs(e.L - len) < Math.abs(best.L - len)) best = e
  return best
}
const longest = (ring: P2[]): Edge => edges(ring).reduce((m, e) => (e.L > m.L ? e : m))
/** a point `u` along an edge and `o` out from it (negative: into the building) */
const at = (e: Edge, u: number, o: number): P2 => ({ x: e.a.x + e.tx * u + e.nx * o, z: e.a.z + e.tz * u + e.nz * o })

/** a vertical rectangle in the plane `o` out from an edge, facing out */
function quadOn(out: MeshBuilder, e: Edge, u0: number, u1: number, y0: number, y1: number, o: number, c: Rgb, tag = 0, uv = UV): void {
  const A = at(e, u0, o)
  const B = at(e, u1, o)
  out.quad([[A.x, y0, A.z], [B.x, y0, B.z], [B.x, y1, B.z], [A.x, y1, A.z]], [e.nx, 0, e.nz], uv, c, tag)
}
/** a block in an edge's frame: u0..u1 along, o0..o1 out, y0..y1 up; `faces` leaves off the ones never seen */
function slab(out: MeshBuilder, e: Edge, u0: number, u1: number, o0: number, o1: number, y0: number, y1: number, c: Rgb, tag = 0, bottom = true): void {
  const P = (u: number, o: number, y: number): V3 => [e.a.x + e.tx * u + e.nx * o, y, e.a.z + e.tz * u + e.nz * o]
  out.quad([P(u0, o1, y0), P(u1, o1, y0), P(u1, o1, y1), P(u0, o1, y1)], [e.nx, 0, e.nz], UV, c, tag)
  out.quad([P(u0, o0, y0), P(u0, o1, y0), P(u0, o1, y1), P(u0, o0, y1)], [-e.tx, 0, -e.tz], UV, c, tag)
  out.quad([P(u1, o1, y0), P(u1, o0, y0), P(u1, o0, y1), P(u1, o1, y1)], [e.tx, 0, e.tz], UV, c, tag)
  out.quad([P(u0, o0, y1), P(u0, o1, y1), P(u1, o1, y1), P(u1, o0, y1)], [0, 1, 0], UV, c, tag)
  if (bottom) out.quad([P(u0, o1, y0), P(u0, o0, y0), P(u1, o0, y0), P(u1, o1, y0)], [0, -1, 0], UV, c, tag)
}
/** a face drawn on part of one wall only, `o` metres proud of it (one edge, never the strip's hidden sides) */
function faceOn(out: MeshBuilder, e: Edge, u0: number, u1: number, y0: number, y1: number, f: Face, o = 0.03): void {
  faceBand(out, [at(e, u0, o), at(e, u1, o), at(e, u1, o - 1), at(e, u0, o - 1)], y0, y1, f, [0])
}
/** a ledge right round a ring: its face `depth` out, its top and soffit */
function ledge(out: MeshBuilder, ring: P2[], y: number, h: number, depth: number, c: Rgb, tag: number): void {
  for (const e of edges(ring)) {
    // mitred at the corners: run each ledge on out to where the next one meets it
    const ext = (k: Edge): number => {
      const n = edgeOf(ring, (k.i + 1) % ring.length)
      const turn = Math.acos(Math.max(-1, Math.min(1, k.tx * n.tx + k.tz * n.tz)))
      return depth * Math.tan(turn / 2)
    }
    const p = edgeOf(ring, (e.i - 1 + ring.length) % ring.length)
    const e0 = ext(p)
    const e1 = ext(e)
    const P = (u: number, o: number, yy: number): V3 => { const q = at(e, u, o); return [q.x, yy, q.z] }
    out.quad([P(-e0, depth, y), P(e.L + e1, depth, y), P(e.L + e1, depth, y + h), P(-e0, depth, y + h)], [e.nx, 0, e.nz], UV, c, tag)
    out.quad([P(0, 0, y + h), P(e.L, 0, y + h), P(e.L + e1, depth, y + h), P(-e0, depth, y + h)], [0, 1, 0], UV, c, tag)
    out.quad([P(0, 0, y), P(-e0, depth, y), P(e.L + e1, depth, y), P(e.L, 0, y)], [0, -1, 0], UV, c, tag)
  }
}
/** a deterministic hash in [0, 1): the same building in the showcase and in the city */
const hash = (a: number, b: number, s = 0): number => {
  const v = Math.sin(a * 127.1 + b * 311.7 + s * 74.7) * 43758.5453
  return v - Math.floor(v)
}
const centroid = (ring: P2[]): P2 => {
  let x = 0
  let z = 0
  for (const p of ring) { x += p.x; z += p.z }
  return { x: x / ring.length, z: z / ring.length }
}
/** a roof over a ring at a height that varies over it: a fan from the centroid */
function slopedCap(out: MeshBuilder, ring: P2[], y: (p: P2) => number, c: Rgb, tag: number): void {
  const m = centroid(ring)
  const ym = y(m)
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    out.quad([[m.x, ym, m.z], [a.x, y(a), a.z], [b.x, y(b), b.z], [b.x, y(b), b.z]], [0, 1, 0], UV, c, tag)
  }
}
/**
 * A dark panel wall with windows set in it at hash-chosen cells: an irregular checkerboard (NEMA's south tower and
 * podiums). `fill` is the share of cells glazed; a window may run two cells wide.
 */
function scatterWindows(out: MeshBuilder, e: Edge, u0: number, u1: number, y0: number, y1: number, o: {
  floor: number; pitch: number; fill: number; glass: Rgb; seed: number; frame?: Rgb
}): void {
  const floors = Math.max(1, Math.round((y1 - y0) / o.floor))
  const fh = (y1 - y0) / floors
  const bays = Math.max(1, Math.round((u1 - u0) / o.pitch))
  const bw = (u1 - u0) / bays
  for (let f = 0; f < floors; f++) {
    for (let b = 0; b < bays; b++) {
      const r = hash(b + e.i * 31, f, o.seed)
      if (r > o.fill) continue
      // a pair of cells now and then: the windows are not all one size
      const wide = r < o.fill * 0.3 && b < bays - 1
      const ua = u0 + b * bw + bw * 0.2
      const ub = u0 + (b + (wide ? 2 : 1)) * bw - bw * 0.2
      const ya = y0 + f * fh + fh * 0.25
      const yb = y0 + (f + 1) * fh - fh * 0.2
      quadOn(out, e, ua, ub, ya, yb, 0.04, o.glass, T.glass)
      if (wide) b++
    }
  }
}

// ---------------------------------------------------------------------------------------------- NEMA

const NEMA_GLASS: Rgb = [0.27, 0.4, 0.46]
const NEMA_MULLION: Rgb = [0.1, 0.12, 0.13]
const NEMA_PANEL: Rgb = [0.075, 0.08, 0.09]
const NEMA_SPANDREL: Rgb = [0.07, 0.08, 0.09]
const LOBBY_GLASS: Rgb = [0.16, 0.2, 0.22]
const NEMA_WINDOW: Rgb = [0.34, 0.42, 0.48]

/** the North tower: glass facets, the balcony notch, the dark strips, the sliced top */
function nemaNorth(out: MeshBuilder, fit: Fit): void {
  const H = fit.height > 70 && fit.height < 140 ? fit.height : 106
  const base = towerRing(fit)
  const front = edgeNear(base, 21.7).L > 12 ? edgeNear(base, 21.7) : longest(base)
  // the NOTCH: four points spliced into the north face (the facet before the Market front, 60° round from it), a
  // slot 5 m wide and 1.6 m deep up the whole face — Mapillary 1478296493589044, taken from due north, looks
  // straight into the balcony stack
  const prev = edgeOf(base, (front.i - 1 + base.length) % base.length)
  const nf = prev.L > 8 ? prev : front
  const nu0 = nf.L / 2 - 2.5
  const nu1 = nf.L / 2 + 2.5
  const depth = 1.6
  const ring = [...base]
  ring.splice(nf.i + 1, 0, at(nf, nu0, 0), at(nf, nu0, -depth), at(nf, nu1, -depth), at(nf, nu1, 0))
  const lobby = 6
  // the slant: the roof falls 12 m from its point, the Market front's west corner (the podium end; Mapillary
  // 507474275482352 from down Tenth Street shows it highest there), to the far side of the plan
  const fall = 12
  const hi = front.b
  let far = 0
  for (const p of ring) far = Math.max(far, Math.hypot(p.x - hi.x, p.z - hi.z))
  const yTop = (p: P2): number => H - fall * (Math.hypot(p.x - hi.x, p.z - hi.z) / far)
  const low = H - fall
  // the lobby, the curtain wall to the slice's foot
  faceBand(out, ring, 0, lobby, { kind: 'curtain', material: 'metal', wall: NEMA_MULLION, glass: LOBBY_GLASS, pitch: 3, floor: lobby })
  // the curtain wall, facet by facet, to the last whole floor under the slant; the slot's back wall darker glass,
  // in the balconies' shade
  const floors = Math.round((H - lobby) / 2.9)
  const fh = (H - lobby) / floors
  const notchBack = (nf.i + 2) % ring.length
  const curtain = (g: Rgb): Face => ({ kind: 'curtain', material: 'metal', wall: NEMA_MULLION, glass: g, pitch: 1.6, floor: fh })
  for (const e of edges(ring)) {
    const ya = yTop(e.a)
    const yb = yTop(e.b)
    const top = lobby + Math.floor((Math.min(ya, yb) - lobby) / fh) * fh
    faceBand(out, ring, lobby, top, curtain(e.i === notchBack ? [0.13, 0.19, 0.22] : NEMA_GLASS), [e.i])
    // above it the glass runs on up to the slant, past the roof: a trapezoid of glass ruled into floors and bays
    const rooms = Math.max(1, Math.round(e.L / 1.6))
    out.quad([[e.a.x, top, e.a.z], [e.b.x, top, e.b.z], [e.b.x, yb, e.b.z], [e.a.x, ya, e.a.z]], [e.nx, 0, e.nz],
      [[0, 0], [rooms, 0], [rooms, (yb - top) / fh], [0, (ya - top) / fh]], NEMA_GLASS, T.glass)
    const yAt = (u: number): number => ya + ((yb - ya) * u) / e.L
    for (let y = top + fh; y < Math.max(ya, yb) - 0.3; y += fh) {
      // the stretch of this floor line under the slant
      let u0 = 0
      let u1 = e.L
      if (ya < y) u0 = (e.L * (y - ya)) / (yb - ya)
      if (yb < y) u1 = (e.L * (y - ya)) / (yb - ya)
      if (u1 - u0 > 0.3) quadOn(out, e, u0, u1, y - 0.08, y + 0.08, 0.03, NEMA_MULLION, T.metal)
    }
    for (let k = 1; k < rooms; k++) {
      const u = (k * e.L) / rooms
      if (yAt(u) - top > 0.4) quadOn(out, e, u - 0.05, u + 0.05, top, yAt(u) - 0.3, 0.03, NEMA_MULLION, T.metal)
    }
    // the coping: a thin dark band along the slanted top, standing proud
    const P = (u: number, o: number, dy: number): V3 => { const q = at(e, u, o); return [q.x, (u === 0 ? ya : yb) + dy, q.z] }
    out.quad([P(0, 0.06, -0.5), P(e.L, 0.06, -0.5), P(e.L, 0.06, 0.15), P(0, 0.06, 0.15)], [e.nx, 0, e.nz], UV, NEMA_SPANDREL, T.metal)
  }
  // the roof: the slant itself, just inside the glass
  slopedCap(out, offsetRing(ring, -0.3), (p) => yTop(p) - 0.2, [0.12, 0.13, 0.14], T.metal)
  // the dark vertical strips: spandrel panels in columns, staggered up each facet
  for (const e of edges(ring)) {
    if (e.L < 4) continue
    const n = Math.max(1, Math.round(e.L / 4.5))
    for (let k = 0; k < n; k++) {
      const u = e.L * ((k + 0.25 + hash(e.i, k, 3) * 0.5) / n)
      const w = 0.6 + hash(e.i, k, 5) * 0.7
      // two runs per column, one low and one high, at lengths of their own
      for (let r = 0; r < 2; r++) {
        const span = (low - lobby) / 2
        const y0 = lobby + 3 + r * span + hash(e.i, k * 7 + r, 11) * span * 0.5
        const y1 = Math.min(low - 2, y0 + 10 + hash(e.i, k + r, 13) * span * 0.7)
        if (y1 - y0 < 6 || u - w / 2 < 0.4 || u + w / 2 > e.L - 0.4) continue
        quadOn(out, e, u - w / 2, u + w / 2, y0, y1, 0.05, NEMA_SPANDREL, T.metal)
      }
    }
  }
  // the balconies in the notch: per floor a pale slab edge across the slot, a glass rail at its lip
  const back = edgeOf(ring, notchBack)          // the slot's back wall
  for (let f = 1; f < floors - 2; f++) {
    const y = lobby + f * fh
    if (y > low - 1) break
    slab(out, back, 0, back.L, 0, depth, y - 0.25, y, [0.52, 0.54, 0.55], T.concrete, true)
    quadOn(out, back, 0, back.L, y, y + 1.05, depth - 0.05, [0.28, 0.36, 0.4], T.glass)
  }
  // the slot's dark cheeks, standing a hair proud of the wall's ends either side
  for (const [u0, u1] of [[nu0 - 0.5, nu0], [nu1, nu1 + 0.5]]) quadOn(out, nf, u0, u1, lobby, low, 0.06, NEMA_SPANDREL, T.metal)
  // the lobby's canopy along the front
  slab(out, front, 1, front.L - 1, 0, 2.2, lobby - 0.6, lobby - 0.2, [0.16, 0.17, 0.18], T.metal)
}

/** the South tower: near-black panels, an irregular checkerboard of windows */
function nemaSouth(out: MeshBuilder, fit: Fit): void {
  const H = fit.height > 45 && fit.height < 100 ? fit.height : 73
  const ring = towerRing(fit)
  const lobby = 5
  const L = longest(ring)
  faceBand(out, ring, 0, lobby, { kind: 'curtain', material: 'metal', wall: NEMA_MULLION, glass: LOBBY_GLASS, pitch: 3, floor: lobby })
  faceBand(out, ring, lobby, H, { kind: 'blank', material: 'metal', wall: NEMA_PANEL })
  for (const e of edges(ring)) {
    if (e.L < 3) continue
    scatterWindows(out, e, 0.4, e.L - 0.4, lobby + 0.5, H - 1.5, { floor: 2.95, pitch: 1.9, fill: 0.45, glass: NEMA_WINDOW, seed: 7 })
  }
  capPolygon(out, ring, H, [0.28, 0.29, 0.3], T.concrete)
  faceBand(out, ring, H, H + 1.2, { kind: 'blank', material: 'metal', wall: NEMA_PANEL })
  // the rooftop plant screen, set back
  const c = centroid(ring)
  const e = L
  const screen = [0, 1, 2, 3].map((k) => ({ x: c.x + e.tx * (k === 0 || k === 3 ? -8 : 8) + e.nx * (k < 2 ? -4 : 4), z: c.z + e.tz * (k === 0 || k === 3 ? -8 : 8) + e.nz * (k < 2 ? -4 : 4) }))
  // (wound anticlockwise like the footprint: along the edge, then away from it)
  const sr = [screen[0], screen[1], screen[2], screen[3]]
  let a2 = 0
  for (let i = 0; i < 4; i++) { const p = sr[i]; const q = sr[(i + 1) % 4]; a2 += p.x * q.z - q.x * p.z }
  const ccw = a2 >= 0 ? sr : [...sr].reverse()
  faceBand(out, ccw, H, H + 3.5, { kind: 'blank', material: 'metal', wall: [0.18, 0.19, 0.2] })
  capPolygon(out, ccw, H + 3.5, [0.22, 0.23, 0.24], T.metal)
}

// ---------------------------------------------------------------------------------------------- the Proper

const BRICK: Rgb = [0.34, 0.3, 0.26]
const CREAM: Rgb = [0.86, 0.8, 0.66]
const CORNICE: Rgb = [0.17, 0.22, 0.2]
const CRESTING: Rgb = [0.38, 0.56, 0.44]
const SHOP_FRAME: Rgb = [0.08, 0.1, 0.09]
const SHOP_GLASS: Rgb = [0.12, 0.14, 0.15]
const SASH: Rgb = [0.14, 0.15, 0.17]

function properHotel(out: MeshBuilder, fit: Fit): void {
  /*
   * The height: seven storeys, as the photographs count them — a two-storey storefront base (shop and mezzanine), four
   * storeys of brick and the tall arched top storey under the cornice, about 30 m to the cornice's top; not the
   * manifest's 47 (reported).
   */
  const H = fit.height >= 25 && fit.height <= 36 ? fit.height : 30
  const ring = towerRing(fit)
  const base = 8.4
  const crn = H - 1.6                 // the cornice's foot
  const archFloor = 4.4
  const archY = crn - 0.6 - archFloor  // the arched storey's sill line (a cream frieze over it)
  // the prow: the shortest edge, where the wedge's sharp corner is cut off. Market Street is the SECOND longest
  // edge (44.7 m, facing south-east); the longest (57 m, facing north) is McAllister
  const prow = edges(ring).reduce((m, e) => (e.L < m.L ? e : m))
  const bySize = edges(ring).filter((e) => e.L > 8).sort((a, b) => b.L - a.L)
  const market = bySize[1] ?? bySize[0]
  // the storefront: two storeys of dark frames and glass
  faceBand(out, ring, 0, base, { kind: 'curtain', material: 'metal', wall: SHOP_FRAME, glass: SHOP_GLASS, pitch: 3.3, floor: base / 2 })
  // the brick shaft and the arched storey
  const shaft: Face = { kind: 'punched', material: 'brick', wall: BRICK, glass: SASH, pitch: 3.3, solid: 0.52, floor: (archY - base - 0.6) / 4 }
  faceBand(out, ring, base + 0.6, archY, shaft)
  faceBand(out, ring, archY, crn - 0.6, { kind: 'punched', material: 'brick', wall: BRICK, glass: SASH, pitch: 3.3, solid: 0.5, floor: archFloor, arched: true })
  faceBand(out, ring, crn - 0.6, crn, { kind: 'blank', material: 'terracotta', wall: CREAM })
  // the cream string course over the base, a belt over the first brick storey, the sill course under the arches
  faceBand(out, ring, base, base + 0.6, { kind: 'blank', material: 'terracotta', wall: CREAM })
  ledge(out, ring, base + 0.45, 0.3, 0.3, CREAM, T.terracotta)
  ledge(out, ring, base + 0.6 + (archY - base - 0.6) / 4 - 0.2, 0.22, 0.12, CREAM, T.terracotta)
  ledge(out, ring, archY - 0.25, 0.25, 0.15, CREAM, T.terracotta)
  // the cornice: a deep dark overhang on brackets, the copper cresting along its top
  ledge(out, ring, crn, 0.5, 0.35, CORNICE, T.copper)
  ledge(out, ring, crn + 0.5, 1.1, 1.3, CORNICE, T.copper)
  capPolygon(out, ring, H, [0.36, 0.35, 0.34], T.concrete)
  for (const e of edges(ring)) {
    if (e.L < 3) continue
    const nb = Math.max(1, Math.round(e.L / 1.65))
    for (let k = 0; k <= nb; k++) {
      const u = 0.4 + ((e.L - 0.8) * k) / nb
      slab(out, e, u - 0.15, u + 0.15, 0, 1.1, crn + 0.5 - 0.7, crn + 0.5, CORNICE, T.copper, true)
    }
    // the cresting: a row of upright copper leaves on the cornice's lip, and the rail they stand on
    const P = (u: number, y: number): V3 => { const q = at(e, u, 1.15); return [q.x, y, q.z] }
    out.quad([P(0, H), P(e.L, H), P(e.L, H + 0.18), P(0, H + 0.18)], [e.nx, 0, e.nz], UV, CRESTING, T.copper)
    const nl = Math.max(1, Math.round(e.L / 0.9))
    for (let k = 0; k < nl; k++) {
      const u = ((k + 0.5) * e.L) / nl
      out.quad([P(u - 0.22, H + 0.15), P(u + 0.22, H + 0.15), P(u, H + 0.7), P(u, H + 0.7)], [e.nx, 0, e.nz], UV, CRESTING, T.copper)
    }
    // the QUOINS: cream blocks up both sides of every corner, long and short in turn
    for (const [end, s] of [[0, 1], [e.L, -1]] as const) {
      for (let y = base + 0.6, n = 0; y < crn - 0.7; y += 0.62, n++) {
        const w = n % 2 ? 0.55 : 0.95
        const u0 = end === 0 ? 0 : e.L - w
        quadOn(out, e, u0, u0 + w, y + 0.04, Math.min(crn - 0.6, y + 0.58), 0.04, CREAM, T.terracotta)
      }
      void s
    }
  }
  // the hotel's banner by the prow: a black blade with the name down it, on the Market front's prow end; the
  // canopy over the "1100 Market Street" door at the other end
  const prowAtB = Math.hypot(market.b.x - prow.a.x, market.b.z - prow.a.z) < 0.5
  const bu = prowAtB ? market.L - 2.2 : 2.2
  const cu = prowAtB ? 4 : market.L - 11
  slab(out, market, cu, cu + 7, 0, 2.2, 4.0, 4.35, [0.1, 0.11, 0.12], T.metal)
  const y0 = base + 3
  const y1 = base + 20
  slab(out, market, bu - 0.18, bu + 0.18, 0.3, 1.5, y0, y1, [0.08, 0.08, 0.09], T.metal)
  for (const s of [-1, 1]) {
    const q = at(market, bu + s * 0.2, 0.9)
    sign(out, { type: 'flat', text: 'PROPER', h: 0.85, face: 'grotesque', weight: 'normal', colour: [0.93, 0.91, 0.86], vertical: true, lit: 'self', tracking: 0.3 },
      { x: q.x, y: (y0 + y1) / 2, z: q.z, heading: Math.atan2(market.tx * s, market.tz * s) })
  }
  // the lamps of the prow's door: two small lit panels by the entrance
  for (const u of [prow.L * 0.2, prow.L * 0.8]) quadOn(out, prow, u - 0.1, u + 0.1, 2.6, 3.0, 0.08, [1, 0.86, 0.6], EMIT)
}

export const NEMA_PROPER: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /**
   * Two buildings under one builder name: the North tower (106 m, a near-square nine-sided plan) and the South
   * (73 m, a 45 × 20 m slab). Told apart by height, or by the plan's proportions when the height is missing.
   */
  nemaTower: (out, fit) => {
    const north = fit.height > 0 ? fit.height >= 90 : Math.max(fit.hx, fit.hz) / Math.max(1, Math.min(fit.hx, fit.hz)) < 1.5
    if (north) nemaNorth(out, fit)
    else nemaSouth(out, fit)
  },

  /** NEMA's podiums (North 39 m, South 30 m): dark panels, irregular windows, glazed corners, a shopfront base */
  nemaPodium: (out, fit) => {
    const H = fit.height > 15 && fit.height < 60 ? fit.height : 36
    const ring = towerRing(fit)
    const shop = 5.5
    const L = longest(ring)
    faceBand(out, ring, 0, shop, { kind: 'curtain', material: 'metal', wall: NEMA_MULLION, glass: LOBBY_GLASS, pitch: 3, floor: shop })
    faceBand(out, ring, shop, H, { kind: 'blank', material: 'metal', wall: NEMA_PANEL })
    for (const e of edges(ring)) {
      if (e.L < 3) continue
      // the corners glazed full height at both ends of the long street front, and at one end of every other wall
      const g0 = e.i === L.i ? Math.min(7, e.L * 0.2) : 0
      const g1 = Math.min(e.i === L.i ? 7 : 5, e.L * 0.25)
      const glass: Face = { kind: 'curtain', material: 'metal', wall: NEMA_MULLION, glass: NEMA_GLASS, pitch: 1.6, floor: 3.1 }
      if (g0) faceOn(out, e, 0.2, g0, shop, H - 0.8, glass)
      faceOn(out, e, e.L - g1, e.L - 0.2, shop, H - 0.8, glass)
      scatterWindows(out, e, g0 + 0.5, e.L - g1 - 0.5, shop + 0.6, H - 1.2, { floor: 3.3, pitch: 2.1, fill: 0.5, glass: NEMA_WINDOW, seed: 19 })
    }
    capPolygon(out, ring, H, [0.3, 0.31, 0.32], T.concrete)
    faceBand(out, ring, H, H + 1.1, { kind: 'blank', material: 'metal', wall: NEMA_PANEL })
    // the shopfront canopy along the street front
    slab(out, L, 1, L.L - 1, 0, 1.8, shop - 0.5, shop - 0.2, [0.15, 0.16, 0.17], T.metal)
  },

  properHotel,
}
