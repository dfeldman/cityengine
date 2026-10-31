/**
 * What Batch 2's parks need besides their planting (2026-10-31; docs/landmarks/PARIS-BATCHES.md; the planting is tools/gardens/paris-batch2.ts). Belleville's cascade, the wall of its terrace and its vines; the rock and Vautours of the Batignolles's pond and its
 * bandstand; the glasshouses of Auteuil; the Jardin d'Acclimatation's volière, Korean pavilion and alpine rock. Each says what it was read from. Rock is darker here than Batch 1's, which came out cream (the surface multiplies by 1.8).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { MeshBuilder as MB } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { strut } from '../../../models.ts'
import type { Fit } from '../../fit.ts'
import { hex, placed, prism, roof, shade, type Rgb } from '../../kit.ts'
import { block } from './tag.ts'
import { fall } from '../batch1/parks.ts'
import { arcade, archRing } from '../palaces/common.ts'

const STONE = hex('#c9c0ad'), STONE_DK = shade(STONE, 0.78), IRON = hex('#23272a')
const CONCRETE = hex('#8f8a7e'), DARK_ROCK = hex('#39373a'), WATER: Rgb = [0.27, 0.38, 0.41]
const UVQ: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const groundOf = (fit: Fit) => (x: number, z: number): number => fit.groundAt?.(x, z) ?? fit.grade ?? 0
const hash = (a: number, b: number): number => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v) }

/**
 * A CRAG of Alphand's layered artificial rock (fr.wikipedia on the Batignolles: "layered, like the rock at the Buttes-Chaumont"). Batch 1's `rock` is a tapered seven-sided lump, and in a heap at riding distance those read as a range of little cones (2026-10-31): this is a stack of irregular flat-topped slabs that step in and overhang, each its own shade.
 */
function crag(out: MeshBuilder, cx: number, cz: number, y0: number, h: number, r: number, seed: number, c: Rgb): void {
  const n = 8, tag = surfaceTag('rock'), layers = Math.max(2, Math.round(h / 1.2))
  const ring = (t: number, s: number, grow: number): [number, number][] => Array.from({ length: n }, (_, k) => {
    const a = (k / n) * Math.PI * 2 + seed
    const m = (1 - t * 0.55) * (0.72 + hash(seed + k, s) * 0.55) * grow
    return [cx + Math.cos(a) * r * m, cz + Math.sin(a) * r * m * (0.8 + hash(seed, k) * 0.35)]
  })
  for (let l = 0; l < layers; l++) {
    const t = l / layers, ya = y0 + (l * h) / layers, yb = y0 + ((l + 1) * h) / layers, tint = shade(c, 0.8 + hash(seed, l + 9) * 0.45)
    const lo = ring(t, l, 0.94), hi = ring(t, l, 1.04)
    for (let k = 0; k < n; k++) {
      const j = (k + 1) % n, nx = Math.cos(((k + 0.5) / n) * Math.PI * 2 + seed), nz = Math.sin(((k + 0.5) / n) * Math.PI * 2 + seed)
      out.quad([[lo[k][0], ya, lo[k][1]], [lo[j][0], ya, lo[j][1]], [hi[j][0], yb, hi[j][1]], [hi[k][0], yb, hi[k][1]]], [nx, 0.15, nz], UVQ, shade(tint, 0.84 + hash(k, l + seed) * 0.3), tag)
    }
    for (let k = 1; k + 1 < n; k++) out.quad([[hi[0][0], yb, hi[0][1]], [hi[k + 1][0], yb, hi[k + 1][1]], [hi[k][0], yb, hi[k][1]], [hi[k][0], yb, hi[k][1]]], [0, 1, 0], UVQ, shade(tint, 1.05), tag)
  }
}

/* ---------------------------------------------------------------------------------------------- Belleville */

/**
 * THE CASCADE of the Parc de Belleville (fr.wikipedia: "une fontaine en cascades de 100 mètres de long qui dévale la colline"), between OSM's two long stairs (read off the overlay: axis bearing 30 from (2, −45) to (32, 6) of the 48.8713 2.3849 grid):
 * a stair of pale concrete basins, each spilling into the next, walled low, the hill's own slope from fit.groundAt. −z uphill.
 */
