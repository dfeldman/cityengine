import type { MeshBuilder } from '../../buildings.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { beam, block, hex, shade } from '../kit.ts'
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
 * Local frame: long axis x, the avenue front faces −z; fitted to OSM's footprint (~240 × 160 m with the
 * Palais de la Découverte behind).
 */
export function grandPalais(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#e4dac4')
  const deep = shade(stone, 0.84)
  const glass: Rgb = [0.48, 0.62, 0.68]
  const iron: Rgb = [0.26, 0.33, 0.3]
  const bronze: Rgb = [0.3, 0.42, 0.36]
  const hx = Math.min(Math.max(fit.hx, 90), 118)
  const hz = Math.min(Math.max(fit.hz, 50), 80)
  const front = -hz
  const naveW = 52
  const nz0 = front + 4
  const nz1 = nz0 + naveW
  const wall = 20

  // ---- the stone body of the nave, and the Palais de la Découverte behind it
  block(out, -hx, hx, nz0, nz1, 0, wall, stone)
  block(out, -hx - 0.4, hx + 0.4, nz0 - 0.6, nz1 + 0.6, wall, wall + 1.4, deep)
  block(out, -hx * 0.45, hx * 0.45, nz1, hz, 0, wall - 2, stone)
  block(out, -hx * 0.45 - 0.4, hx * 0.45 + 0.4, nz1, hz + 0.6, wall - 2, wall - 0.8, deep)

  // ---- the colonnade along the front: a raised base, paired columns, the entablature and balustrade
  const cz = front + 1.6
  block(out, -hx + 18, hx - 18, front - 1, nz0, 0, 2.2, shade(stone, 0.93))
  for (let x = -hx + 22; x <= hx - 22 + 0.01; x += 6) {
    for (const dx of [-0.9, 0.9]) prism(out, x + dx, cz, 2.2, wall - 1.6, 0.55, 10, stone, FIXED, 0.48)
  }
  block(out, -hx + 18, hx - 18, front, nz0, wall - 1.6, wall, shade(stone, 1.02))
  // the wall behind the colonnade, in shadow, with its tall windows
  for (let x = -hx + 25; x <= hx - 25; x += 6) block(out, x - 1.1, x + 1.1, nz0 - 0.05, nz0, 3, wall - 3, [0.28, 0.32, 0.34])

  // ---- the central entrance: a projecting triumphal block with three arches and a sculpted attic
  block(out, -16, 16, front - 3, nz0 + 2, 0, wall + 8, stone)
  for (const ax of [-9, 0, 9]) {
    block(out, ax - 3.2, ax + 3.2, front - 3.05, front - 2.9, 2.2, 15, [0.26, 0.3, 0.32])
    prism(out, ax, front - 2.97, 15, 16.5, 3.2, 10, [0.26, 0.3, 0.32], FIXED, 1.4)
  }
  block(out, -16.6, 16.6, front - 3.6, nz0 + 2.3, wall + 8, wall + 9.3, deep)
  // a sculpture group on the attic
  prism(out, 0, front - 1, wall + 9.3, wall + 13, 2.2, 8, bronze, FIXED, 0.9)

  // ---- the end pavilions, with the bronze quadrigas rearing on top
  for (const sx of [-1, 1]) {
    const x0 = sx * (hx - 18)
    const xl = Math.min(x0, sx * hx)
    const xr = Math.max(x0, sx * hx)
    block(out, xl, xr, front - 2, nz0 + 8, 0, wall + 6, stone)
    block(out, xl - 0.4, xr + 0.4, front - 2.5, nz0 + 8.4, wall + 6, wall + 7.2, deep)
    const qx = sx * (hx - 9)
    block(out, qx - 3.2, qx + 3.2, front + 1, front + 7, wall + 7.2, wall + 9, shade(stone, 0.95))
    // four horses abreast and the chariot, as a rearing bronze mass
    for (let h = 0; h < 4; h++) {
      const hxp = qx - 2.4 + h * 1.6
      box(out, hxp, wall + 11, front + 2.4, 0.45, 1.2, 1.6, bronze, FIXED)
      box(out, hxp, wall + 12.6, front + 1.2, 0.35, 0.8, 0.5, bronze, FIXED)
    }
    box(out, qx, wall + 12, front + 5.2, 2.0, 1.8, 1.2, bronze, FIXED)
    prism(out, qx, front + 5.2, wall + 13.8, wall + 17, 0.5, 6, bronze, FIXED, 0.3)
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
  prism(out, 0, vz, wall + 26, wall + 30, 1.4, 8, iron, FIXED, 1.0)
  prism(out, 0, vz, wall + 30, wall + 31, 1.3, 8, iron, FIXED, 0.1)
  box(out, 0, wall + 34, vz, 0.06, 3, 0.06, iron, FIXED)
  // the tricolour, three upright bands
  box(out, 0.35, wall + 36, vz, 0.3, 0.7, 0.02, [0.18, 0.28, 0.62], FIXED)
  box(out, 0.95, wall + 36, vz, 0.3, 0.7, 0.02, [0.95, 0.95, 0.95], FIXED)
  box(out, 1.55, wall + 36, vz, 0.3, 0.7, 0.02, [0.8, 0.15, 0.18], FIXED)
}
