/**
 * FIREBOAT STATION 35 (2022, SF Public Works), Pier 22½: the world's only floating fire station — a two-storey,
 * 16 000 sq ft building on a 173 × 96 ft (53 × 29 m) steel float that rises and falls with the tide, moored by four
 * guide piles behind the historic 1915 station on the Embarcadero. Designed "to invoke the spirit of the historic past
 * without mimicking" it: a long pitched-roof shed, metal-clad in the waterfront's grey with SFFD red, its big glazed
 * apparatus doors facing the slips where the three fireboats tie up. The owner, 2026-10-02: "generic building in the
 * water at 37.790008, -122.387991" — OSM maps it (way/1093564640, "Fireboat Station 35"), so it went down the
 * ordinary building path and stood on the sea bed as a brick block.
 *
 * Placed with `deckAbove` (at the sea, not the sea bed). Faces +z: the fireboat slips.
 */
import type { MeshBuilder } from '../../buildings.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import type { Fit } from '../fit.ts'

const STEEL: Rgb = [0.30, 0.32, 0.34]
const CLAD: Rgb = [0.62, 0.64, 0.65]
const RED: Rgb = [0.66, 0.12, 0.10]
const ROOF: Rgb = [0.36, 0.38, 0.40]
const GLASS: Rgb = [0.36, 0.46, 0.52]
const DECK: Rgb = [0.48, 0.47, 0.44]
const BOAT_RED: Rgb = [0.72, 0.10, 0.08]
const WHITE: Rgb = [0.92, 0.92, 0.90]
const METAL = surfaceTag('metal')
const G = surfaceTag('glass')
const C = surfaceTag('concrete')

export function fireboatStation(out: MeshBuilder, _fit: Fit): void {
  const L = 26.4   // half-length of the float
  const W = 14.6   // half-width
  // the float: a steel pontoon, mostly under water, its deck a metre above it
  box(out, 0, -1.2, 0, L, 2.2, W, STEEL, METAL)
  box(out, 0, 1.05, 0, L, 0.05, W, DECK, C)
  // the four guide piles at the corners, standing well above the deck
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) prism(out, sx * (L + 0.8), sz * (W + 0.8), -6, 9, 0.55, 10, [0.22, 0.22, 0.22], METAL)
  // the building: two storeys along the back two-thirds of the float, a pitched metal roof over it
  const bz = -3.5, bw = 10.5, bl = 22
  box(out, 0, 1.1 + 3.4, bz, bl, 3.4, bw, CLAD, METAL)
  box(out, 0, 1.1 + 6.8 + 2.4, bz, bl, 2.4, bw, CLAD, METAL)
  // the red band between the storeys, and red trim at the eaves
  box(out, 0, 1.1 + 6.8, bz, bl + 0.05, 0.35, bw + 0.05, RED, METAL)
  box(out, 0, 1.1 + 11.6, bz, bl + 0.4, 0.25, bw + 0.4, RED, METAL)
  // the roof: two slopes and gable ends, the ridge along the float
  const y0 = 1.1 + 11.8, rise = 4.2
  for (const s of [-1, 1]) {
    out.quad([[-bl - 0.4, y0, bz + s * (bw + 0.6)], [bl + 0.4, y0, bz + s * (bw + 0.6)], [bl + 0.4, y0 + rise, bz], [-bl - 0.4, y0 + rise, bz]],
      [0, 0.92, s * 0.38], [[0, 0], [1, 0], [1, 1], [0, 1]], ROOF, METAL)
    out.quad([[s * bl, y0, bz - bw], [s * bl, y0, bz + bw], [s * bl, y0 + rise, bz], [s * bl, y0 + rise, bz]],
      [s, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], CLAD, METAL)
  }
  // the apparatus bay doors facing the slips: tall glazed doors in red frames
  for (let k = 0; k < 4; k++) {
    const x = -15 + k * 10
    box(out, x, 1.1 + 2.9, bz + bw + 0.06, 3.6, 2.9, 0.05, GLASS, G)
    box(out, x, 1.1 + 5.9, bz + bw + 0.08, 3.8, 0.18, 0.06, RED, METAL)
    for (const s of [-1, 1]) box(out, x + s * 3.7, 1.1 + 2.9, bz + bw + 0.08, 0.18, 2.9, 0.06, RED, METAL)
  }
  // the upper floor's ribbon windows, both long sides
  for (const s of [-1, 1]) box(out, 0, 1.1 + 9.4, bz + s * (bw + 0.05), bl - 1.5, 0.9, 0.04, GLASS, G)
  // the number on the gable facing the city
  box(out, -bl - 0.05, 1.1 + 9.2, bz, 0.04, 1.2, 2.2, RED, METAL)
  // the slips in front: a fireboat tied up, red hull, white cabin
  const boat = (x: number): void => {
    box(out, x, 0.2, W - 3.2, 9, 0.9, 2.6, BOAT_RED, METAL)
    box(out, x - 1.5, 1.9, W - 3.2, 4, 0.9, 1.9, WHITE, METAL)
    box(out, x - 2, 3.2, W - 3.2, 2, 0.5, 1.4, GLASS, G)
    prism(out, x + 3.5, W - 3.2, 1.1, 3.4, 0.25, 8, BOAT_RED, METAL)   // the water monitor
  }
  boat(-10)
  boat(12)
}
