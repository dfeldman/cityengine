import type { MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { basin, G } from '../plaza-common.ts'

/*
 * THE MONUMENT À EUGÈNE DELACROIX (Jardin du Luxembourg, Dalou, 1890; OSM way 62848407, Wikidata Q18191182): a tall stone
 * pedestal carrying the painter's bronze bust and a palm, three bronze figures (Time, Glory and the Genius of the Arts) at
 * its foot on a three-step stage, in a long basin backed by a stone wall. Frame: the wall at +z, the open front of the
 * basin toward -z; y up from the base, pavement at G. The basin is OSM's 9.8 x 5.2 m; the stage, pedestal and heights are
 * estimated off Commons photographs (the 0.8 m bust and the 2.6 m group are Modly models: statues manifest delacroix-*).
 */
export const R = 4.9

// tunables
const HX = 4.9               // basin half-width (OSM 9.8 m)
const HZ = 2.6               // half-depth
const CHAMFER = 1.0          // the front corners cut
const RIM = 0.42             // the basin wall's thickness
const WALL_H = 0.55          // basin wall above the pavement
const BACK_H = 1.15          // the back wall's height
const BACK_T = 0.5
const STEPS: [number, number, number][] = [[2.15, 1.45, 0.2], [1.8, 1.2, 0.2], [1.5, 1.0, 0.2]]  // half-width, half-depth, height
const STAGE_Z = 0.55         // the stage's centre toward the back wall
const PLINTH_H = 0.5         // the block the figures kneel on
const PED_BASE: [number, number, number] = [0.85, 0.6, 0.55]   // half-width, half-depth, height
const SHAFT: [number, number, number, number] = [0.62, 0.42, 0.52, 0.36]  // foot hw/hd, top hw/hd
const SHAFT_H = 2.5
const CORN_H = 0.3
const SOCLE_H = 0.25

const STONE: Rgb = hex('#c4bda9')
const KERB: Rgb = hex('#b3ad9d')
const WATER: Rgb = hex('#58727a')
const BRONZE: Rgb = hex('#4f7a68')

/** where the bust and the figures stand (landmark frame): for the statues manifest */
const stageTop = G + WALL_H * 0.4 + STEPS.reduce((a, s) => a + s[2], 0)
export const GROUP_AT: [number, number, number] = [0, stageTop + PLINTH_H, STAGE_Z - 0.35]
export const BUST_AT: [number, number, number] = [0, stageTop + PLINTH_H + PED_BASE[2] + SHAFT_H + CORN_H + SOCLE_H, STAGE_Z + 0.1]

function draw(q: MeshBuilder): void {
  const plan = [
    { x: -HX, z: HZ }, { x: HX, z: HZ }, { x: HX, z: -HZ + CHAMFER }, { x: HX - CHAMFER, z: -HZ },
    { x: -HX + CHAMFER, z: -HZ }, { x: -HX, z: -HZ + CHAMFER },
  ]
  const inner = [
    { x: -HX + RIM, z: HZ - BACK_T }, { x: HX - RIM, z: HZ - BACK_T }, { x: HX - RIM, z: -HZ + CHAMFER },
    { x: HX - CHAMFER, z: -HZ + RIM }, { x: -HX + CHAMFER, z: -HZ + RIM }, { x: -HX + RIM, z: -HZ + CHAMFER },
  ]
  basin(q, plan, inner, 0, G + WALL_H, KERB, WATER)
  // the back wall with a coping, and its low panels
  block(q, -HX, HX, HZ - BACK_T, HZ, G, G + BACK_H, STONE)
  block(q, -HX - 0.06, HX + 0.06, HZ - BACK_T - 0.06, HZ + 0.06, G + BACK_H, G + BACK_H + 0.12, shade(STONE, 1.06))
  for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) {
    const x = sx * (2.7 + i * 0.52)
    block(q, x - 0.2, x + 0.2, HZ - BACK_T - 0.02, HZ - BACK_T, G + 0.3, G + BACK_H - 0.3, shade(STONE, 0.93))
  }
  // the three-step stage
  let y = G + WALL_H * 0.4
  for (const [hw, hd, h] of STEPS) {
    block(q, -hw, hw, STAGE_Z - hd, STAGE_Z + hd, y, y + h, shade(STONE, 1 - 0.03 * (y - G)))
    y += h
  }
  // the plinth and the pedestal
  block(q, -1.25, 1.25, STAGE_Z - 0.85, STAGE_Z + 0.7, y, y + PLINTH_H, shade(STONE, 1.03))
  y += PLINTH_H
  const [bw, bd, bh] = PED_BASE
  const cz = STAGE_Z + 0.1
  block(q, -bw, bw, cz - bd, cz + bd, y, y + bh, shade(STONE, 1.04))
  block(q, -bw - 0.1, bw + 0.1, cz - bd - 0.1, cz + bd + 0.1, y, y + 0.12, shade(STONE, 0.96))
  y += bh
  const n = 6
  for (let i = 0; i < n; i++) {   // the shaft tapers: stacked slices
    const t0 = i / n, t1 = (i + 1) / n
    const w = (t: number) => SHAFT[0] + (SHAFT[2] - SHAFT[0]) * t
    const d = (t: number) => SHAFT[1] + (SHAFT[3] - SHAFT[1]) * t
    block(q, -w((t0 + t1) / 2), w((t0 + t1) / 2), cz - d((t0 + t1) / 2), cz + d((t0 + t1) / 2), y + SHAFT_H * t0, y + SHAFT_H * t1, STONE)
  }
  y += SHAFT_H
  // a recessed inscription panel on the front
  block(q, -0.3, 0.3, cz - SHAFT[3] - 0.03, cz - SHAFT[3] + 0.02, y - SHAFT_H * 0.85, y - SHAFT_H * 0.45, shade(STONE, 0.9))
  block(q, -SHAFT[2] - 0.14, SHAFT[2] + 0.14, cz - SHAFT[3] - 0.14, cz + SHAFT[3] + 0.14, y, y + CORN_H, shade(STONE, 1.07))
  y += CORN_H
  block(q, -0.3, 0.3, cz - 0.25, cz + 0.25, y, y + SOCLE_H, shade(STONE, 1.02))
  // a bronze palm laid across the cornice
  block(q, -0.1, 0.9, cz - 0.55, cz - 0.4, y - CORN_H + 0.02, y - CORN_H + 0.1, BRONZE)
}

export function fontaineEugeneDelacroix(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, R, HZ, draw)
}
