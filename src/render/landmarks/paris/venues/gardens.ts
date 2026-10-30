/**
 * The great gardens' own structures — the basins, the terraces, the bandstand, the café kiosks:
 *
 * - the LUXEMBOURG's GRAND BASSIN, the elongated octagon in the parterre south of the palace (OSM way/4294027, 48 × 57 m,
 *   "Enfants supportant une vasque" at its centre), its jet, the children's toy sailboats; and round the sunken parterre
 *   the BALUSTRADED TERRACE WALLS (OSM's barrier=wall ways 194193439–442 and 454094953–955, gapped where the stairs come
 *   down) with the Queens of France on their pedestals along the top. The parterre really lies some two metres below
 *   the terraces (the stairs have 10–15 steps); the city's terrain is the DEM's and cannot be dug, so the walls stand on
 *   the ground and read as the terrace's edge;
 * - the Luxembourg's KIOSQUE À MUSIQUE (way/62848443, 12.5 m across): a round bandstand, slender iron columns on a
 *   stone base under a concave zinc roof and lantern;
 * - the TUILERIES' GRAND BASSIN ROND (way/14037695, 40 m) and GRAND BASSIN OCTOGONAL (way/54188993, 68 m) on the
 *   garden's axis, their stone copings, their jets, and the green metal chairs round them;
 * - the Tuileries' CAFÉ KIOSKS under the chestnuts (Commons: "La Terrasse de Pomone brasserie.jpg"): small square
 *   pavilions of green-painted timber and glass under hipped zinc roofs, terraces of tables round them under
 *   terracotta parasols;
 * - the PARC MONCEAU's NAUMACHIE: the oval basin at the north-east end of the park's stream (the oval head of OSM's
 *   water way/55761392, ~50 × 34 m, long axis bearing 71), half ringed on the far side from the stream by the fluted
 *   Corinthian columns brought from the unfinished Valois rotunda at Saint-Denis, an entablature on some, bare
 *   capitals on others (Commons: "Naumachie, parc Monceau … PH82662.jpg", "Colonnade dans le parc Monceau, la Naumachie
 *   - A39089S.jpg"). The colonnade is not mapped: its arc is from the photographs.
 *
 * The city draws a basin's water 2.5 m down (region riverDrop) in a walled pit; each basin here lays its own water
 * surface just under its coping (render/water.ts `pool`), so it reads as the brim-full basin it is.
 *
 * Local frames: front −z (the manifest's `front` turns it), y up from the model's base.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { box, prism, strut, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { classicalColumn, dome, roof } from '../../kit.ts'
import { quadN, type V3 } from './bowl.ts'

const STONE: Rgb = [0.84, 0.8, 0.7]
const STONE_DK: Rgb = [0.7, 0.66, 0.57]
const CHAIR: Rgb = [0.24, 0.42, 0.3]
const WATER: [number, number, number] = [0.3, 0.4, 0.42]
type P2 = { x: number; z: number }

/** a stone coping round a ring: a kerb `w` wide, `h` above the ground, its inner face dropping to the water */
function coping(out: MeshBuilder, ring: P2[], g: (x: number, z: number) => number, w: number, h: number): void {
  const ash = surfaceTag('ashlar')
  const n = ring.length
  // the ring's centre, to tell in from out
  const cx = ring.reduce((s, p) => s + p.x, 0) / n
  const cz = ring.reduce((s, p) => s + p.z, 0) / n
  for (let i = 0; i < n; i++) {
    const a = ring[i], b = ring[(i + 1) % n]
    const out_ = (p: P2, d: number): P2 => {
      const dx = p.x - cx, dz = p.z - cz
      const l = Math.hypot(dx, dz) || 1
      return { x: p.x + (dx / l) * d, z: p.z + (dz / l) * d }
    }
    const ao = out_(a, w), bo = out_(b, w)
    const ya = g(a.x, a.z) + h, yb = g(b.x, b.z) + h
    const mx = (a.x + b.x) / 2 - cx, mz = (a.z + b.z) / 2 - cz
    const ml = Math.hypot(mx, mz) || 1
    // top, outer face, inner face
    quadN(out, [[a.x, ya, a.z], [b.x, yb, b.z], [bo.x, yb, bo.z], [ao.x, ya, ao.z]], [0, 1, 0], STONE, ash)
    quadN(out, [[ao.x, ya, ao.z], [bo.x, yb, bo.z], [bo.x, yb - h - 0.6, bo.z], [ao.x, ya - h - 0.6, ao.z]], [mx / ml, 0, mz / ml], STONE_DK, ash)
    quadN(out, [[a.x, ya, a.z], [b.x, yb, b.z], [b.x, yb - h - 0.9, b.z], [a.x, ya - h - 0.9, a.z]], [-mx / ml, 0, -mz / ml], STONE_DK, ash)
  }
}

