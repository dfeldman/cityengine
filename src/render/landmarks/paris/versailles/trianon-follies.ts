/**
 * Three follies of Marie-Antoinette's Jardin anglais at the Petit Trianon (Richard Mique, 1776–1786), each stood alone on its
 * lat/lon (the entries carry no OSM ref so the frame stays exactly east/north whatever the OSM outline's axis):
 *
 *   * the TEMPLE DE L'AMOUR (1778; OSM way/63855314, an island 15.5 m across in the river): twelve white Corinthian columns on
 *     a stepped round podium under a coffered dome, a pedestal in the middle where Bouchardon's Cupid stands (the statue is a GLB).
 *   * the BELVÉDÈRE (1778; way/427280007, an octagon 9.3 m across): pale ashlar on a stepped platform, four doors alternating with
 *     four windows, each under a pediment or carved overdoor, a balustraded parapet and a low lead dome, a sphinx plinth to each
 *     diagonal on the steps. It stands on a rise beside the little lake.
 *   * the GRAND ROCHER / GROTTE (way/427280143, 12.6 × 19.9 m): a mound of artificial rock, its cave facing east to the water
 *     and a little stream falling from the cave's mouth. The Apollo grotto's crag courses (garden-structures.ts), turned on end.
 *
 * Tunables are the constants at the top of each.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { column, dome, hex, prism, shade } from '../../kit.ts'
import { boxAlong } from '../../parts.ts'
import { block } from '../batch2/tag.ts'
import { crag } from '../batch3/parks.ts'

const hash = (a: number, b: number): number => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v) }
const STONE = surfaceTag('ashlar'), SMOOTH = surfaceTag('stucco'), ROCKTAG = surfaceTag('rock')
type V3 = [number, number, number]

/** A triangular pediment: base from a to b (y0), apex h above its middle, the face pushed out along n, `depth` thick. */
function tri(out: MeshBuilder, a: [number, number], b: [number, number], y0: number, h: number, n: [number, number], depth: number, c: [number, number, number]): void {
  const m: [number, number] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
  const P = (p: [number, number], y: number, d: number): V3 => [p[0] + n[0] * d, y, p[1] + n[1] * d]
  const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  out.quad([P(a, y0, depth), P(b, y0, depth), P(m, y0 + h, depth), P(m, y0 + h, depth)], [n[0], 0, n[1]], UV, c, SMOOTH)
  const tx = b[0] - a[0], tz = b[1] - a[1], L = Math.hypot(tx, tz) || 1, up = h / (L / 2)
  const k = 1 / Math.hypot(1, up)
  out.quad([P(a, y0, 0), P(a, y0, depth), P(m, y0 + h, depth), P(m, y0 + h, 0)], [n[0] * up * k - (tx / L) * k, k * (up > 0 ? 1 : 0.8), n[1] * up * k - (tz / L) * k], UV, c, SMOOTH)
  out.quad([P(m, y0 + h, 0), P(m, y0 + h, depth), P(b, y0, depth), P(b, y0, 0)], [n[0] * up * k + (tx / L) * k, k * (up > 0 ? 1 : 0.8), n[1] * up * k + (tz / L) * k], UV, c, SMOOTH)
}

/* ---------------------------------------------------------------------------------------------- Temple de l'Amour */

const TEMPLE = {
  marble: '#efece4', domeCol: '#d9d4c8', ceiling: '#e6e0d2', coffer: '#bdb5a3', island: '#6e7358', bank: '#7d7466',
  /** the island: radius, how far it stands over the grade, and the boulders at its edge */
  island_r: 7.6, island_top: 0.15, boulders: 14,
  /** the podium's steps: radius and rise, from the lowest up */
  steps: [{ r: 6.0, h: 0.28 }, { r: 5.65, h: 0.28 }, { r: 5.3, h: 0.28 }],
  /** the columns: how many, the radius of their ring, shaft radius, height with base and capital */
  columns: 12, ring: 4.1, colR: 0.29, colH: 5.3,
  /** the entablature: its radius, the architrave and frieze's depth, the cornice's depth and its extra reach */
  ent: { r: 4.75, h: 0.95, cornice: 0.4, reach: 0.35 },
  /** the dome over it: radius, rise, and the coffers in the ceiling (rings, per ring) */
  dome: { r: 4.3, h: 2.1 }, coffers: { rings: [1.1, 2.1, 3.1], per: [6, 12, 18], size: 0.42 },
  /** the pedestal Cupid stands on: radius and height */
  pedestal: { r: 0.8, h: 1.5 },
}

