import type { MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'
import { hoop } from './monument-kit.ts'

/*
 * TOMBE DU DRAGON (Père-Lachaise, Wikidata Q3531119; the 1809 stele of Antoine de Guillaume-Lagrange, dragoon, dead in
 * Poland, put up by his mother: the cemetery's first sculpted tomb). A round-topped limestone stele on a plain step base.
 * The front carries, all in shallow relief: a laurel-wreathed medallion with the dragoon's bust in his crested helmet, a
 * sabre (left) and a musket (right) running down the sides, the inscription between, and a mourning figure at the foot.
 * The back is all inscription. NO sculpture in the round, so no Modly piece: the reliefs are drawn proud of the face.
 * Frame: −z the front, x across, y up from the ground (G). Sizes scaled by eye off Commons photographs (not surveyed).
 */
export const HX = 1.0
export const HZ = 0.8

// tunables (metres)
const BASE_HW = 0.42, BASE_HD = 0.27, BASE_H = 0.2     // step base
const ST_HW = 0.31, ST_HD = 0.075, ST_H = 1.5           // stele half-width, half-thickness, total height above the base (top of arch)
const ARCH_STRIPS = 14                                   // strips approximating the round top
const REL = 0.03                                         // relief proud of the face
const MEDAL_R = 0.215, MEDAL_Y = 1.24                    // wreath medallion radius and centre height above the base top

const STONE: Rgb = hex('#d4cfc2')
const DEEP: Rgb = shade(STONE, 0.8)

function draw(q: MeshBuilder): void {
  const y0 = G + BASE_H
  block(q, -BASE_HW, BASE_HW, -BASE_HD, BASE_HD, G, y0, shade(STONE, 0.86))
  // stele: straight part then half-round crown built from horizontal strips
  const rise = ST_H - ST_HW
  block(q, -ST_HW, ST_HW, -ST_HD, ST_HD, y0, y0 + rise, STONE)
  for (let i = 0; i < ARCH_STRIPS; i++) {
    const a0 = (i / ARCH_STRIPS) * (Math.PI / 2), a1 = ((i + 1) / ARCH_STRIPS) * (Math.PI / 2)
    const w = ST_HW * Math.cos(a1) // strip width at its top edge
    block(q, -w, w, -ST_HD, ST_HD, y0 + rise + ST_HW * Math.sin(a0), y0 + rise + ST_HW * Math.sin(a1), STONE)
  }
  const zf = -ST_HD - 0.001
  const my = y0 + MEDAL_Y
  // medallion: recessed disc, wreath ring, bow, bust
  block(q, -MEDAL_R * 0.9, MEDAL_R * 0.9, zf - 0.004, zf, my - MEDAL_R * 0.9, my + MEDAL_R * 0.9, DEEP)
  hoop(q, [0, my, zf - REL / 2], [0, 0, 1], MEDAL_R, 0.035, shade(STONE, 0.93), 20)
  block(q, -0.07, 0.07, zf - REL, zf, my - MEDAL_R - 0.03, my - MEDAL_R + 0.03, shade(STONE, 0.95)) // bow
  block(q, -0.1, 0.1, zf - REL, zf, my - 0.15, my - 0.04, shade(STONE, 0.97))        // shoulders
  block(q, -0.055, 0.055, zf - REL * 1.4, zf, my - 0.04, my + 0.07, shade(STONE, 1.02)) // face
  block(q, -0.065, 0.065, zf - REL * 1.4, zf, my + 0.07, my + 0.16, shade(STONE, 0.9))  // helmet
  // sabre (left) and musket (right) down the sides
  const cy = y0 + 0.2
  block(q, -0.25, -0.2, zf - REL, zf, cy, cy + 0.85, shade(STONE, 0.96))
  block(q, -0.27, -0.18, zf - REL, zf, cy + 0.85, cy + 0.9, shade(STONE, 0.94))
  block(q, 0.19, 0.24, zf - REL, zf, cy, cy + 0.9, shade(STONE, 0.96))
  // mourning figure low on the face
  block(q, -0.12, 0.1, zf - REL, zf, y0 + 0.12, y0 + 0.2, shade(STONE, 0.95))
  block(q, -0.06, 0.06, zf - REL * 1.4, zf, y0 + 0.2, y0 + 0.3, shade(STONE, 0.98))
  // inscriptions, front and back: rows of shallow lettering
  const rows = (zz: number, sg: number, ya: number, h: number, w: number, fr: number[]): void => {
    const st = h / fr.length
    fr.forEach((f, k) => {
      const yc = ya + h - st * (k + 0.5), lw = w * f
      block(q, -lw / 2, lw / 2, sg < 0 ? zz - 0.006 : zz, sg < 0 ? zz : zz + 0.006, yc - st * 0.25, yc + st * 0.25, DEEP)
    })
  }
  rows(zf, -1, y0 + 0.4, 0.5, 0.4, [0.5, 0.9, 0.8, 0.9, 0.7, 0.9, 0.8, 0.6])
  rows(ST_HD + 0.001, 1, y0 + 0.15, 1.05, 0.5, [0.7, 0.9, 0.9, 0.8, 0.9, 0.9, 0.8, 0.9, 0.9, 0.8, 0.9, 0.7])
}

export function tombeDragon(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
