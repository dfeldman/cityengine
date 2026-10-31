import { MeshBuilder } from '../../buildings.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { block, hex, prism, shade, type Rgb } from '../kit.ts'
import type { Fit } from '../fit.ts'
import { strut } from '../../models.ts'
import { EMIT } from '../../models.ts'
import { Relief, beast, figure, smallFigure, type V } from './minor/sculpt.ts'

/**
 * THE ARC DE TRIOMPHE (Chalgrin, 1806–36; owner, 2026-10-30: "as one of the most importent monuments in the world, this could use a
 * detailed model"). Until now four piers and some slabs with one block standing for each of the great groups. Now:
 *
 * - the real proportions (Wikipedia: 49.54 m high, 44.82 wide, 22.21 deep; the great vault 29.19 m to its crown and 14.62 wide, the
 *   transverse vaults 18.68 and 8.44), the openings cut true, the great vault coffered, the transverse vaults coffered where they
 *   cross it, the battle names on the jambs inside and the allegories over the transverse arches;
 * - the four groups as what they are, massed figures on their pedestals, each figure's joints read off its photograph on Commons:
 *   Rude's Départ de 1792 ("Le Départ des Volontaires (La Marseillaise) par Rude, Arc de Triomphe Etoile Paris.jpg"), Cortot's
 *   Triomphe de 1810 ("Le triomphe de 1810, Jean-Pierre Cortot, Arc triomphe Paris.jpg"), Etex's Résistance and Paix ("Arc de
 *   Triomphe, la Résistance de 1814, Antoine Etex.jpg", "Arc de Triomphe Etoile, Antoine Etex, la Paix de 1815.jpg");
 * - the six high reliefs in their frames (battles in general: their figures are not read off anything), Pradier's Victories in the
 *   spandrels, the Greek key under the impost (South Inner Arch from the East, Arc de Triomphe, Paris.jpg), the great frieze of the
 *   armies going out and coming home, round all four faces;
 * - the cornice on its consoles, the attic with its 30 shields between sword panels, counted off "Arc de Triomphe de l'Étoile in
 *   July 2011.jpg" as 11 on each long face and 4 on each short, the crest; on the top the terrace and the glass dome IGN's aerial
 *   photograph shows there;
 * - the tomb of the Unknown Soldier under the vault with its flame, and the ring of stone bollards and chains round the monument
 *   (r = 56 m off the aerial, the dark posts of the inner ring at r = 39 m; the chains on the outer ring from the same photograph
 *   and Mapillary, not surveyed).
 *
 * Long faces ±z. The entry's front, 116, turns −z down the Champs-Élysées (a shot from bearing 296 sees +z: fitAt's rotation is the bearing
 * + 180, as for an entry placed by point): the Marseillaise is on the viewer's right as he comes up the Champs, the north pier, local
 * +x; on the Grande Armée face (+z) the Résistance is on the viewer's right. Each face is drawn once, in its own frame looking at −z,
 * and turned into place. Round the monument the place itself, which the city has as grass and sand: pale flags to the inner ring, setts
 * to the outer, off the aerial.
 */
const STONE: Rgb = hex('#e4dccb')
const TRIM: Rgb = shade(STONE, 0.93)
const BAND: Rgb = shade(STONE, 0.85)
const DEEP: Rgb = shade(STONE, 0.7)
const VAULT: Rgb = shade(STONE, 0.56)
const SOFFIT: Rgb = shade(STONE, 0.62)
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

const HX = 22.41
const HZ = 11.1
const GW = 7.31       // half the great arch
const GS = 21.88      // its springing; the crown is 29.19
const TW = 4.22       // half the transverse arch
const TS = 14.46      // its springing; the crown is 18.68
const PIER = 30.9     // the walls' head, under the entablature
const TOP = 49.54

const plain = surfaceTag('stucco')

/** A wall on the plane z = −d, facing −z, from x0 to x1 and y0 to y1, with a round-headed opening about x = 0. */
function archedWall(q: MeshBuilder, d: number, hw: number, y0: number, y1: number, r: number, s: number, c: Rgb, n = 24): void {
  const N: [number, number, number] = [0, 0, -1]
  q.quad([[-hw, y0, -d], [-r, y0, -d], [-r, y1, -d], [-hw, y1, -d]], N, UV, c, 0)
  q.quad([[r, y0, -d], [hw, y0, -d], [hw, y1, -d], [r, y1, -d]], N, UV, c, 0)
  for (let i = 0; i < n; i++) {
    const a0 = Math.PI - (i / n) * Math.PI, a1 = Math.PI - ((i + 1) / n) * Math.PI
    const x0 = Math.cos(a0) * r, x1 = Math.cos(a1) * r
    q.quad([[x0, s + Math.sin(a0) * r, -d], [x1, s + Math.sin(a1) * r, -d], [x1, y1, -d], [x0, y1, -d]], N, UV, c, 0)
  }
}

/** A band round an arch: from radius r0 to r1 about (0, s), `p` proud of the wall, its inner edge returned to the wall. */
function archBand(q: MeshBuilder, d: number, r0: number, r1: number, s: number, p: number, c: Rgb, n = 24, tag = plain): void {
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI, a1 = ((i + 1) / n) * Math.PI
    const P = (r: number, a: number, w: number): [number, number, number] => [Math.cos(a) * r, s + Math.sin(a) * r, -d - w]
    q.quad([P(r0, a0, p), P(r1, a0, p), P(r1, a1, p), P(r0, a1, p)], [0, 0, -1], UV, c, tag)
    const m = (a0 + a1) / 2
    q.quad([P(r0, a0, 0), P(r0, a0, p), P(r0, a1, p), P(r0, a1, 0)], [-Math.cos(m), -Math.sin(m), 0], UV, shade(c, 0.8), tag)
    q.quad([P(r1, a0, 0), P(r1, a0, p), P(r1, a1, p), P(r1, a1, 0)], [Math.cos(m), Math.sin(m), 0], UV, shade(c, 0.95), tag)
  }
}

/** A flat band on a face, t0..t1 along it, y0..y1, `p` proud (a slab, so it has its top and its underside). */
function slab(q: MeshBuilder, d: number, t0: number, t1: number, y0: number, y1: number, p: number, c: Rgb, tag = plain): void {
  block(q, t0, t1, -d - p, -d + 0.02, y0, y1, c)
  void tag
}
/** The same, sloped: a moulding from `p0` proud at y0 to `p1` at y1, its face tilted. */
function cove(q: MeshBuilder, d: number, t0: number, t1: number, y0: number, y1: number, p0: number, p1: number, c: Rgb): void {
  const ny = (p1 - p0) / Math.hypot(y1 - y0, p1 - p0)
  q.quad([[t0, y0, -d - p0], [t1, y0, -d - p0], [t1, y1, -d - p1], [t0, y1, -d - p1]], [0, -ny, -1], UV, c, plain)
}

/** A flat rectangle laid on a face, `p` proud. */
function flat(q: MeshBuilder, d: number, t0: number, t1: number, y0: number, y1: number, p: number, c: Rgb, tag = plain): void {
  q.quad([[t0, y0, -d - p], [t1, y0, -d - p], [t1, y1, -d - p], [t0, y1, -d - p]], [0, 0, -1], UV, c, tag)
}

/** The Greek key of the impost: a meander in the darker tone cut along a band, `h` tall. One unit is five bars. */
function greekKey(q: MeshBuilder, d: number, t0: number, t1: number, y0: number, h: number, p: number): void {
  const n = Math.max(1, Math.round((t1 - t0) / (h * 1.15)))
  const w = (t1 - t0) / n
  const b = h * 0.11
  for (let i = 0; i < n; i++) {
    const x = t0 + i * w
    const bar = (a: number, c: number, e: number, f: number): void => flat(q, d, x + a * w, x + c * w, y0 + e * h, y0 + f * h, p, DEEP)
    bar(0, 0.84, 0.08, 0.08 + b / h)          // the foot
    bar(0.76, 0.84, 0.08, 0.92)               // the far riser
    bar(0.18, 0.84, 0.92 - b / h, 0.92)       // the head
    bar(0.18, 0.26, 0.38, 0.92)               // back down
    bar(0.18, 0.58, 0.38, 0.38 + b / h)       // and the last turn in
  }
}

