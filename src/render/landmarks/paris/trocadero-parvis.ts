import type { MeshBuilder } from '../../buildings.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { block, hex, shade } from '../kit.ts'

const FIXED = 0

/**
 * The parvis of the Palais de Chaillot, the Trocadéro's terrace between the two wings (backlog, user
 * 2026-09-22): the eight gilded bronze figures on their pedestals, four down each side of the axis, and the
 * balustrade over the gardens with the stair gap in the middle — the place every photograph of the Eiffel
 * Tower from across the Seine is taken from. The wings themselves are OSM's (a `classical` restyle).
 *
 * Local frame: +z down the axis towards the Eiffel Tower (the manifest turns it), on Chaillot's own centre and datum (y = 0 the
 * parvis, 61 m above the sea; the head pavilions' parvis faces at x ±27.5, their garden fronts at z +30).
 *
 * Below the figures (owner, 2026-11-03, the parvis had stood 35 m out over the terrace edge): the parvis's paving and its
 * broad steps down to the Place, the Place itself, the Théâtre national de Chaillot's garden front under it (square
 * pillars, glazed bays, gilded doors, the relief frieze), the lateral stairs and the flights along the retaining walls,
 * and the lower terrace at the head of the gardens. Every level is IGN's lidar (MNS, 2026-11-03: parvis 61, Place 59.5,
 * side landings 54, theatre terrace 47, lower terrace 46, the gardens' head 44.5); the outlines are OSM's steps and
 * retaining walls (the 53-step lateral flights at z 76, the 38-step flights along x ±49, the walls at z 82 and x ±55.6).
 * The Fontaine de Varsovie below z 116 is another builder's.
 */
export function trocaderoParvis(out: MeshBuilder): void {
  const stone = hex('#e2d9c6')
  const gilt: Rgb = [0.88, 0.7, 0.3]
  // the figures, on pedestals: a stepped base, the die, a cornice, then the gilded figure
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const x = sx * 15.5
      const z = -18 + i * 12
      block(out, x - 1.1, x + 1.1, z - 1.1, z + 1.1, 0, 0.35, shade(stone, 0.92))
      block(out, x - 0.85, x + 0.85, z - 0.85, z + 0.85, 0.35, 2.3, stone)
      block(out, x - 0.95, x + 0.95, z - 0.95, z + 0.95, 2.3, 2.5, shade(stone, 1.03))
      // a standing figure, facing the axis: the robe widening to the feet, the torso, an arm raised
      prism(out, x, z, 2.5, 4.3, 0.42, 8, gilt, FIXED, 0.3)
      prism(out, x, z, 4.3, 5.0, 0.3, 8, gilt, FIXED, 0.24)
      prism(out, x, z, 5.0, 5.35, 0.14, 8, gilt, FIXED, 0.13)
      box(out, x - sx * 0.25, 5.2, z + (i % 2 ? 0.2 : -0.2), 0.08, 0.45, 0.08, gilt, FIXED)
    }
  }
  terraces(out, stone)
}

const PAVE = hex('#e6dfcf')
const JOINT = hex('#8e8a80')
const WALL = hex('#d3c8b2')
const GLASS: Rgb = [0.13, 0.15, 0.16]
const IRON: Rgb = [0.12, 0.13, 0.13]
const DEEP = -18

