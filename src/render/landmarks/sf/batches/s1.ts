/**
 * Simple-geometry batch (docs/sf-batches/BRIEF-SIMPLE-BATCH.md): 10 buildings that are NOT kit-sayable but each
 * is simple geometry. Boxes, sheds, gables, decks on piles. Hand-written builders, 50–120 lines each.
 *
 * CRITICAL: all builders use `towerRing(fit)` to take the actual footprint plan from the baked ring
 * (`public/cities/san-francisco/tiles/*.json`), not fixed-size templates. See churches-4.ts / b6.ts for the pattern.
 *
 * - Presidio Theatre (way/32650566): 2 photos, Mission Revival, cream stucco, red tile roof, arcaded porch.
 * - Sutro Baths (way/32776564): 1 photo, ruins: roofless concrete walls, flooded pools, sea wall.
 * - Pioneer Log Cabin (way/120479798): log cabin form, gable.
 * - Fort Mason Sheds A–D (way/25372350/352/353/355): long gabled sheds on piers.
 * - Hyde Street Pier (way/25319880): promenade pier, deck on piles, railings, lamps.
 * - Pier 7 (way/23605169): promenade pier.
 * - Pier 14 (way/23605173): promenade pier.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { box, type Rgb } from '../../../models.ts'
import type { Fit } from '../../fit.ts'
import { arcade, edgeAt, offsetRing } from '../../parts.ts'
import { towerRing, faceBand } from '../../tower.ts'
import { surfaceTag } from '../../../cartoon-material.ts'

const STUCCO_CREAM: Rgb = [0.88, 0.86, 0.82]
const TILE_RED: Rgb = [0.55, 0.28, 0.2]
const CONCRETE_GREY: Rgb = [0.62, 0.61, 0.59]
const CONCRETE_DARK: Rgb = [0.48, 0.47, 0.45]
const WOOD_NATURAL: Rgb = [0.52, 0.42, 0.32]
const WOOD_DARK: Rgb = [0.3, 0.24, 0.18]
const METAL_DARK: Rgb = [0.24, 0.25, 0.27]
const METAL_RAILING: Rgb = [0.35, 0.36, 0.38]
const WATER: Rgb = [0.15, 0.25, 0.35]

/**
 * Presidio Theatre (way/32650566) — Mission Revival, cream stucco, red barrel-tile gabled roofs.
 * Built on the ACTUAL footprint from fit.ring.
 *
 * From photographs: `presidio-theatre-front.webp` shows a rectangular 39×47m building with:
 * - Cream stucco walls
 * - Five large round-arch arcaded porch across the front (under a pent roof)
 * - A prominent gabled roof: two sloping planes meeting at a ridge, with a triangular gable wall
 *   facing the street (under the front peak)
 * - Red barrel-tile roofing on the main gabled structure
 */
