/**
 * Batch 5's squares' small structures (2026-10-31; the planting is tools/gardens/paris-batch5.ts). Each says what it was read from. Places are OSM's nodes or the aerial's pixels; the looks are from memory of the place unless a shot says otherwise, and every figure here is a stand-in for what PARIS-TRIPO-NOTES.md asks of Tripo.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { box, prism, strut } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { block, hex, shade, type Rgb } from '../../kit.ts'
import { crag } from '../batch3/parks.ts'
import { pinnacle, statue } from '../monuments/gothic.ts'

const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const hash = (a: number, b: number): number => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v) }
const groundOf = (fit: Fit) => (x: number, z: number): number => fit.groundAt?.(x, z) ?? fit.grade ?? 0
const M = 111320, K = 73270
const STONE = hex('#8f8775'), PALE = hex('#958c7a'), WORN = hex('#7a7364'), BRONZE = hex('#39423a'), STEEL = hex('#1f2224'), LEAF = hex('#3f5a31')
const ashlar = surfaceTag('ashlar'), metal = surfaceTag('metal'), foliage = surfaceTag('foliage')

/** A flat disc at y, `r` across, n sides, its fan in wedges. */
function disc(out: MeshBuilder, x: number, z: number, y: number, r: number, n: number, c: Rgb, tag = 0): void {
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2
    out.quad([[x, y, z], [x + Math.sin(a0) * r, y, z + Math.cos(a0) * r], [x + Math.sin(a1) * r, y, z + Math.cos(a1) * r], [x, y, z]], [0, 1, 0], UV, c, tag)
  }
}

/** An upright ring of `n` quads from a0 to a1 (radians, 0 at +z, clockwise from above), r0→r1 from y0→y1: a step's riser or tread when one pair is equal. */
function fan(out: MeshBuilder, x: number, z: number, a0: number, a1: number, n: number, r0: number, r1: number, y0: number, y1: number, c: Rgb, tag = 0): void {
  for (let i = 0; i < n; i++) {
    const p = a0 + ((a1 - a0) * i) / n, q = a0 + ((a1 - a0) * (i + 1)) / n, m = (p + q) / 2
    const ny = r0 === r1 ? 0 : y0 === y1 ? 1 : 0.7
    const nh = y0 === y1 ? 0 : 1
    const nn: [number, number, number] = [Math.sin(m) * nh, ny, Math.cos(m) * nh]
    out.quad([[x + Math.sin(p) * r0, y0, z + Math.cos(p) * r0], [x + Math.sin(q) * r0, y0, z + Math.cos(q) * r0], [x + Math.sin(q) * r1, y1, z + Math.cos(q) * r1], [x + Math.sin(p) * r1, y1, z + Math.cos(p) * r1]], nn, UV, c, tag)
  }
}

/* -------------------------------------------------------------------------------------------- Square Georges-Cain */

/**
 * THE LAPIDARY GARDEN (Square Georges-Cain, aerial at (500–590, 450–530)): what Carnavalet stood out of doors when it ran out of walls: a pier and arch off the Tuileries, a fragment of the old Hôtel de Ville's pediment on a low wall, capitals and column drums lying along the gravel, and a bronze figure on her plinth in the crescent bed. Local x east, z north.
 */
export function cainLapidaire(out: MeshBuilder, fit: Fit): void {
  const G = groundOf(fit)
  // the arch off the Tuileries, against the hedge: two piers with pilasters, its head and cornice
  const ax = 13.5, az = -1, y = G(ax, az)
  block(out, ax - 3.3, ax - 2.2, az - 0.5, az + 0.5, y - 0.2, y + 5.2, STONE)
  block(out, ax + 2.2, ax + 3.3, az - 0.5, az + 0.5, y - 0.2, y + 5.2, STONE)
  for (let i = 0; i < 6; i++) {
    const a0 = (i / 6) * Math.PI, a1 = ((i + 1) / 6) * Math.PI, r0 = 2.25, Ry = 5.2
    const ya0 = y + 3.1 + Math.sin(a0) * r0, ya1 = y + 3.1 + Math.sin(a1) * r0
    out.quad([[ax + Math.cos(a0) * r0, ya0, az - 0.5], [ax + Math.cos(a1) * r0, ya1, az - 0.5], [ax + Math.cos(a1) * r0, y + Ry + 0.8, az - 0.5], [ax + Math.cos(a0) * r0, y + Ry + 0.8, az - 0.5]], [0, 0, -1], UV, STONE, ashlar)
    out.quad([[ax + Math.cos(a1) * r0, ya1, az + 0.5], [ax + Math.cos(a0) * r0, ya0, az + 0.5], [ax + Math.cos(a0) * r0, y + Ry + 0.8, az + 0.5], [ax + Math.cos(a1) * r0, y + Ry + 0.8, az + 0.5]], [0, 0, 1], UV, STONE, ashlar)
    out.quad([[ax + Math.cos(a1) * r0, ya1, az - 0.5], [ax + Math.cos(a0) * r0, ya0, az - 0.5], [ax + Math.cos(a0) * r0, ya0, az + 0.5], [ax + Math.cos(a1) * r0, ya1, az + 0.5]], [0, -1, 0], UV, shade(STONE, 0.7), 0)
  }
  block(out, ax - 3.6, ax + 3.6, az - 0.75, az + 0.75, y + 6, y + 6.5, shade(STONE, 1.05))
  // the pediment fragment on its low wall, at the head of the gravel
  const px = -4, pz = 6, py = G(px, pz)
  block(out, px - 3.4, px + 3.4, pz - 0.4, pz + 0.4, py - 0.2, py + 2.4, WORN)
  out.quad([[px - 3.4, py + 2.4, pz - 0.42], [px + 3.4, py + 2.4, pz - 0.42], [px, py + 3.9, pz - 0.42], [px, py + 3.9, pz - 0.42]], [0, 0, -1], UV, STONE, ashlar)
  // the drums and capitals along the walk
  for (let i = 0; i < 7; i++) {
    const x = -5 + i * 2.1 + hash(i, 1) * 0.6, z = 3 - i * 0.9 + (i % 2 ? 1.6 : -0.4), gy = G(x, z), r = 0.42 + hash(i, 2) * 0.16
    if (i % 3 === 2) {
      prism(out, x, z, gy, gy + 0.5, r * 0.7, 8, shade(STONE, 0.95), ashlar, r * 1.25)
      box(out, x, gy + 0.6, z, r * 1.35, 0.1, r * 1.35, STONE, 0)
    } else {
      prism(out, x, z, gy, gy + 0.55 + hash(i, 3) * 0.9, r, 8, shade(WORN, 0.92 + hash(i, 4) * 0.18), ashlar)
    }
  }
  // the figure, in the crescent
  const fx = 4.8, fz = -2, fy = G(fx, fz)
  prism(out, fx, fz, fy, fy + 1.3, 0.72, 8, PALE, ashlar, 0.6)
  statue(out, fx, fy + 1.3, fz, 2.1, BRONZE)
}

