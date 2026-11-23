import type { MeshBuilder } from '../../../buildings.ts'
import { type Rgb } from '../../../models.ts'
import { block, hex, roof, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { fitted } from '../palaces/common.ts'
import { walls } from './common.ts'
import { G, spout } from './plaza-common.ts'
import { plaque } from './monument-kit.ts'

/*
 * THE FONTAINE DU CHÂTEAU-D'EAU DE MONTMARTRE (la fontaine de l'ancien Réservoir, 9b rue Norvins, 18e; Philippe-Auguste
 * Titeux, 1835; Wikidata Q945052). OSM maps it as the disused covered reservoir (way 77937860, a 2-storey plaster
 * building, ~8.5 × 10.5 m with chamfered corners): the fountain is the pavilion front it shows to the street — a stair
 * up between low cheek walls to a ledge-basin under a round-arched niche lined with pink marble panels, flanked by
 * pilasters, with a carved frieze, a dated plaque and a small pediment. In the niche a bronze vase with dolphin feet
 * and a mask spout (Modly: statues manifest `reservoir-vase`). The way is claimed; the body is its own ring extruded.
 * Frame: the front faces −z at z = −HZ, x across, y up from the base, ground G. Photographs (Commons: Fontaine de
 * l'Ancien Réservoir; ...Montmartre, Paris 2017) scaled by the niche and stair — not surveyed.
 */
export const HX = 4.25
export const HZ = 5.25

// tunables
const FL = 1.35               // the pavilion floor / ledge above the foot of the stair
const STEPS = 8
const RUN = 0.3               // tread
const HALF_W = 2.5            // the aedicule's half-width
const SLAB_T = 0.9            // its thickness (the niche recess is cut into it)
const NICHE_R = 1.3           // niche half-width = arch radius
const SPRING = 3.7            // arch springing above the foot of the stair
const PIL_W = 0.5             // corner pilaster width
const ENT_Y = 5.35            // entablature bottom
const ENT_H = 0.75
const PED_H = 0.95            // pediment rise
const BODY_H = 6.2            // the building behind
const LEDGE_D = 0.75          // ledge-basin projection
const VASE_BASE = 0.35        // vase plinth height

const PLASTER: Rgb = hex('#d6cdb6')
const STONE: Rgb = hex('#cdbf9f')
const PALE: Rgb = hex('#ddd2b8')
const DARK: Rgb = hex('#a89a80')
const PINK: Rgb = hex('#b0827a')
const GRANITE: Rgb = hex('#9c7a73')
const WATER: Rgb = hex('#6d93a0')
const FALL: Rgb = hex('#c4d8dc')
const ROOF: Rgb = hex('#7a7468')

/** The vase stands on its plinth in the niche on the axis (landmark frame): for the statues manifest */
// (the niche is only as deep as the claimed ring's front wall allows: the lining sits flush against it, the vase stands out on the ledge)
const NICHE_BACK = -HZ        // z of the niche's back: the ring's front face
export const VASE_AT: [number, number, number] = [0, G + FL + 0.82 + VASE_BASE, NICHE_BACK - 0.3]

function draw(q: MeshBuilder, ring?: { x: number; z: number }[]): void {
  const y = (v: number): number => G + v
  const zf = -HZ - 0.06     // the slab's front, a hair proud of the ring's front wall
  const zb = zf + SLAB_T       // back of the niche slab
  const zr = NICHE_BACK         // the niche's back panel: flush on the ring's front wall (any deeper is inside it)
  // the building behind: its own ring, plaster, to a flat lid
  const plan = ring && ring.length > 2 ? ring : [{ x: -HX, z: -HZ }, { x: HX, z: -HZ }, { x: HX, z: HZ }, { x: -HX, z: HZ }]
  walls(q, plan, 0, y(BODY_H), PLASTER, ROOF)
  // the stair: treads between cheek walls, each cheek stepped with the flight
  for (let i = 0; i < STEPS; i++) {
    const rise = (FL * (i + 1)) / STEPS
    const z1 = zf - RUN * (STEPS - 1 - i)
    block(q, -1.45, 1.45, z1 - RUN, z1, 0, y(rise), shade(STONE, 1 - 0.02 * (i % 2)))
    for (const s of [-1, 1]) block(q, s > 0 ? 1.45 : -1.75, s > 0 ? 1.75 : -1.45, z1 - RUN, z1, 0, y(rise + 0.45), shade(STONE, 0.9))
  }
  // the ledge-basin: a shallow canted shelf standing out of the niche, water in its top
  block(q, -1.5, 1.5, zf - LEDGE_D + 0.2, zr, y(FL), y(FL + 0.7), STONE)
  block(q, -1.62, 1.62, zf - LEDGE_D + 0.1, zr, y(FL + 0.7), y(FL + 0.82), PALE)
  block(q, -1.32, 1.32, zf - LEDGE_D + 0.3, zr - 0.05, y(FL + 0.8), y(FL + 0.84), WATER)
  // the aedicule's slab: stepped arch cut-out, flank pilasters, entablature, pediment
  const crown = SPRING + NICHE_R
  const N = 26
  for (let i = 0; i < N; i++) {
    const xa = -NICHE_R + (2 * NICHE_R * i) / N, xb = -NICHE_R + (2 * NICHE_R * (i + 1)) / N
    const xm = (xa + xb) / 2
    const ya = SPRING + Math.sqrt(Math.max(0, NICHE_R * NICHE_R - xm * xm))
    block(q, xa, xb, zf, zb, y(ya), y(crown + 0.05), PALE)
  }
  block(q, -HALF_W, -NICHE_R, zf, zb, 0, y(crown + 0.05), PALE)
  block(q, NICHE_R, HALF_W, zf, zb, 0, y(crown + 0.05), PALE)
  block(q, -HALF_W, HALF_W, zf, zb, y(crown + 0.05), y(ENT_Y), PALE)
  // niche lining: granite back, pink marble panels beside the vase
  block(q, -NICHE_R, NICHE_R, zr - 0.03, zr, y(FL), y(SPRING + 0.02), GRANITE)
  for (const s of [-1, 1]) block(q, s > 0 ? 0.55 : -1.05, s > 0 ? 1.05 : -0.55, zr - 0.06, zr - 0.03, y(FL + 0.9), y(FL + 2.5), PINK)
  for (let i = 0; i < 14; i++) {
    const a = (i / 13) * Math.PI
    const x = Math.cos(a) * (NICHE_R - 0.05), yy = SPRING + Math.sin(a) * (NICHE_R - 0.05)
    block(q, x - 0.06, x + 0.06, zr - 0.06, zr - 0.02, y(Math.min(yy, SPRING + 0.7 * (NICHE_R - 0.05) + 0.2)) - 0.04, y(SPRING + 0.7 * (NICHE_R - 0.05) + 0.2), shade(GRANITE, 0.92))
  }
  block(q, -NICHE_R, NICHE_R, zr - 0.05, zr - 0.02, y(SPRING + 0.1), y(crown - 0.1), shade(GRANITE, 0.85))
  // the arch moulding: a ring of blocks proud of the face
  for (let i = 0; i <= 22; i++) {
    const a = (i / 22) * Math.PI
    const x = Math.cos(a) * (NICHE_R + 0.14), yy = SPRING + Math.sin(a) * (NICHE_R + 0.14)
    block(q, x - 0.11, x + 0.11, zf - 0.07, zf + 0.02, y(yy) - 0.11, y(yy) + 0.11, DARK)
  }
  // pilasters at the corners, with base and capital
  for (const s of [-1, 1]) {
    const x0 = s > 0 ? HALF_W - PIL_W : -HALF_W, x1 = s > 0 ? HALF_W : -HALF_W + PIL_W
    block(q, x0 - 0.05, x1 + 0.05, zf - 0.1, zf, y(FL - 0.3), y(FL + 0.5), DARK)
    block(q, x0, x1, zf - 0.08, zf, y(FL + 0.5), y(ENT_Y - 0.35), shade(PALE, 1.04))
    block(q, x0 - 0.06, x1 + 0.06, zf - 0.14, zf, y(ENT_Y - 0.35), y(ENT_Y), DARK)
  }
  // entablature: architrave, carved frieze (darker, with the dated plaque), cornice
  block(q, -HALF_W - 0.15, HALF_W + 0.15, zf - 0.2, zb, y(ENT_Y), y(ENT_Y + 0.25), PALE)
  block(q, -HALF_W - 0.1, HALF_W + 0.1, zf - 0.12, zb, y(ENT_Y + 0.25), y(ENT_Y + ENT_H - 0.12), shade(STONE, 0.93))
  block(q, -HALF_W - 0.28, HALF_W + 0.28, zf - 0.3, zb, y(ENT_Y + ENT_H - 0.12), y(ENT_Y + ENT_H), PALE)
  plaque(q, { x: 0, z: zf - 0.12, y0: y(ENT_Y + 0.2), w: 1.3, h: 0.3, panel: shade(PALE, 1.04), frame: DARK, fw: 0.03, letters: shade(STONE, 0.5), lines: [0.8] })
  // pediment: a shallow gable (ridge along x), a tympanum panel on its face
  roof(q, -HALF_W - 0.28, HALF_W + 0.28, zf - 0.3, zb, y(ENT_Y + ENT_H), PED_H, 0, (zb - zf + 0.3) / 2, PALE)
  block(q, -0.9, 0.9, zf - 0.34, zf - 0.3, y(ENT_Y + ENT_H + 0.12), y(ENT_Y + ENT_H + 0.55), shade(STONE, 0.9))
  // the water: a thin jet from the vase's mask onto the ledge
  spout(q, [0, y(FL + 0.82 + VASE_BASE + 0.95), zr - 0.65], [0, y(FL + 0.82), zr - 0.52], 0.04, 0.012, FALL)
  // the vase's plinth (the vase itself is Modly)
  block(q, -0.4, 0.4, zr - 0.62, zr - 0.1, y(FL + 0.82), y(FL + 0.82 + VASE_BASE), shade(PINK, 1.05))
}

export function fontaineReservoirMontmartre(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q, fit.ring))
}
