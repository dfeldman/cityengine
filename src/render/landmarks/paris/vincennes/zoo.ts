/**
 * PARC ZOOLOGIQUE DE PARIS — the GRANDE SERRE (1934, renewed 2014): the tropical glasshouse, a long lozenge of glass
 * Refs: Commons "Greenhouse @ Parc Zoologique de Paris" (docs/landmarks/refs/vincennes/zoo/): a full elliptical glass
 * dome from near the ground, a diamond steel lattice, a white ring band low on the skin.
 * on a slim steel lattice, its roof swelling in a flattened vault from a low plinth to a crown ~16 m up. Plan: OSM
 * relation 522886224 (building=conservatory, glass, wall=no); the vault is lofted from fit.ring toward its centre.
 * Buildings only (owner): no animals. The Grande volière is a rock-and-net enclosure (OSM man_made=rock) → left generic;
 * the Grand Rocher stays in ../batch4/bois.ts.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex, type Rgb } from '../../kit.ts'
import { quadN } from '../venues/bowl.ts'

const GLASS: Rgb = [0.3, 0.37, 0.39], GLASS_IN: Rgb = [0.22, 0.27, 0.28], RIB: Rgb = hex('#5c6a66'), PLINTH: Rgb = hex('#8c867c'), BAND: Rgb = hex("#e8e8e4")

// plinth height, vault crown height, loft rings, profile exponent (lower = fuller shoulders), crown fraction, rib width
const GS_PLINTH = 0.4, GS_CROWN = 20, GS_RINGS = 10, GS_POW = 2.0, GS_TOP_F = 0.05, GS_RIB = 0.18, GS_BAND_K = 1, GS_BAND = 0.6

type P = { x: number; z: number }
type V = [number, number, number]

export function grandeSerre(out: MeshBuilder, fit: Fit): void {
  const ring: P[] = fit.ring && fit.ring.length >= 3 ? fit.ring
    : [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
  const n = ring.length, c = { x: ring.reduce((s, p) => s + p.x, 0) / n, z: ring.reduce((s, p) => s + p.z, 0) / n }
  // ring k: shrink factor s (1 → GS_TOP_F), height from a superellipse-ish profile
  const lv = Array.from({ length: GS_RINGS + 1 }, (_, k) => {
    const t = k / GS_RINGS, s = 1 - t * (1 - GS_TOP_F)
    return { s, y: GS_PLINTH + (GS_CROWN - GS_PLINTH) * Math.pow(1 - Math.pow(s, GS_POW), 1 / GS_POW) }
  })
  const at = (p: P, k: number): V => [c.x + (p.x - c.x) * lv[k].s, lv[k].y, c.z + (p.z - c.z) * lv[k].s]
  for (let i = 0; i < n; i++) {
    const a = ring[i], b = ring[(i + 1) % n], ox = (a.x + b.x) / 2 - c.x, oz = (a.z + b.z) / 2 - c.z
    quadN(out, [[a.x, 0, a.z], [b.x, 0, b.z], [b.x, GS_PLINTH, b.z], [a.x, GS_PLINTH, a.z]], [ox, 0, oz], PLINTH)
    for (let k = 0; k < GS_RINGS; k++) {
      const A = at(a, k), B = at(b, k), B2 = at(b, k + 1), A2 = at(a, k + 1)
      const up = (k + 0.5) / GS_RINGS * 3
      quadN(out, [A, B, B2, A2], [ox, up, oz], GLASS)
      quadN(out, [A2, B2, B, A], [-ox, -up, -oz], GLASS_IN)
      // steel: a rib up each ring vertex and a purlin along each ring
      const L = Math.hypot(ox, oz) || 1, dx = -oz / L * GS_RIB, dz = ox / L * GS_RIB, e = 0.05
      const lift = (v: V): V => [v[0] + ox / L * e, v[1] + e, v[2] + oz / L * e]
      const a0 = lift(A), a1 = lift(A2)
      quadN(out, [[a0[0] - dx, a0[1], a0[2] - dz], [a0[0] + dx, a0[1], a0[2] + dz], [a1[0] + dx, a1[1], a1[2] + dz], [a1[0] - dx, a1[1], a1[2] - dz]], [ox, up, oz], RIB)
      const b0 = lift(B)
      { const h = k === GS_BAND_K ? GS_BAND : GS_RIB * 2; quadN(out, [a0, b0, [b0[0], b0[1] + h, b0[2]], [a0[0], a0[1] + h, a0[2]]], [ox, up, oz], k === GS_BAND_K ? BAND : RIB) }
    }
    const T = at(a, GS_RINGS), U = at(b, GS_RINGS), y = lv[GS_RINGS].y
    quadN(out, [T, U, [c.x, y + 0.4, c.z], [c.x, y + 0.4, c.z]], [0, 1, 0], GLASS)          // crown cap
  }
}
