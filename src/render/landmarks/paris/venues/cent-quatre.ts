/**
 * LE CENT QUATRE, the arts centre in the old municipal undertakers' at 104 rue d'Aubervilliers, built for the "Service
 * municipal des pompes funèbres de Paris" (the words are cut over its arch: Commons "Le Centquatre, les anciennes pompes
 * funèbres de Paris"). OSM: relation/3705800, building=public, 223 × 72 m, four courts; way/278632326 is the arts centre's
 * own tag on the same ground and has no building.
 *
 * The long street flanks are hidden by little but their plain stone; what reads is what stands in the block:
 * - the two great GLASS-ROOFED HALLS with iron ribs, the longer between the courts, the shorter toward Rue d'Aubervilliers;
 * - the great GABLE of the hall, stone striped with red brick, a fan-headed window filling it and a round oculus either side
 *   ("Le Cent Quatre à Paris, juin 2012");
 * - the stone ranges on both streets, four floors, an arch through the middle, the inscription on the Aubervilliers side.
 *
 * Local −z faces south (`front` 195), +x east to Rue Curial. The halls' sections and the ranges' heights are estimated from
 * the photographs; the courts are OSM's.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { box, strut, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { roof } from '../../kit.ts'
import { signText } from '../../parts.ts'
import { groundMid, quadN, type V3 } from './bowl.ts'
import { clamp } from './shell.ts'

const STONE: Rgb = [0.82, 0.77, 0.65]
const STONE_DK: Rgb = [0.7, 0.65, 0.54]
const BRICK: Rgb = [0.6, 0.27, 0.19]
const GLASS: Rgb = [0.5, 0.62, 0.66]
const GLASS2: Rgb = [0.42, 0.54, 0.6]
const DARK: Rgb = [0.13, 0.15, 0.17]
const IRON: Rgb = [0.26, 0.3, 0.32]
const SLATE: Rgb = [0.38, 0.4, 0.44]
const ZINC: Rgb = [0.55, 0.56, 0.56]
const PAVE: Rgb = [0.66, 0.64, 0.6]

/** a gable-roofed hall of glass along x from x0 to x1, z0 to z1, eaves at y0, ridge at y1, its iron ribs every `bay` */
function glassHall(out: MeshBuilder, x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, bay: number, glass: number, metal: number): void {
  const zm = (z0 + z1) / 2
  const n = Math.max(2, Math.round((x1 - x0) / bay))
  for (let i = 0; i < n; i++) {
    const a = x0 + ((x1 - x0) * i) / n
    const b = x0 + ((x1 - x0) * (i + 1)) / n
    for (const [z, s] of [[z0, -1], [z1, 1]] as [number, number][]) {
      quadN(out, [[a, y0, z], [b, y0, z], [b, y1, zm], [a, y1, zm]], [0, 0.8, s], i % 2 ? GLASS : GLASS2, glass)
    }
  }
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n
    for (const z of [z0, z1]) strut(out, [x, y0, z], [x, y1 + 0.1, zm], 0.5, 0.5, IRON, metal, false)
  }
  // the purlins, two a side, and the ridge's lantern
  for (const f of [0.33, 0.66]) {
    for (const z of [z0, z1]) {
      const y = y0 + (y1 - y0) * f
      const zz = z + (zm - z) * f
      strut(out, [x0, y + 0.1, zz], [x1, y + 0.1, zz], 0.24, 0.24, IRON, metal, false)
    }
  }
  box(out, (x0 + x1) / 2, y1 + 0.2, zm, (x1 - x0) / 2, 0.3, 0.8, IRON, metal)
}

