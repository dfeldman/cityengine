/**
 * THE SOUTH GATE of the Japanese Tea Garden — the single-storey wall gate at the garden's south-west corner, on
 * Hagiwara Tea Garden Drive by the pagoda (not in OSM: placed by point where footway way/959594553 leaves the garden's
 * ring at its south-west corner node). Evidence pack: docs/sf-batches/MODEL-TEA-GARDEN-SOUTH-GATE.md — the owner's
 * photograph, 2026-10-27: "this is the south gate (a lower priority)". One of the 1915 Panama-Pacific fair's three
 * Japanese buildings here, with the Temple Gate and the pagoda.
 *
 * A roofed wall gate (yakuimon): two square dark MAIN POSTS on the wall line with a rear post behind each; the DOUBLE
 * DOORS closed between them — silver-grey weathered boards above a diagonal-lattice panel; a TRANSOM of three carved
 * openwork panels under the dark lintel; a row of bracket arms under the EAVE, whose rafters end in WHITE CAPS in two
 * rows along a thick thatch fascia; a hipped THATCH ROOF, dark brown, the corners curling up, under a grey metal ridge
 * cap. The FLANKING WALLS run out each side on the posts' line: a stone plinth, a silver lattice band along the foot,
 * dark rails, cream plaster, and a thatched coping with its own grey cap, stepping with the ground (Fit.groundAt).
 *
 * Local frame: y up; the PASSAGE along z (the street at −z), the walls and the ridge along x. Built in metres (the
 * doors 3 m tall, the ridge about 7 m) and scaled to HEIGHT at the end.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { strut, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { B, Q, type P3, fan, loft, ring } from './tea-garden-kit.ts'

const HEIGHT = 7.0
const DARKWOOD: Rgb = [0.30, 0.22, 0.16]  // the posts, rails and beams: a dark chocolate brown
const SILVER: Rgb = [0.63, 0.63, 0.59]    // the doors and lattices, weathered to silver-grey
const PLASTER: Rgb = [0.92, 0.90, 0.84]
const THATCH: Rgb = [0.27, 0.19, 0.12]
const CAP: Rgb = [0.46, 0.48, 0.47]       // the grey metal ridge caps
const WHITE: Rgb = [0.93, 0.92, 0.88]
const GRANITE: Rgb = [0.62, 0.62, 0.60]

const PX = 1.75       // the main posts' x
const SZ = 1.1        // the rear posts' z
const DOOR = 3.0      // the doors' height
const LINTEL = 3.55   // the lintel's underside
const WALL = 8.0      // the walls' far ends
/** the ridge as built below (LINTEL + 0.74 + 0.42 + 0.38 + RISE 1.35 + 1.0): the whole is scaled by HEIGHT / this */
const RIDGE_BUILT = 7.44

/** a door leaf from x0 to x1 at z = 0: a frame, vertical boards above a diagonal-lattice panel */
function leaf(out: MeshBuilder, x0: number, x1: number, y: number): void {
  const cx = (x0 + x1) / 2, w = Math.abs(x1 - x0), lo = Math.min(x0, x1)
  B(out, cx, y, 0, w, 0.06, DOOR, SILVER)
  for (const yy of [y + 0.02, y + 0.95, y + DOOR - 0.14]) B(out, cx, yy, 0, w, 0.1, 0.12, SILVER)
  for (const sx of [lo + 0.05, lo + w - 0.05]) B(out, sx, y, 0, 0.1, 0.1, DOOR, SILVER)
  // the boards: a groove line every 0.12 m, both faces
  for (let x = lo + 0.16; x < lo + w - 0.1; x += 0.12) for (const sz of [-1, 1]) B(out, x, y + 1.1, sz * 0.03, 0.015, 0.012, DOOR - 1.3, DARKWOOD)
  // the lattice panel: two squares, each crossed
  const py = y + 0.14, ph = 0.78, hw = (w - 0.2) / 2
  B(out, cx, py + ph / 2 - 0.03, 0, w - 0.2, 0.08, 0.06, SILVER)
  B(out, cx, py, 0, 0.06, 0.08, ph, SILVER)
  for (const sz of [-1, 1]) for (const k of [-1, 1]) {
    const mx = cx + k * hw / 2
    strut(out, [mx - hw / 2, py, sz * 0.045], [mx + hw / 2, py + ph, sz * 0.045], 0.03, 0.03, SILVER)
    strut(out, [mx - hw / 2, py + ph, sz * 0.045], [mx + hw / 2, py, sz * 0.045], 0.03, 0.03, SILVER)
  }
}

