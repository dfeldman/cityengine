/**
 * Coit Tower (Arthur Brown Jr. and Henry Howard, 1933; SF_PLAN.md §4), on the crest of Telegraph Hill, from
 * photographs (Wikimedia Commons: "Coit Memorial Tower 01"): 64 m of unpainted reinforced concrete, pale cream.
 *
 * - the **shaft**: sixteen-sided and fluted — flat faces alternating with shallow recessed ones — tapering a little,
 *   rising out of the low square building at its foot (the WPA murals are inside);
 * - at the top, **tall arched niches**, one to each of eight faces, with a balustrade across each sill; over them a
 *   row of small arched windows three to a face, and the **crown** of arched openings under a plain parapet: the
 *   observation gallery.
 *
 * Local frame: the shaft on the origin, the foot building's front toward −z.
 */
import type { MeshBuilder } from '../../buildings.ts'
import { box, type Rgb } from '../../models.ts'
import type { Fit } from '../fit.ts'

type V3 = [number, number, number]
const CONCRETE: Rgb = [0.6, 0.6, 0.58]   // grey-beige unpainted concrete (Commons 2022); 0.9/0.87/0.8 read cream-yellow (2026-10-16)
const SHADE: Rgb = [0.5, 0.5, 0.48]
const DARK: Rgb = [0.3, 0.3, 0.32]
/** the tall niches are open loggias in shadow, not holes: the concrete inside them, darker */
const NICHE: Rgb = [0.56, 0.53, 0.49]

const H = 64
const R0 = 5.8
const R1 = 5.2

function r(y: number): number { return R0 + (R1 - R0) * (y / H) }

/** A ring of `n` faces between y0 and y1; each face `inset` further in on every other one (the flutes). */
function shaft(out: MeshBuilder, y0: number, y1: number, n: number, flute: number, c: Rgb, c2: Rgb): void {
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2
    const a1 = ((i + 1) / n) * Math.PI * 2
    const am = (a0 + a1) / 2
    const k = i % 2 ? flute : 0
    const P = (a: number, y: number): V3 => [Math.sin(a) * (r(y) - k), y, Math.cos(a) * (r(y) - k)]
    out.quad([P(a0, y0), P(a1, y0), P(a1, y1), P(a0, y1)], [Math.sin(am), 0.02, Math.cos(am)], [[0, 0], [1, 0], [1, 1], [0, 1]], i % 2 ? c2 : c, 0)
    // the flute's cheeks, so the recess shows edge-on
    if (k > 0) {
      for (const a of [a0, a1]) {
        const o = (y: number): V3 => [Math.sin(a) * r(y), y, Math.cos(a) * r(y)]
        out.quad([o(y0), P(a, y0), P(a, y1), o(y1)], [Math.cos(a), 0, -Math.sin(a)], [[0, 0], [1, 0], [1, 1], [0, 1]], SHADE, 0)
      }
    }
  }
}

/** An arched opening on face `a` (angle), centred at height y, w wide and h tall, painted on the face. */
function arch(out: MeshBuilder, a: number, y: number, w: number, h: number, colour = DARK): void {
  const rr = r(y) + 0.02
  const cx = Math.sin(a) * rr
  const cz = Math.cos(a) * rr
  const tx = Math.cos(a)
  const tz = -Math.sin(a)
  const P = (u: number, v: number): V3 => [cx + tx * u, y + v, cz + tz * u]
  // the straight part and the round head, as a fan of slices
  const n = 6
  out.quad([P(-w / 2, -h / 2), P(w / 2, -h / 2), P(w / 2, h / 2 - w / 2), P(-w / 2, h / 2 - w / 2)], [Math.sin(a), 0, Math.cos(a)], [[0, 0], [1, 0], [1, 1], [0, 1]], colour, 0)
  for (let i = 0; i < n; i++) {
    const t0 = Math.PI - (i / n) * Math.PI
    const t1 = Math.PI - ((i + 1) / n) * Math.PI
    const c = h / 2 - w / 2
    out.quad([P(0, c), P((Math.cos(t0) * w) / 2, c + (Math.sin(t0) * w) / 2), P((Math.cos(t1) * w) / 2, c + (Math.sin(t1) * w) / 2), P(0, c)],
      [Math.sin(a), 0, Math.cos(a)], [[0, 0], [1, 0], [1, 1], [0, 1]], colour, 0)
  }
}

export function coitTower(out: MeshBuilder, fit?: Fit): void {
  // the building at its foot: two storeys, square, with the entrance portico
  const fx = Math.min(16, Math.max(11, (fit?.hx ?? 14)))
  const fz = Math.min(14, Math.max(10, (fit?.hz ?? 12)))
  box(out, 0, 4.5, 0, fx, 4.5, fz, CONCRETE, 0)
  box(out, 0, 9.3, 0, fx + 0.3, 0.3, fz + 0.3, SHADE, 0)
  box(out, 0, 3, -fz - 0.6, 3, 3, 0.6, SHADE, 0)
  box(out, 0, 2.4, -fz - 1.25, 1.4, 2.4, 0.05, DARK, 0)
  // the shaft, fluted, to the gallery
  shaft(out, 9, 48, 16, 0.35, CONCRETE, [0.66, 0.65, 0.62])
  // the gallery storey: plain, with its eight tall niches and their balustrades
  shaft(out, 48, 58, 8, 0, CONCRETE, CONCRETE)
  for (let i = 0; i < 8; i++) {
    const a = ((i + 0.5) / 8) * Math.PI * 2
    arch(out, a, 53, 2.6, 8.4, NICHE)
    const rr = r(49.2)
    box(out, Math.sin(a) * (rr + 0.25), 49.6, Math.cos(a) * (rr + 0.25), 1.5, 0.45, 0.2, SHADE, 0)
    // the small windows over each
    for (const u of [-1, 0, 1]) {
      const b = a + u * 0.14
      arch(out, b, 59.8, 0.55, 1.3)
    }
  }
  // the crown: the arched openings, the parapet over them
  shaft(out, 58, H - 0.8, 8, 0, CONCRETE, CONCRETE)
  for (let i = 0; i < 8; i++) arch(out, (i / 8) * Math.PI * 2, 61.4, 1.6, 2.6)
  shaft(out, H - 0.8, H, 16, 0, SHADE, SHADE)
  // the roof, flat
  const n = 16
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2
    const a1 = ((i + 1) / n) * Math.PI * 2
    out.quad([[Math.sin(a0) * r(H), H, Math.cos(a0) * r(H)], [Math.sin(a1) * r(H), H, Math.cos(a1) * r(H)], [0, H, 0], [0, H, 0]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], SHADE, 0)
  }
}
