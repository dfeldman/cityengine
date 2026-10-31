import type { MeshBuilder } from '../../buildings.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { beam, shade } from '../kit.ts'

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
  const granite: Rgb = [0.71, 0.61, 0.55]
  const plinth: Rgb = [0.55, 0.54, 0.52]
  const gold: Rgb = [0.86, 0.68, 0.28]
  const bronze: Rgb = [0.2, 0.27, 0.23]
  const hier: Rgb = [0.55, 0.45, 0.4]
  // the obelisk on its plinth (Hittorff's: grey granite, the raising of it in gilt on two faces)
  box(out, 0, 1.2, 0, 3.2, 1.2, 3.2, plinth, FIXED)
  box(out, 0, 4.4, 0, 2.3, 2, 2.3, plinth, FIXED)
  box(out, 0, 6.6, 0, 2.5, 0.2, 2.5, plinth, FIXED)
  for (const s of [-1, 1]) for (const [x, w] of [[-1.2, 0.7], [0.3, 1]] as const) {
    out.quad([[x, 3.4, s * 2.33], [x + w, 3.4, s * 2.33], [x + w, 5.4, s * 2.33], [x, 5.4, s * 2.33]], [0, 0, s], [[0, 0], [1, 0], [1, 1], [0, 1]], gold, FIXED)
  }
  prism(out, 0, 0, 6.8, 29.6, 1.25, 4, granite, FIXED, 0.85)
  // the three columns of hieroglyphs cut in each face (Commons, "Luxor Obelisk, Place de la Concorde"): worn, a little darker than the granite
  for (let f = 0; f < 4; f++) {
    const a = (f / 4) * Math.PI * 2
    const nx = Math.sin(a), nz = Math.cos(a)
    const tx = Math.cos(a), tz = -Math.sin(a)
    for (const off of [-0.5, 0, 0.5]) {
      for (let i = 0; i < 22; i++) {
        const y0 = 8.2 + i * 0.93
        const y1 = y0 + 0.62 + ((i * 7) % 3) * 0.08
        const half = (y: number): number => (1.25 + (0.85 - 1.25) * ((y - 6.8) / 22.8)) * Math.SQRT1_2
        const w = 0.18 * (0.8 + ((i * 13) % 5) * 0.08)
        const P = (y: number, u: number): [number, number, number] => {
          const h = half(y)
          return [nx * (h + 0.015) + tx * u * (h / 0.88), y, nz * (h + 0.015) + tz * u * (h / 0.88)]
        }
        out.quad([P(y0, off - w), P(y0, off + w), P(y1, off + w), P(y1, off - w)], [nx, 0.02, nz], [[0, 0], [1, 0], [1, 1], [0, 1]], hier, FIXED)
      }
    }
  }
  prism(out, 0, 0, 29.6, 31.4, 0.85, 4, gold, FIXED, 0.02)                               // the pyramidion
  // the two fountains, 64 m either side along the axis (OSM's pools)
  for (const sz of [-1, 1]) fountain(out, 0, sz * 64, gold, bronze)
  for (const [x, z] of [[84, 88], [-84, 88], [84, -88], [-84, -88], [132, 46], [-132, 46], [132, -46], [-132, -46]]) city(out, x, z)
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

/**
 * One of the two great fountains (Hittorff, 1840), dark green bronze picked out in gilt: off Baldus's photograph on Commons and the OSM pool,
 * the top-25 audit of 2026-10-30. The basins had gold lids, and from anywhere above they were two yellow discs. The six seated figures with
 * fish in their laps round the pier, the six dolphins out in the pool, the two basins with water in them, the three cherubs, the jet's crown.
 */
