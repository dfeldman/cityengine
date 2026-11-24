import type { MeshBuilder } from '../../buildings.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import type { Rgb } from '../../models.ts'
import { block, classicalColumn, hex, pane, shade } from '../kit.ts'
import type { Fit } from '../fit.ts'
import { boxOn, faceFrame, pedimentFront, statue } from './monuments/gothic.ts'

const FIXED = 0
const SMOOTH = surfaceTag('stucco')
const UVQ: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

/*
 * The École Militaire's central pavilion on the Champ de Mars (Gabriel, 1751-72). Measured, not guessed:
 * OSM's parts (the pavilion block 16.6 x 21.5 m with its front 1.6 m before the main block, the portico part 29 m wide,
 * 3.9 m deep) and the IGN LiDAR MNS (dome peak 37 m over ground, main slate ridge 22 m, the dome square 21 m at its
 * base, centred 15.6 m behind the portico), against Wikimedia Commons "École Militaire, Paris 7e" (the front at dusk).
 *
 * What a person knows it by, all at true size and depth: eight free-standing Corinthian columns over two storeys
 * (14 m, in coupled pairs at the pavilion corners), the entablature running the whole front at the wings' cornice, the
 * triangular pediment over the pavilion, the attic with its cornice, and the QUADRANGULAR DOME in dark slate with the
 * clock, its lantern and finial.
 *
 * The entry stands at the middle of the pavilion; the front faces −z. Everything is written in metres in a frame that
 * starts at the portico's front step (zf = 0), and ZC moves it onto the entry.
 */
const ZC = 15.65 // the dome's centre, behind the portico's front
const Z = (z: number): number => z - ZC

/** Tunables */
const COL_R = 0.68
const COL_H = 14 // shaft + capital
const COL_X = [-16.2, -11.1, -9.0, -3.6, 3.6, 9.0, 11.1, 16.2]
const COL_Z = 2.9
const WALL_Z = 4.6 // the loggia's back wall and the pavilion's front
const BASE_Y = 0.9 // the stylobate
const ENT_TOP = 17.4 // the main cornice
const PED_RISE = 4.8
const PED_HALF = 11.8
const ATTIC_TOP = 24.6
const ATTIC_HALF = 10.6
const DOME_H = 9.2
const DOME_R0 = 10.1
const DOME_R1 = 2.2

type V3 = [number, number, number]

/** a quadrangular dome: rounded-square rings from the base, closing to the lantern's foot */
function quadDome(out: MeshBuilder, cx: number, cz: number, y0: number, h: number, r0: number, r1: number, slate: Rgb): void {
  const rings = 8, per = 32
  const w = (t: number): number => r1 + (r0 - r1) * Math.pow(Math.cos((t * Math.PI) / 2), 1.15)
  const ring = (t: number): V3[] => {
    const n = 5.2 - 2.6 * t
    const pts: V3[] = []
    for (let i = 0; i < per; i++) {
      const a = (i / per) * Math.PI * 2
      const c = Math.cos(a), s = Math.sin(a)
      const k = Math.pow(Math.pow(Math.abs(c), n) + Math.pow(Math.abs(s), n), -1 / n) * w(t)
      pts.push([cx + c * k, y0 + h * t, cz + s * k])
    }
    return pts
  }
  let prev = ring(0)
  for (let k = 1; k <= rings; k++) {
    const t = k / rings
    const cur = ring(t)
    const lit = shade(slate, 0.88 + 0.22 * t)
    for (let i = 0; i < per; i++) {
      const j = (i + 1) % per
      const mx = (prev[i][0] + prev[j][0]) / 2 - cx, mz = (prev[i][2] + prev[j][2]) / 2 - cz
      const l = Math.hypot(mx, mz) || 1
      out.quad([prev[i], prev[j], cur[j], cur[i]], [mx / l, 0.6, mz / l], UVQ, lit, FIXED)
    }
    prev = cur
  }
}

