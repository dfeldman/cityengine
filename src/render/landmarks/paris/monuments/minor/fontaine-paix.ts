import type { MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { block, hex, roof, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { basin, falls, G } from '../plaza-common.ts'
import { fountainBowl } from './monument-kit.ts'

/*
 * THE FONTAINE DE LA PAIX (allée du Séminaire, off the rue Bonaparte, 6e; Athanase Détournelle 1806-10, reliefs by Voinier,
 * Espercieux, Caraffe and Marquois; monument historique 1926; Wikidata Q3076202; OSM way 1200013023): a free-standing stone
 * pylon in a rectangular trough basin. A plinth, a tall die with a banded cornice and a pediment on each long face, and a
 * bas-relief panel on each of the four faces (A LA PAIX, SCIENCES ET ARTS, AGRICULTURE, COMMERCE); on each long face a
 * mascaron spouting into a shell bowl above the basin. The reliefs are shallow and so are drawn as dark panels.
 * Frame: the shell-bowl face is −z, the trough runs along x, y up from the pavement at G.
 * Basin footprint from OSM (5.3 × 3.8 m); the pylon's width, height and details are scaled off Commons photographs
 * against the basin (not surveyed): die ~1.8 × 1.2 m, ~5.2 m to the pediment's ridge.
 */
export const HX = 2.65
export const HZ = 1.9

// tunables
const BASIN_H = 0.75
const WALL = 0.38            // basin wall thickness
const END_UP = 0.18          // the raised seat at each end of the trough
const PLINTH_X = 1.15        // half-sizes
const PLINTH_Z = 0.8
const PLINTH_H = 1.15
const DIE_X = 0.9
const DIE_Z = 0.6
const DIE_TOP = 4.15         // above the pavement
const CORNICE_H = 0.3
const PEDIMENT_H = 0.65
const PANEL_Y = [3.0, 3.6]   // the relief panel's heights
const PANEL_HX = [0.52, 0.36] // half-width of the panel on a long face / a short face
const BOWL_R = 0.42
const BOWL_Y = 1.3

const STONE: Rgb = hex('#c4b79b')
const DARK: Rgb = hex('#a39677')
const RELIEF: Rgb = hex('#8e8164')
const KERB: Rgb = hex('#b9ae95')
const WATER: Rgb = hex('#6d93a0')
const FALL: Rgb = hex('#c4d8dc')
const BRONZE: Rgb = hex('#5f5846')

const rect = (hx: number, hz: number) => [{ x: -hx, z: -hz }, { x: hx, z: -hz }, { x: hx, z: hz }, { x: -hx, z: hz }]

function draw(q: MeshBuilder): void {
  // the trough: wall, rim, water, a sheet of fall down its face, and a raised seat at each end
  basin(q, rect(HX, HZ), rect(HX - WALL, HZ - WALL), 0, G + BASIN_H, STONE, WATER)
  falls(q, rect(HX, HZ), G + 0.1, G + BASIN_H - 0.05, shade(FALL, 0.97))
  for (const s of [-1, 1]) block(q, s * (HX - 0.55) - 0.55, s * (HX - 0.55) + 0.55, -HZ - 0.02, HZ + 0.02, G + BASIN_H, G + BASIN_H + END_UP, KERB)
  const y0 = G + 0.05
  // the plinth, with a ledge half-way and a moulded top
  block(q, -PLINTH_X, PLINTH_X, -PLINTH_Z, PLINTH_Z, y0, y0 + PLINTH_H - 0.12, shade(STONE, 0.97))
  block(q, -PLINTH_X - 0.08, PLINTH_X + 0.08, -PLINTH_Z - 0.08, PLINTH_Z + 0.08, y0 + PLINTH_H - 0.12, y0 + PLINTH_H, shade(STONE, 1.05))
  // the die: courses of ashlar
  const dy = y0 + PLINTH_H
  const top = y0 + DIE_TOP
  block(q, -DIE_X, DIE_X, -DIE_Z, DIE_Z, dy, top, STONE)
  const courses = Math.round((top - dy) / 0.55)
  for (let i = 1; i < courses; i++) {
    const y = dy + ((top - dy) * i) / courses
    block(q, -DIE_X - 0.015, DIE_X + 0.015, -DIE_Z - 0.015, DIE_Z + 0.015, y - 0.012, y + 0.012, shade(STONE, 0.85))
  }
  // cornice with a darker frieze of garlands, then the pediment (ridge along z: gables on the long faces)
  block(q, -DIE_X - 0.12, DIE_X + 0.12, -DIE_Z - 0.12, DIE_Z + 0.12, top, top + CORNICE_H, shade(STONE, 1.05))
  block(q, -DIE_X - 0.01, DIE_X + 0.01, -DIE_Z - 0.01, DIE_Z + 0.01, top - 0.38, top - 0.05, DARK)
  const ry = top + CORNICE_H
  const hxr = DIE_X + 0.12
  roof(q, -hxr, hxr, -DIE_Z - 0.12, DIE_Z + 0.12, ry, PEDIMENT_H, hxr, 0, shade(STONE, 0.93))
  // relief panels on the four faces (dark, 4 cm proud) with a lintel line over each
  const py0 = y0 + PANEL_Y[0]
  const py1 = y0 + PANEL_Y[1]
  for (const s of [-1, 1]) {
    block(q, -PANEL_HX[0], PANEL_HX[0], s * DIE_Z - (s < 0 ? 0.045 : 0), s * DIE_Z + (s > 0 ? 0.045 : 0), py0, py1, RELIEF)
    block(q, -0.3, 0.3, s * DIE_Z - (s < 0 ? 0.03 : 0), s * DIE_Z + (s > 0 ? 0.03 : 0), py1 + 0.12, py1 + 0.2, DARK)       // the inscription
    block(q, s * DIE_X - (s < 0 ? 0.045 : 0), s * DIE_X + (s > 0 ? 0.045 : 0), -PANEL_HX[1], PANEL_HX[1], py0, py1, RELIEF)
    block(q, s * DIE_X - (s < 0 ? 0.03 : 0), s * DIE_X + (s > 0 ? 0.03 : 0), -0.24, 0.24, py1 + 0.12, py1 + 0.2, DARK)
  }
  // on each long face: a mascaron spouting into a shell bowl, its jet falling into the trough
  for (const s of [-1, 1]) {
    const zf = s * DIE_Z
    const bz = zf + s * (BOWL_R * 0.55)
    // the mascaron: a bronze disc facing out
    mascaron(q, 0, y0 + 2.25, zf, s)
    fountainBowl(q, 0, bz, y0 + BOWL_Y, BOWL_R, { depth: 0.38, stem: 0.12, drop: 0.07, sides: 14, body: shade(STONE, 1.02), water: WATER })
    // water falls from the bowl's lip into the trough
    block(q, -0.07, 0.07, bz + s * (BOWL_R - 0.03) - 0.02, bz + s * (BOWL_R - 0.03) + 0.02, G + BASIN_H, y0 + BOWL_Y + 0.2, FALL)
  }
}

/** a bronze mascaron: a disc with a spout stub, on the face at z facing s */
function mascaron(q: MeshBuilder, x: number, y: number, z: number, s: number): void {
  block(q, x - 0.17, x + 0.17, s > 0 ? z : z - 0.06, s > 0 ? z + 0.06 : z, y - 0.17, y + 0.17, BRONZE)
  block(q, x - 0.05, x + 0.05, s > 0 ? z + 0.06 : z - 0.2, s > 0 ? z + 0.2 : z - 0.06, y - 0.05, y + 0.05, shade(BRONZE, 0.8))
}

export function fontainePaix(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
