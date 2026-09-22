/**
 * The Seine's quays: the low stone parapet along the river side of every quay street, and on the right-bank
 * quays that really have them (the Quai de l'Hôtel de Ville, the Quai des Célestins) the bouquinistes — the
 * booksellers' dark-green boxes, closed, sitting in a row on top of the parapet. With the plane trees they are
 * what a Paris quay IS; without them the river was a street with water beside it.
 *
 * The river side of a quay is found, not assumed: at every sample along the street, the side whose point a
 * few metres beyond the pavement lies in water. So a parapet follows the river round the Île Saint-Louis, and
 * stops where a bridge or a lower quay's ramp leaves the water's edge.
 */
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import type { Scene } from '@babylonjs/core/scene'
import { MeshBuilder } from './buildings.ts'
import { cartoonMaterial } from './cartoon-material.ts'
import { unpackPoints, waterLevels, wholeWater, type CityPackage } from '../city/package.ts'
import type { TileLayer } from './city.ts'
import { waterMaterial } from './water-material.ts'
import type { Terrain } from '../city/terrain.ts'

type Rgb = [number, number, number]
const FIXED = 0
const STONE: Rgb = [0.74, 0.7, 0.62]
const CAP: Rgb = [0.8, 0.77, 0.7]
const GREEN: Rgb = [0.13, 0.29, 0.2]
/** quays whose parapets carry bouquinistes */
const BOOKSELLERS = new Set(["Quai de l'Hôtel de Ville", 'Quai des Célestins', 'Quai de Gesvres', 'Quai de la Mégisserie',
  'Quai de Montebello', 'Quai Saint-Michel', 'Quai des Grands Augustins', 'Quai de Conti', 'Quai Malaquais', 'Quai Voltaire'])

type P = { x: number; z: number }

function inside(ring: P[], x: number, z: number): boolean {
  let o = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    if ((ring[i].z > z) !== (ring[j].z > z) && x < ((ring[j].x - ring[i].x) * (z - ring[i].z)) / (ring[j].z - ring[i].z) + ring[i].x) o = !o
  }
  return o
}

/** An upright box of half-extents (hl along the direction u, hw across it, full height h) at p, on the ground y. */
function boxAt(out: MeshBuilder, p: P, y: number, ux: number, uz: number, hl: number, hw: number, h: number, c: Rgb): void {
  const vx = -uz
  const vz = ux
  const corner = (a: number, b: number, yy: number): [number, number, number] => [p.x + ux * a * hl + vx * b * hw, yy, p.z + uz * a * hl + vz * b * hw]
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  const sides: [number, number, number, number, [number, number, number]][] = [
    [1, -1, 1, 1, [ux, 0, uz]], [-1, 1, -1, -1, [-ux, 0, -uz]], [1, 1, -1, 1, [vx, 0, vz]], [-1, -1, 1, -1, [-vx, 0, -vz]],
  ]
  for (const [a0, b0, a1, b1, n] of sides) out.quad([corner(a0, b0, y), corner(a1, b1, y), corner(a1, b1, y + h), corner(a0, b0, y + h)], n, uv, c, FIXED)
  out.quad([corner(-1, -1, y + h), corner(1, -1, y + h), corner(1, 1, y + h), corner(-1, 1, y + h)].reverse() as [number, number, number][], [0, 1, 0], uv, c, FIXED)
}

/**
 * The quays as a per-tile layer (render/city.ts `TileLayer`): the WHOLE water bodies are prepared once (the
 * river's side and its level need all of it), and each tile draws the parapet and wall pieces whose middle
 * lies in it — so a piece is drawn once, by exactly one tile.
 */
export function quaysLayer(scene: Scene, pkg: Pick<CityPackage, 'areas' | 'water'>, terrain: Terrain, drop = 0): TileLayer {
  const water = prepareWater(pkg, terrain, drop)
  return {
    name: 'quays',
    build(near, rect) {
      const m = buildQuays(scene, near.tile.edges, water, terrain, drop, rect, `quays:${near.key}`)
      return m ? [m] : []
    },
  }
}

interface Water { ring: Point[]; holes: Point[][]; x0: number; x1: number; z0: number; z1: number; level: number }
type Point = { x: number; z: number }