export function bellevilleCascade(out: MeshBuilder, fit: Fit): void {
  const g = groundOf(fit), HZ = fit.hz, W = 2.2, tag = surfaceTag('concrete'), n = 18
  const at = (k: number): { z0: number; z1: number; y: number } => {
    const z0 = -HZ + (k * 2 * HZ) / n, z1 = z0 + (2 * HZ) / n
    return { z0, z1, y: g(0, (z0 + z1) / 2) + 0.25 }
  }
  for (let k = 0; k < n; k++) {
    const { z0, z1, y } = at(k)
    // (down to the next basin's level or a metre and a bit, whichever is further: the trays step down the slope and leave no gap)
    const low = y - Math.max(1.2, (k + 1 < n ? y - at(k + 1).y : 0) + 0.6)
    // the tray, its two low cheeks and the lip it spills over
    block(out, -W, W, z0, z1, low, y - 0.1, shade(CONCRETE, 0.9), tag)
    for (const s of [-1, 1]) block(out, Math.min(s * W, s * (W + 0.5)), Math.max(s * W, s * (W + 0.5)), z0, z1, low, y + 0.55, CONCRETE, tag)
    block(out, -W, W, z1 - 0.3, z1, low, y + 0.08, shade(CONCRETE, 1.08), tag)
    const r = [{ x: -W, z: z0 }, { x: W, z: z0 }, { x: W, z: z1 - 0.3 }, { x: -W, z: z1 - 0.3 }]
    out.water.push({ kind: 'pool', ring: r, y: y + 0.02, colour: WATER })
    if (k + 1 < n) {
      const drop = y - at(k + 1).y
      if (drop > 0.15) out.water.push({ kind: 'sheet', a: [-W + 0.2, y + 0.06, z1], b: [W - 0.2, y + 0.06, z1], out: 0.15, drop })
    }
  }
  // the mouth at the head of it, a concrete block in the hill, and a broad basin at the foot
  const top = at(0).y
  block(out, -W - 1, W + 1, -HZ - 1.6, -HZ, top - 1, top + 1.6, shade(CONCRETE, 0.96), tag)
  block(out, -0.9, 0.9, -HZ - 0.08, -HZ, top + 0.1, top + 0.8, hex('#23282a'))
  out.water.push({ kind: 'sheet', a: [-0.8, top + 0.75, -HZ + 0.02], b: [0.8, top + 0.75, -HZ + 0.02], out: 0.12, drop: 0.7 })
  const y1 = g(0, HZ + 4) + 0.2
  block(out, -5, 5, HZ, HZ + 8, y1 - 1.2, y1 - 0.08, shade(CONCRETE, 0.86), tag)
  for (const [a, b, c, d] of [[-5.5, -5, HZ, HZ + 8], [5, 5.5, HZ, HZ + 8], [-5.5, 5.5, HZ + 8, HZ + 8.5]]) block(out, a, b, c, d, y1 - 1.2, y1 + 0.4, CONCRETE, tag)
  out.water.push({ kind: 'pool', ring: [{ x: -5, z: HZ }, { x: 5, z: HZ }, { x: 5, z: HZ + 8 }, { x: -5, z: HZ + 8 }], y: y1 + 0.05, colour: WATER })
}

/**
 * THE TOP OF THE PARC DE BELLEVILLE (fr.wikipedia: "Une terrasse aménagée au sommet du parc"; aerial): the paved belvedere everyone comes for, the view of the whole city, and the curling stone wall that holds the hill under it, with its iron rail, from
 * (−78, 35) to (55, 3) of the grid. x east, z north about (10, 47) of it. Its paving is a slab on the ground; the wall follows the ground.
 */
export function bellevilleBelvedere(out: MeshBuilder, fit: Fit): void {
  const g = groundOf(fit), tag = surfaceTag('ashlar'), WALL = hex('#8d8472')
  const o = (e: number, n: number): [number, number] => [e - 10, n - 47]
  // (the paving of the belvedere, slightly proud of the ground, level with its highest corner)
  const paved: [number, number][] = [[-8, 38], [32, 38], [34, 52], [22, 60], [2, 60], [-8, 50]].map(([e, n]) => o(e, n))
  const yP = Math.max(...paved.map(([x, z]) => g(x, z))) + 0.1, yFoot = Math.min(yP - 1.2, ...paved.map(([x, z]) => g(x, z)))
  for (let k = 1; k + 1 < paved.length; k++) {
    out.quad([[paved[0][0], yP, paved[0][1]], [paved[k + 1][0], yP, paved[k + 1][1]], [paved[k][0], yP, paved[k][1]], [paved[k][0], yP, paved[k][1]]], [0, 1, 0], UVQ, hex('#b5b0a4'), surfaceTag('granite'))
  }
  for (let k = 0; k < paved.length; k++) {
    const [ax, az] = paved[k], [bx, bz] = paved[(k + 1) % paved.length]
    out.quad([[ax, yFoot, az], [bx, yFoot, bz], [bx, yP, bz], [ax, yP, az]], [bz - az, 0, ax - bx], UVQ, WALL, tag)
  }
  // the wall and its rail, length by length
  const lines: [number, number][][] = [
    [[-78, 35], [-68, 37], [-55, 38], [-40, 30], [-25, 27], [-15, 33], [-8, 38]],
    [[-8, 38], [2, 32], [0, 25], [10, 22], [20, 20], [30, 10], [38, 12], [45, 15], [52, 2]],
  ]
  for (const line of lines) {
    for (let k = 0; k + 1 < line.length; k++) {
      const [ax, az] = o(...line[k]), [bx, bz] = o(...line[k + 1])
      const L = Math.hypot(bx - ax, bz - az), m = Math.max(1, Math.round(L / 5))
      for (let i = 0; i < m; i++) {
        const P = (t: number): [number, number] => [ax + ((bx - ax) * t) / m, az + ((bz - az) * t) / m]
        const [px, pz] = P(i), [qx, qz] = P(i + 1)
        const ya = g(px, pz), yb = g(qx, qz)
        strut(out, [px, ya + 0.1, pz], [qx, yb + 0.1, qz], 0.55, 2.2, WALL, tag)
        strut(out, [px, ya + 1.28, pz], [qx, yb + 1.28, qz], 0.72, 0.14, shade(WALL, 1.1), tag)
        strut(out, [px, ya + 2.25, pz], [qx, yb + 2.25, qz], 0.05, 0.05, IRON)
        block(out, px - 0.03, px + 0.03, pz - 0.03, pz + 0.03, ya + 1.3, ya + 2.25, IRON)
      }
    }
  }
  // a row of lime-green iron pergola along the belvedere's back, the climbers on it
  for (let i = 0; i <= 8; i++) {
    const x = -14 + i * 4, z = 11.5
    block(out, x - 0.07, x + 0.07, z - 0.07, z + 0.07, yP, yP + 3, IRON)
    block(out, x - 0.07, x + 0.07, z - 3.1, z - 2.97, yP, yP + 3, IRON)
    strut(out, [x, yP + 3.05, z + 0.3], [x, yP + 3.05, z - 3.4], 0.08, 0.12, IRON)
    if (i < 8) block(out, x + 0.2, x + 3.8, z - 3 + hash(i, 2) * 2, z - 0.5 + hash(i, 3) * 0.5, yP + 3.1, yP + 3.55, shade(hex('#4c6b37'), 0.85 + hash(i, 5) * 0.3), surfaceTag('foliage'))
  }
}

