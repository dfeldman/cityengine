/**
 * THE DRAGON GATE at Grant Avenue and Bush Street (1970, Clayton Lee): the way into Chinatown, and the one thing on
 * Grant a rider will know at once. Three openings between four stone piers — the middle one wide enough for the cars
 * on Grant, the side ones for the pavements — each under its own roof of green glazed tile with upturned eaves, the
 * middle roof higher and in two tiers; under the eaves the painted bracket band, red, blue and gold; over the middle
 * opening the plaque; on the ridges, dragons and a pearl. Stands across Grant facing Bush (local x along Bush, the
 * passage along z).
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { box, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'

const STONE: Rgb = [0.78, 0.76, 0.72]
const TILE: Rgb = [0.18, 0.46, 0.32]
const TILE_DARK: Rgb = [0.12, 0.34, 0.24]
const RED: Rgb = [0.62, 0.12, 0.1]
const GOLD: Rgb = [0.86, 0.68, 0.24]
const BLUE: Rgb = [0.16, 0.3, 0.52]

/** a hipped roof with upturned corners over (cx, cz), eaves at y, half-extents hx/hz, rising `rise` to a ridge */
function hipRoof(out: MeshBuilder, cx: number, y: number, cz: number, hx: number, hz: number, rise: number, tag: number): void {
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  const rx = Math.max(0.3, hx - hz * 0.9)        // the ridge's half-length
  const top = y + rise
  // the two long slopes (±z) and the two hipped ends (±x)
  for (const s of [-1, 1]) {
    out.quad(s > 0
      ? [[cx + hx, y, cz + hz], [cx - hx, y, cz + hz], [cx - rx, top, cz], [cx + rx, top, cz]]
      : [[cx - hx, y, cz - hz], [cx + hx, y, cz - hz], [cx + rx, top, cz], [cx - rx, top, cz]], [0, hz, s * rise], uv, TILE, tag)
    out.quad(s > 0
      ? [[cx + hx, y, cz - hz], [cx + hx, y, cz + hz], [cx + rx, top, cz], [cx + rx, top, cz]]
      : [[cx - hx, y, cz + hz], [cx - hx, y, cz - hz], [cx - rx, top, cz], [cx - rx, top, cz]], [s * rise, hx - rx, 0], uv, TILE, tag)
    // the underside of the eaves, dark
    out.quad([[cx - hx, y - 0.02, cz + s * hz], [cx + hx, y - 0.02, cz + s * hz], [cx + hx * 0.85, y - 0.02, cz + s * hz * 0.5], [cx - hx * 0.85, y - 0.02, cz + s * hz * 0.5]], [0, -1, 0], uv, TILE_DARK, tag)
  }
  // the ridge, its dragons and the pearl between them
  box(out, cx, top + 0.15, cz, rx + 0.2, 0.15, 0.18, TILE_DARK, tag)
  for (const s of [-1, 1]) {
    box(out, cx + s * (rx + 0.1), top + 0.55, cz, 0.18, 0.45, 0.14, GOLD, 0)
    box(out, cx + s * (rx * 0.55), top + 0.38, cz, rx * 0.4, 0.12, 0.1, TILE, 0)
  }
  box(out, cx, top + 0.5, cz, 0.22, 0.22, 0.22, GOLD, 0)
  // the upturned corners
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(out, cx + sx * (hx + 0.1), y + 0.25, cz + sz * (hz + 0.1), 0.25, 0.2, 0.25, TILE, tag)
}

/** the painted bracket band under an eave: red beams, a blue and gold frieze */
function brackets(out: MeshBuilder, cx: number, y: number, cz: number, hx: number, hz: number): void {
  box(out, cx, y - 0.25, cz, hx, 0.25, hz, RED, 0)
  box(out, cx, y - 0.62, cz, hx * 0.96, 0.12, hz + 0.02, BLUE, 0)
  for (let k = -4; k <= 4; k++) box(out, cx + (k / 4) * hx * 0.9, y - 0.62, cz, 0.12, 0.13, hz + 0.05, GOLD, 0)
}

