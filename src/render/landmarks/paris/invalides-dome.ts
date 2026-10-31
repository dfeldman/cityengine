import type { MeshBuilder } from '../../buildings.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { classicalColumn, lathe } from '../column.ts'
import { beam, block, hex, roof, shade } from '../kit.ts'
import { archRing, rectOn, slabOn } from './palaces/common.ts'
import { Relief } from './minor/sculpt.ts'

const FIXED = 0
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

/**
 * THE DÔME DES INVALIDES and its church (Hardouin-Mansart, 1706), redrawn in the top-25 audit of 2026-10-30. Above 34 m it had a stack of drum
 * and egg with the dome 24 m tall; below, OSM's parts in the city's stone dress, which from the Place Vauban was a block of flats with a dome
 * on it. All of it now, off "Dome des Invalides 20200301.jpg" (Commons; head-on, 0.0973 m to its pixel by the church's 55 m on IGN's aerial,
 * and that scale gives OSM's lidar heights back: the spring of the dome at 48.1 m and the cross at 85.6 m). "107 m" is above the Seine.
 *
 * - the square CHURCH, x ±27.5, its porch of two orders standing out of the south front, the great arched door, the pediment, the balustrades;
 * - the DRUM on its forty columns, its tall windows, the balustrade, the attic with its eight round-headed windows and scrolls;
 * - the DOME: dark lead, twelve wide gilded ribs, the trophies and garlands between them in gilt;
 * - the LANTERN: the gilded ring and its rail, the open arches, the spire and the cross.
 *
 * Local frame: centred on the dome (IGN's aerial), the south front looks −z (entry's front 184), +x the viewer's right.
 */
const STONE: Rgb = hex('#bcb092')
const TRIM: Rgb = shade(STONE, 1.08)
const BAND: Rgb = shade(STONE, 0.9)
const LEAD: Rgb = hex('#333d3e')
const ROOF: Rgb = hex('#4e5659')
const GOLD: Rgb = [0.78, 0.59, 0.19]
const DARK: Rgb = [0.13, 0.14, 0.14]
const plain = surfaceTag('stucco')
const X0 = -27.5, X1 = 27.5, S = -20, N = 29

/** The dome's section: t 0…1 from the spring to the lantern's foot. */
const DR = (t: number): number => 12.6 * Math.cos(t * Math.PI * 0.44) + 0.1
const DY = (t: number): number => 48.1 + 12.2 * Math.sin(t * Math.PI * 0.5)

