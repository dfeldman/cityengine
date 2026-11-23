import type { MeshBuilder } from '../../../buildings.ts'
import { prism, type Rgb } from '../../../models.ts'
import { block, hex, lathe, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { fitted } from '../palaces/common.ts'
import { FIXED } from './common.ts'
import { G } from './plaza-common.ts'
import { plaque, roundBasin, steppedBase } from './monument-kit.ts'

/*
 * LE MONUMENT À GAVARNI (place Saint-Georges, 9e; sculptor Denys Puech, architect Henri Guillaume, 1904; Wikidata Q3076026,
 * OSM node, tagged amenity=fountain): in the middle of the roundabout, inside an iron railing, a low round basin holds a
 * square plinth with a bronze mask spouting on two sides; above it a stout round column of pale stone carries, in high
 * relief, Gavarni's carnival figures (Pierrot, Thomas Vireloque, children) and, over a carved frieze and cornice, the
 * half-length statue of Paul Gavarni reading (Modly: statues manifest `gavarni-statue`; the relief figures and masks are procedural stand-ins).
 * Frame: −z the front, x across, y up from the pavement (G; the loader sinks every model).
 * Dimensions are scaled off Commons photographs (Monument Gavarni 2021-06-27 −3/−5, Fontaine Gavarni Paris 9e) against the
 * railing (~1 m) and the shaft (~1 m across): about 7.4 m in all, by eye and not surveyed.
 */
export const HX = 3.6
export const HZ = 3.6

// tunables (metres above the pavement)
const RING_R = 3.3              // the paved step round the monument
const RAIL_R = 2.7              // the iron railing
const RAIL_H = 1.0
const BASIN_R = 1.95
const BASIN_H = 0.5
const PLINTH_W = 0.95           // plinth half-width
const PLINTH_Y0 = 0.3, PLINTH_Y1 = 1.85
const COR1 = 2.0                // plinth cornice top
const SHAFT_Y1 = 5.5, SHAFT_R0 = 0.52, SHAFT_R1 = 0.47
const FRIEZE_Y1 = 5.95
const CORN_Y1 = 6.1
export const STATUE_AT: [number, number, number] = [0, G + CORN_Y1, 0]
const MASK_Y = 1.15
const BRONZE: Rgb = hex('#5a6e4e')

const STONE: Rgb = hex('#cdc6b4')
const PALE: Rgb = hex('#d9d2bf')
const DARK: Rgb = hex('#aaa290')
const WATER: Rgb = hex('#6d93a0')
const STEPC: Rgb = hex('#b6ae9c')
const IRON: Rgb = hex('#26302c')

function railing(q: MeshBuilder): void {
  const n = 64
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, b = ((i + 1) / n) * Math.PI * 2
    const x = Math.sin(a) * RAIL_R, z = Math.cos(a) * RAIL_R
    block(q, x - 0.012, x + 0.012, z - 0.012, z + 0.012, G, G + RAIL_H, IRON)
    // two rails and a scroll band between posts
    for (const h of [0.12, RAIL_H - 0.05]) {
      const x1 = Math.sin(b) * RAIL_R, z1 = Math.cos(b) * RAIL_R
      block(q, Math.min(x, x1) - 0.012, Math.max(x, x1) + 0.012, Math.min(z, z1) - 0.012, Math.max(z, z1) + 0.012, G + h, G + h + 0.03, IRON)
    }
    if (i % 4 === 0) block(q, x - 0.03, x + 0.03, z - 0.03, z + 0.03, G + RAIL_H, G + RAIL_H + 0.08, IRON)
  }
}


/** STAND-IN for the carnival figures in relief on the shaft (three Modly attempts from the one photo gave blobs): a Pierrot with ruff and hat, a child, a mask, as rounded stone lumps. */
function carnival(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  const zf = -SHAFT_R0 * 0.93
  const lump = (cx: number, cz: number, y0: number, h: number, r: number, c: Rgb): void =>
    lathe(q, cx, cz, [[0, y(y0)], [r * 0.8, y(y0 + h * 0.1)], [r, y(y0 + h * 0.5)], [r * 0.7, y(y0 + h * 0.9)], [0, y(y0 + h)]], 10, c)
  lump(-0.05, zf - 0.06, 2.5, 1.0, 0.2, STONE)                 // body
  lump(-0.15, zf - 0.05, 2.4, 0.55, 0.07, DARK)                // legs
  lump(0.05, zf - 0.05, 2.4, 0.55, 0.07, DARK)
  lump(-0.05, zf - 0.09, 3.3, 0.22, 0.1, PALE)                 // head
  prism(q, -0.05, zf - 0.09, y(3.2), y(3.28), 0.17, 12, PALE, FIXED, 0.17, true)    // ruff
  prism(q, -0.02, zf - 0.09, y(3.5), y(3.78), 0.12, 10, DARK, FIXED, 0.02, true)     // hat
  lump(0.3, zf - 0.04, 2.6, 0.55, 0.12, STONE)                  // child
  lump(0.3, zf - 0.06, 3.1, 0.14, 0.07, PALE)
  lump(-0.32, zf - 0.03, 3.0, 0.3, 0.09, DARK)                  // mask
}

