import type { MeshBuilder } from '../../../buildings.ts'
import { box, prism, type Rgb } from '../../../models.ts'
import { beam, block, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import {
  archOn, clockOn, dormers, fitted, hipRoof, pairOn, palette, pavilionRoof, pedimentOn, range, rectOn, statue,
  type F, type Pal, type RangeOpts,
} from './common.ts'

const FIXED = 0
/** the design footprint: OSM relation 1463538's box turned 4° to the hôtel's axes (local −z faces bearing 4, the esplanade) */
const HX = 136.8
const HZ = 128.2

/**
 * The Hôtel des Invalides (Libéral Bruant, 1671–76; Saint-Louis-des-Soldats, Bruant and Hardouin-Mansart, 1676–79):
 * Louis XIV's home for old soldiers, its long front closing the Esplanade. What a rider sees:
 *
 * - the NORTH FRONT to the esplanade, 196 m: four storeys of windows over an arched ground floor, the steep slate roof
 *   and its unbroken row of DORMERS each carrying a carved TROPHY of armour; the corner pavilions with their own roofs;
 *   and in the middle the great frontispiece, its arch rising through the cornice into a round-headed gable, Coustou's
 *   Louis XIV on horseback in the lunette between Justice and Prudence, paired pilasters, Mars and Minerva by the door;
 * - in front, the dry moat and the bronze cannon of the "batterie triomphale" ranged along it;
 * - inside, the COUR D'HONNEUR (102 × 64 m): two storeys of arcades all round, cannon under them, the corner horses on
 *   the roofs, and at its head the clock pavilion with Seurre's Napoleon, the gable of Saint-Louis's nave over it;
 * - Saint-Louis itself, nave and aisles, running south to meet the Dôme (which is `invalidesDome` and OSM's church,
 *   and is NOT drawn here: the plan leaves its ground — local x −30…27, z > 67 — empty);
 * - the lower ranges round the eight side courts, and the long wings south either side of the Dôme.
 *
 * The plan is OSM's: relation 1463538 (the ranges round its fifteen courts) and way 64955027 (Saint-Louis), measured in
 * this frame with osmium, 2026-10-29. Local +x is WEST (the frame is turned 184°).
 */
export function invalides(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

type R = [number, number, number, number]

function draw(out: MeshBuilder): void {
  const p = palette('#ddd5c3', '#495055')
  const main: RangeOpts = {
    eaves: 20, bay: 3.5, win: 1.5, quoins: false,
    storeys: [{ y: 0, h: 3.0, arched: true, sill: 0.9 }, { y: 5.3, h: 2.9 }, { y: 10.0, h: 2.7 }, { y: 14.6, h: 2.4 }],
  }
  const low: RangeOpts = { eaves: 10.5, bay: 4.2, win: 1.4, frames: false, courses: false, storeys: [{ y: 0, h: 2.6, sill: 0.9 }, { y: 5.2, h: 2.6 }] }

  // ---- the main block round the cour d'honneur and the four side courts on each side
  const cour = { x0: -35.2, x1: 30.0, z0: -110, z1: -6.1 }
  const mains: { r: R; faces?: F[] }[] = [
    { r: [-86, 81, -122.4, -110] },                                   // the north range, between the pavilions
    { r: [-103, -86, -110, 2.5] },                                    // east outer
    { r: [-48, cour.x0, -110, -6.1], faces: ['-x'] },                 // east, on the court
    { r: [-86, -48, -64.3, -51.2] },                                  // east, between its two courts
    { r: [-99, cour.x0, -6.1, 2.5], faces: ['-z', '+z'] },            // east south
    { r: [cour.x1, 42.5, -110, -6.1], faces: ['+x'] },                // west, on the court
    { r: [81, 98, -110, 2.3] },                                       // west outer
    { r: [42.5, 81, -64.6, -51.8] },                                  // west, between its two courts
    { r: [cour.x1, 94, -6.6, 2.1], faces: ['-z', '+z'] },             // west south
    { r: [cour.x0, cour.x1, -6.1, 1.3], faces: ['+z'] },              // the court's head, against Saint-Louis
  ]
  for (const [i, { r, faces }] of mains.entries()) {
    // (window surrounds on the north front only: round the side courts they cost more than they show)
    range(out, r[0], r[1], r[2], r[3], p, i === 0 ? main : { ...main, bay: 4.0, faces, frames: false, storeys: [{ ...main.storeys[0], arched: false }, ...main.storeys.slice(1)] })
    hipRoof(out, r[0], r[1], r[2], r[3], 20, 9, p.slate, 0.3)
  }
  // the pavilions at the ends of the north front, standing forward, with their own steeper roofs
  for (const [x0, x1] of [[-103, -86], [81, 98]]) {
    range(out, x0, x1, -127.2, -110, p, { ...main, eaves: 21, quoins: true })
    pavilionRoof(out, x0, x1, -127.2, -110, 21, 10.5, p, { top: 2.5, crest: false })
    dormers(out, '-z', -127.2, x0 + 2, x1 - 2, 21, 4.2, p, { set: 1.4 })
  }
  // the north front's dormers: one in every bay, each a lucarne carrying a trophy of armour
  trophies(out, -86, -13.5, -122.4, p)
  trophies(out, 7.5, 81, -122.4, p)
  frontispiece(out, p)
  batterie(out, p)

  // ---- the cour d'honneur: two storeys of arcades on all four sides, the attic over, cannon, the horses on the corners
  const courFaces: [F, number, number, number][] = [
    ['+z', cour.z0, cour.x0, cour.x1], ['-z', cour.z1, cour.x0, cour.x1], ['+x', cour.x0, cour.z0, cour.z1], ['-x', cour.x1, cour.z0, cour.z1],
  ]
  for (const [f, plane, t0, t1] of courFaces) {
    const n = Math.round((t1 - t0) / 4.6)
    const step = (t1 - t0) / n
    for (let i = 0; i < n; i++) {
      const t = t0 + step * (i + 0.5)
      // the head of the court is the clock pavilion: no arcade across its middle
      if (f === '-z' && Math.abs(t + 2.1) < 13) continue
      archOn(out, f, plane, t, 0, 3.1, 5.6, p.dark, 0.08)
      archOn(out, f, plane, t, 7.0, 2.9, 4.8, p.dark, 0.08)
      rectOn(out, f, plane, t - 0.8, t + 0.8, 14.3, 16.8, p.glass, 0.08)
      if (i < n - 1) rectOn(out, f, plane, t + step / 2 - 0.45, t + step / 2 + 0.45, 0, 13.0, p.trim, 0.12)   // the piers
    }
    // the gallery floor between the storeys, and a cornice over the arcades
    const flat = f === '-z' || f === '+z'
    const d = f === '+z' || f === '+x' ? 1 : -1
    const sl = (y0: number, y1: number, out_: number): void => {
      if (flat) block(out, t0, t1, Math.min(plane, plane + d * out_), Math.max(plane, plane + d * out_), y0, y1, p.trim)
      else block(out, Math.min(plane, plane + d * out_), Math.max(plane, plane + d * out_), t0, t1, y0, y1, p.trim)
    }
    sl(6.4, 6.9, 0.4)
    sl(12.8, 13.4, 0.5)
    if (f !== '-z') dormers(out, f, plane, t0 + 3, t1 - 3, 20, 4.6, p, { set: 1.0, round: true, every: 2 })
  }
  for (const [x, z] of [[cour.x0 - 3, cour.z0 - 3], [cour.x1 + 3, cour.z0 - 3], [cour.x0 - 3, cour.z1 + 3], [cour.x1 + 3, cour.z1 + 3]]) horse(out, x, z, 26.5, p)
  for (let z = cour.z0 + 8; z < cour.z1 - 6; z += 9) {
    cannon(out, cour.x0 + 2.2, z, Math.PI / 2, p)
    cannon(out, cour.x1 - 2.2, z, -Math.PI / 2, p)
  }
  clockPavilion(out, p)

  // ---- Saint-Louis-des-Invalides: the nave, its aisles, the round chapels where it meets the Dôme
  church(out, p)

  // ---- the lower ranges round the courts to the south, either side of the Dôme
  const lows: R[] = [
    [-137, -127.9, 2.3, 128], [-96, -85.4, 2.3, 128], [-54.9, -41.5, 45.4, 128], [-47.3, -41.5, 2.3, 45.4],
    [-127.9, -96, 2.3, 11.7], [-85.4, -47.3, 2.5, 6.9], [-137, -41.5, 45.7, 54.7], [-137, -41.5, 82.5, 91.6], [-137, -41.5, 118.5, 128],
    [125.2, 136.9, 2.0, 127.5], [85.9, 96.6, 2.0, 127.5], [38.2, 48.2, 61.2, 127.5], [38.2, 43.3, 2.0, 61.2],
    [42.5, 136.9, 2.0, 10.6], [38.2, 136.9, 61.2, 72.9], [38.2, 136.9, 116.4, 127.5],
  ]
  for (const r of lows) {
    range(out, r[0], r[1], r[2], r[3], p, low)
    hipRoof(out, r[0], r[1], r[2], r[3], 10.5, 4.5, p.slate, 0.3)
  }
}

/** The trophy dormers along the north front: a stone lucarne, and on it a cuirass, a plumed helmet, flags behind. */
function trophies(out: MeshBuilder, t0: number, t1: number, plane: number, p: Pal): void {
  const n = Math.round((t1 - t0) / 3.5)
  const step = (t1 - t0) / n
  const z = plane + 1.0
  for (let i = 0; i < n; i++) {
    const x = t0 + step * (i + 0.5)
    block(out, x - 1.05, x + 1.05, z, z + 2.0, 20, 22.8, p.trim)
    rectOn(out, '-z', z, x - 0.6, x + 0.6, 20.3, 22.4, p.glass, 0.04)
    pedimentOn(out, '-z', z, x - 1.25, x + 1.25, 22.8, 0.55, 0.05, p.trim)
    // the trophy: a breastplate, the helmet and its crest, two banners crossed behind
    box(out, x, 23.9, z + 0.6, 0.55, 0.55, 0.3, p.trim, FIXED)
    prism(out, x, z + 0.6, 24.45, 25.2, 0.42, 8, p.trim, FIXED, 0.3)
    box(out, x, 25.45, z + 0.6, 0.07, 0.3, 0.32, p.trim, FIXED)
    box(out, x, 24.4, z + 1.0, 1.0, 0.75, 0.05, p.trim, FIXED)                                 // the banners spread behind
  }
}

/** The frontispiece: the arch through two storeys, the round-headed gable over the cornice, Louis XIV in its lunette. */
function frontispiece(out: MeshBuilder, p: Pal): void {
  const x0 = -13.0
  const x1 = 7.0
  const xm = (x0 + x1) / 2
  const z0 = -128.2
  range(out, x0, x1, z0, -116, p, { eaves: 20, bay: 20, storeys: [], faces: ['-z'], quoins: true, cornice: 0.8 })
  // the round-headed gable rising into the roof, its barrel roof back to the ridge
  const R = (x1 - x0) / 2
  const seg = 12
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI
    const a1 = ((i + 1) / seg) * Math.PI
    const P = (a: number, r: number, z: number): [number, number, number] => [xm + Math.cos(a) * r, 20 + Math.sin(a) * r, z]
    out.quad([P(a0, 0, z0), P(a0, R, z0), P(a1, R, z0), P(a1, 0, z0)], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], p.stone, FIXED)
    const am = (a0 + a1) / 2
    out.quad([P(a0, R + 0.4, z0 - 0.4), P(a1, R + 0.4, z0 - 0.4), P(a1, R + 0.4, -112), P(a0, R + 0.4, -112)],
      [Math.cos(am), Math.sin(am), 0], [[0, 0], [1, 0], [1, 1], [0, 1]], p.slate, FIXED)
    // the moulded archivolt round the gable
    out.quad([P(a0, R, z0 - 0.1), P(a0, R + 0.5, z0 - 0.1), P(a1, R + 0.5, z0 - 0.1), P(a1, R, z0 - 0.1)], [0, 0, -1],
      [[0, 0], [1, 0], [1, 1], [0, 1]], p.trim, FIXED)
  }
  // the lunette: Louis XIV on horseback between Justice and Prudence, in relief on a darker ground
  const lun = shade(p.stone, 0.78)
  archOn(out, '-z', z0, xm, 14.8, 9.0, 9.6, lun, 0.08)
  box(out, xm, 18.0, z0 - 0.35, 2.0, 0.75, 0.3, p.trim, FIXED)                                   // the horse
  for (const s of [-1, 1]) box(out, xm + s * 1.5, 16.6, z0 - 0.35, 0.18, 0.7, 0.2, p.trim, FIXED)
  box(out, xm + 1.9, 19.0, z0 - 0.35, 0.45, 0.6, 0.25, p.trim, FIXED)
  prism(out, xm - 0.2, z0 - 0.35, 18.7, 20.6, 0.4, 6, p.trim, FIXED, 0.28)                       // the king
  for (const s of [-1, 1]) prism(out, xm + s * 3.4, z0 - 0.3, 15.0, 18.4, 0.42, 6, p.trim, FIXED, 0.3)   // the Virtues
  // the great arch below it, the door at its foot, and the paired pilasters either side
  archOn(out, '-z', z0, xm, 0, 6.4, 14.2, shade(p.stone, 0.62), 0.06)
  archOn(out, '-z', z0, xm, 0, 3.6, 6.4, p.dark, 0.1)
  for (const t of [x0 + 1.6, x1 - 1.6]) pairOn(out, '-z', z0, t, 0.6, 19.4, 0.42, p.trim, 1.3)
  // Mars and Minerva on their pedestals by the door
  for (const s of [-1, 1]) statue(out, xm + s * 5.6, z0 - 1.4, 0, 3.4, p.trim)
}

