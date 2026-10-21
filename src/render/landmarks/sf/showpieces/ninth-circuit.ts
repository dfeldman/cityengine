/**
 * The James R. Browning U.S. Court of Appeals Building (relation/19306325 + way/38612651), 95 Seventh Street at
 * Mission: the 1905 Post Office and Courthouse by James Knox Taylor, which came through the 1906 earthquake, and
 * George Kelham's 1933-34 wing that closed its courtyard. From the Mapillary frames (refs/relation-19306325/,
 * 01-02 and 05-07) and the Library of Congress / Commons photographs of the Seventh Street front, the Mission front
 * and the primary entrance (2026-10-21).
 *
 * What the photographs show, piece by piece:
 *  - a white Sierra granite palazzo, a whole block, flat-roofed behind a balustrade (no hipped or tiled roofs
 *    anywhere: the pavilions are taller blocks with their own balustrades and urns, not roofs);
 *  - the BASE: banded rustication through two storeys — tall round-arched windows on the ground storey, each in a
 *    fan of radiating voussoirs, square mezzanine windows over them under flat arches of the same — on a granite
 *    water table, with a low granite balustrade along the pavement in front of the long ranges;
 *  - over a heavy string course, the PIANO NOBILE: tall windows in moulded surrounds under triangular pediments
 *    on consoles, then a frieze and the deep modillioned cornice, then the balustrade with its posts;
 *  - the PAVILIONS, a storey taller, with paired giant pilasters, urns on their balustrades: a TOWER at each
 *    corner of Seventh Street; on Seventh, next to the Mission corner, the gabled pavilion over the side entrance
 *    (the flag over it), then the long range of fifteen bays to the Stevenson tower; on Mission and Stevenson
 *    the two pavilions OSM draws proud of the wall — on Mission the nearer one the broad entrance pavilion
 *    ("95", the great arch and its steps between two arched windows), the other a window pavilion;
 *  - the ENTRANCES: a great arch of radiating voussoirs over two storeys, inside it a pedimented aedicule of
 *    banded columns round the bronze doors and a window over it; a short broad flight of granite steps between
 *    two plinths carrying bronze planter bowls, and tall verdigris bronze lanterns on the wall either side;
 *  - the 1933 WING at the far end of the block: the same height, plainer — smooth stone over a banded base, four
 *    storeys of plain windows, pediments only on the third, a simple cornice and parapet;
 *  - verdigris lamp standards with globes along the Seventh and Mission kerbs, and the flag over the main pavilion.
 *
 * The frame: the real outline as given. Seventh Street is FOUND on it — its longest edge, straight for 96 m (the
 * street centrelines in the Overpass cache confirm it: Seventh along the south-west face, Mission the south-east,
 * Stevenson the north-west). Anticlockwise, that edge runs from the Stevenson corner to the Mission corner, which
 * tells the two sides apart. The 1933 wing is whatever lies within ~19 m of the back.
 *
 * The Library of Congress captions of the two long fronts look swapped against the outline: the front with the
 * gable and the long uniform range is the 96 m straight one, the front with the broad entrance pavilion is the one
 * whose two pavilions OSM draws 3.7 m proud. The model follows the outline (and the Commons corner photograph).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { capPolygon } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { prism, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { stair } from '../../parts.ts'
import { simplifyRing } from '../districts/market-west.ts'

type P2 = { x: number; z: number }
const FIXED = 0
/** keeps its colour and glows after dark (models.ts EMIT) */
const EMIT = 0.5
const T = { granite: surfaceTag('granite'), metal: surfaceTag('metal'), concrete: surfaceTag('concrete') }

// the Sierra granite: pale and a little warm, greyer than white in every frame
const GRANITE: Rgb = [0.83, 0.82, 0.78]
const RUSTIC: Rgb = [0.78, 0.77, 0.73]
const JOINT: Rgb = [0.52, 0.52, 0.5]
const VOUSSOIR: Rgb = [0.84, 0.83, 0.79]
const DEEP: Rgb = [0.6, 0.6, 0.57]
const SHADE: Rgb = [0.5, 0.5, 0.48]
/** the 1933 wing's smoother, slightly paler stone and terra cotta */
const ANNEX: Rgb = [0.83, 0.82, 0.78]
const GLASS: Rgb = [0.2, 0.22, 0.24]
const DARK: Rgb = [0.15, 0.14, 0.13]
const DOOR: Rgb = [0.24, 0.17, 0.11]
const ROOF: Rgb = [0.5, 0.5, 0.5]
const VERDIGRIS: Rgb = [0.33, 0.5, 0.44]
const LAMP: Rgb = [1, 0.88, 0.62]
const PLANT: Rgb = [0.36, 0.48, 0.24]

