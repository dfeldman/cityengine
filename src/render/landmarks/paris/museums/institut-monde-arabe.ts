import type { MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { beam, prism, shade, type Rgb } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { faceBand } from '../../tower.ts'
import { ccw, jitter, plan, sheet, slab, type P2, type V3 } from './shapes.ts'

const FIXED = 0

/**
 * The Institut du monde arabe (Jean Nouvel, Architecture-Studio, 1987) on the Quai Saint-Bernard (fr.wikipedia):
 *
 * - the SOUTH front to the Place Mohammed-V: a 75 m wall of 240 MOUCHARABIEHS — square metal panels, each a
 *   pattern of light-sensitive diaphragms round a central iris (they open and close; Arab geometry in steel);
 * - the NORTH wing, curved along the Seine, glass screen-printed with old Paris "de façon allusive", ending at
 *   the west in the sharp PROW toward Notre-Dame;
 * - between them the narrow cut (the faille) running in to the square patio, and at the south block's glazed
 *   west end the TOUR DES LIVRES, the library's spiral of books rising through the reading rooms.
 *
 * Plan from OSM way 22870791 (77 × 35 m, 32 m), turned into this frame: local x along the building (+x to the SE,
 * −x the prow), −z the moucharabieh front (bearing 226.5, to the SW). Placed by point and size.
 *
 * Second pass (owner, 2026-11-03, with photographs: "the two most distinctive things are the visible internal spiral on
 * one side of the building and the arabesque square pattern in each pane of glass"):
 * - every panel is ONE quad in the MOUCHARABIEH surface (cartoon-material.ts, 19), which draws the iris, the ring of
 *   diaphragms and the border of small ones per pixel — pale aluminium with dark apertures, as the photographs are, not
 *   the dark panels with pale octagons of the first pass — on the south front (24 × 10 = the 240), the east end and
 *   the south block's faces onto the cut, and (owner, same day) the north wing's river face and east end; the ground
 *   floor under them is glass, set back behind round columns;
 * - the west end is an OPEN cage of mullions and floor edges, no panes: the landmark material has no transparency
 *   (its glass is a mirror), so the panes of 2026-10-30 were a dark wall and the spiral was behind it. The floors are
 *   rings round a well, and in the well the Tour des Livres: a white core with a helical ramp of books round it, a
 *   turn a storey, parapet on its outer edge — the spiral the owner wanted to see from the street.
 */
const REF = { hx: 38.7, hz: 17.6 }
const SOUTH: [number, number][] = [[-26, -17.45], [38.7, -17.3], [38.65, -9.6], [26, -9.4], [10.7, -9.8], [10.4, -3.4], [-26, -5]]
const NORTH: [number, number][] = [[-28.6, -1.4], [10.3, 0], [10.3, 5.2], [25.4, 5.7], [26, -9.4], [38.65, -9.6], [36.7, 17.6], [33, 17.5],
  [23.1, 17.3], [15.7, 17.1], [9.4, 16.4], [2.9, 15.2], [-1.4, 14.4], [-8.6, 12.3], [-10.9, 11.2], [-14.6, 9.1], [-16.8, 7.3]]

const GLASS = surfaceTag('glass')
const MOUCHARABIEH = surfaceTag('moucharabieh')
const STOREY = 3.4

/**
 * A wall of moucharabieh panels on the vertical face over the plan edge a→b (outward normal to the right of a→b, as
 * `slab`'s walls face), between y0 and y1: `cols` × `rows` panels, each one quad with its own 0..1 uv, and the steel
 * grid between them. The panel plane sits 6 cm proud of the wall, the bars 3 cm either side of it.
 */
function panelWall(out: MeshBuilder, a: P2, b: P2, y0: number, y1: number, cols: number, rows: number, panel: Rgb, steel: Rgb): void {
  const L = Math.hypot(b.x - a.x, b.z - a.z)
  const ux = (b.x - a.x) / L
  const uz = (b.z - a.z) / L
  const n: V3 = [uz, 0, -ux]
  const at = (t: number, y: number, off: number): V3 => [a.x + ux * t + n[0] * off, y, a.z + uz * t + n[2] * off]
  const pw = L / cols
  const ph = (y1 - y0) / rows
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const t0 = i * pw
      const t1 = t0 + pw
      const ya = y0 + j * ph
      const yb = ya + ph
      out.quad([at(t0, ya, 0.06), at(t1, ya, 0.06), at(t1, yb, 0.06), at(t0, yb, 0.06)], n,
        [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]], panel, MOUCHARABIEH)
    }
  }
  for (let i = 0; i <= cols; i++) beam(out, at(i * pw, y0, 0.03), at(i * pw, y1, 0.03), 0.09, steel)
  for (let j = 0; j <= rows; j++) beam(out, at(0, y0 + j * ph, 0.03), at(L, y0 + j * ph, 0.03), 0.09, steel)
}