function church(out: MeshBuilder): void {
  // ---- the body: walls to the cornice, the balustrade, the lead roof falling from the drum
  block(out, X0, X1, S, N, -2, 22.2, STONE)
  block(out, X0 - 0.6, X1 + 0.6, S - 0.6, N + 0.6, 21.4, 23.4, TRIM)
  roof(out, X0 + 0.3, X1 - 0.3, S + 0.3, N - 0.3, 23.4, 6.8, 12, 11, ROOF)
  // the south front's two side bays: the arched window over a door, the niched relief, the corner pilasters
  for (const s of [-1, 1]) {
    const x = s * 19.5
    rectOn(out, '-z', S, x - 1.8, x + 1.8, 13.6, 17.4, DARK, 0.05)
    for (let i = 0; i < 6; i++) {
      const a0 = (i / 6) * Math.PI, a1 = ((i + 1) / 6) * Math.PI
      out.quad([[x, 17.4, S - 0.05], [x + Math.cos(a1) * 1.8, 17.4 + Math.sin(a1) * 1.8, S - 0.05], [x + Math.cos(a0) * 1.8, 17.4 + Math.sin(a0) * 1.8, S - 0.05], [x, 17.4, S - 0.05]], [0, 0, -1], UV, DARK, FIXED)
    }
    archRing(out, S, x, 17.4, 1.8, 2.25, 0.14, TRIM, BAND, 6)
    rectOn(out, '-z', S, x - 1.5, x + 1.5, 1.8, 7.4, DARK, 0.05)
    slabOn(out, '-z', S, x - 2, x + 2, 7.4, 8.1, 0.25, TRIM)
    rectOn(out, '-z', S, s * 11.5 - 1.3, s * 11.5 + 1.3, 14, 19.4, BAND, 0.06)
    new Relief(out, s * 11.5, 16.7, S - 0.07, TRIM, 0.3).lump([0, 0, 0.1], 0.85, 2, 0.22, 4, true, 2)
    for (const u of [15.4, 23.8]) {
      slabOn(out, '-z', S, s * u - 0.5, s * u + 0.5, 11.5, 21.4, 0.28, TRIM)
      slabOn(out, '-z', S, s * u - 0.6, s * u + 0.6, 1.2, 10.6, 0.3, TRIM)
    }
    // the balustrade
    const a = Math.min(s * 15, s * 28), b = Math.max(s * 15, s * 28)
    block(out, a, b, S - 0.4, S + 1, 23.4, 23.65, TRIM)
    block(out, a, b, S - 0.3, S + 1, 24.65, 24.9, TRIM)
    for (let x2 = a + 0.25; x2 < b; x2 += 0.62) block(out, x2 - 0.07, x2 + 0.07, S - 0.2, S + 0.1, 23.65, 24.65, TRIM)
    // the six round lead turrets on the roof (the aerial's)
  }
  slabOn(out, '-z', S, X0, X1, 10.6, 11.5, 0.6, TRIM)
  // the sides and back of the square: pilasters and windows, in the same rhythm and less of it
  for (const f of ['-x', '+x', '+z'] as const) {
    const plane = f === '-x' ? X0 : f === '+x' ? X1 : N
    const [a, b] = f === '+z' ? [X0, X1] : [S, N]
    for (const u of [-16, 0, 16]) {
      const c = (a + b) / 2 + u
      rectOn(out, f, plane, c - 1.8, c + 1.8, 13.6, 19, DARK, 0.05)
      rectOn(out, f, plane, c - 1.5, c + 1.5, 2, 7.6, DARK, 0.05)
    }
    for (const u of [-23, -8, 8, 23]) slabOn(out, f, plane, (a + b) / 2 + u - 0.5, (a + b) / 2 + u + 0.5, 1.2, 21.4, 0.28, TRIM)
  }
  for (const [x, z] of [[-22, 13], [-23, -4], [-10.4, -19], [8, -20], [24, 10], [22, -8]] as const) {
    prism(out, x, z, 23.4, 26.6, 2.3, 10, ROOF, FIXED)
    lathe(out, x, z, [[2.4, 26.6], [2, 27.6], [1.1, 28.4], [0.15, 28.9], [0.05, 29.5]], 10, LEAD)
  }
  // the chancel on the north, round, and the lead half-dome over it (the aerial's dark disc)
  prism(out, 1, 32, -2, 20, 11, 18, STONE, FIXED)
  prism(out, 1, 32, 20, 21, 11.4, 18, TRIM, FIXED)
  lathe(out, 1, 32, [[11.2, 21], [10.2, 23.5], [7.5, 25.8], [4, 27.4], [0.3, 28]], 18, ROOF)

  // ---- the porch of two orders, x ±15.2, standing out to z = −28, up three flights of steps
  const Z = -28
  for (let i = 0; i < 6; i++) block(out, -17 - (5 - i) * 0.4, 17 + (5 - i) * 0.4, Z - 3 + i * 0.5, Z + 0.5, -2, 0.1 + i * 0.3, shade(STONE, 0.86))
  block(out, -15.2, 15.2, Z + 1.2, S, -2, 11, STONE)
  block(out, -15.2, 15.2, Z + 3, S, 11, 23.2, STONE)
  const cols = [-14.6, -9.3, -7.3, -3.9, 3.9, 7.3, 9.3, 14.6]
  for (const x of cols) {
    classicalColumn(out, x, Z + 0.7, 1.6, 10.6, 0.62, shade(STONE, 1.1), { order: 'tuscan', tier: 'mid', tag: plain, trim: TRIM })
    classicalColumn(out, x, Z + 2.4, 11.5, 22.6, 0.58, shade(STONE, 1.1), { order: 'corinthian', tier: 'mid', tag: plain, trim: TRIM })
  }
  // the door and the great arched window, in their reveals
  rectOn(out, '-z', Z + 1.2, -2.4, 2.4, 1.6, 8.6, DARK, 0.06)
  slabOn(out, '-z', Z + 1.2, -3.1, 3.1, 8.6, 9.4, 0.3, TRIM)
  rectOn(out, '-z', Z + 3, -2.5, 2.5, 12.2, 17.6, DARK, 0.06)
  for (let i = 0; i < 8; i++) {
    const a0 = (i / 8) * Math.PI, a1 = ((i + 1) / 8) * Math.PI
    out.quad([[0, 17.6, Z + 2.95], [Math.cos(a1) * 2.5, 17.6 + Math.sin(a1) * 2.5, Z + 2.95], [Math.cos(a0) * 2.5, 17.6 + Math.sin(a0) * 2.5, Z + 2.95], [0, 17.6, Z + 2.95]], [0, 0, -1], UV, DARK, FIXED)
  }
  archRing(out, Z + 3, 0, 17.6, 2.5, 3.1, 0.2, TRIM, BAND, 8)
  // the statues of Saint Louis and Charlemagne at the door
  for (const x of [-5.6, 5.6]) { prism(out, x, Z + 0.9, 1.6, 5.8, 0.55, 6, TRIM, plain, 0.4); prism(out, x, Z + 0.9, 5.8, 6.7, 0.28, 6, TRIM, plain, 0.22) }
  // the entablatures, the pediment, its figures
  block(out, -15.8, 15.8, Z, S, 10.6, 11.5, TRIM)
  block(out, -15.8, 15.8, Z + 1.6, S, 22.6, 24.6, TRIM)
  block(out, -9, 9, Z + 1.4, S, 24.6, 25.9, STONE)
  const zP = Z + 1.5
  out.quad([[-8.6, 25.9, zP], [8.6, 25.9, zP], [0, 29.6, zP], [0, 29.6, zP]], [0, 0, -1], UV, TRIM, FIXED)
  for (const s of [-1, 1]) {
    const a: [number, number, number] = [s * 9.3, 25.7, zP - 0.5], b: [number, number, number] = [0, 29.9, zP - 0.5]
    out.quad([a, b, [b[0], b[1] + 0.5, b[2]], [a[0], a[1] + 0.5, a[2]]], [0, 0, -1], UV, TRIM, FIXED)
    out.quad([[a[0], a[1] + 0.5, a[2]], [b[0], b[1] + 0.5, b[2]], [b[0], b[1] + 0.5, S], [a[0], a[1] + 0.5, S]], [s * 0.36, 0.93, 0], UV, ROOF, FIXED)
  }
  new Relief(out, 0, 26, zP - 0.02, BAND, 0.3).disc([0, 1.3, 0], 1.1, 0.3, 8)
}

