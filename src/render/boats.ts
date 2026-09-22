/**
 * The boats moored along the Seine (OSM `building=boat|houseboat`: the péniches that are bars, homes, a fire
 * station), as a per-tile layer (render/city.ts `TileLayer`). Each is fitted to its own footprint — its long
 * axis, its length and beam — and floats at the level of the water it lies in: a dark hull with a pale rubbing
 * strake, a flat deck, a long low cabin with a row of windows, a wheelhouse at the stern, and on the bigger
 * ones planters and a parasol on the roof. Colours vary by boat, from its id, as real péniches do.
 */
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import type { Scene } from '@babylonjs/core/scene'
import { MeshBuilder } from './buildings.ts'
import { box, prism, type Rgb } from './models.ts'
import { cartoonMaterial } from './cartoon-material.ts'
import type { TileLayer } from './city.ts'
import type { PackedBoat } from '../city/package.ts'
import type { TileArea } from '../city/tiles.ts'

const FIXED = 0
const HULLS: Rgb[] = [[0.08, 0.09, 0.1], [0.1, 0.16, 0.26], [0.12, 0.24, 0.17], [0.42, 0.1, 0.09], [0.08, 0.09, 0.1], [0.2, 0.2, 0.22]]
const CABINS: Rgb[] = [[0.9, 0.87, 0.8], [0.72, 0.52, 0.33], [0.85, 0.82, 0.74], [0.95, 0.94, 0.9], [0.55, 0.36, 0.22], [0.68, 0.7, 0.72]]

const inside = (r: number[], x: number, z: number): boolean => {
  let o = false
  for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
    if ((r[i + 1] > z) !== (r[j + 1] > z) && x < ((r[j] - r[i]) * (z - r[i + 1])) / (r[j + 1] - r[i + 1]) + r[i]) o = !o
  }
  return o
}

/** The footprint's long axis, centre, length and beam (a boat is long and narrow, so its axes are clear). */
function fit(ring: number[]): { cx: number; cz: number; len: number; beam: number; angle: number } {
  let cx = 0
  let cz = 0
  const n = ring.length / 2
  for (let i = 0; i < ring.length; i += 2) { cx += ring[i]; cz += ring[i + 1] }
  cx /= n
  cz /= n
  let best = { len: 0, beam: 0, angle: 0, area: Infinity, ox: 0, oz: 0 }
  for (let a = 0; a < Math.PI; a += Math.PI / 90) {
    const ux = Math.sin(a)
    const uz = Math.cos(a)
    let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity
    for (let i = 0; i < ring.length; i += 2) {
      const dx = ring[i] - cx
      const dz = ring[i + 1] - cz
      const u = dx * ux + dz * uz
      const v = dx * uz - dz * ux
      u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v)
    }
    const area = (u1 - u0) * (v1 - v0)
    if (area < best.area) best = { len: u1 - u0, beam: v1 - v0, angle: a, area, ox: (u0 + u1) / 2, oz: (v0 + v1) / 2 }
  }
  const ux = Math.sin(best.angle)
  const uz = Math.cos(best.angle)
  return { cx: cx + best.ox * ux + best.oz * uz, cz: cz + best.ox * uz - best.oz * ux, len: best.len, beam: best.beam, angle: best.angle }
}

