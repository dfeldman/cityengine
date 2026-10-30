/**
 * The JARDIN DES PLANTES' GRANDES SERRES, the glass-and-iron row along the garden's south side (one model over the
 * five OSM ways, placed by point; local x along the row, bearing 70, the garden front at −z, bearing 160):
 *
 * - the two square PAVILIONS of Charles Rohault de Fleury (1834–36, the first iron-framed hothouses in France, steam
 *   heated after Kew: now the Serre des déserts et milieux arides to the west and the Serre de Nouvelle-Calédonie to the
 *   east — OSM's node "Serre de Nouvelle-Calédonie" stands in the eastern one, part way/1476752442; the western is
 *   way/1288442711): tall glass boxes on a dark green iron grid, their purple-tinted panes, a curved hipped roof to a
 *   railed lantern, standing on a stone terrace over the parvis with a ramp between them (Commons: "Grandes serres du
 *   Jardin des plantes.jpg", "France IDF 75 Jardin des plantes Grandes Serres 01.jpg");
 * - east of them the JARDIN D'HIVER (René Berger, 1936–37, part way/320012507, 55 × 23 m): the Art Deco winter garden,
 *   whitewashed glass walls under a long curved roof on brackets, a railed lantern along its top, and a low glazed
 *   lean-to along its garden front (Commons: "Paris - Grandes serres du Jardin des Plantes (27836030185).jpg");
 * - west of them the low curved GALLERY (way/23758088, 49 × 11 m): a lean-to of curved glass against a back wall,
 *   white ribs across it, as on the left of the "Grandes Serres 01" photograph.
 *
 * The Grande Galerie de l'Évolution is a museums-family restyle and not drawn here.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { box, prism, strut, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { roof } from '../../kit.ts'
import { quadN, type V3 } from './bowl.ts'

const IRON: Rgb = [0.13, 0.25, 0.2]          // Rohault's dark green
const PALE: Rgb = [0.62, 0.72, 0.6]          // Berger's pale green
const PANE: Rgb = [0.36, 0.33, 0.44]         // the old panes' purple cast
const WHITE_GL: Rgb = [0.78, 0.82, 0.8]      // the winter garden's whitewashed glass
const STONE: Rgb = [0.78, 0.72, 0.6]

/** a glazed wall on one side of a box, mullions every `bay` metres, transoms at the given heights */
function glassWall(out: MeshBuilder, a: [number, number], b: [number, number], y0: number, y1: number, n: [number, number], pane: Rgb,
  frame: Rgb, bay: number, transoms: number[], heavy = 4): void {
  const gl = surfaceTag('glass')
  const met = surfaceTag('metal')
  quadN(out, [[a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]], [n[0], 0, n[1]], pane, gl)
  const L = Math.hypot(b[0] - a[0], b[1] - a[1])
  const m = Math.max(1, Math.round(L / bay))
  for (let i = 0; i <= m; i++) {
    const f = i / m
    const x = a[0] + (b[0] - a[0]) * f + n[0] * 0.08
    const z = a[1] + (b[1] - a[1]) * f + n[1] * 0.08
    const big = i % heavy === 0
    strut(out, [x, y0, z], [x, y1, z], big ? 0.3 : 0.1, big ? 0.3 : 0.1, frame, met, false)
  }
  for (const t of transoms) strut(out, [a[0] + n[0] * 0.1, t, a[1] + n[1] * 0.1], [b[0] + n[0] * 0.1, t, b[1] + n[1] * 0.1], 0.14, 0.14, frame, met, false)
}

/** a railing round a rectangle at y */
function rail(out: MeshBuilder, x0: number, x1: number, z0: number, z1: number, y: number, c: Rgb): void {
  const met = surfaceTag('metal')
  const pts: [number, number][] = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]
  for (let i = 0; i < 4; i++) {
    const p = pts[i], q = pts[(i + 1) % 4]
    strut(out, [p[0], y + 1, p[1]], [q[0], y + 1, q[1]], 0.06, 0.06, c, met, false)
    const L = Math.hypot(q[0] - p[0], q[1] - p[1])
    const m = Math.max(1, Math.round(L / 1.5))
    for (let k = 0; k < m; k++) {
      const f = k / m
      strut(out, [p[0] + (q[0] - p[0]) * f, y, p[1] + (q[1] - p[1]) * f], [p[0] + (q[0] - p[0]) * f, y + 1, p[1] + (q[1] - p[1]) * f], 0.05, 0.05, c, met, false)
    }
  }
}

