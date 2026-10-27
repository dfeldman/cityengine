/**
 * THE CLARKE MANSION, "Nobby Clarke's Folly", 250 Douglass Street at Caselli Avenue (1891–92; SF Landmark 80; the
 * Victor Apartments since 1909) — docs/sf-batches/MODEL-CLARKE-MANSION.md, from the Commons photographs in
 * docs/shots/refs/notable/clarke-mansion/ (BriefEdits 2024, Kevin Collins 2009).
 *
 * A four-storey Baroque Queen Anne house in pale grey-white painted wood — clapboard on the main floor, fish-scale
 * shingle above, white trim — on a dark grey rusticated basement storey, on a lot that rises above Caselli Avenue
 * behind a retaining wall with an iron fence. What makes it recognisable from across the street:
 *  (a) TWIN RIBBED BELL DOMES, lead-grey with gold balls, on round bays at both front corners;
 *  (b) a tall slate CONE with a gold ball on a round tower at the back-left (south-east) corner, a storey above the
 *      eaves on a short glazed belvedere stage;
 *  (c) a square louvred CUPOLA with a pyramidal cap and a red brick CHIMNEY on the ridge, over a big striped front
 *      GABLE; a segmental dormer beside it.
 * Across the middle of the front a one-storey porch on four fluted Corinthian columns under a bracketed cornice, a
 * balustraded balcony with urns over it, and behind that a panel of square-gridded ornament. A lower two-storey
 * annex at the back-right (west) end under its own hip.
 *
 * FRONT faces CASELLI, north (the manifest's `front: 356`; the address is Douglass only because the gate is there):
 * the photographs settle it — see the evidence pack. In the model's frame local −z is north (Caselli), +z south and
 * uphill, −x EAST (Douglass), +x west (the attached neighbour). The parts are placed in a DESIGN frame measured off
 * OSM way/263884980 as the city fits it (hx 11.6, hz 8.6 — the ring's box centre is the origin), not off `fit.ring`,
 * because the round bays, the porch and the tower need exact positions the 24-vertex ring only hints at. The model's
 * y = 0 is the lowest ground under the footprint (the north edge); the lot rises ~2.7 m to the back, and the Caselli
 * pavement is ~2.4 m lower at the Douglass end, so the basement starts 3 m underground and the retaining wall takes
 * its foot from `fit.groundAt`.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { lathe } from '../column.ts'
import { beam } from '../kit.ts'
import { boxAlong, colonnade, dentilCourse, railing, spireOn } from '../parts.ts'

type P2 = { x: number; z: number }
type V3 = [number, number, number]

const WALL: Rgb = [0.84, 0.85, 0.87]        // #d7dadd pale grey-white clapboard
const SHINGLE: Rgb = [0.8, 0.82, 0.84]      // the fish-scale band, a shade cooler
const TRIM: Rgb = [0.95, 0.95, 0.94]        // #f2f2f0
const STRIPE: Rgb = [0.43, 0.45, 0.46]      // #6e7276 the dark stick-work and grid ornament
const BASE: Rgb = [0.36, 0.38, 0.39]        // #5c6064 the rusticated basement
const SLATE: Rgb = [0.28, 0.29, 0.31]       // #474a4e
const LEAD: Rgb = [0.55, 0.56, 0.53]        // #8d8f88 the bell domes
const CONE: Rgb = [0.62, 0.63, 0.62]        // the cone's paler slate shingle
const GOLD: Rgb = [0.85, 0.68, 0.25]
const BRICK: Rgb = [0.61, 0.29, 0.22]       // #9c4a38
const GLASS: Rgb = [0.16, 0.18, 0.22]
const IRON: Rgb = [0.17, 0.18, 0.2]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

const CB = surfaceTag('clapboard'), TL = surfaceTag('tile'), GL = surfaceTag('glass'), ST = surfaceTag('ashlar'),
  MT = surfaceTag('metal'), BK = surfaceTag('brick')

// ---- the levels (metres above the model's base) -------------------------------------------------------------------
const Y_BURIED = -3.0           // the basement starts underground: the lot rises 2.7 m to the back
const Y_MAIN = 2.6              // the top of the dark basement, the main floor
const Y_SECOND = 7.0            // the second floor (the main floor is 4.4 m tall)
const Y_EAVE = 10.8             // the eaves cornice
const RISE = 6.6                // the hip's rise from the eaves to the ridge
const OVER = 0.5                // the eaves overhang

// ---- the plan: the main block, the front corner bays, the tower, the annex, the porch ------------------------------
const MAIN = { x0: -10.0, x1: 7.4, z0: -6.2, z1: 7.8 }
const ANNEX = { x0: 7.4, x1: 10.4, z0: -0.3, z1: 7.8 }
const BAY_E: P2 = { x: -8.3, z: -4.4 }, BAY_W: P2 = { x: 7.4, z: -3.5 }, BAY_R = 2.6
const TOWER: P2 = { x: -8.9, z: 5.8 }, TOWER_R = 2.7
const PORCH = { x0: -3.8, x1: 3.8, z: -8.6 }

/** one quad facing `heading` (0 = +z), `hw` by `hh` about (cx, cy, cz), pushed `proud` along its normal */
function plaque(out: MeshBuilder, cx: number, cy: number, cz: number, hw: number, hh: number, heading: number, proud: number, c: Rgb, tag: number): void {
  const nx = Math.sin(heading), nz = Math.cos(heading), tx = nz, tz = -nx
  const x = cx + nx * proud, z = cz + nz * proud
  out.quad([[x - tx * hw, cy - hh, z - tz * hw], [x + tx * hw, cy - hh, z + tz * hw], [x + tx * hw, cy + hh, z + tz * hw], [x - tx * hw, cy + hh, z - tz * hw]],
    [nx, 0, nz], UV, c, tag)
}

