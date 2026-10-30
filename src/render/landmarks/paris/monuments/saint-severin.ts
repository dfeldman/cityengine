import type { MeshBuilder } from '../../../buildings.ts'
import { box, prism } from '../../../models.ts'
import { beam, block, roof } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { balustrade } from '../palaces/common.ts'
import { FIXED, graded, type P2, ring, walls } from './common.ts'
import { pal, pinnacle, pointedOn, roseOn } from './churches.ts'

/*
 * SAINT-SÉVERIN (13th–16th c.), in the lanes of the Latin Quarter between the Rue Saint-Jacques and the Rue de la
 * Harpe: flamboyant Gothic, and from the street a crowd of GABLES — the double aisles and the chapels down the south
 * side each under its own little transverse roof, pinnacles and gargoyles between them, the west front's great
 * flamboyant window under its gable and balustrade — and over them the TOWER at the north-west corner (OSM's
 * 664169089 to 29.2, its slate spire 1465166134 to 45.2) with its belfry and the little lantern up the spire. The
 * east end is the famous double ambulatory, round under a ring of low roofs.
 *
 * In the city OSM's parts gave a fair massing but flat aisles and a blunt tower top (2026-10-29); the model replaces
 * the outline (way 19740659) and its parts. Frame: −z the west front on the Rue des Prêtres-Saint-Séverin (bearing
 * 290.3), +x south; design metres off OSM's footprint.
 */
const HX = 19.45
const HZ = 26.45

const PLAN: P2[] = ring([
  -12.5, -26.5, 16.8, -26.5, 19.0, -25.6, 19.4, 11.9, 18.0, 16.6, 14.8, 21.3, 9.3, 25.3, 2.4, 26.5, -4.7, 25.3, -9.8, 21.5,
  -13.9, 24.5, -17.3, 24.6, -19.3, 22.5, -19.4, 19.1, -16.9, -20.5, -13.5, -20.3, -13.4, -25.7,
])

export function saintSeverin(out: MeshBuilder, fit: Fit): void {
  graded(out, fit, HX, HZ, (q) => severin(q))
}

