import { cutDomeImax } from '../defense3/passages.ts'
import { type MeshBuilder, capPolygonWithHoles } from '../../../buildings.ts'
import type { Rgb } from '../../../models.ts'
import { beam, block, hex, shade } from '../../kit.ts'
import { edgeAt, signText } from '../../parts.ts'
import type { Fit } from '../../fit.ts'
import { fitted } from '../palaces/common.ts'
import { ccw, FIXED, ring, UV, walls } from '../monuments/common.ts'

/*
 * WESTFIELD LES 4 TEMPS (1981, enlarged 2006): the long low podium of the shopping centre south-west of the parvis, most of it
 * under the slab. What a rider sees: the pale concrete podium with glazed shopfronts where it meets the parvis, the glass
 * entrance under a sloped glass canopy at the top of the steps by the Grande Arche (Le Dôme entrance) with the red Westfield
 * band over it, rooflights along the malls, and the open car-park decks on its roof at the east end.
 * Ring (OSM way 396802664) in the model's frame, +z toward the parvis (entry front 206).
 */
const QT = ring([-262.8, 27.5, -192.0, -73.5, -156.7, -57.5, -133.7, -57.3, -133.8, -76.1, -114.7, -76.2, -114.6, -92.5, -102.3, -92.5, -103.3, -77.6, -43.9, -75.6, -35.2, -85.7, 3.5, -102.3, 19.4, -93.6, 69.9, -11.7, 189.7, -11.0, 189.2, 16.3, 252.3, 16.2, 252.3, -8.9, 263.3, -6.7, 260.1, 84.5, 152.9, 82.1, 150.6, 102.3, 131.2, 102.0, 133.7, 81.3, 83.6, 81.0, 83.5, 96.5, -38.9, 95.9, -38.8, 80.4, -70.6, 80.2, -68.8, 45.9, -100.7, 45.8, -106.1, 36.5, -253.8, 37.2])
const QT_WALL: Rgb = hex('#c9c6bd') // pale concrete, as photographed
const QT_ROOF: Rgb = hex('#8f918d')
const QT_GLASS: Rgb = hex('#7f9aa6') // shopfront glass in daylight (sky-blue grey)
const QT_CANOPY: Rgb = hex('#a9c3cc')
const QT_FRAME: Rgb = hex('#e4e4e0')
const QT_RED: Rgb = hex('#d0202e') // Westfield red
const QT_STEP: Rgb = hex('#a39e92')
const QT_DECK: Rgb = hex('#6e706d')
const QT_STRIPE: Rgb = hex('#e8e6dc')
const QT_STEPS_X = -110
const QT_GLAZE_H = 5.5 // shopfront band height above the parvis
const QT_BAND_H = 3.2 // Westfield band height
/** car-park decks on the roof, east end: [x0, x1, z0, z1] */
const QT_DECKS: [number, number, number, number][] = [[80, 185, -5, 75], [192, 255, 20, 78]]