/** a tall white-framed sash: the frame, the dark glass, a sill */
function sash(out: MeshBuilder, cx: number, cz: number, heading: number, y0: number, y1: number, hw = 0.55): void {
  const ym = (y0 + y1) / 2, hh = (y1 - y0) / 2
  plaque(out, cx, ym, cz, hw + 0.12, hh + 0.12, heading, 0.04, TRIM, CB)
  plaque(out, cx, ym, cz, hw, hh, heading, 0.07, GLASS, GL)
  plaque(out, cx, ym, cz, 0.03, hh, heading, 0.08, TRIM, CB)                   // the meeting rail's mullion
  const nx = Math.sin(heading), nz = Math.cos(heading)
  boxAlong(out, cx + nx * 0.1, y0 - 0.06, cz + nz * 0.1, hw + 0.2, 0.05, 0.1, heading, TRIM, CB)
}

/** a hipped roof over a rectangle, ridge along the longer side, eaves at y, the ridge `rise` higher */
function hip(out: MeshBuilder, x0: number, x1: number, z0: number, z1: number, y: number, rise: number, c: Rgb, tag: number): void {
  const ex = (x1 - x0) / 2, ez = (z1 - z0) / 2, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2
  const alongX = ex >= ez, r = Math.abs(ex - ez), s = Math.min(ex, ez)
  const A: V3 = alongX ? [cx - r, y + rise, cz] : [cx, y + rise, cz - r], B: V3 = alongX ? [cx + r, y + rise, cz] : [cx, y + rise, cz + r]
  const P = (x: number, z: number): V3 => [x, y, z]
  const n = Math.hypot(rise, s)
  if (alongX) {
    out.quad([P(x0, z0), P(x1, z0), B, A], [0, s / n, -rise / n], UV, c, tag)
    out.quad([P(x1, z1), P(x0, z1), A, B], [0, s / n, rise / n], UV, c, tag)
    out.quad([P(x1, z0), P(x1, z1), B, B], [rise / n, s / n, 0], UV, c, tag)
    out.quad([P(x0, z1), P(x0, z0), A, A], [-rise / n, s / n, 0], UV, c, tag)
  } else {
    out.quad([P(x1, z0), P(x1, z1), B, A], [rise / n, s / n, 0], UV, c, tag)
    out.quad([P(x0, z1), P(x0, z0), A, B], [-rise / n, s / n, 0], UV, c, tag)
    out.quad([P(x0, z0), P(x1, z0), A, A], [0, s / n, -rise / n], UV, c, tag)
    out.quad([P(x1, z1), P(x0, z1), B, B], [0, s / n, rise / n], UV, c, tag)
  }
}

/** the walls of an axis-aligned box: four quads, outward */
function wallsOf(out: MeshBuilder, x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, c: Rgb, tag: number): void {
  const ring: P2[] = [{ x: x0, z: z0 }, { x: x1, z: z0 }, { x: x1, z: z1 }, { x: x0, z: z1 }]
  for (let i = 0; i < 4; i++) {
    const a = ring[i], b = ring[(i + 1) % 4], L = Math.hypot(b.x - a.x, b.z - a.z)
    out.quad([[a.x, y0, a.z], [b.x, y0, b.z], [b.x, y1, b.z], [a.x, y1, a.z]], [(b.z - a.z) / L, 0, -(b.x - a.x) / L], UV, c, tag)
  }
}

