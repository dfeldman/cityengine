import type { MeshBuilder } from '../../../../buildings.ts'
import { prism, type Rgb } from '../../../../models.ts'
import { block, classicalColumn, hex, lathe, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { FIXED } from '../common.ts'
import { G } from '../plaza-common.ts'
import { plaque } from './monument-kit.ts'

/*
 * LA FONTAINE DU PUITS DE GRENELLE (place Georges-Mulot, 15e; 1906, on the site of the first artesian well of Paris;
 * Wikidata Q3076301; OSM way 252282895, the round planter it stands in, natural=water). A square ashlar mass with an
 * engaged column at each corner, a stout plinth with the bronze mascaron on the south face, an oval portrait medallion
 * in a scrolled frame on each side, a cornice and a low pyramidal stone cap under a ribbed ball.
 * Frame: −z the front (the mascaron, south), y up from the pavement (G; the loader sinks every model).
 * Dimensions are scaled off Commons photographs (Fontaine du Puits de Grenelle.jpg) against the mascaron (~0.33 m)
 * and the plinth (~2.1 m across): the ~5 m total is a by-eye figure, not surveyed; the planter is the OSM circle (3.4 m).
 * The bronze mascaron (a leaf-crowned face) is a procedural stand-in: three Modly attempts from the only usable photo
 * (~140 px of face) all came back as flat slabs.
 */
export const HX = 1.7
export const HZ = 1.7

// tunables (metres above the pavement)
const RING_R = 1.7, RING_H = 0.4, RING_T = 0.2  // the round planter kerb (OSM circle)
const PL_H = 1.05                               // half-width of the plinth
const PL_TOP = 1.2
const SH_H = 0.8                                // half-width of the shaft
const SH_TOP = 3.15
const COL_R = 0.15
const COL_BASE = 1.3
const CAP_TOP = 3.4                             // capitals' top; frieze above
const FRIEZE_TOP = 3.7
const CORNICE_TOP = 3.95
const ROOF_TOP = 4.55
const BALL_R = 0.17
const MED_Y = 2.3                               // medallion centre
const MED_A = 0.27, MED_B = 0.34                // its half-axes
const MASK_Y = 0.55                             // mascaron centre


const STONE: Rgb = hex('#c4baa3')
const PALE: Rgb = hex('#d3cab5')
const DARK: Rgb = hex('#a39a86')
const SOIL: Rgb = hex('#5b4a38')
const GREEN: Rgb = hex('#52703c')
const WATER: Rgb = hex('#6d93a0')
const BRONZE: Rgb = hex('#3f4a3c')

/** An oval relief standing `d` proud of a wall plane (axis `ax`: 'z' faces -z/+z by sign s, 'x' likewise) */
function oval(q: MeshBuilder, ax: 'x' | 'z', s: number, w: number, yc: number, a: number, b: number, d: number, c: Rgb): void {
  const N = 14
  for (let i = 0; i < N; i++) {
    const t0 = -1 + (2 * i) / N, t1 = -1 + (2 * (i + 1)) / N
    const tm = (t0 + t1) / 2
    const hw = a * Math.sqrt(Math.max(0, 1 - tm * tm))
    const y0 = yc + t0 * b, y1 = yc + t1 * b
    if (ax === 'z') block(q, -hw, hw, s < 0 ? s * w - d : s * w, s < 0 ? s * w : s * w + d, y0, y1, c)
    else block(q, s < 0 ? s * w - d : s * w, s < 0 ? s * w : s * w + d, -hw, hw, y0, y1, c)
  }
}

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  // the round planter: kerb ring, soil, and a few green tufts
  lathe(q, 0, 0, [[RING_R, y(0)], [RING_R, y(RING_H)], [RING_R - RING_T, y(RING_H)], [RING_R - RING_T, y(0.1)]], 28, DARK)
  prism(q, 0, 0, y(0.08), y(0.18), RING_R - RING_T, 20, SOIL, FIXED, RING_R - RING_T, true)
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2 + 0.3
    const r = 1.25 + (k % 3) * 0.08
    prism(q, Math.sin(a) * r, Math.cos(a) * r, y(0.18), y(0.4 + (k % 2) * 0.1), 0.12, 5, GREEN, FIXED, 0.03, true)
  }
  // plinth: step, block with a moulded top, the small drinking ledge under the mascaron
  block(q, -PL_H - 0.1, PL_H + 0.1, -PL_H - 0.1, PL_H + 0.1, y(0.15), y(0.3), DARK)
  block(q, -PL_H, PL_H, -PL_H, PL_H, y(0.3), y(PL_TOP - 0.12), STONE)
  block(q, -PL_H - 0.06, PL_H + 0.06, -PL_H - 0.06, PL_H + 0.06, y(PL_TOP - 0.12), y(PL_TOP), PALE)
  // the mascaron's recess: a shallow stone slab with a small basin lip below
  block(q, -0.3, 0.3, -PL_H - 0.03, -PL_H, y(MASK_Y - 0.28), y(MASK_Y + 0.3), DARK)
  block(q, -0.3, 0.3, -PL_H - 0.28, -PL_H, y(MASK_Y - 0.4), y(MASK_Y - 0.28), PALE)
  block(q, -0.24, 0.24, -PL_H - 0.24, -PL_H, y(MASK_Y - 0.28), y(MASK_Y - 0.25), WATER)
  // the bronze mascaron (stand-in): an ovoid face half out of the slab, a leaf crown, a drape under the chin
  const mz = -PL_H - 0.03, my = y(MASK_Y)
  lathe(q, 0, mz - 0.01, [[0, my - 0.15], [0.09, my - 0.1], [0.12, my], [0.1, my + 0.09], [0.0, my + 0.14]], 12, BRONZE)
  for (let k = 0; k < 7; k++) {
    const a = -Math.PI * 0.1 + (k / 6) * Math.PI * 1.2 - Math.PI * 0.05
    block(q, Math.cos(a) * 0.13 - 0.025, Math.cos(a) * 0.13 + 0.025, mz - 0.07, mz - 0.01, my + 0.04 + Math.sin(a) * 0.12, my + 0.12 + Math.sin(a) * 0.12, BRONZE)
  }
  block(q, -0.1, 0.1, mz - 0.05, mz - 0.01, my - 0.26, my - 0.14, BRONZE)
  // shaft with ashlar courses, a set-back base for the columns
  block(q, -SH_H, SH_H, -SH_H, SH_H, y(PL_TOP), y(SH_TOP), STONE)
  for (let c = 0; c < 9; c++) {
    const yc = PL_TOP + 0.2 + c * 0.2
    if (yc > MED_Y - 0.4 && yc < MED_Y + 0.4) continue
    const h = SH_H + 0.012
    block(q, -h, h, -h, h, y(yc), y(yc) + 0.014, DARK)
  }
  // corner columns and capitals
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const cx = sx * (SH_H - 0.05), cz = sz * (SH_H - 0.05)
    block(q, cx - 0.2, cx + 0.2, cz - 0.2, cz + 0.2, y(PL_TOP), y(COL_BASE), PALE)
    classicalColumn(q, cx, cz, y(COL_BASE), y(SH_TOP), COL_R, PALE, { order: 'corinthian' })
    block(q, cx - 0.22, cx + 0.22, cz - 0.22, cz + 0.22, y(SH_TOP), y(CAP_TOP), PALE)
  }
  // frieze and cornice
  block(q, -SH_H - 0.1, SH_H + 0.1, -SH_H - 0.1, SH_H + 0.1, y(CAP_TOP), y(FRIEZE_TOP), STONE)
  block(q, -SH_H - 0.3, SH_H + 0.3, -SH_H - 0.3, SH_H + 0.3, y(FRIEZE_TOP), y(CORNICE_TOP - 0.1), PALE)
  block(q, -SH_H - 0.34, SH_H + 0.34, -SH_H - 0.34, SH_H + 0.34, y(CORNICE_TOP - 0.1), y(CORNICE_TOP), DARK)
  // medallions in scrolled frames on all four faces, an inscription plaque under the south one
  for (const s of [-1, 1]) {
    oval(q, 'z', s, SH_H, y(MED_Y), MED_A + 0.07, MED_B + 0.07, 0.04, DARK)
    oval(q, 'z', s, SH_H + 0.04, y(MED_Y), MED_A, MED_B, 0.02, shade(PALE, 1.05))
    oval(q, 'z', s, SH_H + 0.06, y(MED_Y + 0.03), MED_A * 0.58, MED_B * 0.62, 0.04, PALE)
    oval(q, 'x', s, SH_H, y(MED_Y), MED_A + 0.07, MED_B + 0.07, 0.04, DARK)
    oval(q, 'x', s, SH_H + 0.04, y(MED_Y), MED_A, MED_B, 0.02, shade(PALE, 1.05))
    oval(q, 'x', s, SH_H + 0.06, y(MED_Y + 0.03), MED_A * 0.58, MED_B * 0.62, 0.04, PALE)
  }
  plaque(q, { x: 0, z: -SH_H, y0: y(MED_Y - MED_B - 0.4), w: 0.5, h: 0.2, panel: shade(PALE, 1.03), frame: DARK, fw: 0.02, letters: shade(STONE, 0.55), lines: [0.9, 0.7] })
  // low pyramidal cap, convex, a ribbed ball on top
  const RT = SH_H + 0.34
  for (let k = 0; k < 4; k++) {
    const y0 = CORNICE_TOP + k * 0.12
    const r0 = (RT - 0.04) * (1 - Math.pow(k / 5, 1.6))
    const r1 = (RT - 0.04) * (1 - Math.pow((k + 1) / 5, 1.6))
    prism(q, 0, 0, y(y0), y(y0 + 0.12), r0 * Math.SQRT2, 4, k % 2 ? PALE : STONE, FIXED, r1 * Math.SQRT2, true, Math.PI / 4)
  }
  prism(q, 0, 0, y(CORNICE_TOP + 0.48), y(ROOF_TOP - BALL_R * 1.6), 0.24 * Math.SQRT2, 4, PALE, FIXED, 0.15, true, Math.PI / 4)
  const by = ROOF_TOP - BALL_R * 0.4
  lathe(q, 0, 0, [[0, y(by - BALL_R)], [BALL_R * 0.7, y(by - BALL_R * 0.7)], [BALL_R, y(by)], [BALL_R * 0.7, y(by + BALL_R * 0.8)], [BALL_R * 0.25, y(by + BALL_R * 1.2)], [0, y(by + BALL_R * 1.3)]], 12, PALE)
}

export function fontaineGrenelle(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