export function quatreTemps(out: MeshBuilder, fit: Fit): void {
  const sx = fit.hx > 0 ? fit.hx / 263.3 : 1
  const sz = fit.hz > 0 ? fit.hz / 102.3 : 1
  const at = (x: number, z: number): number => (fit.groundAt ? fit.groundAt(x * sx, z * sz) : 0)
  const foot = at(QT_STEPS_X, 80)
  let top = foot + 13
  for (const p of QT) top = Math.max(top, at(p.x, p.z) + 1)
  for (const [x, z] of [[-200, 10], [-100, 0], [0, 0], [100, 30], [200, 40]]) top = Math.max(top, at(x, z) + 1)
  const X = QT_STEPS_X
  const w = 13
  const z1 = 78
  const z0 = 42
  const rise = 11.5
  const py = foot + rise
  fitted(out, fit, 263.3, 102.3, (q) => {
    const r = ccw(QT)
    walls(q, r, 0, top, QT_WALL)
    capPolygonWithHoles(q, [r], top, QT_ROOF, FIXED)
    for (let i = 0; i < r.length; i++) {
      const e = edgeAt(r, i)
      if (e.L < 8) continue
      const P = (u: number, y: number, o = 0.08): [number, number, number] => [e.a.x + e.tx * u + e.nx * o, y, e.a.z + e.tz * u + e.nz * o]
      // the coping line
      q.quad([P(0, top - 1.1), P(e.L, top - 1.1), P(e.L, top - 0.5), P(0, top - 0.5)], [e.nx, 0, e.nz], UV, shade(QT_WALL, 0.8), FIXED)
      // glazed shopfronts on the faces that look onto the parvis, at the ground there, with mullions
      if (e.nz > 0.6) {
        const g0 = Math.max(0, at(e.a.x + e.tx * e.L / 2, e.a.z + e.tz * e.L / 2) + 0.3)
        q.quad([P(0, g0), P(e.L, g0), P(e.L, g0 + QT_GLAZE_H), P(0, g0 + QT_GLAZE_H)], [e.nx, 0, e.nz], UV, QT_GLASS, FIXED)
        for (let u = 0; u <= e.L; u += 6) beam(q, P(u, g0, 0.2), P(u, g0 + QT_GLAZE_H, 0.2), 0.12, QT_FRAME)
        q.quad([P(0, g0 + QT_GLAZE_H), P(e.L, g0 + QT_GLAZE_H), P(e.L, g0 + QT_GLAZE_H + 0.8), P(0, g0 + QT_GLAZE_H + 0.8)], [e.nx, 0, e.nz], UV, QT_FRAME, FIXED)
      }
    }
    // rooflights along the malls
    for (const [x0, x1, z] of [[-230, -110, 2], [-100, 60, 28]] as const) {
      for (let x = x0; x < x1; x += 22) block(q, x, x + 16, z - 3, z + 3, top, top + 1.4, QT_CANOPY)
    }
    // car-park decks on the roof: a parapet, the deck, white bay lines
    for (const [x0, x1, d0, d1] of QT_DECKS) {
      block(q, x0, x1, d0, d1, top, top + 0.3, QT_DECK)
      for (const [a, b, c, d] of [[x0, x1, d0, d0 + 0.3], [x0, x1, d1 - 0.3, d1], [x0, x0 + 0.3, d0, d1], [x1 - 0.3, x1, d0, d1]]) block(q, a, b, c, d, top, top + 1.2, QT_WALL)
      for (let x = x0 + 3; x < x1 - 2; x += 2.6) {
        block(q, x, x + 0.12, d0 + 2, d0 + 7, top + 0.3, top + 0.33, QT_STRIPE)
        block(q, x, x + 0.12, d1 - 7, d1 - 2, top + 0.3, top + 0.33, QT_STRIPE)
      }
    }
    // the steps up to the entrance, planted slopes either side
    const steps = 24
    for (let k = 0; k < steps; k++) {
      const z = z1 - (k * (z1 - z0)) / steps
      block(q, X - w, X + w, z0 - 6, z, 0, foot + ((k + 1) * rise) / steps, k % 2 ? QT_STEP : shade(QT_STEP, 1.06))
    }
    for (const s of [-1, 1]) {
      const x0 = X + s * (w + 4)
      block(q, x0 - 4, x0 + 4, z0 - 6, z1 - 3, 0, foot + 4.2, hex('#4a5d3b'))
      block(q, x0 - 4, x0 + 4, z0 - 6, z0 + 14, foot + 4.2, foot + 9, hex('#4a5d3b'))
    }
    // the entrance: a tall glass front, the red Westfield band over it, a sloped glass canopy on white posts
    block(q, X - 18, X + 18, z0 - 16, z0 - 3, py, py + 8, QT_GLASS)
    for (let x = X - 18; x <= X + 18; x += 3) block(q, x - 0.1, x + 0.1, z0 - 2.95, z0 - 2.8, py, py + 8, QT_FRAME)
    block(q, X - 18, X + 18, z0 - 3, z0 - 2.4, py + 8, py + 8 + QT_BAND_H, QT_RED)
    const cy0 = py + 8 + QT_BAND_H + 0.6
    const cy1 = cy0 - 2.5
    const cz = z0 + 10
    q.quad([[X - 20, cy0, z0 - 3], [X + 20, cy0, z0 - 3], [X + 20, cy1, cz], [X - 20, cy1, cz]], [0, 0.97, 0.24], UV, QT_CANOPY, FIXED)
    q.quad([[X - 20, cy1, cz], [X + 20, cy1, cz], [X + 20, cy0, z0 - 3], [X - 20, cy0, z0 - 3]], [0, -0.97, -0.24], UV, QT_CANOPY, FIXED)
    for (let x = X - 20; x <= X + 20; x += 5) beam(q, [x, cy0 + 0.1, z0 - 3], [x, cy1 + 0.1, cz], 0.12, QT_FRAME)
    for (const x of [X - 19, X - 6, X + 6, X + 19]) beam(q, [x, py, cz - 0.5], [x, cy1, cz - 0.5], 0.18, QT_FRAME)
    // shopfronts at the parvis level either side of the steps
    for (const s of [-1, 1]) block(q, X + s * 37 - 14, X + s * 37 + 14, 45.6, 46.3, foot, foot + 4.2, QT_GLASS)
  })
  signText(out, 'WESTFIELD LES 4 TEMPS', X * sx, py + 8 + QT_BAND_H / 2, (z0 - 2.35) * sz, 1.9, [0.98, 0.98, 0.98], { heading: 0 })
  cutDomeImax(out, fit)
}
