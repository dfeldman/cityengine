import type { MeshBuilder } from '../../buildings.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { prism, type Rgb } from '../../models.ts'
import { classicalColumn } from '../column.ts'
import { block, hex, shade } from '../kit.ts'
import { along, balus, cornice, fig, fin, win } from './louvre-palace.ts'
import { arcade, extrude, palette, pts, rectOn, type Pal } from './palaces/common.ts'
import { Relief, figure } from './minor/sculpt.ts'

const FIXED = 0
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

/**
 * GABRIEL'S TWO PALACES on the north side of the Concorde (1770s), the Hôtel de la Marine to the east of the Rue Royale, and to the west the
 * Crillon with the Hôtels de Plessis-Bellière and de Coislin that share its one front (top-25 audit, 2026-10-30): they were two blocks of
 * six-storey flats. The fronts read off "Hôtel de la Marine.jpg" (Commons), a straight elevation at 1,250 px for the 94 m OSM gives:
 *
 * - a rusticated ground floor of eleven arches between two pavilions with their doors;
 * - over it twelve free Corinthian columns on 4.33 m, a loggia behind with its balconies and two tiers of windows, between the two pavilions'
 *   five engaged columns, medallions, pediments with their reliefs and trophies at their corners (Baldus's Commons photograph has the group
 *   and the second palace's mirror of it);
 * - the balustrade, the flat skyline and the tricolour.
 *
 * Plan metres about the obelisk (x east, z north); the fronts on OSM's own line, and the rest of each block is the OSM outlines raised behind
 * them, drawn 6 m back so that the loggia has somewhere to be.
 */
const STONE: Rgb = hex('#c7b9a0')
const TRIM: Rgb = shade(STONE, 1.08)
const BAND: Rgb = shade(STONE, 0.88)
const DEEP: Rgb = shade(STONE, 0.62)
const GLASS: Rgb = [0.15, 0.17, 0.19]
const plain = surfaceTag('stucco')
const P: Pal = { ...palette('#c7b9a0', '#505860'), stone: STONE, trim: TRIM, deep: BAND }

const G = 7.1            // the ground storey's top
const CAP = 18.4
const ENT = 20.7
const TOP = 22.6

