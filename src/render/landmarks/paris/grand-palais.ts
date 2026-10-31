import type { MeshBuilder } from '../../buildings.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { classicalColumn } from '../column.ts'
import { beam, block, hex, shade } from '../kit.ts'
import { Relief, beast, figure } from './minor/sculpt.ts'
import type { Fit } from '../fit.ts'

const FIXED = 0

/**
 * The Grand Palais (1900), seen from the Seine and the Champs-Élysées (PARIS_EXPAND §5 A, the Seine priority).
 * The gist:
 *
 * - the GLASS NAVE: a great barrel vault of glass on green iron ribs, running the length of the building, and
 *   the glass DOME over its middle with its lantern and flag;
 * - the long stone front to the Avenue Winston-Churchill with its COLONNADE of paired columns, the triumphal
 *   central entrance, and the end pavilions carrying the bronze QUADRIGAS (Récipon's, green against the sky);
 * - behind, the lower stone Palais de la Découverte with the glass transept vault over its hall.
 *
 * Reworked in the top-25 audit of 2026-10-30, off "PanoramiqueGrandPalais-3600.jpg" (Commons, the true elevation): the glass was a cyan it is
 * not, dark grey on green iron; the central entrance was a block with three doors, and it is two great pylons with paired columns and their
 * groups on top, a deep porch of tall columns between them, the green-rimmed lunette of the dome over it; the colonnade is columns with
 * capitals, the statues stand on the balustrade, and the quadrigas are horses.
 *
 * Local frame: long axis x, the avenue front faces −z; fitted to OSM's footprint (~240 × 160 m with the
 * Palais de la Découverte behind).
 */