/**
 * THE VINES of Belleville ("quelques pieds de vigne", pinot meunier, recalling the hill's old wine; the aerial's stripes at (70…95, −5…−25), rows on bearing 130). Batch 1's hedged vines read as dark bars at riding distance: here a stake and a head of leaf to each stock,
 * so you see down the row, wires between the posts. x along the rows.
 */
export function bellevilleVines(out: MeshBuilder, fit: Fit): void {
  const g = groundOf(fit), LEAF = hex('#3a5126'), STOCK = hex('#40352a'), POST = hex('#6b6459'), HX = fit.hx, ROWS = 9
  for (let r = 0; r < ROWS; r++) {
    const z = -fit.hz + 0.6 + (r * (2 * fit.hz - 1.2)) / (ROWS - 1)
    for (let x = -HX; x <= HX; x += 1.25) {
      const j = hash(x, r), y = g(x, z)
      block(out, x - 0.04, x + 0.04, z - 0.04, z + 0.04, y, y + 0.75, STOCK)
      const w = 0.42 + j * 0.2, h = 0.5 + j * 0.25
      block(out, x - 0.55 - j * 0.1, x + 0.55 + j * 0.1, z - w / 2, z + w / 2, y + 0.65, y + 0.65 + h, shade(LEAF, 0.82 + j * 0.42), surfaceTag('foliage'))
    }
    for (let x = -HX; x <= HX + 0.1; x += 7.5) block(out, x - 0.05, x + 0.05, z - 0.05, z + 0.05, g(x, z), g(x, z) + 1.5, POST)
    strut(out, [-HX, g(-HX, z) + 1.35, z], [HX, g(HX, z) + 1.35, z], 0.02, 0.02, IRON)
  }
}

/* ----------------------------------------------------------------------------------------- the Batignolles */

/**
 * THE POND OF THE SQUARE DES BATIGNOLLES's rockwork (Alphand, 1862; "une grotte, une rivière, une cascade et un lac miniature", its rock layered like the Buttes') and LES VAUTOURS (Louis de Monard, 1930, black Volvic stone, on the island): the shore's stones, the stack the fall
 * comes down at the north-west, its dark mouth. Stand-in for the vultures: two hunched dark masses on a rock; PARIS-TRIPO-NOTES.md has the line. x east, z north about the pond's middle (48.887877, 2.315863), aerial.
 */
export function batignollesRocks(out: MeshBuilder, fit: Fit): void {
  const g = groundOf(fit), y0 = fit.grade ?? 0
  // the shore: stones along the baked pond's own outline (tile −6_15's water, in this frame), a little outward; thinner down the stream
  const POND: [number, number][] = [[10, -9], [12, 2], [12, 7], [11, 11], [7, 16], [1, 18], [-7, 17], [-12, 12], [-14, 10], [-14, 4], [-13, 1], [-10, -5], [-6, -9], [-2, -12], [4, -15], [10, -12], [12, -15], [19, -21], [25, -25], [32, -32], [35, -36]]
  for (let i = 0; i + 1 < POND.length; i++) {
    const [ax, az] = POND[i], [bx, bz] = POND[i + 1], L = Math.hypot(bx - ax, bz - az), m = Math.max(1, Math.round(L / 2.1))
    for (let k = 0; k < m; k++) {
      const t = (k + 0.5) / m, x0 = ax + (bx - ax) * t, z0 = az + (bz - az) * t, d = Math.hypot(x0 + 1, z0 - 5) || 1, seed = i * 7 + k
      const out_ = 0.7 + hash(seed, 3) * 1, x = x0 + ((x0 + 1) / d) * out_, z = z0 + ((z0 - 5) / d) * out_
      if (i >= 16 && hash(seed, 1) < 0.5) continue
      const north = 0.6 + Math.max(0, z - 5) * 0.06 + Math.max(0, -x) * 0.03
      crag(out, x, z, g(x, z) - 0.3, 0.7 + hash(seed, 4) * 1.2 * north, 1.1 + hash(seed, 5) * 1, seed * 1.7, DARK_ROCK)
    }
  }
  // the stack: big shelves on the north-west bank, the fall coming down them, the grotto's dark mouth low in it
  for (let k = 0; k < 15; k++) {
    const x = -18 + hash(k, 7) * 13, z = 13 + hash(k, 8) * 7, h = 1.6 + hash(k, 9) * 4
    crag(out, x, z, g(x, z) - 0.3, h, 1.6 + hash(k, 10) * 1.4, k * 2.3, DARK_ROCK)
  }
  block(out, -11.2, -9, 14, 15.4, y0 - 0.1, y0 + 1.5, hex('#14171a'))
  fall(out, -6.4, -5.2, 15.5, y0 + 0.15, y0 + 3.3)
  fall(out, -4.2, -3.5, 16.2, y0 + 0.15, y0 + 1.6)
  // the island: a low rock, and the vultures hunched on it in black Volvic
  crag(out, -2.5, 2, y0 - 0.2, 1.2, 2.5, 11, DARK_ROCK)
  const V = hex('#222224'), tag = surfaceTag('granite')
  for (const [x, z, a] of [[-3.1, 2.4, 0.6], [-1.7, 1.4, 2.4]] as const) {
    prism(out, x, z, y0 + 1.1, y0 + 2.2, 0.42, 7, V, tag, 0.26)
    prism(out, x + Math.cos(a) * 0.22, z + Math.sin(a) * 0.22, y0 + 2.2, y0 + 2.55, 0.12, 6, V, tag, 0.1)
    strut(out, [x, y0 + 1.95, z], [x - Math.sin(a) * 0.6, y0 + 1.3, z + Math.cos(a) * 0.6], 0.12, 0.42, V, tag)
    strut(out, [x, y0 + 1.95, z], [x + Math.sin(a) * 0.6, y0 + 1.3, z - Math.cos(a) * 0.6], 0.12, 0.42, V, tag)
  }
}

