/**
 * A MARINA FULL OF BOATS (owner, 2026-10-02: Sausalito "displays with … no boats on the water"). OSM maps the
 * harbours as `leisure=marina` areas, which the bake has no kind for, so the water there was empty. Each named marina
 * is placed as a standalone entry (public/landmarks/san-francisco/marinas.json) on its own minimum rectangle, and
 * this fills it: main walkways running the long way, finger piers off them every few metres, and most slips taken —
 * sailboats with their masts (the forest of masts IS what a marina looks like from the shore), some motor launches.
 * Deterministic from the slip's position, so the same boat is in the same slip every visit.
 *
 * Frame: the water at y = 0 (placed with `deckAbove: 0`); x the long axis.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'
import { box, prism } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'

const DOCK: Rgb = [0.56, 0.52, 0.46]
const CANVAS: Rgb[] = [[0.1, 0.25, 0.45], [0.75, 0.72, 0.64], [0.12, 0.3, 0.26]]

const hash = (a: number, b: number): number => {
  const h = Math.sin(a * 127.1 + b * 311.7) * 43758.5453
  return h - Math.floor(h)
}

export function marina(out: MeshBuilder, fit: Fit): void {
  const hx = Math.max(30, fit.hx) * 0.88
  const hz = Math.max(30, fit.hz) * 0.88
  const wood = surfaceTag('concrete')
  const ROW = 34            // between main walkways: a finger and a boat each side
  const SLIP = 5.2          // between fingers
  const rows = Math.max(1, Math.floor((2 * hz) / ROW))
  // a cap so a 600 m harbour does not cost the frame: about 450 boats at most
  const budget = 450
  const slipsPerRow = Math.floor((2 * hx) / SLIP)
  const take = Math.min(0.78, budget / Math.max(1, rows * slipsPerRow * 2))
  for (let r = 0; r < rows; r++) {
    const z = -hz + ROW / 2 + r * ROW
    // the main walkway, on its floats
    box(out, 0, 0.45, z, hx, 0.15, 1.2, DOCK, wood)
    for (let k = 0; k <= slipsPerRow; k++) {
      const x = -hx + k * SLIP
      // the finger pier, both sides of the walkway
      box(out, x, 0.42, z, 0.45, 0.12, 12, DOCK, wood)
      for (const side of [-1, 1]) {
        const h = hash(x + side * 0.37, z)
        if (h > take) continue
        boat(out, x + SLIP / 2, z + side * 7.5, side)
      }
    }
    // the gangway end: a pile at each walkway's head
    for (const e of [-1, 1]) box(out, e * hx, 0.8, z, 0.3, 1.6, 0.3, [0.36, 0.32, 0.28], wood)
  }
}

/**
 * A HULL in plan: a square stern, sides running parallel for the after half, then drawn in to a pointed bow — along z,
 * the bow toward `dir` (±1), `len` long, `beam` wide, from just under the water to `deck`. White topsides with a
 * coloured boot stripe at the waterline, a pale deck. (2026-10-17: the boats were coloured boxes, red, green and blue —
 * toys; a marina is white hulls and a forest of masts.)
 */
function hull(out: MeshBuilder, bx: number, bz: number, len: number, beam: number, dir: number, deck: number, stripe: Rgb): void {
  const metal = surfaceTag('metal')
  const WHITE: Rgb = [0.93, 0.93, 0.91], DECK: Rgb = [0.84, 0.82, 0.76]
  const h = beam / 2
  // the outline, stern to bow on one side and back on the other (x across, z along, bow at +len/2 · dir)
  const half: [number, number][] = [[h * 0.9, -0.5], [h, -0.1], [h, 0.15], [h * 0.82, 0.3], [h * 0.45, 0.42], [0, 0.5]]
  const ring: [number, number][] = [...half.map(([x, z]) => [x, z] as [number, number]), ...half.slice(0, -1).reverse().map(([x, z]) => [-x, z] as [number, number])]
  const P = (x: number, z: number, y: number): [number, number, number] => [bx + x, y, bz + z * len * dir]
  const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  for (let i = 0; i < ring.length; i++) {
    const [x0, z0] = ring[i], [x1, z1] = ring[(i + 1) % ring.length]
    const nx = (z1 - z0) * len * dir, nz = -(x1 - x0) * dir
    // (the bow rises a little: the sheer)
    const d0 = deck + Math.max(0, z0) * 0.5, d1 = deck + Math.max(0, z1) * 0.5
    out.quad([P(x0, z0, -0.15), P(x1, z1, -0.15), P(x1, z1, 0.25), P(x0, z0, 0.25)], [nx, 0, nz], UV, stripe, metal)
    out.quad([P(x0, z0, 0.25), P(x1, z1, 0.25), P(x1, z1, d1), P(x0, z0, d0)], [nx, 0, nz], UV, WHITE, metal)
  }
  // the deck, a fan from the middle
  const cy = deck + 0.12
  for (let i = 0; i < ring.length; i++) {
    const [x0, z0] = ring[i], [x1, z1] = ring[(i + 1) % ring.length]
    out.quad([P(0, 0, cy), P(x0, z0, deck + Math.max(0, z0) * 0.5), P(x1, z1, deck + Math.max(0, z1) * 0.5), P(x1, z1, deck + Math.max(0, z1) * 0.5)], [0, 1, 0], UV, DECK, metal)
  }
}

