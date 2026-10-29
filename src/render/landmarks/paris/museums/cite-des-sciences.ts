import type { MeshBuilder } from '../../../buildings.ts'
import { beam, block, dome, prism, type Rgb } from '../../kit.ts'
import type { Fit } from '../../fit.ts'

const FIXED = 0

/**
 * The Cité des Sciences et de l'Industrie (Fainsilber, 1986) in the old La Villette abattoirs' sale hall: a 280 × 110 m
 * box of steel and glass, its bays of dark blue-grey glazing in a light steel grid, the great trusses over its roof, the
 * planetarium's two domes up there, and on the south-east front to the Géode the three glass SERRES — 32 m cubes standing
 * out over the moat. OSM way 64040845 (34 m) with its two roof parts (the domes, 251644330/331).
 * Local frame: long axis x, −z the south-east front (the Géode in front of x ≈ −33).
 */
export function citeDesSciences(out: MeshBuilder, fit: Fit): void {
  const hx = Math.min(Math.max(fit.hx, 100), 150)
  const hz = Math.min(Math.max(fit.hz, 40), 62)
  const sx = hx / 140.7
  const H = 30
  const glass: Rgb = [0.3, 0.37, 0.42]
  const steel: Rgb = [0.68, 0.72, 0.76]
  const blue: Rgb = [0.42, 0.52, 0.62]
  block(out, -hx, hx, -hz, hz, 0, H, glass)
  block(out, -hx - 0.3, hx + 0.3, -hz - 0.3, hz + 0.3, H, H + 1.6, [0.5, 0.53, 0.55])
  // the edge beam round it
  for (const z of [-hz, hz]) block(out, -hx - 0.35, hx + 0.35, z - 0.35, z + 0.35, H + 0.4, H + 1.7, steel)
  for (const x of [-hx, hx]) block(out, x - 0.35, x + 0.35, -hz - 0.35, hz + 0.35, H + 0.4, H + 1.7, steel)
  // the steel grid of the walls, every 8 m and every storey
  for (let x = -hx; x <= hx + 0.01; x += 8) {
    for (const z of [-hz - 0.1, hz + 0.1]) block(out, x - 0.25, x + 0.25, z - 0.2, z + 0.2, 0, H, steel)
  }
  for (let z = -hz; z <= hz + 0.01; z += 8) {
    for (const x of [-hx - 0.1, hx + 0.1]) block(out, x - 0.2, x + 0.2, z - 0.25, z + 0.25, 0, H, steel)
  }
  for (let y = 6; y < H; y += 6) {
    block(out, -hx - 0.15, hx + 0.15, -hz - 0.15, -hz + 0.05, y - 0.2, y + 0.2, steel)
    block(out, -hx - 0.15, hx + 0.15, hz - 0.05, hz + 0.15, y - 0.2, y + 0.2, steel)
  }
  // the roof's trusses: four great girders along it on posts, cross-beams between, in the blue of the structure
  for (const z of [-hz * 0.62, -hz * 0.2, hz * 0.2, hz * 0.62]) {
    beam(out, [-hx + 4, H + 5, z], [hx - 4, H + 5, z], 0.6, blue)
    for (let x = -hx + 8; x < hx - 4; x += 16) beam(out, [x, H + 1.6, z], [x + 8, H + 5, z], 0.3, blue)
  }
  for (let x = -hx + 12; x < hx - 8; x += 24) beam(out, [x, H + 5, -hz * 0.62], [x, H + 5, hz * 0.62], 0.4, blue)
  // the planetarium's domes on the roof
  for (const x of [-49.5, -18.5]) {
    prism(out, x * sx, 0, H + 1.6, H + 3, 9, 20, steel, FIXED)
    dome(out, x * sx, 0, H + 3, 8.5, 6.5, [0.78, 0.82, 0.84], 20)
  }
  // the three serres on the south-east front, glass cubes in their steel cages, out over the moat
  for (const c of [-67, -33, 1]) {
    const x = c * sx
    const w = 16
    const z1 = -hz
    const z0 = -hz - 8
    block(out, x - w, x + w, z0, z1, 0, 32, [0.56, 0.66, 0.7])
    for (let k = -w; k <= w + 0.01; k += 4) {
      block(out, x + k - 0.1, x + k + 0.1, z0 - 0.15, z0 + 0.05, 0, 32, steel)
    }
    for (let y = 0; y <= 32.01; y += 4) block(out, x - w - 0.1, x + w + 0.1, z0 - 0.15, z0 + 0.05, y - 0.1, y + 0.1, steel)
    for (const s of [-1, 1]) {
      for (let k = 0; k <= 8.01; k += 4) block(out, x + s * w - 0.1, x + s * w + 0.1, z0 + k - 0.1, z0 + k + 0.1, 0, 32, steel)
    }
  }
}