/** a ring of the Tuileries' green chairs facing a basin, `r` out from its centre */
function chairs(out: MeshBuilder, cx: number, cz: number, r: number, n: number, g: (x: number, z: number) => number, seed: number): void {
  const met = surfaceTag('metal')
  for (let i = 0; i < n; i++) {
    const jit = Math.sin(i * 12.9898 + seed) * 43758.5453
    const f = jit - Math.floor(jit)
    if (f < 0.3) continue
    const a = (i / n) * Math.PI * 2 + f * 0.05
    const rr = r + f * 1.5
    const x = cx + Math.sin(a) * rr, z = cz + Math.cos(a) * rr
    const y = g(x, z)
    // seat, back (away from the basin), legs as a block
    box(out, x, y + 0.45, z, 0.24, 0.03, 0.24, CHAIR, met)
    box(out, x + Math.sin(a) * 0.22, y + 0.75, z + Math.cos(a) * 0.22, Math.abs(Math.cos(a)) * 0.22 + 0.03, 0.28, Math.abs(Math.sin(a)) * 0.22 + 0.03, CHAIR, met)
    for (const k of [-1, 1]) box(out, x + Math.cos(a) * 0.2 * k, y + 0.22, z - Math.sin(a) * 0.2 * k, 0.03 + Math.abs(Math.sin(a)) * 0.2, 0.22, 0.03 + Math.abs(Math.cos(a)) * 0.2, [0.18, 0.3, 0.22], met)
  }
}

/** a regular polygon's ring, vertex k at angle phase + k·2π/n (polar, from +x towards +z), radius `r` */
const poly = (n: number, r: number, phase: number, sx = 1, sz = 1): P2[] =>
  Array.from({ length: n }, (_, k) => ({ x: Math.cos(phase + (k * 2 * Math.PI) / n) * r * sx, z: Math.sin(phase + (k * 2 * Math.PI) / n) * r * sz }))

/** a vertical jet of `h` metres from a nozzle at (x, y, z) */
function jet(out: MeshBuilder, x: number, y: number, z: number, h: number, width = 0.3): void {
  out.water.push({ kind: 'jet', at: [x, y, z], v: [0, Math.sqrt(2 * 9.81 * h), 0], width, spread: 0.6 })
  out.water.push({ kind: 'splash', at: [x, y - 0.1, z], r: Math.max(1.2, h * 0.35) })
}

/* ------------------------------------------------------------------------------------- the Luxembourg's parterre */

