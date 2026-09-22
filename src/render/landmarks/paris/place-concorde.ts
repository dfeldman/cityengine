import type { MeshBuilder } from '../../buildings.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { beam } from '../kit.ts'

const FIXED = 0

/**
 * The ornaments of the Place de la Concorde (PARIS_EXPAND §5 A): the Luxor OBELISK at the centre — pink
 * granite, 23 m, hieroglyphs as dark bands, a gilded pyramidion — on its grey plinth; the two FOUNTAINS, the
 * Fontaine des Mers (south) and des Fleuves (north), each two stacked bronze-and-gilt basins over a round pool
 * ringed by seated figures; and the gilded ROSTRAL COLUMNS round the square, the lamps with ship prows. The
 * pools themselves are OSM's water, drawn by the city; these stand in them.
 *
 * Local frame: centred on the obelisk, +z to the north (toward the Madeleine) when unrotated.
 */
export function placeConcorde(out: MeshBuilder): void {
  const granite: Rgb = [0.78, 0.62, 0.55]
  const plinth: Rgb = [0.55, 0.54, 0.52]
  const gold: Rgb = [0.86, 0.68, 0.28]
  const bronze: Rgb = [0.28, 0.33, 0.28]
  const hier: Rgb = [0.5, 0.36, 0.32]
  // the obelisk on its plinth
  box(out, 0, 1.2, 0, 3.2, 1.2, 3.2, plinth, FIXED)
  box(out, 0, 4.4, 0, 2.3, 2, 2.3, plinth, FIXED)
  box(out, 0, 6.6, 0, 2.5, 0.2, 2.5, gold, FIXED)
  prism(out, 0, 0, 6.8, 29.6, 1.25, 4, granite, FIXED, 0.85)
  // the columns of hieroglyphs: three dark bands down each face
  for (let f = 0; f < 4; f++) {
    const a = (f / 4) * Math.PI * 2 + Math.PI / 4
    for (const off of [-0.45, 0, 0.45]) {
      for (let y = 8.5; y < 28; y += 1.4) {
        const w = 1.25 - ((y - 6.8) / 22.8) * 0.4
        const nx = Math.sin(a)
        const nz = Math.cos(a)
        box(out, nx * w * 0.71 + nz * off * (w / 1.25), y, nz * w * 0.71 - nx * off * (w / 1.25), 0.12, 0.45, 0.12, hier, FIXED)
      }
    }
  }
  prism(out, 0, 0, 29.6, 31.4, 0.85, 4, gold, FIXED, 0.02)                               // the pyramidion
  // the two fountains, 64 m either side along the axis (OSM's pools)
  for (const sz of [-1, 1]) fountain(out, 0, sz * 64, gold, bronze)
  // rostral columns round the square: two by each fountain and along the edges
  for (const [x, z] of [[-24, -70], [24, -70], [-24, 70], [24, 70], [-70, -24], [70, -24], [-70, 24], [70, 24],
    [-110, 0], [110, 0], [0, -120], [0, 120]]) {
    prism(out, x, z, 0, 0.8, 0.9, 8, plinth, FIXED)
    prism(out, x, z, 0.8, 7.4, 0.32, 10, bronze, FIXED, 0.26)
    for (const y of [2.8, 4.2]) {
      // the ships' prows sticking out of the shaft, gilded
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * Math.PI * 2 + (y > 3 ? Math.PI / 4 : 0)
        beam(out, [x, y, z], [x + Math.sin(a) * 0.7, y + 0.1, z + Math.cos(a) * 0.7], 0.08, gold)
      }
    }
    // the lantern cluster on top
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2
      box(out, x + Math.sin(a) * 0.45, 7.7, z + Math.cos(a) * 0.45, 0.14, 0.26, 0.14, [0.95, 0.9, 0.75], 0.5)
    }
    prism(out, x, z, 7.4, 8.4, 0.12, 6, gold, FIXED, 0.05)
  }
}

/** One of the two great fountains: a lower bronze basin on a pier of seated figures, a smaller one above. */
function fountain(out: MeshBuilder, cx: number, cz: number, gold: Rgb, bronze: Rgb): void {
  // the ring of seated figures round the foot of the pier, facing out
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    const x = cx + Math.sin(a) * 3.3
    const z = cz + Math.cos(a) * 3.3
    box(out, x, 0.9, z, 0.6, 0.9, 0.6, bronze, FIXED)
    box(out, x + Math.sin(a) * 0.3, 2.1, z + Math.cos(a) * 0.3, 0.35, 0.4, 0.35, bronze, FIXED)
  }
  prism(out, cx, cz, 0, 3.8, 1.6, 12, bronze, FIXED, 1.2)                                 // the pier
  prism(out, cx, cz, 3.8, 4.5, 4.8, 18, bronze, FIXED, 5.4)                               // the lower basin
  prism(out, cx, cz, 4.5, 4.7, 5.4, 18, gold, FIXED)                                      // its gilt rim
  prism(out, cx, cz, 4.7, 7.2, 0.8, 10, bronze, FIXED, 0.6)
  prism(out, cx, cz, 7.2, 7.7, 2.2, 14, bronze, FIXED, 2.6)                               // the upper basin
  prism(out, cx, cz, 7.7, 7.85, 2.6, 14, gold, FIXED)
  prism(out, cx, cz, 7.85, 9.2, 0.35, 8, gold, FIXED, 0.1)                                // the jet's finial
}
