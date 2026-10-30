import type { MeshBuilder } from '../../../buildings.ts'
import { capPolygonWithHoles } from '../../../buildings.ts'
import { block, shade, type Rgb } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { fitted, pts, rectOn, slabOn } from '../palaces/common.ts'
import { hull, piers, ribbons, terraceTree } from './modern.ts'

const FIXED = 0
/** the design footprint: OSM way 481196425's box (local −z faces bearing 63.5, the Cours des Avocats and the parvis) */
const HX = 88.9
const HZ = 84.9

/** OSM's outline of the socle in this frame (osmium, 2026-10-30): the wide block, the wing running off north along the ring road */
const SOCLE = pts([-54.6, 84.9, -83.3, 83, -73.9, 52.6, -88.8, -84.9, 79.6, -84.9, 79.9, -75.1, 86.7, -75.5, 87, -67.5, 88.8, -67.6, 88.4, -31, 85.2, -31, 85.2, -27.8, -47.7, -28.4])
/** the storeys' heights: 8, 19, 30 and 38 levels by OSM's building:parts, at the 160 m the whole is usually given */
const Y1 = 37
const Y2 = 84
const Y3 = 125
const Y4 = 160
/** the three blocks of the tower, all the same 23 m deep, stepping back from the south-east end; x's from OSM's parts */
const Z0 = -50.7
const Z1 = -27.5
const BLOCKS: [number, number, number, number][] = [[-31.9, 80.4, Y1, Y2], [1.5, 76.8, Y2, Y3], [23.4, 74.5, Y3, Y4]]

const GLASS: Rgb = [0.56, 0.69, 0.81]
const PALE: Rgb = [0.88, 0.91, 0.92]
const WHITE: Rgb = [0.93, 0.94, 0.94]
const DARK: Rgb = [0.24, 0.3, 0.35]
const LOUVRE: Rgb = [0.27, 0.3, 0.34]
const LEAF: Rgb = [0.24, 0.42, 0.19]
const LIFT: Rgb = [0.78, 0.12, 0.1]

/**
 * Le Tribunal de Paris (Renzo Piano Building Workshop, finished 2017), beside the ring road at the Porte de Clichy. A pale
 * glass stack, seen from all over the north of Paris as three blocks standing on each other, and from close to as:
 *
 * - from the COURS DES AVOCATS (local −z): the socle, a glass wall eight storeys high and 170 m long, the line of trees
 *   standing along its roof, and at its south-east corner the white stack of outside stairs climbing to the terrace;
 * - from the RUE DU BASTION (local −x): the socle's other face, dark ribbed metal, and over it the tower's stepped end, the
 *   three blocks 23 m across each set back from the last with the trees on the terrace it leaves;
 * - from far off, on the tower's long sides, the white steel spine running up the middle of the glass, its lifts red.
 *
 * The socle's plan and the blocks' extents and levels are OSM's way 481196425 and its building:parts (osmium, 2026-10-30).
 * The materials, the spine, the stairs and the trees are from the Commons photographs "Tribunal de Paris (1)", "Tribunal de
 * Paris seen from Batignolles park", "Tribunal de Paris seen from entrance" and "Tribunal de Paris (42805331940)". Where the
 * doors stand on the parvis I could not see in them: the lobby in the middle of the −z wall is an estimate.
 */
export function tribunal(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  socle(out)
  for (const [x0, x1, y0, y1] of BLOCKS) tower(out, x0, x1, y0, y1)
  spine(out, Z0 - 0.5, -1)
  spine(out, Z1 + 0.5, 1)
}