export function versaillesTempleAmour(out: MeshBuilder, fit: Fit): void {
  const T = TEMPLE, y = fit.grade ?? 0, MARBLE = hex(T.marble)
  // the island: a low mound with boulders round its edge
  prism(out, 0, 0, y - 0.5, y + T.island_top, T.island_r, 20, hex(T.island), ROCKTAG, T.island_r - 0.5)
  for (let i = 0; i < T.boulders; i++) {
    const a = (i / T.boulders) * Math.PI * 2 + hash(i, 1) * 0.3, r = T.island_r - 0.4 + hash(i, 2) * 0.6
    crag(out, Math.cos(a) * r, y - 0.5, Math.sin(a) * r, 1.0 + hash(i, 3) * 0.6, 0.55 + hash(i, 4) * 0.35, 1.0 + hash(i, 5) * 0.6, i * 1.7, shade(hex(T.bank), 0.85 + hash(i, 6) * 0.3))
  }
  // the round podium, step on step
  let top = y + T.island_top
  for (const s of T.steps) { prism(out, 0, 0, top - 0.02, top + s.h, s.r, 28, MARBLE, STONE); top += s.h }
  const floor = top
  prism(out, 0, 0, floor - 0.02, floor + 0.03, T.steps[T.steps.length - 1].r - 0.05, 28, shade(MARBLE, 0.9), STONE)
  // the twelve columns, the first on the axis to the east steps
  const colTop = floor + T.colH
  for (let i = 0; i < T.columns; i++) {
    const a = (i / T.columns) * Math.PI * 2
    column(out, Math.cos(a) * T.ring, Math.sin(a) * T.ring, floor, colTop, T.colR, MARBLE, { order: 'corinthian', tag: SMOOTH })
  }
  // entablature: architrave and frieze, the cornice standing out over them
  const E = T.ent
  prism(out, 0, 0, colTop - 0.05, colTop + E.h, E.r, 24, MARBLE, SMOOTH)
  prism(out, 0, 0, colTop + E.h - 0.05, colTop + E.h + E.cornice, E.r + E.reach, 24, shade(MARBLE, 1.02), SMOOTH, E.r + E.reach * 0.6)
  // the coffered ceiling under the dome: a disc with dark recessed squares in rings, a rose in the middle
  const cy = colTop - 0.02
  prism(out, 0, 0, cy - 0.12, cy, E.r - 0.15, 24, hex(T.ceiling), SMOOTH)
  const C = T.coffers
  C.rings.forEach((r, k) => {
    for (let i = 0; i < C.per[k]; i++) {
      const a = ((i + (k % 2) * 0.5) / C.per[k]) * Math.PI * 2
      boxAlong(out, Math.cos(a) * r, cy - 0.14, Math.sin(a) * r, C.size / 2, 0.02, C.size / 2, -a, hex(T.coffer))
    }
  })
  prism(out, 0, 0, cy - 0.2, cy - 0.1, 0.35, 10, shade(MARBLE, 0.95), SMOOTH)
  // the dome: low, stone
  dome(out, 0, 0, colTop + E.h + E.cornice - 0.05, T.dome.r, T.dome.h, hex(T.domeCol), 24)
  prism(out, 0, 0, colTop + E.h + E.cornice + T.dome.h - 0.1, colTop + E.h + E.cornice + T.dome.h + 0.45, 0.35, 8, MARBLE, SMOOTH, 0.2)
  // the pedestal (the Cupid is not here)
  prism(out, 0, 0, floor - 0.02, floor + 0.2, T.pedestal.r + 0.25, 12, MARBLE, STONE)
  prism(out, 0, 0, floor + 0.15, floor + T.pedestal.h, T.pedestal.r, 12, MARBLE, STONE, T.pedestal.r - 0.1)
  prism(out, 0, 0, floor + T.pedestal.h - 0.05, floor + T.pedestal.h + 0.12, T.pedestal.r + 0.15, 12, MARBLE, STONE)
}

