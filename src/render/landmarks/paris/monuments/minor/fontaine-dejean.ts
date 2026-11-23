import type { MeshBuilder } from '../../../../buildings.ts'
import { prism, type Rgb } from '../../../../models.ts'
import { block, hex, lathe, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { FIXED } from '../common.ts'
import { G } from '../plaza-common.ts'
import { fountainBowl, plaque } from './monument-kit.ts'

/*
 * LA FONTAINE DEJEAN (place Pasdeloup, 11e; Jean Camille Formigé, sculptor Charles-Louis Malric, 1906; Wikidata Q3076013,
 * OSM node 2482248710): the only one of the twelve fountains the city architect François-Eugène Dejean meant to give Paris.
 * A tall octagonal pedestal of pale stone: a stout base with a carved frieze, a scallop shell on each side taking the water
 * from a dolphin, a gadrooned bowl, a tapering shaft with Dejean's oval portrait medallion and the inscription, a cornice,
 * an acanthus vase and a sphere on which a pelican pierces its breast (Modly: statues manifest `dejean-pelican`).
 * Frame: −z the front (the medallion), x across the shells, y up from the pavement (G; the loader sinks every model).
 * Dimensions are scaled off Commons photographs (Fontaine Dejean.jpg, Fontaine Dejean Paris 3.jpg, détail) against the
 * medallion (~0.4 m wide) and the base (~1 m across): the ~4 m total is a by-eye figure, not surveyed.
 */
export const HX = 1.6
export const HZ = 1.6

// tunables (metres above the pavement unless noted)
const OCT = (Math.PI * 7) / 8   // prism phase: a flat face looks at −z
const AP = Math.cos(Math.PI / 8) // apothem / circumradius of an octagon
const STEP_R = 1.05             // the paving step round the foot (circumradius)
const STEP_H = 0.1
const BASE_R = 0.56             // base block circumradius
const BASE_TOP = 1.05
const FRIEZE_TOP = 1.3
const SHELL_X = 0.8             // shell centres from the axis
const SHELL_Y = 1.1
const SHELL_R = 0.42
const NECK_TOP = 1.6
const BOWL_TOP = 2.05
const SHAFT_R0 = 0.4, SHAFT_R1 = 0.33
const SHAFT_TOP = 3.0
const MED_Y = 2.52              // medallion centre
const MED_A = 0.19, MED_B = 0.25 // its half-width and half-height
const SPHERE_Y = 3.5            // sphere centre (the pelican sits on its top)
const SPHERE_R = 0.14

/** The pelican stands on the sphere's top, on the axis (landmark frame): for the statues manifest */
export const PELICAN_AT: [number, number, number] = [0, G + SPHERE_Y + SPHERE_R - 0.06, 0]

const STONE: Rgb = hex('#c9c0ab')
const PALE: Rgb = hex('#d6cdb8')
const DARK: Rgb = hex('#a89f8b')
const WATER: Rgb = hex('#6d93a0')
const STEPC: Rgb = hex('#b4ac9a')

/** shaft circumradius at height y (linear taper SHAFT_R0 at BOWL_TOP to SHAFT_R1 at SHAFT_TOP) */
const shaftR = (y: number): number => SHAFT_R0 + (SHAFT_R1 - SHAFT_R0) * ((y - BOWL_TOP) / (SHAFT_TOP - BOWL_TOP))

/** An oval relief standing `d` proud of a wall plane z, centre (x, yc), half-axes a × b, built from horizontal slices. */
function oval(q: MeshBuilder, x: number, z: number, yc: number, a: number, b: number, d: number, c: Rgb): void {
  const N = 14
  for (let i = 0; i < N; i++) {
    const t0 = -1 + (2 * i) / N, t1 = -1 + (2 * (i + 1)) / N
    const tm = (t0 + t1) / 2
    const w = a * Math.sqrt(Math.max(0, 1 - tm * tm))
    block(q, x - w, x + w, z - d, z, yc + t0 * b, yc + t1 * b, c)
  }
}

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  // the paving step and the stout base
  prism(q, 0, 0, 0, y(STEP_H), STEP_R, 8, STEPC, FIXED, STEP_R, true, OCT)
  prism(q, 0, 0, y(STEP_H), y(0.3), BASE_R * 1.1, 8, DARK, FIXED, BASE_R * 1.1, true, OCT)
  prism(q, 0, 0, y(0.3), y(BASE_TOP), BASE_R, 8, STONE, FIXED, BASE_R * 0.96, true, OCT)
  // carved frieze: a collar with vertical gadroons
  prism(q, 0, 0, y(BASE_TOP), y(FRIEZE_TOP), BASE_R * 1.07, 8, PALE, FIXED, BASE_R * 1.07, true, OCT)
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2 + 0.2
    const r = BASE_R * 1.07 * AP + 0.01
    block(q, Math.sin(a) * r - 0.025, Math.sin(a) * r + 0.025, -Math.cos(a) * r * 0 + Math.cos(a) * r - 0.025, Math.cos(a) * r + 0.025, y(BASE_TOP + 0.04), y(FRIEZE_TOP - 0.04), DARK)
  }
  // the two scallop shells (a shallow bowl, ribs and a scroll at the tip), water in each
  for (const sx of [-1, 1]) {
    const cx = sx * SHELL_X
    fountainBowl(q, cx, 0, y(SHELL_Y), SHELL_R, { depth: 0.2, stem: 0.12, body: PALE, water: WATER, sides: 12 })
    block(q, sx * (SHELL_X + SHELL_R - 0.03) - 0.07, sx * (SHELL_X + SHELL_R - 0.03) + 0.07, -0.18, 0.18, y(SHELL_Y + 0.14), y(SHELL_Y + 0.32), PALE)
    // the stem joining it to the base
    block(q, Math.min(0, sx * 0.4), Math.max(0, sx * 0.4) + sx * 0.12 * 0, -0.1, 0.1, y(SHELL_Y - 0.02), y(SHELL_Y + 0.1), STONE)
  }
  // neck, gadrooned bowl, shaft
  prism(q, 0, 0, y(FRIEZE_TOP), y(NECK_TOP), BASE_R * 0.9, 8, STONE, FIXED, 0.42, true, OCT)
  lathe(q, 0, 0, [[0.42, y(NECK_TOP)], [0.56, y(NECK_TOP + 0.12)], [0.58, y(NECK_TOP + 0.3)], [0.5, y(BOWL_TOP - 0.05)], [0.42, y(BOWL_TOP)]], 24, PALE)
  prism(q, 0, 0, y(BOWL_TOP), y(SHAFT_TOP), SHAFT_R0, 8, STONE, FIXED, SHAFT_R1, true, OCT)
  // medallion on the front face, with the bust and the inscription cartouche under it
  const zf = -shaftR(MED_Y) * AP
  oval(q, 0, zf, y(MED_Y), MED_A + 0.04, MED_B + 0.04, 0.03, DARK)
  oval(q, 0, zf - 0.03, y(MED_Y), MED_A, MED_B, 0.015, shade(PALE, 1.05))
  oval(q, 0, zf - 0.045, y(MED_Y + 0.03), MED_A * 0.55, MED_B * 0.6, 0.03, PALE)
  const zp = -shaftR(MED_Y - MED_B - 0.2) * AP
  plaque(q, { x: 0, z: zp, y0: y(MED_Y - MED_B - 0.4), w: 0.5, h: 0.28, panel: shade(PALE, 1.03), frame: DARK, fw: 0.03, letters: shade(STONE, 0.55), lines: [0.9, 0.95, 0.9, 0.7] })
  // cornice, acanthus vase, sphere
  prism(q, 0, 0, y(SHAFT_TOP), y(SHAFT_TOP + 0.08), 0.5, 8, DARK, FIXED, 0.5, true, OCT)
  prism(q, 0, 0, y(SHAFT_TOP + 0.08), y(SHAFT_TOP + 0.2), 0.45, 8, PALE, FIXED, 0.3, true, OCT)
  lathe(q, 0, 0, [[0.0, y(SHAFT_TOP + 0.2)], [0.2, y(SHAFT_TOP + 0.2)], [0.24, y(SHAFT_TOP + 0.32)], [0.16, y(SHAFT_TOP + 0.4)], [0.09, y(SHAFT_TOP + 0.46)], [0.0, y(SHAFT_TOP + 0.46)]], 16, STONE)
  const sy = SPHERE_Y
  lathe(q, 0, 0, [[0.0, y(sy - SPHERE_R)], [SPHERE_R * 0.7, y(sy - SPHERE_R * 0.7)], [SPHERE_R, y(sy)], [SPHERE_R * 0.7, y(sy + SPHERE_R * 0.7)], [0.0, y(sy + SPHERE_R)]], 16, PALE)
}

export function fontaineDejean(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
