import type { MeshBuilder } from '../../buildings.ts'
import { prism, type Rgb } from '../../models.ts'
import { block, classicalColumn, hex, shade } from '../kit.ts'
import type { Fit } from '../fit.ts'
import type { KitArgs } from './kit/recipes.ts'
import { archAlong } from './monuments/common.ts'
import { blob } from './monuments/plaza-common.ts'

/*
 * PARIS'S WALL FOUNTAINS (fontaines murales): the neighbourhood fountains of the 17th–19th centuries set into a house front —
 * Haudriettes, Charlemagne, Pot-de-Fer, Croix-du-Trahoir and the rest (public/landmarks/paris/wall-fountains.json). One
 * parametric builder: the entry's size is the fountain (width along the wall × depth out of it × height), `kit.kind` its
 * form and `kit.p` its variant.
 *
 *   niche     a tall panel with a round-headed niche, a pediment (p odd: triangular; p even: an urn); p ≥ 3 a figure in it
 *   pilaster  a panel between two pilasters, a dark inscription tablet, an entablature and an urn
 *   arch      p blind arcades across the wall, each with its spout and trough
 *   mascaron  a small panel, a round medallion with a lion's head, a little pediment
 *   portico   a row of Tuscan columns before the wall (the Fontaine de Mars)
 *
 * Every form shares the plinth, a bronze mascaron spouting into a stone trough at the front, and the cornice. Local frame:
 * x along the wall, the wall itself at +z (= +hz), the street at −z; y from the ground at the front (fit.grade).
 * The entries are snapped to OSM's building edge, so the back face sits on the house and the rest stands in the street.
 */
const STONE: Rgb = hex('#cbc1a8')
const PALE: Rgb = hex('#d9d1bc')
const BAND: Rgb = hex('#a69c86')
const DARK: Rgb = hex('#4a4d4a')
const SLATE: Rgb = hex('#2c2f33')
const BRONZE: Rgb = hex('#3f4a3f')
const WATER: Rgb = hex('#3d5d66')
const FIGURE: Rgb = hex('#ddd8ca')

/** tunables, metres */
const PANEL = 0.3        // the panel's depth off the house
const PLINTH_H = 0.55
const PLINTH_OUT = 0.12  // how far the plinth stands proud of the panel
const SPOUT_Y = 1.25     // the mascaron's height
const TROUGH_H = 0.6
const TROUGH_W = 0.5     // of the panel's width (or the bay's)
const CORNICE_H = 0.22
const CORNICE_OUT = 0.14
const PANEL_TOP = 0.82   // of the height: above it the crown (pediment, urn, entablature)

const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

/** a triangle in the plane z = zf facing −z, base from x0 to x1 at y, apex at height h */
function pediment(q: MeshBuilder, x0: number, x1: number, y: number, h: number, zf: number, zb: number, c: Rgb): void {
  const m = (x0 + x1) / 2
  q.quad([[x1, y, zf], [x0, y, zf], [m, y + h, zf], [m, y + h, zf]], [0, 0, -1], UV, shade(c, 1.05), 0)
  const s = Math.hypot(h, (x1 - x0) / 2)
  q.quad([[x0, y, zf], [x0, y, zb], [m, y + h, zb], [m, y + h, zf]], [-h / s, (x1 - x0) / 2 / s, 0], UV, shade(c, 0.88), 0)
  q.quad([[m, y + h, zf], [m, y + h, zb], [x1, y, zb], [x1, y, zf]], [h / s, (x1 - x0) / 2 / s, 0], UV, shade(c, 0.88), 0)
}

/** an urn on a little die, standing at (x, y, z), h tall */
function urn(q: MeshBuilder, x: number, y: number, z: number, h: number): void {
  block(q, x - h * 0.22, x + h * 0.22, z - h * 0.22, z + h * 0.22, y, y + h * 0.25, STONE)
  prism(q, x, z, y + h * 0.25, y + h * 0.4, h * 0.1, 8, STONE, 0, h * 0.22)
  blob(q, x, y + h * 0.58, z, h * 0.24, h * 0.2, h * 0.24, PALE, 8, 4)
  prism(q, x, z, y + h * 0.76, y + h, h * 0.06, 6, STONE, 0, h * 0.02)
}

/** a lion's-head spout on the panel face at (x, y), its jet and a trough under it reaching to the front */
function spout(q: MeshBuilder, x: number, y: number, zf: number, front: number, w: number, g: number): void {
  blob(q, x, y, zf - 0.06, 0.2, 0.22, 0.1, BRONZE, 8, 4)
  block(q, x - 0.03, x + 0.03, zf - 0.32, zf - 0.08, y - 0.12, y - 0.07, BRONZE)       // the pipe
  const hw = Math.max(0.35, w / 2)
  block(q, x - hw, x + hw, front, zf, g, g + TROUGH_H, STONE)                           // the trough
  block(q, x - hw + 0.08, x + hw - 0.08, front + 0.08, zf - 0.02, g + TROUGH_H - 0.08, g + TROUGH_H + 0.005, WATER)
  block(q, x - 0.02, x + 0.02, zf - 0.32, zf - 0.28, g + TROUGH_H, y - 0.1, WATER)        // the jet falling
}

