/**
 * THE CARMELITE MONASTERY OF CRISTO REY, 721 Parker Avenue at Fulton (OSM relation 3526713; the owner, 2026-10-06: "the
 * monastery at 721 Parker" — cream walls, red tile roofs, a dome with a lantern, round windows along the nave, an ornate
 * carved portal, a bell tower with arched openings, an arcaded loggia). From Mapillary on Fulton and Parker: a closed
 * courtyard monastery of three storeys under low tile roofs, its walls screened by clipped cypresses; the chapel along
 * Fulton — round windows down its nave, a domed crossing with a lantern at the west end — and at the Parker corner the
 * entrance front: a carved Churrigueresque portal under an arcaded loggia of five arches, the square bell tower beside
 * it with an open arched belfry and a little cupola.
 *
 * Standalone over the outline (OSM's own ring and courtyard), centred at (−3636, −1968) with no turn: x east, z north.
 */
import type { MeshBuilder } from '../../buildings.ts'
import { capPolygonWithHoles } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { dome } from '../kit.ts'
import { inset, outward, walls, type P } from './ec4-podium.ts'

const C = { x: -3636, z: -1968 }
const rel = (pts: [number, number][]): P[] => pts.map(([x, z]) => ({ x: x - C.x, z: z - C.z }))
const ccw = (r: P[]): P[] => { let a = 0; for (let i = 0; i < r.length; i++) { const p = r[i], q = r[(i + 1) % r.length]; a += p.x * q.z - q.x * p.z } return a > 0 ? r : [...r].reverse() }
const OUTER = ccw(rel([[-3645, -1953], [-3615, -1948], [-3610, -1979], [-3615, -1979], [-3611, -1992], [-3612, -1996], [-3637, -2000], [-3645, -2002], [-3654, -2002], [-3656, -1991], [-3653, -1987], [-3656, -1967], [-3659, -1967], [-3663, -1938], [-3648, -1935], [-3645, -1953]]))
const COURT = [...ccw(rel([[-3640, -1965], [-3624, -1962], [-3621, -1981], [-3637, -1984]]))].reverse()

const CREAM: Rgb = [0.9, 0.82, 0.68]
const TRIM: Rgb = [0.84, 0.74, 0.58]
const TILE: Rgb = [0.66, 0.32, 0.22]
const GLASS: Rgb = [0.16, 0.18, 0.2]
const CYPRESS: Rgb = [0.18, 0.3, 0.16]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

/** a low tile roof over a ring: from its eaves up to an inset ring, the flat between */
function tileRoof(out: MeshBuilder, ring: P[], hole: P[] | null, y: number, rise: number, tag: number): void {
  const lip = inset(ring, -0.5), top = inset(ring, 3.2)
  for (let i = 0; i < lip.length; i++) {
    const j = (i + 1) % lip.length, o = outward(ring, i)
    out.quad([[lip[i].x, y, lip[i].z], [lip[j].x, y, lip[j].z], [top[j].x, y + rise, top[j].z], [top[i].x, y + rise, top[i].z]], [o.x * 0.4, 1, o.z * 0.4], UV, TILE, tag)
  }
  if (hole) {
    const hl = inset(hole, -0.5), ht = inset(hole, 3.2)
    for (let i = 0; i < hl.length; i++) {
      const j = (i + 1) % hl.length, o = outward(hole, i)
      out.quad([[hl[i].x, y, hl[i].z], [hl[j].x, y, hl[j].z], [ht[j].x, y + rise, ht[j].z], [ht[i].x, y + rise, ht[i].z]], [o.x * 0.4, 1, o.z * 0.4], UV, TILE, tag)
    }
    capPolygonWithHoles(out, [top, ht], y + rise, TILE, tag)
  }
}

