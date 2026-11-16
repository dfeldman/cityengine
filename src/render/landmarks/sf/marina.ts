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
import { MeshBuilder } from '../../buildings.ts'
import { motorYacht, sailboat, speedboat } from '../../sf/moored.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'
import { box, prism } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'

const DOCK: Rgb = [0.56, 0.52, 0.46]

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
        boat(out, x + SLIP / 2, z + side * 7.5, side > 0 ? 0 : Math.PI)
      }
    }
    // the gangway end: a pile at each walkway's head
    for (const e of [-1, 1]) box(out, e * hx, 0.8, z, 0.3, 1.6, 0.3, [0.36, 0.32, 0.28], wood)
  }
}

/** the marina's mix of small craft, by share (render/sf/moored.ts) */
const MARINA_MIX = { sail: 0.7, motor: 0.9 }
/** boat lengths in a slip, m */
const MARINA_LEN: [number, number] = [7, 14]

/**
 * One moored boat at (bx, bz), turned `angle` about y (0: bow to +z): mostly sailboats, then motor yachts and speedboats,
 * from the shared small-craft library. Its untagged faces are retagged metal, or the landmark material dresses pale
 * hulls as ashlar (pale-faces-go-stone).
 */
export function boat(out: MeshBuilder, bx: number, bz: number, angle: number, seed = Math.floor(hash(bx, bz) * 1e6)): void {
  const h = hash(bz, bx)
  const L = MARINA_LEN[0] + h * (MARINA_LEN[1] - MARINA_LEN[0])
  const k = hash(bx + 7, bz)
  const part = new MeshBuilder()
  if (k < MARINA_MIX.sail) sailboat(part, L, L * 0.32, seed)
  else if (k < MARINA_MIX.motor) motorYacht(part, L, L * 0.34, seed)
  else speedboat(part, Math.min(L, 8), 2.3, seed)
  const metal = surfaceTag('metal')
  const c = Math.cos(angle), s = Math.sin(angle)
  const base = out.positions.length / 3
  for (let i = 0; i < part.positions.length; i += 3) {
    const x = part.positions[i], z = part.positions[i + 2]
    out.positions.push(bx + x * c + z * s, part.positions[i + 1], bz - x * s + z * c)
    const nx = part.normals[i], nz = part.normals[i + 2]
    out.normals.push(nx * c + nz * s, part.normals[i + 1], -nx * s + nz * c)
  }
  for (let i = 0; i < part.colors.length; i += 4) out.colors.push(part.colors[i], part.colors[i + 1], part.colors[i + 2], part.colors[i + 3] === 0 ? metal : part.colors[i + 3])
  for (const v of part.uvs) out.uvs.push(v)
  for (const i of part.indices) out.indices.push(base + i)
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
    // swung every which way by the tide
    boat(out, x, z, hash(i, 9.1) * Math.PI * 2)
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