/* ---------------------------------------------------------------------------------------------------- Belvédère */

const BELVEDERE = {
  stone: '#e6dfcd', plinth: '#d8d0bb', doorCol: '#4a3d2e', glass: '#2d3338', lead: '#6a7074', trim: '#f0ead8',
  /** across the flats, the steps (circumradius and rise, lowest first), the body's height, the entablature, the balustrade */
  flats: 8.0, steps: [{ r: 6.2, h: 0.32 }, { r: 5.45, h: 0.32 }], body: 5.0, ent: 0.65, balustrade: 0.95,
  /** doors (the four faces on the axes) and the windows (the diagonals): width, height, sill height over the platform */
  door: { w: 1.5, h: 3.1 }, win: { w: 1.1, h: 2.3, sill: 1.15 },
  /** the pediment over each door: rise, and the overdoor panel's height over each window */
  pediment: 0.75, overdoor: 0.7,
  /** the dome: radius as a share of the parapet's, rise */
  dome: { share: 0.78, h: 1.5 },
  /** the sphinx plinths: along the platform's diagonals at this circumradius, size (along, across, height) */
  sphinx: { r: 5.35, size: [1.5, 0.7, 0.85] as [number, number, number] },
  baluster: { n: 5, w: 0.1 },
}

export function versaillesBelvedere(out: MeshBuilder, fit: Fit): void {
  const B = BELVEDERE, y = fit.grade ?? 0, STON = hex(B.stone), TRIM = hex(B.trim)
  const R = B.flats / 2 / Math.cos(Math.PI / 8), PH = Math.PI / 8
  // the stepped platform, octagonal, flats to the axes
  let top = y
  prism(out, 0, 0, y - 0.5, y, B.steps[0].r, 8, hex(B.plinth), STONE, B.steps[0].r, false, PH)
  for (const s of B.steps) { prism(out, 0, 0, top - 0.02, top + s.h, s.r, 8, hex(B.plinth), STONE, s.r, true, PH); top += s.h }
  const floor = top, wallTop = floor + B.body
  // the body, ashlar
  prism(out, 0, 0, floor - 0.02, wallTop, R, 8, STON, STONE, R, true, PH)
  // faces: face k looks along bearing k·45° from +z; its centre, outward normal and tangent
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2, nx = Math.sin(a), nz = Math.cos(a), tx = nz, tz = -nx
    const ap = B.flats / 2, cx = nx * ap, cz = nz * ap, hd = Math.atan2(-tz, tx)
    const door = k % 2 === 0, o = door ? B.door : B.win
    const base = door ? floor : floor + B.win.sill
    // the opening: a dark panel in a pale frame
    boxAlong(out, cx + nx * 0.03, base + o.h / 2, cz + nz * 0.03, o.w / 2 + 0.17, o.h / 2 + 0.12, 0.04, hd, TRIM, SMOOTH)
    boxAlong(out, cx + nx * 0.09, base + o.h / 2, cz + nz * 0.09, o.w / 2, o.h / 2, 0.03, hd, hex(door ? B.doorCol : B.glass))
    if (door) {
      // a step to the door, a cornice and the pediment over it
      boxAlong(out, cx + nx * 0.35, floor + 0.08, cz + nz * 0.35, o.w / 2 + 0.5, 0.08, 0.35, hd, hex(B.plinth), STONE)
      boxAlong(out, cx + nx * 0.12, base + o.h + 0.2, cz + nz * 0.12, o.w / 2 + 0.45, 0.1, 0.12, hd, TRIM, SMOOTH)
      const w = o.w / 2 + 0.45
      tri(out, [cx - tx * w, cz - tz * w], [cx + tx * w, cz + tz * w], base + o.h + 0.3, B.pediment, [nx, nz], 0.22, TRIM)
      // the carved tympanum: a small boss
      boxAlong(out, cx + nx * 0.28, base + o.h + 0.55, cz + nz * 0.28, 0.2, 0.15, 0.04, hd, shade(TRIM, 0.9), SMOOTH)
    } else {
      // sill, and a carved overdoor panel with a cornice on the window
      boxAlong(out, cx + nx * 0.12, base - 0.06, cz + nz * 0.12, o.w / 2 + 0.25, 0.06, 0.12, hd, TRIM, SMOOTH)
      boxAlong(out, cx + nx * 0.1, base + o.h + 0.12, cz + nz * 0.1, o.w / 2 + 0.3, 0.1, 0.1, hd, TRIM, SMOOTH)
      boxAlong(out, cx + nx * 0.07, base + o.h + 0.2 + B.overdoor / 2, cz + nz * 0.07, o.w / 2 + 0.05, B.overdoor / 2, 0.04, hd, shade(TRIM, 0.96), SMOOTH)
      boxAlong(out, cx + nx * 0.12, base + o.h + 0.2 + B.overdoor / 2, cz + nz * 0.12, o.w * 0.28, B.overdoor * 0.28, 0.03, hd, shade(TRIM, 0.82), SMOOTH)
    }
  }
  // the entablature and its cornice over the walls, the parapet's plinth
  prism(out, 0, 0, wallTop - 0.04, wallTop + B.ent, R + 0.1, 8, TRIM, SMOOTH, R + 0.1, true, PH)
  prism(out, 0, 0, wallTop + B.ent - 0.05, wallTop + B.ent + 0.14, R + 0.45, 8, TRIM, SMOOTH, R + 0.3, true, PH)
  const pTop = wallTop + B.ent + 0.14
  // the balustrade: a post at each corner, balusters along each face, a rail over them
  const pr = R + 0.15
  for (let k = 0; k < 8; k++) {
    const a0 = ((k - 0.5) / 8) * Math.PI * 2, a1 = ((k + 0.5) / 8) * Math.PI * 2
    const p0 = [Math.sin(a0) * pr, Math.cos(a0) * pr], p1 = [Math.sin(a1) * pr, Math.cos(a1) * pr]
    const L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), hd = Math.atan2(-(p1[1] - p0[1]), p1[0] - p0[0])
    const mx = (p0[0] + p1[0]) / 2, mz = (p0[1] + p1[1]) / 2
    boxAlong(out, mx, pTop + 0.07, mz, L / 2, 0.07, 0.15, hd, TRIM, SMOOTH)
    boxAlong(out, mx, pTop + B.balustrade - 0.05, mz, L / 2, 0.06, 0.14, hd, TRIM, SMOOTH)
    for (let i = 1; i <= B.baluster.n; i++) {
      const t = i / (B.baluster.n + 1)
      boxAlong(out, p0[0] + (p1[0] - p0[0]) * t, pTop + B.balustrade / 2, p0[1] + (p1[1] - p0[1]) * t, B.baluster.w / 2, B.balustrade / 2 - 0.1, B.baluster.w / 2, hd, TRIM, SMOOTH)
    }
    boxAlong(out, p0[0], pTop + B.balustrade / 2, p0[1], 0.17, B.balustrade / 2, 0.17, hd, TRIM, SMOOTH)
  }
  // the low lead dome inside, with a small finial
  dome(out, 0, 0, pTop + 0.1, R * B.dome.share, B.dome.h, hex(B.lead), 16)
  prism(out, 0, 0, pTop + B.dome.h, pTop + B.dome.h + 0.5, 0.22, 8, TRIM, SMOOTH, 0.08)
  // the sphinx plinths on the platform's diagonals
  for (let k = 1; k < 8; k += 2) {
    const a = (k / 8) * Math.PI * 2, nx = Math.sin(a), nz = Math.cos(a), S = B.sphinx
    boxAlong(out, nx * S.r, floor - B.steps[1].h + S.size[2] / 2 + 0.02, nz * S.r, S.size[0] / 2, S.size[2] / 2, S.size[1] / 2, Math.atan2(nx, nz) + Math.PI / 2, hex(B.plinth), STONE)
  }
}