export function grandPalais(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#c9bfa8')
  const deep = shade(stone, 0.84)
  const glass: Rgb = [0.3, 0.37, 0.39]
  const iron: Rgb = [0.24, 0.39, 0.32]
  const bronze: Rgb = [0.27, 0.43, 0.36]
  const hx = Math.min(Math.max(fit.hx, 90), 103)
  const hz = Math.min(Math.max(fit.hz, 50), 80)
  const front = -hz
  const naveW = 52
  const nz0 = front + 4
  const nz1 = nz0 + naveW
  const wall = 20

  // ---- the stone body of the nave, and the Palais de la Découverte behind it
  block(out, -hx, hx, nz0, nz1, 0, wall, stone)
  block(out, -hx - 0.4, hx + 0.4, nz0 - 0.6, nz1 + 0.6, wall, wall + 1.4, deep)
  // the Palais de la Découverte fills the whole west side, round two light courts either side of the transept
  block(out, -hx, hx, nz1, hz, 0, wall - 2, stone)
  block(out, -hx - 0.4, hx + 0.4, nz1, hz + 0.6, wall - 2, wall - 0.8, deep)
  for (const sx of [-1, 1]) block(out, sx * hx * 0.55 - 22, sx * hx * 0.55 + 22, nz1 + 14, hz - 14, wall - 0.8, wall - 0.7, [0.34, 0.36, 0.36])

  // ---- the colonnade along the front: a raised base, paired columns, the entablature and balustrade
  const cz = front + 1.6
  block(out, -hx + 18, hx - 18, front - 1, nz0, 0, 2.2, shade(stone, 0.93))
  for (let x = -hx + 22; x <= hx - 22 + 0.01; x += 6) {
    for (const dx of [-0.9, 0.9]) classicalColumn(out, x + dx, cz, 2.2, wall - 1.6, 0.55, shade(stone, 1.08), { order: 'ionic', tier: 'mid', heading: Math.PI })
  }
  block(out, -hx + 18, hx - 18, front, nz0, wall - 1.6, wall, shade(stone, 1.02))
  // the wall behind the colonnade, in shadow, with its tall windows
  for (let x = -hx + 25; x <= hx - 25; x += 6) {
    if (Math.abs(x) < 36) continue
    block(out, x - 1.1, x + 1.1, nz0 - 0.05, nz0, 3, wall - 3, [0.2, 0.23, 0.25])
    // the balustrade's statues, one every other bay
    if (Math.round((x + hx) / 6) % 2 === 0) { block(out, x - 0.5, x + 0.5, front + 0.6, front + 1.6, wall, wall + 1.5, stone); prism(out, x, front + 1.1, wall + 1.5, wall + 3.4, 0.42, 6, shade(stone, 1.05), FIXED, 0.28); prism(out, x, front + 1.1, wall + 3.4, wall + 4, 0.2, 6, shade(stone, 1.05), FIXED, 0.16) }
  }
  block(out, -hx + 18, hx - 18, front + 0.3, front + 1.9, wall, wall + 1.1, shade(stone, 1.03))

  // ---- the central entrance: two great pylons, x ±21…±34, the deep porch of tall columns between them
  const dark: Rgb = [0.16, 0.18, 0.2]
  block(out, -21, 21, front - 3, nz0 + 2, 0, 2.2, shade(stone, 0.93))
  for (let i = 0; i < 7; i++) block(out, -21, 21, front - 3 - (7 - i) * 0.6, front - 3 - (6 - i) * 0.6, 0, 0.32 * (i + 1), shade(stone, 0.9))
  block(out, -21, 21, nz0, nz0 + 2, 0, wall + 3, stone)
  for (const ax of [-12, 0, 12]) {
    block(out, ax - 3.4, ax + 3.4, nz0 - 0.08, nz0, 2.2, 11, dark)
    prism(out, ax, nz0 - 0.04, 11, 14.2, 3.4, 12, dark, FIXED, 0.1, false)
    for (let x = ax - 3; x <= ax + 3; x += 1.5) box(out, x, 7, nz0 - 0.12, 0.05, 4.6, 0.05, bronze, FIXED)
  }
  for (const x of [-16.2, -9.8, -3.3, 3.3, 9.8, 16.2]) classicalColumn(out, x, front - 1.6, 2.2, wall, 0.86, shade(stone, 1.08), { order: 'ionic', tier: 'near', heading: Math.PI })
  block(out, -21, 21, front - 2.6, nz0 + 2, wall, wall + 2.4, shade(stone, 1.03))
  for (const sx of [-1, 1]) {
    const x0 = sx > 0 ? 21 : -34
    const x1 = sx > 0 ? 34 : -21
    const cx = (x0 + x1) / 2
    block(out, x0, x1, front - 4, nz0 + 4, 0, wall + 8.5, stone)
    block(out, x0 - 0.5, x1 + 0.5, front - 4.5, nz0 + 4.2, wall + 1, wall + 2.4, shade(stone, 1.05))
    // the paired columns on its front and the tall window between
    for (const dx of [-5.2, -3.6, 3.6, 5.2]) classicalColumn(out, cx + dx, front - 4.5, 2.4, wall + 1, 0.72, shade(stone, 1.08), { order: 'ionic', tier: 'near', heading: Math.PI })
    block(out, cx - 1.7, cx + 1.7, front - 4.05, front - 4, 7, wall - 1, dark)
    block(out, cx - 1.7, cx + 1.7, front - 4.05, front - 4, 1.5, 5, dark)
    // the group at its foot, the attic's garland and the great group on top
    const foot = new Relief(out, cx, 0, front - 5.6, shade(stone, 1.05), 0.9)
    block(out, cx - 2.2, cx + 2.2, front - 7, front - 4, 0, 2.2, shade(stone, 0.93))
    figure(foot, { k: 0.72, hip: [0, 3.9, 0.3], chest: [0, 5.2, 0.32], head: [0, 6.3, 0.35], armL: [[-1, 5.2, 0.35], [-1.2, 6.2, 0.35]], armR: [[1, 5, 0.35], [1, 4, 0.35]], legL: [[-0.45, 3, 0.4], [-0.6, 2.25, 0.5]], legR: [[0.45, 3, 0.4], [0.6, 2.25, 0.5]] })
    block(out, x0 + 1.5, x1 - 1.5, front - 2.5, front + 9, wall + 8.5, wall + 10.3, stone)
    prism(out, cx, front + 3, wall + 10.3, wall + 15.2, 3, 8, stone, FIXED, 1.2)
    const top = new Relief(out, cx, wall + 10.3, front + 1.5, shade(stone, 1.06), 1)
    figure(top, { k: 0.72, hip: [0, 6.2, 0.4], chest: [0.15, 7.6, 0.45], head: [0.3, 8.8, 0.5], armL: [[-0.95, 8.6, 0.5], [-0.8, 10.1, 0.5]], armR: [[1.1, 7.6, 0.5], [1.5, 6.5, 0.5]], skirt: { to: [0, 2.2, 0.4], w: 1.3 } })
    for (const s of [-1, 1]) figure(top, { k: 0.55, hip: [s * 1.9, 1.4, 0.6], chest: [s * 1.8, 2.6, 0.6], head: [s * 1.75, 3.45, 0.6], armL: [[s * 1.2, 2.5, 0.65], [s * 0.8, 3.1, 0.7]], legL: [[s * 1.4, 0.7, 0.7], [s * 1.5, 0.03, 0.7]], legR: [[s * 2.3, 0.7, 0.7], [s * 2.4, 0.03, 0.7]] })
  }

  // ---- the end pavilions, with the bronze quadrigas rearing on top
  for (const sx of [-1, 1]) {
    const x0 = sx * (hx - 18)
    const xl = Math.min(x0, sx * hx)
    const xr = Math.max(x0, sx * hx)
    block(out, xl, xr, front - 2, nz0 + 8, 0, wall + 6, stone)
    block(out, xl - 0.4, xr + 0.4, front - 2.5, nz0 + 8.4, wall + 6, wall + 7.2, deep)
    const qx = sx * (hx - 9)
    block(out, qx - 3.2, qx + 3.2, front + 1, front + 7, wall + 7.2, wall + 9, shade(stone, 0.95))
    // Récipon's quadriga: four horses abreast, rearing over the corner, the winged figure in her chariot behind them
    const R = new Relief(out, qx, wall + 9, front + 2.4, bronze, 1)
    for (const dx of [-2.2, -0.75, 0.75, 2.2]) {
      beast(R, { rump: [dx, 2.2, 0.1], chest: [dx, 3.8, 1.1], poll: [dx, 5.6, 1.3], muzzle: [dx, 5.5, 1.9], legs: [[[dx - 0.3, 1.9, 0], [dx - 0.3, 1, 0], [dx - 0.3, 0.05, 0]], [[dx + 0.3, 1.9, 0], [dx + 0.3, 1, 0], [dx + 0.3, 0.05, 0]], [[dx - 0.3, 3.5, 1.3], [dx - 0.35, 3.1, 1.9], [dx - 0.3, 2.5, 2.1]], [[dx + 0.3, 3.5, 1.3], [dx + 0.35, 3.4, 1.9], [dx + 0.3, 2.9, 2.2]]], tail: [[dx, 2.4, -0.2], [dx, 1.5, -0.4]], girth: 0.55 })
    }
    box(out, qx, wall + 11, front + 5, 2.4, 2, 1.2, bronze, FIXED)
    prism(out, qx, front + 5, wall + 13, wall + 17.6, 0.75, 6, bronze, FIXED, 0.4)
    prism(out, qx, front + 5, wall + 17.6, wall + 18.4, 0.3, 6, bronze, FIXED, 0.22)
    for (const s of [-1, 1]) beam(out, [qx + s * 0.5, wall + 16.2, front + 5], [qx + s * 3, wall + 18.6, front + 5.6], 0.28, bronze, 0.08)
    beam(out, [qx, wall + 17, front + 5], [qx + 1, wall + 19.4, front + 4.6], 0.1, bronze)
  }

  // ---- the glass nave: a barrel vault on iron ribs, springing from the cornice
  const vz = (nz0 + nz1) / 2
  const R = naveW / 2 - 1
  const rise = 16
  const seg = 12
  const arc = (k: number): [number, number] => {
    const a = Math.PI * (k / seg)
    return [vz - Math.cos(a) * R, wall + 1.4 + Math.sin(a) * rise]
  }
  const vx0 = -hx + 4
  const vx1 = hx - 4
  for (let k = 0; k < seg; k++) {
    const [z0, y0] = arc(k)
    const [z1, y1] = arc(k + 1)
    const nz = -(y1 - y0)
    const ny = z1 - z0
    const l = Math.hypot(nz, ny) || 1
    out.quad([[vx0, y0, z0], [vx1, y0, z0], [vx1, y1, z1], [vx0, y1, z1]], [0, ny / l, nz / l], [[0, 0], [1, 0], [1, 1], [0, 1]], glass, FIXED)
  }
  for (let x = vx0; x <= vx1 + 0.01; x += 7.5) {
    for (let k = 0; k < seg; k++) {
      const [z0, y0] = arc(k)
      const [z1, y1] = arc(k + 1)
      beam(out, [x, y0 + 0.1, z0], [x, y1 + 0.1, z1], 0.22, iron)
    }
  }
  // the vault's ridge and its two eaves, in iron
  beam(out, [vx0, wall + 1.4 + rise + 0.2, vz], [vx1, wall + 1.4 + rise + 0.2, vz], 0.3, iron)

  // ---- the transept vault back over the Palais de la Découverte's hall
  const tw = 20
  for (let k = 0; k < seg; k++) {
    const a0 = Math.PI * (k / seg)
    const a1 = Math.PI * ((k + 1) / seg)
    const x0 = -Math.cos(a0) * tw
    const x1 = -Math.cos(a1) * tw
    const y0 = wall - 0.8 + Math.sin(a0) * 11
    const y1 = wall - 0.8 + Math.sin(a1) * 11
    out.quad([[x0, y0, vz], [x0, y0, hz - 6], [x1, y1, hz - 6], [x1, y1, vz]], [x0 + x1 === 0 ? 0 : (x0 + x1) / (2 * tw), 0.9, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], glass, FIXED)
  }

  // ---- the dome over the middle: a drum, the ribbed glass dome, the lantern and the flag
  const dr = 17
  prism(out, 0, vz, wall + 1.4, wall + 6, dr, 16, deep, FIXED)
  const bands = 6
  for (let b = 0; b < bands; b++) {
    const t0 = b / bands
    const t1 = (b + 1) / bands
    const r0 = dr * Math.cos((t0 * Math.PI) / 2)
    const r1 = dr * Math.cos((t1 * Math.PI) / 2)
    const y0 = wall + 6 + Math.sin((t0 * Math.PI) / 2) * 20
    const y1 = wall + 6 + Math.sin((t1 * Math.PI) / 2) * 20
    prism(out, 0, vz, y0, y1, Math.max(r0, 0.8), 16, glass, FIXED, Math.max(r1, 0.8))
  }
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2
    let prev: [number, number, number] | null = null
    for (let b = 0; b <= bands; b++) {
      const t = b / bands
      const r = Math.max(0.8, dr * Math.cos((t * Math.PI) / 2)) + 0.12
      const p: [number, number, number] = [Math.sin(a) * r, wall + 6 + Math.sin((t * Math.PI) / 2) * 20, vz + Math.cos(a) * r]
      if (prev) beam(out, prev, p, 0.18, iron)
      prev = p
    }
  }
  // the lunette over the porch: the dome's green rim, its fan of glazing, seen head-on over the attic
  const lz = nz0 + 7
  const ly = wall + 3
  const lr = 18.5
  for (let i = 0; i < 16; i++) {
    const a0 = (i / 16) * Math.PI, a1 = ((i + 1) / 16) * Math.PI
    const P = (a: number, r: number): [number, number, number] => [Math.cos(a) * r, ly + Math.sin(a) * r * 0.86, lz]
    out.quad([P(a0, 0), P(a0, lr), P(a1, lr), P(a1, 0)], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], glass, FIXED)
    beam(out, P(a0, lr + 0.5), P(a1, lr + 0.5), 0.75, iron)
    beam(out, P(a0, 2), P(a0, lr), 0.12, iron)
    beam(out, P(a0, lr * 0.55), P(a1, lr * 0.55), 0.1, iron)
  }
  beam(out, [-lr - 0.5, ly, lz], [lr + 0.5, ly, lz], 0.4, iron)
  block(out, -lr, lr, lz, vz, ly - 2, ly, shade(stone, 0.9))
  prism(out, 0, vz, wall + 26, wall + 30, 1.4, 8, iron, FIXED, 1.0)
  prism(out, 0, vz, wall + 30, wall + 31, 1.3, 8, iron, FIXED, 0.1)
  box(out, 0, wall + 34, vz, 0.06, 3, 0.06, iron, FIXED)
  // the tricolour, three upright bands
  box(out, 0.35, wall + 36, vz, 0.3, 0.7, 0.02, [0.18, 0.28, 0.62], FIXED)
  box(out, 0.95, wall + 36, vz, 0.3, 0.7, 0.02, [0.95, 0.95, 0.95], FIXED)
  box(out, 1.55, wall + 36, vz, 0.3, 0.7, 0.02, [0.8, 0.15, 0.18], FIXED)
}
