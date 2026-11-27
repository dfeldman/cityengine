/**
 * SAN FRANCISCO'S STREET LIGHTS (owner: "street lamps are a major, distinctive, repeating element"). All in the pole-foot
 * frame: origin on the pavement, y up, the ROAD at local −x (the arm reaches toward −x). Each is placed thousands of
 * times, so the budgets are tight: smooth lathes and tubes read round at a handful of triangles.
 *
 * - `cobraHeadArm`   the arm + LED cobra head bolted to the wooden utility pole (`utilityPole`), below the power crossarm;
 * - `sfConcreteLight` the round tapered concrete residential standard;
 * - `sfSteelLight`    the galvanised octagonal arterial pole with a long arm.
 */
import type { MeshBuilder } from '../buildings.ts'
import { EMIT, FIXED, LAMP_LIGHTS, lathe, tube, box, type Rgb } from './../models.ts'

// ---- tunables --------------------------------------------------------------------------------------------------------
const HEAD_LEN = 0.72, HEAD_W = 0.32, HEAD_T = 0.12          // the housing, metres (at scale 1)
const HEAD_GREY: Rgb = [0.46, 0.48, 0.5]
const HEAD_TOP: Rgb = [0.56, 0.58, 0.6]
const LENS: Rgb = [0.98, 0.9, 0.76]                          // 3000 K LED
const GALV: Rgb = [0.52, 0.54, 0.56]
const CONCRETE: Rgb = [0.66, 0.66, 0.64]
const STEEL: Rgb = [0.54, 0.56, 0.58]
const ARM_SIDES = 5
const HEAD_DROP = 0.04                                       // the head hangs this far below its attach point (top of housing sits just above)

type V3 = [number, number, number]

// the housing's section (z, y) in unit half-width / half-thickness, 8 points round: flat underside, rounded shoulders
const SEC: [number, number][] = [[-0.85, -1], [0.85, -1], [1, -0.35], [0.78, 0.55], [0.3, 1], [-0.3, 1], [-0.78, 0.55], [-1, -0.35]]
// stations from the rear (at the arm) to the tip: [along 0..1, width scale, thickness scale]
const STATIONS: [number, number, number][] = [[0, 0.8, 0.85], [0.3, 1, 1], [0.75, 0.96, 0.9], [1, 0.72, 0.5]]

/** a smooth-shaded vertex / triangle straight into a builder (models.ts keeps its own private; same convention) */
function vtx(out: MeshBuilder, p: V3, n: V3, c: Rgb, tag: number): number {
  const i = out.positions.length / 3, l = Math.hypot(n[0], n[1], n[2]) || 1
  out.positions.push(p[0], p[1], p[2]); out.normals.push(n[0] / l, n[1] / l, n[2] / l)
  out.uvs.push(0, 0); out.colors.push(c[0], c[1], c[2], tag)
  return i
}
function tri(out: MeshBuilder, a: number, b: number, c: number): void {
  const P = out.positions, N = out.normals
  const ax = P[b * 3] - P[a * 3], ay = P[b * 3 + 1] - P[a * 3 + 1], az = P[b * 3 + 2] - P[a * 3 + 2]
  const bx = P[c * 3] - P[a * 3], by = P[c * 3 + 1] - P[a * 3 + 1], bz = P[c * 3 + 2] - P[a * 3 + 2]
  const f = (ay * bz - az * by) * (N[a * 3] + N[b * 3] + N[c * 3]) + (az * bx - ax * bz) * (N[a * 3 + 1] + N[b * 3 + 1] + N[c * 3 + 1]) + (ax * by - ay * bx) * (N[a * 3 + 2] + N[b * 3 + 2] + N[c * 3 + 2])
  if (f > 0) out.indices.push(a, c, b); else out.indices.push(a, b, c)
}

/**
 * The LED cobra head. (x, y, z) is the centre of its rear face, where the arm enters; it lies along −x, its flat lens
 * underneath. Returns the lens centre.
 */
