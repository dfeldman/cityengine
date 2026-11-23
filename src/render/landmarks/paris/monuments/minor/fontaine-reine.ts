import { MeshBuilder } from '../../../../buildings.ts'
import { type Rgb } from '../../../../models.ts'
import { block, hex, placed, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'

/*
 * THE FONTAINE DE LA REINE (also Greneta, de la Reynie; rue Saint-Denis 142 at rue Greneta, 2e; early 16th c., rebuilt
 * by Beausire 1732; Wikidata Q15948824; MH 1994): the rounded south-west corner of the Aubry house, dry now. From the ground
 * up: a rusticated plinth with a blank table panel, then a round-headed niche (the spout's, its mascaron lost) in a faceted
 * turret, a cornice carried on two bearded mascaron corbels at the turret's shoulders (Modly: statues `reine-mascaron`,
 * the one head, mirrored on the other side), a frieze with the royal cartouche, and an upper recessed window. Frame: −z the
 * front (the crossing, facing south-west), x across, y up, pavement at G; the house's corner vertex is the origin and the house
 * lies behind it (z > |x|), left to draw itself: every recess back is >= 0.55 m in front of it (shop boards hang 0.4 m proud).
 * Scaled off Commons photographs (Paris - 142 rue Saint-Denis - fontaine de la reine, and its decor view) with the street
 * plaques (~0.3 m wide) as the rule, not surveyed: the heights are good to ~0.3 m, the niche width to ~0.15 m.
 */
export const HX = 1.7
export const HZ = 1.6

// tunables
const FRONT_Z = -1.05        // the central facet's face
const CEN_W = 0.8            // central facet half-width
const WING_W = 0.95          // each canted wing's length
const WING_TURN = 0.62       // rad the wings turn back from the facet plane
const NICHE_BACK = -0.62     // the niche's back, in front of the house corner (shop boards clear)
const NICHE_R = 0.66         // niche half-width = arch radius
const NICHE_BASE = 2.45
const SPRING = 2.65
const TABLE_Y0 = 1.3
const TABLE_Y1 = 2.15
const CORNICE_Y = 4.0
const CORNICE_H = 0.25
const TOP_Y = 5.5
const WIN_Y0 = 4.75
const WIN_W = 0.55

const STONE: Rgb = hex('#c9bc9c')
const PALE: Rgb = hex('#d6caad')
const DARK: Rgb = hex('#a89c80')
const MOSS: Rgb = hex('#7d8461')

/** Where the mascaron corbels hang (landmark frame, y includes G): for the statues manifest */
export const MASCARON_AT = (side: 1 | -1): [number, number, number] => [side * (CEN_W + 0.05), G + 3.3, FRONT_Z - 0.02]

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  const back = 1.4
  const crown = SPRING + NICHE_R
  // central facet: plinth, joints, table panel, sill
  block(q, -CEN_W, CEN_W, FRONT_Z, back, y(0), y(NICHE_BASE), STONE)
  for (let k = 1; k < 4; k++) block(q, -CEN_W, CEN_W, FRONT_Z - 0.02, FRONT_Z, y(k * 0.6), y(k * 0.6 + 0.03), DARK)
  block(q, -0.55, 0.55, FRONT_Z - 0.05, FRONT_Z, y(TABLE_Y0), y(TABLE_Y1), PALE)
  block(q, -0.45, 0.45, FRONT_Z - 0.06, FRONT_Z - 0.05, y(TABLE_Y0 + 0.1), y(TABLE_Y1 - 0.1), shade(STONE, 0.95))
  block(q, -CEN_W - 0.05, CEN_W + 0.05, FRONT_Z - 0.12, FRONT_Z + 0.05, y(NICHE_BASE - 0.1), y(NICHE_BASE), PALE)
  // the niche band: piers either side, the recess's back, and the arch as stacked slices
  block(q, -CEN_W, -NICHE_R, FRONT_Z, back, y(NICHE_BASE), y(SPRING), STONE)
  block(q, NICHE_R, CEN_W, FRONT_Z, back, y(NICHE_BASE), y(SPRING), STONE)
  block(q, -NICHE_R, NICHE_R, NICHE_BACK, back, y(NICHE_BASE), y(SPRING), shade(STONE, 0.78))
  const N = 10
  for (let i = 0; i < N; i++) {
    const y0 = SPRING + (NICHE_R * i) / N, y1 = SPRING + (NICHE_R * (i + 1)) / N
    const w = Math.sqrt(Math.max(0.0004, NICHE_R * NICHE_R - y0 * y0 + 2 * y0 * SPRING - SPRING * SPRING))
    block(q, -CEN_W, -w, FRONT_Z, back, y(y0), y(y1), STONE)
    block(q, w, CEN_W, FRONT_Z, back, y(y0), y(y1), STONE)
    block(q, -w, w, NICHE_BACK, back, y(y0), y(y1), shade(STONE, 0.78))
  }
  block(q, -CEN_W, CEN_W, FRONT_Z, back, y(crown), y(CORNICE_Y), STONE)
  // moulding round the arch
  for (let i = 0; i <= 14; i++) {
    const a = (i / 14) * Math.PI
    const x = Math.cos(a) * (NICHE_R + 0.06), yy = SPRING + Math.sin(a) * (NICHE_R + 0.06)
    block(q, x - 0.05, x + 0.05, FRONT_Z - 0.05, FRONT_Z, y(yy) - 0.05, y(yy) + 0.05, PALE)
  }
  // cornice, frieze with cartouche, upper window recess, cap
  block(q, -CEN_W - 0.55, CEN_W + 0.55, FRONT_Z - 0.3, back, y(CORNICE_Y), y(CORNICE_Y + CORNICE_H), PALE)
  block(q, -CEN_W - 0.45, CEN_W + 0.45, FRONT_Z - 0.34, back, y(CORNICE_Y + CORNICE_H), y(CORNICE_Y + CORNICE_H + 0.04), MOSS)
  block(q, -CEN_W, CEN_W, FRONT_Z + 0.1, back, y(CORNICE_Y + CORNICE_H), y(WIN_Y0), STONE)
  block(q, -0.22, 0.22, FRONT_Z + 0.04, FRONT_Z + 0.1, y(CORNICE_Y + 0.4), y(CORNICE_Y + 0.8), PALE)   // the royal cartouche
  block(q, -CEN_W, -WIN_W / 2, FRONT_Z + 0.1, back, y(WIN_Y0), y(TOP_Y), STONE)
  block(q, WIN_W / 2, CEN_W, FRONT_Z + 0.1, back, y(WIN_Y0), y(TOP_Y), STONE)
  block(q, -WIN_W / 2, WIN_W / 2, NICHE_BACK, back, y(WIN_Y0), y(TOP_Y), shade(STONE, 0.7))
  block(q, -CEN_W, CEN_W, FRONT_Z + 0.1, back, y(TOP_Y), y(TOP_Y + 0.12), PALE)
  // the canted wings, one each side, drawn once on the +x side and turned
  const wing = new MeshBuilder()
  block(wing, 0, WING_W, 0, 1.2, y(0), y(NICHE_BASE), STONE)
  block(wing, 0, WING_W, 0, 1.2, y(NICHE_BASE), y(CORNICE_Y), STONE)
  block(wing, -0.05, WING_W + 0.05, -0.3, 1.2, y(CORNICE_Y), y(CORNICE_Y + CORNICE_H), PALE)
  block(wing, 0, WING_W, 0.1, 1.2, y(CORNICE_Y + CORNICE_H), y(TOP_Y + 0.12), STONE)
  for (let k = 1; k < 4; k++) block(wing, 0, WING_W, -0.02, 0, y(k * 0.6), y(k * 0.6 + 0.03), DARK)
  placed(q, wing, -WING_TURN, CEN_W, FRONT_Z)
  const wing2 = new MeshBuilder()
  block(wing2, -WING_W, 0, 0, 1.2, y(0), y(NICHE_BASE), STONE)
  block(wing2, -WING_W, 0, 0, 1.2, y(NICHE_BASE), y(CORNICE_Y), STONE)
  block(wing2, -WING_W - 0.05, 0.05, -0.3, 1.2, y(CORNICE_Y), y(CORNICE_Y + CORNICE_H), PALE)
  block(wing2, -WING_W, 0, 0.1, 1.2, y(CORNICE_Y + CORNICE_H), y(TOP_Y + 0.12), STONE)
  for (let k = 1; k < 4; k++) block(wing2, -WING_W, 0, -0.02, 0, y(k * 0.6), y(k * 0.6 + 0.03), DARK)
  placed(q, wing2, WING_TURN, -CEN_W, FRONT_Z)
}

export function fontaineReine(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
