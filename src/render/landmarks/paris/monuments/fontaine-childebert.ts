import type { MeshBuilder } from '../../../buildings.ts'
import { type Rgb } from '../../../models.ts'
import { beam, block, hex, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { fitted } from '../palaces/common.ts'
import { G, basin } from './plaza-common.ts'

/*
 * LA FONTAINE CHILDEBERT (square Paul-Langevin, 5e; Jean Beausire, 1715-17, re-erected here in 1875; Wikidata Q3076004): a
 * stone wall fountain against the foot of the trellised terrace wall — a pier of ashlar with a pilaster each side, in it a
 * shell-headed niche over a sunk panel, a plain shelf, and on the panel the bronze mascaron spout (a Modly model: statues
 * manifest `childebert-mascaron`); in front a low curved basin. Frame: −z the front, x across, y up, pavement at G.
 * Dimensions read off Commons photos (Fontaine Childebert Paris 5e.jpg) at ~150 px/m using the bronze mascaron (~0.3 m)
 * and the pilaster width: not surveyed, heights are the shakiest. The dolphins and the Latin verse of the original are lost.
 * No OSM way is mapped for the fountain (only the school walls), so none is claimed.
 */
export const HX = 1.4
export const HZ = 1.5

// tunables
const PIER_W = 0.9            // half-width of the pier
const PIER_H = 3.4
const PIER_D = 0.6            // depth of the pier
const Z_FRONT = 0.4           // the pier's front face (the wall behind is at Z_FRONT + PIER_D)
const BASE_H = 0.4            // basin rim height; the pier stands on the basin's back
const PIL_W = 0.3
const PIL_PROUD = 0.08
const SPRING = 2.2            // arch springing
const ARCH_R = 0.5            // niche half-width
const BASIN_RX = 1.2          // half-width of the curved basin
const BASIN_RZ = 1.35         // how far the curve reaches in front
const SHELF_H = 0.28
const LIFT = 0.6              // the lawn here stands proud of the pavement datum: raise the whole fountain, its basin wall reaching down

const STONE: Rgb = hex('#c9bb98')
const PALE: Rgb = hex('#d6c9a8')
const DARK: Rgb = hex('#a2967a')
const MOSS: Rgb = hex('#7d8a5a')
const WATER: Rgb = hex('#6d93a0')

/** Attach point of the bronze mascaron (landmark frame: y includes G) */
export const MASK_AT: [number, number, number] = [0, G + LIFT + 0.95, Z_FRONT - 0.04]

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + LIFT + v
  const zf = Z_FRONT
  const zb = Z_FRONT + PIER_D
  // the curved basin: a flat-backed half-ellipse in front of the pier, water under its rim
  const plan = [] as { x: number; z: number }[]
  const inner = [] as { x: number; z: number }[]
  const N = 20
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI
    plan.push({ x: Math.cos(a) * BASIN_RX, z: zf - Math.sin(a) * BASIN_RZ })
    inner.push({ x: Math.cos(a) * (BASIN_RX - 0.32), z: zf - 0.1 - Math.sin(a) * (BASIN_RZ - 0.32) })
  }
  basin(q, plan, inner, y(-LIFT - 0.1), y(BASE_H), STONE, WATER)
  // the pier on the basin's back, over a plinth
  block(q, -PIER_W - 0.08, PIER_W + 0.08, zf - 0.05, zb, y(BASE_H), y(BASE_H + 0.2), DARK)
  const b0 = BASE_H + 0.2
  block(q, -PIER_W, PIER_W, zf, zb, y(b0), y(PIER_H), STONE)
  // ashlar courses: darker joint bands
  for (let yy = b0 + 0.45; yy < PIER_H - 0.1; yy += 0.45) block(q, -PIER_W - 0.005, PIER_W + 0.005, zf - 0.012, zf, y(yy), y(yy) + 0.025, shade(STONE, 0.78))
  // pilasters each side
  for (const sx of [-1, 1]) block(q, sx * (PIER_W - PIL_W / 2) - PIL_W / 2, sx * (PIER_W - PIL_W / 2) + PIL_W / 2, zf - PIL_PROUD, zf, y(b0), y(SPRING + 0.1), PALE)
  // the sunk panel and the shelf
  block(q, -0.5, 0.5, zf - 0.025, zf, y(b0 + 0.3), y(1.8), PALE)
  block(q, -0.44, 0.44, zf - 0.04, zf - 0.02, y(b0 + 0.36), y(1.74), shade(STONE, 0.95))
  block(q, -0.62, 0.62, zf - 0.22, zf, y(b0 + 0.02), y(b0 + SHELF_H), PALE)
  // niche: dark half-round recess over the panel, a moulded archivolt and the shell's ribs
  block(q, -ARCH_R, ARCH_R, zf - 0.03, zf, y(1.85), y(SPRING), shade(DARK, 0.85))
  const M = 12
  for (let i = 0; i < M; i++) {
    const a0 = (i / M) * Math.PI, a1 = ((i + 1) / M) * Math.PI
    const p0: [number, number, number] = [Math.cos(a0) * ARCH_R, y(SPRING + Math.sin(a0) * ARCH_R), zf - 0.05]
    const p1: [number, number, number] = [Math.cos(a1) * ARCH_R, y(SPRING + Math.sin(a1) * ARCH_R), zf - 0.05]
    beam(q, p0, p1, 0.045, PALE)
    const r2 = ARCH_R * 0.92
    beam(q, [0, y(SPRING - 0.02), zf - 0.04], [Math.cos(a0) * r2, y(SPRING + Math.sin(a0) * r2), zf - 0.04], 0.018, shade(DARK, 0.7))
  }
  block(q, -ARCH_R * 0.9, ARCH_R * 0.9, zf - 0.035, zf - 0.02, y(SPRING - 0.02), y(SPRING + 0.02), shade(DARK, 0.8))
  // scrolled keystone block over the niche, a drain grate under the shelf, the cap and a little ivy
  block(q, -0.16, 0.16, zf - 0.09, zf, y(SPRING + ARCH_R), y(SPRING + ARCH_R + 0.22), PALE)
  block(q, -PIER_W - 0.12, PIER_W + 0.12, zf - 0.14, zb + 0.05, y(PIER_H), y(PIER_H + 0.14), PALE)
  block(q, -0.7, -0.25, zf - 0.03, zf, y(PIER_H - 0.5), y(PIER_H), MOSS)
  block(q, 0.5, 0.8, zf - 0.03, zf, y(PIER_H - 0.9), y(PIER_H), MOSS)
  // the bronze outlet nub under the mascaron's mouth
  beam(q, [0, y(0.95), zf - 0.12], [0, y(0.75), zf - 0.2], 0.03, shade(DARK, 0.5))
}

export function fontaineChildebert(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
