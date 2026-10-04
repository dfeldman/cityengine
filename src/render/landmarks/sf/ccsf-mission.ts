/**
 * CITY COLLEGE OF SAN FRANCISCO, MISSION CAMPUS (1125 Valencia; 2007), both buildings generic until the university
 * audit of 2026-10-04. Mapillary frames on Bartlett Street: a ground storey in cobalt-blue glazed tile, a tower of
 * the same blue tile running the full height beside the entrance, pale grey banded upper storeys with a Mesoamerican
 * step-fret frieze in every spandrel; the entrance a steel-framed glass atrium carrying a great round mosaic disc in
 * the manner of the Aztec calendar stone, "CCSF" in big letters under it and MISSION CAMPUS on the canopy.
 *
 *  - The Bartlett Building (way/256066001) carries the entrance, on Bartlett Street (front 90).
 *  - The Valencia Building (way/256066027), the same skin, its front on Valencia (front 270).
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'
import { strut } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { tower, towerRing } from '../tower.ts'
import { boxAlong, edgeAt, edgeFacing, signText } from '../parts.ts'

const BLUE: Rgb = [0.16, 0.2, 0.62]
const PALE: Rgb = [0.8, 0.79, 0.75]
const FRET: Rgb = [0.6, 0.6, 0.58]
const GLASS: Rgb = [0.32, 0.44, 0.52]
const STEEL: Rgb = [0.78, 0.8, 0.82]
const BASE = 5

function skin(out: MeshBuilder, fit: Fit, H: number): void {
  tower(out, { ...fit, height: H }, {
    height: H,
    base: { height: BASE, face: { kind: 'punched', wall: BLUE, glass: [0.22, 0.26, 0.3], pitch: 6, solid: 0.55, floor: BASE, material: 'tile' } },
    tiers: [{ to: H, face: { kind: 'punched', wall: PALE, glass: GLASS, pitch: 3.6, solid: 0.55, floor: 3.7, material: 'stucco' } }],
    roof: [0.55, 0.55, 0.55],
    crown: { kind: 'parapet', height: 0.8, colour: PALE, material: 'stucco' },
  })
  // the step-fret frieze in each spandrel, on every wall: a running band of little raised steps
  const ring = towerRing(fit), st = surfaceTag('stucco')
  for (let i = 0; i < ring.length; i++) {
    const e = edgeAt(ring, i)
    if (e.L < 6) continue
    for (let y = BASE + 3.7; y < H - 1; y += 3.7) {
      for (let u = -e.L / 2 + 0.8; u < e.L / 2 - 0.8; u += 1.6) {
        const x = e.mid.x + e.tx * u + e.nx * 0.08, z = e.mid.z + e.tz * u + e.nz * 0.08
        boxAlong(out, x, y - 0.35, z, 0.6, 0.08, 0.06, e.heading, FRET, st)
        boxAlong(out, x + e.tx * 0.5, y - 0.2, z + e.tz * 0.5, 0.08, 0.22, 0.06, e.heading, FRET, st)
        boxAlong(out, x + e.tx * 0.25, y - 0.02, z + e.tz * 0.25, 0.32, 0.06, 0.06, e.heading, FRET, st)
      }
    }
  }
}

/** A flat disc on a wall plane: concentric rings, each a fan of quads. */
function disc(out: MeshBuilder, cx: number, cy: number, cz: number, tx: number, tz: number, nx: number, nz: number, r: number): void {
  const rings: [number, Rgb][] = [[1, [0.78, 0.46, 0.34]], [0.82, [0.88, 0.8, 0.64]], [0.66, [0.3, 0.5, 0.66]], [0.46, [0.86, 0.62, 0.3]], [0.24, [0.62, 0.34, 0.3]]]
  const n = 28
  rings.forEach(([f, c], k) => {
    const rr = r * f, o = 0.04 * k
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2
      const P = (a: number, q: number): [number, number, number] => [cx + tx * Math.cos(a) * q + nx * o, cy + Math.sin(a) * q, cz + tz * Math.cos(a) * q + nz * o]
      const C: [number, number, number] = [cx + nx * o, cy, cz + nz * o]
      out.quad([C, P(a0, rr), P(a1, rr), C], [nx, 0, nz], [[0, 0], [1, 0], [1, 1], [0, 1]], c, 0)
    }
  })
}