/** Heights over the pavement, read off the photographs (the pavilions a storey taller than the ranges). */
const Y = {
  table: 1.1,     // the water table; the entrance floors
  base: 12.4,     // top of the banded rustication (ground storey + mezzanine)
  string: 13.2,   // top of the string course
  frieze: 20.8,   // the range's frieze starts
  cornice: 22.4,  // the range's cornice
  eaves: 23.6,    // the range's cornice top: the roof and its balustrade
  rail: 25.0,     // the range's balustrade top
  pFrieze: 24.6,  // the pavilions' entablature
  pCornice: 26.2,
  pEaves: 27.4,
  pRail: 28.9,
}

// ------------------------------------------------------------------------------------------- an edge's frame

/** A wall's frame: `u` along it from `o`rigin, `o` outward (negative into the building), y up. */
interface Fr { ox: number; oz: number; tx: number; tz: number; nx: number; nz: number; L: number }

const frameOf = (a: P2, b: P2): Fr => {
  const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
  const tx = (b.x - a.x) / L
  const tz = (b.z - a.z) / L
  return { ox: a.x, oz: a.z, tx, tz, nx: tz, nz: -tx, L }
}
const P = (f: Fr, u: number, o: number, y: number): [number, number, number] =>
  [f.ox + f.tx * u + f.nx * o, y, f.oz + f.tz * u + f.nz * o]
const pt = (f: Fr, u: number, o: number): P2 => ({ x: f.ox + f.tx * u + f.nx * o, z: f.oz + f.tz * u + f.nz * o })
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

/** A block in a frame: `u0..u1` along, `o0..o1` out, `y0..y1` up (`bottom` false drops the underside). */
function slab(out: MeshBuilder, f: Fr, u0: number, u1: number, o0: number, o1: number, y0: number, y1: number, c: Rgb, tag = FIXED, bottom = false): void {
  const Q = (u: number, o: number, y: number) => P(f, u, o, y)
  out.quad([Q(u0, o1, y0), Q(u1, o1, y0), Q(u1, o1, y1), Q(u0, o1, y1)], [f.nx, 0, f.nz], UV, c, tag)
  out.quad([Q(u1, o0, y0), Q(u0, o0, y0), Q(u0, o0, y1), Q(u1, o0, y1)], [-f.nx, 0, -f.nz], UV, c, tag)
  out.quad([Q(u0, o0, y0), Q(u0, o1, y0), Q(u0, o1, y1), Q(u0, o0, y1)], [-f.tx, 0, -f.tz], UV, c, tag)
  out.quad([Q(u1, o1, y0), Q(u1, o0, y0), Q(u1, o0, y1), Q(u1, o1, y1)], [f.tx, 0, f.tz], UV, c, tag)
  out.quad([Q(u0, o0, y1), Q(u0, o1, y1), Q(u1, o1, y1), Q(u1, o0, y1)], [0, 1, 0], UV, c, tag)
  if (bottom) out.quad([Q(u0, o1, y0), Q(u0, o0, y0), Q(u1, o0, y0), Q(u1, o1, y0)], [0, -1, 0], UV, c, tag)
}

/** A flat rectangle facing out of the wall, `o` metres proud of it. */
function panel(out: MeshBuilder, f: Fr, u0: number, u1: number, o: number, y0: number, y1: number, c: Rgb, tag = FIXED): void {
  out.quad([P(f, u0, o, y0), P(f, u1, o, y0), P(f, u1, o, y1), P(f, u0, o, y1)], [f.nx, 0, f.nz], UV, c, tag)
}

/** A round-headed opening `w` wide, `h` tall from `y0`, centred `u` along, `o` proud: a rectangle and a half-disc. */
function arch(out: MeshBuilder, f: Fr, u: number, o: number, y0: number, w: number, h: number, c: Rgb, seg = 5, tag = FIXED): void {
  const r = w / 2
  const spring = y0 + h - r
  if (spring > y0) panel(out, f, u - r, u + r, o, y0, spring, c, tag)
  for (let i = 0; i < seg; i++) {
    const a0 = Math.PI - (i / seg) * Math.PI
    const a1 = Math.PI - ((i + 1) / seg) * Math.PI
    out.quad([P(f, u, o, spring), P(f, u + Math.cos(a0) * r, o, spring + Math.sin(a0) * r), P(f, u + Math.cos(a1) * r, o, spring + Math.sin(a1) * r), P(f, u, o, spring)],
      [f.nx, 0, f.nz], UV, c, tag)
  }
}

/** A pediment `w` wide and `h` high on `y0`, standing `d` proud: the tympanum and its two raking tops. */
function pediment(out: MeshBuilder, f: Fr, u: number, y0: number, w: number, h: number, d: number, c: Rgb, tym: Rgb = c): void {
  const u0 = u - w / 2
  const u1 = u + w / 2
  out.quad([P(f, u0, d, y0), P(f, u1, d, y0), P(f, u, d, y0 + h), P(f, u, d, y0 + h)], [f.nx, 0, f.nz], UV, tym, FIXED)
  const k = Math.hypot(h, w / 2) || 1
  out.quad([P(f, u0, 0, y0), P(f, u0, d, y0), P(f, u, d, y0 + h), P(f, u, 0, y0 + h)],
    [-f.tx * h / k, (w / 2) / k, -f.tz * h / k], UV, c, FIXED)
  out.quad([P(f, u, 0, y0 + h), P(f, u, d, y0 + h), P(f, u1, d, y0), P(f, u1, 0, y0)],
    [f.tx * h / k, (w / 2) / k, f.tz * h / k], UV, c, FIXED)
}

