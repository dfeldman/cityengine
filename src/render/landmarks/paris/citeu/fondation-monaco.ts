/**
 * THE FONDATION DE MONACO — JULIEN MÉDECIN (1935): a pale-stone Italianate palazzo, five storeys over a rusticated
 * ground floor, string courses and a deep cornice, a corner pavilion that rises two more storeys as a tower with a
 * carved cartouche, all under low-pitched red tile roofs. Refs: Commons PH82540 / PH82539, "Fondation de monaco.jpg"
 * (docs/landmarks/refs/citeu/monaco/). Plan from OSM way 165825785 (name "Fondation de Monaco"); front ~south
 * (boulevard Jourdan).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { hex, type Rgb } from '../../kit.ts'
import { cap, edges, onWall, type P, type V } from './maison-tunisie.ts'

const STONE: Rgb = hex('#cdc6b6'), RUST: Rgb = hex('#b9b09e'), CORNICE: Rgb = hex('#e6dcc6')
const TILE: Rgb = hex('#a65a40'), GLASS: Rgb = hex('#2e3439'), FRAME: Rgb = hex('#ece6d8')
const stoneTag = surfaceTag('stone'), glassTag = surfaceTag('glass')

const GF = 4.2, FL = 3.2, STOREYS = 5                 // rusticated ground storey, then four more
const EAVE = GF + (STOREYS - 1) * FL                  // 17.0
const TOWER_UP = 2 * FL + 0.6, TOWER = 12             // the corner pavilion: extra height, side (m)
const ROOF_RISE = 1.6, ROOF_OUT = 0.9                 // low hipped eave skirt: rise, overhang
const BAY = 3.3, WIN_W = 1.25, WIN_H = 1.9            // window rhythm
const RUST_OUT = 0.12, COURSE_OUT = 0.18, CORN_OUT = 0.5, WIN_OUT = 0.04, FRAME_OUT = 0.07

function storeyWindows(out: MeshBuilder, a: P, b: P, n: V, L: number, y0: number, floors: number, firstH: number): void {
  const bays = Math.max(1, Math.floor(L / BAY)), step = L / bays
  for (let k = 0; k < bays; k++) {
    const t = (k + 0.5) * step
    for (let f = 0; f < floors; f++) {
      const y = f === 0 ? y0 + 1.0 : y0 + firstH + (f - 1) * FL + 0.75
      const h = f === 0 && firstH > FL ? WIN_H + 0.5 : WIN_H
      onWall(out, a, b, n, t - WIN_W / 2 - 0.15, t + WIN_W / 2 + 0.15, y - 0.15, y + h + 0.3, FRAME, FRAME_OUT, stoneTag)
      onWall(out, a, b, n, t - WIN_W / 2, t + WIN_W / 2, y, y + h, GLASS, FRAME_OUT + WIN_OUT, glassTag)
    }
  }
}

function block(out: MeshBuilder, ring: P[], len: number[], nrm: V[], base: number, top: number, rusticated: boolean): void {
  const N = ring.length
  for (let i = 0; i < N; i++) {
    const a = ring[i], b = ring[(i + 1) % N], L = len[i], n = nrm[i]
    if (L < 0.3) continue
    onWall(out, a, b, n, 0, L, base - 0.2, top, STONE, 0, stoneTag)
    if (rusticated) {
      onWall(out, a, b, n, 0, L, base - 0.2, base + GF - 0.3, RUST, RUST_OUT, stoneTag)
      onWall(out, a, b, n, -COURSE_OUT, L + COURSE_OUT, base + GF - 0.3, base + GF, CORNICE, COURSE_OUT, stoneTag)
      onWall(out, a, b, n, -COURSE_OUT, L + COURSE_OUT, base + GF + 2 * FL - 0.2, base + GF + 2 * FL, CORNICE, COURSE_OUT, stoneTag)
    }
    onWall(out, a, b, n, -CORN_OUT, L + CORN_OUT, top - 0.7, top, CORNICE, CORN_OUT, stoneTag)
    if (L > 2.5) storeyWindows(out, a, b, n, L, base, Math.round((top - base - (rusticated ? GF : 0)) / FL) + (rusticated ? 1 : 0), rusticated ? GF : FL)
  }
  roof(out, ring, nrm, top)
}

/** A low hip read from the street: the eave skirt slopes up and in from an overhang, a tile cap closes the top. */
function roof(out: MeshBuilder, ring: P[], nrm: V[], y: number): void {
  const N = ring.length, cx = ring.reduce((s, p) => s + p.x, 0) / N, cz = ring.reduce((s, p) => s + p.z, 0) / N
  const inset = 2.2
  const shrink = (p: P): P => { const dx = cx - p.x, dz = cz - p.z, d = Math.hypot(dx, dz) || 1, k = Math.min(inset, d * 0.5) / d; return { x: p.x + dx * k, z: p.z + dz * k } }
  const grow = (p: P, i: number): P => {
    const n0 = nrm[(i + N - 1) % N], n1 = nrm[i]
    return { x: p.x + (n0[0] + n1[0]) * 0.5 * ROOF_OUT, z: p.z + (n0[2] + n1[2]) * 0.5 * ROOF_OUT }
  }
  const outer = ring.map(grow), inner = ring.map(shrink)
  for (let i = 0; i < N; i++) {
    const j = (i + 1) % N, n = nrm[i]
    out.quad([[outer[i].x, y, outer[i].z], [outer[j].x, y, outer[j].z], [inner[j].x, y + ROOF_RISE, inner[j].z], [inner[i].x, y + ROOF_RISE, inner[i].z]],
      [n[0] * 0.6, 0.8, n[2] * 0.6], [[0, 0], [1, 0], [1, 1], [0, 1]], TILE, 0)
  }
  cap(out, inner, y + ROOF_RISE, TILE)
}

export function fondationMonaco(out: MeshBuilder, fit: Fit): void {
  const { ring, len, nrm } = edges(fit)
  block(out, ring, len, nrm, 0, EAVE, true)
  // the corner tower on the street front: the ring's front-most vertex, a square pavilion stepped back inside it
  let c = ring[0]
  for (const p of ring) if (p.z + Math.abs(p.x) * 0.15 < c.z + Math.abs(c.x) * 0.15) c = p
  const sx = c.x > 0 ? -1 : 1, x0 = c.x + sx * 1.5, z0 = c.z + 1.5
  const sq: P[] = sx > 0
    ? [{ x: x0, z: z0 }, { x: x0, z: z0 + TOWER }, { x: x0 + TOWER, z: z0 + TOWER }, { x: x0 + TOWER, z: z0 }]
    : [{ x: x0, z: z0 }, { x: x0 - TOWER, z: z0 }, { x: x0 - TOWER, z: z0 + TOWER }, { x: x0, z: z0 + TOWER }]
  const t = edges({ ...fit, ring: sq } as Fit)
  block(out, t.ring, t.len, t.nrm, EAVE + ROOF_RISE * 0.3, EAVE + TOWER_UP, false)
}