/** Bronze mask on a plinth side (dir ±1 along x): a plate, a nose and brows. */
function mask(q: MeshBuilder, dir: number): void {
  const y = (v: number): number => G + v
  const x0 = dir * (PLINTH_W + 0.01), x1 = dir * (PLINTH_W + 0.07), x2 = dir * (PLINTH_W + 0.13)
  const bx = (a: number, b: number, z0: number, z1: number, y0: number, y1: number): void =>
    block(q, Math.min(a, b), Math.max(a, b), z0, z1, y(y0), y(y1), BRONZE)
  bx(x0, x1, -0.15, 0.15, MASK_Y - 0.17, MASK_Y + 0.17)
  bx(x1, x2, -0.03, 0.03, MASK_Y - 0.08, MASK_Y + 0.06)
  bx(x1, x2, -0.14, 0.14, MASK_Y + 0.07, MASK_Y + 0.11)
  bx(x1, x2, -0.06, 0.06, MASK_Y - 0.14, MASK_Y - 0.08)
}

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  // paving step, basin with water
  prism(q, 0, 0, G, y(0.1), RING_R, 32, STEPC, FIXED, RING_R, true)
  steppedBase(q, 0, 0, y(0.1), [[2.4, 0.1]], STEPC, true)
  roundBasin(q, 0, 0, y(0.2), BASIN_R, { rim: 0.3, depth: BASIN_H - 0.2, lip: 0.06, stone: STONE, water: WATER, sides: 32 })
  // plinth: base course, die, cornice
  block(q, -PLINTH_W - 0.12, PLINTH_W + 0.12, -PLINTH_W - 0.12, PLINTH_W + 0.12, y(PLINTH_Y0), y(0.7), DARK)
  block(q, -PLINTH_W, PLINTH_W, -PLINTH_W, PLINTH_W, y(0.7), y(PLINTH_Y1), STONE)
  block(q, -PLINTH_W - 0.1, PLINTH_W + 0.1, -PLINTH_W - 0.1, PLINTH_W + 0.1, y(PLINTH_Y1), y(PLINTH_Y1 + 0.08), PALE)
  block(q, -PLINTH_W - 0.04, PLINTH_W + 0.04, -PLINTH_W - 0.04, PLINTH_W + 0.04, y(PLINTH_Y1 + 0.08), y(COR1), DARK)
  // inscription cartouche on the front, a spout trough under each side mask
  plaque(q, { x: 0, z: -PLINTH_W - 0.001, y0: y(1.1), w: 0.9, h: 0.5, panel: shade(PALE, 1.03), frame: DARK, fw: 0.04, letters: shade(STONE, 0.55), lines: [0.9, 0.7, 0.8] })
  for (const sx of [-1, 1]) block(q, sx * (PLINTH_W + 0.02) - 0.02, sx * (PLINTH_W + 0.02) + 0.02, -0.3, 0.3, y(MASK_Y - 0.2), y(MASK_Y + 0.5), DARK)
  // column: a round base, the shaft (with the group on its front), frieze and cornice
  prism(q, 0, 0, y(COR1), y(COR1 + 0.15), SHAFT_R0 * 1.18, 24, DARK, FIXED, SHAFT_R0 * 1.18, true)
  prism(q, 0, 0, y(COR1 + 0.15), y(SHAFT_Y1), SHAFT_R0, 24, STONE, FIXED, SHAFT_R1, true)
  lathe(q, 0, 0, [[SHAFT_R1, y(SHAFT_Y1)], [SHAFT_R1 * 1.2, y(SHAFT_Y1 + 0.04)], [SHAFT_R1 * 1.18, y(SHAFT_Y1 + 0.1)], [SHAFT_R1 * 1.12, y(SHAFT_Y1 + 0.14)]], 24, PALE)
  prism(q, 0, 0, y(SHAFT_Y1 + 0.14), y(FRIEZE_Y1), SHAFT_R1 * 1.12, 24, PALE, FIXED, SHAFT_R1 * 1.12, true)
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2, r = SHAFT_R1 * 1.12
    block(q, Math.sin(a) * r - 0.04, Math.sin(a) * r + 0.04, Math.cos(a) * r - 0.04, Math.cos(a) * r + 0.04, y(SHAFT_Y1 + 0.24), y(FRIEZE_Y1 - 0.12), DARK)
  }
  prism(q, 0, 0, y(FRIEZE_Y1), y(CORN_Y1), SHAFT_R1 * 1.35, 24, DARK, FIXED, SHAFT_R1 * 1.35, true)
  carnival(q)
  mask(q, -1)
  mask(q, 1)
  railing(q)
}

export function fontaineGavarni(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