/* ---------------------------------------------------------------------------------------------- Jardin Anne-Frank */

/** Points along the pergola's curve (aerial 0.16 m/px, from (412, 490) round to (520, 392)), in metres from the entry's own place at (455, 430). */
const PERGOLA: [number, number][] = [[412, 490], [397, 462], [395, 432], [404, 406], [424, 384], [450, 372], [478, 372], [500, 380], [520, 392]].map(([x, y]) => [(x - 455) * 0.16, (430 - y) * 0.16])

/**
 * THE PERGOLA OF THE JARDIN ANNE-FRANK (aerial, the green curved band round the pale court's north-west): steel hoops in a long curve, green and overgrown, with a planted bank behind it. And in the court Polzin's Hommage à Paul Celan (OSM's node), a bronze heap of a figure, and the fence round the graft's bed is the bed's rim. Local x east, z north.
 */
export function anneFrankPergola(out: MeshBuilder, fit: Fit): void {
  const G = groundOf(fit)
  const w = 2.6, h = 3.1
  for (let i = 0; i + 1 < PERGOLA.length; i++) {
    const [ax, az] = PERGOLA[i], [bx, bz] = PERGOLA[i + 1]
    const L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L / 1.6))
    const tx = (bx - ax) / L, tz = (bz - az) / L, ox = -tz, oz = tx // ox,oz points outward of the court (left of the way we walk the curve)
    for (let k = 0; k <= n; k++) {
      const x = ax + tx * (L * k) / n, z = az + tz * (L * k) / n, y = G(x, z)
      // a hoop: post, shoulder, across, shoulder, post
      const P = (d: number, up: number): [number, number, number] => [x + ox * d, y + up, z + oz * d]
      strut(out, P(-w / 2, 0), P(-w / 2, h * 0.72), 0.07, 0.07, STEEL, metal, false)
      strut(out, P(w / 2, 0), P(w / 2, h * 0.72), 0.07, 0.07, STEEL, metal, false)
      strut(out, P(-w / 2, h * 0.72), P(-w * 0.2, h), 0.07, 0.07, STEEL, metal, false)
      strut(out, P(w * 0.2, h), P(w / 2, h * 0.72), 0.07, 0.07, STEEL, metal, false)
      strut(out, P(-w * 0.2, h), P(w * 0.2, h), 0.07, 0.07, STEEL, metal, false)
    }
    // the climbers over it, in two falls, and the bank's planting behind
    const yA = G(ax, az), yB = G(bx, bz)
    const Q = (e: 'a' | 'b', d: number, up: number): [number, number, number] => (e === 'a' ? [ax + ox * d, yA + up, az + oz * d] : [bx + ox * d, yB + up, bz + oz * d])
    const v = 0.9 + hash(i, 7) * 0.2
    out.quad([Q('a', -w * 0.25, h + 0.08), Q('b', -w * 0.25, h + 0.08), Q('b', w * 0.25, h + 0.08), Q('a', w * 0.25, h + 0.08)], [0, 1, 0], UV, shade(LEAF, v), foliage)
    out.quad([Q('a', w * 0.25, h + 0.08), Q('b', w * 0.25, h + 0.08), Q('b', w * 0.56, h * 0.7), Q('a', w * 0.56, h * 0.7)], [ox * 0.7, 0.7, oz * 0.7], UV, shade(LEAF, v * 0.95), foliage)
    out.quad([Q('a', -w * 0.56, h * 0.7), Q('b', -w * 0.56, h * 0.7), Q('b', -w * 0.25, h + 0.08), Q('a', -w * 0.25, h + 0.08)], [-ox * 0.7, 0.7, -oz * 0.7], UV, shade(LEAF, v * 1.05), foliage)
    out.quad([Q('a', w * 0.56, h * 0.7), Q('b', w * 0.56, h * 0.7), Q('b', w * 0.56, 0), Q('a', w * 0.56, 0)], [ox, 0, oz], UV, shade(LEAF, v * 0.85), foliage)
  }
  // Hommage à Paul Celan, at the court's west side: two heaped lumps of bronze on a slab (OSM's node, 48.861573 2.354591)
  const cx = (2.354591 - 2.3547017) * K, cz = (48.861573 - 48.8617006) * M, cy = G(cx, cz)
  box(out, cx, cy + 0.08, cz, 1.3, 0.08, 1, PALE, 0)
  crag(out, cx - 0.2, cy + 0.2, cz, 0.7, 1.15, 0.55, 3.3, BRONZE)
  crag(out, cx + 0.45, cy + 1.2, cz + 0.05, 0.42, 0.75, 0.36, 5.1, BRONZE)
}

/* -------------------------------------------------------------------------------------------- Square René-Viviani */

