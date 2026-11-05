/**
 * THE FONDATION AVICENNE (ex-Maison de l'Iran; Claude Parent, André Bloc, Mohsen Foroughi, Heydar Ghiai, 1969): a ten-storey
 * glass slab in two blocks of four storeys, one over the other with an open storey between, both hung from three black
 * steel portal frames that stand clear of the long faces and carry the whole on their top beams; black spiral stairs wind
 * up the faces outside the glass. A low glazed pavilion sits to the west at the foot. Refs: ciup.fr (restored 2024,
 * docs/landmarks/refs/citeu/avicenne/). Plan from OSM way 35282478 rotated to its axes; the pavilion's height is a guess.
 * Local frame: x along bearing 18, −z toward bearing 108 (the campus footway along the east face), origin the OSM outline's
 * vertex mean.
 */
import { MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { beam, column, hex, placed, type Rgb } from '../../kit.ts'
import { block } from '../batch2/tag.ts'
import { rectOn } from '../palaces/common.ts'

const STEEL: Rgb = hex('#26292c'), GLASS: Rgb = hex('#8f8a78'), DARK: Rgb = hex('#3b4045'), SLAB_EDGE: Rgb = hex('#5a5f63')
const PAVE: Rgb = hex('#b8b2a6')
const metal = surfaceTag('metal'), glass = surfaceTag('glass'), concrete = surfaceTag('concrete')

// plan (OSM, rotated): the slab, and the pavilion square (turned as OSM draws it)
const X0 = -21.3, X1 = 19.7, Z0 = -19.9, Z1 = -8.8
const PAV_C: [number, number] = [12.6, 9.4], PAV_HALF = 8.8, PAV_TURN = -20.6, PAV_H = 6.5
const LINK: [number, number, number, number] = [-9, 8, -8.8, 1]   // the glazed link from slab to pavilion
// heights: ground lobby, lower block, open storey, upper block, the portals' top beams
const LOBBY = 5, LOBBY_SET = 2.0, FL = 3.1, STOREYS = 4
const LOW0 = 7, LOW1 = LOW0 + STOREYS * FL, UP0 = LOW1 + 3.4, UP1 = UP0 + STOREYS * FL, TOP = UP1 + 2.2
// the portals: legs clear of the long faces, a deep beam over the roof and a transfer beam in the open storey
const PORTAL_X = [X0 + 0.8, (X0 + X1) / 2, X1 - 0.8], LEG = 0.7, LEG_GAP = 1.2, BEAM_D = 1.6
// curtain wall
const MULLION = 1.55, MULL_W = 0.09, SPANDREL = 0.35
// spiral stairs: [x, face], radius, steps per turn, rise per turn
const STAIRS: [number, -1 | 1][] = [[-11, -1], [9, 1]], ST_R = 2.1, ST_N = 14, ST_RISE = 3.1

function glassBlock(out: MeshBuilder, y0: number, y1: number): void {
  block(out, X0, X1, Z0, Z1, y0, y1, GLASS, glass)
  block(out, X0 - 0.15, X1 + 0.15, Z0 - 0.15, Z1 + 0.15, y0 - 0.5, y0, SLAB_EDGE, metal)   // the hung floor's edge
  block(out, X0 - 0.15, X1 + 0.15, Z0 - 0.15, Z1 + 0.15, y1, y1 + 0.5, SLAB_EDGE, metal)
  for (let y = y0 + FL; y < y1 - 0.1; y += FL) {   // spandrels
    rectOn(out, '-z', Z0, X0, X1, y - SPANDREL, y, DARK, 0.04)
    rectOn(out, '+z', Z1, X0, X1, y - SPANDREL, y, DARK, 0.04)
  }
  const n = Math.round((X1 - X0) / MULLION), s = (X1 - X0) / n
  for (let i = 1; i < n; i++) {
    const x = X0 + i * s
    rectOn(out, '-z', Z0, x - MULL_W, x + MULL_W, y0, y1, DARK, 0.06)
    rectOn(out, '+z', Z1, x - MULL_W, x + MULL_W, y0, y1, DARK, 0.06)
  }
  const m = Math.round((Z1 - Z0) / MULLION), t = (Z1 - Z0) / m
  for (let i = 1; i < m; i++) {
    const z = Z0 + i * t
    rectOn(out, '-x', X0, z - MULL_W, z + MULL_W, y0, y1, DARK, 0.06)
    rectOn(out, '+x', X1, z - MULL_W, z + MULL_W, y0, y1, DARK, 0.06)
  }
}

function portal(out: MeshBuilder, x: number, g: number): void {
  const za = Z0 - LEG_GAP - LEG, zb = Z1 + LEG_GAP + LEG
  for (const z of [za + LEG / 2, zb - LEG / 2]) block(out, x - LEG / 2, x + LEG / 2, z - LEG / 2, z + LEG / 2, g, g + TOP, STEEL, metal)
  block(out, x - LEG / 2, x + LEG / 2, za, zb, g + TOP - BEAM_D, g + TOP, STEEL, metal)         // the top beam
  block(out, x - LEG / 2, x + LEG / 2, za, zb, g + LOW1 + 0.5, g + LOW1 + 1.6, STEEL, metal)    // the transfer beam
}

function spiral(out: MeshBuilder, x: number, side: -1 | 1, g: number): void {
  const zc = side < 0 ? Z0 - ST_R - 0.3 : Z1 + ST_R + 0.3
  column(out, x, zc, g, g + UP1 + 1, 0.25, STEEL)
  const steps = Math.floor(UP1 / ST_RISE * ST_N)
  for (let i = 0; i < steps; i++) {
    const a = (i / ST_N) * Math.PI * 2, y = g + (i / ST_N) * ST_RISE
    beam(out, [x + Math.cos(a) * 0.3, y, zc + Math.sin(a) * 0.3], [x + Math.cos(a) * ST_R, y, zc + Math.sin(a) * ST_R], 0.32, STEEL, 0.05)
    // the outer stringer, a black ribbon as in the photographs
    const b = ((i + 1) / ST_N) * Math.PI * 2, y1 = y + ST_RISE / ST_N
    beam(out, [x + Math.cos(a) * ST_R, y + 0.5, zc + Math.sin(a) * ST_R], [x + Math.cos(b) * ST_R, y1 + 0.5, zc + Math.sin(b) * ST_R], 0.04, STEEL, 0.5)
  }
}

export function fondationAvicenne(out: MeshBuilder, fit: Fit): void {
  const g = fit.grade ?? 0
  // the forecourt and the lobby, glazed and set back under the lower block
  block(out, X0 - 3, X1 + 3, Z0 - 3, Z1 + 3, g, g + 0.15, PAVE, concrete)
  block(out, X0 + LOBBY_SET, X1 - LOBBY_SET, Z0 + LOBBY_SET, Z1 - LOBBY_SET, g, g + LOBBY, GLASS, glass)
  block(out, X0 + LOBBY_SET - 0.2, X1 - LOBBY_SET + 0.2, Z0 + LOBBY_SET - 0.2, Z1 - LOBBY_SET + 0.2, g + LOBBY, g + LOBBY + 0.4, DARK, metal)
  // the core: a dark shaft through the open storeys
  const cx = (X0 + X1) / 2
  block(out, cx - 3, cx + 3, Z0 + 3, Z1 - 3, g, g + TOP - 0.2, DARK, concrete)
  glassBlock(out, g + LOW0, g + LOW1)
  glassBlock(out, g + UP0, g + UP1)
  // hangers from the transfer and top beams down the faces
  for (const x of PORTAL_X) {
    portal(out, x, g)
    for (const z of [Z0 - 0.3, Z1 + 0.3]) {
      block(out, x - 0.2, x + 0.2, z - 0.2, z + 0.2, g + LOW0 - 0.5, g + LOW1 + 0.5, STEEL, metal)
      block(out, x - 0.2, x + 0.2, z - 0.2, z + 0.2, g + UP0 - 0.5, g + TOP - BEAM_D, STEEL, metal)
    }
  }
  for (const [x, side] of STAIRS) spiral(out, x, side, g)

  // the low pavilion and its link
  const [lx0, lx1, lz0, lz1] = LINK
  block(out, lx0, lx1, lz0, lz1, g, g + 4, GLASS, glass)
  block(out, lx0 - 0.3, lx1 + 0.3, lz0, lz1 + 0.3, g + 4, g + 4.5, DARK, metal)
  const pav = new MeshBuilder(), h = PAV_HALF
  block(pav, -h, h, -h, h, g, g + PAV_H, GLASS, glass)
  block(pav, -h - 0.4, h + 0.4, -h - 0.4, h + 0.4, g + PAV_H, g + PAV_H + 0.6, DARK, metal)
  for (let t = -h + 2; t < h - 1; t += 2.2) for (const f of ['-z', '+z', '-x', '+x'] as const) {
    const plane = f === '-z' || f === '-x' ? -h : h
    rectOn(pav, f, plane, t - 0.1, t + 0.1, g, g + PAV_H, STEEL, 0.06)
  }
  placed(out, pav, (PAV_TURN * Math.PI) / 180, PAV_C[0], PAV_C[1])
}
