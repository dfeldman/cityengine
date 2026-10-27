/**
 * THE PAGODA of the Japanese Tea Garden (built for the 1915 Panama-Pacific Exposition, in the garden since 1916,
 * restored 2022). Evidence pack: docs/sf-batches/MODEL-TEA-GARDEN-PAGODA.md — the owner's photographs, read part by
 * part. It was a kit stand-in (storeys shrinking 11 % a step, one window band, a kit roof), then for a day an AI GLB
 * (assetkit-models-sf/tea-garden-pagoda: "did not work very well"), then a Blender-scripted GLB
 * (tools/blender/tea_garden_pagoda.py, kept as the reference build); this is that build ported 1:1 to the game's
 * own primitives (owner, 2026-10-27: "if the model is simple enough, we can just implement a direct custom renderer").
 *
 * One storey unit five times (owner: "the tiers are actually all the same size" — the eaves shrink 5 % a storey,
 * which photo 1 shows): a deck ringed by the squat TWO-TIER FENCE (a close grid of slats below the mid rail,
 * a few balusters above it — "fewer supports on the upper level"), the body, then the EAVE: two tiers of close-set
 * vermilion rafters, fans at the corners, a corner beam kicking up, a fascia that follows the curve with a row of
 * white bosses, a bell at each corner; over it a cedar-shingle hipped roof whose CORNERS CURL UP ("a key design
 * element of pagodas"). The ground storey is tall and cream with cusped-arch lattice windows and a white door a
 * face; the upper four are short and vermilion with a cream band, a barred vent and gilt clouds. The fifth roof is
 * a pyramid under a square cupola, a verdigris cap and the sōrin (bronze mast, eleven rings, flame, gilt jewel).
 * All on a battered rubble-stone plinth with a concrete cap.
 *
 * Built in the photographs' own proportions (3.0 m plinth, 25.5 m to the jewel) and scaled to HEIGHT at the end:
 * 22 m, between the owner's 20 m judged in the game (16 "read short") and the photographs. Every face is alike.
 * Local frame: y up, the plinth's foot centred on the origin.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { prism, strut, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { B, type P3, fan, loft, ring, squareFrustum, curl } from './tea-garden-kit.ts'

const HEIGHT = 22
const RED: Rgb = [0.60, 0.11, 0.06]
const CREAM: Rgb = [0.90, 0.85, 0.74]
const WHITE: Rgb = [0.92, 0.92, 0.90]
const SHINGLE: Rgb = [0.40, 0.29, 0.17]   // weathered cedar; reads near-black in shade
const STONE: Rgb = [0.55, 0.52, 0.46]
const CAP: Rgb = [0.72, 0.70, 0.66]
const GILT: Rgb = [0.85, 0.60, 0.22]
const DARK: Rgb = [0.12, 0.08, 0.07]
const BRONZE: Rgb = [0.32, 0.27, 0.18]
const VERDIGRIS: Rgb = [0.35, 0.55, 0.48]

/**
 * The shingle roof: an eave ring whose corners curl up, a mid ring, then a short ridge (ridgeHalf > 0) or a point;
 * `thick` deep at the eave with a flat underside. Returns the apex y.
 */
function hipRoof(out: MeshBuilder, y0: number, he: number, rise: number, lift: number, ridgeHalf: number, thick = 0.14): number {
  const n = 8, tag = surfaceTag('tile')
  const eave = ring(he, he, y0, lift, n, n)
  const mid = ring(he * 0.52, he * 0.52, y0 + lift * 0.15 + rise * 0.42, lift * 0.1, n, n)
  const top = ring(ridgeHalf, 0, y0 + rise, 0, n, n)
  loft(out, eave, mid, SHINGLE, tag)
  loft(out, mid, top, SHINGLE, tag)
  const under = ring(he, he, y0 - thick, lift, n, n)
  loft(out, under, eave, SHINGLE, tag)
  fan(out, under, SHINGLE, tag, [0, -1, 0])
  return y0 + rise
}

/** a board following the eave's curve, `h` tall and 0.08 deep, with the white bosses riding on its outer face */
function fascia(out: MeshBuilder, y: number, he: number, lift: number, h: number): void {
  const n = 8
  const lo = ring(he, he, y, lift, n, n), hi = ring(he, he, y + h, lift, n, n)
  const li = ring(he - 0.08, he - 0.08, y, lift, n, n), hi2 = ring(he - 0.08, he - 0.08, y + h, lift, n, n)
  loft(out, lo, hi, RED, 0); loft(out, hi2, li, RED, 0); loft(out, hi, hi2, RED, 0); loft(out, li, lo, RED, 0)
}

