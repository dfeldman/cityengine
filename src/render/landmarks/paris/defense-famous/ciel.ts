/**
 * TOUR LES POISSONS (Henri Pottier, 1970; roof 129.5 m), Courbevoie: housing over offices (the offices renamed "Ciel" after
 * Espaces Libres' 2009 renovation; fr.wikipedia "Tour Les Poissons"). As photographed (Commons Tour_Les_Poissons_Juin_2020.jpeg):
 * a tall slab clad in warm tan/beige with dark window strips, and a lower dark-grey block against one side of it.
 * Heights: Wikipedia 129.5 m roof; the dark block's top by eye from the photograph (~2/3).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { walls } from '../monuments/common.ts'
import { clipX, footRing, shaft } from './cbx.ts'

// ---- tunables ----
const PO_TAN = '#ab9c86'     // the slab's warm cladding
const PO_WIN = '#4e4c4a'     // its window strips
const PO_DARK = '#4b5158'    // the lower dark block
const PO_DARK_LINE = '#8b949b'
const PO_ROOF_C = '#8a8580'
const PO_H = 129.5           // Wikipedia
const PO_LOW = 88            // the dark block, by eye
const PO_SPLIT = 0.0         // local x where the tall slab ends (share of hx; slab on -x)
const PO_FLOOR = 3.0

export function ciel(out: MeshBuilder, fit: Fit): void {
  const r = footRing(fit)
  const g = fit.grade ?? 0
  const sx = PO_SPLIT * fit.hx
  const tall = clipX(r, sx, -1)
  const low = clipX(r, sx, 1)
  if (tall.length >= 3) {
    shaft(out, tall, 0, g + PO_H, hex(PO_TAN), hex(PO_WIN), PO_FLOOR)
    walls(out, tall, g + PO_H, g + PO_H + 0.01, hex(PO_ROOF_C), hex(PO_ROOF_C))
  }
  if (low.length >= 3) {
    shaft(out, low, 0, g + PO_LOW, hex(PO_DARK), hex(PO_DARK_LINE), PO_FLOOR)
    walls(out, low, g + PO_LOW, g + PO_LOW + 0.01, hex(PO_ROOF_C), hex(PO_ROOF_C))
  }
}