/** a carved openwork transom panel centred at x = u: a dark backing, a silver frame and a scrolled ring */
function transom(out: MeshBuilder, u: number, y: number, w: number, h: number): void {
  B(out, u, y, 0, w, 0.05, h, DARKWOOD)
  B(out, u, y, 0, w, 0.11, 0.05, SILVER); B(out, u, y + h - 0.05, 0, w, 0.11, 0.05, SILVER)
  for (const sx of [-1, 1]) B(out, u + sx * (w / 2 - 0.03), y, 0, 0.06, 0.11, h, SILVER)
  const n = 10, r = h * 0.38, cy = y + h / 2
  for (const sz of [-1, 1]) for (let i = 0; i < n; i++) {
    const a0 = 2 * Math.PI * i / n, a1 = 2 * Math.PI * (i + 1) / n
    strut(out, [u + Math.cos(a0) * r, cy + Math.sin(a0) * r, sz * 0.045], [u + Math.cos(a1) * r, cy + Math.sin(a1) * r, sz * 0.045], 0.03, 0.03, SILVER)
    if (i % 2 === 0) strut(out, [u + Math.cos(a0) * r, cy + Math.sin(a0) * r, sz * 0.045], [u + Math.cos(a0) * (w / 2 - 0.05) * 0.95, cy + Math.sin(a0) * (h / 2 - 0.05) * 0.9, sz * 0.045], 0.025, 0.025, SILVER)
  }
}

/** a thatched coping over a wall from x0 to x1 at y: a gabled thatch with a rounded edge and a grey cap */
function coping(out: MeshBuilder, x0: number, x1: number, y: number, hw: number, rise: number): void {
  const a = Math.min(x0, x1), b = Math.max(x0, x1), t = 0
  for (const sz of [-1, 1]) {
    Q(out, [[a, y, sz * hw], [b, y, sz * hw], [b, y + rise, 0], [a, y + rise, 0]], THATCH, t, [0, hw, sz * rise])
    Q(out, [[a, y - 0.22, sz * (hw - 0.08)], [b, y - 0.22, sz * (hw - 0.08)], [b, y, sz * hw], [a, y, sz * hw]], THATCH, t, [0, -0.3, sz])
  }
  for (const sx of [a, b]) Q(out, [[sx, y - 0.22, -hw + 0.08], [sx, y - 0.22, hw - 0.08], [sx, y, hw], [sx, y, -hw]], THATCH, t, [sx === a ? -1 : 1, 0, 0])
  for (const sx of [a, b]) Q(out, [[sx, y, -hw], [sx, y, hw], [sx, y + rise, 0], [sx, y + rise, 0]], THATCH, t, [sx === a ? -1 : 1, 0, 0])
  B(out, (a + b) / 2, y + rise - 0.06, 0, b - a + 0.06, 0.16, 0.12, CAP)
}

/**
 * a flanking wall from the gate out to x = sx·WALL, in sections that step with the ground: a granite plinth down to the
 * model's base, a lattice band along the foot, a dark rail, plaster, posts, the thatched coping
 */
function wall(out: MeshBuilder, sx: number, ground: (x: number) => number): void {
  const x0 = sx * (PX + 0.3), x1 = sx * WALL, len = Math.abs(x1 - x0)
  const n = Math.max(1, Math.round(len / 2.3))
  for (let i = 0; i < n; i++) {
    const a = x0 + (x1 - x0) * i / n, b = x0 + (x1 - x0) * (i + 1) / n, cx = (a + b) / 2, w = Math.abs(b - a)
    const g = ground(cx)
    B(out, cx, -0.6, 0, w, 0.5, g + 0.9, GRANITE, surfaceTag('granite'))     // the plinth, from below the base
    B(out, cx, g + 0.3, 0, w, 0.3, 2.05, PLASTER, surfaceTag('stucco'))      // the wall's core
    for (const sz of [-1, 1]) {
      // the lattice band along the foot: close silver slats on a dark backing
      B(out, cx, g + 0.3, sz * 0.14, w, 0.04, 0.78, DARKWOOD)
      for (let x = Math.min(a, b) + 0.1; x < Math.max(a, b) - 0.05; x += 0.14) B(out, x, g + 0.34, sz * 0.18, 0.04, 0.04, 0.7, SILVER)
      B(out, cx, g + 0.28, sz * 0.18, w, 0.06, 0.06, DARKWOOD)
      B(out, cx, g + 1.06, sz * 0.18, w, 0.06, 0.1, DARKWOOD)                // the mid rail
      B(out, cx, g + 2.25, sz * 0.17, w, 0.06, 0.1, DARKWOOD)                // the top rail
    }
    for (const x of i === n - 1 ? [a, b] : [a]) B(out, x, g + 0.3, 0, 0.18, 0.4, 2.1, DARKWOOD)
    coping(out, a - 0.05 * sx, b + 0.05 * sx, g + 2.4, 0.5, 0.42)
  }
}

