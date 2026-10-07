/**
 * HARRISON STREET DOWN TO THE WATER (owner, 2026-10-07: "continue going down this street for 5 more blocks along the
 * waterfront looking for inadequately rendered buildings"). The survey (views "HW …") found these drawn generic, or
 * worse — 401 Main a brick block of BOOKS and PHARMACY shopfronts — and Mapillary shows:
 *
 *  - RED'S JAVA HOUSE, Pier 30 (way/124659443): a little white box of a burger shack, flat-roofed, its name in red on
 *    a board along the roof edge, small windows, posters on the walls.
 *  - HI DIVE, Pier 28 (way/104600008): a weathered teal clapboard house under a low gabled roof, a deck of wooden
 *    rails and umbrellas along the promenade.
 *  - 365 MAIN STREET (way/460085343, the data centre): pale grey panels in long ribbons of dark glass over a dark base.
 *  - 401–403 MAIN STREET (way/260320986): a white eight-storey condominium, balconies running round in bands.
 *  - The brick warehouse under the bridge approach on Main (relation/3493239, 16 m): brown brick, tall arched windows.
 *  - 390 FREMONT STREET (way/118229927): a grey two-storey industrial loft, big many-paned steel windows.
 *
 * Each fitted to its own outline (towerRing): local frame, the long axis x.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { tower, towerRing } from '../tower.ts'
import { sign } from '../signage.ts'
import { box, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { orientedBox, outward, type P } from './ec4-podium.ts'

const len = (r: P[], i: number): number => { const a = r[i], b = r[(i + 1) % r.length]; return Math.hypot(b.x - a.x, b.z - a.z) }
/** the ring's edges, longest first */
const byLength = (r: P[]): number[] => r.map((_, i) => i).sort((i, j) => len(r, j) - len(r, i))

export function redsJavaHouse(out: MeshBuilder, fit: Fit): void {
  const WHITE: Rgb = [0.94, 0.93, 0.9]
  tower(out, fit, {
    height: 4,
    tiers: [{ to: 1, face: { kind: 'punched', wall: WHITE, glass: [0.22, 0.26, 0.3], pitch: 2.6, floor: 4, solid: 0.62, material: 'clapboard' } }],
    crown: { kind: 'parapet', height: 0.5, colour: WHITE, material: 'clapboard' },
  })
  const ring = towerRing(fit), H = Math.min(4.5, Math.max(3.4, fit.height))
  // the name on a white board along the roof edge, both long sides
  for (const i of byLength(ring).slice(0, 2)) {
    const a = ring[i], b = ring[(i + 1) % ring.length], o = outward(ring, i), L = len(ring, i)
    const mx = (a.x + b.x) / 2 + o.x * 0.12, mz = (a.z + b.z) / 2 + o.z * 0.12
    orientedBox(out, mx, H + 0.9, mz, Math.min(L / 2 - 0.3, 4.5), 0.55, 0.06, (b.x - a.x) / L, (b.z - a.z) / L, WHITE, 0)
    sign(out, { type: 'flat', text: "RED'S JAVA HOUSE", h: 0.62, face: 'slab', colour: [0.78, 0.1, 0.1], lit: 'none' },
      { x: mx + o.x * 0.08, y: H + 0.62, z: mz + o.z * 0.08, heading: Math.atan2(o.x, o.z) })
    // and the posters
    for (const t of [0.2, 0.8]) {
      const px = a.x + (b.x - a.x) * t + o.x * 0.05, pz = a.z + (b.z - a.z) * t + o.z * 0.05
      orientedBox(out, px, 1.6, pz, 0.45, 0.6, 0.02, (b.x - a.x) / L, (b.z - a.z) / L, t < 0.5 ? [0.9, 0.75, 0.2] : [0.25, 0.4, 0.7], 0)
    }
  }
}

export function hiDive(out: MeshBuilder, fit: Fit): void {
  const TEAL: Rgb = [0.38, 0.52, 0.5]
  tower(out, fit, {
    height: 5,
    tiers: [{ to: 1, face: { kind: 'punched', wall: TEAL, glass: [0.2, 0.24, 0.26], pitch: 2.4, floor: 5, solid: 0.55, material: 'clapboard' } }],
    crown: { kind: 'hip', height: 2.2, inset: 0, colour: [0.32, 0.36, 0.36], material: 'tile' },
  })
  // the deck along the longest side: planks, posts and a rail of crossed timbers
  const ring = towerRing(fit), i = byLength(ring)[0]
  const a = ring[i], b = ring[(i + 1) % ring.length], o = outward(ring, i), L = len(ring, i), ux = (b.x - a.x) / L, uz = (b.z - a.z) / L
  const D = 3.6, WOOD: Rgb = [0.36, 0.24, 0.16]
  const cx = (a.x + b.x) / 2 + o.x * D / 2, cz = (a.z + b.z) / 2 + o.z * D / 2
  orientedBox(out, cx, 0.3, cz, L / 2, 0.3, D / 2, ux, uz, [0.5, 0.38, 0.26], surfaceTag('clapboard'))
  for (const t of [-0.5, 0.5]) orientedBox(out, cx + ux * t * L, 1.0, cz + uz * t * L, 0.06, 0.4, D / 2, ux, uz, WOOD, 0)
  const ex = cx + o.x * D / 2, ez = cz + o.z * D / 2
  orientedBox(out, ex, 1.35, ez, L / 2, 0.06, 0.06, ux, uz, WOOD, 0)
  for (let s = -L / 2; s <= L / 2 + 1e-6; s += 1.8) orientedBox(out, ex + ux * s, 0.95, ez + uz * s, 0.06, 0.35, 0.06, ux, uz, WOOD, 0)
  // umbrellas
  for (const t of [-0.3, 0.05, 0.4]) {
    const x = cx + ux * t * L, z = cz + uz * t * L
    box(out, x, 1.5, z, 0.04, 0.9, 0.04, [0.25, 0.25, 0.25], 0)
    box(out, x, 2.45, z, 1.1, 0.08, 1.1, [0.85, 0.3, 0.2], 0)
  }
}

