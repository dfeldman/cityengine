/**
 * Batch 7's institutes (2026-10-31; docs/landmarks/PARIS-BATCHES.md; owner: "Virtually all museums, hospitals, and university buildings count"): the few a restyle can't say. The Latin Quarter's are the exception to its cream, and so worth their brick (owner, 2026-10-31, on fronts: brick is "maybe 1 per several blocks", and here it's on purpose).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { block, hex, shade } from '../../kit.ts'
import { tower } from '../../tower.ts'

const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

/**
 * L'INSTITUT D'ART ET D'ARCHÉOLOGIE (Paul Bigot, 1925–28; Rue Michelet, by the Luxembourg): a red brick block like nothing else on the Left Bank, a brick arcade of tall arched windows and, round its top, a terracotta frieze cast from the Parthenon's and Trajan's. OSM's outline; the frieze is a pale band with a dark shadow over it.
 */
export const institutArt = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: 20, roof: hex('#2f2723'),
  tiers: [
    { to: 0.68, face: { kind: 'punched', wall: hex('#7c3f2c'), glass: hex('#1f2428'), floor: 13.6 / 2, pitch: 4.4, solid: 0.5, arched: true, material: 'brick' } },
    { to: 0.84, face: { kind: 'blank', wall: hex('#ab8f70'), material: 'ashlar' }, cornice: { depth: 0.35, height: 0.4, colour: hex('#b39a7c') } },
    { to: 1, face: { kind: 'punched', wall: hex('#7c3f2c'), glass: hex('#1f2428'), floor: 3.2, pitch: 2.6, solid: 0.6, material: 'brick' } },
  ],
  crown: { kind: 'parapet', height: 0.9, colour: hex('#5a3324') },
})

/** L'INSTITUT OCÉANOGRAPHIQUE (Henri-Paul Nénot, 1911; Rue Saint-Jacques): a Tuscan palazzo in brick on a stone floor, its great arched windows up on the piano nobile, under a deep eave and tiles, and a Prince of Monaco's. */
export const institutOceano = (out: MeshBuilder, fit: Fit): void => tower(out, fit, {
  height: 16, roof: hex('#5d4b42'),
  base: { height: 4.2, face: { kind: 'punched', wall: hex('#a89c84'), glass: hex('#22272b'), floor: 4.2, pitch: 3.6, solid: 0.6, material: 'ashlar' } },
  tiers: [{ to: 1, face: { kind: 'punched', wall: hex('#8a5140'), glass: hex('#1f2428'), floor: 6, pitch: 4.2, solid: 0.5, arched: true, material: 'brick' }, cornice: { depth: 0.9, height: 0.6, colour: hex('#a89c84') } }],
  crown: { kind: 'hip', height: 3, inset: 0.6, colour: hex('#4f3327') },
})

/**
 * L'IRCAM'S TOWER (Renzo Piano, 1990; Place Igor-Stravinsky, beside Pompidou and the fountain): terracotta panels in a steel frame, rust-red, the old school's brick answered in a machine's. About 25 m on a plan some 12 m square, and nothing else stands in the square. Aerial 48.8597 2.3510: at the Bains-Douches's north-east corner. A point model: −z to the square.
 */
export function ircamTower(out: MeshBuilder, _fit: Fit): void {
  const H = 25, w = 5.5, TERRA = hex('#a8573a'), STEEL = hex('#5d6468'), GLASS = hex('#2a3338')
  const T = surfaceTag('terracotta'), M = surfaceTag('metal'), G = surfaceTag('glass')
  block(out, -w, w, -w, w, 0, H, shade(TERRA, 0.86))
  block(out, -w - 0.2, w + 0.2, -w - 0.2, w + 0.2, H, H + 0.5, STEEL)
  // each face: terracotta in the frame's bays, and the slot of glass down one side
  for (const [nx, nz, tx, tz] of [[0, -1, 1, 0], [1, 0, 0, 1], [0, 1, -1, 0], [-1, 0, 0, -1]] as const) {
    const P = (u: number, y: number, o: number): [number, number, number] => [nx * (w + o) + tx * u, y, nz * (w + o) + tz * u]
    const n: [number, number, number] = [nx, 0, nz]
    for (let k = 0; k < 8; k++) {
      const y0 = k * (H / 8), y1 = y0 + H / 8
      for (let c = 0; c < 4; c++) {
        const u0 = -w + c * (2 * w / 4), u1 = u0 + 2 * w / 4
        // (one column of bays is the glazed stair)
        const glazed = c === 1
        out.quad([P(u0 + 0.12, y0 + 0.12, 0.1), P(u1 - 0.12, y0 + 0.12, 0.1), P(u1 - 0.12, y1 - 0.12, 0.1), P(u0 + 0.12, y1 - 0.12, 0.1)], n, UV, glazed ? GLASS : shade(TERRA, 0.92 + ((k * 3 + c) % 4) * 0.05), glazed ? G : T)
      }
      out.quad([P(-w, y0 - 0.08, 0.2), P(w, y0 - 0.08, 0.2), P(w, y0 + 0.08, 0.2), P(-w, y0 + 0.08, 0.2)], n, UV, STEEL, M)
    }
    for (let c = 0; c <= 4; c++) {
      const u = -w + c * (2 * w / 4)
      out.quad([P(u - 0.08, 0, 0.2), P(u + 0.08, 0, 0.2), P(u + 0.08, H, 0.2), P(u - 0.08, H, 0.2)], n, UV, STEEL, M)
    }
  }
}