// the terrace walls, in the entry's frame (centre the basin's, front 182: +x east, +z north to the palace)
const LUX_WALLS: number[][] = [
  [-45.5, -73.6, -45.7, -98.3, -40.1, -98.2, -39.9, -105.2, -39.6, -108.7, -38.8, -112, -38, -115.2, -36.8, -118.3, -35.1, -121.6, -33.3, -124.5, -31.4, -127.2, -29.1, -129.9, -26, -132.5],
  [44, -73.6, 43.9, -97.8, 38.6, -97.8, 38.6, -100.4, 38.4, -102.8, 38.2, -105.6, 37.7, -109.5, 37.1, -112, 36, -115.8, 34.4, -119.5, 32.4, -123.2, 29.5, -126.9, 27, -130.1, 23.6, -132.9],
  [44.1, -65.1, 44.3, -45.5, 50.1, -45.2, 55.4, -44.4, 59.3, -43.2, 63.6, -41.7, 68, -39.4, 71.8, -37, 75.7, -34, 79.3, -30.1, 82, -26.5, 84.8, -22.5, 87, -18.1, 88.4, -14.6, 89.3, -11.3, 89.8, -8.3, 90.3, -3.9],
  [90.4, 5.3, 89.7, 10.4, 88.6, 14.9, 87, 19.5, 84.8, 23.7, 82.2, 27.6, 79.7, 30.8, 76, 34.7, 72.8, 37.2, 68.8, 40, 64.8, 42.4, 60.4, 44.3, 55.9, 45.8, 50.9, 46.4, 51.4, 80.9, 56.4, 81.6, 61, 82.9, 65.4, 84.9, 70, 87.4, 73.7, 90.3, 77.9, 94.5, 81.9, 99.1, 84.9, 102.6],
  [-45, -64.9, -45.2, -55.5, -45.2, -45.8, -50.3, -45.6, -55, -44.7, -59.6, -43.3, -64.2, -41.5, -68.3, -39.3, -72.5, -36.5, -76, -33.5, -79.3, -30.1, -82.3, -26.3, -84.8, -22.3, -87, -18.1, -88.6, -13.5, -89.8, -8.9, -90.4, -4.1],
  [-90.4, 5.5, -89.4, 11.7, -87.6, 16.7, -85.2, 22.1, -82.4, 26.9, -78.4, 31.8, -74, 35.8, -69.6, 39.3, -64.6, 42, -59.1, 44.4, -54.9, 45.6, -49.2, 46.8, -48.7, 80.7, -55.9, 82.4, -60.8, 84.2, -65.9, 87, -69.7, 89.5, -71.5, 90.9],
  [-88, 115.9, -87.2, 112.5, -85.6, 108.5, -83.5, 104.4, -81.4, 101.1, -78.1, 97.2],
]

