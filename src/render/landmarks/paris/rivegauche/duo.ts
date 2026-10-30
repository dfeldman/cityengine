import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { centroid, fitted, hex, noise, panel, pts, shade, wound, type P2, type Rgb, type V3 } from './common.ts'

/** the design footprint: the box round OSM's two ways, x east, z north */
const HX = 68.7
const HZ = 58.2
/** OSM way 1130750788, the wider, taken for Duo 1, and way 942459281, both named "Tour Duo 1" in OSM (thinned to their main corners) */
const DUO1 = pts([68.7, -26.4, 43.3, -5.6, 14.7, 6.8, -19.1, -7.2, 31.4, -58.2])
const DUO2 = pts([6.7, 21.5, -21.1, 41.5, -49.5, 58.2, -68.7, 48.7, -28.9, 8.6, -21.1, 0.9])
const H1 = 180
const H2 = 122

/** Panes of a mirrored wall on one lofted face, a→b at y0 to a'→b' at y1: each a tone of sky, a dark one here and there. */
function facets(out: MeshBuilder, a0: P2, b0: P2, y0: number, a1: P2, b1: P2, y1: number, inner: V3, seed: number, pitch: number, rows: number): void {
  const L = Math.hypot(b0.x - a0.x, b0.z - a0.z)
  const n = Math.max(1, Math.round(L / pitch))
  for (let j = 0; j < rows; j++) {
    const v0 = j / rows, v1 = (j + 1) / rows
    const P = (u: number, v: number): V3 => {
      const ax = a0.x + (a1.x - a0.x) * v, az = a0.z + (a1.z - a0.z) * v
      const bx = b0.x + (b1.x - b0.x) * v, bz = b0.z + (b1.z - b0.z) * v
      return [ax + (bx - ax) * u, y0 + (y1 - y0) * v, az + (bz - az) * u]
    }
    for (let i = 0; i < n; i++) {
      const u0 = i / n, u1 = (i + 1) / n
      const k = noise(seed + i * 3.1, j * 1.7)
      const c: Rgb = k > 0.95 ? hex('#3d5266') : k > 0.82 ? hex('#7f9db4') : k > 0.2 ? hex('#a3bfd2') : hex('#bcd2e0')
      // (each pane a touch off the wall's plane in its tone, not its position: at 180 m nobody sees a real offset)
      panel(out, [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)], inner, shade(c, 0.97 + noise(i, seed + j) * 0.06))
    }
  }
}

const about = (r: P2[], k: number, dx: number, dz: number): P2[] => {
  const m = centroid(r)
  return r.map((p) => ({ x: m.x + (p.x - m.x) * k + dx, z: m.z + (p.z - m.z) * k + dz }))
}

/** A lofted stage of a tower, its faces in panes. */
function stage(out: MeshBuilder, a: P2[], ya: number, b: P2[], yb: number, seed: number, floor: number): void {
  const m = centroid(a)
  const inner: V3 = [m.x, (ya + yb) / 2, m.z]
  const rows = Math.max(1, Math.round((yb - ya) / floor))
  for (let i = 0; i < a.length; i++) {
    const j = (i + 1) % a.length
    facets(out, a[i], a[j], ya, b[i], b[j], yb, inner, seed + i * 13, 6.4, rows)
  }
}

/** The dark recessed storey between two stages, and the sliced roof: a slope across the plan from `yHigh` to `yLow`. */
function slicedTop(out: MeshBuilder, ring: P2[], y: number, dirX: number, dirZ: number, rise: number): void {
  const m = centroid(ring)
  const ds = ring.map((p) => (p.x - m.x) * dirX + (p.z - m.z) * dirZ)
  const d0 = Math.min(...ds), d1 = Math.max(...ds)
  const top = (i: number): V3 => [ring[i].x, y + (rise * (ds[i] - d0)) / (d1 - d0 || 1), ring[i].z]
  // the parapet walls up to the slope, and the slope as a fan
  const inner: V3 = [m.x, y, m.z]
  for (let i = 0; i < ring.length; i++) {
    const j = (i + 1) % ring.length
    panel(out, [[ring[i].x, y, ring[i].z], [ring[j].x, y, ring[j].z], top(j), top(i)], inner, hex('#9fb4c3'))
    const c: V3 = [m.x, y + rise / 2, m.z]
    panel(out, [top(i), top(j), c, c], [m.x, y - 10, m.z], hex('#5f6a70'))
  }
}

