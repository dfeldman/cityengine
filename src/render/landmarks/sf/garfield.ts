/**
 * THE GARFIELD MONUMENT (Frank Happersberger, 1885; Golden Gate Park by the JFK Promenade at Nancy Pelosi Drive; OSM
 * node/1350891714), from the Commons photographs "Garfield Monument - Golden Gate Park - San Francisco, CA" 01–08
 * (owner, 2026-10-27: "improve" the generic figure-on-a-pedestal it was).
 *
 * Read off them, bottom up, scaled by the Adirondack chair in front of it (a metre):
 *  - a round raised terrace behind a pink granite curb, 0.8 m;
 *  - three grey granite steps, 4.7, 4.1 and 2.6 m across;
 *  - the die on its base: a tapering block, GARFIELD in raised letters on the front, a bronze trophy on each side (an
 *    eagle with spread wings over crossed flags and palms), a frieze with two stars, a projecting moulded cornice;
 *  - the bronze GARFIELD, heroic (3.2 m), in a frock coat to the knee, hands clasped in front at the waist, bearded;
 *  - at the front of the steps, a seated bronze MOURNER, hooded and draped, a sword upright in her right hand and a laurel
 *    wreath hanging from her left.
 * About 8.5 m over the terrace. The front is local −z; the manifest's `front` (225, towards the junction) is a guess —
 * no photograph is geotagged.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { box, prism, strut, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'

type V3 = [number, number, number]
const GRANITE: Rgb = [0.60, 0.59, 0.56]
const PINK: Rgb = [0.62, 0.48, 0.43]
const BRONZE: Rgb = [0.29, 0.26, 0.21]
const PATINA: Rgb = [0.27, 0.30, 0.25]
const LAWN: Rgb = [0.13, 0.22, 0.08]

/** the terrace's radius and height, and the levels the rest stands on */
const TERRACE_R = 6.4
const TERRACE_H = 0.8

export function garfieldMonument(out: MeshBuilder, fit: Fit): void {
  const g = surfaceTag('granite'), m = surfaceTag('metal')
  const y0 = fit.groundAt ? fit.groundAt(0, 0) : 0.5
  // the terrace: the pink granite curb round it (its outside and a coping half a metre wide), lawn inside
  prism(out, 0, 0, y0 - 0.6, y0 + TERRACE_H, TERRACE_R, 28, PINK, g, TERRACE_R, false)
  for (let i = 0; i < 28; i++) {
    const a0 = (i / 28) * Math.PI * 2, a1 = ((i + 1) / 28) * Math.PI * 2
    const P = (a: number, r: number): V3 => [Math.sin(a) * r, y0 + TERRACE_H, Math.cos(a) * r]
    out.quad([P(a0, TERRACE_R - 0.5), P(a1, TERRACE_R - 0.5), P(a1, TERRACE_R), P(a0, TERRACE_R)], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], PINK, g)
    out.quad([P(a0, 0), P(a1, 0), P(a1, TERRACE_R - 0.5), P(a0, TERRACE_R - 0.5)], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], LAWN, 0)
  }
  let y = y0 + TERRACE_H
  // the three steps
  for (const [w, h] of [[4.7, 0.7], [4.1, 0.35], [2.6, 0.3]] as const) {
    box(out, 0, y + h / 2, 0, w / 2, h / 2, w / 2, GRANITE, g)
    y += h
  }
  const stepTop2 = y0 + TERRACE_H + 0.7 + 0.35
  // the die's base, the die (tapering), the frieze, the cornice in two projecting courses, the statue's plinth
  box(out, 0, y + 0.2, 0, 0.9, 0.2, 0.9, GRANITE, g)
  y += 0.4
  taper(out, y, y + 2.1, 0.8, 0.72, GRANITE, g)
  const dieY = y
  y += 2.1
  box(out, 0, y + 0.16, 0, 0.78, 0.16, 0.78, GRANITE, g)
  y += 0.32
  box(out, 0, y + 0.12, 0, 0.98, 0.12, 0.98, GRANITE, g)
  box(out, 0, y + 0.3, 0, 1.06, 0.06, 1.06, GRANITE, g)
  y += 0.36
  box(out, 0, y + 0.12, 0, 0.62, 0.12, 0.62, GRANITE, g)
  y += 0.24
  box(out, 0, y + 0.04, 0, 0.55, 0.04, 0.5, BRONZE, m)
  y += 0.08
  garfield(out, 0, y, 0.05, 3.2, m)

  // GARFIELD across the die's face, raised a little, 0.17 m letters; the two stars on the frieze
  letters(out, 'GARFIELD', 0, dieY + 1.3, -0.77 - 0.02 - 0.07 * 0.25, 0.17, g)
  for (const s of [-1, 1]) star(out, s * 0.42, dieY + 2.26, -0.79, 0.09, BRONZE, m)
  // the trophies on the die's two sides
  for (const s of [-1, 1]) trophy(out, s, dieY + 1.15, 0.74, m)
  // the mourner, seated on the second step's front, facing out
  mourner(out, 0, stepTop2, -1.7, m)
}