export function luxembourgBassin(out: MeshBuilder, fit: Fit): void {
  const ash = surfaceTag('ashlar')
  const G = (x: number, z: number): number => fit.groundAt?.(x, z) ?? 0.5
  // the octagon (OSM's way, its long sides north–south), its coping and water
  const oct: P2[] = [{ x: 24.2, z: 14.5 }, { x: 10.4, z: 28.4 }, { x: -9.3, z: 28.4 }, { x: -23.8, z: 14.4 }, { x: -23.7, z: -14.2 }, { x: -9.6, z: -28.3 }, { x: 10.1, z: -28.3 }, { x: 24.3, z: -14 }]
  const g0 = Math.min(...oct.map((p) => G(p.x, p.z)))
  coping(out, oct, () => g0, 0.7, 0.45)
  out.water.push({ kind: 'pool', ring: oct, y: g0 + 0.15, colour: WATER })
  // the centre: a round stone basin on its plinth, the children and the vasque, the jet from it
  prism(out, 0, 0, g0 - 0.5, g0 + 0.6, 3.2, 20, STONE, ash)
  prism(out, 0, 0, g0 + 0.6, g0 + 2.4, 0.9, 12, STONE, ash)
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2
    prism(out, Math.sin(a) * 0.9, Math.cos(a) * 0.9, g0 + 0.6, g0 + 2.6, 0.32, 8, [0.42, 0.44, 0.38], surfaceTag('copper'))
  }
  prism(out, 0, 0, g0 + 2.6, g0 + 3.0, 0.5, 16, STONE, ash, 1.7)
  prism(out, 0, 0, g0 + 3.0, g0 + 3.2, 1.7, 16, STONE, ash)
  jet(out, 0, g0 + 3.25, 0, 5.5, 0.35)
  out.water.push({ kind: 'sheet', a: [-1.6, g0 + 3.2, 0], b: [1.6, g0 + 3.2, 0], out: 0.4, drop: 2.6 })
  // the toy sailboats
  const boats: [number, number, Rgb][] = [[-8, 6, [0.85, 0.2, 0.15]], [6, -12, [0.95, 0.95, 0.9]], [12, 9, [0.2, 0.4, 0.75]], [-14, -9, [0.95, 0.75, 0.2]], [2, 18, [0.2, 0.6, 0.35]], [-4, -20, [0.85, 0.2, 0.15]]]
  for (const [x, z, c] of boats) {
    box(out, x, g0 + 0.25, z, 0.4, 0.1, 0.13, [0.5, 0.32, 0.18], surfaceTag('planks'))
    box(out, x - 0.05, g0 + 0.85, z, 0.25, 0.5, 0.015, c, 0)
    box(out, x - 0.05, g0 + 0.85, z, 0.02, 0.55, 0.02, [0.4, 0.3, 0.2], 0)
  }
  chairs(out, 0, 0, 30.5, 90, G, 7)

  // the terrace walls: a stone wall, its balustrade, the coping; a queen on a pedestal every ~16 m on the long runs
  for (const flat of LUX_WALLS) {
    const pts: P2[] = []
    for (let i = 0; i < flat.length; i += 2) pts.push({ x: flat[i], z: flat[i + 1] })
    let run = 0
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i], b = pts[i + 1]
      const L = Math.hypot(b.x - a.x, b.z - a.z)
      if (L < 0.05) continue
      const tx = (b.x - a.x) / L, tz = (b.z - a.z) / L
      const ya = G(a.x, a.z), yb = G(b.x, b.z)
      const yBase = Math.min(ya, yb) - 0.5
      const yTop = Math.max(ya, yb) + 1.0
      // (oriented along the run, and a hand past each end so the next run's wall meets it without a notch)
      strut(out, [a.x - tx * 0.3, (yBase + yTop) / 2, a.z - tz * 0.3], [b.x + tx * 0.3, (yBase + yTop) / 2, b.z + tz * 0.3], 0.6, yTop - yBase, STONE_DK, ash)
      // the balusters and the rail over them
      const m = Math.max(1, Math.round(L / 0.6))
      for (let k = 0; k < m; k++) {
        const f = (k + 0.5) / m
        prism(out, a.x + (b.x - a.x) * f, a.z + (b.z - a.z) * f, yTop, yTop + 0.75, 0.12, 4, STONE, ash, 0.08, false)
      }
      strut(out, [a.x, yTop + 0.83, a.z], [b.x, yTop + 0.83, b.z], 0.5, 0.16, STONE, ash)
      run += L
      if (run > 16 && L > 2) {
        run = 0
        // the queen, on the terrace side (outward from the parterre's middle line x = 0)
        const side = Math.sign((a.x + b.x) / 2) || 1
        const qx = (a.x + b.x) / 2 + side * 2.2, qz = (a.z + b.z) / 2
        const qy = G(qx, qz)
        box(out, qx, qy + 0.9, qz, 0.6, 0.9, 0.6, STONE, ash)
        prism(out, qx, qz, qy + 1.8, qy + 3.4, 0.42, 8, [0.92, 0.9, 0.85], ash, 0.3)
        dome(out, qx, qz, qy + 3.4, 0.22, 0.32, [0.92, 0.9, 0.85], 8)
      }
    }
  }
}

/* --------------------------------------------------------------------------------- the Luxembourg's bandstand */

export function luxembourgKiosque(out: MeshBuilder, fit: Fit): void {
  const met = surfaceTag('metal')
  const ash = surfaceTag('ashlar')
  const R = Math.min(Math.max(Math.min(fit.hx, fit.hz), 4.5), 7)
  const g = fit.groundAt?.(0, 0) ?? 0.5
  const IRON: Rgb = [0.2, 0.3, 0.25]
  const ZINC: Rgb = [0.5, 0.54, 0.55]
  // the stone base with its steps, the floor
  prism(out, 0, 0, g - 0.5, g + 1.1, R, 16, STONE, ash)
  prism(out, 0, 0, g + 1.1, g + 1.2, R + 0.1, 16, STONE_DK, ash)
  for (let k = 0; k < 4; k++) box(out, 0, g + (1.1 - 0.28 * k) / 2 - 0.2, -R - 0.15 - 0.35 * k, 1.4, (1.1 - 0.28 * k) / 2 + 0.2, 0.18, STONE, ash)
  // sixteen slender iron columns, a frieze ring, the railing between them
  const y0 = g + 1.2
  const top = y0 + 4
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2
    const x = Math.sin(a) * (R - 0.4), z = Math.cos(a) * (R - 0.4)
    prism(out, x, z, y0, top, 0.09, 6, IRON, met)
    // a bracket into the eaves
    strut(out, [x, top - 0.8, z], [Math.sin(a) * (R + 0.4), top, Math.cos(a) * (R + 0.4)], 0.06, 0.06, IRON, met, false)
  }
  prism(out, 0, 0, y0 + 0.85, y0 + 0.95, R - 0.4, 16, IRON, met, R - 0.4, false)
  prism(out, 0, 0, top - 0.5, top, R - 0.3, 16, [0.85, 0.82, 0.74], 0, R - 0.3, false)
  // the roof: a concave cone of zinc, a small lantern, a finial
  const segs = 4
  for (let k = 0; k < segs; k++) {
    const t0 = k / segs, t1 = (k + 1) / segs
    const r0 = (R + 0.8) * (1 - t0) ** 1.6 + 0.9 * t0, r1 = (R + 0.8) * (1 - t1) ** 1.6 + 0.9 * t1
    prism(out, 0, 0, top + 2.6 * t0, top + 2.6 * t1, r0, 16, ZINC, met, r1, false)
  }
  prism(out, 0, 0, top + 2.6, top + 3.4, 0.9, 8, IRON, met)
  prism(out, 0, 0, top + 3.4, top + 4.2, 1.1, 8, ZINC, met, 0.05)
  prism(out, 0, 0, top - 0.02, top, R - 0.4, 16, [0.88, 0.86, 0.8], 0)
}

