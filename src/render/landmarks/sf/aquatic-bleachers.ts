/**
 * The AQUATIC PARK BLEACHERS: the 1930s concrete grandstand stepping down from Beach Street to the cove, between the
 * Maritime Museum's east end and the east speaker tower — the "long-unused giant speaker for events at the
 * bleachers" (owner, 2026-10-17, with a Street View from the foot of them: long level tiers, steel pipe rails down
 * the stairs, the speaker tower at the top). OSM has no outline for them, only a few step lines.
 *
 * Our ground there is a gentle lawn, ~6 m over 65 m, where the real tiers climb in 15 m; so the stand is built as it is
 * — level tiers, a solid concrete mass down to the ground — with as many tiers as our drop allows, and a level
 * terrace behind the top tier running back until it meets the ground. Point model: x east, z north (the bay).
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { box, strut, FIXED, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'

const CONCRETE: Rgb = [0.5, 0.495, 0.48]
const TREAD: Rgb = [0.56, 0.555, 0.54]
const RAIL: Rgb = [0.6, 0.63, 0.66]

export function aquaticBleachers(out: MeshBuilder, fit: Fit): void {
  const g = fit.groundAt ?? (() => 0)
  const HX = 30, ZB = 14, T = 1.05, R = 0.42
  const base = g(0, ZB)
  // as many tiers as reach the ground 20 m behind the foot (at least four)
  const want = g(0, ZB - 20) - base
  const N = Math.max(4, Math.min(15, Math.round(want / R)))
  const top = base + N * R
  const metal = surfaceTag('metal')
  const conc = surfaceTag('concrete')
  for (let i = 0; i < N; i++) {
    const z1 = ZB - i * T, z0 = z1 - T, y = base + (i + 1) * R
    box(out, 0, y / 2 - 0.5, (z0 + z1) / 2, HX, y / 2 + 0.5, T / 2, i % 2 ? CONCRETE : TREAD, conc)
  }
  // the terrace behind the top tier, back to where the lawn meets it
  let zEnd = ZB - N * T
  const zTier = zEnd
  while (zEnd > -fit.hz + 1 && g(0, zEnd) < top - 0.05) zEnd -= 1
  if (zTier - zEnd > 0.5) box(out, 0, top / 2 - 0.5, (zTier + zEnd) / 2, HX, top / 2 + 0.5, (zTier - zEnd) / 2, CONCRETE, conc)
  // a promenade along the foot
  box(out, 0, base / 2, ZB + 2, HX + 2, base / 2 + 0.02, 2, [0.56, 0.555, 0.54], conc)
  // three stairs down the stand, each with pipe rails both sides
  for (const sx of [-HX + 4, 0, HX - 4]) {
    for (let i = 0; i < N; i++) {
      const z1 = ZB - i * T
      for (const half of [0, 0.5]) box(out, sx, base + i * R + (half ? R / 2 : 0) + 0.11, z1 - half * T - T / 4, 0.9, 0.11, T / 4, [0.62, 0.615, 0.6], FIXED)
    }
    for (const side of [-1.05, 1.05]) {
      const a: [number, number, number] = [sx + side, base + 0.95, ZB]
      const b: [number, number, number] = [sx + side, top + 0.95, ZB - N * T]
      strut(out, a, b, 0.05, 0.05, RAIL, metal, false)
      strut(out, [a[0], a[1] - 0.45, a[2]], [b[0], b[1] - 0.45, b[2]], 0.05, 0.05, RAIL, metal, false)
      for (let k = 0; k <= N; k += 3) strut(out, [sx + side, base + k * R, ZB - k * T], [sx + side, base + k * R + 0.95, ZB - k * T], 0.05, 0.05, RAIL, metal, false)
    }
  }
  // the rail along the top of the stand, posts every 2.5 m
  const ry = top
  for (const h of [0.5, 1.0]) strut(out, [-HX, ry + h, zTier], [HX, ry + h, zTier], 0.05, 0.05, RAIL, metal, false)
  for (let x = -HX; x <= HX; x += 2.5) strut(out, [x, ry, zTier], [x, ry + 1.02, zTier], 0.05, 0.05, RAIL, metal, false)
}
