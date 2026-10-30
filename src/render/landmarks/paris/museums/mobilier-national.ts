import type { MeshBuilder } from '../../../buildings.ts'
import { block, classicalColumn, shade, type Rgb } from '../../kit.ts'
import { sign } from '../../parts.ts'
import type { Fit } from '../../fit.ts'
import { extrude, fitted, palette, pts, rectOn, slabOn } from '../palaces/common.ts'
import { bands } from './civic.ts'
import { archBand, piers, railX, ribbons } from './modern.ts'

const FIXED = 0
/** the design footprint: OSM way 78406776's box (local −z faces bearing 157.5, the court's mouth on the Rue Berbier-du-Mets) */
const HX = 38.2
const HZ = 36.9

/** OSM's outline in this frame (osmium, 2026-10-30): the court is open to −z through a neck between the two front wings */
const OUTER = pts([-38.2, 22.5, -37.9, -19.3, -29.1, -19.2, -29.1, -25.2, -23.1, -25.1, -23.3, -36.8, -11.4, -36.9, -11.1, -18.8, -17.4, -18.6, -17.8, 16.3, 11.4, 16.3, 11.3, -18.6,
  5.5, -18.6, 5.7, -36.8, 17.7, -36.6, 17.5, -25.1, 23.3, -25.1, 23.3, -19.2, 32.4, -19.1, 32.3, 21.8, 38.2, 21.8, 38.2, 36.9, -23.8, 36.9, -23.7, 31, -29.2, 31, -29.5, 27.6, -32.5, 27.7, -32.5, 22.4])

/**
 * Le Mobilier National (Auguste Perret, 1934–36), by the Gobelins: the state's furniture store, and one of the few
 * concrete buildings in Paris made to be looked at as stone. Everything is Perret's ochre concrete, bush-hammered, its
 * frame shown and its panels set in the frame:
 *
 * - from the RUE BERBIER-DU-METS (local −z): the signature, the thin concrete ARCH thrown across the mouth of the court
 *   from wing to wing on two pairs of slim columns, LE MOBILIER NATIONAL cut in it, the iron gates under it, and the court
 *   going back to the main block behind;
 * - the two wings ending on the street and the block round the court: tall plain windows, white blinds, thin iron rails,
 *   a shown frame, and over them a storey of big blank square panels leaning back to a thin roof rail.
 *
 * Plan from OSM's way 78406776, its 25.7 m from APUR by way of civic.json. The arch, the wings, the panels from the Commons
 * photographs "Siège du Mobilier national - rue Berbier-du-Mets - 2024 (01–03)".
 */
export function mobilierNational(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
  sign(out, { type: 'flat', text: 'LE MOBILIER NATIONAL', h: 0.44, face: 'roman', colour: [0.3, 0.22, 0.1], tracking: 0.14, lit: 'none', w: 10 },
    { x: -2.85 * fit.hx / HX, y: 12.1, z: -37.15 * fit.hz / HZ, heading: Math.PI })
}