/* ------------------------------------------------------------------------------------------ the Tuileries' basins */

export function tuileriesBassinRond(out: MeshBuilder, fit: Fit): void {
  const G = (x: number, z: number): number => fit.groundAt?.(x, z) ?? 0.5
  const ring = poly(48, 19.8, 0)
  const g0 = Math.min(...ring.map((p) => G(p.x, p.z)))
  coping(out, ring, () => g0, 0.6, 0.4)
  out.water.push({ kind: 'pool', ring, y: g0 + 0.12, colour: WATER })
  prism(out, 0, 0, g0 - 0.4, g0 + 0.5, 1.4, 16, STONE, surfaceTag('ashlar'))
  jet(out, 0, g0 + 0.55, 0, 6, 0.35)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    out.water.push({ kind: 'jet', at: [Math.sin(a) * 1.2, g0 + 0.55, Math.cos(a) * 1.2], v: [Math.sin(a) * 1.4, 4.2, Math.cos(a) * 1.4], width: 0.12, spread: 0.4 })
  }
  chairs(out, 0, 0, 21.8, 80, G, 3)
}

export function tuileriesOctogone(out: MeshBuilder, fit: Fit): void {
  const G = (x: number, z: number): number => fit.groundAt?.(x, z) ?? 0.5
  // the octagon's sides square to the garden's axis (local x, bearing 116): vertices at 22.5° + k·45°
  const ring = poly(8, 34.1, Math.PI / 8)
  const g0 = Math.min(...ring.map((p) => G(p.x, p.z)))
  coping(out, ring, () => g0, 0.7, 0.4)
  out.water.push({ kind: 'pool', ring, y: g0 + 0.12, colour: WATER })
  prism(out, 0, 0, g0 - 0.4, g0 + 0.5, 1.8, 16, STONE, surfaceTag('ashlar'))
  jet(out, 0, g0 + 0.55, 0, 7.5, 0.4)
  chairs(out, 0, 0, 33.5, 120, G, 11)
}

/* ------------------------------------------------------------------------------------------ the Tuileries' kiosks */

