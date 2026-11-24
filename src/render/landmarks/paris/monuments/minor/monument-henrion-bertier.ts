import type { MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'

/*
 * MONUMENT DU GENERAL HENRION-BERTIER (cimetiere ancien de Neuilly-sur-Seine; Wikidata Q96601813; tomb of 1903 by
 * Paul Friese, architect, and Pierre Granet, sculptor): a pale limestone sarcophagus-slab with a cross cut in its
 * sloping lid, a tall square pillar behind it carrying a bust of the general, two small urn posts at the sides, a low
 * curved kerb in front. A mourning girl (Modly) leans on the lid and the bust (Modly) stands on the pillar. Read off
 * one Commons photo (Tombe General Henrion-Berthier); sizes estimated against the planting, not surveyed.
 * Frame: x across, z from the front (-z) to the wall (+z), y up from the ground (G).
 */
export const HX = 1.7
export const HZ = 1.2

// tunables (metres)
const SARC_HX = 0.95, SARC_Z0 = -0.5, SARC_Z1 = 0.4, SARC_X = -0.15, SARC_H = 0.55, LID_H = 0.18
const PIL_X = 0.4, PIL_Z = 0.3, PIL_HW = 0.26, PIL_H = 2.0, PIL_BASE_H = 0.4, CAP_H = 0.12
const POST_HW = 0.15, POST_H = 0.8, POST_X = 1.4, POST_Z = 0.1
const KERB_H = 0.25, KERB_W = 0.2

export const PILLAR_TOP = PIL_H + CAP_H                  // where the bust stands
export const PILLAR_AT: [number, number] = [PIL_X, PIL_Z]
export const LID_TOP = SARC_H + LID_H
export const LID_AT: [number, number] = [SARC_X - 0.45, SARC_Z0 + 0.5]

const STONE: Rgb = hex('#cfcabb')
const DARK: Rgb = hex('#a8a498')
const CAPST: Rgb = hex('#bdb8aa')
const CROSS: Rgb = hex('#8e8a7e')

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  const sx0 = SARC_X - SARC_HX, sx1 = SARC_X + SARC_HX
  // sarcophagus: body, then a stepped-in lid
  block(q, sx0, sx1, SARC_Z0, SARC_Z1, y(0), y(SARC_H), STONE)
  block(q, sx0 + 0.05, sx1 - 0.05, SARC_Z0 + 0.05, SARC_Z1 - 0.05, y(SARC_H), y(SARC_H + LID_H * 0.5), shade(STONE, 0.96))
  block(q, sx0 + 0.12, sx1 - 0.12, SARC_Z0 + 0.12, SARC_Z1 - 0.12, y(SARC_H + LID_H * 0.5), y(LID_TOP), shade(STONE, 0.92))
  // cross on the front face of the lid
  const cx = SARC_X - 0.1
  block(q, cx - 0.025, cx + 0.025, SARC_Z0 - 0.01, SARC_Z0, y(0.12), y(SARC_H - 0.08), CROSS)
  block(q, cx - 0.11, cx + 0.11, SARC_Z0 - 0.01, SARC_Z0, y(SARC_H - 0.24), y(SARC_H - 0.19), CROSS)
  // pillar: base, shaft, cap
  block(q, PIL_X - PIL_HW - 0.06, PIL_X + PIL_HW + 0.06, PIL_Z - PIL_HW - 0.06, PIL_Z + PIL_HW + 0.06, y(0), y(PIL_BASE_H), DARK)
  block(q, PIL_X - PIL_HW, PIL_X + PIL_HW, PIL_Z - PIL_HW, PIL_Z + PIL_HW, y(PIL_BASE_H), y(PIL_H), STONE)
  block(q, PIL_X - PIL_HW - 0.04, PIL_X + PIL_HW + 0.04, PIL_Z - PIL_HW - 0.04, PIL_Z + PIL_HW + 0.04, y(PIL_H), y(PIL_H + CAP_H), CAPST)
  // urn posts, each with a rounded-by-steps finial
  for (const s of [-1, 1]) {
    const px = s * POST_X
    block(q, px - POST_HW, px + POST_HW, POST_Z - POST_HW, POST_Z + POST_HW, y(0), y(POST_H - 0.2), STONE)
    block(q, px - POST_HW - 0.03, px + POST_HW + 0.03, POST_Z - POST_HW - 0.03, POST_Z + POST_HW + 0.03, y(POST_H - 0.2), y(POST_H - 0.12), CAPST)
    block(q, px - 0.11, px + 0.11, POST_Z - 0.11, POST_Z + 0.11, y(POST_H - 0.12), y(POST_H), CAPST)
  }
  // front kerb (straight stand-in for the curved one): a step either side and one in front
  block(q, -HX, HX, -HZ, -HZ + KERB_W, y(0), y(KERB_H), shade(STONE, 0.9))
  block(q, -HX, -HX + KERB_W, -HZ, HZ, y(0), y(KERB_H), shade(STONE, 0.9))
  block(q, HX - KERB_W, HX, -HZ, HZ, y(0), y(KERB_H), shade(STONE, 0.9))
}

export function monumentHenrionBertier(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
