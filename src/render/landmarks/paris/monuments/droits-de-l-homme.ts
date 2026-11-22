import type { MeshBuilder } from '../../../buildings.ts'
import { block, hex, shade, type Rgb } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { fitted } from '../palaces/common.ts'
import { G, batteredTower, drumPedestal, firePot, obelisk } from './monument-kit.ts'

/*
 * THE MONUMENT DES DROITS DE L'HOMME (Champ de Mars, Avenue Charles-Risler; Michel Jantzen architect, Ivan Theimer sculptor,
 * 1989; Wikidata Q3323344): a mastaba-like tower of dressed limestone on a square plan, battered walls and a heavy stepped
 * cornice (inside, an octagonal room open to the sky), on a two-step podium; two thin bronze obelisks (one square, one
 * triangular, gilt tips) stand against the south-west face; bronze fire pots at the podium's corners; the bronze figures
 * (a woman with a child and a man, and a toga-clad man) on verdigris drums are Modly models (statues manifest). The back
 * (north-east, rue de Belgrade) has the bronze door; the side faces the twelve EC seal stones.
 * Frame: front (−z) the south-west face toward the Champ de Mars (bearing 223), y up from the base, pavement at G.
 * Podium 14.5 m square from OSM way 369434380 (osmium, 2026-11-22); the tower's size and height, the obelisks (~14 m)
 * and the figures' places are scaled off one wide photograph (de.wikipedia "Monuments de Droits d'Homme") against the
 * figures and people, not surveyed.
 */
export const HX = 7.5
export const HZ = 7.5

// tunables
const PODIUM = 7.25          // half-width of the podium
const STEP_H = 0.3           // each of its two steps
const TOWER_H0 = 3.9         // half-width of the tower at its foot
const TOWER_H1 = 3.4         // … and under the cornice
const TOWER_Y = 11.2         // height of the shaft above the podium
const CORNICE = [[3.85, 0.55], [4.15, 0.35], [3.95, 0.35]] as const   // [half-width, rise] from the shaft up
const OBELISK_Z = -4.6       // in front of the face
const OBELISK_X = 1.75
const OBELISK_H = 14.0
const POT_AT = 6.45
const FIG_GROUP: [number, number] = [-4.2, -5.9]
const FIG_TOGA: [number, number] = [4.7, -3.9]

const STONE: Rgb = hex('#cbbb97')
const CORNICE_C: Rgb = hex('#a39573')
const PODIUM_C: Rgb = hex('#b9b5a8')
const BRONZE: Rgb = hex('#2c2a22')
const GILT: Rgb = hex('#c9a640')
const VERDIGRIS: Rgb = hex('#78a28c')
const TRIM: Rgb = hex('#3a3a34')

