import type { MeshBuilder } from '../../../buildings.ts'
import { block, hex, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { archOn, extrude, fitted, palette, pts, rectOn, slabOn } from '../palaces/common.ts'

/** the design footprint: OSM way 56186898's box turned to its walls (local −z faces bearing 50.5, the Boulevard Morland) */
const HX = 15.8
const HZ = 18.65

/** OSM's outline in this frame (osmium, 2026-10-30) */
const OUTER = pts([15.7, 15.8, 10.7, 17.4, -15.8, 18.6, -15.5, -18.65, 8.6, -18.65, 8.3, 2.4, 15.8, 0.6])

/**
 * Le Pavillon de l'Arsenal (Louis-Clémentin Bruyerre, 1878–79), built on the Boulevard Morland by a timber merchant who
 * painted and collected, for his pictures, and now the city's own architecture centre. Brick and stone on an iron frame,
 * small enough to be missed and unlike its neighbours:
 *
 * - from the BOULEVARD MORLAND (local −z): the five-bay front, a stone ground storey of round arches, then red brick with
 *   stone bands, tall windows with iron lintels, a small pediment and an attic with the name over the door;
 * - on top the long glazed lantern over the central hall, the iron and glass roof of the exhibition space;
 * - its brick flanks, plain, running back from the street.
 *
 * Plan from OSM's way 56186898, which gives 3 levels and no height: 15 m to the cornice is from memory, as are the
 * five bays and the brick. Mapillary returned only the embankment wall from the Boulevard (2026-10-30), so the dressing of
 * the front has no photograph behind it.
 */
export function pavillonArsenal(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const p = palette('#d9cdb0', '#4d5459')
  const brick = hex('#a65f49')
  const E = 15
  const bp = { ...p, stone: brick }
  extrude(out, [OUTER], bp, { eaves: E, bay: 3.6, win: 1.5, rise: 1.5, inset: 1.2, dormers: false,
    storeys: [{ y: 0, h: 3, sill: 1 }, { y: 5.8, h: 2.8, sill: 0.8 }, { y: 10.2, h: 2.6, sill: 0.8 }] })
  // ---- the front, a stone-dressed plate on the outline's −z edge
  const f = -19
  const a = -15.5
  const b = 8.6
  block(out, a, b, f, f + 2, 0, E + 1.6, brick)
  // the stone ground storey: arches
  block(out, a - 0.1, b + 0.1, f - 0.12, f + 1.4, 0, 5.4, p.stone)
  for (let y = 0.7; y < 5; y += 0.65) rectOn(out, '-z', f - 0.12, a, b, y - 0.04, y + 0.04, p.deep, 0.03)
  const n = 5
  const bay = (b - a) / n
  for (let i = 0; i < n; i++) {
    const t = a + (i + 0.5) * bay
    archOn(out, '-z', f - 0.12, t, 0.5, i === 2 ? 3.6 : 3, 4.3, i === 2 ? p.dark : p.glass, 0.06)
    // the first floor: a tall window between stone bands, the iron lintel over it
    rectOn(out, '-z', f, t - 1.45, t + 1.45, 6.4, 10, p.stone, 0.05)
    rectOn(out, '-z', f, t - 1.2, t + 1.2, 6.6, 9.8, p.glass, 0.09)
    rectOn(out, '-z', f, t - 1.5, t + 1.5, 9.8, 10.2, shade(p.dark, 2), 0.1)
    rectOn(out, '-z', f, t - 1.1, t + 1.1, 11.2, 13.4, p.stone, 0.05)
    rectOn(out, '-z', f, t - 0.85, t + 0.85, 11.4, 13.2, p.glass, 0.09)
    // the iron mullions
    rectOn(out, '-z', f, t - 0.04, t + 0.04, 6.6, 9.8, p.dark, 0.11)
  }
  for (let i = 0; i <= n; i++) {
    const t = a + i * bay
    slabOn(out, '-z', f, t - 0.35, t + 0.35, 5.4, E - 0.5, 0.1, p.stone)
  }
  slabOn(out, '-z', f - 0.12, a - 0.15, b + 0.15, 5.3, 5.8, 0.2, p.trim)
  slabOn(out, '-z', f, a - 0.1, b + 0.1, 10.5, 10.75, 0.12, p.trim)
  slabOn(out, '-z', f, a - 0.45, b + 0.45, E - 0.5, E + 0.1, 0.5, p.trim)
  block(out, a, b, f, f + 1.3, E + 0.1, E + 1.6, p.stone)                 // the attic
  rectOn(out, '-z', f, -9.5, 2.6, E + 0.45, E + 1.25, shade(p.stone, 0.72), 0.04)     // the name
  block(out, a - 0.2, b + 0.2, f - 0.2, f + 1.5, E + 1.6, E + 1.9, p.trim)

  // ---- the iron and glass lantern over the hall
  const iron = hex('#3d4347')
  const glass: [number, number, number] = [0.46, 0.56, 0.6]
  const x0 = -12
  const x1 = 5
  const z0 = -12
  const z1 = 15
  const y0 = E + 1.2
  const y1 = y0 + 4
  block(out, x0, x1, z0, z1, E + 0.6, y0, iron)
  const ridge = (x0 + x1) / 2
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  out.quad([[x0, y0, z1], [x0, y0, z0], [ridge, y1, z0], [ridge, y1, z1]], [-0.45, 0.9, 0], uv, glass, 0)
  out.quad([[x1, y0, z0], [x1, y0, z1], [ridge, y1, z1], [ridge, y1, z0]], [0.45, 0.9, 0], uv, glass, 0)
  out.quad([[x0, y0, z0], [x1, y0, z0], [ridge, y1, z0], [ridge, y1, z0]], [0, 0.3, -1], uv, glass, 0)
  out.quad([[x1, y0, z1], [x0, y0, z1], [ridge, y1, z1], [ridge, y1, z1]], [0, 0.3, 1], uv, glass, 0)
  for (let z = z0; z <= z1 + 0.01; z += 3) {
    out.quad([[x0, y0 + 0.03, z - 0.06], [x0, y0 + 0.03, z + 0.06], [ridge, y1 + 0.03, z + 0.06], [ridge, y1 + 0.03, z - 0.06]], [-0.45, 0.9, 0], uv, iron, 0)
    out.quad([[x1, y0 + 0.03, z + 0.06], [x1, y0 + 0.03, z - 0.06], [ridge, y1 + 0.03, z - 0.06], [ridge, y1 + 0.03, z + 0.06]], [0.45, 0.9, 0], uv, iron, 0)
  }
  block(out, ridge - 0.08, ridge + 0.08, z0, z1, y1 - 0.02, y1 + 0.14, iron)
}