/**
 * LA FONTAINE SAINT-JULIEN (Georges Jeanclos, 1995; OSM's node, in its ring of box on the aerial): a low round basin of pale stone and in it a bronze column of the saint's story wrapped round in reliefs, cloaked figures in tiers under a cap. The reliefs are bands and a jet at its foot; the figures want Tripo.
 */
export function vivianiFontaine(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0
  fan(out, 0, 0, 0, Math.PI * 2, 16, 5, 5, y, y + 0.5, PALE, ashlar)
  fan(out, 0, 0, 0, Math.PI * 2, 16, 5, 4.45, y + 0.5, y + 0.5, shade(PALE, 1.06), ashlar)
  disc(out, 0, 0, y + 0.3, 4.5, 16, hex('#3a4a4d'), surfaceTag('glass'))
  prism(out, 0, 0, y + 0.3, y + 0.75, 1.15, 10, STONE, ashlar, 1)
  prism(out, 0, 0, y + 0.75, y + 3.2, 0.68, 10, BRONZE, metal, 0.6)
  for (let i = 0; i < 3; i++) {
    const yb = y + 1.1 + i * 0.8
    for (let k = 0; k < 7; k++) {
      const a = ((k + (i % 2) * 0.5) / 7) * Math.PI * 2
      statue(out, Math.sin(a) * 0.72, yb, Math.cos(a) * 0.72, 0.72, shade(BRONZE, 1.05 + hash(i, k) * 0.3))
    }
  }
  prism(out, 0, 0, y + 3.2, y + 3.42, 0.78, 10, shade(BRONZE, 1.1), metal, 0.55)
  prism(out, 0, 0, y + 3.42, y + 3.9, 0.55, 10, BRONZE, metal, 0.04)
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2
    out.water.push({ kind: 'jet', at: [Math.cos(a) * 1.1, y + 0.75, Math.sin(a) * 1.1], v: [Math.cos(a) * 1.2, 1.8, Math.sin(a) * 1.2], width: 0.05, spread: 0.1 })
  }
}

/**
 * THE ROBINIA'S CRUTCH (OSM's node, the tree planted in 1601 by Jean Robin, "Plus Vieil Arbre de Paris"): the tree is the register's and the crutch is what makes it itself: a concrete prop holding its leaning trunk, ivy to the fork, and its little fence.
 */
export function robinierCrutch(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0, C = hex('#7d7a71'), T = hex('#3f352a')
  // the trunk's foot, split and hollow, wider than any register tree, and the ivy on it
  prism(out, 0, 0, y, y + 2.6, 0.62, 8, T, 0, 0.48, false)
  prism(out, 0.08, 0.02, y, y + 1.9, 0.68, 7, hex('#2e4427'), foliage, 0.5, false)
  // the two arms of the crutch, carrying a saddle under the lean
  strut(out, [1.6, y, 0.9], [0.65, y + 3, 0.35], 0.2, 0.2, C, surfaceTag('concrete'))
  strut(out, [1.3, y, -1.1], [0.65, y + 3, 0.2], 0.2, 0.2, C, surfaceTag('concrete'))
  box(out, 0.6, y + 3.05, 0.27, 0.35, 0.1, 0.42, C, surfaceTag('concrete'))
  // the fence: eight posts and a rail
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2, b = ((i + 1) / 8) * Math.PI * 2, r = 2.5
    prism(out, Math.sin(a) * r, Math.cos(a) * r, y, y + 0.7, 0.03, 4, STEEL, metal, 0.03, false)
    strut(out, [Math.sin(a) * r, y + 0.68, Math.cos(a) * r], [Math.sin(b) * r, y + 0.68, Math.cos(b) * r], 0.04, 0.04, STEEL, metal, false)
  }
}

/**
 * NOTRE-DAME'S OLD STONES (Viviani's gravel by Saint-Julien's flank; aerial): what Viollet-le-Duc's restoration took off the cathedral and left here: a broken pinnacle, a length of tracery, pieces of a balustrade and a capital, lying and standing about.
 */
export function vivianiStones(out: MeshBuilder, fit: Fit): void {
  const G = groundOf(fit)
  for (let i = 0; i < 9; i++) {
    const x = -5 + i * 1.3 + hash(i, 5) * 0.8, z = (i % 2 ? 1.2 : -1) + hash(i, 6), y = G(x, z), c = shade(WORN, 0.86 + hash(i, 7) * 0.2)
    const k = i % 4
    if (k === 0) { block(out, x - 0.45, x + 0.45, z - 0.45, z + 0.45, y, y + 0.6, c); pinnacle(out, x, z, y + 0.6, 2.2, 0.34, c, 1) }
    else if (k === 1) {
      block(out, x - 0.8, x + 0.8, z - 0.2, z + 0.2, y, y + 1.1, c)
      for (const s of [-0.45, 0, 0.45]) block(out, x + s - 0.14, x + s + 0.14, z - 0.22, z - 0.2, y + 0.15, y + 0.85, shade(c, 0.45))
    } else if (k === 2) {
      prism(out, x, z, y, y + 0.45, 0.32, 8, c, ashlar, 0.55)
      box(out, x, y + 0.55, z, 0.62, 0.1, 0.62, c, 0)
    } else crag(out, x, y, z, 0.6, 0.5, 0.45, i * 1.7, c)
  }
}

/* ---------------------------------------------------------------------------------------------- Square Jean-XXIII */

/**
 * LA FONTAINE DE LA VIERGE (Alphonse Vigoureux, 1845, in the Square de l'Archevêché; OSM way 948654101, aerial): the neo-Gothic spire behind Notre-Dame: an octagonal basin, three tiers of niches and pinnacles, the Virgin and Child on top under the last canopy, the whole about 12 m. Part of its arcade is a kit `pinnacle`; the figures are masses. For Tripo.
 */