/** a clock face on a frame: dark rim, pale dial, twelve marks, two hands */
function clockOn(fr: ReturnType<typeof faceFrame>, u: number, y: number, r: number, d: number): void {
  const n = 16
  const pts = (rr: number, dd: number): V3[] => Array.from({ length: n }, (_, i) => fr.P(u + Math.cos((i / n) * Math.PI * 2) * rr, y + Math.sin((i / n) * Math.PI * 2) * rr, dd))
  const fan = (rr: number, dd: number, c: Rgb): void => {
    const p = pts(rr, dd), ce = fr.P(u, y, dd)
    for (let i = 0; i < n; i += 2) fr.out.quad([ce, p[i], p[(i + 1) % n], p[(i + 2) % n]], fr.n, UVQ, c, FIXED)
  }
  fan(r, d, hex('#7a6a40'))
  fan(r * 0.86, d + 0.04, hex('#efe8d2'))
  boxOn(fr, u - 0.07, u + 0.07, y, y + r * 0.7, d + 0.04, d + 0.1, hex('#25252a'))
  boxOn(fr, u, u + r * 0.5, y - 0.07, y + 0.07, d + 0.04, d + 0.1, hex('#25252a'))
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2
    boxOn(fr, u + Math.cos(a) * r * 0.72 - 0.08, u + Math.cos(a) * r * 0.72 + 0.08, y + Math.sin(a) * r * 0.72 - 0.08, y + Math.sin(a) * r * 0.72 + 0.08, d + 0.04, d + 0.09, hex('#25252a'))
  }
}