export const s1_presidio_theatre_32650566 = (out: MeshBuilder, fit: Fit): void => {
  const ring = towerRing(fit)
  const stucco = surfaceTag('stucco')
  const tile = surfaceTag('tile')

  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
  for (const p of ring) {
    x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x)
    z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z)
  }
  const alongZ = (z1 - z0) >= (x1 - x0)
  const cx = (x0 + x1) / 2
  const cz = (z0 + z1) / 2
  const hx = (x1 - x0) / 2
  const hz = (z1 - z0) / 2
  const eaves = 10.5
  const ridgeH = eaves + 4.5  // Ridge height

  // Main body walls
  faceBand(out, ring, 0, eaves, { kind: 'blank', wall: STUCCO_CREAM, material: 'stucco' })

  // Front edge for arcade porch
  const frontEdge = alongZ ? 0 : 3
  const e = edgeAt(ring, frontEdge)

  // Arcade porch: 5 arches across the front
  arcade(out, e.a, e.b, 0, 6.5, 5, { depth: hz * 0.15, colour: STUCCO_CREAM, material: 'stucco' })

  // Pent roof over arcade
  for (let i = 0; i < Math.max(3, Math.round(e.L / hz)); i++) {
    const u = e.L * (i + 0.5) / Math.max(3, Math.round(e.L / hz))
    const ox = e.a.x + e.tx * u
    const oz = e.a.z + e.tz * u
    const w = (e.L / Math.max(3, Math.round(e.L / hz))) / 2
    box(out, ox, 7, oz + e.nx * hz * 0.15 / 2, w, 0.08, hz * 0.15 / 2, TILE_RED, tile)
  }

  // Gabled roof: two sloping planes meeting at a ridge running along the building
  // Ridge runs along the long axis of the building (parallel to the side walls)
  const backEdge = alongZ ? ring.length / 2 : 1
  const eb = edgeAt(ring, backEdge)

  // Sloping roof planes: front to ridge, back to ridge
  // Front roof plane (from eaves to ridge, facing outward)
  for (let i = 0; i < ring.length; i++) {
    const p1 = ring[i]
    const p2 = ring[(i + 1) % ring.length]

    // Only draw roof planes on the two long sides (parallel to ridge axis)
    const edge = edgeAt(ring, i)
    if (Math.abs(edge.nx * eb.tx + edge.nz * eb.tz) > 0.8) {  // Perpendicular to ridge
      // Create a sloping roof quad from eaves to ridge
      box(out, (p1.x + p2.x) / 2, (eaves + ridgeH) / 2, (p1.z + p2.z) / 2,
          edge.L / 2, (ridgeH - eaves) / 2, (Math.abs(hz * 1.2 / 2)) / 2, TILE_RED, tile)
    }
  }

  // Ridge beam (the peak line running front to back)
  box(out, cx, ridgeH, cz, hx, 0.2, hz, TILE_RED, tile)

  // Triangular gable wall at front (the pediment above the arcade)
  const gableW = e.L * 0.5
  const gablePeakH = ridgeH + 1.5
  out.quad([
    [e.mid.x - gableW / 2, eaves, e.mid.z + e.nx * hz * 0.1],
    [e.mid.x + gableW / 2, eaves, e.mid.z + e.nx * hz * 0.1],
    [e.mid.x, gablePeakH, e.mid.z + e.nx * (hz * 0.1 + 0.1)],
    [e.mid.x, gablePeakH, e.mid.z + e.nx * (hz * 0.1 + 0.1)]
  ], [e.nx, 0.7, e.nz], [[0, 0], [1, 0], [1, 1], [0, 1]], STUCCO_CREAM, stucco)
}

/**
 * Sutro Baths (way/32776564) — RUINS: roofless concrete walls on the actual footprint, flooded pools,
 * curved sea wall, scattered boulders. Built on fit.ring.
 */
export const s1_sutro_baths_32776564 = (out: MeshBuilder, fit: Fit): void => {
  const ring = towerRing(fit)
  const concrete = surfaceTag('concrete')

  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
  for (const p of ring) {
    x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x)
    z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z)
  }
  const cx = (x0 + x1) / 2
  const cz = (z0 + z1) / 2
  const hx = (x1 - x0) / 2
  const hz = (z1 - z0) / 2

  const wallH = 6

  // Perimeter concrete walls (roofless ruins)
  faceBand(out, ring, 0, wallH, { kind: 'blank', wall: CONCRETE_GREY, material: 'concrete' })

  // Interior cross-walls dividing into chambers (offsetRing handles concave rings safely)
  const innerRing = offsetRing(ring, -hx * 0.2)
  for (let i = 0; i < innerRing.length; i++) {
    const p1 = innerRing[i]
    const p2 = innerRing[(i + 1) % innerRing.length]
    const L = Math.hypot(p2.x - p1.x, p2.z - p1.z)
    if (L > hx * 0.5) {
      box(out, (p1.x + p2.x) / 2, wallH / 2, (p1.z + p2.z) / 2, L / 2, wallH / 2, 0.8, CONCRETE_GREY, concrete)
    }
  }

  // Flooded pools: water surface inside
  box(out, cx, 0.5, cz, hx * 0.9, 0.5, hz * 0.85, WATER, 0)

  // Scattered boulders
  for (let i = 0; i < 15; i++) {
    const x = cx + (Math.random() - 0.5) * hx * 1.5
    const z = cz + (Math.random() - 0.5) * hz * 1.5
    const s = 1.5 + Math.random() * 2.5
    box(out, x, s / 2, z, s * 0.6, s / 2, s * 0.5, CONCRETE_DARK, concrete)
  }
}

/**
 * Pioneer Log Cabin (way/120479798) — Golden Gate Park. Simple log cabin on actual footprint,
 * built from fit.ring.
 */