export function cobraHead(out: MeshBuilder, x: number, y: number, z: number, scale = 1): V3 {
  const L = HEAD_LEN * scale, hw = HEAD_W / 2 * scale, ht = HEAD_T / 2 * scale
  const cy = y - HEAD_DROP * scale
  const rings: number[][] = []
  for (const [t, ws, ts] of STATIONS) {
    const ring: number[] = []
    for (let k = 0; k < 8; k++) {
      const [sz, sy] = SEC[k]
      const top = sy > 0.5
      // normals: sides/top from the section; the underside leans outward so it does not smear into the shoulder
      const n: V3 = k < 2 ? [0, -1, sz * 0.25] : [0, sy * 0.8, sz * 0.9]
      ring.push(vtx(out, [x - t * L, cy + sy * ht * ts, z + sz * hw * ws], n, top ? HEAD_TOP : HEAD_GREY, FIXED))
    }
    rings.push(ring)
  }
  for (let i = 0; i < rings.length - 1; i++) for (let k = 0; k < 8; k++) {
    const k1 = (k + 1) % 8
    tri(out, rings[i][k], rings[i][k1], rings[i + 1][k1]); tri(out, rings[i][k], rings[i + 1][k1], rings[i + 1][k])
  }
  // the tip: a flat end
  const last = rings[rings.length - 1]
  const [, wsT, tsT] = STATIONS[STATIONS.length - 1]
  const tc = vtx(out, [x - L, cy, z], [-1, 0, 0], HEAD_GREY, FIXED)
  const tp = SEC.map(([sz, sy]) => vtx(out, [x - L, cy + sy * ht * tsT, z + sz * hw * wsT], [-1, 0, 0], HEAD_GREY, FIXED))
  void last
  for (let k = 0; k < 8; k++) tri(out, tc, tp[k], tp[(k + 1) % 8])
  // the lens: the flat underside, glowing, a hair proud
  const ly = cy - ht * STATIONS[1][2] - 0.003 * scale
  const x0 = x - L * 0.1, x1 = x - L * 0.9, lz = hw * 0.74
  out.quad([[x0, ly, z - lz], [x0, ly, z + lz], [x1, ly, z + lz], [x1, ly, z - lz]], [0, -1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], LENS, EMIT)
  // the photocell: a small grey drum on the top
  lathe(out, x - L * 0.3, z, [[0.045 * scale, cy + ht * 0.95], [0.04 * scale, cy + ht * 0.95 + 0.07 * scale]], 5, [0.3, 0.31, 0.32], FIXED, { capTop: true })
  return [x - L * 0.5, ly, z]
}

/** an arm: a smooth tube sweeping from the pole, up a little, level at the end. Returns the end point. */
function armPath(x0: number, y0: number, len: number, rise: number, endLift = 0.14): V3[] {
  const pts: V3[] = []
  for (let k = 0; k <= 4; k++) {
    const t = k / 4
    pts.push([x0 - len * t, y0 + rise * t * t + (k === 4 ? 0 : 0) - 0 * endLift, 0])
  }
  return pts
}

// ---- 1. the cobra head on a wooden utility pole -------------------------------------------------------------------------
const POLE_R = 0.125
const COBRA_ARM_Y = 8.3, COBRA_ARM_LEN = 2.2, COBRA_ARM_RISE = 0.34
export const COBRA_ON_POLE_LIGHT: V3 = [-(COBRA_ARM_LEN + 0.36 * HEAD_LEN * 1) , 0, 0]  // overwritten below
const cobraAt = (): V3 => {
  // dry-run into a scratch to find the lens centre exactly
  const x = -POLE_R - COBRA_ARM_LEN
  return [x - HEAD_LEN * 0.5, COBRA_ARM_Y + COBRA_ARM_RISE + 0.01 - HEAD_DROP - HEAD_T / 2 * 1.0 - 0.003, 0]
}
COBRA_ON_POLE_LIGHT[0] = cobraAt()[0]; COBRA_ON_POLE_LIGHT[1] = cobraAt()[1]; COBRA_ON_POLE_LIGHT[2] = 0

export function cobraHeadArm(out: MeshBuilder): void {
  const y0 = COBRA_ARM_Y
  // the clamp: a band round the pole with a bracket block
  box(out, -POLE_R - 0.03, y0, 0, 0.07, 0.07, 0.06, GALV, FIXED)
  // the arm
  const path = armPath(-POLE_R, y0, COBRA_ARM_LEN, COBRA_ARM_RISE)
  tube(out, path, [0.038, 0.034, 0.03, 0.028, 0.026], ARM_SIDES, GALV, FIXED)
  // the brace: a thin diagonal from lower on the pole to two-thirds out
  tube(out, [[-POLE_R, y0 - 0.5, 0], [-COBRA_ARM_LEN * 0.7 - POLE_R, y0 + COBRA_ARM_RISE * 0.45, 0]], 0.013, 4, GALV, FIXED)
  const end = path[path.length - 1]
  cobraHead(out, end[0] + 0.07, end[1] + 0.01, 0, 1)
}