/* ------------------------------------------------------------------------------------------------ the Grotte */

/** the rock: its half-length (along z), front (east) and back, the peak and the wings, the crag courses */
const ROCHER = {
  half: 9.8, front: 3.6, back: -6.5, peak: 7.5, wing: 2.4, course: 1.6, step: 2.2, lean: 2.4,
  crag: [1.7, 1.5, 1.5] as [number, number, number], vary: 0.8,
  rock: '#7d7466', moss: '#68704f', dark: '#17140f',
  /** the cave: z, width, height, depth and how far behind the face it starts */
  mouth: { z: 0, w: 3.4, h: 2.9, depth: 3.8 }, recess: 1.2,
  /** the stream: steps down from the cave's lip (x past the face, lip height over grade, width), the falls on the rock above */
  steps: [{ dx: 0.2, y: 0.85, w: 1.2 }, { dx: 1.9, y: 0.3, w: 1.6 }],
  trickle: [{ z: 4.8, y: 4.4, w: 0.5 }, { z: -4.4, y: 3.6, w: 0.4 }],
}

export function versaillesGrotteTrianon(out: MeshBuilder, fit: Fit): void {
  const G = ROCHER, y = fit.grade ?? 0, ROCK = hex(G.rock), MOSS = hex(G.moss), DARK = hex(G.dark)
  const H = (z: number): number => G.wing + (G.peak - G.wing) * Math.max(0, 1 - Math.pow(Math.abs(z) / G.half, 1.5))
  const M = G.mouth
  const inMouth = (z: number): boolean => Math.abs(z - M.z) < M.w / 2
  /** the face's x at a height: the rock leans back as it climbs */
  const faceX = (yy: number): number => G.front - G.recess * 0.4 - (yy / G.peak) * G.lean
  // the body: a slice to every step along it, solid to its height; over the cave only its lintel
  const n = Math.round((2 * G.half) / G.step)
  for (let i = 0; i < n; i++) {
    const z0 = -G.half + i * G.step, z1 = z0 + G.step, zm = (z0 + z1) / 2, top = H(zm) - 0.5
    const hole = inMouth(zm)
    const from = hole ? M.h : -0.5
    if (top > from) block(out, faceX(from) - 0.6 - 0, G.back, z0, z1, y + from, y + top, shade(ROCK, 0.62), ROCKTAG)
    if (hole) {
      block(out, G.front - G.recess - M.depth, G.back, z0, z1, y - 0.5, y + M.h, shade(ROCK, 0.5), ROCKTAG)
      block(out, G.front - G.recess - M.depth, G.front - G.recess, z0, z1, y - 0.2, y + 0.45, shade(ROCK, 1.05), ROCKTAG)
    }
  }
  // the cave's dark: a back and the walls either side, so the opening has depth
  block(out, G.front - G.recess - M.depth - 0.3, G.front - G.recess - M.depth, M.z - M.w / 2, M.z + M.w / 2, y, y + M.h, DARK)
  for (const s of [-1, 1]) block(out, G.front - G.recess - M.depth, G.front - G.recess + 0.4, M.z + s * M.w / 2 - 0.3, M.z + s * M.w / 2 + 0.3, y, y + M.h, shade(DARK, 1.7), ROCKTAG)
  block(out, G.front - G.recess - M.depth, G.front - G.recess + 0.4, M.z - M.w / 2, M.z + M.w / 2, y + M.h - 0.4, y + M.h, shade(DARK, 1.3))
  // crags draped on the face course over course; the cave's jambs and lintel are crags
  let seed = 0
  for (let c = 0; c * G.course <= G.peak; c++) {
    const yy = c * G.course
    for (let z = -G.half - 0.5; z <= G.half + 0.5; z += G.step * 0.8) {
      const zz = z + (c % 2) * G.step * 0.4 + (hash(c, z) - 0.5) * 0.7
      if (yy > H(zz) + 0.4) continue
      if (inMouth(zz) && yy < M.h - 0.8 && Math.abs(zz - M.z) < M.w / 2 - 0.5) continue
      const col = yy / G.peak > 0.45 && hash(c + 3, z) > 0.45 ? MOSS : ROCK
      const ry = G.crag[1] + hash(c, zz) * G.vary * 0.7
      crag(out, faceX(yy) - 0.2 + hash(z, c) * 0.5, y + (c === 0 ? -0.3 : yy - ry * 0.45), zz, G.crag[0] + hash(zz, c) * G.vary, ry, G.crag[2] + hash(zz + 1, c) * G.vary * 0.6, seed++ * 1.37,
        shade(col, 0.86 + hash(seed, 2) * 0.26))
    }
  }
  // the summit and the back, rounded off with a few big crags so it reads as a hill from every side
  for (let i = 0; i < 7; i++) {
    const zz = (hash(i, 5) - 0.5) * G.half * 1.2, d = G.back + 2 + hash(i, 6) * 4
    crag(out, d, y + H(zz) * 0.55, zz, 2.6 + hash(i, 7) * 1.4, 2.4 + hash(i, 8), 2.6 + hash(i, 9) * 1.2, seed++ * 1.37, shade(hash(i, 3) > 0.6 ? MOSS : ROCK, 0.9 + hash(i, 4) * 0.2))
  }
  // boulders at the foot, in front of the face and at the ends
  for (let i = 0; i < 8; i++) {
    const z = -G.half + 1 + (i / 7) * (2 * G.half - 2) + (hash(i, 9) - 0.5) * 1.5
    if (inMouth(z) || Math.abs(z) < M.w / 2 + 1.4) continue
    crag(out, G.front + (hash(9, i) - 0.3) * 1.2, y - 0.45, z, 1.1 + hash(i, 3), 0.9, 1.1, seed++ * 1.37, shade(ROCK, 0.85))
  }
  // the stream: out of the cave and down two steps of rock; a trickle or two down the face
  const lipX = G.front - G.recess + 0.4
  for (const s of G.steps) {
    const x = lipX + s.dx
    block(out, x - 0.5, x + 0.1, M.z - s.w / 2 - 0.3, M.z + s.w / 2 + 0.3, y - 0.3, y + s.y - 0.05, shade(ROCK, 0.9), ROCKTAG)
    out.water.push({ kind: 'sheet', a: [x + 0.12, y + s.y, M.z - s.w / 2], b: [x + 0.12, y + s.y, M.z + s.w / 2], out: 0.3, drop: s.y + 0.1 })
    out.water.push({ kind: 'splash', at: [x + 0.5, y, M.z], r: 0.4 + s.w * 0.3 })
  }
  for (const f of G.trickle) {
    out.water.push({ kind: 'sheet', a: [faceX(f.y) + 0.4, y + f.y, f.z - f.w / 2], b: [faceX(f.y) + 0.4, y + f.y, f.z + f.w / 2], out: 0.25, drop: f.y - 0.1 })
    out.water.push({ kind: 'splash', at: [faceX(0) + 0.6, y - 0.1, f.z], r: 0.4 })
  }
}

export const VERSAILLES_TRIANON_FOLLIES = { versaillesTempleAmour, versaillesBelvedere, versaillesGrotteTrianon }
