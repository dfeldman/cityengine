/**
 * TOUR SAINT-GOBAIN (ex-M2; Valode & Pistre, 2019), Courbevoie, on the Boulevard Circulaire. 167.5 m from the parvis,
 * 178 m from the street (fr.wikipedia "Tour Saint-Gobain"). Reference: fr.wikipedia "Tour Saint Gobain Mai 2020.jpeg"
 * (finished): a pale sky-blue glass shaft laced with white diagonal fins sloping across every face, one face cut by
 * a tall slot of stacked sawtooth loggias, and on top a near-transparent glass cage (the winter-garden crown, ~8
 * floors) overhanging the shaft on a white sloping beam. IGN LiDAR MNS (2026-11-16, ground 37.75 NGF): shaft roof
 * slopes 133 -> 140 m across the plan, cage top 159 -> 173 m.
 * Shading is per face (normal-based), no noise.
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
const SG_GLASS = '#c6dbe9'      // shaft: pale sky-blue double skin
const SG_CAGE = '#eef4f7'       // crown cage: clear glass, nearly white against the sky
const SG_CORE = '#aab7be'       // floors/core seen through the cage
const SG_FIN = '#f4f6f6'        // white diagonal fins, beams, posts
const SG_SLOT = '#7d8f9a'       // the loggia slot's shadowed recess
const SG_LOBBY = '#6d808a'
const SG_ROOF = '#9aa3a8'
const SG_LOBBY_H = 9
const SG_SHAFT_LO = 133         // MNS: shaft roof, low and high ends
const SG_SHAFT_HI = 140
const SG_SLOPE_DIR = 1          // +1: roof rises toward local +x; -1 the reverse
const SG_CAGE_H = 33            // cage height above the shaft roof (MNS 173 at the high end)
const SG_CAGE_OUT = 2.2         // cage overhang
const SG_CORE_H = 24            // inner floors' height in the cage
const SG_BEAM = 2.2             // white beam under the cage
const SG_FIN_GAP = 4.2          // vertical spacing of the diagonal fins
const SG_FIN_SLOPE = 0.32       // rise per metre along the face
const SG_FIN_W = 0.7
const SG_SLOT_FACE = 0          // which face carries the loggia slot
const SG_SLOT_T = 0.3           // slot centre along that face (0..1)
const SG_SLOT_W = 5
const SG_SLOT_STEP = 8.4        // sawtooth loggia pitch
const SG_POSTS = 6              // cage mullion posts per face

function quadN(out: MeshBuilder, v: V3[], base: Rgb, cx: number, cz: number, kind = GLASS): void {
  const [a, b, c] = v
  const u: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], w: V3 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
  let n: V3 = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]]
  const L = Math.hypot(...n) || 1; n = [n[0] / L, n[1] / L, n[2] / L]
  const mx = (a[0] + c[0]) / 2 - cx, mz = (a[2] + c[2]) / 2 - cz
  if (Math.abs(n[1]) < 0.9 && n[0] * mx + n[2] * mz < 0) n = [-n[0], -n[1], -n[2]]
  if (Math.abs(n[1]) >= 0.9 && n[1] < 0) n = [-n[0], -n[1], -n[2]]
  const tone = 0.86 + 0.12 * (n[0] * -0.6 + n[2] * 0.8) + 0.12 * n[1]
  out.quad(v.length === 3 ? [a, b, c, c] : v as [V3, V3, V3, V3], n, UV, shade(base, tone), kind)
}

export function saintGobain(out: MeshBuilder, fit: Fit): void {
  const r = towerRing(fit)
  let cx = 0, cz = 0
  for (const p of r) { cx += p.x / r.length; cz += p.z / r.length }
  let minX = 1e9, maxX = -1e9
  for (const p of r) { minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x) }
  const roofAt = (p: P): number => {
    const s = (p.x - minX) / (maxX - minX || 1)
    return SG_SHAFT_LO + (SG_SHAFT_HI - SG_SHAFT_LO) * (SG_SLOPE_DIR > 0 ? s : 1 - s)
  }
  const grow = (ring: P[], k: number): P[] => ring.map((p) => { const dx = p.x - cx, dz = p.z - cz, d = Math.hypot(dx, dz) || 1; return { x: p.x + dx / d * k, z: p.z + dz / d * k } })
  const glass = hex(SG_GLASS), fin = hex(SG_FIN)

  // lobby: inset darker glass under a white soffit
  const lob = grow(r, -1.5)
  for (let i = 0; i < lob.length; i++) {
    const a = lob[i], b = lob[(i + 1) % lob.length]
    quadN(out, [[a.x, 0, a.z], [b.x, 0, b.z], [b.x, SG_LOBBY_H, b.z], [a.x, SG_LOBBY_H, a.z]], hex(SG_LOBBY), cx, cz)
  }
  capPolygon(out, r, SG_LOBBY_H, fin, 0)

  // shaft faces, fins, slot
  for (let i = 0; i < r.length; i++) {
    const a = r[i], b = r[(i + 1) % r.length], L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L < 0.5) continue
    const ta = roofAt(a), tb = roofAt(b)
    quadN(out, [[a.x, SG_LOBBY_H, a.z], [b.x, SG_LOBBY_H, b.z], [b.x, tb, b.z], [a.x, ta, a.z]], glass, cx, cz)
    const nx = (b.z - a.z) / L, nz = -(b.x - a.x) / L
    const sgn = nx * ((a.x + b.x) / 2 - cx) + nz * ((a.z + b.z) / 2 - cz) > 0 ? 1 : -1
    const at = (t: number, y: number, off: number): V3 => [a.x + (b.x - a.x) * t + nx * sgn * off, y, a.z + (b.z - a.z) * t + nz * sgn * off]
    const top = Math.min(ta, tb) - 1.5, rise = L * SG_FIN_SLOPE
    // diagonal fins: parallel strips climbing along the face, clipped to the shaft
    for (let y = SG_LOBBY_H - rise; y < top; y += SG_FIN_GAP) {
      let t0 = 0, t1 = 1
      if (y < SG_LOBBY_H) t0 = (SG_LOBBY_H - y) / rise
      if (y + rise > top) t1 = (top - y) / rise
      if (t1 - t0 < 0.02) continue
      const y0 = y + rise * t0, y1 = y + rise * t1
      quadN(out, [at(t0, y0, 0.15), at(t1, y1, 0.15), at(t1, y1 + SG_FIN_W, 0.15), at(t0, y0 + SG_FIN_W, 0.15)], fin, cx, cz, METAL)
    }
    if (i === SG_SLOT_FACE % r.length) {
      const hw = SG_SLOT_W / 2 / L, s0 = SG_SLOT_T - hw, s1 = SG_SLOT_T + hw
      quadN(out, [at(s0, SG_LOBBY_H + 20, 0.25), at(s1, SG_LOBBY_H + 20, 0.25), at(s1, top - 6, 0.25), at(s0, top - 6, 0.25)], hex(SG_SLOT), cx, cz)
      for (let y = SG_LOBBY_H + 20; y < top - 6 - SG_SLOT_STEP; y += SG_SLOT_STEP) {
        // a white sawtooth ledge: wide at the slot's far side, tapering to a point
        quadN(out, [at(s0, y + SG_SLOT_STEP * 0.85, 0.35), at(s1, y, 0.35), at(s1, y + 0.6, 0.35)], fin, cx, cz, METAL)
        quadN(out, [at(s0, y + SG_SLOT_STEP * 0.85, 0.35), at(s1, y + 0.6, 0.35), at(s0, y + SG_SLOT_STEP * 0.85 + 0.6, 0.35)], fin, cx, cz, METAL)
      }
    }
  }

  // crown: white sloping beam, glass cage overhanging the shaft, the inner floors seen through it
  const cg = grow(r, SG_CAGE_OUT), cage = hex(SG_CAGE)
  for (let i = 0; i < cg.length; i++) {
    const a = cg[i], b = cg[(i + 1) % cg.length]
    const ra = roofAt(r[i]), rb = roofAt(r[(i + 1) % r.length])
    quadN(out, [[a.x, ra - SG_BEAM, a.z], [b.x, rb - SG_BEAM, b.z], [b.x, rb, b.z], [a.x, ra, a.z]], fin, cx, cz, METAL)
    quadN(out, [[a.x, ra, a.z], [b.x, rb, b.z], [b.x, rb + SG_CAGE_H, b.z], [a.x, ra + SG_CAGE_H, a.z]], cage, cx, cz)
    for (let k = 0; k <= SG_POSTS; k++) {
      const t = k / SG_POSTS, px = a.x + (b.x - a.x) * t, pz = a.z + (b.z - a.z) * t, y = ra + (rb - ra) * t
      const dx = (b.x - a.x), dz = (b.z - a.z), L = Math.hypot(dx, dz) || 1, w = (k === 0 || k === SG_POSTS ? 0.6 : 0.25) / L
      const ox = (px - cx) * 0.004, oz = (pz - cz) * 0.004
      quadN(out, [[px - dx * w + ox, y, pz - dz * w + oz], [px + dx * w + ox, y, pz + dz * w + oz], [px + dx * w + ox, y + SG_CAGE_H, pz + dz * w + oz], [px - dx * w + ox, y + SG_CAGE_H, pz - dz * w + oz]], fin, cx, cz, METAL)
    }
    // a white transom band mid-cage
    const m = SG_CAGE_H * 0.42
    quadN(out, [[a.x, ra + m, a.z], [b.x, rb + m, b.z], [b.x, rb + m + 1.2, b.z], [a.x, ra + m + 1.2, a.z]], fin, cx, cz, METAL)
  }
  const core = grow(r, -2.5)
  for (let i = 0; i < core.length; i++) {
    const a = core[i], b = core[(i + 1) % core.length]
    const ra = roofAt(a), rb = roofAt(b)
    quadN(out, [[a.x, ra, a.z], [b.x, rb, b.z], [b.x, rb + SG_CORE_H, b.z], [a.x, ra + SG_CORE_H, a.z]], hex(SG_CORE), cx, cz)
  }
  // sloped cage roof: a fan from the centre
  const yc = (SG_SHAFT_LO + SG_SHAFT_HI) / 2 + SG_CAGE_H
  for (let i = 0; i < cg.length; i++) {
    const a = cg[i], b = cg[(i + 1) % cg.length]
    quadN(out, [[a.x, roofAt(r[i]) + SG_CAGE_H, a.z], [b.x, roofAt(r[(i + 1) % r.length]) + SG_CAGE_H, b.z], [cx, yc, cz]], hex(SG_ROOF), cx, cz, METAL)
  }
}