// ----------------------------------------------------------------------------------------- the ring's shape

function depthOf(ring: P2[], f: Fr): number {
  let d = 0
  for (const p of ring) d = Math.max(d, -((p.x - f.ox) * f.nx + (p.z - f.oz) * f.nz))
  return d
}

// ---------------------------------------------------------------------------------------------- the pieces

/** The banded rustication of a stretch of base: the channelled joints as shadow lines. */
function courses(out: MeshBuilder, f: Fr, u0: number, u1: number, y0: number, y1: number, step = 0.72): void {
  for (let y = y0 + step; y < y1 - 0.15; y += step) panel(out, f, u0, u1, 0.03, y - 0.06, y + 0.06, JOINT)
}

/** The radiating joints of a ring of voussoirs, `n` stones, between radii `r0` and `r1` round a centre at `ys`. */
function fan(out: MeshBuilder, f: Fr, u: number, o: number, ys: number, r0: number, r1: number, n: number): void {
  for (let k = 1; k < n; k++) {
    const a = (Math.PI * k) / n
    const c = Math.cos(a)
    const sn = Math.sin(a)
    const hw = 0.05
    out.quad([P(f, u + c * r0 + sn * hw, o, ys + sn * r0 - c * hw), P(f, u + c * r1 + sn * hw, o, ys + sn * r1 - c * hw),
      P(f, u + c * r1 - sn * hw, o, ys + sn * r1 + c * hw), P(f, u + c * r0 - sn * hw, o, ys + sn * r0 + c * hw)], [f.nx, 0, f.nz], UV, JOINT, FIXED)
  }
}

/** A round-arched window of the ground storey in its fan of voussoirs, with its keystone and sill. */
function groundArch(out: MeshBuilder, f: Fr, u: number, w: number, h: number): void {
  const y0 = Y.table + 0.5
  arch(out, f, u, 0.05, y0 - 0.1, w + 1.6, h + 0.9, VOUSSOIR)
  arch(out, f, u, 0.08, y0, w, h, GLASS)
  fan(out, f, u, 0.07, y0 + h - w / 2, w / 2, w / 2 + 0.8, 6)
  // the transom across it at the spring
  panel(out, f, u - w / 2, u + w / 2, 0.1, y0 + h - w / 2 - 0.12, y0 + h - w / 2 + 0.05, DEEP)
  slab(out, f, u - 0.3, u + 0.3, 0, 0.22, y0 + h - 0.1, y0 + h + 0.8, GRANITE, T.granite)
  slab(out, f, u - w / 2 - 0.25, u + w / 2 + 0.25, 0, 0.25, y0 - 0.3, y0, GRANITE, T.granite)
}

/** A mezzanine window under its flat arch of radiating voussoirs. */
function mezzWindow(out: MeshBuilder, f: Fr, u: number, w: number): void {
  panel(out, f, u - w / 2 - 0.7, u + w / 2 + 0.7, 0.05, Y.base - 2.0, Y.base - 0.6, VOUSSOIR)
  panel(out, f, u - w / 2, u + w / 2, 0.07, Y.base - 4.3, Y.base - 2.0, GLASS)
  slab(out, f, u - w / 2 - 0.2, u + w / 2 + 0.2, 0, 0.2, Y.base - 4.5, Y.base - 4.3, GRANITE, T.granite)
}

/** A tall window of the piano nobile in its surround, on a sill, under a pediment (triangular or segmental). */
function nobleWindow(out: MeshBuilder, f: Fr, u: number, w: number, y0: number, y1: number, kind: 'tri' | 'seg' | 'none'): void {
  panel(out, f, u - w / 2 - 0.35, u + w / 2 + 0.35, 0.05, y0 - 0.2, y1 + 0.3, VOUSSOIR)
  panel(out, f, u - w / 2, u + w / 2, 0.08, y0, y1, GLASS)
  // the sash's transom, which the photographs read as a pale line a third of the way down
  panel(out, f, u - w / 2, u + w / 2, 0.09, y1 - (y1 - y0) * 0.3, y1 - (y1 - y0) * 0.3 + 0.1, DEEP)
  slab(out, f, u - w / 2 - 0.5, u + w / 2 + 0.5, 0, 0.32, y0 - 0.45, y0 - 0.2, GRANITE, T.granite)
  if (kind === 'none') return
  slab(out, f, u - w / 2 - 0.65, u + w / 2 + 0.65, 0, 0.42, y1 + 0.3, y1 + 0.6, GRANITE, T.granite)
  if (kind === 'tri') pediment(out, f, u, y1 + 0.6, w + 1.3, 0.85, 0.42, GRANITE, DEEP)
  else {
    arch(out, f, u, 0.42, y1 + 0.6 - (w + 1.3) / 2 + 0.75, w + 1.3, (w + 1.3) / 2, GRANITE, 4)
    panel(out, f, u - w / 2 - 0.65, u + w / 2 + 0.65, 0.43, y1 + 0.3, y1 + 0.6, GRANITE)
  }
}

