/**
 * The monument in the middle of the place (owner, 2026-10-29: "almost every plaza has a roundabout with a monument in the
 * center. there are so many monuments that many aren't even named on google maps and don't seem very noteworthy"): at the
 * centre of each roundabout the bake found (CityPackage.roundabouts, from OSM's junction=roundabout rings) of 18 m or more
 * across its ring, unless a modelled landmark already stands there (the Bastille's column, the Étoile's arch), one of the
 * place monuments Paris is full of — a column with its statue, a statue on its pedestal, a fountain basin round a vase, an
 * obelisk — by the place's own position, in stone and bronze, on a planted island.
 */
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import type { Scene } from '@babylonjs/core/scene'
import { MeshBuilder } from '../buildings.ts'
import { box, prism, type Rgb } from '../models.ts'
import { cartoonMaterial } from '../cartoon-material.ts'

const FIXED = 0
const STONE: Rgb = [0.84, 0.81, 0.74]
const DARK_STONE: Rgb = [0.66, 0.63, 0.57]
const BRONZE: Rgb = [0.3, 0.34, 0.28]
const GILT: Rgb = [0.78, 0.62, 0.26]
// (darker than it looks: under the cartoon light the first value came out lime beside the city's own lawns, Place d'Italie 2026-10-30)
const GRASS: Rgb = [0.24, 0.36, 0.19]
const WATER: Rgb = [0.34, 0.48, 0.56]

/** a standing figure of `h` metres at (x, y, z): the body, the head, an arm raised or not */
function figure(out: MeshBuilder, x: number, y: number, z: number, h: number, c: Rgb, raised: boolean): void {
  prism(out, x, z, y, y + h * 0.55, h * 0.13, 8, c, FIXED, h * 0.09)
  prism(out, x, z, y + h * 0.55, y + h * 0.82, h * 0.09, 8, c, FIXED, h * 0.07)
  prism(out, x, z, y + h * 0.82, y + h, h * 0.065, 8, c)
  if (raised) box(out, x + h * 0.08, y + h * 1.0, z, h * 0.025, h * 0.2, h * 0.025, c, FIXED)
}

function monument(out: MeshBuilder, x: number, y: number, z: number, r: number, kind: number): void {
  // the island: a low kerb and its lawn, a little inside the ring's carriageway
  const isl = Math.max(4, Math.min(r - 9, 30))
  prism(out, x, z, y, y + 0.2, isl, 16, DARK_STONE)
  prism(out, x, z, y + 0.2, y + 0.24, isl - 0.4, 16, GRASS)
  if (kind === 0) {
    // a column: the stepped base, the shaft, the capital and the figure on top (gilt, like the Bastille's genius)
    prism(out, x, z, y, y + 1.2, 3.2, 4, STONE)
    prism(out, x, z, y + 1.2, y + 4, 2.2, 4, STONE)
    prism(out, x, z, y + 4, y + 22, 1.1, 12, DARK_STONE, FIXED, 0.95)
    prism(out, x, z, y + 22, y + 23, 1.5, 4, STONE)
    figure(out, x, y + 23, z, 3.6, GILT, true)
  } else if (kind === 1) {
    // a statue on its pedestal: the plinth, the cornice, the bronze figure, two lamps
    prism(out, x, z, y, y + 0.6, 3.0, 4, STONE)
    prism(out, x, z, y + 0.6, y + 4.4, 1.8, 4, STONE)
    prism(out, x, z, y + 4.4, y + 4.8, 2.1, 4, DARK_STONE)
    figure(out, x, y + 4.8, z, 3.4, BRONZE, false)
    for (const s of [-1, 1]) {
      prism(out, x + s * 3.4, z, y, y + 3.6, 0.12, 8, BRONZE)
      prism(out, x + s * 3.4, z, y + 3.6, y + 4.1, 0.28, 8, [0.95, 0.9, 0.7], 0.5)
    }
  } else if (kind === 2) {
    // a fountain: the basin and its water, a vase on a pedestal spilling into it
    const R = Math.min(isl - 1, 8)
    prism(out, x, z, y, y + 0.8, R, 20, STONE)
    prism(out, x, z, y + 0.6, y + 0.72, R - 0.4, 20, WATER)
    prism(out, x, z, y, y + 2.6, 1.0, 8, STONE)
    prism(out, x, z, y + 2.6, y + 3.0, 2.2, 12, STONE, FIXED, 1.4)
    prism(out, x, z, y + 2.9, y + 3.0, 1.9, 12, WATER)
    prism(out, x, z, y + 3.0, y + 4.2, 0.4, 8, STONE, FIXED, 0.6)
  } else {
    // an obelisk on its stepped base, the tip gilt
    prism(out, x, z, y, y + 1.0, 2.6, 4, STONE)
    prism(out, x, z, y + 1.0, y + 3.0, 1.6, 4, DARK_STONE)
    prism(out, x, z, y + 3.0, y + 17, 0.9, 4, [0.78, 0.68, 0.56], FIXED, 0.55)
    prism(out, x, z, y + 17, y + 18.2, 0.55, 4, GILT, FIXED, 0.02)
  }
}

/*
 * Roundabouts that are open ground and must stay so, in the city's metres: the ring of paths in the middle of the Champ de Mars, whose gilded
 * column (kind 0, from the hash) stood dead on the axis of every view of the Eiffel Tower from the École Militaire (top-25 audit, 2026-10-30).
 */
const OPEN: [number, number][] = [[-2496, -492]]

export function roundaboutMonuments(scene: Scene, rings: { x: number; z: number; r: number }[], groundAt: (x: number, z: number) => number,
  taken: (x: number, z: number, r: number) => boolean): Mesh | null {
  const out = new MeshBuilder()
  for (const ring of rings) {
    if (ring.r < 18 || taken(ring.x, ring.z, ring.r) || OPEN.some(([x, z]) => Math.hypot(ring.x - x, ring.z - z) < 25)) continue
    const h = (Math.imul(Math.round(ring.x * 10) ^ Math.imul(Math.round(ring.z * 10), 0x27d4eb2d), 0x9e3779b1) >>> 0)
    // (columns and statues the commonest, then the fountains, the odd obelisk)
    const pick = h % 20
    const kind = pick < 7 ? 0 : pick < 14 ? 1 : pick < 18 ? 2 : 3
    monument(out, ring.x, groundAt(ring.x, ring.z), ring.z, ring.r, kind)
  }
  if (out.triangles === 0) return null
  const m = new Mesh('roundaboutMonuments', scene)
  out.toVertexData().applyToMesh(m)
  m.material = cartoonMaterial(scene, 'cartoonLandmark', false)
  m.renderingGroupId = 3
  m.isPickable = false
  m.freezeWorldMatrix()
  return m
}