export function droitsDeLHomme(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

/** where the figures' feet stand (landmark frame, y above the base): for the statues manifest */
export const FIGURE_AT = {
  group: [FIG_GROUP[0], G + 2 * STEP_H + 0.95, FIG_GROUP[1]],
  toga: [FIG_TOGA[0], G + 2 * STEP_H + 0.95, FIG_TOGA[1]],
}

function draw(out: MeshBuilder): void {
  const y0 = G
  // the podium: two steps all round and, on the front, a flight of three narrower steps into the middle
  block(out, -PODIUM, PODIUM, -PODIUM, PODIUM, y0 - 0.1, y0 + STEP_H, PODIUM_C)
  block(out, -PODIUM + 0.45, PODIUM - 0.45, -PODIUM + 0.45, PODIUM - 0.45, y0 + STEP_H, y0 + 2 * STEP_H, shade(PODIUM_C, 1.04))
  for (let i = 0; i < 3; i++) block(out, -1.6, 1.6, -PODIUM - 0.5 + i * 0.17, -PODIUM + 0.5, y0, y0 + 0.1 * (i + 1) * 2, shade(PODIUM_C, 0.97 + 0.01 * i))
  const top = y0 + 2 * STEP_H

  // the tower
  const ty1 = top + TOWER_Y
  batteredTower(out, 0, 0, top, ty1, TOWER_H0, TOWER_H1, STONE, 0.9)
  let y = ty1
  for (const [hw, rise] of CORNICE) { block(out, -hw, hw, -hw, hw, y, y + rise, CORNICE_C); y += rise }
  // the back door (north-east), bronze, in a plain surround, and the oculus over it
  block(out, -1.1, 1.1, TOWER_H0 - 0.02, TOWER_H0 + 0.1, top, top + 3.4, shade(STONE, 0.88))
  block(out, -0.8, 0.8, TOWER_H0 + 0.1, TOWER_H0 + 0.16, top, top + 3.1, BRONZE)
  block(out, -0.45, 0.45, TOWER_H0 - 0.15, TOWER_H0 + 0.1, top + 5.6, top + 6.5, BRONZE)
  // the front: the masonic triangle high up, the cut inscription, and the sundial box at the top corner
  const fz = -(TOWER_H0 + (TOWER_H1 - TOWER_H0) * 0.5)
  block(out, -0.6, 0.6, fz - 0.12, fz, top + 8.6, top + 9.0, shade(STONE, 0.78))
  block(out, -0.4, 0.4, fz - 0.12, fz, top + 9.0, top + 9.4, shade(STONE, 0.78))
  block(out, -0.2, 0.2, fz - 0.12, fz, top + 9.4, top + 9.8, shade(STONE, 0.78))
  block(out, -1.4, 1.4, fz - 0.06, fz, top + 4.2, top + 6.4, shade(STONE, 0.9))
  block(out, TOWER_H1 - 0.2, TOWER_H1 + 1.0, fz - 0.3, fz + 0.3, top + 8.4, top + 9.5, shade(STONE, 0.9))
  // the twelve EC seals: bronze square seals in slabs, six on each side face
  for (const sx of [-1, 1]) for (let i = 0; i < 6; i++) {
    const zc = -2.7 + i * 1.08
    const h = 3.45
    block(out, sx > 0 ? h : -h - 0.12, sx > 0 ? h + 0.12 : -h, zc - 0.35, zc + 0.35, top + 3.1, top + 3.9, shade(STONE, 0.82))
    block(out, sx > 0 ? h + 0.12 : -h - 0.18, sx > 0 ? h + 0.18 : -h - 0.12, zc - 0.22, zc + 0.22, top + 3.25, top + 3.75, BRONZE)
  }

  // the two bronze obelisks against the front: a square one and a triangular one, on stone feet, gilt at the tip
  const foot = (x: number): void => {
    block(out, x - 0.7, x + 0.7, OBELISK_Z - 0.7, OBELISK_Z + 0.7, top, top + 0.5, shade(STONE, 0.85))
  }
  foot(-OBELISK_X); foot(OBELISK_X)
  obelisk(out, -OBELISK_X, OBELISK_Z, top + 0.5, top + OBELISK_H, { w0: 0.85, w1: 0.38, sides: 4, c: BRONZE, tip: 0.9, tipC: GILT })
  obelisk(out, OBELISK_X, OBELISK_Z, top + 0.5, top + OBELISK_H + 0.5, { w0: 1.0, w1: 0.45, sides: 3, c: BRONZE, tip: 0.9, tipC: GILT, turn: Math.PI })
  // their bands of reliefs and text: thin lighter rings every 1.4 m
  for (let k = 1; k < 9; k++) {
    const yy = top + 0.5 + k * 1.45
    const f = 1 - (yy - top - 0.5) / OBELISK_H
    const wa = (0.38 + (0.85 - 0.38) * f) / 2 + 0.015
    block(out, -OBELISK_X - wa, -OBELISK_X + wa, OBELISK_Z - wa, OBELISK_Z + wa, yy, yy + 0.07, shade(BRONZE, 1.5))
  }

  // the fire pots at the podium's front corners, and the drums the figures stand on
  for (const sx of [-1, 1]) firePot(out, sx * POT_AT, -POT_AT, top, { stone: shade(PODIUM_C, 0.95), bronze: BRONZE })
  for (const [x, z] of [FIG_GROUP, FIG_TOGA]) drumPedestal(out, x, z, top, { r: 0.8, h: 0.75, drum: VERDIGRIS, trim: TRIM })
}