function pavilion(q: MeshBuilder, x0: number): void {
  // (one pavilion, 23 m from x0: a step proud of the colonnade, its five engaged columns)
  const PR = 1.3
  block(q, x0, x0 + 23, -PR, 8, G, ENT, STONE)
  const c = x0 + 11.5
  const at = (x: number): number => x0 + x
  const face = (u0: number, u1: number, y0: number, y1: number, col: Rgb, d: number): void => {
    q.quad([[at(u0), y0, -PR - d], [at(u1), y0, -PR - d], [at(u1), y1, -PR - d], [at(u0), y1, -PR - d]], [0, 0, -1], UV, col, FIXED)
  }
  for (const u of [1.3, 5.7, 10, 14.4, 18.8]) {
    classicalColumn(q, at(u), -PR - 0.15, G + 0.9, CAP, 0.5, TRIM, { order: 'corinthian', tier: 'mid', tag: plain, trim: TRIM })
    block(q, at(u) - 0.7, at(u) + 0.7, -PR - 0.8, -PR, G, G + 0.9, TRIM)
  }
  for (const u of [3.5, 7.85, 12.2, 16.6]) {
    face(u - 1.05, u + 1.05, G + 1.3, 12.8, GLASS, 0.05)
    face(u - 0.8, u + 0.8, 14.4, 17.4, GLASS, 0.05)
    face(u - 1.3, u + 1.3, 13, 13.5, TRIM, 0.1)
    face(u - 0.04, u + 0.04, G + 1.3, 12.8, [0.3, 0.32, 0.34], 0.08)
  }
  // the medallion in the panel beyond the columns, the niche under it
  const u = 21
  const r = new Relief(q, at(u), 0, -PR - 0.02, TRIM, 0.3)
  r.disc([0, 15.3, 0], 1, 0.26, 8)
  r.lump([0, 15.3, 0.25], 0.42, 0.56, 0.16, 4, true, 2)
  face(u - 0.75, u + 0.75, G + 1.5, 12, GLASS, 0.05)
  // the pavilion's own entablature standing out over the colonnade's
  block(q, x0 - 0.1, x0 + 23.1, -PR - 0.6, 8, CAP, ENT, TRIM)
  fin(q, x0 - 0.1, x0 + 23.1, ENT - 0.3, ENT + 0.1, PR + 0.9, TRIM)
  // the pediment over five bays, its figures massed
  const b0 = c - 7.7 - 0.7, b1 = c + 7.7 - 0.7
  const m = (b0 + b1) / 2
  q.quad([[b0, ENT + 0.1, -PR - 0.3], [b1, ENT + 0.1, -PR - 0.3], [m, ENT + 4.1, -PR - 0.3], [m, ENT + 4.1, -PR - 0.3]], [0, 0, -1], UV, TRIM, FIXED)
  for (const s of [-1, 1]) {
    const a: [number, number, number] = [m + s * 8.2, ENT, -PR - 0.8], t: [number, number, number] = [m, ENT + 4.4, -PR - 0.8]
    q.quad([a, t, [t[0], t[1] + 0.5, t[2]], [a[0], a[1] + 0.5, a[2]]], [0, 0, -1], UV, TRIM, FIXED)
    q.quad([[a[0], a[1] + 0.5, a[2]], [t[0], t[1] + 0.5, t[2]], [t[0], t[1] + 0.5, 6], [a[0], a[1] + 0.5, 6]], [s * 0.45, 0.89, 0], UV, shade(P.slate, 1), FIXED)
  }
  const rel = new Relief(q, m, ENT + 0.1, -PR - 0.33, TRIM, 0.4)
  figure(rel, { k: 0.32, coarse: true, hip: [-1.6, 0.6, 0.18], chest: [-0.9, 1.25, 0.2], head: [-0.5, 1.95, 0.22], armL: [[-1.7, 1.5, 0.22], [-2.5, 1, 0.22]], armR: [[0, 1.5, 0.22], [0.5, 1.2, 0.22]] })
  figure(rel, { k: 0.32, coarse: true, hip: [1.7, 0.6, 0.18], chest: [1, 1.25, 0.2], head: [0.6, 1.95, 0.22], armL: [[1.7, 1.5, 0.22], [2.6, 1, 0.22]], armR: [[0.2, 1.5, 0.22], [-0.3, 1.1, 0.22]] })
  // the trophies at its feet, on the balustrade's line
  for (const u2 of [3.6, 19.4 - 0.7 + 3.2]) {
    block(q, at(u2) - 1.2, at(u2) + 1.2, -PR + 0.2, 1.4, ENT, TOP, TRIM)
    prism(q, at(u2), 0.3, TOP, TOP + 1.4, 1.1, 6, BAND, plain, 0.5)
    prism(q, at(u2), 0.3, TOP + 1.4, TOP + 2.8, 0.55, 5, TRIM, plain, 0.15)
    const tr = new Relief(q, at(u2), TOP, -0.9, BAND, 0.4)
    tr.lump([-0.75, 0.8, 0.1], 0.42, 0.7, 0.32, 4, true, 2)
    tr.lump([0.75, 0.8, 0.1], 0.42, 0.7, 0.32, 4, true, 2)
  }
}