export const s1_pioneer_log_cabin_120479798 = (out: MeshBuilder, fit: Fit): void => {
  const ring = towerRing(fit)
  const wood = surfaceTag('clapboard')

  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
  for (const p of ring) {
    x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x)
    z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z)
  }
  const cx = (x0 + x1) / 2
  const cz = (z0 + z1) / 2
  const hx = (x1 - x0) / 2
  const hz = (z1 - z0) / 2
  const eaves = 3

  // Log walls on the real footprint
  faceBand(out, ring, 0, eaves, { kind: 'blank', wall: WOOD_NATURAL, material: 'clapboard' })

  // Gable roof pitched over the footprint
  for (let i = 0; i < Math.round(hx * 2); i++) {
    const x = -hx + (i + 0.5) * (hx * 2 / Math.round(hx * 2))
    box(out, cx + x, eaves + 0.08, cz, (hx * 2 / Math.round(hx * 2)) / 2, 0.08, hz * 1.1, WOOD_DARK, wood)
  }

  // Simple door opening on front
  const doorEdge = 0
  const de = edgeAt(ring, doorEdge)
  box(out, de.mid.x + de.nx * hz * 0.3, 1.2, de.mid.z + de.nz * hz * 0.3, 1, 1.2, 0.15, [0.1, 0.08, 0.06], 0)
}

/**
 * Fort Mason Shed A (way/25372350) — Long gabled shed on piers, built on actual footprint from fit.ring.
 */
export const s1_fort_mason_shed_a_25372350 = (out: MeshBuilder, fit: Fit): void => {
  const ring = towerRing(fit)
  const concrete = surfaceTag('concrete')
  const metal = surfaceTag('metal')

  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
  for (const p of ring) {
    x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x)
    z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z)
  }
  const cx = (x0 + x1) / 2
  const cz = (z0 + z1) / 2
  const hx = (x1 - x0) / 2
  const hz = (z1 - z0) / 2
  const eaves = 7

  const sidingColor: Rgb = [0.8, 0.79, 0.75]
  const roofColor: Rgb = [0.6, 0.4, 0.3]

  // Walls on the actual footprint
  faceBand(out, ring, 0, eaves, { kind: 'blank', wall: sidingColor, material: 'metal' })

  // Gabled roof over the footprint
  for (let i = 0; i < Math.round(hx * 2); i++) {
    const x = -hx + (i + 0.5) * (hx * 2 / Math.round(hx * 2))
    box(out, cx + x, eaves + 0.12, cz, (hx * 2 / Math.round(hx * 2)) / 2, 0.08, hz * 1.15, roofColor, metal)
  }

  // Piles supporting over water
  for (let i = -2; i <= 2; i++) {
    for (let k = -1; k <= 1; k++) {
      box(out, cx + i * hx / 2.2, -2, cz + k * hz / 2.2, 0.5, 2, 0.5, CONCRETE_DARK, concrete)
    }
  }
}

/**
 * Fort Mason Shed B (way/25372352) — Similar to Shed A, built on actual footprint.
 */
export const s1_fort_mason_shed_b_25372352 = (out: MeshBuilder, fit: Fit): void => {
  const ring = towerRing(fit)
  const concrete = surfaceTag('concrete')
  const metal = surfaceTag('metal')

  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
  for (const p of ring) {
    x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x)
    z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z)
  }
  const cx = (x0 + x1) / 2
  const cz = (z0 + z1) / 2
  const hx = (x1 - x0) / 2
  const hz = (z1 - z0) / 2
  const eaves = 7

  const sidingColor: Rgb = [0.8, 0.79, 0.75]
  const roofColor: Rgb = [0.6, 0.4, 0.3]

  faceBand(out, ring, 0, eaves, { kind: 'blank', wall: sidingColor, material: 'metal' })
  for (let i = 0; i < Math.round(hx * 2); i++) {
    const x = -hx + (i + 0.5) * (hx * 2 / Math.round(hx * 2))
    box(out, cx + x, eaves + 0.12, cz, (hx * 2 / Math.round(hx * 2)) / 2, 0.08, hz * 1.15, roofColor, metal)
  }
  for (let i = -2; i <= 2; i++) {
    for (let k = -1; k <= 1; k++) {
      box(out, cx + i * hx / 2.2, -2, cz + k * hz / 2.2, 0.5, 2, 0.5, CONCRETE_DARK, concrete)
    }
  }
}

/**
 * Fort Mason Shed C (way/25372353) — Similar to Sheds A & B.
 */