/** A run of balustrade on the wall line `o`: plinth, balusters as light on shade, rail, and posts every ~4 m. */
function balustrade(out: MeshBuilder, f: Fr, u0: number, u1: number, o: number, y: number, h: number, urns: boolean, spacing = 0.5): void {
  if (u1 - u0 < 0.8) return
  slab(out, f, u0, u1, o - 0.5, o, y, y + 0.22, GRANITE, T.granite)
  slab(out, f, u0 - 0.05, u1 + 0.05, o - 0.55, o + 0.05, y + h - 0.2, y + h, GRANITE, T.granite)
  panel(out, f, u0, u1, o - 0.3, y + 0.22, y + h - 0.2, SHADE)
  for (let u = u0 + spacing / 2; u < u1; u += spacing) panel(out, f, u - 0.1, u + 0.1, o - 0.22, y + 0.22, y + h - 0.2, GRANITE)
  const posts = Math.max(1, Math.round((u1 - u0) / 4.2))
  for (let k = 0; k <= posts; k++) {
    const u = u0 + ((u1 - u0) * k) / posts
    slab(out, f, u - 0.3, u + 0.3, o - 0.6, o + 0.05, y, y + h + 0.1, GRANITE, T.granite)
    if (urns) {
      const c = pt(f, u, o - 0.27)
      // the ball finial: one tapered stone, which is what it is at the distance anyone sees it from
      prism(out, c.x, c.z, y + h + 0.1, y + h + 0.7, 0.24, 4, GRANITE, T.granite, 0.06)
    }
  }
}

/** The cornice and frieze carried along a wall from `y` (frieze) to the top: band, drip, modillion shade. */
function cornice(out: MeshBuilder, f: Fr, u0: number, u1: number, yf: number, yc: number, ye: number): void {
  // the architrave's line and the frieze
  panel(out, f, u0, u1, 0.02, yf, yf + 0.1, JOINT)
  slab(out, f, u0 - 0.1, u1 + 0.1, -0.2, 0.18, yf - 0.35, yf, GRANITE, T.granite)
  // the cornice: bed moulding, the modillion band read as its shadow, the corona
  slab(out, f, u0 - 0.4, u1 + 0.4, -0.3, 0.45, yc, yc + 0.4, GRANITE, T.granite)
  panel(out, f, u0 - 0.4, u1 + 0.4, 0.46, yc + 0.05, yc + 0.35, SHADE)
  slab(out, f, u0 - 1.0, u1 + 1.0, -0.4, 1.1, yc + 0.4, ye, GRANITE, T.granite, true)
  panel(out, f, u0 - 1.0, u1 + 1.0, 1.11, ye - 0.3, ye - 0.22, JOINT)
}

/** A bronze lantern of the entrances: a tall verdigris cage on a bracket, lit inside. */
function wallLantern(out: MeshBuilder, f: Fr, u: number, y: number): void {
  slab(out, f, u - 0.08, u + 0.08, 0, 0.5, y - 0.9, y - 0.1, VERDIGRIS, T.metal)
  slab(out, f, u - 0.28, u + 0.28, 0.35, 0.95, y - 0.1, y + 1.2, VERDIGRIS, T.metal)
  slab(out, f, u - 0.22, u + 0.22, 0.4, 0.9, y + 0.05, y + 1.05, LAMP, EMIT)
  const c = pt(f, u, 0.65)
  prism(out, c.x, c.z, y + 1.2, y + 1.75, 0.3, 4, VERDIGRIS, T.metal, 0.05)
}

/** A verdigris lamp standard on the kerb: a fluted post and its globe. */
function lampStandard(out: MeshBuilder, c: P2): void {
  prism(out, c.x, c.z, 0, 0.7, 0.3, 6, VERDIGRIS, T.metal, 0.2)
  prism(out, c.x, c.z, 0.7, 3.9, 0.11, 6, VERDIGRIS, T.metal, 0.08)
  prism(out, c.x, c.z, 3.9, 4.15, 0.2, 6, VERDIGRIS, T.metal)
  prism(out, c.x, c.z, 4.15, 4.75, 0.3, 6, LAMP, EMIT, 0.2)
}

/**
 * A great entrance arch over two storeys: the fan of voussoirs, inside it a pedimented aedicule of banded columns
 * round the bronze doors and a window over, then the steps between their plinths with planter bowls, and the
 * lanterns either side. `u` is its centre, `o0` the face it stands on.
 */