// ---- 3. SF's concrete residential standard ----------------------------------------------------------------------------
export function sfConcreteLight(out: MeshBuilder): void {
  const H = 8.9
  lathe(out, 0, 0, [[0.215, 0], [0.2, 0.3], [0.17, 0.5], [0.074, H]], 8, CONCRETE, FIXED, { capTop: true })
  // arm: from a clamp just under the top, up and out
  lathe(out, 0, 0, [[0.088, H - 0.5], [0.088, H - 0.38]], 8, GALV, FIXED)
  const path = armPath(-0.07, H - 0.42, 2.4, 0.5)
  tube(out, path, [0.045, 0.038, 0.033, 0.03, 0.028], ARM_SIDES, GALV, FIXED)
  const end = path[path.length - 1]
  cobraHead(out, end[0] + 0.07, end[1] + 0.01, 0, 1)
}
export const SF_CONCRETE_LIGHT: V3 = [-0.07 - 2.4 - 0.07 - HEAD_LEN * 0.5, 8.9 - 0.42 + 0.5 + 0.01 - HEAD_DROP - HEAD_T / 2 - 0.003, 0]
LAMP_LIGHTS.set(sfConcreteLight, [{ at: SF_CONCRETE_LIGHT }])

// ---- 4. SF's galvanised steel arterial pole ---------------------------------------------------------------------------
export function sfSteelLight(out: MeshBuilder): void {
  const H = 10.5
  // base shroud, then the octagonal tapered shaft (hard-faceted)
  lathe(out, 0, 0, [[0.2, 0], [0.2, 0.55], [0.15, 0.6], [0.14, 0.62]], 8, [0.36, 0.38, 0.4], FIXED, { phase: Math.PI / 8, hard: true })
  lathe(out, 0, 0, [[0.135, 0.62], [0.065, H]], 8, STEEL, FIXED, { phase: Math.PI / 8, hard: true, capTop: true })
  // arm: a thick slip-fit tube, tapering, with a lower brace
  const path = armPath(-0.06, H - 0.9, 3.0, 0.75)
  tube(out, path, [0.06, 0.052, 0.045, 0.04, 0.036], ARM_SIDES, STEEL, FIXED)
  tube(out, [[-0.06, H - 1.7, 0], [-1.9, H - 0.9 + 0.75 * 0.4, 0]], 0.02, 4, STEEL, FIXED)
  const end = path[path.length - 1]
  cobraHead(out, end[0] + 0.08, end[1] + 0.012, 0, 1.2)
}
export const SF_STEEL_LIGHT: V3 = [-0.06 - 3.0 - 0.08 - HEAD_LEN * 1.2 * 0.5, 10.5 - 0.9 + 0.75 + 0.012 - (HEAD_DROP + HEAD_T / 2) * 1.2 - 0.004, 0]
LAMP_LIGHTS.set(sfSteelLight, [{ at: SF_STEEL_LIGHT }])

// ---- 5. Chinatown's dragon lamp (Grant Avenue, 1925) -------------------------------------------------------------------
/*
 * 43 lamps ordered 1925 for Grant from Bush to Broadway (24 recast 1996 from the original moulds): twin gilded dragons coil
 * up a dark iron pole to a pagoda-roofed lantern. Photos (for later checks): opensfhistory wnp27.1715, wnp27.1717,
 * wnp27.2254, wnp37.01754; hiddenchinatownsf.blogspot.com/2022/04/the-street-lights-of-chinatown-way-too.html.
 * Heights/colours are from memory of the street (no source gives them): ~5.7 m, dark green pole, gilt dragons, amber
 * lantern, red roof — verify against a photo.
 */
const DRAGON_PAINT: Rgb = [0.09, 0.2, 0.14]
const GILT: Rgb = [0.86, 0.66, 0.2]
const ROOF_RED: Rgb = [0.62, 0.1, 0.08]
const AMBER: Rgb = [1.0, 0.82, 0.5]
const DRAGON_POLE_H = 3.9, DRAGON_TURNS = 2.25, DRAGON_Y0 = 0.9, DRAGON_Y1 = 3.5, DRAGON_COIL_R = 0.17, DRAGON_PTS = 13

