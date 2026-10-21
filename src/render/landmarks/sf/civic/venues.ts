/**
 * The performing-arts neighbours west of City Hall, and the federal slab north of it, each from its Mapillary frames
 * (scratchpad refs/way-<id>) and Commons photographs:
 *
 *  - `sfConservatory` — 50 Oak Street: the 1914 Young Men's Institute, cream and polychrome terracotta over a granite
 *    plinth, four giant gilded Ionic columns in antis, and the Conservatory's 2006 additions (a glass-and-grey-mullion
 *    range at the west end of the Oak Street front, a tall plain beige block behind with a few punched windows);
 *  - `bowesCenter` — 200 Van Ness (2020): twelve storeys of white panels with tall punched windows over a double-height
 *    glazed base and the red Conservatory banner, a white band, then a glazed top behind a screen of white louvres
 *    that opens at the Van Ness / Hayes corner;
 *  - `sfjazzCenter` — 201 Franklin (2013, Mark Cavagnero): a three-storey frame of light grey precast panels and tall
 *    glass, cantilevered over a transparent ground floor on slender columns, the corner at Fell all glass;
 *  - `b4_ballet_256720199` — 455 Franklin (1983, Beverly Willis): pale grey concrete in base, middle and top, a loggia
 *    of round columns under the parapet, the two-storey "proscenium" entry with rippled glass at the Fulton corner;
 *  - `phillipBurtonFederal` — 450 Golden Gate (1959): the long slab, its deep pale piers full height over grey glass,
 *    a dark louvred mechanical band at the top, a plain stone base and the raised plaza along Golden Gate.
 *
 * The frame: the manifest's front bearing lands on local −z in the city and in tools/model-shots.ts alike (fitFront),
 * so a front is the ring's edge facing −z, or, where the plan says it unambiguously, the edge found by length.
 * Along an edge `u` runs from its first corner `a` to `b`; with an anticlockwise ring, standing outside and facing the
 * wall, `a` is on the left... in plan terms: Oak Street's `a` is its west end, Franklin's (facing east) `a` its south
 * end, Van Ness's (facing west) `a` its north end. Rotation keeps that, so it holds in either frame.
 */
