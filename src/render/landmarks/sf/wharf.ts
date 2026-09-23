/**
 * Fisherman's Wharf (SF_PLAN.md §4): what a rider knows it by.
 *
 * - **the crab sign** at Jefferson and Taylor: a ship's wheel of a sign on its post, a red crab on the white disc in
 *   the middle, "FISHERMAN'S WHARF" round a blue ring, the wheel's spokes and handles round the rim. The one photo
 *   everyone takes;
 * - **the Ghirardelli sign**: the tall white letters on their frame over the square's clock-tower block, red lit at
 *   night — a standalone model set on the roof.
 *
 * Local frames: the sign's face toward −z, its foot at the origin.
 */
import type { MeshBuilder } from '../../buildings.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { beam } from './golden-gate.ts'
import type { Fit } from '../fit.ts'
import { signText } from '../parts.ts'
import { surfaceTag } from '../../cartoon-material.ts'

type V3 = [number, number, number]
const RED: Rgb = [0.78, 0.16, 0.12]
const BLUE: Rgb = [0.14, 0.3, 0.6]
const WHITE: Rgb = [0.94, 0.94, 0.9]
const WOOD: Rgb = [0.55, 0.36, 0.2]
const STEEL: Rgb = [0.3, 0.32, 0.34]

/** A flat ring (or disc, r0 = 0) in the x–y plane at z, facing −z. */
function ring(out: MeshBuilder, cx: number, cy: number, z: number, r0: number, r1: number, c: Rgb, n = 32): void {
  // (never a zero inner radius: a quad with two corners at one point is wound by a degenerate edge, and faced away)
  r0 = Math.max(r0, 0.02)
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2
    const a1 = ((i + 1) / n) * Math.PI * 2
    const P = (a: number, r: number): V3 => [cx + Math.cos(a) * r, cy + Math.sin(a) * r, z]
    out.quad([P(a0, r0), P(a1, r0), P(a1, r1), P(a0, r1)], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], c, 0)
    // and the back, so it is a sign from both sides
    const Q = (a: number, r: number): V3 => [cx + Math.cos(a) * r, cy + Math.sin(a) * r, z + 0.3]
    out.quad([Q(a1, r0), Q(a0, r0), Q(a0, r1), Q(a1, r1)], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]], c, 0)
  }
}

export function wharfSign(out: MeshBuilder, _fit?: Fit): void {
  const cy = 5.2
  // the post and its base
  prism(out, 0, 0.15, 0, cy - 2, 0.18, 8, STEEL, 0)
  box(out, 0, 0.3, 0.15, 0.6, 0.3, 0.6, [0.6, 0.6, 0.58], 0)
  // the wheel: its rim, the blue lettered ring, the white disc, the crab
  ring(out, 0, cy, 0, 2.05, 2.3, WOOD)
  ring(out, 0, cy, -0.02, 1.35, 2.05, BLUE)
  ring(out, 0, cy, -0.02, 0, 1.35, WHITE)
  // the letters round the ring: small white blocks, which at the distance a rider sees them are the words
  for (let i = 0; i < 22; i++) {
    const a = Math.PI * 0.95 - (i / 21) * Math.PI * 0.9
    box(out, Math.cos(a) * 1.72, cy + Math.sin(a) * 1.72, -0.05, 0.1, 0.14, 0.01, WHITE, 0)
    const b = -Math.PI * 0.2 - (i / 21) * Math.PI * 0.6
    if (i < 12) box(out, Math.cos(b) * 1.72, cy + Math.sin(b) * 1.72, -0.05, 0.1, 0.14, 0.01, WHITE, 0)
  }
  // (the legs are flat strokes on the sign: a beam's width is its depth here, its height its breadth)
  // the crab, filling the disc: its broad shell, four legs a side spread down and out, the two claws raised
  ring(out, 0, cy - 0.05, -0.06, 0, 0.62, RED, 20)
  for (const s of [-1, 1]) {
    for (let k = 0; k < 4; k++) {
      const a = -0.25 - k * 0.32                        // each leg further down than the last
      const knee: V3 = [s * (0.55 + Math.cos(a) * 0.35), cy - 0.05 + Math.sin(a) * 0.35, -0.07]
      const foot: V3 = [s * (0.7 + Math.cos(a - 0.5) * 0.5), cy - 0.05 + Math.sin(a - 0.5) * 0.55, -0.07]
      beam(out, [s * 0.5, cy - 0.1 - k * 0.06, -0.07], knee, 0.02, 0.13, RED)
      beam(out, knee, foot, 0.02, 0.1, RED)
    }
    // the claw: an arm up and out, and the pincer
    const elbow: V3 = [s * 0.75, cy + 0.45, -0.07]
    beam(out, [s * 0.35, cy + 0.35, -0.07], elbow, 0.02, 0.16, RED)
    beam(out, elbow, [s * 0.55, cy + 0.95, -0.07], 0.02, 0.26, RED)
    beam(out, elbow, [s * 0.85, cy + 0.9, -0.07], 0.02, 0.17, RED)
  }
  // the spokes and handles, past the rim
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8
    const x = Math.cos(a)
    const y = Math.sin(a)
    box(out, x * 2.55, cy + y * 2.55, 0.15, 0.12 + Math.abs(y) * 0.2, 0.12 + Math.abs(x) * 0.2, 0.12, WOOD, 0)
  }
}

