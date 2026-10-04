/**
 * THE WOMEN'S BUILDING, 3543 18th Street at Lapidge (way/260194175; owner, 2026-10-03: "could use a redo. Fascinating
 * landmark with a huge colorful mural covering it"). A 1910 hall of three tall storeys under a cornice, its arched
 * windows set in walls painted from pavement to cornice with MaestraPeace (1994): giant women's figures and faces in
 * saturated purple, turquoise, orange, yellow and red over a sky of blue and violet bands.
 *
 * Drawn: the hall (`tower()`, arched windows, a cornice), then the mural laid over every long wall — the hidden two are
 * party walls — as layers of coloured shapes, each layer 4 cm proud of the last so none fight: the sky in horizontal
 * bands, then hills of colour, then standing figures (long robes, round heads with a dark face oval), then the window
 * frames repainted bright round each opening. Deterministic: the same building paints the same every time.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'
import { tower, towerRing } from '../tower.ts'
import { edgeAt } from '../parts.ts'

const SKY: Rgb[] = [[0.3, 0.45, 0.8], [0.45, 0.35, 0.75], [0.25, 0.6, 0.75], [0.55, 0.4, 0.8]]
const HILLS: Rgb[] = [[0.95, 0.55, 0.15], [0.9, 0.25, 0.35], [0.95, 0.8, 0.2], [0.2, 0.65, 0.55], [0.6, 0.25, 0.6]]
const ROBES: Rgb[] = [[0.85, 0.2, 0.25], [0.2, 0.55, 0.7], [0.95, 0.65, 0.15], [0.5, 0.2, 0.55], [0.15, 0.6, 0.4], [0.95, 0.45, 0.6]]
const SKIN: Rgb[] = [[0.55, 0.36, 0.25], [0.78, 0.58, 0.42], [0.42, 0.27, 0.19], [0.7, 0.5, 0.35]]

const hash = (a: number, b: number): number => {
  const h = Math.imul(Math.imul(Math.floor(a * 97) ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(Math.floor(b * 31), 0xc2b2ae35), 0x27d4eb2d) >>> 0
  return h / 4294967296
}

export function womensBuilding(out: MeshBuilder, fit: Fit): void {
  const H = fit.height > 10 && fit.height < 25 ? fit.height : 17
  tower(out, { ...fit, height: H }, {
    height: H,
    tiers: [{ to: H - 1, face: { kind: 'punched', material: 'stucco', wall: [0.8, 0.72, 0.6], glass: [0.18, 0.2, 0.24], pitch: 4.2, solid: 0.62, floor: 5.2, arched: true }, cornice: { depth: 0.6, height: 0.8, colour: [0.9, 0.82, 0.55] } }],
    roof: [0.45, 0.43, 0.4],
  })
  const ring = towerRing(fit)
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    if (e.L < 8) continue
    // a shape on this wall: u along it from its middle, y up, `o` metres out, as a polygon of (u, y) points
    const paint = (pts: [number, number][], o: number, c: Rgb): void => {
      const P = (u: number, y: number): [number, number, number] => [e.mid.x + e.tx * u + e.nx * o, y, e.mid.z + e.tz * u + e.nz * o]
      for (let k = 1; k < pts.length - 1; k++) {
        out.quad([P(...pts[0]), P(...pts[k]), P(...pts[k + 1]), P(...pts[k + 1])], [e.nx, 0, e.nz], [[0, 0], [1, 0], [1, 1], [0, 1]], c, 0)
      }
    }
    const half = e.L / 2 - 0.3
    const top = H - 1.2
    // 1. the sky, in bands
    for (let b = 0; b < 4; b++) {
      const y0 = top * (0.45 + b * 0.1375), y1 = top * (0.45 + (b + 1) * 0.1375)
      paint([[-half, y0], [half, y0], [half, y1], [-half, y1]], 0.04, SKY[(b + i) % SKY.length])
    }
    // 2. the hills of colour, rolling along the lower half
    const n = Math.max(3, Math.round(e.L / 6))
    for (let k = 0; k < n; k++) {
      const u0 = -half + (k * 2 * half) / n, u1 = -half + ((k + 1) * 2 * half) / n
      const peak = top * (0.45 + 0.2 * hash(i + k, 3))
      paint([[u0, 0.3], [u1, 0.3], [u1, top * 0.42], [(u0 + u1) / 2, peak], [u0, top * 0.42]], 0.08, HILLS[(k + i * 2) % HILLS.length])
    }
    // 3. the figures: tall robes and heads, three or four to a wall, one giant face on the long front
    const figs = Math.max(2, Math.round(e.L / 9))
    for (let k = 0; k < figs; k++) {
      const u = -half + ((k + 0.5) * 2 * half) / figs
      const w = 1.6 + hash(i, k) * 1.4, h = top * (0.55 + hash(k, i) * 0.3)
      const c = ROBES[(k * 3 + i) % ROBES.length]
      paint([[u - w, 0.3], [u + w, 0.3], [u + w * 0.55, h], [u - w * 0.55, h]], 0.12, c)
      // the head
      const r = w * 0.5, hy = h + r * 1.1
      const head: [number, number][] = []
      for (let a = 0; a < 10; a++) head.push([u + Math.cos((a / 10) * Math.PI * 2) * r, hy + Math.sin((a / 10) * Math.PI * 2) * r * 1.2])
      paint(head, 0.16, SKIN[(k + i) % SKIN.length])
      // the hair, a darker cap
      const hair: [number, number][] = []
      for (let a = 0; a <= 6; a++) hair.push([u + Math.cos((a / 6) * Math.PI) * r * 1.15, hy + r * 0.25 + Math.sin((a / 6) * Math.PI) * r * 1.2])
      paint(hair, 0.2, [0.12, 0.08, 0.08])
    }
    if (e.L > 20) {
      // the giant face high on the front
      const u = half * 0.35, hy = top * 0.72, r = top * 0.18
      const face: [number, number][] = []
      for (let a = 0; a < 14; a++) face.push([u + Math.cos((a / 14) * Math.PI * 2) * r, hy + Math.sin((a / 14) * Math.PI * 2) * r * 1.25])
      paint(face, 0.24, [0.62, 0.42, 0.3])
      for (const s of [-1, 1]) paint([[u + s * r * 0.35 - 0.3, hy + r * 0.2], [u + s * r * 0.35 + 0.3, hy + r * 0.2], [u + s * r * 0.35 + 0.3, hy + r * 0.38], [u + s * r * 0.35 - 0.3, hy + r * 0.38]], 0.28, [0.1, 0.07, 0.06])
      paint([[u - r * 0.3, hy - r * 0.5], [u + r * 0.3, hy - r * 0.5], [u + r * 0.25, hy - r * 0.38], [u - r * 0.25, hy - r * 0.38]], 0.28, [0.75, 0.15, 0.2])
    }
  }
}

export const WOMENS_BUILDING: Record<string, (out: MeshBuilder, fit: Fit) => void> = { womensBuilding }
