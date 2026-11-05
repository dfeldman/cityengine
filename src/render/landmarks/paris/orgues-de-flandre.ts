import type { MeshBuilder } from '../../buildings.ts'
import { beam, hex, type Rgb } from '../kit.ts'
import { FIXED } from '../../models.ts'
import type { Fit } from '../fit.ts'

// tunables, read off the owner's photograph (2026-11-04)
const PODIUM_H = 4.0        // the low tiled podium
const STOREY = 2.8
const TIER_STOREYS = 3      // storeys per stepped tier
const STEP = 0.9            // each tier juts this much further out than the one below
const BAND_H = 0.9          // dark balcony band at each tier's foot
const SPANDREL_H = 0.5      // tan spandrel over the band
const HEX_BAY = 3.2         // one hexagonal window per this much wall
const HEX_R = 0.55
const STRIP_EVERY = 4       // every this-many bays a vertical strip of small windows
const GARDEN_H = 0.6        // planting mound on the roof terrace
const TAG_GLASS = 6, TAG_PANEL = 15

type P = { x: number; z: number }

/**
 * Les Orgues de Flandre (Martin van Treeck, 1974–80), av. de Flandre / rue Riquet: white-tiled towers that step
 * outward in tiers going up, dark balcony bands with tan spandrels, hexagonal windows and strips of small windows,
 * on a low tiled podium, with garden terraces on the roofs. One builder per tower way; storeys from fit height.
 */
export function orguesDeFlandre(out: MeshBuilder, fit: Fit): void {
  const tile = hex('#ecebe4'), band = hex('#2c2f33'), tan = hex('#c7a57a'), glass = hex('#334048')
  const podium = hex('#d8d4ca'), green = hex('#5d7a3e'), soffit = hex('#b9b6ae')
  const ring = footprint(fit)
  const cx = ring.reduce((s, p) => s + p.x, 0) / ring.length, cz = ring.reduce((s, p) => s + p.z, 0) / ring.length
  const H = Math.max(fit.height ?? 30, PODIUM_H + STOREY * TIER_STOREYS)
  const tiers = Math.max(1, Math.round((H - PODIUM_H) / (STOREY * TIER_STOREYS)))
  const tierH = (H - PODIUM_H) / tiers

  // podium on the full footprint
  edges(ring, (a, b, n) => wall(out, a, b, 0, PODIUM_H, n, podium, TAG_PANEL))
  // tiers: the bottom one is inset the most, so each tier overhangs the one below
  let prev = ring
  for (let t = 0; t < tiers; t++) {
    const r = ring.map(p => shrink(p, cx, cz, STEP * (tiers - t)))
    const y0 = PODIUM_H + t * tierH, y1 = y0 + tierH
    // the step's underside (or, at t=0, the podium's roof terrace)
    if (t === 0) { cap(out, ring, PODIUM_H, green) }
    else ringBand(out, r, prev, y0, soffit, -1)
    edges(r, (a, b, n, len) => {
      wall(out, a, b, y0, y0 + BAND_H, n, band, FIXED)
      wall(out, a, b, y0 + BAND_H, y0 + BAND_H + SPANDREL_H, n, tan, FIXED)
      wall(out, a, b, y0 + BAND_H + SPANDREL_H, y1, n, tile, TAG_PANEL)
      const ux = (b.x - a.x) / len, uz = (b.z - a.z) / len
      const bays = Math.max(1, Math.floor(len / HEX_BAY))
      for (let i = 0; i < bays; i++) {
        const p = lerp(a, b, (i + 0.5) / bays), o = { x: p.x + n[0] * 0.04, z: p.z + n[2] * 0.04 }
        const ys = y0 + BAND_H + SPANDREL_H
        if (i % STRIP_EVERY === STRIP_EVERY - 1) {
          // vertical strip of small windows
          for (let y = ys + 0.4; y + 0.7 < y1; y += 1.0) {
            const l = { x: o.x - ux * 0.3, z: o.z - uz * 0.3 }, rr = { x: o.x + ux * 0.3, z: o.z + uz * 0.3 }
            wall(out, l, rr, y, y + 0.6, n, glass, TAG_GLASS)
          }
        } else {
          for (let s = 0; s < TIER_STOREYS - 1; s++) {
            const yc = ys + (s + 0.6) * ((y1 - ys) / (TIER_STOREYS - 0.6))
            if (yc + HEX_R > y1) break
            hexWin(out, o, ux, uz, yc, n, glass)
          }
        }
      }
    })
    prev = r
  }
  cap(out, prev, H, tile)
  // roof garden: a planted mound inset from the parapet
  const g = prev.map(p => shrink(p, cx, cz, 1.2))
  edges(g, (a, b, n) => wall(out, a, b, H, H + GARDEN_H, n, green, FIXED))
  cap(out, g, H + GARDEN_H, green)
  // parapet rail
  edges(prev, (a, b) => beam(out, [a.x, H + 0.5, a.z], [b.x, H + 0.5, b.z], 0.06, tile))
}