/** The BANDSTAND of the Square des Batignolles (OSM way/683934692, `historic`, 6.7 m across; fr.wikipedia: the kiosque à musique, now the K.A.B's little gallery round its orange tree): iron posts on a stone drum, a zinc roof, open. */
export function batignollesKiosk(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0, R = Math.min(fit.hx, fit.hz), n = 8, ZINC = hex('#6f7b7e'), GREEN = hex('#2f4a40')
  prism(out, 0, 0, y - 0.3, y + 1, R, n, STONE, surfaceTag('ashlar'))
  prism(out, 0, 0, y + 1, y + 1.08, R + 0.15, n, shade(STONE, 1.08), surfaceTag('ashlar'))
  for (let k = 0; k < n; k++) {
    const a = ((k + 0.5) / n) * Math.PI * 2, x = Math.cos(a) * (R - 0.35), z = Math.sin(a) * (R - 0.35)
    prism(out, x, z, y + 1.08, y + 4.3, 0.07, 6, GREEN, surfaceTag('metal'))
    const a2 = ((k + 1.5) / n) * Math.PI * 2, x2 = Math.cos(a2) * (R - 0.35), z2 = Math.sin(a2) * (R - 0.35)
    strut(out, [x, y + 4, z], [x2, y + 4, z2], 0.08, 0.5, GREEN)
    strut(out, [x, y + 2, z], [x2, y + 2, z2], 0.05, 0.05, GREEN)
  }
  prism(out, 0, 0, y + 4.3, y + 4.5, R + 0.3, n, GREEN)
  prism(out, 0, 0, y + 4.5, y + 6.1, R + 0.3, n, ZINC, surfaceTag('metal'), 0.5)
  prism(out, 0, 0, y + 6.1, y + 6.8, 0.5, n, ZINC, surfaceTag('metal'), 0.06)
}

/* ----------------------------------------------------------------------------------------------- Auteuil */

const GL: Rgb = hex('#7d9ea6'), GL_HI: Rgb = hex('#94b4ba'), RIB: Rgb = hex('#e4e6e0'), BRICK = hex('#7a4c39')
const glass = surfaceTag('glass')

/** One gabled glass span, its ridge along z: z0..z1, x0..x1, a brick dwarf wall, glass wall to `wall`, a roof to `ridge`, white iron ribs at every `bay`. */
function span(out: MeshBuilder, x0: number, x1: number, z0: number, z1: number, y: number, wall: number, ridge: number, bay: number, ends: boolean): void {
  const xm = (x0 + x1) / 2, Y = y + wall, R = y + ridge, D = 0.7
  block(out, x0, x1, z0, z1, y, y + D, BRICK, surfaceTag('brick'))
  const hw = (x1 - x0) / 2, run = Math.hypot(hw, R - Y)
  for (const [xa, s] of [[x0, -1], [x1, 1]] as const) {
    out.quad([[xa, y + D, z0], [xa, y + D, z1], [xa, Y, z1], [xa, Y, z0]], [s, 0, 0], UVQ, GL, glass)
    out.quad([[xa, Y, z0], [xa, Y, z1], [xm, R, z1], [xm, R, z0]], [s * (R - Y) / run, hw / run, 0], UVQ, GL_HI, glass)
  }
  if (ends) {
    for (const [z, s] of [[z0, -1], [z1, 1]] as const) {
      out.quad([[x0, y + D, z], [x1, y + D, z], [x1, Y, z], [x0, Y, z]], [0, 0, s], UVQ, GL, glass)
      out.quad([[x0, Y, z], [x1, Y, z], [xm, R, z], [xm, R, z]], [0, 0, s], UVQ, GL, glass)
    }
  }
  const nb = Math.max(1, Math.round((z1 - z0) / bay))
  for (let i = 0; i <= nb; i++) {
    const z = z0 + (i * (z1 - z0)) / nb
    for (const xa of [x0, x1]) {
      block(out, xa - 0.05, xa + 0.05, z - 0.05, z + 0.05, y + D, Y, RIB)
      strut(out, [xa, Y, z], [xm, R + 0.04, z], 0.08, 0.1, RIB)
    }
  }
  block(out, xm - 0.08, xm + 0.08, z0, z1, R, R + 0.14, RIB)
  for (const xa of [x0, x1]) block(out, xa - 0.08, xa + 0.08, z0, z1, Y - 0.06, Y + 0.06, RIB)
}

/**
 * THE SERRES D'AUTEUIL (Jean-Camille Formigé, 1898, Paris's own glasshouses; OSM ways in the entry, read off the aerial and the bearing of their outlines, north up): the PALMARIUM in the middle of the south range, a square glass dome 16 m to the top on its iron ribs, with the Serre équatoriale and
 * the Orangerie curved vaults either side, and north of them the PLATEAUX, each of three parallel gabled spans, pale with whitewash in the photograph. OSM has them as a 5-storey block with a slate roof and dormers. x east, z north about (48.8466, 2.2522).
 */