export function teaGardenSouthGate(out: MeshBuilder, fit: Fit): void {
  const start = out.positions.length
  const K = HEIGHT / RIDGE_BUILT
  // the ground under a point of the wall line, in the metres built here (the model's base is the lowest ground)
  const ground = (x: number): number => (fit.groundAt?.(x * K, 0) ?? 0) / K
  const g0 = Math.max(ground(-1.2), ground(1.2), ground(0))
  // THE GATE, lifted to the ground at the passage
  const gs = out.positions.length
  // posts on granite blocks: the main pair on the wall line, a rear pair behind
  for (const x of [-PX, PX]) {
    B(out, x, -0.6, 0, 0.55, 0.55, 0.85, GRANITE, surfaceTag('granite'))
    B(out, x, 0.2, 0, 0.32, 0.32, LINTEL + 0.4, DARKWOOD)
    B(out, x, -0.6, SZ, 0.45, 0.45, 0.8, GRANITE, surfaceTag('granite'))
    B(out, x, 0.15, SZ, 0.24, 0.24, LINTEL + 0.1, DARKWOOD)
    B(out, x, LINTEL + 0.05, SZ / 2, 0.2, SZ + 0.5, 0.24, DARKWOOD)             // the tie from main post to rear post
    B(out, x, 2.3, SZ / 2, 0.14, SZ - 0.1, 0.14, DARKWOOD)                      // a lower tie
    B(out, x, LINTEL + 0.5, SZ / 2, 0.26, 2 * SZ + 1.6, 0.24, DARKWOOD)        // the beam along z carrying the eave
  }
  // the doors, closed, with the stop posts and the sill
  B(out, 0, -0.05, 0, 2 * PX, 0.3, 0.12, GRANITE, surfaceTag('granite'))
  leaf(out, -PX + 0.16, -0.03, 0.08); leaf(out, 0.03, PX - 0.16, 0.08)
  B(out, 0, 0.08, 0, 0.08, 0.1, DOOR, DARKWOOD)
  // the transom: three openwork panels between the doors' head and the lintel
  B(out, 0, DOOR + 0.1, 0, 2 * PX - 0.3, 0.14, 0.12, DARKWOOD)
  const tw = (2 * PX - 0.3) / 3
  for (const u of [-tw, 0, tw]) transom(out, u, DOOR + 0.22, tw - 0.04, LINTEL - DOOR - 0.24)
  // the lintel and the plate over it, with a row of bracket arms either face carrying the eave
  B(out, 0, LINTEL, 0, 2 * PX + 1.0, 0.3, 0.32, DARKWOOD)
  B(out, 0, LINTEL + 0.5, 0, 2 * PX + 1.2, 0.3, 0.24, DARKWOOD)
  const EB = LINTEL + 0.74
  B(out, 0, EB - 0.05, 0, 2 * PX + 1.4, 2 * SZ + 1.6, 0.14, DARKWOOD)
  for (const sz of [-1, 1]) for (let i = 0; i < 9; i++) {
    const x = -PX - 0.3 + (2 * PX + 0.6) * i / 8
    B(out, x, LINTEL + 0.3, sz * (SZ + 0.3), 0.14, 0.7, 0.2, DARKWOOD)        // the arm
    B(out, x, LINTEL + 0.3, sz * (SZ + 0.3), 0.12, 0.9, 0.09, DARKWOOD)       // its tip
  }
  // THE EAVE: two tiers of round-ended rafters, each end capped white, fans at the corners, the thick thatch fascia
  const HX = 5.0, HZ = 3.1, lift = 0.55
  const IX = PX + 0.5, IZ = SZ + 0.5
  for (const [yt, inset] of [[EB + 0.09, 0.55], [EB + 0.3, 0.2]] as [number, number][]) {
    for (let i = 0; i <= 11; i++) {
      const x = -IX + 2 * IX * i / 11
      for (const sz of [-1, 1]) {
        const ln = HZ - inset - IZ * 0.9, ez = sz * (IZ * 0.9 + ln)
        B(out, x, yt, sz * (IZ * 0.9 + ln / 2), 0.09, ln, 0.09, DARKWOOD)
        B(out, x, yt - 0.01, ez, 0.12, 0.04, 0.12, WHITE)
      }
    }
    for (let i = 0; i <= 6; i++) {
      const z = -IZ + 2 * IZ * i / 6
      for (const sx of [-1, 1]) {
        const ln = HX - inset - IX * 0.9, ex = sx * (IX * 0.9 + ln)
        B(out, sx * (IX * 0.9 + ln / 2), yt, z, ln, 0.09, 0.09, DARKWOOD)
        B(out, ex, yt - 0.01, z, 0.04, 0.12, 0.12, WHITE)
      }
    }
    for (const [cx, cz] of [[1, 1], [-1, 1], [-1, -1], [1, -1]]) for (let j = 1; j < 3; j++) {
      const a = Math.atan2(cz * HZ, cx * HX) + (j - 1.5) * 0.3, ln = Math.hypot(HX - IX, HZ - IZ) * 1.0 - inset
      const ax = cx * IX * 0.9, az = cz * IZ * 0.9, yy = yt + 0.045
      strut(out, [ax, yy, az], [ax + Math.cos(a) * ln, yy + lift * 0.7, az + Math.sin(a) * ln], 0.09, 0.09, DARKWOOD, 0, false)
    }
  }
  const YF = EB + 0.42, NX = 14, NZ = 8, tile = 0
  // the fascia: thatch, thick and rounded — three rings lofted, the middle one proud
  const f0 = ring(HX - 0.12, HZ - 0.12, YF - 0.05, lift, NX, NZ), f1 = ring(HX + 0.02, HZ + 0.02, YF + 0.16, lift, NX, NZ)
  const f2 = ring(HX, HZ, YF + 0.38, lift, NX, NZ), fi = ring(HX - 0.25, HZ - 0.25, YF - 0.05, lift, NX, NZ)
  loft(out, f0, f1, THATCH, tile); loft(out, f1, f2, THATCH, tile); loft(out, fi, f0, THATCH, tile)
  // the corner beams, kicking up under the curl
  for (const [cx, cz] of [[1, 1], [-1, 1], [-1, -1], [1, -1]]) {
    const a = Math.atan2(cz * (HZ - IZ), cx * (HX - IX)), ln = Math.hypot(HX - IX, HZ - IZ) * 1.08
    strut(out, [cx * IX, EB + 0.3, cz * IZ], [cx * IX + Math.cos(a) * ln, EB + 0.3 + lift * 1.1, cz * IZ + Math.sin(a) * ln], 0.16, 0.16, DARKWOOD)
  }
  // THE ROOF: hipped thatch from the fascia's top to a short ridge, the corners curling; a grey cap along the ridge
  const YR = YF + 0.38, RISE = 1.35
  const eave = ring(HX, HZ, YR, lift, NX, NZ)
  const MX = HX * 0.6, MZ = HZ * 0.55, YM = YR + RISE
  const mid = ring(MX, MZ, YM, 0.04, NX, NZ)
  loft(out, eave, mid, THATCH, tile)
  const GX = HX * 0.36, RIDGE = YM + 1.0
  const top: P3[] = ring(GX, 0.12, RIDGE, 0, NX, NZ).map(p => [p[0], RIDGE + (Math.abs(p[0]) > GX * 0.98 ? 0 : 0), p[2]])
  loft(out, mid, top, THATCH, tile)
  fan(out, top, THATCH, tile, [0, 1, 0])
  const under = ring(HX - 0.25, HZ - 0.25, YF - 0.05, lift, NX, NZ)
  fan(out, under, DARKWOOD, 0, [0, -1, 0])
  B(out, 0, RIDGE - 0.02, 0, 2 * GX + 0.5, 0.42, 0.22, CAP)
  for (const sx of [-1, 1]) B(out, sx * (GX + 0.25), RIDGE - 0.12, 0, 0.3, 0.5, 0.36, CAP)
  for (let i = gs + 1; i < out.positions.length; i += 3) out.positions[i] += g0
  // THE WALLS each side, stepping with the ground
  for (const sx of [-1, 1]) wall(out, sx, ground)
  for (let i = start; i < out.positions.length; i++) out.positions[i] *= K
}