export function fontaineVierge(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0, S = hex('#8c8473'), D = shade(S, 0.42)
  // the basin, its rim and water
  fan(out, 0, 0, Math.PI / 8, Math.PI * 2 + Math.PI / 8, 8, 5.2, 5.2, y, y + 0.75, S, ashlar)
  fan(out, 0, 0, Math.PI / 8, Math.PI * 2 + Math.PI / 8, 8, 5.2, 4.6, y + 0.75, y + 0.75, shade(S, 1.08), ashlar)
  disc(out, 0, 0, y + 0.55, 4.7, 8, hex('#3a4a4d'), surfaceTag('glass'))
  // the shaft's three tiers: the blind arcade, its figures and pinnacles; each narrower
  const tier = (y0: number, y1: number, r: number, r1: number, fig: number): void => {
    prism(out, 0, 0, y0, y1, r, 8, S, ashlar, r1, false)
    prism(out, 0, 0, y1, y1 + 0.25, r1 + 0.22, 8, shade(S, 1.08), 0, r1 + 0.22)
    for (let i = 0; i < 8; i++) {
      const a = ((i + 0.5) / 8) * Math.PI * 2, b = (i / 8) * Math.PI * 2
      const sx = Math.sin(a), cz = Math.cos(a)
      const m = (r + r1) / 2 * Math.cos(Math.PI / 8) + 0.04
      const w = m * 0.26, ty = y0 + (y1 - y0) * 0.14, tt = y1 - (y1 - y0) * 0.18
      // a dark pointed niche
      const P = (u: number, v: number): [number, number, number] => [sx * m + cz * u, v, cz * m - sx * u]
      out.quad([P(-w, ty), P(w, ty), P(w, tt), P(-w, tt)], [sx, 0, cz], UV, D, 0)
      out.quad([P(-w, tt), P(w, tt), P(0, tt + w * 1.8), P(0, tt + w * 1.8)], [sx, 0, cz], UV, D, 0)
      if (fig > 0) statue(out, sx * (m + 0.08), ty, cz * (m + 0.08), fig, shade(S, 1.12))
      pinnacle(out, Math.sin(b) * (r1 + 0.1), Math.cos(b) * (r1 + 0.1), y1 + 0.2, 1.7, 0.2, shade(S, 1.05), 1)
    }
  }
  tier(y + 0.55, y + 3.9, 1.95, 1.72, 1.8)
  tier(y + 4.1, y + 6.9, 1.32, 1.12, 1.4)
  tier(y + 7.1, y + 9.1, 0.86, 0.72, 0)
  // the last canopy on its colonnettes, the Virgin under it, and the crown of it
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    prism(out, Math.sin(a) * 0.58, Math.cos(a) * 0.58, y + 9.3, y + 11.1, 0.05, 5, S, 0, 0.05, false)
  }
  statue(out, 0, y + 9.3, 0, 1.65, shade(S, 1.2))
  prism(out, 0, 0, y + 11.1, y + 12.9, 0.76, 6, S, ashlar, 0.05)
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4
    out.water.push({ kind: 'jet', at: [Math.sin(a) * 2, y + 1.1, Math.cos(a) * 2], v: [Math.sin(a) * 1.5, 1.2, Math.cos(a) * 1.5], width: 0.05, spread: 0.1 })
  }
}

/* ----------------------------------------------------------------------------------------------- Square Boucicaut */

/**
 * THE MONUMENT TO MME BOUCICAUT AND THE BARONESS DE HIRSCH (Paul Moreau-Vauthier, 1914; OSM's node): a pale stone wall, an exedra with a bench either side, and the two benefactresses seated at the middle with a child and a poor old woman; at their feet a small basin. Its figures want Tripo.
 */
export function boucicautMonument(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0, S = hex('#958c7a')
  const w = 4.6
  // the wall: its plinth, its panel and rounded head
  block(out, -w, w, 0.8, 1.6, y, y + 0.35, shade(S, 0.92))
  block(out, -w + 0.2, w - 0.2, 1, 1.5, y + 0.35, y + 3, S)
  block(out, -1.9, 1.9, 1, 1.5, y + 3, y + 4.1, S)
  prism(out, 0, 1.25, y + 4.1, y + 4.7, 1.2, 8, S, ashlar, 0.05)
  block(out, -w + 0.1, w - 0.1, 0.92, 1.58, y + 2.95, y + 3.15, shade(S, 1.08))
  // the benches, curved in a little
  for (const s of [-1, 1]) {
    strut(out, [s * 1.7, y + 0.42, 0.55], [s * 4.3, y + 0.42, 0.75], 0.42, 0.14, shade(S, 1.04), 0)
    block(out, s * 4.1 - 0.2, s * 4.1 + 0.2, 0.55, 0.95, y, y + 0.42, shade(S, 0.9))
    block(out, s * 2 - 0.2, s * 2 + 0.2, 0.35, 0.75, y, y + 0.42, shade(S, 0.9))
  }
  // the group, its pedestal and the basin
  block(out, -1.25, 1.25, 0.2, 1.0, y, y + 0.75, shade(S, 0.96))
  for (const [x, h] of [[-0.6, 1.5], [0.6, 1.5], [-1.05, 1], [1.05, 0.85]]) statue(out, x, y + 0.75, 0.55, h, shade(S, 1.1))
  fan(out, 0, -0.9, Math.PI / 2, Math.PI * 1.5, 8, 1.4, 1.4, y, y + 0.28, S, ashlar)
  disc(out, 0, -0.9, y + 0.16, 1.3, 8, hex('#3a4a4d'), surfaceTag('glass'))
}

/**
 * THE KIOSK (Square Boucicaut, aerial (415, 455)): a green iron gazebo at the bend of the walk. (OSM's two playgrounds draw their own floors.)
 */