export function serresAuteuil(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0
  // the plateaux and the short ranges south of them
  for (const [cx, cz, L] of [[-37.5, 32, 55.6], [38.4, 29, 55.6]] as const) {
    for (let k = 0; k < 3; k++) span(out, cx - 14 + k * 9.33, cx - 14 + (k + 1) * 9.33, cz - L / 2, cz + L / 2, y, 3.6, 6.2, 3.4, true)
    block(out, cx - 14, cx + 14, cz + L / 2, cz + L / 2 + 0.3, y, y + 1.4, BRICK, surfaceTag('brick'))
  }
  for (const [cx, cz] of [[-39.2, -6.6], [37, -9.7]] as const) span(out, cx - 14.4, cx + 14.4, cz - 6.6, cz + 6.6, y, 4, 6.8, 3.2, true)
  // the curved vaults, east and west of the palmarium: barrel roofs on a stone base
  const vault = (x0: number, x1: number, z0: number, z1: number, H: number): void => {
    block(out, x0, x1, z0, z1, y, y + 1, STONE_DK, surfaceTag('ashlar'))
    const n = 8, W = (z1 - z0) / 2, zm = (z0 + z1) / 2, Y0 = y + 3.8
    const P = (a: number): [number, number] => [zm + Math.cos(a) * W, Y0 + Math.sin(a) * (H - 3.8)]
    for (let k = 0; k < n; k++) {
      const a0 = (k / n) * Math.PI, a1 = ((k + 1) / n) * Math.PI, [z_0, h0] = P(a0), [z_1, h1] = P(a1), am = (a0 + a1) / 2
      out.quad([[x1, h0, z_0], [x0, h0, z_0], [x0, h1, z_1], [x1, h1, z_1]], [0, Math.sin(am), Math.cos(am)], UVQ, k % 2 ? GL : GL_HI, glass)
    }
    for (const [z, s] of [[z0, -1], [z1, 1]] as const) out.quad([[x0, y + 1, z], [x1, y + 1, z], [x1, Y0, z], [x0, Y0, z]], [0, 0, s], UVQ, GL, glass)
    for (const x of [x0, x1]) {
      out.quad([[x, y + 1, z0], [x, y + 1, z1], [x, Y0, z1], [x, Y0, z0]], [x === x0 ? -1 : 1, 0, 0], UVQ, GL, glass)
      for (let k = 0; k < n; k++) { const [z_0, h0] = P((k / n) * Math.PI), [z_1, h1] = P(((k + 1) / n) * Math.PI); out.quad([[x, Y0, zm], [x, h0, z_0], [x, h1, z_1], [x, h1, z_1]], [x === x0 ? -1 : 1, 0, 0], UVQ, GL_HI, glass) }
    }
    const nb = Math.round((x1 - x0) / 3)
    for (let i = 0; i <= nb; i++) {
      const x = x0 + (i * (x1 - x0)) / nb
      for (let k = 0; k < n; k++) { const [z_0, h0] = P((k / n) * Math.PI), [z_1, h1] = P(((k + 1) / n) * Math.PI); strut(out, [x, h0, z_0], [x, h1, z_1], 0.07, 0.1, RIB) }
      for (const z of [z0, z1]) block(out, x - 0.05, x + 0.05, z - 0.05, z + 0.05, y + 1, Y0, RIB)
    }
    block(out, x0, x1, z0 - 0.08, z0 + 0.08, Y0 - 0.06, Y0 + 0.06, RIB)
    block(out, x0, x1, z1 - 0.08, z1 + 0.08, Y0 - 0.06, Y0 + 0.06, RIB)
  }
  vault(-52.4, -22.5, -38.2, -22.6, 9.5)
  vault(18.5, 48.3, -41.2, -25.6, 9.5)
  vault(-22.5, -11, -41, -23, 11.5)
  vault(7, 18.5, -41, -23, 11.5)
  // the palmarium's dome: a stone plinth, walls of glass 7 m, the square dome curving to a lantern
  const cx = -2, cz = -32, HW = 9, b0 = y + 1.2, b1 = y + 7.4
  block(out, cx - HW - 0.3, cx + HW + 0.3, cz - HW - 0.3, cz + HW + 0.3, y, b0, STONE, surfaceTag('ashlar'))
  for (const [a, b, c, d, nn] of [[-1, 1, -1, -1, [0, 0, -1]], [1, -1, 1, 1, [0, 0, 1]], [-1, -1, 1, -1, [-1, 0, 0]], [1, 1, -1, 1, [1, 0, 0]]] as const) {
    out.quad([[cx + a * HW, b0, cz + c * HW], [cx + b * HW, b0, cz + d * HW], [cx + b * HW, b1, cz + d * HW], [cx + a * HW, b1, cz + c * HW]], nn as unknown as [number, number, number], UVQ, GL, glass)
  }
  const bands = 7
  for (let k = 0; k < bands; k++) {
    const a0 = (k / bands) * Math.PI / 2, a1 = ((k + 1) / bands) * Math.PI / 2
    const w0 = HW * Math.cos(a0), w1 = Math.max(0.9, HW * Math.cos(a1)), ya = b1 + Math.sin(a0) * 7.4, yb = b1 + Math.sin(a1) * 7.4
    const tint = k % 2 ? GL : GL_HI
    roof(out, cx - w0, cx + w0, cz - w0, cz + w0, ya, yb - ya, w0 - w1, w0 - w1, tint)
    if (k < bands - 1) for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) strut(out, [cx + sx * w0, ya, cz + sz * w0], [cx + sx * w1, yb, cz + sz * w1], 0.14, 0.14, RIB)
    for (const s of [-1, 1]) {
      block(out, cx - w0, cx + w0, cz + s * w0 - 0.06, cz + s * w0 + 0.06, ya - 0.05, ya + 0.05, RIB)
      block(out, cx + s * w0 - 0.06, cx + s * w0 + 0.06, cz - w0, cz + w0, ya - 0.05, ya + 0.05, RIB)
    }
  }
  for (let i = -3; i <= 3; i++) for (const s of [-1, 1]) {
    block(out, cx + i * 3 - 0.06, cx + i * 3 + 0.06, cz + s * HW - 0.06, cz + s * HW + 0.06, b0, b1, RIB)
    block(out, cx + s * HW - 0.06, cx + s * HW + 0.06, cz + i * 3 - 0.06, cz + i * 3 + 0.06, b0, b1, RIB)
  }
  prism(out, cx, cz, b1 + 7.4, b1 + 8.6, 0.9, 8, GL_HI, glass, 0.7)
  prism(out, cx, cz, b1 + 8.6, b1 + 9.6, 0.14, 6, IRON, surfaceTag('metal'), 0.04)
  // the palms inside, a dark mass behind the glass
  prism(out, cx, cz, b0, y + 7, HW - 1.2, 8, hex('#3f5a3e'), surfaceTag('foliage'), HW - 3)
}

