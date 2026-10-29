import type { MeshBuilder } from '../../../buildings.ts'
import { box, type Rgb } from '../../../models.ts'
import { block, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { fitted, palette, rectOn, type F } from './common.ts'

const FIXED = 0
/** the design footprint: the land under the Bâtiment Colbert (OSM way 217512456), its river foot left out of it */
const HX = 168
const HZ = 15.8
/** the design frame's x of the OSM slab's two ends: the river end (south-west, −x) and Rue de Bercy (+x) */
const RIVER = -194.4
const BERCY = 168.4

/**
 * The Ministère de l'Économie et des Finances at Bercy, the Bâtiment Colbert (Paul Chemetov and Borja Huidobro, 1982–88):
 * a 360 m slab, eight storeys over two great spans, laid across the Quai de la Rapée and striding out into the Seine
 * like a viaduct, its end standing in the river on two massive piers. What a rider sees, on the quai or from the
 * Pont de Bercy:
 *
 * - the long gridded FLANKS, pale stone and concrete, the storeys in a strict frame of piers and floor bands;
 * - the two SPANS where the slab bridges the quai (over the express road) and the Rue de Bercy, 20 m up on its piers;
 * - the RIVER END: the slab's head over the water, its two piers going down into the Seine.
 *
 * OSM: the outline way 217512456 ("Colbert", 50 m) and its parts (40 m; the spans 227664483 / 227751355 from 20 m).
 * Local frame: the slab along x, the river end at −x; −z faces bearing 140.5 (south-east, upstream).
 */
export function bercyMinistry(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const p = palette('#d9d6cd', '#5a6064')
  const frame: Rgb = shade(p.stone, 1.04)
  const glass: Rgb = [0.24, 0.3, 0.36]
  const z0 = -15.8
  const z1 = 15.8
  const top = 40
  // the spans (x ranges carried from 20 m) and the ground between them
  const spans: [number, number][] = [[RIVER + 21.5, RIVER + 74], [BERCY - 52, BERCY - 8.5]]
  const carried = (x: number): boolean => spans.some(([a, b]) => x > a && x < b)
  // ---- the slab, in three pieces: river span, the long middle on the ground, the Bercy end
  block(out, RIVER, BERCY, z0, z1, 20, top, p.stone)
  block(out, spans[0][1], spans[1][0], z0, z1, 0, 20, p.stone)
  // the piers under the spans, and the river end's two great legs going down into the water
  for (const [a, b] of spans) for (const x of [a + 1.6, b - 1.6]) block(out, x - 1.6, x + 1.6, z0 + 1, z1 - 1, 0, 20, shade(p.stone, 0.95))
  block(out, BERCY - 8.5, BERCY, z0, z1, 0, 20, p.stone)
  for (const z of [-9, 9]) block(out, RIVER + 4, RIVER + 18, z - 3, z + 3, -6, 20, shade(p.stone, 0.92))
  block(out, RIVER + 2, RIVER + 21.5, z0, z1, 14, 20, p.stone)
  // ---- the grid on both flanks: storeys every 4 m from the spans up, a pier every 3.6 m
  const storeys = 8
  for (const [f, plane] of [['-z', z0], ['+z', z1]] as [F, number][]) {
    for (let k = 0; k < storeys; k++) {
      const y = 20.6 + k * 2.4
      rectOn(out, f, plane, RIVER, BERCY, y, y + 1.7, glass, 0.05)
    }
    // the lower storeys of the grounded middle
    for (let k = 0; k < 4; k++) rectOn(out, f, plane, spans[0][1] + 2, spans[1][0] - 2, 1.5 + k * 4.6, 4.6 + k * 4.6, glass, 0.05)
    for (let x = RIVER + 1.8; x < BERCY; x += 3.6) {
      rectOn(out, f, plane, x - 0.3, x + 0.3, carried(x) || x < spans[0][1] || x > spans[1][1] ? 20 : 0.5, top - 0.6, frame, 0.09)
    }
    for (let k = 0; k <= 4; k++) rectOn(out, f, plane, RIVER, BERCY, 20 + k * 4.8 - 0.3, 20 + k * 4.8 + 0.3, frame, 0.1)
    rectOn(out, f, plane, spans[0][1], spans[1][0], 19.4, 20.6, frame, 0.12)
  }
  // the head over the river: its end wall glazed in a tall grid, and the roof's parapet
  for (let k = 0; k < 8; k++) rectOn(out, '-x', RIVER, z0 + 1 + k * 3.8, z0 + 3.9 + k * 3.8, 21, top - 1.5, glass, 0.06)
  for (const [x, f] of [[BERCY, '+x']] as const) for (let k = 0; k < 8; k++) rectOn(out, f, x, z0 + 1 + k * 3.8, z0 + 3.9 + k * 3.8, 21, top - 1.5, glass, 0.06)
  block(out, RIVER - 0.3, BERCY + 0.3, z0 - 0.3, z1 + 0.3, top, top + 1.1, frame)
  block(out, RIVER + 30, BERCY - 30, -6, 6, top + 1.1, top + 3.4, shade(p.stone, 0.9))          // plant on the roof
  // the undersides of the spans, in shadow
  for (const [a, b] of spans) box(out, (a + b) / 2, 19.95, 0, (b - a) / 2, 0.05, 15.6, shade(p.stone, 0.6), FIXED)
}