export function boucicautKiosk(out: MeshBuilder, fit: Fit): void {
  const G = groundOf(fit), y = G(0, 0), r = 2.3, T = hex('#2f4c44')
  prism(out, 0, 0, y, y + 0.25, r + 0.2, 8, STONE, ashlar, r + 0.2)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2, b = ((i + 1) / 8) * Math.PI * 2
    prism(out, Math.sin(a) * r, Math.cos(a) * r, y + 0.25, y + 2.9, 0.05, 6, T, metal, 0.05, false)
    strut(out, [Math.sin(a) * r, y + 2.9, Math.cos(a) * r], [Math.sin(b) * r, y + 2.9, Math.cos(b) * r], 0.1, 0.14, T, metal, false)
    strut(out, [Math.sin(a) * r, y + 0.95, Math.cos(a) * r], [Math.sin(b) * r, y + 0.95, Math.cos(b) * r], 0.04, 0.04, T, metal, false)
  }
  prism(out, 0, 0, y + 3, y + 4.2, r + 0.4, 8, shade(T, 1.25), metal, 0.25)
  prism(out, 0, 0, y + 4.2, y + 4.8, 0.2, 6, T, metal, 0.03)
}

/* ------------------------------------------------------------------------------------------------ Square d'Ajaccio */

/** A monument in stone or bronze on its plinth: `kind` 0 a bust (Gouraud, OSM's node), 1 a group (La Défense du foyer, Boisseau), 2 a stele with a medallion (Taine). */
function memorial(out: MeshBuilder, fit: Fit, kind: 0 | 1 | 2): void {
  const y = fit.grade ?? 0, S = hex('#958c7a'), B = BRONZE
  if (kind === 0) {
    block(out, -0.55, 0.55, -0.55, 0.55, y, y + 0.3, shade(S, 0.9))
    prism(out, 0, 0, y + 0.3, y + 2, 0.38, 4, S, ashlar, 0.32)
    prism(out, 0, 0, y + 2, y + 2.5, 0.28, 8, B, metal, 0.32)
    prism(out, 0, 0, y + 2.5, y + 2.85, 0.14, 8, B, metal, 0.13)
  } else if (kind === 1) {
    block(out, -1.1, 1.1, -0.8, 0.8, y, y + 0.35, shade(S, 0.9))
    block(out, -0.9, 0.9, -0.6, 0.6, y + 0.35, y + 2, S)
    block(out, -1, 1, -0.7, 0.7, y + 2, y + 2.15, shade(S, 1.06))
    statue(out, -0.25, y + 2.15, 0, 2.2, hex('#a39a87'))
    statue(out, 0.35, y + 2.15, -0.15, 1.4, hex('#a39a87'))
    statue(out, 0.05, y + 2.15, 0.35, 0.9, hex('#a39a87'))
  } else {
    block(out, -1, 1, -0.45, 0.45, y, y + 0.3, shade(S, 0.9))
    block(out, -0.72, 0.72, -0.22, 0.22, y + 0.3, y + 2.7, S)
    prism(out, 0, 0, y + 2.7, y + 3.1, 0.7, 4, S, ashlar, 0.2)
    prism(out, 0, -0.22, y + 1.5, y + 1.53, 0.34, 10, B, metal)
  }
}
export function ajaccioBust(out: MeshBuilder, fit: Fit): void { memorial(out, fit, 0) }
export function ajaccioGroup(out: MeshBuilder, fit: Fit): void { memorial(out, fit, 1) }
export function ajaccioStele(out: MeshBuilder, fit: Fit): void { memorial(out, fit, 2) }

/* --------------------------------------------------------------------------------------------- Port de l'Arsenal */

/**
 * THE MOORED BOATS OF THE PORT DE L'ARSENAL (ORTHOPHOTOS2018 at 48.8486 2.3679 and 48.8508 2.3676, 0.26 m/px): each read off the photograph, its bow and stern, moored bow-on to the two quays or alongside. 93 of them in two entries: white cruisers, a dark hull or two and an awning: "boats seen from a distance" is what these are for and this is the stand-in. Each is a hull, a deck and a cabin; about 34 triangles. x east, z north from the entry; the water's level is the entry's ground.
 */
const BOATS_S: [number, number, number, number][] = [
  [290, 32, 318, 40], [262, 60, 305, 68], [262, 90, 298, 98], [245, 115, 288, 125], [238, 158, 278, 170], [222, 182, 256, 192], [205, 248, 240, 258], [195, 280, 235, 285], [190, 310, 228, 318], [182, 338, 218, 348], [172, 365, 222, 378], [165, 395, 210, 402], [160, 415, 195, 425], [150, 435, 195, 450], [140, 475, 180, 485], [138, 495, 180, 502], [130, 515, 162, 525], [118, 545, 160, 560], [112, 572, 158, 586], [105, 600, 142, 612], [95, 625, 132, 640], [92, 640, 135, 652], [85, 665, 110, 672], [78, 685, 120, 695], [72, 700, 112, 705], [65, 722, 105, 732], [55, 745, 95, 755], [48, 770, 88, 780], [45, 790, 85, 798], [25, 850, 72, 862], [22, 870, 68, 882], [18, 885, 62, 895], [10, 900, 60, 915], [5, 920, 55, 932], [2, 945, 52, 955],
  // the east quay
  [405, 8, 395, 40], [385, 75, 395, 50], [395, 55, 380, 92], [382, 115, 375, 160], [360, 170, 340, 182], [345, 215, 370, 220], [340, 228, 365, 240], [318, 275, 345, 285], [322, 285, 345, 296], [320, 325, 300, 340], [310, 350, 295, 365], [300, 390, 275, 400], [298, 405, 275, 415], [295, 440, 275, 450], [290, 470, 262, 490], [282, 515, 262, 522], [280, 530, 260, 540], [290, 558, 252, 565], [262, 675, 248, 740], [235, 755, 222, 795], [250, 755, 238, 810], [240, 825, 225, 900], [250, 822, 240, 882], [240, 905, 225, 980],
]
const BOATS_N: [number, number, number, number][] = [
  [632, 55, 706, 72], [628, 75, 700, 100], [615, 115, 684, 138], [612, 132, 670, 155], [605, 148, 652, 165], [600, 170, 658, 188], [592, 185, 640, 202], [588, 205, 625, 222], [582, 225, 640, 245], [578, 245, 630, 260], [575, 258, 620, 275], [568, 272, 620, 292], [562, 292, 605, 310], [556, 310, 605, 328], [535, 410, 510, 472], [512, 552, 482, 638], [498, 555, 480, 630], [465, 645, 445, 695], [442, 705, 425, 755], [428, 765, 402, 845], [392, 852, 438, 868], [385, 882, 430, 895], [382, 898, 422, 920], [375, 915, 410, 925], [370, 925, 410, 945], [360, 968, 395, 982],
  [612, 562, 582, 648], [582, 662, 555, 738], [535, 802, 505, 858], [548, 808, 520, 868], [515, 868, 490, 915], [528, 878, 505, 930], [495, 925, 468, 985], [510, 932, 485, 990],
]