/**
 * A plain brutalist slab of the Flandre/Riquet estates: raw concrete, storey bands and a regular window grid.
 */
export function flandreSlab(out: MeshBuilder, fit: Fit): void {
  const conc = hex('#a9a69e'), dark = hex('#2f3439'), sill = hex('#8e8b84')
  const ring = footprint(fit), H = fit.height ?? 20
  const storeys = Math.max(1, Math.round(H / STOREY)), sh = H / storeys
  cap(out, ring, H, conc)
  edges(ring, (a, b, n, len) => {
    wall(out, a, b, 0, H, n, conc, TAG_PANEL)
    const per = Math.max(1, Math.floor(len / 2.6)), ux = (b.x - a.x) / len, uz = (b.z - a.z) / len
    for (let s = 1; s < storeys; s++) {
      const y = s * sh
      const pa = { x: a.x + n[0] * 0.08, z: a.z + n[2] * 0.08 }, pb = { x: b.x + n[0] * 0.08, z: b.z + n[2] * 0.08 }
      beam(out, [pa.x, y, pa.z], [pb.x, y, pb.z], 0.12, sill, 0.16)
      for (let i = 0; i < per; i++) {
        const p = lerp(a, b, (i + 0.5) / per)
        const l = { x: p.x - ux * 0.65 + n[0] * 0.04, z: p.z - uz * 0.65 + n[2] * 0.04 }
        const r = { x: p.x + ux * 0.65 + n[0] * 0.04, z: p.z + uz * 0.65 + n[2] * 0.04 }
        wall(out, l, r, y + 0.4, y + sh - 0.5, n, dark, TAG_GLASS)
      }
    }
  })
}

function footprint(fit: Fit): P[] {
  return fit.ring && fit.ring.length >= 3 ? fit.ring : [
    { x: -fit.hx, z: -fit.hz }, { x: fit.hx, z: -fit.hz }, { x: fit.hx, z: fit.hz }, { x: -fit.hx, z: fit.hz }]
}
function hexWin(out: MeshBuilder, o: P, ux: number, uz: number, yc: number, n: [number, number, number], c: Rgb): void {
  const pts: [number, number, number][] = []
  for (let k = 0; k < 6; k++) {
    const a = Math.PI / 6 + k * Math.PI / 3, u = Math.cos(a) * HEX_R, v = Math.sin(a) * HEX_R
    pts.push([o.x + ux * u, yc + v, o.z + uz * u])
  }
  const c0: [number, number, number] = [o.x, yc, o.z]
  for (let k = 0; k < 6; k += 2) {
    const p = pts[k], q = pts[k + 1], r = pts[(k + 2) % 6]
    out.quad([c0, p, q, r], n, [[0, 0], [1, 0], [1, 1], [0, 1]], c, TAG_GLASS)
  }
}
/** The horizontal strip between two rings at height y (underside of an overhanging tier). */
function ringBand(out: MeshBuilder, outer: P[], inner: P[], y: number, c: Rgb, ny: number): void {
  for (let i = 0; i < outer.length; i++) {
    const j = (i + 1) % outer.length
    out.quad([[outer[i].x, y, outer[i].z], [outer[j].x, y, outer[j].z], [inner[j].x, y, inner[j].z], [inner[i].x, y, inner[i].z]],
      [0, ny, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], c, FIXED)
  }
}

