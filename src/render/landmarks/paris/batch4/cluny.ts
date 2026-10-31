/**
 * L'HÔTEL DE CLUNY (Jacques d'Amboise, abbot of Cluny, about 1485–1510; 28 rue Du Sommerard, OSM way/1132441556 with 1132441559–61): Paris's great Flamboyant town house, and now the Musée national du Moyen Âge. Read from IGN's aerial (48.8505 2.3438, 0.14 m/px): the corps de logis along the head of a paved court, its dormers in a row on the slate (white gables at (640–830, 480));
 * the wings forward either side, the east one shorter; the crenellated street wall (530–745, 620) slanting across the front of the court; the stair tower in the court's north side at (690, 555); the chapel's block behind at the west end, with its oriel to the garden.
 *
 * OSM's parts gave this 28 and 32 m towers of Haussmann flats (2026-10-31, in the city): it is 11 m to the eaves. Drawn in the hôtel's own axes: the entry's point (world 885, −1120), front 196, so +x along the corps de logis (bearing 106) and +z behind it (bearing 16). The plan's numbers are OSM's outline turned to this frame, by hand.
 */
import { MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { hex, pointedPane, prism, roof, shade, type Rgb } from '../../kit.ts'
import { block } from '../batch2/tag.ts'
import { pedimentOn, rectOn, slabOn } from '../palaces/common.ts'
import { elevation } from './hotels.ts'

const S = hex('#928c7f'), T = hex('#aaa292'), SLATE = hex('#454c52'), GLASS: Rgb = [0.13, 0.15, 0.17], DARK = hex('#201d1a'), PALE = hex('#aca38f')
const tag = surfaceTag('ashlar'), rock = surfaceTag('rock'), metal = surfaceTag('metal')

/** A cross-mullioned window: frame, glass, the stone cross */
function cross(q: MeshBuilder, t: number, y: number, w: number, h: number): void {
  rectOn(q, '-z', 0, t - w / 2 - 0.22, t + w / 2 + 0.22, y - 0.2, y + h + 0.26, T, 0.05)
  rectOn(q, '-z', 0, t - w / 2, t + w / 2, y, y + h, GLASS, 0.07)
  block(q, t - 0.05, t + 0.05, -0.14, -0.08, y, y + h, T)
  block(q, t - w / 2, t + w / 2, -0.14, -0.08, y + h * 0.6 - 0.05, y + h * 0.6 + 0.05, T)
  // the drip mould
  block(q, t - w / 2 - 0.4, t + w / 2 + 0.4, -0.18, 0, y + h + 0.14, y + h + 0.3, T)
}

/** A flamboyant lucarne standing on the wall head: a stone gable with its pinnacles, tall in the roof. */
function lucarne(q: MeshBuilder, t: number, y: number, w = 1.5, h = 2.6): void {
  block(q, t - w / 2 - 0.3, t + w / 2 + 0.3, -0.1, 0.9, y, y + h, T, tag)
  rectOn(q, '-z', -0.1, t - w / 2, t + w / 2, y + 0.25, y + h - 0.35, GLASS, 0.05)
  block(q, t - 0.05, t + 0.05, -0.2, -0.15, y + 0.25, y + h - 0.35, T)
  block(q, t - w / 2, t + w / 2, -0.2, -0.15, y + (h - 0.1) * 0.6, y + (h - 0.1) * 0.6 + 0.09, T)
  pedimentOn(q, '-z', -0.1, t - w / 2 - 0.3, t + w / 2 + 0.3, y + h, 2.4, 0.2, T)
  // the gable's pinnacles and its finial, the crockets' silhouette
  for (const s of [-1, 1]) prism(q, t + s * (w / 2 + 0.3), -0.1, y + h - 0.4, y + h + 1.5, 0.15, 4, T, tag, 0.03)
  prism(q, t, -0.1, y + h + 2.2, y + h + 3.4, 0.14, 4, T, tag, 0.02)
  // the cheeks back to the roof
  roof(q, t - w / 2 - 0.1, t + w / 2 + 0.1, 0.2, 3, y + h - 0.1, 1.4, 0, 1.4, shade(SLATE, 0.94))
}

/** The pierced parapet along a wall head, its little Gothic lights */
function parapet(q: MeshBuilder, x0: number, x1: number, y: number): void {
  block(q, x0, x1, -0.3, 0.05, y, y + 0.2, T, tag)
  block(q, x0, x1, -0.3, 0.05, y + 0.85, y + 1.05, T, tag)
  for (let x = x0; x <= x1 + 0.01; x += 0.62) block(q, x - 0.06, x + 0.06, -0.26, 0, y + 0.2, y + 0.85, T, tag)
}

function wall(out: MeshBuilder, x0: number, x1: number, z0: number, z1: number, y: number, e: number): void { block(out, x0, x1, z0, z1, y, e, S, rock) }

export function hotelDeCluny(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0, E = y + 11, W = y + 8.8
  const q = new MeshBuilder()
  // the paved court
  q.quad([[-16, y + 0.08, -15.9], [17, y + 0.08, -8.1], [17, y + 0.08, 1.85], [-16, y + 0.08, 1.85]].reverse() as [number, number, number][], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], shade(PALE, 0.8), 0)
  // ---- the corps de logis, the wings, the chapel's block
  wall(q, -17, 26, 1.85, 11.5, y, E)
  roof(q, -17.2, 26.2, 1.55, 11.8, E, 8.2, 0, 5.12, SLATE)
  wall(q, -22, -16, -18.8, 1.85, y, W)
  roof(q, -22.3, -15.7, -19, 2.2, W, 6.2, 3.3, 0, SLATE)
  wall(q, 17, 26, -8, 1.85, y, E - 1)
  roof(q, 16.7, 26.3, -8.2, 2.2, E - 1, 7.2, 4.8, 0, SLATE)
  wall(q, -15.5, -6.5, 11.5, 24, y, y + 10)
  roof(q, -15.8, -6.2, 11.3, 24.3, y + 10, 5, 4.8, 0, SLATE)
  // ---- the court's face of the corps de logis
  elevation(q, { x: -16, z: 1.85 }, { x: 17, z: 1.85 }, { x: 0, z: -20 }, (f, L) => {
    block(f, -L / 2, L / 2, -0.04, 0.2, 0, 11, S, rock)
    slabOn(f, '-z', 0, -L / 2, L / 2, 4.7, 4.95, 0.14, T)
    const n = 7
    for (let i = 0; i < n; i++) {
      const t = -L / 2 + (i + 0.5) * (L / n)
      if (Math.abs(t - 5.5) > 2.2) {
        cross(f, t, y + 0.9, 1.5, 2.9)
        cross(f, t, y + 5.8, 1.5, 3.4)
      }
      lucarne(f, t, E, 1.4, 2.5)
    }
    parapet(f, -L / 2, L / 2, E)
    slabOn(f, '-z', 0, -L / 2, L / 2, E - 0.4, E, 0.3, T)
    // the court's two pointed doors, either side of the stair tower
    for (const t of [-6.4]) { rectOn(f, '-z', 0, t - 1.4, t + 1.4, y, y + 3.6, T, 0.05); pointedPane(f, -0.08, t, y, 2.1, 3.2, DARK) }
  })
  // ---- the stair tower, seven-sided, its little windows climbing
  const tx = 6, tz = 0.5, R = 2.5
  prism(q, tx, tz, y, y + 18.4, R, 8, S, rock)
  prism(q, tx, tz, y + 18.4, y + 18.8, R + 0.25, 8, T, tag)
  prism(q, tx, tz, y + 18.8, y + 23.5, R + 0.1, 8, SLATE, metal, 0.15)
  prism(q, tx, tz, y + 23.3, y + 24.6, 0.1, 5, T, metal, 0.02)
  for (let k = 0; k < 6; k++) {
    const a = -Math.PI / 2 + (k - 1.5) * 0.42, h = y + 1.4 + k * 2.6, x = tx + Math.cos(a) * (R + 0.02), z = tz + Math.sin(a) * (R + 0.02)
    block(q, x - 0.5, x + 0.5, z - 0.35, z + 0.35, h, h + 1.7, T, tag)
    block(q, x - 0.34, x + 0.34, z - 0.39, z + 0.39, h + 0.12, h + 1.58, GLASS, 0)
  }
  // ---- the west wing to the court: its arcade of four pointed arches, the gallery over
  elevation(q, { x: -16, z: -15 }, { x: -16, z: 1.85 }, { x: 0, z: -7 }, (f, L) => {
    block(f, -L / 2, L / 2, -0.04, 0.2, 0, 8.8, S, rock)
    for (let i = 0; i < 4; i++) {
      const t = -L / 2 + (i + 0.5) * (L / 4)
      rectOn(f, '-z', 0, t - 1.75, t + 1.75, y, y + 4.6, shade(T, 0.97), 0.05)
      pointedPane(f, -0.09, t, y, 2.9, 4.2, DARK)
      cross(f, t, y + 5, 1.3, 2.5)
      lucarne(f, t, W, 1.2, 2)
    }
    parapet(f, -L / 2, L / 2, W)
  })
  // ---- the east wing to the court, and its street end, a tall gable with one window
  elevation(q, { x: 17, z: -8 }, { x: 17, z: 1.85 }, { x: 0, z: -7 }, (f, L) => {
    block(f, -L / 2, L / 2, -0.04, 0.2, 0, E - y - 1, S, rock)
    cross(f, -1.8, y + 1, 1.4, 2.8); cross(f, 1.8, y + 1, 1.4, 2.8); cross(f, 0, y + 5.4, 1.5, 3)
    lucarne(f, 0, E - 1, 1.4, 2.4)
    parapet(f, -L / 2, L / 2, E - 1)
  })
  // ---- the back: to the garden, the corps de logis's windows and a few lucarnes; the east flank
  elevation(q, { x: -6, z: 11.5 }, { x: 26, z: 11.5 }, { x: 10, z: 30 }, (f, L) => {
    for (let i = 0; i < 5; i++) { const t = -L / 2 + (i + 0.5) * (L / 5); cross(f, t, y + 1.1, 1.4, 2.9); cross(f, t, y + 5.8, 1.4, 3.4); if (i % 2 === 0) lucarne(f, t, E, 1.3, 2.3) }
    slabOn(f, '-z', 0, -L / 2, L / 2, E - 0.4, E, 0.3, T)
  })
  elevation(q, { x: 26, z: -8 }, { x: 26, z: 11.5 }, { x: 40, z: 0 }, (f, L) => {
    for (let i = 0; i < 4; i++) { const t = -L / 2 + (i + 0.5) * (L / 4); cross(f, t, y + 1.1, 1.3, 2.8); cross(f, t, y + 5.7, 1.3, 2.9) }
  })
  // ---- the chapel, its apse oriel on a pier, Gothic windows
  elevation(q, { x: -6.5, z: 11.5 }, { x: -6.5, z: 24 }, { x: 10, z: 18 }, (f, L) => { for (const t of [-L / 4, L / 4]) { rectOn(f, '-z', 0, t - 1.2, t + 1.2, y + 3.4, y + 8.9, T, 0.05); pointedPane(f, -0.08, t, y + 3.6, 1.9, 5, GLASS) } })
  prism(q, -11, 24.6, y + 3, y + 10, 2.4, 7, S, rock)
  prism(q, -11, 24.6, y + 0.4, y + 3, 0.9, 7, S, rock, 2.4)
  prism(q, -11, 24.6, y + 10, y + 13, 2.5, 7, SLATE, metal, 0.1)
  // ---- the street wall, crenellated, slanting across the front of the court, the carriage gate and the small door
  elevation(q, { x: -16, z: -15.9 }, { x: 17, z: -8.1 }, { x: 0, z: -40 }, (f, L) => {
    const H = 6.4
    block(f, -L / 2, L / 2, 0, 0.75, y, y + H, S, rock)
    // the corbelled walk and its merlons
    block(f, -L / 2, L / 2, -0.3, 0.75, y + H - 0.1, y + H + 0.25, T, tag)
    for (let x = -L / 2; x < L / 2 - 0.1; x += 0.8) block(f, x + 0.25, x + 0.55, -0.26, 0, y + H - 0.55, y + H - 0.1, T, tag)
    for (let x = -L / 2 + 0.2; x < L / 2 - 0.3; x += 1.9) block(f, x, x + 1.1, -0.3, 0.25, y + H + 0.25, y + H + 1.3, S, rock)
    // the gate, a pointed arch to its full height, and the little door beside it, with a carved label
    const g = 3.8
    rectOn(f, '-z', 0, g - 2.3, g + 2.3, y, y + 5.8, T, 0.05)
    pointedPane(f, -0.09, g, y, 3.7, 5.3, hex('#3b2b1f'))
    block(f, g - 0.05, g + 0.05, -0.13, -0.09, y, y + 4.7, DARK)
    pointedPane(f, -0.09, g - 4.6, y, 1.5, 2.9, hex('#3b2b1f'))
    rectOn(f, '-z', 0, g - 5.5, g - 3.7, y, y + 3.3, T, 0.04)
    // what stands over the gate: a small corbelled gable
    block(f, g - 2.6, g + 2.6, -0.3, 0.75, y + H + 0.25, y + H + 1.6, S, rock)
    pedimentOn(f, '-z', -0.3, g - 2.6, g + 2.6, y + H + 1.6, 1.2, 0.08, T)
  })
  for (const [x, z] of [[-16, -15.9], [17, -8.1]] as const) prism(q, x, z, y, y + 8.6, 0.85, 8, S, rock)
  out.positions.push(...q.positions); out.normals.push(...q.normals); out.uvs.push(...q.uvs); out.colors.push(...q.colors)
  const base = (out.positions.length - q.positions.length) / 3
  for (const i of q.indices) out.indices.push(base + i)
}