/** a round bay from the basement to its cornice, with sashes on the facets that face out, and a dentilled cornice */
function roundBay(out: MeshBuilder, at: P2, r: number, yTop: number, outward: number, span: number, storeys: [number, number][], sides = 16): void {
  prism(out, at.x, at.z, Y_BURIED, Y_MAIN, r, sides, BASE, ST)
  prism(out, at.x, at.z, Y_MAIN, Y_SECOND, r, sides, WALL, CB)
  prism(out, at.x, at.z, Y_SECOND, yTop, r, sides, SHINGLE, CB)
  // the cornice: a white band with dentils, on a ring a little wider than the drum
  prism(out, at.x, at.z, yTop - 0.1, yTop + 0.55, r + 0.3, sides, TRIM, CB)
  const ring: P2[] = Array.from({ length: sides }, (_, k) => {
    const a = ((k + 0.5) / sides) * Math.PI * 2
    return { x: at.x + Math.sin(a) * (r + 0.3), z: at.z + Math.cos(a) * (r + 0.3) }
  })
  dentilCourse(out, ring, yTop - 0.4, 0.3, 0.2, TRIM, 'clapboard', 'dentil')
  // the sashes: four per storey across the facets that face the street
  for (const [y0, y1] of storeys) for (let k = -1.5; k <= 1.5; k++) {
    const a = outward + k * (span / 3)
    const fa = Math.round((a / (Math.PI * 2)) * sides - 0.5) + 0.5   // snap to a facet's centre
    const h = (fa / sides) * Math.PI * 2
    sash(out, at.x + Math.sin(h) * r, at.z + Math.cos(h) * r, h, y0, y1, 0.42)
  }
}

/** a ribbed lead bell (ogee) dome on a drum's cornice, with a gold ball and a spike */
function bellDome(out: MeshBuilder, at: P2, y: number, r: number): void {
  const prof: [number, number][] = [[r, y], [r + 0.05, y + 0.45], [r * 0.93, y + 1.1], [r * 0.72, y + 1.75], [r * 0.44, y + 2.3],
    [r * 0.24, y + 2.75], [r * 0.14, y + 3.15], [0.02, y + 3.4]]
  lathe(out, at.x, at.z, prof, 20, LEAD, MT)
  // the ribs: twelve thin raised strips following the profile
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2, sx = Math.sin(a), cz = Math.cos(a), px = Math.cos(a), pz = -Math.sin(a)
    for (let k = 0; k < prof.length - 2; k++) {
      const [r0, y0] = prof[k], [r1, y1] = prof[k + 1]
      const w = 0.05
      out.quad([[at.x + sx * (r0 + 0.04) - px * w, y0, at.z + cz * (r0 + 0.04) - pz * w], [at.x + sx * (r0 + 0.04) + px * w, y0, at.z + cz * (r0 + 0.04) + pz * w],
        [at.x + sx * (r1 + 0.04) + px * w, y1, at.z + cz * (r1 + 0.04) + pz * w], [at.x + sx * (r1 + 0.04) - px * w, y1, at.z + cz * (r1 + 0.04) - pz * w]],
        [sx, 0.5, cz], UV, [0.6, 0.61, 0.58], MT)
    }
  }
  lathe(out, at.x, at.z, [[0.02, y + 3.35], [0.2, y + 3.45], [0.34, y + 3.7], [0.2, y + 3.95], [0.02, y + 4.05]], 10, GOLD, 0)
  box(out, at.x, y + 4.4, at.z, 0.03, 0.4, 0.03, GOLD, 0)
}

/** a run of white turned balusters under a white rail, along x at z or along z at x */
function balustrade(out: MeshBuilder, a: P2, b: P2, y: number, h = 0.9): void {
  const L = Math.hypot(b.x - a.x, b.z - a.z), tx = (b.x - a.x) / L, tz = (b.z - a.z) / L, heading = Math.atan2(tz, -tx)
  boxAlong(out, (a.x + b.x) / 2, y + h - 0.05, (a.z + b.z) / 2, L / 2 + 0.05, 0.05, 0.08, heading, TRIM, CB)
  boxAlong(out, (a.x + b.x) / 2, y + 0.06, (a.z + b.z) / 2, L / 2 + 0.05, 0.06, 0.08, heading, TRIM, CB)
  const n = Math.max(2, Math.round(L / 0.3))
  for (let k = 0; k <= n; k++) {
    const u = (k / n) * L
    box(out, a.x + tx * u, y + h / 2, a.z + tz * u, 0.045, h / 2 - 0.08, 0.045, TRIM, CB)
  }
}

/** a stone urn on a post (the balcony's four) */
function urn(out: MeshBuilder, x: number, z: number, y: number): void {
  box(out, x, y + 0.22, z, 0.17, 0.22, 0.17, TRIM, 0)
  lathe(out, x, z, [[0.12, y + 0.44], [0.08, y + 0.5], [0.24, y + 0.75], [0.3, y + 0.95], [0.22, y + 1.08], [0.08, y + 1.14], [0.02, y + 1.25]], 8, TRIM, 0)
}

