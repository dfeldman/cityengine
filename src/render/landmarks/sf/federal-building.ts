/**
 * THE SAN FRANCISCO FEDERAL BUILDING (Nancy Pelosi Federal Building), 90 Seventh Street at Mission (Morphosis /
 * Thom Mayne, 2007; OSM way/32863953, its annex way/783200256). The owner, 2026-10-05, with five photographs: "one
 * of the strangest buildings in the city … on the entry path when the user is starting the game". What makes it:
 *
 *   - an 18-storey slab, 110 m long and ~22 m thick, backed onto Stevenson Street, its long face looking south-east
 *     across a plaza to Mission Street. The south-east face is a skin of PERFORATED STAINLESS-STEEL MESH, silver-grey,
 *     with the windows behind it showing only as irregular dark horizontal slots;
 *   - an ASYMMETRIC ROOFLINE: low at the south-west end, rising towards 7th Street, the mesh carried up past the roof as
 *     an open crest, and at the 7th Street end bent over the top into a cantilever with a glazed box under it;
 *   - the "PIZZA SLICE": a diagonal fold running down from the roof to a three-storey opening (the sky garden), the
 *     panel beside it lifted proud, leaving an internal balcony;
 *   - a pale smooth panel left of centre with FOUR LARGE SQUARE BOXED WINDOWS stacked up it;
 *   - the north-west face (Stevenson, and the view from Market as the rider comes down the hill) hung with tall
 *     frosted-glass sunshades; a full-height teal glass strip at the south-west end;
 *   - at the foot of the 7th Street end, a GLASS WALL against the sidewalk with an ANGULAR CONCRETE COLUMN jutting out
 *     over it, and a sloped slatted skirt along the base of the slab;
 *   - on the plaza at the 7th and Mission corner, the ZIGZAG CANOPY: folded planes of the same mesh on a steel truss,
 *     rising off a concrete plinth wall along the sidewalk; and on its south-west side the GLASS-FRONTED ANNEX.
 *
 * Built in the slab's own frame, measured from OSM: u along the slab (its south-west end u = −110, its 7th Street
 * end u = 0; 7th Street's centre line u = +13), v across it (Stevenson side v = 0, the plaza face v = 22, Mission's
 * centre line v = 118). Placed by lat/lon at (u, v) = (−50, 55) and turned −45° so local +x runs along u and local
 * +z runs towards Stevenson (−v).
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'
import { box, strut } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'

type V3 = [number, number, number]
const UC = -50, VC = 55
/** a point of the slab frame (u, height, v) in the model's local frame */
const P = (u: number, y: number, v: number): V3 => [u - UC, y, -(v - VC)]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

const MESH: Rgb = [0.7, 0.67, 0.61]
const MESH_PROUD: Rgb = [0.76, 0.73, 0.67]
const PANEL: Rgb = [0.82, 0.8, 0.75]
const SLOT: Rgb = [0.13, 0.14, 0.15]
const DARK: Rgb = [0.07, 0.08, 0.09]
const GLASS: Rgb = [0.24, 0.3, 0.33]
const TEAL: Rgb = [0.2, 0.42, 0.4]
const CONCRETE: Rgb = [0.6, 0.6, 0.58]
const STEEL: Rgb = [0.24, 0.25, 0.27]
const WHITE: Rgb = [0.84, 0.84, 0.82]
const ROOF: Rgb = [0.34, 0.34, 0.33]

/** the mesh skin's top along the slab: low at the south-west end, rising towards 7th Street */
const top = (u: number): number => {
  const t = Math.max(0, Math.min(1, (u + 110) / 110))
  return 63 + 4 * t + 10 * Math.pow(Math.max(0, (u + 40) / 40), 1.6)
}