function drum(out: MeshBuilder): void {
  // ---- the drum on its square plinth, forty columns, the tall windows
  prism(out, 0, 0, 24, 27.4, 15.4, 32, STONE, FIXED)
  prism(out, 0, 0, 26.6, 27.4, 15.9, 32, TRIM, FIXED)
  prism(out, 0, 0, 27.4, 37.8, 13.4, 32, shade(STONE, 0.92), FIXED)
  for (let i = 0; i < 20; i++) {
    const a = ((i + 0.5) / 20) * Math.PI * 2
    for (const d of [-0.05, 0.05]) classicalColumn(out, Math.sin(a + d) * 15, Math.cos(a + d) * 15, 27.4, 37.6, 0.42, shade(STONE, 1.1), { order: 'corinthian', tier: 'far', tag: plain, trim: TRIM })
    if (i % 2 === 0) {
      const w = a + Math.PI / 20
      const nx = Math.sin(w), nz = Math.cos(w)
      const tx = nz, tz = -nx
      const R = 13.46
      const Q = (u: number, y: number): [number, number, number] => [nx * R + tx * u, y, nz * R + tz * u]
      out.quad([Q(-1.35, 28.4), Q(1.35, 28.4), Q(1.35, 35.6), Q(-1.35, 35.6)], [nx, 0, nz], UV, DARK, FIXED)
      out.quad([Q(-1.35, 35.6), Q(1.35, 35.6), Q(0, 37), Q(0, 37)], [nx, 0, nz], UV, DARK, FIXED)
    }
  }
  // the entablature with its breaks, the balustrade
  prism(out, 0, 0, 37.6, 39.2, 15.9, 32, TRIM, FIXED)
  prism(out, 0, 0, 39.2, 40.4, 15.1, 32, shade(STONE, 0.8), FIXED)
  prism(out, 0, 0, 40.4, 40.6, 15.3, 32, TRIM, FIXED)
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2
    if (i % 5 === 0) box(out, Math.sin(a) * 15.15, 39.8, Math.cos(a) * 15.15, 0.4, 0.8, 0.4, TRIM, FIXED)
  }
  // ---- the attic: its windows, the scrolls between them, the urns on them
  prism(out, 0, 0, 40.4, 47, 13.2, 32, STONE, FIXED)
  prism(out, 0, 0, 47, 48.1, 13.7, 32, TRIM, FIXED)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    const nx = Math.sin(a), nz = Math.cos(a)
    const tx = nz, tz = -nx
    const R = 13.25
    const Q = (u: number, y: number): [number, number, number] => [nx * R + tx * u, y, nz * R + tz * u]
    out.quad([Q(-1.2, 41.8), Q(1.2, 41.8), Q(1.2, 44.5), Q(-1.2, 44.5)], [nx, 0, nz], UV, DARK, FIXED)
    for (let k = 0; k < 4; k++) {
      const b0 = (k / 4) * Math.PI, b1 = ((k + 1) / 4) * Math.PI
      out.quad([Q(0, 44.5), Q(Math.cos(b1) * 1.2, 44.5 + Math.sin(b1) * 1.2), Q(Math.cos(b0) * 1.2, 44.5 + Math.sin(b0) * 1.2), Q(0, 44.5)], [nx, 0, nz], UV, DARK, FIXED)
    }
    // the scroll between this and the next, sloping from the attic's top to the balustrade
    const m = a + Math.PI / 8
    const mx = Math.sin(m), mz = Math.cos(m)
    beam(out, [mx * 13.2, 47, mz * 13.2], [mx * 15, 40.6, mz * 15], 0.5, TRIM, 0.6)
    prism(out, mx * 14.8, mz * 14.8, 40.6, 42.2, 0.42, 6, BAND, plain, 0.12)
  }
}

