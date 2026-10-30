/**
 * The STADE PIERRE-DE-COUBERTIN, the covered hall at the Porte de Saint-Cloud (Wikipedia fr: built 1937 for the Exposition,
 * "un premier stade multisport couvert" in France, rebuilt 1946, renovated 1990). OSM: relation/1309184, 124 × 140 m.
 *
 * What the street sees, from the Commons photographs of November 2016: a GIANT ORDER OF RED BRICK PIERS, the full height
 * of the building, against a cream wall; a deep flat concrete eave over them; a brick plinth with small windows; and, from
 * the 1990 renovation, tall SILVER DRUMS of ribbed metal and glazed boxes let in between the piers. One brick pylon carries
 * a column of carved stone panels. The drums' places are inferred: the plan's two notches, where the photographs show them
 * at the end of a brick range. No source gives the height: 21 m is estimated from the photographs.
 *
 * Drawn on the plan, so every side has its piers; the `front` (local −z, Avenue Georges Lafont) only says where the glass goes.
 */
import { capPolygon, type MeshBuilder } from '../../../buildings.ts'
import { prism, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { roof } from '../../kit.ts'
import { offsetRing } from '../../parts.ts'
import { towerRing } from '../../tower.ts'
import { groundMid } from './bowl.ts'
import { clamp, edgesOf, pier, reflexCorners, sheet, skirt, walls } from './shell.ts'

const BRICK: Rgb = [0.58, 0.24, 0.16]
const BRICK_DK: Rgb = [0.48, 0.2, 0.14]
const CREAM: Rgb = [0.82, 0.78, 0.68]
const EAVE: Rgb = [0.85, 0.84, 0.8]
const SOFFIT: Rgb = [0.6, 0.57, 0.5]
const ROOF: Rgb = [0.44, 0.45, 0.46]
const DARK: Rgb = [0.13, 0.15, 0.17]
const GLASS: Rgb = [0.24, 0.32, 0.38]
const SILVER: Rgb = [0.76, 0.78, 0.8]
const STONE: Rgb = [0.8, 0.76, 0.66]
const RIM: Rgb = [0.6, 0.62, 0.64]

export function stadeCoubertin(out: MeshBuilder, fit: Fit): void {
  const brick = surfaceTag('brick')
  const conc = surfaceTag('concrete')
  const glass = surfaceTag('glass')
  const metal = surfaceTag('metal')
  const ring = towerRing(fit)
  const g = groundMid(fit)
  const H = g + clamp(fit.height, 14, 24)
  const es = edgesOf(ring)

  walls(out, ring, g - 0.5, H - 0.8, CREAM, conc)
  // the plinth, its small windows framed in the brick
  const plinth = offsetRing(ring, 0.3)
  walls(out, plinth, g - 0.5, g + 3.8, BRICK_DK, brick)
  skirt(out, plinth, g + 3.8, ring, g + 3.8, 'up', BRICK_DK, brick)

  // the longest edge facing the front: the glazed box and the pylons
  let front = -1
  for (let i = 0; i < es.length; i++) if (es[i].nz < -0.45 && (front < 0 || es[i].L > es[front].L)) front = i

  es.forEach((e, i) => {
    if (e.L < 7) return
    const n = Math.max(1, Math.round(e.L / 6.6))
    const bay = e.L / n
    const box = i === front
    for (let k = 0; k <= n; k++) {
      const t = k * bay
      if (t < 0.9 || t > e.L - 0.9) continue
      pier(out, e, t, 1.7, 1.4, g - 0.5, H - 0.8, k % 2 ? BRICK : BRICK_DK, brick)
    }
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) * bay
      const inBox = box && k >= n * 0.3 && k < n * 0.7
      if (inBox) {
        // the 1990 glass let in between the piers, with its steel floors
        sheet(out, e, t - bay / 2 + 0.85, t + bay / 2 - 0.85, g + 0.1, H - 2.4, 0.42, GLASS, glass)
        for (const y of [g + 4.4, g + 8.8, g + 13]) sheet(out, e, t - bay / 2 + 0.85, t + bay / 2 - 0.85, y, y + 0.28, 0.46, SILVER, metal)
      } else {
        sheet(out, e, t - 1.1, t + 1.1, g + 1.2, g + 2.8, 0.34, DARK, glass)
        sheet(out, e, t - 1.6, t + 1.6, g + 0.95, g + 1.15, 0.36, STONE)
      }
    }
    if (box) {
      // the door under a steel canopy, and the two brick pylons either end of the glass
      const mid = e.L / 2
      sheet(out, e, mid - 7, mid + 7, g + 3.2, g + 3.7, 2.8, SILVER, metal)
      for (const t of [e.L * 0.28, e.L * 0.72]) {
        pier(out, e, t, 6, 1.9, g - 0.5, H - 0.8, BRICK, brick)
        for (let p = 0; p < 5; p++) {
          const y = g + 6.2 + p * 2.3
          sheet(out, e, t - 1.2, t + 1.2, y, y + 1.9, 1.94, STONE)
          sheet(out, e, t - 0.6, t + 0.6, y + 0.4, y + 1.5, 1.97, [0.66, 0.62, 0.53])
        }
      }
    }
  })

  // the deep eave over the piers: its soffit rising outward, its fascia, the flat roof, a low hip over the hall
  const eave = offsetRing(ring, 3.2)
  skirt(out, ring, H - 1.6, eave, H - 0.5, 'down', SOFFIT, conc)
  walls(out, eave, H - 0.5, H + 0.6, EAVE, conc)
  capPolygon(out, eave, H + 0.6, ROOF, conc)
  roof(out, -fit.hx * 0.5, fit.hx * 0.5, -fit.hz * 0.5, fit.hz * 0.5, H + 0.6, 2.2, fit.hx * 0.3, fit.hz * 0.3, ROOF)

  // the silver stair drums in the notches, ribbed, a band of glass up each
  for (const c of reflexCorners(ring, 12).slice(0, 3)) {
    const r = 5.2
    prism(out, c.x, c.z, g - 0.5, H + 6, r, 20, SILVER, metal)
    prism(out, c.x, c.z, H + 6, H + 6.5, r + 0.2, 20, RIM, metal)
    for (let k = 0; k < 20; k++) {
      const a = (k / 20) * Math.PI * 2
      const x = c.x + Math.sin(a) * (r + 0.02)
      const z = c.z + Math.cos(a) * (r + 0.02)
      const e = { a: { x: x - Math.cos(a) * 0.1, z: z + Math.sin(a) * 0.1 }, b: { x, z }, L: 0.2, tx: Math.cos(a), tz: -Math.sin(a), nx: Math.sin(a), nz: Math.cos(a) }
      sheet(out, e, -0.08, 0.08, g, H + 6, 0.06, k % 5 === 2 ? DARK : [0.62, 0.64, 0.67], metal)
    }
  }
}
