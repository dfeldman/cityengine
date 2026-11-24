import { capPolygonWithHoles, type MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import type { Fit } from '../../../fit.ts'
import { beam, hex, lathe, prism, shade } from '../../../kit.ts'
import { ccw, FIXED, UV, type P2 } from '../../monuments/common.ts'

/*
 * THE BOSQUETS' MINOR ARCHITECTURE, Parc de Versailles: stone curbs round OSM's water (the bake draws the water and tools/versailles-fountains.py
 * its jets; never here), the white marble balustrade of the Dômes, the stepped curb of the Obélisque, and the three gilded-bead
 * fountains of Jean-Michel Othoniel's "Belles Danses" (2015) in the Théâtre d'Eau. Local frame: origin at each entry's lat/lon (the
 * water's node mean), x east, z north, as OSM's rings were measured with osmium on the Île-de-France pbf. Heights, widths and the bead
 * counts are guessed from photographs. Sculpture (the Enfants dorés' putti, the France Triomphante group) is a stand-in; the real
 * pieces are queued in guided-queue.md.
 */
type R2 = [number, number][]

// tunables (metres)
const CURB = { out: 0.5, h: 0.3, depth: 0.3, cope: 0.05, copeH: 0.07 }     // a basin's kerb: width outside the water, height over the ground, inner face depth
const STEP = { w: 0.55, h: 0.14 }                                             // a step outside the kerb (the Obélisque)
const BAL = { h: 1.0, base: 0.3, w: 0.32, post: 0.07, pitch: 0.34, pier: 0.5, pierH: 1.45, out: 0.4 }  // the Dômes' balustrade
const BEAD = { r: 0.09, step: 0.19, sides: 6 }                                // Othoniel's beads: radius, spacing along a strand
const BELLE = { h: 4.2, r0: 0.5, r1: 1.7, strands: 7, turns: 1.4, sway: 0.3 }  // one fountain: height, waist radius, rim radius, strands, helical turns, wobble
const STONE: Rgb = hex('#c9c3b2'), MARBLE: Rgb = hex('#e6e2d6'), GOLD: Rgb = hex('#d9a82e'), LEAD: Rgb = hex('#7d6a36'), BRONZE: Rgb = hex('#3b3a2c')

const groundOf = (fit: Fit) => (x: number, z: number): number => (fit.groundAt ? fit.groundAt(x, z) : (fit.grade ?? 0))
const toP = (r: R2): P2[] => r.map(([x, z]) => ({ x, z }))

/** a counter-clockwise ring moved outward by d (mitred corners, clamped) */
function offset(ring: P2[], d: number): P2[] {
  const n = ring.length
  return ring.map((p, i) => {
    const a = ring[(i + n - 1) % n], b = ring[(i + 1) % n]
    const n1 = unit(p.z - a.z, a.x - p.x), n2 = unit(b.z - p.z, p.x - b.x)
    let mx = n1[0] + n2[0], mz = n1[1] + n2[1]
    const l = Math.hypot(mx, mz)
    if (l < 1e-6) return { x: p.x + n1[0] * d, z: p.z + n1[1] * d }
    mx /= l; mz /= l
    const k = Math.min(2.5, 1 / Math.max(0.4, mx * n1[0] + mz * n1[1]))
    return { x: p.x + mx * d * k, z: p.z + mz * d * k }
  })
}
const unit = (x: number, z: number): [number, number] => { const l = Math.hypot(x, z) || 1; return [x / l, z / l] }

/** vertical wall along a ccw ring, facing outward (or inward) */
function wall(out: MeshBuilder, ring: P2[], y0: number, y1: number, c: Rgb, inward: boolean): void {
  const n = ring.length
  for (let i = 0; i < n; i++) {
    const a = ring[i], b = ring[(i + 1) % n]
    const [ux, uz] = unit(b.x - a.x, b.z - a.z), s = inward ? -1 : 1
    out.quad([[a.x, y0, a.z], [b.x, y0, b.z], [b.x, y1, b.z], [a.x, y1, a.z]], [uz * s, 0, -ux * s], UV, c, FIXED)
  }
}

/** a stone kerb round a water ring: outer face, coping, flat top with the water as its hole, inner face down below the water; `steps` outer steps */
function curb(out: MeshBuilder, g: number, water0: R2, o: { h?: number; out?: number; steps?: number; c?: Rgb } = {}): void {
  const h = o.h ?? CURB.h, w = o.out ?? CURB.out, c = o.c ?? STONE
  const water = ccw(toP(water0)), nst = o.steps ?? 0
  for (let k = nst; k >= 1; k--) {
    const d = w + k * STEP.w, top = g + STEP.h * (nst - k + 1) * 0.8
    wall(out, ccw(offset(water, d)), g - 0.05, top, shade(c, 0.95), false)
    capPolygonWithHoles(out, [ccw(offset(water, d)), [...ccw(offset(water, d - STEP.w))].reverse()], top, shade(c, 1.04 - k * 0.02), FIXED)
  }
  const outer = ccw(offset(water, w)), cope = ccw(offset(water, w + CURB.cope))
  wall(out, outer, g - 0.05, g + h, c, false)
  wall(out, cope, g + h - CURB.copeH, g + h, shade(c, 1.05), false)
  capPolygonWithHoles(out, [cope, [...water].reverse()], g + h, shade(c, 1.08), FIXED)
  wall(out, water, g - CURB.depth, g + h, shade(c, 0.82), true)
}

/** the kerb as separate slabs along the edges `keep` accepts (where two water bodies touch, the shared edge has none) */
function rim(out: MeshBuilder, g: number, water0: R2, keep: (x: number, z: number) => boolean, c: Rgb = STONE): void {
  const water = ccw(toP(water0)), outer = ccw(offset(water, CURB.out)), n = water.length, h = CURB.h
  for (let i = 0; i < n; i++) {
    const a = water[i], b = water[(i + 1) % n], A = outer[i], B = outer[(i + 1) % n]
    if (!keep((a.x + b.x) / 2, (a.z + b.z) / 2)) continue
    const [ux, uz] = unit(b.x - a.x, b.z - a.z)
    out.quad([[a.x, g + h, a.z], [b.x, g + h, b.z], [B.x, g + h, B.z], [A.x, g + h, A.z]], [0, 1, 0], UV, shade(c, 1.08), FIXED)
    out.quad([[A.x, g - 0.05, A.z], [B.x, g - 0.05, B.z], [B.x, g + h, B.z], [A.x, g + h, A.z]], [uz, 0, -ux], UV, c, FIXED)
    out.quad([[b.x, g - CURB.depth, b.z], [a.x, g - CURB.depth, a.z], [a.x, g + h, a.z], [b.x, g + h, b.z]], [-uz, 0, ux], UV, shade(c, 0.82), FIXED)
  }
}

/** a gilded bead: a six-sided sphere (lathe) */
function bead(out: MeshBuilder, x: number, y: number, z: number, r: number): void {
  lathe(out, x, z, [[0.01, y - r], [r * 0.87, y - r * 0.5], [r, y], [r * 0.87, y + r * 0.5], [0.01, y + r]], BEAD.sides, GOLD)
}

/** a strand of beads along a polyline (spacing BEAD.step) */
function strand(out: MeshBuilder, pts: [number, number, number][]): void {
  let carry = 0
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i], b = pts[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])
    for (let t = carry; t < l; t += BEAD.step) bead(out, a[0] + ((b[0] - a[0]) * t) / l, a[1] + ((b[1] - a[1]) * t) / l, a[2] + ((b[2] - a[2]) * t) / l, BEAD.r)
    carry = ((carry - l) % BEAD.step + BEAD.step) % BEAD.step
  }
}