/** A row of little leaves in two tones, an egg-and-dart at riding distance. */
function leafBand(q: MeshBuilder, d: number, t0: number, t1: number, y0: number, y1: number, p: number, pitch = 0.55): void {
  const n = Math.max(1, Math.round((t1 - t0) / pitch))
  const w = (t1 - t0) / n
  for (let i = 0; i < n; i++) {
    const x = t0 + i * w
    flat(q, d, x + w * 0.14, x + w * 0.86, y0 + (y1 - y0) * 0.1, y1, p, TRIM)
    q.quad([[x + w * 0.14, y0 + (y1 - y0) * 0.1, -d - p], [x + w * 0.86, y0 + (y1 - y0) * 0.1, -d - p], [x + w * 0.5, y0, -d - p], [x + w * 0.5, y0, -d - p]], [0, 0, -1], UV, BAND, plain)
  }
}

/* --------------------------------------------------------------------------------- the four groups, read off their photographs */

/** Rude. Group frame: u across, v up from the plinth's top, 12 m to the Genius's hand. */
function marseillaise(r: Relief): void {
  // what is behind them: the banners and spears, the Genius's cloak, a round shield at the bottom
  r.drape([[-3.3, 8.7, 0.3], [-1.6, 8.1, 0.7], [0.8, 6.9, 0.7], [3.2, 6.4, 0.8], [4.8, 5.8, 0.6]], [0.9, 1.5, 1.5, 1.3, 0.5], 0.28, 5)
  r.drape([[-3.5, 9.6, 0.3], [-3, 8.6, 0.4], [-2.2, 7, 0.5], [-1.2, 6.2, 0.5]], [0.3, 0.9, 1, 0.6], 0.22, 3)
  for (let i = 0; i < 5; i++) r.blade([-3 + i * 0.05, 8.2 - i * 0.2, 0.2], [-4.3 + i * 0.28, 9.5 - i * 0.55, 0.14], 0.1)
  r.lump([-3.7, 9.6, 0.3], 0.2, 0.32, 0.2, 4) // the cockerel on its staff
  r.tube([-3.6, 9.3, 0.2], [-3.3, 8.2, 0.3], 0.08, 0.1, 4)
  r.lump([-0.1, 1.05, 0.5], 1.05, 1.05, 0.2, 9)  // the round shield
  // the Genius of Liberty, over them, flying to the viewer's left: the sword arm out, the other arm up
  r.wing([0.9, 8.9, 0.75], -0.5, 0.5, 4.6, 11)
  r.wing([0.2, 9.2, 0.45], 1.0, 2.1, 3.2, 8)
  figure(r, {
    k: 0.92, hip: [0.65, 7.4, 1.05], chest: [0.2, 8.7, 1.1], head: [-0.05, 9.9, 1.2],
    armL: [[-1.25, 8.75, 1.3], [-3.0, 9.05, 1.2]], armR: [[1.15, 10.2, 1.1], [1.75, 11.9, 0.9]],
    legL: [[-0.45, 6.75, 1.25], [-1.45, 6.3, 1.15]], legR: [[2.1, 6.95, 1.1], [3.25, 6.05, 0.9]],
    helmet: true,
  })
  r.tube([-3.05, 9.05, 1.25], [-4.85, 9.35, 1.0], 0.1, 0.03, 3, 0.4)   // the sword, pointing the way
  // the bearded chief at the centre, his arm raised, striding left
  figure(r, {
    k: 1, hip: [-0.35, 2.75, 1.2], chest: [-0.2, 4.35, 1.3], head: [-0.15, 5.95, 1.45],
    armL: [[-1.35, 5.05, 1.2], [-2.1, 6.9, 1.0]], armR: [[0.75, 4.75, 1.4], [1.0, 5.55, 1.3]],
    legL: [[-1.25, 1.65, 1.35], [-2.55, 0.15, 1.2]], legR: [[-0.35, 1.2, 1.4], [-0.75, 0.12, 1.3]],
  })
  // the naked youth pressed to him, on the viewer's right of him
  figure(r, {
    k: 0.92, hip: [1.5, 2.55, 1.35], chest: [1.55, 3.95, 1.4], head: [1.7, 5.15, 1.5],
    armL: [[0.8, 4.05, 1.4], [0.5, 3.3, 1.4]], armR: [[2.25, 3.25, 1.5], [2.05, 2.75, 1.55]],
    legL: [[0.85, 1.5, 1.45], [0.05, 0.12, 1.35]], legR: [[2.15, 1.35, 1.45], [2.95, 0.12, 1.3]],
  })
  // the old warrior in his robe and helmet at the right, the great oval shield behind him
  r.lump([4.25, 3.3, 0.45], 0.55, 2.15, 0.35, 7)
  figure(r, {
    k: 1, hip: [3.15, 2.6, 0.85], chest: [3.25, 3.95, 0.9], head: [3.25, 5.2, 0.95], helmet: true,
    armL: [[2.55, 3.35, 1.0], [2.3, 2.6, 1.1]], armR: [[3.95, 3.1, 0.9], [4.05, 2.2, 0.9]],
    skirt: { to: [3.5, 0.12, 0.9], w: 1.05 },
  })
  r.tube([2.7, 2.35, 1.2], [4.75, 1.35, 0.9], 0.1, 0.04, 3, 0.5)
  // another old head behind, and the bent youth stringing a bow, the mailed man with his spear at the left
  r.lump([2.45, 5.55, 0.6], 0.34, 0.45, 0.3, 6)
  figure(r, {
    k: 0.86, hip: [-1.2, 3.1, 0.85], chest: [-1.95, 3.5, 0.85], head: [-2.6, 3.45, 0.95],
    armL: [[-2.3, 2.75, 1.0], [-2.3, 2.1, 1.0]], armR: [[-2, 4.15, 0.8], [-1.55, 4.7, 0.8]],
    legL: [[-2.05, 1.65, 0.9], [-2.3, 0.12, 0.8]], legR: [[-0.85, 1.65, 0.9], [-1.25, 0.12, 0.8]],
  })
  figure(r, {
    k: 0.9, hip: [-3.1, 2.75, 0.5], chest: [-2.85, 4.2, 0.5], head: [-3.05, 5.15, 0.55], helmet: true,
    armL: [[-3.8, 3.15, 0.55], [-4.05, 2.55, 0.55]],
    legL: [[-3.25, 1.45, 0.55], [-3.3, 0.2, 0.5]],
  })
  r.tube([-4.75, 2.95, 0.5], [-3.5, 1.55, 0.6], 0.07, 0.07, 3, 0.5)
}

