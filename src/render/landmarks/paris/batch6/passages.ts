/**
 * The street mouths of three covered passages (2026-11-04; claude-sonnet-5-5). Only the entrance bays are drawn: the glass roofs do not show from the street. Each is a front 1 m deep or so with a gallery a few metres long behind its opening (floor, ceiling, shop windows on both walls, hung lamps, a lit end), on a fit of [width, depth]: the facade is the model's −z face, the gallery runs to +z. OSM's passage footways (osmium, 2026-11-04) give the axis and the street's tangent gives `front`.
 * The Panoramas (1799, 11 boulevard Montmartre) and Jouffroy (1847, 10 boulevard Montmartre) face each other across the boulevard; Vivienne (1823) is entered at 4 rue des Petits-Champs. None checked against a street photograph from here: drawn from memory of the three fronts.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { prism } from '../../../models.ts'
import type { Fit } from '../../fit.ts'
import { block, hex, shade, type Rgb } from '../../kit.ts'
import { archOn, palette, rectOn, slabOn } from '../palaces/common.ts'
import { lettersOn, litOn } from '../palaces/showfront.ts'

const GOLD: Rgb = [0.74, 0.58, 0.22], LAMP = hex('#e8b865'), PAVING = hex('#6b665e'), WARM = hex('#c98f4e')

interface Mouth {
  stone: string
  /** shopfronts, ironwork and doors */
  iron: Rgb
  /** the opening: width and height, metres */
  open: number
  h: number
  /** stone either side of the opening, and how far the portal stands proud of the wall */
  jamb: number
  proud: number
  /** the sign band over the opening, its height and its text */
  band: number
  name: string
  letter: number
  /** a round-headed opening (Vivienne's carved portal) rather than a lintel */
  round?: boolean
  /** a projecting glass-and-iron canopy: how far it stands out (Jouffroy) */
  canopy?: number
  /** a clock in the face over the canopy */
  clock?: boolean
  /** the wall carried up over the opening to this height, with its windows (the passage is under flats); 0 for none */
  up: number
  /** the gallery's ceiling height and the length of it drawn */
  ceil: number
  depth: number
}

function mouth(out: MeshBuilder, fit: Fit, o: Mouth): void {
  const y = fit.grade ?? 0, p = palette(o.stone, '#4d5458'), z = -fit.hz, hw = o.open / 2, W = hw + o.jamb
  const D = Math.min(o.depth, 2 * fit.hz - 0.2), far = z + D, top = y + o.h + o.band
  const dark = shade(o.iron, 0.5)
  // the portal: jambs, the sign band, the cornice over it
  for (const s of [-1, 1]) block(out, s < 0 ? -W : hw, s < 0 ? -hw : W, z - o.proud, z + 0.1, y, top, p.stone)
  if (o.round) {
    block(out, -hw, hw, z - o.proud, z + 0.1, y + o.h - hw, top, p.stone)
    archOn(out, '-z', z - o.proud, 0, y, o.open, o.h, dark, 0.04)
    // the voussoirs: a band of deeper stone about the arch
    for (const s of [-1, 1]) block(out, s < 0 ? -hw - 0.15 : hw - 0.02, s < 0 ? -hw + 0.02 : hw + 0.15, z - o.proud - 0.08, z - o.proud, y + o.h - hw, y + o.h, p.deep)
  } else block(out, -hw, hw, z - o.proud, z + 0.1, y + o.h, top, p.stone)
  block(out, -W - 0.15, W + 0.15, z - o.proud - 0.2, z + 0.1, top, top + 0.3, p.trim)
  block(out, -hw, hw, z - o.proud - 0.02, z + 0.1, y + o.h, top, p.trim)
  rectOn(out, '-z', z - o.proud - 0.02, -hw + 0.1, hw - 0.1, y + o.h + 0.12, top - 0.12, dark, 0.04)
  lettersOn(out, '-z', z - o.proud - 0.06, 0, y + o.h + (o.band - o.letter) / 2, o.name, { h: o.letter, c: GOLD, wide: 0.62, th: o.letter / 7, gap: o.letter * 0.16, d: 0.03 })
  // the wall carried up over it
  if (o.up > top + 0.5) {
    block(out, -W, W, z - o.proud, z + 0.1, top + 0.3, o.up, p.stone)
    for (let yy = top + 1.4; yy + 2.2 < o.up; yy += 3.4) rectOn(out, '-z', z - o.proud, -W * 0.55, W * 0.55, yy, yy + 2.2, p.glass, 0.05)
    block(out, -W - 0.1, W + 0.1, z - o.proud - 0.15, z + 0.1, o.up, o.up + 0.35, p.trim)
  }
  // the iron canopy over the opening, on two brackets: a glass pane under a deep valance
  if (o.canopy) {
    const c = o.canopy, zc = z - o.proud
    block(out, -W, W, zc - c, zc, y + o.h + 0.2, y + o.h + 0.3, o.iron)
    slabOn(out, '-z', zc, -W, W, y + o.h + 0.3, y + o.h + 0.34, c, p.glass)
    block(out, -W, W, zc - c, zc - c + 0.08, y + o.h - 0.25, y + o.h + 0.34, o.iron)
    for (let t = -W; t <= W + 0.01; t += W / 3) block(out, t - 0.03, t + 0.03, zc - c, zc, y + o.h + 0.3, y + o.h + 0.42, o.iron)
    for (const s of [-1, 1]) block(out, s * (W - 0.1) - 0.04, s * (W - 0.1) + 0.04, zc - c + 0.04, zc - c + 0.12, y + o.h - 1.2, y + o.h + 0.2, o.iron)
  }
  if (o.clock) {
    const cy = top + 1.1, zc = z - o.proud - 0.08
    block(out, -0.62, 0.62, zc - 0.1, zc + 0.05, cy - 0.62, cy + 0.62, o.iron)
    rectOn(out, '-z', zc - 0.1, -0.5, 0.5, cy - 0.5, cy + 0.5, hex('#e8e2d0'), 0.02)
    rectOn(out, '-z', zc - 0.1, -0.03, 0.03, cy, cy + 0.38, dark, 0.04)
    rectOn(out, '-z', zc - 0.1, 0, 0.28, cy - 0.03, cy + 0.03, dark, 0.04)
  }
  // the gallery behind: floor, ceiling, the shopfronts down both walls, lamps, a lit end
  block(out, -hw, hw, z + 0.1, far, y - 0.05, y + 0.04, PAVING)
  block(out, -hw, hw, z + 0.1, far, y + o.ceil, y + o.ceil + 0.2, shade(p.deep, 0.7))
  for (const s of [-1, 1]) {
    block(out, s < 0 ? -hw - 0.3 : hw, s < 0 ? -hw : hw + 0.3, z + 0.1, far, y, y + o.ceil + 0.2, shade(o.iron, 1.1))
    const face = s < 0 ? '+x' : '-x', plane = s * hw
    for (let t = z + 0.6; t + 1.6 < far; t += 2.2) {
      rectOn(out, face, plane, t, t + 1.6, y + 0.35, y + 2.5, LAMP, 0.02)
      rectOn(out, face, plane, t - 0.12, t + 1.72, y + 2.6, y + 3.0, p.trim, 0.04)
    }
    rectOn(out, face, plane, z + 0.1, far, y + 3.2, y + o.ceil - 0.3, p.stone, 0.03)
  }
  for (let t = z + 1.2; t < far - 0.4; t += 2.6) {
    block(out, -0.015, 0.015, t - 0.015, t + 0.015, y + o.ceil - 0.6, y + o.ceil, dark)
    prism(out, 0, t, y + o.ceil - 1.0, y + o.ceil - 0.6, 0.16, 6, LAMP)
  }
  litOn(out, '-z', far, -hw, hw, y, y + o.ceil, WARM, 0.02)
}