function prepareWater(pkg: Pick<CityPackage, 'areas' | 'water'>, terrain: Terrain, drop: number): Water[] {
  const bodies = wholeWater(pkg)
  const levels = waterLevels(bodies, (x, z) => terrain.heightAt(x, z), drop)
  return bodies.map((a, k) => {
    const ring = unpackPoints(a.ring)
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
    for (const q of ring) { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); z0 = Math.min(z0, q.z); z1 = Math.max(z1, q.z) }
    return { ring, holes: (a.holes ?? []).map(unpackPoints), x0, x1, z0, z1, level: levels[k] }
  })
}

function buildQuays(scene: Scene, edges: CityPackage['edges'], water: Water[], terrain: Terrain, drop: number,
  rect: { x0: number; z0: number; x1: number; z1: number }, name: string): Mesh | null {
  if (water.length === 0) return null
  const mine = (x: number, z: number): boolean => x >= rect.x0 && x < rect.x1 && z >= rect.z0 && z < rect.z1
  // an island is a hole in the river: land
  const wet = (x: number, z: number): boolean => water.some((w) => x >= w.x0 && x <= w.x1 && z >= w.z0 && z <= w.z1
    && inside(w.ring, x, z) && !w.holes.some((h) => inside(h, x, z)))
  const out = new MeshBuilder()
  const seam = new MeshBuilder()
  let metres = 0
  for (const e of edges) {
    if (!e.name || !/^Quai /.test(e.name) || e.foot || e.bridge || e.tunnel) continue
    const pts = unpackPoints(e.points)
    const d = e.width / 2 + e.walk + 0.15
    const books = BOOKSELLERS.has(e.name)
    let run = 0
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1]
      const b = pts[i]
      const seg = Math.hypot(b.x - a.x, b.z - a.z)
      if (seg < 0.1) continue
      const ux = (b.x - a.x) / seg
      const uz = (b.z - a.z) / seg
      const step = 2
      for (let s = 0; s < seg - 1e-6; s += step) {
        const l = Math.min(step, seg - s)
        const mx = a.x + ux * (s + l / 2)
        const mz = a.z + uz * (s + l / 2)
        // another tile's piece: counted along the quay (the booksellers' rhythm), not drawn here
        if (!mine(mx, mz)) { run += l; continue }
        // which side is the river, and where its edge is: stepping out from the pavement up to 40 m each
        // way, the first point in water. The parapet stands a metre short of it — on the bank, which on the
        // Quai des Célestins is past a strip of lawn, not at the kerb
        let side = 0
        let edge = Infinity
        for (const sd of [-1, 1]) {
          for (let o = d; o <= d + 40; o += 1) {
            if (wet(mx - uz * sd * o, mz + ux * sd * o)) { if (o < edge) { edge = o; side = sd } break }
          }
        }
        run += l
        if (side === 0) continue
        const off = Math.max(d, edge - 1)
        const cx = mx - uz * side * off
        const cz = mz + ux * side * off
        const y = terrain.heightAt(cx, cz) + 0.15
        // the parapet: a stone wall 0.45 m thick and 1 m high, with a paler coping
        boxAt(out, { x: cx, z: cz }, y - 0.3, ux, uz, l / 2 + 0.02, 0.22, 1.2, STONE)
        boxAt(out, { x: cx, z: cz }, y + 0.9, ux, uz, l / 2 + 0.02, 0.27, 0.1, CAP)
        metres += l
        // the booksellers' boxes: two metres long, in fours with a gap, lids a little sloped (drawn as boxes)
        if (books && Math.floor(run / 2) % 5 !== 4) {
          boxAt(out, { x: cx - uz * side * 0.05, z: cz + ux * side * 0.05 }, y + 1.0, ux, uz, 0.95, 0.42, 0.62, GREEN)
          boxAt(out, { x: cx - uz * side * 0.05, z: cz + ux * side * 0.05 }, y + 1.62, ux, uz, 0.98, 0.45, 0.06, [0.1, 0.22, 0.15])
        }
      }
    }
  }
  /*
   * The quay walls: where the region drops its rivers below their banks (`riverDrop`), the drop has to be a
   * wall — Paris's are dressed stone, straight down from the bank to the water — or the river would be a
   * hole with nothing round its sides. Along every water body's edge, from the ground at the bank to a little
   * under the surface (which is its lowest bank less the drop, as the city draws it).
   */
  if (drop > 0) {
    const wallStone: Rgb = [0.6, 0.57, 0.51]
    for (const w of water) {
      if (w.x1 < rect.x0 || w.x0 > rect.x1 || w.z1 < rect.z0 || w.z0 > rect.z1) continue
      const level = w.level
      // the banks: the river's outline, and every island's
      for (const ring of [w.ring, ...w.holes]) for (let i = 0; i < ring.length; i++) {
        const a = ring[i]
        const b = ring[(i + 1) % ring.length]
        const len = Math.hypot(b.x - a.x, b.z - a.z)
        const n = Math.max(1, Math.ceil(len / 3))
        for (let k = 0; k < n; k++) {
          const p0 = { x: a.x + ((b.x - a.x) * k) / n, z: a.z + ((b.z - a.z) * k) / n }
          const p1 = { x: a.x + ((b.x - a.x) * (k + 1)) / n, z: a.z + ((b.z - a.z) * (k + 1)) / n }
          if (!mine((p0.x + p1.x) / 2, (p0.z + p1.z) / 2)) continue
          // not along a line between two bodies of water (the Seine is mapped as several polygons): water on
          // both sides is no bank, and each body drew its own wall there, z-fighting in the river (BUGS.md #36)
          {
            const mx = (p0.x + p1.x) / 2
            const mz = (p0.z + p1.z) / 2
            const nx = (p1.z - p0.z) / (len / n)
            const nz = -(p1.x - p0.x) / (len / n)
            if (wet(mx + nx * 1.5, mz + nz * 1.5) && wet(mx - nx * 1.5, mz - nz * 1.5)) {
              // …and the seam between the two polygons, which never quite meet, filled with a band of water
              const lv = Math.min(level, ...water.filter((q) => q !== w && q.x0 <= mx && mx <= q.x1 && q.z0 <= mz && mz <= q.z1).map((q) => q.level))
              const y = lv + 0.03
              seam.quad([[p0.x - nx * 2.5, y, p0.z - nz * 2.5], [p1.x - nx * 2.5, y, p1.z - nz * 2.5],
                [p1.x + nx * 2.5, y, p1.z + nz * 2.5], [p0.x + nx * 2.5, y, p0.z + nz * 2.5]], [0, 1, 0],
                [[0, 0], [1, 0], [1, 1], [0, 1]], [0, 0, 0], 0)
              continue
            }
          }
          const t0 = terrain.heightAt(p0.x, p0.z)
          const t1 = terrain.heightAt(p1.x, p1.z)
          if (Math.max(t0, t1) - level < 0.3) continue
          out.quad([[p0.x, level - 0.4, p0.z], [p1.x, level - 0.4, p1.z], [p1.x, t1 + 0.1, p1.z], [p0.x, t0 + 0.1, p0.z]],
            [(p1.z - p0.z) / (len / n), 0, -(p1.x - p0.x) / (len / n)], [[0, 0], [1, 0], [1, 1], [0, 1]], wallStone, FIXED)
        }
      }
    }
  }
  const extra: Mesh[] = []
  if (seam.triangles > 0) {
    const sm = new Mesh(`${name}:seam`, scene)
    seam.toVertexData().applyToMesh(sm)
    sm.material = waterMaterial(scene)
    sm.renderingGroupId = 1
    sm.isPickable = false
    extra.push(sm)
  }
  if (out.triangles === 0) return extra[0] ?? null
  const m = new Mesh(name, scene)
  out.toVertexData().applyToMesh(m)
  const mat = cartoonMaterial(scene, 'cartoonQuay', false)
  // drawn both sides: a water ring's winding decides which way its walls would face, and it is not reliable
  mat.backFaceCulling = false
  m.material = mat
  m.renderingGroupId = 3
  m.isPickable = false
  m.freezeWorldMatrix()
  void metres
  for (const e of extra) e.parent = m
  return m
}
