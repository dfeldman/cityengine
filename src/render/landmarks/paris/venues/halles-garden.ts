import { capPolygonWithHoles, type MeshBuilder } from '../../../buildings.ts'
import { strut, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { hex, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { BEDS, POOLS, SKYLIGHTS } from './halles-garden-layout.ts'

/*
 * THE JARDIN NELSON-MANDELA, between the Canopée and the Bourse de Commerce. The owner: "the gardens in front at place carree and
 * bourse de commerce are very elaborate with manicured plants"; their aerial shows lawns divided by pale curving paths, clipped
 * hedges and planted beds in many small rooms, several small blue-tiled pools, sunken glass-and-steel skylights, and rows of pollarded,
 * autumn-toned trees along the Rue Berger.
 *
 * OSM maps it finely, and the city already has its lawns and paths from that (landuse=grass, the pedestrian ways) and its trees from
 * the register, so none of those are drawn here. This is what the city's lattice cannot be asked for: each natural=scrub ring as a
 * bed, with a clipped hedge round it and clipped planting filling it (geometry: the plant library has no box or yew), accent plants
 * in it from the library, each of the four basins as a tiled pool with a stone rim, the three railed rings as skylights.
 * Every position is in halles-garden-layout.ts, kept out of the ways' corridors there, so nothing here stands on a footway.
 *
 * A standalone entry of `kind: garden` (so it clears no trees), its frame the city's, x east, z north. Each piece stands on the ground
 * under it (`fit.groundAt`); it ignores the fit's size, because it is a place and not a building. The piece ends are left off and the
 * fills are one face, to keep it cheap for all its parts: 4,000 triangles or so, and about 300 instanced plants.
 */

const CLIPPED: Rgb = [0.15, 0.26, 0.11]
const CLIPPED_TOP: Rgb = [0.2, 0.33, 0.14]
const FOLIAGE = surfaceTag('foliage')
/** the beds' planting, a mass of one tone each: deep greens, a silver lavender, and the owner's autumn in the last two */
const MASS: Rgb[] = [[0.13, 0.24, 0.1], [0.17, 0.27, 0.13], [0.2, 0.25, 0.2], [0.11, 0.2, 0.12], [0.28, 0.27, 0.12], [0.33, 0.2, 0.09]]
/** what stands in them: all in the plant library's index (assetkit public/plants/index.json, checked 2026-10-30) */
const ACCENT: { species: string; h: number }[][] = [
  [{ species: 'karikomi', h: 1 }, { species: 'lavender', h: 0.7 }],
  [{ species: 'hydrangea', h: 1.1 }, { species: 'karikomi', h: 1.3 }],
  [{ species: 'lavender', h: 0.7 }, { species: 'rosemary', h: 0.9 }],
  [{ species: 'azalea', h: 1 }, { species: 'karikomi', h: 0.9 }],
  [{ species: 'heather', h: 0.6 }, { species: 'hydrangea', h: 1 }],
  [{ species: 'rhododendron', h: 1.5 }, { species: 'heather', h: 0.6 }],
]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

export function hallesGarden(out: MeshBuilder, fit: Fit): void {
  const g = (x: number, z: number): number => fit.groundAt?.(x, z) ?? 0
  BEDS.forEach((b, i) => bed(out, b, i, g))
  for (const r of POOLS) pool(out, r, g)
  for (const r of SKYLIGHTS) skylight(out, r, g)
}

function bed(out: MeshBuilder, b: { hedge: number[]; fill: number[]; plants: number[] }, i: number, g: (x: number, z: number) => number): void {
  const mass = MASS[i % MASS.length]
  for (let k = 0; k < b.fill.length; k += 6) {
    const [xa0, xa1, xb0, xb1, z0, z1] = b.fill.slice(k, k + 6)
    const c = shade(mass, (k / 6) % 2 ? 1 : 0.94)
    const y = 0.14
    out.quad([[xa0, g(xa0, z0) + y, z0], [xa1, g(xa1, z0) + y, z0], [xb1, g(xb1, z1) + y, z1], [xb0, g(xb0, z1) + y, z1]], [0, 1, 0], UV, c, FOLIAGE)
  }
  for (let k = 0; k < b.hedge.length; k += 4) hedge(out, b.hedge[k], b.hedge[k + 1], b.hedge[k + 2], b.hedge[k + 3], g)
  const kinds = ACCENT[i % ACCENT.length]
  for (let k = 0; k < b.plants.length; k += 2) {
    const a = kinds[((k / 2) * 7 + (k >> 3)) % 3 === 0 ? 1 : 0]
    const v = 0.85 + 0.3 * (((k / 2) * 0.618) % 1)
    out.plants.push({ x: b.plants[k], z: b.plants[k + 1], species: a.species, h: a.h * v, spin: (k / 2) * 2.399 })
  }
}

/** A clipped hedge from a to b: both flanks and its flat top, 0.7 wide, 0.85 high. */
function hedge(out: MeshBuilder, ax: number, az: number, bx: number, bz: number, g: (x: number, z: number) => number): void {
  const L = Math.hypot(bx - ax, bz - az) || 1
  const nx = ((bz - az) / L) * 0.35
  const nz = (-(bx - ax) / L) * 0.35
  const ya = g(ax, az)
  const yb = g(bx, bz)
  const H = 0.85
  for (const s of [-1, 1]) {
    out.quad([[ax + nx * s, ya - 0.1, az + nz * s], [bx + nx * s, yb - 0.1, bz + nz * s], [bx + nx * s * 0.86, yb + H, bz + nz * s * 0.86], [ax + nx * s * 0.86, ya + H, az + nz * s * 0.86]],
      [nx * s, 0.1, nz * s], UV, CLIPPED, FOLIAGE)
  }
  out.quad([[ax + nx * 0.86, ya + H, az + nz * 0.86], [bx + nx * 0.86, yb + H, bz + nz * 0.86], [bx - nx * 0.86, yb + H, bz - nz * 0.86], [ax - nx * 0.86, ya + H, az - nz * 0.86]], [0, 1, 0], UV, CLIPPED_TOP, FOLIAGE)
}

const ringOf = (a: number[]): { x: number; z: number }[] => Array.from({ length: a.length / 2 }, (_, i) => ({ x: a[2 * i], z: a[2 * i + 1] }))
const meanGround = (r: { x: number; z: number }[], g: (x: number, z: number) => number): number => r.reduce((t, p) => t + g(p.x, p.z), 0) / r.length

/** A small tiled pool on its ring: the blue floor, tile lines across it, a pale stone rim. */
function pool(out: MeshBuilder, a: number[], g: (x: number, z: number) => number): void {
  const r = ringOf(a)
  const y = meanGround(r, g)
  capPolygonWithHoles(out, [r], y + 0.16, hex('#245a80'), 0)
  const stone = hex('#b5b0a2')
  let x0 = Infinity, x1 = -Infinity
  for (const p of r) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x) }
  // the tile lines, where each crosses the ring
  for (let x = x0 + 1.4; x < x1 - 0.4; x += 1.4) {
    const zs: number[] = []
    for (let i = 0; i < r.length; i++) {
      const p = r[i]
      const q = r[(i + 1) % r.length]
      if ((p.x <= x) !== (q.x <= x)) zs.push(p.z + ((x - p.x) / (q.x - p.x)) * (q.z - p.z))
    }
    zs.sort((m, n) => m - n)
    for (let i = 0; i + 1 < zs.length; i += 2) {
      out.quad([[x - 0.03, y + 0.18, zs[i]], [x + 0.03, y + 0.18, zs[i]], [x + 0.03, y + 0.18, zs[i + 1]], [x - 0.03, y + 0.18, zs[i + 1]]], [0, 1, 0], UV, hex('#4b86a6'), 0)
    }
  }
  for (let i = 0; i < r.length; i++) {
    const p = r[i]
    const q = r[(i + 1) % r.length]
    strut(out, [p.x, y + 0.2, p.z], [q.x, y + 0.2, q.z], 0.42, 0.5, stone, 0, true)
  }
}

