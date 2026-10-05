/**
 * SAN FRANCISCO'S DESIGNED FOUNTAINS that OSM maps as areas the city otherwise drew as plain paving or lawn
 * (fountain census, 2026-10-05).
 *
 * UNITED NATIONS PLAZA FOUNTAIN (Lawrence Halprin, 1975; way/128534058, ~39 × 24 m), on Market Street — Commons
 * "UN Plaza Fountain, San Francisco. By Lawrence Halprin": a SUNKEN pool walled and crossed by massive smooth blocks
 * of buff granite, stepped and stacked at every height from a bench to a 4 m slab, the water arching in jets between
 * them and falling over their edges. Fitted to OSM's ring; local frame the fit's.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'
import { box, prism, strut } from '../../models.ts'
import { capPolygon } from '../../buildings.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { towerRing, insetRing, faceBand } from '../tower.ts'
import { edgeAt, edgeFacing, signText } from '../parts.ts'

const h = (a: number, b: number): number => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v) }

export function unPlazaFountain(out: MeshBuilder, fit: Fit): void {
  const GRANITE: Rgb = [0.78, 0.72, 0.6], SHADE: Rgb = [0.66, 0.6, 0.5], WATER: Rgb = [0.42, 0.55, 0.6], FOAM: Rgb = [0.92, 0.95, 0.96]
  const st = surfaceTag('granite')
  const ring = towerRing(fit)
  // the sunken pool: a granite kerb round the outline, the basin a metre and a half down, water in it
  const inner = insetRing(ring, 1.2)
  // (the city's ground cannot be cut, so the "sunken" pool is a kerb round water a hand over the ground: the blocks
  //  stand in it as they stand in the real one)
  faceBand(out, ring, 0, 0.55, { kind: 'blank', wall: GRANITE, material: 'granite' })
  capPolygon(out, ring.map((q) => ({ x: q.x, z: q.z })), 0.55, GRANITE, st)
  void inner
  capPolygon(out, insetRing(ring, 0.9), 0.58, WATER, surfaceTag('glass'))
  // the blocks: a jittered grid over the basin, each a smooth granite block, stepped, some stacked, some tall slabs
  const hx = fit.hx - 2, hz = fit.hz - 2
  let k = 0
  for (let x = -hx; x <= hx; x += 3.4) {
    for (let z = -hz; z <= hz; z += 3.4) {
      k++
      if (h(k, 1) < 0.2) continue
      const w = 1 + h(k, 2) * 1.6, d = 1 + h(k, 3) * 1.6
      const tall = h(k, 4) < 0.15
      const top = tall ? 3 + h(k, 5) * 1.6 : 0.9 + h(k, 6) * 1.8
      const cx = x + (h(k, 7) - 0.5) * 1.2, cz = z + (h(k, 8) - 0.5) * 1.2
      box(out, cx, (top + 0.6) / 2, cz, w, Math.max(0.3, top - 0.6) / 2 + 0.3, d, h(k, 9) < 0.5 ? GRANITE : SHADE, st)
      // a smaller block stacked on some, stepping up
      if (!tall && h(k, 10) < 0.4) box(out, cx + w * 0.3, top + 0.35, cz - d * 0.2, w * 0.55, 0.35, d * 0.55, GRANITE, st)
      // water falling over the lip of a few, and a jet arching from others
      if (h(k, 11) < 0.3) box(out, cx + w + 0.03, (top + 0.6) / 2, cz, 0.04, (top - 0.6) / 2, d * 0.7, FOAM, 0)
      if (h(k, 12) < 0.18) {
        const a = h(k, 13) * Math.PI * 2, L = 3 + h(k, 14) * 3
        const p0: [number, number, number] = [cx, top + 0.05, cz]
        const pm: [number, number, number] = [cx + Math.cos(a) * L * 0.5, top + L * 0.55, cz + Math.sin(a) * L * 0.5]
        const p1: [number, number, number] = [cx + Math.cos(a) * L, 0.6, cz + Math.sin(a) * L]
        strut(out, p0, pm, 0.12, 0.12, FOAM, 0, false)
        strut(out, pm, p1, 0.12, 0.12, FOAM, 0, false)
      }
    }
  }
}

/**
 * THE YODA FOUNTAIN (Lawrence Noble, 2005; OSM way/1376085479, ~4.6 m round) in the Letterman Digital Arts Center's
 * court, the Presidio — Commons "Always pass on what you have learned – Yoda, Wiki Education, and guests.jpg": a low
 * round stone basin wall at bench height, a faceted tan stone pedestal in the middle with water sheeting down its
 * faces, and on top the bronze Yoda, a metre tall, leaning on his cane. Standalone.
 */