/** A run of steps: from (z0, y0) to (z1, y1) along z, x0..x1 across, each tread a block down to the mass below. */
function flightZ(out: MeshBuilder, x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, n: number, c: Rgb): void {
  for (let i = 0; i < n; i++) {
    const a = z0 + ((z1 - z0) * i) / n, b = z0 + ((z1 - z0) * (i + 1)) / n
    const y = y0 + ((y1 - y0) * (i + 0.5)) / n
    block(out, x0, x1, Math.min(a, b), Math.max(a, b), DEEP, y, shade(c, i % 2 ? 0.97 : 1))
  }
}
/** The same along x. */
function flightX(out: MeshBuilder, x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, n: number, c: Rgb): void {
  for (let i = 0; i < n; i++) {
    const a = x0 + ((x1 - x0) * i) / n, b = x0 + ((x1 - x0) * (i + 1)) / n
    const y = y0 + ((y1 - y0) * (i + 0.5)) / n
    block(out, Math.min(a, b), Math.max(a, b), z0, z1, DEEP, y, shade(c, i % 2 ? 0.97 : 1))
  }
}
/** A stone balustrade along x (at z) or along z (at x): plinth, balusters, rail. */
function balustrade(out: MeshBuilder, alongX: boolean, a0: number, a1: number, at: number, y: number, c: Rgb): void {
  const B = (u0: number, u1: number, v0: number, v1: number, y0: number, y1: number, k: Rgb): void =>
    alongX ? block(out, u0, u1, v0, v1, y0, y1, k) : block(out, v0, v1, u0, u1, y0, y1, k)
  B(a0, a1, at - 0.35, at + 0.35, y, y + 0.22, shade(c, 0.95))
  for (let u = a0 + 0.3; u < a1 - 0.1; u += 0.42) B(u - 0.08, u + 0.08, at - 0.09, at + 0.09, y + 0.22, y + 0.9, c)
  for (let u = a0; u <= a1 + 0.01; u += 4.2) B(u - 0.3, u + 0.3, at - 0.38, at + 0.38, y, y + 1.05, c)
  B(a0, a1, at - 0.4, at + 0.4, y + 0.9, y + 1.05, shade(c, 1.04))
}
/** A tube railing along x (at z) or along z (at x): posts every 2 m, a top and a middle rail. */
function pipeRail(out: MeshBuilder, alongX: boolean, a0: number, a1: number, at: number, y: number): void {
  const B = (u0: number, u1: number, v0: number, v1: number, y0: number, y1: number): void =>
    alongX ? block(out, u0, u1, v0, v1, y0, y1, IRON) : block(out, v0, v1, u0, u1, y0, y1, IRON)
  for (let u = a0; u <= a1 + 0.01; u += 2) B(u - 0.03, u + 0.03, at - 0.03, at + 0.03, y, y + 1)
  B(a0, a1, at - 0.035, at + 0.035, y + 0.97, y + 1.03)
  B(a0, a1, at - 0.025, at + 0.025, y + 0.5, y + 0.55)
}
/** A paved field, a block down to the mass, its square panels bordered in grey. */
function paving(out: MeshBuilder, x0: number, x1: number, z0: number, z1: number, y: number, panel: number): void {
  block(out, x0, x1, z0, z1, DEEP, y, PAVE)
  for (let x = Math.ceil(x0 / panel) * panel; x <= x1; x += panel) block(out, x - 0.22, x + 0.22, z0, z1, y, y + 0.015, JOINT)
  for (let z = Math.ceil(z0 / panel) * panel; z <= z1; z += panel) block(out, x0, x1, z - 0.22, z + 0.22, y, y + 0.015, JOINT)
}