export function tuileriesKiosk(out: MeshBuilder, fit: Fit): void {
  const met = surfaceTag('metal')
  const hx = Math.min(Math.max(fit.hx, 3.2), 7.5)
  const hz = Math.min(Math.max(fit.hz, 3.2), 7.5)
  const g = fit.groundAt?.(0, 0) ?? 0.5
  const WOOD: Rgb = [0.27, 0.36, 0.3]
  const GL: Rgb = [0.2, 0.24, 0.24]
  const ZINC: Rgb = [0.5, 0.53, 0.55]
  const H = 3.6
  // a low plinth, the glazed timber walls (dado, glass, frieze), the posts at the corners and between bays
  box(out, 0, g + 0.1, 0, hx + 0.2, 0.3, hz + 0.2, [0.6, 0.58, 0.55], surfaceTag('concrete'))
  box(out, 0, g + 0.4 + H / 2, 0, hx, H / 2, hz, GL, surfaceTag('glass'))
  box(out, 0, g + 0.9, 0, hx + 0.03, 0.5, hz + 0.03, WOOD, surfaceTag('planks'))
  box(out, 0, g + 0.4 + H - 0.3, 0, hx + 0.04, 0.3, hz + 0.04, WOOD, surfaceTag('planks'))
  for (const [sx, sz] of [[1, 0], [0, 1]]) {
    const L = sx ? hx : hz
    const n = Math.max(2, Math.round((2 * L) / 1.6))
    for (let i = 0; i <= n; i++) {
      const t = -L + (2 * L * i) / n
      for (const s of [-1, 1]) {
        const x = sx ? t : s * (hx + 0.05)
        const z = sz ? t : s * (hz + 0.05)
        box(out, x, g + 0.4 + H / 2, z, 0.08, H / 2, 0.08, WOOD, surfaceTag('planks'))
      }
    }
  }
  // the hipped zinc roof with its deep eaves, the little lantern
  const eaves = g + 0.4 + H
  roof(out, -hx - 0.9, hx + 0.9, -hz - 0.9, hz + 0.9, eaves, 1.8, Math.min(hx, hz) * 0.7, Math.min(hx, hz) * 0.7, ZINC)
  box(out, 0, eaves + 2.1, 0, 0.6, 0.35, 0.6, WOOD, met)
  prism(out, 0, 0, eaves + 2.45, eaves + 3.0, 0.8, 4, ZINC, met, 0.05)
  // the terrace: tables and chairs under terracotta parasols, round three sides
  const PARA: Rgb = [0.72, 0.3, 0.2]
  let k = 0
  for (const [sx, sz] of [[0, -1], [1, 0], [-1, 0], [0, 1]]) {
    if (k++ === 3 && hx < 5) continue
    for (const t of [-1, 0, 1]) {
      const along = sx === 0 ? hx : hz
      const x = sx !== 0 ? sx * (hx + 4) : t * (along * 0.75 + 1)
      const z = sz !== 0 ? sz * (hz + 4) : t * (along * 0.75 + 1)
      const y = fit.groundAt?.(x, z) ?? g
      prism(out, x, z, y, y + 2.4, 0.05, 6, [0.85, 0.85, 0.85], met)
      prism(out, x, z, y + 2.2, y + 2.75, 1.7, 8, PARA, 0, 0.08)
      prism(out, x, z, y + 2.2, y + 2.21, 1.7, 8, shadeOf(PARA, 0.6), 0, 1.7, false)
      prism(out, x, z, y + 0.72, y + 0.76, 0.45, 10, [0.85, 0.85, 0.82], met)
      prism(out, x, z, y, y + 0.72, 0.05, 6, [0.3, 0.3, 0.3], met)
      for (let c = 0; c < 4; c++) {
        const a = (c / 4) * Math.PI * 2 + 0.4
        const cx = x + Math.sin(a) * 0.85, cz = z + Math.cos(a) * 0.85
        box(out, cx, y + 0.45, cz, 0.2, 0.03, 0.2, CHAIR, met)
        box(out, cx + Math.sin(a) * 0.19, y + 0.72, cz + Math.cos(a) * 0.19, 0.04 + Math.abs(Math.cos(a)) * 0.17, 0.27, 0.04 + Math.abs(Math.sin(a)) * 0.17, CHAIR, met)
        box(out, cx, y + 0.22, cz, 0.03, 0.22, 0.03, [0.2, 0.3, 0.24], met)
      }
    }
  }
}
const shadeOf = (c: Rgb, f: number): Rgb => [c[0] * f, c[1] * f, c[2] * f]

/** one name per kiosk (a builder named by two entries reads as a dead duplicate to the audits) */
export const TUILERIES_KIOSKS = { tuileriesPomone: tuileriesKiosk, tuileriesPlisson: tuileriesKiosk, tuileriesMarronniers: tuileriesKiosk, tuileriesCafeNord: tuileriesKiosk }

/* ------------------------------------------------------------------------------------------- Monceau's Naumachie */

