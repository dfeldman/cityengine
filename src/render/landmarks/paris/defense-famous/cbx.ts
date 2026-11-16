/**
 * TOUR CBX (ex-Dexia; Kohn Pedersen Fox with SRA, 2002–05; 142 m, 36 storeys), Courbevoie, on the Seine side of the Boulevard
 * Circulaire. One face straight, the other curved; the roof slopes up to a sharp prow (fr.wikipedia "Tour CBX": the sloping roof,
 * unusual in La Défense). Blue-green reflective glass with fine horizontal lines (Commons Tour_CBX_Juillet_2020.jpeg).
 * Heights: BD TOPO hauteur 130.8 (low edge of the roof) and Wikipedia 142 (the prow).
 * Also holds the small shaft helpers the other famous-tower files share.
 */
import { MeshBuilder, capPolygonWithHoles } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { edgeAt } from '../../parts.ts'
import { hex, type Rgb } from '../../kit.ts'
import { band, ccw, FIXED, walls, type P2 } from '../monuments/common.ts'
import { registerRing } from '../museums/enframe.ts'

// ---- tunables ----
const CBX_GLASS = '#79a6b4'  // blue-green glass with sky in it
const CBX_LINE = '#b9d3da'   // floor lines
const CBX_LOBBY = '#56656c'
const CBX_ROOF = '#9fb7bd'
const CBX_LOW = 130.8        // roof at the low end (BD TOPO)
const CBX_HIGH = 142         // the prow (Wikipedia)
const CBX_LOBBY_H = 8
const CBX_FLOOR = 3.8

// ---- the Passerelle des Reflets (OSM way/640083293, covered pedestrian bridge) runs clean through the tower's foot ----
const PASS_A: [number, number] = [2.2, 21.2]    // E/N metres about 48.8910 N, 2.2468 E: the way's two ends
const PASS_B: [number, number] = [-8.8, -2.2]
const PASS_W = 6.0           // clear width of the cut, metres
const PASS_H = 4.6           // clear height above the walkway deck
const PASS_DECK_ABOVE = 0    // the walkway deck above the ground fit.groundAt gives at the middle of the cut
const PASS_EXT = 4           // the line is run this far past each end so it always crosses the walls
const PASS_LINING = '#262c30'
const PASS_SOFFIT = '#3c4448'
/** OSM way/82467028's ring in the same E/N frame, for registerRing */
const CBX_EN: P2e[] = [[-27.7, 48.4], [-29.1, 46.1], [-30.9, 42.3], [-32.4, 38.1], [-33.3, 32.7], [-33.4, 27.8], [-32.2, 20.7], [-29.0, 13.3], [-25.3, 7.4], [-18.1, 1.7], [-10.7, -1.6], [-4.6, -2.6], [20.8, -3.3], [29.8, -3.5], [23.6, 2.3], [4.9, 18.2], [-3.1, 25.6]]
type P2e = [number, number]
/** the cut, in the builder's local x/z, with its two ends and floor/ceiling heights above the base */
export interface Cut { a: P2; b: P2; half: number; yBot: number; yTop: number }

function cutOf(fit: Fit, grade: number): Cut {
  const F = registerRing(CBX_EN, fit)
  const A = F.xz(...PASS_A), B = F.xz(...PASS_B)
  const L = Math.hypot(B.x - A.x, B.z - A.z), ux = (B.x - A.x) / L, uz = (B.z - A.z) / L
  const mid = { x: (A.x + B.x) / 2, z: (A.z + B.z) / 2 }
  const yBot = (fit.groundAt?.(mid.x, mid.z) ?? grade) + PASS_DECK_ABOVE
  return { a: { x: A.x - ux * PASS_EXT, z: A.z - uz * PASS_EXT }, b: { x: B.x + ux * PASS_EXT, z: B.z + uz * PASS_EXT }, half: PASS_W / 2, yBot, yTop: yBot + PASS_H }
}

