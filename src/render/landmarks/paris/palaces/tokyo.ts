import type { MeshBuilder } from '../../../buildings.ts'
import { box } from '../../../models.ts'
import { block, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { fitted, palette } from './common.ts'

const FIXED = 0
const HX = 20
const HZ = 48

/**
 * The Palais de Tokyo's parvis (Dondel, Aubert, Viard and Dastugue for the 1937 Exhibition): the court between its two
 * wings — the Palais de Tokyo itself east, the Musée d'Art Moderne de Paris west (both OSM's massing, in the stone
 * dress: palaces.json) — which is what the building IS to anyone passing on the Avenue de New-York or the river:
 *
 * - the COLONNADE of tall, slender square piers down both inner faces of the wings, carrying a flat attic band, and
 *   linked across the top of the court by the PORTICO on the Avenue du Président-Wilson side;
 * - the court falling in broad TERRACES toward the Seine, the long pool on the lowest, Bourdelle's France on the
 *   upper terrace (a tall bronze figure on her plinth).
 *
 * The piers are mapped in OSM as the bumps along both wings' inner faces (ways 79219351 and 79219308, measured in
 * this frame with osmium, 2026-10-29). Local frame: the court along z, the Seine at +z (bearing 162); the portico at −z.
 */
export function tokyoParvis(out: MeshBuilder, fit: Fit): void {
  // the court falls toward the river: each terrace stands on the ground measured under it, where the loader measured it
  const sz = fit.hz / HZ
  const design = [0, -1.6, -3.4]
  const level = (i: number, z: number): number => (fit.groundAt ? fit.groundAt(0, z * sz) : design[i])
  fitted(out, fit, HX, HZ, (q) => draw(q, [level(0, -20), level(1, 3), level(2, 31)]))
}

function draw(out: MeshBuilder, lv: number[]): void {
  const p = palette('#e7e1d2')
  const pier = shade(p.stone, 1.03)
  const h = 13.2 + lv[0]
  // ---- the colonnades down both sides (OSM's piers from local z −30.6 to +1.6), the attic band over them
  for (const x of [-17.4, 17.4]) {
    for (let z = -30.6; z <= 1.7; z += 4.06) block(out, x - 0.65, x + 0.65, z - 0.65, z + 0.65, Math.min(z < -8 ? lv[0] : lv[1], lv[0]) - 0.3, h, pier)
    block(out, x - 0.9, x + 0.9, -31.6, 2.6, h, h + 1.6, p.stone)
  }
  // ---- the portico across the top of the court, its piers on both faces and the attic carried over
  for (let x = -8.4; x <= 8.41; x += 4.2) {
    for (const z of [-44.3, -35.2]) block(out, x - 0.6, x + 0.6, z - 0.6, z + 0.6, lv[0] - 0.3, h, pier)
  }
  block(out, -9.5, 9.5, -45.2, -34.3, h, h + 1.6, p.stone)
  block(out, -9.5, 9.5, -45.2, -34.3, h - 0.25, h, shade(p.stone, 0.7))                         // its soffit
  // ---- the terraces stepping down the court toward the river, the pool on the lowest, the balustraded edges
  const steps: [number, number, number][] = [[-31.6, -8, lv[0]], [-8, 14, lv[1]], [14, 48, lv[2]]]
  for (const [z0, z1, y] of steps) block(out, -16.6, 16.6, z0, z1, y - 0.3, y, shade(p.stone, 0.95))
  for (const [z, ya, yb] of [[-8, lv[0], lv[1]], [14, lv[1], lv[2]]] as const) {
    for (let i = 0; i < 6; i++) block(out, -10, 10, z + i * 0.45, z + (i + 1) * 0.45, yb - 0.3, ya - ((ya - yb) * i) / 6, shade(p.stone, 0.9))
  }
  const w = lv[2]
  block(out, -9, 9, 20, 44, w, w + 0.1, [0.32, 0.44, 0.48])                                       // the pool
  for (const x of [-9.2, 9.2]) block(out, x - 0.2, x + 0.2, 20, 44, w, w + 0.5, p.trim)
  for (const z of [20, 44]) block(out, -9.2, 9.2, z - 0.2, z + 0.2, w, w + 0.5, p.trim)
  // Bourdelle's France on the upper terrace
  const u = lv[0]
  block(out, -1.2, 1.2, -20, -17.6, u, u + 3.2, p.trim)
  box(out, 0, u + 6.4, -18.8, 0.5, 3.2, 0.45, [0.24, 0.3, 0.26], FIXED)
  box(out, 0.6, u + 9.2, -18.8, 0.12, 2.4, 0.12, [0.24, 0.3, 0.26], FIXED)                      // her spear
}
