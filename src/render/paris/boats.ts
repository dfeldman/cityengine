/**
 * The Seine's own boats, for the shared river traffic (render/river-traffic.ts): the bateaux-mouches with
 * their glass saloons and open top decks full of people, the Batobus under its glass roof, and a sand barge
 * low in the water with its cargo heaped in the hold.
 */
import type { MeshBuilder } from '../buildings.ts'
import { box, prism, wedge, type Rgb } from '../models.ts'
import { DARK, F, GLASS, LAUNCH, SHIRTS, WHITE, bow, passengers, rnd, type BoatKind } from '../river-traffic.ts'

/** A bateau-mouche: long and low, a glass saloon over most of it, and an open top deck with benches. */
function bateauMoucheBoat(out: MeshBuilder, seed: number): { L: number; B: number } {
  const r = rnd(seed)
  const L = 19 + r() * 5
  const B = 3.9
  const band: Rgb = r() > 0.5 ? [0.1, 0.2, 0.42] : [0.55, 0.12, 0.12]
  box(out, 0, 0.1, -0.9, B, 0.55, L - 0.9, band, F)
  box(out, 0, 0.95, -0.9, B, 0.3, L - 0.9, WHITE, F)
  bow(out, L - 1.8, B, 0.55, 0.7, WHITE)
  // the saloon: glass sides, white posts, a white roof
  const s0 = -L + 1.5
  const s1 = L - 3.5
  box(out, 0, 2.3, (s0 + s1) / 2, B - 0.15, 1.05, (s1 - s0) / 2, GLASS, F)
  for (let z = s0; z <= s1; z += 2.4) for (const s of [-1, 1]) box(out, s * (B - 0.12), 2.3, z, 0.06, 1.05, 0.08, WHITE, F)
  wedge(out, 0, 2.3, s1 + 1.2, B - 0.4, 1.05, 1.2, 0.9, GLASS, F)
  box(out, 0, 3.4, (s0 + s1) / 2, B, 0.07, (s1 - s0) / 2 + 0.2, WHITE, F)
  // the top deck: rails round it, benches in rows and the people on them, a little wheelhouse forward
  for (const s of [-1, 1]) box(out, s * (B - 0.05), 3.9, (s0 + s1) / 2, 0.04, 0.03, (s1 - s0) / 2, WHITE, F)
  for (let z = s0 + 1; z < s1 - 4; z += 1.6) for (const s of [-1, 1]) box(out, s * (B / 2), 3.62, z, B / 2 - 0.5, 0.15, 0.25, [0.45, 0.3, 0.2], F)
  passengers(out, 3.45, s0 + 1.35, s1 - 4, B - 0.9, r, 0.4, 1.6)
  box(out, 0, 4.1, s1 - 2, 1.4, 0.6, 1.2, WHITE, F)
  box(out, 0, 4.25, s1 - 0.78, 1.2, 0.3, 0.03, DARK, F)
  prism(out, 0, s1 - 2, 4.7, 5.9, 0.04, 5, WHITE, F)
  box(out, 0.28, 5.7, s1 - 2, 0.24, 0.16, 0.01, [0.1, 0.25, 0.6], F)      // the tricolore, near enough
  box(out, 0.76, 5.7, s1 - 2, 0.24, 0.16, 0.01, [0.95, 0.95, 0.95], F)
  return { L, B }
}

/** The Batobus: shorter, the whole cabin under a glass roof, green and white. */
function batobusBoat(out: MeshBuilder, seed: number): { L: number; B: number } {
  const r = rnd(seed)
  const L = 11.5
  const B = 2.9
  box(out, 0, 0.15, -0.6, B, 0.6, L - 0.6, [0.13, 0.36, 0.3], F)
  box(out, 0, 0.9, -0.6, B, 0.15, L - 0.6, WHITE, F)
  bow(out, L - 1.2, B, 0.45, 0.6, WHITE, 0.6)
  box(out, 0, 1.85, -0.5, B - 0.1, 0.8, L - 2.4, [0.28, 0.42, 0.46], F)
  wedge(out, 0, 2.95, -0.5, B - 0.1, 0.3, L - 2.4, 1.2, [0.42, 0.58, 0.62], F)
  passengers(out, 1.05, -L + 3, L - 3.5, B - 0.8, r, 0.45)
  return { L, B }
}

/** A sand barge: long, black, loaded low, the tan cargo heaped in its hold, the wheelhouse aft. */
function bargeBoat(out: MeshBuilder, seed: number): { L: number; B: number } {
  const r = rnd(seed)
  const L = 19
  const B = 2.6
  const trim: Rgb = r() > 0.5 ? [0.7, 0.14, 0.12] : [0.14, 0.32, 0.6]
  box(out, 0, 0.1, -0.6, B, 0.65, L - 0.6, DARK, F)
  box(out, 0, 0.77, -0.6, B + 0.03, 0.05, L - 0.6, trim, F)
  bow(out, L - 1.2, B, 0.35, 0.55, DARK, 0.6)
  // the hold, its coamings, the cargo heaped in piles
  for (const s of [-1, 1]) box(out, s * (B - 0.2), 1.0, 0, 0.12, 0.2, L - 7, DARK, F)
  for (let z = -L + 8; z < L - 3; z += 6) wedge(out, 0, 1.2, z, B - 0.4, 0.45, 2.8, 1.1, [0.72, 0.6, 0.42], F)
  // living quarters and the wheelhouse at the stern, a car on the deck behind it as they often carry
  box(out, 0, 1.5, -L + 3.2, B - 0.2, 0.75, 1.8, [0.9, 0.88, 0.82], F)
  box(out, 0, 2.9, -L + 3.8, 1.2, 0.65, 0.9, [0.9, 0.88, 0.82], F)
  box(out, 0, 3.05, -L + 4.72, 1.0, 0.3, 0.03, DARK, F)
  box(out, 0, 3.6, -L + 3.8, 1.3, 0.05, 1.0, trim, F)
  wedge(out, 0, 1.25, -L + 0.9, 0.85, 0.35, 1.9, 0.25, SHIRTS[Math.floor(r() * SHIRTS.length)], F)
  return { L, B }
}

const MOUCHE: BoatKind = { name: 'bateauMouche', build: bateauMoucheBoat, speed: 3.6, lane: 20 }
const BATOBUS: BoatKind = { name: 'batobus', build: batobusBoat, speed: 4.2, lane: 20 }
const BARGE: BoatKind = { name: 'barge', build: bargeBoat, speed: 2.8, lane: 20 }

/** the order they are spread along the river in: mostly sightseeing boats, some work */
export const PARIS_FLEET: BoatKind[] = [MOUCHE, MOUCHE, BATOBUS, BARGE, MOUCHE, LAUNCH, BATOBUS, BARGE, MOUCHE, LAUNCH]
