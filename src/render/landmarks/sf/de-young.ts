/**
 * THE DE YOUNG MUSEUM (Herzog & de Meuron, 2005; relation/1652482, the Hamon Tower way/444230154) — the MUSEUM in
 * Golden Gate Park, not the de Young Building on Market Street (BUGS.md #147: the name hit the wrong one, and the
 * museum stayed a generic 13 m block until the appearance audit, 2026-10-02).
 *
 * The gist: a long low building in perforated, dimpled COPPER weathered to a dark russet-brown; its roof one
 * plane that runs out into a deep cantilevered canopy over the entrance at the south-west end; courtyards cut
 * through it, planted; and at the north-east end, on a wing turned across the main block, the HAMON TOWER — 44 m,
 * its plan twisting floor by floor from the building's angle at the foot to the street grid at the top, a glazed
 * observation floor under a copper lid.
 *
 * Placed standalone (public/landmarks/san-francisco/parks.json) in the main block's frame: OSM's main outline
 * (way/23867087) is 136 x 76 m, its long axis 42 deg, and model −x is its north-east end. The wing (way/888799026,
 * 81 x 42 m, turned 83 deg to it) and the tower stand off that end, measured into this frame from OSM.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'
import { box } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'

const COPPER: Rgb = [0.29, 0.21, 0.15]
const COPPER_DARK: Rgb = [0.23, 0.17, 0.13]
const GLASS: Rgb = [0.20, 0.24, 0.27]
const COURT: Rgb = [0.24, 0.30, 0.18]
const H = 13
/** the main block's half-length and half-width */
const L = 68
const W = 38

export function deYoungMuseum(out: MeshBuilder, _fit: Fit): void {
  const copper = surfaceTag('copper')
  const glass = surfaceTag('glass')
  // the ground floor, glazed and set back under the copper
  box(out, 0, 2.2, 0, L - 2, 2.2, W - 2, GLASS, glass)
  // the copper mass above it, in three long bars that slide past each other — the plan's fingers
  for (const [z, hw, dx] of [[-W + 12, 12, 4], [0, 12, -3], [W - 12, 12, 2]] as const) {
    box(out, dx, 4.4 + (H - 4.4) / 2, z, L - Math.abs(dx), (H - 4.4) / 2, hw - 0.6, COPPER, copper)
  }
  // the roof plane over all three, with the canopy cantilevered out over the entrance (+x, the south-west end)
  box(out, 6, H + 0.3, 0, L + 6, 0.3, W, COPPER_DARK, copper)
  box(out, L + 12, H + 0.3, 6, 12, 0.3, 20, COPPER_DARK, copper)
  // the courtyards: planted slots through the roof, between the bars
  for (const [x, z, hx, hz] of [[-20, -W + 24, 16, 1.6], [26, W - 24, 14, 1.6], [-44, 10, 8, 6]] as const) {
    box(out, x, H + 0.62, z, hx, 0.04, hz, COURT, surfaceTag('concrete'))
    out.decks.push({ ring: [{ x: x - hx, z: z - hz }, { x: x + hx, z: z - hz }, { x: x + hx, z: z + hz }, { x: x - hx, z: z + hz }], y: H + 0.62, keepOff: 0.5, trees: true, spacing: 7 })
  }

  // the north-east wing, turned across the main block, from its end out to the tower
  box(out, -88, H / 2, -11, 20, H / 2, 40, COPPER, copper)
  box(out, -88, H + 0.3, -11, 21, 0.3, 41, COPPER_DARK, copper)

  // THE HAMON TOWER: twelve copper slices, each turned a little further, from the block's angle to the city grid
  const TX = -98, TZ = -29
  const TOP = 46
  const N = 12
  const TWIST = 42 * Math.PI / 180
  for (let i = 0; i < N; i++) {
    const y0 = H + ((TOP - 6 - H) * i) / N
    const h = (TOP - 6 - H) / N
    const a = (TWIST * (i + 0.5)) / N
    boxTurned(out, TX, y0 + h / 2, TZ, 11, h / 2 + 0.02, 6, a, i % 3 === 2 ? COPPER_DARK : COPPER, copper)
  }
  // its foot, down to the ground, and the glazed observation floor under the lid
  boxTurned(out, TX, H / 2, TZ, 11, H / 2, 6, 0, COPPER, copper)
  boxTurned(out, TX, TOP - 3.4, TZ, 11.2, 2.6, 6.2, TWIST, GLASS, glass)
  boxTurned(out, TX, TOP - 0.4, TZ, 12, 0.4, 7, TWIST, COPPER_DARK, copper)
}

/** a box turned `a` about the vertical through its centre */
function boxTurned(out: MeshBuilder, cx: number, cy: number, cz: number, hx: number, hy: number, hz: number, a: number, c: Rgb, tag: number): void {
  const co = Math.cos(a), s = Math.sin(a)
  const P = (x: number, y: number, z: number): [number, number, number] => [cx + x * co - z * s, cy + y, cz + x * s + z * co]
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  const faces: [[number, number, number][], [number, number, number]][] = [
    [[P(-hx, -hy, hz), P(hx, -hy, hz), P(hx, hy, hz), P(-hx, hy, hz)], [-s, 0, co]],
    [[P(hx, -hy, -hz), P(-hx, -hy, -hz), P(-hx, hy, -hz), P(hx, hy, -hz)], [s, 0, -co]],
    [[P(hx, -hy, hz), P(hx, -hy, -hz), P(hx, hy, -hz), P(hx, hy, hz)], [co, 0, s]],
    [[P(-hx, -hy, -hz), P(-hx, -hy, hz), P(-hx, hy, hz), P(-hx, hy, -hz)], [-co, 0, -s]],
    [[P(-hx, hy, hz), P(hx, hy, hz), P(hx, hy, -hz), P(-hx, hy, -hz)], [0, 1, 0]],
  ]
  for (const [p, n] of faces) out.quad(p, n, uv, c, tag)
}