/** a curved hipped roof over a rectangle: steep at the eaves, flattening to a top inset by `inset` */
function curvedRoof(out: MeshBuilder, x0: number, x1: number, z0: number, z1: number, y0: number, rise: number, inset: number, c: Rgb): void {
  const n = 4
  for (let k = 0; k < n; k++) {
    const t0 = k / n, t1 = (k + 1) / n
    const i0 = inset * (1 - Math.cos((t0 * Math.PI) / 2)), i1 = inset * (1 - Math.cos((t1 * Math.PI) / 2))
    const h0 = rise * Math.sin((t0 * Math.PI) / 2), h1 = rise * Math.sin((t1 * Math.PI) / 2)
    roof(out, x0 + i0, x1 - i0, z0 + i0, z1 - i0, y0 + h0, h1 - h0, i1 - i0, i1 - i0, c)
  }
}

function pavilion(out: MeshBuilder, x0: number, x1: number, z0: number, z1: number, y0: number): void {
  const H = 11.5
  const eaves = y0 + H
  // the stone base course, the glass walls, the iron cornice
  box(out, (x0 + x1) / 2, y0 + 0.4, (z0 + z1) / 2, (x1 - x0) / 2 + 0.2, 0.4, (z1 - z0) / 2 + 0.2, STONE, surfaceTag('ashlar'))
  const walls: [[number, number], [number, number], [number, number]][] = [
    [[x0, z0], [x1, z0], [0, -1]], [[x1, z1], [x0, z1], [0, 1]], [[x0, z1], [x0, z0], [-1, 0]], [[x1, z0], [x1, z1], [1, 0]]]
  for (const [a, b, n] of walls) glassWall(out, a, b, y0 + 0.8, eaves, n, PANE, IRON, 1.15, [y0 + 4.2, y0 + 8.2, eaves - 1.1])
  box(out, (x0 + x1) / 2, eaves + 0.2, (z0 + z1) / 2, (x1 - x0) / 2 + 0.35, 0.3, (z1 - z0) / 2 + 0.35, IRON, surfaceTag('metal'))
  // the curved glass roof, its ribs, and the railed lantern on top
  curvedRoof(out, x0 - 0.2, x1 + 0.2, z0 - 0.2, z1 + 0.2, eaves + 0.5, 4.2, 4.2, [0.28, 0.36, 0.36])
  const tx0 = x0 + 4, tx1 = x1 - 4, tz0 = z0 + 4, tz1 = z1 - 4
  box(out, (tx0 + tx1) / 2, eaves + 4.7 + 1.0, (tz0 + tz1) / 2, (tx1 - tx0) / 2 - 0.4, 1.0, (tz1 - tz0) / 2 - 0.4, PANE, surfaceTag('glass'))
  box(out, (tx0 + tx1) / 2, eaves + 6.85, (tz0 + tz1) / 2, (tx1 - tx0) / 2 - 0.2, 0.15, (tz1 - tz0) / 2 - 0.2, IRON, surfaceTag('metal'))
  rail(out, tx0 + 0.2, tx1 - 0.2, tz0 + 0.2, tz1 - 0.2, eaves + 7, IRON)
  for (let x = x0; x <= x1 + 0.01; x += (x1 - x0) / 8) {
    for (const [zA, zB] of [[z0 - 0.2, tz0], [z1 + 0.2, tz1]]) {
      const xs = x0 + 4 + ((x - x0) / (x1 - x0)) * (tx1 - tx0)
      strut(out, [x, eaves + 0.55, zA], [xs, eaves + 4.75, zB], 0.12, 0.12, IRON, surfaceTag('metal'), false)
    }
  }
}