export function naumachie(out: MeshBuilder, fit: Fit): void {
  const ash = surfaceTag('ashlar')
  const G = (x: number, z: number): number => fit.groundAt?.(x, z) ?? 0.5
  const A = 25, B = 17
  // the oval coping, open where the stream comes in (local direction θ ≈ 206°, south-west)
  const inlet = (206 * Math.PI) / 180
  const N = 56
  const ring: P2[] = []
  for (let i = 0; i < N; i++) {
    const t = (i / N) * Math.PI * 2
    ring.push({ x: Math.cos(t) * A, z: Math.sin(t) * B })
  }
  const g0 = Math.min(...ring.map((p) => G(p.x, p.z)))
  for (let i = 0; i < N; i++) {
    const t = ((i + 0.5) / N) * Math.PI * 2
    let d = Math.abs(t - inlet)
    d = Math.min(d, Math.PI * 2 - d)
    if (d < 0.22) continue
    const a = ring[i], b = ring[(i + 1) % N]
    const o = (p: P2): P2 => ({ x: p.x * (1 + 0.6 / A), z: p.z * (1 + 0.6 / B) })
    const ao = o(a), bo = o(b)
    quadN(out, [[a.x, g0 + 0.35, a.z], [b.x, g0 + 0.35, b.z], [bo.x, g0 + 0.35, bo.z], [ao.x, g0 + 0.35, ao.z]], [0, 1, 0], STONE_DK, ash)
    quadN(out, [[ao.x, g0 + 0.35, ao.z], [bo.x, g0 + 0.35, bo.z], [bo.x, g0 - 0.5, bo.z], [ao.x, g0 - 0.5, ao.z]], [ao.x + bo.x, 0, ao.z + bo.z], STONE_DK, ash)
    quadN(out, [[a.x, g0 + 0.35, a.z], [b.x, g0 + 0.35, b.z], [b.x, g0 - 0.8, b.z], [a.x, g0 - 0.8, a.z]], [-(a.x + b.x), 0, -(a.z + b.z)], STONE_DK, ash)
  }
  // the colonnade: fluted Corinthian columns on the far side from the stream, round the oval 2 m back from the brim
  const mid = inlet - Math.PI
  const span = (105 * Math.PI) / 180
  const n = 24
  const COL: Rgb = [0.78, 0.76, 0.7]
  const colAt: { x: number; z: number; y: number }[] = []
  for (let i = 0; i < n; i++) {
    const t = mid - span + (2 * span * i) / (n - 1)
    const x = Math.cos(t) * (A + 2.4), z = Math.sin(t) * (B + 2.4)
    const y = G(x, z)
    colAt.push({ x, z, y })
    // a broken one or two, the ruin's point
    const broken = i === 5 || i === 17
    box(out, x, y + 0.35, z, 0.75, 0.55, 0.75, STONE_DK, ash)
    classicalColumn(out, x, z, y + 0.9, y + (broken ? 4.2 : 9.6), 0.5, COL, { order: broken ? 'tuscan' : 'corinthian', flutes: true, tag: ash })
  }
  // the entablature, on three runs of columns only
  for (const [i0, i1] of [[1, 4], [9, 13], [19, 22]]) {
    for (let i = i0; i < i1; i++) {
      const p = colAt[i], q = colAt[i + 1]
      const y = Math.max(p.y, q.y) + 9.6
      strut(out, [p.x, y + 0.45, p.z], [q.x, y + 0.45, q.z], 1.3, 0.9, COL, ash)
      strut(out, [p.x, y + 1.05, p.z], [q.x, y + 1.05, q.z], 1.55, 0.3, STONE_DK, ash)
    }
  }
  // a path ring behind the colonnade
  for (let i = 0; i + 1 < colAt.length; i++) {
    const p = colAt[i], q = colAt[i + 1]
    const s = 1 + 2.2 / A
    quadN(out, [[p.x, p.y + 0.06, p.z], [q.x, q.y + 0.06, q.z], [q.x * s, q.y + 0.06, q.z * (1 + 2.2 / B)], [p.x * s, p.y + 0.06, p.z * (1 + 2.2 / B)]], [0, 1, 0], [0.74, 0.69, 0.6], surfaceTag('concrete'))
  }
  void ([] as V3[])
}