export function federalBuilding(out: MeshBuilder, _fit: Fit): void {
  const metal = surfaceTag('metal'), glass = surfaceTag('glass'), conc = surfaceTag('concrete')
  // the mesh in the concrete look: its panel joints read as the skin's panels, where the metal look's sky sheen
  // turned the whole face lavender
  const skin = conc
  /** a quad in the slab frame, both sides drawn (so a thin plane reads from either side) */
  const quad = (a: V3, b: V3, c: V3, d: V3, colour: Rgb, tag: number, both = true): void => {
    const pa = P(...a), pb = P(...b), pc = P(...c), pd = P(...d)
    const e1 = [pb[0] - pa[0], pb[1] - pa[1], pb[2] - pa[2]], e2 = [pd[0] - pa[0], pd[1] - pa[1], pd[2] - pa[2]]
    let n: V3 = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]
    // (the landmark material draws both sides of a face: one quad does, its normal turned to the sky where it leans —
    //  a second, back-to-back copy z-fought with it and showed the canopy white from under it)
    if (both && n[1] < 0) n = [-n[0], -n[1], -n[2]]
    out.quad([pa, pb, pc, pd], n, UV, colour, tag)
  }
  /** an axis-aligned box in the slab frame */
  const B = (u0: number, u1: number, v0: number, v1: number, y0: number, y1: number, colour: Rgb, tag: number): void => {
    const c = P((u0 + u1) / 2, (y0 + y1) / 2, (v0 + v1) / 2)
    box(out, c[0], c[1], c[2], Math.abs(u1 - u0) / 2, Math.abs(y1 - y0) / 2, Math.abs(v1 - v0) / 2, colour, tag)
  }
  const S = (a: V3, b: V3, w: number, h: number, colour: Rgb, tag: number): void => strut(out, P(...a), P(...b), w, h, colour, tag)

  const U0 = -110, U1 = 0, V0 = 0, V1 = 22, BASE = 9, ROOFY = 60
  // ---- the slab's body: a dark glass lobby set back under it, the body itself, its roof
  B(U0 + 2, U1 - 3, V0 + 2, V1 - 2.5, 0, BASE, GLASS, glass)
  // (the body in two layers, so the sky garden can be cut 5 m into it)
  B(U0, U1, V0, V1 - 5, BASE, ROOFY, MESH, skin)
  B(U0, -57, V1 - 5, V1, BASE, ROOFY, MESH, skin)
  B(-45, U1, V1 - 5, V1, BASE, ROOFY, MESH, skin)
  B(-57, -45, V1 - 5, V1, BASE, 36, MESH, skin)
  B(-57, -45, V1 - 5, V1, 47, ROOFY, MESH, skin)
  quad([U0, ROOFY + 0.02, V0], [U1, ROOFY + 0.02, V0], [U1, ROOFY + 0.02, V1], [U0, ROOFY + 0.02, V1], ROOF, conc, false)

  // ---- the SE face: the mesh skin in 2 m columns up to the rising top, holed for the sky garden
  const OPEN = { u0: -57, u1: -45, y0: 36, y1: 47 }
  const LIGHT = { u0: -76, u1: -60 }
  const FOLD_TOP = -36, FOLD_BOT = -45
  const fold = (y: number): number => FOLD_BOT + (FOLD_TOP - FOLD_BOT) * (y - OPEN.y1) / (top(FOLD_TOP) - OPEN.y1)
  const FACE = V1 + 0.05
  for (let u = U0; u < U1 - 0.01; u += 2) {
    const u1 = Math.min(U1, u + 2)
    const inOpen = u1 > OPEN.u0 + 0.01 && u < OPEN.u1 - 0.01
    const spans = inOpen ? [[BASE, OPEN.y0], [OPEN.y1, top(u)]] : [[BASE, top(u)]]
    for (const [y0, y1] of spans) {
      const t1 = y1 === top(u) ? top(u1) : y1
      // right of the fold, above the opening: the lifted slice, proud of the face
      const proud = u >= FOLD_BOT && y0 >= OPEN.y1 - 0.01 ? 1.2 : 0
      quad([u, y0, FACE + proud], [u1, y0, FACE + proud], [u1, t1, FACE + proud], [u, y1, FACE + proud], proud ? MESH_PROUD : MESH, skin, false)
    }
  }
  // the crest: the skin standing above the roof, open behind — a truss of struts holds it
  for (let u = U0 + 4; u < U1; u += 8) {
    const h = top(u)
    if (h < ROOFY + 1.5) continue
    S([u, ROOFY, V1 - 6], [u, h - 0.5, V1 - 0.2], 0.25, 0.25, STEEL, metal)
    S([u, ROOFY, V1 - 0.3], [u + 4, h - 0.5, V1 - 0.3], 0.18, 0.18, STEEL, metal)
  }
  // the Stevenson side's crest: an open steel truss frame across the roof (owner's photograph from Market Street)
  for (let u = U0 + 2; u < U1 - 1; u += 6) {
    const h = ROOFY + (top(u) - ROOFY) * 0.55 + 2.5
    S([u, ROOFY, V0 + 0.3], [u, h, V0 + 0.3], 0.18, 0.18, STEEL, metal)
    S([u, ROOFY, V0 + 0.3], [Math.min(U1 - 1, u + 6), h, V0 + 0.3], 0.12, 0.12, STEEL, metal)
    S([u, h, V0 + 0.3], [u, h, V0 + 8], 0.14, 0.14, STEEL, metal)
  }
  S([U0 + 2, ROOFY + 2.5 + (top(U0 + 2) - ROOFY) * 0.55, V0 + 0.3], [U1 - 4, ROOFY + 2.5 + (top(U1 - 4) - ROOFY) * 0.55, V0 + 0.3], 0.22, 0.22, STEEL, metal)
  // the 7th Street end: the skin bent over the top into a cantilever, a glazed box under it
  quad([-10, top(-10), V1 + 0.1], [U1 + 5, top(U1) + 1.5, V1 + 0.1], [U1 + 5, top(U1) + 1.5, V0 - 0.1], [-10, top(-10) - 2, V0 - 0.1], MESH_PROUD, skin)
  B(U1 - 3, U1 + 4, V0 + 2, V1 - 2, top(U1) - 10, top(U1) - 1, GLASS, glass)
  for (const v of [V0 + 2, V1 - 2]) S([U1 + 4, top(U1) - 10, v], [U1 + 5, top(U1) + 1.5, v], 0.2, 0.2, STEEL, metal)

  // ---- the pale panel and its four boxed windows
  quad([LIGHT.u0, BASE + 4, FACE + 0.12], [LIGHT.u1, BASE + 4, FACE + 0.12], [LIGHT.u1, top(LIGHT.u1), FACE + 0.12], [LIGHT.u0, top(LIGHT.u0), FACE + 0.12], PANEL, skin, false)
  const wu = (LIGHT.u0 + LIGHT.u1) / 2 - 1.5
  for (const y of [17, 29, 40, 51]) {
    B(wu - 2.3, wu + 2.3, FACE, FACE + 1.6, y, y + 4.4, [0.9, 0.9, 0.88], metal)
    B(wu - 1.7, wu + 1.7, FACE + 1.6, FACE + 1.68, y + 0.6, y + 3.8, [0.2, 0.26, 0.3], glass)
  }

  // ---- the sky garden: a dark three-storey recess, its balcony slab and rail
  B(OPEN.u0, OPEN.u1, V1 - 5, V1 - 4.9, OPEN.y0, OPEN.y1, DARK, 0)
  for (const u of [OPEN.u0, OPEN.u1]) B(u - 0.1, u + 0.1, V1 - 5, FACE, OPEN.y0, OPEN.y1, [0.16, 0.17, 0.18], 0)
  B(OPEN.u0, OPEN.u1, V1 - 5, FACE + 0.6, OPEN.y0 - 0.4, OPEN.y0, CONCRETE, conc)
  B(OPEN.u0, OPEN.u1, V1 - 5, FACE, OPEN.y1 - 0.5, OPEN.y1, [0.2, 0.2, 0.21], 0)
  B(OPEN.u0, OPEN.u1, FACE + 0.5, FACE + 0.6, OPEN.y0, OPEN.y0 + 1.1, STEEL, metal)
  // the fold: a dark slit down from the roof to the opening, the lifted panel's edge along it, the black stair in it
  for (let y = OPEN.y1; y < top(FOLD_TOP) - 0.01; y += 2) {
    const y1 = Math.min(top(FOLD_TOP), y + 2)
    quad([fold(y) - 1.4, y, FACE + 0.15], [fold(y), y, FACE + 0.15], [fold(y1), y1, FACE + 0.15], [fold(y1) - 1.4, y1, FACE + 0.15], DARK, 0, false)
    quad([fold(y), y, FACE], [fold(y), y, FACE + 1.25], [fold(y1), y1, FACE + 1.25], [fold(y1), y1, FACE], MESH_PROUD, skin)
  }
  S([fold(OPEN.y1) - 0.7, OPEN.y1, FACE + 0.6], [fold(top(FOLD_TOP) - 3) - 0.7, top(FOLD_TOP) - 3, FACE + 0.6], 0.35, 0.35, [0.05, 0.05, 0.06], 0)

  // ---- the window slots: irregular dark horizontal runs, a floor each, not on the pale panel or round the opening
  let seed = 90
  const rnd = (): number => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return (seed % 10000) / 10000 }
  for (let y = BASE + 3; y < 62; y += 3.6) {
    let u = U0 + 1 + rnd() * 3
    while (u < U1 - 2) {
      const len = 3 + rnd() * 11
      const u1 = Math.min(U1 - 1.5, u + len)
      const clear = (a: number, b: number): boolean => b <= LIGHT.u0 - 0.5 || a >= LIGHT.u1 + 0.5
      const nearOpen = y > OPEN.y0 - 2 && y < OPEN.y1 + 1 && u1 > OPEN.u0 - 1 && u < OPEN.u1 + 1
      if (rnd() < 0.62 && clear(u, u1) && !nearOpen && y + 1 < top(u) - 2) {
        const proud = u >= FOLD_BOT && y >= OPEN.y1 ? 1.2 : 0
        B(u, u1, FACE + proud, FACE + proud + 0.08, y, y + 0.9 + rnd() * 0.5, SLOT, 0)
      }
      u = u1 + 1.5 + rnd() * 5
    }
  }

  // ---- the Stevenson face (the back, seen from Market as the rider comes down the hill): a glass wall with a grid of
  // metal in front of it — a catwalk of grating at every floor and slim frosted-glass fins between them — and a
  // darker recessed bay in the middle (owner's photograph, 2026-10-05)
  const BACK: Rgb = [0.17, 0.23, 0.23]
  quad([U1, BASE, V0 - 0.05], [U0, BASE, V0 - 0.05], [U0, ROOFY, V0 - 0.05], [U1, ROOFY, V0 - 0.05], BACK, 0, false)
  B(-66, -54, V0 - 0.12, V0 - 0.06, 26, 46, [0.12, 0.15, 0.16], 0)
  for (let y = BASE + 3.6; y < ROOFY; y += 3.6) B(U0, U1, V0 - 1.3, V0 - 0.05, y - 0.12, y, [0.5, 0.52, 0.52], metal)
  for (let u = U0 + 1.2; u < U1; u += 2.4) B(u - 0.05, u + 0.05, V0 - 1.3, V0 - 0.05, BASE, ROOFY, [0.55, 0.6, 0.6], glass)
  // ---- the ends: teal glass the height of the south-west end, the mesh on the 7th Street end
  B(U0 - 0.2, U0, V0 + 1, V1 - 1, 0, top(U0) - 1, TEAL, glass)
  for (let y = 3.6; y < top(U0) - 1; y += 3.6) B(U0 - 0.3, U0, V0 + 1, V1 - 1, y, y + 0.15, [0.15, 0.2, 0.2], metal)

  // ---- the base: the sloped slatted skirt along the plaza face
  quad([U0 + 6, BASE + 4, V1], [U1 - 6, BASE + 4, V1], [U1 - 6, BASE - 1, V1 + 6], [U0 + 6, BASE - 1, V1 + 6], [0.46, 0.46, 0.45], metal)
  for (let u = U0 + 8; u < U1 - 6; u += 12) S([u, 0, V1 + 5.5], [u, BASE - 1, V1 + 5.5], 0.2, 0.2, STEEL, metal)
  // the 7th Street end: the glass wall against the sidewalk, and the angular column jutting out over it
  B(U1 + 1.4, U1 + 1.6, V0 - 3, V1 + 4, 0, 7, [0.32, 0.4, 0.44], glass)
  for (let v = V0 - 3; v <= V1 + 4; v += 2.5) B(U1 + 1.35, U1 + 1.65, v - 0.05, v + 0.05, 0, 7, STEEL, metal)
  B(U1 + 1.2, U1 + 1.8, V0 - 3, V1 + 4, 7, 7.3, STEEL, metal)
  S([U1 + 5.5, 0, V1 + 1], [U1 - 1, 15, V1 - 4], 2.2, 1.6, [0.66, 0.66, 0.64], conc)
  S([U1 + 5.5, 0, V1 + 1], [U1 + 2.5, 6, V1 + 4.5], 1.4, 1.2, [0.62, 0.62, 0.6], conc)

  // ---- the canopy on the plaza: folded mesh planes on a truss, off a concrete plinth along 7th Street
  B(U1 + 4, U1 + 7.5, 30, 96, 0, 4.4, CONCRETE, conc)
  // (up faces, lit by sky and sun at once: set darker than the mesh looks)
  const CAN: Rgb = [0.36, 0.35, 0.33]
  // a ridge from high by the slab to low towards Mission, creased into zigzag facets either side
  const ridge = (v: number): V3 => [U1 - 9 - (v - 28) * 0.05, 17 - (v - 28) * 0.11, v]
  const east = (v: number): V3 => [U1 + 6, 4.6 + ((Math.round(v) / 12) % 2) * 1.2, v]
  const west = (v: number): V3 => [U1 - 34, 1.2 + ((Math.round(v) / 12) % 2) * 3.5, v]
  for (let v = 28; v < 94; v += 11) {
    const v1 = v + 11
    const crease = (v - 28) / 11 % 2 === 0 ? 1.5 : -1.5
    const r0 = ridge(v), r1 = ridge(v1)
    const e0 = east(v), e1 = east(v1), w0 = west(v), w1 = west(v1)
    // two facets a side, the crease between them up or down by turns: the zigzag
    const em: V3 = [(r0[0] + e0[0]) / 2, (r0[1] + e0[1]) / 2 + crease, v + 5.5]
    const wm: V3 = [(r0[0] + w0[0]) / 2, (r0[1] + w0[1]) / 2 - crease, v + 5.5]
    quad(r0, e0, em, em, CAN, conc); quad(e0, e1, em, em, CAN, conc); quad(e1, r1, em, em, CAN, conc); quad(r1, r0, em, em, CAN, conc)
    quad(r0, w0, wm, wm, CAN, conc); quad(w0, w1, wm, wm, CAN, conc); quad(w1, r1, wm, wm, CAN, conc); quad(r1, r0, wm, wm, CAN, conc)
    // the truss under the ridge
    S([r0[0], 0, v], r0, 0.3, 0.3, STEEL, metal)
    S([r0[0] - 6, 0, v + 5], [r0[0], r0[1] - 0.5, v], 0.2, 0.2, STEEL, metal)
    S([r0[0] + 6, 4.4, v + 5], [r0[0], r0[1] - 0.5, v], 0.2, 0.2, STEEL, metal)
  }
  // the canopy's open end towards Mission: the truss in its triangle
  const re = ridge(94), ee = east(94), we = west(94)
  for (const [a, b] of [[re, ee], [re, we], [ee, we], [[re[0], 0, 94] as V3, re], [[re[0], 0, 94] as V3, ee], [[re[0], 0, 94] as V3, we]] as [V3, V3][]) S(a, b, 0.25, 0.25, STEEL, metal)
  // the café under it (98 7th Street, OSM way/32864112, which the bake drew as a 12 m flat): a low glass pavilion
  B(-21, -2, 80, 100, 0, 4.6, GLASS, glass)
  B(-21.4, -1.6, 79.6, 100.4, 4.6, 5.1, [0.3, 0.3, 0.3], metal)
  // …walled in concrete on its street sides, the plinth turning the corner onto Mission (the owner's 7th and Mission photo)
  B(-21.6, U1 + 7.5, 100, 102, 0, 4.4, CONCRETE, conc)
  B(-2, U1 + 4, 80, 100, 0, 4.4, CONCRETE, conc)

  // ---- the annex: five storeys, white end walls, its long glass front on the plaza
  const A = { u0: -101, u1: -68, v0: 30, v1: 100, h: 18 }
  B(A.u0, A.u1, A.v0, A.v1, 0, A.h, WHITE, conc)
  quad([A.u0, A.h + 0.02, A.v0], [A.u1, A.h + 0.02, A.v0], [A.u1, A.h + 0.02, A.v1], [A.u0, A.h + 0.02, A.v1], ROOF, conc, false)
  for (const [u0, u1, v0, v1] of [[A.u0 + 6, A.u0 + 12, A.v0 + 10, A.v0 + 30], [A.u0 + 16, A.u0 + 26, A.v0 + 40, A.v0 + 52]]) B(u0, u1, v0, v1, A.h, A.h + 1.6, [0.7, 0.7, 0.68], conc)
  B(A.u1, A.u1 + 0.15, A.v0 + 3, A.v1 - 3, 0.5, A.h - 1.2, [0.26, 0.34, 0.38], glass)
  for (let v = A.v0 + 3; v <= A.v1 - 3; v += 3) B(A.u1 + 0.1, A.u1 + 0.3, v - 0.07, v + 0.07, 0.5, A.h - 1.2, [0.85, 0.85, 0.84], metal)
  for (let y = 4.2; y < A.h - 1; y += 4.2) B(A.u1 + 0.1, A.u1 + 0.35, A.v0 + 3, A.v1 - 3, y - 0.1, y + 0.1, [0.85, 0.85, 0.84], metal)
  // its Mission Street end glazed too, under a white frame
  B(A.u0 + 3, A.u1 - 3, A.v1, A.v1 + 0.15, 0.5, 9, [0.26, 0.34, 0.38], glass)
}

export const FEDERAL_BUILDING: Record<string, (out: MeshBuilder, fit: Fit) => void> = { federalBuilding }