/** Cortot. Napoleon crowned by Victory, Fame flying over them with her trumpet, Clio writing, the kneeling city, a captive. */
function triomphe(r: Relief): void {
  // the palms and the eagle at the top, the shields and the hanging behind
  r.fan([0.1, 10.55, 0.3], 0.05, 1.05, 3.2, 8, 0.2)
  r.fan([-0.1, 10.55, 0.3], 2.05, 3.05, 3.0, 8, 0.2)
  r.lump([-0.3, 11.65, 0.3], 0.5, 0.42, 0.26, 6)
  r.lump([3.05, 8.75, 0.3], 1.25, 1.35, 0.2, 7)
  r.drape([[2.35, 7.7, 0.35], [3.2, 7.65, 0.4], [3.95, 7.7, 0.35]], [0.9, 1.0, 0.9], 0.14, 6)
  // Fame, flying flat across the top, her legs and drapery trailing to the left
  r.wing([-0.1, 9.75, 0.6], 4.1, 3.4, 4.1, 10)
  r.drape([[0.1, 8.95, 1.0], [-1.1, 8.3, 1.1], [-2.3, 7.7, 1.1], [-3.55, 6.75, 0.9]], [0.75, 1.1, 1.05, 0.5], 0.24, 5)
  figure(r, {
    k: 0.88, hip: [-0.85, 8.5, 1.05], chest: [0.45, 9.55, 1.0], head: [0.75, 10.75, 1.0],
    armL: [[-0.45, 10.55, 1.05], [-1.9, 10.85, 1.0]], armR: [[1.5, 9.35, 1.05], [2.05, 9.15, 1.05]],
  })
  r.tube([0.55, 10.9, 1.1], [-3.15, 11.15, 0.95], 0.05, 0.12, 4, 0.8)     // the trumpet
  r.tube([1.25, 10.05, 1.15], [2.95, 8.45, 1.1], 0.09, 0.09, 4, 0.8)      // her staff
  // Napoleon at the centre on his rock, in his long cloak, his laurel over his head in Victory's hand
  r.lump([0.1, 0.45, 0.9], 2.4, 0.75, 0.5, 8)
  figure(r, {
    k: 1, hip: [0, 3.65, 1.35], chest: [-0.05, 5.8, 1.4], head: [-0.1, 7.15, 1.5],
    armL: [[-1.35, 5.0, 1.45], [-2.7, 4.25, 1.4]], armR: [[0.8, 4.85, 1.65], [0.65, 5.75, 1.7]],
    legL: [[-0.4, 2.1, 1.45], [-0.3, 1.0, 1.4]], legR: [[0.7, 2.1, 1.45], [1.15, 1.0, 1.35]],
    skirt: { to: [0.05, 1.9, 1.5], w: 1.3 },
  })
  r.tube([0.65, 5.85, 1.95], [1.0, 3.8, 1.95], 0.09, 0.08, 4, 0.7)        // the sword held upright
  r.lump([-0.05, 7.95, 1.5], 0.42, 0.14, 0.2, 5)                          // the laurel
  // Victory to his left, crowning him, a palm in her other hand
  r.wing([2.65, 6.2, 0.45], 0.1, 1.2, 1.9, 7)
  r.wing([1.75, 6.5, 0.45], 1.6, 2.6, 1.3, 6)
  figure(r, {
    k: 0.92, hip: [2.35, 3.95, 1.05], chest: [2.35, 5.7, 1.1], head: [2.45, 6.85, 1.15],
    armL: [[1.35, 6.65, 1.2], [0.45, 7.85, 1.35]], armR: [[3.3, 4.55, 1.1], [3.5, 3.45, 1.1]],
    skirt: { to: [2.6, 0.2, 1.1], w: 1.35 },
  })
  r.fan([3.55, 3.3, 0.8], 1.3, 1.75, 2.9, 5, 0.12)
  // Clio with her tablet behind on the left, the city kneeling in her mural crown in front
  figure(r, {
    k: 0.85, hip: [-2.55, 3.05, 0.6], chest: [-2.35, 4.85, 0.65], head: [-2.55, 6.1, 0.7],
    armL: [[-3.1, 5.15, 0.8], [-3.75, 4.85, 0.85]], armR: [[-1.7, 3.95, 0.8], [-2.45, 3.95, 0.95]],
    skirt: { to: [-3.2, 0.5, 0.6], w: 1.05 },
  })
  r.face([-4.2, 3.25, 0.7], [-3.1, 3.05, 0.9], [-3.45, 5.3, 0.9], [-4.45, 5.5, 0.7], [0, 0.1, 1])  // the tablet
  figure(r, {
    k: 0.92, hip: [-2.9, 1.45, 1.15], chest: [-2.35, 2.75, 1.2], head: [-1.65, 3.8, 1.3],
    armL: [[-2.7, 1.8, 1.4], [-1.05, 0.85, 1.45]], armR: [[-1.25, 2.65, 1.3], [-1.25, 1.55, 1.3]],
    legR: [[-1.2, 0.85, 1.35], [-2.5, 0.2, 1.25]],
    skirt: { to: [-3.15, 0.1, 1.15], w: 1.15 },
  })
  r.lump([-1.7, 4.3, 1.3], 0.52, 0.28, 0.3, 7)    // the crown
  // the captive crouching behind Victory on the right
  figure(r, {
    k: 0.8, hip: [3.75, 1.45, 0.6], chest: [3.95, 2.75, 0.65], head: [4.3, 3.55, 0.7], helmet: true,
    armR: [[4.55, 2.35, 0.65], [4.35, 1.5, 0.65]],
    legR: [[4.45, 1.15, 0.7], [3.9, 0.12, 0.65]],
  })
}

/** Etex. The young man at bay, the rearing horse and its falling rider behind him, the Genius of the Future over them. */
function resistance(r: Relief): void {
  // the Genius, frontal, his wings up on either side
  r.wing([1.0, 9.9, 0.4], -1.35, 1.05, 3.3, 10)
  r.wing([-1.0, 9.9, 0.4], Math.PI + 1.35, Math.PI - 1.05, 3.3, 10)
  figure(r, {
    k: 0.9, hip: [-0.05, 8.1, 0.65], chest: [0, 9.7, 0.7], head: [0, 11.15, 0.8],
    armL: [[-1.2, 9.05, 0.8], [-2.1, 8.3, 0.85]], armR: [[0.85, 8.75, 0.8], [0.4, 8.1, 0.9]],
    skirt: { to: [0.6, 6.5, 0.7], w: 0.8 },
  })
  r.lump([0, 12.0, 0.75], 0.2, 0.35, 0.2, 5)   // the topknot
  // the horse, rearing to the viewer's left, its forelegs folded at the left, its quarters at the right
  beast(r, {
    rump: [2.75, 3.65, 0.55], chest: [-1.45, 5.35, 0.65], poll: [-2.05, 7.45, 0.75], muzzle: [-2.75, 5.85, 0.95],
    legs: [
      [[-1.75, 4.7, 0.8], [-3.4, 4.75, 0.9], [-3.65, 3.7, 1.0]],
      [[-1.45, 4.5, 0.6], [-3.05, 3.65, 0.8], [-4.05, 2.95, 0.85]],
    ],
    tail: [[3.3, 3.85, 0.5], [4.35, 3.25, 0.6], [4.55, 1.75, 0.5], [4.05, 0.35, 0.35]],
    girth: 1.3,
  })
  r.drape([[-2.1, 7.5, 0.5], [-1.2, 7.35, 0.75], [0.0, 7.0, 0.7]], [0.4, 0.7, 0.5], 0.14, 4)  // the mane
  // the cloak thrown out at the lower left
  r.drape([[-2.1, 3.45, 0.7], [-3.25, 2.6, 0.75], [-4.3, 1.75, 0.65], [-4.35, 0.4, 0.5]], [0.55, 1.05, 0.95, 0.7], 0.3, 5)
  // the rider falling back at the right, an arm up with his broken sword, the other flung down
  figure(r, {
    k: 0.92, hip: [1.75, 5.55, 0.85], chest: [2.1, 6.75, 0.95], head: [3.0, 7.45, 0.95],
    armL: [[1.65, 8.15, 0.8], [2.95, 7.85, 0.85]], armR: [[3.4, 5.9, 0.95], [4.35, 4.6, 0.95]],
  })
  r.drape([[2.55, 6, 0.65], [3.45, 5, 0.75], [3.85, 4.1, 0.6]], [0.7, 0.8, 0.45], 0.2, 4)
  // the young warrior in front, feet apart, sword down
  figure(r, {
    k: 1.04, hip: [0.3, 3.75, 1.55], chest: [0.3, 5.55, 1.6], head: [0.25, 6.65, 1.7],
    armL: [[-1, 4.55, 1.65], [-2.1, 3.35, 1.7]], armR: [[1.15, 4.3, 1.65], [1.35, 3.15, 1.7]],
    legL: [[-1.3, 1.85, 1.65], [-3.2, 0.12, 1.5]], legR: [[0.7, 1.85, 1.7], [1.2, 0.12, 1.6]],
  })
  r.tube([-2.1, 3.3, 1.8], [-2.75, 1.65, 1.8], 0.12, 0.04, 3, 0.5)
  // the old man crouched at his knee on the left
  figure(r, {
    k: 0.82, hip: [-1.05, 1.15, 1.05], chest: [-1.15, 2.6, 1.1], head: [-1.2, 3.65, 1.25],
    armR: [[-0.45, 3.0, 1.45], [0.25, 3.2, 1.75]],
    skirt: { to: [-0.85, 0.12, 1.0], w: 1.2 },
  })
  // the mother with her dead child on the right
  figure(r, {
    k: 0.82, hip: [2.05, 1.3, 1.05], chest: [1.95, 2.55, 1.1], head: [1.75, 3.55, 1.15],
    armL: [[1.45, 2.1, 1.25], [1.35, 3.0, 1.4]], armR: [[2.75, 2.1, 1.2], [3.1, 1.7, 1.3]],
    legL: [[1.5, 0.95, 1.2], [1.75, 0.12, 1.15]],
    skirt: { to: [2.2, 0.12, 1.05], w: 0.9 },
  })
  figure(r, {
    k: 0.5, hip: [3.0, 1.55, 1.3], chest: [2.4, 1.95, 1.35], head: [3.65, 1.75, 1.3],
    legL: [[2.65, 1.1, 1.35], [2.55, 0.5, 1.3]],
  })
}

