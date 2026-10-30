import type { MeshBuilder } from '../../../buildings.ts'
import { type Rgb } from '../../../models.ts'
import { block, hex, lathe, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { fitted } from '../palaces/common.ts'
import { FIXED, UV } from './common.ts'
import { basin, circle, G, set, sittingLion, spout } from './plaza-common.ts'

/*
 * THE FONTAINE DU CHÂTEAU-D'EAU (Gabriel Davioud, for Haussmann), on the Place du Château-d'Eau until the Monument à la
 * République took its place in 1880 and on the Place Félix-Éboué (Daumesnil) since: the wide round pool (OSM way 78008833, 29.7 m
 * across), three broad round steps, a ring of short columns under a wide tazza and a smaller tazza on a turned stem above it with
 * the plume at its top; and round it, on four stone piers, two by two, the bronze LIONS spitting long arcs into the pool. How
 * many lions and their arrangement are from a Commons photograph (Fontaine du Château d'eau (Gabriel Davioud), 2010-04-18 72.jpg)
 * and an old print of the fountain (Ancienne Fontaine du Château d'eau - Place Daumesnil), not from a text: the piers on the
 * diagonals, two lions on each, is what they show of a quarter of it. Proportions by eye from them.
 */
const STONE: Rgb = hex('#d6d0c1')
const PALE: Rgb = hex('#e1dccf')
const BRONZE: Rgb = hex('#47635a')
const WATER: Rgb = hex('#5f8a9a')
const SPRAY: Rgb = hex('#dbe8ec')

const R = 15.2

function pier(q: MeshBuilder): void {
  // (drawn out along +z from the steps; the two lions on it look out at an angle to each other)
  block(q, -2.1, 2.1, 5.4, 8.4, 0, G + 1.9, STONE)
  block(q, -2.3, 2.3, 5.2, 8.6, G + 1.9, G + 2.15, PALE)
  // the sloped buttress of the pier, down from the steps to the pool
  q.quad([[-1.6, 0, 8.4], [1.6, 0, 8.4], [1.6, G + 1.7, 8.4], [-1.6, G + 1.7, 8.4]], [0, 0, 1], UV, shade(STONE, 0.95), FIXED)
  block(q, -1.5, 1.5, 8.4, 9.2, 0, G + 0.7, shade(STONE, 0.92))
  for (const s of [-1, 1]) {
    set(q, s * 1.1, G + 2.15, 6.9, s * 0.42, 2.45, (m) => sittingLion(m, BRONZE))
    const dx = Math.sin(s * 0.42)
    const dz = Math.cos(s * 0.42)
    spout(q, [s * 1.1 + dx * 1.0, G + 4.0, 6.9 + dz * 1.0], [s * 1.1 + dx * 6.4, G + 0.25, 6.9 + dz * 6.4], 0.65, 0.05, SPRAY)
  }
}

function draw(q: MeshBuilder): void {
  basin(q, circle(R, 40), circle(R - 0.5, 40), 0, G + 0.42, STONE, WATER)
  // the three steps of water, round
  lathe(q, 0, 0, [[6.2, 0], [6.2, G + 0.72], [5.2, G + 0.72], [5.2, G + 1.34], [4.2, G + 1.34], [4.2, G + 1.96], [3.2, G + 1.96], [3.2, G + 2.5], [0.01, G + 2.5]], 28, STONE)
  // the ring of columns under the wide tazza, its drum inside
  const y0 = G + 2.5
  lathe(q, 0, 0, [[1.7, y0], [1.7, y0 + 1.9]], 16, shade(STONE, 0.82))
  for (let i = 0; i < 8; i++) {
    const a = ((i + 0.5) / 8) * Math.PI * 2
    lathe(q, Math.sin(a) * 2.25, Math.cos(a) * 2.25, [[0.26, y0], [0.16, y0 + 0.4], [0.17, y0 + 1.6], [0.3, y0 + 1.9]], 8, PALE)
  }
  // the wide tazza
  const y1 = y0 + 1.9
  lathe(q, 0, 0, [[0.5, y1], [2.8, y1 + 0.05], [3.1, y1 + 0.55], [3.1, y1 + 0.75]], 28, PALE)
  lathe(q, 0, 0, [[2.85, y1 + 0.68], [0.01, y1 + 0.68]], 24, WATER)
  // the stem and the small tazza
  lathe(q, 0, 0, [[0.62, y1 + 0.68], [0.34, y1 + 1.0], [0.48, y1 + 1.35], [0.26, y1 + 1.65], [0.22, y1 + 2.35], [0.42, y1 + 2.75]], 12, STONE)
  const y2 = y1 + 2.75
  lathe(q, 0, 0, [[0.42, y2], [1.05, y2 + 0.05], [1.3, y2 + 0.42], [1.3, y2 + 0.55]], 20, PALE)
  lathe(q, 0, 0, [[1.1, y2 + 0.5], [0.01, y2 + 0.5]], 16, WATER)
  lathe(q, 0, 0, [[0.2, y2 + 0.5], [0.14, y2 + 0.9], [0.28, y2 + 1.15], [0.05, y2 + 1.5]], 8, STONE)
  // the plume at the top, standing still
  lathe(q, 0, 0, [[0.05, y2 + 1.5], [0.18, y2 + 2.1], [0.13, y2 + 2.9], [0.02, y2 + 3.4]], 8, SPRAY)
  // the piers on the diagonals
  for (let k = 0; k < 4; k++) set(q, 0, 0, 0, Math.PI / 4 + (k * Math.PI) / 2, 1, pier)
}

export function fontaineChateauEau(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, R, R, draw)
}
