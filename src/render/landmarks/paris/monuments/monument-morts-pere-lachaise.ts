import type { MeshBuilder } from '../../../buildings.ts'
import type { Rgb } from '../../../models.ts'
import { block, hex, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { fitted } from '../palaces/common.ts'
import { G } from './plaza-common.ts'
import { plaque } from './monument-kit.ts'

/*
 * LE MONUMENT AUX MORTS DU PÈRE-LACHAISE (Albert Bartholomé, 1895-99; Wikidata Q3323309; OSM way 311412497 tagged width 14.1,
 * height 8): a pale limestone mausoleum front at the top of the Avenue Principale steps, ahead of the underground ossuary.
 * A central block carries a tall doorway (the couple walking into the tomb, backs to us: Modly `pere-couple`), a ledge with
 * a mourning group each side (Modly `pere-gauche`, `pere-droite`; the living on the left, the dead on the right) and
 * under it a sunk panel with the recumbent dead (shallow relief, procedural). Low wings with bronze doors flank it,
 * each reached by a flight of steps. Frame: −z the front (the plaza and steps), x across, y up from the pavement (G).
 * Dimensions are scaled by eye off Commons photographs against the OSM width (14.1 m), not surveyed.
 */
export const HX = 7.05
export const HZ = 4.0

// tunables (metres above the pavement)
const BODY_HW = 4.2, FRONT_Z = -1.5, BACK_Z = 2.0         // central block half-width, lower front plane, back
const LEDGE_Y1 = 3.0, LEDGE_OUT = 0.14                    // the ledge the groups stand on, and how far it projects
const UP_FRONT_Z = -0.8                                   // the upper wall's face (groups stand between this and the ledge edge)
const TOP_Y = 6.0, CORN_H = 0.18, CORN_OUT = 0.14
const DOOR_HW = 0.85, DOOR_Y1 = 5.4, DOOR_BACK_Z = -0.1, FRAME_W = 0.3, LINTEL_Y1 = 5.75
const WING_X1 = 6.6, WING_TOP = 5.3                       // wings: from BODY_HW out to this
const WDOOR_X0 = 5.0, WDOOR_X1 = 6.0, WDOOR_Y0 = 1.7, WDOOR_Y1 = 3.5
const STAIR_RISE = 0.16, STAIR_RUN = 0.36, STAIR_N = 10, STAIR_X0 = 4.4, STAIR_X1 = 6.9
const PANEL_HW = 1.45, PANEL_Y0 = 0.7, PANEL_Y1 = 2.3
export const COUPLE_AT: [number, number, number] = [0, G, -0.45]
export const LEFT_AT: [number, number, number] = [-2.6, G + LEDGE_Y1, -1.0]
export const RIGHT_AT: [number, number, number] = [2.5, G + LEDGE_Y1, -1.0]

const STONE: Rgb = hex('#bab5a6')
const PALE: Rgb = hex('#c6c1b2')
const DARK: Rgb = hex('#8f8b7e')
const TREAD: Rgb = hex('#a8a496')
const VOID: Rgb = hex('#1d1c1b')
const BRONZE: Rgb = hex('#4a5446')
const BED: Rgb = hex('#7a6a58')
const FLOWER: Rgb = hex('#a04258')
const PAVE: Rgb = hex('#aaa699')

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  // paved plaza in front, with the flower bed along the ledge
  block(q, -HX - 1.2, HX + 1.2, -HZ - 1.0, FRONT_Z, G - 0.01, G + 0.03, PAVE)
  block(q, -3.6, 3.6, FRONT_Z - 0.75, FRONT_Z - 0.2, G, G + 0.2, BED)
  for (let i = 0; i < 9; i++) block(q, -3.4 + i * 0.8, -3.0 + i * 0.8, FRONT_Z - 0.7, FRONT_Z - 0.3, G + 0.2, G + 0.28, i % 3 === 1 ? FLOWER : hex('#d2b04a'))
  // central lower mass, ledge, upper wall
  block(q, -BODY_HW, BODY_HW, FRONT_Z, BACK_Z, y(0), y(0.35), DARK)
  block(q, -BODY_HW, BODY_HW, FRONT_Z + 0.04, BACK_Z, y(0.35), y(LEDGE_Y1), STONE)
  block(q, -BODY_HW - 0.02, BODY_HW + 0.02, FRONT_Z - LEDGE_OUT, BACK_Z, y(LEDGE_Y1), y(LEDGE_Y1 + 0.15), PALE)
  // upper wall in pieces round the doorway opening (a real recess: the couple stands in it)
  const U0 = LEDGE_Y1 + 0.15
  block(q, -BODY_HW, -DOOR_HW, UP_FRONT_Z, BACK_Z, y(U0), y(TOP_Y), STONE)
  block(q, DOOR_HW, BODY_HW, UP_FRONT_Z, BACK_Z, y(U0), y(TOP_Y), STONE)
  block(q, -DOOR_HW, DOOR_HW, UP_FRONT_Z, BACK_Z, y(DOOR_Y1), y(TOP_Y), STONE)
  block(q, -DOOR_HW, DOOR_HW, DOOR_BACK_Z, BACK_Z, y(U0), y(DOOR_Y1), VOID)
  block(q, -BODY_HW - CORN_OUT, BODY_HW + CORN_OUT, UP_FRONT_Z - CORN_OUT, BACK_Z, y(TOP_Y), y(TOP_Y + CORN_H), PALE)
  // doorway: frame, black recess, sill
  const fz = UP_FRONT_Z - 0.06
  block(q, -DOOR_HW - FRAME_W, -DOOR_HW, fz, UP_FRONT_Z, y(LEDGE_Y1 + 0.15), y(LINTEL_Y1), PALE)
  block(q, DOOR_HW, DOOR_HW + FRAME_W, fz, UP_FRONT_Z, y(LEDGE_Y1 + 0.15), y(LINTEL_Y1), PALE)
  block(q, -DOOR_HW - FRAME_W, DOOR_HW + FRAME_W, fz, UP_FRONT_Z, y(DOOR_Y1), y(LINTEL_Y1), PALE)
  // inscription band over the door
  plaque(q, { x: 0, z: fz - 0.0, y0: y(LINTEL_Y1 + 0.05), w: 2.2, h: 0.18, panel: shade(PALE, 1.02), letters: shade(STONE, 0.45), lines: [0.9] })
  // the sunk panel under the ledge (the recumbent dead: shallow, procedural)
  const pz = FRONT_Z + 0.04
  block(q, -PANEL_HW - 0.1, PANEL_HW + 0.1, pz - 0.05, pz, y(PANEL_Y0 - 0.1), y(PANEL_Y1 + 0.1), PALE)
  block(q, -PANEL_HW, PANEL_HW, pz - 0.02, pz - 0.001, y(PANEL_Y0), y(PANEL_Y1), shade(STONE, 0.9))
  block(q, -0.9, 0.5, pz - 0.1, pz - 0.02, y(PANEL_Y0 + 0.15), y(PANEL_Y0 + 0.4), DARK)       // the dead, lying
  block(q, -0.25, 0.1, pz - 0.14, pz - 0.02, y(PANEL_Y0 + 0.4), y(PANEL_Y0 + 1.0), DARK)     // the one rising
  // wings, bronze doors and their stair flights
  for (const s of [-1, 1]) {
    const x0 = s > 0 ? BODY_HW : -WING_X1, x1 = s > 0 ? WING_X1 : -BODY_HW
    block(q, x0, x1, UP_FRONT_Z, BACK_Z - 0.4, y(0), y(WING_TOP), STONE)
    block(q, x0 - (s < 0 ? CORN_OUT : 0), x1 + (s > 0 ? CORN_OUT : 0), UP_FRONT_Z - CORN_OUT, BACK_Z - 0.4, y(WING_TOP), y(WING_TOP + CORN_H), PALE)
    const dx0 = s * WDOOR_X0, dx1 = s * WDOOR_X1, lo = Math.min(dx0, dx1), hi = Math.max(dx0, dx1)
    block(q, lo - 0.12, hi + 0.12, UP_FRONT_Z - 0.08, UP_FRONT_Z, y(WDOOR_Y0 - 0.1), y(WDOOR_Y1 + 0.12), PALE)
    block(q, lo, hi, UP_FRONT_Z - 0.1, UP_FRONT_Z - 0.04, y(WDOOR_Y0), y(WDOOR_Y1), BRONZE)
    // flight of steps up toward the door, treads across x
    const sx0 = Math.min(s * STAIR_X0, s * STAIR_X1), sx1 = Math.max(s * STAIR_X0, s * STAIR_X1)
    for (let i = 0; i < STAIR_N; i++) {
      const z1 = UP_FRONT_Z - (STAIR_N - 1 - i) * STAIR_RUN
      block(q, sx0, sx1, z1 - STAIR_RUN, i === STAIR_N - 1 ? UP_FRONT_Z : z1, y(0), y((i + 1) * STAIR_RISE), shade(TREAD, 1 - 0.015 * i))
    }
    // retaining kerb on the outer side of the flight
    block(q, s > 0 ? sx1 : sx0 - 0.3, s > 0 ? sx1 + 0.3 : sx0, UP_FRONT_Z - STAIR_N * STAIR_RUN, UP_FRONT_Z, y(0), y(STAIR_N * STAIR_RISE + 0.4), STONE)
  }
}

export function monumentMortsPereLachaise(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
