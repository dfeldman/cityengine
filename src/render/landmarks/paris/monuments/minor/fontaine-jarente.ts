import type { MeshBuilder } from '../../../../buildings.ts'
import { type Rgb } from '../../../../models.ts'
import { beam, block, hex, roof, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'
import { plaque } from './monument-kit.ts'

/*
 * THE FONTAINE DE JARENTE (also Fontaine Necker; rue de Jarente / impasse de la Poissonnerie, 4e; 1783, Wikidata Q1435786):
 * a little stone pavilion that closes the dead-end impasse, seen down it from the rue de Jarente — two rusticated pilasters
 * (courses of vermiculated blocks) carrying an entablature with a frieze and a cornice, a triangular pediment with a shell
 * cartouche, a stepped pyramid roof, and between the pilasters a sunk upper panel carrying the shell-and-scroll cartouche
 * relief, a plain inscription tablet, and below it a mask spout over a small stone trough. Frame: −z the front (down the
 * impasse), x across, y up, pavement at G. The end wall of the impasse (the host houses' face, OSM apartments ways 56045039 and
 * 1174634452) is NOT claimed: this model starts at z = WALL_Z and stands 0.6 m or more in front of it. The shell cartouche
 * is shallow relief, left procedural (owner's rule); the mask spout is a few centimetres of stone. Dimensions scaled off
 * Commons photographs (Fontaine de Jarente.jpg; ...vue éloignée.jpg) against the side doors (~2.2 m) and OSM's 4.7 m end
 * wall: not surveyed; the roof pyramid's heights are the shakiest.
 */
export const HX = 2.7
export const HZ = 1.6

// tunables
const WALL_Z = 1.0            // the host end wall's face
const SLAB_T = 0.6            // the pavilion's wall stands this far in front of it (clears shop boards)
const W = 2.25                // half-width of the pavilion's slab
const PIL_W = 0.5             // half the width of a pilaster
const PIL_PROUD = 0.22        // a pilaster stands this far in front of the slab
const PIL_TOP = 5.35
const ARCH_H = 0.35           // architrave
const FRIEZE_H = 0.4
const CORN_H = 0.3
const CORN_OUT = 0.3
const PED_H = 1.1
const PED_OUT = 0.5           // the pediment's depth
const STEPS: [number, number, number][] = [[1.55, 0.45, 0.85], [1.25, 0.4, 0.7], [0.95, 0.4, 0.55], [0.6, 0.3, 0.4]] // [half-width, height, half-depth] of the roof's stepped courses
const PANEL_W = 0.85          // half-width of the sunk panels
const TROUGH_Y = 0.55

const STONE: Rgb = hex('#cdbf9f')
const PALE: Rgb = hex('#ddd0b0')
const DARK: Rgb = hex('#a99d82')
const WATER: Rgb = hex('#6d93a0')
const FALL: Rgb = hex('#c4d8dc')
const LEAD: Rgb = hex('#6c6f6c')

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  const z0 = WALL_Z - SLAB_T           // the slab's front face
  const zp = z0 - PIL_PROUD            // a pilaster's front face
  const entY = PIL_TOP + ARCH_H + FRIEZE_H
  // the wall slab between the pilasters, with a plinth course and a foot
  block(q, -W, W, z0, WALL_Z, y(0), y(PIL_TOP), STONE)
  block(q, -W - 0.06, W + 0.06, zp - 0.05, WALL_Z, y(0), y(0.35), DARK)
  // pilasters: rusticated courses, each block a little proud of the last
  for (const sx of [-1, 1]) {
    const xc = sx * (W - PIL_W)
    const x0 = xc - PIL_W, x1 = xc + PIL_W
    let yy = 0.35, i = 0
    while (yy < PIL_TOP - 0.02) {
      const h = Math.min(i % 2 ? 0.55 : 0.42, PIL_TOP - yy)
      block(q, x0, x1, zp, z0 + 0.02, y(yy), y(yy + h - 0.04), i % 2 ? shade(STONE, 0.97) : shade(STONE, 1.03))
      block(q, x0 + 0.08, x1 - 0.08, zp - 0.025, zp, y(yy + 0.05), y(yy + h - 0.1), shade(PALE, 0.98 + (i % 3) * 0.02))
      yy += h; i++
    }
    block(q, x0 - 0.05, x1 + 0.05, zp - 0.06, z0, y(PIL_TOP - 0.15), y(PIL_TOP), PALE)
  }
  // entablature: architrave, frieze, a projecting cornice
  block(q, -W - 0.05, W + 0.05, zp - 0.04, WALL_Z, y(PIL_TOP), y(PIL_TOP + ARCH_H), PALE)
  block(q, -W, W, z0 - 0.03, WALL_Z, y(PIL_TOP + ARCH_H), y(entY), shade(STONE, 0.94))
  for (let i = 0; i < 9; i++) {         // the frieze's carved bands: shallow lozenges
    const x = -W + 0.45 + i * ((2 * W - 0.9) / 8)
    block(q, x - 0.17, x + 0.17, z0 - 0.06, z0 - 0.03, y(PIL_TOP + ARCH_H + 0.07), y(entY - 0.07), shade(PALE, 0.96))
  }
  block(q, -W - CORN_OUT, W + CORN_OUT, zp - CORN_OUT, WALL_Z, y(entY), y(entY + CORN_H), PALE)
  // pediment with its shell cartouche, then the stepped pyramid over it
  const py = entY + CORN_H
  roof(q, -W - 0.1, W + 0.1, z0 - PED_OUT * 0.6, WALL_Z, y(py), PED_H, W + 0.1, 0, shade(STONE, 1.02))
  cartouche(q, 0, z0 - PED_OUT * 0.6, y(py + 0.1), 0.4, 0.5)
  let sy = py + PED_H * 0.55
  for (const [hw, h, hd] of STEPS) {
    block(q, -hw, hw, WALL_Z - hd * 1.2, WALL_Z, y(sy), y(sy + h), shade(STONE, 1.0 - (sy % 0.2)))
    block(q, -hw - 0.05, hw + 0.05, WALL_Z - hd * 1.2 - 0.05, WALL_Z, y(sy + h - 0.06), y(sy + h), PALE)
    sy += h
  }
  roof(q, -0.45, 0.45, WALL_Z - 0.55, WALL_Z, y(sy), 0.5, 0.45, 0, shade(STONE, 0.9))
  block(q, -0.09, 0.09, WALL_Z - 0.3, WALL_Z - 0.12, y(sy + 0.5), y(sy + 0.9), PALE)

  // the sunk panels between the pilasters: upper cartouche panel, plain tablet, the mask panel
  const inner = W - 2 * PIL_W
  void inner
  block(q, -PANEL_W - 0.1, PANEL_W + 0.1, z0 - 0.06, z0, y(4.1), y(5.15), PALE)
  block(q, -PANEL_W, PANEL_W, z0 - 0.07, z0 - 0.06, y(4.18), y(5.07), shade(STONE, 0.9))
  cartouche(q, 0, z0 - 0.07, y(4.2), 0.78, 0.85)
  plaque(q, { x: 0, z: z0, y0: y(2.0), w: 1.5, h: 1.75, panel: shade(PALE, 1.03), frame: DARK, fw: 0.08, letters: shade(STONE, 0.6), lines: [0.7, 0.8, 0.75, 0.8, 0.6, 0.75, 0.7] })
  // mask spout, a little sheet of water and the trough (a stone cuvette in front of the wall, over the paved gutter)
  const mz = z0 - 0.05
  block(q, -0.14, 0.14, mz - 0.12, mz + 0.05, y(1.15), y(1.43), LEAD)
  block(q, -0.07, 0.07, mz - 0.17, mz - 0.1, y(1.2), y(1.3), shade(LEAD, 0.8))
  beam(q, [0, y(1.2), mz - 0.17], [0, y(TROUGH_Y + 0.12), mz - 0.3], 0.025, FALL)
  block(q, -0.7, 0.7, z0 - 0.55, z0 + 0.02, y(0.35), y(TROUGH_Y), shade(STONE, 0.95))
  block(q, -0.62, 0.62, z0 - 0.47, z0, y(TROUGH_Y - 0.01), y(TROUGH_Y + 0.02), WATER)
  block(q, -0.75, 0.75, z0 - 0.6, z0 - 0.5, y(TROUGH_Y), y(TROUGH_Y + 0.08), PALE)
}

