import type { MeshBuilder } from '../../../buildings.ts'
import { type Rgb } from '../../../models.ts'
import { beam, block, column, hex, lathe, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { fitted } from '../palaces/common.ts'
import { G } from './plaza-common.ts'
import { fountainBowl, jetRing, plaque } from './monument-kit.ts'

/*
 * THE FONTAINE GAILLON (place Gaillon, 2e; Louis Visconti, 1828; Wikidata Q579833): a wall fountain let into the south
 * face of the corner house — a shell-headed niche between two Corinthian columns on plinths, an entablature, an attic
 * with the Latin dedication (MDCCCXXVII) and an urn over each column; in front, on a stepped platform, a two-tier basin on
 * balusters, and on the upper bowl Klagmann-style group of a putto spearing with a trident astride a dolphin (a Modly model:
 * statues manifest `gaillon-dauphin`). Frame: −z the front (the square), x across, y up, pavement at G (the loader sinks it).
 * The host house is a separate OSM apartments way and is left to draw itself: this model starts at its face (z = WALL_Z).
 * Dimensions are scaled off Commons photographs (Fontaine Gaillon August 8, 2011; ...P1060030) against column spacing ~4 m
 * and the figure's size, not surveyed: the lower rim ~1.5 m is the shakiest figure (the two photos disagree by half a metre).
 */
export const HX = 3.0
export const HZ = 2.25

// tunables
const WALL_Z = 1.9            // the host house's face
const CZ = -0.7               // basin axis
const COL_X = 2.0             // column centres
const COL_R = 0.3
const PLINTH_H = 1.3
const CAP_Y = 5.4             // capital bottom
const ENT_Y = 6.1             // capital top = entablature bottom
const ENT_H = 1.15
const CORNICE = 0.3
const ATTIC_H = 1.5
const NICHE_BACK = 0.55     // the niche's back panel, in front of the house face (clears the shop boards)
const SLAB_W = 2.6            // half-width of the aedicule's wall
const NICHE_R = 1.35          // niche half-width = arch radius
const SPRING = 4.05           // arch springing (above G)
const SLAB_T = 0.9            // how proud the aedicule stands of the house face (the niche recess)
const COL_Z = WALL_Z - SLAB_T - 0.4   // just in front of the slab
const R_LOW = 1.65            // lower basin radius
const RIM_LOW = 1.5
const R_UP = 1.0
const RIM_UP = 3.05

const STONE: Rgb = hex('#cfc4a8')
const PALE: Rgb = hex('#ddd3ba')
const DARK: Rgb = hex('#b3a78d')
const WATER: Rgb = hex('#6d93a0')
const FALL: Rgb = hex('#c4d8dc')
const URN: Rgb = hex('#3a3a38')

/** The putto-on-a-dolphin stands on the upper bowl's rim height, on the axis (landmark frame): for the statues manifest */
export const GROUP_AT: [number, number, number] = [0, G + RIM_UP - 0.1, CZ]

/** A baluster (swelling, banded stem) about the axis from y0 to y1, radius r at the belly. */
function baluster(q: MeshBuilder, y0: number, y1: number, r: number, c: Rgb): void {
  const h = y1 - y0
  lathe(q, 0, CZ, [[r * 1.15, y0], [r * 1.15, y0 + h * 0.08], [r * 0.55, y0 + h * 0.18], [r * 0.5, y0 + h * 0.3], [r * 1.0, y0 + h * 0.5], [r * 0.5, y0 + h * 0.7], [r * 0.55, y0 + h * 0.82], [r * 1.15, y0 + h * 0.92], [r * 1.15, y1]], 20, c)
}

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  // the step platform
  block(q, -HX, HX, -2.6, WALL_Z, 0, y(0.1), shade(STONE, 0.9))
  block(q, -HX + 0.3, HX - 0.3, -2.4, WALL_Z, y(0.1), y(0.2), shade(STONE, 0.95))
  // two-tier basin on balusters
  baluster(q, y(0.2), y(0.95), 0.5, STONE)
  fountainBowl(q, 0, CZ, y(0.85), R_LOW, { depth: RIM_LOW - 0.85, stem: 0.5, body: STONE, water: WATER })
  baluster(q, y(RIM_LOW - 0.05), y(2.3), 0.3, STONE)
  fountainBowl(q, 0, CZ, y(2.2), R_UP, { depth: RIM_UP - 2.2, stem: 0.3, body: PALE, water: WATER })
  jetRing(q, 0, CZ, 12, R_UP - 0.05, y(RIM_UP - 0.05), R_UP + 0.35, y(RIM_LOW + 0.02), { rise: 0.12, r: 0.03, c: FALL })

  // the aedicule's wall: the slab round the niche, the arch as a stepped cut-out, an arch moulding over it
  const top = ENT_Y + ENT_H + CORNICE + ATTIC_H
  const z0 = WALL_Z - SLAB_T
  const N = 28
  const crown = SPRING + NICHE_R
  for (let i = 0; i < N; i++) {
    const xa = -NICHE_R + (2 * NICHE_R * i) / N, xb = -NICHE_R + (2 * NICHE_R * (i + 1)) / N
    const xm = (xa + xb) / 2
    const ya = SPRING + Math.sqrt(Math.max(0, NICHE_R * NICHE_R - xm * xm))
    block(q, xa, xb, z0, WALL_Z, y(ya), y(crown + 0.05), STONE)
  }
  block(q, -SLAB_W, -NICHE_R, z0, WALL_Z, y(0), y(crown + 0.05), STONE)
  block(q, NICHE_R, SLAB_W, z0, WALL_Z, y(0), y(crown + 0.05), STONE)
  block(q, -SLAB_W, SLAB_W, z0, WALL_Z, y(crown + 0.05), y(CAP_Y), STONE)
  block(q, -NICHE_R, NICHE_R, WALL_Z - NICHE_BACK - 0.08, WALL_Z - NICHE_BACK, y(0.2), y(SPRING + 0.02), shade(STONE, 0.72))
  for (let i = 0; i <= 20; i++) {
    const a = (i / 20) * Math.PI
    const x = Math.cos(a) * (NICHE_R + 0.12), yy = SPRING + Math.sin(a) * (NICHE_R + 0.12)
    block(q, x - 0.1, x + 0.1, z0 - 0.06, z0 + 0.02, y(yy) - 0.1, y(yy) + 0.1, PALE)
  }
  // the shell: ribs fanning from the springing centre
  for (let i = 0; i <= 10; i++) {
    const a = (i / 10) * Math.PI
    beam(q, [0, y(SPRING + 0.05), WALL_Z - NICHE_BACK - 0.02], [Math.cos(a) * (NICHE_R - 0.05), y(SPRING + 0.05 + Math.sin(a) * (NICHE_R - 0.05)), WALL_Z - NICHE_BACK - 0.02], 0.035, shade(STONE, 1.07))
  }
  block(q, -NICHE_R, NICHE_R, WALL_Z - NICHE_BACK - 0.12, WALL_Z - NICHE_BACK - 0.08, y(SPRING - 0.05), y(SPRING + 0.05), shade(PALE, 1.02))

  // plinths, shafts, capitals
  for (const sx of [-1, 1]) {
    const x = sx * COL_X
    block(q, x - 0.5, x + 0.5, COL_Z - 0.5, WALL_Z - 0.05, y(0.2), y(PLINTH_H), shade(STONE, 0.96))
    block(q, x - 0.58, x + 0.58, COL_Z - 0.58, WALL_Z - 0.05, y(0.2), y(0.45), DARK)
    block(q, x - 0.58, x + 0.58, COL_Z - 0.58, WALL_Z - 0.05, y(PLINTH_H - 0.15), y(PLINTH_H + 0.05), DARK)
    column(q, x, COL_Z, y(PLINTH_H + 0.05), y(CAP_Y - 0.2), COL_R, PALE)
    block(q, x - COL_R - 0.1, x + COL_R + 0.1, COL_Z - COL_R - 0.1, COL_Z + COL_R + 0.1, y(CAP_Y - 0.25), y(CAP_Y), DARK)
    block(q, x - COL_R - 0.17, x + COL_R + 0.17, COL_Z - COL_R - 0.17, COL_Z + COL_R + 0.17, y(CAP_Y), y(ENT_Y), shade(PALE, 1.04))
  }
  // entablature: architrave, a darker frieze band, the projecting cornice
  block(q, -SLAB_W - 0.15, SLAB_W + 0.15, COL_Z - 0.5, WALL_Z, y(ENT_Y), y(ENT_Y + 0.35), PALE)
  block(q, -SLAB_W - 0.1, SLAB_W + 0.1, COL_Z - 0.46, WALL_Z, y(ENT_Y + 0.35), y(ENT_Y + ENT_H), shade(STONE, 0.93))
  block(q, -SLAB_W - 0.3, SLAB_W + 0.3, COL_Z - 0.75, WALL_Z, y(ENT_Y + ENT_H), y(ENT_Y + ENT_H + CORNICE), PALE)
  // the attic: a pier and urn over each column, the dedication between
  const ay = ENT_Y + ENT_H + CORNICE
  block(q, -SLAB_W, SLAB_W, z0, WALL_Z, y(ay), y(ay + ATTIC_H), STONE)
  for (const sx of [-1, 1]) {
    const x = sx * COL_X
    block(q, x - 0.5, x + 0.5, z0 - 0.25, WALL_Z, y(ay), y(ay + ATTIC_H), shade(PALE, 1.02))
    block(q, x - 0.6, x + 0.6, z0 - 0.32, WALL_Z, y(ay + ATTIC_H), y(ay + ATTIC_H + 0.15), PALE)
    lathe(q, x, z0 - 0.1, [[0.0, y(ay + ATTIC_H + 0.15)], [0.22, y(ay + ATTIC_H + 0.15)], [0.3, y(ay + ATTIC_H + 0.45)], [0.28, y(ay + ATTIC_H + 0.6)], [0.38, y(ay + ATTIC_H + 0.7)], [0.0, y(ay + ATTIC_H + 0.7)]], 14, URN)
  }
  plaque(q, { x: 0, z: z0, y0: y(ay + 0.3), w: 2.1, h: 0.8, panel: shade(PALE, 1.03), frame: DARK, fw: 0.05, letters: shade(STONE, 0.55), lines: [0.9, 0.95, 0.85] })
  void top
}

export function fontaineGaillon(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
