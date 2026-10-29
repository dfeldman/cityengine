import type { MeshBuilder } from '../../../buildings.ts'
import { box, prism } from '../../../models.ts'
import { block, dome } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import {
  balustrade, clockOn, dormers, fitted, hipRoof, mansard, pairOn, palette, pavilionRoof, pedimentOn, range,
  segmentOn, squareDome, statue, terrace, type Pal, type RangeOpts,
} from './common.ts'

const FIXED = 0
/** the design footprint: OSM relation 975955's box, turned 2° to the palace's own axes */
const HX = 59.3
const HZ = 74.9

/**
 * The Palais du Luxembourg, the Senate (Salomon de Brosse for Marie de Médicis, 1615–31; the garden front doubled
 * southward by Alphonse de Gisors, 1836–41). What a rider sees of it:
 *
 * - from the GARDEN (south, local −z): the long front between two great corner pavilions with their tall, steep,
 *   flat-topped slate roofs; Gisors' lower gallery between them, and in its middle the frontispiece with the clock
 *   under the square curved DOME and its lantern; behind, the second pair of pavilions and the drum of the Senate's
 *   hemicycle;
 * - from the RUE DE VAUGIRARD (north, local +z): the low rusticated screen with its balustrade and the domed
 *   GATEHOUSE in the middle — the octagonal drum ringed by columns, the dome and its lantern — between two tall
 *   pavilions with steep hipped roofs and their chimneys;
 * - everywhere, the Florentine banded RUSTICATION Marie de Médicis asked for after the Pitti, in warm limestone.
 *
 * The plan is OSM's (relation 975955 and its 3D building:parts, measured 2026-10-29): six pavilions down the two
 * sides of the main body (x −30.5…−10.2 and 38.5…59), the court of honour between the side wings, the gallery along
 * Vaugirard, the extension west toward the Petit Luxembourg.
 */
