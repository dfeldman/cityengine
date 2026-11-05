/**
 * MAISON D'ACCUEIL ÉPHREM (hôtellerie of the Sacré-Cœur basilica, rue du Cardinal-Dubois side, Montmartre, 18e; OSM
 * way/67699838). A neo-Romanesque pilgrims' house built in the basilica's own pale limestone: tall steep slate roofs
 * (ridge 25 m by IGN LiDAR MNS), four storeys of round-headed windows in rows with a heavy cornice, gabled ends — the
 * north block's gable carries a big arched triple window — and small stone dormers. Plan: a main block, a north block
 * and a long east wing running north. Photos: docs/landmarks/refs/maison-ephrem/; notes MODEL-MAISON-EPHREM.md.
 * Drawn in east/north/height metres (AXIS_DEG 0), registered onto the footprint by museums/enframe.ts.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex, shade } from '../../kit.ts'
import { registerRing, tools, type P2 } from '../museums/enframe.ts'
import type { Rgb } from '../../../models.ts'
import { churchKit } from './common.ts'

// ── tunables (metres, east/north frame) ────────────────────────────────────────────────────────────────────────
const AXIS_DEG = 0
/** blocks: [u0, u1, v0, v1, eaves, ridge] — ridge runs along v (north-south) at the block's mid-u */
const M = { u0: -9, u1: 9.5, v0: -13, v1: 16.5, eave: 15, ridge: 24 }
const NB = { u0: -9.5, u1: 3.5, v0: 16.5, v1: 25, eave: 15.5, ridge: 25 }
const E1 = { u0: 9.5, u1: 26.8, v0: 0.6, v1: 17, eave: 14, ridge: 21.5 }
const E2 = { u0: 14.4, u1: 26.8, v0: 17, v1: 45, eave: 13, ridge: 19 }
/** window rows: [sill height, window height] */
const LEVELS: [number, number][] = [[1.3, 2.4], [4.9, 2.6], [8.5, 2.6], [12.1, 2.2]]
const WIN_W = 1.3, WIN_STEP = 2.6
const DORMER_STEP = 5.2, DORMER_W = 1.7, DORMER_D = 1.7, DORMER_H = 2.0
const CORNICE_H = 0.8, STRING_Y = 4.2
const STONE = '#d9d0b9', TRIM = '#c8bc9f', ROOF = '#4b525e', GLASS = '#3d4d63', DARK = '#26262b'

export const RING: P2[] = [[-11.1, 10.1], [-11.1, 11.0], [-8.9, 11.2], [-9.7, 24.5], [3.0, 25.1], [3.7, 16.1], [8.0, 16.4], [16.4, 17.4], [14.4, 43.3], [26.7, 50.1], [27.3, 41.0], [23.8, 40.8], [26.6, 2.0], [9.5, 0.6], [10.2, -10.1], [10.2, -11.9], [9.6, -11.5], [2.4, -12.6], [-3.9, -13.0], [-6.9, -13.1], [-7.5, -12.2], [-7.5, -11.3], [-7.8, -7.8], [-7.7, -4.1], [-8.1, 0.3], [-8.4, 4.6], [-8.5, 5.8], [-10.7, 5.7]]

type Block = { u0: number; u1: number; v0: number; v1: number; eave: number; ridge: number }

