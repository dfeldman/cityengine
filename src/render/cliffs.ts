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
import type { Rgb } from './models.ts'
import { surfaceTag } from './cartoon-material.ts'
import { rockMaterial } from './rock-material.ts'
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
/** the rock's tint over its texture (render/rock-material.ts), lighter and darker in patches several metres across */
const ROCK: Rgb = [0.6, 0.59, 0.57]
/** the jointed blocks standing out of the steep ground: one candidate every so many metres, and the share placed */
const BLOCK_STEP = 2.4
const BLOCK_SHARE = 0.8

/**
 * A block of rock: a box turned `yaw` about the vertical, its local +z pointing down the slope, from `y0` up to `y1`,
 * `hx` along the contour and `hz` into the slope. The faces are upright and the top level, which is what JOINTED rock
 * is — greywacke breaks along its bedding and its joints into blocks and ledges, and a slope of such blocks reads as
 * a crag where a smooth 37° ramp reads as a lawn painted grey.
 */
function block(out: MeshBuilder, cx: number, cz: number, y0: number, y1: number, hx: number, hz: number, yaw: number, tint: Rgb, tag: number): void {
  const c = Math.cos(yaw), s = Math.sin(yaw)
  // local (x, z) to world: +z is (sin yaw, cos yaw), +x is (cos yaw, −sin yaw)
  const P = (lx: number, y: number, lz: number): [number, number, number] => [cx + lx * c + lz * s, y, cz - lx * s + lz * c]
  const N = (lx: number, ly: number, lz: number): [number, number, number] => [lx * c + lz * s, ly, -lx * s + lz * c]
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  // the top a little lighter (weathered, lit), the sides as given
  const top: Rgb = [tint[0] * 1.08, tint[1] * 1.08, tint[2] * 1.06]
  // broken, not sawn: each top corner at its own height, the top drawn in a little (the edges spalled off), the front
  // leaning back a touch, so no two blocks are the same box
  const j = (k: number): number => { const v = Math.sin(cx * 12.9898 + cz * 78.233 + k * 37.719) * 43758.5453; return v - Math.floor(v) }
  const H = y1 - y0
  const t = [y1 - j(1) * H * 0.18, y1 - j(2) * H * 0.18, y1 - j(3) * H * 0.18, y1 - j(4) * H * 0.18]
  const ix = hx * (0.78 + 0.15 * j(5)), iz = hz * (0.75 + 0.15 * j(6)), lean = hz * 0.15 * j(7)
  const b = [P(-hx, y0, -hz), P(hx, y0, -hz), P(hx, y0, hz), P(-hx, y0, hz)]
  const u = [P(-ix, t[0], -iz), P(ix, t[1], -iz), P(ix, t[2], iz - lean), P(-ix, t[3], iz - lean)]
  const face = (a: [number, number, number], bb: [number, number, number], cc: [number, number, number], d: [number, number, number], colour: Rgb): void => {
    // the normal from the quad itself (it is not axis-aligned now)
    const e1 = [bb[0] - a[0], bb[1] - a[1], bb[2] - a[2]], e2 = [d[0] - a[0], d[1] - a[1], d[2] - a[2]]
    const n: [number, number, number] = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]
    const L = Math.hypot(n[0], n[1], n[2]) || 1
    // outward: away from the block's middle
    const mx = (a[0] + cc[0]) / 2 - cx, mz = (a[2] + cc[2]) / 2 - cz, my = (a[1] + cc[1]) / 2 - (y0 + y1) / 2
    const sgn = n[0] * mx + n[1] * my + n[2] * mz < 0 ? -1 : 1
    out.quad([a, bb, cc, d], [sgn * n[0] / L, sgn * n[1] / L, sgn * n[2] / L], uv, colour, tag)
  }
  face(u[0], u[1], u[2], u[3], top)
  face(b[3], b[2], u[2], u[3], tint)
  face(b[1], b[0], u[0], u[1], tint)
  face(b[2], b[1], u[1], u[2], tint)
  face(b[0], b[3], u[3], u[0], tint)
  void N
}

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
      // (with their half-widths: the rock and the crags keep off a path's own width, not only its centreline — the
      // trail under the Cliff House went "underground" under the new crags, owner 2026-10-06)
      const ways = [...near.tile.edges, ...near.around.edges].map((e) => ({ p: unpackPoints(e.points), half: (e.width ?? 2) / 2 + (e.walk ?? 0) }))
      const onWay = (x: number, z: number, r: number): boolean => ways.some(({ p, half }) => {
        for (let i = 1; i < p.length; i++) {
          const a = p[i - 1], b = p[i], dx = b.x - a.x, dz = b.z - a.z, L2 = dx * dx + dz * dz || 1e-6
          const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / L2))
          if (Math.hypot(x - a.x - dx * t, z - a.z - dz * t) < r + half) return true
        }
        return false
      })
      const out = new MeshBuilder()
      const rock = surfaceTag('granite')
      const wideSlope = (x: number, z: number): number => Math.hypot(
        (terrain.rawHeightAt(x + 5, z) - terrain.rawHeightAt(x - 5, z)) / 10,
        (terrain.rawHeightAt(x, z + 5) - terrain.rawHeightAt(x, z - 5)) / 10)
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
          // (the slope that decides rock is taken over ±5 m: on the lidar's 4 m ground every bump and terrace step read as a
          //  cliff at ±1 m, and the headland at Sutro Baths was carpeted in rock — 2026-10-07)
          const slope = wideSlope(cx, cz)
          const low = Math.min(h00, h01, h10, h11)
          // never under the water: the sea floor falls away steeply; and never over a path (a cell is 2 m: its middle
          // within a metre and a half of the path's edge would lap onto it)
          if ((sea != null && Math.max(h00, h01, h10, h11) < sea + 0.3) || wet(cx, cz) || onWay(cx, cz, 1.5)) continue
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
          if (hash(cx * 11, cz * 13) < 0.06 && !onWay(cx, cz, 2.2)) {
            const r = 0.4 + hash(cx * 5, cz * 3) * 0.9
            const t = 0.5 + 0.2 * hash(cz * 2, cx)
            block(out, cx, cz, low - 0.3, low + r * (0.8 + hash(cz, cx) * 0.8), r, r * (0.6 + 0.5 * hash(cx, cz * 9)), hash(cx * 7, cz) * Math.PI, [t, t * 0.98, t * 0.95], rock)
          }
        }
      }
      // THE CRAGS: jointed blocks standing out of the steep ground, upright faces and level tops, stepping down the slope
      for (let x = rect.x0; x < rect.x1; x += BLOCK_STEP) {
        for (let z = rect.z0; z < rect.z1; z += BLOCK_STEP) {
          const cx = x + BLOCK_STEP * (0.2 + 0.6 * hash(x * 3, z)), cz = z + BLOCK_STEP * (0.2 + 0.6 * hash(x, z * 3))
          if (hash(cx * 17, cz * 19) > BLOCK_SHARE || !here.some((zn) => inRing(zn.ring, cx, cz))) continue
          const g = terrain.rawHeightAt(cx, cz)
          const gx = (terrain.rawHeightAt(cx + 5, cz) - terrain.rawHeightAt(cx - 5, cz)) / 10
          const gz = (terrain.rawHeightAt(cx, cz + 5) - terrain.rawHeightAt(cx, cz - 5)) / 10
          const slope = Math.hypot(gx, gz)
          if (slope < STEEP * 0.95 || (sea != null && g < sea + 0.5) || wet(cx, cz)) continue
          // down the slope, give or take: the joints run a little across it
          const yaw = Math.atan2(-gx, -gz) + (hash(cx, cz * 5) - 0.5) * 0.5
          const hx = 1.0 + hash(cx * 3, cz * 7) * 1.6, hz = 0.7 + hash(cx * 9, cz * 2) * 1.0
          // clear of every path by the block's whole reach (its corner), and the one stacked behind it
          if (onWay(cx, cz, Math.hypot(hx, hz) + 0.8)) continue
          // its top a little over the ground at its middle, its foot below the ground at its front
          const y1 = g + 0.25 + hash(cx * 5, cz * 11) * (0.8 + slope * 1.2)
          const y0 = g - hz * slope - 0.5
          const t = (0.5 + 0.18 * patch(cx, cz, 14) + 0.06 * hash(cx, cz)) * (1 - Math.min(0.15, (slope - STEEP) * 0.12))
          block(out, cx, cz, y0, y1, hx, hz, yaw, [t, t * 0.985, t * 0.955], rock)
          // and now and then a smaller one stacked on it, set back into the slope
          if (hash(cx * 23, cz * 29) < 0.3) {
            const bx = cx - Math.sin(yaw) * hz * 0.5, bz = cz - Math.cos(yaw) * hz * 0.5
            block(out, bx, bz, y1 - 0.4, y1 + 0.5 + hash(cx, cz * 31) * 1.0, hx * 0.6, hz * 0.6, yaw + (hash(cz, cx) - 0.5) * 0.6, [t * 1.04, t * 1.02, t], rock)
          }
        }
      }
      if (out.triangles === 0) return []
      const m = new Mesh(`cliffs:${rect.x0},${rect.z0}`, scene)
      out.toVertexData().applyToMesh(m)
      m.material = rockMaterial(scene)
      m.renderingGroupId = 3
      m.isPickable = false
      m.freezeWorldMatrix()
      return [m]
    },
  }
}
