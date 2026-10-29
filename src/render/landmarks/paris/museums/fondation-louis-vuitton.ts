import type { MeshBuilder } from '../../../buildings.ts'
import { beam, hex, shade, type Rgb } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { offsetRing } from '../../parts.ts'
import { ellipse, plan, rounded, sheet, slab, type V3 } from './shapes.ts'

/**
 * The Fondation Louis Vuitton (Frank Gehry, 2014) on the edge of the Jardin d'Acclimatation in the Bois de Boulogne.
 * Its silhouette is the point: from the Avenue du Mahatma-Gandhi a ship under sail — TWELVE curved glass sails
 * (3,600 panels, each bent to its own curve) billowing out over and past a white "iceberg" of stacked gallery volumes
 * clad in Ductal, its tree-planted terraces showing between the sails, the whole over a water basin fed by a gentle
 * cascade. Over forty metres high (fr.wikipedia: a 9 m ground floor, a 6 m technical zone, a 9 m upper floor and 9 m
 * light wells over it, and the sails above that).
 *
 * Plan from OSM way 309626332 (122 × 57 m), drawn here in its own frame at that size and stretched to the fit: local
 * x east, −z south (the avenue and the basin); placed by point and size like the Grand Palais, so the frame is the
 * one drawn here and not one a fit search picks.
 */
const REF = { hx: 61.1, hz: 28.7 }
const FOOT: [number, number][] = [[-61.1, 13.5], [-60.1, 8.1], [-54.6, 4.5], [-54.9, -1.2], [-49.9, -4.7], [-45.4, -6.9], [-38.7, -8.5],
  [-33.3, -12.3], [-25.4, -16.1], [-19.0, -16.1], [-10.0, -26.8], [-5.0, -19.7], [-3.6, -15.7], [3.7, -16.3], [15.0, -19.9], [19.0, -28.7],
  [35.4, -21.9], [34.7, -16.9], [45.6, -10.3], [57.4, 0.2], [61.1, 3.4], [57.5, 9.0], [48.1, 17.9], [31.8, 16.4], [31.1, 10.8], [22.4, 23.5],
  [12.8, 23.0], [10.3, 22.4], [7.0, 17.1], [3.5, 14.1], [-6.0, 17.4], [-40.2, 28.7], [-48.7, 24.7], [-53.0, 17.8], [-58.0, 16.9]]

interface Sail {
  /** the foot's middle, the way it billows out (a bearing in the model's frame: 0 = +z, 90 = +x) and its width */
  x: number; z: number; out: number; w: number
  /** foot and head heights at the sail's middle, and how they slope across it (m per unit of u) */
  y0: number; y1: number; tilt0?: number; tilt1?: number
  /** how far the head leans out past the foot, how much it bellies, how far the edges sweep back */
  lean: number; belly: number; sweep?: number
}

// the twelve, in two tiers: seven low round the iceberg's foot, five high over the light wells, each wider than it is
// tall and leaning well out, the upper ones overlapping the lower like a ship's courses and topsails
const SAILS: Sail[] = [
  { x: -54, z: 6, out: -85, w: 30, y0: 8, y1: 24, tilt0: 2, tilt1: -3, lean: 10, belly: 3, sweep: 6 },
  { x: -34, z: -11, out: -155, w: 36, y0: 9, y1: 25, tilt0: -2, tilt1: 4, lean: 10, belly: 3, sweep: 7 },
  { x: 0, z: -18, out: 178, w: 36, y0: 10, y1: 27, tilt0: 2, tilt1: -4, lean: 9, belly: 3, sweep: 7 },
  { x: 33, z: -18, out: 140, w: 34, y0: 9, y1: 25, tilt0: -2, tilt1: 4, lean: 10, belly: 3, sweep: 6 },
  { x: 53, z: 4, out: 85, w: 28, y0: 8, y1: 23, tilt0: 2, tilt1: -3, lean: 10, belly: 3, sweep: 5 },
  { x: 12, z: 20, out: 5, w: 40, y0: 10, y1: 27, tilt0: -2, tilt1: 4, lean: 9, belly: 3, sweep: 7 },
  { x: -32, z: 22, out: -20, w: 36, y0: 9, y1: 25, tilt0: 2, tilt1: -4, lean: 9, belly: 3, sweep: 7 },
  // the topsails
  { x: -36, z: 4, out: -125, w: 30, y0: 21, y1: 37, tilt0: -2, tilt1: 4, lean: 11, belly: 3, sweep: 5 },
  { x: -8, z: -6, out: -172, w: 32, y0: 24, y1: 43, tilt0: 2, tilt1: -4, lean: 11, belly: 3, sweep: 6 },
  { x: 25, z: -6, out: 135, w: 30, y0: 22, y1: 39, tilt0: -2, tilt1: 4, lean: 11, belly: 3, sweep: 5 },
  { x: 30, z: 11, out: 40, w: 28, y0: 21, y1: 36, tilt0: 2, tilt1: -3, lean: 10, belly: 3, sweep: 5 },
  { x: -4, z: 12, out: -10, w: 34, y0: 25, y1: 46, tilt0: -2, tilt1: 4, lean: 11, belly: 3, sweep: 6 },
]