export function yodaFountain(out: MeshBuilder, _fit: Fit): void {
  const STONE: Rgb = [0.6, 0.55, 0.48], TAN: Rgb = [0.72, 0.64, 0.52], WATER: Rgb = [0.45, 0.58, 0.64], BRONZE: Rgb = [0.38, 0.4, 0.33]
  const st = surfaceTag('granite'), metal = surfaceTag('metal')
  // the basin wall (a ring of segments) and the water inside it
  const n = 20
  for (let i = 0; i < n; i++) {
    const a = ((i + 0.5) / n) * Math.PI * 2
    box(out, Math.cos(a) * 2.15, 0.27, Math.sin(a) * 2.15, 0.36, 0.27, 0.22, STONE, st)
  }
  prism(out, 0, 0, 0.02, 0.3, 1.95, 20, WATER, surfaceTag('glass'))
  // the pedestal: a broad faceted block, then a narrower cap, water down the front faces
  prism(out, 0, 0, 0.3, 1.25, 0.95, 6, TAN, st, 0.75)
  prism(out, 0, 0, 1.25, 1.55, 0.6, 6, TAN, st, 0.55)
  for (const a of [0.3, 2.4, 4.5]) box(out, Math.cos(a) * 0.82, 0.8, Math.sin(a) * 0.82, 0.18, 0.45, 0.04, [0.88, 0.92, 0.94], 0)
  // Yoda: the robe, the head with its long ears, the cane
  prism(out, 0, 0, 1.55, 2.35, 0.36, 8, BRONZE, metal, 0.2)
  prism(out, 0, 0, 2.35, 2.65, 0.2, 8, BRONZE, metal, 0.17)
  for (const s of [-1, 1]) strut(out, [s * 0.12, 2.55, 0], [s * 0.5, 2.68, -0.04], 0.16, 0.04, BRONZE, metal)
  strut(out, [0.24, 1.55, 0.16], [0.26, 2.2, 0.14], 0.05, 0.05, BRONZE, metal)
}


/**
 * THE SAN FRANCISCO MINT, 155 Hermann Street (Gilbert Stanley Underwood, 1937; way/115944818). Commons "NRIS 88000026
 * Mint Building - Duboce St Elevation.jpg" (2026-10-05): a white granite Stripped Classical fortress on the rock
 * outcrop over Duboce and Market. One tall storey of narrow window bays between flat piers, each pier with a roundel
 * at its head, plain end pavilions with a single window, a high attic lettered UNITED STATES MINT with a row of small
 * square windows, a flagpole — all standing on a massive rubble-stone retaining wall about 12 m high, which is the
 * building's whole silhouette from the street. The terrain under it is the flattened summit of BUGS #260, so the rock
 * and the wall are drawn here, the building raised on them. Front 180: Duboce is south.
 */
export function sanFranciscoMint(out: MeshBuilder, fit: Fit): void {
  const GRANITE: Rgb = [0.86, 0.86, 0.84], SHADE: Rgb = [0.74, 0.74, 0.72], GLASS: Rgb = [0.13, 0.16, 0.2]
  const RUBBLE: Rgb = [0.4, 0.36, 0.31], ROCK: Rgb = [0.42, 0.4, 0.37]
  const st = surfaceTag('granite')
  const ring = towerRing(fit)
  const ROCKH = 12
  // the outcrop and its rubble wall: the outline pushed out 4 m, from below ground to the building's floor
  const wall = insetRing(ring, -4)
  faceBand(out, wall, -2, ROCKH, { kind: 'blank', wall: RUBBLE, material: 'granite' })
  capPolygon(out, wall.map((p) => ({ x: p.x, z: p.z })), ROCKH, ROCK, surfaceTag('concrete'))
  // the building: the tall window storey, the attic, the parapet rail
  const B = ROCKH, H1 = 13, ATT = 6
  faceBand(out, ring, B, B + H1, { kind: 'fins', wall: GRANITE, glass: GLASS, pitch: 3.6, solid: 0.55, depth: 0.25, floor: H1, material: 'granite' })
  faceBand(out, ring, B + H1, B + H1 + 0.7, { kind: 'blank', wall: SHADE, material: 'granite' })
  faceBand(out, insetRing(ring, 1.2), B + H1 + 0.7, B + H1 + 0.7 + ATT, { kind: 'punched', wall: GRANITE, glass: GLASS, pitch: 4.2, solid: 0.88, floor: ATT, material: 'granite' })
  capPolygon(out, insetRing(ring, 1.2).map((p) => ({ x: p.x, z: p.z })), B + H1 + 0.7 + ATT, [0.55, 0.55, 0.55], surfaceTag('concrete'))
  capPolygon(out, ring.map((p) => ({ x: p.x, z: p.z })), B + H1 + 0.7, SHADE, st)
  // the lettering and the flagpole over the front
  const e = edgeAt(ring, edgeFacing(ring))
  signText(out, 'UNITED STATES MINT', e.mid.x + e.nx * 0.06, B + H1 - 1.4, e.mid.z + e.nz * 0.06, 0.8, [0.6, 0.6, 0.58], { heading: e.heading })
  box(out, e.mid.x - e.nx * 6, B + H1 + 0.7 + ATT + 5, e.mid.z - e.nz * 6, 0.07, 5, 0.07, [0.8, 0.8, 0.8], surfaceTag('metal'))
  box(out, e.mid.x - e.nx * 6 + e.tx * 1.1, B + H1 + 0.7 + ATT + 9.2, e.mid.z - e.nz * 6 + e.tz * 1.1, 1, 0.6, 0.02, [0.7, 0.18, 0.16], 0)
}

export const FOUNTAINS: Record<string, (out: MeshBuilder, fit: Fit) => void> = { unPlazaFountain, yodaFountain, sanFranciscoMint }