function front(flag: boolean): (q: MeshBuilder, L: number) => void {
  return (q, L) => {
    const PW = 23
    // ---- the ground storey: rustication, the eleven arches in the middle, the pavilions' doors and windows
    const n = 11
    const span = L - 2 * PW - 3
    const centres = Array.from({ length: n }, (_, i) => PW + 1.5 + (i + 0.5) * (span / n))
    arcade(q, 0, PW, L - PW, 0, G, centres, 3.2, 5.3, 0.9, STONE, DEEP, GLASS, 8)
    for (const s of [0, L - PW]) {
      block(q, s, s + PW, -1.3, 8, 0, G, STONE)
      const u = (t: number): number => s + t
      const door = 11.5
      const rect = (t0: number, t1: number, y0: number, y1: number, c: Rgb): void => {
        q.quad([[u(t0), y0, -1.34], [u(t1), y0, -1.34], [u(t1), y1, -1.34], [u(t0), y1, -1.34]], [0, 0, -1], UV, c, FIXED)
      }
      rect(door - 1.5, door + 1.5, 0.3, 5.4, GLASS)
      rect(door - 2, door + 2, 5.4, 5.9, TRIM)
      for (const t of [3, 7, 16, 20]) rect(t - 0.8, t + 0.8, 1.2, 4.7, GLASS)
    }
    // the rusticated courses over all of it
    for (let y = 0.9; y < G - 0.6; y += 0.72) {
      q.quad([[PW, y, -0.03], [L - PW, y, -0.03], [L - PW, y + 0.05, -0.03], [PW, y + 0.05, -0.03]], [0, 0, -1], UV, BAND, FIXED)
      for (const s of [0, L - PW]) q.quad([[s, y, -1.33], [s + PW, y, -1.33], [s + PW, y + 0.05, -1.33], [s, y + 0.05, -1.33]], [0, 0, -1], UV, BAND, FIXED)
    }
    for (const c of centres) {
      for (let k = 0; k < 5; k++) {
        const a = Math.PI * (0.18 + 0.16 * k)
        q.quad([[c + Math.cos(a) * 1.6, 3.7 + Math.sin(a) * 1.6, -0.05], [c + Math.cos(a + 0.05) * 2.2, 3.7 + Math.sin(a + 0.05) * 2.2, -0.05], [c + Math.cos(a + 0.2) * 2.2, 3.7 + Math.sin(a + 0.2) * 2.2, -0.05], [c + Math.cos(a + 0.2) * 1.6, 3.7 + Math.sin(a + 0.2) * 1.6, -0.05]], [0, 0, -1], UV, k % 2 ? BAND : TRIM, FIXED)
      }
    }
    cornice(q, 0, L, G - 0.5, G, 1.5, TRIM)

    // ---- the loggia: wall, windows, the balconies, twelve columns
    const LZ = 2.6
    block(q, PW, L - PW, LZ, LZ + 1, G, CAP, BAND)
    q.quad([[PW, G + 0.02, -0.4], [L - PW, G + 0.02, -0.4], [L - PW, G + 0.02, LZ], [PW, G + 0.02, LZ]], [0, 1, 0], UV, BAND, FIXED)
    const cs = 4.33
    const c0 = (L - 11 * cs) / 2
    for (let i = 0; i < 12; i++) {
      const x = c0 + i * cs
      classicalColumn(q, x, 0.1, G + 0.9, CAP, 0.5, shade(STONE, 1.1), { order: 'corinthian', tier: 'near', tag: plain, trim: TRIM })
      block(q, x - 0.7, x + 0.7, -0.6, 0.8, G, G + 0.9, TRIM)
      if (i < 11) {
        const m = x + cs / 2
        const f = (u0: number, u1: number, y0: number, y1: number, c: Rgb, d = 0.03): void => {
          q.quad([[u0, y0, LZ - d], [u1, y0, LZ - d], [u1, y1, LZ - d], [u0, y1, LZ - d]], [0, 0, -1], UV, c, FIXED)
        }
        f(m - 1, m + 1, G + 1, 12.8, GLASS)
        f(m - 1.3, m + 1.3, 13, 13.45, TRIM)
        f(m - 0.8, m + 0.8, 14.3, 17.3, GLASS)
        f(m - 0.03, m + 0.03, G + 1, 12.8, [0.32, 0.34, 0.36], 0.06)
        // the balcony between the plinths
        const bal = (u: number): void => { block(q, u - 0.05, u + 0.05, 0.05, 0.15, G, G + 0.82, TRIM) }
        for (let k = 0; k < 6; k++) bal(m - 1.15 + (k * 2.3) / 5)
        block(q, m - 1.5, m + 1.5, 0, 0.2, G + 0.82, G + 0.95, TRIM)
      }
    }
    q.quad([[PW, CAP, -0.45], [L - PW, CAP, -0.45], [L - PW, CAP, LZ], [PW, CAP, LZ]], [0, -1, 0], UV, DEEP, FIXED)
    // the entablature, and the balustrade the length of it
    block(q, PW, L - PW, -0.45, LZ + 1, CAP, ENT, TRIM)
    q.quad([[PW, CAP + 0.8, -0.47], [L - PW, CAP + 0.8, -0.47], [L - PW, CAP + 1.5, -0.47], [PW, CAP + 1.5, -0.47]], [0, 0, -1], UV, STONE, FIXED)
    fin(q, 0, L, ENT - 0.25, ENT + 0.1, 0.8, TRIM)
    const part = q
    {
      // (the balustrade's own frame stands on the front of the wall behind)
      const y = ENT + 0.1
      block(part, PW, L - PW, 0, 1.6, y, y + 0.3, TRIM)
      const m = Math.round((L - 2 * PW) / 0.85)
      for (let i = 0; i < m; i++) { const x = PW + ((i + 0.5) * (L - 2 * PW)) / m; prism(part, x, 0.4, y + 0.3, y + 1.35, 0.13, 4, TRIM, plain, 0.08) }
      block(part, PW, L - PW, 0, 0.9, y + 1.35, y + 1.6, TRIM)
      for (let x = PW; x <= L - PW + 0.01; x += (L - 2 * PW) / 6) block(part, x - 0.4, x + 0.4, 0, 0.9, y, y + 1.7, TRIM)
    }
    pavilion(q, 0)
    pavilion(q, L - PW)
    // the flat lead behind the balustrade
    block(q, 0, L, 1.6, 8, ENT + 0.1, ENT + 0.5, hex('#5e6467'))
    if (flag) {
      prism(q, L / 2, 3, TOP, TOP + 11, 0.09, 5, [0.22, 0.22, 0.24], FIXED, 0.05)
      const c: Rgb[] = [hex('#1d3f8c'), hex('#eeeeee'), hex('#c8202f')]
      for (let i = 0; i < 3; i++) {
        q.quad([[L / 2 + 0.1 + i * 1.1, TOP + 8, 3], [L / 2 + 1.2 + i * 1.1, TOP + 8.1, 3], [L / 2 + 1.2 + i * 1.1, TOP + 10.8, 3], [L / 2 + 0.1 + i * 1.1, TOP + 10.7, 3]], [0, 0, -1], UV, c[i], FIXED)
        q.quad([[L / 2 + 1.2 + i * 1.1, TOP + 8.1, 3], [L / 2 + 0.1 + i * 1.1, TOP + 8, 3], [L / 2 + 0.1 + i * 1.1, TOP + 10.7, 3], [L / 2 + 1.2 + i * 1.1, TOP + 10.8, 3]], [0, 0, 1], UV, c[i], FIXED)
      }
    }
    // the ends of the front range, showing down the Rue Royale
    for (const x of [0, L]) {
      const s = x === 0 ? -1 : 1
      q.quad(s < 0 ? [[x, 0, 8], [x, 0, -1.3], [x, ENT, -1.3], [x, ENT, 8]] : [[x, 0, -1.3], [x, 0, 8], [x, ENT, 8], [x, ENT, -1.3]], [s, 0, 0], UV, STONE, FIXED)
    }
    void balus
    void win
    void rectOn
  }
}