function lerp(a: P, b: P, t: number): P { return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t } }
function shrink(p: P, cx: number, cz: number, d: number): P {
  const dx = cx - p.x, dz = cz - p.z, l = Math.hypot(dx, dz) || 1
  return { x: p.x + dx / l * Math.min(d, l * 0.5), z: p.z + dz / l * Math.min(d, l * 0.5) }
}
function side(a: P, b: P): [number, number, number] { const dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz) || 1; return [dz / l, 0, -dx / l] }
function neg(n: [number, number, number]): [number, number, number] { return [-n[0], -n[1], -n[2]] }
function edges(ring: P[], f: (a: P, b: P, n: [number, number, number], len: number) => void): void {
  const cx = ring.reduce((s, p) => s + p.x, 0) / ring.length, cz = ring.reduce((s, p) => s + p.z, 0) / ring.length
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], len = Math.hypot(b.x - a.x, b.z - a.z)
    if (len < 0.3) continue
    let n = side(a, b)
    if (n[0] * ((a.x + b.x) / 2 - cx) + n[2] * ((a.z + b.z) / 2 - cz) < 0) n = neg(n)
    f(a, b, n, len)
  }
}
function wall(out: MeshBuilder, a: P, b: P, y0: number, y1: number, n: [number, number, number], c: Rgb, tag: number): void {
  const w = Math.hypot(b.x - a.x, b.z - a.z), h = y1 - y0
  out.quad([[a.x, y0, a.z], [b.x, y0, b.z], [b.x, y1, b.z], [a.x, y1, a.z]], n, [[0, 0], [w, 0], [w, h], [0, h]], c, tag)
}
function cap(out: MeshBuilder, ring: P[], y: number, c: Rgb): void {
  const o = ring[0]
  for (let i = 1; i + 1 < ring.length; i++) {
    const p = ring[i], q = ring[i + 1]
    out.quad([[o.x, y, o.z], [p.x, y, p.z], [q.x, y, q.z], [q.x, y, q.z]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], c, FIXED)
  }
}

// modern infill towers: pale render, full-height glazed bays between thin white fins
const MOD_BAY = 3.0, MOD_FIN = 0.25, MOD_FIN_OUT = 0.35, MOD_CROWN = 1.2

/** The later towers round the Orgues: smooth pale panels, glazed bays, white fins, a recessed crown. */
export function flandreModern(out: MeshBuilder, fit: Fit): void {
  const panel = hex('#d9d4c8'), glass = hex('#3c4a55'), fin = hex('#f0eee8')
  const ring = footprint(fit), H = fit.height ?? 35
  const storeys = Math.max(1, Math.round(H / STOREY)), sh = H / storeys
  cap(out, ring, H, panel)
  edges(ring, (a, b, n, len) => {
    wall(out, a, b, 0, H, n, panel, TAG_PANEL)
    const per = Math.max(1, Math.floor(len / MOD_BAY)), ux = (b.x - a.x) / len, uz = (b.z - a.z) / len
    const w = len / per
    for (let i = 0; i < per; i++) {
      const p = lerp(a, b, (i + 0.5) / per)
      const l = { x: p.x - ux * (w / 2 - MOD_FIN) + n[0] * 0.04, z: p.z - uz * (w / 2 - MOD_FIN) + n[2] * 0.04 }
      const r = { x: p.x + ux * (w / 2 - MOD_FIN) + n[0] * 0.04, z: p.z + uz * (w / 2 - MOD_FIN) + n[2] * 0.04 }
      for (let s = 1; s < storeys - 1; s++) wall(out, l, r, s * sh + 0.15, (s + 1) * sh - 0.35, n, glass, TAG_GLASS)
      const f = lerp(a, b, i / per)
      if (i > 0) beam(out, [f.x + n[0] * MOD_FIN_OUT / 2, sh, f.z + n[2] * MOD_FIN_OUT / 2], [f.x + n[0] * MOD_FIN_OUT / 2, H - MOD_CROWN, f.z + n[2] * MOD_FIN_OUT / 2], MOD_FIN, fin, MOD_FIN_OUT)
    }
  })
}
