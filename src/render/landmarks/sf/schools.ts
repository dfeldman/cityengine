/**
 * SAN FRANCISCO's LANDMARK SCHOOLS (universities audit, 2026-10-04: the high schools were the bake's walk-ups).
 *
 * Mission High School, 3750 18th Street (1926, John Reid Jr.; way/6986235, 176 m along 18th): Commons "Mission High
 * School San Francisco California.jpg", "San Francisco Mission High School January 2026 1.jpg", the sunset view
 * from Dolores Park. Three storeys of white stucco under red tile, curved Mission-revival parapets over the bays, and
 * the landmark of the whole valley: the tall tower on the 18th Street front, a plain white shaft rising to a richly
 * carved buff stage of arched openings, an octagonal drum and dome, and a finial — Dolores Park's skyline. Front 180:
 * 18th Street (and the park) is south.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'
import { prism } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { tower, towerRing } from '../tower.ts'
import { boxAlong, edgeAt, edgeFacing } from '../parts.ts'

const WHITE: Rgb = [0.93, 0.92, 0.88]
const CARVED: Rgb = [0.72, 0.58, 0.44]
const TILE: Rgb = [0.6, 0.3, 0.22]
const GLASS: Rgb = [0.2, 0.22, 0.25]

export function missionHighSchool(out: MeshBuilder, fit: Fit): void {
  const G = Math.max(0, fit.grade ?? 0)
  const H = 15
  tower(out, fit, {
    height: H,
    base: { height: 4.5, face: { kind: 'punched', wall: WHITE, glass: GLASS, pitch: 3.2, solid: 0.5, floor: 4.5, arched: true, material: 'stucco' } },
    tiers: [{ to: H, face: { kind: 'punched', wall: WHITE, glass: GLASS, pitch: 2.6, solid: 0.45, floor: 3.5, material: 'stucco' } }],
    roof: TILE,
    crown: { kind: 'parapet', height: 0.6, colour: WHITE, material: 'stucco' },
  })
  const st = surfaceTag('stucco'), tc = surfaceTag('terracotta')
  const ring = towerRing(fit)
  const e = edgeAt(ring, edgeFacing(ring))
  const on = (u: number, y: number, o: number, w: number, h: number, d: number, c: Rgb, tag = st): void =>
    boxAlong(out, e.mid.x + e.tx * u + e.nx * o, y, e.mid.z + e.tz * u + e.nz * o, w / 2, h / 2, d / 2, e.heading, c, tag)
  // the curved Mission parapets over the front's bays, stepped up to a round crest
  for (const u of [-e.L * 0.38, -e.L * 0.14, e.L * 0.2, e.L * 0.42]) {
    for (let k = 0; k < 4; k++) on(u, G + H + 0.6 + k * 0.45, 0.1, 9 - k * 2, 0.45, 0.5, WHITE)
  }
  // the tower, standing forward of the front a little west of centre
  const tu = -e.L * 0.05, T = 7.5
  const [tx, tz] = [e.mid.x + e.tx * tu + e.nx * 2, e.mid.z + e.tz * tu + e.nz * 2]
  const tw = (y0: number, y1: number, half: number, c: Rgb, tag: number): void =>
    boxAlong(out, tx, (y0 + y1) / 2, tz, half, (y1 - y0) / 2, half, e.heading, c, tag)
  tw(G, G + 27, T / 2, WHITE, st)
  // the carved stage: buff, arched openings on each face between corner pilasters, a heavy cornice
  tw(G + 27, G + 36, T / 2 + 0.3, CARVED, tc)
  for (let side = 0; side < 4; side++) {
    const hd = e.heading + (side * Math.PI) / 2
    const sx = Math.sin(hd), cz = Math.cos(hd), ax = Math.cos(hd), az = -Math.sin(hd)
    for (const u of [-1.6, 1.6]) {
      const x = tx + ax * u + sx * (T / 2 + 0.35), z = tz + az * u + cz * (T / 2 + 0.35)
      boxAlong(out, x, G + 31, z, 0.65, 2.6, 0.05, hd, GLASS, 0)
      boxAlong(out, x, G + 33.8, z, 0.45, 0.3, 0.05, hd, GLASS, 0)
    }
    // a clock-like roundel of ornament under the arches
    const rx = tx + sx * (T / 2 + 0.36), rz = tz + cz * (T / 2 + 0.36)
    boxAlong(out, rx, G + 28.3, rz, 1.4, 0.7, 0.06, hd, [0.6, 0.46, 0.34], tc)
  }
  tw(G + 36, G + 37, T / 2 + 0.7, CARVED, tc)
  // the octagonal drum, the dome, the lantern and the finial
  prism(out, tx, tz, G + 37, G + 41, T / 2 - 0.3, 8, CARVED, tc)
  prism(out, tx, tz, G + 41, G + 44.5, T / 2 - 0.1, 8, [0.62, 0.5, 0.4], tc, 0.6)
  prism(out, tx, tz, G + 44.5, G + 46, 0.7, 8, CARVED, tc)
  prism(out, tx, tz, G + 46, G + 50, 0.12, 6, [0.4, 0.38, 0.35], surfaceTag('metal'), 0.03)
}


/**
 * NOTRE DAME SCHOOL, Dolores Street at 16th, across from Mission Dolores (1907; way/288643550). School census
 * 2026-10-05, Mapillary on Dolores: a cream Second Empire block — two storeys of tall segmental windows over a raised
 * basement behind a garden wall — under a grey slate MANSARD with pedimented dormers, and on the north end a columned
 * BELVEDERE carrying a small grey dome, over a porch. Front 270: Dolores is west.
 */