/** the hall's end wall, on the plane x = x: stone with brick stripes, a fan window, an oculus either side */
function gable(out: MeshBuilder, x: number, s: number, z0: number, z1: number, g: number, y0: number, y1: number, stone: number, brick: number, glass: number, metal: number): void {
  const zm = (z0 + z1) / 2
  const hw = (z1 - z0) / 2
  const n: V3 = [s, 0, 0]
  quadN(out, [[x, g, z0], [x, g, z1], [x, y0, z1], [x, y0, z0]], n, STONE, stone)
  quadN(out, [[x, y0, z0], [x, y0, z1], [x, y1, zm], [x, y1, zm]], n, STONE, stone)
  const off = (o: number): number => x + s * o
  // the coping up both slopes, the brick stripes on the piers
  for (const e of [z0, z1]) strut(out, [off(0.3), y0, e], [off(0.3), y1 + 0.3, zm], 1.1, 0.9, STONE_DK, stone, false)
  for (const yy of [g + 4, g + 8, g + 12]) {
    for (const [a, b] of [[z0, zm - hw * 0.5], [zm + hw * 0.5, z1]]) box(out, off(0.1), yy, (a + b) / 2, 0.1, 0.45, Math.abs(b - a) / 2, BRICK, brick)
  }
  // the great window: its rectangle and its round head, with the iron's bars
  const w = hw * 0.48
  const top = y0 - 2
  box(out, off(0.1), (g + 0.2 + top) / 2, zm, 0.08, (top - g - 0.2) / 2, w, GLASS2, glass)
  const m = 12
  for (let i = 0; i < m; i++) {
    const a0 = (i / m) * Math.PI
    const a1 = ((i + 1) / m) * Math.PI
    quadN(out, [[off(0.1), top, zm], [off(0.1), top + Math.sin(a0) * w, zm + Math.cos(a0) * w], [off(0.1), top + Math.sin(a1) * w, zm + Math.cos(a1) * w], [off(0.1), top + Math.sin(a1) * w, zm + Math.cos(a1) * w]], n, GLASS2, glass)
    strut(out, [off(0.2), top + Math.sin(a0) * (w + 0.5), zm + Math.cos(a0) * (w + 0.5)], [off(0.2), top + Math.sin(a1) * (w + 0.5), zm + Math.cos(a1) * (w + 0.5)], 0.7, 0.7, BRICK, brick, false)
    strut(out, [off(0.18), top, zm], [off(0.18), top + Math.sin(a0) * w, zm + Math.cos(a0) * w], 0.14, 0.14, IRON, metal, false)
  }
  for (let i = 0; i <= 6; i++) box(out, off(0.18), (g + top) / 2, zm - w + (2 * w * i) / 6, 0.05, (top - g) / 2, 0.08, IRON, metal)
  // the two oculi
  for (const d of [-1, 1]) {
    const zc = zm + d * hw * 0.68
    const yc = y0 - 2
    for (let i = 0; i < 12; i++) {
      const a0 = (i / 12) * Math.PI * 2
      const a1 = ((i + 1) / 12) * Math.PI * 2
      const ring = (r: number, c: Rgb, o: number, tag: number): void => quadN(out, [[off(o), yc, zc], [off(o), yc + Math.sin(a0) * r, zc + Math.cos(a0) * r], [off(o), yc + Math.sin(a1) * r, zc + Math.cos(a1) * r], [off(o), yc + Math.sin(a1) * r, zc + Math.cos(a1) * r]], n, c, tag)
      ring(2, BRICK, 0.08, brick)
      ring(1.4, GLASS2, 0.14, glass)
    }
  }
}