/** the squat two-tier fence round a deck of half-width hd, from y, `tierH` tall */
function fence(out: MeshBuilder, y: number, hd: number, tierH: number): void {
  const post = 0.11, bays = 4
  for (let i = 0; i <= bays; i++) {
    const t = -hd + 2 * hd * i / bays
    for (const [x, z] of [[t, hd], [t, -hd], [hd, t], [-hd, t]]) {
      B(out, x, y, z, post, post, tierH, RED)
      B(out, x, y + tierH, z, post + 0.05, post + 0.05, 0.05, RED)
    }
  }
  const slats = 12
  for (const [sx, sz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const x = sx * hd, z = sz * hd
    const rx = sx ? 0.08 : 2 * hd, rz = sz ? 0.08 : 2 * hd
    B(out, x, y + tierH - 0.12, z, rx, rz, 0.08, RED)                   // top rail
    B(out, x, y + tierH - 0.19, z, rx * 0.98, rz * 0.98, 0.03, WHITE)   // its white stripe
    B(out, x, y + tierH * 0.5, z, rx, rz, 0.07, RED)                    // mid rail
    B(out, x, y + 0.04, z, rx, rz, 0.07, RED)                           // bottom rail
    B(out, x, y + tierH * 0.28, z, sx ? 0.05 : 2 * hd, sz ? 0.05 : 2 * hd, 0.04, RED)   // the grid's middle bar
    for (let j = 1; j < slats; j++) {
      const t = -hd + 2 * hd * j / slats
      const onPost = Math.abs(((t + hd) % (2 * hd / bays))) < 0.06 || Math.abs(((t + hd) % (2 * hd / bays)) - 2 * hd / bays) < 0.06
      if (onPost) continue
      const px = sx ? x : t, pz = sz ? z : t
      B(out, px, y + 0.1, pz, 0.045, 0.045, tierH * 0.5 - 0.1, RED)                          // lower grid
      if (j % 2 === 0) B(out, px, y + tierH * 0.5, pz, 0.05, 0.05, tierH * 0.5 - 0.12, RED)   // few balusters above
    }
  }
}

/** a cusped-arch lattice window on the face (sx, sz) at along-face offset u: white panel, pointed head, bars, frame */
function latticeWindow(out: MeshBuilder, sx: number, sz: number, u: number, y: number, w: number, h: number, hb: number): void {
  const d = hb + 0.02
  const px = sx ? sx * d : u, pz = sz ? sz * d : u
  B(out, px, y, pz, sx ? 0.06 : w, sz ? 0.06 : w, h, WHITE)
  // the cusped head: a pointed arch, two faces back to back
  const P = (a: number, yy: number, off: number): P3 => [px + (sx ? off : a), yy, pz + (sz ? off : a)]
  const prof: [number, number][] = [[-w / 2, h], [w / 2, h], [w / 2, h + 0.12], [w * 0.18, h + 0.2], [0, h + 0.34], [-w * 0.18, h + 0.2], [-w / 2, h + 0.12]]
  for (const off of [-0.035, 0.035]) {
    const pts = prof.map(([a, yy]) => P(a, y + yy, off))
    fan(out, pts, WHITE, 0, sx ? [sx * Math.sign(off), 0, 0] : [0, 0, sz * Math.sign(off)])
  }
  const fr = 0.05
  for (const a of [-w / 2, w / 2]) B(out, px + (sx ? 0 : a), y, pz + (sz ? 0 : a), sx ? 0.08 : fr, sz ? 0.08 : fr, h + 0.12, RED)
  B(out, px, y - 0.02, pz, sx ? 0.08 : w + fr, sz ? 0.08 : w + fr, fr, RED)
  for (const a of [-w / 4, 0, w / 4]) B(out, px + (sx ? 0 : a), y + 0.04, pz + (sz ? 0 : a), sx ? 0.07 : 0.025, sz ? 0.07 : 0.025, h - 0.08, DARK)
  for (let k = 1; k < 4; k++) B(out, px, y + h * k / 4, pz, sx ? 0.07 : w - 0.02, sz ? 0.07 : w - 0.02, 0.025, DARK)
}

/** a gilt cloud ornament on a face: a wide lobe under a narrow one */
function cloud(out: MeshBuilder, sx: number, sz: number, u: number, y: number, s: number, hb: number): void {
  const d = hb + 0.03
  const px = sx ? sx * d : u, pz = sz ? sz * d : u
  B(out, px, y, pz, sx ? 0.04 : s, sz ? 0.04 : s, s * 0.45, GILT)
  B(out, px, y + s * 0.45, pz, sx ? 0.04 : s * 0.55, sz ? 0.04 : s * 0.55, s * 0.25, GILT)
}

/** one storey from its deck's top at y; returns [the roof's apex, the next deck's y] */
function storey(out: MeshBuilder, y: number, s: number): [number, number] {
  const k = 0.95 ** s
  const ground = s === 0
  const hb = 1.55 * k                        // body half-width
  const hd = 2.25 * k                        // deck half-width
  const he = 3.3 * k                         // eave half-width
  const bodyH = ground ? 2.7 : 1.05
  const railH = ground ? 0.95 : 0.72
  const faces: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]]
  const corners: [number, number][] = [[1, 1], [-1, 1], [-1, -1], [1, -1]]
  // the deck and its fence
  B(out, 0, y - 0.22, 0, 2 * hd + 0.1, 2 * hd + 0.1, 0.22, RED)
  B(out, 0, y - 0.15, 0, 2 * hd + 0.12, 2 * hd + 0.12, 0.04, WHITE)
  fence(out, y, hd - 0.06, railH)
  // the body: posts, sill and head beams, and what each face carries
  B(out, 0, y, 0, 2 * hb, 2 * hb, bodyH, ground ? CREAM : RED, ground ? surfaceTag('stucco') : 0)
  for (const [cx, cz] of corners) B(out, cx * hb, y, cz * hb, 0.2, 0.2, bodyH, RED)
  for (const [sx, sz] of faces) {
    const rx = sx ? 0.1 : 2 * hb + 0.1, rz = sz ? 0.1 : 2 * hb + 0.1
    const x = sx * hb, z = sz * hb
    B(out, x, y, z, rx, rz, 0.14, RED)
    B(out, x, y + bodyH - 0.16, z, rx, rz, 0.16, RED)
    if (ground) {
      for (const a of [-hb * 0.34, hb * 0.34]) B(out, sx ? x : a, y, sz ? z : a, 0.12, 0.12, bodyH, RED)
      for (const a of [-hb * 0.67, hb * 0.67]) latticeWindow(out, sx, sz, a, y + 0.95, 0.5, 1.0, hb)
      B(out, x + sx * 0.02, y + 0.14, z + sz * 0.02, sx ? 0.05 : 0.78, sz ? 0.05 : 0.78, bodyH - 0.45, WHITE)      // the door
      B(out, x + sx * 0.03, y + 0.14 + (bodyH - 0.45) * 0.5, z + sz * 0.03, sx ? 0.04 : 0.8, sz ? 0.04 : 0.8, 0.05, RED)
      cloud(out, sx, sz, 0, y + bodyH - 0.7, 0.42, hb)
    } else {
      B(out, x + sx * 0.01, y + 0.5, z + sz * 0.01, sx ? 0.05 : 2 * hb - 0.3, sz ? 0.05 : 2 * hb - 0.3, bodyH - 0.66, CREAM)   // the cream band
      B(out, x + sx * 0.03, y + 0.56, z + sz * 0.03, sx ? 0.04 : 0.42, sz ? 0.04 : 0.42, bodyH - 0.78, DARK)                   // the vent
      for (const a of [-hb * 0.55, hb * 0.55]) cloud(out, sx, sz, a, y + 0.56, 0.3, hb)
    }
  }
  // the eave: bracket plate, corner blocks, two tiers of rafters with fans at the corners
  const yb = y + bodyH
  B(out, 0, yb, 0, 2 * hb + 0.55, 2 * hb + 0.55, 0.22, RED)
  for (const [cx, cz] of corners) B(out, cx * hb * 1.12, yb - 0.3, cz * hb * 1.12, 0.42, 0.42, 0.3, RED)
  const tiers: [number, number, number][] = [[yb + 0.22, he - 0.12, 0.09], [yb + 0.45, he - 0.42, 0.08]]
  for (const [yt, reach, depth] of tiers) {
    const m = 8
    for (let i = 0; i <= m; i++) {
      const t = -hb + 2 * hb * i / m
      for (const [sx, sz] of faces) {
        const ln = reach - hb * 0.9
        const cx = sx ? sx * (hb * 0.9 + ln / 2) : t, cz = sz ? sz * (hb * 0.9 + ln / 2) : t
        B(out, cx, yt, cz, sx ? ln : depth, sz ? ln : depth, depth, RED)
      }
    }
    for (const [cx, cz] of corners) {
      for (let j = 1; j < 4; j++) {
        const a = Math.atan2(cz, cx) + (j - 2) * 0.2
        const ln = (reach - hb * 0.9) * 1.25
        const ax = cx * hb * 0.92, az = cz * hb * 0.92
        const yy = yt + depth / 2 + 0.02 * Math.abs(j - 2)
        strut(out, [ax, yy, az], [ax + Math.cos(a) * ln, yy, az + Math.sin(a) * ln], depth, depth, RED, 0, false)
      }
    }
  }
  // the fascia with its bosses, the corner beams that kick up, the bells
  const yf = yb + 0.56
  const lift = 0.55 * k
  fascia(out, yf, he - 0.04, lift, 0.2)
  for (const [sx, sz] of faces) {
    const x = sx * (he - 0.05), z = sz * (he - 0.05)
    const nb = 12
    for (let i = 0; i <= nb; i++) {
      const t = -he + 0.25 + (2 * he - 0.5) * i / nb
      const kick = lift * curl(Math.abs(t) / he)
      B(out, sx ? x + sx * 0.05 : t, yf + 0.06 + kick, sz ? z + sz * 0.05 : t, 0.07, 0.07, 0.07, WHITE)
    }
  }
  for (const [cx, cz] of corners) {
    const a = Math.atan2(cz, cx)
    const ln = (he - hb) * 1.12
    const ax = cx * hb, az = cz * hb
    strut(out, [ax, yf + 0.28, az], [ax + Math.cos(a) * ln, yf + 0.28 + lift * 1.2, az + Math.sin(a) * ln], 0.16, 0.16, RED)
    const bx = cx * (he - 0.35), bz = cz * (he - 0.35)
    B(out, bx, yf - 0.32, bz, 0.02, 0.02, 0.32, BRONZE)
    prism(out, bx, bz, yf - 0.5, yf - 0.32, 0.12, 6, BRONZE, 0, 0.05)
  }
  // the roof
  const yRoof = yf + 0.2
  if (s < 4) {
    const apex = hipRoof(out, yRoof, he, 1.3 * k, lift, 0.5 * k)
    B(out, 0, apex - 0.02, 0, 1.0 * k + 0.3, 0.22, 0.12, SHINGLE, surfaceTag('tile'))   // the ridge
    return [apex, apex - 0.55 * k + 0.22]                                                 // the next deck sits into the roof
  }
  const apex = hipRoof(out, yRoof, he, 1.6 * k, lift, 0)
  return [apex, apex]
}

