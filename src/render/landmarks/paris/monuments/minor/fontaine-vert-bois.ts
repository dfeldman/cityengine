import type { MeshBuilder } from '../../../../buildings.ts'
import { type Rgb } from '../../../../models.ts'
import { beam, block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'
import { plaque } from './monument-kit.ts'

/*
 * THE FONTAINE DU VERT-BOIS (rue Saint-Martin at the rue du Vertbois, 3e; 1712, restored 1882; Wikidata Q3076291): a wall
 * fountain that is a stone portal against the foot of the Saint-Martin-des-Champs priory tower (CNAM) — two rusticated
 * pilasters of vermiculated courses on a plain plinth, between them a carved relief (the tableau), the bronze inscription
 * plaque, a small shell and, low down, the bronze mascaron spout over a drain; an architrave, frieze and cornice; and on
 * the cornice a block carrying the sculpted cartouche of the arms with scrolls (a Modly model: statues manifest
 * `vertbois-crown`; the mascaron `vertbois-mascaron`). Frame: −z the front, x across, y up, pavement at G (the loader sinks it).
 * The fountain polygon (OSM way 54964126, amenity=fountain, not a building) is claimed; the tower and the apartments
 * behind are separate ways. Dimensions scaled off Commons photos (Fontaine du Vertbois, Paris 3.jpg; ...Paris 19
 * November 2016) at ~80 px/m from the pilaster width ~0.9 m and OSM's ~4 m footprint: not surveyed; heights are the
 * shakiest. The tableau and the little shell are shallow relief, kept procedural.
 */
export const HX = 2.1
export const HZ = 1.0

// tunables
const WALL_Z = 0.9            // the tower's face behind
const SLAB_T = 0.8            // depth of the portal body
const W = 1.75                // half-width of the body
const PIL_W = 0.85            // width of a pilaster
const PIL_PROUD = 0.1
const PLINTH_H = 0.55
const SOCLE_H = 1.35          // the plain lower wall between the pilasters rises to here
const COURSE = 0.4            // a vermiculated course
const PIL_TOP = 4.75
const ARCH_H = 0.3
const FRIEZE_H = 0.25
const CORN_H = 0.2
const CORN_OUT = 0.4
const CROWN_H = 0.25          // the block under the cartouche
export const CARTOUCHE_Y = PIL_TOP + ARCH_H + FRIEZE_H + CORN_H + CROWN_H  // where the crown's model stands (above the pavement)
export const MASK_Y = 0.8     // underside of the mascaron
export const MASK_Z = -0.02   // its back plane, in front of the plain face

const STONE: Rgb = hex('#cfc4a6')
const PALE: Rgb = hex('#ddd3b8')
const DARK: Rgb = hex('#a89c80')
const GREY: Rgb = hex('#b0a99a')
const VERM: Rgb = hex('#9d9378')
const BRONZE: Rgb = hex('#26292a')
const LETTERS: Rgb = hex('#9a9684')

/** Attach point of the crown cartouche (landmark frame: y includes G) */
export const CROWN_AT: [number, number, number] = [0, G + CARTOUCHE_Y, 0.0]
/** Attach point of the mascaron */
export const MASK_AT: [number, number, number] = [0, G + MASK_Y, -0.18]

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  const z0 = WALL_Z - SLAB_T            // body front face
  const zp = z0 - PIL_PROUD             // pilaster face
  // the body, plinth, and lower grey soubassement between the pilasters
  block(q, -W, W, z0, WALL_Z, y(0), y(PIL_TOP), STONE)
  block(q, -W - 0.08, W + 0.08, zp - 0.04, WALL_Z, y(0), y(PLINTH_H), DARK)
  block(q, -W + PIL_W, W - PIL_W, z0 - 0.03, z0, y(PLINTH_H), y(SOCLE_H), GREY)
  for (const yy of [0.95]) block(q, -W + PIL_W, W - PIL_W, z0 - 0.035, z0 - 0.025, y(yy), y(yy) + 0.03, shade(GREY, 0.75))
  // pilasters: courses of vermiculated blocks, each with a darker sunk pocket
  for (const sx of [-1, 1]) {
    const xc = sx * (W - PIL_W / 2)
    let yy = PLINTH_H
    let i = 0
    while (yy + COURSE <= PIL_TOP + 0.001) {
      const x0 = xc - PIL_W / 2, x1 = xc + PIL_W / 2
      block(q, x0, x1, zp, z0, y(yy + 0.015), y(yy + COURSE - 0.015), i % 2 ? shade(STONE, 1.03) : STONE)
      block(q, xc - 0.28, xc + 0.28, zp - 0.025, zp, y(yy + 0.08), y(yy + COURSE - 0.08), VERM)
      yy += COURSE
      i++
    }
    block(q, xc - PIL_W / 2 - 0.04, xc + PIL_W / 2 + 0.04, zp - 0.03, z0, y(PIL_TOP - 0.06), y(PIL_TOP), PALE)
  }
  // the relief tableau between the pilasters (a framed sunk panel with a few raised masses)
  const iw = W - PIL_W
  block(q, -iw + 0.1, iw - 0.1, z0 - 0.06, z0, y(3.55), y(4.6), PALE)
  block(q, -iw + 0.2, iw - 0.2, z0 - 0.09, z0 - 0.06, y(3.65), y(4.5), shade(STONE, 0.9))
  block(q, -0.5, 0.5, z0 - 0.13, z0 - 0.09, y(3.7), y(4.05), shade(STONE, 1.02))
  block(q, -0.15, 0.15, z0 - 0.15, z0 - 0.09, y(4.05), y(4.4), shade(STONE, 1.05))
  block(q, -0.7, -0.3, z0 - 0.12, z0 - 0.09, y(4.0), y(4.35), STONE)
  block(q, 0.3, 0.7, z0 - 0.12, z0 - 0.09, y(4.0), y(4.3), STONE)
  // the inscription plaque and the ledge under the tableau
  block(q, -iw + 0.05, iw - 0.05, z0 - 0.1, z0, y(3.35), y(3.55), PALE)
  plaque(q, { x: 0, z: z0 - 0.03, y0: y(2.15), w: 1.5, h: 1.1, panel: BRONZE, frame: DARK, fw: 0.06, letters: LETTERS, lines: [0.35, 0.8, 0.95, 0.75, 0.9, 0.6, 0.85, 0.7] })
  // the little shell under the plaque and its two bosses
  for (let i = 0; i <= 8; i++) {
    const a = (i / 8) * Math.PI
    beam(q, [0, y(1.5), z0 - 0.05], [Math.cos(a) * 0.3, y(1.5 + Math.sin(a) * 0.27), z0 - 0.06], 0.018, shade(STONE, 1.04))
  }
  block(q, -0.3, 0.3, z0 - 0.06, z0 - 0.03, y(1.46), y(1.52), PALE)
  for (const sx of [-1, 1]) block(q, sx * 0.62 - 0.07, sx * 0.62 + 0.07, z0 - 0.06, z0 - 0.02, y(1.5), y(1.63), PALE)
  // two round brass bosses (the old taps) flanking the mascaron, a sill and the drain grate below
  for (const sx of [-1, 1]) block(q, sx * 0.62 - 0.05, sx * 0.62 + 0.05, z0 - 0.08, z0 - 0.03, y(1.27), y(1.37), shade(BRONZE, 1.6))
  block(q, -0.3, 0.3, z0 - 0.16, z0 - 0.02, y(0.45), y(0.8), shade(GREY, 0.9))
  block(q, -0.32, 0.32, zp - 0.28, zp + 0.1, y(0), y(0.04), BRONZE)
  // entablature: architrave, frieze, cornice, and the block under the cartouche
  block(q, -W - 0.1, W + 0.1, zp - 0.12, WALL_Z, y(PIL_TOP), y(PIL_TOP + ARCH_H), PALE)
  block(q, -W - 0.08, W + 0.08, zp - 0.1, WALL_Z, y(PIL_TOP + ARCH_H), y(PIL_TOP + ARCH_H + FRIEZE_H), shade(STONE, 0.95))
  const cy = PIL_TOP + ARCH_H + FRIEZE_H
  block(q, -W - 0.3, W + 0.3, z0 - CORN_OUT, WALL_Z, y(cy), y(cy + CORN_H), PALE)
  block(q, -1.5, 1.5, z0 - 0.3, WALL_Z - 0.1, y(cy + CORN_H), y(cy + CORN_H + CROWN_H), STONE)
}

export function fontaineVertBois(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
