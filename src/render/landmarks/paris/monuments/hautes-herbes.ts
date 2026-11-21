import type { MeshBuilder } from '../../../buildings.ts'
import type { Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { hex } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { fitted } from '../palaces/common.ts'
import { G } from './plaza-common.ts'

/*
 * HAUTES HERBES — Béatrice Guichard, 2003 (OSM node 8458628895, Wikidata Q3128616), on the gravel of the Place du Louvre between
 * the Colonnade and Saint-Germain-l'Auxerrois. Eight steel blades of grass rising from the sand, each a flat ribbon tapering to a
 * point and curving over at the top, some with a gilt strip along one edge. Read from a Commons photograph ("Hautes Herbes.jpg",
 * Aquilae): the tallest is about two and a half times the passers-by, the cluster about two metres across. The heights, bends
 * and turns below are by eye, not measured — tune them here.
 */

const STEEL: Rgb = hex('#a7acb2')
const STEEL_DARK: Rgb = hex('#8a8f95')
const GILT: Rgb = hex('#c9a24a')
const SAND: Rgb = hex('#8c8068')

/** Ribbon width at the foot (m), its thickness, the share of the width that is gilt, and the segments up each blade. */
const W0 = 0.17
const THICK = 0.025
const GILT_SHARE = 0.22
const SEGS = 14
/**
 * The sand patch: radius (m), its rise above the pavement, and the points round its edge. Off: the city already draws the
 * square's sand under the work (an OSM area), and a second disc only hid beneath it. On for the model showcase, if wanted.
 */
const DRAW_SAND = false
const SAND_R = 3.4
const SAND_RISE = 0.03
const SAND_N = 24

/**
 * Each blade: foot at (x, z), height h, the top swept `bend` metres toward bearing `toward` (deg, 0 = +z, 90 = +x), the flat
 * of the ribbon turned to `face` (deg), and whether it carries the gilt strip.
 */
interface Blade { x: number; z: number; h: number; toward: number; bend: number; face: number; gilt: boolean }
const BLADES: Blade[] = [
  { x: -0.95, z: 0.10, h: 4.0, toward: 75, bend: 0.75, face: 20, gilt: true },
  { x: -0.70, z: -0.35, h: 3.3, toward: 60, bend: 0.40, face: 80, gilt: false },
  { x: -0.25, z: 0.45, h: 3.9, toward: 25, bend: 0.30, face: 120, gilt: false },
  { x: -0.05, z: -0.15, h: 4.7, toward: 40, bend: 0.85, face: 60, gilt: true },
  { x: 0.20, z: 0.30, h: 4.1, toward: 330, bend: 0.20, face: 10, gilt: true },
  { x: 0.40, z: -0.40, h: 4.9, toward: 80, bend: 0.65, face: 150, gilt: false },
  { x: 0.75, z: 0.05, h: 4.3, toward: 115, bend: 1.05, face: 40, gilt: false },
  { x: 1.05, z: -0.25, h: 3.0, toward: 200, bend: 0.30, face: 100, gilt: true },
]

export function hautesHerbes(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, SAND_R, SAND_R, (q) => draw(q))
}

type V3 = [number, number, number]
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const add = (a: V3, b: V3, s = 1): V3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s]
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const norm = (a: V3): V3 => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l] }

function draw(q: MeshBuilder): void {
  if (DRAW_SAND) drawSand(q)
  const metal = surfaceTag('metal')
  for (const b of BLADES) blade(q, b, metal)
}

function drawSand(q: MeshBuilder): void {
  // the sand, a low irregular disc: a fan of quads (each a triangle with its last corner doubled)
  const sandTag = surfaceTag('rock')
  const rim = (i: number): V3 => {
    const a = (i / SAND_N) * Math.PI * 2
    const r = SAND_R * (0.9 + 0.1 * Math.sin(a * 3 + 0.7) * Math.cos(a * 2))
    return [Math.sin(a) * r, G + SAND_RISE, Math.cos(a) * r]
  }
  for (let i = 0; i < SAND_N; i++) {
    const c: V3 = [0, G + SAND_RISE, 0]
    q.quad([c, rim(i + 1), rim(i), rim(i)], [0, 1, 0], UV, SAND, sandTag)
  }
}

/** One ribbon: its centreline rises and sweeps over (the sweep grows with the square of the height), the width tapering to a point. */
function blade(q: MeshBuilder, b: Blade, tag: number): void {
  const ta = (b.toward * Math.PI) / 180, fa = (b.face * Math.PI) / 180
  const sweep: V3 = [Math.sin(ta), 0, Math.cos(ta)]
  const across: V3 = [Math.sin(fa), 0, Math.cos(fa)]                     // the ribbon's width runs this way
  const y0 = G - 0.1                                                      // sunk a little into the sand
  const centre = (t: number): V3 => add([b.x, y0 + t * (b.h - 0.1), b.z], sweep, b.bend * t * t)
  const width = (t: number): number => W0 * Math.pow(1 - t, 0.7) + 0.004
  // the gilt edge on +across; the steel takes the rest
  const split = b.gilt ? 0.5 - GILT_SHARE : 0.5
  for (let i = 0; i < SEGS; i++) {
    const t0 = i / SEGS, t1 = (i + 1) / SEGS
    const c0 = centre(t0), c1 = centre(t1)
    const w0 = width(t0), w1 = width(t1)
    const up = norm([c1[0] - c0[0], c1[1] - c0[1], c1[2] - c0[2]])
    const n = norm(cross(across, up))                                     // the flat's normal
    const at = (c: V3, w: number, s: number, f: number): V3 => add(add(c, across, w * s), n, THICK / 2 * f)
    for (const f of [1, -1]) {
      const nn: V3 = [n[0] * f, n[1] * f, n[2] * f]
      q.quad([at(c0, w0, -0.5, f), at(c0, w0, split, f), at(c1, w1, split, f), at(c1, w1, -0.5, f)], nn, UV, STEEL, tag)
      if (b.gilt) q.quad([at(c0, w0, split, f), at(c0, w0, 0.5, f), at(c1, w1, 0.5, f), at(c1, w1, split, f)], nn, UV, GILT, tag)
    }
    // the two edges
    for (const s of [0.5, -0.5]) {
      const en: V3 = [across[0] * Math.sign(s), 0, across[2] * Math.sign(s)]
      q.quad([at(c0, w0, s, -1), at(c0, w0, s, 1), at(c1, w1, s, 1), at(c1, w1, s, -1)], en, UV, s > 0 && b.gilt ? GILT : STEEL_DARK, tag)
    }
  }
}