export function notreDameSchool(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.88, 0.85, 0.75], SLATE: Rgb = [0.42, 0.44, 0.47], DARK: Rgb = [0.18, 0.2, 0.22]
  const G = Math.max(0, fit.grade ?? 0)
  const H = G + 12
  tower(out, fit, {
    height: H,
    base: { height: G + 2.6, face: { kind: 'punched', wall: [0.62, 0.6, 0.55], glass: DARK, pitch: 3.4, solid: 0.6, floor: 2.6, material: 'ashlar' } },
    tiers: [{ to: H, face: { kind: 'punched', wall: CREAM, glass: DARK, pitch: 3.4, solid: 0.55, floor: 4.6, material: 'stucco' }, cornice: { depth: 0.7, height: 0.6, colour: [0.94, 0.92, 0.86] } }],
    roof: SLATE,
    crown: { kind: 'mansard', height: 4.2, inset: 1.6, colour: SLATE, material: 'tile', dormers: 3 },
  })
  // the belvedere and dome over the north end of the front
  const ring = towerRing(fit)
  const e = edgeAt(ring, edgeFacing(ring))
  const n = { x: e.mid.x + e.tx * (e.L / 2 - 6) - e.nx * 4, z: e.mid.z + e.tz * (e.L / 2 - 6) - e.nz * 4 }
  const st = surfaceTag('stucco')
  prism(out, n.x, n.z, H + 2, H + 4.5, 2.6, 8, CREAM, st)
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2
    prism(out, n.x + Math.sin(a) * 2.3, n.z + Math.cos(a) * 2.3, H + 4.5, H + 7.5, 0.18, 8, [0.95, 0.94, 0.9], st)
  }
  prism(out, n.x, n.z, H + 7.5, H + 8, 2.7, 8, CREAM, st)
  prism(out, n.x, n.z, H + 8, H + 9.4, 2.4, 12, SLATE, surfaceTag('metal'), 1.4)
  prism(out, n.x, n.z, H + 9.4, H + 10.2, 1.4, 12, SLATE, surfaceTag('metal'), 0.2)
}

export const SCHOOLS: Record<string, (out: MeshBuilder, fit: Fit) => void> = { missionHighSchool, notreDameSchool }