export function gabrielPalaces(out: MeshBuilder): void {
  const storeys = [{ y: 1, h: 3.8, arched: true, sill: 0.2 }, { y: 7.8, h: 4.2 }, { y: 13.2, h: 3 }]
  const opts = { eaves: 19.5, storeys, bay: 4.3, win: 1.7, rise: 3, inset: 1.6, frames: false }
  const shift = (a: number[]): ReturnType<typeof pts> => pts(a)
  // the rest of each block: OSM's outlines raised, their fronts drawn back behind the front's range
  extrude(out, [shift([-1, 227, -7, 215, -13.4, 208.4, -9.4, 204.4, 15.6, 194.4, 52, 269, 23, 282])], P, opts)
  extrude(out, [shift([15.6, 194.4, 50.6, 176.4, 61, 204, 50, 209, 65, 238, 48, 247, 47, 245, 42, 248, 31, 226, 35, 224, 34, 221, 29, 223])], P, opts)
  extrude(out, [shift([61, 204, 50.6, 176.4, 65.6, 167.4, 71.6, 167.4, 79, 182, 77, 184, 82, 196])], P, opts)
  extrude(out, [shift([119, 208, 91.6, 157.4, 95.6, 153.4, 176.6, 116.4, 180, 124, 178, 125, 199, 168, 172, 181, 169, 174, 155, 181, 159, 189]),
    shift([120, 181, 158, 163, 149, 144, 111, 162]), shift([167, 159, 181, 152, 171, 133, 158, 139])], P, opts)
  along(out, [-16, 203], [69, 162], (q, L) => front(false)(q, L))
  along(out, [89, 152], [174, 111], (q, L) => front(true)(q, L))
  void fig
}
