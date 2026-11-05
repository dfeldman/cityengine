/**
 * ÉGLISE NOTRE-DAME DE L'ARCHE D'ALLIANCE (rue d'Alleray, 15e; OSM way/24303512). A 1998 church: a copper-brown cube
 * pierced by small square windows, wrapped in a free-standing steel lattice frame that rises above its roof, with a
 * grey stair/bell block at one corner carrying a circular lattice bell tower (five bell rings, a cross) and a curved
 * lattice fin. Footprint is an 18.5 m square (OSM); heights read from the IGN LiDAR MNS (frame ~24 m, tower tip ~35 m)
 * with trees confusing the rest. Photos: docs/landmarks/refs/notre-dame-arche-alliance/. Drawn in the cube's (u, v)
 * frame (u toward the tower side), registered onto the square by museums/enframe.ts.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { registerRing, tools, hash, type P2, type V3 } from '../museums/enframe.ts'
import { churchKit } from './common.ts'

// ── tunables (metres, church frame) ────────────────────────────────────────────────────────────────────────────
const AXIS_DEG = -31.6                 // u direction, degrees anticlockwise from east
const FRAME_HALF = 9.25                // the lattice frame's half-width = the OSM square
const CUBE_HALF = 8.1, CUBE_H = 19.5   // the copper cube inside it
const FRAME_H = 24, POST_N = 4         // frame height; bays per side
const BEAM_R = 0.13, RING_Y = [6.2, 12.4, 18.6]   // post/beam half-section; levels of the horizontal ring beams
const WIN = 0.85, WIN_COLS = 5, WIN_PITCH = 3.1, WIN_ROW0 = 3.3, WIN_ROWS = 6, WIN_PITCH_Y = 2.9, WIN_SKIP = 0.1
const BLOCK_U0 = 9.9, BLOCK_U1 = 13.6, BLOCK_V0 = -4.6, BLOCK_V1 = 4.6, BLOCK_H = 15   // the grey stair block
const FIN_H = 27, FIN_BULGE = 3.4      // curved lattice fin above the block
const TOWER_U = 11.8, TOWER_V = -2.2, TOWER_R = 1.5, TOWER_H = 31, TOWER_RINGS = [17.4, 20.4, 23.4, 26.4, 29.4], CROSS_H = 4
const COPPER = '#a06a48', STEEL = '#b4b8bd', GREY = '#767a80', DARK = '#26262b', GLASS = '#3a4a5e', BELL = '#3b3b40'

const A = (AXIS_DEG * Math.PI) / 180, CA = Math.cos(A), SA = Math.sin(A)
const enU = (u: number, v: number): P2 => [u * CA - v * SA, u * SA + v * CA]
export const RING: P2[] = ([[-1, -1], [1, -1], [1, 1], [-1, 1]] as P2[]).map(([a, b]) => enU(a * FRAME_HALF, b * FRAME_HALF))

export function notreDameArcheAlliance(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(RING, fit), T = tools(out, F)
  const copper = hex(COPPER), steel = hex(STEEL), grey = hex(GREY), dark = hex(DARK), glass = hex(GLASS), bell = hex(BELL)
  const { en, P, solid, decal } = churchKit({ axisDeg: AXIS_DEG, T, roofC: copper, stone: copper, trim: steel })
  const bm = (a: V3, b: V3, r = BEAM_R): void => T.beam(a, b, r, steel)

  // ── the copper cube, small square windows, a glazed 2x2 on the street (south-west, v-) face ──
  solid(-CUBE_HALF, CUBE_HALF, -CUBE_HALF, CUBE_HALF, 0, CUBE_H, copper, hex('#6d4c3a'), 2.4)
  const faces: [number, number][] = [[0, -1], [1, 0], [0, 1], [-1, 0]]
  for (const [nu, nv] of faces) {
    const cu = nu * CUBE_HALF, cv = nv * CUBE_HALF
    for (let c = 0; c < WIN_COLS; c++) for (let r = 0; r < WIN_ROWS; r++) {
      const t = (c - (WIN_COLS - 1) / 2) * WIN_PITCH, y = WIN_ROW0 + r * WIN_PITCH_Y
      if (nv === -1 && Math.abs(t + 3.1) < 2.4 && y > 3 && y < 12) continue       // under the big glazing
      if (hash(c * 7.1 + nu * 3 + nv * 5, r * 3.3 + nu - nv) < WIN_SKIP) continue
      decal(cu, cv, nu, nv, 0.05, [[t - WIN / 2, y], [t + WIN / 2, y], [t + WIN / 2, y + WIN], [t - WIN / 2, y + WIN]], dark)
    }
  }
  for (const dx of [-1.15, 1.15]) for (const dy of [0, 2.3])
    decal(0, -CUBE_HALF, 0, -1, 0.06, [[-3.1 + dx - 1.0, 6 + dy], [-3.1 + dx + 1.0, 6 + dy], [-3.1 + dx + 1.0, 8.1 + dy], [-3.1 + dx - 1.0, 8.1 + dy]], glass)

  // ── the lattice frame: perimeter posts, three ring beams and a roof grid ──
  const pitch = (2 * FRAME_HALF) / POST_N
  const perim: [number, number][] = []
  for (let i = 0; i < POST_N; i++) {
    const k = -FRAME_HALF + i * pitch
    perim.push([k, -FRAME_HALF], [FRAME_HALF, k], [-k, FRAME_HALF], [-FRAME_HALF, -k])
  }
  const pt = (u: number, v: number, h: number): V3 => P(u, v, h)
  for (const [u, v] of perim) bm(pt(u, v, 0), pt(u, v, FRAME_H), BEAM_R * 1.2)
  const ringAt = (y: number): void => {
    const c: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => [a * FRAME_HALF, b * FRAME_HALF])
    for (let i = 0; i < 4; i++) bm(pt(...c[i], y), pt(...c[(i + 1) % 4], y))
  }
  for (const y of [...RING_Y, FRAME_H]) ringAt(y)
  for (let i = 1; i < POST_N; i++) {
    const k = -FRAME_HALF + i * pitch
    bm(pt(k, -FRAME_HALF, FRAME_H), pt(k, FRAME_HALF, FRAME_H), BEAM_R * 0.9)
    bm(pt(-FRAME_HALF, k, FRAME_H), pt(FRAME_HALF, k, FRAME_H), BEAM_R * 0.9)
  }
  // short cantilevered stubs on the faces, where the frame meets the cube
  for (const [u, v] of perim) for (const y of RING_Y) bm(pt(u, v, y), pt(u * (CUBE_HALF / FRAME_HALF), v * (CUBE_HALF / FRAME_HALF), y), BEAM_R * 0.6)
  // the frame's plain base plinth under the street face (gate-side wall of the parvis)
  solid(-FRAME_HALF, FRAME_HALF, -FRAME_HALF - 0.1, -FRAME_HALF, 0, 0.9, grey, null, 0)

  // ── the grey stair block at the tower corner, its curved lattice fin ──
  solid(BLOCK_U0, BLOCK_U1, BLOCK_V0, BLOCK_V1, 0, BLOCK_H, grey, grey, 2.6)
  for (const vv of [BLOCK_V0 - 0.05, BLOCK_V1 + 0.05]) {
    const ribs = 5
    for (let r = 0; r < ribs; r++) {
      const t0 = r / ribs, pts: V3[] = []
      for (let s = 0; s <= 8; s++) {
        const q = s / 8, y = BLOCK_H + (FIN_H - BLOCK_H) * q
        pts.push(pt(BLOCK_U0 + (BLOCK_U1 - BLOCK_U0) * (t0 * (1 - 0.55 * q)) + FIN_BULGE * Math.sin(q * Math.PI * 0.5) * t0 * 0.9, vv, y))
      }
      for (let s = 0; s < 8; s++) bm(pts[s], pts[s + 1], BEAM_R * 0.9)
    }
    for (let s = 1; s <= 4; s++) {
      const y = BLOCK_H + ((FIN_H - BLOCK_H) * s) / 5, q = s / 5
      bm(pt(BLOCK_U0, vv, y), pt(BLOCK_U0 + (BLOCK_U1 - BLOCK_U0) * (1 - 0.55 * q) + FIN_BULGE * Math.sin(q * Math.PI * 0.5) * 0.9, vv, y), BEAM_R * 0.7)
    }
  }
  bm(pt(BLOCK_U0, BLOCK_V0 - 0.05, BLOCK_H), pt(BLOCK_U0, BLOCK_V1 + 0.05, BLOCK_H), BEAM_R)

  // ── the bell tower: a round lattice of posts and five rings, each holding a bell disc, topped by a cross ──
  const NP = 8
  const tp = (k: number, y: number, r = TOWER_R): V3 => { const a = (k / NP) * Math.PI * 2; return pt(TOWER_U + r * Math.cos(a), TOWER_V + r * Math.sin(a), y) }
  for (let k = 0; k < NP; k++) bm(tp(k, BLOCK_H), tp(k, TOWER_H), BEAM_R * 0.9)
  for (const y of [BLOCK_H + 0.4, ...TOWER_RINGS, TOWER_H]) for (let k = 0; k < NP; k++) bm(tp(k, y), tp(k + 1, y), BEAM_R * 0.8)
  for (const y of TOWER_RINGS) {
    const ring: P2[] = Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2; return enU(TOWER_U + (TOWER_R - 0.3) * Math.cos(a), TOWER_V + (TOWER_R - 0.3) * Math.sin(a)) })
    T.cap(ring, y - 0.5, bell)
  }
  bm(pt(TOWER_U, TOWER_V, TOWER_H), pt(TOWER_U, TOWER_V, TOWER_H + CROSS_H), BEAM_R * 1.1)
  bm(pt(TOWER_U - 0.9, TOWER_V, TOWER_H + CROSS_H * 0.68), pt(TOWER_U + 0.9, TOWER_V, TOWER_H + CROSS_H * 0.68), BEAM_R * 1.1)
  void en
}