/** One péniche along local +z, centred at the origin, its waterline at y = 0. */
function peniche(out: MeshBuilder, len: number, beam: number, id: number): void {
  const h = (k: number): number => ((Math.imul(id ^ (k * 0x9e3779b1), 0x85ebca6b) >>> 0) % 1000) / 1000
  const hull = HULLS[Math.floor(h(1) * HULLS.length)]
  const cabin = CABINS[Math.floor(h(2) * CABINS.length)]
  const L = Math.max(8, Math.min(len, 60)) / 2
  const B = Math.max(3, Math.min(beam, 11)) / 2
  const trim: Rgb = [0.9, 0.9, 0.86]
  const dark: Rgb = [0.12, 0.14, 0.17]
  // the hull: a slab to 1.1 m above the water, the bow rounded as three steps, a rubbing strake
  box(out, 0, 0.35, -0.8, B, 0.75, L - 0.8, hull, FIXED)
  for (let k = 0; k < 3; k++) box(out, 0, 0.35, L - 0.8 + k * 0.35 + 0.18, B * (0.85 - k * 0.22), 0.75, 0.18, hull, FIXED)
  box(out, 0, 1.08, -0.8, B + 0.04, 0.05, L - 0.8, trim, FIXED)
  box(out, 0, 1.12, 0, B - 0.1, 0.02, L - 0.3, [0.45, 0.33, 0.22], FIXED)                  // the deck
  // the cabin: long and low, most of the length, windows along both sides
  const c0 = -L + 2.5
  const c1 = L - 3.5
  const ch = beam > 5 ? 2.3 : 1.9
  box(out, 0, 1.12 + ch / 2, (c0 + c1) / 2, B - 0.5, ch / 2, (c1 - c0) / 2, cabin, FIXED)
  box(out, 0, 1.12 + ch + 0.06, (c0 + c1) / 2, B - 0.35, 0.06, (c1 - c0) / 2 + 0.15, [0.32, 0.33, 0.34], FIXED)
  for (let z = c0 + 1.2; z < c1 - 0.6; z += 1.8) {
    for (const s of [-1, 1]) box(out, s * (B - 0.48), 1.12 + ch * 0.6, z, 0.03, ch * 0.22, 0.55, dark, FIXED)
  }
  // the wheelhouse at the stern
  box(out, 0, 1.12 + 1.1, -L + 1.3, B * 0.55, 1.1, 0.9, cabin, FIXED)
  box(out, 0, 1.12 + 1.5, -L + 0.38, B * 0.45, 0.35, 0.03, dark, FIXED)
  // on the bigger ones: planters and a parasol on the cabin roof
  if (len > 20 && h(3) > 0.35) {
    for (let z = c0 + 2; z < c1 - 1; z += 4) box(out, (h(4) - 0.5) * B, 1.12 + ch + 0.35, z, 0.35, 0.25, 0.35, [0.2, 0.42, 0.18], FIXED)
    const pz = (c0 + c1) / 2 + (h(5) - 0.5) * 6
    prism(out, 0, pz, 1.12 + ch, 1.12 + ch + 2.2, 0.04, 6, dark, FIXED)
    prism(out, 0, pz, 1.12 + ch + 1.9, 1.12 + ch + 2.4, 1.6, 8, [0.82, 0.2, 0.18], FIXED, 0.05)
  }
}

export function boatsLayer(scene: Scene): TileLayer {
  return {
    name: 'boats',
    build(near) {
      const boats = near.tile.boats ?? []
      if (boats.length === 0) return []
      const water = near.around.areas.filter((a): a is TileArea => a.kind === 'water' && (a as TileArea).level !== undefined)
      const out = new MeshBuilder()
      for (const b of boats as PackedBoat[]) {
        const f = fit(b.ring)
        // the level of the water it lies in (every piece of a body carries the body's level)
        const w = water.find((a) => inside(a.ring, f.cx, f.cz)) ?? water[0]
        if (!w) continue
        const part = new MeshBuilder()
        peniche(part, f.len, f.beam, b.id)
        const c = Math.cos(f.angle)
        const s = Math.sin(f.angle)
        const base = out.positions.length / 3
        for (let i = 0; i < part.positions.length; i += 3) {
          const x = part.positions[i]
          const z = part.positions[i + 2]
          // local +z along the boat's axis (sin a, cos a); local +x across it
          out.positions.push(f.cx + x * c + z * s, w.level! + 0.05 + part.positions[i + 1], f.cz - x * s + z * c)
          const nx = part.normals[i]
          const nz = part.normals[i + 2]
          out.normals.push(nx * c + nz * s, part.normals[i + 1], -nx * s + nz * c)
        }
        out.uvs.push(...part.uvs)
        out.colors.push(...part.colors)
        for (const idx of part.indices) out.indices.push(base + idx)
      }
      if (out.triangles === 0) return []
      const m = new Mesh(`boats:${near.key}`, scene)
      out.toVertexData().applyToMesh(m)
      m.material = cartoonMaterial(scene, 'cartoonBoat', false)
      m.renderingGroupId = 3
      m.isPickable = false
      m.freezeWorldMatrix()
      return [m]
    },
  }
}