function entrance(out: MeshBuilder, f: Fr, u: number, o0: number, steps: boolean): void {
  const F2: Fr = { ...f, ox: f.ox + f.nx * o0, oz: f.oz + f.nz * o0 }
  arch(out, F2, u, 0.06, Y.table, 8.2, Y.base - 0.8, VOUSSOIR, 6)
  arch(out, F2, u, 0.09, Y.table, 5.0, Y.base - 2.6, GRANITE, 6)
  fan(out, F2, u, 0.08, Y.table + Y.base - 0.8 - 4.1, 2.5, 4.1, 11)
  slab(out, F2, u - 0.45, u + 0.45, 0, 0.3, Y.base - 2.2, Y.base - 0.4, GRANITE, T.granite)
  // the window over the door, its moulded frame and the scrolls
  panel(out, F2, u - 1.1, u + 1.1, 0.12, Y.table + 6.9, Y.table + 8.6, GLASS)
  slab(out, F2, u - 1.6, u + 1.6, 0, 0.35, Y.table + 6.4, Y.table + 6.7, GRANITE, T.granite)
  // the aedicule: two banded columns, the entablature, the pediment
  for (const s of [-1, 1]) {
    slab(out, F2, u + s * 1.55 - 0.32, u + s * 1.55 + 0.32, 0, 0.6, Y.table, Y.table + 4.0, GRANITE, T.granite)
    for (let y = Y.table + 0.6; y < Y.table + 4; y += 0.7) slab(out, F2, u + s * 1.55 - 0.38, u + s * 1.55 + 0.38, 0, 0.66, y, y + 0.22, VOUSSOIR, T.granite)
  }
  panel(out, F2, u - 1.15, u + 1.15, 0.12, Y.table, Y.table + 3.8, DOOR)
  for (const du of [-0.55, 0, 0.55]) panel(out, F2, u + du - 0.03, u + du + 0.03, 0.13, Y.table + 0.2, Y.table + 3.6, DARK)
  slab(out, F2, u - 2.1, u + 2.1, 0, 0.75, Y.table + 4.0, Y.table + 4.9, GRANITE, T.granite)
  pediment(out, F2, u, Y.table + 4.9, 4.5, 1.25, 0.75, GRANITE, DEEP)
  // the lanterns
  for (const s of [-1, 1]) wallLantern(out, F2, u + s * 3.4, Y.table + 3.2)
  if (!steps) return
  // the steps: a short broad flight between two big plinths, each with its bronze bowl of planting
  const run = 2.0
  stair(out, pt(F2, u - 2.0, 0), pt(F2, u + 2.0, 0), 0, Y.table, { anchor: 'top', riser: 0.16, run, colour: GRANITE, material: 'granite' })
  for (const s of [-1, 1]) {
    const c0 = u + s * 3.3
    slab(out, F2, c0 - 1.3, c0 + 1.3, 0, run + 0.3, 0, Y.table + 0.1, RUSTIC, T.granite)
    const c = pt(F2, c0, run / 2 + 0.1)
    prism(out, c.x, c.z, Y.table + 0.1, Y.table + 0.55, 0.45, 8, VERDIGRIS, T.metal, 1.05)
    prism(out, c.x, c.z, Y.table + 0.55, Y.table + 0.8, 0.95, 8, PLANT, FIXED, 0.85)
  }
}

// -------------------------------------------------------------------------------------------- the walls

/** The base and plinth of any old wall: the granite, the water table, the banded courses, the string course. */
function oldBase(out: MeshBuilder, f: Fr, u0: number, u1: number, o: number, top: number): void {
  const F2: Fr = { ...f, ox: f.ox + f.nx * o, oz: f.oz + f.nz * o }
  panel(out, F2, u0, u1, 0, 0, top, GRANITE, T.granite)
  panel(out, F2, u0, u1, 0.01, Y.table, Y.base, RUSTIC, T.granite)
  slab(out, F2, u0 - 0.05, u1 + 0.05, -0.2, 0.25, 0, Y.table, RUSTIC, T.granite)
  courses(out, F2, u0, u1, Y.table, Y.base)
  slab(out, F2, u0 - 0.25, u1 + 0.25, -0.3, 0.35, Y.base, Y.string, GRANITE, T.granite)
}

/** A long range of the 1905 building: arched windows, mezzanine windows, the pedimented piano nobile. */
function range(out: MeshBuilder, f: Fr, u0: number, u1: number, street: boolean, pitch = 5.0): void {
  oldBase(out, f, u0, u1, 0, Y.eaves)
  cornice(out, f, u0, u1, Y.frieze, Y.cornice, Y.eaves)
  balustrade(out, f, u0 - 0.6, u1 + 0.6, 0.6, Y.eaves, Y.rail - Y.eaves, false, 0.75)
  const span = u1 - u0
  if (span < 3) return
  const n = Math.max(1, Math.round(span / pitch))
  const bay = span / n
  for (let i = 0; i < n; i++) {
    const u = u0 + bay * (i + 0.5)
    groundArch(out, f, u, Math.min(2.4, bay * 0.5), 5.4)
    mezzWindow(out, f, u, Math.min(1.5, bay * 0.32))
    nobleWindow(out, f, u, Math.min(1.8, bay * 0.36), Y.string + 1.0, Y.frieze - 1.75, 'tri')
    // the console under each pediment's ends, the frieze's panel over the window
    panel(out, f, u - 1.2, u + 1.2, 0.04, Y.frieze + 0.25, Y.cornice - 0.25, VOUSSOIR)
  }
  // the low granite balustrade along the pavement, in front of the areaway
  if (street) balustrade(out, f, u0 + 0.6, u1 - 0.6, 1.7, 0, 1.0, false, 0.8)
}