/** Etex. Minerva, the warrior sheathing his sword, the man holding the bull, the mother and children, the ploughman among the wheat. */
function paix(r: Relief): void {
  // the olive on her right, the oak on her left, the cloth and the wheat low down
  r.foliage([-2.35, 9.2, 0.35], 1.75, 11)
  r.foliage([2.1, 9.7, 0.35], 1.45, 9)
  r.tube([-1.95, 7.4, 0.3], [-2.4, 9.0, 0.3], 0.12, 0.05, 4)
  r.drape([[-1.45, 6.7, 0.65], [-2.9, 6.2, 0.75], [-4.05, 5.0, 0.7], [-3.75, 3.7, 0.5]], [0.6, 1.0, 1.05, 0.6], 0.28, 5)
  r.fan([3.15, 1.2, 0.4], 0.15, 1.45, 3.6, 9, 0.17)
  r.fan([-3.4, 0.25, 0.4], 1.35, 2.55, 2.4, 6, 0.15)
  // Minerva, frontal, helmeted, her lance in her left hand
  figure(r, {
    k: 0.95, hip: [0.05, 7.4, 0.65], chest: [-0.1, 9.2, 0.7], head: [0, 10.75, 0.85], helmet: true,
    armL: [[-1.2, 8.55, 0.8], [-1.95, 7.75, 0.85]], armR: [[1.75, 8.65, 0.75], [2.85, 8.55, 0.85]],
    skirt: { to: [0.1, 5.95, 0.65], w: 1.1 },
  })
  r.tube([3.1, 7.2, 0.9], [2.65, 9.5, 0.85], 0.07, 0.04, 4)
  // the bull, its head at the right, its rump at the left, one foreleg raised
  beast(r, {
    rump: [-3.2, 3.95, 0.55], chest: [1.45, 5.0, 0.65], poll: [2.75, 6.75, 0.8], muzzle: [2.9, 5.15, 1.05],
    legs: [[[1.8, 4.3, 0.8], [3.2, 4.85, 1.0], [4.0, 4.65, 1.05]], [[1.3, 4.0, 0.6], [2.0, 2.9, 0.75], [2.05, 2.1, 0.75]]],
    tail: [[-3.85, 3.8, 0.5], [-4.1, 2.45, 0.55], [-3.75, 0.2, 0.45]],
    girth: 1.3, bull: true,
  })
  r.tube([2.6, 7.0, 0.95], [2.05, 7.5, 0.75], 0.1, 0.03, 4)
  r.tube([3.0, 7.0, 0.95], [3.4, 7.55, 0.75], 0.1, 0.03, 4)
  // the man holding it, behind the warrior on the left
  figure(r, {
    k: 0.9, hip: [-1.2, 4.3, 1.05], chest: [-1.85, 5.75, 1.15], head: [-1.65, 7.0, 1.2],
    armL: [[-0.75, 5.4, 1.35], [0.2, 5.65, 1.45]], armR: [[-0.1, 6.2, 1.25], [1.45, 7.05, 1.15]],
  })
  // the warrior at the front, his sword going home
  figure(r, {
    k: 1.04, hip: [0.25, 3.5, 1.6], chest: [0.2, 5.1, 1.65], head: [0.35, 6.45, 1.75], helmet: true,
    armL: [[-1.0, 4.25, 1.75], [0.5, 4.75, 1.95]], armR: [[1.45, 4.25, 1.75], [1.5, 2.8, 1.8]],
    legL: [[-0.45, 1.85, 1.75], [-1.75, 0.12, 1.55]], legR: [[0.7, 1.85, 1.75], [0.55, 0.12, 1.65]],
  })
  r.tube([0.5, 4.8, 2.15], [1.45, 2.5, 2.05], 0.12, 0.05, 3, 0.5)
  // the mother with her children on the left
  figure(r, {
    k: 0.86, hip: [-2.0, 1.7, 1.05], chest: [-1.9, 3.0, 1.1], head: [-2.1, 4.05, 1.15],
    armL: [[-2.7, 2.3, 1.2], [-2.55, 2.0, 1.45]], armR: [[-1.05, 2.3, 1.25], [-1.85, 2.15, 1.5]],
    skirt: { to: [-1.9, 0.12, 1.15], w: 1.7 },
  })
  r.lump([-2.2, 2.25, 1.55], 0.65, 0.42, 0.34, 6)
  r.lump([-2.65, 2.5, 1.65], 0.32, 0.32, 0.26, 5)
  r.lump([-3.2, 3.3, 0.95], 0.32, 0.34, 0.3, 5)
  // the ploughman bending over his share at the right
  figure(r, {
    k: 0.9, hip: [1.75, 1.35, 1.15], chest: [2.0, 2.65, 1.2], head: [3.1, 3.1, 1.3],
    armL: [[2.65, 1.75, 1.35], [3.65, 0.4, 1.35]], armR: [[3.3, 2.15, 1.25], [3.85, 2.1, 1.2]],
    legR: [[3.05, 0.5, 1.3], [1.2, 0.12, 1.25]],
    skirt: { to: [1.6, 0.25, 1.15], w: 0.8 },
  })
}

/* ------------------------------------------------------------------------------------------------ the faces */

/** A group, its pedestal and plinth, standing on the wall at x = cx. */
function pedestal(q: MeshBuilder, d: number, cx: number, group: (r: Relief) => void): void {
  slab(q, d, cx - 4.55, cx + 4.55, 0, 5.8, 1.35, STONE)
  cove(q, d + 1.35, cx - 4.55, cx + 4.55, 5.05, 5.8, 0, 0.32, BAND)
  slab(q, d, cx - 5.05, cx + 5.05, 5.8, 6.25, 1.85, TRIM)
  leafBand(q, d + 1.85, cx - 5.05, cx + 5.05, 5.8, 6.15, 0.03, 0.42)
  slab(q, d, cx - 4.2, cx + 4.2, 6.25, 6.75, 1.65, STONE)
  slab(q, d, cx - 3.95, cx + 3.95, 6.75, 7.25, 1.5, TRIM)
  slab(q, d, cx - 3.75, cx + 3.75, 7.25, 7.7, 1.4, STONE)
  group(new Relief(q, cx, 7.7, -d - 0.02, STONE, 1.9))
}

/** A framed high relief: a moulded frame `w` by `h`, a battle in two ranks of figures, a horse if it is that kind of battle. */
function highRelief(q: MeshBuilder, d: number, cx: number, y0: number, w: number, h: number, seed: number): void {
  const x0 = cx - w / 2, x1 = cx + w / 2
  flat(q, d, x0, x1, y0, y0 + h, 0.02, shade(STONE, 0.68))
  for (const [a, b, e, f] of [[x0 - 0.4, x1 + 0.4, y0 - 0.4, y0], [x0 - 0.4, x1 + 0.4, y0 + h, y0 + h + 0.4], [x0 - 0.4, x0, y0, y0 + h], [x1, x1 + 0.4, y0, y0 + h]]) slab(q, d, a, b, e, f, 0.28, TRIM)
  const r = new Relief(q, cx, y0, -d - 0.02, STONE, 0.75)
  const n = Math.round(w / 1.55)
  for (let i = 0; i < n; i++) {
    const u = -w / 2 + 0.8 + ((w - 1.6) * i) / Math.max(1, n - 1)
    const s = Math.sin(seed * 3.1 + i * 2.17), c = Math.cos(seed * 1.7 + i * 1.31)
    const lean = s * 0.55
    const hip: V = [u, 1.65, 0.34]
    const chest: V = [u + lean * 0.5, 2.75, 0.38]
    const head: V = [u + lean, 3.55 + c * 0.15, 0.4]
    figure(r, {
      k: 0.55, hip, chest, head, helmet: i % 3 === 0, coarse: true,
      armL: [[u - 0.55 + lean, 2.85 + c * 0.5, 0.42], [u - 0.75 + lean, 3.6 + c * 0.55, 0.42]],
      armR: [[u + 0.6, 2.2 + s * 0.3, 0.42], [u + 0.95, 2.1 + s * 0.8, 0.42]],
      legL: [[u - 0.5, 0.9, 0.38], [u - 0.8, 0.08, 0.32]],
      legR: [[u + 0.4, 0.85, 0.38], [u + 0.7, 0.08, 0.32]],
    })
    // the rank behind, heads and shoulders over them, and a flag or a sabre in every other gap
    r.lump([u + 0.75, 3.15 + s * 0.3, 0.15], 0.3, 0.34, 0.18, 3, true, 2)
    r.tube([u + 0.75, 2.2, 0.12], [u + 0.75, 3.0 + s * 0.3, 0.12], 0.34, 0.3, 3, 0.5, true)
    if (i % 2 === 0) r.blade([u + 0.4, 3.2, 0.2], [u + 0.65 + lean, 4.55, 0.2], 0.09)
  }
  if (seed % 2 === 1) {
    beast(r, {
      rump: [w * 0.12, 1.9, 0.14], chest: [w * 0.12 + 1.9, 2.2, 0.16], poll: [w * 0.12 + 2.5, 3.2, 0.2], muzzle: [w * 0.12 + 3.05, 2.65, 0.25],
      legs: [[[w * 0.12 + 1.8, 1.7, 0.16], [w * 0.12 + 2.1, 0.95, 0.2], [w * 0.12 + 2.05, 0.1, 0.2]], [[w * 0.12, 1.5, 0.16], [w * 0.12 - 0.15, 0.9, 0.2], [w * 0.12 - 0.3, 0.1, 0.2]]],
      tail: [[w * 0.12 - 0.5, 2.1, 0.14], [w * 0.12 - 0.85, 1.1, 0.14]],
      girth: 0.48,
    })
  }
}