/* ------------------------------------------------------------------------------------ the Jardin d'Acclimatation */

/** LA GRANDE VOLIÈRE (OSM way/83059097, 63 × 13.6 m along bearing 13): the long aviary, a wire barrel on dark iron hoops. Mesh can't be drawn at this size: a pale tint for it, the hoops dark. −z to the west of it, x along it. */
export function acclimVoliere(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0, L = fit.hx, W = fit.hz, H = 9, n = 8, M: Rgb = hex('#8e9795'), tag = surfaceTag('glass')
  block(out, -L, L, -W, W, y, y + 0.5, STONE_DK, surfaceTag('ashlar'))
  const P = (a: number): [number, number] => [Math.cos(a) * W, y + 2 + Math.sin(a) * (H - 2)]
  for (let k = 0; k < n; k++) {
    const a0 = (k / n) * Math.PI, a1 = ((k + 1) / n) * Math.PI, [z0, y0] = P(a0), [z1, y1] = P(a1), am = (a0 + a1) / 2
    out.quad([[L, y0, z0], [-L, y0, z0], [-L, y1, z1], [L, y1, z1]], [0, Math.sin(am), Math.cos(am)], UVQ, M, tag)
  }
  for (const s of [-1, 1]) {
    out.quad([[-L, y + 0.5, s * W], [L, y + 0.5, s * W], [L, y + 2, s * W], [-L, y + 2, s * W]], [0, 0, s], UVQ, M, tag)
    for (let k = 0; k < n; k++) { const [z0, y0] = P((k / n) * Math.PI), [z1, y1] = P(((k + 1) / n) * Math.PI); out.quad([[s * L, y + 2, 0], [s * L, y0, z0], [s * L, y1, z1], [s * L, y1, z1]], [s, 0, 0], UVQ, M, tag) }
  }
  const hoops = Math.round((L * 2) / 4.5)
  for (let i = 0; i <= hoops; i++) {
    const x = -L + (i * 2 * L) / hoops
    for (let k = 0; k < n; k++) { const [z0, y0] = P((k / n) * Math.PI), [z1, y1] = P(((k + 1) / n) * Math.PI); strut(out, [x, y0, z0], [x, y1, z1], 0.1, 0.14, IRON) }
    for (const s of [-1, 1]) block(out, x - 0.06, x + 0.06, s * W - 0.06, s * W + 0.06, y, y + 2, IRON)
  }
  // something to perch on, inside: dead trees and a green floor
  block(out, -L + 0.3, L - 0.3, -W + 0.3, W - 0.3, y + 0.5, y + 0.55, hex('#5d7040'))
  for (let k = 0; k < 9; k++) { const x = -L + 4 + (k * (2 * L - 8)) / 8; prism(out, x, (hash(k, 1) - 0.5) * W, y + 0.5, y + 4 + hash(k, 2) * 2, 0.1, 5, hex('#4a3b2e'), 0, 0.04) }
}

/** THE JARDIN DE SÉOUL's pavilion (OSM's garden, way/86105121: the Korean garden given in 2002, a jeong-ja among pines): a square wooden pavilion on stone, red-brown posts, a grey tile roof with its corners swept up. Front −z. */
export function acclimSeoul(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0, HW = 3.4, W = hex('#6a3d2c'), T = hex('#555a5c'), tag = surfaceTag('tile')
  block(out, -HW - 0.6, HW + 0.6, -HW - 0.6, HW + 0.6, y - 0.3, y + 0.7, hex('#8f897c'), surfaceTag('granite'))
  block(out, -HW - 0.1, HW + 0.1, -HW - 0.1, HW + 0.1, y + 0.7, y + 0.82, hex('#7a5a3e'), surfaceTag('planks'))
  for (const x of [-HW, -HW / 3, HW / 3, HW]) for (const z of [-HW, -HW / 3, HW / 3, HW]) {
    if (Math.abs(x) < HW && Math.abs(z) < HW) continue
    prism(out, x, z, y + 0.82, y + 3.5, 0.13, 8, W)
  }
  for (const s of [-1, 1]) { block(out, -HW, HW, s * HW - 0.1, s * HW + 0.1, y + 3.2, y + 3.55, shade(W, 0.9)); block(out, s * HW - 0.1, s * HW + 0.1, -HW, HW, y + 3.2, y + 3.55, shade(W, 0.9)) }
  // (a roof with swept corners: a low eave skirt rising at its ends, and the hip over it)
  const E = HW + 1.5
  for (const [ax, az, bx, bz, nx, nz] of [[-E, -E, E, -E, 0, -1], [E, -E, E, E, 1, 0], [E, E, -E, E, 0, 1], [-E, E, -E, -E, -1, 0]] as const) {
    const m = 6
    for (let i = 0; i < m; i++) {
      const u0 = i / m, u1 = (i + 1) / m
      const rise = (u: number): number => 0.55 * Math.pow(2 * Math.abs(u - 0.5), 2.2)
      const P = (u: number, t: number): [number, number, number] => {
        const x = ax + (bx - ax) * u, z = az + (bz - az) * u
        const k = 1 - t * 0.5
        return [x * k, y + 3.7 + rise(u) * (1 - t) + t * 1.3, z * k]
      }
      out.quad([P(u0, 0), P(u1, 0), P(u1, 1), P(u0, 1)], [nx * 0.55, 0.83, nz * 0.55], UVQ, T, tag)
    }
  }
  roof(out, -E * 0.5, E * 0.5, -E * 0.5, E * 0.5, y + 5, 1.5, E * 0.5, E * 0.5 - 0.3, shade(T, 0.92))
  prism(out, 0, 0, y + 6.4, y + 6.9, 0.2, 8, shade(T, 0.7), tag, 0.08)
}