function fountain(out: MeshBuilder, cx: number, cz: number, gold: Rgb, bronze: Rgb): void {
  const dark = shade(bronze, 0.8)
  const water: Rgb = [0.3, 0.42, 0.48]
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    const nx = Math.sin(a), nz = Math.cos(a)
    const tx = nz, tz = -nx
    const x = cx + nx * 3.6, z = cz + nz * 3.6
    // the seat, the figure's lap and body leaning back to the pier, the head; the arms holding the fish out, and the fish, gilt-mouthed
    prism(out, x, z, 0, 1.3, 1, 6, dark, FIXED, 0.85)
    beam(out, [x, 1.55, z], [x - nx * 0.45, 3.25, z - nz * 0.45], 0.55, bronze, 0.46)
    prism(out, x - nx * 0.55, z - nz * 0.55, 3.3, 3.95, 0.3, 6, bronze, FIXED, 0.22)
    for (const s of [-1, 1]) {
      beam(out, [x + tx * s * 0.45, 1.25, z + tz * s * 0.45], [x + nx * 1.2 + tx * s * 0.55, 1.05, z + nz * 1.2 + tz * s * 0.55], 0.27, bronze)
      beam(out, [x + tx * s * 0.55, 2.8, z + tz * s * 0.55], [x + nx * 0.9 + tx * s * 0.38, 2.1, z + nz * 0.9 + tz * s * 0.38], 0.15, bronze)
    }
    beam(out, [x + nx * 0.55, 2.05, z + nz * 0.55], [x + nx * 1.5, 1.45, z + nz * 1.5], 0.24, dark)
    box(out, x + nx * 1.55, 1.42, z + nz * 1.55, 0.13, 0.13, 0.13, gold, FIXED)
    // and the dolphin out in the pool beyond it, its back arched, its head down
    const dx = cx + Math.sin(a + 0.52) * 9.2, dz = cz + Math.cos(a + 0.52) * 9.2
    const dn = [Math.sin(a + 0.52), Math.cos(a + 0.52)]
    beam(out, [dx - dn[0] * 0.9, 0.2, dz - dn[1] * 0.9], [dx, 1.5, dz], 0.34, dark)
    beam(out, [dx, 1.5, dz], [dx + dn[0] * 0.9, 0.5, dz + dn[1] * 0.9], 0.3, dark)
  }
  prism(out, cx, cz, 0, 4.4, 1.7, 12, bronze, FIXED, 1.25)                                // the pier
  // the lower basin: a bowl flaring out, its gilt rim and the water in it
  prism(out, cx, cz, 4.4, 5.4, 1.3, 20, bronze, FIXED, 5.2, false)
  prism(out, cx, cz, 5.4, 5.65, 5.2, 20, gold, FIXED, 5.3, false)
  prism(out, cx, cz, 5.45, 5.5, 5.15, 20, water, FIXED)
  prism(out, cx, cz, 5.5, 8, 0.8, 10, bronze, FIXED, 0.5)
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2
    const x = cx + Math.sin(a) * 1.05, z = cz + Math.cos(a) * 1.05
    prism(out, x, z, 5.5, 6.9, 0.3, 5, bronze, FIXED, 0.22)
    prism(out, x, z, 6.9, 7.45, 0.21, 5, gold, FIXED, 0.14)
  }
  prism(out, cx, cz, 8, 8.7, 0.5, 14, bronze, FIXED, 2.6, false)                          // the upper basin
  prism(out, cx, cz, 8.7, 8.85, 2.6, 14, gold, FIXED, 2.65, false)
  prism(out, cx, cz, 8.72, 8.76, 2.55, 14, water, FIXED)
  prism(out, cx, cz, 8.76, 9.9, 0.32, 8, gold, FIXED, 0.08)                                // the jet's finial
}

/**
 * One of the eight seated cities on their pavilions (Pradier, Cortot; 1836): Lille and Strasbourg to the north-east, Rouen and Brest north-west,
 * Lyon and Marseille south-east, Nantes and Bordeaux south-west. A stone lodge of about 6 m, its door and cornice, the figure in her mural crown
 * looking at the obelisk. North-east's inner one is off IGN's aerial (84, 88 in this frame), and the rest by the octagon's symmetry: not surveyed.
 */
function city(out: MeshBuilder, x: number, z: number): void {
  const c: Rgb = [0.72, 0.69, 0.62]
  const trim = shade(c, 1.08)
  const a = Math.atan2(x, z)
  const nx = -Math.sin(a), nz = -Math.cos(a)
  prism(out, x, z, 0, 5.2, 3.6, 8, c, FIXED)
  prism(out, x, z, 5.2, 5.8, 4, 8, trim, FIXED)
  prism(out, x, z, 5.8, 6.7, 2.7, 8, c, FIXED, 2.4)
  box(out, x + nx * 3.5, 1.5, z + nz * 3.5, 0.75, 1.4, 0.75, [0.2, 0.2, 0.2], FIXED)
  // the figure: seat, knees, body, mural crown; she is 4 m seated
  prism(out, x, z, 6.7, 7.9, 1.4, 6, shade(c, 0.95), FIXED, 1.1)
  beam(out, [x, 8.1, z], [x + nx * 1.25, 7.6, z + nz * 1.25], 0.72, trim, 0.5)
  beam(out, [x + nx * 1.25, 7.6, z + nz * 1.25], [x + nx * 1.45, 6.8, z + nz * 1.45], 0.42, trim)
  beam(out, [x, 7.9, z], [x, 9.75, z], 0.72, trim, 0.72)
  prism(out, x, z, 9.75, 10.6, 0.4, 6, trim, FIXED, 0.3)
  prism(out, x, z, 10.55, 10.95, 0.42, 6, c, FIXED, 0.45)
}