export function dragonLamp(out: MeshBuilder): void {
  // plinth and fluted pole
  lathe(out, 0, 0, [[0.3, 0], [0.3, 0.14], [0.24, 0.22], [0.2, 0.5], [0.16, 0.7], [0.13, 0.9]], 8, DRAGON_PAINT, FIXED, { phase: Math.PI / 8 })
  lathe(out, 0, 0, [[0.13, 0.9], [0.115, DRAGON_POLE_H - 0.1], [0.16, DRAGON_POLE_H - 0.05], [0.16, DRAGON_POLE_H]], 8, DRAGON_PAINT, FIXED, { capTop: true })
  lathe(out, 0, 0, [[0.22, 0.5], [0.22, 0.56]], 8, GILT, FIXED)
  // two dragons, a half-turn apart, each a gilt tube coiling up, thickening to the shoulders, with a head at the top
  for (let d = 0; d < 2; d++) {
    const pts: V3[] = [], rad: number[] = []
    for (let k = 0; k < DRAGON_PTS; k++) {
      const t = k / (DRAGON_PTS - 1), a = d * Math.PI + t * DRAGON_TURNS * Math.PI * 2
      const r = DRAGON_COIL_R - 0.02 * t
      pts.push([Math.cos(a) * r, DRAGON_Y0 + t * (DRAGON_Y1 - DRAGON_Y0), Math.sin(a) * r])
      rad.push(0.018 + 0.045 * Math.sin(Math.min(1, t * 1.3) * Math.PI * 0.5) * (1 - 0.35 * t))
    }
    tube(out, pts, rad, 4, GILT, FIXED)
    // head: a gilt wedge, snout out and up, at the end of the body
    const [hx, hy, hz] = pts[DRAGON_PTS - 1], l = Math.hypot(hx, hz) || 1, ox = hx / l, oz = hz / l
    tube(out, [[hx, hy, hz], [hx + ox * 0.08, hy + 0.06, hz + oz * 0.08], [hx + ox * 0.17, hy + 0.1, hz + oz * 0.17]], [0.03, 0.028, 0.012], 4, GILT, FIXED)
  }
  // lantern: gilt cap, amber hexagonal glass swelling to the shoulders, gilt bands
  lathe(out, 0, 0, [[0.17, DRAGON_POLE_H], [0.15, DRAGON_POLE_H + 0.1]], 8, GILT, FIXED)
  lathe(out, 0, 0, [[0.14, DRAGON_POLE_H + 0.1], [0.22, DRAGON_POLE_H + 0.3], [0.22, DRAGON_POLE_H + 0.75], [0.15, DRAGON_POLE_H + 0.95]], 6, AMBER, EMIT, { phase: Math.PI / 6, hard: true })
  lathe(out, 0, 0, [[0.235, DRAGON_POLE_H + 0.28], [0.235, DRAGON_POLE_H + 0.33]], 6, GILT, FIXED, { phase: Math.PI / 6 })
  lathe(out, 0, 0, [[0.235, DRAGON_POLE_H + 0.72], [0.235, DRAGON_POLE_H + 0.77]], 6, GILT, FIXED, { phase: Math.PI / 6 })
  // pagoda roof: two tiers, eaves flared up at the corners (hexagon), red tiles, gilt finial
  const T = DRAGON_POLE_H + 0.95
  lathe(out, 0, 0, [[0.4, T + 0.02], [0.37, T + 0.05], [0.2, T + 0.16], [0.2, T + 0.2]], 6, ROOF_RED, FIXED, { phase: Math.PI / 6, hard: true })
  lathe(out, 0, 0, [[0.3, T + 0.18], [0.27, T + 0.22], [0.11, T + 0.4], [0.05, T + 0.5]], 6, ROOF_RED, FIXED, { phase: Math.PI / 6, hard: true })
  tube(out, [[0, T + 0.48, 0], [0, T + 0.62, 0], [0, T + 0.78, 0]], [0.03, 0.02, 0.008], 5, GILT, FIXED)
}
LAMP_LIGHTS.set(dragonLamp, [{ at: [0, DRAGON_POLE_H + 0.5, 0], r: 6 }])
