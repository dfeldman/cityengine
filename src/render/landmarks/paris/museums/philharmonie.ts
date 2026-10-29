import type { MeshBuilder } from '../../../buildings.ts'
import { beam, hex, type Rgb } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { ccw, jitter, sheet, slab, type V3 } from './shapes.ts'

const FIXED = 0

/**
 * The Philharmonie de Paris (Jean Nouvel, 2015) at the north-east corner of the Parc de la Villette, by the
 * Périphérique: a shimmering hill — its skin some 340,000 aluminium tiles in the shape of birds, in six shades from
 * near-black to silver, laid in a tessellation that darkens toward the ground — over a glazed base, and at its summit the
 * BELVÉDÈRE, a great tilted blade of aluminium thrust out at 52 m over the park. OSM way 21502894 (163 × 104 m, no
 * height). Local frame: long axis x (north−, south+), −z the park front (west).
 */
export function philharmonie(out: MeshBuilder, fit: Fit): void {
  const hx = Math.min(Math.max(fit.hx, 60), 90)
  const hz = Math.min(Math.max(fit.hz, 38), 58)
  const ring = fit.ring && fit.ring.length >= 3 ? ccw(fit.ring) : [{ x: -hx, z: -hz }, { x: hx, z: -hz }, { x: hx, z: hz }, { x: -hx, z: hz }]
  const tones: Rgb[] = [hex('#2a2c2e'), hex('#44484b'), hex('#62676a'), hex('#868b8e'), hex('#aeb2b4'), hex('#cfd2d3')]
  const base = 11
  // the glazed base, dark, with the aluminium lip over it
  slab(out, ring, 0, base - 1.2, [0.26, 0.3, 0.33])
  slab(out, ring, base - 1.2, base, tones[2], tones[1])
  // the hill: a mound over the base, its crown off-centre to the north-west, the tiles darkening toward the ground
  const ax = hx * 0.95
  const az = hz * 0.93
  const peak = { x: -hx * 0.18, z: -hz * 0.12 }
  const rise = 34
  const hill = (u: number, v: number): V3 => {
    const x = -ax + u * 2 * ax
    const z = az - v * 2 * az          // (z falling as v rises: the sheet's corners wound to face up)
    const dx = (x - peak.x) / (x < peak.x ? ax + peak.x : ax - peak.x)
    const dz = (z - peak.z) / (z < peak.z ? az + peak.z : az - peak.z)
    const r = Math.min(1, Math.pow(Math.pow(Math.abs(dx), 2.6) + Math.pow(Math.abs(dz), 2.6), 1 / 2.6))
    return [x, base + rise * Math.pow(1 - Math.pow(r, 3.2), 0.55), z]
  }
  sheet(out, hill, 30, 20, (u, v) => {
    const y = (hill(u, v)[1] - base) / rise
    const i = Math.floor(u * 30) * 31 + Math.floor(v * 20)
    // the bird tiles: a toss between neighbouring shades, the shade climbing with the height
    const k = Math.max(0, Math.min(5, Math.floor(y * 3 + jitter(i, 1) * 2.6)))
    return tones[k]
  })
  // the roof edge's skirt down to the base, so no gap shows under the mound's rim
  for (const [a, b] of [[[-ax, -az], [ax, -az]], [[ax, -az], [ax, az]], [[ax, az], [-ax, az]], [[-ax, az], [-ax, -az]]] as [number, number][][]) {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1])
    out.quad([[a[0], base - 0.1, a[1]], [b[0], base - 0.1, b[1]], [b[0], base + 0.6, b[1]], [a[0], base + 0.6, a[1]]], [(b[1] - a[1]) / L, 0, -(b[0] - a[0]) / L],
      [[0, 0], [1, 0], [1, 1], [0, 1]], tones[1], FIXED)
  }
  // the belvédère: the tilted blade over the summit, cantilevered west over the park
  const top = hill(0.5 + peak.x / (2 * ax), 0.5 - peak.z / (2 * az))[1]
  const bx0 = peak.x - 24
  const bx1 = peak.x + 22
  const blade = (u: number, v: number): V3 => {
    const x = bx0 + u * (bx1 - bx0)
    const z = peak.z + 14 - v * (hz * 0.55 + 22)          // from over the summit out past the west front
    const y = top + 2 + v * (52 - top - 2) - Math.abs(u - 0.5) * 3
    return [x, y, z]
  }
  sheet(out, blade, 6, 5, tones[5], 0.9)
  // its edge and the struts down to the hill
  for (const u of [0, 1]) for (let k = 0; k < 5; k++) beam(out, blade(u, k / 5), blade(u, (k + 1) / 5), 0.35, tones[2])
  for (const [u, v] of [[0.15, 0.25], [0.85, 0.25], [0.5, 0.45]]) {
    const p = blade(u, v)
    beam(out, p, [p[0], hill(0.5 + p[0] / (2 * ax), Math.min(1, Math.max(0, 0.5 - p[2] / (2 * az))))[1], p[2]], 0.5, tones[1])
  }
  // the ramp walk up the hill's south flank to the belvédère, as a pale line on the skin
  let prev: V3 | null = null
  for (let k = 0; k <= 16; k++) {
    const u = 0.95 - k * 0.028
    const v = 0.08 + k * 0.022
    const p = hill(u, v)
    const q: V3 = [p[0], p[1] + 0.5, p[2]]
    if (prev) beam(out, prev, q, 0.9, tones[5], 0.2)
    prev = q
  }
}