export function grandesSerres(out: MeshBuilder, fit: Fit): void {
  const ash = surfaceTag('ashlar')
  const met = surfaceTag('metal')
  const gl = surfaceTag('glass')
  const G = (x: number, z: number): number => fit.groundAt?.(x, z) ?? 0.5

  /* the terrace under the pavilions: a stone wall to the parvis, a balustrade, the ramp between them */
  const tY = Math.max(G(-24, -9), G(11, -9)) + 2.4
  box(out, -10, tY - 2.25, -0.5, 30, 2.25, 10.5, STONE, ash)
  for (const x of [-38, -26, -13, 1, 13, 20]) box(out, x, tY + 0.55, -11, 0.35, 0.6, 0.35, STONE, ash)
  strut(out, [-39.5, tY + 1.0, -11], [19.5, tY + 1.0, -11], 0.1, 0.1, IRON, met, false)
  // the ramp up between the pavilions, from the parvis
  quadN(out, [[-11, G(-6, -26) - 0.2, -26], [-1, G(-6, -26) - 0.2, -26], [-1, tY, -11], [-11, tY, -11]], [0, 1, -0.2], [0.72, 0.7, 0.66], surfaceTag('concrete'))
  // the stair to the west pavilion
  for (let k = 0; k < 10; k++) {
    const top = tY - 0.24 * k
    const bot = tY - 4.5
    box(out, -24, (top + bot) / 2, -11 - 0.32 * k - 0.16, 3, (top - bot) / 2, 0.16, STONE, ash)
  }

  /* the two pavilions */
  pavilion(out, -34, -14, -7.4, 5.9, tY)
  pavilion(out, 0.8, 21.1, -7.2, 6.1, tY)
  // the links: the west one to the gallery, the east one to the winter garden (low glazed passages)
  for (const [x0, x1, z0, z1] of [[-39, -34, -3.4, 5.5], [21.1, 25.5, -3.2, 5]]) {
    box(out, (x0 + x1) / 2, tY + 2.5, (z0 + z1) / 2, (x1 - x0) / 2, 2.5, (z1 - z0) / 2, PANE, gl)
    box(out, (x0 + x1) / 2, tY + 5.15, (z0 + z1) / 2, (x1 - x0) / 2 + 0.2, 0.15, (z1 - z0) / 2 + 0.2, IRON, met)
  }

  /* the winter garden */
  const wx0 = 25.5, wx1 = 80.3, wz0 = -8, wz1 = 12.2
  const wy = G(53, -9) + 0.1
  const wE = wy + 10.5
  box(out, (wx0 + wx1) / 2, wy - 0.2, (wz0 + wz1) / 2, (wx1 - wx0) / 2 + 0.3, 0.7, (wz1 - wz0) / 2 + 0.3, STONE, ash)
  const ww: [[number, number], [number, number], [number, number]][] = [
    [[wx0, wz0], [wx1, wz0], [0, -1]], [[wx1, wz1], [wx0, wz1], [0, 1]], [[wx0, wz1], [wx0, wz0], [-1, 0]], [[wx1, wz0], [wx1, wz1], [1, 0]]]
  for (const [a, b, n] of ww) glassWall(out, a, b, wy + 0.5, wE, n, WHITE_GL, PALE, 1.0, [wy + 3.5, wE - 0.4], 5)
  // the eaves beam on its brackets, the long curved roof to the lantern
  box(out, (wx0 + wx1) / 2, wE + 0.3, (wz0 + wz1) / 2, (wx1 - wx0) / 2 + 1.0, 0.3, (wz1 - wz0) / 2 + 1.0, PALE, met)
  for (let x = wx0; x <= wx1 + 0.01; x += (wx1 - wx0) / 18) {
    for (const [z, s] of [[wz0, -1], [wz1, 1]] as const) {
      quadN(out, [[x, wE - 1.8, z + s * 0.05], [x, wE, z + s * 0.05], [x, wE, z + s * 1.0], [x, wE, z + s * 1.0]], [1, 0, 0], PALE, met)
      strut(out, [x, wE - 1.8, z + s * 0.1], [x, wE, z + s * 0.95], 0.18, 0.18, PALE, met, false)
    }
  }
  const rise = 6.5
  const ins = 6.2
  for (let k = 0; k < 4; k++) {
    const t0 = k / 4, t1 = (k + 1) / 4
    const i0 = ins * Math.sin((t0 * Math.PI) / 2) ** 1.4, i1 = ins * Math.sin((t1 * Math.PI) / 2) ** 1.4
    const h0 = rise * t0, h1 = rise * t1
    // only along the long sides: the ends are hipped by the same profile
    roof(out, wx0 - 0.8 + i0, wx1 + 0.8 - i0, wz0 - 0.8 + i0, wz1 + 0.8 - i0, wE + 0.6 + h0, h1 - h0, i1 - i0, i1 - i0, WHITE_GL)
  }
  for (let x = wx0 + ins - 0.8; x <= wx1 - ins + 0.81; x += (wx1 - wx0 - 2 * ins + 1.6) / 22) {
    for (const [zA, zB] of [[wz0 - 0.8, wz0 - 0.8 + ins], [wz1 + 0.8, wz1 + 0.8 - ins]]) {
      const pts: V3[] = []
      for (let k = 0; k <= 4; k++) {
        const t = k / 4
        pts.push([x, wE + 0.65 + rise * t, zA + (zB - zA) * Math.sin((t * Math.PI) / 2) ** 1.4])
      }
      for (let k = 0; k < 4; k++) strut(out, pts[k], pts[k + 1], 0.12, 0.12, PALE, met, false)
    }
  }
  const lz0 = wz0 - 0.8 + ins, lz1 = wz1 + 0.8 - ins
  const lY = wE + 0.6 + rise
  box(out, (wx0 + wx1) / 2, lY + 1.2, (lz0 + lz1) / 2, (wx1 - wx0) / 2 - ins, 1.2, (lz1 - lz0) / 2 - 0.6, WHITE_GL, gl)
  box(out, (wx0 + wx1) / 2, lY + 2.5, (lz0 + lz1) / 2, (wx1 - wx0) / 2 - ins + 0.3, 0.12, (lz1 - lz0) / 2 - 0.3, PALE, met)
  rail(out, wx0 + ins, wx1 - ins, lz0 + 0.6, lz1 - 0.6, lY + 2.6, PALE)
  // the lean-to along the garden front, its little gabled porch in the middle
  const ly0 = wy, lyE = wy + 3.6
  quadN(out, [[wx0, ly0, -11.2], [wx1, ly0, -11.2], [wx1, lyE, -11.2], [wx0, lyE, -11.2]], [0, 0, -1], WHITE_GL, gl)
  for (const [x, s] of [[wx0, -1], [wx1, 1]] as const) quadN(out, [[x, ly0, -11.2], [x, ly0, wz0], [x, wy + 6, wz0], [x, lyE, -11.2]], [s, 0, 0], WHITE_GL, gl)
  quadN(out, [[wx0, lyE, -11.4], [wx1, lyE, -11.4], [wx1, wy + 6, wz0], [wx0, wy + 6, wz0]], [0, 1, -0.6], [0.5, 0.55, 0.56], met)
  for (let x = wx0; x <= wx1 + 0.01; x += (wx1 - wx0) / 27) strut(out, [x, ly0, -11.25], [x, lyE, -11.25], 0.12, 0.12, PALE, met, false)
  strut(out, [wx0, lyE, -11.3], [wx1, lyE, -11.3], 0.2, 0.2, PALE, met, false)
  const px = (wx0 + wx1) / 2
  box(out, px, ly0 + 2.4, -12.5, 3, 2.4, 1.4, WHITE_GL, gl)
  quadN(out, [[px - 3.2, ly0 + 4.8, -13.9], [px, ly0 + 6.6, -13.9], [px, ly0 + 6.6, -11.2], [px - 3.2, ly0 + 4.8, -11.2]], [-0.5, 1, 0], [0.5, 0.55, 0.56], met)
  quadN(out, [[px, ly0 + 6.6, -13.9], [px + 3.2, ly0 + 4.8, -13.9], [px + 3.2, ly0 + 4.8, -11.2], [px, ly0 + 6.6, -11.2]], [0.5, 1, 0], [0.5, 0.55, 0.56], met)
  quadN(out, [[px - 3, ly0 + 4.8, -13.92], [px + 3, ly0 + 4.8, -13.92], [px, ly0 + 6.5, -13.92], [px, ly0 + 6.5, -13.92]], [0, 0, -1], WHITE_GL, gl)

  /* the curved gallery to the west: a back wall and a quarter-round glass lean-to, white ribs */
  const gx0 = -87.9, gx1 = -39, gz0 = -4, gz1 = 6.8
  const gy = G((gx0 + gx1) / 2, gz0) + 0.1
  const gH = 7.2
  box(out, (gx0 + gx1) / 2, gy + gH / 2 - 0.3, gz1 - 0.4, (gx1 - gx0) / 2, gH / 2 + 0.3, 0.4, STONE, ash)
  box(out, (gx0 + gx1) / 2, gy + 0.3, (gz0 + gz1) / 2, (gx1 - gx0) / 2, 0.7, (gz1 - gz0) / 2, STONE, ash)
  const R = gz1 - 0.8 - gz0
  const arcP = (t: number): [number, number] => [gz1 - 0.8 - Math.cos(t) * R, gy + 1 + Math.sin(t) * (gH - 1)]
  for (let k = 0; k < 6; k++) {
    const [za, ya] = arcP((k / 6) * (Math.PI / 2))
    const [zb, yb] = arcP(((k + 1) / 6) * (Math.PI / 2))
    quadN(out, [[gx0, ya, za], [gx1, ya, za], [gx1, yb, zb], [gx0, yb, zb]], [0, Math.cos(((k + 0.5) / 6) * (Math.PI / 2)) * 0 + 0.6, -1], [0.66, 0.72, 0.74], gl)
  }
  for (let x = gx0; x <= gx1 + 0.01; x += (gx1 - gx0) / 16) {
    for (let k = 0; k < 6; k++) {
      const [za, ya] = arcP((k / 6) * (Math.PI / 2))
      const [zb, yb] = arcP(((k + 1) / 6) * (Math.PI / 2))
      strut(out, [x, ya + 0.08, za - 0.05], [x, yb + 0.08, zb - 0.05], 0.35, 0.12, [0.92, 0.92, 0.9], met, false)
    }
  }
  // its two end walls, and the two round entrance bays on its back (OSM's half-rounds)
  for (const x of [gx0, gx1]) box(out, x, gy + gH / 2, (gz0 + gz1) / 2, 0.3, gH / 2, (gz1 - gz0) / 2, STONE, ash)
  for (const x of [-44, -64.6]) {
    prism(out, x, 7.2, gy, gy + 5, 1.7, 12, STONE, ash)
    prism(out, x, 7.2, gy + 5, gy + 5.8, 1.9, 12, IRON, met, 0.3)
  }
}
