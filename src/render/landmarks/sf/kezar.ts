/**
 * KEZAR STADIUM's two stands (Golden Gate Park audit, 2026-10-04). OSM maps them as `building=grandstand`, and the
 * generic buildings drew each as a 139 m three-storey barracks with windows and a red tile roof. The stadium since the
 * 1990 rebuild: ~10 000 seats in two open concrete stands either side of the track, refitted 2014–16 with old
 * Candlestick Park seats (orange), no roof (Wikipedia, "Kezar Stadium").
 *
 * Local frame: x along the stand, the FIELD side at +z (the entry's `front` turns it to face the track); rows rise
 * from a low front wall to a back wall with a rail.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { box, strut, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { tower } from '../tower.ts'

const CONCRETE: Rgb = [0.7, 0.68, 0.64]
const SEAT: Rgb = [0.58, 0.29, 0.11]
const RAIL: Rgb = [0.25, 0.27, 0.28]

export function kezarStands(out: MeshBuilder, fit: Fit): void {
  const hx = fit.hx, hz = Math.max(5, fit.hz)
  const conc = surfaceTag('concrete')
  const ROWS = 18, front = 1.2, top = 8
  const z0 = hz - 0.6, z1 = -hz + 0.6
  const d = (z0 - z1) / ROWS
  // the front wall at the track
  box(out, 0, front / 2, hz - 0.3, hx, front / 2, 0.3, CONCRETE, conc)
  // the rows: each a solid step from the ground to its tread, running back to the rear wall
  for (let k = 0; k < ROWS; k++) {
    const y = front + ((top - front) * (k + 1)) / ROWS
    const zf = z0 - k * d
    box(out, 0, y / 2, (zf + z1) / 2 - 0.3, hx - 0.01 * k, y / 2, (zf - z1) / 2 + 0.3, CONCRETE, conc)
    // the seats, in sections between the aisles
    const SEC = 12, aisle = 1.4
    const n = Math.max(1, Math.round((2 * hx) / SEC))
    const w = (2 * hx) / n
    for (let s = 0; s < n; s++) {
      const cx = -hx + (s + 0.5) * w
      box(out, cx, y + 0.22, zf - d * 0.35, (w - aisle) / 2, 0.2, d * 0.22, SEAT, 0)
    }
  }
  // the rear wall's parapet and rail, and the rail along the front
  box(out, 0, top + 0.5, z1 - 0.3, hx, 0.5, 0.3, CONCRETE, conc)
  strut(out, [-hx, top + 1.1, z1 - 0.3], [hx, top + 1.1, z1 - 0.3], 0.04, 0.04, RAIL)
  strut(out, [-hx, front + 0.9, hz - 0.3], [hx, front + 0.9, hz - 0.3], 0.04, 0.04, RAIL)
  for (let x = -hx; x <= hx + 0.01; x += 6) strut(out, [x, front, hz - 0.3], [x, front + 0.9, hz - 0.3], 0.03, 0.03, RAIL)
}

/**
 * The track and the field between the stands: the red eight-lane 400 m track (2015 Mondo resurfacing), its lane
 * lines, the grass infield with a soccer pitch marked on it. OSM's `leisure=track` is fetched but never baked into
 * an area, so the stadium was park grass with the park's trees planted across the running lanes. The outer oval is
 * handed to the city as GROUND (`out.grounds`): paved, and cleared of trees.
 *
 * Local frame: x east, z north (front 180), centred on the field.
 */
