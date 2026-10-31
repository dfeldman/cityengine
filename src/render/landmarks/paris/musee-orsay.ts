import type { MeshBuilder } from '../../buildings.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { lathe } from '../column.ts'
import { beam, block, hex, roof, shade } from '../kit.ts'
import type { Fit } from '../fit.ts'
import { clockFace } from '../parts.ts'
import { arcade, archOn, archRing, fitted, palette, pedimentOn, range, rectOn, slabOn, type Pal } from './palaces/common.ts'
import { Relief, figure } from './minor/sculpt.ts'

const FIXED = 0
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

/**
 * The Musée d'Orsay, Laloux's Gare d'Orsay of 1900 (top-25 audit, 2026-10-30; it was seven dark panes on a grey wall). The river front read
 * off "MuseeDOrsay.jpg" (Commons), a true elevation, 1,043 px for OSM's 173 m (way 63178753, turned 25.5° and not the 20° it had): x below is
 * the picture's, y is the picture's from the pavement:
 *
 * - the seven great arches (9.1 m wide on 14.5 m), glazed, each with its iron canopy across the foot;
 * - the frieze over them of reliefs and garlands, a figure on every second pier, the cornice with its three statues, the long dark slate
 *   roof behind it (these are Bordeaux, Toulouse and Nantes, on the skyline; the six continents are on the parvis, not here);
 * - the two clock pavilions: the clock of 6.6 m in its great arched frame, breaking up through the cornice into a steep slate roof with pale
 *   hips, a lantern and a finial to 38 m, an arched window and a door under the clock;
 * - to the viewer's right the old hotel's front, four storeys and a mansard with a little domed lantern;
 * - from above (IGN's aerial): the great vault, half zinc and half glass, the glazed roof down the river side, the long pale roof of the
 *   Rue de Lille range.
 *
 * Local frame: the river front looks −z, viewer's right +x (the west, the hotel, the parvis).
 */
const HX = 94.15
const HZ = 38.85
const STONE: Rgb = hex('#cdc1a8')
const TRIM: Rgb = shade(STONE, 1.07)
const BAND: Rgb = shade(STONE, 0.9)
const DEEP: Rgb = shade(STONE, 0.6)
const SLATE: Rgb = hex('#3d4348')
const HIP: Rgb = hex('#8d9498')
const ZINC: Rgb = hex('#808789')
const GLASS: Rgb = [0.3, 0.4, 0.44]
const DARK: Rgb = [0.13, 0.14, 0.15]
const IRON: Rgb = hex('#2f3534')
const VAULT: Rgb = hex('#5d7b84')
const plain = surfaceTag('stucco')
const P: Pal = { ...palette('#cdc1a8', '#3d4348'), stone: STONE, trim: TRIM, deep: BAND }

const F = -HZ
const ARCHES = [-64.3, -49.8, -35.2, -20.6, -6.3, 8.1, 22.7]
const PAV = [-82.3, 39.8]
const PW = 11

/** One bay of the great arcade's glazing: the fan of the head, the mullions, the canopy. */
function glazing(q: MeshBuilder, cx: number): void {
  const z = F + 1.3
  const r = 4.55
  const yc = 5.1
  beam(q, [cx - r, yc, z], [cx + r, yc, z], 0.07, IRON)
  for (const s of [-0.66, -0.33, 0, 0.33, 0.66]) {
    const h = Math.sqrt(1 - s * s) * r
    beam(q, [cx + s * r, 0.9, z], [cx + s * r, yc + h, z], 0.06, IRON)
  }
  beam(q, [cx - r * 0.72, yc + r * 0.69, z], [cx + r * 0.72, yc + r * 0.69, z], 0.05, IRON)
  // the canopy across the foot, dark iron and glass, and its stays
  block(q, cx - r - 0.2, cx + r + 0.2, F - 1.2, F + 1.3, 2.6, 3, IRON)
  block(q, cx - r - 0.2, cx + r + 0.2, F + 1, F + 1.3, 0.6, 2.6, DARK)
}