export function centQuatre(out: MeshBuilder, fit: Fit): void {
  const stone = surfaceTag('ashlar')
  const brick = surfaceTag('brick')
  const glass = surfaceTag('glass')
  const metal = surfaceTag('metal')
  const conc = surfaceTag('concrete')
  const hx = clamp(fit.hx, 30, 115)
  const hz = clamp(fit.hz, 15, 40)
  const sx = hx / 111.6
  const sz = hz / 36.7
  const g = groundMid(fit)
  const S = (x0: number, x1: number, z0: number, z1: number, y1: number, c: Rgb = STONE, tag = stone): void =>
    box(out, ((x0 + x1) / 2) * sx, (g - 0.5 + y1) / 2, ((z0 + z1) / 2) * sz, ((x1 - x0) / 2) * sx, (y1 - g + 0.5) / 2, ((z1 - z0) / 2) * sz, c, tag)

  // ---- the paved floor of the courts
  quadN(out, [[-hx, g + 0.05, -hz], [hx, g + 0.05, -hz], [hx, g + 0.05, hz], [-hx, g + 0.05, hz]], [0, 1, 0], PAVE, conc)

  // ---- the long ranges down both flanks: stone, zinc-topped, two floors of tall windows with brick lintels
  const eaves = g + 13
  for (const [z0, z1, face] of [[-36.7, -26, -1], [26, 36.7, 1]] as [number, number, number][]) {
    S(-111.6, 111.6, z0, z1, eaves)
    box(out, 0, eaves + 0.2, ((z0 + z1) / 2) * sz, hx, 0.25, ((z1 - z0) / 2) * sz, ZINC, metal)
    const zf = (face < 0 ? z0 : z1) * sz + face * 0.05
    const n = Math.round(hx / 3.4)
    for (let i = 0; i < n; i++) {
      const x = -hx + ((2 * hx) * (i + 0.5)) / n
      for (const [y, h] of [[g + 1.2, 3.6], [g + 7, 4]]) {
        box(out, x, y + h / 2, zf, 1.3, h / 2, 0.05, DARK, glass)
        box(out, x, y + h + 0.2, zf + face * 0.04, 1.6, 0.26, 0.05, BRICK, brick)
      }
      if (i % 2) box(out, x + hx / n, (g + 12) / 2 + 0.3, zf + face * 0.1, 0.32, 6, 0.1, STONE_DK, stone)
    }
    box(out, 0, g + 6.2, zf + face * 0.08, hx, 0.26, 0.08, BRICK, brick)
    box(out, 0, eaves - 0.5, zf + face * 0.16, hx + 0.2, 0.5, 0.16, STONE_DK, stone)
  }

  // ---- the stone range on each street: higher, slate-roofed, its windows, the arch through the middle
  const rangeTop = g + 17
  for (const [x0, x1, face] of [[-111.6, -101, -1], [100, 111.6, 1]] as [number, number, number][]) {
    S(x0, x1, -36.7, 36.7, rangeTop)
    const xc = ((x0 + x1) / 2) * sx
    roof(out, x0 * sx + 0.4, x1 * sx - 0.4, -hz + 0.4, hz - 0.4, rangeTop + 0.6, 4, ((x1 - x0) / 2) * sx - 1.4, 1.4, SLATE)
    box(out, xc, rangeTop + 0.2, 0, ((x1 - x0) / 2) * sx + 0.4, 0.45, hz + 0.3, STONE_DK, stone)
    const xf = (face < 0 ? x0 : x1) * sx + face * 0.06
    const n = 15
    for (let f = 0; f < 3; f++) {
      for (let i = 0; i < n; i++) {
        const z = -hz + ((2 * hz) * (i + 0.5)) / n
        if (Math.abs(z) < 5.5 && f === 0) continue
        box(out, xf, g + 2 + f * 4.9 + 1.5, z, 0.05, 1.7, 1, DARK, glass)
      }
    }
    // the arch: a dark round-headed opening under a balcony, its keystone band
    box(out, xf + face * 0.04, g + 3, 0, 0.05, 3.6, 4, DARK, glass)
    for (let i = 0; i < 10; i++) {
      const a0 = (i / 10) * Math.PI
      const a1 = ((i + 1) / 10) * Math.PI
      const P = (a: number, r: number): V3 => [xf + face * 0.04, g + 6.6 + Math.sin(a) * r, Math.cos(a) * r]
      quadN(out, [P(a0, 0), P(a0, 4), P(a1, 4), P(a1, 4)], [face, 0, 0], DARK, glass)
      strut(out, P(a0, 4.5), P(a1, 4.5), 0.9, 0.9, STONE_DK, stone, false)
    }
    box(out, xf + face * 0.6, g + 11.4, 0, 0.6, 0.2, 5, STONE_DK, stone)
    box(out, xf + face * 0.1, g + 10.2, 0, 0.1, 0.5, 5.2, STONE, stone)
  }
  signText(out, 'SERVICE MUNICIPAL DES POMPES FUNEBRES DE PARIS', -111.6 * sx - 0.3, g + 10.2, 0, 0.5, [0.3, 0.27, 0.22], { heading: -Math.PI / 2 })

  // ---- the cross ranges between the courts, plain and low
  S(-31, -19, -26, -15, eaves)
  S(-31, -19, 16, 26, eaves)
  S(87, 100, -26, -22, eaves)
  S(87, 100, 24, 26, eaves)

  // ---- the long hall between the courts and the short one toward Aubervilliers, with their gables
  const Z0 = -26 * sz
  const Z1 = 26 * sz
  const rid = g + 29
  glassHall(out, -19 * sx, 87 * sx, Z0, Z1, eaves, rid, 8.8, glass, metal)
  gable(out, 87 * sx, 1, Z0, Z1, g, eaves, rid, stone, brick, glass, metal)
  gable(out, -19 * sx, -1, Z0, Z1, g, eaves, rid, stone, brick, glass, metal)
  const rid2 = g + 24
  glassHall(out, -90 * sx, -33 * sx, Z0, Z1, eaves, rid2, 8, glass, metal)
  gable(out, -33 * sx, 1, Z0, Z1, g, eaves, rid2, stone, brick, glass, metal)
  // the short hall's far end against the range's courts: a plain stone wall and the small courts' floor
  quadN(out, [[-90 * sx, g, Z0], [-90 * sx, g, Z1], [-90 * sx, rid2, 0], [-90 * sx, rid2, 0]], [-1, 0, 0], STONE, stone)
  quadN(out, [[-90 * sx, g, Z0], [-90 * sx, g, Z1], [-90 * sx, eaves, Z1], [-90 * sx, eaves, Z0]], [-1, 0, 0], STONE, stone)
}
