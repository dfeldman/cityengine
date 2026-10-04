/**
 * Metal-clad sheds — the Presidio's old army hangars and their reuse (Presidio audit, 2026-10-04). The `presidio`
 * restyle dresses everything as the Main Post's cream barracks under red tile, and these are not that: Mapillary at
 * Crissy Field shows BUILDING 640 (the Military Intelligence Service Historic Learning Center) as a long white
 * corrugated-metal hangar under a low gable with a row of windows, and the Tunnel Tops FIELD STATION as a beige
 * metal-clad gabled shed with one dark glazed band.
 *
 * The ridge runs along the footprint's long axis (local x); the gable ends are the short sides.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'
import { faceBand, towerRing } from '../tower.ts'
import { roof } from '../kit.ts'
import { capPolygon } from '../../buildings.ts'

function shed(out: MeshBuilder, fit: Fit, o: { eaves: number; rise: number; wall: Rgb; roof: Rgb; band: [number, number] }): void {
  const ring = towerRing(fit)
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
  for (const p of ring) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z) }
  const [b0, b1] = o.band
  faceBand(out, ring, 0, b0, { kind: 'blank', wall: o.wall, material: 'metal' })
  faceBand(out, ring, b0, b1, { kind: 'punched', wall: o.wall, glass: [0.2, 0.24, 0.28], pitch: 2.4, floor: b1 - b0, solid: 0.35, material: 'metal' })
  faceBand(out, ring, b1, o.eaves, { kind: 'blank', wall: o.wall, material: 'metal' })
  capPolygon(out, ring, o.eaves, o.roof, 0)
  // the gable: the ridge along x, so the x ends are the upright triangles (in the wall's colour) and the long sides slope
  const along = x1 - x0 >= z1 - z0
  if (along) roof(out, x0, x1, z0, z1, o.eaves, o.rise, 0, (z1 - z0) / 2, o.roof)
  else roof(out, x0, x1, z0, z1, o.eaves, o.rise, (x1 - x0) / 2, 0, o.roof)
}

export function hangar640(out: MeshBuilder, fit: Fit): void {
  shed(out, fit, { eaves: 6.5, rise: 2.6, wall: [0.9, 0.9, 0.88], roof: [0.55, 0.56, 0.57], band: [2.2, 3.6] })
}

export function fieldStation(out: MeshBuilder, fit: Fit): void {
  shed(out, fit, { eaves: 7, rise: 3.4, wall: [0.8, 0.75, 0.62], roof: [0.66, 0.62, 0.52], band: [1.0, 3.4] })
}

/**
 * KONKO CHURCH of San Francisco (1974), 1909 Bush Street, Japantown: "a low-roofed, high-modernist church", an A-frame
 * in blond wood with glass walls at its north and south ends (californiajapantowns.org; city-data). A rule-2
 * restyle had made it a six-storey classical block — OSM's own 20 m. The roof comes down almost to the ground on the
 * long sides; the ends are glass triangles in a wooden frame.
 */
export function konkoChurch(out: MeshBuilder, fit: Fit): void {
  const ring = towerRing(fit)
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
  for (const p of ring) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z) }
  const WOOD: Rgb = [0.62, 0.48, 0.34], ROOF: Rgb = [0.3, 0.29, 0.28], GLASS: Rgb = [0.2, 0.25, 0.3]
  const eaves = 1.6, rise = 9
  faceBand(out, ring, 0, eaves, { kind: 'blank', wall: WOOD, material: 'clapboard' })
  capPolygon(out, ring, eaves, ROOF, 0)
  // the ridge along the long axis (x); the x ends are the glass gables
  roof(out, x0, x1, z0, z1, eaves, rise, 0, (z1 - z0) / 2, ROOF)
  const zm = (z0 + z1) / 2
  for (const [x, s] of [[x0 - 0.05, -1], [x1 + 0.05, 1]] as const) {
    // the frame, then the glass inside it
    out.quad([[x, eaves, z0], [x, eaves, z1], [x, eaves + rise, zm], [x, eaves + rise, zm]].map((p) => p as [number, number, number]),
      [s, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], WOOD, 0)
    const g = 0.9
    out.quad([[x + s * 0.1, eaves, zm - (zm - z0) * g], [x + s * 0.1, eaves, zm + (z1 - zm) * g], [x + s * 0.1, eaves + rise * g, zm], [x + s * 0.1, eaves + rise * g, zm]].map((p) => p as [number, number, number]),
      [s, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], GLASS, 0)
  }
}

export const SHEDS: Record<string, (out: MeshBuilder, fit: Fit) => void> = { hangar640, fieldStation, konkoChurch }
