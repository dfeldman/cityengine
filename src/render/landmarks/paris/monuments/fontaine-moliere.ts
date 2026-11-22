import type { MeshBuilder } from '../../../buildings.ts'
import { prism, type Rgb } from '../../../models.ts'
import { block, column, hex, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { fitted } from '../palaces/common.ts'
import { spout } from './plaza-common.ts'
import { plaque } from './monument-kit.ts'

/*
 * THE FONTAINE MOLIÈRE (rue de Richelieu at rue Molière, place Mireille; Louis Visconti, 1844, sculptors Seurre —
 * the bronze Molière — and Pradier — the two Muses; Wikidata Q3076047): an aedicule let into the corner building, a
 * shell-headed niche between two pairs of Corinthian columns on carved drums, an entablature dated MDCCCXLIV and an arched
 * pediment; under the niche a pedestal with the dedication, a Muse on the platform at each side, a stepped basin in front.
 * Frame: −z the front (the open place), x across, y up from the base, pavement at 0. OSM way 54097804 (the fountain
 * mapped as a 3-level building, claimed so no block is drawn) is ~8.3 m across the back; heights are scaled off Commons
 * photographs against Seurre's seated bronze (~2.4 m), not surveyed. Molière and the Muses are Modly models
 * (statues manifest: moliere-seated, moliere-muse-1/2).
 */
export const HX = 4.2
export const HZ = 4.5

// tunables
const WALL_Z = 2.9           // the facade's front plane
const NICHE_W = 1.5          // half-width of the niche
const NICHE_Y = 5.2          // its floor (the pedestal top)
const SPRING = 7.0           // arch springing
const CROWN = 8.4
const COL_X = [1.65, 2.45]   // the column pairs, centres
const COL_Z = WALL_Z - 0.45
const COL_R = 0.33
const DRUM_Y = 1.25          // the carved drum under each column
const CAP_Y = 9.2            // capital top
const ENT_H = 1.0
const PED_X = 1.35
const PLATFORM = 2.2
const WING = 1.25            // facade either side of the column pairs

const STONE: Rgb = hex('#c9bfa5')
const PALE: Rgb = hex('#d6cdb6')
const DARK: Rgb = hex('#b0a58c')
const WATER: Rgb = hex('#6d93a0')
const FALL: Rgb = hex('#c4d8dc')
const LION: Rgb = hex('#9a8f78')

/** Muses stand on the platform at [x, y, z]; Molière in the niche (landmark frame): for the statues manifest */
export const MOLIERE_AT: [number, number, number] = [0, NICHE_Y + 0.05, 1.9]
export const MUSE_AT: [number, number, number] = [2.5, PLATFORM, -0.3]

function draw(q: MeshBuilder): void {
  const fx = COL_X[1] + COL_R + WING
  // stepped basin: two kerb steps and a rim wall, water behind the lip
  block(q, -fx - 0.7, fx + 0.7, -4.5, WALL_Z - 0.2, 0, 0.3, shade(STONE, 0.95))
  block(q, -fx - 0.2, fx + 0.2, -3.9, WALL_Z - 0.2, 0.3, 0.75, shade(STONE, 0.98))
  block(q, -fx, fx, -3.5, WALL_Z - 0.2, 0.75, 1.15, STONE)
  block(q, -fx + 0.35, fx - 0.35, -3.2, -1.95, 1.1, 1.13, WATER)
  block(q, -fx - 0.05, fx + 0.05, -3.55, -3.4, 1.15, 1.3, PALE)
  // the platform the pedestal and the Muses stand on, with lion masks spouting into the basin
  block(q, -fx + 0.2, fx - 0.2, -1.9, WALL_Z - 0.2, 1.15, PLATFORM, STONE)
  block(q, -fx + 0.1, fx - 0.1, -2.0, WALL_Z - 0.2, PLATFORM - 0.14, PLATFORM, PALE)
  for (const sx of [-1, 1]) {
    const x = sx * 1.75
    prism(q, x, -1.96, 1.4, 1.75, 0.2, 7, LION, undefined, 0.2, true)
    spout(q, [x, 1.45, -2.1], [x, 1.12, -2.9], 0.12, 0.05, FALL)
  }
  // the pedestal under Molière, with its plinth, cornice and the dedication
  block(q, -PED_X - 0.2, PED_X + 0.2, -0.3, WALL_Z - 0.2, PLATFORM, PLATFORM + 0.4, DARK)
  block(q, -PED_X, PED_X, -0.1, WALL_Z - 0.2, PLATFORM + 0.4, NICHE_Y - 0.35, STONE)
  block(q, -PED_X - 0.25, PED_X + 0.25, -0.35, WALL_Z - 0.2, NICHE_Y - 0.35, NICHE_Y, DARK)
  plaque(q, { x: 0, z: -0.1, y0: PLATFORM + 0.85, w: 1.45, h: 1.55, panel: PALE, frame: DARK, fw: 0.1, letters: shade(STONE, 0.6), lines: [0.1, 0.7, 0.9, 0.9, 0.9, 0.7, 0.4] })
  // the facade: wings and the aedicule's back wall, to the entablature
  const top = CAP_Y + ENT_H
  block(q, -fx, fx, WALL_Z, WALL_Z + 0.9, PLATFORM, top + 0.4, STONE)
  block(q, -NICHE_W - 0.35, NICHE_W + 0.35, WALL_Z - 0.12, WALL_Z, NICHE_Y, SPRING, PALE)
  // the niche: a dark recess with a shell half-dome (ribs as thin bands)
  block(q, -NICHE_W, NICHE_W, WALL_Z - 0.02, WALL_Z + 0.02, NICHE_Y, SPRING, shade(STONE, 0.7))
  const cy = SPRING, rr = NICHE_W
  for (let i = 0; i <= 12; i++) {
    const a = (i / 12) * Math.PI
    const x = Math.cos(a) * rr
    const y = cy + Math.sin(a) * (CROWN - SPRING)
    prism(q, x, WALL_Z - 0.03, y - 0.08, y + 0.08, 0.07, 4, shade(PALE, 0.9), undefined, 0.07, true)
  }
  // the arched head: an archivolt ring of blocks round the niche
  for (let i = 0; i <= 18; i++) {
    const a = (i / 18) * Math.PI
    const x = Math.cos(a) * (rr + 0.2), y = cy + Math.sin(a) * (CROWN - SPRING + 0.2)
    block(q, x - 0.11, x + 0.11, WALL_Z - 0.2, WALL_Z - 0.02, y - 0.11, y + 0.11, PALE)
  }
  // columns in pairs on carved drums
  for (const sx of [-1, 1]) for (const cx of COL_X) {
    const x = sx * cx
    block(q, x - COL_R - 0.1, x + COL_R + 0.1, COL_Z - COL_R - 0.1, COL_Z + COL_R + 0.1, NICHE_Y - 0.35, NICHE_Y + DRUM_Y, shade(STONE, 0.93))
    block(q, x - COL_R - 0.16, x + COL_R + 0.16, COL_Z - COL_R - 0.16, COL_Z + COL_R + 0.16, NICHE_Y + DRUM_Y, NICHE_Y + DRUM_Y + 0.12, DARK)
    column(q, x, COL_Z, NICHE_Y + DRUM_Y + 0.12, CAP_Y - 0.5, COL_R, PALE)
    block(q, x - COL_R - 0.12, x + COL_R + 0.12, COL_Z - COL_R - 0.12, COL_Z + COL_R + 0.12, CAP_Y - 0.5, CAP_Y, shade(PALE, 1.05))
  }
  // entablature (dated frieze), its cornice, the arched pediment with a tympanum
  const w = COL_X[1] + COL_R + 0.2
  block(q, -w, w, COL_Z - 0.55, WALL_Z + 0.3, CAP_Y, CAP_Y + ENT_H * 0.7, shade(STONE, 1.02))
  block(q, -w - 0.2, w + 0.2, COL_Z - 0.7, WALL_Z + 0.45, CAP_Y + ENT_H * 0.7, top, PALE)
  plaque(q, { x: 0, z: COL_Z - 0.55, y0: CAP_Y + 0.12, w: 1.5, h: 0.5, panel: shade(PALE, 1.04), frame: DARK, fw: 0.05, letters: shade(STONE, 0.6), lines: [0.9] })
  const pr = w - 0.15
  for (let i = 0; i < 24; i++) {
    const a0 = (i / 24) * Math.PI, a1 = ((i + 1) / 24) * Math.PI
    const x0 = Math.cos(a0) * pr, x1 = Math.cos(a1) * pr
    const y0 = top + Math.sin(a0) * 1.65, y1 = top + Math.sin(a1) * 1.65
    // tympanum slab per segment, and the moulded arch rim over it
    block(q, Math.min(x0, x1), Math.max(x0, x1), WALL_Z - 0.05, WALL_Z + 0.15, top, Math.max(y0, y1) - 0.12, shade(STONE, 0.94))
    block(q, Math.min(x0, x1) - 0.05, Math.max(x0, x1) + 0.05, WALL_Z - 0.3, WALL_Z + 0.25, Math.min(y0, y1) - 0.12, Math.max(y0, y1) + 0.1, PALE)
  }
  // the carved relief in the tympanum (putto and swags, stand-in blocks), hung from the entablature
  block(q, -0.25, 0.25, WALL_Z - 0.12, WALL_Z - 0.05, top + 0.4, top + 1.1, shade(DARK, 0.95))
  for (const sx of [-1, 1]) block(q, sx * 0.55 - 0.3, sx * 0.55 + 0.3, WALL_Z - 0.1, WALL_Z - 0.05, top + 0.3, top + 0.7, shade(DARK, 0.97))
}

export function fontaineMoliere(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
