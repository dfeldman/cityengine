/**
 * PLACE VENDÔME'S FRONTS (top 25 audit, 2026-10-31: "still poor: Vendôme's fronts"; PARIS_BUGS.md). Hardouin-Mansart built the façades first and sold the plots behind them, so they are one design round the octagon, whichever
 * houses OSM cuts them into: a rusticated ground floor of round arches that are not a passage; two storeys under giant Corinthian pilasters; an entablature and a slate mansard. At the middle of the two long sides a three-arched
 * avant-corps on columns, under a triangular pediment; each of the four cut corners a pedimented screen of its own.
 *
 * The restyle (paris.json, "Place Vendôme — facades") keeps the roofs and everything behind, at one eaves height; this stands over its walls round the place, because the facade grammar's windows would not fall between pilasters of
 * ours. The wall lines are the city's own (rays from the column at the baked buildings, bake 20261031T0914), each side straight to within a few decimetres. Local metres from the column (rotation 0: +x east, +z north).
 */
import { MeshBuilder } from '../../../buildings.ts'
import { box, prism, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { archOn, palette, rectOn } from '../palaces/common.ts'

/** the column: the entry's lat, lon */
const CX = -190.5
const CZ = 779
const P = (x: number, z: number): [number, number] => [x - CX, z - CZ]

type Kind = 'plain' | 'corner' | 'centre'
/** Each stretch of front, in the city's metres. The two gaps in the short sides are the Rue de la Paix and the Rue de Castiglione. */
const RUNS: { a: [number, number]; b: [number, number]; kind: Kind }[] = [
  { a: P(-189.3, 860.6), b: P(-159.4, 840.7), kind: 'plain' },
  { a: P(-139.9, 827.5), b: P(-109.8, 807.7), kind: 'plain' },
  { a: P(-109.8, 807.7), b: P(-105.6, 787.4), kind: 'corner' },
  { a: P(-105.6, 787.4), b: P(-166.3, 695.7), kind: 'centre' },
  { a: P(-166.3, 695.7), b: P(-186.0, 691.8), kind: 'corner' },
  { a: P(-186.0, 691.8), b: P(-215.9, 711.9), kind: 'plain' },
  { a: P(-235.3, 724.8), b: P(-265.5, 744.8), kind: 'plain' },
  { a: P(-265.5, 744.8), b: P(-269.6, 765.2), kind: 'corner' },
  { a: P(-269.6, 765.2), b: P(-209.7, 856.5), kind: 'centre' },
  { a: P(-209.7, 856.5), b: P(-189.3, 860.6), kind: 'corner' },
]

/** the panel's face, this far out from the wall line: past the few decimetres the walls wander */
const FACE = 0.7
const BAY = 4.7
const ARCADE = 6.2
const CAPITAL = 15.7
const ARCHITRAVE = 16.4
const EAVES = 18.3

/** The front's bays over a stretch, on a plane. `columns`: engaged columns in place of the pilasters. */
function bays(q: MeshBuilder, x0: number, x1: number, plane: number, columns: boolean): void {
  const p = palette('#cec4ac', '#4f565b')
  const n = Math.max(1, Math.round((x1 - x0) / BAY))
  const w = (x1 - x0) / n
  const z = plane
  const body = (x: number, zz: number, hx: number, hz: number, y0: number, y1: number, c: Rgb, tag = 0): void => box(q, x, (y0 + y1) / 2, zz, hx, (y1 - y0) / 2, hz, c, tag)
  // the rustication's joints
  for (let y = 0.7; y < ARCADE - 0.2; y += 0.62) rectOn(q, '+z', z, x0, x1, y, y + 0.05, p.deep, 0.03)
  // the band over the arcade
  body((x0 + x1) / 2, z + 0.11, (x1 - x0) / 2, 0.11, ARCADE, ARCADE + 0.42, p.trim)
  for (let i = 0; i < n; i++) {
    const m = x0 + (i + 0.5) * w
    // the arch: its voussoirs, the dark of it, a fanlight's bar, a keystone
    archOn(q, '+z', z, m, 0, 3.5, 5.55, p.trim, 0.05)
    archOn(q, '+z', z, m, 0, 3.0, 5.25, p.glass, 0.08)
    rectOn(q, '+z', z, m - 1.5, m + 1.5, 3.72, 3.84, p.deep, 0.09)
    rectOn(q, '+z', z, m - 0.05, m + 0.05, 3.84, 5.1, p.deep, 0.09)
    body(m, z + 0.09, 0.26, 0.09, 5.2, 5.85, p.deep)
    // the tall windows, with their iron, and the shorter ones above them
    rectOn(q, '+z', z, m - 1.2, m + 1.2, 7.2, 11.25, p.trim, 0.05)
    rectOn(q, '+z', z, m - 0.98, m + 0.98, 7.4, 11.0, p.glass, 0.08)
    rectOn(q, '+z', z, m - 0.98, m + 0.98, 7.4, 8.3, p.dark, 0.1)
    rectOn(q, '+z', z, m - 0.04, m + 0.04, 8.3, 11.0, p.deep, 0.09)
    body(m, z + 0.11, 1.32, 0.11, 11.25, 11.5, p.trim)
    rectOn(q, '+z', z, m - 1.08, m + 1.08, 12.15, 15.1, p.trim, 0.05)
    rectOn(q, '+z', z, m - 0.86, m + 0.86, 12.33, 14.92, p.glass, 0.08)
    rectOn(q, '+z', z, m - 0.04, m + 0.04, 12.33, 14.92, p.deep, 0.09)
  }
  for (let i = 0; i <= n; i++) {
    const x = x0 + i * w
    if (columns) {
      prism(q, x, z + 0.42, ARCADE + 0.42, ARCADE + 1.05, 0.62, 8, p.trim, 0)
      prism(q, x, z + 0.42, ARCADE + 1.05, CAPITAL, 0.48, 10, p.trim, 0, 0.42)
      prism(q, x, z + 0.42, CAPITAL, ARCHITRAVE, 0.44, 8, shade(p.trim, 0.93), 0, 0.64)
    } else {
      body(x, z + 0.14, 0.48, 0.14, ARCADE + 0.42, ARCADE + 1.05, p.trim)
      body(x, z + 0.11, 0.4, 0.11, ARCADE + 1.05, CAPITAL, p.trim)
      // its flutes, and the capital's leaves as a darker band
      for (const d of [-0.2, 0, 0.2]) rectOn(q, '+z', z + 0.22, x + d - 0.03, x + d + 0.03, ARCADE + 1.25, CAPITAL - 0.1, p.deep, 0.01)
      body(x, z + 0.16, 0.52, 0.16, CAPITAL, ARCHITRAVE, shade(p.trim, 0.93))
    }
  }
}

/** A triangular pediment on a plane, its back into the roof. */
function pediment(q: MeshBuilder, m: number, half: number, plane: number, y: number, rise: number, deep: number): void {
  const p = palette('#cec4ac', '#4f565b')
  const fr = plane + 0.55, bk = plane - deep
  const tri = (z: number, n: [number, number, number], c: Rgb): void => q.quad([[m - half, y, z], [m + half, y, z], [m, y + rise, z], [m, y + rise, z]], n, [[0, 0], [1, 0], [0.5, 1], [0.5, 1]], c, 0)
  tri(fr, [0, 0, 1], p.stone)
  tri(bk, [0, 0, -1], p.stone)
  // the raking cornices, and its slate
  const slope = Math.hypot(half, rise), ny = half / slope, nx = rise / slope
  q.quad([[m - half - 0.5, y - 0.05, fr + 0.3], [m, y + rise + 0.25, fr + 0.3], [m, y + rise + 0.25, bk], [m - half - 0.5, y - 0.05, bk]], [-nx, ny, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], p.slate, 0)
  q.quad([[m + half + 0.5, y - 0.05, fr + 0.3], [m, y + rise + 0.25, fr + 0.3], [m, y + rise + 0.25, bk], [m + half + 0.5, y - 0.05, bk]], [nx, ny, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], p.slate, 0)
  const rake = (s: number): void => q.quad([[m + s * (half + 0.45), y - 0.1, fr + 0.3], [m, y + rise + 0.18, fr + 0.3], [m, y + rise - 0.3, fr + 0.3], [m + s * (half - 0.1), y + 0.28, fr + 0.3]], [0, 0, 1], [[0, 0], [1, 0], [1, 1], [0, 1]], p.trim, 0)
  rake(-1); rake(1)
  // the shield in its tympanum
  box(q, m, y + rise * 0.36, fr + 0.06, 0.8, 0.62, 0.06, shade(p.trim, 0.9), 0)
}

function run(q: MeshBuilder, L: number, kind: Kind): void {
  const p = palette('#cec4ac', '#4f565b')
  const ash = surfaceTag('ashlar')
  const entab = (x0: number, x1: number, z: number): void => {
    const hx = (x1 - x0) / 2, m = (x0 + x1) / 2
    box(q, m, (ARCHITRAVE + 17.2) / 2, z + 0.14, hx, (17.2 - ARCHITRAVE) / 2, 0.14, p.trim, 0)
    box(q, m, (17.2 + 17.75) / 2, z + 0.34, hx + 0.16, (17.75 - 17.2) / 2, 0.34, shade(p.trim, 1.03), 0)
    box(q, m, (17.75 + EAVES) / 2, z + 0.26, hx + 0.08, (EAVES - 17.75) / 2, 0.26, p.trim, 0)
  }
  // the wall itself, from below any slope to the eaves, and its ends
  box(q, L / 2, (EAVES - 1.6) / 2, FACE / 2, L / 2, (EAVES + 1.6) / 2, FACE / 2, p.stone, ash)
  if (kind === 'centre') {
    const m = L / 2, half = (3 * BAY) / 2
    bays(q, 0, m - half, FACE, false)
    bays(q, m + half, L, FACE, false)
    entab(0, L, FACE)
    // the avant-corps, a metre forward, on its columns
    const out = FACE + 0.9
    box(q, m, (EAVES - 1.6) / 2, (FACE + out) / 2, half + 0.5, (EAVES + 1.6) / 2, (out - FACE) / 2, p.stone, ash)
    bays(q, m - half, m + half, out, true)
    entab(m - half - 0.5, m + half + 0.5, out)
    pediment(q, m, half + 0.2, out, EAVES, 3.3, 2.6)
  } else {
    bays(q, 0, L, FACE, false)
    entab(0, L, FACE)
    if (kind === 'corner') pediment(q, L / 2, Math.min(L / 2 - 0.4, 8.5), FACE, EAVES, 2.8, 2.4)
  }
}

export function vendomeFronts(out: MeshBuilder, fit: Fit): void {
  for (const r of RUNS) {
    let [ax, az] = r.a
    let [bx, bz] = r.b
    let L = Math.hypot(bx - ax, bz - az)
    let ux = (bx - ax) / L, uz = (bz - az) / L
    // (local x along it, local +z out into the place, as a turn and not a mirror: (x, z) → (ux, uz)·x + (−uz, ux)·z)
    if (-uz * -ax + ux * -az < 0) { [ax, az, bx, bz] = [bx, bz, ax, az]; ux = -ux; uz = -uz }
    L = Math.hypot(bx - ax, bz - az)
    const q = new MeshBuilder()
    run(q, L, r.kind)
    const nx = -uz, nz = ux
    const y = fit.groundAt ? fit.groundAt(ax + (ux * L) / 2, az + (uz * L) / 2) : 0
    const base = out.positions.length / 3
    for (let i = 0; i < q.positions.length; i += 3) {
      const lx = q.positions[i], ly = q.positions[i + 1], lz = q.positions[i + 2]
      out.positions.push(ax + ux * lx + nx * lz, y + ly, az + uz * lx + nz * lz)
      const n0 = q.normals[i], n1 = q.normals[i + 1], n2 = q.normals[i + 2]
      out.normals.push(ux * n0 + nx * n2, n1, uz * n0 + nz * n2)
    }
    for (const u of q.uvs) out.uvs.push(u)
    for (const c of q.colors) out.colors.push(c)
    for (const i of q.indices) out.indices.push(base + i)
  }
}
