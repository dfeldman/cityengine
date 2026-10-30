/**
 * The JARDIN D'ACCLIMATATION's main entrance, the Porte des Sablons on the Avenue du Mahatma-Gandhi (OSM node 128407713,
 * barrier=entrance, entrance=main): a line of iron railings and gates between two small white lodges with gabled
 * slate roofs and round windows in their gables, and between them the two ticket booths, each a little glazed booth under
 * a broad shallow iron roof with a fretted frieze (Commons: "Entrée Jardin d'Acclimatation.jpg"). Local x along the
 * railing (bearing 25, between OSM's two lodges, ways 1084917461 and 1084917464, 35.8 m apart; the two booths are
 * ways 1084917462–463), the avenue at −z (front 115).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { box, prism, strut, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { roof } from '../../kit.ts'
import { quadN } from './bowl.ts'

const WHITE: Rgb = [0.9, 0.89, 0.86]
const SLATE: Rgb = [0.4, 0.43, 0.47]
const GREEN: Rgb = [0.13, 0.26, 0.2]
const GLASS: Rgb = [0.22, 0.27, 0.28]

export function acclimatationEntrance(out: MeshBuilder, fit: Fit): void {
  const met = surfaceTag('metal')
  const G = (x: number, z: number): number => fit.groundAt?.(x, z) ?? 0.5
  // the two lodges at the ends: white rendered walls, a door and windows, a steep gabled slate roof, the oculus
  for (const s of [-1, 1]) {
    const x = s * 17.9
    const g = G(x, 0)
    box(out, x, g + 1.6, 0, 2.8, 2.1, 2.4, WHITE, surfaceTag('stucco'))
    roof(out, x - 3.2, x + 3.2, -2.8, 2.8, g + 3.7, 2.4, 3.2, 0, SLATE)
    for (const z of [-2.8, 2.8]) {
      quadN(out, [[x - 3.0, g + 3.7, z], [x + 3.0, g + 3.7, z], [x, g + 6.0, z], [x, g + 6.0, z]], [0, 0, Math.sign(z)], WHITE, surfaceTag('stucco'))
      prism(out, x, z + Math.sign(z) * 0.02, g + 4.6, g + 4.6 + 0.001, 0.45, 12, GLASS, 0)
    }
    quadN(out, [[x - 0.4, g + 4.15, -2.83], [x + 0.4, g + 4.15, -2.83], [x + 0.4, g + 4.95, -2.83], [x - 0.4, g + 4.95, -2.83]], [0, 0, -1], GLASS)
    box(out, x - s * 0.8, g + 1.1, -2.42, 0.55, 1.1, 0.03, GREEN, 0)
    box(out, x + s * 1.3, g + 1.8, -2.42, 0.6, 0.8, 0.03, GLASS, 0)
  }
  // the ticket kiosks: glazed booths under broad, shallow iron roofs with a fretted frieze
  for (const x of [-4.45, 4.45]) {
    const g = G(x, 0)
    box(out, x, g + 1.25, 0, 1.3, 1.25, 1.3, GLASS, surfaceTag('glass'))
    for (const [dx, dz] of [[-1.3, -1.3], [1.3, -1.3], [-1.3, 1.3], [1.3, 1.3]]) prism(out, x + dx, dz, g, g + 2.9, 0.07, 6, GREEN, met)
    box(out, x, g + 2.75, 0, 2.3, 0.18, 2.3, [0.84, 0.84, 0.8], met)
    roof(out, x - 2.6, x + 2.6, -2.6, 2.6, g + 2.95, 0.9, 2.2, 2.2, [0.86, 0.86, 0.84])
    prism(out, x, 0, g + 3.85, g + 4.3, 0.12, 6, GREEN, met)
  }
  // the railings and gates between, and a lamp at each kiosk
  for (const [x0, x1] of [[-15.0, -7.2], [-1.7, 1.7], [7.2, 15.0]]) {
    const g = G((x0 + x1) / 2, 0.5)
    strut(out, [x0, g + 2.1, 0.5], [x1, g + 2.1, 0.5], 0.06, 0.06, GREEN, met, false)
    strut(out, [x0, g + 0.2, 0.5], [x1, g + 0.2, 0.5], 0.06, 0.06, GREEN, met, false)
    for (let x = x0; x <= x1 + 0.01; x += (x1 - x0) / Math.round((x1 - x0) / 0.2)) {
      strut(out, [x, g, 0.5], [x, g + 2.3, 0.5], 0.03, 0.03, GREEN, met, false)
    }
  }
  for (const x of [-10, 10]) {
    const g = G(x, -1.5)
    prism(out, x, -1.5, g, g + 3.8, 0.07, 6, GREEN, met)
    prism(out, x, -1.5, g + 3.8, g + 4.3, 0.22, 6, [0.95, 0.93, 0.8], 0, 0.15)
  }
}