/** A shell-and-scroll cartouche in shallow relief: a rosette boss, four shells (top, bottom, left, right), seen from −z. `w` × `h` overall, from y0, centred at x on the face z. */
function cartouche(q: MeshBuilder, x: number, z: number, y0: number, w: number, h: number): void {
  const yc = y0 + h / 2
  const c = shade(PALE, 0.97)
  block(q, x - w * 0.14, x + w * 0.14, z - 0.06, z, yc - h * 0.14, yc + h * 0.14, shade(DARK, 1.05))
  block(q, x - w * 0.07, x + w * 0.07, z - 0.09, z - 0.05, yc - h * 0.07, yc + h * 0.07, c)
  // top and bottom shells: a fan as a flat roof wedge; sides likewise
  roof(q, x - w * 0.24, x + w * 0.24, z - 0.07, z, yc + h * 0.14, h * 0.28, w * 0.1, 0, c)
  roof(q, x - w * 0.24, x + w * 0.24, z - 0.07, z, yc - h * 0.14 - h * 0.01, -h * 0.28, w * 0.1, 0, c)
  block(q, x - w * 0.46, x - w * 0.14, z - 0.06, z, yc - h * 0.17, yc + h * 0.17, c)
  block(q, x + w * 0.14, x + w * 0.46, z - 0.06, z, yc - h * 0.17, yc + h * 0.17, c)
  block(q, x - w * 0.46, x - w * 0.36, z - 0.075, z - 0.05, yc - h * 0.3, yc + h * 0.3, shade(c, 1.04))
  block(q, x + w * 0.36, x + w * 0.46, z - 0.075, z - 0.05, yc - h * 0.3, yc + h * 0.3, shade(c, 1.04))
}

export function fontaineJarente(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
