/**
 * THE SHELL BUILDING, 100 Bush Street at Battery (George W. Kelham, 1929; Wikipedia, Commons "Shell Building corner
 * 2021.jpg"). Was the bake's `chicago` box — a 115 m Art Deco landmark of the skyline missed by every census because
 * OSM maps it only as two unnamed building:parts (way/1258748458, the 28-storey tower; way/1258748457, its 10-storey
 * wing along Battery — the "granite pier and brass doorway" of #313's reference request).
 *
 * Pale buff terracotta all over; unbroken vertical piers from the base to the top with the windows and spandrels
 * recessed between them; a two-storey stone base with dark shopfronts and the arched entrance; near the top the
 * tower steps in, stage by stage, each corner rising as a finned pier above the stage behind it, to a crown of fins
 * (Kelham's "shell" motif in the terracotta, read at riding distance as a fluted top).
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'
import { box } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { tower, towerRing, insetRing } from '../tower.ts'

const BUFF: Rgb = [0.86, 0.8, 0.68]
const SHADE: Rgb = [0.76, 0.7, 0.58]
const GLASS: Rgb = [0.2, 0.22, 0.24]

const piers = { kind: 'fins' as const, wall: BUFF, glass: GLASS, pitch: 1.7, solid: 0.42, depth: 0.45, floor: 3.9, material: 'terracotta' as const }

export function shellBuildingTower(out: MeshBuilder, fit: Fit): void {
  const H = fit.height > 80 && fit.height < 140 ? fit.height : 115
  tower(out, fit, {
    height: H,
    base: { height: 8, face: { kind: 'punched', wall: SHADE, glass: GLASS, pitch: 3.4, solid: 0.35, floor: 8, material: 'ashlar' } },
    tiers: [
      { to: H - 22, face: piers },
      { to: H - 15, face: piers, inset: 1.6 },
      { to: H - 9, face: piers, inset: 1.8 },
      { to: H - 4, face: piers, inset: 2 },
    ],
    roof: [0.6, 0.57, 0.5],
    crown: { kind: 'parapet', height: 1.2, colour: BUFF, material: 'terracotta' },
  })
  // the corner piers rising past each setback as fins, and the fluted crown over the last stage
  const tc = surfaceTag('terracotta')
  const ring = towerRing(fit)
  const stages: [number, number][] = [[0, H - 22], [1.6, H - 15], [3.4, H - 9], [5.4, H - 4]]
  for (const [inset, top] of stages) {
    const r = inset > 0 ? insetRing(ring, inset) : ring
    for (const p of r) box(out, p.x, top + 1.6, p.z, 0.55, 1.6, 0.55, BUFF, tc)
  }
  const top = insetRing(ring, 5.4)
  let cx = 0, cz = 0
  for (const p of top) { cx += p.x; cz += p.z }
  cx /= top.length; cz /= top.length
  for (let i = 0; i < top.length; i++) {
    const a = top[i], b = top[(i + 1) % top.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z), n = Math.max(2, Math.round(L / 1.7))
    for (let k = 1; k < n; k++) {
      const t = k / n, x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t
      const h = 2.2 + 1.6 * Math.sin(Math.PI * t)
      box(out, x, H + h / 2, z, 0.2, h / 2, 0.2, BUFF, tc)
    }
  }
  box(out, cx, H + 2.4, cz, 1.2, 2.4, 1.2, SHADE, tc)
}

export function shellBuildingWing(out: MeshBuilder, fit: Fit): void {
  const H = fit.height > 25 && fit.height < 60 ? fit.height : 40
  tower(out, fit, {
    height: H,
    base: { height: 8, face: { kind: 'punched', wall: SHADE, glass: GLASS, pitch: 3.4, solid: 0.35, floor: 8, material: 'ashlar' } },
    tiers: [{ to: H, face: piers, cornice: { depth: 0.5, height: 1, colour: BUFF } }],
    roof: [0.6, 0.57, 0.5],
    crown: { kind: 'parapet', height: 1, colour: BUFF, material: 'terracotta' },
  })
}

export const SHELL_BUILDING: Record<string, (out: MeshBuilder, fit: Fit) => void> = { shellBuildingTower, shellBuildingWing }
