/**
 * HEKLA (Jean Nouvel, 2022; 220 m), at the Puteaux edge of La Défense on the Boulevard Circulaire. A crystal, not a
 * box: each face is two big flat triangles creased along one diagonal running the full height of the shaft (Commons,
 * "Photo tour Hekla janvier 2022.jpg": the long diagonal crease up the face; "Hekla Tower in construction -
 * 2021-07-31.jpg": the triangles leaning in and out). Corners lean alternately out and in between foot and top, so
 * the planes fold and the silhouette changes with angle. The crown, the "volcano", is planes cut at steep angles up to
 * one tall prow. Pale silvery glass, white crease ribs, a tall glass lobby at the foot.
 * Shading is per plane: each triangle's tone comes from its own normal, uniform across the face.
 */
import { capPolygon, type MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { hex, shade, type Rgb } from '../../kit.ts'
import { towerRing } from '../../tower.ts'

type P = { x: number; z: number }
type V3 = [number, number, number]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const GLASS = surfaceTag('glass')
const METAL = surfaceTag('metal')

// tunables
const HK_HEIGHT = 220
const HK_GLASS = '#c6d5de'      // silvery sky-reflecting glass
const HK_RIB = '#f0f2f0'        // white crease ribs
const HK_LOBBY = '#5d6f78'      // the lobby's clear glass, interior showing
const HK_ROOF = '#8a9398'
const HK_LOBBY_H = 16           // the tall lobby
const HK_LEAN = 4.5             // corner lean, m: out at the foot / in at the top, alternating corners
const HK_CROWN = 42             // crown: from the shaft top to the prow
const HK_CROWN_LOW = 0.25       // the low corners' share of the crown height
const HK_NOTCH = 0.55           // the notch corner (opposite the prow) share
const HK_CROWN_PULL = 0.18      // the crown's planes draw inward
const HK_RIB_W = 0.7

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
function tri(out: MeshBuilder, a: V3, b: V3, c: V3, base: Rgb, cx: number, cz: number, kind = GLASS): void {
  const u = sub(b, a), v = sub(c, a)
  let n: V3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
  const L = Math.hypot(...n) || 1; n = [n[0] / L, n[1] / L, n[2] / L]
  const mx = (a[0] + b[0] + c[0]) / 3 - cx, mz = (a[2] + b[2] + c[2]) / 3 - cz
  if (n[0] * mx + n[2] * mz < 0) n = [-n[0], -n[1], -n[2]]
  // per-plane tone: lit from the south-west sky, brighter as it tilts up
  const tone = 0.82 + 0.14 * (n[0] * -0.6 + n[2] * 0.8) + 0.25 * n[1]
  out.quad([a, b, c, c], n, UV, shade(base, tone), kind)
}
function rib(out: MeshBuilder, a: V3, b: V3, cx: number, cz: number, col: Rgb): void {
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2]
  const ox = (a[0] + b[0]) / 2 - cx, oz = (a[2] + b[2]) / 2 - cz, ol = Math.hypot(ox, oz) || 1
  const n: V3 = [ox / ol, 0, oz / ol]
  // width across the rib, in the face (perpendicular to the rib and the outward normal)
  let wx = dy * n[2] - dz * n[1], wy = dz * n[0] - dx * n[2], wz = dx * n[1] - dy * n[0]
  const wl = Math.hypot(wx, wy, wz) || 1; const s = HK_RIB_W / 2 / wl; wx *= s; wy *= s; wz *= s
  const o = 0.15
  const A: V3 = [a[0] + n[0] * o, a[1], a[2] + n[2] * o], B: V3 = [b[0] + n[0] * o, b[1], b[2] + n[2] * o]
  out.quad([[A[0] - wx, A[1] - wy, A[2] - wz], [B[0] - wx, B[1] - wy, B[2] - wz], [B[0] + wx, B[1] + wy, B[2] + wz], [A[0] + wx, A[1] + wy, A[2] + wz]], n, UV, col, METAL)
}

