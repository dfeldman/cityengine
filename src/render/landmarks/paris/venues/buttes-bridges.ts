/**
 * The Buttes-Chaumont's two bridges to the island (Alphand and Davioud's park of 1867; wave 1's Temple de la Sibylle
 * stands on the island's cliff):
 *
 * - the SUSPENSION BRIDGE (OSM way/45777307, "Pont Suspendu", 62 m, bridge:structure=suspension): a timber deck between
 *   red mesh railings under a polished steel handrail, hung from flat lattice chains that swoop from a pair of faux-rock
 *   pylons at each end (Commons: "Passerelle suspendue Buttes Chaumont Paris 19e.jpg"). Local x along the deck, the
 *   island (east) at −x;
 * - the PONT DES SUICIDES (way/29266078, 22 m): one brick arch with stone voussoirs over the gorge, a red cast-iron
 *   lattice parapet (Commons: "Paris - Buttes Chaumont - Pont des suicidés 01.jpg"). Local x along the deck, the
 *   island (north) at +x.
 *
 * Both draw their own deck (`coversRaised` in the manifest), from the ground at one end to the ground at the other.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { box, prism, strut, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { quadN, type V3 } from './bowl.ts'

const ROCK: Rgb = [0.66, 0.64, 0.6]
const RAIL_RED: Rgb = [0.5, 0.16, 0.12]
const DECK: Rgb = [0.58, 0.56, 0.52]

/** a red mesh railing panel along a line, its posts and steel rail */
function meshRail(out: MeshBuilder, a: V3, b: V3, h: number, side: number): void {
  const met = surfaceTag('metal')
  quadN(out, [a, b, [b[0], b[1] + h, b[2]], [a[0], a[1] + h, a[2]]], [0, 0, side], RAIL_RED, met)
  quadN(out, [a, [a[0], a[1] + h, a[2]], [b[0], b[1] + h, b[2]], b], [0, 0, -side], RAIL_RED, met)
  strut(out, [a[0], a[1] + h + 0.05, a[2]], [b[0], b[1] + h + 0.05, b[2]], 0.12, 0.08, [0.82, 0.84, 0.86], met, false)
}

/** a faux-rock pylon: a lumpy stack of prisms, narrowing */
function rockPylon(out: MeshBuilder, x: number, z: number, y0: number, h: number, seed: number): void {
  const rk = surfaceTag('rock')
  const n = 5
  for (let k = 0; k < n; k++) {
    const t0 = k / n, t1 = (k + 1) / n
    const r0 = 1.5 - 0.5 * t0 + 0.25 * Math.sin(seed + k * 1.7)
    const r1 = 1.5 - 0.5 * t1 + 0.25 * Math.sin(seed + (k + 1) * 1.7)
    prism(out, x + 0.15 * Math.sin(seed * 3 + k), z + 0.15 * Math.cos(seed * 2 + k), y0 + h * t0, y0 + h * t1, r0, 7, ROCK, rk, k === n - 1 ? r1 * 0.55 : r1)
  }
}

export function buttesSuspensionBridge(out: MeshBuilder, fit: Fit): void {
  const met = surfaceTag('metal')
  const half = 31
  const W = 1.6                                             // half the deck's width
  const yI = (fit.groundAt?.(-half, 0) ?? 0.5) + 0.2       // the island end
  const yS = (fit.groundAt?.(half, 0) ?? 0.5) + 0.2        // the shore end
  const deckY = (x: number): number => yI + ((x + half) / (2 * half)) * (yS - yI) - 0.6 * (1 - ((x / half) ** 2))
  // the deck: planks over two steel stringers, in pieces so it follows its gentle sag
  const n = 16
  for (let i = 0; i < n; i++) {
    const x0 = -half + (2 * half * i) / n, x1 = -half + (2 * half * (i + 1)) / n
    const y0 = deckY(x0), y1 = deckY(x1)
    quadN(out, [[x0, y0, -W], [x1, y1, -W], [x1, y1, W], [x0, y0, W]], [0, 1, 0], DECK, surfaceTag('planks'))
    quadN(out, [[x0, y0 - 0.45, -W], [x1, y1 - 0.45, -W], [x1, y1 - 0.45, W], [x0, y0 - 0.45, W]], [0, -1, 0], [0.3, 0.3, 0.3], met)
    for (const s of [-1, 1]) {
      quadN(out, [[x0, y0, s * W], [x1, y1, s * W], [x1, y1 - 0.45, s * W], [x0, y0 - 0.45, s * W]], [0, 0, s], [0.32, 0.3, 0.28], met)
      meshRail(out, [x0, y0, s * (W - 0.05)], [x1, y1, s * (W - 0.05)], 1.1, s)
    }
  }
  // the pylons, a pair at each end, and the lattice chains hung between their heads, with the hangers to the deck
  const ph = 6.2
  for (const s of [-1, 1]) {
    const heads: V3[] = []
    for (const e of [-1, 1]) {
      const x = e * (half + 1.2)
      const gy = fit.groundAt?.(e * (half + 1.2), s * (W + 1.4)) ?? 0.5
      rockPylon(out, x, s * (W + 1.4), gy - 0.5, ph + 0.5 + (e < 0 ? yI : yS) - gy, s * 2 + e)
      heads.push([x, (e < 0 ? yI : yS) + ph - 0.3, s * (W + 0.3)])
    }
    const m = 20
    let prev: V3 = heads[0]
    for (let i = 1; i <= m; i++) {
      const f = i / m
      const x = heads[0][0] + (heads[1][0] - heads[0][0]) * f
      const ylin = heads[0][1] + (heads[1][1] - heads[0][1]) * f
      const p: V3 = [x, ylin - 5.0 * 4 * f * (1 - f), s * (W + 0.15)]
      strut(out, prev, p, 0.07, 0.3, [0.42, 0.44, 0.46], met, false)
      if (i < m && Math.abs(x) < half) strut(out, p, [x, deckY(x) + 1.1, s * (W + 0.05)], 0.04, 0.04, [0.42, 0.44, 0.46], met, false)
      prev = p
    }
    // the back-stays into the ground behind each pylon
    for (const e of [-1, 1]) {
      const h = heads[e < 0 ? 0 : 1]
      const gy = fit.groundAt?.(e * (half + 6), s * (W + 0.5)) ?? 0.5
      strut(out, h, [e * (half + 6), gy, s * (W + 0.5)], 0.07, 0.25, [0.42, 0.44, 0.46], met, false)
    }
  }
}

