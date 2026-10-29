import type { MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { prism, shade, type Rgb } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import type { V3 } from './shapes.ts'

const FIXED = 0
const metal = surfaceTag('metal')

/**
 * La Géode (Adrien Fainsilber, 1985) in front of the Cité des Sciences: a 36 m sphere of 6,433 polished stainless-steel
 * triangles, standing in its basin, that mirrors the sky above and the park and water below. OSM way 64040790 (37 m
 * across, 36 m, roof:shape dome). Drawn as latitude bands, each quad split by colour into its two triangles' tones so
 * the facets read, the top half the sky's pale blue-white and the lower half the darker ground it reflects.
 */
export function geode(out: MeshBuilder, fit: Fit): void {
  const R = Math.min(Math.max(Math.min(fit.hx, fit.hz), 15), 19)
  const cy = R + 0.6
  const bands = 18
  const sides = 36
  const sky: Rgb = [0.64, 0.7, 0.76]
  const ground: Rgb = [0.3, 0.33, 0.34]
  for (let b = 0; b < bands; b++) {
    for (let i = 0; i < sides; i++) {
      const at = (u: number, v: number): V3 => {
        const lat = -Math.PI / 2 + (v * Math.PI)
        const lon = u * Math.PI * 2
        return [Math.cos(lat) * Math.sin(lon) * R, cy + Math.sin(lat) * R, Math.cos(lat) * Math.cos(lon) * R]
      }
      const u0 = i / sides
      const u1 = (i + 1) / sides
      const v0 = b / bands
      const v1 = (b + 1) / bands
      const p00 = at(u0, v0)
      const p10 = at(u1, v0)
      const p11 = at(u1, v1)
      const p01 = at(u0, v1)
      // how much of the sky this band sees: the reflection darkens below the equator, brightest just over it
      const t = (v0 + v1) / 2
      const mix = t < 0.5 ? Math.pow(t * 2, 1.6) * 0.55 : 0.6 + (1 - Math.abs(t - 0.62) * 1.4) * 0.4
      const c: Rgb = [ground[0] + (sky[0] - ground[0]) * mix, ground[1] + (sky[1] - ground[1]) * mix, ground[2] + (sky[2] - ground[2]) * mix]
      const n = (p: V3): V3 => [p[0] / R, (p[1] - cy) / R, p[2] / R]
      const m: V3 = n([(p00[0] + p11[0]) / 2, (p00[1] + p11[1]) / 2, (p00[2] + p11[2]) / 2])
      // the two triangles, one a shade off the other: the facets
      out.quad([p00, p10, p11, p11], m, [[0, 0], [1, 0], [1, 1], [1, 1]], c, metal)
      out.quad([p00, p11, p01, p01], m, [[0, 0], [1, 1], [0, 1], [0, 1]], shade(c, (i + b) % 2 ? 0.93 : 1.04), metal)
    }
  }
  // the pedestal it stands on, and the basin's rim round it
  prism(out, 0, 0, 0, 1.2, R * 0.35, 16, [0.5, 0.52, 0.52], FIXED)
}
