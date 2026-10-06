/**
 * ALCATRAZ, as it is seen from the waterfront (appearance audit, 2026-10-02): from Aquatic Park, Fisherman's Wharf
 * and every pier, the island is the view — and it was a clump of trees round a handful of Victorian houses and
 * apartment blocks, which is what the city's generic styles make of its footprints.
 *
 * The two things that make the silhouette: the MAIN PRISON (the cellhouse, way/128245373) — a long, pale,
 * weathered-concrete block crowning the island, its walls a rank of tall barred windows — and the LIGHTHOUSE
 * (way/99202294, 1909) — a white octagonal tower tapering to a black lantern beside it. The rest of the island
 * (Building 64, the New Industries building, the dining hall, the quartermaster's) is restyled pale in
 * public/landmarks/san-francisco/alcatraz.json.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'
import { box, prism } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { tower } from '../tower.ts'

// (pale pinkish cream, weathered: the owner's photographs of the cell blocks, 2026-10-06; was a darker grey-beige)
const CONCRETE: Rgb = [0.85, 0.8, 0.74]
const WINDOWS: Rgb = [0.18, 0.19, 0.20]
const WHITE: Rgb = [0.90, 0.89, 0.85]
const BLACK: Rgb = [0.12, 0.12, 0.13]
const LANTERN: Rgb = [0.55, 0.62, 0.60]

export function alcatrazCellhouse(out: MeshBuilder, fit: Fit): void {
  const H = 14
  tower(out, { ...fit, height: H }, {
    height: H,
    base: { height: 3.5, face: { kind: 'punched', wall: CONCRETE, glass: WINDOWS, pitch: 4.2, floor: 3.5, solid: 0.7, material: 'concrete' } },
    // the cellhouse's own windows: one tall barred opening per bay, the full height of the cell blocks inside
    tiers: [{ to: 1, face: { kind: 'punched', wall: CONCRETE, glass: WINDOWS, pitch: 3.4, floor: 9.5, solid: 0.5, material: 'concrete' } }],
    roof: [0.46, 0.45, 0.42],
    crown: { kind: 'parapet', height: 0.9, colour: CONCRETE, material: 'concrete' },
  })
  // the skylight monitor along the roof
  box(out, 0, H + 1.2, 0, Math.max(4, fit.hx * 0.7), 1.2, Math.max(1.5, Math.min(fit.hz * 0.18, 4)), CONCRETE, surfaceTag('concrete'))
}

export function alcatrazLighthouse(out: MeshBuilder, _fit: Fit): void {
  const stone = surfaceTag('concrete')
  // the keeper's base, then the octagonal shaft tapering to the gallery
  box(out, 0, 1.6, 0, 3.4, 1.6, 3.4, WHITE, stone)
  prism(out, 0, 0, 3.2, 20.2, 2.4, 8, WHITE, stone, 1.7)
  // the gallery, the lantern and its cap
  prism(out, 0, 0, 20.2, 20.6, 2.5, 8, BLACK, surfaceTag('metal'))
  prism(out, 0, 0, 20.6, 23.2, 1.5, 8, LANTERN, surfaceTag('glass'))
  prism(out, 0, 0, 23.2, 24.4, 1.7, 8, BLACK, surfaceTag('metal'))
  prism(out, 0, 0, 24.4, 25.6, 0.5, 8, BLACK, surfaceTag('metal'))
}

/**
 * THE WATER TOWER (1940; way/660870452), on the island's north end: a riveted steel tank on eight tall braced legs,
 * the tallest thing on Alcatraz after the lighthouse, and from the ferries its most legible mark — the 1969–71
 * occupation's lettering in red down the tank ("Peace and Freedom. Welcome. Home of the Free Indian Land"),
 * restored in 2012. Drawn as the tank, its conical roof, the legs and their bracing, and the red lettering as bands.
 */
export function alcatrazWaterTower(out: MeshBuilder, _fit: Fit): void {
  const metal = surfaceTag('metal')
  const RUSTY: Rgb = [0.72, 0.7, 0.64]
  const RED: Rgb = [0.66, 0.14, 0.12]
  const LEG = 14
  const R = 4.2
  // the eight legs and two rings of bracing
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2
    const x = Math.cos(a) * R * 0.95, z = Math.sin(a) * R * 0.95
    prism(out, x, z, 0, LEG, 0.2, 6, RUSTY, metal, 0.17)
  }
  for (const y of [LEG * 0.35, LEG * 0.7]) prism(out, 0, 0, y - 0.1, y + 0.1, R * 0.97, 8, RUSTY, metal, R * 0.97, false)
  // the tank, its roof, and the walkway round its foot
  prism(out, 0, 0, LEG - 0.3, LEG, R + 0.6, 16, BLACK, metal)
  prism(out, 0, 0, LEG, LEG + 8, R, 20, RUSTY, metal)
  prism(out, 0, 0, LEG + 8, LEG + 10.2, R + 0.15, 20, RUSTY, metal, 0.3)
  // the red lettering, read as lines of type across the side that faces the city (−z)
  for (let line = 0; line < 4; line++) {
    const y = LEG + 6.6 - line * 1.6
    const w = [3.0, 3.6, 3.2, 3.8][line]
    for (let j = 0; j < 7; j++) {
      const u = -w + (j + 0.5) * (2 * w / 7)
      if ((line * 7 + j) % 5 === 3) continue        // the gaps between the words
      const a = Math.asin(Math.max(-0.95, Math.min(0.95, u / R)))
      box(out, Math.sin(a) * (R + 0.04), y, -Math.cos(a) * (R + 0.04), 0.32, 0.5, 0.04, RED, 0)
    }
  }
}
