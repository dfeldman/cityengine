/**
 * THE FONDATION ARGENTINE — BETOURNÉ & FAGNEN (1928): a cream-rendered five-storey hall under low red-tiled hipped
 * roofs; the front's middle three bays rise one storey more under their own hip; round-arched ground-floor windows
 * under small tiled canopies, a columned porch with a tiled lean-to at the centre, oculi in the end bays, string
 * courses over the ground floor and under the top storey.
 * Refs: Commons "Maison de l'argentine.jpg", "Fondation argentine.jpg", ciup.fr banner (docs/landmarks/refs/citeu/argentine/).
 * Plan from OSM way 52090412 (cadastre, noted as inexact): a front bar, a neck and a shorter back bar on Bd Jourdan.
 * Local frame: −z toward bearing 199 (the campus front), x toward bearing 289; origin the bbox centre.
 */
import { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex, type Rgb } from '../../kit.ts'
import { block } from '../batch2/tag.ts'
import { archOn, hipRoof, rectOn } from '../palaces/common.ts'

const RENDER: Rgb = hex('#ece4cf'), BAND: Rgb = hex('#ddd3ba'), WIN: Rgb = hex('#3a4046'), SHUT: Rgb = hex('#d8d2c2')
const TILE: Rgb = hex('#94503a'), COL: Rgb = hex('#e6dcc4'), DOOR: Rgb = hex('#4a3426'), CHIM: Rgb = hex('#ddd2bb')

export const W = 33.6, D = 37.6                      // bbox width (x), depth (z)
const GF = 4.2, FLOOR = 3.1, STOREYS = 5             // ground storey, upper storeys
const EAVES = GF + (STOREYS - 1) * FLOOR             // ≈16.6
const ROOF_H = 2.6, CENTRE_ROOF = 3.4                // hip rises
const BAY = 3.25, WIN_W = 1.3, WIN_H = 1.9           // window rhythm
const CENTRE = 5.2                                   // half-width of the raised middle
// plan pieces [x0, x1, z0, z1]
const FRONT: number[] = [-16.8, 16.8, -18.8, -4.9]
const NECK: number[] = [-1.6, 1.6, -5.2, 5.3]
const BACK: number[] = [-12, 11.6, 5, 18.8]

type F = '-z' | '+z' | '-x' | '+x'

/** upper-floor windows along a face, ground floor arched on the front, plain elsewhere */
function windows(out: MeshBuilder, f: F, plane: number, t0: number, t1: number, g: number, top: number, arched: boolean): void {
  const n = Math.max(1, Math.floor((t1 - t0) / BAY)), step = (t1 - t0) / n
  for (let k = 0; k < n; k++) {
    const t = t0 + (k + 0.5) * step
    if (arched) archOn(out, f, plane, t, g + 0.6, WIN_W + 0.3, 2.9, WIN, 0.05)
    else rectOn(out, f, plane, t - WIN_W / 2, t + WIN_W / 2, g + 1.0, g + 1.0 + WIN_H, WIN, 0.05)
    for (let y = g + GF + 0.9; y + WIN_H < top - 0.3; y += FLOOR) {
      rectOn(out, f, plane, t - WIN_W / 2 - 0.12, t + WIN_W / 2 + 0.12, y - 0.15, y + WIN_H + 0.1, SHUT, 0.04)
      rectOn(out, f, plane, t - WIN_W / 2, t + WIN_W / 2, y, y + WIN_H, WIN, 0.06)
    }
  }
  rectOn(out, f, plane, t0, t1, g + GF - 0.1, g + GF + 0.25, BAND, 0.12)
  rectOn(out, f, plane, t0, t1, g + EAVES - FLOOR - 0.1, g + EAVES - FLOOR + 0.2, BAND, 0.1)
}

function wing(out: MeshBuilder, b: number[], g: number, archedFront: boolean): void {
  const [x0, x1, z0, z1] = b
  block(out, x0, x1, z0, z1, g - 0.3, g + EAVES, RENDER)
  windows(out, '-z', z0, x0 + 0.4, x1 - 0.4, g, g + EAVES, archedFront)
  windows(out, '+z', z1, x0 + 0.4, x1 - 0.4, g, g + EAVES, false)
  windows(out, '-x', x0, z0 + 0.4, z1 - 0.4, g, g + EAVES, false)
  windows(out, '+x', x1, z0 + 0.4, z1 - 0.4, g, g + EAVES, false)
  rectOn(out, '-z', z0, x0, x1, g + EAVES - 0.5, g + EAVES, BAND, 0.25)   // cornice
  rectOn(out, '+z', z1, x0, x1, g + EAVES - 0.5, g + EAVES, BAND, 0.25)
  hipRoof(out, x0, x1, z0, z1, g + EAVES, ROOF_H, TILE, 0.7)
}

export function fondationArgentine(out: MeshBuilder, fit: Fit): void {
  const g = fit.grade ?? 0
  wing(out, FRONT, g, true)
  wing(out, BACK, g, false)
  block(out, NECK[0], NECK[1], NECK[2], NECK[3], g - 0.3, g + EAVES, RENDER)
  hipRoof(out, NECK[0], NECK[1], NECK[2] + 1.5, NECK[3] - 1.5, g + EAVES, 1.5, TILE, 0.4)
  // the raised middle of the front, one storey more, its own hip
  const z0 = FRONT[2], ct = g + EAVES + FLOOR
  block(out, -CENTRE, CENTRE, z0 - 0.2, z0 + 7, g + EAVES - 0.5, ct, RENDER)
  for (const t of [-BAY, 0, BAY]) rectOn(out, '-z', z0 - 0.2, t - WIN_W / 2, t + WIN_W / 2, g + EAVES + 0.5, g + EAVES + 0.5 + WIN_H, WIN, 0.06)
  rectOn(out, '-z', z0 - 0.2, -CENTRE, CENTRE, ct - 0.5, ct, BAND, 0.25)
  hipRoof(out, -CENTRE, CENTRE, z0 - 0.2, z0 + 7, ct, CENTRE_ROOF, TILE, 0.7)
  // oculi in the end bays, second and third floors
  for (const x of [FRONT[0] + 1.9, FRONT[1] - 1.9]) for (const y of [g + GF + FLOOR + 1.3, g + GF + 2 * FLOOR + 1.3]) archOn(out, '-z', z0, x, y - 0.45, 0.9, 0.9, WIN, 0.08)
  // the columned porch with its tiled lean-to, and the canopies over the arched ground windows
  const pz = z0 - 2.4
  for (const x of [-4.4, -1.5, 1.5, 4.4]) block(out, x - 0.25, x + 0.25, pz, pz + 0.5, g, g + 3.6, COL)
  block(out, -5.2, 5.2, pz - 0.3, z0, g + 3.6, g + 3.9, TILE)
  hipRoof(out, -5.2, 5.2, pz - 0.3, z0 - 0.05, g + 3.9, 0.8, TILE, 0.2)
  rectOn(out, '-z', z0, -1.1, 1.1, g, g + 3.0, DOOR, 0.08)
  for (const [a, b] of [[-15.6, -6.2], [6.2, 15.6]]) block(out, a, b, z0 - 0.9, z0, g + 3.9, g + 4.1, TILE)
  // chimneys
  for (const [x, z] of [[-9, -12], [9, -12], [-2.5, -7], [6, 12]]) block(out, x - 0.5, x + 0.5, z - 0.4, z + 0.4, g + EAVES, g + EAVES + ROOF_H + 1.4, CHIM)
}