export function maisonEphrem(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(RING, fit), T = tools(out, F)
  const stone: Rgb = hex(STONE), trim: Rgb = hex(TRIM), roofC: Rgb = hex(ROOF), glass: Rgb = hex(GLASS), dark: Rgb = hex(DARK)
  const { solid, decal, round, cornice, ridge, gable } = churchKit({ axisDeg: AXIS_DEG, T, roofC, stone, trim, discN: 14, corniceH: CORNICE_H, corniceOut: 0.35 })

  /** a row of round-headed windows on a wall: anchor (u, v), outward normal, offsets ts along it, floors that fit under `eave` */
  const windows = (u: number, v: number, nu: number, nv: number, ts: number[], eave: number, w = WIN_W): void => {
    for (const t of ts) for (const [y0, h] of LEVELS) {
      if (y0 + h > eave - 0.9) continue
      decal(u, v, nu, nv, 0.04, round(t, y0 - 0.15, w + 0.5, h + 0.35), trim)
      decal(u, v, nu, nv, 0.09, round(t, y0, w, h), glass)
      decal(u, v, nu, nv, 0.13, [[t - 0.04, y0], [t + 0.04, y0], [t + 0.04, y0 + h - w / 2], [t - 0.04, y0 + h - w / 2]], trim)
    }
  }
  const span = (half: number, step = WIN_STEP): number[] => { const n = Math.floor(half / step), a: number[] = []; for (let i = -n; i <= n; i++) a.push(i * step); return a }
  /** one gabled-roof block with cornice and string course; ridge along v */
  const block = (b: Block): { c: number; half: number } => {
    const c = (b.u0 + b.u1) / 2, half = (b.u1 - b.u0) / 2
    solid(b.u0, b.u1, b.v0, b.v1, 0, b.eave, stone, null, 3)
    cornice(b.u0, b.u1, b.v0, b.v1, b.eave, CORNICE_H, 0.35)
    solid(b.u0 - 0.1, b.u1 + 0.1, b.v0 - 0.1, b.v1 + 0.1, STRING_Y - 0.15, STRING_Y + 0.15, trim, trim, 0)
    ridge('v', b.v0, b.v1, c, half, b.eave, b.ridge, 0.35)
    return { c, half }
  }
  /** small stone dormers on both slopes of a block */
  const dormers = (b: Block, c: number, half: number, v0: number, v1: number): void => {
    const slope = (b.ridge - b.eave) / half, d = half * 0.45
    for (let v = v0; v <= v1; v += DORMER_STEP) for (const s of [-1, 1]) {
      const dFront = d + DORMER_D, base = b.eave + (b.ridge - b.eave) * (1 - dFront / half) - 0.2
      const top = base + slope * DORMER_D * 2 + DORMER_H
      const uF = c + s * dFront, uB = c + s * (d - DORMER_D)
      solid(Math.min(uF, uB), Math.max(uF, uB), v - DORMER_W / 2, v + DORMER_W / 2, base, top, stone, null, 1)
      // tiny cross-gable: ridge along u, rising a little above the box
      ridge('u', Math.min(uF, uB), Math.max(uF, uB), v, DORMER_W / 2, top, top + 1.1, 0.12)
      gable('v', uF + s * 0.01, v, DORMER_W / 2, top, top + 1.1, s as 1 | -1, stone)
      decal(uF, v, s, 0, 0.05, round(0, top - DORMER_H + 0.35, 0.9, DORMER_H - 0.4), glass)
    }
  }

  const m = block(M), nb = block(NB), e1 = block(E1), e2 = block(E2)

  // gable ends (ridge along v → the gable plane is at a fixed v)
  gable('u', M.v0, m.c, m.half, M.eave, M.ridge, -1, stone)
  gable('u', M.v1, m.c, m.half, M.eave, M.ridge, 1, stone)
  gable('u', NB.v1, nb.c, nb.half, NB.eave, NB.ridge, 1, stone)
  gable('u', E1.v0, e1.c, e1.half, E1.eave, E1.ridge, -1, stone)
  gable('u', E2.v1, e2.c, e2.half, E2.eave, E2.ridge, 1, stone)

  // facades
  windows(m.c, M.v0, 0, -1, span(m.half - 1.5), M.eave)
  windows(M.u0, (M.v0 + M.v1) / 2, -1, 0, span(14), M.eave)
  windows(M.u1, (M.v0 + E1.v0) / 2, 1, 0, span(5.5), M.eave)
  windows(NB.u0, (NB.v0 + NB.v1) / 2, -1, 0, span(3.5), NB.eave)
  windows(NB.u1, (NB.v0 + NB.v1) / 2, 1, 0, span(3.5), NB.eave)
  windows(e1.c, E1.v0, 0, -1, span(e1.half - 1.5), E1.eave)
  windows(E1.u1, (E1.v0 + E1.v1) / 2, 1, 0, span(6), E1.eave)
  windows(E2.u1, (E2.v0 + E2.v1) / 2, 1, 0, span(12.5), E2.eave)
  windows(E2.u0, (E2.v0 + E2.v1) / 2, -1, 0, span(12.5), E2.eave)
  windows(e2.c, E2.v1, 0, 1, span(e2.half - 1.5), E2.eave)

  // the north block's gable: a big round arch over three lancets, a roundel above
  const tripleArch = (c: number, v: number, nv: 1 | -1, y0: number, w: number, h: number): void => {
    decal(c, v + nv * 0.02, 0, nv, 0.05, round(0, y0, w, h), trim)
    decal(c, v + nv * 0.02, 0, nv, 0.09, round(0, y0 + 0.3, w - 0.6, h - 0.6), stone)
    for (const t of [-w * 0.29, 0, w * 0.29]) decal(c, v + nv * 0.02, 0, nv, 0.13, round(t, y0 + 0.7, w * 0.21, h * 0.62), glass)
  }
  tripleArch(nb.c, NB.v1, 1, 6.2, 5.2, 8.2)
  decal(nb.c, NB.v1 + 0.02, 0, 1, 0.07, round(0, 17.2, 1.3, 2.2), glass)
  tripleArch(m.c, M.v0, -1, 15.5, 4.2, 6.2)   // the main block's south gable, as in the photograph
  tripleArch(e1.c, E1.v0, -1, 14.6, 3.6, 5.2)
  // entrance arch on the south face of the main block
  decal(m.c, M.v0 - 0.02, 0, -1, 0.1, round(0, 0, 2.4, 3.3), dark)
  decal(m.c, M.v0 - 0.02, 0, -1, 0.06, round(0, 0, 3.0, 3.7), trim)

  dormers(M, m.c, m.half, M.v0 + 3, M.v1 - 3)
  dormers(E1, e1.c, e1.half, E1.v0 + 3, E1.v1 - 2)
  dormers(E2, e2.c, e2.half, E2.v0 + 4, E2.v1 - 4)
  // chimney stacks on the ridges
  for (const [u, v, y] of [[m.c, -6, M.ridge], [m.c, 8, M.ridge], [e1.c, 8, E1.ridge], [e2.c, 30, E2.ridge]] as [number, number, number][]) solid(u - 0.5, u + 0.5, v - 0.5, v + 0.5, y - 0.5, y + 2.2, shade(stone, 0.9), trim, 1)
}