/** LE ROCHER ALPIN (OSM way/86203576, `attraction=animal`, 65 × 35 m): the goats' artificial mountain, 1860, Combaz's kind of rockwork, in a long craggy ridge with its dark caves. Dark on purpose: Batch 1's rock read as cream. x along it. */
export function acclimRocher(out: MeshBuilder, fit: Fit): void {
  const g = groundOf(fit), R = fit.hx, Z = fit.hz, N = 46
  for (let k = 0; k < N; k++) {
    const a = hash(k, 1), b = hash(k, 2) * 2 - 1
    const x = (a * 2 - 1) * R * 0.92, z = b * Z * 0.8 * (1 - Math.abs(a * 2 - 1) * 0.5)
    const ridge = (1 - Math.abs(z) / Z) * (1 - Math.pow(Math.abs(x) / R, 2))
    const h = 1.2 + ridge * (5 + hash(k, 3) * 5), r = 2.3 + hash(k, 4) * 2.6
    crag(out, x, z, g(x, z) - 0.4, h, r, k * 1.3, DARK_ROCK)
  }
  for (const [x, z] of [[-R * 0.35, Z * 0.72], [R * 0.25, -Z * 0.72]] as const) block(out, x - 1.2, x + 1.2, z - 0.8, z + 0.8, g(x, z), g(x, z) + 1.8, hex('#14171a'))
  // the rail round it
  for (const s of [-1, 1]) block(out, -R, R, s * Z - 0.03, s * Z + 0.03, g(0, s * Z) + 1, g(0, s * Z) + 1.06, IRON)
}


/* ----------------------------------------------------------------------------------------- the Coulée verte */

/**
 * THE COULÉE VERTE on the Viaduc des Arts (Vergely and Mathieux, 1993; OSM's ways, footway layer 1 and 2, here simplified): the planted top of the viaduct, 8.5 m over the Avenue Daumesnil (regions.json `elevatedWalks`, the height the bake lifts its walk to): clipped hornbeam and laurel in stone planters either side, roses on steel hoops at the arbours, limes and hazels between. A plan can't say this:
 * it lies on the ground. x east, z north about (48.8468, 2.3765). Trees by deck rings; a deck is one height, so one to a length.
 */
/**
 * The viaduct itself, where OSM has its long low buildings (8 m generic blocks in the bake): the street crossings fall between the lengths. One entry to a length, in that length's own frame (x along it, front = its bearing + 90): an entry's `size` is what the overhead poles keep clear of, as a circle round its point (Landmarks.standalone), and a single entry for the whole viaduct made that a circle 460 m across the 12th. [east, north] from 48.8468 2.3765.
 */
