/**
 * Shared bits for the Paris Expo halls (Porte de Versailles, 2026-11-05, claude-sonnet-5-5): a hall is the fitted ring walled to a roof
 * height that may vary (the wavy Pavillon 5), a base of cladding under a glazed band, and a roof surface scanned in strips so a
 * non-convex OSM ring works. Seen from a distance: shape, colour, size. Colours are estimates throughout.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { capPolygon } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { hex, type Rgb } from '../../kit.ts'

export type P = { x: number; z: number }
export type Fn = (x: number, z: number) => number
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
export const GLASS = surfaceTag('glass')
export const METAL = surfaceTag('metal')

export const ringOf = (fit: Fit): P[] =>
  fit.ring?.length ? fit.ring : [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]

export interface WallOpts {
  /** metres of cladding under the glazing */
  base: number
  /** cladding and glass colours; `glassFor` may override the glass per edge (coloured fronts) */
  clad: Rgb
  glass: Rgb
  /** the surface tag for per-edge colours (0 = flat, keeps a saturated colour that the glass shader would mute) */
  glassTag?: number
  glassFor?: (i: number, a: P, b: P, nx: number, nz: number, u: number) => Rgb
  /** longest wall segment, metres (a wavy top needs short ones) */
  step: number
  /** a dark mullion band every `mull` metres of wall (0 = none) */
  mull?: number
  mullColour?: Rgb
}

/** Walls round the ring from the ground to `top(x, z)`. */
export function hallWalls(out: MeshBuilder, ring: P[], top: Fn, o: WallOpts): void {
  const sgn = ring.reduce((t, a, i) => { const b = ring[(i + 1) % ring.length]; return t + a.x * b.z - b.x * a.z }, 0) < 0 ? -1 : 1 // outward whichever way the ring runs
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], l = Math.hypot(b.x - a.x, b.z - a.z)
    if (l < 0.3) continue
    const nx = (sgn * (b.z - a.z)) / l, nz = (-sgn * (b.x - a.x)) / l
    const m = Math.max(1, Math.ceil(l / o.step))
    for (let s = 0; s < m; s++) {
      const t0 = s / m, t1 = (s + 1) / m
      const x0 = a.x + (b.x - a.x) * t0, z0 = a.z + (b.z - a.z) * t0, x1 = a.x + (b.x - a.x) * t1, z1 = a.z + (b.z - a.z) * t1
      const h0 = top(x0, z0), h1 = top(x1, z1), bs = Math.min(o.base, h0, h1)
      out.quad([[x0, 0, z0], [x1, 0, z1], [x1, bs, z1], [x0, bs, z0]], [nx, 0, nz], UV, o.clad, METAL)
      const g = o.glassFor ? o.glassFor(i, a, b, nx, nz, (t0 + t1) / 2 * l) : o.glass
      const off = 0.05
      out.quad([[x0 + nx * off, bs, z0 + nz * off], [x1 + nx * off, bs, z1 + nz * off], [x1 + nx * off, h1, z1 + nz * off], [x0 + nx * off, h0, z0 + nz * off]], [nx, 0, nz], UV, g, o.glassFor ? (o.glassTag ?? GLASS) : GLASS)
    }
    if (o.mull) {
      const n = Math.floor(l / o.mull), ux = (b.x - a.x) / l, uz = (b.z - a.z) / l, w = 0.25
      for (let k = 1; k < n; k++) {
        const s = (k * l) / n, p0 = { x: a.x + ux * (s - w), z: a.z + uz * (s - w) }, p1 = { x: a.x + ux * (s + w), z: a.z + uz * (s + w) }
        out.quad([[p0.x + nx * 0.12, o.base, p0.z + nz * 0.12], [p1.x + nx * 0.12, o.base, p1.z + nz * 0.12], [p1.x + nx * 0.12, top(p1.x, p1.z), p1.z + nz * 0.12], [p0.x + nx * 0.12, top(p0.x, p0.z), p0.z + nz * 0.12]], [nx, 0, nz], UV, o.mullColour ?? o.clad, METAL)
      }
    }
  }
}

/**
 * A roof surface y = f(x, z) over the ring: strips `dz` wide scanned along z, each cut into x intervals by the ring
 * and divided every `dx` metres. Smooth normals from the numerical gradient.
 */
export function scanRoof(out: MeshBuilder, ring: P[], f: Fn, dz: number, dx: number, c: Rgb, tag = 0): void {
  let zMin = Infinity, zMax = -Infinity
  for (const p of ring) { zMin = Math.min(zMin, p.z); zMax = Math.max(zMax, p.z) }
  const n = Math.max(1, Math.ceil((zMax - zMin) / dz)), h = (zMax - zMin) / n
  const nrm = (x: number, z: number): [number, number, number] => {
    const e = 0.5, gx = (f(x + e, z) - f(x - e, z)) / (2 * e), gz = (f(x, z + e) - f(x, z - e)) / (2 * e), l = Math.hypot(gx, 1, gz)
    return [-gx / l, 1 / l, -gz / l]
  }
  for (let k = 0; k < n; k++) {
    const z0 = zMin + k * h, z1 = z0 + h, zc = z0 + h / 2, xs: number[] = []
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i], b = ring[(i + 1) % ring.length]
      if ((a.z <= zc) !== (b.z <= zc)) xs.push(a.x + ((zc - a.z) / (b.z - a.z)) * (b.x - a.x))
    }
    xs.sort((p, q) => p - q)
    for (let j = 0; j + 1 < xs.length; j += 2) {
      const xa = xs[j], xb = xs[j + 1], m = Math.max(1, Math.ceil((xb - xa) / dx))
      for (let s = 0; s < m; s++) {
        const p0 = xa + ((xb - xa) * s) / m, p1 = xa + ((xb - xa) * (s + 1)) / m, q = (p0 + p1) / 2
        out.quad([[p0, f(p0, z0), z0], [p1, f(p1, z0), z0], [p1, f(p1, z1), z1], [p0, f(p0, z1), z1]], nrm(q, zc), UV, c, tag)
      }
    }
  }
}

/** A flat-roofed shed: walls to `h`, a flat cap, optionally a shallow gable along x (`rise` m) in place of the cap. */
export function shed(out: MeshBuilder, fit: Fit, o: { h: number; rise: number; wall: WallOpts; roof: Rgb; ridge?: Rgb }): void {
  const ring = ringOf(fit)
  hallWalls(out, ring, () => o.h, o.wall)
  if (o.rise > 0) {
    const zc = 0, hz = Math.max(...ring.map((p) => Math.abs(p.z - zc))) || 1
    scanRoof(out, ring, (_x, z) => o.h + o.rise * (1 - Math.min(1, Math.abs(z - zc) / hz)), 4, 1e6, o.roof)
  } else capPolygon(out, ring, o.h, o.roof, 0)
}

export { hex }
