/**
 * SAINT IGNATIUS CHURCH, Fulton Street at Parker (Charles Devlin, 1914; way/225193440, its tower parts
 * way/1028575826 and /827) — the University of San Francisco's church on the highest point of Fulton Street, whose
 * twin towers and dome are seen from half the city. Campus audit 2026-10-05, from Commons
 * "Saint_Ignatius_Church_(San_Francisco).jpg" (the front and east tower from Fulton) and "St Ignatius Church with
 * Salesforce Tower in the backdrop.jpg" (the whole flank from the west). It was the church() kit's restrained one-spire
 * guess, built with no photograph.
 *
 * Jesuit Baroque in cream terra cotta over a buff-taupe brick body. The FRONT faces south on Fulton: between the two
 * towers a giant colonnade carries an entablature, and over it an upper stage of columns under a pediment. The TOWERS
 * stand at the front corners — square shafts with arched windows up past the nave cornice, then a tall octagonal
 * stage with an arched opening on each face between paired columns, a smaller open belfry stage over that, and a
 * grey-blue domed cap with a lantern, a spire and a gilt cross. Behind: the long NAVE, a clerestory of tall arched
 * windows over lower aisles under a low grey metal roof, and at the north end the big ribbed grey DOME on its drum,
 * with its own lantern.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'
import { prism } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { tower, towerRing } from '../tower.ts'
import { boxAlong, cupola } from '../parts.ts'
import { frontFrame } from './macang.ts'

const CREAM: Rgb = [0.9, 0.86, 0.74]
const BODY: Rgb = [0.74, 0.69, 0.6]
const SHADE: Rgb = [0.8, 0.75, 0.64]
const DARK: Rgb = [0.15, 0.17, 0.2]
const CAP: Rgb = [0.3, 0.35, 0.4]
const GOLD: Rgb = [0.85, 0.68, 0.3]
const ROOF: Rgb = [0.52, 0.53, 0.52]

export function saintIgnatiusChurch(out: MeshBuilder, fit: Fit): void {
  const G = Math.max(0, fit.grade ?? 0)
  const st = surfaceTag('ashlar'), metal = surfaceTag('metal')
  // the aisles and every lower wall: the whole footprint to the aisle cornice
  const AISLE = 16
  tower(out, fit, {
    height: G + AISLE,
    tiers: [{ to: G + AISLE, face: { kind: 'punched', wall: BODY, glass: DARK, pitch: 6, solid: 0.72, floor: 9, arched: true, material: 'brick' }, cornice: { depth: 0.6, height: 1, colour: CREAM } }],
    roof: ROOF,
    crown: { kind: 'flat' },
  })
  const f = frontFrame(out, fit, G)
  const L = f.L, T = Math.min(11.5, L * 0.22)
  // the depth of the footprint behind the front
  const ring = towerRing(fit)
  const [mx, mz] = f.at(0, 0), nx = Math.sin(f.heading), nz = Math.cos(f.heading)
  let D = 0
  for (const p of ring) D = Math.max(D, -((p.x - mx) * nx + (p.z - mz) * nz))
  D = Math.max(40, D)

  // THE NAVE: the clerestory over the aisles, from behind the towers to the dome, its tall arched windows each side
  const NW = Math.min(24, L - 2 * T + 2), CL = AISLE + 13
  const n0 = -T + 1, domeR = Math.min(10.5, (L - 8) / 2 * 0.62), domeAt = -(D - domeR - 3)
  const n1 = domeAt + domeR
  const nlen = n0 - n1
  f.on(0, AISLE + (CL - AISLE) / 2, n0 - nlen / 2, NW, CL - AISLE, nlen, CREAM, st)
  f.on(0, CL + 0.4, n0 - nlen / 2, NW + 1.2, 0.8, nlen + 1, SHADE, st)
  const bays = Math.max(5, Math.round(nlen / 5.4))
  for (let k = 0; k < bays; k++) {
    const o = n0 - ((k + 0.5) / bays) * nlen
    for (const s of [-1, 1]) f.on(s * (NW / 2 + 0.03), AISLE + 6.2, o, 0.06, 7, 2.2, DARK, 0)
  }
  // its low gabled metal roof
  for (const s of [-1, 1]) {
    const [ax, az] = f.at(s * (NW / 2 + 0.6), n0), [bx, bz] = f.at(s * (NW / 2 + 0.6), n1), [cx, cz] = f.at(0, n1), [dx, dz] = f.at(0, n0)
    const y0 = G + CL + 0.8, y1 = G + CL + 3.6
    const q: [number, number, number][] = [[ax, y0, az], [bx, y0, bz], [cx, y1, cz], [dx, y1, dz]]
    out.quad(s > 0 ? q : [q[1], q[0], q[3], q[2]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], ROOF, metal)
  }

  // THE DOME at the north end: a square base to the clerestory, a pedimented gable on each arm, the drum and the
  // ribbed grey dome with its lantern
  f.on(0, AISLE + (CL - AISLE) / 2, domeAt, domeR * 2 + 3, CL - AISLE, domeR * 2 + 3, CREAM, st)
  f.on(0, CL + 0.5, domeAt, domeR * 2 + 4, 1, domeR * 2 + 4, SHADE, st)
  for (const s of [-1, 1]) f.tri(-domeR * 0.8, domeR * 0.8, CL + 1, 3.4, domeAt + s * (domeR + 1.6), CREAM, st)
  const [dx, dz] = f.at(0, domeAt)
  cupola(out, { x: dx, z: dz }, G + CL + 1, domeR, { drum: 5.5, dome: domeR * 0.95, colour: CREAM, domeColour: CAP, domeMaterial: 'metal', material: 'ashlar' })
  prism(out, dx, dz, G + CL + 6.5 + domeR * 0.95 + domeR * 0.5, G + CL + 6.5 + domeR * 1.45 + 2.6, 0.55, 8, CAP, metal, 0.05)

  // THE FRONT between the towers: the giant colonnade, its entablature, the upper columns and pediment
  const pw = L - 2 * T
  const cols = 6
  f.on(0, 0.5, 4, pw + 4, 1, 8, SHADE, st)                                  // the wide stair to the doors
  for (let k = 0; k < cols; k++) {
    const u = -pw / 2 + 1.2 + (k * (pw - 2.4)) / (cols - 1)
    const [x, z] = f.at(u, 1.3)
    prism(out, x, z, G + 1, G + 2.2, 1, 12, SHADE, st)
    prism(out, x, z, G + 2.2, G + 14.4, 0.75, 12, CREAM, st, 0.66)
    prism(out, x, z, G + 14.4, G + 15.2, 1, 12, SHADE, st)
  }
  for (const u of [-pw * 0.3, 0, pw * 0.3]) f.on(u, 4.5, 0.06, 2.8, 7, 0.1, DARK, 0)
  f.on(0, 15.9, 1.1, pw + 1, 1.6, 2.6, CREAM, st)
  // the upper stage: a screen wall up to the nave, four columns, the pediment
  const uw = Math.min(NW, pw - 2)
  f.on(0, 17 + 6, -0.6, uw, 12, 1.4, CREAM, st)
  for (let k = 0; k < 4; k++) {
    const u = -uw / 2 + 1 + (k * (uw - 2)) / 3
    const [x, z] = f.at(u, 0.6)
    prism(out, x, z, G + 17, G + 28, 0.55, 12, CREAM, st, 0.5)
  }
  f.on(0, 23, 0.12, 4, 6.5, 0.1, DARK, 0)                                    // the great arched window
  f.on(0, 29.2, 0.4, uw + 1.2, 1.2, 2.2, SHADE, st)
  f.tri(-uw / 2 - 0.6, uw / 2 + 0.6, 29.8, 4.2, 1.45, CREAM, st)
  f.tri(-uw / 2 - 0.6, uw / 2 + 0.6, 29.8, 4.2, -0.6, CREAM, st)
  for (const s of [-1, 1]) {
    const [ax, az] = f.at(s * (uw / 2 + 0.6), 1.45), [tx, tz] = f.at(0, 1.45), [bx, bz] = f.at(s * (uw / 2 + 0.6), -3), [cx, cz] = f.at(0, -3)
    const q: [number, number, number][] = [[ax, G + 29.8, az], [tx, G + 34, tz], [cx, G + 34, cz], [bx, G + 29.8, bz]]
    out.quad(s > 0 ? q : [q[1], q[0], q[3], q[2]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], ROOF, metal)
  }

  // THE TWIN TOWERS
  for (const s of [-1, 1]) {
    const u = s * (L / 2 - T / 2)
    const [x, z] = f.at(u, -T / 2 + 0.3)
    const sq = (y0: number, y1: number, half: number, c: Rgb): void => boxAlong(out, x, G + (y0 + y1) / 2, z, half, (y1 - y0) / 2, half, f.heading, c, st)
    sq(0, 34, T / 2, BODY)
    sq(15, 16.6, T / 2 + 0.35, CREAM)
    sq(33, 35, T / 2 + 0.45, CREAM)
    // the arched windows on each face of the shaft, and its corner pilasters
    for (let side = 0; side < 4; side++) {
      const hd = f.heading + (side * Math.PI) / 2
      const ex = Math.sin(hd), ez = Math.cos(hd), ax = Math.cos(hd), az = -Math.sin(hd)
      for (const [y, h] of [[8, 3.2], [25, 3.6]]) boxAlong(out, x + ex * (T / 2 + 0.04), G + y, z + ez * (T / 2 + 0.04), 0.9, h, 0.05, hd, DARK, 0)
      for (const v of [-1, 1]) boxAlong(out, x + ex * (T / 2 + 0.1) + ax * v * (T / 2 - 0.5), G + 25, z + ez * (T / 2 + 0.1) + az * v * (T / 2 - 0.5), 0.5, 8, 0.15, hd, CREAM, st)
    }
    // the tall octagonal stage: an arched opening on each face between paired columns
    const r1 = T * 0.42
    prism(out, x, z, G + 35, G + 45, r1, 8, CREAM, st)
    for (let k = 0; k < 8; k++) {
      const a = ((k + 0.5) / 8) * Math.PI * 2
      boxAlong(out, x + Math.sin(a) * (r1 * 0.93 + 0.03), G + 40, z + Math.cos(a) * (r1 * 0.93 + 0.03), r1 * 0.2, 2.8, 0.05, a, DARK, 0)
      const c = (k / 8) * Math.PI * 2
      prism(out, x + Math.sin(c) * (r1 + 0.2), z + Math.cos(c) * (r1 + 0.2), G + 35.4, G + 44.4, 0.32, 8, SHADE, st)
    }
    prism(out, x, z, G + 45, G + 46.2, r1 + 0.6, 8, SHADE, st)
    // the open belfry
    const r2 = r1 * 0.78
    prism(out, x, z, G + 46.2, G + 52.5, r2, 8, CREAM, st)
    for (let k = 0; k < 8; k++) {
      const a = ((k + 0.5) / 8) * Math.PI * 2
      boxAlong(out, x + Math.sin(a) * (r2 * 0.93 + 0.03), G + 49.4, z + Math.cos(a) * (r2 * 0.93 + 0.03), r2 * 0.22, 2, 0.05, a, DARK, 0)
    }
    prism(out, x, z, G + 52.5, G + 53.4, r2 + 0.5, 8, SHADE, st)
    // the domed cap, the lantern, the spire and its gilt cross
    prism(out, x, z, G + 53.4, G + 55, r2 * 0.95, 12, CAP, metal, r2 * 0.75)
    prism(out, x, z, G + 55, G + 56.4, r2 * 0.75, 12, CAP, metal, r2 * 0.3)
    prism(out, x, z, G + 56.4, G + 58.4, r2 * 0.3, 8, CAP, metal)
    prism(out, x, z, G + 58.4, G + 62.5, r2 * 0.28, 8, CAP, metal, 0.04)
    boxAlong(out, x, G + 63.3, z, 0.07, 0.8, 0.07, f.heading, GOLD, metal)
    boxAlong(out, x, G + 63.5, z, 0.4, 0.07, 0.07, f.heading, GOLD, metal)
  }
}

export const ST_IGNATIUS: Record<string, (out: MeshBuilder, fit: Fit) => void> = { saintIgnatiusChurch }