function terraces(out: MeshBuilder, stone: Rgb): void {
  const PLACE = -1.5, THEATRE = -14, LANDING = -7, LOWER = -15
  // the parvis between the pavilions, its big grey-bordered squares
  paving(out, -27.4, 27.4, -28, 22.6, 0, 6.5)
  // its broad shallow steps at the garden end, the strip between, the second flight down to the Place
  flightZ(out, -27.4, 27.4, 22.6, 24.9, 0, -0.5, 3, PAVE)
  paving(out, -27.4, 27.4, 24.9, 30, -0.5, 6.5)
  paving(out, -55.6, 55.6, 30, 35.3, -0.5, 6.5)
  flightZ(out, -55.6, 55.6, 35.3, 37.3, -0.5, PLACE, 6, PAVE)
  // the Place: the middle to its edge over the theatre, the sides around the stair wells
  paving(out, -45.5, 45.5, 37.3, 68, PLACE, 6.5)
  for (const s of [-1, 1]) {
    const X = (a: number, b: number): [number, number] => (s > 0 ? [a, b] : [-b, -a])
    paving(out, ...X(45.5, 55.6), 37.3, 55, PLACE, 6.5)
    // the 38 steps down along the retaining wall, from the Place to the side landing
    flightZ(out, ...X(45.5, 52.5), 55, 69.5, PLACE, LANDING, 19, PAVE)
    // their walls: the Place's edge on the inside, the retaining wall's top on the outside
    block(out, ...X(52.5, 55.6), 55, 82, DEEP, PLACE + 0.2, WALL)
    block(out, ...X(44.9, 45.5), 55, 69.5, DEEP, PLACE + 0.9, WALL)
    balustrade(out, false, 55, 82, s * 54.05, PLACE + 0.2, stone)
    // the side landing, and the 53 steps down along the theatre's front to its terrace
    paving(out, ...X(42, 52.5), 69.5, 82, LANDING, 4)
    flightX(out, s * 42, s * 22, 69.5, 82, LANDING, THEATRE, 26, PAVE)
    // the retaining wall under the landing and the flight, the gardens' lower ground beyond it
    block(out, ...X(22, 55.6), 82, 82.8, DEEP, LANDING + 0.3, WALL)
    for (let x = 24; x < 55; x += 3.4) block(out, ...X(x, x + 3.25), 82.8, 82.85, LOWER, LANDING, shade(WALL, x % 6.8 < 3.4 ? 0.96 : 1.02))
    balustrade(out, true, ...X(22, 55.6), 82.4, LANDING + 0.3, stone)
    // the outer face of the high retaining wall, toward the side gardens
    block(out, ...X(55.6, 56.2), 37.3, 82.8, DEEP, PLACE + 0.25, WALL)
  }
  // the balustrade along the Place's edge over the theatre, and along the stair wells
  balustrade(out, true, -45.5, 45.5, 68.4, PLACE, stone)
  // THE THEATRE'S GARDEN FRONT under the Place: square pillars, glass between them, gilded doors, the relief frieze
  const F = 69.5
  block(out, -42, 42, 68, F - 0.6, THEATRE, PLACE, shade(WALL, 0.9))
  const N = 12
  for (let i = 0; i <= N; i++) {
    const x = -22 + (44 * i) / N
    block(out, x - 0.75, x + 0.75, F - 0.6, F + 0.8, THEATRE, -5.2, WALL)
    if (i === N) break
    const m = x + 44 / N / 2
    block(out, m - 1.05, m + 1.05, F - 0.65, F - 0.5, THEATRE + 3.6, -5.6, GLASS)
    for (const y of [-11, -8.2]) block(out, m - 1.05, m + 1.05, F - 0.5, F - 0.42, y - 0.06, y + 0.06, IRON)
    block(out, m - 0.95, m + 0.95, F - 0.5, F - 0.38, THEATRE, THEATRE + 3.4, [0.78, 0.6, 0.27])
    block(out, m - 0.05, m + 0.05, F - 0.38, F - 0.34, THEATRE, THEATRE + 3.4, [0.5, 0.38, 0.16])
  }
  block(out, -22.8, 22.8, F - 0.6, F + 0.9, -5.2, -4.8, shade(WALL, 1.04))
  // the frieze: carved panels, alternating light and shadow
  for (let i = 0; i < 16; i++) {
    const x = -22 + i * 2.75
    block(out, x + 0.1, x + 2.65, F + 0.3, F + 0.55, -4.75, -2.6, shade(WALL, 1.02))
    block(out, x + 0.6, x + 2.15, F + 0.55, F + 0.75, -4.4, -2.95, shade(WALL, i % 2 ? 0.86 : 0.92))
  }
  block(out, -23, 23, F - 0.6, F + 0.95, -2.6, PLACE, shade(WALL, 1.05))
  // the theatre's terrace before it, and the 8 steps down to the lower terrace past the wall
  paving(out, -22, 22, F, 82, THEATRE, 4)
  flightZ(out, -22, 22, 82, 85.7, THEATRE, LOWER, 8, PAVE)
  // THE LOWER TERRACE at the head of the gardens: paved, low walls along its sides with a tube rail on them
  paving(out, -45, 45, 85.7, 111, LOWER, 5)
  for (const s of [-1, 1]) {
    block(out, s * 45 - 0.35, s * 45 + 0.35, 82.8, 111, DEEP, LOWER + 0.7, WALL)
    pipeRail(out, false, 83, 111, s * 45, LOWER + 0.7)
    block(out, s > 0 ? 22 : -45, s > 0 ? 45 : -22, 82.8, 85.7, DEEP, LOWER + 0.02, PAVE)
    // its garden edge: a low wall, the tube rail, a gap for the steps down
    block(out, s > 0 ? 7 : -45, s > 0 ? 45 : -7, 110.6, 111.3, DEEP, LOWER + 0.6, WALL)
    pipeRail(out, true, s > 0 ? 7 : -45, s > 0 ? 45 : -7, 110.95, LOWER + 0.6)
  }
  flightZ(out, -7, 7, 111, 115.5, LOWER, -16.5, 6, PAVE)
}
