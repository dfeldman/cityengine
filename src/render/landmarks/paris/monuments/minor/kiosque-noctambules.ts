import type { MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { beam, block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G, blob } from '../plaza-common.ts'

/*
 * LE KIOSQUE DES NOCTAMBULES (place Colette, Paris 1er; Jean-Michel Othoniel, 2000): the Palais-Royal–Musée du Louvre
 * métro entrance as two cupolas of coloured Murano glass beads strung on an aluminium frame over the stair, a beaded
 * arch between them. Frame: x along the stair, z across, y up from the pavement (G). Sizes scaled by eye (no survey):
 * a larger cupola (the "day" one, warm colours) and a smaller one. The beads are small low-poly balls at the crossings
 * of meridian and parallel wires, coloured from a palette by a fixed hash so the draw is deterministic.
 */
export const HX = 3.8
export const HZ = 2.0

// tunables (metres)
const STAIR_X0 = -2.7, STAIR_X1 = 2.9, STAIR_HW = 1.0   // the stair opening
const RAIL_H = 0.95, RAIL_R = 0.025                      // balustrade
const DOMES = [
  { x: -1.7, r: 1.55, base: 1.0, ry: 1.0, rows: 5, meridians: 16, bead: 0.11 },   // large cupola
  { x: 2.0, r: 1.15, base: 1.0, ry: 1.0, rows: 4, meridians: 12, bead: 0.1 },     // small cupola
]
const ARCH = { n: 7, rise: 0.8, bead: 0.095 }             // beaded arch between the cupolas

const ALU: Rgb = hex('#b7bcc0')
const KERB: Rgb = hex('#8d8a82')
const DARK: Rgb = hex('#26282b')
const BEADS: Rgb[] = ['#d8352b', '#e8912a', '#e9c93a', '#3f7fc4', '#2a5ea8', '#8fb8d8', '#7d4aa3', '#c9d2d8', '#d2e0e8', '#d85a8f'].map(hex)

const hash = (a: number, b: number): number => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s) }
const bead = (q: MeshBuilder, x: number, y: number, z: number, r: number, k: number): void =>
  blob(q, x, y, z, r, r, r, shade(BEADS[Math.floor(hash(k, x + z) * BEADS.length) % BEADS.length], 0.97 + hash(y, k) * 0.1), 6, 3)

function dome(q: MeshBuilder, d: typeof DOMES[number], k0: number): void {
  const y0 = G + d.base
  const P = (a: number, p: number): [number, number, number] => [d.x + Math.sin(a) * Math.cos(p) * d.r, y0 + Math.sin(p) * d.r * d.ry, Math.cos(a) * Math.cos(p) * d.r]
  // base ring on posts
  for (let i = 0; i < d.meridians; i += 2) {
    const a = (i / d.meridians) * Math.PI * 2
    const [px, , pz] = P(a, 0)
    beam(q, [px, G, pz], [px, y0, pz], 0.03, ALU)
  }
  // meridian wires and parallels with a bead at each crossing, a larger one at the crown
  for (let j = 0; j < d.rows; j++) {
    const p = (j / d.rows) * (Math.PI / 2)
    const pn = ((j + 1) / d.rows) * (Math.PI / 2)
    for (let i = 0; i < d.meridians; i++) {
      const a = (i / d.meridians) * Math.PI * 2
      const an = ((i + 1) / d.meridians) * Math.PI * 2
      beam(q, P(a, p), P(an, p), 0.012, ALU)
      beam(q, P(a, p), P(a, pn), 0.012, ALU)
      const [bx, by, bz] = P(a, p)
      bead(q, bx, by, bz, d.bead * (1 - 0.35 * (j / d.rows)), k0 + i + j * 40)
    }
  }
  const [cx, cy, cz] = P(0, Math.PI / 2)
  bead(q, cx, cy + 0.04, cz, d.bead * 1.6, k0 + 999)
}

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  // stair opening: a low kerb, the dark well, and step lines
  const L = STAIR_X1 - STAIR_X0
  block(q, STAIR_X0 - 0.15, STAIR_X1 + 0.15, -STAIR_HW - 0.15, STAIR_HW + 0.15, G, y(0.1), KERB)
  block(q, STAIR_X0, STAIR_X1, -STAIR_HW, STAIR_HW, y(0.1), y(0.12), DARK)
  for (let i = 1; i < 9; i++) block(q, STAIR_X0 + (L * i) / 9 - 0.02, STAIR_X0 + (L * i) / 9 + 0.02, -STAIR_HW, STAIR_HW, y(0.12), y(0.125), shade(KERB, 0.8))
  // balustrade: posts + top and mid rail along both sides and the far ends (the cupola feet stand on it)
  const rail = (ax: number, az: number, bx: number, bz: number): void => {
    beam(q, [ax, y(RAIL_H), az], [bx, y(RAIL_H), bz], RAIL_R, ALU)
    beam(q, [ax, y(RAIL_H * 0.5), az], [bx, y(RAIL_H * 0.5), bz], RAIL_R * 0.7, ALU)
    const n = Math.max(1, Math.round(Math.hypot(bx - ax, bz - az) / 1.1))
    for (let i = 0; i <= n; i++) beam(q, [ax + ((bx - ax) * i) / n, y(0.1), az + ((bz - az) * i) / n], [ax + ((bx - ax) * i) / n, y(RAIL_H), az + ((bz - az) * i) / n], RAIL_R, ALU)
  }
  const e = STAIR_HW + 0.1
  rail(STAIR_X0, -e, STAIR_X1, -e)
  rail(STAIR_X0, e, STAIR_X1, e)
  rail(STAIR_X0, -e, STAIR_X0, e)
  rail(STAIR_X1, -e, STAIR_X1, e)
  DOMES.forEach((d, i) => dome(q, d, i * 5000))
  // the beaded arch between the cupolas: two wires rising from the balustrade, a bead every step
  const a = DOMES[0], b = DOMES[1]
  const xa = a.x + a.r * 0.95, xb = b.x - b.r * 0.95
  for (const z of [-0.5, 0.5]) {
    let prev: [number, number, number] | null = null
    for (let i = 0; i <= ARCH.n; i++) {
      const t = i / ARCH.n
      const p: [number, number, number] = [xa + (xb - xa) * t, y(RAIL_H + ARCH.rise * Math.sin(Math.PI * t)), z]
      if (prev) beam(q, prev, p, 0.012, ALU)
      if (i > 0 && i < ARCH.n) bead(q, p[0], p[1], p[2], ARCH.bead, 7000 + i + (z > 0 ? 20 : 0))
      prev = p
    }
  }
}

export function kiosqueNoctambules(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
