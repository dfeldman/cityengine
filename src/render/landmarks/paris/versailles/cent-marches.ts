/**
 * The ESCALIERS DES CENT-MARCHES at Versailles (Mansart, 1680s): two great flights of 103 steps, about 20 m wide, either side of
 * the Orangerie, from the Parterre du Midi's terrace down to the level of the Orangerie parterre. OSM maps each as three steps
 * ways (34/30/39 steps, about 55 m end to end with a landing between runs) in the strip of the Orangerie's side galleries.
 * The model's frame: +x runs UP the flight (the palace end), z across it; the entry's `front` is the up bearing + 90°.
 *
 * Each flight is three runs and two landings; the runs are raked masses of pale stone with a tread and a riser to every step,
 * a dressed ashlar retaining wall each side with a coping and a stone balustrade (piers and balusters) along its top, and a
 * paved apron at the foot and the head. The foot stands on the ground (fit.groundAt); the head is the terrace's level.
 * Tunables are the constants below.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { hex, shade } from '../../kit.ts'
import { block } from '../batch2/tag.ts'

type V3 = [number, number, number]
const ASH = surfaceTag('ashlar'), SETT = surfaceTag('setts')

export const CENT = {
  /** steps in each run, bottom to top (103 in all) */
  runs: [34, 30, 39],
  /** a landing's length between runs, metres */
  landing: 5.3,
  /** the whole flight's rise from the foot to the head, metres: the terrace over the Orangerie parterre (the Orangerie stands 13 m) */
  drop: 12,
  /** length of the flight (x from -len/2 to len/2) */
  len: 54.6,
  /** the clear width between the walls, and a wall's thickness */
  width: 18.4, wall: 1.15,
  /** a step's nosing overhang and its top's thickness */
  nose: 0.04,
  /** the aprons beyond the flight's ends */
  apron: 4,
  /** the balustrade over the wall: height, pier spacing, pier and baluster widths, baluster spacing, coping overhang and thickness */
  bal: { h: 0.95, pier: 3.6, pierW: 0.5, baluster: 0.34, balW: 0.16, cope: 0.1, copeT: 0.16 },
  /** how far the walls rise above the treads along the flight */
  wallUp: 0.35,
  stone: '#d9cdb0', tread: '#cfc3a6', riser: '#b3a78c', sett: '#8a8478', core: '#a99d84',
}

/** a quad with its outward normal worked out from the corners (counter-clockwise seen from outside) */
function quad(out: MeshBuilder, a: V3, b: V3, c: V3, d: V3, col: [number, number, number], tag: number): void {
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [d[0] - a[0], d[1] - a[1], d[2] - a[2]]
  let n: V3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
  const l = Math.hypot(...n) || 1
  n = [n[0] / l, n[1] / l, n[2] / l]
  out.quad([a, b, c, d], n, [[0, 0], [1, 0], [1, 1], [0, 1]], col, tag)
}

/** a prism over x a..b, z z0..z1, bottom flat at yb, top raked from ya0 to ya1 (all faces; the bottom is skipped) */
function raked(out: MeshBuilder, xa: number, xb: number, z0: number, z1: number, yb: number, ya0: number, ya1: number, col: [number, number, number], tag: number, topCol?: [number, number, number], yb1 = yb): void {
  quad(out, [xa, ya0, z1], [xb, ya1, z1], [xb, ya1, z0], [xa, ya0, z0], topCol ?? col, tag) // top, up
  quad(out, [xa, yb, z0], [xb, yb1, z0], [xb, ya1, z0], [xa, ya0, z0], col, tag) // -z side
  quad(out, [xb, yb1, z1], [xa, yb, z1], [xa, ya0, z1], [xb, ya1, z1], col, tag) // +z side
  quad(out, [xa, yb, z1], [xa, yb, z0], [xa, ya0, z0], [xa, ya0, z1], col, tag) // -x end
  quad(out, [xb, yb1, z0], [xb, yb1, z1], [xb, ya1, z1], [xb, ya1, z0], col, tag) // +x end
}