function draw(q: MeshBuilder, fit: Fit, kind: string, p: number): void {
  const hx = fit.hx
  const back = fit.hz
  const front = -fit.hz
  const zf = back - PANEL                 // the panel's face
  const H = fit.height
  const g = fit.grade ?? 0
  const top = g + H * PANEL_TOP
  const portico = kind === 'portico'
  const W = hx * 2

  // the panel against the house, the plinth, the cornice
  block(q, -hx, hx, zf, back, g, top, STONE)
  block(q, -hx - 0.04, hx + 0.04, zf - PLINTH_OUT, back, g, g + PLINTH_H, BAND)
  block(q, -hx - 0.1, hx + 0.1, zf - CORNICE_OUT, back, top, top + CORNICE_H, PALE)
  const crown = top + CORNICE_H
  const rest = g + H - crown              // what is left for the crown

  if (kind === 'niche') {
    const nw = Math.min(W * 0.42, 2.6)
    archAlong(q, 0, zf - 0.01, 1, 0, 0, -1, g + SPOUT_Y + 0.45, nw, (top - g) - SPOUT_Y - 0.9, DARK)
    if (p >= 3) blob(q, 0, g + SPOUT_Y + 0.45 + (top - g - SPOUT_Y) * 0.32, zf - 0.15, nw * 0.2, (top - g - SPOUT_Y) * 0.3, 0.14, FIGURE, 7, 4)
    spout(q, 0, g + SPOUT_Y, zf, front, W * TROUGH_W, g)
    if (p % 2 === 1) pediment(q, -hx - 0.1, hx + 0.1, crown, Math.min(rest, W * 0.22), zf - CORNICE_OUT, back, STONE)
    else urn(q, 0, crown, zf + PANEL / 2, Math.min(rest, 1.1))
  } else if (kind === 'pilaster') {
    for (const s of [-1, 1]) {
      const x = s * (hx - 0.22)
      block(q, x - 0.2, x + 0.2, zf - 0.12, zf, g + PLINTH_H, top, PALE)
      block(q, x - 0.26, x + 0.26, zf - 0.18, zf, top - 0.25, top, STONE)                 // the capital
    }
    block(q, -hx * 0.5, hx * 0.5, zf - 0.03, zf, g + (top - g) * 0.55, g + (top - g) * 0.75, SLATE)   // the tablet
    spout(q, 0, g + SPOUT_Y, zf, front, W * TROUGH_W, g)
    block(q, -hx - 0.1, hx + 0.1, zf - CORNICE_OUT, back, crown, crown + Math.min(rest, 0.5) * 0.6, STONE)  // the frieze
    urn(q, 0, crown + Math.min(rest, 0.5) * 0.6, zf + PANEL / 2, Math.min(rest * 0.7, 1.0))
    if (p >= 2) for (const s of [-1, 1]) blob(q, s * (hx - 0.22), crown + 0.35, zf + 0.1, 0.18, 0.25, 0.18, PALE, 6, 3)  // pine cones
  } else if (kind === 'arch') {
    const n = Math.max(1, p)
    const bay = W / n
    for (let i = 0; i < n; i++) {
      const x = -hx + bay * (i + 0.5)
      archAlong(q, x, zf - 0.01, 1, 0, 0, -1, g + PLINTH_H, bay * 0.7, (top - g - PLINTH_H) * 0.82, shade(STONE, 0.72))
      spout(q, x, g + SPOUT_Y, zf - 0.02, front, bay * TROUGH_W, g)
    }
    block(q, -hx - 0.05, hx + 0.05, zf - 0.06, back, g + (top - g) * 0.62, g + (top - g) * 0.62 + 0.12, BAND)   // impost band
    if (rest > 0.4) block(q, -hx * 0.7, hx * 0.7, zf + 0.02, back, crown, crown + Math.min(rest, 0.6), STONE)   // the attic
  } else if (kind === 'mascaron') {
    const r = Math.min(hx * 0.45, 0.55)
    const cy = g + SPOUT_Y + 0.5 + r
    blob(q, 0, cy, zf - 0.02, r, r, 0.05, PALE, 12, 3)                  // the medallion
    blob(q, 0, cy, zf - 0.08, r * 0.5, r * 0.55, 0.12, BRONZE, 8, 4)    // the lion
    spout(q, 0, g + SPOUT_Y, zf, front, W * TROUGH_W, g)
    pediment(q, -hx - 0.1, hx + 0.1, crown, Math.min(rest, W * 0.25), zf - CORNICE_OUT, back, STONE)
    if (p >= 3) for (const s of [-1, 1]) block(q, s * hx - 0.12, s * hx + 0.12, zf - 0.08, zf, g + PLINTH_H, top, BAND)
  } else if (portico) {
    const n = Math.max(4, Math.round(W / 1.9))
    const cz = front + 0.35
    for (let i = 0; i < n; i++) classicalColumn(q, -hx + 0.35 + (i * (W - 0.7)) / (n - 1), cz, g + PLINTH_H, top - 0.5, 0.26, PALE)
    block(q, -hx, hx, front, back, g, g + PLINTH_H, BAND)                                 // the stylobate
    block(q, -hx - 0.05, hx + 0.05, front - 0.05, back, top - 0.5, top + CORNICE_H, STONE)  // the entablature
    archAlong(q, 0, zf - 0.01, 1, 0, 0, -1, g + SPOUT_Y + 0.4, Math.min(W * 0.2, 2), (top - g) * 0.5, DARK)
    spout(q, 0, g + SPOUT_Y, zf, cz + 0.4, W * 0.25, g + PLINTH_H - 0.3)
    if (rest > 0.3) pediment(q, -hx * 0.4, hx * 0.4, crown, Math.min(rest, 1.2), front, back, STONE)
  }
}

/** the registered builder: `{"procedural": "wallFountain", "kit": {"kind": "niche", "p": 1}}` */
export function wallFountain(out: MeshBuilder, fit: Fit, a?: KitArgs): void {
  draw(out, fit, a?.kind ?? 'niche', a?.p ?? 1)
}