export function ccsfMissionBartlett(out: MeshBuilder, fit: Fit): void {
  const H = fit.height > 8 && fit.height < 20 ? fit.height : 12
  skin(out, fit, H)
  const ring = towerRing(fit)
  const e = edgeAt(ring, edgeFacing(ring, 180))
  const G = Math.max(0, fit.grade ?? 0)
  const W = (u: number, o: number): [number, number] => [e.mid.x + e.tx * u + e.nx * o, e.mid.z + e.tz * u + e.nz * o]
  const eu = -e.L * 0.18
  // the glass atrium, its steel frame, the disc on it
  const [ax, az] = W(eu, 1.2)
  boxAlong(out, ax, G + H / 2, az, 6, H / 2, 1.2, e.heading, GLASS, surfaceTag('glass'))
  const metal = surfaceTag('metal')
  for (let k = -3; k <= 3; k++) {
    const [px, pz] = W(eu + k * 2, 2.45)
    boxAlong(out, px, G + H / 2, pz, 0.08, H / 2, 0.08, e.heading, STEEL, metal)
  }
  for (const s of [-1, 1]) {
    const [a0x, a0z] = W(eu + s * 5.5, 2.5), [a1x, a1z] = W(eu, 2.5)
    strut(out, [a0x, G + H - 0.5, a0z], [a1x, G + BASE + 1.5, a1z], 0.12, 0.12, STEEL, metal)
  }
  const [dx, dz] = W(eu, 2.6)
  disc(out, dx, G + BASE + 3.9, dz, e.tx, e.tz, e.nx, e.nz, 3.2)
  // CCSF under it, the canopy and its lettering
  const [lx, lz] = W(eu, 2.58)
  signText(out, 'CCSF', lx, G + BASE - 0.1, lz, 1, [0.66, 0.38, 0.32], { heading: e.heading })
  const [cx, cz] = W(eu, 3.2)
  boxAlong(out, cx, G + 3.6, cz, 6.5, 0.25, 2, e.heading, [0.55, 0.57, 0.6], metal)
  const [tx, tz] = W(eu, 5.22)
  signText(out, 'MISSION CAMPUS', tx, G + 3.6, tz, 0.35, [0.9, 0.88, 0.84], { heading: e.heading })
  // the blue tile tower beside it, standing a little proud and a storey higher
  const [bx, bz] = W(eu + 9, 0.4)
  boxAlong(out, bx, G + (H + 3) / 2, bz, 2.6, (H + 3) / 2, 0.8, e.heading, BLUE, surfaceTag('tile'))
}

export function ccsfMissionValencia(out: MeshBuilder, fit: Fit): void {
  const H = fit.height > 10 && fit.height < 24 ? fit.height : 16
  skin(out, fit, H)
  const ring = towerRing(fit)
  const e = edgeAt(ring, edgeFacing(ring, 180))
  const G = Math.max(0, fit.grade ?? 0)
  const [bx, bz] = [e.mid.x + e.tx * e.L * 0.25 + e.nx * 0.4, e.mid.z + e.tz * e.L * 0.25 + e.nz * 0.4]
  boxAlong(out, bx, G + (H + 2) / 2, bz, 2.6, (H + 2) / 2, 0.8, e.heading, BLUE, surfaceTag('tile'))
}

export const CCSF_MISSION: Record<string, (out: MeshBuilder, fit: Fit) => void> = { ccsfMissionBartlett, ccsfMissionValencia }