export function institutMondeArabe(out: MeshBuilder, fit: Fit): void {
  const sx = Math.min(Math.max(fit.hx, 32), 46) / REF.hx
  const sz = Math.min(Math.max(fit.hz, 14), 21) / REF.hz
  const P = (pts: [number, number][]) => plan(pts, sx, sz)
  const metal: Rgb = [0.66, 0.68, 0.7]
  const steel: Rgb = [0.5, 0.52, 0.55]
  const alu: Rgb = [0.8, 0.82, 0.84]        // the panels: pale aluminium, the apertures dark in the shader
  const glass: Rgb = [0.3, 0.34, 0.38]
  const printed: Rgb = [0.66, 0.72, 0.75]
  const roofC: Rgb = [0.6, 0.62, 0.62]
  const H = 31
  const HN = 29
  const y0 = 3            // the panels start over the glazed ground floor
  const yTop = H - 1.5    // …and stop under the roof's band

  // ---- the south block over its glazed ground floor, and the north wing; the cut between them left open
  const south = ccw(P(SOUTH))
  slab(out, south, y0, H, metal, roofC)
  // the ground floor set 1.5 m back from the front, under a soffit, dark glass behind round columns
  const setback = 1.5
  const ground = ccw(P(SOUTH.map(([x, z], i) => (i < 2 ? [x, z + setback / sz] : [x, z]))))
  for (let i = 0; i < ground.length; i++) {
    const a = ground[i]
    const b = ground[(i + 1) % ground.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L < 0.05) continue
    out.quad([[a.x, 0, a.z], [b.x, 0, b.z], [b.x, y0, b.z], [a.x, y0, a.z]], [(b.z - a.z) / L, 0, -(b.x - a.x) / L],
      [[0, 0], [L / 1.8, 0], [L / 1.8, 1], [0, 1]], glass, GLASS)
  }
  for (const e of [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0]]) {
    const a = south[e[0]]
    const b = south[e[1]]
    if (a.z > -16 * sz || b.z > -16 * sz) continue
    out.quad([[a.x, y0, a.z], [b.x, y0, b.z], [b.x, y0, b.z + setback], [a.x, y0, a.z + setback]], [0, -1, 0],
      [[0, 0], [1, 0], [1, 1], [0, 1]], shade(metal, 0.8), FIXED)
  }
  const north = ccw(P(NORTH))
  slab(out, north, 0, HN, printed, roofC)
  // the north wing's glass, floor by floor, its frit the old city's skyline in white bands
  faceBand(out, north, 0, HN, { kind: 'curtain', wall: printed, glass: [0.64, 0.71, 0.75], pitch: 1.8, floor: 3.3, material: 'glass' })
  // the terrace's parapet on the north wing's roof
  slab(out, north, HN, HN + 1.1, shade(metal, 0.92), roofC, false)

  // ---- the moucharabiehs: the 240 of the south front (24 × 10), and the panels that turn the corner onto the east end
  // and the south block's faces into the cut, each face's panels about 2.7 m square
  const front = { a: south[0], b: south[1] }
  panelWall(out, front.a, front.b, y0, yTop, 24, 10, alu, steel)
  const faces = [[1, 2], [3, 4], [5, 6]] as const     // the east end, the cut's inner face, the cut's long face
  for (const [i, j] of faces) {
    const a = south[i]
    const b = south[j]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    panelWall(out, a, b, y0, yTop, Math.max(1, Math.round(L / 2.7)), 10, alu, steel)
  }
  // the columns along the recessed ground floor, one to every two bays
  const fx0 = front.a.x
  const fx1 = front.b.x
  const zf = front.a.z
  for (let i = 1; i < 24; i += 2) prism(out, fx0 + ((fx1 - fx0) * i) / 24, zf + 0.7, 0, y0, 0.32, 10, shade(metal, 0.9), FIXED)
  // the north wing's river face too (owner, 2026-11-03: "put the moucharabieh pattern on the north wing's river face"):
  // every outward edge of its curve that faces the Seine, and its east end; the cut and the patio keep the printed glass
  for (let i = 0; i < north.length; i++) {
    const a = north[i]
    const b = north[(i + 1) % north.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L < 1) continue
    const nx = (b.z - a.z) / L
    const nz = -(b.x - a.x) / L
    if (!(nz > 0.3 || (nx > 0.9 && a.x > 30 * sx))) continue
    panelWall(out, a, b, y0, HN - 1.5, Math.max(1, Math.round(L / 2.7)), 10, alu, steel)
  }
  // the roof's band over the front (tagged metal: a pale FIXED face goes dressed stone in the landmark material)
  const METAL = surfaceTag('metal')
  out.quad([[-38.7 * sx, yTop, zf - 0.1], [fx1, yTop, zf - 0.1], [fx1, H, zf - 0.1], [-38.7 * sx, H, zf - 0.1]], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], metal, METAL)

  // ---- the library's glazed west end: an open cage of floor edges and mullions, the Tour des Livres rising in it
  const wx0 = -38.7 * sx
  const wx1 = -26 * sx
  const wz0 = -17.45 * sz
  const wz1 = -5.2 * sz
  const tx = (wx0 + wx1) / 2
  const tz = (wz0 + wz1) / 2
  const core = 2.2                        // the white core the books spiral round
  const ramp = 1.6                        // the ramp's width
  const well = core + ramp + 0.6          // the floors' well round the tower
  const floorC = shade(metal, 0.85)
  // each floor a ring from the well to the walls, 0.35 thick (its top, and `back` its underside)
  const rect = (a: number): number => {
    const c = Math.cos(a)
    const s = Math.sin(a)
    const tX = c > 1e-6 ? (wx1 - tx) / c : c < -1e-6 ? (wx0 - tx) / c : Infinity
    const tZ = s > 1e-6 ? (wz1 - tz) / s : s < -1e-6 ? (wz0 - tz) / s : Infinity
    return Math.min(tX, tZ)
  }
  for (let y = STOREY; y < H - 1; y += STOREY) {
    sheet(out, (u, v) => {
      const a = u * Math.PI * 2
      const r = well + v * (rect(a) - well)
      return [tx + Math.cos(a) * r, y, tz + Math.sin(a) * r]
    }, 16, 1, floorC, 0.35)
  }
  // the floor edges on the three glazed faces, a 0.9 m band each, and the mullions every 1.75 m with a bar between floors
  const outer: [P2, P2][] = [[{ x: wx0, z: wz1 }, { x: wx0, z: wz0 }], [{ x: wx0, z: wz0 }, { x: wx1, z: wz0 }], [{ x: wx1, z: wz1 }, { x: wx0, z: wz1 }]]
  for (const [a, b] of outer) {
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    const ux = (b.x - a.x) / L
    const uz = (b.z - a.z) / L
    const n: V3 = [uz, 0, -ux]
    const at = (t: number, y: number, off: number): V3 => [a.x + ux * t + n[0] * off, y, a.z + uz * t + n[2] * off]
    for (let y = STOREY; y < H - 1; y += STOREY) {
      out.quad([at(0, y - 0.5, 0.02), at(L, y - 0.5, 0.02), at(L, y + 0.4, 0.02), at(0, y + 0.4, 0.02)], n, [[0, 0], [1, 0], [1, 1], [0, 1]], shade(metal, 0.7), FIXED)
      beam(out, at(0, y + 1.9, 0), at(L, y + 1.9, 0), 0.05, steel)
    }
    const bays = Math.max(1, Math.round(L / 1.75))
    for (let i = 0; i <= bays; i++) beam(out, at((i / bays) * L, 0, 0), at((i / bays) * L, H, 0), i === 0 || i === bays ? 0.18 : 0.07, steel)
    beam(out, at(0, 1.9, 0), at(L, 1.9, 0), 0.05, steel)
    // the roof's band, carried round the bay
    out.quad([at(0, yTop, 0.1), at(L, yTop, 0.1), at(L, H, 0.1), at(0, H, 0.1)], n, [[0, 0], [1, 0], [1, 1], [0, 1]], metal, METAL)
  }
  out.quad([[wx0, H, wz0], [wx1, H, wz0], [wx1, H, wz1], [wx0, H, wz1]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], roofC, FIXED)
  // the reading rooms' back wall, seen through the cage: plain, not the dressed stone a pale untagged wall becomes
  out.quad([[wx1 - 0.05, 0, wz1], [wx1 - 0.05, 0, wz0], [wx1 - 0.05, H, wz0], [wx1 - 0.05, H, wz1]], [-1, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], [0.5, 0.5, 0.52], METAL)
  // the Tour des Livres: the white core, and round it the ramp climbing a storey a turn, books shelved along its
  // inner side, a parapet on its outer edge
  const STUCCO = surfaceTag('stucco')
  prism(out, tx, tz, 0, H - 0.3, core, 16, [0.92, 0.9, 0.86], STUCCO)
  const turns = Math.floor((H - 2.4) / STOREY)
  const seg = 24
  const helix = (u: number, r: number, dy: number): V3 => {
    const a = u * turns * Math.PI * 2
    return [tx + Math.cos(a) * r, 0.6 + u * turns * STOREY + dy, tz + Math.sin(a) * r]
  }
  sheet(out, (u, v) => helix(u, core + v * ramp, 0), turns * seg, 1, [0.8, 0.7, 0.54], 0.25)
  sheet(out, (u, v) => helix(u, core + ramp, v * 1.0), turns * seg, 1, [0.9, 0.9, 0.88], 0.08, STUCCO)
  const books: Rgb[] = [[0.55, 0.2, 0.16], [0.2, 0.28, 0.45], [0.3, 0.4, 0.3], [0.7, 0.6, 0.42], [0.42, 0.22, 0.3]]
  sheet(out, (u, v) => helix(u, core + 0.1, 0.3 + v * 1.9), turns * seg, 1, (u) => books[Math.floor(jitter(Math.floor(u * turns * seg), 5) * books.length)], 0.1)

  // ---- the prow: the north wing's west point, cut back in glass
  const tip = north.reduce((b, p) => (p.x < b.x ? p : b), north[0])
  prism(out, tip.x + 1.2, tip.z + 0.6, 0, HN, 0.25, 6, metal, FIXED)
  // the parvis's paving under the cut, and the cut's lit floor line
  out.quad([[-28 * sx, 0.05, -5 * sz], [10.3 * sx, 0.05, -3.4 * sz], [10.3 * sx, 0.05, 0], [-28 * sx, 0.05, -1.4 * sz]], [0, 1, 0],
    [[0, 0], [1, 0], [1, 1], [0, 1]], [0.7, 0.7, 0.68], surfaceTag('granite'))
}