import { capPolygon, type MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { box, prism, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { faceBand, insetRing, simplifyRing, type Face } from '../../tower.ts'
import { classicalColumn } from '../../column.ts'
import { signText } from '../../parts.ts'

type P2 = { x: number; z: number }
interface Edge { a: P2; b: P2; tx: number; tz: number; nx: number; nz: number; L: number; heading: number }

const T = {
  terracotta: surfaceTag('terracotta'), granite: surfaceTag('granite'), metal: surfaceTag('metal'), concrete: surfaceTag('concrete'),
  glass: surfaceTag('glass'), stucco: surfaceTag('stucco'), ashlar: surfaceTag('ashlar'),
}

// ------------------------------------------------------------------------------------------- the edge frame

function edgeOf(ring: P2[], i: number): Edge {
  const a = ring[((i % ring.length) + ring.length) % ring.length]
  const b = ring[(((i + 1) % ring.length) + ring.length) % ring.length]
  const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
  const tx = (b.x - a.x) / L
  const tz = (b.z - a.z) / L
  return { a, b, tx, tz, nx: tz, nz: -tx, L, heading: Math.atan2(tz, -tx) }
}

/** the outline as walls: the real ring, its collinear runs merged, anticlockwise */
function wallsOf(fit: Fit): P2[] {
  const r = fit.ring && fit.ring.length >= 3 ? simplifyRing(fit.ring, 1.5, 0.06)
    : [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  let area = 0
  for (let i = 0; i < r.length; i++) { const a = r[i]; const b = r[(i + 1) % r.length]; area += a.x * b.z - b.x * a.z }
  return area >= 0 ? r : [...r].reverse()
}

const longestIndex = (ring: P2[]): number => {
  let best = 0
  for (let i = 1; i < ring.length; i++) if (edgeOf(ring, i).L > edgeOf(ring, best).L) best = i
  return best
}

/** the edge facing −z (the manifest's front), the longer of near-ties */
const frontIndex = (ring: P2[]): number => {
  let best = 0
  let score = Infinity
  for (let i = 0; i < ring.length; i++) {
    const e = edgeOf(ring, i)
    const s = e.nz - e.L * 0.002
    if (s < score) { score = s; best = i }
  }
  return best
}

/** a point `u` along an edge and `o` out from it (negative: into the building) */
const at = (e: Edge, u: number, o: number): P2 => ({ x: e.a.x + e.tx * u + e.nx * o, z: e.a.z + e.tz * u + e.nz * o })

const quad = (out: MeshBuilder, p: [number, number, number][], n: [number, number, number], c: Rgb, tag: number): void =>
  out.quad(p, n, [[0, 0], [1, 0], [1, 1], [0, 1]], c, tag)

/** a block in an edge's frame: `u0..u1` along, `o0..o1` out, `y0..y1` up; `bottom` false leaves the underside off */
function slab(out: MeshBuilder, e: Edge, u0: number, u1: number, o0: number, o1: number, y0: number, y1: number, c: Rgb, tag: number, bottom = false): void {
  const P = (u: number, o: number, y: number): [number, number, number] => [e.a.x + e.tx * u + e.nx * o, y, e.a.z + e.tz * u + e.nz * o]
  quad(out, [P(u0, o1, y0), P(u1, o1, y0), P(u1, o1, y1), P(u0, o1, y1)], [e.nx, 0, e.nz], c, tag)
  quad(out, [P(u1, o0, y0), P(u0, o0, y0), P(u0, o0, y1), P(u1, o0, y1)], [-e.nx, 0, -e.nz], c, tag)
  quad(out, [P(u0, o0, y0), P(u0, o1, y0), P(u0, o1, y1), P(u0, o0, y1)], [-e.tx, 0, -e.tz], c, tag)
  quad(out, [P(u1, o1, y0), P(u1, o0, y0), P(u1, o0, y1), P(u1, o1, y1)], [e.tx, 0, e.tz], c, tag)
  quad(out, [P(u0, o0, y1), P(u0, o1, y1), P(u1, o1, y1), P(u1, o0, y1)], [0, 1, 0], c, tag)
  if (bottom) quad(out, [P(u0, o1, y0), P(u0, o0, y0), P(u1, o0, y0), P(u1, o1, y0)], [0, -1, 0], c, tag)
}

/** the front and the top of a block standing proud of a wall (the cheeks only when `cheeks`): a band, a sill */
function ledge(out: MeshBuilder, e: Edge, u0: number, u1: number, o: number, y0: number, y1: number, c: Rgb, tag: number, cheeks = true): void {
  const P = (u: number, oo: number, y: number): [number, number, number] => [e.a.x + e.tx * u + e.nx * oo, y, e.a.z + e.tz * u + e.nz * oo]
  quad(out, [P(u0, o, y0), P(u1, o, y0), P(u1, o, y1), P(u0, o, y1)], [e.nx, 0, e.nz], c, tag)
  quad(out, [P(u0, 0, y1), P(u0, o, y1), P(u1, o, y1), P(u1, 0, y1)], [0, 1, 0], c, tag)
  if (cheeks) {
    quad(out, [P(u0, 0, y0), P(u0, o, y0), P(u0, o, y1), P(u0, 0, y1)], [-e.tx, 0, -e.tz], c, tag)
    quad(out, [P(u1, o, y0), P(u1, 0, y0), P(u1, 0, y1), P(u1, o, y1)], [e.tx, 0, e.tz], c, tag)
  }
}

/** a flat panel on the wall, facing out, `o` proud of it */
function panel(out: MeshBuilder, e: Edge, u0: number, u1: number, o: number, y0: number, y1: number, c: Rgb, tag: number): void {
  const P = (u: number, y: number): [number, number, number] => [e.a.x + e.tx * u + e.nx * o, y, e.a.z + e.tz * u + e.nz * o]
  quad(out, [P(u0, y0), P(u1, y0), P(u1, y1), P(u0, y1)], [e.nx, 0, e.nz], c, tag)
}

/** the underside of something overhanging: a soffit from the wall out to `o` */
function soffit(out: MeshBuilder, e: Edge, u0: number, u1: number, o0: number, o1: number, y: number, c: Rgb, tag: number): void {
  const P = (u: number, o: number): [number, number, number] => [e.a.x + e.tx * u + e.nx * o, y, e.a.z + e.tz * u + e.nz * o]
  quad(out, [P(u0, o1), P(u0, o0), P(u1, o0), P(u1, o1)], [0, -1, 0], c, tag)
}

/** a strip of the building along an edge, `u0..u1` along it and `d` deep: anticlockwise, like a footprint */
const strip = (e: Edge, u0: number, u1: number, d: number): P2[] => [at(e, u0, -d), at(e, u1, -d), at(e, u1, 0), at(e, u0, 0)].reverse()

/** the part of a ring more than `d` metres in from an edge's line (one half-plane of Sutherland–Hodgman) */
function behind(ring: P2[], e: Edge, d: number): P2[] {
  const o = (p: P2): number => (p.x - e.a.x) * e.nx + (p.z - e.a.z) * e.nz + d
  const res: P2[] = []
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i]
    const q = ring[(i + 1) % ring.length]
    const op = o(p)
    const oq = o(q)
    if (op <= 0) res.push(p)
    if ((op < 0 && oq > 0) || (op > 0 && oq < 0)) {
      const t = op / (op - oq)
      res.push({ x: p.x + (q.x - p.x) * t, z: p.z + (q.z - p.z) * t })
    }
  }
  return res
}

/** the ring part between `u0` and `u1` along an edge (two half-planes square to it) */
function between(ring: P2[], e: Edge, u0: number, u1: number): P2[] {
  const clip = (r: P2[], f: (p: P2) => number): P2[] => {
    const res: P2[] = []
    for (let i = 0; i < r.length; i++) {
      const p = r[i]
      const q = r[(i + 1) % r.length]
      const fp = f(p)
      const fq = f(q)
      if (fp >= 0) res.push(p)
      if ((fp < 0 && fq > 0) || (fp > 0 && fq < 0)) {
        const t = fp / (fp - fq)
        res.push({ x: p.x + (q.x - p.x) * t, z: p.z + (q.z - p.z) * t })
      }
    }
    return res
  }
  const u = (p: P2): number => (p.x - e.a.x) * e.tx + (p.z - e.a.z) * e.tz
  return clip(clip(ring, (p) => u(p) - u0), (p) => u1 - u(p))
}

/** a prism on a ring: its walls in one face and its roof */
function mass(out: MeshBuilder, ring: P2[], y0: number, y1: number, f: Face, roof: Rgb, roofTag = T.concrete, edges?: number[]): void {
  if (ring.length < 3) return
  faceBand(out, ring, y0, y1, f, edges)
  capPolygon(out, ring, y1, roof, roofTag)
}


// ------------------------------------------------------------------------------------- the Conservatory

const CREAM: Rgb = [0.86, 0.83, 0.74]          // the glazed terracotta, warm cream (Commons DSC02720)
const CREAM_SHADE: Rgb = [0.74, 0.71, 0.62]    // the recessed wall behind the columns, and the key bands
const GILT: Rgb = [0.86, 0.74, 0.47]           // the fluted shafts, polychrome gold
const VERDIGRIS: Rgb = [0.36, 0.5, 0.44]       // the frieze's green-glazed course
const PLINTH: Rgb = [0.6, 0.6, 0.58]           // the 2006 granite plinth and sign band
const BEIGE: Rgb = [0.79, 0.75, 0.67]          // the addition's plain painted wall (Mapillary -01..-04)
const MULLION: Rgb = [0.36, 0.37, 0.39]        // the addition's dark grey frames (Mapillary -05)
const WINDOW: Rgb = [0.16, 0.19, 0.22]

function sfConservatory(out: MeshBuilder, fit: Fit): void {
  const ring = wallsOf(fit)
  const front = edgeOf(ring, longestIndex(ring))   // Oak Street: the long south side, the notch is at the back
  const L = front.L
  const hist = Math.min(24, L * 0.55)               // the 1914 front, at the east end of the Oak frontage
  const uH = L - hist
  const D = 18                                      // how deep the 1914 range is drawn
  const back = 29                                   // the addition's roof (Mapillary -02/-03: ~7 storeys over the lot)
  const eaves = 25.6                                // the 1914 cornice
  // the addition: the block behind the old range, and the glass range at the west end of the front
  const rear = behind(ring, front, D)
  // a tall blank wall over the lot, a few rows of small windows only in its upper half (Mapillary -01..-04)
  const plain: Face = { kind: 'blank', wall: BEIGE, material: 'stucco' }
  const upper: Face = { kind: 'punched', wall: BEIGE, glass: WINDOW, pitch: 5.5, floor: 3.8, solid: 0.74, material: 'stucco' }
  faceBand(out, rear, 0, 11, plain)
  mass(out, rear, 11, back, upper, BEIGE, T.stucco)
  const westRing = strip(front, 0, uH, D)
  // its plain beige side and back, and the Oak Street face drawn below as glass in a grey frame
  faceBand(out, westRing, 0, 11, plain, [1, 2, 3])
  faceBand(out, westRing, 11, back, upper, [1, 2, 3])
  capPolygon(out, westRing, back, BEIGE, T.stucco)
  {
    const e = edgeOf(westRing, 0)                  // the Oak face of the west range (strip(): edge 0 runs along the front)
    // a dark granite base storey, then the curtain wall: mullions every 1.5 m, a frame at every floor
    slab(out, e, 0, e.L, -0.2, 0.15, 0, 4.2, MULLION, T.granite)
    panel(out, e, 0.3, e.L - 0.3, 0.02, 4.2, back - 1.2, [0.27, 0.32, 0.37], T.glass)
    const n = Math.max(2, Math.round(e.L / 1.6))
    for (let k = 0; k <= n; k++) {
      const u = 0.3 + ((e.L - 0.6) * k) / n
      ledge(out, e, u - 0.07, u + 0.07, 0.18, 4.2, back - 1.2, MULLION, T.metal, false)
    }
    for (let y = 4.2; y < back - 1.5; y += 3.6) ledge(out, e, 0.3, e.L - 0.3, 0.22, y, y + 0.3, MULLION, T.metal, false)
    // the grey frame round it, and its parapet
    slab(out, e, 0, 0.6, -0.2, 0.3, 4.2, back, MULLION, T.metal)
    slab(out, e, e.L - 0.6, e.L, -0.2, 0.3, 4.2, back, MULLION, T.metal)
    slab(out, e, 0, e.L, -0.2, 0.3, back - 1.2, back + 0.4, BEIGE, T.stucco)
  }
  // the 1914 range: its walls (the side against the neighbour, the back) and its roof
  const histRing = strip(front, uH, L, D)
  faceBand(out, histRing, 0, eaves, { kind: 'blank', wall: CREAM_SHADE, material: 'terracotta' }, [1, 2, 3])
  capPolygon(out, histRing, eaves - 0.2, [0.55, 0.55, 0.55], T.concrete)
  oakFront(out, front, uH, L, eaves)
}

/** The 1914 Oak Street facade between u0 and u1 on the front edge (Commons DSC02720/02724, Mapillary -05). */
function oakFront(out: MeshBuilder, e: Edge, u0: number, u1: number, eaves: number): void {
  const W = u1 - u0
  const mid = (u0 + u1) / 2
  const pier = W * 0.11                // the broad end piers either side of the colonnade
  const base = 9.0                     // the top of the two-storey base, under its cornice
  const colTop = 21.4
  // the granite plinth and the base: two storeys of cream terracotta, banded with a Greek key every storey half
  slab(out, e, u0, u1, -0.3, 0.35, 0, 1.3, PLINTH, T.granite)
  slab(out, e, u0, u1, -0.3, 0.18, 1.3, base, CREAM, T.terracotta)
  for (const y of [3.0, 5.4, 7.6]) ledge(out, e, u0, u1, 0.24, y, y + 0.32, CREAM_SHADE, T.terracotta, false)
  // five bays: windows in two storeys, the door in the middle under its pedimented aedicule
  const bay = (W - 2 * pier) / 5
  for (let k = 0; k < 5; k++) {
    const c = u0 + pier + bay * (k + 0.5)
    if (k === 2) continue
    panel(out, e, c - bay * 0.3, c + bay * 0.3, 0.2, 1.6, 4.4, WINDOW, T.glass)
    panel(out, e, c - bay * 0.3, c + bay * 0.3, 0.2, 5.9, 8.5, WINDOW, T.glass)
  }
  // the end bays of the base have a window of their own each storey
  for (const c of [u0 + pier / 2, u1 - pier / 2]) {
    panel(out, e, c - pier * 0.28, c + pier * 0.28, 0.2, 1.6, 4.4, WINDOW, T.glass)
    panel(out, e, c - pier * 0.28, c + pier * 0.28, 0.2, 5.9, 8.5, WINDOW, T.glass)
  }
  // the doorway: a recess, its moulded jambs, a lintel and a pediment on consoles
  panel(out, e, mid - 1.3, mid + 1.3, 0.19, 0, 4.6, [0.12, 0.13, 0.14], T.glass)
  slab(out, e, mid - 2.0, mid - 1.3, 0, 0.5, 0, 5.4, CREAM, T.terracotta)
  slab(out, e, mid + 1.3, mid + 2.0, 0, 0.5, 0, 5.4, CREAM, T.terracotta)
  slab(out, e, mid - 2.3, mid + 2.3, 0, 0.7, 5.4, 6.0, CREAM, T.terracotta)
  {
    const P = (u: number, o: number, y: number): [number, number, number] => [e.a.x + e.tx * u + e.nx * o, y, e.a.z + e.tz * u + e.nz * o]
    const yb = 6.0
    const h = 1.3
    quad(out, [P(mid - 2.4, 0.7, yb), P(mid + 2.4, 0.7, yb), P(mid, 0.7, yb + h), P(mid, 0.7, yb + h)], [e.nx, 0, e.nz], CREAM, T.terracotta)
    const up: [number, number, number] = [e.nx * 0.5, 0.86, e.nz * 0.5]
    quad(out, [P(mid - 2.4, 0.7, yb), P(mid - 2.4, 0, yb), P(mid, 0, yb + h), P(mid, 0.7, yb + h)], up, CREAM, T.terracotta)
    quad(out, [P(mid, 0.7, yb + h), P(mid, 0, yb + h), P(mid + 2.4, 0, yb), P(mid + 2.4, 0.7, yb)], up, CREAM, T.terracotta)
    // the tympanum's shadowed field, a step in
    quad(out, [P(mid - 1.6, 0.72, yb + 0.15), P(mid + 1.6, 0.72, yb + 0.15), P(mid, 0.72, yb + h * 0.7), P(mid, 0.72, yb + h * 0.7)], [e.nx, 0, e.nz], CREAM_SHADE, T.terracotta)
  }
  // a granite step at the door, flush with the pavement as the real one nearly is, and the 2006 sign band
  slab(out, e, mid - 2.6, mid + 2.6, 0.35, 1.25, 0, 0.16, PLINTH, T.granite)
  // the base cornice: an egg-and-dart moulding read as a gold course, the green frieze under it, the projecting slab
  ledge(out, e, u0, u1, 0.3, base - 0.9, base - 0.45, VERDIGRIS, T.terracotta, false)
  ledge(out, e, u0, u1, 0.36, base - 0.45, base, GILT, T.terracotta, false)
  slab(out, e, u0 - 0.2, u1 + 0.2, -0.3, 0.8, base, base + 0.55, CREAM, T.terracotta)
  // the colonnade storey: the wall set back between the end piers, three storeys of windows, the balconettes
  slab(out, e, u0, u0 + pier, -0.3, 0.35, base + 0.55, eaves - 2.4, CREAM, T.terracotta)
  slab(out, e, u1 - pier, u1, -0.3, 0.35, base + 0.55, eaves - 2.4, CREAM, T.terracotta)
  panel(out, e, u0 + pier, u1 - pier, -0.25, base + 0.55, eaves - 2.4, CREAM_SHADE, T.terracotta)
  // panelled pilaster strips up the face of each end pier
  for (const c of [u0 + pier / 2, u1 - pier / 2]) ledge(out, e, c - pier * 0.3, c + pier * 0.3, 0.45, base + 1.2, colTop - 0.6, CREAM, T.terracotta)
  const cols = 4
  const span = (u1 - pier) - (u0 + pier)
  const pitch = span / (cols + 1)
  for (let k = 0; k < 5; k++) {
    // windows in each intercolumniation: a pair under a gold spandrel, in three storeys
    const c = u0 + pier + pitch * (k + 0.5)
    const w = pitch * 0.62
    for (const [ya, yb] of [[base + 1.6, base + 4.4], [base + 5.4, base + 8.2], [base + 9.0, base + 10.4]] as const) {
      panel(out, e, c - w / 2, c + w / 2, -0.22, ya, yb, WINDOW, T.glass)
      ledge(out, e, c - w / 2 - 0.15, c + w / 2 + 0.15, 0.06, ya - 0.55, ya - 0.05, GILT, T.terracotta, false)
      // the mullion between the pair
      ledge(out, e, c - 0.1, c + 0.1, 0.03, ya, yb, CREAM, T.terracotta, false)
    }
    // the lattice balconette at the foot of each bay
    slab(out, e, c - w / 2 - 0.2, c + w / 2 + 0.2, 0, 0.65, base + 0.55, base + 1.5, [0.9, 0.88, 0.82], T.terracotta)
  }
  // the four giant Ionic columns, free of the wall, gilded shafts with cream capitals: the face of the building
  for (let k = 1; k <= cols; k++) {
    const p = at(e, u0 + pier + pitch * k, 1.05)
    classicalColumn(out, p.x, p.z, base + 0.55, colTop, 0.62, GILT,
      { order: 'ionic', tier: 'near', tag: T.terracotta, heading: e.heading, flutes: true, trim: CREAM })
  }
  // the entablature across the whole front, the plain attic course, the cornice and its cresting of antefixes
  slab(out, e, u0, u1, -0.3, 1.7, colTop, colTop + 0.9, CREAM, T.terracotta, true)
  slab(out, e, u0, u1, -0.3, 0.45, colTop + 0.9, eaves - 1.0, CREAM, T.terracotta)
  ledge(out, e, u0, u1, 0.5, eaves - 1.6, eaves - 1.3, GILT, T.terracotta, false)
  slab(out, e, u0 - 0.3, u1 + 0.3, -0.3, 1.25, eaves - 1.0, eaves - 0.25, CREAM, T.terracotta, true)
  slab(out, e, u0 - 0.3, u1 + 0.3, -0.3, 1.15, eaves - 0.25, eaves, CREAM, T.terracotta)
  const nAnt = Math.round(W / 1.25)
  for (let k = 0; k <= nAnt; k++) {
    const p = at(e, u0 + (W * k) / nAnt, 1.0)
    box(out, p.x, eaves + 0.25, p.z, 0.16, 0.25, 0.16, CREAM, T.terracotta)
  }
}

// ---------------------------------------------------------------------------------------- the Bowes Center

const WHITE_PANEL: Rgb = [0.9, 0.9, 0.88]
const BOWES_GLASS: Rgb = [0.24, 0.3, 0.37]
const BANNER: Rgb = [0.6, 0.1, 0.13]

function bowesCenter(out: MeshBuilder, fit: Fit): void {
  const ring = wallsOf(fit)
  const fi = frontIndex(ring)               // Van Ness (manifest front 261)
  const H = Math.max(40, fit.height || 46)
  const g = 7                                 // the double-height glazed base
  const band = H - 9.6                        // the white band under the glazed top
  // the base: glass set 0.8 m back under the slab edge, its mullions, the band of the second-floor slab
  const inner = insetRing(ring, 0.8)
  faceBand(out, inner, 0, g, { kind: 'curtain', wall: [0.32, 0.33, 0.35], glass: [0.2, 0.24, 0.28], pitch: 2.4, floor: g / 2 })
  for (let i = 0; i < ring.length; i++) {
    const e = edgeOf(ring, i)
    soffit(out, e, 0, e.L, -0.8, 0, g, [0.82, 0.82, 0.8], T.concrete)
    // the corner piers that carry the slab
    slab(out, e, 0, 0.8, -0.8, 0, 0, g, [0.82, 0.82, 0.8], T.concrete)
  }
  // the shaft: white panels, tall punched windows, nine floors
  faceBand(out, ring, g, band, { kind: 'punched', wall: WHITE_PANEL, glass: BOWES_GLASS, pitch: 2.9, floor: (band - g) / 9, solid: 0.6, material: 'concrete' })
  // the panel joints: a fine vertical line between each pair of windows, and the white band at the top
  for (let i = 0; i < ring.length; i++) {
    const e = edgeOf(ring, i)
    ledge(out, e, 0, e.L, 0.35, band - 0.2, band + 0.6, WHITE_PANEL, T.concrete)
    ledge(out, e, 0, e.L, 0.12, g - 0.2, g + 0.5, WHITE_PANEL, T.concrete)
  }
  // the top two floors: glass all round, then the screen of white louvres in front of the upper one
  const top = insetRing(ring, 0.5)
  faceBand(out, top, band + 0.6, H - 0.6, { kind: 'curtain', wall: [0.7, 0.72, 0.74], glass: BOWES_GLASS, pitch: 1.8, floor: 4.3 })
  capPolygon(out, ring, H, [0.62, 0.63, 0.63], T.concrete)
  const front = edgeOf(ring, fi)
  const louvreY0 = band + 4.6
  for (let i = 0; i < ring.length; i++) {
    const e = edgeOf(ring, i)
    // the screen stops short of the Van Ness / Hayes corner (the front's `b` end) on both faces there, which shows
    // the glazed corner behind it
    const openAtEnd = i === fi
    const openAtStart = i === (fi + 1) % ring.length
    const s0 = openAtStart ? 9 : 0
    const s1 = openAtEnd ? e.L - 9 : e.L
    const n = Math.max(1, Math.round((s1 - s0) / 1.1))
    for (let k = 0; k <= n; k++) {
      const u = s0 + ((s1 - s0) * k) / n
      slab(out, e, u - 0.09, u + 0.09, -0.3, 0.45, louvreY0, H + 0.4, WHITE_PANEL, T.metal)
    }
    slab(out, e, s0, s1, -0.3, 0.45, H + 0.4, H + 0.8, WHITE_PANEL, T.concrete)
  }
  // the Conservatory's red banner over the base toward the Hayes corner, its name in gold
  const bw = Math.min(15, front.L * 0.42)
  const bu = front.L - 3 - bw / 2
  slab(out, front, bu - bw / 2, bu + bw / 2, 0, 0.25, g - 2.4, g - 0.3, BANNER, T.metal)
  const c = at(front, bu + 1.5, 0.28)
  signText(out, 'SAN FRANCISCO', c.x, g - 1.0, c.z, 0.55, [0.95, 0.82, 0.4], { heading: front.heading })
  const c2 = at(front, bu + 1.5, 0.28)
  signText(out, 'CONSERVATORY OF MUSIC', c2.x, g - 1.75, c2.z, 0.55, [0.95, 0.82, 0.4], { heading: front.heading })
  // the gold roundel at its left end
  slab(out, front, bu - bw / 2 + 0.6, bu - bw / 2 + 1.8, 0.25, 0.3, g - 1.95, g - 0.75, [0.9, 0.7, 0.2], T.metal)
}

// -------------------------------------------------------------------------------------------------- SFJAZZ

const PRECAST: Rgb = [0.74, 0.76, 0.77]       // the light grey precast frame (Mapillary -01/-03)
const JAZZ_GLASS: Rgb = [0.2, 0.25, 0.3]
const LOBBY: Rgb = [0.3, 0.31, 0.31]         // the lit lobby through the ground-floor glass

function sfjazzCenter(out: MeshBuilder, fit: Fit): void {
  const ring = wallsOf(fit)
  const fi = frontIndex(ring)                 // Franklin Street (manifest front 81); Fell is the next edge round
  const H = Math.max(12, fit.height || 13)
  const g = 5.0                               // the ground floor's glass, under the cantilever
  const rec = 1.6                             // how far it is set back
  // the parts of the outline that are not street fronts: precast with a few windows
  const streets = [fi, (fi + 1) % ring.length]
  const others = ring.map((_, i) => i).filter((i) => !streets.includes(i))
  faceBand(out, ring, 0, H + 0.6, { kind: 'punched', wall: PRECAST, glass: JAZZ_GLASS, pitch: 7, floor: 4.3, solid: 0.75, material: 'concrete' }, others)
  capPolygon(out, ring, H + 0.6, [0.55, 0.56, 0.57], T.concrete)
  // the auditorium's box and the fly over it, darker grey, standing off the roof toward the back
  const fr = edgeOf(ring, fi)
  const hall = behind(between(ring, fr, fr.L * 0.18, fr.L * 0.72), fr, 12)
  mass(out, insetRing(hall, 2.5), H + 0.6, H + 4.4, { kind: 'blank', wall: [0.46, 0.47, 0.49], material: 'concrete' }, [0.4, 0.41, 0.42])
  for (const i of streets) {
    const e = edgeOf(ring, i)
    // which end is the Fell / Franklin corner: Franklin's `b` end, Fell's `a` end
    const cornerAtEnd = i === fi
    const glassy = (u: number): boolean => (cornerAtEnd ? u > e.L - 9 : u < 9)
    // the ground floor: transparent glass well back, the lobby lit behind it, the soffit, slender steel columns
    panel(out, e, 0, e.L, -rec, 0, g, LOBBY, T.glass)
    for (let u = 0; u <= e.L; u += 3) ledge(out, e, u - 0.04, u + 0.04, 0.06 - rec, 0, g, [0.3, 0.31, 0.33], T.metal, false)
    soffit(out, e, 0, e.L, -rec, 0, g, [0.72, 0.73, 0.73], T.concrete)
    const nCol = Math.max(2, Math.round(e.L / 9))
    for (let k = 1; k < nCol; k++) {
      const p = at(e, (e.L * k) / nCol, -0.5)
      prism(out, p.x, p.z, 0, g, 0.18, 8, [0.55, 0.56, 0.58], T.metal)
    }
    // the upper storeys: tall glass with a solid precast panel standing proud in every bay, a spandrel band at each
    // floor, the parapet band on top; at the corner the panels give way to glass all the way, its railings showing
    panel(out, e, 0, e.L, 0, g, H, JAZZ_GLASS, T.glass)
    const pitch = 3.6
    const n = Math.max(2, Math.round(e.L / pitch))
    const bw = e.L / n
    for (let k = 0; k < n; k++) {
      // one solid panel to a bay, a floor at a time, the upper floor's shifted half a bay: the stagger that makes
      // the frame read as Cavagnero's and not an office block's (Mapillary -01)
      for (const [y0, y1, shift] of [[g + 0.9, g + 4.0, 0.3], [g + 4.6, H - 0.6, 0.7]] as const) {
        const u = bw * (k + shift)
        if (glassy(u)) continue
        slab(out, e, u - bw * 0.16, u + bw * 0.16, 0, 0.4, y0, y1, PRECAST, T.concrete)
      }
    }
    for (const [y0, y1, o] of [[g, g + 0.9, 0.45], [g + 4.0, g + 4.6, 0.3], [H - 0.6, H + 0.6, 0.5]] as const) {
      slab(out, e, 0, e.L, -0.2, o, y0, y1, PRECAST, T.concrete, y0 === g)
    }
    // the corner: brighter glass, mullions and the balcony rails of the lobby galleries inside
    const c0 = cornerAtEnd ? e.L - 9 : 0
    const c1 = cornerAtEnd ? e.L : 9
    panel(out, e, c0, c1, 0.02, g + 0.9, H - 0.6, [0.36, 0.42, 0.47], T.glass)
    for (let u = c0; u <= c1 + 0.01; u += 1.5) ledge(out, e, u - 0.05, u + 0.05, 0.08, g + 0.9, H - 0.6, [0.62, 0.63, 0.64], T.metal, false)
    for (const y of [g + 1.9, g + 5.6]) ledge(out, e, c0, c1, 0.1, y, y + 0.08, [0.25, 0.26, 0.28], T.metal, false)
  }
  // the vertical blade at the corner on Franklin, navy with the name down it
  const p = at(fr, fr.L - 1.2, 0.9)
  const dir = fr.heading
  box(out, p.x, (g + H) / 2 + 0.6, p.z, 0.45, (H - g) / 2 - 0.4, 0.45, [0.12, 0.15, 0.32], T.metal)
  for (const s of [-1, 1]) {
    // both faces of the blade, read along the street
    const q = { x: p.x + fr.tx * 0.47 * s, z: p.z + fr.tz * 0.47 * s }
    signText(out, 'SFJAZZ', q.x, (g + H) / 2 + 0.6, q.z, 0.75, [0.95, 0.95, 0.95], { heading: dir - (s * Math.PI) / 2, vertical: true })
  }
}

// ------------------------------------------------------------------------------------------ the SF Ballet

const BALLET: Rgb = [0.75, 0.75, 0.73]          // pale concrete panels (Commons "San_Francisco_Ballet.jpg")
const BALLET_SHADE: Rgb = [0.5, 0.5, 0.49]
const BALLET_GLASS: Rgb = [0.2, 0.23, 0.27]

function sfBallet(out: MeshBuilder, fit: Fit): void {
  const ring = wallsOf(fit)
  const fi = longestIndex(ring)                  // Franklin: the long east front; the Fulton corner is its `b` end
  const H = Math.max(18, fit.height || 22)
  const front = edgeOf(ring, fi)
  const side = edgeOf(ring, fi + 1)              // the Fulton end
  const loggia = H - 5.6                        // the top storey's loggia, from here to the parapet beam
  // every wall: panelled concrete, a base storey pair, a middle of punched windows (the loggia is drawn on the streets)
  const others = ring.map((_, i) => i).filter((i) => i !== fi && i !== (fi + 1) % ring.length)
  faceBand(out, ring, 0, H, { kind: 'punched', wall: BALLET, glass: BALLET_GLASS, pitch: 4.2, floor: 4.4, solid: 0.55, material: 'concrete' }, others)
  capPolygon(out, ring, H, [0.6, 0.6, 0.58], T.concrete)
  for (const e of [front, side]) {
    const isFront = e === front
    // the corner entry takes the last 11 m of Franklin, and the first 7 m of Fulton
    const e0 = isFront ? 0 : 7
    const e1 = isFront ? e.L - 11 : e.L
    // the base: two storeys, big square windows between panelled piers, a deep string course over it
    slab(out, e, 0, e.L, -0.3, 0.05, 0, loggia, BALLET, T.concrete)
    const nb = Math.max(1, Math.round((e1 - e0) / 4.8))
    const bw = (e1 - e0) / nb
    for (let k = 0; k < nb; k++) {
      const c = e0 + bw * (k + 0.5)
      panel(out, e, c - bw * 0.32, c + bw * 0.32, 0.07, 1.0, 3.6, BALLET_GLASS, T.glass)
      panel(out, e, c - bw * 0.32, c + bw * 0.32, 0.07, 4.6, 7.0, BALLET_GLASS, T.glass)
      // the middle storeys: a pair of narrower windows each floor
      for (const y of [8.8, 12.2]) {
        if (y + 2.4 > loggia - 0.6) continue
        panel(out, e, c - bw * 0.3, c - bw * 0.04, 0.07, y, y + 2.3, BALLET_GLASS, T.glass)
        panel(out, e, c + bw * 0.04, c + bw * 0.3, 0.07, y, y + 2.3, BALLET_GLASS, T.glass)
      }
      // the panel joints: a reveal at each pier
      ledge(out, e, e0 + bw * k - 0.06, e0 + bw * k + 0.06, 0.03, 0, loggia, BALLET_SHADE, T.concrete, false)
    }
    ledge(out, e, 0, e.L, 0.35, 7.6, 8.2, BALLET, T.concrete)
    // the loggia: the wall set well back in shadow, round columns on the face line, the parapet beam with the name
    panel(out, e, 0, e.L, -2.2, loggia, H - 1.6, BALLET_SHADE, T.concrete)
    for (let k = 0; k < Math.max(1, Math.round(e.L / 6)); k++) {
      const c = (e.L * (k + 0.5)) / Math.max(1, Math.round(e.L / 6))
      panel(out, e, c - 1.4, c + 1.4, -2.15, loggia + 0.8, H - 2.4, BALLET_GLASS, T.glass)
    }
    soffit(out, e, 0, e.L, -2.2, 0, H - 1.6, BALLET_SHADE, T.concrete)
    capPolygon(out, [at(e, 0, -2.2), at(e, e.L, -2.2), at(e, e.L, 0), at(e, 0, 0)].reverse(), loggia, BALLET, T.concrete)
    const nc = Math.max(2, Math.round(e.L / 7.5))
    for (let k = 0; k <= nc; k++) {
      const p = at(e, (e.L * k) / nc, -0.55)
      prism(out, p.x, p.z, loggia, H - 1.6, 0.5, 10, BALLET, T.concrete)
    }
    slab(out, e, 0, e.L, -2.2, 0.15, H - 1.6, H + 0.4, BALLET, T.concrete, true)
  }
  // the name on the Franklin parapet, toward the corner
  const nm = at(front, front.L - 16, 0.18)
  signText(out, 'SAN FRANCISCO BALLET', nm.x, H - 0.6, nm.z, 0.95, [0.14, 0.15, 0.17], { heading: front.heading })
  // the corner entry: a two-storey proscenium frame across the Franklin / Fulton corner, rippled glass behind it,
  // the curved balconies of the "boxes" over the doors
  const u0 = front.L - 11
  slab(out, front, u0, front.L, -1.2, 0.05, 0, 10.4, [0.66, 0.66, 0.64], T.concrete)   // the recess's shadowed reveal
  for (let k = 0; k < 10; k++) {
    // the ripple: glass panes alternately in and out, which is what reads as a curtain
    const ua = u0 + 1.2 + k * 0.92
    panel(out, front, ua, ua + 0.92, 0.08 + (k % 2) * 0.35, 0, 9.0, k % 2 ? [0.3, 0.36, 0.42] : [0.22, 0.27, 0.32], T.glass)
  }
  slab(out, side, 0, 7, -1.2, 0.05, 0, 9.0, [0.66, 0.66, 0.64], T.concrete)
  for (let k = 0; k < 6; k++) {
    const ua = 1.2 + k * 0.95
    panel(out, side, ua, ua + 0.95, 0.08 + (k % 2) * 0.35, 0, 9.0, k % 2 ? [0.3, 0.36, 0.42] : [0.22, 0.27, 0.32], T.glass)
  }
  slab(out, front, u0, u0 + 1.2, 0, 0.7, 0, 10.6, BALLET, T.concrete)
  slab(out, side, 0, 1.2, 0, 0.7, 0, 10.6, BALLET, T.concrete)
  // the proscenium's head: a deep lintel, its underside stepped into an arch
  slab(out, front, u0, front.L + 0.7, 0, 0.7, 9.0, 10.6, BALLET, T.concrete, true)
  slab(out, side, -0.7, 7, 0, 0.7, 9.0, 10.6, BALLET, T.concrete, true)
  for (let k = 0; k < 4; k++) {
    const w = 4.6 - k * 1.1
    const c = u0 + 5.6
    slab(out, front, c - w, c + w, 0, 0.6, 8.2 + k * 0.2 - 0.2, 9.0, BALLET, T.concrete, true)
  }
  for (const y of [4.4]) {
    for (let k = 0; k < 2; k++) {
      const c = u0 + 3 + k * 5
      prism(out, at(front, c, 0.5).x, at(front, c, 0.5).z, y, y + 1.0, 1.15, 8, BALLET, T.concrete)
    }
  }
}

// ------------------------------------------------------------------------ the Phillip Burton Federal Building

const PIER: Rgb = [0.8, 0.79, 0.75]
const BURTON_GLASS: Rgb = [0.29, 0.32, 0.36]
const LOUVRE: Rgb = [0.26, 0.27, 0.28]
const PLAZA: Rgb = [0.66, 0.65, 0.62]

function phillipBurtonFederal(out: MeshBuilder, fit: Fit): void {
  const ring = wallsOf(fit)
  const H = Math.max(60, fit.height || 95)
  const base = 8
  const mech = H - 7.5
  // the shaft: deep piers every ~6 m standing 0.9 m proud over grey glass, a spandrel line at each floor
  const shaft: Face = { kind: 'fins', wall: PIER, glass: BURTON_GLASS, pitch: 6.1, solid: 0.16, depth: 0.95, floor: 4.0, material: 'concrete' }
  faceBand(out, ring, base, mech, shaft)
  // the mechanical floors: the piers carry on, dark louvres between
  faceBand(out, ring, mech, H, { ...shaft, glass: LOUVRE, floor: H - mech })
  // the base: the piers run down to the ground, plain stone between them, set back
  faceBand(out, ring, 0, base, { ...shaft, glass: [0.7, 0.69, 0.66], floor: base, material: 'ashlar' })
  capPolygon(out, ring, H, [0.58, 0.58, 0.57], T.concrete)
  for (let i = 0; i < ring.length; i++) {
    const e = edgeOf(ring, i)
    if (e.L < 8) continue
    // the parapet cap over the piers, and the slender mullion: one to a bay, which is what makes the glass read
    // as a grid rather than a stripe (Mapillary -04)
    slab(out, e, 0, e.L, -0.2, 1.0, H, H + 0.6, PIER, T.concrete)
    const n = Math.max(1, Math.round(e.L / 6.1))
    const bw = e.L / n
    for (let k = 0; k < n; k++) {
      for (const f of [1 / 2]) {
        const u = bw * (k + f)
        ledge(out, e, u - 0.06, u + 0.06, 0.12, base, mech, [0.62, 0.63, 0.63], T.metal, false)
      }
    }
    // the louvre band's slats, read as three dark horizontal lines across each face
    for (const y of [mech + 2, mech + 4, mech + 6]) ledge(out, e, 0, e.L, 0.1, y, y + 0.25, [0.4, 0.41, 0.42], T.metal, false)
  }
  // the roof plant
  const plant = insetRing(ring, 12)
  mass(out, plant, H, H + 3.5, { kind: 'blank', wall: [0.62, 0.62, 0.6] }, [0.55, 0.55, 0.55])
  // the Golden Gate front: the entrance's dark glass, and the raised plaza with its steps and planters
  const fr = edgeOf(ring, frontIndex(ring))
  const m = fr.L / 2
  panel(out, fr, m - 9, m + 9, 0.05, 0.9, 5.2, [0.16, 0.18, 0.2], T.glass)
  const plazaD = 5.5
  slab(out, fr, fr.L * 0.12, fr.L * 0.88, 0, plazaD, 0, 0.9, PLAZA, T.granite)
  for (let s = 0; s < 4; s++) {
    // the flight down to the pavement across the middle of the plaza
    slab(out, fr, m - 12, m + 12, plazaD, plazaD + 0.36 * (4 - s), 0, 0.9 - s * 0.225, PLAZA, T.granite)
  }
  for (const u of [fr.L * 0.18, fr.L * 0.3, fr.L * 0.7, fr.L * 0.82]) {
    // planters with their hedges
    slab(out, fr, u - 4, u + 4, 1.5, 4.5, 0.9, 1.5, PLAZA, T.granite)
    slab(out, fr, u - 3.8, u + 3.8, 1.7, 4.3, 1.5, 2.2, [0.3, 0.42, 0.26], surfaceTag('foliage'))
  }
}

export const CIVIC_VENUES: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  sfConservatory,
  bowesCenter,
  sfjazzCenter,
  b4_ballet_256720199: sfBallet,
  phillipBurtonFederal,
}
