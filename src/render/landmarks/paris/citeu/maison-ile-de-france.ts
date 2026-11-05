/**
 * THE MAISON DE L'ÎLE-DE-FRANCE — ANMA (2017): a nine-storey block wrapped in folded champagne-metal panels (each
 * storey-high panel creased on a slant so the skin reads as faceted triangles catching the light), small square windows
 * scattered across it, chamfered corners, a fully glazed ground floor and a flat roof of solar panels (338 modules).
 * Refs: Commons "Maison de l'Île-de-France.jpg" (docs/landmarks/refs/citeu/ile-de-france/c1.jpg, 2026-11-04). Plan from
 * OSM way 631658185 (9 levels, building:material=metal). Front bearing 79: the long east face and its glazed lobby look
 * onto the campus footway and service road (OSM) toward the Maison de la Corée; the périphérique runs past the south.
 * Local frame: −z toward bearing 79 (the front), x toward bearing 169; origin the bbox centre.
 */
import { MeshBuilder, capPolygon } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { FIXED, type Rgb } from '../../../models.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { offsetRing } from '../../parts.ts'

const PANEL_A: Rgb = hex('#bab3a2'), PANEL_B: Rgb = hex('#989080'), GLASS: Rgb = hex('#2c3338')
const FRAME: Rgb = hex('#6d6658'), ROOF: Rgb = hex('#8e8f8b'), PV: Rgb = hex('#28303c'), SOFFIT: Rgb = hex('#7d776a')
const metal = surfaceTag('metal'), glass = surfaceTag('glass'), conc = surfaceTag('concrete')

const BEARING = 79
const GF = 4.5, FLOOR = 2.9, LEVELS = 8, PARAPET = 0.9
const PANEL_W = 2.6, FOLD = 0.22, CREASE = 0.35   // panel width, crease standout, crease slant (fraction of width)
const WIN_W = 1.1, WIN_H = 1.4, WIN_EVERY = 3        // about one window per WIN_EVERY panels
const PV_ROWS = 9, PV_TILT = 0.5, PV_INSET = 2.2

// OSM outline, east/north metres about the way's vertex mean
const EN: [number, number][] = [[-0.9, 25.1], [7.7, 22.8], [8.4, 19.5], [5.2, 2.9], [10.2, -23.5], [3.3, -24.7],
  [-12.0, -23.6], [-18.5, -21.1], [-3.3, 22.7]]
const CENTRE: [number, number] = [-4.15, 0.2]

type P2 = { x: number; z: number }
const b = BEARING * Math.PI / 180, F = [Math.sin(b), Math.cos(b)], R = [Math.cos(b), -Math.sin(b)]
function local(en: [number, number][]): P2[] {
  const out = en.map(([e, n]) => ({ x: (e - CENTRE[0]) * R[0] + (n - CENTRE[1]) * R[1], z: -((e - CENTRE[0]) * F[0] + (n - CENTRE[1]) * F[1]) }))
  let a = 0
  for (let i = 0; i < out.length; i++) { const p = out[i], q = out[(i + 1) % out.length]; a += p.x * q.z - q.x * p.z }
  return a < 0 ? out.reverse() : out          // wound so (tz, −tx) is outward
}

type V3 = [number, number, number]
function face(out: MeshBuilder, p: V3[], c: Rgb, tag: number): void {
  const u = [p[1][0] - p[0][0], p[1][1] - p[0][1], p[1][2] - p[0][2]], v = [p[3][0] - p[0][0], p[3][1] - p[0][1], p[3][2] - p[0][2]]
  const n: V3 = [v[1] * u[2] - v[2] * u[1], v[2] * u[0] - v[0] * u[2], v[0] * u[1] - v[1] * u[0]], l = Math.hypot(...n) || 1
  out.quad(p, [n[0] / l, n[1] / l, n[2] / l], [[0, 0], [1, 0], [1, 1], [0, 1]], c, tag)
}

/** a cheap deterministic hash in [0, 1) */
const hash = (i: number, j: number, k: number): number => { const s = Math.sin(i * 127.1 + j * 311.7 + k * 74.7) * 43758.5; return s - Math.floor(s) }