export function ecoleMilitairePortico(out: MeshBuilder, _fit: Fit): void {
  const stone = hex('#d3c5a3')
  const lightStone = shade(stone, 1.05)
  const deep = shade(stone, 0.78)
  const dark = hex('#2c2b2d')
  const slate = hex('#3a3f48')
  const gold = hex('#a88a3c')
  // ---- the steps and the stylobate under the portico
  block(out, -19.5, 19.5, Z(0.8), Z(WALL_Z), -0.6, 0.35, shade(stone, 0.92))
  block(out, -19, 19, Z(1.5), Z(WALL_Z), -0.6, 0.65, shade(stone, 0.96))
  block(out, -18.4, 18.4, Z(2.1), Z(WALL_Z), -0.6, BASE_Y, stone)
  // ---- the loggia's back wall (full portico width), the pavilion up to the attic cornice
  block(out, -18.2, 18.2, Z(WALL_Z), Z(WALL_Z + 2), BASE_Y - 0.2, ENT_TOP, stone)
  block(out, -ATTIC_HALF, ATTIC_HALF, Z(WALL_Z), Z(26.4), ENT_TOP - 0.5, ATTIC_TOP, stone)
  // the windows in the loggia wall, two storeys between the columns, and the doors
  for (const x of [-13.6, -6.3, 0, 6.3, 13.6]) {
    pane(out, '-z', Z(WALL_Z), x, BASE_Y + 0.5, x === 0 ? 3.2 : 2.0, 4.6, dark, 0.06)
    pane(out, '-z', Z(WALL_Z), x, 8.2, 1.9, 5.0, dark, 0.06)
    block(out, x - 1.3, x + 1.3, Z(WALL_Z - 0.25), Z(WALL_Z), 7.2, 7.5, lightStone) // balcony ledge
  }
  block(out, -18.2, 18.2, Z(WALL_Z - 0.18), Z(WALL_Z), 6.9, 7.2, lightStone) // string course
  // ---- the eight columns
  for (const x of COL_X) {
    classicalColumn(out, x, Z(COL_Z), BASE_Y, BASE_Y + COL_H, COL_R, stone,
      { order: 'corinthian', tier: 'near', tag: SMOOTH, flutes: true, trim: lightStone })
  }
  // ---- the entablature, one run across the whole front, soffit back to the wall
  const ex = 18.2, z0 = Z(COL_Z - 1.0)
  const top = BASE_Y + COL_H
  block(out, -ex, ex, z0, Z(WALL_Z), top, top + 0.9, shade(stone, 1.02))
  block(out, -ex, ex, z0, Z(WALL_Z), top + 0.9, top + 1.7, deep)
  block(out, -ex - 0.4, ex + 0.4, z0 - 0.4, Z(WALL_Z), top + 1.7, ENT_TOP, lightStone)
  // a balustrade along the wings' side of the cornice (outer bays), as the wings carry theirs
  for (const s of [-1, 1]) block(out, Math.min(s * PED_HALF, s * 18.2), Math.max(s * PED_HALF, s * 18.2), z0 - 0.1, Z(WALL_Z), ENT_TOP, ENT_TOP + 1.0, shade(stone, 0.98))
  // ---- the pediment over the pavilion, with its relief
  pedimentFront(faceFrame(out, '-z', Z(WALL_Z)), -PED_HALF, PED_HALF, ENT_TOP, PED_RISE, WALL_Z - (COL_Z - 1.0), stone, { relief: 19, reliefC: lightStone })
  // ---- the attic: cornice, balustrade, the corner urns
  block(out, -ATTIC_HALF - 0.45, ATTIC_HALF + 0.45, Z(WALL_Z - 0.45), Z(26.4 + 0.45), ATTIC_TOP - 1.0, ATTIC_TOP, lightStone)
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
    block(out, sx * 9.9 - 0.45, sx * 9.9 + 0.45, Z(15.65 + sz * 10.2) - 0.45, Z(15.65 + sz * 10.2) + 0.45, ATTIC_TOP, ATTIC_TOP + 1.2, lightStone)
    statue(out, sx * 9.9, ATTIC_TOP + 1.2, Z(15.65 + sz * 10.2), 2.0, shade(stone, 1.06))
  }
  // attic windows on the front above the pediment's ends and the flanks (round-headed in life, dark panes here)
  for (const x of [-7.5, 7.5]) pane(out, '-z', Z(WALL_Z - 0.0), x, ENT_TOP + 1.8, 1.4, 3.4, dark, 0.06)
  // ---- the dome, drum-less: the lantern's foot at DOME_H
  quadDome(out, 0, 0, ATTIC_TOP, DOME_H, DOME_R0, DOME_R1, slate)
  const yl = ATTIC_TOP + DOME_H
  // the dormers with the clock on each of the four faces
  const dormer = (face: '-z' | '+z' | '-x' | '+x'): void => {
    const fr = faceFrame(out, face, face === '-z' ? Z(ZC - 4) : face === '+z' ? Z(ZC + 4) : face === '-x' ? -4 : 4)
    boxOn(fr, -2.6, 2.6, ATTIC_TOP + 0.8, ATTIC_TOP + 5.6, 0, 4.4, lightStone)
    // a little pediment over it
    pedimentFront(fr, -2.9, 2.9, ATTIC_TOP + 5.6, 1.5, 4.4, lightStone, {})
    clockOn(fr, 0, ATTIC_TOP + 3.2, 1.75, 4.45)
  }
  for (const f of ['-z', '+z', '-x', '+x'] as const) dormer(f)
  // lantern, its cap, the finial
  block(out, -1.5, 1.5, -1.5, 1.5, yl - 0.1, yl + 2.0, lightStone)
  for (const f of ['-z', '+z', '-x', '+x'] as const) pane(out, f, f[0] === '-' ? -1.5 : 1.5, 0, yl + 0.3, 1.0, 1.4, dark, 0.05)
  block(out, -1.9, 1.9, -1.9, 1.9, yl + 2.0, yl + 2.3, lightStone)
  quadDome(out, 0, 0, yl + 2.3, 1.5, 1.6, 0.25, shade(slate, 0.9))
  block(out, -0.12, 0.12, -0.12, 0.12, yl + 3.8, yl + 5.4, gold)
}