/** A Victory lying along the arch, in a spandrel: head toward the keystone, her wing behind, her trumpet or palm. `s` which side. */
function victory(r: Relief, s: number, R: number, y: number): void {
  // in the frame of a spandrel about the arch's centre: along the arch from 60° to 25° above the crown's side
  const P = (a: number, rr: number, w: number): V => [s * Math.cos(a) * rr, y + Math.sin(a) * rr, w]
  r.wing(P(0.98, R + 0.95, 0.22), s > 0 ? 0.3 : 2.84, s > 0 ? 1.25 : 1.89, R * 0.22, 6)
  figure(r, {
    k: R * 0.09, coarse: true,
    hip: P(0.62, R + 1.15, 0.34), chest: P(0.88, R + 1.25, 0.36), head: P(1.08, R + 1.7, 0.38),
    armL: [P(1.08, R + 0.7, 0.4), P(1.3, R + 0.65, 0.4)],
    armR: [P(0.98, R + 2.0, 0.38), P(1.2, R + 2.45, 0.34)],
    legL: [P(0.37, R + 0.95, 0.36), P(0.14, R + 0.55, 0.32)],
    legR: [P(0.4, R + 1.5, 0.34), P(0.18, R + 1.25, 0.3)],
  })
}

/** Everything that is the same on all four faces, above the walls' head: the frieze, the cornice, the attic. */
function upperWorks(q: MeshBuilder, d: number, hw: number, nShields: number): void {
  // the architrave
  slab(q, d, -hw - 0.12, hw + 0.12, PIER, PIER + 0.7, 0.14, TRIM)
  leafBand(q, d + 0.14, -hw - 0.12, hw + 0.12, PIER + 0.62, PIER + 0.9, 0.02, 1.0)
  // the great frieze, its men in low relief on a band a shade darker, the army going out on one side of the middle and home on the other
  const fy = PIER + 0.9, fh = 2.3
  flat(q, d, -hw, hw, fy, fy + fh, 0.03, shade(STONE, 0.72))
  const r = new Relief(q, 0, fy + 0.1, -d - 0.03, STONE, 0.3)
  const pitch = 0.92
  const n = Math.floor((2 * hw - 0.6) / pitch)
  for (let i = 0; i < n; i++) {
    const u = -hw + 0.3 + (i + 0.5) * pitch
    smallFigure(r, u, 0, fh * 0.92, i * 7 % 11)
  }
  // the head of the frieze
  slab(q, d, -hw - 0.2, hw + 0.2, fy + fh, fy + fh + 0.45, 0.22, TRIM)
  // the cornice: the bed, the consoles, the deep corona and the cymatium
  const c0 = fy + fh + 0.45
  cove(q, d + 0.22, -hw - 0.2, hw + 0.2, c0, c0 + 0.5, 0, 0.42, BAND)
  block(q, -hw - 1.7, hw + 1.7, -d - 1.7, -d + 0.02, c0 + 1.3, c0 + 1.95, TRIM)   // the corona; its underside is the soffit
  q.quad([[-hw - 1.7, c0 + 1.25, -d - 1.7], [hw + 1.7, c0 + 1.25, -d - 1.7], [hw + 1.7, c0 + 1.25, -d], [-hw - 1.7, c0 + 1.25, -d]], [0, -1, 0], UV, SOFFIT, plain)
  const nc = Math.round((2 * hw + 2.6) / 1.45)
  for (let i = 0; i <= nc; i++) {
    const x = -hw - 1.3 + ((2 * hw + 2.6) * i) / nc
    strut(q, [x, c0 + 0.6, -d - 0.1], [x, c0 + 1.28, -d - 1.45], 0.42, 0.42, TRIM, plain, false)
    block(q, x - 0.21, x + 0.21, -d - 1.5, -d - 1.2, c0 + 0.9, c0 + 1.3, TRIM)
  }
  cove(q, d + 1.7, -hw - 1.7, hw + 1.7, c0 + 1.95, c0 + 2.5, 0, -0.5, BAND)
  // what stands on it: the heads at every other console
  for (let i = 0; i <= nc; i += 2) {
    const x = -hw - 1.3 + ((2 * hw + 2.6) * i) / nc
    const a = new Relief(q, x, c0 + 2.5, -d - 1.2, STONE, 0.4)
    a.lump([0, 0.1, 0.05], 0.32, 0.36, 0.3, 4)
  }
  // the attic: its plinth, the wall, the shields between panels
  const a0 = c0 + 2.5
  slab(q, d, -hw - 0.08, hw + 0.08, a0, a0 + 1.15, 0.2, STONE)
  cove(q, d + 0.2, -hw - 0.08, hw + 0.08, a0 + 1.15, a0 + 1.5, 0, -0.2, TRIM)
  const top = TOP - 1.9
  flat(q, d, -hw, hw, a0 + 1.5, top, 0.01, STONE, 0)
  const pitchS = (2 * hw) / (nShields + 0.25)
  for (let i = 0; i <= nShields; i++) {
    // a sword panel between each pair of shields, and one at each corner
    const x = -hw + pitchS * 0.125 + i * pitchS
    const yc = (a0 + 1.5 + top) / 2
    flat(q, d, x - 0.6, x + 0.6, yc - 2.5, yc + 2.5, 0.08, TRIM)
    flat(q, d, x - 0.42, x + 0.42, yc - 2.3, yc + 2.3, 0.1, shade(STONE, 0.8))
    strut(q, [x, yc - 1.6, -d - 0.14], [x, yc + 1.7, -d - 0.14], 0.14, 0.12, TRIM, plain, false)
    block(q, x - 0.3, x + 0.3, -d - 0.2, -d - 0.08, yc + 0.95, yc + 1.08, TRIM)
    if (i === nShields) break
    const sx = x + pitchS / 2
    const s = new Relief(q, sx, yc, -d - 0.02, STONE, 0.55)
    s.disc([0, 0, 0], 1.08, 0.3)                // the shield, its rim and its field
    // its garland beneath
    s.tube([-1.15, -0.9, 0], [0, -1.35, 0.1], 0.16, 0.08, 3, 0.5, true)
    s.tube([1.15, -0.9, 0], [0, -1.35, 0.1], 0.16, 0.08, 3, 0.5, true)
  }
  // the attic's head: a cornice, the dentils, and the crest of palmettes standing along it
  slab(q, d, -hw - 0.15, hw + 0.15, top, top + 0.4, 0.2, TRIM)
  leafBand(q, d + 0.2, -hw - 0.15, hw + 0.15, top + 0.05, top + 0.38, 0.02, 1.1)
  block(q, -hw - 0.85, hw + 0.85, -d - 0.85, -d + 0.02, top + 0.75, top + 1.25, TRIM)
  cove(q, d + 0.2, -hw - 0.85, hw + 0.85, top + 0.4, top + 0.75, 0, 0.65, BAND)
  const crest = Math.round((2 * hw + 1.7) / 2.3)
  for (let i = 0; i <= crest; i++) {
    const x = -hw - 0.75 + ((2 * hw + 1.5) * i) / crest
    const cr = new Relief(q, x, top + 1.25, -d - 0.7, STONE, 0.3)
    if (i % 2) {
      cr.fan([0, 0, 0.1], 0.6, 2.54, 0.62, 3, 0.16)
    } else cr.lump([0, 0.16, 0.1], 0.3, 0.26, 0.24, 4)
  }
}