/** A sunken skylight on its railed ring: dark glass low in a kerb, steel bars across it, the rail round the ring. */
function skylight(out: MeshBuilder, a: number[], g: (x: number, z: number) => number): void {
  const r = ringOf(a)
  const y = meanGround(r, g)
  const steel = hex('#8a9190')
  const white = hex('#c9ccc9')
  capPolygonWithHoles(out, [r], y + 0.2, hex('#39484f'), 0)
  let x0 = Infinity, x1 = -Infinity
  for (const p of r) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x) }
  for (let x = x0 + 1.5; x < x1 - 0.3; x += 1.5) {
    const zs: number[] = []
    for (let i = 0; i < r.length; i++) {
      const p = r[i]
      const q = r[(i + 1) % r.length]
      if ((p.x <= x) !== (q.x <= x)) zs.push(p.z + ((x - p.x) / (q.x - p.x)) * (q.z - p.z))
    }
    zs.sort((m, n) => m - n)
    for (let i = 0; i + 1 < zs.length; i += 2) strut(out, [x, y + 0.27, zs[i]], [x, y + 0.27, zs[i + 1]], 0.09, 0.09, steel, 0, false)
  }
  for (let i = 0; i < r.length; i++) {
    const p = r[i]
    const q = r[(i + 1) % r.length]
    strut(out, [p.x, y + 0.15, p.z], [q.x, y + 0.15, q.z], 0.3, 0.3, hex('#b3afa3'), 0, false)
    strut(out, [p.x, y + 1.05, p.z], [q.x, y + 1.05, q.z], 0.05, 0.05, white, 0, false)
    strut(out, [p.x, y, p.z], [p.x, y + 1.05, p.z], 0.05, 0.05, white, 0, false)
  }
}
