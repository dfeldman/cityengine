import type { MeshBuilder } from '../../../buildings.ts'
import { offsetRing, edgeAt } from '../../parts.ts'
import { capPolygonWithHoles } from '../../../buildings.ts'
import { block, shade, type Rgb } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { fitted, palette, pts, rectOn } from '../palaces/common.ts'
import { hull, piers, ribbons, wound } from './modern.ts'

const FIXED = 0
/** the design footprint: OSM relation 946121's box (local −z faces bearing 202, its gardens toward the Boulevard de Port-Royal) */
const HX = 48.3
const HZ = 70

/** OSM's outline and its central court in this frame (osmium, 2026-10-30): the star of long wards off a middle */
const OUTER = pts([-47.9, -58.9, -30.2, -70, -19.1, -52, -9.6, -36.6, -2.7, -42.6, 6.2, -33.7, 2.7, -27.5, 15.6, -19, 34.1, -53.6, 45.6, -47.5,
  35, -28.1, 32.6, -18.8, 32.4, -10.5, 32.8, 4.5, 34.6, 12.6, 48.3, 35.8, 37.5, 42.6, 16.3, 8.6, 1.8, 17.8, -5.6, 25.6, -29.9, 70, -48.3, 60.4, -28.8, 24.4, -24.7, 7.1, -25.8, -15.7, -32.1, -30.4])
const COURT = pts([-10.4, -12.9, -9.7, 3.9, -4.7, 6.6, 9.6, -2.2, 9.7, -8.3, -5.4, -16])

const WHITE: Rgb = [0.87, 0.86, 0.82]
const RIBBON: Rgb = [0.21, 0.24, 0.27]
const SPANDREL: Rgb = [0.74, 0.73, 0.69]

/**
 * L'Hôpital du Val-de-Grâce: not Mansart's dome (the church and its dome have their own entry, Église du Val-de-Grâce) but the
 * military hospital's new block of the 1970s (shut in 2016) in the abbey's old gardens, which the dome stands in front of from
 * the south and east. A long star of pale concrete wards:
 *
 * - every floor a deep white band and a dark ribbon of windows behind thin fins, six of them;
 * - a set-back top floor under a slate skirt.
 *
 * Plan from OSM's relation 946121 and its parts (6 and 7 levels, two pieces of one). Bands and top from the Commons photograph
 * "Hôpital militaire Val-de-Grâce, 74 boulevard de Port-Royal"; the date from memory. The white gatehouse on the boulevard in
 * that photograph is not on OSM, and is not drawn.
 */
export function valDeGraceHopital(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const p = palette('#dad8d0', '#4f565b')
  const E = 23
  const T = 26.6
  const rings = [OUTER, COURT]
  hull(out, rings, 0, E, WHITE, shade(p.slate, 0.9))
  const glass: [number, number][] = []
  const band: [number, number][] = []
  for (let y = 4; y < E - 1; y += 3.8) {
    glass.push([y + 1, y + 3.1])
    band.push([y + 3.1, y + 3.8])
  }
  ribbons(out, rings, glass, RIBBON, 0.06, 0.5, 2.5)
  ribbons(out, rings, band, SPANDREL, 0.1, 0, 2.5)
  piers(out, [OUTER], 5, E - 0.6, 3.6, 0.32, WHITE, 0.14, 6)
  ribbons(out, rings, [[E - 0.7, E]], WHITE, 0.24, 0, 2.5)
  ribbons(out, [OUTER], [[0, 3.8]], shade(RIBBON, 1.3), 0.04, 0.6, 8)

  // the set-back top under its slate skirt
  const r0 = wound([OUTER])[0]
  const skirt = offsetRing(r0, -2)
  for (let i = 0; i < r0.length; i++) {
    const e = edgeAt(r0, i)
    const ia = skirt[i]
    const ib = skirt[(i + 1) % r0.length]
    out.quad([[e.a.x, E, e.a.z], [e.b.x, E, e.b.z], [ib.x, T, ib.z], [ia.x, T, ia.z]], [e.nx * 0.7, 0.7, e.nz * 0.7], [[0, 0], [1, 0], [1, 1], [0, 1]], p.slate, FIXED)
  }
  capPolygonWithHoles(out, wound([skirt, COURT]), T, shade(p.slate, 0.85), FIXED)

  // the two one-storey pieces OSM parts from the wards
  for (const [x0, x1, z0, z1] of [[-19, -5.5, -63, -49.5], [32.5, 42.9, -18.8, -8.6]] as const) {
    block(out, x0, x1, z0, z1, 0, 4.2, WHITE)
    block(out, x0 - 0.3, x1 + 0.3, z0 - 0.3, z1 + 0.3, 4.2, 4.6, shade(WHITE, 1.03))
    rectOn(out, '-z', z0, x0 + 0.8, x1 - 0.8, 1, 3.4, RIBBON, 0.04)
    rectOn(out, '+x', x1, z0 + 0.8, z1 - 0.8, 1, 3.4, RIBBON, 0.04)
  }
}
