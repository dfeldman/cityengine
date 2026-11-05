import earcut from 'earcut'
import { MeshBuilder } from '../../buildings.ts'
import { type Rgb } from '../../models.ts'
import { hex, shade } from '../kit.ts'
import { into } from './louvre-palace.ts'

const FIXED = 0
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
type V3 = [number, number, number]
type P = [number, number]

/**
 * THE HÔTEL DE MERCY-ARGENTEAU (16 bis boulevard Montmartre, 9e; Firmin Perlin, 1778; raised three storeys 1827-29; OSM way/69220658).
 * Read off Commons ("Hotel de Mercy-Argenteau.jpg": the boulevard front) and fr.wikipedia (eleven bays, a three-bay avant-corps); IGN LiDAR HD MNS:
 * the front 22-24 m, the rear of the lot 7-20 m. OSM's way ends 15 m along the front (five of the eleven bays, the west end): the model stops there.
 * Frame: x along the front from its west end (turned -14 degrees, ENE), z inward (NNE). The front: rusticated ground floor of shops and a carriage
 * door, a tall first floor behind an iron balcony, three plainer floors with iron rails, a modillion cornice, a zinc mansard with dormers.
 */
export const ORIGIN: P = [-26.9, 0.5]                // the front's west end, metres east/north of the entry's lat/lon
export const TURN = Math.atan2(-3.7, 14.8)
export const FLOOR = 0.5
// footprint of way/69220658 (metres east/north of the entry's lat/lon)
export const RING: P[] = [[-26.9, 0.5], [-19.3, -1.4], [-12.1, -3.2], [-10.8, 4.3], [0.3, 2.4], [1.2, 7.1], [2.2, 15.5], [-8.5, 17.3], [-5.8, 32.7], [-18.2, 35.8]]
// ---- tunable: heights
export const BAYS = 5
export const GROUND = 5.0
export const STOREYS = [4.4, 3.6, 3.2, 2.9]   // first floor (tall) .. fourth
export const EAVE = GROUND + STOREYS.reduce((a, b) => a + b, 0)
export const TOP = EAVE + 4.0
export const SLOPE_IN = 2.4
export const BACK_EAVE = 19.0
export const BACK_TOP = 23.0
export const WIN_W = 1.25
export const BALCONY = 0.65
// ---- tunable: colours
const STONE: Rgb = hex('#d9cdb0')
const STONE_D: Rgb = hex('#bfb18f')
const STONE_L: Rgb = hex('#e6dcc3')
const GLASS: Rgb = [0.15, 0.19, 0.25]
const IRON: Rgb = [0.06, 0.06, 0.07]
const DOOR: Rgb = hex('#6b4426')
const SHOP: Rgb = hex('#3b3a38')
const AWN: Rgb = hex('#8a2b2f')
const ZINC: Rgb = hex('#7d8791')
const ZINC_HI: Rgb = hex('#8e98a2')
const BACK: Rgb = hex('#cdbf9f')

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
function normalOf(a: V3, b: V3, c: V3): V3 {
  const u = sub(b, a), v = sub(c, a)
  const n: V3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
  const l = Math.hypot(...n) || 1
  return [n[0] / l, n[1] / l, n[2] / l]
}
function sheet(q: MeshBuilder, p: [V3, V3, V3, V3], col: Rgb, up = true): void {
  let n = normalOf(p[0], p[1], p[2])
  if (up && n[1] < 0) n = [-n[0], -n[1], -n[2]]
  q.quad(p, n, UV, col, FIXED)
}
/** the street face: lot x along, y up, d out (towards -z) */
const F = (s: number, y: number, d: number): V3 => [s, y, -d]
function rect(q: MeshBuilder, s0: number, s1: number, y0: number, y1: number, d: number, col: Rgb): void {
  q.quad([F(s0, y0, d), F(s1, y0, d), F(s1, y1, d), F(s0, y1, d)], [0, 0, -1], UV, col, FIXED)
}
/** a projecting moulding: its face and its top */
function ledge(q: MeshBuilder, s0: number, s1: number, y0: number, y1: number, out: number, col: Rgb): void {
  rect(q, s0, s1, y0, y1, out, col)
  sheet(q, [F(s0, y1, 0), F(s1, y1, 0), F(s1, y1, out), F(s0, y1, out)], shade(col, 0.92))
  sheet(q, [F(s0, y0, out), F(s1, y0, out), F(s1, y0, 0), F(s0, y0, 0)], shade(col, 0.7), false)
}

