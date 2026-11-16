import type { MeshBuilder } from '../../../buildings.ts'
import { box, EMIT, prism, type Rgb } from '../../../models.ts'
import { block } from '../../kit.ts'
import type { Fit } from '../../fit.ts'

/*
 * The two pools of the parvis de La Défense, each on its own OSM way's box (fit hx × hz; long axis local x). Both are
 * low: a kerb at RIM_H round a sheet of water just above the dalle, so the bike rides round them, never into a wall.
 */
const FIXED = 0
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const RIM_H = 0.45
const RIM_W = 0.6
const STONE: Rgb = [0.78, 0.76, 0.72]
const WATER_Y = 0.32

/**
 * The dalle under a pool, above the model's base: the base is the LOWEST ground under the box, which on La Défense can
 * be the road under the slab, so take the highest ground sampled across the box.
 */
function dalle(fit: Fit): number {
  const g = fit.groundAt
  if (!g) return fit.grade ?? 0
  let m = fit.grade ?? 0
  for (const [x, z] of [[0, 0], [fit.hx, fit.hz], [-fit.hx, fit.hz], [fit.hx, -fit.hz], [-fit.hx, -fit.hz], [0, fit.hz], [0, -fit.hz]]) {
    const v = g(x * 0.9, z * 0.9)
    if (Number.isFinite(v)) m = Math.max(m, v)
  }
  return m
}

/** a builder drawn at the dalle's height */
function lifted(out: MeshBuilder, dy: number, draw: () => void): void {
  const from = out.positions.length
  draw()
  for (let i = from; i < out.positions.length; i += 3) out.positions[i + 1] += dy
}

function pool(out: MeshBuilder, hx: number, hz: number, water: Rgb): void {
  for (const [x0, x1, z0, z1] of [[-hx, hx, -hz, -hz + RIM_W], [-hx, hx, hz - RIM_W, hz], [-hx, -hx + RIM_W, -hz, hz], [hx - RIM_W, hx, -hz, hz]]) {
    block(out, x0, x1, z0, z1, 0, RIM_H, STONE)
  }
  const y = WATER_Y
  out.quad([[-hx, y, hz], [hx, y, hz], [hx, y, -hz], [-hx, y, -hz]], [0, 1, 0], UV, water, FIXED)
}

/** stripes of Agam's coloured mosaic in the floor, seen through the water */
const AGAM_BANDS: Rgb[] = [[0.85, 0.2, 0.2], [0.95, 0.55, 0.15], [0.95, 0.85, 0.2], [0.3, 0.7, 0.35], [0.2, 0.45, 0.8], [0.45, 0.3, 0.7], [0.95, 0.95, 0.95], [0.1, 0.1, 0.12]]
const AGAM_STRIPE = 1.6
const AGAM_JET_ROWS = 3
const AGAM_JET_STEP = 4.2

/**
 * FONTAINE AGAM (Yaacov Agam, 1977), OSM way 19464174: the long basin before the Quatre Temps / CNIT, its floor a
 * mosaic of bright bands and its water ballet of 66 jets in rows. Drawn as the kerb, the mosaic seen through a thin
 * film of water (the bands themselves, slightly blued), and the jets as white columns of graded height.
 */
export function fontaineAgam(out: MeshBuilder, fit: Fit): void {
  lifted(out, dalle(fit), () => agam(out, fit))
}
function agam(out: MeshBuilder, fit: Fit): void {
  const hx = fit.hx - 0.2
  const hz = fit.hz - 0.2
  pool(out, hx, hz, [0.35, 0.55, 0.7])
  const y = WATER_Y + 0.02
  let k = 0
  for (let x = -hx + RIM_W; x < hx - RIM_W; x += AGAM_STRIPE, k++) {
    const x1 = Math.min(x + AGAM_STRIPE * 0.92, hx - RIM_W)
    const c = AGAM_BANDS[k % AGAM_BANDS.length].map((v, i) => v * 0.4 + [0.12, 0.25, 0.36][i]) as Rgb
    out.quad([[x, y, hz - RIM_W], [x1, y, hz - RIM_W], [x1, y, -hz + RIM_W], [x, y, -hz + RIM_W]], [0, 1, 0], UV, c, FIXED)
  }
  const foam: Rgb = [0.95, 0.97, 1]
  for (let r = 0; r < AGAM_JET_ROWS; r++) {
    const z = -hz * 0.55 + (r * hz * 1.1) / (AGAM_JET_ROWS - 1)
    let i = 0
    for (let x = -hx + 3; x < hx - 3; x += AGAM_JET_STEP, i++) {
      const h = 1.2 + 2.6 * (0.5 + 0.5 * Math.sin(i * 0.9 + r * 1.3))
      prism(out, x, z, y, y + h, 0.14, 5, foam, FIXED, 0.05)
    }
  }
}

