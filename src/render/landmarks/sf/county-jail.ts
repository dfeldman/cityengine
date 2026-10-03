/**
 * SAN FRANCISCO COUNTY JAIL #2, 425 7th Street (way/103383866). The owner, 2026-10-02: "shows as bricks, but is really a
 * very unique wavy concrete, glass and steel building". From a Mapillary panorama on 7th Street: the upper storeys a
 * curtain of blue-grey glass whose spandrel bands UNDULATE along the street front — each floor's slab edge a shallow
 * wave — cantilevered over a dark, recessed glazed ground floor; a concrete frame at the ends.
 */
import type { MeshBuilder } from '../../buildings.ts'
import { capPolygon } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { faceBand, insetRing, towerRing } from '../tower.ts'

const GLASS: Rgb = [0.28, 0.34, 0.42]
const SPANDREL: Rgb = [0.48, 0.5, 0.54]
const CONCRETE: Rgb = [0.66, 0.65, 0.62]
const DARK: Rgb = [0.12, 0.13, 0.15]

export function countyJailTwo(out: MeshBuilder, fit: Fit): void {
  const H = Math.max(15, Math.min(fit.height || 19, 25))
  const ring = towerRing(fit)
  // the dark recessed ground floor; above it the curtain — glass in bands between slab-edge spandrels — following the
  // footprint, which OSM already draws as the building's wave
  faceBand(out, insetRing(ring, 2.5), 0, 4.5, { kind: 'curtain', wall: DARK, glass: DARK, pitch: 3, floor: 4.5, material: 'glass' })
  capPolygon(out, insetRing(ring, 2.5), 4.5, CONCRETE, surfaceTag('concrete'))
  faceBand(out, ring, 4.5, H, { kind: 'bands', wall: SPANDREL, glass: GLASS, floor: 3.6, solid: 0.22, material: 'glass' })
  faceBand(out, ring, H, H + 0.8, { kind: 'blank', wall: CONCRETE, material: 'concrete' })
  capPolygon(out, ring, H + 0.8, [0.5, 0.5, 0.5], surfaceTag('concrete'))
}