/** a vertical wall from a to b (lot coords), outward on the right as walked */
function wall(q: MeshBuilder, a: P, b: P, y0: number, y1: number, col: Rgb): void {
  const dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz) || 1
  q.quad([[a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]]], [dz / l, 0, -dx / l], UV, col, FIXED)
}

function frontWindow(q: MeshBuilder, s: number, y0: number, y1: number, rail: boolean, tall: boolean): void {
  const w = WIN_W
  rect(q, s - w / 2 - 0.2, s + w / 2 + 0.2, y0 - 0.1, y1 + 0.28, 0.04, STONE_L)
  rect(q, s - w / 2, s + w / 2, y0, y1, 0.09, GLASS)
  rect(q, s - 0.025, s + 0.025, y0, y1, 0.11, STONE_L)
  rect(q, s - w / 2, s + w / 2, y0 + (y1 - y0) * (tall ? 0.72 : 0.7), y0 + (y1 - y0) * (tall ? 0.72 : 0.7) + 0.05, 0.11, STONE_L)
  if (rail) rect(q, s - w / 2 - 0.1, s + w / 2 + 0.1, y0 - 0.02, y0 + 0.9, 0.13, IRON)
}

function front(q: MeshBuilder, W: number): void {
  const bw = W / BAYS
  const yF = [GROUND]
  for (const h of STOREYS) yF.push(yF[yF.length - 1] + h)
  // the wall plane
  rect(q, 0, W, 0, EAVE, 0, STONE)
  // rusticated ground floor: horizontal joints, shop glass and the carriage door
  for (let y = 0.9; y < GROUND - 0.2; y += 0.9) rect(q, 0, W, y, y + 0.06, 0.02, shade(STONE_D, 0.8))
  for (let i = 0; i < BAYS; i++) {
    const c = (i + 0.5) * bw
    if (i === 3) { rect(q, c - 0.95, c + 0.95, 0, 3.5, 0.06, DOOR); rect(q, c - 1.15, c + 1.15, 3.5, 3.75, 0.08, STONE_L); continue }
    rect(q, c - 1.15, c + 1.15, 0.45, 3.5, 0.06, SHOP)
    rect(q, c - 1.15, c + 1.15, 3.5, 3.9, 0.07, i === 1 ? AWN : STONE_D)
  }
  for (let i = 0; i <= BAYS; i++) rect(q, i * bw - 0.12, i * bw + 0.12, 0, GROUND, 0.05, STONE_D)
  ledge(q, 0, W, GROUND - 0.1, GROUND + 0.3, 0.2, STONE_L)
  // first-floor balcony, then the windows floor by floor
  ledge(q, 0, W, yF[0] + 0.3, yF[0] + 0.55, BALCONY, STONE_L)
  rect(q, 0, W, yF[0] + 0.55, yF[0] + 1.45, BALCONY - 0.05, IRON)
  for (let k = 0; k < STOREYS.length; k++) {
    const y0 = yF[k] + (k === 0 ? 0.6 : 0.55), y1 = yF[k + 1] - (k === 0 ? 0.75 : 0.65)
    for (let i = 0; i < BAYS; i++) frontWindow(q, (i + 0.5) * bw, y0, y1, k === 0 || k === 2 || k === 3, k === 0)
    if (k === 1) ledge(q, 0, W, yF[2] - 0.12, yF[2] + 0.12, 0.18, STONE_L)
    if (k === 2) { ledge(q, 0, W, yF[3] + 0.0, yF[3] + 0.2, 0.45, STONE_L); rect(q, 0, W, yF[3] + 0.2, yF[3] + 0.95, 0.4, IRON) }
  }
  // quoins at the ends and the modillion cornice
  for (const s of [0, W - 0.6]) for (let y = GROUND + 0.3; y < EAVE - 0.5; y += 0.9) rect(q, s, s + 0.6, y, y + 0.8, 0.03, STONE_L)
  ledge(q, -0.1, W + 0.1, EAVE - 0.5, EAVE, 0.55, STONE_L)
  for (let s = 0.3; s < W; s += 0.5) rect(q, s, s + 0.2, EAVE - 0.9, EAVE - 0.5, 0.35, STONE_D)
  // the mansard: a steep slope to the flat, a dormer over every bay
  const y = EAVE
  sheet(q, [F(-0.1, y, 0.5), F(W + 0.1, y, 0.5), F(W + 0.1 - 0.3, TOP, -SLOPE_IN), F(0.3 - 0.1, TOP, -SLOPE_IN)], ZINC, true)
  for (let i = 0; i < BAYS; i++) {
    const c = (i + 0.5) * bw, yb = EAVE + 0.7, dep = -0.6
    rect(q, c - 0.7, c + 0.7, yb, yb + 1.5, dep, ZINC_HI)
    rect(q, c - 0.45, c + 0.45, yb + 0.15, yb + 1.3, dep + 0.03, GLASS)
    sheet(q, [F(c - 0.8, yb + 1.5, dep + 0.05), F(c + 0.8, yb + 1.5, dep + 0.05), F(c + 0.8, yb + 1.9, dep - 0.9), F(c - 0.8, yb + 1.9, dep - 0.9)], shade(ZINC, 0.75))
  }
}