function front(q: MeshBuilder): void {
  const TOP = 20.4
  // ---- the arcade storey, with the arches cut true
  arcade(q, F, PAV[0] + PW, PAV[1] - PW, 0, 13.4, ARCHES, 9.1, 9.6, 1.4, STONE, DEEP, GLASS, 10)
  const yArch = 9.6 - 4.55
  for (const c of ARCHES) {
    archRing(q, F, c, yArch, 4.55, 5.2, 0.22, TRIM, BAND, 10)
    glazing(q, c)
  }
  // the piers' coupled pilasters
  for (let i = 0; i < ARCHES.length - 1; i++) {
    const m = (ARCHES[i] + ARCHES[i + 1]) / 2
    for (const s of [-1.05, 1.05]) slabOn(q, '-z', F, m + s - 0.35, m + s + 0.35, 0.6, 13.4, 0.22, BAND)
    // the carved panel over the pier
    rectOn(q, '-z', F, m - 1.9, m + 1.9, 10.4, 12.8, TRIM, 0.05)
  }
  // ---- the frieze: the string, the panels of relief and garland, the figures on the piers
  slabOn(q, '-z', F, PAV[0] + PW, PAV[1] - PW, 13.2, 13.9, 0.55, TRIM)
  block(q, PAV[0] + PW, PAV[1] - PW, F, F + 16, 13.9, TOP, STONE)
  const r = new Relief(q, 0, 0, F - 0.03, TRIM, 0.5)
  ARCHES.forEach((c, i) => {
    // the wreath in the middle of the bay and the swags away from it
    r.disc([c, 16.4, 0.02], 1, 0.26, 10)
    for (const s of [-1, 1]) {
      const a0 = 0.6, a1 = 1.2
      r.tube([c + s * 1.1, 17.2, 0.1], [c + s * 3.6, 16.3, 0.22], a0 * 0.4, a1 * 0.3, 3, 0.8, true)
      r.tube([c + s * 3.6, 16.3, 0.22], [c + s * 6.2, 17.3, 0.1], a1 * 0.3, a0 * 0.4, 3, 0.8, true)
    }
    if (i < ARCHES.length - 1) {
      const m = (c + ARCHES[i + 1]) / 2
      slabOn(q, '-z', F, m - 1.05, m + 1.05, 13.9, 18.9, 0.3, BAND)
      // the reclining figures of the reliefs, one each side of every other pier
      if (i % 2 === 0) {
        figure(new Relief(q, m, 13.9, F - 0.33, TRIM, 0.5), { k: 0.42, coarse: true, hip: [0, 1.55, 0.15], chest: [0, 2.7, 0.18], head: [0, 3.55, 0.2], armL: [[-0.55, 2.8, 0.2], [-0.5, 3.65, 0.2]], armR: [[0.6, 2.7, 0.2], [0.65, 1.8, 0.2]], skirt: { to: [0, 0.1, 0.15], w: 0.7 } })
      }
    }
  })
  // the cornice, its balustrade, its three statues on their plinths
  slabOn(q, '-z', F, PAV[0] + PW, PAV[1] - PW, 18.9, TOP, 0.9, TRIM)
  q.quad([[PAV[0] + PW, 18.9, F - 0.9], [PAV[1] - PW, 18.9, F - 0.9], [PAV[1] - PW, 18.9, F], [PAV[0] + PW, 18.9, F]], [0, -1, 0], UV, DEEP, FIXED)
  for (const x of [-49.3, -20.6, 7.9]) {
    block(q, x - 1.2, x + 1.2, F - 0.3, F + 2, TOP, TOP + 1.2, TRIM)
    prism(q, x, F + 0.7, TOP + 1.2, TOP + 3.4, 0.62, 6, TRIM, plain, 0.42)
    prism(q, x, F + 0.7, TOP + 3.4, TOP + 4.2, 0.26, 6, TRIM, plain, 0.2)
    box(q, x - 0.75, TOP + 2, F + 0.8, 0.28, 0.75, 0.32, TRIM, FIXED)
  }
  // the long slate roof
  roof(q, PAV[0] + PW, PAV[1] - PW, F + 0.5, F + 14, TOP, 4.4, 0.01, 4.4, SLATE)
  block(q, PAV[0] + PW, PAV[1] - PW, F + 4.9, F + 14, TOP + 4.3, TOP + 4.45, HIP)

  // ---- the clock pavilions
  for (const c of PAV) {
    const x0 = c - PW
    const x1 = c + PW
    block(q, x0, x1, F - 0.9, F + 16, 0, TOP, STONE)
    // the pilasters at the corners, the arched window, the door, the cornice
    for (const s of [-1, 1]) {
      slabOn(q, '-z', F - 0.9, c + s * 9.8 - 0.8, c + s * 9.8 + 0.8, 0.5, TOP - 2, 0.3, BAND)
      slabOn(q, '-z', F - 0.9, c + s * 7.5 - 0.5, c + s * 7.5 + 0.5, 0.5, 14, 0.25, BAND)
    }
    archOn(q, '-z', F - 0.9, c, 5.8, 4.4, 6.2, GLASS, 0.06)
    archRing(q, F - 0.9, c, 9.8, 2.2, 2.75, 0.2, TRIM, BAND, 8)
    rectOn(q, '-z', F - 0.9, c - 1.9, c + 1.9, 0.6, 4.5, hex('#4a3a2c'), 0.06)
    slabOn(q, '-z', F - 0.9, c - 2.4, c + 2.4, 4.5, 5.1, 0.3, TRIM)
    slabOn(q, '-z', F - 0.9, x0 - 0.2, x1 + 0.2, 13.4, 14, 0.4, TRIM)
    // the great arched frame of the clock, going up through the cornice, and the carved spandrels
    const yC = 20.2
    const R = 5.6
    block(q, c - R - 0.8, c + R + 0.8, F - 1.5, F + 7, 15, yC, TRIM)
    for (let i = 0; i < 10; i++) {
      const a0 = (i / 10) * Math.PI, a1 = ((i + 1) / 10) * Math.PI
      const Pt = (a: number, rr: number, z: number): [number, number, number] => [c + Math.cos(a) * rr, yC + Math.sin(a) * rr, z]
      const am = (a0 + a1) / 2
      q.quad([Pt(a0, 0, F - 1.5), Pt(a0, R + 0.8, F - 1.5), Pt(a1, R + 0.8, F - 1.5), Pt(a1, 0, F - 1.5)], [0, 0, -1], UV, TRIM, FIXED)
      q.quad([Pt(a0, R + 0.8, F - 1.5), Pt(a1, R + 0.8, F - 1.5), Pt(a1, R + 0.8, F + 7), Pt(a0, R + 0.8, F + 7)], [Math.cos(am), Math.sin(am), 0], UV, HIP, FIXED)
    }
    archRing(q, F - 1.5, c, yC, 3.6, 4.2, 0.25, BAND, TRIM, 12)
    for (const s of [-1, 1]) {
      q.quad([[c + s * 3.9, yC - 4.1, F - 1.65], [c + s * 6, yC - 4.1, F - 1.65], [c + s * 6, yC - 1, F - 1.65], [c + s * 4.2, yC - 1, F - 1.65]], [0, 0, -1], UV, BAND, FIXED)
    }
    prism(q, c, F - 1.54, yC - 3.6, yC + 3.6, 0.01, 3, TRIM, FIXED)
    // (the face itself a working clock: the real time, as every clock in the city — owner, 2026-10-29: "Sf has working clocks")
    clockFace(q, c, yC, F - 1.62, 0, -1, 3.3, { dial: [0.93, 0.92, 0.87], rim: [0.72, 0.58, 0.26], marks: DARK, hands: DARK })
    // the roof: steep, its hips pale zinc, a lantern and the finial
    const RY = TOP
    const RT = 30.7
    roof(q, x0 - 0.3, x1 + 0.3, F - 1.2, F + 16, RY, RT - RY, 6.5, 6, SLATE)
    for (const s of [-1, 1]) {
      beam(q, [c + s * (PW + 0.3), RY, F - 1.2], [c + s * (PW - 6.2), RT, F + 4.8], 0.14, HIP)
      beam(q, [c + s * (PW + 0.3), RY, F + 16], [c + s * (PW - 6.2), RT, F + 10], 0.14, HIP)
    }
    block(q, c - PW + 6.2, c + PW - 6.2, F + 4.8, F + 10, RT, RT + 0.4, HIP)
    const cz = F + 7.4
    lathe(q, c, cz, [[3.2, RT + 0.4], [3, RT + 1.2], [2, RT + 2], [1, RT + 3.2], [0.55, RT + 4.2], [0.9, RT + 5], [0.3, RT + 6.4], [0.06, RT + 8]], 8, hex('#4b5256'))
  }

  // ---- the hotel's front, past the western pavilion: a rusticated ground floor, three more, a mansard, the little dome
  const xh0 = PAV[1] + PW
  const xh1 = HX - 14.4
  block(q, xh0, xh1, F, F + 18, 0, 19.6, STONE)
  const n = 6
  const b = (xh1 - xh0) / n
  for (let i = 0; i < n; i++) {
    const x = xh0 + (i + 0.5) * b
    rectOn(q, '-z', F, x - 1.05, x + 1.05, 1, 7.4, GLASS, 0.06)
    rectOn(q, '-z', F, x - 1.05, x + 1.05, 9.1, 13.2, GLASS, 0.06)
    slabOn(q, '-z', F, x - 1.4, x + 1.4, 9, 9.2, 0.35, TRIM)
    if (i % 2) pedimentOn(q, '-z', F, x - 1.5, x + 1.5, 13.3, 0.7, 0.2, TRIM)
    rectOn(q, '-z', F, x - 0.95, x + 0.95, 14.9, 17.7, GLASS, 0.06)
    for (let y = 1.2; y < 8; y += 0.9) rectOn(q, '-z', F, xh0, xh1, y, y + 0.06, BAND, 0.02)
  }
  slabOn(q, '-z', F, xh0 - 0.2, xh1 + 0.2, 8, 8.5, 0.35, TRIM)
  slabOn(q, '-z', F, xh0 - 0.2, xh1 + 0.2, 13.9, 14.3, 0.3, TRIM)
  slabOn(q, '-z', F, xh0 - 0.2, xh1 + 0.2, 18.6, 19.6, 0.7, TRIM)
  roof(q, xh0 - 0.2, xh1 + 0.2, F - 0.2, F + 18, 19.6, 3.4, 2.2, 2.2, SLATE)
  for (let i = 0; i < n; i++) {
    const x = xh0 + (i + 0.5) * b
    block(q, x - 0.9, x + 0.9, F + 1, F + 2.4, 20, 22.1, TRIM)
    rectOn(q, '-z', F + 1, x - 0.6, x + 0.6, 20.3, 21.8, GLASS, 0.03)
  }
  const dx = (xh0 + xh1) / 2
  prism(q, dx, F + 8, 23, 25, 1.5, 10, TRIM, FIXED)
  lathe(q, dx, F + 8, [[1.7, 25], [1.6, 25.7], [1.1, 26.4], [0.3, 27], [0.04, 27.8]], 10, hex('#7a8284'))
}

