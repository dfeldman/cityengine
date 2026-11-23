import type { MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { block, hex, shade, beam } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'

/*
 * LES TOMBES DE LA FONTAINE ET DE MOLIÈRE (Père-Lachaise, division 25; Wikidata Q3323381 and Q3323385, both at
 * 48.86111, 2.39489; moved here together in 1817). Two matching pale-limestone trough sarcophagi side by side on
 * stepped plinths, a tilted inscription plaque on a corbel at the front end, the poet's name cut along the lip and a dark
 * bronze panel low on the side, behind a low iron rail. La Fontaine's (west, −x) and Molière's (east, +x) differ only in
 * the lettering, which is not drawn. No OSM building way; all dimensions estimated by eye from Commons photographs
 * (Tombe la fontaine.jpg, Paris Père Lachaise La Fontaine et Molière.JPG) against the ~1.4 m bar height, not surveyed.
 * Frame: −z the plaque/path end, x across, y up from the ground (G).
 */
export const HX = 3.4
export const HZ = 1.9

// tunables (metres)
const GAP_X = 1.75                                       // tomb centres at ±GAP_X
const PL_W = 0.62, PL_L = 1.1, PL_H = 0.32               // plinth half-width, half-length, first course height
const PL2_W = 0.5, PL2_L = 0.98, PL2_H = 0.38            // second course
const TUB_L = 0.95, TUB_W0 = 0.36, TUB_W1 = 0.52, TUB_H = 0.62  // tub half-length; half-width at bottom/top; height
const LID = 0.12, LID_OUT = 0.07                         // lip slab thickness and overhang
const PLQ_W = 0.32, PLQ_H = 0.42, PLQ_OUT = 0.1          // plaque half-width, height, projection
const RAIL_H = 0.7, RAIL_PITCH = 0.14                    // iron rail height and bar pitch

const STONE: Rgb = hex('#cfc8b4')
const STONE_D: Rgb = hex('#aaa28c')
const LIP: Rgb = hex('#8e8a78')
const BRONZE: Rgb = hex('#2c2a27')
const IRON: Rgb = hex('#1d1e20')
const GROUND: Rgb = hex('#8a8466')

/** One trough sarcophagus on two plinth courses, centred on cx. */
function sarcophagus(q: MeshBuilder, cx: number): void {
  const y = (v: number): number => G + v
  block(q, cx - PL_W, cx + PL_W, -PL_L, PL_L, y(0), y(PL_H), shade(STONE, 0.93))
  block(q, cx - PL2_W, cx + PL2_W, -PL2_L, PL2_L, y(PL_H), y(PL_H + PL2_H), STONE)
  const y0 = PL_H + PL2_H
  const N = 6                                              // flared tub in slices, narrow below, wide at the lip
  for (let i = 0; i < N; i++) {
    const t0 = i / N, t1 = (i + 1) / N
    const w = TUB_W0 + (TUB_W1 - TUB_W0) * Math.pow(t1, 1.6)
    const l = TUB_L - 0.12 * (1 - t1)                       // ends bulge slightly
    block(q, cx - w, cx + w, -l, l, y(y0 + t0 * TUB_H), y(y0 + t1 * TUB_H + 0.004), i % 2 ? STONE : shade(STONE, 0.97))
  }
  const yt = y0 + TUB_H
  block(q, cx - TUB_W1 - LID_OUT, cx + TUB_W1 + LID_OUT, -TUB_L - LID_OUT, TUB_L + LID_OUT, y(yt), y(yt + LID), LIP)
  // dark bronze panel low on each long side, and the name band along the lip face
  for (const s of [-1, 1]) {
    const wx = TUB_W0 + (TUB_W1 - TUB_W0) * 0.25 + 0.01
    block(q, s < 0 ? cx - wx - 0.02 : cx + wx - 0.01, s < 0 ? cx - wx + 0.01 : cx + wx + 0.02, -0.6, 0.6, y(y0 + 0.08), y(y0 + 0.34), BRONZE)
    block(q, s < 0 ? cx - TUB_W1 - LID_OUT - 0.012 : cx + TUB_W1 + LID_OUT, s < 0 ? cx - TUB_W1 - LID_OUT : cx + TUB_W1 + LID_OUT + 0.012, -0.55, 0.55, y(yt + 0.03), y(yt + LID - 0.03), STONE_D)
  }
  // inscription plaque on a corbel at the front (−z) end
  const zf = -(TUB_L - 0.12 * 0) - 0.02
  block(q, cx - 0.2, cx + 0.2, zf - 0.14, zf + 0.04, y(yt - 0.24), y(yt - 0.06), STONE)               // corbel
  block(q, cx - PLQ_W, cx + PLQ_W, zf - PLQ_OUT, zf, y(yt - 0.14), y(yt - 0.14 + PLQ_H), shade(STONE, 1.05))
  block(q, cx - PLQ_W + 0.05, cx + PLQ_W - 0.05, zf - PLQ_OUT - 0.008, zf - PLQ_OUT, y(yt - 0.1), y(yt - 0.14 + PLQ_H - 0.04), STONE_D)  // lettered field
}

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  block(q, -HX, HX, -HZ, HZ, y(-0.02), y(0.03), GROUND)
  sarcophagus(q, -GAP_X)
  sarcophagus(q, GAP_X)
  // low iron rail across the front, 2 m ahead of the plaques
  const zr = -HZ + 0.35
  const n = Math.round((2 * (HX - 0.4)) / RAIL_PITCH)
  for (let i = 0; i <= n; i++) { const x = -HX + 0.4 + (i * 2 * (HX - 0.4)) / n; beam(q, [x, y(0), zr], [x, y(RAIL_H), zr], 0.01, IRON) }
  beam(q, [-HX + 0.4, y(RAIL_H), zr], [HX - 0.4, y(RAIL_H), zr], 0.016, IRON)
  beam(q, [-HX + 0.4, y(0.12), zr], [HX - 0.4, y(0.12), zr], 0.014, IRON)
}

export function tombeLaFontaineMoliere(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