/** One long face, drawn looking at −z: `right` and `left` are the viewer's. */
function longFace(q: MeshBuilder, right: (r: Relief) => void, left: (r: Relief) => void, seedR: number, seedL: number): void {
  const d = HZ
  // the plinth, the wall with its arch
  archedWall(q, d, HX, 0, PIER, GW, GS, STONE, 28)
  for (const s of [-1, 1]) {
    const a = s < 0 ? -HX : GW, b = s < 0 ? -GW : HX
    slab(q, d, a, b, 0, 0.9, 0.3, TRIM)
    cove(q, d + 0.3, a, b, 0.9, 1.25, 0, -0.3, BAND)
    // the string at the pedestals' head
    slab(q, d, a, b, 5.45, 5.8, 0.12, BAND)
    // the impost: the Greek key under its leaf and its cap, breaking at the arch
    slab(q, d, a - (s > 0 ? 0 : 0.5), b + (s > 0 ? 0.5 : 0), 19.9, 21.2, 0.2, TRIM)
    greekKey(q, d + 0.2, a - (s > 0 ? 0 : 0.5), b + (s > 0 ? 0.5 : 0), 19.95, 1.2, 0.02)
    cove(q, d + 0.2, a - (s > 0 ? 0 : 0.5), b + (s > 0 ? 0.5 : 0), 21.2, 21.5, 0, 0.28, BAND)
    slab(q, d, a - (s > 0 ? 0 : 0.5), b + (s > 0 ? 0.5 : 0), 21.5, 21.88, 0.5, TRIM)
    leafBand(q, d + 0.5, a - (s > 0 ? 0 : 0.5), b + (s > 0 ? 0.5 : 0), 21.52, 21.84, 0.02, 0.5)
    pedestal(q, d, s * 14.85, s > 0 ? right : left)
    highRelief(q, d, s * 14.95, 23.3, 9.7, 5.4, s > 0 ? seedR : seedL)
  }
  // the archivolt, three bands stepped out, its keystone a console
  archBand(q, d, GW, GW + 0.55, GS, 0.15, BAND, 24)
  archBand(q, d, GW + 0.55, GW + 1.25, GS, 0.3, TRIM, 24)
  archBand(q, d, GW + 1.25, GW + 1.45, GS, 0.45, BAND, 24)
  block(q, -0.7, 0.7, -d - 0.75, -d + 0.02, GS + GW - 0.2, GS + GW + 1.75, TRIM)
  // the spandrels' Victories
  const sp = new Relief(q, 0, GS, -d - 0.02, STONE, 0.55)
  victory(sp, 1, GW, 0)
  victory(sp, -1, GW, 0)
  upperWorks(q, d, HX, 11)
}

/** One short face, looking at −z in its own frame: the transverse arch, a battle over it. */
function shortFace(q: MeshBuilder, seed: number): void {
  const d = HX
  archedWall(q, d, HZ, 0, PIER, TW, TS, STONE, 20)
  for (const s of [-1, 1]) {
    const a = s < 0 ? -HZ : TW, b = s < 0 ? -TW : HZ
    slab(q, d, a, b, 0, 0.9, 0.3, TRIM)
    cove(q, d + 0.3, a, b, 0.9, 1.25, 0, -0.3, BAND)
    slab(q, d, a, b, 5.45, 5.8, 0.12, BAND)
    // the transverse arch's impost and the panel of the names of victories on each pier
    slab(q, d, a, b, 13.6, 14.46, 0.3, TRIM)
    leafBand(q, d + 0.3, a, b, 13.75, 14.3, 0.02, 0.5)
    const cx = s * (TW + HZ) / 2
    flat(q, d, cx - 1.7, cx + 1.7, 6.6, 12.6, 0.06, TRIM)
    flat(q, d, cx - 1.42, cx + 1.42, 6.85, 12.35, 0.08, shade(STONE, 0.84))
    for (let k = 0; k < 6; k++) flat(q, d, cx - 0.95, cx + 0.95, 7.3 + k * 0.82, 7.46 + k * 0.82, 0.09, DEEP)
  }
  archBand(q, d, TW, TW + 0.4, TS, 0.12, BAND, 18)
  archBand(q, d, TW + 0.4, TW + 0.95, TS, 0.25, TRIM, 18)
  block(q, -0.5, 0.5, -d - 0.5, -d + 0.02, TS + TW - 0.15, TS + TW + 1.2, TRIM)
  const sp = new Relief(q, 0, TS, -d - 0.02, STONE, 0.45)
  victory(sp, 1, TW, 0)
  victory(sp, -1, TW, 0)
  // the impost of the great arch runs round: the Greek key above the Victories
  slab(q, d, -HZ, HZ, 19.9, 21.2, 0.2, TRIM)
  greekKey(q, d + 0.2, -HZ, HZ, 19.95, 1.2, 0.02)
  cove(q, d + 0.2, -HZ, HZ, 21.2, 21.5, 0, 0.28, BAND)
  slab(q, d, -HZ, HZ, 21.5, 21.88, 0.5, TRIM)
  leafBand(q, d + 0.5, -HZ, HZ, 21.52, 21.84, 0.02, 0.5)
  highRelief(q, d, 0, 23.3, 17.2, 5.4, seed)
  upperWorks(q, d, HZ, 4)
}

/**
 * A barrel vault, coffered: `at(theta, t, r)` is its point at angle theta from the springing, t along its length, radius r, and the
 * coffer floors are the deepest thing, the ribs standing out of them toward the axis. The floors' radius is r + 0.14: a real recess.
 */
function vault(q: MeshBuilder, at: (a: number, t: number, r: number) => V, normal: (a: number) => V, R: number, t0: number, t1: number,
  n: number, m: number, end: number): void {
  const Q = (a: V, b: V, c: V, d: V, nn: V, col: Rgb): void => q.quad([a, b, c, d], nn, UV, col, plain)
  // the plain soffit either end, the ornament band on it, then the coffers between
  const T0 = t0 + end, T1 = t1 - end
  const seg = n * 2
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI, a1 = ((i + 1) / seg) * Math.PI, am = (a0 + a1) / 2
    for (const [s, e] of [[t0, T0], [T1, t1]]) Q(at(a0, s, R), at(a1, s, R), at(a1, e, R), at(a0, e, R), normal(am), BAND)
    for (const [s, e] of [[t0 + end * 0.25, t0 + end * 0.75], [t1 - end * 0.75, t1 - end * 0.25]]) {
      Q(at(a0, s, R - 0.08), at(a1, s, R - 0.08), at(a1, e, R - 0.08), at(a0, e, R - 0.08), normal(am), i % 2 ? shade(STONE, 0.72) : shade(STONE, 0.8))
    }
    Q(at(a0, T0, R + 0.14), at(a1, T0, R + 0.14), at(a1, T1, R + 0.14), at(a0, T1, R + 0.14), normal(am), VAULT)
  }
  const dA = Math.PI / n
  const dT = (T1 - T0) / m
  const rib = 0.13
  const ribC = shade(STONE, 0.78)
  // the ribs
  for (let i = 0; i <= n; i++) {
    const a = i * dA
    const hw = rib / R
    Q(at(a - hw, T0, R), at(a + hw, T0, R), at(a + hw, T1, R), at(a - hw, T1, R), normal(a), ribC)
  }
  for (let j = 0; j <= m; j++) {
    const t = T0 + j * dT
    for (let i = 0; i < n; i++) {
      const a0 = i * dA, a1 = (i + 1) * dA
      Q(at(a0, t - rib, R), at(a1, t - rib, R), at(a1, t + rib, R), at(a0, t + rib, R), normal((a0 + a1) / 2), ribC)
    }
  }
  // each coffer's stepped frame and its rosette
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      const a0 = i * dA, a1 = (i + 1) * dA, s = T0 + j * dT, e = s + dT
      const am = (a0 + a1) / 2, tm = (s + e) / 2
      const f = 0.2 * (dT < R * dA ? dT : R * dA)
      const fa = f / R
      const c = shade(STONE, 0.66)
      Q(at(a0 + rib / R, s + rib, R + 0.07), at(a1 - rib / R, s + rib, R + 0.07), at(a1 - rib / R, s + rib + f, R + 0.07), at(a0 + rib / R, s + rib + f, R + 0.07), normal(am), c)
      Q(at(a0 + rib / R, e - rib - f, R + 0.07), at(a1 - rib / R, e - rib - f, R + 0.07), at(a1 - rib / R, e - rib, R + 0.07), at(a0 + rib / R, e - rib, R + 0.07), normal(am), c)
      Q(at(a0 + rib / R, s + rib + f, R + 0.07), at(a0 + rib / R + fa, s + rib + f, R + 0.07), at(a0 + rib / R + fa, e - rib - f, R + 0.07), at(a0 + rib / R, e - rib - f, R + 0.07), normal(am), c)
      Q(at(a1 - rib / R - fa, s + rib + f, R + 0.07), at(a1 - rib / R, s + rib + f, R + 0.07), at(a1 - rib / R, e - rib - f, R + 0.07), at(a1 - rib / R - fa, e - rib - f, R + 0.07), normal(am), c)
      // the rosette, a little raised disc of six petals
      const rr = Math.min(dT, R * dA) * 0.22
      const ctr = at(am, tm, R - 0.05)
      for (let k = 0; k < 6; k++) {
        const b0 = (k / 6) * Math.PI * 2, b1 = ((k + 1) / 6) * Math.PI * 2
        const P = (b: number): V => at(am + (Math.cos(b) * rr) / R, tm + Math.sin(b) * rr, R + 0.06)
        Q(ctr, P(b0), P(b1), P(b1), normal(am), k % 2 ? shade(STONE, 0.9) : shade(STONE, 0.82))
      }
    }
  }
}