/** The moat before the north front and the cannon of the batterie triomphale along its edge. */
function batterie(out: MeshBuilder, p: Pal): void {
  const z = -140
  for (const [a, b] of [[-96, -7], [1, 92]]) {
    block(out, a, b, z - 0.3, z + 0.3, 0, 0.9, p.trim)                                           // the moat's parapet
    block(out, a, b, -129.2, -128.6, 0, 0.6, p.deep)                                              // and its wall under the front
    for (let x = a + 4; x < b - 2; x += 8) cannon(out, x, z - 2.2, Math.PI, p)
  }
}

/** A bronze field gun on its carriage, its muzzle toward `heading` (0 = +z). */
function cannon(out: MeshBuilder, x: number, z: number, heading: number, p: Pal): void {
  const s = Math.sin(heading)
  const c = Math.cos(heading)
  const wood: Rgb = [0.28, 0.25, 0.2]
  block(out, x - 0.45 * Math.abs(c) - 1.1 * Math.abs(s), x + 0.45 * Math.abs(c) + 1.1 * Math.abs(s),
    z - 0.45 * Math.abs(s) - 1.1 * Math.abs(c), z + 0.45 * Math.abs(s) + 1.1 * Math.abs(c), 0, 0.7, wood)
  for (const k of [-1, 1]) {
    const wx = x + c * k * 0.62 + s * 0.5
    const wz = z - s * k * 0.62 + c * 0.5
    prism(out, wx, wz, 0, 1.3, 0.12, 6, wood, FIXED)
  }
  beam(out, [x - s * 1.3, 1.0, z - c * 1.3], [x + s * 1.6, 1.05, z + c * 1.6], 0.22, p.bronze)
}