function severin(out: MeshBuilder): void {
  const p = pal('#d4c8ae', '#4d585e')
  const cx = 2.5
  // the double aisles and chapels to 10.5, their lead flat, and a row of little transverse gables along each side
  walls(out, PLAN, 0, 10.5, p.stone, p.lead)
  for (let z = -18.5; z < 12; z += 3.95) {
    roof(out, 8.3, 19.3, z - 1.9, z + 1.9, 10.5, 2.4, 0.01, 1.9, p.slate)
    roof(out, -16.6, -3.3, z - 1.9, z + 1.9, 10.5, 2.0, 0.01, 1.9, p.slate)
    pointedOn(out, '+x', 19.2, z, 2.5, 2.0, 6.0, p.glass)
    pointedOn(out, '-x', -16.7, z, 2.5, 2.0, 6.0, p.glass)
    // between the gables, the buttress pinnacles and a gargoyle
    for (const xb of [19.4, -16.9]) {
      pinnacle(out, xb, z + 1.97, 10.5, 4.2, 0.9, p.trim)
      beam(out, [xb, 10.0, z + 1.97], [xb + Math.sign(xb) * 1.3, 10.3, z + 1.97], 0.18, p.deep)
    }
  }
  // the nave and choir to 20.2, under one steep roof to 28.5; the clerestory
  block(out, cx - 5.6, cx + 5.6, -25.4, 15, 10.5, 20.2, p.stone)
  roof(out, cx - 6.0, cx + 6.0, -25.4, 15, 20.2, 8.3, 6.0, 0.01, p.slate)
  balustrade(out, cx - 5.6, cx + 5.6, -25.4, 15, 20.2, p, { sides: ['-x', '+x'], h: 0.7 })
  for (let z = -21; z < 14; z += 3.95) {
    for (const s of [-1, 1]) {
      pointedOn(out, s < 0 ? '-x' : '+x', cx + s * 5.6, z, 12.0, 2.2, 6.5, p.glass)
      beam(out, [cx + s * 10.5, 13.0, z + 1.97], [cx + s * 5.8, 18.0, z + 1.97], 0.28, p.stone)
      pinnacle(out, cx + s * 10.5, z + 1.97, 10.5, 6.0, 1.0, p.trim)
    }
  }
  // the chevet: the choir's polygonal end and the ring of the double ambulatory under its low roofs
  {
    const n = 7
    for (let i = 0; i < n; i++) {
      const a0 = -Math.PI / 2 + (i / n) * Math.PI
      const a1 = -Math.PI / 2 + ((i + 1) / n) * Math.PI
      const P = (a: number, r: number, y: number): [number, number, number] => [cx + Math.sin(a) * r, y, 15 + Math.cos(a) * r]
      const am = (a0 + a1) / 2
      out.quad([P(a0, 5.6, 10.5), P(a1, 5.6, 10.5), P(a1, 5.6, 20.2), P(a0, 5.6, 20.2)], [Math.sin(am), 0, Math.cos(am)], [[0, 0], [1, 0], [1, 1], [0, 1]], p.stone, FIXED)
      out.quad([P(a0, 6.0, 20.2), P(a1, 6.0, 20.2), P(a1, 0, 28.5), P(a0, 0, 28.5)], [Math.sin(am), 0.8, Math.cos(am)], [[0, 0], [1, 0], [1, 1], [0, 1]], p.slate, FIXED)
      // the clerestory window of the bay, flat on its face
      const ex = Math.cos(am) * 0.7
      const ez = -Math.sin(am) * 0.7
      const m = P(am, 5.62, 0)
      out.quad([[m[0] - ex, 12.0, m[2] - ez], [m[0] + ex, 12.0, m[2] + ez], [m[0] + ex, 18.0, m[2] + ez], [m[0] - ex, 18.0, m[2] - ez]],
        [Math.sin(am), 0, Math.cos(am)], [[0, 0], [1, 0], [1, 1], [0, 1]], p.glass, FIXED)
    }
  }
  // THE WEST FRONT: the nave's gable with its great flamboyant window and rose, the portal, the balustrade
  const zf = -26.5
  block(out, cx - 5.6, cx + 5.6, zf, -25.3, 0, 20.2, p.stone)
  pointedOn(out, '-z', zf, cx, 10.6, 6.2, 8.8, p.glass)
  for (let k = -2; k <= 2; k++) box(out, cx + k * 1.05, 13.2, zf - 0.12, 0.07, 2.6, 0.05, p.trim, FIXED)
  pointedOn(out, '-z', zf, cx, 0.4, 3.0, 6.4, p.dark)
  out.quad([[cx - 4.0, 0.4 + 6.4, zf - 0.1], [cx + 4.0, 6.8, zf - 0.1], [cx, 9.8, zf - 0.1], [cx, 9.8, zf - 0.1]], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], p.trim, FIXED)
  balustrade(out, cx - 5.8, cx + 5.8, zf, zf + 1.2, 20.2, p, { sides: ['-z'], h: 0.9 })
  out.quad([[cx - 5.6, 20.2, zf + 0.6], [cx + 5.6, 20.2, zf + 0.6], [cx, 28.5, zf + 0.6], [cx, 28.5, zf + 0.6]], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], p.stone, FIXED)
  roseOn(out, '-z', zf + 0.6, cx, 23.6, 1.3, p.glass, p.trim)
  prism(out, cx, zf + 0.8, 28.5, 30.5, 0.25, 6, p.trim, FIXED, 0.1)
  for (const s of [-1, 1]) pinnacle(out, cx + s * 5.9, zf + 0.6, 17.0, 8.0, 1.1, p.trim)
  // the south aisle's west end: a lower gable with its window
  out.quad([[8.3, 10.5, zf - 0.02], [16.8, 10.5, zf - 0.02], [12.55, 14.5, zf - 0.02], [12.55, 14.5, zf - 0.02]], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], p.stone, FIXED)
  pointedOn(out, '-z', zf, 12.55, 2.5, 3.2, 7.0, p.glass)

  // THE TOWER at the north-west corner: 6.5 m square to 29.2, its belfry's tall openings, the balustrade and corner
  // pinnacles, the slate spire to 45.2 with the little open lantern partway up
  const tx = -9.15
  const tz = -22.3
  block(out, tx - 3.25, tx + 3.25, tz - 3.25, tz + 3.1, 0, 29.2, p.stone)
  for (const [bx, bz] of [[-1, -1], [1, -1], [-1, 1]]) block(out, tx + bx * 3.25 - 0.5, tx + bx * 3.25 + 0.5, tz + bz * 3.2 - 0.5, tz + bz * 3.2 + 0.5, 0, 27.5, p.stone)
  pointedOn(out, '-z', tz - 3.25, tx, 0.4, 2.0, 4.6, p.dark)
  for (const f of ['-z', '-x', '+z', '+x'] as const) {
    const plane = f === '-z' ? tz - 3.25 : f === '+z' ? tz + 3.1 : f === '-x' ? tx - 3.25 : tx + 3.25
    const t = f === '-z' || f === '+z' ? tx : tz
    pointedOn(out, f, plane, t, 21.0, 2.4, 6.6, p.dark)
    if (f === '-z' || f === '-x') pointedOn(out, f, plane, t, 12.0, 1.2, 4.0, p.glass)
  }
  balustrade(out, tx - 3.4, tx + 3.4, tz - 3.4, tz + 3.25, 29.2, p, { h: 0.8 })
  for (const [bx, bz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) pinnacle(out, tx + bx * 3.1, tz + bz * 3.0, 29.2, 3.6, 0.8, p.trim)
  prism(out, tx, tz, 29.2, 39.0, 3.1, 8, p.slate, FIXED, 1.0)
  prism(out, tx, tz, 39.0, 41.0, 0.95, 8, p.lead, FIXED)
  for (let i = 0; i < 8; i++) {
    const a = ((i + 0.5) / 8) * Math.PI * 2
    box(out, tx + Math.sin(a) * 0.97, 40.0, tz + Math.cos(a) * 0.97, 0.18, 0.6, 0.18, p.dark, FIXED)
  }
  prism(out, tx, tz, 41.0, 45.2, 1.0, 8, p.slate, FIXED, 0.05)
  box(out, tx, 45.9, tz, 0.05, 0.7, 0.05, p.dark, FIXED)
}