/** where the cut's centreline crosses the ring's edges: parameter along the cut, edge index and distance along the edge */
function crossings(r: P2[], c: Cut): { t: number; i: number; s: number; sinA: number }[] {
  const dx = c.b.x - c.a.x, dz = c.b.z - c.a.z, out: { t: number; i: number; s: number; sinA: number }[] = []
  for (let i = 0; i < r.length; i++) {
    const p = r[i], q = r[(i + 1) % r.length], ex = q.x - p.x, ez = q.z - p.z, L = Math.hypot(ex, ez)
    const den = dx * ez - dz * ex
    if (Math.abs(den) < 1e-9 || L < 0.01) continue
    const t = ((p.x - c.a.x) * ez - (p.z - c.a.z) * ex) / den, u = ((p.x - c.a.x) * dz - (p.z - c.a.z) * dx) / den
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) out.push({ t, i, s: u * L, sinA: Math.abs(den) / (L * Math.hypot(dx, dz)) })
  }
  return out
}

/** walls of a ring from ya to yb, with the cut's mouths left open (piers each side, a lintel over) */
function cutWalls(out: MeshBuilder, plan: P2[], ya: number, yb: number, col: Rgb, c: Cut): void {
  const r = ccw(plan), X = crossings(r, c)
  const quad = (p: P2, q: P2, lo: number, hi: number, n: P2): void => { if (hi - lo > 0.01) out.quad([[p.x, lo, p.z], [q.x, lo, q.z], [q.x, hi, q.z], [p.x, hi, p.z]], [n.x, 0, n.z], UV4, col, FIXED) }
  for (let i = 0; i < r.length; i++) {
    const p = r[i], q = r[(i + 1) % r.length], L = Math.hypot(q.x - p.x, q.z - p.z)
    if (L < 0.01) continue
    const ex = (q.x - p.x) / L, ez = (q.z - p.z) / L, n = { x: ez, z: -ex }
    const at = (s: number): P2 => ({ x: p.x + ex * s, z: p.z + ez * s })
    const m = X.find((k) => k.i === i)
    if (!m) { quad(p, q, ya, yb, n); continue }
    const h = c.half / Math.max(0.15, m.sinA), s0 = Math.max(0, m.s - h), s1 = Math.min(L, m.s + h)
    quad(p, at(s0), ya, yb, n); quad(at(s1), q, ya, yb, n)
    quad(at(s0), at(s1), ya, Math.min(yb, c.yBot), n); quad(at(s0), at(s1), Math.max(ya, c.yTop), yb, n)
  }
}
const UV4: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

/** the tunnel itself between the two walls it opens in: dark side linings and a soffit, so it reads as a passage from bike level */
function lining(out: MeshBuilder, plan: P2[], c: Cut): void {
  const X = crossings(ccw(plan), c).sort((a, b) => a.t - b.t)
  if (X.length < 2) return
  const t0 = X[0].t, t1 = X[X.length - 1].t, dx = c.b.x - c.a.x, dz = c.b.z - c.a.z, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L
  const P = (t: number, o: number): P2 => ({ x: c.a.x + dx * t - uz * o, z: c.a.z + dz * t + ux * o })
  const side = hex(PASS_LINING), roof = hex(PASS_SOFFIT)
  for (const sgn of [1, -1]) {
    const a = P(t0, sgn * c.half), b = P(t1, sgn * c.half), n: [number, number, number] = [uz * sgn * -1, 0, ux * sgn]
    out.quad([[a.x, c.yBot, a.z], [b.x, c.yBot, b.z], [b.x, c.yTop, b.z], [a.x, c.yTop, a.z]], n, UV4, side, FIXED)
    out.quad([[b.x, c.yBot, b.z], [a.x, c.yBot, a.z], [a.x, c.yTop, a.z], [b.x, c.yTop, b.z]], [-n[0], 0, -n[2]], UV4, side, FIXED)
  }
  const q = [P(t0, c.half), P(t1, c.half), P(t1, -c.half), P(t0, -c.half)]
  out.quad(q.map((p) => [p.x, c.yTop, p.z] as [number, number, number]), [0, -1, 0], UV4, roof, FIXED)
  out.quad(q.map((p) => [p.x, c.yTop, p.z] as [number, number, number]).reverse(), [0, -1, 0], UV4, roof, FIXED)
}

export function footRing(fit: Fit): P2[] {
  return ccw(fit.ring && fit.ring.length >= 3 ? fit.ring : [{ x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }])
}

