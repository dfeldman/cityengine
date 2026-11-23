import type { MeshBuilder } from '../../../../buildings.ts'
import { type Rgb } from '../../../../models.ts'
import { beam, block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'
import { plaque } from './monument-kit.ts'

/*
 * THE FONTAINE DE PARADIS (rue des Francs-Bourgeois at the rue des Archives, 3e; Augustin Guillain 1636, rebuilt by
 * Beausire 1705; Wikidata Q3076159): a dry wall fountain, a scallop-headed niche in the rounded SW corner pavilion of the
 * Hôtel de Soubise (the Archives nationales). Above the niche a long dedication plaque; under it a plain panel. Nothing is
 * sculpted (the shell is architecture), so there is no Modly piece. Frame: −z the front (faces SW, bearing ~223°), x across,
 * y up, pavement at G. The host building is OSM way 6742329 and is left to draw itself: the model starts at its face
 * (z = WALL_Z); the niche back stands NICHE_BACK in front of it so a shop board cannot show through.
 * Sizes are read off Commons photographs (Fontaine de Paradis Paris 3e 002/003, 2011) against the poster door (~2.6 m),
 * not surveyed; the sill height (~3.6 m) is the shakiest figure.
 */
export const HX = 2.2
export const HZ = 1.0

// tunables
const WALL_Z = 0.5          // the host wall's face
const NICHE_BACK = 0.55     // niche back in front of the wall (clears shop boards)
const FRAME_T = 0.35        // how far the moulded frame stands proud of the back plate
const NICHE_R = 1.1         // half-width of the opening = shell radius
const SILL = 3.6            // niche floor height above G
const SPRING = 4.4          // shell springing
const SURROUND = 0.35       // width of the frame round the opening
const PLAQUE_W = 2.3
const PLAQUE_H = 0.85
const PLAQUE_GAP = 0.45     // between the arch crown and the plaque
const PANEL_TOP = 3.2       // plain panel under the sill
const PANEL_BOT = 1.2

const STONE: Rgb = hex('#cfc4a8')
const PALE: Rgb = hex('#ddd3ba')
const DARK: Rgb = hex('#b3a78d')

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  const zb = WALL_Z - NICHE_BACK            // niche back plane
  const zf = zb - FRAME_T                   // frame front
  const W = NICHE_R + SURROUND
  const crown = SPRING + NICHE_R

  // back plate behind the opening and its frame, up to over the arch
  block(q, -W, W, zb, WALL_Z, y(SILL - 0.3), y(crown + SURROUND), shade(STONE, 0.93))
  // the niche's own back (slightly darker, a hair in front of the plate)
  block(q, -NICHE_R, NICHE_R, zb - 0.04, zb, y(SILL), y(SPRING), shade(STONE, 0.78))
  // jambs of the frame
  for (const sx of [-1, 1]) {
    block(q, sx > 0 ? NICHE_R : -W, sx > 0 ? W : -NICHE_R, zf, zb, y(SILL - 0.3), y(SPRING), STONE)
  }
  // the arch ring: stepped blocks over the half-circle, outer radius NICHE_R + SURROUND
  const N = 26
  for (let i = 0; i < N; i++) {
    const xa = -W + (2 * W * i) / N, xb = -W + (2 * W * (i + 1)) / N, xm = (xa + xb) / 2
    const ro = Math.sqrt(Math.max(0, W * W - xm * xm))
    const ri = Math.abs(xm) < NICHE_R ? Math.sqrt(Math.max(0, NICHE_R * NICHE_R - xm * xm)) : 0
    block(q, xa, xb, zf, zb, y(SPRING + ri), y(SPRING + ro), STONE)
  }
  // the shell: ribs fanning from the springing centre over the niche's back
  for (let i = 0; i <= 10; i++) {
    const a = (i / 10) * Math.PI
    beam(q, [0, y(SPRING), zb - 0.05], [Math.cos(a) * (NICHE_R - 0.04), y(SPRING + Math.sin(a) * (NICHE_R - 0.04)), zb - 0.05], 0.04, shade(STONE, 1.08))
  }
  block(q, -NICHE_R, NICHE_R, zb - 0.1, zb - 0.04, y(SPRING - 0.06), y(SPRING + 0.03), PALE)
  // the sill: a moulded ledge across the foot of the niche, running out past the frame
  block(q, -W - 0.15, W + 0.15, zf - 0.2, WALL_Z, y(SILL - 0.3), y(SILL - 0.1), PALE)
  block(q, -W - 0.05, W + 0.05, zf - 0.1, WALL_Z, y(SILL - 0.1), y(SILL), shade(PALE, 1.03))
  // the plain panel under the sill, its raised frame
  block(q, -W, W, WALL_Z - 0.14, WALL_Z, y(PANEL_BOT), y(PANEL_TOP), DARK)
  block(q, -W + 0.2, W - 0.2, WALL_Z - 0.19, WALL_Z - 0.14, y(PANEL_BOT + 0.2), y(PANEL_TOP - 0.2), shade(STONE, 0.88))
  // the dedication plaque over the arch
  const py = crown + SURROUND + PLAQUE_GAP
  block(q, -PLAQUE_W / 2 - 0.35, PLAQUE_W / 2 + 0.35, WALL_Z - 0.2, WALL_Z, y(py - 0.25), y(py + PLAQUE_H + 0.25), shade(PALE, 0.98))
  plaque(q, { x: 0, z: WALL_Z - 0.2, y0: y(py), w: PLAQUE_W, h: PLAQUE_H, panel: shade(STONE, 0.85), frame: DARK, fw: 0.05, letters: shade(STONE, 0.5), lines: [0.9, 0.95, 0.8, 0.9] })
}

export function fontaineParadis(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