export function clarkeMansion_250_Douglass(out: MeshBuilder, fit: Fit): void {
  const ground = (x: number, z: number): number => fit.groundAt?.(x, z) ?? 0
  // the hip's surface (ridge along x): how far in from the eaves a point is, on the nearer slope
  const EX = (MAIN.x1 - MAIN.x0) / 2 + OVER, EZ = (MAIN.z1 - MAIN.z0) / 2 + OVER, CX = (MAIN.x0 + MAIN.x1) / 2, CZ = (MAIN.z0 + MAIN.z1) / 2
  const roofY = (x: number, z: number): number => Y_EAVE + 0.25 + RISE * (1 - Math.max(Math.abs(z - CZ), Math.abs(x - CX) - (EX - EZ)) / EZ)

  // ---- the basement storey: dark rusticated, from underground to the main floor, over the whole plan ---------------
  wallsOf(out, MAIN.x0, MAIN.x1, MAIN.z0, MAIN.z1, Y_BURIED, Y_MAIN + 0.02, BASE, ST)
  wallsOf(out, ANNEX.x0, ANNEX.x1, ANNEX.z0, ANNEX.z1, Y_BURIED, Y_MAIN + 0.02, BASE, ST)
  box(out, (PORCH.x0 + PORCH.x1) / 2, (Y_BURIED + Y_MAIN) / 2, (PORCH.z + MAIN.z0) / 2, (PORCH.x1 - PORCH.x0) / 2, (Y_MAIN - Y_BURIED) / 2, (MAIN.z0 - PORCH.z) / 2, BASE, ST)
  // its barred windows along the front, and a white band at the main floor
  for (const x of [-5.2, -1.5, 1.5, 5.0]) {
    const z = Math.abs(x) < 3.8 ? PORCH.z : MAIN.z0
    plaque(out, x, 1.5, z, 0.45, 0.45, Math.PI, 0.03, GLASS, GL)
    for (const dx of [-0.2, 0, 0.2]) box(out, x + dx, 1.5, z - 0.06, 0.02, 0.45, 0.02, IRON, MT)
  }
  boxAlong(out, (MAIN.x0 + MAIN.x1) / 2, Y_MAIN, (MAIN.z0 + MAIN.z1) / 2, (MAIN.x1 - MAIN.x0) / 2 + 0.12, 0.1, (MAIN.z1 - MAIN.z0) / 2 + 0.12, 0, TRIM, CB)

  // ---- the main block: clapboard main floor, shingle second floor, the eaves cornice --------------------------------
  wallsOf(out, MAIN.x0, MAIN.x1, MAIN.z0, MAIN.z1, Y_MAIN, Y_SECOND, WALL, CB)
  wallsOf(out, MAIN.x0, MAIN.x1, MAIN.z0, MAIN.z1, Y_SECOND, Y_EAVE + 0.2, SHINGLE, CB)
  boxAlong(out, (MAIN.x0 + MAIN.x1) / 2, Y_SECOND, (MAIN.z0 + MAIN.z1) / 2, (MAIN.x1 - MAIN.x0) / 2 + 0.08, 0.07, (MAIN.z1 - MAIN.z0) / 2 + 0.08, 0, TRIM, CB)
  const mainRing: P2[] = [{ x: MAIN.x0, z: MAIN.z0 }, { x: MAIN.x1, z: MAIN.z0 }, { x: MAIN.x1, z: MAIN.z1 }, { x: MAIN.x0, z: MAIN.z1 }]
  boxAlong(out, (MAIN.x0 + MAIN.x1) / 2, Y_EAVE + 0.05, (MAIN.z0 + MAIN.z1) / 2, (MAIN.x1 - MAIN.x0) / 2 + OVER, 0.22, (MAIN.z1 - MAIN.z0) / 2 + OVER, 0, TRIM, CB)
  dentilCourse(out, mainRing, Y_EAVE - 0.45, 0.3, 0.25, TRIM, 'clapboard', 'dentil')
  // the sashes: front between the bays and the porch; the east side; the back
  const S1: [number, number] = [Y_MAIN + 0.9, Y_MAIN + 3.4], S2: [number, number] = [Y_SECOND + 0.7, Y_SECOND + 2.9]
  for (const [y0, y1] of [S1, S2]) {
    for (const x of [-5.0, 4.4]) sash(out, x, MAIN.z0, Math.PI, y0, y1, 0.5)
    for (const z of [-0.9, 1.7]) sash(out, MAIN.x0, z, -Math.PI / 2, y0, y1)
    for (const x of [4.8, 1.6, -1.6, -4.8]) sash(out, x, MAIN.z1, 0, y0, y1)
  }
  // the second-floor front over the balcony: the square-gridded ornament panel under a dentilled band, a pair of sashes
  for (const x of [-1.0, 1.0]) sash(out, x, MAIN.z0, Math.PI, Y_SECOND + 0.7, Y_SECOND + 2.8, 0.5)
  for (let k = -3.5; k <= 3.5; k++) {
    plaque(out, k * 0.95, Y_SECOND + 3.25, MAIN.z0, 0.22, 0.22, Math.PI, 0.05, STRIPE, CB)
    plaque(out, k * 0.95, Y_SECOND + 3.25, MAIN.z0, 0.12, 0.12, Math.PI, 0.06, TRIM, CB)
  }
  for (const x of [-3.0, 3.0]) for (const dy of [0.6, 2.0]) plaque(out, x, Y_SECOND + dy + 0.6, MAIN.z0, 0.16, 0.5, Math.PI, 0.05, STRIPE, CB)

  // ---- the porch: four fluted Corinthian columns, a balustrade between them, the bracketed cornice; the balcony --
  const Y_PORCH = Y_MAIN + 0.35
  box(out, 0, (Y_MAIN + Y_PORCH) / 2, (PORCH.z + MAIN.z0) / 2, (PORCH.x1 - PORCH.x0) / 2 + 0.3, (Y_PORCH - Y_MAIN) / 2, (MAIN.z0 - PORCH.z) / 2 + 0.3, TRIM, CB)
  colonnade(out, { x: PORCH.x0, z: PORCH.z }, { x: PORCH.x1, z: PORCH.z }, Y_PORCH, Y_SECOND - Y_PORCH - 1.0, 4,
    { radius: 0.3, out: 0, colour: TRIM, material: 'clapboard', entablature: 0.8, order: 'corinthian', flutes: true, frieze: 'modillion' })
  // the porch's side columns against the wall ends, and its deep ceiling slab
  for (const x of [PORCH.x0, PORCH.x1]) box(out, x, (Y_PORCH + Y_SECOND) / 2, (PORCH.z + MAIN.z0) / 2, 0.08, (Y_SECOND - Y_PORCH) / 2, (MAIN.z0 - PORCH.z) / 2, TRIM, CB)
  box(out, 0, Y_SECOND + 0.1, (PORCH.z + MAIN.z0) / 2 - 0.25, (PORCH.x1 - PORCH.x0) / 2 + 0.45, 0.22, (MAIN.z0 - PORCH.z) / 2 + 0.5, TRIM, CB)
  for (let k = -3; k <= 3; k++) box(out, k * 1.1, Y_SECOND - 0.55, PORCH.z - 0.45, 0.14, 0.3, 0.3, TRIM, CB)   // the brackets under the cornice
  const colX = [-2.85, -0.95, 0.95, 2.85]
  balustrade(out, { x: PORCH.x0 + 0.1, z: PORCH.z }, { x: colX[0] - 0.35, z: PORCH.z }, Y_PORCH)
  balustrade(out, { x: colX[0] + 0.35, z: PORCH.z }, { x: colX[1] - 0.35, z: PORCH.z }, Y_PORCH)
  balustrade(out, { x: colX[2] + 0.35, z: PORCH.z }, { x: colX[3] - 0.35, z: PORCH.z }, Y_PORCH)
  balustrade(out, { x: colX[3] + 0.35, z: PORCH.z }, { x: PORCH.x1 - 0.1, z: PORCH.z }, Y_PORCH)
  for (const x of [PORCH.x0, PORCH.x1]) balustrade(out, { x, z: PORCH.z + 0.1 }, { x, z: MAIN.z0 - 0.3 }, Y_PORCH)
  // the front door behind the porch, with a lamp
  plaque(out, 0, Y_PORCH + 1.5, MAIN.z0, 0.9, 1.5, Math.PI, 0.03, TRIM, CB)
  plaque(out, 0, Y_PORCH + 1.4, MAIN.z0, 0.7, 1.4, Math.PI, 0.06, [0.12, 0.11, 0.1], 0)
  for (const x of [-2.4, 2.4]) sash(out, x, MAIN.z0, Math.PI, Y_PORCH + 0.5, Y_PORCH + 3.0, 0.5)
  // the balcony on the porch roof: a balustrade with urns on its posts
  const Y_BALC = Y_SECOND + 0.32
  balustrade(out, { x: PORCH.x0 + 0.1, z: PORCH.z - 0.1 }, { x: PORCH.x1 - 0.1, z: PORCH.z - 0.1 }, Y_BALC, 0.95)
  for (const x of [PORCH.x0, PORCH.x1]) balustrade(out, { x, z: PORCH.z - 0.1 }, { x, z: MAIN.z0 - 0.2 }, Y_BALC, 0.95)
  for (const x of [PORCH.x0, colX[1] - 0.2, colX[2] + 0.2, PORCH.x1]) urn(out, x, PORCH.z - 0.1, Y_BALC)

  // ---- the two round bays at the front corners, each under a ribbed bell dome ---------------------------------------
  const Y_BAYTOP = Y_EAVE + 0.55
  roundBay(out, BAY_E, BAY_R, Y_BAYTOP, Math.PI * 1.2, Math.PI * 0.9, [S1, S2])
  roundBay(out, BAY_W, BAY_R, Y_BAYTOP, Math.PI * 0.8, Math.PI * 0.9, [S1, S2])
  for (const at of [BAY_E, BAY_W]) bellDome(out, at, Y_BAYTOP + 0.55, BAY_R + 0.2)

  // ---- the conical tower at the back-left (south-east) corner ------------------------------------------------------
  const Y_TOWERTOP = Y_EAVE + 0.8, Y_BELV = Y_TOWERTOP + 0.6, Y_CONE = Y_BELV + 2.2
  roundBay(out, TOWER, TOWER_R, Y_TOWERTOP, -Math.PI * 0.6, Math.PI * 1.0, [S1, S2])
  // the glazed belvedere stage and its cornice, then the cone
  prism(out, TOWER.x, TOWER.z, Y_TOWERTOP + 0.4, Y_BELV, TOWER_R - 0.2, 16, TRIM, CB)
  prism(out, TOWER.x, TOWER.z, Y_BELV, Y_CONE, TOWER_R - 0.35, 16, TRIM, CB)
  for (let k = 0; k < 16; k++) {
    const h = ((k + 0.5) / 16) * Math.PI * 2
    plaque(out, TOWER.x + Math.sin(h) * (TOWER_R - 0.35), Y_BELV + 1.15, TOWER.z + Math.cos(h) * (TOWER_R - 0.35), 0.36, 0.75, h, 0.04, GLASS, GL)
  }
  prism(out, TOWER.x, TOWER.z, Y_CONE, Y_CONE + 0.5, TOWER_R + 0.1, 16, TRIM, CB)
  prism(out, TOWER.x, TOWER.z, Y_CONE + 0.5, Y_CONE + 7.0, TOWER_R + 0.25, 16, CONE, TL, 0.04)
  lathe(out, TOWER.x, TOWER.z, [[0.03, Y_CONE + 6.95], [0.22, Y_CONE + 7.1], [0.36, Y_CONE + 7.35], [0.22, Y_CONE + 7.6], [0.02, Y_CONE + 7.7]], 10, GOLD, 0)
  box(out, TOWER.x, Y_CONE + 8.1, TOWER.z, 0.03, 0.45, 0.03, GOLD, 0)

  // ---- the roof: a steep slate hip, ridge east–west; the front gable; dormers; the cupola; the chimney ---------------
  hip(out, MAIN.x0 - OVER, MAIN.x1 + OVER, MAIN.z0 - OVER, MAIN.z1 + OVER, Y_EAVE + 0.25, RISE, SLATE, TL)
  {
    // the front gable over the porch: its wall flush with the front, a steep roof back to the main slope
    const gx = 3.9, gz = MAIN.z0 - OVER, yA = Y_EAVE + 6.1
    const zBack = (MAIN.z0 + MAIN.z1) / 2 - ((Y_EAVE + RISE + 0.25) - yA) / (RISE / ((MAIN.z1 - MAIN.z0) / 2 + OVER))
    out.quad([[-gx, Y_EAVE + 0.2, MAIN.z0], [gx, Y_EAVE + 0.2, MAIN.z0], [0, yA - 0.35, MAIN.z0], [0, yA - 0.35, MAIN.z0]], [0, 0, -1], UV, SHINGLE, CB)
    for (const s of [-1, 1]) {
      out.quad([[s * gx, Y_EAVE + 0.25, gz], [0, yA, gz], [0, yA, zBack], [0, yA, zBack]], [s * 0.8, 0.55, 0], UV, SLATE, TL)
      beam(out, [s * (gx + 0.1), Y_EAVE + 0.15, gz - 0.15], [0, yA + 0.1, gz - 0.15], 0.14, TRIM)    // the bargeboards
    }
    // the gable's pair of sashes, the stick-work stripes beside them, a small balcony at the eaves
    for (const x of [-0.6, 0.6]) sash(out, x, MAIN.z0, Math.PI, Y_EAVE + 0.9, Y_EAVE + 2.9, 0.42)
    for (const x of [-2.4, -1.75, 1.75, 2.4]) plaque(out, x, Y_EAVE + 1.9, MAIN.z0, 0.09, 1.0, Math.PI, 0.05, STRIPE, CB)
    for (const x of [-0.45, 0.45]) plaque(out, x, Y_EAVE + 3.6, MAIN.z0, 0.08, 0.4, Math.PI, 0.05, STRIPE, CB)
    balustrade(out, { x: -1.9, z: gz - 0.1 }, { x: 1.9, z: gz - 0.1 }, Y_EAVE + 0.3, 0.8)
    box(out, 0, yA + 0.55, gz + 0.3, 0.03, 0.45, 0.03, TRIM, CB)                                       // the finial spike
  }
  // the segmental-arched dormer beside the gable (east of it) and gabled dormers on the east and west slopes
  {
    const dx = -6.4, dz = MAIN.z0 - OVER + 0.9
    box(out, dx, Y_EAVE + 1.35, dz + 0.6, 1.3, 1.1, 0.7, TRIM, CB)
    prism(out, dx, dz + 0.6, Y_EAVE + 2.45, Y_EAVE + 2.9, 1.35, 12, TRIM, CB, 0.9)
    plaque(out, dx, Y_EAVE + 1.5, dz - 0.1, 0.9, 0.6, Math.PI, 0.02, GLASS, GL)
  }
  for (const [x, s] of [[MAIN.x0 - OVER + 1.2, -1], [MAIN.x1 + OVER - 1.2, 1]] as [number, number][]) {
    const z = 1.2
    box(out, x, Y_EAVE + 1.3, z, 0.9, 1.05, 1.0, TRIM, CB)
    const P = (px: number, py: number, pz: number): V3 => [px, py, pz]
    out.quad([P(x - 0.9 * s, Y_EAVE + 2.35, z - 1.0), P(x - 0.9 * s, Y_EAVE + 2.35, z + 1.0), P(x - 0.9 * s, Y_EAVE + 3.3, z), P(x - 0.9 * s, Y_EAVE + 3.3, z)], [s, 0, 0], UV, TRIM, CB)
    out.quad([P(x - 0.9 * s, Y_EAVE + 2.3, z - 1.1), P(x - 0.9 * s, Y_EAVE + 3.35, z), P(x + 1.0 * s, Y_EAVE + 3.35, z), P(x + 1.0 * s, Y_EAVE + 2.3, z - 1.1)], [0, 0.7, -0.7], UV, SLATE, TL)
    out.quad([P(x - 0.9 * s, Y_EAVE + 3.35, z), P(x - 0.9 * s, Y_EAVE + 2.3, z + 1.1), P(x + 1.0 * s, Y_EAVE + 2.3, z + 1.1), P(x + 1.0 * s, Y_EAVE + 3.35, z)], [0, 0.7, 0.7], UV, SLATE, TL)
    plaque(out, x - 0.92 * s, Y_EAVE + 1.4, z, 0.55, 0.65, s > 0 ? Math.PI / 2 : -Math.PI / 2, 0.02, GLASS, GL)
  }
  // two roof lights on the front slope, west of the gable
  for (const x of [2.3, 3.5]) out.quad([[x - 0.45, roofY(x, -3.9) + 0.03, -3.9], [x + 0.45, roofY(x, -3.9) + 0.03, -3.9], [x + 0.45, roofY(x, -2.2) + 0.03, -2.2], [x - 0.45, roofY(x, -2.2) + 0.03, -2.2]], [0, 0.7, -0.7], UV, GLASS, GL)
  // the cupola on the ridge behind the gable: a square louvred stage under a pyramidal cap and a spike
  {
    const cx = 0.3, cz = 0.9, yc = roofY(cx + 1.1, cz + 1.1) - 0.6
    box(out, cx, yc + 0.6, cz, 1.15, 0.6, 1.15, TRIM, CB)
    spireOn(out, { x: cx, z: cz }, yc + 1.2, 1.1, 2.2, 1.6, { colour: TRIM, spireColour: SLATE, material: 'clapboard', spireMaterial: 'tile', sides: 4, belfry: false })
    for (let k = 0; k < 4; k++) {
      const h = (k / 4) * Math.PI * 2
      for (const dy of [0.5, 0.95, 1.4, 1.85]) plaque(out, cx + Math.sin(h) * 0.78, yc + 1.2 + dy, cz + Math.cos(h) * 0.78, 0.42, 0.14, h, 0.04, STRIPE, CB)
    }
    box(out, cx, yc + 5.3, cz, 0.03, 0.4, 0.03, TRIM, CB)
  }
  // the red brick chimney with four pots, on the west slope by the ridge; a small white stack at the back
  {
    const cx = 4.6, cz = 0.6
    const ry = roofY(cx + 0.55, cz)
    box(out, cx, ry - 2.0 + 2.7, cz, 0.55, 2.7, 0.75, BRICK, BK)
    box(out, cx, ry + 3.45, cz, 0.65, 0.08, 0.85, TRIM, CB)
    for (const dz of [-0.5, -0.17, 0.17, 0.5]) prism(out, cx, cz + dz, ry + 3.5, ry + 4.1, 0.13, 8, [0.3, 0.3, 0.32], MT)
  }
  box(out, -4.0, roofY(-4.0, 5.3) + 0.3, 5.0, 0.3, 1.2, 0.3, TRIM, CB)

  // ---- the annex at the back-right (west) end: two storeys of shingle under a hip, lower than the house -----------
  const Y_ANNEX = Y_SECOND + 2.4
  wallsOf(out, ANNEX.x0, ANNEX.x1, ANNEX.z0, ANNEX.z1, Y_MAIN, Y_SECOND, WALL, CB)
  wallsOf(out, ANNEX.x0, ANNEX.x1, ANNEX.z0, ANNEX.z1, Y_SECOND, Y_ANNEX, SHINGLE, CB)
  boxAlong(out, (ANNEX.x0 + ANNEX.x1) / 2, Y_ANNEX, (ANNEX.z0 + ANNEX.z1) / 2, (ANNEX.x1 - ANNEX.x0) / 2 + 0.35, 0.16, (ANNEX.z1 - ANNEX.z0) / 2 + 0.35, 0, TRIM, CB)
  hip(out, ANNEX.x0 - 0.35, ANNEX.x1 + 0.35, ANNEX.z0 - 0.35, ANNEX.z1 + 0.35, Y_ANNEX + 0.16, 1.9, SLATE, TL)
  for (const [y0, y1] of [[Y_MAIN + 0.9, Y_MAIN + 2.9], [Y_SECOND + 0.6, Y_SECOND + 2.0]] as [number, number][]) {
    sash(out, 8.9, ANNEX.z0, Math.PI, y0, y1, 0.45)
    for (const z of [1.6, 4.4, 6.6]) sash(out, ANNEX.x1, z, Math.PI / 2, y0, y1, 0.42)
  }

  // ---- the lot: the dark retaining wall with its iron fence along Caselli, the stair up by the gate ---------------
  {
    const zw = MAIN.z0 - 4.0, top = Math.max(ground(0, MAIN.z0 - 0.5), ground(0, zw)) + 0.5
    const xs = [-11.8, -8, -4, 0, 4, 8, 11.2]
    for (let i = 0; i < xs.length - 1; i++) {
      const x0 = xs[i], x1 = xs[i + 1], foot = Math.min(ground(x0, zw), ground(x1, zw)) - 0.6
      box(out, (x0 + x1) / 2, (foot + top) / 2, zw, (x1 - x0) / 2, (top - foot) / 2, 0.3, BASE, ST)
    }
    railing(out, [{ x: xs[0], z: zw }, { x: xs[xs.length - 1], z: zw }], top, { kind: 'posts', height: 1.1, spacing: 1.2, colour: IRON })
    // the "250" gate piers at the Douglass end, and the stair from the gate up to the porch's east end: a straight
    // flight along the front, each step a solid block down to the ground so the flight shows no daylight under it
    for (const x of [-11.6, -10.4]) box(out, x, top + 0.75, zw, 0.25, 0.75, 0.3, TRIM, 0)
    const steps = 12, zs = MAIN.z0 - 1.5, xFoot = -9.6, xHead = -4.4
    for (let k = 0; k < steps; k++) {
      const t = (k + 0.5) / steps, y = top + ((k + 1) / steps) * (Y_PORCH - top), x = xFoot + t * (xHead - xFoot)
      const foot = ground(x, zs) - 0.6
      box(out, x, (foot + y) / 2, zs, (xHead - xFoot) / steps / 2 + 0.01, (y - foot) / 2, 0.75, [0.66, 0.66, 0.64], ST)
    }
    box(out, (xHead + PORCH.x0) / 2, (ground(-4, zs) - 0.6 + Y_PORCH) / 2, zs, (PORCH.x0 - xHead) / 2 + 0.3, (Y_PORCH - ground(-4, zs) + 0.6) / 2, 0.75, [0.66, 0.66, 0.64], ST)
    railing(out, [{ x: xFoot, z: zs - 0.75 }, { x: PORCH.x0 + 0.3, z: zs - 0.75 }], Y_PORCH, { kind: 'posts', height: 1.0, spacing: 1.0, colour: IRON })
  }
}

export const CLARKE_MANSION: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  clarkeMansion_250_Douglass,
}