/** a ring shrunk toward its centroid by k (0..1) */
export function shrink(r: P2[], k: number): P2[] {
  const cx = r.reduce((s, p) => s + p.x, 0) / r.length
  const cz = r.reduce((s, p) => s + p.z, 0) / r.length
  return r.map((p) => ({ x: cx + (p.x - cx) * k, z: cz + (p.z - cz) * k }))
}

/** Sutherland–Hodgman clip of a ring to the side s·x ≤ s·x0 */
export function clipX(r: P2[], x0: number, s: 1 | -1): P2[] {
  const o: P2[] = []
  const inside = (p: P2): boolean => s * p.x <= s * x0
  for (let i = 0; i < r.length; i++) {
    const a = r[i]
    const b = r[(i + 1) % r.length]
    if (inside(a)) o.push(a)
    if (inside(a) !== inside(b)) {
      const t = (x0 - a.x) / (b.x - a.x)
      o.push({ x: x0, z: a.z + (b.z - a.z) * t })
    }
  }
  return o
}

/** a curtain-wall shaft: lobby glass, the shaft, a thin projecting line at every `floor` */
export function shaft(out: MeshBuilder, r: P2[], y0: number, y1: number, glass: Rgb, line: Rgb, floor: number, lobby?: Rgb, lobbyH = 0, cut?: Cut): void {
  const W = (plan: P2[], ya: number, yb: number, c: Rgb): void => { if (cut) cutWalls(out, plan, ya, yb, c, cut); else walls(out, plan, ya, yb, c) }
  if (lobby && lobbyH > 0) W(shrink(r, 0.96), y0, y0 + lobbyH, lobby)
  W(r, y0 + lobbyH, y1, glass)
  if (cut && lobby && lobbyH > 0) lining(out, shrink(r, 0.96), cut)
  for (let y = y0 + lobbyH + floor; y < y1 - 0.5; y += floor) band(out, r, y, 0.25, 0.08, line)
}

/** a roof cap whose height runs linearly along local x from yLo (min x) to yHi (max x); walls up to it */
export function slopedTop(out: MeshBuilder, r: P2[], y0: number, yLo: number, yHi: number, wall: Rgb, roof: Rgb): void {
  const xs = r.map((p) => p.x)
  const a = Math.min(...xs)
  const b = Math.max(...xs)
  const h = (x: number): number => yLo + ((x - a) / (b - a || 1)) * (yHi - yLo)
  for (let i = 0; i < r.length; i++) {
    const e = edgeAt(r, i)
    const p = e.a
    const q = e.b
    out.quad([[p.x, y0, p.z], [q.x, y0, q.z], [q.x, h(q.x), q.z], [p.x, h(p.x), p.z]], [e.nx, 0, e.nz], [[0, 0], [1, 0], [1, 1], [0, 1]], wall, FIXED)
  }
  const tmp = new MeshBuilder()
  capPolygonWithHoles(tmp, [r], 0, roof, FIXED)
  const base = out.positions.length / 3
  for (let i = 0; i < tmp.positions.length; i += 3) tmp.positions[i + 1] = h(tmp.positions[i])
  const n = (yHi - yLo) / (b - a || 1)
  const l = Math.hypot(n, 1)
  for (let i = 0; i < tmp.normals.length; i += 3) { tmp.normals[i] = -n / l; tmp.normals[i + 1] = 1 / l; tmp.normals[i + 2] = 0 }
  out.positions.push(...tmp.positions)
  out.normals.push(...tmp.normals)
  out.colors.push(...tmp.colors)
  out.uvs.push(...tmp.uvs)
  for (const ix of tmp.indices) out.indices.push(ix + base)
}

export function cbx(out: MeshBuilder, fit: Fit): void {
  const r = footRing(fit)
  const g = fit.grade ?? 0
  const cut = cutOf(fit, g)
  cut.yTop = Math.min(cut.yTop, g + CBX_LOBBY_H - 0.3) // the cut stays inside the lobby storey
  shaft(out, r, 0, g + CBX_LOW - 0.5, hex(CBX_GLASS), hex(CBX_LINE), CBX_FLOOR, hex(CBX_LOBBY), g + CBX_LOBBY_H, cut)
  slopedTop(out, r, g + CBX_LOW - 0.5, g + CBX_LOW, g + CBX_HIGH, hex(CBX_GLASS), hex(CBX_ROOF))
}