function rest(q: MeshBuilder): void {
  // ---- the Rue de Lille range and the flanks
  const storeys = [{ y: 1, h: 5.4, arched: true, sill: 0.2 }, { y: 8.4, h: 4.3 }, { y: 14, h: 3.2 }]
  range(q, -93.3, HX - 14.4, 26, HZ, P, { eaves: 20, storeys, bay: 6.3, win: 2.4, faces: ['+z'], courses: true, frames: true, cornice: 0.7 })
  block(q, -93.3, HX - 14.4, 26, HZ, 19.9, 20.1, hex('#b1b0a9'))
  range(q, -93.3, -70, F + 16, 26, P, { eaves: 20, storeys, bay: 6.3, win: 2.4, faces: ['-x'], courses: true, frames: false })
  // the annexe's walls and roof to the parvis on the west: the museum's entrance
  range(q, HX - 14.4, HX, -8.2, 26.9, P, { eaves: 20, storeys, bay: 6.3, win: 2.4, faces: ['+x', '-z'], courses: true, frames: true, cornice: 0.7 })
  roof(q, HX - 14.4, HX + 0.2, -8.4, 27.1, 20, 3, 2.4, 2.4, SLATE)
  block(q, PAV[1] - 8, HX - 14.4, F + 18, 26, 0, 18, STONE)
  block(q, PAV[1] - 8.1, HX - 14.3, F + 18, 26, 18, 18.2, hex('#9d9e98'))
  // the entrance's glass canopy over the steps on the parvis
  const cz = 8
  block(q, HX, HX + 16, cz - 15, cz + 15, 7.6, 7.85, [0.42, 0.52, 0.55])
  for (const z of [cz - 14, cz - 7, cz, cz + 7, cz + 14]) block(q, HX + 15.4, HX + 15.7, z - 0.15, z + 0.15, 0, 7.6, IRON)

  // ---- the great vault: from above, half zinc, half glass, on its ribs; the glazed gallery down the river side
  const z0 = F + 14
  const z1 = 26
  const x0 = PAV[0] + 8
  const x1 = PAV[1] - 8
  const zc = (z0 + z1) / 2
  const hw = (z1 - z0) / 2
  block(q, x0, x1, z0, z1, 0, 20.2, BAND)
  const n = 10
  const Y = (a: number): number => 20.2 + Math.sin(a) * 8.5
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI, a1 = ((i + 1) / n) * Math.PI, am = (a0 + a1) / 2
    const glass = i >= 3 && i < 7
    q.quad([[x0, Y(a0), zc - Math.cos(a0) * hw], [x1, Y(a0), zc - Math.cos(a0) * hw], [x1, Y(a1), zc - Math.cos(a1) * hw], [x0, Y(a1), zc - Math.cos(a1) * hw]],
      [0, Math.sin(am), -Math.cos(am)], UV, glass ? VAULT : ZINC, FIXED)
    for (let x = x0; x <= x1 + 0.01; x += (x1 - x0) / 18) {
      q.quad([[x - 0.14, Y(a0) + 0.06, zc - Math.cos(a0) * hw], [x + 0.14, Y(a0) + 0.06, zc - Math.cos(a0) * hw], [x + 0.14, Y(a1) + 0.06, zc - Math.cos(a1) * hw], [x - 0.14, Y(a1) + 0.06, zc - Math.cos(a1) * hw]],
        [0, Math.sin(am), -Math.cos(am)], UV, IRON, FIXED)
    }
  }
  // its gable ends behind the pavilions
  for (const [x, nx] of [[x0, -1], [x1, 1]] as const) {
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI, a1 = ((i + 1) / n) * Math.PI
      q.quad([[x, 20, zc - Math.cos(a0) * hw], [x, Y(a0), zc - Math.cos(a0) * hw], [x, Y(a1), zc - Math.cos(a1) * hw], [x, 20, zc - Math.cos(a1) * hw]], [nx, 0, 0], UV, BAND, FIXED)
    }
  }
}

export function museeOrsay(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => { front(q); rest(q) })
}