function draw(out: MeshBuilder): void {
  const p = palette('#c2a266', '#b39453')
  const frame = shade(p.stone, 1.08)
  const E = 19
  extrude(out, [OUTER], { ...p, trim: frame }, { eaves: E, bay: 4.2, win: 2.3, rise: 6, inset: 2.4, dormers: false, frames: false,
    storeys: [{ y: 0, h: 3.2, sill: 1 }, { y: 5.2, h: 3.3, sill: 0.7 }, { y: 9.6, h: 3.3, sill: 0.7 }, { y: 14, h: 2.8, sill: 0.8 }] })
  // the frame: its posts on every wall, a beam at each floor
  piers(out, [OUTER], 0, E - 0.3, 4.2, 0.46, frame, 0.14, 4)
  ribbons(out, [OUTER], [[5, 5.28], [9.4, 9.68], [13.8, 14.08]], frame, 0.14, 0, 4)
  bands(out, OUTER, [0], 0.7, 0.18, shade(p.stone, 0.78), 4)
  // the blinds, half drawn, and the rails, on the front wings' ends, where a rider stands close to them
  for (const [a, b] of [[-23, -11.6], [5.9, 17.5]] as const) {
    const n = 3
    for (let i = 0; i < n; i++) {
      const x = a + (b - a) * ((i + 0.5) / n)
      for (const y of [1.8, 6.4, 10.8]) {
        rectOn(out, '-z', -36.9, x - 1.25, x + 1.25, y - 0.2, y + 3.3, frame, 0.05)
        rectOn(out, '-z', -36.9, x - 1.05, x + 1.05, y, y + 3.1, p.glass, 0.09)
        rectOn(out, '-z', -36.9, x - 1.05, x + 1.05, y + 1.8, y + 3.1, [0.9, 0.88, 0.82], 0.11)
        railX(out, x - 1.05, x + 1.05, -37.08, y, 0.9, 0.25, p.dark)
      }
    }
  }
  // the attic's big panels leaning back, on the long fronts of the court and the wings
  const panels = (x0: number, x1: number, z: number, s: number, n: number): void => {
    const w = (x1 - x0) / n
    for (let i = 0; i < n; i++) {
      const a = x0 + w * i + 0.25
      const b = x0 + w * (i + 1) - 0.25
      out.quad([[a, E + 0.5, z + s * 0.25], [b, E + 0.5, z + s * 0.25], [b, E + 5.4, z + s * 2.2], [a, E + 5.4, z + s * 2.2]], [0, 0.4, -s], [[0, 0], [1, 0], [1, 1], [0, 1]], shade(p.stone, 0.88), FIXED)
    }
  }
  panels(-17.5, 11.2, 16.3, -1, 7)
  panels(-23, -11.5, -36.85, 1, 3)
  panels(5.8, 17.5, -36.85, 1, 3)
  // and the thin iron rail round the roof
  railX(out, -17.5, 11.2, 18.2, E + 6, 1, 0.9, p.dark)
  railX(out, -22, 36, 34.5, E + 6, 1, 0.9, p.dark)

  // ---- the arch across the court's mouth: the wings' ends, the two pairs of columns, the thin concrete band, the gates
  const z0 = -37.5
  const z1 = -36.3
  const y = 10.4
  const tone = shade(p.stone, 1.04)
  // (the arch itself, from wing to wing: its soffit rising 2 m to the crown, its depth 1.4 m)
  archBand(out, -11.4, 5.7, z0, z1, y, 1.4, 1.5, tone)
  slabOn(out, '-z', z0, -11.4, -9.8, 0, y + 0.6, 0, tone, -1.2)
  slabOn(out, '-z', z0, 4.1, 5.7, 0, y + 0.6, 0, tone, -1.2)
  for (const x of [-7.7, -6.3, 0.6, 2]) classicalColumn(out, x, -36.9, 0.7, y + 0.9, 0.46, tone, { order: 'doric', tier: 'mid', tag: FIXED })
  for (const x of [-7, 1.3]) block(out, x - 1.4, x + 1.4, -37.6, -36.2, 0, 0.75, shade(p.stone, 0.72))
  gate(out, -5.4, -0.3, -36.9, 3.2, p.dark)
  gate(out, -9.8, -8.2, -36.9, 3, p.dark)
  gate(out, 2.8, 4.1, -36.9, 3, p.dark)
  // the court's floor: the sunk ramp of the photographs, dark setts
  block(out, -17.4, 11.2, -36.8, 16.2, 0, 0.12, [0.33, 0.31, 0.29])
  // the flag on the arch
  block(out, -2.91, -2.79, -37, -36.88, y + 2.8, y + 11, p.lead)
  rectOn(out, '-x', -2.85, -36.94, -35.7, y + 9.1, y + 10.8, [0.13, 0.24, 0.55], 0.01)
}

/** An iron gate along x at z: its bars and two rails. */
function gate(out: MeshBuilder, x0: number, x1: number, z: number, h: number, c: Rgb): void {
  railX(out, x0, x1, z, 0.1, h, 0.22, c)
  block(out, x0, x1, z - 0.04, z + 0.04, h * 0.45, h * 0.45 + 0.08, c)
}