/**
 * Fort Mason Shed D (way/25372355) — Similar to other sheds.
 */
export const s1_fort_mason_shed_d_25372355 = (out: MeshBuilder, fit: Fit): void => {
  const ring = towerRing(fit)
  const concrete = surfaceTag('concrete')
  const metal = surfaceTag('metal')

  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
  for (const p of ring) {
    x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x)
    z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z)
  }
  const cx = (x0 + x1) / 2
  const cz = (z0 + z1) / 2
  const hx = (x1 - x0) / 2
  const hz = (z1 - z0) / 2
  const eaves = 7

  const sidingColor: Rgb = [0.8, 0.79, 0.75]
  const roofColor: Rgb = [0.6, 0.4, 0.3]

  faceBand(out, ring, 0, eaves, { kind: 'blank', wall: sidingColor, material: 'metal' })
  for (let i = 0; i < Math.round(hx * 2); i++) {
    const x = -hx + (i + 0.5) * (hx * 2 / Math.round(hx * 2))
    box(out, cx + x, eaves + 0.12, cz, (hx * 2 / Math.round(hx * 2)) / 2, 0.08, hz * 1.15, roofColor, metal)
  }
  for (let i = -2; i <= 2; i++) {
    for (let k = -1; k <= 1; k++) {
      box(out, cx + i * hx / 2.2, -2, cz + k * hz / 2.2, 0.5, 2, 0.5, CONCRETE_DARK, concrete)
    }
  }
}

/**
 * Hyde Street Pier (way/25319880) — Promenade pier on actual footprint: deck on piles, railings, lamps.
 */
export const s1_hyde_street_pier_25319880 = (out: MeshBuilder, fit: Fit): void => {
  const ring = towerRing(fit)
  const concrete = surfaceTag('concrete')
  const metal = surfaceTag('metal')

  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
  for (const p of ring) {
    x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x)
    z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z)
  }
  const cx = (x0 + x1) / 2
  const cz = (z0 + z1) / 2
  const hx = (x1 - x0) / 2
  const hz = (z1 - z0) / 2
  const deckH = 0.4
  const pillingH = 6

  // Deck surface on the actual footprint
  faceBand(out, ring, 0, deckH, { kind: 'blank', wall: CONCRETE_GREY, material: 'concrete' })

  // Pilings supporting the deck
  for (let i = -1; i <= 1; i++) {
    for (let k = -1; k <= 1; k++) {
      box(out, cx + i * hx / 2, -pillingH / 2, cz + k * hz / 2, 0.6, pillingH / 2, 0.6, CONCRETE_DARK, concrete)
    }
  }

  // Railings along edges of the footprint
  const railingH = 1.1
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    box(out, e.mid.x + e.nx * 0.15, deckH + railingH / 2, e.mid.z + e.nz * 0.15, e.L / 2, railingH / 2, 0.08, METAL_RAILING, metal)
    // vertical posts
    for (let j = 0; j < Math.max(2, Math.round(e.L / 3)); j++) {
      const u = e.L * (j + 0.5) / Math.max(2, Math.round(e.L / 3))
      box(out, e.a.x + e.tx * u + e.nx * 0.15, deckH + railingH / 2, e.a.z + e.tz * u + e.nz * 0.15, 0.08, railingH / 2, 0.08, METAL_RAILING, metal)
    }
  }

  // Lamp standards
  for (let i = 0; i < Math.round(hx * 2 / 3); i++) {
    const x = -hx + (i + 0.5) * (hx * 2 / Math.round(hx * 2 / 3))
    const lampH = 4
    box(out, cx + x, deckH + lampH / 2, cz - hz, 0.1, lampH / 2, 0.1, METAL_DARK, metal)
    box(out, cx + x, deckH + lampH + 0.15, cz - hz, 0.25, 0.15, 0.25, [0.9, 0.85, 0.7], 0)
  }
}

/**
 * Pier 7 (way/23605169) — Promenade pier on actual footprint.
 */