/** the standing Garfield, feet at y, facing −z: legs, the frock coat to the knee, hands clasped at the waist, a beard */
function garfield(out: MeshBuilder, x: number, y: number, z: number, h: number, m: number): void {
  const u = h / 1.8
  for (const s of [-1, 1]) prism(out, x + s * 0.1 * u, z, y, y + 0.55 * u, 0.075 * u, 6, BRONZE, m, 0.07 * u)   // the legs
  for (const s of [-1, 1]) box(out, x + s * 0.1 * u, y + 0.03 * u, z - 0.05 * u, 0.06 * u, 0.03 * u, 0.12 * u, BRONZE, m)  // the shoes
  prism(out, x, z, y + 0.48 * u, y + 0.95 * u, 0.25 * u, 8, BRONZE, m, 0.2 * u)                                 // the coat's skirts
  prism(out, x, z, y + 0.95 * u, y + 1.42 * u, 0.2 * u, 8, BRONZE, m, 0.23 * u)                                 // the chest
  box(out, x, y + 1.42 * u, z, 0.25 * u, 0.04 * u, 0.12 * u, BRONZE, m)                                         // the shoulders
  // the arms: down from the shoulders, the forearms forward and in to the clasped hands at the waist
  const hands: V3 = [x, y + 0.98 * u, z - 0.2 * u]
  for (const s of [-1, 1]) {
    const sh: V3 = [x + s * 0.24 * u, y + 1.38 * u, z]
    const el: V3 = [x + s * 0.23 * u, y + 1.06 * u, z - 0.04 * u]
    strut(out, sh, el, 0.09 * u, 0.09 * u, BRONZE, m)
    strut(out, el, [hands[0] + s * 0.04 * u, hands[1], hands[2]], 0.08 * u, 0.08 * u, BRONZE, m)
  }
  box(out, hands[0], hands[1], hands[2], 0.07 * u, 0.05 * u, 0.05 * u, PATINA, m)
  prism(out, x, z, y + 1.44 * u, y + 1.5 * u, 0.05 * u, 6, BRONZE, m, 0.05 * u)                                  // the neck
  prism(out, x, z, y + 1.5 * u, y + 1.76 * u, 0.1 * u, 8, PATINA, m, 0.09 * u)                                   // the head
  prism(out, x, z - 0.05 * u, y + 1.43 * u, y + 1.58 * u, 0.05 * u, 6, BRONZE, m, 0.075 * u)                     // the beard
}

/** the mourner, seated, her seat at y, facing −z: the draped mass, knees, the hooded head, the sword, the wreath */
function mourner(out: MeshBuilder, x: number, y: number, z: number, m: number): void {
  // the seat block under her drapery, against the step behind
  box(out, x, y + 0.3, z + 0.25, 0.42, 0.3, 0.3, BRONZE, m)
  // the lap and the knees forward, the drapery falling to the step below in a sloped front
  box(out, x, y + 0.55, z - 0.15, 0.4, 0.12, 0.3, BRONZE, m)
  prism(out, x, z - 0.4, y - 0.35, y + 0.6, 0.5, 6, PATINA, m, 0.34)
  // the torso, leaning a little forward, and the shoulders under the cloak
  prism(out, x, z + 0.18, y + 0.62, y + 1.2, 0.3, 8, BRONZE, m, 0.24)
  // the hood: a cowl over the bowed head
  prism(out, x, z + 0.08, y + 1.15, y + 1.48, 0.2, 8, PATINA, m, 0.09)
  prism(out, x, z + 0.02, y + 1.18, y + 1.38, 0.1, 6, BRONZE, m, 0.09)
  // the sword, upright in her right hand: she faces −z, so her right is −x, the viewer's left (photograph 03)
  const sx = x - 0.48
  strut(out, [sx, y - 0.3, z - 0.1], [sx, y + 1.05, z - 0.1], 0.05, 0.02, PATINA, m)
  strut(out, [sx - 0.14, y + 0.8, z - 0.1], [sx + 0.14, y + 0.8, z - 0.1], 0.04, 0.04, PATINA, m)
  strut(out, [x - 0.3, y + 0.85, z + 0.05], [sx, y + 0.85, z - 0.1], 0.07, 0.07, BRONZE, m)
  // the wreath, hanging from her left hand by her knee: a ring of leaf-lumps
  const wx = x + 0.5, wy = y + 0.35, wz = z - 0.35
  strut(out, [x + 0.3, y + 0.85, z + 0.05], [wx, wy + 0.2, wz], 0.07, 0.07, BRONZE, m)
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2
    box(out, wx + Math.cos(a) * 0.17, wy + Math.sin(a) * 0.17, wz, 0.05, 0.05, 0.05, PATINA, m)
  }
}