/** The passage: both vaults, their jambs with the transverse arch cut through, the names on them, the allegories over the arches. */
function passage(out: MeshBuilder): void {
  // the great vault, along z
  const gAt = (a: number, t: number, r: number): V => [Math.cos(a) * r, GS + Math.sin(a) * r, t]
  const gN = (a: number): V => [-Math.cos(a), -Math.sin(a), 0]
  vault(out, gAt, gN, GW, -HZ, HZ, 10, 7, 2.3)
  // the great vault's jambs on x = ±GW, facing the passage, cut by the transverse arch
  for (const s of [-1, 1]) {
    const x = s * GW
    const q = new MeshBuilder()
    // drawn in a frame looking at −z, d = 0, then turned: −z becomes the jamb's inward normal
    archedWall(q, 0, HZ, 0, GS, TW, TS, shade(STONE, 0.88), 18)
    archBand(q, 0, TW, TW + 0.45, TS, 0.12, shade(STONE, 0.78), 16)
    // the impost of the transverse arch, carried along the jamb
    for (const p of [-1, 1]) {
      const a = p < 0 ? -HZ : TW, b = p < 0 ? -TW : HZ
      slab(q, 0, a, b, 13.75, 14.46, 0.25, shade(STONE, 0.82))
      slab(q, 0, a, b, 0, 0.9, 0.25, shade(STONE, 0.84))
      // the columns of names, in the jambs between the impost and the plinth
      const w = b - a
      const cols = 5
      for (let c = 0; c < cols; c++) {
        const cx = a + (w * (c + 0.5)) / cols
        for (let k = 0; k < 14; k++) {
          const hw = 0.42 + 0.14 * Math.sin(c * 2.1 + k * 1.7)
          flat(q, 0, cx - hw, cx + hw, 2.0 + k * 0.8, 2.16 + k * 0.8, 0.02, shade(STONE, 0.5))
        }
      }
    }
    // the allegory over the transverse arch: a seated Victory and her genii in low relief
    const r = new Relief(q, 0, 19.05, -0.02, shade(STONE, 0.86), 0.5)
    flat(q, 0, -HZ + 1.8, HZ - 1.8, 18.9, 21.4, 0.015, shade(STONE, 0.62))
    for (let i = -3; i <= 3; i++) {
      if (i === 0) continue
      smallFigure(r, i * 2.3, 0, 2.2, i + 4, 0.08)
    }
    figure(r, { k: 0.42, hip: [0, 0.75, 0.25], chest: [0, 1.45, 0.26], head: [0, 2.05, 0.28], armL: [[-0.5, 1.5, 0.3], [-0.95, 1.85, 0.3]], armR: [[0.5, 1.5, 0.3], [0.95, 1.85, 0.3]], skirt: { to: [0, 0.05, 0.3], w: 0.7 } })
    slab(q, 0, -HZ, HZ, 21.5, GS, 0.35, shade(STONE, 0.84))
    // inside, the frame looks at −z from x = −GW looking +x: turn it so −z points along +x (s < 0) or −x (s > 0)
    const placedQ = new MeshBuilder()
    rotated(placedQ, q, s > 0 ? Math.PI / 2 : -Math.PI / 2)
    for (let i = 0; i < placedQ.positions.length; i += 3) placedQ.positions[i] += x
    append(out, placedQ)
  }
  // the transverse vaults, along x between the great jambs and the short faces
  for (const s of [-1, 1]) {
    const x0 = s > 0 ? GW : -HX, x1 = s > 0 ? HX : -GW
    const tAt = (a: number, t: number, r: number): V => [t, TS + Math.sin(a) * r, Math.cos(a) * r]
    const tN = (a: number): V => [0, -Math.sin(a), -Math.cos(a)]
    vault(out, tAt, tN, TW, x0, x1, 6, 6, 1.3)
    // its jambs, facing each other across it
    for (const p of [-1, 1]) {
      const z = p * TW
      const nn: V = [0, 0, -p]
      out.quad([[x0, 0, z], [x1, 0, z], [x1, TS, z], [x0, TS, z]], nn, UV, shade(STONE, 0.84), 0)
      out.quad([[x0, 0.9, z - p * 0.2], [x1, 0.9, z - p * 0.2], [x1, 0, z - p * 0.2], [x0, 0, z - p * 0.2]], nn, UV, shade(STONE, 0.78), plain)
      out.quad([[x0, 13.75, z - p * 0.2], [x1, 13.75, z - p * 0.2], [x1, TS, z - p * 0.2], [x0, TS, z - p * 0.2]], nn, UV, shade(STONE, 0.78), plain)
    }
  }
}

/** kit `rotated`, a vertex at a time: a face of this is far past what a spread can pass as arguments. */
function rotated(out: MeshBuilder, part: MeshBuilder, angle: number): void {
  const c = Math.cos(angle), s = Math.sin(angle)
  const turned = new MeshBuilder()
  for (let i = 0; i < part.positions.length; i += 3) {
    const px = part.positions[i], pz = part.positions[i + 2]
    turned.positions.push(px * c + pz * s, part.positions[i + 1], -px * s + pz * c)
    const nx = part.normals[i], nz = part.normals[i + 2]
    turned.normals.push(nx * c + nz * s, part.normals[i + 1], -nx * s + nz * c)
  }
  for (const v of part.uvs) turned.uvs.push(v)
  for (const v of part.colors) turned.colors.push(v)
  for (const v of part.indices) turned.indices.push(v)
  append(out, turned)
}

function append(out: MeshBuilder, part: MeshBuilder): void {
  const base = out.positions.length / 3
  for (const v of part.positions) out.positions.push(v)
  for (const v of part.normals) out.normals.push(v)
  for (const v of part.uvs) out.uvs.push(v)
  for (const v of part.colors) out.colors.push(v)
  for (const i of part.indices) out.indices.push(base + i)
}