export function maisonIleDeFrance(out: MeshBuilder, fit: Fit): void {
  const g = fit.grade ?? 0, ring = local(EN), top = g + GF + LEVELS * FLOOR
  // the glazed ground floor, its mullions, and the soffit under the skin
  const gf = offsetRing(ring, -0.4)
  for (let i = 0; i < gf.length; i++) {
    const a = gf[i], q = gf[(i + 1) % gf.length], L = Math.hypot(q.x - a.x, q.z - a.z)
    if (L < 0.05) continue
    face(out, [[a.x, g - 0.3, a.z], [q.x, g - 0.3, q.z], [q.x, g + GF, q.z], [a.x, g + GF, a.z]], GLASS, glass)
    const tx = (q.x - a.x) / L, tz = (q.z - a.z) / L, n = Math.max(1, Math.round(L / 1.8))
    for (let k = 0; k <= n; k++) {
      const m = { x: a.x + (q.x - a.x) * k / n + tz * 0.05, z: a.z + (q.z - a.z) * k / n - tx * 0.05 }
      face(out, [[m.x - tx * 0.06, g, m.z - tz * 0.06], [m.x + tx * 0.06, g, m.z + tz * 0.06],
        [m.x + tx * 0.06, g + GF, m.z + tz * 0.06], [m.x - tx * 0.06, g + GF, m.z - tz * 0.06]], FRAME, FIXED)
    }
  }
  capPolygon(out, gf, g + GF - 0.01, SOFFIT, FIXED)
  // the folded skin: per edge, per storey, panels creased on a slant, the crease standing out by FOLD
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], q = ring[(i + 1) % ring.length], L = Math.hypot(q.x - a.x, q.z - a.z)
    if (L < 0.05) continue
    const tx = (q.x - a.x) / L, tz = (q.z - a.z) / L, nx = tz, nz = -tx, n = Math.max(1, Math.round(L / PANEL_W)), w = L / n
    const at = (s: number, d: number, y: number): V3 => [a.x + tx * s + nx * d, y, a.z + tz * s + nz * d]
    for (let f = 0; f < LEVELS; f++) {
      const y0 = g + GF + f * FLOOR, y1 = y0 + FLOOR
      for (let k = 0; k < n; k++) {
        const s0 = k * w, s1 = s0 + w, h = hash(i, f, k), flip = h < 0.5
        const cb = s0 + w * (flip ? 0.5 - CREASE / 2 : 0.5 + CREASE / 2), ct = s0 + w * (flip ? 0.5 + CREASE / 2 : 0.5 - CREASE / 2)
        const d = FOLD * (0.6 + 0.8 * hash(k, i, f))
        const [c1, c2] = flip ? [PANEL_A, PANEL_B] : [PANEL_B, PANEL_A]
        face(out, [at(s0, 0, y0), at(cb, d, y0), at(ct, d, y1), at(s0, 0, y1)], c1, metal)
        face(out, [at(cb, d, y0), at(s1, 0, y0), at(s1, 0, y1), at(ct, d, y1)], c2, metal)
        // a scattered square window, sat just proud of the fold
        if (w > WIN_W + 0.6 && hash(f, k, i + 9) < 1 / WIN_EVERY) {
          const sm = s0 + w * (0.3 + 0.4 * hash(i + 3, k, f)), wy = y0 + 0.9
          face(out, [at(sm - WIN_W / 2, d + 0.03, wy), at(sm + WIN_W / 2, d + 0.03, wy), at(sm + WIN_W / 2, d + 0.03, wy + WIN_H),
            at(sm - WIN_W / 2, d + 0.03, wy + WIN_H)], GLASS, glass)
        }
      }
    }
    // the parapet band over the skin
    face(out, [at(0, 0, top), at(L, 0, top), at(L, 0, top + PARAPET), at(0, 0, top + PARAPET)], PANEL_A, metal)
  }
  capPolygon(out, ring, top + PARAPET, ROOF, conc)
  // the solar panels: tilted rows across the roof, clipped to the inset ring's x/z box
  const inner = offsetRing(ring, -PV_INSET)
  const xs = inner.map(p => p.x), x0 = Math.min(...xs), x1 = Math.max(...xs)
  for (let r = 0; r < PV_ROWS; r++) {
    const x = x0 + (x1 - x0) * (r + 0.5) / PV_ROWS
    // the z span of the inset ring at this x
    const zs: number[] = []
    for (let i = 0; i < inner.length; i++) {
      const p = inner[i], q = inner[(i + 1) % inner.length]
      if ((p.x - x) * (q.x - x) <= 0 && p.x !== q.x) zs.push(p.z + (q.z - p.z) * (x - p.x) / (q.x - p.x))
    }
    if (zs.length < 2) continue
    const za = Math.min(...zs), zb = Math.max(...zs), y = top + PARAPET + 0.2
    face(out, [[x - 1, y, zb], [x - 1, y, za], [x + 0.6, y + PV_TILT * 1.6, za], [x + 0.6, y + PV_TILT * 1.6, zb]], PV, glass)
  }
}