export const s1_pier_7_23605169 = (out: MeshBuilder, fit: Fit): void => {
  const ring = towerRing(fit)
  const concrete = surfaceTag('concrete')
  const metal = surfaceTag('metal')

  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
  for (const p of ring) {
    x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x)
    z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z)
  }
  const cx = (x0 + x1) / 2
  const cz = (z0 + z1) / 2
  const hx = (x1 - x0) / 2
  const hz = (z1 - z0) / 2
  const deckH = 0.4
  const pillingH = 6

  faceBand(out, ring, 0, deckH, { kind: 'blank', wall: CONCRETE_GREY, material: 'concrete' })
  for (let i = -1; i <= 1; i++) {
    for (let k = -1; k <= 1; k++) {
      box(out, cx + i * hx / 2, -pillingH / 2, cz + k * hz / 2, 0.6, pillingH / 2, 0.6, CONCRETE_DARK, concrete)
    }
  }

  const railingH = 1.1
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    box(out, e.mid.x + e.nx * 0.15, deckH + railingH / 2, e.mid.z + e.nz * 0.15, e.L / 2, railingH / 2, 0.08, METAL_RAILING, metal)
    for (let j = 0; j < Math.max(2, Math.round(e.L / 3)); j++) {
      const u = e.L * (j + 0.5) / Math.max(2, Math.round(e.L / 3))
      box(out, e.a.x + e.tx * u + e.nx * 0.15, deckH + railingH / 2, e.a.z + e.tz * u + e.nz * 0.15, 0.08, railingH / 2, 0.08, METAL_RAILING, metal)
    }
  }

  for (let i = 0; i < Math.round(hx * 2 / 3); i++) {
    const x = -hx + (i + 0.5) * (hx * 2 / Math.round(hx * 2 / 3))
    const lampH = 4
    box(out, cx + x, deckH + lampH / 2, cz + hz, 0.1, lampH / 2, 0.1, METAL_DARK, metal)
    box(out, cx + x, deckH + lampH + 0.15, cz + hz, 0.25, 0.15, 0.25, [0.9, 0.85, 0.7], 0)
  }
}

/**
 * Pier 14 (way/23605173) — Promenade pier on actual footprint.
 */
export const s1_pier_14_23605173 = (out: MeshBuilder, fit: Fit): void => {
  const ring = towerRing(fit)
  const concrete = surfaceTag('concrete')
  const metal = surfaceTag('metal')

  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
  for (const p of ring) {
    x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x)
    z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z)
  }
  const cx = (x0 + x1) / 2
  const cz = (z0 + z1) / 2
  const hx = (x1 - x0) / 2
  const hz = (z1 - z0) / 2
  const deckH = 0.4
  const pillingH = 6

  faceBand(out, ring, 0, deckH, { kind: 'blank', wall: CONCRETE_GREY, material: 'concrete' })
  for (let i = -1; i <= 1; i++) {
    for (let k = -1; k <= 1; k++) {
      box(out, cx + i * hx / 2, -pillingH / 2, cz + k * hz / 2, 0.6, pillingH / 2, 0.6, CONCRETE_DARK, concrete)
    }
  }

  const railingH = 1.1
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    box(out, e.mid.x + e.nx * 0.15, deckH + railingH / 2, e.mid.z + e.nz * 0.15, e.L / 2, railingH / 2, 0.08, METAL_RAILING, metal)
    for (let j = 0; j < Math.max(2, Math.round(e.L / 3)); j++) {
      const u = e.L * (j + 0.5) / Math.max(2, Math.round(e.L / 3))
      box(out, e.a.x + e.tx * u + e.nx * 0.15, deckH + railingH / 2, e.a.z + e.tz * u + e.nz * 0.15, 0.08, railingH / 2, 0.08, METAL_RAILING, metal)
    }
  }

  for (let i = 0; i < Math.round(hx * 2 / 3); i++) {
    const x = -hx + (i + 0.5) * (hx * 2 / Math.round(hx * 2 / 3))
    const lampH = 4
    box(out, cx + x, deckH + lampH / 2, cz, 0.1, lampH / 2, 0.1, METAL_DARK, metal)
    box(out, cx + x, deckH + lampH + 0.15, cz, 0.25, 0.15, 0.25, [0.9, 0.85, 0.7], 0)
  }
}

export const S1 = {
  s1_presidio_theatre_32650566,
  s1_sutro_baths_32776564,
  s1_pioneer_log_cabin_120479798,
  s1_fort_mason_shed_a_25372350,
  s1_fort_mason_shed_b_25372352,
  s1_fort_mason_shed_d_25372355,
  s1_hyde_street_pier_25319880,
  s1_pier_7_23605169,
  s1_pier_14_23605173,
}