/** The top: the terrace behind its low wall, the visitors' railing, the glass dome over the museum, the stair and lift houses. */
function terrace(out: MeshBuilder): void {
  const y = TOP - 0.65
  // a roof deck, pale as IGN's photograph has it, in the crest's shelter
  block(out, -HX - 0.6, HX + 0.6, -HZ - 0.6, HZ + 0.6, y - 1.2, y, hex('#a2978a'))
  const iron: Rgb = [0.2, 0.2, 0.2]
  // the railing along the top: posts and two rails, a metre and a half up
  for (const [a, b] of [[[-HX + 0.4, -HZ + 0.4], [HX - 0.4, -HZ + 0.4]], [[HX - 0.4, -HZ + 0.4], [HX - 0.4, HZ - 0.4]], [[HX - 0.4, HZ - 0.4], [-HX + 0.4, HZ - 0.4]], [[-HX + 0.4, HZ - 0.4], [-HX + 0.4, -HZ + 0.4]]] as [number, number][][]) {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1])
    const n = Math.round(L / 2.4)
    for (let i = 0; i < n; i++) {
      const t = i / n
      const x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t
      strut(out, [x, y, z], [x, y + 1.5, z], 0.06, 0.06, iron, surfaceTag('metal'), false)
    }
    for (const h of [0.75, 1.5]) strut(out, [a[0], y + h, a[1]], [b[0], y + h, b[1]], 0.05, 0.05, iron, surfaceTag('metal'), false)
  }
  // the glass dome, 14 m across: IGN's aerial, a little off the centre toward the Champs face
  const gx = 0, gz = 0.5
  const glass: Rgb = [0.52, 0.6, 0.62]
  const rings = 4
  for (let k = 0; k < rings; k++) {
    const a0 = (k / rings) * Math.PI * 0.42, a1 = ((k + 1) / rings) * Math.PI * 0.42
    prism(out, gx, gz, y + Math.sin(a0) * 2.6 + 0.3, y + Math.sin(a1) * 2.6 + 0.3, Math.cos(a0) * 7, 16, shade(glass, k % 2 ? 1 : 0.92), surfaceTag('glass'), Math.cos(a1) * 7, k === rings - 1)
  }
  prism(out, gx, gz, y, y + 0.3, 7.15, 16, shade(STONE, 0.8), 0, 7.15, false)
  // the stair and lift houses at either end, and the small cabin
  block(out, 13.6, 16.5, -3.2, 3.2, y, y + 2.6, shade(STONE, 0.8))
  block(out, -17.5, -14.5, -2.4, 2.4, y, y + 2.2, shade(STONE, 0.8))
  // the two lamp globes the photograph has on the attic
  for (const x of [-2.0, -1.2]) {
    strut(out, [x, y, HZ - 1.2], [x, y + 2.1, HZ - 1.2], 0.08, 0.08, iron, surfaceTag('metal'), false)
    prism(out, x, HZ - 1.2, y + 2.1, y + 2.5, 0.22, 6, [0.92, 0.92, 0.9], EMIT, 0.2)
  }
}

/** Under the vault: the slab of the Unknown Soldier, its flame in a bronze rose, the low chain round them. Standing at grade. */
function tomb(out: MeshBuilder, g: number): void {
  const granite = hex('#7f7a72')
  const bronze: Rgb = [0.33, 0.27, 0.17]
  block(out, -1.1, 1.1, -2.1, 2.1, g, g + 0.14, granite)
  block(out, -0.75, 0.75, -1.75, 1.2, g + 0.14, g + 0.17, shade(granite, 1.15))
  // the flame's rose, at the head of the slab, toward the Champs-Élysées' side
  prism(out, 0, 1.6, g + 0.14, g + 0.3, 0.42, 10, bronze, surfaceTag('metal'), 0.34)
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.4
    prism(out, Math.cos(a) * 0.1, 1.6 + Math.sin(a) * 0.1, g + 0.28, g + 0.28 + 0.75 + i * 0.12, 0.13, 5, i ? [1, 0.55, 0.12] : [1, 0.78, 0.25], EMIT, 0.01)
  }
  // the low bronze posts and their chain, round the slab
  const iron: Rgb = [0.15, 0.15, 0.14]
  const c: [number, number][] = [[-1.9, -2.9], [1.9, -2.9], [1.9, 2.9], [-1.9, 2.9]]
  for (let i = 0; i < 4; i++) {
    const a = c[i], b = c[(i + 1) % 4]
    prism(out, a[0], a[1], g, g + 0.55, 0.06, 5, iron, surfaceTag('metal'), 0.05)
    strut(out, [a[0], g + 0.5, a[1]], [(a[0] + b[0]) / 2, g + 0.35, (a[1] + b[1]) / 2], 0.03, 0.03, iron, surfaceTag('metal'), false)
    strut(out, [(a[0] + b[0]) / 2, g + 0.35, (a[1] + b[1]) / 2], [b[0], g + 0.5, b[1]], 0.03, 0.03, iron, surfaceTag('metal'), false)
  }
}

/** The ring of stone bollards and sagging chains on the place, and the inner ring of dark posts. Each on the ground under it. */
function rings(out: MeshBuilder, fit: Fit, g: number): void {
  const at = (x: number, z: number): number => fit.groundAt?.(x, z) ?? g
  const pale = hex('#d9d3c6')
  const iron: Rgb = [0.13, 0.14, 0.14]
  const R = 56
  const n = 64
  const P = (k: number): [number, number] => [Math.cos((k / n) * Math.PI * 2) * R, Math.sin((k / n) * Math.PI * 2) * R]
  for (let k = 0; k < n; k++) {
    const [x, z] = P(k)
    const [x1, z1] = P(k + 1)
    const y = at(x, z), y1 = at(x1, z1)
    prism(out, x, z, y - 0.1, y + 0.85, 0.2, 5, pale, 0, 0.16, false)
    prism(out, x, z, y + 0.85, y + 1.0, 0.16, 5, iron, surfaceTag('metal'), 0.02, false)
    // the chain, in two links of sag
    const mx = (x + x1) / 2, mz = (z + z1) / 2
    const my = (y + y1) / 2 + 0.42
    strut(out, [x, y + 0.75, z], [mx, my, mz], 0.04, 0.04, iron, surfaceTag('metal'), false)
    strut(out, [mx, my, mz], [x1, y1 + 0.75, z1], 0.04, 0.04, iron, surfaceTag('metal'), false)
  }
  const m = 56
  for (let k = 0; k < m; k++) {
    const x = Math.cos((k / m) * Math.PI * 2) * 39, z = Math.sin((k / m) * Math.PI * 2) * 39
    const y = at(x, z)
    prism(out, x, z, y - 0.1, y + 0.7, 0.07, 5, iron, surfaceTag('metal'), 0.06, false)
  }
}

/** The place round it, laid on the ground in rings: flags out to the dark posts, setts out to the bollards. Hollow round the arch's own feet. */
function place(out: MeshBuilder, fit: Fit, g: number): void {
  const at = (x: number, z: number): number => (fit.groundAt?.(x, z) ?? g) + 0.1
  const flags: Rgb = hex('#8d877b')
  const setts: Rgb = hex('#6a625c')
  const n = 40
  const radii: [number, Rgb][] = [[13, flags], [26, flags], [39, flags], [47.5, setts], [56.2, setts]]
  for (let j = 0; j < radii.length; j++) {
    const r1 = radii[j][0], r0 = j ? radii[j - 1][0] : 0
    const c = radii[j][1]
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2
      const P = (r: number, a: number): V => { const x = Math.cos(a) * r, z = Math.sin(a) * r; return [x, at(x, z), z] }
      const tag = surfaceTag(c === setts ? 'granite' : 'concrete')
      out.quad([P(r0, a0), P(r1, a0), P(r1, a1), P(r0, a1)], [0, 1, 0], UV, c, tag)
    }
  }
}

export function arcDeTriomphe(out: MeshBuilder, fit: Fit): void {
  const g = fit.grade ?? 0.5
  // the Champs-Élysées' face is −z (front 116), the Marseillaise on the viewer's right
  const champs = new MeshBuilder()
  longFace(champs, marseillaise, triomphe, 1, 2)
  append(out, champs)
  // the Grande Armée's, turned half round: the Résistance on the viewer's right
  const armee = new MeshBuilder()
  longFace(armee, resistance, paix, 3, 4)
  rotated(out, armee, Math.PI)
  // the two short faces, each with its one long battle
  for (const [a, seed] of [[Math.PI / 2, 5], [-Math.PI / 2, 6]] as const) {
    const s = new MeshBuilder()
    shortFace(s, seed)
    rotated(out, s, a)
  }
  passage(out)
  // the solid over the vault and under the corona, closing the top of everything
  block(out, -HX, HX, -HZ, HZ, PIER, TOP - 1.9, shade(STONE, 0.9))
  terrace(out)
  // the pavement through the passage, a hand above the ground the model is sunk in, and the tomb on it
  const floor: Rgb = hex('#6f6d67')
  out.quad([[-GW, g + 0.06, -HZ], [GW, g + 0.06, -HZ], [GW, g + 0.06, HZ], [-GW, g + 0.06, HZ]], [0, 1, 0], UV, floor, surfaceTag('granite'))
  for (const s of [-1, 1]) {
    const x0 = s > 0 ? GW : -HX, x1 = s > 0 ? HX : -GW
    out.quad([[x0, g + 0.06, -TW], [x1, g + 0.06, -TW], [x1, g + 0.06, TW], [x0, g + 0.06, TW]], [0, 1, 0], UV, floor, surfaceTag('granite'))
  }
  tomb(out, g + 0.06)
  rings(out, fit, g)
  place(out, fit, g)
}