/**
 * The Tours Duo (Jean Nouvel, finished 2021–22, by memory), on the Boulevard Périphérique at the Bercy-Charenton edge: two leaning,
 * splayed towers of mirrored glass, the first thing a train or a car sees of Paris from the south-east. From Commons "Tours Duo"
 * and "Tour DUO 1": what they are is a silhouette. Each is a shaft that widens as it rises and leans out, a dark recessed
 * storey cut across it high up, a head above that which steps out further, and a roof sliced on the slant.
 *
 * OSM names both ways "Tour Duo 1" and gives both 180 m; from memory they are 180 m and 122 m, and the wider plan is taken for
 * the taller, which is a guess a photograph from the ring road would settle. The plans are OSM's corners, the widening and the
 * lean (about 10 m at the top, away from each other) read off the photographs, the panes' tones invented.
 */
export function toursDuo(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => {
    tower(q, wound([DUO1])[0], H1, 0.72, 0.9, 1, 7.5, -7, 11)
    tower(q, wound([DUO2])[0], H2, 0.68, 0.9, 2, -6, 6, 37)
  })
}

function tower(out: MeshBuilder, plan: P2[], H: number, waist: number, shoulder: number, _id: number, leanX: number, leanZ: number, seed: number): void {
  const y1 = H * waist
  const y2 = y1 + 7
  const y3 = H * shoulder
  const shaftTop = about(plan, 1.14, leanX * waist, leanZ * waist)
  stage(out, plan, 0, shaftTop, y1, seed, 8.4)
  // the dark storey, set in: the cut across the tower that the skyline shows
  const inRing = about(plan, 1.03, leanX * waist, leanZ * waist)
  const dark = hex('#1d2429')
  const m = centroid(shaftTop)
  for (let i = 0; i < plan.length; i++) {
    const j = (i + 1) % plan.length
    panel(out, [[shaftTop[i].x, y1, shaftTop[i].z], [shaftTop[j].x, y1, shaftTop[j].z], [inRing[j].x, y1, inRing[j].z], [inRing[i].x, y1, inRing[i].z]], [m.x, y1 + 5, m.z], shade(dark, 1.3))
    panel(out, [[inRing[i].x, y1, inRing[i].z], [inRing[j].x, y1, inRing[j].z], [inRing[j].x, y2, inRing[j].z], [inRing[i].x, y2, inRing[i].z]], [m.x, y1, m.z], dark)
  }
  // the head, stepping out again
  const headFoot = about(plan, 1.2, leanX * (waist + 0.05), leanZ * (waist + 0.05))
  for (let i = 0; i < plan.length; i++) {
    const j = (i + 1) % plan.length
    panel(out, [[inRing[i].x, y2, inRing[i].z], [inRing[j].x, y2, inRing[j].z], [headFoot[j].x, y2, headFoot[j].z], [headFoot[i].x, y2, headFoot[i].z]], [m.x, y2 + 5, m.z], hex('#58646c'))
  }
  const headTop = about(plan, 1.26, leanX, leanZ)
  stage(out, headFoot, y2, headTop, y3, seed + 5, 8.4)
  slicedTop(out, headTop, y3, leanX === 0 ? 1 : Math.sign(leanX), 0.4 * Math.sign(leanZ), H - y3)
  // the street: a dark glazed foot, so the tower lands rather than floats
  stage(out, about(plan, 1.002, 0, 0), 0, about(plan, 1.012, leanX * 0.04, leanZ * 0.04), 8, seed + 9, 8)
}