export function carmeliteMonastery(out: MeshBuilder, _fit: Fit): void {
  const stucco = surfaceTag('stucco'), tile = surfaceTag('tile')
  const H = 9.5
  // ---- the cloister ranges: three storeys of cream stucco, small deep windows, a low tile roof round the court
  for (const ring of [OUTER, COURT]) {
    walls(out, ring, 0, H, CREAM, stucco)
    walls(out, inset(ring, -0.03), H - 0.45, H, TRIM, stucco)
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i], b = ring[(i + 1) % ring.length], L = Math.hypot(b.x - a.x, b.z - a.z), o = outward(ring, i)
      const n = Math.floor(L / 3.2)
      for (let k = 0; k < n; k++) {
        const t = (k + 0.5) / n, x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t
        for (const y of [4.6, 7.6]) box(out, x + o.x * 0.04, y, z + o.z * 0.04, Math.abs(o.z) * 0.45 + 0.02, 0.6, Math.abs(o.x) * 0.45 + 0.02, GLASS, 0)
      }
    }
  }
  tileRoof(out, OUTER, COURT, H, 2.2, tile)
  // the clipped cypresses screening the walls on Parker and Fulton
  for (let z = -22; z <= 14; z += 1.9) {
    prism(out, 26.2, z, 0, 4.4, 1.25, 8, CYPRESS, 0, 1.05)
  }
  // ---- the chapel along Fulton: a taller nave, round windows, a gable roof of tile
  const zc = -28.5, nx0 = -18, nx1 = 22, hw = 5.6, NH = 13
  box(out, (nx0 + nx1) / 2, NH / 2, zc, (nx1 - nx0) / 2, NH / 2, hw, CREAM, stucco)
  box(out, (nx0 + nx1) / 2, NH - 0.3, zc, (nx1 - nx0) / 2 + 0.25, 0.3, hw + 0.25, TRIM, stucco)
  for (const s of [-1, 1]) {
    out.quad([[nx0, NH, zc + s * (hw + 0.6)], [nx1, NH, zc + s * (hw + 0.6)], [nx1, NH + 3.4, zc], [nx0, NH + 3.4, zc]], [0, 1, s * 0.6], UV, TILE, tile)
    // the round windows down the nave
    for (let x = nx0 + 5; x < nx1 - 6; x += 4.4) {
      const cz = zc + s * (hw + 0.03)
      for (let k = 0; k < 10; k++) {
        const a0 = (k / 10) * Math.PI * 2, a1 = ((k + 1) / 10) * Math.PI * 2, r = 0.75
        out.quad([[x, 9.2, cz], [x + Math.cos(a0) * r, 9.2 + Math.sin(a0) * r, cz], [x + Math.cos(a1) * r, 9.2 + Math.sin(a1) * r, cz], [x, 9.2, cz]], [0, 0, s], UV, GLASS, 0)
      }
      box(out, x, 9.2, zc + s * (hw + 0.02), 0.95, 0.95, 0.01, TRIM, stucco)
    }
  }
  // the domed crossing at the west end, on an octagonal drum, with its lantern
  const dx = nx0 + 4
  prism(out, dx, zc, NH, NH + 3.2, hw + 0.6, 8, CREAM, stucco)
  for (let k = 0; k < 8; k++) {
    const a = ((k + 0.5) / 8) * Math.PI * 2
    box(out, dx + Math.cos(a) * (hw + 0.62), NH + 1.6, zc + Math.sin(a) * (hw + 0.62), 0.35, 0.8, 0.35, GLASS, 0)
  }
  dome(out, dx, zc, NH + 3.2, hw + 0.3, 4.8, TILE, 16)
  prism(out, dx, zc, NH + 7.9, NH + 9.4, 1.0, 8, CREAM, stucco)
  dome(out, dx, zc, NH + 9.4, 1.1, 0.9, TILE, 8)
  prism(out, dx, zc, NH + 10.2, NH + 11.4, 0.08, 4, [0.3, 0.3, 0.3], 0)
  // ---- the entrance front at the Parker corner: the carved portal, the arcaded loggia over it, the stepped gable
  const fx = nx1 + 0.05
  box(out, fx + 0.3, 4, zc, 0.35, 4, 3.4, TRIM, stucco)                         // the portal's carved frame
  for (let k = 0; k < 6; k++) box(out, fx + 0.5, 1 + k * 1.15, zc, 0.12, 0.35, 3.0 - k * 0.15, [0.78, 0.66, 0.5], stucco)
  box(out, fx + 0.42, 2.2, zc, 0.06, 2.2, 1.3, [0.35, 0.22, 0.14], 0)            // the doors
  for (let k = 0; k < 6; k++) { const a = (Math.PI * (k + 0.5)) / 6; box(out, fx + 0.42, 4.4 + Math.sin(a) * 1.3, zc + Math.cos(a) * 1.3, 0.06, 0.22, 0.22, [0.35, 0.22, 0.14], 0) }
  for (let k = 0; k < 5; k++) {                                                 // the loggia's five arches
    const z = zc - 3.2 + k * 1.6
    box(out, fx + 0.1, 9.6, z, 0.12, 1.1, 0.55, [0.2, 0.18, 0.16], 0)
    box(out, fx + 0.2, 10.75, z, 0.14, 0.12, 0.62, TRIM, stucco)
  }
  for (let k = 0; k < 4; k++) box(out, fx, NH + 0.6 + k * 0.7, zc, 0.3, 0.35, hw - 0.9 - k * 1.2, CREAM, stucco)
  // the bell tower beside it: a square shaft, the open arched belfry, a tile cap and a little cupola with a cross
  const tx = nx1 - 2.5, tz = zc + hw + 2.6
  box(out, tx, 8.5, tz, 2.1, 8.5, 2.1, CREAM, stucco)
  box(out, tx, 17.2, tz, 2.3, 0.2, 2.3, TRIM, stucco)
  for (const [ox, oz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) for (const s of [-0.9, 0.9]) {
    box(out, tx + ox * 2.12 + (oz ? s : 0), 15.4, tz + oz * 2.12 + (ox ? s : 0), ox ? 0.02 : 0.5, 1.2, oz ? 0.02 : 0.5, GLASS, 0)
  }
  prism(out, tx, tz, 17.4, 19.4, 2.4, 4, TILE, tile, 0.9)
  dome(out, tx, tz, 19.4, 0.95, 1.1, TILE, 8)
  box(out, tx, 21.1, tz, 0.06, 0.6, 0.06, [0.3, 0.3, 0.3], 0)
  box(out, tx, 21.3, tz, 0.3, 0.06, 0.06, [0.3, 0.3, 0.3], 0)
}

export const CARMELITE: Record<string, (out: MeshBuilder, fit: Fit) => void> = { carmeliteMonastery }
