import type { MeshBuilder } from '../../../buildings.ts'
import { box } from '../../../models.ts'
import { beam, block, roof } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { archOn, rectOn } from '../palaces/common.ts'
import { archAlong, FIXED, graded, type P2, ring, walls } from './common.ts'
import { pal, roseOn } from './churches.ts'

/*
 * THE GRANDE SYNAGOGUE DE LA VICTOIRE (Alfred-Philibert Aldrophe, 1867–74), the great synagogue of Paris, on the Rue
 * de la Victoire: a Romanesque front with Byzantine trimmings whose CENTRAL BAY rises to 36 m (Wikipedia) and ends in
 * a great ROUND ARCH carrying the inscription from Genesis — the rose high in it, a gallery of little arches across,
 * three tall arched windows, the three portals under the porch; the side bays lower, each with its rose over twin
 * windows; behind, the nave of 28 m under its roof.
 *
 * OSM has the outline only (way 69363730, no parts; the city drew a 28 m flat block, 2026-10-29). Frame: −z the front
 * toward the Rue de la Victoire (bearing 181), its bays on x = −6.75 ± 14.65; the east range behind it from OSM's ring.
 */
const HX = 21.4
const HZ = 30.75

const PLAN: P2[] = ring([-21.4, -30.2, 7.9, -30.7, 7.7, -15.9, 20.9, -15.7, 21.1, 5.0, 11.7, 4.8, 11.6, 26.7, 21.4, 26.8,
  21.4, 30.7, -21.4, 30.5])

export function synagogueVictoire(out: MeshBuilder, fit: Fit): void {
  graded(out, fit, HX, HZ, (q) => victoire(q))
}

function victoire(out: MeshBuilder): void {
  const p = pal('#d6ccb8', '#525b61')
  const cx = -6.75
  const zf = -30.8
  // the ranges round the plan to 18 (the offices and the east wing), lidded
  walls(out, PLAN, 0, 18, p.stone, p.lead)
  // the nave behind the front: walls to 26, the roof to 33, a row of arched windows down each side
  block(out, cx - 12.5, cx + 12.5, -27, 28, 18, 26, p.stone)
  roof(out, cx - 12.9, cx + 12.9, -27, 28.2, 26, 7.0, 12.9, 0.01, p.slate)
  for (let z = -22; z < 27; z += 4.6) {
    for (const s of [-1, 1]) archOn(out, s < 0 ? '-x' : '+x', cx + s * 12.5, z, 19.0, 1.8, 5.0, p.glass)
  }
  // THE FRONT. The side bays to 26: the portal, the twin windows, the rose over them, the cornice of little arches
  block(out, cx - 14.65, cx + 14.65, zf, -27, 0, 26.0, p.stone)
  for (const s of [-1, 1]) {
    const bx = cx + s * 10.4
    archOn(out, '-z', zf, bx, 1.0, 2.0, 4.8, p.dark)
    roseOn(out, '-z', zf, bx, 9.0, 1.0, p.glass, p.trim)
    for (const d of [-0.8, 0.8]) archOn(out, '-z', zf, bx + d, 12.5, 1.2, 4.6, p.glass)
    roseOn(out, '-z', zf, bx, 19.6, 1.5, p.glass, p.trim)
    archOn(out, '-z', zf, bx, 11.8, 4.0, 10.6, p.deep, 0.04)
  }
  block(out, cx - 14.9, cx + 14.9, zf - 0.4, zf + 0.3, 24.0, 26.0, p.trim)
  // the central bay: a frontispiece 14 m wide, a little proud, to the springing of the great arch at 29
  const z0 = zf - 0.8
  block(out, cx - 7.0, cx + 7.0, z0, zf, 0, 29.0, p.stone)
  // the porch's three portals, a cornice over them
  for (const d of [-3.6, 0, 3.6]) archOn(out, '-z', z0, cx + d, 0.6, 2.8, 7.4, p.dark)
  block(out, cx - 7.2, cx + 7.2, z0 - 0.5, z0, 8.6, 9.4, p.trim)
  // three tall arched windows with their roses, the gallery of little arches across
  for (const d of [-3.8, 0, 3.8]) {
    archOn(out, '-z', z0, cx + d, 11.0, 2.4, 6.0, p.glass)
    roseOn(out, '-z', z0, cx + d, 14.9, 0.75, p.glass, p.trim)
  }
  block(out, cx - 7.2, cx + 7.2, z0 - 0.4, z0, 17.4, 18.0, p.trim)
  for (let k = 0; k < 11; k++) archOn(out, '-z', z0, cx - 6.0 + k * 1.2, 18.2, 0.8, 1.7, p.dark)
  block(out, cx - 7.2, cx + 7.2, z0 - 0.4, z0, 20.0, 20.6, p.trim)
  // the great arch: the half-round gable over the bay from 29 to 36, the inscription band round it, the rose in it
  const n = 12
  const r = 7.0
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI
    const a1 = ((i + 1) / n) * Math.PI
    const P = (a: number, rr: number, d: number): [number, number, number] => [cx + Math.cos(a) * rr, 29.0 + Math.sin(a) * rr, z0 - d]
    out.quad([P(a0, 0, 0), P(a0, r, 0), P(a1, r, 0), P(a1, 0, 0)], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], p.stone, FIXED)
    // the band, a solid moulding round the arch's edge
    beam(out, [cx + Math.cos(a0) * (r - 0.35), 29.0 + Math.sin(a0) * (r - 0.35), z0 - 0.1], [cx + Math.cos(a1) * (r - 0.35), 29.0 + Math.sin(a1) * (r - 0.35), z0 - 0.1], 0.42, p.trim)
  }
  // the band's inscription: a darker strip inside the moulding
  archAlong(out, cx, z0 - 0.06, -1, 0, 0, -1, 20.8, 12.0, 14.0, p.deep)
  archAlong(out, cx, z0 - 0.08, -1, 0, 0, -1, 21.4, 10.8, 13.2, p.stone)
  roseOn(out, '-z', z0 - 0.1, cx, 27.0, 3.0, p.glass, p.trim)
  rectOn(out, '-z', z0, cx - 7.0, cx + 7.0, 0, 0.6, p.trim, 0.1)
  // the slim turrets flanking the bay, their caps
  for (const s of [-1, 1]) {
    const x = cx + s * 7.25
    block(out, x - 0.6, x + 0.6, z0 - 0.4, z0 + 0.8, 0, 31.5, p.stone)
    box(out, x, 32.2, z0 + 0.2, 0.5, 0.7, 0.5, p.trim, FIXED)
  }
}