export function hekla(out: MeshBuilder, fit: Fit): void {
  const r = towerRing(fit)
  const H = fit.height > 150 && fit.height < 280 ? fit.height : HK_HEIGHT
  let cx = 0, cz = 0
  for (const p of r) { cx += p.x / r.length; cz += p.z / r.length }
  const push = (p: P, k: number): P => { const dx = p.x - cx, dz = p.z - cz, d = Math.hypot(dx, dz) || 1; return { x: p.x + dx / d * k, z: p.z + dz / d * k } }
  const y0 = HK_LOBBY_H, y1 = H - HK_CROWN
  // alternating corners: out at the foot and in at the top, or the reverse
  const foot = r.map((p, i) => push(p, i % 2 ? -HK_LEAN * 0.5 : HK_LEAN * 0.5))
  const head = r.map((p, i) => push(p, i % 2 ? HK_LEAN * 0.5 : -HK_LEAN * 0.5))
  const glass = hex(HK_GLASS), ribc = hex(HK_RIB)

  // lobby: inset glass box with white mullions, a white soffit above
  const lob = foot.map((p) => ({ x: cx + (p.x - cx) * 0.93, z: cz + (p.z - cz) * 0.93 }))
  band(out, lob, 0, y0, hex(HK_LOBBY), 6, ribc)
  capPolygon(out, foot, y0, ribc, 0)

  // shaft: each face two flat triangles, creased on one diagonal (alternating per face)
  for (let i = 0; i < r.length; i++) {
    const j = (i + 1) % r.length
    const a: V3 = [foot[i].x, y0, foot[i].z], b: V3 = [foot[j].x, y0, foot[j].z]
    const c: V3 = [head[j].x, y1, head[j].z], d: V3 = [head[i].x, y1, head[i].z]
    if (i % 2) { tri(out, a, b, c, glass, cx, cz); tri(out, a, c, d, glass, cx, cz); rib(out, a, c, cx, cz, ribc) }
    else { tri(out, a, b, d, glass, cx, cz); tri(out, b, c, d, glass, cx, cz); rib(out, b, d, cx, cz, ribc) }
    rib(out, a, d, cx, cz, ribc)
  }

  // crown: steep planes up to the prow (the head corner farthest from the centre), a notch opposite it
  let prow = 0, far = 0
  head.forEach((p, k) => { const dd = Math.hypot(p.x - cx, p.z - cz); if (dd > far) { far = dd; prow = k } })
  const ax = (head[prow].x - cx) / far, az = (head[prow].z - cz) / far
  let notch = 0, low = 1e9
  head.forEach((p, k) => { const s = (p.x - cx) * ax + (p.z - cz) * az; if (s < low) { low = s; notch = k } })
  const top: V3[] = head.map((p, k) => {
    const share = k === prow ? 1 : k === notch ? HK_NOTCH : HK_CROWN_LOW + (1 - HK_CROWN_LOW) * 0.5 * (1 + ((p.x - cx) * ax + (p.z - cz) * az) / far) * 0.6
    const pull = k === prow ? 0.04 : HK_CROWN_PULL
    return [p.x + (cx - p.x) * pull, y1 + HK_CROWN * share, p.z + (cz - p.z) * pull]
  })
  for (let i = 0; i < head.length; i++) {
    const j = (i + 1) % head.length
    const a: V3 = [head[i].x, y1, head[i].z], b: V3 = [head[j].x, y1, head[j].z]
    tri(out, a, b, top[j], glass, cx, cz); tri(out, a, top[j], top[i], glass, cx, cz)
    rib(out, top[i], top[j], cx, cz, ribc)
  }
  // the roof inside the crown: planes from the top corners to the prow's foot-of-spire
  const apex = top[prow]
  const inner: V3 = [cx + (apex[0] - cx) * 0.3, y1 + HK_CROWN * 0.45, cz + (apex[2] - cz) * 0.3]
  for (let i = 0; i < top.length; i++) {
    const j = (i + 1) % top.length
    if (i === prow || j === prow) { tri(out, top[i], top[j], inner, shade(glass, 0.95), cx, cz); continue }
    tri(out, top[i], top[j], inner, hex(HK_ROOF), cx, cz, METAL)
  }
}

function band(out: MeshBuilder, r: P[], y0: number, y1: number, col: Rgb, every: number, mull: Rgb): void {
  for (let i = 0; i < r.length; i++) {
    const a = r[i], b = r[(i + 1) % r.length], L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L < 0.1) continue
    const nv: V3 = [(b.z - a.z) / L, 0, -(b.x - a.x) / L]
    out.quad([[a.x, y0, a.z], [b.x, y0, b.z], [b.x, y1, b.z], [a.x, y1, a.z]], nv, UV, col, GLASS)
    const m = Math.max(1, Math.round(L / every))
    for (let f = 0; f <= m; f++) {
      const u = f / m, x = a.x + (b.x - a.x) * u + nv[0] * 0.1, z = a.z + (b.z - a.z) * u + nv[2] * 0.1
      const tx = -nv[2] * 0.2, tz = nv[0] * 0.2
      out.quad([[x - tx, y0, z - tz], [x + tx, y0, z + tz], [x + tx, y1, z + tz], [x - tx, y1, z - tz]], nv, UV, mull, METAL)
    }
  }
}