/**
 * A pavilion or tower face on a wall `o0` proud, `depth` deep into the building: the mass a storey over the ranges'
 * roof, the rusticated base, the paired giant pilasters at its edges, the taller entablature, the balustrade with
 * urns round its top. What is on the face by `kind`:
 *  - `tower`: one window column (arched window, mezzanine, pedimented window, upper window), and a solid attic
 *    pedestal over the balustrade carrying urns at its corners;
 *  - `grand`: the broad entrance pavilion — the great arch and its steps in the middle, an arched window bay each
 *    side, three windows over (the middle one under a segmental pediment);
 *  - `gable`: one bay — the entrance arch and its steps — under a pedimented gable;
 *  - `window`: one bay with a tall arched window, the round medallions either side.
 */
function pavilion(out: MeshBuilder, f: Fr, u0: number, u1: number, o0: number, depth: number, kind: 'tower' | 'grand' | 'gable' | 'window', mass = true): void {
  const F2: Fr = { ...f, ox: f.ox + f.nx * o0, oz: f.oz + f.nz * o0 }
  const w = u1 - u0
  const um = (u0 + u1) / 2
  if (mass) {
    if (o0 > 0.05) slab(out, f, u0, u1, -0.2, o0, 0, Y.pEaves, GRANITE, T.granite)
    slab(out, f, u0, u1, -depth, 0, Y.eaves - 0.2, Y.pEaves, GRANITE, T.granite)
  }
  oldBase(out, f, u0, u1, o0 + 0.01, Y.pEaves)
  cornice(out, F2, u0, u1, Y.pFrieze, Y.pCornice, Y.pEaves)
  balustrade(out, F2, u0 - 0.7, u1 + 0.7, 0.7, Y.pEaves, Y.pRail - Y.pEaves, true, 0.6)
  if (mass && depth > 3) {
    const sideL: Fr = frameOf(pt(F2, u0 - 0.7, 0.7 - depth), pt(F2, u0 - 0.7, 0.7))
    const sideR: Fr = frameOf(pt(F2, u1 + 0.7, 0.7), pt(F2, u1 + 0.7, 0.7 - depth))
    for (const s of [sideL, sideR]) balustrade(out, s, 0.6, s.L - 0.6, 0, Y.pEaves, Y.pRail - Y.pEaves, false, 0.9)
  }
  // the paired giant pilasters at either edge through the upper storeys, their capitals
  for (const e of [u0 + 0.75, u1 - 0.75]) {
    for (const d of [-0.42, 0.42]) {
      slab(out, F2, e + d - 0.27, e + d + 0.27, 0, 0.3, Y.string, Y.pFrieze - 0.35, GRANITE, T.granite)
      slab(out, F2, e + d - 0.36, e + d + 0.36, 0, 0.4, Y.pFrieze - 1.0, Y.pFrieze - 0.35, VOUSSOIR, T.granite)
    }
  }
  const upper = (u: number, ped: 'tri' | 'seg' | 'none', ww = 1.9): void => {
    nobleWindow(out, F2, u, ww, Y.string + 1.2, Y.string + 6.3, ped)
    nobleWindow(out, F2, u, 1.4, Y.string + 8.1, Y.pFrieze - 1.3, 'none')
  }
  if (kind === 'tower') {
    groundArch(out, F2, um, Math.min(2.6, w * 0.3), 5.8)
    mezzWindow(out, F2, um, 1.5)
    upper(um, 'tri')
    // the attic pedestal over the tower, higher than the balustrade, an urn at each front corner
    const a0 = u0 + 0.2
    const a1 = u1 - 0.2
    slab(out, F2, a0, a1, Math.min(-4, 0.9 - depth), 0.9, Y.pEaves, Y.pRail + 0.6, GRANITE, T.granite)
    slab(out, F2, a0 - 0.2, a1 + 0.2, Math.min(-4, 0.9 - depth) - 0.2, 1.1, Y.pRail + 0.6, Y.pRail + 0.9, GRANITE, T.granite)
    for (const u of [a0 + 0.4, a1 - 0.4]) {
      const c = pt(F2, u, 0.5)
      prism(out, c.x, c.z, Y.pRail + 0.9, Y.pRail + 1.2, 0.25, 6, GRANITE, T.granite, 0.35)
      prism(out, c.x, c.z, Y.pRail + 1.2, Y.pRail + 1.8, 0.38, 6, GRANITE, T.granite, 0.1)
    }
    return
  }
  if (kind === 'grand') {
    entrance(out, f, um, o0, true)
    const side = Math.min(4.6, w / 2 - 2.2)
    for (const s of [-1, 1]) {
      const u = um + s * side
      groundArch(out, F2, u, 2.0, 4.6)
      mezzWindow(out, F2, u, 1.4)
      upper(u, 'none', 1.6)
    }
    upper(um, 'seg', 2.0)
    // the carved cartouche in the frieze over the middle (read as a deeper panel), and the date tablet
    panel(out, F2, um - 2.8, um + 2.8, 0.06, Y.pFrieze - 0.9, Y.pFrieze - 0.1, DEEP)
    panel(out, F2, um - 2.2, um + 2.2, 0.04, Y.base - 0.6, Y.base - 0.1, VOUSSOIR)
    return
  }
  if (kind === 'gable') {
    entrance(out, f, um, o0, true)
    upper(um, 'seg')
    // the gable: a pediment the pavilion's width over its cornice, its tympanum carved (read darker)
    pediment(out, F2, um, Y.pEaves, w + 1.6, 3.0, 1.1, VOUSSOIR, DEEP)
    slab(out, F2, u0 - 0.8, u1 + 0.8, -3, 1.1, Y.pEaves - 0.01, Y.pEaves + 0.15, GRANITE, T.granite)
    return
  }
  groundArch(out, F2, um, 2.8, 6.2)
  mezzWindow(out, F2, um, 1.6)
  upper(um, 'seg')
  if (w > 9) {
    for (const s of [-1, 1]) {
      const c = um + s * Math.min(3.6, w / 2 - 1.9)
      arch(out, F2, c, 0.06, Y.table + 5.4, 1.0, 1.0, VOUSSOIR, 4)
      arch(out, F2, c, 0.06, Y.table + 6.4, 1.0, 0.5, VOUSSOIR, 4)
      upper(c, 'none', 1.2)
    }
  }
}

