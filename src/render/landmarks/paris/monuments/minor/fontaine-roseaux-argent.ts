import type { MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { beam, block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { FIXED, UV } from '../common.ts'
import { G } from '../plaza-common.ts'

/*
 * THE FONTAINE AUX ROSEAUX D'ARGENT (Brigitte Nahon, c. 2000; Wikidata Q18146923): in the rose garden of the Jardin médiéval
 * du musée de Cluny (square de Cluny, free, open to boulevard Saint-Germain): a long narrow water channel set in the beds, its
 * two edges timber planks, ending in a clump of stainless-steel "reeds" — curved, twisting blades with glass beads strung on
 * thin stems. Two glass-covered light wells and a small plaque on a stem stand at the near end.
 * Frame: the channel runs along z, the reeds at the −z end (so `front` is the bearing of the reeds from the middle).
 * Measured: nothing (the Wikidata point is a rounded 48.851, 2.344). Placed on the wooden-edged band an IGN ortho shows in the
 * garden's east bed; lengths, widths and blade heights are read off two Commons photos against the planks, so ±30 %.
 */
export const R = 7.5

// tunables
const LEN = 12            // channel length, z from −LEN/2 to +LEN/2
const PLANK_W = 0.28
const PLANK_H = 0.1       // planks stand this high above the bed
const SLOT = 0.2          // water slot between the planks
const BLADES = 17
const BLADE_H: [number, number] = [1.0, 2.0]
const BLADE_W = 0.11
const BEADS = 9
const BEAD_R = 0.035
const SPREAD = 0.55       // how far the reeds' feet range about the channel's end (m)

const TIMBER: Rgb = hex('#9a8465')
const WATER: Rgb = hex('#27302d')
const STEEL: Rgb = hex('#c9ced4')
const GLASS: Rgb = hex('#34444a')
const BED: Rgb = hex('#53703f')

// deterministic pseudo-random in [0,1)
const rnd = (i: number, k: number): number => { const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return s - Math.floor(s) }

/** One curved, twisting steel blade: foot at (x0,y0,z0), `h` tall, leaning along heading `lean` by `bend` m at the tip, ribbon `w` wide turning `twist` rad over its length. */
function blade(q: MeshBuilder, x0: number, y0: number, z0: number, h: number, lean: number, bend: number, twist: number, phi: number, w: number): void {
  const N = 8
  const pt = (t: number): [number, number, number] => {
    const o = bend * t * t
    return [x0 + Math.cos(lean) * o, y0 + h * (t - 0.12 * t * t), z0 + Math.sin(lean) * o]
  }
  const edge = (t: number, s: number): [number, number, number] => {
    const p = pt(t)
    const a = phi + twist * t
    const hw = (w / 2) * (1 - 0.55 * t * t) * s
    return [p[0] + Math.cos(a) * hw, p[1], p[2] + Math.sin(a) * hw]
  }
  for (let i = 0; i < N; i++) {
    const t0 = i / N, t1 = (i + 1) / N
    const a = phi + twist * (t0 + t1) / 2
    const nrm: [number, number, number] = [-Math.sin(a), 0, Math.cos(a)]
    const quad: [number, number, number][] = [edge(t0, -1), edge(t0, 1), edge(t1, 1), edge(t1, -1)]
    q.quad(quad, nrm, UV, STEEL, FIXED)
    q.quad([quad[3], quad[2], quad[1], quad[0]], [-nrm[0], 0, -nrm[2]], UV, shade(STEEL, 0.85), FIXED)
  }
}

function draw(q: MeshBuilder): void {
  const y0 = G
  const hw = SLOT / 2 + PLANK_W
  const z0 = -LEN / 2, z1 = LEN / 2
  // the planting bed round the channel, a shade proud of the pavement
  block(q, -2.6, 2.6, z0 - 1.2, z1 + 1.0, y0, y0 + 0.04, BED)
  // the water slot (dark), the two planks along each edge, the end planks
  block(q, -SLOT / 2, SLOT / 2, z0, z1, y0 + 0.02, y0 + 0.05, WATER)
  for (const s of [-1, 1]) {
    block(q, s * (SLOT / 2), s * hw, z0, z1, y0, y0 + PLANK_H, TIMBER)
    // plank joints every 2.4 m
    for (let z = z0 + 2.4; z < z1; z += 2.4) block(q, s * SLOT / 2, s * hw, z - 0.01, z + 0.01, y0 + PLANK_H, y0 + PLANK_H + 0.003, shade(TIMBER, 0.7))
  }
  block(q, -hw, hw, z1, z1 + PLANK_W, y0, y0 + PLANK_H, TIMBER)
  block(q, -hw, hw, z0 - PLANK_W, z0, y0, y0 + PLANK_H, TIMBER)
  // two glass-covered light wells beside the near end, and the plaque on its stem
  for (let i = 0; i < 2; i++) block(q, -hw - 1.0 - i * 0.78, -hw - 0.35 - i * 0.78, z1 - 0.7, z1 - 0.3, y0, y0 + 0.05, shade(GLASS, 1.1))
  beam(q, [-hw - 0.2, y0, z1 - 0.55], [-hw - 0.2, y0 + 0.28, z1 - 0.55], 0.02, shade(TIMBER, 0.6))
  block(q, -hw - 0.32, -hw - 0.08, z1 - 0.62, z1 - 0.5, y0 + 0.26, y0 + 0.4, shade(TIMBER, 0.45))
  // the reeds: a clump at the −z end, feet spread across the channel's end and into the bed behind it
  for (let i = 0; i < BLADES; i++) {
    const fx = (rnd(i, 1) - 0.5) * 2 * SPREAD
    const fz = z0 - 0.15 + (rnd(i, 2) - 0.5) * 2 * SPREAD * 0.8
    const h = BLADE_H[0] + (BLADE_H[1] - BLADE_H[0]) * rnd(i, 3)
    const lean = rnd(i, 4) * Math.PI * 2
    blade(q, fx, y0 + 0.03, fz, h, lean, 0.25 + 0.55 * rnd(i, 5), (rnd(i, 6) - 0.5) * 2.4, rnd(i, 7) * Math.PI, BLADE_W * (0.8 + 0.5 * rnd(i, 8)))
  }
  // thin stems with glass beads between the blades
  for (let i = 0; i < BEADS; i++) {
    const fx = (rnd(i, 11) - 0.5) * 2 * SPREAD * 0.9
    const fz = z0 - 0.1 + (rnd(i, 12) - 0.5) * 2 * SPREAD * 0.7
    const h = 0.7 + 1.1 * rnd(i, 13)
    beam(q, [fx, y0 + 0.03, fz], [fx, y0 + h, fz], 0.008, shade(STEEL, 0.9))
    block(q, fx - BEAD_R, fx + BEAD_R, fz - BEAD_R, fz + BEAD_R, y0 + h, y0 + h + 2 * BEAD_R, hex('#e8f0f2'))
  }
}

export function fontaineRoseauxArgent(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, R, R, draw)
}