function dome(out: MeshBuilder): void {
  // the lead, then the gold: ribs, a band at the spring, the trophies and garlands in each bay
  const prof: [number, number][] = []
  for (let i = 0; i <= 12; i++) prof.push([DR(i / 12), DY(i / 12)])
  lathe(out, 0, 0, prof, 36, LEAD)
  prism(out, 0, 0, 47.9, 48.5, 13, 36, GOLD, FIXED, 12.75, false)
  const n = 12
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    const w = 0.09
    for (let k = 0; k < 10; k++) {
      const t0 = k / 10, t1 = (k + 1) / 10
      const r0 = DR(t0) + 0.12, r1 = DR(t1) + 0.12
      const n0 = [Math.sin(a) * Math.cos(t0 * 1.3), Math.sin(t0 * 1.3), Math.cos(a) * Math.cos(t0 * 1.3)] as [number, number, number]
      out.quad([[Math.sin(a - w) * r0, DY(t0), Math.cos(a - w) * r0], [Math.sin(a + w) * r0, DY(t0), Math.cos(a + w) * r0],
        [Math.sin(a + w) * r1, DY(t1), Math.cos(a + w) * r1], [Math.sin(a - w) * r1, DY(t1), Math.cos(a - w) * r1]], n0, UV, GOLD, FIXED)
    }
    // the trophy in the bay's lower half, the garland over it, the pot at the top: gilt lumps on the lead
    const m = a + Math.PI / n
    const Pt = (t: number, off: number, d: number): [number, number, number] => {
      const r = DR(t) + d
      return [Math.sin(m + off) * r, DY(t), Math.cos(m + off) * r]
    }
    const c0 = Pt(0.16, 0, 0.1), c1 = Pt(0.42, 0, 0.1), c2 = Pt(0.62, 0, 0.08)
    prism(out, c0[0], c0[2], c0[1], c0[1] + 2.4, 0.72, 6, GOLD, FIXED, 0.42)
    prism(out, c1[0], c1[2], c1[1], c1[1] + 1.2, 0.62, 6, GOLD, FIXED, 0.28)
    for (const s of [-1, 1]) {
      beam(out, Pt(0.72, 0, 0.1), Pt(0.5, s * 0.17, 0.18), 0.16, GOLD)
      beam(out, Pt(0.3, s * 0.15, 0.18), Pt(0.52, s * 0.17, 0.18), 0.1, GOLD)
    }
    prism(out, c2[0], c2[2], c2[1], c2[1] + 0.7, 0.34, 5, GOLD, FIXED, 0.14)
  }
  // ---- the lantern: the gold ring and its rail, the arches, the cap, the spire and the cross
  lathe(out, 0, 0, [[DR(1) + 0.3, 60.2], [4.3, 61], [4.1, 62], [3.2, 62.6], [3.3, 64.3]], 16, GOLD)
  prism(out, 0, 0, 64.3, 64.7, 3.6, 16, GOLD, FIXED)
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2
    beam(out, [Math.sin(a) * 3.5, 64.7, Math.cos(a) * 3.5], [Math.sin(a) * 3.5, 65.4, Math.cos(a) * 3.5], 0.035, GOLD)
  }
  prism(out, 0, 0, 65.35, 65.45, 3.55, 16, GOLD, FIXED, 3.55, false)
  prism(out, 0, 0, 64.7, 69.2, 1.5, 10, DARK, FIXED)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    prism(out, Math.sin(a) * 2.3, Math.cos(a) * 2.3, 64.7, 69.2, 0.3, 6, GOLD, FIXED, 0.24)
    prism(out, Math.sin(a) * 2.3, Math.cos(a) * 2.3, 69.2, 70.4, 0.2, 5, GOLD, FIXED, 0.03)
  }
  lathe(out, 0, 0, [[2.75, 69.2], [2.6, 69.8], [1.5, 70.6], [0.9, 72], [0.7, 73.2]], 10, GOLD)
  prism(out, 0, 0, 73.2, 81.6, 0.66, 8, GOLD, FIXED, 0.06)
  prism(out, 0, 0, 74.4, 75, 0.95, 8, GOLD, FIXED, 0.5)
  prism(out, 0, 0, 81.4, 85.4, 0.07, 4, GOLD, FIXED)
  box(out, 0, 84.4, 0, 0.55, 0.06, 0.06, GOLD, FIXED)
}

export function invalidesDome(out: MeshBuilder): void {
  church(out)
  drum(out)
  dome(out)
}