export function main365(out: MeshBuilder, fit: Fit): void {
  const GREY: Rgb = [0.82, 0.83, 0.83]
  tower(out, fit, {
    height: 34,
    base: { height: 5, face: { kind: 'curtain', wall: [0.2, 0.21, 0.22], glass: [0.16, 0.2, 0.24], pitch: 3, floor: 5, material: 'metal' } },
    tiers: [{ to: 1, face: { kind: 'bands', wall: GREY, glass: [0.2, 0.26, 0.3], floor: 4.8, solid: 0.6, material: 'metal' } }],
    crown: { kind: 'parapet', height: 1.2, colour: GREY, material: 'metal' },
    penthouse: 3,
  })
}

export function main401(out: MeshBuilder, fit: Fit): void {
  const WHITE: Rgb = [0.94, 0.94, 0.92]
  tower(out, fit, {
    height: 26,
    base: { height: 4, face: { kind: 'punched', wall: [0.78, 0.78, 0.76], glass: [0.2, 0.25, 0.28], pitch: 3, floor: 4, solid: 0.45, material: 'concrete' } },
    tiers: [{ to: 1, face: { kind: 'bands', wall: WHITE, glass: [0.36, 0.46, 0.52], floor: 2.95, solid: 0.5, material: 'stucco' } }],
    crown: { kind: 'parapet', height: 1, colour: WHITE, material: 'stucco' },
  })
  // the balcony slabs running round, a thin rail on each
  const ring = towerRing(fit)
  for (let y = 4 + 2.95; y < fit.height - 1; y += 2.95) {
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i], b = ring[(i + 1) % ring.length], o = outward(ring, i), L = len(ring, i)
      if (L < 3) continue
      const ux = (b.x - a.x) / L, uz = (b.z - a.z) / L, mx = (a.x + b.x) / 2 + o.x * 0.7, mz = (a.z + b.z) / 2 + o.z * 0.7
      orientedBox(out, mx, y - 0.1, mz, L / 2 + 0.6, 0.1, 0.7, ux, uz, WHITE, surfaceTag('concrete'))
      orientedBox(out, mx + o.x * 0.65, y + 0.45, mz + o.z * 0.65, L / 2 + 0.6, 0.45, 0.03, ux, uz, [0.55, 0.62, 0.66], surfaceTag('glass'))
    }
  }
}

export function mainBrickWarehouse(out: MeshBuilder, fit: Fit): void {
  const BRICK: Rgb = [0.42, 0.3, 0.22]
  tower(out, fit, {
    height: 16,
    tiers: [{ to: 1, face: { kind: 'punched', wall: BRICK, glass: [0.2, 0.22, 0.22], pitch: 3.4, floor: 5.2, solid: 0.6, arched: true, material: 'brick' } }],
    cornices: [{ at: 0.33, depth: 0.15, colour: [0.5, 0.38, 0.28] }],
    crown: { kind: 'parapet', height: 1.2, colour: [0.38, 0.27, 0.2], material: 'brick' },
  })
}

export function fremont390(out: MeshBuilder, fit: Fit): void {
  const GREY: Rgb = [0.6, 0.62, 0.61]
  tower(out, fit, {
    height: 8.5,
    tiers: [{ to: 1, face: { kind: 'punched', wall: GREY, glass: [0.26, 0.3, 0.32], pitch: 3.8, floor: 4.1, solid: 0.3, material: 'concrete' } }],
    crown: { kind: 'parapet', height: 0.9, colour: GREY, material: 'concrete' },
  })
  // the muntins across every window, and the red banner on the long side
  const ring = towerRing(fit)
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], o = outward(ring, i), L = len(ring, i)
    if (L < 4) continue
    const ux = (b.x - a.x) / L, uz = (b.z - a.z) / L
    for (let f = 0; f < 2; f++) for (const dy of [0.36, 0.66]) {
      orientedBox(out, (a.x + b.x) / 2 + o.x * 0.05, f * 4.1 + 4.1 * (0.14 + 0.72 * dy), (a.z + b.z) / 2 + o.z * 0.05, L / 2 - 0.4, 0.03, 0.03, ux, uz, GREY, 0)
    }
  }
  const i = byLength(ring)[0], a = ring[i], b = ring[(i + 1) % ring.length], o = outward(ring, i), L = len(ring, i)
  orientedBox(out, a.x + (b.x - a.x) * 0.7 + o.x * 0.08, 5.6, a.z + (b.z - a.z) * 0.7 + o.z * 0.08, 2.2, 0.9, 0.04, (b.x - a.x) / L, (b.z - a.z) / L, [0.8, 0.12, 0.12], 0)
}

export const HARRISON_WATERFRONT: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  redsJavaHouse, hiDive, main365, main401, mainBrickWarehouse, fremont390,
}