/**
 * The Seventh Street front: a tower at each corner, the gabled entrance pavilion next to the Mission tower (the
 * flag over it), and the long range between. OSM draws the front as one straight line, so the towers and the
 * gable stand a little proud of it, as the photographs show them. `tw0`/`tw1` are the towers' widths, matched to
 * the side walls' own corner segments.
 */
function seventh(out: MeshBuilder, F: Fr, tw0: number, tw1: number): { flag: P2 } {
  const L = F.L
  const gw = 9.5
  pavilion(out, F, 0, tw0, 0.5, tw0, 'tower')
  pavilion(out, F, L - tw1, L, 0.5, tw1, 'tower')
  pavilion(out, F, L - tw1 - gw, L - tw1, 1.1, 10, 'gable')
  range(out, F, tw0, L - tw1 - gw, true, 5.0)
  // lamp standards on the kerb
  for (const u of [tw0 + 4, L * 0.35, L * 0.6, L - tw1 - gw - 3]) lampStandard(out, pt(F, u, 4.6))
  return { flag: pt(F, L - tw1 - gw / 2, -5) }
}

/** A wall of Kelham's 1933 wing: smooth stone over a banded base, four storeys of plain windows, a simple top. */
function annexWall(out: MeshBuilder, f: Fr, top: number): void {
  const L = f.L
  panel(out, f, 0, L, 0, 0, top, ANNEX, T.granite)
  panel(out, f, 0, L, 0.01, Y.table, 8.6, RUSTIC, T.granite)
  slab(out, f, -0.05, L + 0.05, -0.2, 0.25, 0, Y.table, RUSTIC, T.granite)
  courses(out, f, 0, L, Y.table, 8.6, 0.6)
  slab(out, f, -0.2, L + 0.2, -0.3, 0.3, 8.6, 9.2, ANNEX, T.granite)
  slab(out, f, -0.6, L + 0.6, -0.4, 0.7, top - 1.0, top, ANNEX, T.granite, true)
  slab(out, f, -0.3, L + 0.3, -0.3, 0.15, top, top + 1.1, ANNEX, T.granite)
  if (L < 5) return
  const n = Math.max(1, Math.round((L - 2) / 4.4))
  const step = (L - 2) / n
  for (let i = 0; i < n; i++) {
    const u = 1 + step * (i + 0.5)
    panel(out, f, u - 0.75, u + 0.75, 0.06, 2.6, 5.4, GLASS)
    panel(out, f, u - 0.75, u + 0.75, 0.06, 6.3, 7.9, GLASS)
    nobleWindow(out, f, u, 1.4, 10.6, 14.4, i % 2 ? 'none' : 'tri')
    panel(out, f, u - 0.7, u + 0.7, 0.06, 16.4, 19.0, GLASS)
    panel(out, f, u - 0.6, u + 0.6, 0.06, 20.0, 21.4, GLASS)
  }
}

// ------------------------------------------------------------------------------------------ the building

type Kind = 'front' | 'range' | 'pavilion' | 'tower' | 'step' | 'annex'