/** LE PASSAGE DES PANORAMAS, 11 boulevard Montmartre (1799, the first of Paris's glazed passages; OSM footway from the boulevard at 48.87153 2.34183): a narrow mouth, gilt name on a dark band over it, shopfronts down both sides, the flats carried over. Faces N to the boulevard (front 13). */
export function passagePanoramas(out: MeshBuilder, fit: Fit): void {
  mouth(out, fit, { stone: '#dcd1b9', iron: hex('#2b2018'), open: 2.9, h: 3.6, jamb: 0.9, proud: 0.35, band: 0.9, name: 'PASSAGE DES PANORAMAS', letter: 0.3, up: 15, ceil: 4.4, depth: 6 })
}
/** LE PASSAGE JOUFFROY, 10 boulevard Montmartre (Destailleur's, 1847, facing the Panoramas across the boulevard; footway from the boulevard at 48.87184 2.34192): the glass-and-iron canopy over the mouth, the name in its band, the clock above. Faces S to the boulevard (front 193). */
export function passageJouffroy(out: MeshBuilder, fit: Fit): void {
  mouth(out, fit, { stone: '#dcd1b9', iron: hex('#2f4a3c'), open: 3.8, h: 3.7, jamb: 1.0, proud: 0.4, band: 1.0, name: 'PASSAGE JOUFFROY', letter: 0.4, canopy: 1.4, clock: true, up: 15, ceil: 4.6, depth: 6 })
}
/** LA GALERIE VIVIENNE, 4 rue des Petits-Champs (Delannoy, 1823; OSM footways, the board at 48.86620 2.33946): the round-headed portal of carved stone with the name gilt over it, iron gates dark in the opening, the gallery with its shops running back. Faces S to the street (front 200). */
export function galerieVivienne(out: MeshBuilder, fit: Fit): void {
  mouth(out, fit, { stone: '#dcd1b9', iron: hex('#2a2a26'), open: 3.4, h: 4.6, jamb: 0.8, proud: 0.5, band: 0.9, name: 'GALERIE VIVIENNE', letter: 0.38, round: true, up: 0, ceil: 5.4, depth: 6 })
}