/** one of Othoniel's Belles Danses: gilded bead strands spiralling up from a narrow foot, swelling to a flared rim like a dancer's skirt, on a stone-cased foot */
function belleDanse(out: MeshBuilder, cx: number, cz: number, y0: number, phase: number): void {
  const B = BELLE
  prism(out, cx, cz, y0, y0 + 0.25, 0.8, 12, BRONZE, FIXED, 0.8)
  for (let s = 0; s < B.strands; s++) {
    const pts: [number, number, number][] = []
    const N = 36
    for (let i = 0; i <= N; i++) {
      const t = i / N
      const prof = B.r0 + (B.r1 - B.r0) * t * t * (1.2 - 0.2 * t)         // skirt flare
      const a = phase + (s / B.strands) * Math.PI * 2 + t * B.turns * Math.PI * 2 + Math.sin(t * 9 + s) * B.sway * 0.3
      pts.push([cx + Math.cos(a) * prof, y0 + 0.25 + t * (B.h - 0.25), cz + Math.sin(a) * prof])
    }
    strand(out, pts)
  }
}

// ---- the works: OSM's rings, metres about each entry's lat/lon
/** the Théâtre d'Eau's pool (way/501237487) and where the three Belles Danses stand in it */
const THEATRE: R2 = [[-8.08, 14.16], [-12.8, 12.41], [-13.31, 7.7], [-13.23, 3.42], [-11.68, -0.59], [-10.36, -2.52], [-8.52, -4.27], [-5.18, -6.66], [-1.33, -8.2], [3.12, -8.8], [6.8, -8.29], [10.32, -6.75], [12.55, -4.87], [15.46, -2.05], [16.57, 0.43], [14.8, 4.87], [4.86, 10.03]]
/** the Théâtre d'Eau's curved water (relation 12713813: a crescent moat 15 m wide round the pool, with a round island at its east end) */
const THEATRE_MOAT: R2 = [[-41.48, 27.82], [-41.13, 25.32], [-39.47, 24.14], [-39.19, 23.17], [-38.15, 18.17], [-36.55, 13.87], [-34.95, 12.55], [-29.39, 10.12], [-27.93, 10.61], [-25.57, 11.72], [-22.23, 14.36], [-19.73, 16.09], [-16.11, 16.92], [-14.17, 16.71], [-2.77, 12.89], [4.91, 10.29], [16.2, 4.36], [19.26, 2.15], [25.86, -8.9], [33.16, -11.32], [58.11, -12.37], [61.86, -2.92], [43.17, 14.14], [36.63, 16.99], [22.88, 12.69], [20.51, 13.74], [-6.68, 25.91], [-11.73, 28.17], [-13.79, 33.27], [-15.45, 38.12], [-17.05, 41.18], [-20.73, 42.42], [-24.14, 42.29], [-27.69, 40.83], [-30.75, 39.65], [-33.77, 38.02], [-34.67, 38.71], [-35.37, 38.23], [-37.38, 36.84], [-39.95, 34.96], [-41.34, 31.77]]
const THEATRE_ISLE = { x: 44.7, z: -0.9, r: 6.4 }
const BELLES: [number, number, number][] = [[-5.5, 1.5, 0.0], [5.0, -2.5, 2.1], [4.5, 5.5, 4.2]]
/** the Bassin des Enfants dorés (way/124536153) */
const ENFANTS: R2 = [[-3.89, 4.44], [-2.77, 5.34], [-1.69, 5.96], [-0.34, 6.47], [0.95, 6.52], [2.08, 6.21], [3.48, 5.62], [4.93, 4.44], [5.9, 2.83], [6.32, 1.0], [6.39, -0.77], [5.98, -2.72], [5.13, -4.42], [4.28, -5.39], [2.88, -6.42], [0.93, -7.03], [-0.98, -7.19], [-2.5, -6.81], [-4.1, -5.63], [-5.04, -4.27], [-5.62, -2.82], [-5.95, -1.18], [-6.02, 0.53], [-5.6, 1.99], [-4.76, 3.29]]
/** the three basins of the Trois Fontaines (ways 92619280, 92619249, 193502508), about the middle one's node mean; the slope falls toward the first */
const TROIS: R2[] = [
  [[-7.03, -17.75], [-5.25, -18.76], [-4.3, -20.32], [-4.14, -21.75], [-4.64, -23.41], [-5.72, -24.6], [-7.08, -25.22], [-8.43, -25.3], [-9.64, -24.95], [-10.88, -24.0], [-11.7, -22.47], [-11.77, -20.81], [-11.1, -19.23], [-9.97, -18.2], [-8.51, -17.67]],
  [[-3.32, 2.29], [-8.15, -10.6], [-0.62, -13.41], [4.21, -0.52], [2.84, -0.06], [2.74, 0.97], [2.45, 1.54], [2.07, 2.01], [1.46, 2.48], [0.89, 2.72], [0.19, 2.85], [-0.32, 2.81], [-0.85, 2.69], [-1.45, 2.4], [-2.15, 1.82]],
  [[5.36, 28.9], [15.93, 24.99], [12.02, 14.49], [1.45, 18.42]],
]
/** the Bassin des Dômes (way/124531671) */
const DOMES: R2 = [[2.43, 7.94], [7.62, 3.28], [7.52, 2.57], [8.04, 1.99], [6.71, -5.0], [6.04, -5.28], [5.85, -5.95], [-0.91, -8.28], [-1.58, -7.99], [-2.19, -7.99], [-7.63, -3.1], [-7.58, -2.33], [-8.15, -1.77], [-6.73, 4.75], [-6.06, 5.18], [-5.77, 6.0], [0.81, 8.18], [1.57, 7.8]]
/** the Obélisque's basin (way/124531638), an elongated octagon */
const OBELISQUE: R2 = [[-15.58, 9.55], [1.21, 18.26], [4.59, 16.57], [16.29, -5.73], [15.61, -9.44], [-1.18, -18.15], [-4.62, -16.67], [-16.32, 5.61]]
/** the Dauphin's basin (way/95475829) and La France triomphante's (way/92619237) */
const DAUPHIN: R2 = [[0.42, 4.57], [2.31, 3.89], [3.73, 2.52], [4.36, 1.19], [4.53, -0.57], [4.19, -1.96], [3.37, -3.27], [2.04, -4.33], [0.34, -4.86], [-1.54, -4.69], [-3.27, -3.77], [-4.51, -2.16], [-4.97, -0.28], [-4.62, 1.65], [-3.57, 3.24], [-2.11, 4.22], [-0.69, 4.59]]
const FRANCE: R2 = [[-2.4, 3.1], [-3.3, 2.25], [-3.61, 1.49], [-2.61, -0.89], [-1.86, -1.65], [-0.83, -2.21], [0.44, -2.0], [1.97, -1.51], [2.02, -1.14], [2.53, -0.97], [3.0, -0.82], [3.19, -0.1], [1.46, 4.44]]