const TAKIS_COLS = 7
const TAKIS_ROWS = 7
const TAKIS_LAMPS: Rgb[] = [[1, 0.25, 0.15], [1, 0.8, 0.2], [0.25, 0.5, 1], [0.3, 0.95, 0.4], [1, 0.5, 0.1]]

/**
 * BASSIN TAKIS (Takis, 1988), OSM way 19463289: a dark pool on the Esplanade with 49 "signaux lumineux" — thin steel
 * stems 3 to 9 m tall, each topped with one or two coloured lamps in a little frame, standing out of the water.
 */
export function bassinTakis(out: MeshBuilder, fit: Fit): void {
  lifted(out, dalle(fit), () => takis(out, fit))
}
function takis(out: MeshBuilder, fit: Fit): void {
  const hx = fit.hx - 0.2
  const hz = fit.hz - 0.2
  pool(out, hx, hz, [0.16, 0.24, 0.3])
  const steel: Rgb = [0.35, 0.37, 0.4]
  let n = 0
  for (let i = 0; i < TAKIS_COLS; i++) for (let j = 0; j < TAKIS_ROWS; j++, n++) {
    const jx = Math.sin(n * 12.9898) * 0.35
    const jz = Math.sin(n * 78.233) * 0.35
    const x = -hx + RIM_W + (hx * 2 - 2 * RIM_W) * ((i + 0.5 + jx) / TAKIS_COLS)
    const z = -hz + RIM_W + (hz * 2 - 2 * RIM_W) * ((j + 0.5 + jz) / TAKIS_ROWS)
    const h = 3 + 6 * (0.5 + 0.5 * Math.sin(n * 2.31))
    prism(out, x, z, WATER_Y, WATER_Y + h, 0.07, 5, steel, FIXED, 0.05)
    const top = WATER_Y + h
    box(out, x, top + 0.25, z, 0.22, 0.03, 0.03, steel, FIXED)
    box(out, x - 0.2, top + 0.25, z, 0.11, 0.11, 0.11, TAKIS_LAMPS[n % TAKIS_LAMPS.length], EMIT)
    box(out, x + 0.2, top + 0.25, z, 0.11, 0.11, 0.11, TAKIS_LAMPS[(n * 3 + 1) % TAKIS_LAMPS.length], EMIT)
  }
}

/*
 * PAVING of the Parvis and Esplanade du Général de Gaulle: the dalle reads, from the Arche to the Esplanade's east end,
 * as grey granite crossed by a grid of pink joints, with long red-pink strips running along the axis and wider pink
 * bands across it (owner's Google satellite screenshot, 2026-11-16). A thin decal draped on Fit.groundAt; where the
 * ground under a sample is a road beneath the slab the strip simply sinks out of sight. Local x along the axis.
 */
const PAVE_LIFT = 0.08
const PAVE_STEP = 4
const PAVE_GRID_X = 12
const PAVE_GRID_Z = 12
const PAVE_JOINT_W = 0.45
const PAVE_JOINT: Rgb = [0.6, 0.52, 0.5]
const PAVE_STRIPS_Z = [-26, -9, 9, 26]
const PAVE_STRIP_W = 3.2
const PAVE_STRIP: Rgb = [0.6, 0.46, 0.44]
const PAVE_BAND_EVERY = 72
const PAVE_BAND_W = 5
const PAVE_BAND: Rgb = [0.64, 0.53, 0.51]
/** where the axis runs into the Arche's steps and the pools: no paving within these local-x spans */
const PAVE_SKIP_X: [number, number][] = []
/** east of this local x the Esplanade runs between lawns and tree rows: paving only on the central walk */
const PAVE_WALK_FROM_X = 40
const PAVE_WALK_HALF = 11
/** which way local x runs toward the Esplanade's east end (rotateDeg 116 puts local +x to the west) */
const PAVE_EAST = -1
/** a piece whose corners' ground differs by more than this is on steps, a kerb or a roof: left out */
const PAVE_MAX_RISE = 0.6

/**
 * OSM's lawns under the paving's box (osmium, local pbf, 2026-11-16: landuse=grass and the like), in the entry's frame
 * (rotateDeg 206 about 48.89069, 2.24182: local x = E cos r − N sin r, z = E sin r + N cos r). A piece whose middle is on
 * one is left out, so the paving stops at the grass.
 */