function ninthCircuit(out: MeshBuilder, fit: Fit): void {
  const raw = fit.ring && fit.ring.length >= 3 ? fit.ring
    : [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  let area = 0
  for (let i = 0; i < raw.length; i++) { const a = raw[i]; const b = raw[(i + 1) % raw.length]; area += a.x * b.z - b.x * a.z }
  const ring0 = area >= 0 ? raw : [...raw].reverse()
  const ring = simplifyRing(ring0, 0.6)
  const n = ring.length
  const edge = (i: number): Fr => frameOf(ring[((i % n) + n) % n], ring[(((i + 1) % n) + n) % n])

  // Seventh Street: the longest edge
  let iF = 0
  for (let i = 1; i < n; i++) if (edge(i).L > edge(iF).L) iF = i
  const F = edge(iF)
  const deepest = depthOf(ring, F)
  const depthAt = (p: P2): number => -((p.x - F.ox) * F.nx + (p.z - F.oz) * F.nz)

  // classify every other edge by where it is and what it does
  const kinds: Kind[] = []
  const alongF = (p: P2): number => (p.x - F.ox) * F.tx + (p.z - F.oz) * F.tz
  for (let i = 0; i < n; i++) {
    if (i === iF) { kinds.push('front'); continue }
    const f = edge(i)
    const mid = pt(f, f.L / 2, 0)
    if (depthAt(mid) > deepest - 19) { kinds.push('annex'); continue }
    // the side walls' first stretch off Seventh Street is the corner tower's return
    if ((i === (iF + 1) % n || i === (iF - 1 + n) % n) && f.L < 13) { kinds.push('tower'); continue }
    if (f.L < 6) { kinds.push('step'); continue }
    const prev = edge(i - 1)
    const next = edge(i + 1)
    const outIn = (prev.tx * f.nx + prev.tz * f.nz) > 0.7 && (next.tx * f.nx + next.tz * f.nz) < -0.7
    kinds.push(outIn && f.L < 22 ? 'pavilion' : 'range')
  }
  // on each side, the pavilion nearer Seventh Street: the Mission one is the broad entrance pavilion
  const nearest: Record<string, number> = {}
  for (let i = 0; i < n; i++) {
    if (kinds[i] !== 'pavilion') continue
    const mid = pt(edge(i), edge(i).L / 2, 0)
    const key = alongF(mid) > F.L / 2 ? 'mission' : 'stevenson'
    const j = nearest[key]
    if (j === undefined || depthAt(mid) < depthAt(pt(edge(j), edge(j).L / 2, 0))) nearest[key] = i
  }
  const tw0 = kinds[(iF - 1 + n) % n] === 'tower' ? edge(iF - 1).L : 9
  const tw1 = kinds[(iF + 1) % n] === 'tower' ? edge(iF + 1).L : 9

  for (let i = 0; i < n; i++) {
    const f = edge(i)
    const mission = alongF(pt(f, f.L / 2, 0)) > F.L / 2
    switch (kinds[i]) {
      case 'front': break
      case 'annex': annexWall(out, f, Y.cornice + 0.6); break
      case 'tower': pavilion(out, f, 0, f.L, 0, 0, 'tower', false); break
      case 'step': {
        const tall = kinds[(i + 1) % n] === 'pavilion' || kinds[(i - 1 + n) % n] === 'pavilion'
        oldBase(out, f, 0, f.L, 0, tall ? Y.pEaves : Y.eaves)
        if (tall) cornice(out, f, 0, f.L, Y.pFrieze, Y.pCornice, Y.pEaves)
        else cornice(out, f, 0, f.L, Y.frieze, Y.cornice, Y.eaves)
        break
      }
      case 'pavilion':
        pavilion(out, f, 0, f.L, 0, 12, nearest.mission === i ? 'grand' : 'window')
        break
      case 'range':
        range(out, f, 0, f.L, true)
        if (mission && f.L > 15) lampStandard(out, pt(f, f.L / 2, 4.6))
        break
    }
  }
  const { flag } = seventh(out, F, tw0, tw1)
  const grand = nearest.mission !== undefined ? pt(edge(nearest.mission), edge(nearest.mission).L / 2, -5) : null

  // the roof deck behind the balustrades
  capPolygon(out, ring, Y.eaves, ROOF, T.concrete)

  // the flags: over the Seventh Street gable, and over the Mission entrance pavilion
  for (const [p, y0, h] of [[flag, Y.pEaves, 12], ...(grand ? [[grand, Y.pEaves, 10]] : [])] as [P2, number, number][]) {
    prism(out, p.x, p.z, y0, y0 + 0.6, 0.35, 6, GRANITE, T.granite)
    prism(out, p.x, p.z, y0 + 0.6, y0 + h, 0.1, 6, [0.86, 0.86, 0.84], T.metal, 0.06)
    prism(out, p.x, p.z, y0 + h, y0 + h + 0.5, 0.18, 6, [0.82, 0.66, 0.3], FIXED, 0.02)
  }
}

export const NINTH_CIRCUIT: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** The James R. Browning U.S. Court of Appeals Building (relation/19306325 + way/38612651), 7th & Mission. */
  ninthCircuitCourthouse_19306325: ninthCircuit,
}