export function kezarField(out: MeshBuilder, _fit: Fit): void {
  const S = 42.2, R0 = 36.5, LANES = 8, LW = 1.22, R1 = R0 + LANES * LW
  // a stadium oval of radius r round the two straights, anticlockwise, as points
  const oval = (r: number, n = 24): { x: number; z: number }[] => {
    const pts: { x: number; z: number }[] = []
    for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + (i / n) * Math.PI; pts.push({ x: S + Math.cos(a) * r, z: Math.sin(a) * r }) }
    for (let i = 0; i <= n; i++) { const a = Math.PI / 2 + (i / n) * Math.PI; pts.push({ x: -S + Math.cos(a) * r, z: Math.sin(a) * r }) }
    pts.push(pts[0])
    return pts
  }
  out.grounds.push(oval(R1 + 0.8).slice(0, -1))
  const RED: Rgb = [0.38, 0.14, 0.12], GRASS: Rgb = [0.21, 0.3, 0.18], LINE: Rgb = [0.94, 0.94, 0.92]
  const up: [number, number, number] = [0, 1, 0]
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  // a band between two ovals at height y (the track), and a filled oval (the infield)
  const band = (ri: number, ro: number, y: number, c: Rgb): void => {
    const a = oval(ri), b = oval(ro)
    for (let i = 0; i + 1 < a.length; i++) out.quad([[a[i].x, y, a[i].z], [b[i].x, y, b[i].z], [b[i + 1].x, y, b[i + 1].z], [a[i + 1].x, y, a[i + 1].z]], up, uv, c, 0)
  }
  band(R0, R1, 0.06, RED)
  for (let k = 1; k < LANES; k++) band(R0 + k * LW - 0.04, R0 + k * LW + 0.04, 0.13, LINE)
  const inner = oval(R0)
  for (let i = 0; i + 1 < inner.length; i++) out.quad([[0, 0.1, 0], [inner[i].x, 0.1, inner[i].z], [inner[i + 1].x, 0.1, inner[i + 1].z], [0, 0.1, 0]], up, uv, GRASS, 0)
  // the soccer pitch's lines: touchlines, goal lines, halfway, centre circle, the boxes
  const L = 52, W = 33, t = 0.06, y = 0.14
  // (each line a little over the last: where two cross, their tops would otherwise lie in one plane)
  let lift = 0
  const line = (x0: number, z0: number, x1: number, z1: number): void => {
    box(out, (x0 + x1) / 2, y + (lift += 0.025), (z0 + z1) / 2, Math.max(t, Math.abs(x1 - x0) / 2), 0.01, Math.max(t, Math.abs(z1 - z0) / 2), LINE, 0)
  }
  line(-L, -W, L, -W); line(-L, W, L, W); line(-L, -W, -L, W); line(L, -W, L, W); line(0, -W, 0, W)
  for (const s of [-1, 1]) {
    line(s * L, -20, s * (L - 16.5), -20); line(s * L, 20, s * (L - 16.5), 20); line(s * (L - 16.5), -20, s * (L - 16.5), 20)
    // the goal: two posts and the bar
    for (const g of [-3.66, 3.66]) strut(out, [s * L, 0, g], [s * L, 2.44, g], 0.12, 0.12, LINE)
    strut(out, [s * L, 2.44, -3.66], [s * L, 2.44, 3.66], 0.12, 0.12, LINE)
  }
  // the centre circle, one ring of quads
  for (let i = 0; i < 32; i++) {
    const a0 = (i / 32) * Math.PI * 2, a1 = ((i + 1) / 32) * Math.PI * 2, yc = y + 0.01
    const p = (a: number, r: number): [number, number, number] => [Math.cos(a) * r, yc, Math.sin(a) * r]
    out.quad([p(a0, 9.1), p(a0, 9.2), p(a1, 9.2), p(a1, 9.1)], up, uv, LINE, 0)
  }
}

/**
 * KEZAR PAVILION (1924), way/120481450 beside the stadium — a 96 m presidio-style barracks (historic census, 2026-10-04).
 * Mapillary on Stanyan: pale olive stucco, tall ROUND-ARCHED windows over a darker base with plain doors, a deep dark
 * eave carried on a row of corbels, a low tiled roof.
 */
export function kezarPavilion(out: MeshBuilder, fit: Fit): void {
  const WALL: Rgb = [0.74, 0.74, 0.62], BASE: Rgb = [0.6, 0.6, 0.5], DARK: Rgb = [0.22, 0.2, 0.18]
  tower(out, fit, {
    height: 12,
    base: { height: 3, face: { kind: 'punched', wall: BASE, glass: DARK, pitch: 6, floor: 3, solid: 0.75, material: 'stucco' } },
    tiers: [{ to: 12, face: { kind: 'punched', wall: WALL, glass: [0.12, 0.13, 0.14], pitch: 5, floor: 9, solid: 0.55, arched: true, material: 'stucco' }, cornice: { depth: 1.0, height: 0.8, colour: DARK } }],
    roof: [0.45, 0.25, 0.18],
    crown: { kind: 'hip', height: 3, inset: -0.6, colour: [0.45, 0.25, 0.18], material: 'tile' },
  })
}

/** one name per stand (a builder named by two entries reads as a dead duplicate to the audits) */
export const KEZAR: Record<string, (out: MeshBuilder, fit: Fit) => void> = { kezarNorthStand: kezarStands, kezarSouthStand: kezarStands, kezarField, kezarPavilion }