function socle(out: MeshBuilder): void {
  hull(out, [SOCLE], 0, Y1, GLASS, [0.38, 0.4, 0.38])
  // the floors, and the mullions, which at this length are what says glass
  const floors: [number, number][] = []
  for (let y = 4.6; y < Y1 - 1; y += 4.1) floors.push([y, y + 0.34])
  ribbons(out, [SOCLE], floors, PALE, 0.06, 0)
  piers(out, [SOCLE], 0, Y1, 7.5, 0.16, PALE, 0.08, 6)
  // the parapet: the glass runs on past the roof
  ribbons(out, [SOCLE], [[Y1 - 0.6, Y1 - 0.2]], WHITE, 0.14, 0)
  ribbons(out, [SOCLE], [[0, 4.2]], DARK, 0.04, 0.6, 14)

  // ---- the south-west face, ribbed metal, where the courts' services are (the −x wall of the plan)
  const q = (a: [number, number], b: [number, number], y0: number, y1: number, c: Rgb): void => {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1])
    const nx = (a[1] - b[1]) / L
    const nz = (b[0] - a[0]) / L
    const P = (p: [number, number], y: number, d: number): [number, number, number] => [p[0] + nx * d, y, p[1] + nz * d]
    out.quad([P(a, y0, 0.2), P(b, y0, 0.2), P(b, y1, 0.2), P(a, y1, 0.2)], [nx, 0, nz], [[0, 0], [1, 0], [1, 1], [0, 1]], c, FIXED)
  }
  q([-74, 52.5], [-88.8, -85], 0, Y1 + 0.3, LOUVRE)
  q([-83.3, 83], [-74, 52.5], 0, Y1 + 0.3, LOUVRE)
  for (let t = 0.02; t < 1; t += 0.038) {
    const x = -74 + (-88.8 + 74) * t
    const z = 52.5 + (-85 - 52.5) * t
    block(out, x - 0.28, x - 0.06, z - 0.12, z + 0.12, 0, Y1 + 0.3, shade(LOUVRE, 0.72))
  }
  for (let y = 5; y < Y1; y += 8) q([-74, 52.5], [-88.8, -85], y, y + 0.22, shade(LOUVRE, 0.68))

  // ---- the lobby on the parvis, its glass run up five floors between white posts under the overhang (estimated)
  const f = -84.9
  block(out, -24, 36, f - 0.1, f + 8, 0, 21, [0.5, 0.62, 0.72])
  for (let x = -24; x <= 36; x += 7.5) block(out, x - 0.16, x + 0.16, f - 0.4, f, 0, 21, PALE)
  for (let y = 4.4; y < 21; y += 4.1) slabOn(out, '-z', f - 0.1, -24, 36, y, y + 0.16, 0.1, PALE)
  slabOn(out, '-z', f, -26, 38, 21, 21.7, 5.5, WHITE)
  rectOn(out, '-z', f - 0.1, -5, 17, 0, 4, DARK, 0.1)

  // ---- the white stairs at the corner, five flights hanging off it from the terrace down
  const sx = -80
  const sz = -84
  for (let i = 0; i < 5; i++) {
    const y = Y1 + 1 - i * 4.4
    // the landing, its rail and the flight falling from it
    block(out, sx - 8.6, sx + 8.6, sz - 3.3, sz - 2.9, y - 0.3, y, WHITE)
    block(out, sx - 8.6, sx + 8.6, sz - 3.32, sz - 3.26, y, y + 1.1, WHITE)
    for (const side of [-1, 1]) {
      const a: [number, number] = [sx + side * 8.6, sz - 3.3]
      const b: [number, number] = [sx - side * 8.6, sz - 0.2]
      out.quad([[a[0], y - 4.4, a[1]], [b[0], y - 0.3, b[1]], [b[0], y, b[1]], [a[0], y - 4.1, a[1]]], [0, 0.1, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], WHITE, FIXED)
      if (i > 0) break
    }
    block(out, sx - 8.8, sx + 8.8, sz - 3.4, sz + 0.1, y - 4.5, y - 4.32, WHITE)
  }

  // ---- the trees along the roof, the strip the photographs show them in, and the terrace over the −x half
  for (let x = -76; x < 74; x += 11) terraceTree(out, x + ((x * 7) % 3), -79.5, Y1, 3.6, LEAF)
  for (const [x, z] of [[-70, -60], [-62, -68], [-55, -45], [-68, -35], [-72, -15], [-60, -12], [-62, 15], [-70, 30], [-58, 40], [-66, 62], [-72, 76]] as const) terraceTree(out, x, z, Y1, 3.4, LEAF)
  for (let x = 50; x < 84; x += 10) terraceTree(out, x, -62, Y1, 3.2, shade(LEAF, 1.1))
}