export function luxembourgPalace(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const p = palette('#e2d1ad', '#4c5357')
  const tall: RangeOpts = {
    eaves: 23.6, bay: 3.6, win: 1.6, rustic: 0.9, quoins: true, pediments: true,
    storeys: [{ y: 0, h: 4.2, arched: true, sill: 1.2 }, { y: 8.3, h: 4.6 }, { y: 15.9, h: 4.2 }],
  }
  // ---- the six pavilions down the sides of the main body, and their steep roofs with the little pyramid caps
  const pav = (x0: number, x1: number, z0: number, z1: number): void => {
    range(out, x0, x1, z0, z1, p, tall)
    pavilionRoof(out, x0, x1, z0, z1, 23.6, 7.6, p, { top: 7.4, cap: 2.2 })
    dormers(out, '-z', z0, x0 + 3, x1 - 3, 23.6, 6, p, { round: true, set: 1.2 })
    dormers(out, '+z', z1, x0 + 3, x1 - 3, 23.6, 6, p, { round: true, set: 1.2 })
  }
  for (const [z0, z1] of [[-74.9, -53.8], [-43.5, -23.0], [-13.6, 6.8]]) {
    pav(-30.6, -10.2, z0, z1)
    pav(38.5, 59.0, z0, z1)
  }
  // the links between them, a little back from their outer faces
  for (const [x0, x1] of [[-26.1, -10.2], [38.5, 54.3]]) {
    range(out, x0, x1, -53.8, -43.5, p, { ...tall, eaves: 23.1, quoins: false, pediments: false, faces: x0 < 0 ? ['-x'] : ['+x'] })
    hipRoof(out, x0, x1, -53.8, -43.5, 23.1, 3.7, p.slate)
  }
  // the old corps de logis across the court's head: two storeys and the mansard, its frontispiece with the clock
  range(out, -26.0, 54.4, -25.3, -11.5, p, { ...tall, eaves: 20.1, quoins: false, faces: ['+z'], storeys: tall.storeys.slice(0, 2) })
  mansard(out, -26.0, 54.4, -25.3, -11.5, 20.1, 4.4, 2.2, p.slate)
  dormers(out, '+z', -11.5, -10, 38.5, 20.1, 4.5, p, { set: 1.1 })
  block(out, 7.6, 21.2, -12.4, -11.4, 0, 22.4, p.trim)
  pedimentOn(out, '+z', -11.4, 7.4, 21.4, 22.4, 3.0, 0.6, p.trim)
  clockOn(out, '+z', -11.4, 14.4, 19.6, 1.3, p)
  for (const t of [8.4, 20.4]) pairOn(out, '+z', -11.4, t, 0, 22.2, 0.42, p.trim, 1.2)
  // between the court and the garden front: the Senate's hemicycle (Gisors), its half-drum and glazed cone over the
  // block that fills the middle of the palace
  block(out, -10.2, 38.5, -53.8, -25.3, 0, 21.4, p.deep)
  const hc = { x: 14.4, z: -33.2 }
  const R = 15
  const seg = 10
  for (let i = 0; i < seg; i++) {
    const a0 = Math.PI + (i / seg) * Math.PI
    const a1 = Math.PI + ((i + 1) / seg) * Math.PI
    const P = (a: number, r: number, y: number): [number, number, number] => [hc.x + Math.cos(a) * r, y, hc.z + Math.sin(a) * r]
    const am = (a0 + a1) / 2
    out.quad([P(a0, R, 21.4), P(a1, R, 21.4), P(a1, R, 23.6), P(a0, R, 23.6)], [Math.cos(am), 0, Math.sin(am)], [[0, 0], [1, 0], [1, 1], [0, 1]], p.stone, FIXED)
    out.quad([P(a0, R + 0.3, 23.6), P(a1, R + 0.3, 23.6), P(a1, 3.4, 27.2), P(a0, 3.4, 27.2)], [Math.cos(am) * 0.5, 0.86, Math.sin(am) * 0.5], [[0, 0], [1, 0], [1, 1], [0, 1]], p.slate, FIXED)
  }
  block(out, hc.x - R, hc.x + R, hc.z - 0.1, hc.z + 1.5, 21.4, 23.6, p.stone)
  prism(out, hc.x, hc.z - 1.5, 27.0, 28.2, 3.4, 12, [0.42, 0.52, 0.56], FIXED, 2.6)                     // the glazed lantern

  // ---- the GARDEN FRONT: Gisors' two-storey gallery between the corner pavilions, a terrace over it
  range(out, -10.2, 38.5, -62.7, -54.6, p, {
    eaves: 16.4, bay: 4.0, win: 1.9, rustic: 0.9, faces: ['-z'], pediments: true,
    storeys: [{ y: 0, h: 4.6, arched: true, sill: 1.0 }, { y: 7.8, h: 4.8 }],
  })
  terrace(out, -10.2, 38.5, -62.7, -54.6, 16.4, p, { sides: ['-z'] })
  for (let i = 0; i < 6; i++) statue(out, -6 + i * 8.8 + (i >= 3 ? 2.6 : 0), -62.4, 17.5, 2.0, p.trim)
  // the old front's attic, standing up behind the terrace
  range(out, -10.2, 38.5, -54.6, -53.8, p, { eaves: 22.6, bay: 4.0, faces: ['-z'], storeys: [{ y: 16.4, h: 3.2, sill: 1.2 }] })
  // the frontispiece: three storeys, paired columns on each, the clock in a curved pediment, the square dome over it
  range(out, 8.3, 20.6, -66.8, -54.6, p, {
    eaves: 21.1, bay: 4.1, win: 1.8, rustic: 0.9, faces: ['-z', '-x', '+x'],
    storeys: [{ y: 0, h: 5.0, arched: true, sill: 0.6 }, { y: 7.8, h: 4.8 }, { y: 14.3, h: 3.6 }],
  })
  for (const t of [8.9, 20.0]) {
    pairOn(out, '-z', -66.8, t, 0.4, 7.8, 0.45, p.trim, 1.0)
    pairOn(out, '-z', -66.8, t, 7.8, 14.3, 0.42, p.trim, 1.0)
    pairOn(out, '-z', -66.8, t, 14.3, 20.4, 0.38, p.trim, 1.0)
  }
  segmentOn(out, '-z', -66.8, 14.45, 21.1, 12.6, 2.6, p.trim, 0.25)
  clockOn(out, '-z', -66.95, 14.45, 22.2, 0.85, p)
  block(out, 8.6, 20.3, -64.6, -55.0, 21.1, 22.6, p.stone)
  squareDome(out, 14.45, -59.8, 22.6, 5.9, 7.2, p.slate, 7, 4.8)
  // the dome's ribs, lead, down its four hips
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    for (let k = 0; k < 6; k++) {
      const a0 = (k / 6) * Math.PI / 2
      const a1 = ((k + 1) / 6) * Math.PI / 2
      box(out, 14.45 + sx * 5.9 * (Math.cos(a0) + Math.cos(a1)) / 2, 22.6 + 7.2 * (Math.sin(a0) + Math.sin(a1)) / 2,
        -59.8 + sz * 4.8 * (Math.cos(a0) + Math.cos(a1)) / 2, 0.16, 7.2 * (Math.sin(a1) - Math.sin(a0)) / 2 + 0.1, 0.16, p.lead, FIXED)
    }
  }
  prism(out, 14.45, -59.8, 29.6, 31.8, 1.2, 8, p.trim, FIXED)
  prism(out, 14.45, -59.8, 31.8, 33.4, 1.35, 8, p.slate, FIXED, 0.15)
  box(out, 14.45, 34.1, -59.8, 0.08, 0.7, 0.08, p.gold, FIXED)

  // ---- the side wings down the court, two storeys, arcaded on the court side, gabled
  for (const [x0, x1] of [[-25.1, -14.8], [44.0, 54.2]]) {
    const inner = x0 < 0 ? '+x' : '-x'
    range(out, x0, x1, 6.8, 59.4, p, {
      eaves: 16.0, bay: 3.8, rustic: 0.9, faces: [x0 < 0 ? '-x' : '+x', inner],
      storeys: [{ y: 0, h: 4.4, arched: true, sill: 0.4 }, { y: 7.6, h: 4.4 }],
    })
    hipRoof(out, x0, x1, 6.8, 59.4, 16.0, 6.0, p.slate)
    dormers(out, inner, inner === '+x' ? x1 : x0, 9, 57, 16.0, 7.6, p, { set: 1.0 })
  }
  // ---- the Vaugirard pavilions, with their tall hipped roofs and stacks
  for (const [x0, x1] of [[-30.2, -14.7], [44.0, 59.3]]) {
    range(out, x0, x1, 59.4, 74.9, p, { ...tall, eaves: 21.4, storeys: tall.storeys })
    hipRoof(out, x0, x1, 59.4, 74.9, 21.4, 9.4, p.slate, 0.3)
    dormers(out, '+z', 74.9, x0 + 2, x1 - 2, 21.4, 5.5, p, { round: true, set: 1.4 })
    const cx = x0 < 0 ? -23.3 : 54.9
    block(out, cx - 1.9, cx + 1.9, 69.5, 72.1, 26, 31.6, p.stone)
    block(out, cx - 2.1, cx + 2.1, 69.3, 72.3, 31.6, 32.0, p.trim)
  }
  // ---- the screen along the street: rusticated Tuscan pilasters, arched bays, the balustrade; open arcade on the court
  const scr = (x0: number, x1: number): void => {
    range(out, x0, x1, 58.0, 67.5, p, {
      eaves: 7.7, bay: 3.5, win: 2.0, rustic: 0.75, faces: ['+z', '-z'], courses: false, frames: false,
      storeys: [{ y: 0, h: 5.4, arched: true, sill: 0.35 }],
    })
    for (let x = x0 + 1.7; x < x1 - 1; x += 3.5) block(out, x - 0.45, x + 0.45, 67.5, 67.95, 0, 7.5, p.trim)
    terrace(out, x0, x1, 58.0, 67.5, 7.7, p, { sides: ['+z', '-z'] })
  }
  scr(-14.7, 8.4)
  scr(21.0, 44.0)
  // the GATEHOUSE: a rusticated block with the carriage arch, paired columns at its corners, the balustrade
  range(out, 8.4, 21.0, 56.7, 70.4, p, {
    eaves: 15.6, bay: 12, win: 4.4, rustic: 0.75, faces: ['+z', '-z'], frames: false, courses: true,
    storeys: [{ y: 0, h: 7.4, arched: true, sill: 0 }, { y: 9.0, h: 3.6, sill: 0.8 }],
  })
  for (const t of [9.4, 20.0]) for (const f of ['+z', '-z'] as const) {
    pairOn(out, f, f === '+z' ? 70.4 : 56.7, t, 0, 8.6, 0.5, p.trim, 1.1)
    pairOn(out, f, f === '+z' ? 70.4 : 56.7, t, 8.6, 15.1, 0.45, p.trim, 1.1)
  }
  balustrade(out, 8.4, 21.0, 56.7, 70.4, 15.6, p, { h: 1.0 })
  for (const [x, z] of [[9.0, 57.2], [20.4, 57.2], [9.0, 69.9], [20.4, 69.9]]) statue(out, x, z, 16.6, 2.0, p.trim)
  // the octagonal drum ringed by columns, the dome, the lantern
  const gx = 14.6
  const gz = 63.6
  prism(out, gx, gz, 15.6, 21.5, 4.0, 8, p.stone, FIXED)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8
    prism(out, gx + Math.sin(a) * 4.45, gz + Math.cos(a) * 4.45, 16.0, 20.9, 0.3, 8, p.trim, FIXED)
    const w = a + Math.PI / 8
    box(out, gx + Math.sin(w) * 3.95, 18.4, gz + Math.cos(w) * 3.95, 0.55, 1.5, 0.55, p.glass, FIXED)
  }
  prism(out, gx, gz, 20.9, 21.6, 4.8, 8, p.trim, FIXED)
  dome(out, gx, gz, 21.6, 4.3, 4.1, p.slate, 16, p.lead)
  prism(out, gx, gz, 25.4, 27.6, 1.05, 8, p.trim, FIXED)
  prism(out, gx, gz, 27.6, 28.8, 1.25, 8, p.slate, FIXED, 0.12)
  box(out, gx, 29.5, gz, 0.08, 0.7, 0.08, p.gold, FIXED)

  // ---- toward the Petit Luxembourg: the low range along Vaugirard at the north-west
  range(out, -59.3, -30.2, 59.6, 71.8, p, {
    eaves: 10.5, bay: 3.6, rustic: 0.9, faces: ['+z', '-z', '-x'],
    storeys: [{ y: 0, h: 3.4, arched: true, sill: 0.9 }, { y: 5.6, h: 3.0 }],
  })
  hipRoof(out, -59.3, -30.2, 59.6, 71.8, 10.5, 4.2, p.slate)

  // the tricolour over the gatehouse, as the Senate flies it
  flag(out, gx, 32.6, gz, p)
}

function flag(out: MeshBuilder, x: number, y: number, z: number, p: Pal): void {
  box(out, x, y - 1.6, z, 0.05, 1.6, 0.05, p.lead, FIXED)
  box(out, x + 0.3, y - 0.6, z, 0.3, 0.55, 0.02, [0.12, 0.22, 0.55], FIXED)
  box(out, x + 0.9, y - 0.6, z, 0.3, 0.55, 0.02, [0.95, 0.95, 0.95], FIXED)
  box(out, x + 1.5, y - 0.6, z, 0.3, 0.55, 0.02, [0.78, 0.13, 0.16], FIXED)
}
