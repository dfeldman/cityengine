/**
 * ROCKY CLIFFS (owner, 2026-10-03: "need to work more on the nature around the sutro baths trail. it is rocky cliffs,
 * not grass. it's the ONLY area of rocky cliffs in the game"). In a zone with `cliffs: true` (data/zones/<city>.json:
 * Lands End and the Sutro Baths), the ground steeper than about 20° (see STEEP), and a ragged strip along the water's edge, are bare rock: the steep cells of a 2 m grid are
 * drawn over the grass in weathered greys and browns, each face shaded by its own slope, and boulders lie scattered at
 * the cliffs' feet and on their ledges. The grass stays where the ground is gentle enough to hold it.
 */
import type { Scene } from '@babylonjs/core/scene'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { MeshBuilder } from './buildings.ts'
import { prism, type Rgb } from './models.ts'
import { cartoonMaterial, surfaceTag } from './cartoon-material.ts'
import type { Terrain } from '../city/terrain.ts'
import type { TileLayer } from './city.ts'
import { inRing } from '../map/zones.ts'
import { unpackPoints } from '../city/package.ts'
import { inside } from '../city/park-planting.ts'

interface Zone { ring: number[]; bbox: [number, number, number, number]; props: { cliffs?: boolean } }

const STEP = 2
/**
 * The slope (rise over run) above which ground is rock: tan 20°. Not the 37° of a real cliff: the terrain is a
 * smoothed elevation model, and the Sutro Baths' cliffs come out of it at twenty to thirty degrees — at 37° only one
 * cell in fifty qualified, most of them the sea floor, and the cliffs stayed lawn (2026-10-03).
 */
const STEEP = 0.36
/**
 * …and the shore: within this many metres of the water's edge the ground is rock whatever its slope. Measured
 * across, not up — a band by height above the sea rocked the whole flat floor of the Baths' basin. Lands End
 * meets the sea in rock everywhere; the elevation model just does not have the cliff.
 */
const SHORE = 18
const AROUND = Array.from({ length: 12 }, (_, i) => [Math.cos((i / 12) * Math.PI * 2), Math.sin((i / 12) * Math.PI * 2)])
/** the rock: a dark weathered grey-brown (serpentine and greywacke), lighter and darker in patches several metres
 * across rather than cell by cell — a colour per 2 m cell read as a beige chequerboard */
const ROCK: Rgb = [0.25, 0.245, 0.235]
const BOULDERS: Rgb[] = [[0.3, 0.29, 0.27], [0.36, 0.34, 0.31], [0.24, 0.23, 0.22]]

const hash = (a: number, b: number): number => {
  const h = Math.imul(Math.imul(Math.floor(a) ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(Math.floor(b), 0xc2b2ae35), 0x27d4eb2d) >>> 0
  return h / 4294967296
}
/** smooth value noise, 0..1, a feature every `scale` metres */
const patch = (x: number, z: number, scale: number): number => {
  const gx = x / scale, gz = z / scale
  const ix = Math.floor(gx), iz = Math.floor(gz)
  const fx = gx - ix, fz = gz - iz
  const sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz)
  const a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1)
  return (a + (b - a) * sx) + ((c + (d - c) * sx) - (a + (b - a) * sx)) * sz
}

