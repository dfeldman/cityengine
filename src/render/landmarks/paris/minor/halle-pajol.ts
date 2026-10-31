/**
 * LA HALLE PAJOL (owner, 2026-10-30, #25: "this is supposed to be biblio valclav havel but it is not rendering"). Why it was not: OSM has the
 * halle's roof as `building=roof layer=2` (way/195265640, its 90 × 145 m box), which the bake drops as a canopy over a platform, so what was
 * left was its wooden inside (way/272389978) drawn as a flat 8 m office in a blank blue-black lid, and way/272389977, the library end, drawn
 * 67 m away by the kit as a 28 m civic block (the register's height, for a two-storey building). Nothing of what is there.
 *
 * What is there (Commons "Halle Pajol, Paris 6 March 2015.jpg", IGN's aerial; Jourda's conversion of the 1926 customs shed, the date and the
 * architect from memory): black steel frames on a 11.7 m beat, a row of shed roofs across them, one slope in solar panels, the other glazed, a
 * glazed gable at the end of each; under the west span the two floors of red cedar, library at the north end under its own timber gable
 * with its name on it; the east span open, a covered walk beside the rails' garden. Two spans, twelve roofs. Heights estimated from the photograph.
 *
 * −z north-north-east (front 21.7, OSM's own axes), so +x is bearing 291.7, the esplanade and the Rue Pajol; the walk is on −x, along the rails.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { beam, block, hex, shade, type Rgb } from '../../kit.ts'
import { signText } from '../../parts.ts'
import { FIXED, UV, surfaceTag, type V3 } from '../rivegauche/common.ts'

export function hallePajol(out: MeshBuilder, fit: Fit): void {
  const g = fit.grade ?? 0.5
  const HX = 20.55, HZ = 70.3
  const X0 = -HX, X1 = HX, XM = 2.05       // −x is the walk; +x is the cedar block (way/272389978)
  const STEEL: Rgb = hex('#24272a'), CEDAR: Rgb = hex('#a9663c'), CEDAR2: Rgb = hex('#94552f'), PV: Rgb = hex('#2d3a4d'), GLASS: Rgb = hex('#6f8591'), DARK: Rgb = hex('#27303a'), RAIL: Rgb = hex('#9aa0a0'), DECK: Rgb = hex('#6e6a64')
  const gl = surfaceTag('glass'), wood = surfaceTag('planks')
  const q = (p: V3[], n: V3, c: Rgb, tag = FIXED): void => out.quad(p, n, UV, c, tag)
  const yE = g + 9.6, yR = g + 13.2
  // ---- the library's north bay and the twelve sheds. A shed's ridge runs across the hall, along x; its long slope to the south, the panels
  const ZL = -57                                         // the library bay ends here
  const rows = 12
  const pitch = (HZ - ZL) / rows
  const bay = (z0: number, z1: number, x0: number, x1: number): void => {
    const zr = z0 + (z1 - z0) * 0.3
    // the short north slope, glass; the long south one, panels
    q([[x0, yE, z0], [x1, yE, z0], [x1, yR, zr], [x0, yR, zr]], [0, 0.7, -0.7], GLASS, gl)
    q([[x0, yR, zr], [x1, yR, zr], [x1, yE, z1], [x0, yE, z1]], [0, 0.9, 0.3], PV, gl)
    // the glazed gable at each end of the shed, a triangle on the frame
    for (const [x, s] of [[x0, -1], [x1, 1]] as const) {
      q([[x, yE, z0], [x, yE, z1], [x, yR, zr], [x, yR, zr]], [s, 0, 0], GLASS, gl)
    }
    // the ridge and its bars, thin black steel
    beam(out, [x0, yR + 0.02, zr], [x1, yR + 0.02, zr], 0.07, STEEL)
    const n = Math.round((x1 - x0) / 3)
    for (let i = 1; i < n; i++) {
      const x = x0 + ((x1 - x0) * i) / n
      beam(out, [x, yE + 0.02, z0], [x, yR + 0.02, zr], 0.03, STEEL)
    }
  }
  for (let i = 0; i < rows; i++) {
    const z0 = ZL + i * pitch, z1 = z0 + pitch
    bay(z0, z1, X0, XM)
    bay(z0, z1, XM, X1)
  }
  // ---- the steel: the portal frames on every row, the eaves beams, the long ties
  for (let i = 0; i <= rows; i++) {
    const z = ZL + i * pitch
    for (const x of [X0, XM, X1]) block(out, x - 0.18, x + 0.18, z - 0.18, z + 0.18, 0, yE + 0.1, STEEL)
    beam(out, [X0, yE, z], [X1, yE, z], 0.14, STEEL, 0.32)
    // the tie rods of the walk's span, a shallow V under the beam
    if (i < rows) beam(out, [X0, g + 6.2, z], [XM, g + 6.2, z], 0.04, STEEL)
  }
  for (const x of [X0, XM, X1]) beam(out, [x, yE, ZL], [x, yE, HZ], 0.14, STEEL, 0.28)
  for (const x of [X0, XM]) beam(out, [x, g + 6.2, ZL], [x, g + 6.2, HZ], 0.09, STEEL)

  // ---- the cedar block: two floors the length of the east span, its strip windows, its railed gallery on the west
  const cx0 = XM + 0.3, cx1 = X1 - 0.3, cz0 = ZL, cz1 = HZ - 0.3
  const yTop = g + 8
  block(out, cx0, cx1, cz0, cz1, 0, yTop, CEDAR)
  q([[cx0, yTop + 0.01, cz0], [cx1, yTop + 0.01, cz0], [cx1, yTop + 0.01, cz1], [cx0, yTop + 0.01, cz1]], [0, 1, 0], shade(DECK, 0.9))
  for (const [x, s] of [[cx0, -1], [cx1, 1]] as const) {
    const n = Math.round((cz1 - cz0) / 3.9)
    for (let i = 0; i < n; i++) {
      const z = cz0 + ((cz1 - cz0) * (i + 0.5)) / n
      // planked panels in two tones, and a window in each storey
      q([[x + s * 0.04, g + 0.2, z - 1.9], [x + s * 0.04, g + 0.2, z + 1.9], [x + s * 0.04, yTop, z + 1.9], [x + s * 0.04, yTop, z - 1.9]], [s, 0, 0], i % 2 ? CEDAR : CEDAR2, wood)
      for (const [y0, h, w] of [[g + 0.3, 3.1, i % 3 === 0 ? 1.5 : 1.2], [g + 4.4, 2.6, 1.2]]) {
        q([[x + s * 0.08, y0, z - w], [x + s * 0.08, y0, z + w], [x + s * 0.08, y0 + h, z + w], [x + s * 0.08, y0 + h, z - w]], [s, 0, 0], DARK, gl)
      }
    }
  }
  // the upper gallery along the walk: its deck, its rail
  block(out, cx0 - 1.7, cx0, cz0 + 3, cz1, g + 3.85, g + 4.05, DECK)
  beam(out, [cx0 - 1.7, g + 5.05, cz0 + 3], [cx0 - 1.7, g + 5.05, cz1], 0.03, RAIL)
  for (let i = 0; i < 44; i++) {
    const z = cz0 + 3 + ((cz1 - cz0 - 3) * i) / 44
    block(out, cx0 - 1.72, cx0 - 1.68, z - 0.02, z + 0.02, g + 4.05, g + 5.05, RAIL)
    if (i % 4 === 0) block(out, cx0 - 1.75, cx0 - 1.65, z - 0.05, z + 0.05, g, g + 3.85, STEEL)
  }
  // the south end of the cedar, glazed to the Rue Pajol's end
  q([[cx0 + 2, g + 0.3, cz1 + 0.04], [cx1 - 2, g + 0.3, cz1 + 0.04], [cx1 - 2, yTop - 1, cz1 + 0.04], [cx0 + 2, yTop - 1, cz1 + 0.04]], [0, 0, 1], DARK, gl)

  // ---- the library, at the north end: full width, two floors of cedar, its gable to the esplanade with its name on it (way/272389977)
  const lz0 = -HZ, lz1 = ZL
  const ly = g + 8.2, lr = g + 14.6
  const lx0 = -16.5
  block(out, lx0, X1, lz0, lz1, 0, ly, CEDAR)
  const zm = (lz0 + lz1) / 2
  // the timber roof: a ridge along x, both slopes planked in the same wood, its railed roof walk along the north
  q([[lx0, ly, lz0], [X1, ly, lz0], [X1, lr, zm], [lx0, lr, zm]], [0, 0.7, -0.7], shade(CEDAR, 0.9), wood)
  q([[lx0, lr, zm], [X1, lr, zm], [X1, ly, lz1], [lx0, ly, lz1]], [0, 0.7, 0.7], shade(CEDAR, 0.84), wood)
  for (const [x, s] of [[lx0, -1], [X1, 1]] as const) {
    q([[x, ly, lz0], [x, ly, lz1], [x, lr, zm], [x, lr, zm]], [s, 0, 0], s < 0 ? CEDAR : CEDAR2, wood)
  }
  // the black steel lintel beams across the gable, which looks on to the esplanade (+x)
  beam(out, [X1 + 0.1, ly + 0.05, lz0], [X1 + 0.1, ly + 0.05, lz1], 0.14, STEEL, 0.2)
  beam(out, [X1 + 0.1, g + 4.2, lz0], [X1 + 0.1, g + 4.2, lz1], 0.08, STEEL)
  for (const z of [lz0, zm, lz1]) block(out, X1 - 0.02, X1 + 0.3, z - 0.16, z + 0.16, 0, ly, STEEL)
  // its windows on the esplanade and north, and the glazed door
  const ww = (z: number, y0: number, h: number, w: number, c = DARK): void => q([[X1 + 0.04, y0, z + w], [X1 + 0.04, y0, z - w], [X1 + 0.04, y0 + h, z - w], [X1 + 0.04, y0 + h, z + w]], [1, 0, 0], c, gl)
  ww(zm + 3.4, g + 4.6, 2.4, 2.1)
  ww(zm - 3.2, g + 4.6, 2.4, 1.5)
  ww(zm, g + 0.2, 3.2, 3.2)
  for (let i = 0; i < 8; i++) {
    const x = lx0 + 3 + i * 4.6
    q([[x - 1.3, g + 0.6, lz0 - 0.04], [x + 1.3, g + 0.6, lz0 - 0.04], [x + 1.3, g + 3.4, lz0 - 0.04], [x - 1.3, g + 3.4, lz0 - 0.04]], [0, 0, -1], DARK, gl)
    q([[x - 1.3, g + 4.6, lz0 - 0.04], [x + 1.3, g + 4.6, lz0 - 0.04], [x + 1.3, g + 7, lz0 - 0.04], [x - 1.3, g + 7, lz0 - 0.04]], [0, 0, -1], DARK, gl)
    block(out, x - 0.03, x + 0.03, lz0 - 0.03, lz0 + 0.03, ly + 1.0, ly + 2.0, RAIL)
  }
  // the name, white letters across the gable as the photograph has them
  signText(out, 'BIBLIOTHÈQUE', X1 + 0.12, g + 9.3, zm, 0.72, [0.93, 0.93, 0.9], { heading: Math.PI / 2 })
  signText(out, 'VÁCLAV HAVEL', X1 + 0.12, g + 8.4, zm, 0.72, [0.93, 0.93, 0.9], { heading: Math.PI / 2 })
}