const mean = (r: R2): [number, number] => [r.reduce((s, p) => s + p[0], 0) / r.length, r.reduce((s, p) => s + p[1], 0) / r.length]

/** where the stand-ins and Modly pieces attach (local x, y over the ground, z) */
export const ENFANTS_PUTTI = { n: 8, r: 0.9, h: 0.9 }   // 8 gilded groups on the kerb, standing this far outside the water's edge, this tall

/** the Théâtre d'Eau: the pool's kerb and Othoniel's three Belles Danses, on the pool's floor */
export function versaillesTheatreEau(out: MeshBuilder, fit: Fit): void {
  const g = groundOf(fit)(0, 0)
  curb(out, g, THEATRE_MOAT, { h: 0.25 })
  rim(out, g, THEATRE, (x, z) => !(z > 3 && x > -10 && x < 17) && z > -9.5)   // the pool's kerb, but not on its north side where it joins the moat
  const I = THEATRE_ISLE
  prism(out, I.x, I.z, g - 0.2, g + 0.3, I.r, 16, shade(STONE, 0.9), FIXED, I.r)
  for (const [x, z, ph] of BELLES) belleDanse(out, x, z, g - 0.15, ph)
}

/** the Bassin des Enfants dorés: a kerb, and eight gilded children standing round it (stand-ins; the Modly group is queued) */
export function versaillesEnfantsDores(out: MeshBuilder, fit: Fit): void {
  const g = groundOf(fit)(0, 0), P = ENFANTS_PUTTI
  curb(out, g, ENFANTS, { h: 0.34 })
  const w = ccw(toP(ENFANTS)), o = offset(w, CURB.out - 0.1)
  for (let i = 0; i < P.n; i++) {
    const p = o[Math.floor((i / P.n) * o.length)]
    prism(out, p.x, p.z, g + CURB.h, g + CURB.h + 0.12, 0.28, 8, STONE, FIXED, 0.26)
    beam(out, [p.x, g + CURB.h + 0.12, p.z], [p.x, g + CURB.h + P.h * 0.6, p.z], 0.11, GOLD)
    prism(out, p.x, p.z, g + CURB.h + P.h * 0.6, g + CURB.h + P.h * 0.85, 0.09, 7, GOLD, FIXED, 0.08)
  }
}

