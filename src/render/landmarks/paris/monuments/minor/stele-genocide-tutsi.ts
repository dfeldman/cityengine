import type { MeshBuilder } from '../../../../buildings.ts'
import type { Rgb } from '../../../../models.ts'
import { block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'
import { plaque } from './monument-kit.ts'

/*
 * LA STELE A LA MEMOIRE DES VICTIMES DU GENOCIDE DES TUTSI AU RWANDA (Père-Lachaise, division 88; Wikidata Q96080492
 * carries the label of the Abdellys stele, but the point and Commons "Division 88 - Rwanda genocide memorial 01-06" agree
 * on this one): a pale limestone stele, a low plinth, a wide panel with a gently arched top flanked by two square
 * shoulders with projecting caps, and a tan engraved plaque ("En 1994 au Rwanda plusieurs centaines de milliers de Tutsi
 * ont été victimes d'un génocide / Cette stèle est dédiée à leur mémoire"). Sizes estimated against the hedge and the
 * flowers in the photos (~1.5 m wide, ~1.1 m high). Frame: −z the inscribed front, x across, y up from the ground (G).
 */
export const HX = 1.2
export const HZ = 0.7

// tunables (metres)
const BASE_HW = 0.98, BASE_HD = 0.3, BASE_H = 0.12     // low plinth
const BODY_HW = 0.8, BODY_HD = 0.15, BODY_H = 0.86     // the panel's straight sides
const ARCH_RISE = 0.13, ARCH_SLICES = 14               // the arched top
const SH_W = 0.17, SH_HD = 0.18, SH_H = 0.8            // shoulders each side
const CAP_OVER = 0.04, CAP_H = 0.06                    // shoulder cap overhang
const PLQ_W = 1.0, PLQ_H = 0.5, PLQ_Y = 0.25           // engraved plaque (above the plinth top)

const STONE: Rgb = hex('#d9cfba')
const BRONZE: Rgb = hex('#c4ad7e')

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  block(q, -BASE_HW, BASE_HW, -BASE_HD, BASE_HD, y(0), y(BASE_H), shade(STONE, 0.9))
  const y0 = BASE_H
  // central panel: straight to BODY_H, then a segmental arch built from slices
  block(q, -BODY_HW, BODY_HW, -BODY_HD, BODY_HD, y(y0), y(y0 + BODY_H), STONE)
  for (let i = 0; i < ARCH_SLICES; i++) {
    const xa = -BODY_HW + (2 * BODY_HW * i) / ARCH_SLICES, xb = -BODY_HW + (2 * BODY_HW * (i + 1)) / ARCH_SLICES
    const xm = (xa + xb) / 2 / BODY_HW
    block(q, xa, xb, -BODY_HD, BODY_HD, y(y0 + BODY_H), y(y0 + BODY_H + ARCH_RISE * (1 - xm * xm)), STONE)
  }
  // shoulders with caps
  for (const s of [-1, 1]) {
    const xa = s * (BODY_HW - 0.02), xb = s * (BODY_HW - 0.02 + SH_W)
    const x0 = Math.min(xa, xb), x1 = Math.max(xa, xb)
    block(q, x0, x1, -SH_HD, SH_HD, y(y0), y(y0 + SH_H), shade(STONE, 0.97))
    block(q, x0 - (s < 0 ? CAP_OVER : 0), x1 + (s > 0 ? CAP_OVER : 0), -SH_HD - CAP_OVER, SH_HD + CAP_OVER, y(y0 + SH_H), y(y0 + SH_H + CAP_H), shade(STONE, 1.04))
  }
  // engraved plaque on the front of the panel
  plaque(q, { x: 0, z: -BODY_HD + 0.03, y0: y(y0 + PLQ_Y), w: PLQ_W, h: PLQ_H, panel: BRONZE, letters: shade(BRONZE, 0.5), lines: [0.35, 0.5, 0.9, 0.5, 0.7, 0, 0.45, 0.35] })
}

export function steleGenocideTutsi(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