export function buttesSuicidesBridge(out: MeshBuilder, fit: Fit): void {
  const brick = surfaceTag('brick')
  const ash = surfaceTag('ashlar')
  const half = 11
  const W = 2.2
  const yS = (fit.groundAt?.(-half, 0) ?? 0.5) + 0.15
  const yN = (fit.groundAt?.(half, 0) ?? 0.5) + 0.15
  const deck = Math.max(yS, yN)
  const BRICK: Rgb = [0.72, 0.6, 0.45]
  const VOUS: Rgb = [0.8, 0.76, 0.68]
  // the arch: 13 m span, springing well down the gorge, the barrel in brick under a ring of stone voussoirs
  const span = 6.5
  const rise = 8
  const spring = deck - 1.2 - rise
  const seg = 14
  for (let k = 0; k < seg; k++) {
    const a0 = Math.PI - (k / seg) * Math.PI, a1 = Math.PI - ((k + 1) / seg) * Math.PI
    const p0 = [Math.cos(a0) * span, spring + Math.sin(a0) * rise], p1 = [Math.cos(a1) * span, spring + Math.sin(a1) * rise]
    // the soffit
    quadN(out, [[p0[0], p0[1], -W], [p1[0], p1[1], -W], [p1[0], p1[1], W], [p0[0], p0[1], W]], [-(p0[0] + p1[0]) / 2, -1, 0], BRICK, brick)
    for (const s of [-1, 1]) {
      // the spandrel above the arch, the voussoir ring
      quadN(out, [[p0[0], p0[1], s * W], [p1[0], p1[1], s * W], [p1[0], deck - 0.6, s * W], [p0[0], deck - 0.6, s * W]], [0, 0, s], BRICK, brick)
      const q0 = [Math.cos(a0) * (span + 0.7), spring + Math.sin(a0) * (rise + 0.7)], q1 = [Math.cos(a1) * (span + 0.7), spring + Math.sin(a1) * (rise + 0.7)]
      quadN(out, [[p0[0], p0[1], s * (W + 0.06)], [p1[0], p1[1], s * (W + 0.06)], [q1[0], q1[1], s * (W + 0.06)], [q0[0], q0[1], s * (W + 0.06)]], [0, 0, s], VOUS, ash)
    }
  }
  // the abutments down into the rock either side, and the walls out to the banks
  for (const e of [-1, 1]) {
    const gy = fit.groundAt?.(e * half, 0) ?? 0.5
    box(out, e * (span + (half - span) / 2 + 0.3), (spring - 3 + deck - 0.6) / 2, 0, (half - span) / 2 + 0.3, (deck - 0.6 - spring + 3) / 2, W, BRICK, brick)
    void gy
  }
  // the deck, its cornice, the red cast-iron lattice parapets on stone dies
  box(out, 0, deck - 0.3, 0, half + 0.6, 0.3, W + 0.25, VOUS, ash)
  for (const s of [-1, 1]) {
    for (const x of [-half, -half / 2, 0, half / 2, half]) box(out, x, deck + 0.55, s * (W + 0.05), 0.25, 0.55, 0.25, VOUS, ash)
    meshRail(out, [-half, deck + 0.2, s * (W + 0.05)], [half, deck + 0.2, s * (W + 0.05)], 0.85, s)
    // the lattice: diagonals in the panel
    for (let x = -half; x < half - 0.1; x += 1.1) {
      strut(out, [x, deck + 0.25, s * (W + 0.08)], [x + 1.1, deck + 1.0, s * (W + 0.08)], 0.05, 0.05, RAIL_RED, surfaceTag('metal'), false)
      strut(out, [x + 1.1, deck + 0.25, s * (W + 0.08)], [x, deck + 1.0, s * (W + 0.08)], 0.05, 0.05, RAIL_RED, surfaceTag('metal'), false)
    }
  }
}