/** the Bosquet des Trois Fontaines: three kerbed basins stepping up a slope, each at its own ground height */
export function versaillesTroisFontaines(out: MeshBuilder, fit: Fit): void {
  const G = groundOf(fit)
  for (const r of TROIS) { const [cx, cz] = mean(r); curb(out, G(cx, cz), r, { h: 0.35 }) }
}

/** the Bassin des Dômes: its marble balustrade (a plinth, balusters, a rail, piers with urns every corner) round the water */
export function versaillesBassinDomes(out: MeshBuilder, fit: Fit): void {
  const g = groundOf(fit)(0, 0), B = BAL
  const water = ccw(toP(DOMES)), ring = ccw(offset(water, B.out))
  wall(out, water, g - 0.3, g + 0.1, shade(MARBLE, 0.85), true)
  const n = ring.length
  for (let i = 0; i < n; i++) {
    const a = ring[i], b = ring[(i + 1) % n], l = Math.hypot(b.x - a.x, b.z - a.z)
    if (l < 1) continue
    const [ux, uz] = unit(b.x - a.x, b.z - a.z), nx = uz, nz = -ux
    const quad = (y0: number, y1: number, d: number, c: Rgb): void => {
      const q = (t: number, s: number, y: number): [number, number, number] => [a.x + ux * t + nx * s, y, a.z + uz * t + nz * s]
      out.quad([q(0, d, y1), q(l, d, y1), q(l, -d, y1), q(0, -d, y1)], [0, 1, 0], UV, shade(c, 1.06), FIXED)   // top
      out.quad([q(0, d, y0), q(l, d, y0), q(l, d, y1), q(0, d, y1)], [nx, 0, nz], UV, c, FIXED)               // outer face
      out.quad([q(l, -d, y0), q(0, -d, y0), q(0, -d, y1), q(l, -d, y1)], [-nx, 0, -nz], UV, shade(c, 0.9), FIXED)  // inner face
    }
    quad(g, g + B.base, B.w / 2, MARBLE)
    quad(g + B.h - 0.12, g + B.h, B.w / 2 + 0.03, MARBLE)
    const m = Math.max(1, Math.round(l / B.pitch))
    for (let k = 0; k < m; k++) {
      const t = ((k + 0.5) / m) * l
      lathe(out, a.x + ux * t, a.z + uz * t, [[B.post * 0.8, g + B.base], [B.post * 0.55, g + B.base + 0.1], [B.post, g + B.base + 0.3], [B.post * 0.55, g + B.h - 0.3], [B.post * 0.8, g + B.h - 0.12]], 6, MARBLE)
    }
  }
  for (let i = 0; i < n; i++) {   // a pier and urn at each corner where the sides turn
    const p = ring[i], a = ring[(i + n - 1) % n], b = ring[(i + 1) % n]
    if (Math.hypot(p.x - a.x, p.z - a.z) < 1.5 && Math.hypot(b.x - p.x, b.z - p.z) < 1.5) continue
    prism(out, p.x, p.z, g, g + B.pierH, B.pier / 2, 4, MARBLE, FIXED, B.pier * 0.4)
    lathe(out, p.x, p.z, [[0.02, g + B.pierH], [0.17, g + B.pierH + 0.1], [0.2, g + B.pierH + 0.3], [0.1, g + B.pierH + 0.5], [0.13, g + B.pierH + 0.6]], 8, MARBLE)
  }
}

/** the Obélisque's basin: a kerb of two steps all round OSM's long octagon (the sheaf of jets is the bake's) */
export function versaillesObeliscBasin(out: MeshBuilder, fit: Fit): void {
  curb(out, groundOf(fit)(0, 0), OBELISQUE, { h: 0.3, steps: 2 })
}

/** the Dauphin's and the Arc de Triomphe's small basins: a plain kerb round the water */
export function versaillesBassinDauphin(out: MeshBuilder, fit: Fit): void { curb(out, groundOf(fit)(0, 0), DAUPHIN) }
export function versaillesBassinFranceTriomphante(out: MeshBuilder, fit: Fit): void {
  const g = groundOf(fit)(0, 0)
  curb(out, g, FRANCE, { c: shade(STONE, 0.95) })
  const [cx, cz] = mean(FRANCE)   // the bronze/lead group's rock-plinth stand-in
  prism(out, cx, cz, g, g + 0.5, 0.9, 8, shade(STONE, 0.8), FIXED, 0.8)
  beam(out, [cx, g + 0.5, cz], [cx, g + 1.9, cz], 0.2, LEAD)
}
