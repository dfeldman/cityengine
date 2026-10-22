/**
 * 1390 Mission Street, the apartment block on the corner of Mission and 10th (way/243571728), from the owner's Street View
 * frame (2026-10-21, from the 10th Street corner looking up Mission: door 1398, the "1400 MISSION" block sign) and
 * Mapillary docs/shots/refs/1390-mission (09, from across Mission).
 *
 * What the photographs show: a cream-rendered block of eleven storeys whose Mission front BOWS out — the curve is a
 * curtain wall of green-grey glass on a fine mullion grid from the third floor to the roof, framed in cream, under a
 * cream parapet that follows it. Where the bow meets the rest of the Mission front a tall RED blade stands out of the
 * wall from the pavement to above the roof, with a narrow glazed slot beside it running the full height; past it the
 * wing is plain cream with punched windows and a stack of glazing up its middle, stepping down a few storeys at the
 * front. At the bottom, a two-storey podium of grey-green concrete with incised reveals wraps the corner over a glass
 * café front (Cumaica), on a dark grey tile base.
 *
 * The frame: the real outline, an L along 10th Street. The bow is FOUND as the run of short edges in the ring; the
 * red blade stands at the end of it, the 10th Street front is the long edge at its other end, and every other edge is
 * the wing and the back of the lot.
 */
import type { MeshBuilder } from '../../buildings.ts'
import { capPolygon } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { boxAlong, edgeAt } from '../parts.ts'
import { at, pane, slab, type Edge } from './margot.ts'

type P2 = { x: number; z: number }
const FIXED = 0
const STUCCO = surfaceTag('stucco')
const CONCRETE = surfaceTag('concrete')
const GRANITE = surfaceTag('granite')
const GLASS_T = surfaceTag('glass')
const PANEL = surfaceTag('panel')

const CREAM: Rgb = [0.93, 0.9, 0.82]
const TRIM: Rgb = [0.97, 0.96, 0.92]
const PODIUM: Rgb = [0.72, 0.74, 0.68]
const BASE: Rgb = [0.3, 0.31, 0.32]
const CURTAIN: Rgb = [0.38, 0.52, 0.52]
const GLASS: Rgb = [0.2, 0.29, 0.36]
const SHOP: Rgb = [0.16, 0.19, 0.2]
const MULLION: Rgb = [0.75, 0.77, 0.77]
const RED: Rgb = [0.8, 0.27, 0.2]
const ROOF: Rgb = [0.52, 0.52, 0.5]

/** The heights: the café storey, the podium's top, a storey, and the wing's lower front. */
const SHOPH = 5
const POD = 9.2
const FH = 2.85

/** A flat rectangle on a wall, `o` out from it: one quad. */
function flat(out: MeshBuilder, e: Edge, u: number, y0: number, w: number, h: number, o: number, c: Rgb): void {
  const a = at(e, u - w / 2, o), b = at(e, u + w / 2, o)
  out.quad([[a.x, y0, a.z], [b.x, y0, b.z], [b.x, y0 + h, b.z], [a.x, y0 + h, a.z]], [e.nx, 0, e.nz], [[0, 0], [1, 0], [1, 1], [0, 1]], c, FIXED)
}

/** Punched windows on a stretch of wall, `n` to a storey from y0 to y1, regular (this building does not stagger). */
function punched(out: MeshBuilder, e: Edge, u0: number, u1: number, y0: number, y1: number, n: number, w: number, col0: number): void {
  const step = (u1 - u0) / n
  for (let y = y0, f = 0; y + FH <= y1 + 0.01; y += FH, f++) {
    for (let k = 0; k < n; k++) {
      const u = u0 + step * (k + 0.5)
      // the frame a flat quad behind the glass (a box per window was most of the building's triangles), the glass well
      // clear of it: a centimetre apart they fought, and the frame won from across the street
      flat(out, e, u, y + 0.76, w + 0.16, 1.74, 0.03, MULLION)
      pane(out, e, u, y + 0.84, w, 1.58, 0.1, col0 + k, f, GLASS)
    }
  }
}

/** A curtain wall on a stretch of wall: glass with a mullion every 1.5 m and a transom at every floor. */
function curtain(out: MeshBuilder, e: Edge, u0: number, u1: number, y0: number, y1: number, o: number, col0: number): void {
  const n = Math.max(1, Math.round((u1 - u0) / 1.5))
  const w = (u1 - u0) / n
  for (let y = y0, f = 0; y < y1 - 0.5; y += FH, f++) {
    const h = Math.min(FH, y1 - y)
    for (let k = 0; k < n; k++) pane(out, e, u0 + w * (k + 0.5), y, w, h, o, col0 + k, f, CURTAIN)
    slab(out, e, u0, u1, y - 0.05, y + 0.05, o, o + 0.08, MULLION, FIXED)
  }
  for (let k = 0; k <= n; k++) slab(out, e, u0 + w * k - 0.04, u0 + w * k + 0.04, y0, y1, o, o + 0.07, MULLION, FIXED)
}

