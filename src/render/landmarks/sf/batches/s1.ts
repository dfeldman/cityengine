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
import { capPolygon, type MeshBuilder } from '../../../buildings.ts'
import { box, type Rgb } from '../../../models.ts'
import type { Fit } from '../../fit.ts'
import { arcade, edgeAt } from '../../parts.ts'
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
 * SUTRO BATHS (1896; way/32776564) — the ruin, rebuilt 2026-10-02 (owner: "I do really want to have a sutro baths ride").
 * Was a ring of 6 m walls round one water slab with boulders thrown at Math.random — a different ruin every load.
 *
 * What is there: in the cove under Point Lobos, the foundations of the glass palace — a long rectangular BASIN at the
 * sea's level, divided by low concrete walls into the old pools (the big L-shaped main pool and a row of smaller tanks),
 * the walls' tops just out of the water and walkable; on the ocean side the heavy SEAWALL with the BREACH the surf
 * comes through; behind, the building's FOUNDATIONS climbing the cliff in terraces with the stairs between them; and
 * at the north end the TUNNEL cut through the headland to the sea cave. Placed on the sea's level (`deckAbove: 0`):
 * the pools are the sea itself, x east (the cliff), −x west (the ocean).
 */
export const s1_sutro_baths_32776564 = (out: MeshBuilder, fit: Fit): void => {
  const concrete = surfaceTag('concrete')
  const W = Math.min(fit.hx, 60)          // half the site across
  const L = Math.min(fit.hz, 80)          // half along the shore
  const OLD: [number, number, number] = [0.66, 0.64, 0.6]
  const DARK: [number, number, number] = [0.46, 0.45, 0.42]
  const POOL: [number, number, number] = [0.08, 0.15, 0.14]
  // the basin: west half of the site, its water at the sea's level and a little greener than the sea
  const bx0 = -W, bx1 = W * 0.15
  box(out, (bx0 + bx1) / 2, -0.05, 0, (bx1 - bx0) / 2, 0.08, L * 0.9, POOL, 0)
  const wall = (x0: number, z0: number, x1: number, z1: number, h = 1.1, t = 0.9, c = OLD): void => {
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2
    box(out, cx, h / 2 - 0.4, cz, Math.max(t / 2, Math.abs(x1 - x0) / 2), (h + 0.4) / 2, Math.max(t / 2, Math.abs(z1 - z0) / 2), c, concrete)
  }
  // the basin's rim, and the pools: the main pool's long divider, and the row of small tanks along the cliff side
  wall(bx0, -L * 0.9, bx1, -L * 0.9)
  wall(bx0, L * 0.9, bx1, L * 0.9)
  wall(bx1, -L * 0.9, bx1, L * 0.9)
  wall(bx0 + (bx1 - bx0) * 0.55, -L * 0.9, bx0 + (bx1 - bx0) * 0.55, L * 0.35)
  for (let k = 0; k <= 6; k++) {
    const z = -L * 0.9 + (k * L * 1.8) / 6
    wall(bx0 + (bx1 - bx0) * 0.55, z, bx1, z, 0.9, 0.7)
  }
  wall(bx0, L * 0.35, bx0 + (bx1 - bx0) * 0.55, L * 0.35, 0.8, 0.7)
  // the seawall on the ocean side, heavy and higher, broken by the breach two-thirds of the way along
  wall(bx0 - 2, -L * 0.95, bx0 - 2, L * 0.15, 3.2, 3.2, DARK)
  wall(bx0 - 2, L * 0.32, bx0 - 2, L * 0.95, 3.2, 3.2, DARK)
  for (const [z, s] of [[L * 0.2, 1.6], [L * 0.24, 1.1], [L * 0.28, 1.4]] as const) box(out, bx0 - 3 + s * 0.3, s * 0.3, z, s, s * 0.7, s, DARK, concrete)
  // the foundations climbing the cliff in terraces, a stair between each pair
  for (let t = 0; t < 4; t++) {
    const x0 = bx1 + 2 + t * ((W - bx1) / 4)
    const y = 2.5 + t * 4.5
    box(out, x0 + (W - bx1) / 8, y / 2, 0, (W - bx1) / 8, y / 2, L * (0.8 - t * 0.12), OLD, concrete)
    // the column stumps on each terrace
    for (let k = -4; k <= 4; k++) box(out, x0 + 2, y + 0.6, k * L * 0.16, 0.5, 0.6, 0.5, DARK, concrete)
    // the stair up to it, at the south end
    for (let st = 0; st < 6; st++) box(out, x0 - 1 + st * 0.45, (y - 4.5) + (st + 1) * 0.75 * (4.5 / 4.5) / 1, -L * (0.8 - t * 0.12) - 1.5, 0.3, 0.38, 1.4, OLD, concrete)
  }
  // the tunnel's portal in the headland at the north end
  box(out, bx0 + 6, 4, L * 0.98, 6, 4, 3, DARK, concrete)
  box(out, bx0 + 6, 2.2, L * 0.98 - 3.05, 2.2, 2.4, 0.1, [0.06, 0.06, 0.07], 0)
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
  const roofColor: Rgb = [0.5, 0.5, 0.49]

  // Walls on the actual footprint
  faceBand(out, ring, 0, eaves, { kind: 'blank', wall: sidingColor, material: 'metal' })

  // The roof ON the footprint: a shallow parapet and a flat grey deck (it was a slab per metre over the footprint's
  // axis-aligned box, 15% wider again — on these turned sheds a red roof twice their size, owner 2026-10-03)
  faceBand(out, ring, eaves, eaves + 0.6, { kind: 'blank', wall: sidingColor, material: 'metal' })
  capPolygon(out, ring, eaves + 0.6, roofColor, metal)

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
  const roofColor: Rgb = [0.5, 0.5, 0.49]

  faceBand(out, ring, 0, eaves, { kind: 'blank', wall: sidingColor, material: 'metal' })
  // the roof on the footprint itself (see Shed A)
  faceBand(out, ring, eaves, eaves + 0.6, { kind: 'blank', wall: sidingColor, material: 'metal' })
  capPolygon(out, ring, eaves + 0.6, roofColor, metal)
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
  const roofColor: Rgb = [0.5, 0.5, 0.49]

  faceBand(out, ring, 0, eaves, { kind: 'blank', wall: sidingColor, material: 'metal' })
  // the roof on the footprint itself (see Shed A)
  faceBand(out, ring, eaves, eaves + 0.6, { kind: 'blank', wall: sidingColor, material: 'metal' })
  capPolygon(out, ring, eaves + 0.6, roofColor, metal)
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
 * Pier 7 (way/23605169) — the public fishing and promenade pier north of the Ferry Building: a narrow WOODEN deck some
 * 260 m long running out diagonally into the bay with two small bump-outs, a low black iron railing and a row of old
 * lamp standards down both sides, benches. Drawn on OSM's own outline (copied: the pier is no building in the bake), on
 * piles; the batch model drew an axis-aligned 220 x 167 m slab, its paths floating over the open water beside it.
 * Placed standalone at the outline's centre, x east / z north.
 */
const PIER7: [number, number][] = [[-78.13, -67.46], [-76.55, -66.26], [-73.82, -64.16], [-70.59, -61.62], [-70.23, -61.03], [-69.99, -60.41], [-69.87, -59.74], [-69.9, -59.06], [-70.04, -58.42], [-70.3, -57.82], [-71.04, -56.81], [5.07, -0.88], [7.62, -0.52], [8.16, -1.27], [13.04, -0.73], [21.95, 5.79], [24.0, 10.48], [23.49, 11.19], [24.41, 13.37], [114.11, 79.12], [115.48, 77.34], [120.51, 77.82], [123.47, 73.95], [129.0, 77.84], [127.97, 86.73], [121.05, 96.27], [113.14, 99.71], [107.5, 95.68], [110.43, 91.79], [108.52, 86.93], [109.87, 85.2], [20.05, 19.41], [17.65, 19.15], [17.06, 19.91], [12.17, 19.42], [3.17, 12.66], [1.13, 8.29], [1.71, 7.44], [0.76, 5.3], [-75.48, -50.66], [-77.11, -48.9], [-77.75, -48.6], [-78.48, -48.48], [-79.23, -48.59], [-79.89, -48.8], [-83.73, -51.46], [-86.46, -47.85], [-90.51, -50.84], [-83.35, -60.43]]
export const pier7Promenade = (out: MeshBuilder, _fit: Fit): void => {
  const ring = PIER7.map(([x, z]) => ({ x, z }))
  const wood = surfaceTag('clapboard')
  const metal = surfaceTag('metal')
  const DECK: Rgb = [0.5, 0.42, 0.33]
  const deckY = 0.35
  // the deck: its top fanned from the first corner is wrong for a concave ring, so ear-clipped by capPolygon
  capPolygon(out, ring, deckY, DECK, wood)
  faceBand(out, ring, -0.6, deckY, { kind: 'blank', wall: [0.32, 0.28, 0.24], material: 'clapboard' })
  // piles under the edges, every 6 m
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    for (let u = 0; u < e.L; u += 6) box(out, e.a.x + e.tx * u, -3, e.a.z + e.tz * u, 0.22, 3, 0.22, [0.24, 0.2, 0.17], wood)
  }
  // the railing: posts every 2.5 m and a top rail, along every edge longer than a metre
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    if (e.L < 1) continue
    const n = Math.max(1, Math.round(e.L / 2.5))
    for (let j = 0; j <= n; j++) {
      const u = (e.L * j) / n
      box(out, e.a.x + e.tx * u - e.nx * 0.12, deckY + 0.55, e.a.z + e.tz * u - e.nz * 0.12, 0.04, 0.55, 0.04, [0.08, 0.08, 0.09], metal)
    }
    box(out, e.mid.x - e.nx * 0.12, deckY + 1.08, e.mid.z - e.nz * 0.12, e.L / 2, 0.035, 0.035, [0.08, 0.08, 0.09], metal)
    // the lamp standards on the long sides, every 20 m
    if (e.L > 30) for (let u = 10; u < e.L - 5; u += 20) {
      const x = e.a.x + e.tx * u - e.nx * 0.5, z = e.a.z + e.tz * u - e.nz * 0.5
      box(out, x, deckY + 2.2, z, 0.07, 2.2, 0.07, [0.1, 0.1, 0.11], metal)
      box(out, x, deckY + 4.5, z, 0.22, 0.22, 0.22, [0.95, 0.88, 0.7], 0)
    }
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
  pier7Promenade,
}
