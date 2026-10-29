import type { MeshBuilder } from '../../../buildings.ts'
import { beam, box, hex, shade, type Rgb } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { ccw, jitter, slab, type P2, type V3 } from './shapes.ts'

const FIXED = 0

/**
 * One of the four towers of the Bibliothèque nationale de France – François-Mitterrand (Dominique Perrault, 1996) at the
 * corners of its esplanade: the L of an open book standing on end, 79 m, all glass, and behind the glass the library's
 * wooden shutters, open and shut bay by bay, so each face is a patchwork of pale timber and dark glass; the top floors'
 * glass box clear of them. Fitted to each tower's own OSM outline (Tour des Lettres, des Temps, des Nombres, des Lois).
 */
export function bnfTower(out: MeshBuilder, fit: Fit): void {
  const H = Math.min(Math.max(fit.height || 79, 60), 82)
  // the L, from the fit's own outline; without one, an L on the fit's box
  let ring: P2[]
  if (fit.ring && fit.ring.length >= 3) ring = ccw(fit.ring)
  else {
    const t = Math.min(fit.hx, fit.hz) * 0.6
    ring = ccw([{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz + t }, { x: -fit.hx + t, z: -fit.hz + t },
      { x: -fit.hx + t, z: fit.hz }, { x: -fit.hx, z: fit.hz }])
  }
  const wood = hex('#c8a678')
  const dark: Rgb = [0.24, 0.31, 0.36]
  const frame: Rgb = [0.62, 0.66, 0.68]
  const floor = 3.5
  const pitch = 1.8
  const shutters = H - 7
  slab(out, ring, 0, H, dark, [0.5, 0.53, 0.54])
  let seed = 0
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const b = ring[(i + 1) % ring.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L < 2) continue
    const tx = (b.x - a.x) / L
    const tz = (b.z - a.z) / L
    const nx = tz
    const nz = -tx
    const bays = Math.max(1, Math.round(L / pitch))
    const bw = L / bays
    const n: V3 = [nx, 0, nz]
    for (let j = 0; j < bays; j++) {
      for (let f = 0; f * floor < shutters; f++) {
        seed++
        // a shutter shut (timber) or open (the dark glass): most shut on the lower floors, the stacks
        if (jitter(seed, i) > 0.38 + f * 0.012) continue
        const u0 = j * bw + 0.12
        const u1 = (j + 1) * bw - 0.12
        const y0 = 0.8 + f * floor
        const y1 = Math.min(shutters, y0 + floor - 0.4)
        const o = 0.08
        const p = (u: number, y: number): V3 => [a.x + tx * u + nx * o, y, a.z + tz * u + nz * o]
        out.quad([p(u0, y0), p(u1, y0), p(u1, y1), p(u0, y1)], n, [[0, 0], [1, 0], [1, 1], [0, 1]], shade(wood, 0.9 + jitter(seed, 7) * 0.2), FIXED)
      }
    }
    // the steel glazing frame over the shutters: a mullion every other bay and the floor lines
    for (let j = 0; j <= bays; j += 2) {
      const u = j * bw
      box(out, a.x + tx * u + nx * 0.14, H / 2, a.z + tz * u + nz * 0.14, 0.07, H / 2, 0.07, frame, FIXED)
    }
    for (let y = floor; y < H; y += floor * 2) {
      const m = (u: number): V3 => [a.x + tx * u + nx * 0.15, y, a.z + tz * u + nz * 0.15]
      beam(out, m(0), m(L), 0.06, frame)
    }
  }
  // the top: the cornice line over the clear glass of the last floors
  slab(out, ring, H, H + 0.6, frame, frame, true)
}