function boat(out: MeshBuilder, ax: number, az: number, bx: number, bz: number, y: number, seed: number): void {
  const L = Math.hypot(bx - ax, bz - az)
  const tx = (bx - ax) / L, tz = (bz - az) / L, nx = tz, nz = -tx
  const B = Math.min(2.2, L * 0.17 + 0.5)
  const P = (u: number, v: number, up: number): [number, number, number] => [ax + tx * u + nx * v, y + up, az + tz * u + nz * v]
  const dark = hash(seed, 1) > 0.8
  const hull: Rgb = dark ? hex('#22303a') : hex('#8e908b')
  const deck: Rgb = hash(seed, 2) > 0.5 ? hex('#7d6b4c') : hex('#7c7d78')
  const bowAt = L - B * 1.2
  // the hull's sides, flaring to the deck, a sharp bow, a flat stern
  const f = 0.92
  const side = (s: number): void => {
    const n: [number, number, number] = [nx * s, 0.1, nz * s]
    out.quad([P(0, s * B * f, 0), P(bowAt, s * B * f, 0), P(bowAt, s * B, 0.9), P(0, s * B, 0.9)], n, UV, hull, 0)
    out.quad([P(bowAt, s * B * f, 0), P(L, 0, 0.3), P(L, 0, 1.15), P(bowAt, s * B, 0.9)], [nx * s * 0.8 + tx * 0.6, 0.1, nz * s * 0.8 + tz * 0.6], UV, hull, 0)
  }
  side(1)
  side(-1)
  out.quad([P(0, -B, 0.9), P(0, -B * f, 0), P(0, B * f, 0), P(0, B, 0.9)], [-tx, 0, -tz], UV, hull, 0)
  // the deck, and at dark hulls a pale rail along it
  out.quad([P(0, B, 0.9), P(bowAt, B, 0.9), P(bowAt, -B, 0.9), P(0, -B, 0.9)], [0, 1, 0], UV, deck, 0)
  out.quad([P(bowAt, B, 0.9), P(L, 0, 1.15), P(L, 0, 1.15), P(bowAt, -B, 0.9)], [0, 1, 0], UV, deck, 0)
  // the cabin: its roof whiter than its sides, a dark band of window, and a little wheelhouse on the longer ones
  const u0 = L * 0.22, u1 = L * 0.66, w = B * 0.72
  const CAB: Rgb = hex('#8f8f8a'), WIN: Rgb = hex('#242c33')
  const up0 = 0.9, up1 = L > 12 ? 2.3 : 1.9
  for (const s of [-1, 1]) {
    out.quad([P(u0, s * w, up0), P(u1, s * w, up0), P(u1, s * w, up1), P(u0, s * w, up1)], [nx * s, 0, nz * s], UV, CAB, 0)
    out.quad([P(u0 + 0.3, s * (w + 0.01), up0 + 0.45), P(u1 - 0.2, s * (w + 0.01), up0 + 0.45), P(u1 - 0.2, s * (w + 0.01), up1 - 0.2), P(u0 + 0.3, s * (w + 0.01), up1 - 0.2)], [nx * s, 0, nz * s], UV, WIN, 0)
  }
  out.quad([P(u0, w, up1), P(u1, w, up1), P(u1, -w, up1), P(u0, -w, up1)], [0, 1, 0], UV, shade(CAB, 1.05), 0)
  out.quad([P(u1, -w, up0), P(u1, w, up0), P(u1, w, up1), P(u1, -w, up1)], [tx, 0, tz], UV, WIN, 0)
  out.quad([P(u0, w, up0), P(u0, -w, up0), P(u0, -w, up1), P(u0, w, up1)], [-tx, 0, -tz], UV, CAB, 0)
}

const boatsOf = (out: MeshBuilder, list: [number, number, number, number][], y: number, cx: number, cz: number, seed: number): void => {
  list.forEach(([x0, y0, x1, y1], i) => {
    boat(out, (x0 - cx) * 0.26, (cz - y0) * 0.26, (x1 - cx) * 0.26, (cz - y1) * 0.26, y, seed + i)
  })
}
/** the south half, on the picture round 48.8486 2.3679: the entry is at its (300, 500) */
export function arsenalBoatsSouth(out: MeshBuilder, fit: Fit): void { boatsOf(out, BOATS_S, fit.grade ?? 0, 300, 500, 11) }
/** the north half, on the picture round 48.8508 2.3676: the entry is at its (500, 500) */
export function arsenalBoatsNorth(out: MeshBuilder, fit: Fit): void { boatsOf(out, BOATS_N, fit.grade ?? 0, 500, 500, 137) }

/* ------------------------------------------------------------------------------------------------ Jardin Tino-Rossi */