/** the five-storey pagoda on its stone plinth, scaled to HEIGHT; the fit is ignored (its footprint is the podium) */
export function teaGardenPagoda(out: MeshBuilder, _fit: Fit): void {
  const start = out.positions.length
  // the plinth: battered rubble stone, a concrete cap slab
  const PLINTH = 3.0
  squareFrustum(out, 0, PLINTH, 3.55, 2.55, STONE, surfaceTag('rock'))
  B(out, 0, PLINTH, 0, 5.4, 5.4, 0.22, CAP, surfaceTag('concrete'))
  let y = PLINTH + 0.22, apex = y
  for (let s = 0; s < 5; s++) [apex, y] = storey(out, y, s)
  // the cupola, the verdigris cap and the sōrin
  B(out, 0, apex - 0.45, 0, 0.85, 0.85, 0.75, CAP, surfaceTag('concrete'))
  for (const [sx, sz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) B(out, sx * 0.43, apex - 0.1, sz * 0.43, sx ? 0.03 : 0.3, sz ? 0.03 : 0.3, 0.3, DARK)
  B(out, 0, apex + 0.3, 0, 1.1, 1.1, 0.1, SHINGLE, surfaceTag('tile'))
  const yt = apex + 0.38
  prism(out, 0, 0, yt, yt + 0.35, 0.62, 8, VERDIGRIS, surfaceTag('copper'), 0.45)
  prism(out, 0, 0, yt + 0.35, yt + 0.55, 0.45, 8, VERDIGRIS, surfaceTag('copper'), 0.18)
  prism(out, 0, 0, yt + 0.5, yt + 5.6, 0.10, 8, BRONZE, 0, 0.06)
  for (let i = 0; i < 11; i++) {
    const y0 = yt + 0.85 + i * 0.4, r = 0.32 - i * 0.017
    prism(out, 0, 0, y0, y0 + 0.1, r, 8, BRONZE, 0, r)
  }
  prism(out, 0, 0, yt + 5.6, yt + 5.95, 0.16, 8, BRONZE, 0, 0.03)
  prism(out, 0, 0, yt + 5.95, yt + 6.2, 0.11, 8, GILT, 0, 0.11)
  // scale the whole to HEIGHT
  const built = yt + 6.2
  const K = HEIGHT / built
  for (let i = start; i < out.positions.length; i++) out.positions[i] *= K
}
