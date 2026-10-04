/**
 * LONE MOUNTAIN, the old San Francisco College for Women (Henry A. Minton, 1932; USF since 1978) on the summit of
 * Lone Mountain — Spanish Gothic Revival, found on the universities audit, 2026-10-04: the city drew its 103-point
 * outline as a generic 15 m block. From Commons ("USA-San Francisco-University of San Francisco-Lone Mountain
 * Campus-Main-10", and the college's 1932 library bookplate): cream stucco wings of three and four storeys under red
 * tile hipped roofs, and at the middle of the south front a square TOWER about two and a half times their height —
 * buttressed corners running up into clusters of pinnacles, a great double lancet in the upper stage, a pinnacled
 * crown, a low red-tile pyramid with green copper ridges, and an iron cross.
 *
 * Local frame: `front: 180`, so x east and z north; the tower is placed from the outline's own bounding box (the
 * small square block the outline steps out round, south of the middle).
 */
import type { MeshBuilder } from '../../buildings.ts'
import { box, strut, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import type { Fit } from '../fit.ts'
import { towerRing } from '../tower.ts'
import { fromRecipe } from './recipes.ts'

const CREAM: Rgb = [0.9, 0.84, 0.7]
const TRIM: Rgb = [0.84, 0.74, 0.6]
const TILE: Rgb = [0.5, 0.24, 0.16]
const COPPER: Rgb = [0.36, 0.56, 0.48]
const DARK: Rgb = [0.2, 0.22, 0.24]

const wings = fromRecipe('edwardian-terracotta', {
  height: 15, wall: CREAM, glass: [0.24, 0.27, 0.28], base: 0, baseWall: CREAM,
  crown: { kind: 'hip', height: 3.5, inset: 0.6, colour: TILE, material: 'tile' },
})

/** a square pyramid on the axes, base half-width h at y0, apex at y1 */
function pyramid(out: MeshBuilder, cx: number, cz: number, h: number, y0: number, y1: number, c: Rgb, tag: number): void {
  const k: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]]
  for (let i = 0; i < 4; i++) {
    const [ax, az] = k[i], [bx, bz] = k[(i + 1) % 4]
    const mx = (ax + bx) / 2, mz = (az + bz) / 2
    const ny = h / Math.max(0.1, y1 - y0), L = Math.hypot(mx, ny, mz)
    const n: [number, number, number] = [mx / L, ny / L, mz / L]
    out.quad([[cx + ax * h, y0, cz + az * h], [cx + bx * h, y0, cz + bz * h], [cx, y1, cz], [cx, y1, cz]], n, [[0, 0], [1, 0], [0.5, 1], [0.5, 1]], c, tag)
  }
}

export function loneMountainMain(out: MeshBuilder, fit: Fit): void {
  wings(out, fit)
  const ring = towerRing(fit)
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
  for (const p of ring) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z) }
  // OSM's outline: bbox x −53…104, z −33…80 about the point the tower block stands at, (−5, −12)
  const tx = (x0 + x1) / 2 - 30.5, tz = (z0 + z1) / 2 - 35.5
  const st = surfaceTag('stucco')
  const W = 5.5, top = 30
  // the shaft
  box(out, tx, top / 2, tz, W, top / 2, W, CREAM, st)
  // the four corner buttresses, stepping in twice, running up into pinnacle clusters
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const bx = tx + sx * (W - 0.3), bz = tz + sz * (W - 0.3)
    box(out, bx, 11, bz, 1.2, 11, 1.2, TRIM, st)
    box(out, bx, 26, bz, 0.95, 4, 0.95, TRIM, st)
    box(out, bx, 33, bz, 0.7, 3, 0.7, TRIM, st)
    for (const [dx, dz] of [[0, 0], [0.45, 0.45], [-0.45, 0.45], [0.45, -0.45], [-0.45, -0.45]] as [number, number][]) {
      pyramid(out, bx + dx, bz + dz, dx === 0 ? 0.42 : 0.22, 36, dx === 0 ? 39.5 : 37.6, TRIM, st)
    }
  }
  // the crown over the shaft: a pinnacled parapet stage, and the low tiled pyramid with its copper ridges and cross
  box(out, tx, top + 3, tz, W - 0.4, 3, W - 0.4, CREAM, st)
  for (const s of [-1, 1]) {
    for (let k = -2; k <= 2; k++) {
      const u = (k / 2.5) * (W - 1.2)
      pyramid(out, tx + u, tz + s * (W - 0.4), 0.2, 36, 37.4, TRIM, st)
      pyramid(out, tx + s * (W - 0.4), tz + u, 0.2, 36, 37.4, TRIM, st)
    }
  }
  pyramid(out, tx, tz, W - 0.6, 36, 41, TILE, surfaceTag('tile'))
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) strut(out, [tx + sx * (W - 0.6), 36.05, tz + sz * (W - 0.6)], [tx, 41.05, tz], 0.18, 0.18, COPPER)
  strut(out, [tx, 41, tz], [tx, 44.5, tz], 0.16, 0.16, COPPER)
  strut(out, [tx - 0.8, 43.6, tz], [tx + 0.8, 43.6, tz], 0.14, 0.14, COPPER)
  // on every face: the great double lancet in the upper stage, a tall window and the entrance below
  for (const [nx, nz] of [[0, -1], [0, 1], [1, 0], [-1, 0]] as [number, number][]) {
    const fx = tx + nx * (W + 0.02), fz = tz + nz * (W + 0.02)
    const ux = -nz, uz = nx
    for (const s of [-0.85, 0.85]) {
      const cx = fx + ux * s, cz = fz + uz * s
      box(out, cx, 24, cz, Math.abs(ux) * 0.65 + 0.03, 4.2, Math.abs(uz) * 0.65 + 0.03, DARK, surfaceTag('glass'))
      pyramid(out, cx, cz, 0.62, 28.2, 29.6, DARK, surfaceTag('glass'))
    }
    // the hood mould round the pair
    box(out, fx + nx * 0.08, 30.1, fz + nz * 0.08, Math.abs(ux) * 2.2 + 0.08, 0.2, Math.abs(uz) * 2.2 + 0.08, TRIM, st)
    box(out, fx, 13, fz, Math.abs(ux) * 0.9 + 0.03, 3.5, Math.abs(uz) * 0.9 + 0.03, DARK, surfaceTag('glass'))
    if (nz === -1) box(out, fx, 2.6, fz, 1.6, 2.6, 0.06, [0.3, 0.2, 0.14], 0)
  }
}