/** One block of the tower: glass, its floors, the pale shades over its long faces, its end a white grid. */
function tower(out: MeshBuilder, x0: number, x1: number, y0: number, y1: number): void {
  const R = [pts([x0, Z0, x1, Z0, x1, Z1, x0, Z1])]
  hull(out, R, y0, y1, GLASS, [0.42, 0.45, 0.45])
  const floors: [number, number][] = []
  for (let y = y0 + 3.9; y < y1 - 1; y += 3.9) floors.push([y, y + 0.34])
  ribbons(out, R, floors, PALE, 0.08, 0)
  piers(out, R, y0, y1, 5.6, 0.14, PALE, 0.1, 6)
  // the ends: a white grid in front of the glass (pale with the blinds drawn)
  for (const [x, f] of [[x0, '-x'], [x1, '+x']] as const) {
    for (let y = y0 + 0.6; y < y1 - 1; y += 3.9) rectOn(out, f, x, Z0 + 0.6, Z1 - 0.6, y, y + 1.4, shade(PALE, 0.96), 0.13)
    for (let z = Z0 + 3.8; z < Z1 - 1; z += 3.8) rectOn(out, f, x, z - 0.1, z + 0.1, y0, y1, WHITE, 0.2)
  }
  // the glass carried past the roof as a screen on all four sides, the terrace's parapet: what makes the tops so sharp
  for (const [t, f] of [[Z0, '-z'], [Z1, '+z']] as const) {
    rectOn(out, f, t, x0, x1, y1, y1 + 2.4, [0.62, 0.74, 0.84], 0.02)
    rectOn(out, f, t, x0, x1, y1 + 2.3, y1 + 2.6, WHITE, 0.05)
  }
  for (const [x, f] of [[x0, '-x'], [x1, '+x']] as const) {
    rectOn(out, f, x, Z0, Z1, y1, y1 + 2.4, [0.62, 0.74, 0.84], 0.02)
    rectOn(out, f, x, Z0, Z1, y1 + 2.3, y1 + 2.6, WHITE, 0.05)
  }
  // the terrace on the end it steps back from, with its trees, where another block stands on this one
  for (const nx of BLOCKS) {
    if (nx[2] === y1) {
      capPolygonWithHoles(out, [pts([x0, Z0, nx[0], Z0, nx[0], Z1, x0, Z1])], y1 + 0.2, [0.36, 0.42, 0.32], FIXED)
      for (let x = x0 + 4; x < nx[0] - 2; x += 6.5) for (const z of [Z0 + 6, Z1 - 7]) terraceTree(out, x, z, y1, 3.4, LEAF)
    }
  }
}

/** The steel spine up the middle of a long face: two white masts, their crossheads, the lift cages and two red cars. */
function spine(out: MeshBuilder, z: number, s: number): void {
  const x = 50
  const d = s * 1.6
  const zz = (a: number, b: number): [number, number] => [Math.min(z + a * s, z + b * s), Math.max(z + a * s, z + b * s)]
  const [z0, z1] = zz(0, 1.6)
  for (const dx of [-3, 3]) block(out, x + dx - 0.28, x + dx + 0.28, z0, z1, Y1 - 6, Y4 + 3, WHITE)
  for (let y = Y1; y < Y4; y += 7.8) {
    block(out, x - 5.4, x + 5.4, z0, z1, y, y + 0.34, WHITE)
    // the cross-bracing of a bay, its light steel seen as two thin bars
    out.quad([[x - 3, y, z + d], [x + 3, y + 7.4, z + d], [x + 3, y + 7.8, z + d], [x - 3, y + 0.4, z + d]], [0, 0, s], [[0, 0], [1, 0], [1, 1], [0, 1]], PALE, FIXED)
  }
  for (const y of s < 0 ? [52, 118] : [74, 136]) block(out, x - 1.2, x + 1.2, z0, z1, y, y + 3.6, LIFT)
}