export function cliffsLayer(scene: Scene, zones: Zone[], terrain: Terrain, sea: number | null | undefined): TileLayer | null {
  const cliffs = zones.filter((z) => z.props.cliffs)
  if (!cliffs.length) return null
  return {
    name: 'cliffs',
    range: 2,
    build(near, rect) {
      const here = cliffs.filter((zn) => zn.bbox[0] < rect.x1 && zn.bbox[2] > rect.x0 && zn.bbox[1] < rect.z1 && zn.bbox[3] > rect.z0)
      if (!here.length) return []
      // the WATER as drawn (the mapped coastline's areas, this tile's and its neighbours'), not the terrain under
      // the sea level: the elevation model's coast and OSM's do not agree, and a band measured on the terrain
      // came out as a pale rock line out in the water with the lawn running down to the real edge
      const water = [...near.tile.areas, ...near.around.areas].filter((a) => a.kind === 'water')
        .map((a) => ({ ring: unpackPoints(a.ring), holes: (a.holes ?? []).map(unpackPoints) }))
      const wet = (x: number, z: number): boolean =>
        water.some((w) => inside(w.ring, x, z) && !w.holes.some((h) => inside(h, x, z)))
      // the ways here, so no boulder lies on a path (Alcatraz's Agave Trail ran through one — BUGS.md #263)
      const ways = [...near.tile.edges, ...near.around.edges].map((e) => unpackPoints(e.points))
      const onWay = (x: number, z: number, r: number): boolean => ways.some((p) => {
        for (let i = 1; i < p.length; i++) {
          const a = p[i - 1], b = p[i], dx = b.x - a.x, dz = b.z - a.z, L2 = dx * dx + dz * dz || 1e-6
          const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / L2))
          if (Math.hypot(x - a.x - dx * t, z - a.z - dz * t) < r) return true
        }
        return false
      })
      const out = new MeshBuilder()
      const rock = surfaceTag('granite')
      for (let x = rect.x0; x < rect.x1; x += STEP) {
        for (let z = rect.z0; z < rect.z1; z += STEP) {
          const cx = x + STEP / 2, cz = z + STEP / 2
          if (!here.some((zn) => inRing(zn.ring, cx, cz))) continue
          // the RAW ground, as the grass under the rock is draped (city.ts `drapeRaw`): `heightAt` lifts to a graded road's
          // level near it, and on Alcatraz's switchback roads the rock stood up to the road and hung over the lawn below
          // in dark saw-teeth (2026-10-05)
          const h00 = terrain.rawHeightAt(x, z), h10 = terrain.rawHeightAt(x + STEP, z)
          const h01 = terrain.rawHeightAt(x, z + STEP), h11 = terrain.rawHeightAt(x + STEP, z + STEP)
          const gx = ((h10 - h00) + (h11 - h01)) / (2 * STEP), gz = ((h01 - h00) + (h11 - h10)) / (2 * STEP)
          const slope = Math.hypot(gx, gz)
          const low = Math.min(h00, h01, h10, h11)
          // never under the water: the sea floor falls away steeply
          if ((sea != null && Math.max(h00, h01, h10, h11) < sea + 0.3) || wet(cx, cz)) continue
          // (a little ragged at the edge of the rock: not every cell at the threshold)
          const ragged = 0.85 + 0.3 * hash(cx * 3, cz * 7)
          if (slope < STEEP * ragged) {
            if (!water.length) continue
            const reach = SHORE * (0.6 + 0.8 * patch(cx + 900, cz, 25))
            if (!AROUND.some(([dx, dz]) => wet(cx + dx * reach, cz + dz * reach))) continue
          }
          const n = [-gx, 1, -gz]
          const L = Math.hypot(n[0], n[1], n[2])
          const v = 0.8 + 0.3 * patch(cx, cz, 9) + 0.12 * patch(cx + 500, cz, 3)
          const c: Rgb = [ROCK[0] * v, ROCK[1] * v, ROCK[2] * v * 0.97]
          // shaded by its own slope (darker the steeper), and lifted a hand over the grass, a little more the steeper
          const k = 1 - Math.min(0.25, Math.max(0, slope - STEEP) * 0.3)
          const lift = 0.12 + Math.min(0.4, slope * 0.1)
          out.quad([[x, h00 + lift, z], [x, h01 + lift, z + STEP], [x + STEP, h11 + lift, z + STEP], [x + STEP, h10 + lift, z]],
            [n[0] / L, n[1] / L, n[2] / L], [[0, 0], [0, 1], [1, 1], [1, 0]], [c[0] * k, c[1] * k, c[2] * k], rock)
          // a boulder now and then, on the ledges and at the feet
          if (hash(cx * 11, cz * 13) < 0.06 && !onWay(cx, cz, 3.5)) {
            const r = 0.4 + hash(cx * 5, cz * 3) * 0.9
            const y = low
            prism(out, cx, cz, y - 0.2, y + r * 1.2, r, 5 + Math.floor(hash(cz, cx) * 3), BOULDERS[Math.floor(hash(cz * 2, cx) * BOULDERS.length)], rock, r * 0.6)
          }
        }
      }
      if (out.triangles === 0) return []
      const m = new Mesh(`cliffs:${rect.x0},${rect.z0}`, scene)
      out.toVertexData().applyToMesh(m)
      const mat = cartoonMaterial(scene, 'cartoonStatic', false)
      m.material = mat
      m.renderingGroupId = 3
      m.isPickable = false
      m.freezeWorldMatrix()
      return [m]
    },
  }
}
