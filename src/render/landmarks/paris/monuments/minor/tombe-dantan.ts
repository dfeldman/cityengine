import type { MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'
import { plaque } from './monument-kit.ts'

/*
 * MONUMENT FUNÉRAIRE DE DANTAN (Père-Lachaise, division 4; Wikidata Q3323375, 48.8587 2.3923; Commons "Grave of Dantan
 * (Père-Lachaise, division 4)"). The sculptors' family tomb of 1859 (Antoine-Laurent and Jean-Baptiste Dantan): a grey stone
 * slab and name-plinth, a dark red-brown moulded sarcophagus ledge with a small medallion, then an ochre limestone stele with
 * a green mosaic border carrying four round portrait medallions, a mourning woman at each corner on a pedestal (Modly
 * `dantan-pleureuse-g` / `dantan-pleureuse-d`), a cornice with an ornamented frieze, an attic with a central relief and a small
 * figure at each corner (stand-in blocks). Frame: −z the front, x across, y up from G.
 * Proportions scaled by eye off Commons 'Dantan div. 4 Père-Lachaise (2)' against a ~1.9 m stele width guess; not surveyed.
 */
export const HX = 1.3
export const HZ = 0.9

// tunables (metres)
const SLAB_HW = 1.2, SLAB_HD = 0.8, SLAB_H = 0.22        // ground slab
const PLINTH_HW = 1.05, PLINTH_HD = 0.65, PLINTH_H = 0.55 // grey name plinth
const LEDGE_HW = 1.1, LEDGE_HD = 0.7, LEDGE_H = 0.7       // dark moulded sarcophagus ledge
const STELE_HW = 0.9, STELE_HD = 0.38, STELE_H = 1.55     // ochre stele body
const FRAME = 0.1                                         // green mosaic border width
const MED_R = 0.2, MED_DX = 0.33                          // medallion radius, half spacing
const PED_HW = 0.2, PED_HD = 0.26, PED_H = 0.12           // figure pedestal under each mourner
const CORN_HW = 1.0, CORN_HD = 0.46, CORN_H = 0.3         // cornice
const FRIEZE_HW = 0.72, FRIEZE_H = 0.3                                     // ornamented frieze
const ATT_HW = 0.62, ATT_HD = 0.3, ATT_H = 0.45           // attic
const TOP_H = 0.2                                         // capping slab on the attic
const CORNER_FIG = 0.5                                    // height of the stand-in corner figures
/** Where the two mourners stand (model frames: feet), x ± and the stele front. */
export const MOURNER_X = 0.78
export const MOURNER_Y = SLAB_H + PLINTH_H + LEDGE_H + PED_H
export const MOURNER_Z = -STELE_HD - 0.08

const GREY: Rgb = hex('#9d9a92')
const GREY_D: Rgb = hex('#85827a')
const RED: Rgb = hex('#5e4033')
const OCHRE: Rgb = hex('#cfc190')
const GREEN: Rgb = hex('#8a9c7a')
const RING: Rgb = hex('#2c3a2e')
const CREAM: Rgb = hex('#d8d3c4')
const UVS: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

/** A flat vertical disc in the plane z = zc, facing −z. */
function disc(q: MeshBuilder, cx: number, cy: number, zc: number, r: number, c: Rgb, n = 14): void {
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2
    q.quad([[cx, cy, zc], [cx + Math.cos(a0) * r, cy + Math.sin(a0) * r, zc], [cx + Math.cos(a1) * r, cy + Math.sin(a1) * r, zc], [cx, cy, zc]],
      [0, 0, -1], UVS, c, 0)
  }
}

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  let h = 0
  block(q, -SLAB_HW, SLAB_HW, -SLAB_HD, SLAB_HD, y(0), y(SLAB_H), GREY_D); h += SLAB_H
  // grey plinth with the name band and side pilasters
  block(q, -PLINTH_HW, PLINTH_HW, -PLINTH_HD, PLINTH_HD, y(h), y(h + PLINTH_H), GREY)
  plaque(q, { x: 0, z: -PLINTH_HD, y0: y(h + 0.12), w: PLINTH_HW * 1.4, h: PLINTH_H - 0.24, panel: shade(GREY, 0.93), letters: shade(GREY, 0.7), lines: [0.55] })
  for (const sx of [-1, 1]) block(q, sx * (PLINTH_HW - 0.15) - 0.07, sx * (PLINTH_HW - 0.15) + 0.07, -PLINTH_HD - 0.03, -PLINTH_HD, y(h + 0.08), y(h + PLINTH_H - 0.08), shade(GREY, 1.05))
  h += PLINTH_H
  // dark moulded ledge (sarcophagus lid) with a small medallion on the front
  block(q, -LEDGE_HW, LEDGE_HW, -LEDGE_HD, LEDGE_HD, y(h), y(h + 0.12), shade(RED, 1.1))
  block(q, -LEDGE_HW + 0.06, LEDGE_HW - 0.06, -LEDGE_HD + 0.05, LEDGE_HD - 0.05, y(h + 0.12), y(h + LEDGE_H - 0.14), RED)
  block(q, -LEDGE_HW, LEDGE_HW, -LEDGE_HD, LEDGE_HD, y(h + LEDGE_H - 0.14), y(h + LEDGE_H), shade(RED, 1.15))
  disc(q, 0, y(h + 0.36), -LEDGE_HD + 0.0, 0.1, shade(CREAM, 0.9))
  h += LEDGE_H
  // the stele: ochre body, green border, central inscription panel, four portrait medallions
  block(q, -STELE_HW, STELE_HW, -STELE_HD, STELE_HD, y(h), y(h + STELE_H), OCHRE)
  const zf = -STELE_HD
  const fx0 = -STELE_HW + 0.35, fx1 = STELE_HW - 0.35   // the framed field sits between the two mourners
  block(q, fx0, fx1, zf - 0.02, zf, y(h + 0.1), y(h + STELE_H - 0.12), GREEN)
  block(q, fx0 + FRAME * 0.5, fx1 - FRAME * 0.5, zf - 0.03, zf - 0.02, y(h + 0.1 + FRAME * 0.5), y(h + STELE_H - 0.12 - FRAME * 0.5), shade(OCHRE, 1.02))
  plaque(q, { x: 0, z: zf - 0.03, y0: y(h + 0.5), w: 0.5, h: STELE_H - 1.0, panel: shade(OCHRE, 0.97), letters: shade(OCHRE, 0.7), lines: [0.8, 0.7, 0.8, 0.6, 0.75, 0.7] })
  for (const my of [h + 0.28, h + STELE_H - 0.3]) for (const sx of [-1, 1]) {
    disc(q, sx * MED_DX, y(my), zf - 0.035, MED_R, RING, 16)
    disc(q, sx * MED_DX, y(my), zf - 0.045, MED_R * 0.82, CREAM, 16)
    block(q, sx * MED_DX - 0.045, sx * MED_DX + 0.045, zf - 0.06, zf - 0.045, y(my - 0.09), y(my + 0.09), shade(CREAM, 0.82))  // the bust profile
  }
  // pedestals for the mourners, in front of the stele ends
  for (const sx of [-1, 1]) block(q, sx * MOURNER_X - PED_HW, sx * MOURNER_X + PED_HW, MOURNER_Z - PED_HD + 0.0, MOURNER_Z + PED_HD, y(h), y(h + PED_H), shade(OCHRE, 0.9))
  h += STELE_H
  // cornice, ornamented frieze, attic, capping slab
  block(q, -CORN_HW, CORN_HW, -CORN_HD, CORN_HD, y(h), y(h + CORN_H), shade(OCHRE, 1.04)); h += CORN_H
  const hCorn = h
  block(q, -FRIEZE_HW, FRIEZE_HW, -STELE_HD + 0.02, STELE_HD, y(h), y(h + FRIEZE_H), OCHRE)
  for (let i = 0; i < 7; i++) {
    const x = -FRIEZE_HW + 0.18 + i * ((2 * FRIEZE_HW - 0.36) / 6)
    block(q, x - 0.06, x + 0.06, -STELE_HD, -STELE_HD + 0.0 - 0.025, y(h + 0.07), y(h + FRIEZE_H - 0.07), shade(OCHRE, 0.78))
  }
  h += FRIEZE_H
  block(q, -CORN_HW + 0.05, CORN_HW - 0.05, -CORN_HD + 0.04, CORN_HD - 0.04, y(h), y(h + 0.14), shade(OCHRE, 1.06)); h += 0.14
  block(q, -ATT_HW, ATT_HW, -ATT_HD, ATT_HD, y(h), y(h + ATT_H), OCHRE)
  block(q, -0.3, 0.3, -ATT_HD - 0.05, -ATT_HD, y(h + 0.08), y(h + ATT_H - 0.1), shade(CREAM, 0.95))     // central relief field
  block(q, -0.14, 0.14, -ATT_HD - 0.09, -ATT_HD - 0.05, y(h + 0.14), y(h + ATT_H - 0.18), shade(CREAM, 0.8)) // relief mass
  h += ATT_H
  block(q, -ATT_HW - 0.06, ATT_HW + 0.06, -ATT_HD - 0.05, ATT_HD + 0.05, y(h), y(h + TOP_H), shade(OCHRE, 1.05))
  // small seated figures on the cornice corners: stand-in blocks
  for (const sx of [-1, 1]) {
    const cx = sx * (CORN_HW - 0.1)
    block(q, cx - 0.1, cx + 0.1, -0.16, 0.16, y(hCorn), y(hCorn + CORNER_FIG), CREAM)
  }
}

export function tombeDantan(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