const COULEE_LENGTHS: [number, number][][] = [[[-318, 253], [-284, 228]], [[-262, 211], [-191, 158]], [[-183, 153], [-87, 82]], [[-74, 73], [-14, 30]], [[26, 1], [81, -40], [117, -66]], [[117, -66], [205, -130]], [[205, -130], [294, -195]], [[294, -195], [382, -259]]]
function couleeLength(out: MeshBuilder, fit: Fit, pts: [number, number][]): void {
  const [ax0, an0] = pts[0], [bx0, bn0] = pts[pts.length - 1], cE = (ax0 + bx0) / 2, cN = (an0 + bn0) / 2
  const B = Math.atan2(bx0 - ax0, bn0 - an0), th = B - Math.PI / 2, c = Math.cos(th), si = Math.sin(th)
  coulee(out, fit, [pts.map(([e, n]): [number, number] => [(e - cE) * c - (n - cN) * si, (e - cE) * si + (n - cN) * c])])
}
export const COULEE_VIADUCT: Record<string, (out: MeshBuilder, fit: Fit) => void> = Object.fromEntries(COULEE_LENGTHS.map((p, i) => [`couleeViaduct${i + 1}`, (out: MeshBuilder, fit: Fit) => couleeLength(out, fit, p)]))
function coulee(out: MeshBuilder, fit: Fit, VIADUCT: [number, number][][]): void {
  const g = groundOf(fit), H = 8.5, P = hex('#7f7869'), LEAF = hex('#2f4426'), ROSE = hex('#b2546a'), tag = surfaceTag('clipped'), W = 3.2
  // the arches: Paris's Viaduc des Arts, 64 of them in brick and pink stone, the craftsmen's glass in each
  const VS = hex('#a58b74'), VB = hex('#7a4c3a'), HW = 6.1, ash = surfaceTag('ashlar')
  for (const run of VIADUCT) for (let i = 0; i + 1 < run.length; i++) {
    const [ax, az] = run[i], [bx, bz] = run[i + 1], L = Math.hypot(bx - ax, bz - az)
    if (L < 1) continue
    const ux = (bx - ax) / L, uz = (bz - az) / L, a = Math.atan2(-uz, ux), m = Math.max(1, Math.round(L / 9.7)), B = L / m
    for (let k = 0; k < m; k++) {
      const u = (k + 0.5) * B, cx = ax + ux * u, cz = az + uz * u, y = g(cx, cz), nX = -uz, nZ = ux
      // (the terrain's lidar has the viaduct's own back in it, up to 4 m over the street either side: its feet go down to the lower of the two pavements, its head stays with the walk)
      const foot = Math.min(y, g(cx + nX * 11, cz + nZ * 11), g(cx - nX * 11, cz - nZ * 11), g(cx + nX * 17, cz + nZ * 17), g(cx - nX * 17, cz - nZ * 17)) - 0.5
      const crown = y + 6.4, R = (B - 2) / 2, q = new MB()
      arcade(q, -HW, -B / 2, B / 2, foot, y + 8.1, [0], B - 2, crown - foot, 0.8, VS, shade(VB, 0.85), hex('#57707a'), 4)
      archRing(q, -HW, 0, crown - R, R, R + 0.55, 0.06, VB, shade(VS, 1.15), 4)
      block(q, -B / 2, B / 2, -HW - 0.2, -HW, y + 7.5, y + 7.95, shade(VS, 1.12), ash)
      block(q, -0.05, 0.05, -HW + 0.72, -HW + 0.8, foot, crown - 0.5, IRON)
      block(q, -R, R, -HW + 0.72, -HW + 0.8, foot + 4, foot + 4.1, IRON)
      placed(out, q, a, cx, cz)
      placed(out, q, a + Math.PI, cx, cz)
      strut(out, [cx - ux * B / 2, y + 8.1, cz - uz * B / 2], [cx + ux * B / 2, y + 8.1, cz + uz * B / 2], HW * 2 + 0.5, 0.35, shade(VS, 0.9), ash)
    }
    if (i === 0) { const y = g(ax, az); strut(out, [ax, y + 3.8, az], [ax + ux * 0.5, y + 3.8, az + uz * 0.5], HW * 2, 8.6, VS, ash) }
    if (i === run.length - 2) { const y = g(bx, bz); strut(out, [bx - ux * 0.5, y + 3.8, bz - uz * 0.5], [bx, y + 3.8, bz], HW * 2, 8.6, VS, ash) }
  }
  // (only on the runs: where the walk leaves the viaduct, over the Jardin Hector-Malot and the streets, the bake's own footbridge has it)
  for (const run of VIADUCT) for (let i = 0; i + 1 < run.length; i++) {
    const [ax, az] = run[i], [bx, bz] = run[i + 1], L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L, nx = -uz, nz = ux
    if (L < 12) continue
    const y = (t: number, s: number): number => g(ax + ux * t + nx * s, az + uz * t + nz * s) + H
    const STEP = 9
    for (let t = 0; t + STEP <= L; t += STEP) {
      const j = hash(i, t), gap = (Math.floor(t / STEP) % 7 === 3)
      for (const s of [-1, 1]) {
        if (gap && s > 0) continue
        const y0 = y(t, 0), y1 = y(t + STEP, 0)
        strut(out, [ax + ux * t + nx * s * W, y0 + 0.28, az + uz * t + nz * s * W], [ax + ux * (t + STEP) + nx * s * W, y1 + 0.28, az + uz * (t + STEP) + nz * s * W], 1.2, 0.55, P, surfaceTag('ashlar'))
        strut(out, [ax + ux * t + nx * s * W, y0 + 0.95, az + uz * t + nz * s * W], [ax + ux * (t + STEP) + nx * s * W, y1 + 0.95, az + uz * (t + STEP) + nz * s * W], 1, 0.85 + j * 0.3, shade(LEAF, 0.85 + j * 0.3), tag)
      }
    }
    // the arbours: steel hoops carrying roses, thirty metres in every hundred or so
    for (let t = 30; t + 30 < L; t += 180) {
      for (let k = 0; k < 8; k++) {
        const u = t + k * 4, cx = ax + ux * u, cz = az + uz * u, yy = y(u, 0)
        for (const s of [-1, 1]) block(out, cx + nx * s * 2.3 - 0.05, cx + nx * s * 2.3 + 0.05, cz + nz * s * 2.3 - 0.05, cz + nz * s * 2.3 + 0.05, yy, yy + 2.8, IRON)
        strut(out, [cx - nx * 2.3, yy + 2.8, cz - nz * 2.3], [cx, yy + 3.5, cz], 0.1, 0.1, IRON)
        strut(out, [cx + nx * 2.3, yy + 2.8, cz + nz * 2.3], [cx, yy + 3.5, cz], 0.1, 0.1, IRON)
        if (k < 7) for (const s of [-1, 0, 1]) {
          const q = hash(k, s + 4)
          strut(out, [cx + nx * s * 1.3, yy + 3.1 + (s ? 0 : 0.35), cz + nz * s * 1.3], [cx + ux * 4 + nx * s * 1.3, yy + 3.1 + (s ? 0 : 0.35), cz + uz * 4 + nz * s * 1.3], 0.9, 0.35, q < 0.55 ? ROSE : shade(LEAF, 1.1), surfaceTag(q < 0.55 ? 'blossom' : 'foliage'))
        }
      }
    }
    // the limes and hazels that stand over the hedges on both sides
    for (const s of [-1, 1]) {
      const q = (t: number, d: number): { x: number; z: number } => ({ x: ax + ux * t + nx * s * d, z: az + uz * t + nz * s * d })
      out.decks.push({ ring: [q(4, 4.4), q(L - 4, 4.4), q(L - 4, 6.5), q(4, 6.5)], y: y(L / 2, 0), keepOff: 0, spacing: 11, form: { form: 'plane', h: [6, 9] } })
    }
  }
}