/** a side trophy: an eagle, wings spread, over crossed flags, in relief on the die's ±x face (`s`) */
function trophy(out: MeshBuilder, s: number, y: number, face: number, m: number): void {
  const x = s * (face + 0.04)
  // the flags and palms fanning out behind, flat to the face
  for (const a of [-0.9, -0.45, 0.45, 0.9]) {
    strut(out, [x, y - 0.45, 0], [x, y + 0.2 + Math.cos(a) * 0.25, Math.sin(a) * 0.55], 0.06, 0.04, PATINA, m)
  }
  // the body, the head, the two wings up and out
  box(out, x + s * 0.04, y, 0, 0.05, 0.22, 0.09, BRONZE, m)
  box(out, x + s * 0.05, y + 0.27, 0, 0.05, 0.06, 0.05, BRONZE, m)
  for (const w of [-1, 1]) {
    strut(out, [x + s * 0.03, y + 0.08, w * 0.06], [x + s * 0.03, y + 0.42, w * 0.5], 0.05, 0.16, BRONZE, m)
    strut(out, [x + s * 0.03, y + 0.42, w * 0.5], [x + s * 0.03, y + 0.18, w * 0.62], 0.05, 0.1, BRONZE, m)
  }
}

/** a square block tapering from half-width a at y0 to b at y1: four sloped sides and a top (the die) */
function taper(out: MeshBuilder, y0: number, y1: number, a: number, b: number, c: Rgb, tag: number): void {
  const sl = (a - b) / (y1 - y0)
  const n = Math.hypot(1, sl)
  const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  const sides: [V3, (u: number, v: number) => [number, number]][] = [
    [[0, sl / n, -1 / n], (u, v) => [u, -v]], [[0, sl / n, 1 / n], (u, v) => [-u, v]],
    [[1 / n, sl / n, 0], (u, v) => [v, u]], [[-1 / n, sl / n, 0], (u, v) => [-v, -u]],
  ]
  for (const [nn, f] of sides) {
    const P = (u: number, w: number, y: number): V3 => { const [x, z] = f(u * w, w); return [x, y, z] }
    out.quad([P(-1, a, y0), P(1, a, y0), P(1, b, y1), P(-1, b, y1)], nn, UV, c, tag)
  }
  out.quad([[-b, y1, -b], [b, y1, -b], [b, y1, b], [-b, y1, b]], [0, 1, 0], UV, c, tag)
}

/** a flat five-pointed star on a −z face */
function star(out: MeshBuilder, x: number, y: number, z: number, r: number, c: Rgb, tag: number): void {
  for (let k = 0; k < 5; k++) {
    const a = Math.PI / 2 + (k * 2 * Math.PI) / 5
    const p = (ang: number, rr: number): V3 => [x + Math.cos(ang) * rr, y + Math.sin(ang) * rr, z]
    out.quad([p(a - Math.PI / 5, r * 0.4), p(a, r), p(a + Math.PI / 5, r * 0.4), [x, y, z]], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], c, tag)
  }
}

/** raised capitals on a −z face, centred on x, their foot at y, `h` tall; a stroke font in a unit cell */
const FONT: Record<string, [number, number, number, number][]> = {
  G: [[0.9, 1, 0.1, 1], [0.1, 1, 0.1, 0], [0.1, 0, 0.9, 0], [0.9, 0, 0.9, 0.45], [0.9, 0.45, 0.5, 0.45]],
  A: [[0, 0, 0.5, 1], [0.5, 1, 1, 0], [0.25, 0.45, 0.75, 0.45]],
  R: [[0.1, 0, 0.1, 1], [0.1, 1, 0.85, 1], [0.85, 1, 0.85, 0.5], [0.85, 0.5, 0.1, 0.5], [0.4, 0.5, 0.9, 0]],
  F: [[0.15, 0, 0.15, 1], [0.15, 1, 0.9, 1], [0.15, 0.5, 0.7, 0.5]],
  I: [[0.5, 0, 0.5, 1]],
  E: [[0.15, 0, 0.15, 1], [0.15, 1, 0.9, 1], [0.15, 0.5, 0.7, 0.5], [0.15, 0, 0.9, 0]],
  L: [[0.15, 1, 0.15, 0], [0.15, 0, 0.9, 0]],
  D: [[0.15, 0, 0.15, 1], [0.15, 1, 0.7, 1], [0.7, 1, 0.9, 0.75], [0.9, 0.75, 0.9, 0.25], [0.9, 0.25, 0.7, 0], [0.7, 0, 0.15, 0]],
}
function letters(out: MeshBuilder, text: string, cx: number, y: number, z: number, h: number, tag: number): void {
  const w = h * 0.72, gap = h * 0.22, total = text.length * w + (text.length - 1) * gap
  const sw = h * 0.16
  ;[...text].forEach((ch, i) => {
    // seen from the front (at −z, facing +z, x east and z north) the viewer's right is +x: the letters advance along +x
    const x0 = cx - total / 2 + i * (w + gap)
    for (const [a0, b0, a1, b1] of FONT[ch] ?? []) {
      strut(out, [x0 + a0 * w, y + b0 * h, z], [x0 + a1 * w, y + b1 * h, z], sw, 0.05, [0.66, 0.65, 0.62], tag)
    }
  })
}