/**
 * A DANCE BAY (the Quai Saint-Bernard's four half-rounds; ORTHOPHOTOS2018 at (463, 382), (538, 455), (612, 527), (687, 600), 0.34 m/px; Paris's open-air tango): a half-round floor of pale stone, inlaid, open to the Seine, and four curved steps rising round the landward side to the walk. Front −z (to the river). Half of the real relief is sunk below the quay; here the seats rise from it.
 */
export function tinoBay(out: MeshBuilder, fit: Fit): void {
  // (on the highest of the ground under it, not the front's: the quay falls toward the wall, and the first shot had only shards of it above the gravel, 2026-10-31)
  const G = groundOf(fit)
  const y = Math.max(G(0, 0), G(0, 8), G(-7, 4), G(7, 4)) + 0.1, S = hex('#8d8573'), T = shade(S, 1.08), R = 8.2
  // the floor, with its star: the half-disc and dark lines from the middle
  fan(out, 0, 0, Math.PI / 2, -Math.PI / 2, 14, R, 0.01, y + 0.03, y + 0.03, hex('#7d7666'), 0)
  for (let i = 0; i <= 8; i++) {
    const a = -Math.PI / 2 + (i / 8) * Math.PI
    const c = Math.sin(a), s = Math.cos(a)
    const w = 0.09
    out.quad([[c * 0.4 + s * w, y + 0.05, s * 0.4 - c * w], [c * R * 0.95 + s * w, y + 0.05, s * R * 0.95 - c * w], [c * R * 0.95 - s * w, y + 0.05, s * R * 0.95 + c * w], [c * 0.4 - s * w, y + 0.05, s * 0.4 + c * w]], [0, 1, 0], UV, hex('#3f3b34'), 0)
  }
  for (const r of [3, 5.8]) for (let i = 0; i < 12; i++) {
    const a0 = -Math.PI / 2 + (i / 12) * Math.PI, a1 = -Math.PI / 2 + ((i + 1) / 12) * Math.PI
    out.quad([[Math.sin(a0) * r, y + 0.05, Math.cos(a0) * r], [Math.sin(a1) * r, y + 0.05, Math.cos(a1) * r], [Math.sin(a1) * (r + 0.14), y + 0.05, Math.cos(a1) * (r + 0.14)], [Math.sin(a0) * (r + 0.14), y + 0.05, Math.cos(a0) * (r + 0.14)]], [0, 1, 0], UV, hex('#3f3b34'), 0)
  }
  // the rising steps round the back, each a riser (facing the floor) and a tread
  for (let k = 0; k < 4; k++) {
    const r0 = R + k * 0.95, r1 = r0 + 0.95, y0 = y + k * 0.22, y1 = y0 + 0.22
    for (let i = 0; i < 12; i++) {
      const a0 = -Math.PI / 2 + (i / 12) * Math.PI, a1 = -Math.PI / 2 + ((i + 1) / 12) * Math.PI, m = (a0 + a1) / 2
      const P = (a: number, r: number, h: number): [number, number, number] => [Math.sin(a) * r, h, Math.cos(a) * r]
      out.quad([P(a0, r0, y1), P(a1, r0, y1), P(a1, r0, y0), P(a0, r0, y0)], [-Math.sin(m), 0, -Math.cos(m)], UV, shade(S, 0.82), 0)
      out.quad([P(a0, r0, y1), P(a1, r0, y1), P(a1, r1, y1), P(a0, r1, y1)], [0, 1, 0], UV, k % 2 ? T : S, 0)
    }
  }
}

/**
 * THE GREAT STAR (the Tino-Rossi's north end; ORTHOPHOTOS2018 (265, 297), 13.6 m across each way): a compass of pale and grey stone laid in the quay's paving, the first thing you see of the garden from the Pont de Sully.
 */
export function tinoStar(out: MeshBuilder, fit: Fit): void {
  const G = groundOf(fit)
  const y = Math.max(G(0, 0), G(8, 0), G(-8, 0), G(0, 8), G(0, -8)) + 0.12, R = 13, A = hex('#938b78'), B = hex('#4f4c45')
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8, h = Math.PI / 8
    const r = i % 2 ? R : R * 0.62
    const P = (ang: number, rr: number): [number, number, number] => [Math.sin(ang) * rr, y, Math.cos(ang) * rr]
    out.quad([P(a, r), P(a + h, R * 0.2), P(a, 0.01), P(a, 0.01)], [0, 1, 0], UV, A, 0)
    out.quad([P(a, r), P(a, 0.01), P(a - h, R * 0.2), P(a - h, R * 0.2)], [0, 1, 0], UV, B, 0)
  }
}

type Kind = 'plates' | 'totem' | 'ring' | 'blob' | 'cage' | 'block' | 'figure' | 'steps'
/** OSM's nodes for the open-air museum, 2026-10-31, with a form for each from its maker and title. For Tripo, those that aren't plates. */
const SCULPTURES: [string, number, number, Kind, number][] = [
  ['Calder, Les cinq ailes', 48.847174, 2.358874, 'plates', 3.5], ['Schöffer, Chronos 10', 48.847153, 2.36171, 'cage', 7], ['Laury, Mind Accumulation', 48.847097, 2.361491, 'block', 2.2],
  ['Kirova, Stèle', 48.848216, 2.359673, 'totem', 3], ['Kiyomizu, Belt II', 48.848593, 2.359586, 'ring', 2.2], ['Vitullo, Cœur de Gaucho', 48.849049, 2.358784, 'blob', 2.4],
  ['Reinhoud, Melmoth', 48.848326, 2.359592, 'figure', 2.6], ['Rougemont, Interpénétration des deux espaces', 48.848219, 2.359485, 'steps', 3.2], ['Ipoustéguy, Hydrorrhage', 48.848169, 2.359941, 'figure', 2.4],
  ['Colvin, Le Grand Signe', 48.847986, 2.360169, 'totem', 4.6], ['Stahly, Neptune II', 48.848011, 2.360322, 'blob', 3.4], ['Càrdenas, La Grande Fenêtre', 48.848041, 2.360456, 'ring', 3.4],
  ['Pazzi, Granit', 48.847198, 2.36122, 'block', 2.6], ['Pan, Sculpture', 48.846891, 2.36166, 'blob', 2], ['Etienne-Martin, Demeure I', 48.847629, 2.361088, 'blob', 3.2], ['Di Teana, Structure architecturale', 48.847515, 2.36094, 'steps', 4.2], ['Ipoustéguy, L\'homme aux semelles devant', 48.846747, 2.362175, 'figure', 2.3],
]