function buildings(q: MeshBuilder, W: number, ring: P[]): void {
  const n = ring.length
  // front edge is ring[0]->ring[2] (straight); everything else is wall to the eave and a slate band to the top
  const inRing: P[] = ring.map((p, i) => i <= 2 ? [p[0], p[1] + SLOPE_IN] : p)
  inRing[0] = [0, SLOPE_IN]; inRing[1] = [ring[1][0], SLOPE_IN]; inRing[2] = [W, SLOPE_IN]
  for (let i = 2; i < n; i++) {
    const a = ring[i], b = ring[(i + 1) % n]
    wall(q, a, b, 0, BACK_EAVE, BACK)
    wall(q, a, b, BACK_EAVE, BACK_TOP, ZINC)
  }
  // the roof cap over the whole footprint, the front strip pulled back to the top of the slope
  const flat: number[] = []
  for (const p of inRing) flat.push(p[0], p[1])
  const idx = earcut(flat)
  const base = q.positions.length / 3
  for (const p of inRing) { q.positions.push(p[0], BACK_TOP, p[1]); q.normals.push(0, 1, 0); q.uvs.push(p[0] / 8, p[1] / 8); q.colors.push(ZINC_HI[0], ZINC_HI[1], ZINC_HI[2], FIXED) }
  for (let i = 0; i < idx.length; i += 3) q.indices.push(base + idx[i], base + idx[i + 2], base + idx[i + 1])
}

export const HOTEL_MERCY_ARGENTEAU_REFS = ['way/69220658']

export function hotelMercyArgenteau(out: MeshBuilder): void {
  const first = out.positions.length / 3
  const c = Math.cos(TURN), s = Math.sin(TURN)
  // the ring in the lot frame
  const ring: P[] = RING.map(([x, z]) => { const dx = x - ORIGIN[0], dz = z - ORIGIN[1]; return [dx * c + dz * s, -dx * s + dz * c] as P })
  const W = ring[2][0]
  const q = new MeshBuilder()
  buildings(q, W, ring)
  front(q, W)
  into(out, q, ORIGIN, c, s)
  for (let i = first; i < out.positions.length / 3; i++) out.positions[i * 3 + 1] += FLOOR
}