export function fondationLouisVuitton(out: MeshBuilder, fit: Fit): void {
  const sx = Math.min(Math.max(fit.hx, 45), 70) / REF.hx
  const sz = Math.min(Math.max(fit.hz, 22), 34) / REF.hz
  const ductal = hex('#eeeeea')
  const shadeW = shade(ductal, 0.86)
  const darkGlass: Rgb = [0.5, 0.56, 0.6]
  const sailGlass: Rgb = [0.86, 0.9, 0.92]
  const timber: Rgb = [0.6, 0.5, 0.38]
  const steel: Rgb = [0.62, 0.64, 0.64]
  const green: Rgb = [0.34, 0.5, 0.3]

  // ---- the iceberg: the ground floor on the whole plan, its glass recessed under a white lip
  const foot = plan(FOOT, sx, sz)
  slab(out, offsetRing(foot, -2.5), 0, 7.5, darkGlass)
  slab(out, foot, 7.5, 9.5, ductal)
  // the galleries over it: white volumes, rounded and offset from each other, the terraces on their tops
  const vols: [number, number, number, number, number, number][] = [
    // x0, x1, z0, z1, top, corner radius
    [-52, -24, -6, 22, 22, 6], [-28, 12, -14, 16, 26, 7], [8, 44, -18, 14, 23, 6], [38, 55, -8, 8, 19, 4],
  ]
  for (const [x0, x1, z0, z1, top, r] of vols) {
    const ring = rounded(x0 * sx, x1 * sx, z0 * sz, z1 * sz, r)
    slab(out, ring, 9.5, top, ductal)
    // the planted terrace: a green bed inside the parapet
    slab(out, offsetRing(ring, -2.2), top, top + 0.5, green)
    slab(out, offsetRing(ring, -0.1), top - 1.2, top - 0.9, shadeW, shadeW, false)   // a shadow line under the lip
  }
  // the light wells, white towers through the terraces, the tallest over the middle
  for (const [cx, cz, rx, rz, top] of [[-38, 7, 8, 7, 30], [-6, 2, 9, 8, 35], [24, -2, 8, 7, 31], [-18, 10, 5, 4, 32]] as const) {
    slab(out, ellipse(cx * sx, cz * sz, rx * sx, rz * sz, 14), 9.5, top, ductal)
  }

  // ---- the twelve sails
  for (const s of SAILS) {
    const a = (s.out * Math.PI) / 180
    const o = [Math.sin(a), Math.cos(a)]          // out
    const t = [Math.cos(a), -Math.sin(a)]         // across
    const fx = s.x * sx
    const fz = s.z * sz
    const at = (u: number, v: number): V3 => {
      const c = u * 2 - 1
      const half = (s.w / 2) * (1 - 0.18 * v)
      const away = s.lean * v + s.belly * Math.sin(Math.PI * v) * (1 - 0.55 * c * c) - (s.sweep ?? 0) * c * c
      const y = s.y0 + (s.y1 - s.y0) * v + (s.tilt0 ?? 0) * c * (1 - v) + (s.tilt1 ?? 0) * c * v
      return [fx + t[0] * half * c + o[0] * away, y, fz + t[1] * half * c + o[1] * away]
    }
    // a little paler toward the head, where the sky is in it
    sheet(out, at, 7, 4, (_u, v) => shade(sailGlass, 0.94 + 0.08 * v), 0.04)
    // the glazing bars, up the sail and across it
    for (const u of [0, 0.25, 0.5, 0.75, 1]) {
      for (let k = 0; k < 4; k++) beam(out, at(u, k / 4), at(u, (k + 1) / 4), 0.12, steel)
    }
    for (const v of [0, 0.5, 1]) {
      for (let k = 0; k < 4; k++) beam(out, at(k / 4, v), at((k + 1) / 4, v), 0.12, steel)
    }
    // the timber struts back from the sail to the iceberg
    for (const u of [0.3, 0.7]) {
      const p = at(u, 0.55)
      beam(out, p, [fx + t[0] * (u * 2 - 1) * s.w * 0.25, Math.max(9.5, p[1] - 6), fz + t[1] * (u * 2 - 1) * s.w * 0.25], 0.22, timber)
    }
  }
}