const PAVE_LAWNS: number[][] = [
  [139.1, 31.0, 110.9, 31.0, 111.5, -17.3, 115.2, -17.2, 115.1, -0.8, 115.1, 10.3, 115.0, 16.9, 133.3, 17.0, 133.5, -17.0, 140.5, -16.9],
  [34.6, 36.8, 33.3, 38.6, 31.9, 39.7, 30.3, 40.3, 15.0, 40.4, 10.8, 40.4, 8.6, 40.0, 6.6, 38.7, 5.6, 37.1, 5.1, 35.0, 5.1, 19.5, 5.0, 5.4, 4.9, -18.9, 5.1, -20.6, 6.6, -22.8, 9.1, -24.4, 29.2, -24.7, 30.8, -24.2, 32.5, -23.1, 33.9, -21.3, 34.4, -19.5, 35.0, 34.7],
  [-357.6, -14.2, -360.4, -14.2, -360.4, -17.7, -357.6, -17.7],
  [-349.0, -14.2, -355.1, -14.2, -355.1, -17.7, -349.0, -17.7],
  [-343.5, -14.1, -347.1, -14.2, -347.1, -17.7, -343.5, -17.6],
  [-335.8, -14.1, -339.4, -14.1, -339.3, -17.6, -335.8, -17.6],
  [-349.2, -6.4, -355.2, -6.5, -355.2, -10.2, -349.1, -10.1],
  [-343.6, -6.4, -347.2, -6.4, -347.1, -10.1, -343.6, -10.1],
  [-335.9, -6.3, -339.4, -6.3, -339.4, -10.0, -335.9, -10.0],
  [-447.4, -7.2, -451.9, -7.3, -456.3, -8.2, -463.5, -7.4, -463.5, -11.1, -447.4, -11.0],
  [-393.0, -6.8, -396.9, -6.8, -401.1, -7.6, -406.3, -6.9, -410.6, -7.8, -415.4, -7.0, -419.8, -7.9, -425.1, -7.1, -429.5, -7.9, -434.1, -7.1, -438.5, -7.9, -442.8, -7.2, -442.8, -10.9, -392.9, -10.5],
  [-357.6, -6.5, -361.1, -6.5, -365.1, -7.4, -370.1, -6.6, -374.5, -7.3, -379.6, -6.7, -384.1, -7.3, -388.0, -6.7, -387.9, -10.4, -357.6, -10.2],

]
const onLawn = (x: number, z: number): boolean => PAVE_LAWNS.some((r) => {
  let inside = false
  for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
    const xi = r[i], zi = r[i + 1], xj = r[j], zj = r[j + 1]
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside
  }
  return inside
})

export function parvisPaving(out: MeshBuilder, fit: Fit): void {
  const g = fit.groundAt
  const y = (x: number, z: number): number => {
    const v = g ? g(x, z) : NaN
    return (Number.isFinite(v) ? v : (fit.grade ?? 0)) + PAVE_LIFT
  }
  const skip = (x: number): boolean => PAVE_SKIP_X.some(([a, b]) => x > a && x < b)
  const half = (x: number): number => (PAVE_EAST * x > PAVE_WALK_FROM_X ? Math.min(PAVE_WALK_HALF, fit.hz) : fit.hz)
  const piece = (p: [number, number][], c: Rgb): void => {
    if (onLawn((p[0][0] + p[2][0]) / 2, (p[0][1] + p[2][1]) / 2)) return
    const ys = p.map(([x, z]) => y(x, z))
    if (Math.max(...ys) - Math.min(...ys) > PAVE_MAX_RISE) return
    out.quad(p.map(([x, z], i) => [x, ys[i], z]) as [number, number, number][], [0, 1, 0], UV, c, FIXED)
  }
  /** a strip along local x (z0..z1) or along local z (x0..x1), cut into PAVE_STEP pieces that follow the ground */
  const alongX = (z0: number, z1: number, c: Rgb): void => {
    for (let x = -fit.hx; x < fit.hx; x += PAVE_STEP) {
      const x1 = Math.min(x + PAVE_STEP, fit.hx)
      if (skip(x) || Math.max(Math.abs(z0), Math.abs(z1)) > half(x)) continue
      piece([[x, z1], [x1, z1], [x1, z0], [x, z0]], c)
    }
  }
  const alongZ = (x0: number, x1: number, c: Rgb): void => {
    if (skip(x0)) return
    const h = half(x0)
    for (let z = -h; z < h; z += PAVE_STEP) {
      const z1 = Math.min(z + PAVE_STEP, h)
      piece([[x0, z1], [x1, z1], [x1, z], [x0, z]], c)
    }
  }
  for (let z = -fit.hz + PAVE_GRID_Z; z < fit.hz; z += PAVE_GRID_Z) alongX(z - PAVE_JOINT_W / 2, z + PAVE_JOINT_W / 2, PAVE_JOINT)
  for (let x = -fit.hx + PAVE_GRID_X; x < fit.hx; x += PAVE_GRID_X) {
    const band = Math.round((x + fit.hx) / PAVE_GRID_X) % Math.round(PAVE_BAND_EVERY / PAVE_GRID_X) === 0
    const w = band ? PAVE_BAND_W : PAVE_JOINT_W
    alongZ(x - w / 2, x + w / 2, band ? PAVE_BAND : PAVE_JOINT)
  }
  for (const z of PAVE_STRIPS_Z) if (Math.abs(z) < fit.hz) alongX(z - PAVE_STRIP_W / 2, z + PAVE_STRIP_W / 2, PAVE_STRIP)
}