/** one moored boat at (bx, bz), its bow toward `side` along z: a sailboat (mast, covered main) or a motor launch */
export function boat(out: MeshBuilder, bx: number, bz: number, side: number): void {
  const metal = surfaceTag('metal')
  const len = 7 + hash(bz, bx) * 7
  const beam = len * 0.32
  // nearly all white, a few dark-hulled; the colour is in the boot stripe and the sail covers
  const stripes: Rgb[] = [[0.12, 0.2, 0.42], [0.12, 0.2, 0.42], [0.6, 0.12, 0.1], [0.12, 0.34, 0.24], [0.1, 0.1, 0.12], [0.2, 0.45, 0.65]]
  const stripe = stripes[Math.floor(hash(bx, bz + 1) * stripes.length)]
  hull(out, bx, bz, len, beam, side, 0.75, stripe)
  if (hash(bz + 2, bx) < 0.72) {
    // a sailboat: a low coachroof, the mast, the boom with its furled main in a cover
    box(out, bx, 1.05, bz - side * len * 0.05, beam * 0.28, 0.22, len * 0.18, [0.93, 0.93, 0.91], metal)
    box(out, bx, 1.05, bz - side * len * 0.05 + side * len * 0.18, beam * 0.27, 0.12, 0.02, [0.2, 0.24, 0.28], surfaceTag('glass'))
    prism(out, bx, bz + side * len * 0.06, 1.0, 1.0 + len * 1.45, 0.07, 4, [0.78, 0.78, 0.76], metal)
    box(out, bx, 2.1, bz - side * len * 0.15, 0.17, 0.17, len * 0.21, CANVAS[Math.floor(hash(bx + 3, bz) * CANVAS.length)], metal)
  } else {
    // a motor launch: a cabin with a dark windscreen band, a flybridge on the bigger ones
    box(out, bx, 1.35, bz + side * len * 0.02, beam * 0.36, 0.55, len * 0.2, [0.94, 0.94, 0.92], metal)
    box(out, bx, 1.55, bz + side * len * 0.02, beam * 0.37, 0.2, len * 0.17, [0.18, 0.22, 0.26], surfaceTag('glass'))
    if (len > 11) box(out, bx, 2.05, bz - side * len * 0.05, beam * 0.3, 0.1, len * 0.14, [0.92, 0.92, 0.9], metal)
  }
}

/**
 * A MOORING FIELD: boats at anchor in open water, swung every which way by the tide — Richardson Bay off Sausalito,
 * where the anchor-outs and the moored sailboats are half the view from Bridgeway. Sparse, at random in the area.
 */
export function mooringField(out: MeshBuilder, fit: Fit): void {
  const hx = Math.max(40, fit.hx)
  const hz = Math.max(40, fit.hz)
  const n = Math.min(90, Math.round((hx * hz * 4) / 2600))
  for (let i = 0; i < n; i++) {
    const x = (hash(i, 1.7) * 2 - 1) * hx
    const z = (hash(i, 5.3) * 2 - 1) * hz
    // turned by the tide: build at the origin's axes, then the boat's own heading is all a box can do, so pick one of two
    boat(out, x, z, hash(i, 9.1) < 0.5 ? 1 : -1)
  }
}

/**
 * A PLAZA DECK on piles at street level (2026-10-02, owner: "behind the ferry building now seems to be underwater"):
 * Ferry Plaza is a concrete deck over the bay, which OSM maps as a pedestrian area — drawn on the flattened sea bed,
 * under the bay's water plane. Placed with `deckAbove` like the piers: the slab, its substructure down past the water,
 * a rail round the edge.
 */
export function plazaDeck(out: MeshBuilder, fit: Fit): void {
  const hx = fit.hx
  const hz = fit.hz
  const concrete = surfaceTag('concrete')
  // the paving, in broad bands of two greys (one flat colour read as a white box from any height)
  const BAND = 4
  for (let x = -hx, k = 0; x < hx - 0.01; x += BAND, k++) {
    const x1 = Math.min(hx, x + BAND)
    box(out, (x + x1) / 2, -0.25, 0, (x1 - x) / 2, 0.25, hz, k % 2 ? [0.47, 0.46, 0.44] : [0.41, 0.4, 0.39], concrete)
  }
  // the edge beam, and the PILES under it — not a solid mass: a solid block under the deck stood 3.5 m out of the
  // water as a black wall, a building on the bay (owner, 2026-10-03: "white boxes" at the ferry gates)
  for (const [x, z, lx, lz] of [[0, hz - 0.3, hx, 0.3], [0, -hz + 0.3, hx, 0.3], [hx - 0.3, 0, 0.3, hz], [-hx + 0.3, 0, 0.3, hz]] as const) {
    box(out, x, -0.9, z, lx, 0.4, lz, [0.34, 0.33, 0.32], concrete)
  }
  const P = 6
  for (let x = -hx + 1.5; x <= hx - 1.5; x += P) {
    for (let z = -hz + 1.5; z <= hz - 1.5; z += P) prism(out, x, z, -9, -0.5, 0.3, 6, [0.22, 0.21, 0.2], concrete)
  }
  for (const [x, z, lx, lz] of [[0, hz, hx, 0.04], [0, -hz, hx, 0.04], [hx, 0, 0.04, hz], [-hx, 0, 0.04, hz]] as const) {
    box(out, x, 1.0, z, lx, 0.04, lz, [0.3, 0.32, 0.33], surfaceTag('metal'))
  }
}