/** A sculpted horse on the roof at a corner of the court, trampling a trophy. */
function horse(out: MeshBuilder, x: number, z: number, y: number, p: Pal): void {
  box(out, x, y, z, 0.9, 0.18, 0.9, p.lead, FIXED)
  box(out, x, y + 1.2, z, 0.35, 0.45, 1.1, p.trim, FIXED)
  box(out, x, y + 1.9, z - 1.0, 0.25, 0.55, 0.3, p.trim, FIXED)
  for (const s of [-1, 1]) for (const t of [-0.8, 0.8]) box(out, x + s * 0.22, y + 0.55, z + t, 0.08, 0.4, 0.08, p.trim, FIXED)
}

/** The clock pavilion at the head of the court, Napoleon in his niche, the gable of Saint-Louis's nave over it. */
function clockPavilion(out: MeshBuilder, p: Pal): void {
  const x0 = -14.6
  const x1 = 10.4
  const xm = (x0 + x1) / 2
  const z = -6.1
  range(out, x0, x1, z - 1.2, 1.3, p, { eaves: 21.5, bay: 5, storeys: [], faces: ['-z'], quoins: true })
  archOn(out, '-z', z - 1.2, xm, 0, 4.4, 7.2, p.dark, 0.08)                                          // the way into the church
  for (const t of [x0 + 2.2, x1 - 2.2]) {
    pairOn(out, '-z', z - 1.2, t, 0, 7.0, 0.4, p.trim, 1.3)
    pairOn(out, '-z', z - 1.2, t, 7.6, 14.0, 0.36, p.trim, 1.3)
  }
  archOn(out, '-z', z - 1.2, xm, 7.6, 2.6, 5.4, shade(p.stone, 0.7), 0.08)
  prism(out, xm, z - 1.7, 8.0, 10.6, 0.4, 6, p.bronze, FIXED, 0.33)                                 // Napoleon, in bronze
  box(out, xm, 10.9, z - 1.7, 0.22, 0.25, 0.22, p.bronze, FIXED)
  pedimentOn(out, '-z', z - 1.2, x0 - 0.4, x1 + 0.4, 21.5, 4.2, 0.6, p.trim)
  clockOn(out, '-z', z - 1.3, xm, 17.6, 1.4, p)
  for (const s of [-1, 1]) statue(out, xm + s * 11.5, z - 0.4, 21.5, 2.3, p.trim)
}