/** A stand-in: a plinth, and the form its title and maker say. */
function sculpture(out: MeshBuilder, x: number, z: number, y: number, kind: Kind, h: number, seed: number): void {
  const base = hex('#8f8877')
  const bronze = shade(BRONZE, 1 + hash(seed, 3) * 0.3)
  if (kind !== 'plates' && kind !== 'cage') block(out, x - 0.75, x + 0.75, z - 0.75, z + 0.75, y, y + 0.35, base)
  const y0 = y + 0.35
  if (kind === 'plates') {
    // black steel plates on edge: five wings pinned round a stem
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.3, s = Math.sin(a), c = Math.cos(a), R = 2.6
      const P = (u: number, v: number): [number, number, number] => [x + s * u, y + v, z + c * u]
      out.quad([P(0.3, 0), P(R, 0), P(R * 0.3, h * 1.1), P(0.3, h * 0.8)], [c, 0, -s], UV, STEEL, metal)
      out.quad([P(R, 0), P(0.3, 0), P(0.3, h * 0.8), P(R * 0.3, h * 1.1)], [-c, 0, s], UV, STEEL, metal)
    }
  } else if (kind === 'totem') {
    for (let k = 0; k < 4; k++) {
      const a = (k + 1) / 4, yb = y0 + ((h * k) / 4), yt = y0 + (h * (k + 1)) / 4, r = 0.62 - a * 0.25 + hash(seed, k) * 0.15
      box(out, x + (k % 2 ? 0.1 : -0.08), (yb + yt) / 2, z, r, (yt - yb) / 2, r * 0.6, shade(hex('#a79f8d'), 0.82 + hash(seed, k + 1) * 0.25), ashlar)
    }
  } else if (kind === 'ring') {
    const n = 12, R = h * 0.45, t = h * 0.14
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2
      strut(out, [x + Math.cos(a0) * R, y0 + R + t + Math.sin(a0) * R, z], [x + Math.cos(a1) * R, y0 + R + t + Math.sin(a1) * R, z], t * 1.5, t, kind === 'ring' && seed % 2 ? hex('#6f6a5f') : bronze, 0)
    }
  } else if (kind === 'blob') {
    crag(out, x, y0 + h * 0.35, z, h * 0.34, h * 0.45, h * 0.3, seed * 1.3, bronze)
    crag(out, x + h * 0.12, y0 + h * 0.75, z, h * 0.18, h * 0.26, h * 0.16, seed * 2.1, shade(bronze, 1.1))
  } else if (kind === 'cage') {
    // Schöffer's spatiodynamic tower: a steel mast with square frames of polished plates turned about it
    block(out, x - 1.1, x + 1.1, z - 1.1, z + 1.1, y, y + 0.3, base)
    strut(out, [x, y, z], [x, y + h, z], 0.14, 0.14, STEEL, metal, false)
    for (let k = 1; k <= 6; k++) {
      const yk = y + (h * k) / 7, s = 1.35 - k * 0.12, a = k * 0.5, c = Math.cos(a) * s, d = Math.sin(a) * s
      strut(out, [x - c, yk, z - d], [x + c, yk, z + d], 0.06, 0.06, STEEL, metal, false)
      strut(out, [x + d, yk, z - c], [x - d, yk, z + c], 0.06, 0.06, STEEL, metal, false)
      const pl = hex('#a8adb0')
      out.quad([[x - c, yk, z - d], [x + d, yk, z - c], [x + d, yk + 0.7, z - c], [x - c, yk + 0.7, z - d]], [Math.cos(a + 2.4), 0, Math.sin(a + 2.4)], UV, pl, metal)
      out.quad([[x + c, yk, z + d], [x - d, yk, z + c], [x - d, yk + 0.7, z + c], [x + c, yk + 0.7, z + d]], [Math.cos(a - 0.7), 0, Math.sin(a - 0.7)], UV, pl, metal)
    }
  } else if (kind === 'block') {
    box(out, x, y0 + h * 0.3, z, 0.8, h * 0.3, 0.55, hex('#77736a'), surfaceTag('granite'))
    box(out, x + 0.2, y0 + h * 0.8, z - 0.1, 0.5, h * 0.2, 0.45, hex('#88847a'), surfaceTag('granite'))
  } else if (kind === 'figure') {
    statue(out, x, y0, z, h, bronze)
    strut(out, [x + 0.15, y0 + h * 0.7, z], [x + 0.55, y0 + h * 0.5, z + 0.2], 0.1, 0.1, bronze, 0)
  } else {
    for (let k = 0; k < 5; k++) {
      const s = 0.9 - k * 0.14, yb = y0 + (h * k) / 5
      box(out, x + (k % 2 ? 0.2 : -0.2), yb + h / 10, z + (k % 2 ? -0.15 : 0.15), s, h / 10, s * 0.7, k % 2 ? hex('#6e2a22') : hex('#b5a896'), 0)
    }
  }
}

/** The open-air museum's stand-ins, all on one entry at their middle, as OSM has them. x east, z north. */
export function tinoSculptures(out: MeshBuilder, fit: Fit): void {
  const G = groundOf(fit)
  SCULPTURES.forEach(([, la, lo, k, h], i) => {
    const x = (lo - 2.3604) * K, z = (la - 48.8478) * M
    sculpture(out, x, z, G(x, z), k, h, i + 1)
  })
}