export function dragonGate(out: MeshBuilder, _fit: Fit): void {
  const stone = surfaceTag('ashlar')
  const tile = surfaceTag('tile')
  const D = 1.3                       // the piers' half-depth along the passage
  // the four piers: the middle pair stand wider than the street, the outer pair at the pavements' far side
  // (inside Grant's 15 m between the facades: the outer roofs' eaves stop short of the buildings either side)
  const piers = [-8.2, -4.4, 4.4, 8.2]
  for (const x of piers) {
    const w = Math.abs(x) < 5 ? 0.75 : 0.6
    box(out, x, 3.4, 0, w, 3.4, D, STONE, stone)
    box(out, x, 0.3, 0, w + 0.15, 0.3, D + 0.15, STONE, stone)
  }
  // the side bays: a beam, the bracket band, a roof
  for (const s of [-1, 1]) {
    const cx = s * 6.3
    box(out, cx, 5.0, 0, 2.1, 0.3, D * 0.7, RED, 0)
    brackets(out, cx, 6.0, 0, 2.1, D * 0.8)
    box(out, cx, 6.1, 0, 2.2, 0.12, D * 0.85, RED, 0)
    hipRoof(out, cx, 6.2, 0, 2.7, 1.9, 1.3, tile)
  }
  // the middle: lintel, plaque, bracket band, the lower roof, a short upper storey, the upper roof
  box(out, 0, 6.2, 0, 4.6, 0.35, D * 0.75, RED, 0)
  box(out, 0, 7.2, 0, 1.8, 0.6, D * 0.8, BLUE, 0)
  box(out, 0, 7.2, 0, 1.95, 0.7, D * 0.75, GOLD, 0)
  brackets(out, 0, 8.3, 0, 4.6, D * 0.85)
  box(out, 0, 8.4, 0, 4.7, 0.12, D * 0.9, RED, 0)
  hipRoof(out, 0, 8.5, 0, 5.6, 2.3, 1.0, tile)
  box(out, 0, 9.9, 0, 3.4, 0.5, D * 0.55, RED, 0)
  brackets(out, 0, 10.6, 0, 3.4, D * 0.6)
  hipRoof(out, 0, 10.65, 0, 4.4, 2.0, 1.4, tile)
}

/**
 * THE HYDE STREET TURNAROUND at Beach Street (the Powell–Hyde line's end, by Aquatic Park and the Buena Vista): the
 * turntable (placed on its own, sights.json) sits in a brick-paved plaza with the queue's waiting rail along one
 * side, which the bake drew as Victorian Park's lawn. A paved disc, draped on the slope, the queue rail, a few
 * benches. (Here because it is a small plaza job like the gate's; a lat/lon entry.)
 */
export function hydeTurnaround(out: MeshBuilder, fit: Fit): void {
  const R = Math.min(fit.hx, fit.hz)
  const PAVE: Rgb = [0.56, 0.38, 0.3]
  const KERB: Rgb = [0.66, 0.64, 0.6]
  const STEEL: Rgb = [0.24, 0.26, 0.24]
  const N = 28
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * Math.PI * 2, a1 = ((i + 1) / N) * Math.PI * 2
    const p = (a: number, r: number, y: number): [number, number, number] => [Math.sin(a) * r, y, Math.cos(a) * r]
    out.quad([p(a0, 0, 0.06), p(a1, 0, 0.06), p(a1, R, 0.06), p(a0, R, 0.06)], [0, 1, 0], uv, PAVE, surfaceTag('brick'))
    out.quad([p(a0, R, 0.06), p(a1, R, 0.06), p(a1, R + 0.3, 0.12), p(a0, R + 0.3, 0.12)], [0, 1, 0], uv, KERB, 0)
  }
  // the queue's rail: a run of posts and a top rail along one side, and the benches
  for (let k = 0; k <= 8; k++) box(out, -R + 1.2, 0.5, -R * 0.6 + (k * R * 1.2) / 8, 0.04, 0.5, 0.04, STEEL, 0)
  box(out, -R + 1.2, 1.0, 0, 0.04, 0.03, R * 0.6, STEEL, 0)
  for (const z of [-R * 0.45, R * 0.45]) {
    box(out, R - 1.3, 0.45, z, 0.25, 0.04, 0.9, [0.36, 0.28, 0.2], 0)
    box(out, R - 1.05, 0.75, z, 0.04, 0.3, 0.9, [0.36, 0.28, 0.2], 0)
  }
}

/** …and the approach: the paved street the cable cars come up from Hyde Street to the turntable, along OSM's track
 *  (way/680987101), which the bake left on Victorian Park's lawn. A brick strip with granite kerbs, draped; local x
 *  along the track. */
export function hydeApproach(out: MeshBuilder, fit: Fit): void {
  const L = fit.hx, W = Math.min(fit.hz, 4.5)
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  const N = Math.max(4, Math.round(L / 3))
  for (let i = 0; i < N; i++) {
    const x0 = -L + (i * 2 * L) / N, x1 = -L + ((i + 1) * 2 * L) / N
    out.quad([[x0, 0.06, W], [x1, 0.06, W], [x1, 0.06, -W], [x0, 0.06, -W]], [0, 1, 0], uv, [0.56, 0.38, 0.3], surfaceTag('brick'))
    for (const s of [-1, 1]) out.quad([[x0, 0.06, s * W], [x1, 0.06, s * W], [x1, 0.14, s * (W + 0.35)], [x0, 0.14, s * (W + 0.35)]], [0, 1, 0], uv, [0.66, 0.64, 0.6], 0)
  }
}

export const CHINATOWN_GATE: Record<string, (out: MeshBuilder, fit: Fit) => void> = { dragonGate, hydeTurnaround, hydeApproach }