/** Saint-Louis-des-Invalides: the tall nave under its slate roof, the aisles, two round chapels at its south end. */
function church(out: MeshBuilder, p: Pal): void {
  range(out, -9.5, 5.9, 1.3, 66.5, p, { eaves: 25.8, bay: 5.5, win: 2.0, faces: ['-x', '+x'], storeys: [{ y: 16.4, h: 6.0, arched: true, sill: 0 }] })
  hipRoof(out, -9.5, 5.9, 1.3, 66.5, 25.8, 9.8, p.slate, 0.3)
  pedimentOn(out, '-z', 1.25, -9.5, 5.9, 25.8, 6.0, 0.2, p.stone)
  for (const [x0, x1, f] of [[-15.5, -9.5, '-x'], [5.9, 11.6, '+x']] as const) {
    range(out, x0, x1, 1.3, 64.0, p, { eaves: 13.5, bay: 5.5, win: 1.8, faces: [f], storeys: [{ y: 0, h: 7.0, arched: true, sill: 2.5 }] })
    hipRoof(out, x0, x1, 1.3, 64.0, 13.5, 1.6, p.slate, 0.2)
  }
  for (const x of [-14.0, 10.3]) {
    prism(out, x, 64.8, 0, 9.0, 4.5, 16, p.stone, FIXED)
    prism(out, x, 64.8, 9.0, 9.8, 4.8, 16, p.trim, FIXED)
    prism(out, x, 64.8, 9.8, 12.8, 4.4, 16, p.slate, FIXED, 2.2)
    prism(out, x, 64.8, 12.8, 14.6, 2.2, 16, p.slate, FIXED, 0.3)
  }
}