export function mission1390(out: MeshBuilder, fit: Fit): void {
  let R: P2[] = fit.ring && fit.ring.length >= 4 ? fit.ring.slice() : [
    { x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz },
  ]
  if (Math.hypot(R[0].x - R[R.length - 1].x, R[0].z - R[R.length - 1].z) < 0.3) R = R.slice(0, -1)
  let area = 0
  for (let i = 0; i < R.length; i++) { const a = R[i], b = R[(i + 1) % R.length]; area += a.x * b.z - b.x * a.z }
  if (area < 0) R.reverse()
  const n = R.length
  const E = R.map((_, i) => edgeAt(R, i))
  const H = fit.height
  const g = Math.max(0, Math.min(fit.grade ?? 0, 2))

  // ---- the bow: the longest run of short edges (the ring's curve); it is followed by the rest of the Mission front
  const short = (i: number): boolean => E[((i % n) + n) % n].L < 4.6
  let best = -1, bestLen = 0
  for (let i = 0; i < n; i++) {
    if (!short(i) || short(i - 1)) continue
    let j = i, len = 0
    while (short(j) && j - i < n) { len += E[j % n].L; j++ }
    if (len > bestLen) { bestLen = len; best = i }
  }
  const bow = new Set<number>()
  if (best >= 0) for (let j = best; short(j); j++) bow.add(j % n)
  const tenth = best >= 0 ? (best + n - 1) % n : 0           // the long edge before the bow: 10th Street
  const afterBow = best >= 0 ? (best + bow.size) % n : 1     // the wing's Mission front, past the red blade
  const ret = (afterBow + 1) % n                             // and the wall that turns back from its far end
  // the wing steps down at the front: past the blade and its glazed slot (STEP_U along), the first STEP metres back
  // are two storeys lower than the rest
  const STEP_U = 4.6, STEP = 7

  // ---- every wall: cream render from the ground, the café and the podium over it on the two street fronts
  for (let i = 0; i < n; i++) {
    const e = E[i]
    const street = bow.has(i) || i === tenth
    const top = i === afterBow || i === ret ? H - STEP : H
    if (i === afterBow) {
      slab(out, e, 0, STEP_U, 0, H, -0.3, 0, CREAM, STUCCO)
      slab(out, e, STEP_U, e.L, 0, top, -0.3, 0, CREAM, STUCCO)
    } else if (i === ret) {
      slab(out, e, 0, STEP, 0, top, -0.3, 0, CREAM, STUCCO)
      slab(out, e, STEP, e.L, 0, H, -0.3, 0, CREAM, STUCCO)
      punched(out, e, STEP + 0.4, e.L - 0.4, top + 0.4, H - 1.2, Math.max(1, Math.round((e.L - STEP) / 3.4)), 1.25, 450)
    } else slab(out, e, 0, e.L, street ? g + POD : 0, top, -0.3, 0, CREAM, STUCCO)
    if (street) {
      // the café: dark glass between piers, on a tile base, the concrete podium over it
      slab(out, e, 0, e.L, 0, g + SHOPH, -0.6, -0.5, SHOP, GLASS_T)
      slab(out, e, 0, e.L, 0, g + 0.6, -0.5, -0.35, BASE, GRANITE)
      slab(out, e, 0, e.L, g + SHOPH, g + POD, -0.3, 0.25, PODIUM, CONCRETE)
      // the podium's incised reveals
      for (const y of [g + 6.6, g + 8.0]) slab(out, e, 0, e.L, y, y + 0.06, 0.25, 0.27, BASE, FIXED)
      const piers = Math.max(1, Math.round(e.L / 4))
      for (let k = 0; k <= piers; k++) {
        const u = Math.min(e.L - 0.2, Math.max(0.2, (k * e.L) / piers))
        slab(out, e, u - 0.2, u + 0.2, 0, g + SHOPH, -0.5, 0, PODIUM, CONCRETE)
      }
      slab(out, e, 0, e.L, g + 3.6, g + 3.7, -0.5, -0.45, MULLION, FIXED)
    } else {
      slab(out, e, 0, e.L, 0, g + 0.8, -0.3, 0.05, BASE, GRANITE)
    }
    if (bow.has(i)) {
      // the bow's glass, floor after floor, under the cream parapet that follows the curve
      curtain(out, e, 0.05, e.L - 0.05, g + POD + 0.2, H - 2.4, 0.02, i * 4)
      slab(out, e, 0, e.L, H - 2.4, H + 0.3, -0.3, 0.25, TRIM, STUCCO)
      slab(out, e, 0, e.L, g + POD - 0.1, g + POD + 0.25, 0, 0.45, TRIM, STUCCO)
    } else if (i === tenth) {
      // 10th Street: punched windows in threes, with a glazed stack every third bay
      const bays = Math.max(1, Math.round(e.L / 5))
      const bw = e.L / bays
      for (let k = 0; k < bays; k++) {
        if (k % 3 === 1) curtain(out, e, k * bw + 0.8, (k + 1) * bw - 0.8, g + POD + 0.2, H - 1.2, 0.02, 100 + k * 4)
        else punched(out, e, k * bw, (k + 1) * bw, g + POD + 0.3, H - 1.2, 2, 1.3, 100 + k * 4)
      }
    } else {
      // the wing and the back: punched windows in pairs, a stack of glazing up the middle of a long wall
      const pairs = Math.max(1, Math.round(e.L / 3.2))
      // (past the red blade and its glazed slot, on the wing's Mission front)
      const u0 = i === afterBow ? STEP_U : 0.4
      const mid = e.L - u0 > 9 ? [(u0 + e.L) / 2 - 1.2, (u0 + e.L) / 2 + 1.2] : null
      if (mid) {
        curtain(out, e, mid[0], mid[1], g + 3.2, top - 1.2, 0.02, 300 + i * 10)
        punched(out, e, u0, mid[0] - 0.4, g + 3.2, top - 1.2, Math.max(1, Math.floor(pairs / 2) - 1), 1.25, 310 + i * 10)
        punched(out, e, mid[1] + 0.4, e.L - 0.4, g + 3.2, top - 1.2, Math.max(1, Math.floor(pairs / 2) - 1), 1.25, 330 + i * 10)
      } else punched(out, e, u0, e.L - 0.4, g + 3.2, top - 1.2, Math.max(1, pairs - 1), 1.25, 310 + i * 10)
    }
    // the parapet cap
    if (!bow.has(i)) slab(out, e, i === afterBow ? STEP_U : 0, e.L, top, top + 0.15, -0.35, 0.05, TRIM, FIXED)
  }
  // the roof, cut back over the step, and the step's own lower roof, its wall facing the street and its cheek
  {
    const e = E[afterBow]
    const cap = R.slice()
    cap.splice(ret, 1, at(e, STEP_U, 0), at(e, STEP_U, -STEP), at(e, e.L, -STEP))
    capPolygon(out, cap, H, ROOF, FIXED)
    const a = at(e, STEP_U, 0), b = at(e, e.L, 0), c = at(e, e.L, -STEP), d = at(e, STEP_U, -STEP)
    out.quad([[a.x, H - STEP, a.z], [b.x, H - STEP, b.z], [c.x, H - STEP, c.z], [d.x, H - STEP, d.z]], [0, 1, 0],
      [[0, 0], [1, 0], [1, 1], [0, 1]], ROOF, FIXED)
    slab(out, e, STEP_U, e.L, H - STEP, H, -STEP - 0.3, -STEP, CREAM, STUCCO)
    slab(out, e, STEP_U - 0.3, STEP_U, H - STEP, H, -STEP, 0, CREAM, STUCCO)
    punched(out, e, STEP_U + 0.6, e.L - 0.6, H - STEP + 0.4, H - 1.2, Math.max(1, Math.round((e.L - STEP_U) / 3.4)), 1.25, 400)
  }

  // ---- the red blade at the end of the bow, pavement to above the roof, and the glazed slot beside it
  if (best >= 0) {
    const e = E[afterBow]
    // a thin wall turned to face along the Mission front, standing 2.6 m out, its top raked back
    const pa = at(e, 0.9, 1.3)
    const fx = e.tx, fz = e.tz
    const h = Math.atan2(fx, fz)
    boxAlong(out, pa.x, (g + H + 4) / 2, pa.z, 1.3, (H + 4 - g) / 2, 0.45, h, RED, PANEL)
    const top = at(e, 0.9, 0.7)
    boxAlong(out, top.x, H + 5.5, top.z, 0.25, 1.5, 0.2, h, TRIM, FIXED)   // the mast on its top
    // the glazed slot: the full height, between the blade and the wing
    curtain(out, e, 1.9, 3.6, g + 2, H + 1.8, 0.05, 500)
    slab(out, e, 1.8, 3.7, H + 1.8, H + 2.1, -0.3, 0.2, TRIM, FIXED)
    slab(out, e, 1.8, 3.7, g + POD + 0.1, H + 1.8, -0.3, 0.02, CREAM, STUCCO)
  }
}

export const MISSION_TENTH: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  mission1390,
}