export function ghirardelliSign(out: MeshBuilder, _fit?: Fit): void {
  /*
   * The sign on the roof of Ghirardelli Square, rebuilt from a photograph 2026-09-22.
   *
   * Two things about it that the first version got wrong, and that anyone would guess wrong:
   *
   * 1. The letters are SOLID metal panels — pale grey by day — not bulbs. (It is outlined in bulbs at night,
   *    but the shapes you read are the letters themselves.) The old version drew each letter as two uprights
   *    and a bar, which reads as a fence.
   * 2. Half of what you see is the SCAFFOLD. The letters stand on a deep open lattice of criss-crossed steel
   *    braces, as tall again as the letters and quite transparent against the sky. That lattice is as much the
   *    landmark as the word is; without it the sign looks painted onto the roof.
   *
   * The real sign is in mixed case — a capital G and lowercase after it. The shared glyph font is capitals
   * only, so this spells it in capitals; at the distance you see it from the bay, the silhouette and the
   * lattice carry the recognition.
   */
  const LETTER = 5.0
  const span = 46
  const deck = 9.5
  const STEEL_D: Rgb = [0.42, 0.43, 0.45]
  // the lattice: uprights, top and bottom rails, and the diagonals that make it read as a truss
  const bays = 12
  for (let i = 0; i <= bays; i++) {
    const x = -span / 2 + (i * span) / bays
    box(out, x, deck / 2, 0, 0.1, deck / 2, 0.1, STEEL_D, 0)
    if (i === bays) continue
    const x2 = -span / 2 + ((i + 1) * span) / bays
    // real crossed diagonals: `beam` runs a strut between two points in 3D, which `boxAlong` cannot do — it
    // only turns in plan, so a brace built from it comes out as a ladder of horizontal rungs
    for (const [y0, y1] of [[0.4, deck - 0.4], [deck - 0.4, 0.4]] as const) {
      beam(out, [x, y0, 0], [x2, y1, 0], 0.07, 0.07, STEEL_D, false)
    }
  }
  for (const y of [0.35, deck - 0.35]) box(out, 0, y, 0, span / 2, 0.1, 0.12, STEEL_D, 0)
  // and the letters standing on top of it, solid panels on their own short posts
  for (let i = 0; i <= bays; i += 2) {
    const x = -span / 2 + (i * span) / bays
    box(out, x, deck + LETTER / 2, 0.25, 0.07, LETTER / 2, 0.07, STEEL_D, 0)
  }
  signText(out, 'GHIRARDELLI', 0, deck + LETTER / 2 + 0.4, 0.1, LETTER, [0.78, 0.79, 0.8], { tag: surfaceTag('metal') })
}