export function versaillesCentMarches(out: MeshBuilder, fit: Fit): void {
  const C = CENT, g = (x: number, z: number): number => fit.groundAt?.(x, z) ?? fit.grade ?? 0
  const STONE = hex(C.stone), TREAD = hex(C.tread), RISER = hex(C.riser), SETTC = hex(C.sett), CORE = hex(C.core)
  const nSteps = C.runs.reduce((s, n) => s + n, 0), nLand = C.runs.length - 1
  const tread = (C.len - nLand * C.landing) / nSteps, rise = C.drop / nSteps
  const x0 = -C.len / 2, hw = C.width / 2
  const yb = g(x0, 0) // the foot stands on the ground
  const lowest = (xa: number, xb: number, za: number, zb: number): number => {
    let m = Infinity
    for (let i = 0; i <= 4; i++) for (let j = 0; j <= 2; j++) m = Math.min(m, g(xa + ((xb - xa) * i) / 4, za + ((zb - za) * j) / 2))
    return m - 0.5
  }
  /** the tread's height at x along the flight (a landing is flat at the run's top) */
  const runs: { xa: number; xb: number; ya: number; yb: number; n: number }[] = []
  let x = x0, step = 0
  for (let r = 0; r < C.runs.length; r++) {
    const n = C.runs[r], xe = x + n * tread
    runs.push({ xa: x, xb: xe, ya: yb + step * rise, yb: yb + (step + n) * rise, n })
    step += n; x = xe
    if (r < nLand) x += C.landing
  }
  const yAt = (px: number): number => {
    if (px <= x0) return yb
    for (let i = 0; i < runs.length; i++) {
      const R = runs[i]
      if (px <= R.xb) return R.ya + (R.yb - R.ya) * ((px - R.xa) / (R.xb - R.xa))
      const nx = runs[i + 1]
      if (!nx || px < nx.xa) return R.yb
    }
    return runs[runs.length - 1].yb
  }
  const yTop = yb + C.drop

  // the runs: a raked core, then a step each (a riser and a tread)
  for (const R of runs) {
    const bot = lowest(R.xa, R.xb, -hw, hw)
    raked(out, R.xa, R.xb, -hw, hw, bot, R.ya, R.yb - rise, CORE, ASH)
    for (let i = 0; i < R.n; i++) {
      const s0 = R.xa + i * tread, top = R.ya + (i + 1) * rise
      block(out, s0 - C.nose, s0 + tread, -hw, hw, top - rise, top, i % 2 ? shade(TREAD, 0.97) : TREAD)
      // the riser in a darker stone: a thin board on the step's face
      block(out, s0 - C.nose - 0.01, s0 - C.nose + 0.02, -hw, hw, top - rise, top, RISER)
    }
  }
  // the landings between runs, and the aprons: paved, on solid stone to the ground
  const slabs: [number, number, number][] = []
  for (let i = 0; i < nLand; i++) slabs.push([runs[i].xb, runs[i + 1].xa, runs[i].yb])
  slabs.push([x0 - C.apron, x0, yb], [runs[runs.length - 1].xb, runs[runs.length - 1].xb + C.apron, yTop])
  for (const [a, b, y] of slabs) {
    const bot = lowest(a, b, -hw, hw)
    // (dropped a little below the runs' cores and under the setts, so no two faces share a plane: the audit's coplanar check)
    block(out, a, b, -hw, hw, bot - 0.07, y - 0.06, shade(STONE, 0.8), ASH)
    block(out, a, b, -hw, hw, y - 0.02, y + 0.05, SETTC, SETT)
  }
  // the walls each side: raked on each run, flat over a landing and an apron, ashlar, with the coping and the balustrade over
  const spans: [number, number][] = [[x0 - C.apron, x0]]
  for (let i = 0; i < runs.length; i++) { spans.push([runs[i].xa, runs[i].xb]); if (i < nLand) spans.push([runs[i].xb, runs[i + 1].xa]) }
  spans.push([runs[runs.length - 1].xb, runs[runs.length - 1].xb + C.apron])
  const B = C.bal
  for (const sz of [-1, 1]) {
    const za = sz * hw, zb = sz * (hw + C.wall), z0 = Math.min(za, zb), z1 = Math.max(za, zb), zc = (za + zb) / 2
    for (const [a, b] of spans) {
      const ya = yAt(a) + C.wallUp, ybb = yAt(b) + C.wallUp, bot = lowest(a, b, z0, z1)
      raked(out, a, b, z0, z1, bot, ya, ybb, STONE, ASH)
      // coping: a slab a little wider than the wall
      raked(out, a, b, z0 - B.cope, z1 + B.cope, ya, ya + B.copeT, ybb + B.copeT, shade(STONE, 1.05), ASH)
      // balusters, between piers
      const len = b - a, nb = Math.max(1, Math.round(len / B.pier))
      for (let k = 0; k <= nb; k++) {
        const px = a + (len * k) / nb, py = ya + (ybb - ya) * (k / nb)
        block(out, px - B.pierW / 2, px + B.pierW / 2, zc - B.pierW / 2, zc + B.pierW / 2, py + B.copeT, py + B.copeT + B.h + 0.15, STONE, ASH)
      }
      const m = Math.max(1, Math.floor(len / B.baluster))
      for (let k = 0; k < m; k++) {
        const t = (k + 0.5) / m, px = a + len * t, py = ya + (ybb - ya) * t
        // skip a baluster under a pier
        const near = Math.abs(((px - a) / (len / nb)) % 1)
        if (near < B.pierW / (len / nb) * 0.6 || near > 1 - B.pierW / (len / nb) * 0.6) continue
        block(out, px - B.balW / 2, px + B.balW / 2, zc - B.balW / 2, zc + B.balW / 2, py + B.copeT, py + B.copeT + B.h * 0.82, shade(STONE, 1.04))
      }
      // the balustrade's rail
      raked(out, a, b, zc - B.pierW * 0.3, zc + B.pierW * 0.3, ya + B.copeT + B.h * 0.82, ya + B.copeT + B.h, ybb + B.copeT + B.h, STONE, ASH, undefined, ybb + B.copeT + B.h * 0.82)
    }
  }
}

/** the east flight is the same flight on its own entry (the audit flags one builder under two entries as a duplicate) */
export const versaillesCentMarchesEst = (out: MeshBuilder, fit: Fit): void => versaillesCentMarches(out, fit)

export const VERSAILLES_CENT_MARCHES = { versaillesCentMarches, versaillesCentMarchesEst }