/**
 * The GATEWAY at the head of the Lone Mountain stairway (Commons, "Lone Mountain entrance.jpg", 2022): a cream
 * Spanish Baroque arch the path passes through — paired pilasters each side, a round arch, a scrolled crest with a
 * shell cartouche over it — and a run of balustrade either side with urns on its posts. Local frame: x east, z north
 * (front 180), the path running north through the arch.
 */
export function loneMountainGate(out: MeshBuilder, _fit: Fit): void {
  const st = surfaceTag('stucco')
  const R = 1.6, spring = 4, D = 0.75
  // the piers, each a pair of pilasters on a plinth
  for (const s of [-1, 1]) {
    box(out, s * (R + 0.8), 2.4, 0, 0.8, 2.4, D, CREAM, st)
    for (const k of [0.25, 1.35]) box(out, s * (R + k), 2.6, -D - 0.1, 0.18, 2.6, 0.12, TRIM, st)
    box(out, s * (R + 0.8), 0.3, 0, 0.95, 0.3, D + 0.15, TRIM, st)
    box(out, s * (R + 0.8), 5.3, 0, 0.95, 0.12, D + 0.15, TRIM, st)
  }
  // the arch and the wall over it: thin vertical slices whose undersides follow the semicircle
  const n = 16
  for (let i = 0; i < n; i++) {
    const x0 = -R + (2 * R * i) / n, x1 = -R + (2 * R * (i + 1)) / n, xm = (x0 + x1) / 2
    const under = spring + Math.sqrt(Math.max(0, R * R - xm * xm))
    const topY = 6.4
    box(out, xm, (under + topY) / 2, 0, (x1 - x0) / 2 + 0.005, (topY - under) / 2, D, CREAM, st)
  }
  box(out, 0, 6.6, 0, R + 1.75, 0.2, D + 0.15, TRIM, st)
  // the crest: stepped, narrowing, the cartouche on its face and a finial
  for (let k = 0; k < 4; k++) box(out, 0, 7.0 + k * 0.45, 0, (R + 1.2) * (1 - k * 0.22), 0.23, D * 0.8, CREAM, st)
  box(out, 0, 7.6, -D * 0.8 - 0.06, 0.55, 0.65, 0.06, TRIM, st)
  box(out, 0, 9.0, 0, 0.3, 0.35, 0.3, TRIM, st)
  // the balustrades either side, urns on their posts
  for (const s of [-1, 1]) {
    const a = R + 1.75, b = a + 6
    box(out, s * (a + b) / 2, 0.15, 0, (b - a) / 2, 0.15, 0.25, CREAM, st)
    box(out, s * (a + b) / 2, 1.0, 0, (b - a) / 2, 0.08, 0.28, CREAM, st)
    for (let x = a + 0.3; x < b; x += 0.32) box(out, s * x, 0.6, 0, 0.07, 0.32, 0.07, CREAM, st)
    for (const x of [b]) {
      box(out, s * x, 0.6, 0, 0.3, 0.6, 0.3, CREAM, st)
      box(out, s * x, 1.45, 0, 0.22, 0.25, 0.22, TRIM, st)
      box(out, s * x, 1.8, 0, 0.12, 0.12, 0.12, TRIM, st)
    }
  }
}

export const LONE_MOUNTAIN: Record<string, (out: MeshBuilder, fit: Fit) => void> = { loneMountainMain, loneMountainGate }
