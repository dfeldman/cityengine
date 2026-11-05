/**
 * THE JARDIN D'AGRONOMIE TROPICALE (the 1907 colonial exhibition garden, east edge of the Bois):
 * - the PORTE CHINOISE, the garden's gate of honour: four lacquered posts, faded to a pinkish red, carrying carved
 *   lintel panels, a tall central bay under its own curved tiled roof and two lower side roofs;
 * - the TEMPLE DU SOUVENIR INDOCHINOIS: a red lacquered square pavilion on a stone podium with front steps and grey
 *   metal balustrades, a red-columned veranda, a gilt roundel on the front wall, a tiled hip roof with upturned corners;
 * - the PAVILLON DE L'INDOCHINE: a long white rendered hall banded in red-brown courses, arched windows, a low metal
 *   roof, and a ribbed glass dome on an octagonal drum over its entrance bay.
 * Plans: OSM w318109630 (gate), w62819535 (temple), w108487691 (pavillon); temple front from the OSM steps toward the
 * Esplanade du Dinh. Refs: Commons (docs/landmarks/refs/vincennes/agronomie/). Local frame: front at −z.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { box, prism } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { block, dome, hex, type Rgb } from '../../kit.ts'
import { quadN } from '../venues/bowl.ts'

const LACQUER: Rgb = hex('#a3262a'), FADED: Rgb = hex('#a86a62'), PANEL: Rgb = hex('#c4b2a8'), TILE: Rgb = hex('#5c625a'),
  TILE_D: Rgb = hex('#4a4f49'), GOLD: Rgb = hex('#d4a640'), STONE: Rgb = hex('#b9b2a4'), RAIL: Rgb = hex('#6c7270'),
  WHITE: Rgb = hex('#e8e2d4'), BAND: Rgb = hex('#9a5040'), DARK: Rgb = hex('#3a4048'), ZINC: Rgb = hex('#8a9094'),
  GLASS: Rgb = hex('#a4b0b2')
const STUCCO = surfaceTag('stucco')

/** A hip roof over [−hx,hx]×[−hz,hz] whose eave corners curl up by `lift`; the ridge runs along x, half-length hl. */
function curledRoof(out: MeshBuilder, cx: number, hx: number, hz: number, yE: number, yR: number, hl: number,
                    lift: number, c: Rgb, c2: Rgb): void {
  const e = (sx: number, sz: number): [number, number, number] => [cx + sx * hx, yE + lift, sz * hz]
  const m = (sx: number, sz: number, f: number): [number, number, number] => [cx + sx * hx * f, yE, sz * hz]
  const ra: [number, number, number] = [cx - hl, yR, 0], rb: [number, number, number] = [cx + hl, yR, 0]
  // long faces in two quads each (corner to mid), so the corners rise while the middle of the eave stays low
  for (const sz of [-1, 1]) {
    quadN(out, [e(-1, sz), m(-1, sz, 0.4), ra, ra], [0, 1, sz], sz < 0 ? c : c2)
    quadN(out, [m(-1, sz, 0.4), m(1, sz, 0.4), rb, ra], [0, 1, sz], sz < 0 ? c : c2)
    quadN(out, [m(1, sz, 0.4), e(1, sz), rb, rb], [0, 1, sz], sz < 0 ? c : c2)
  }
  for (const sx of [-1, 1]) quadN(out, [e(sx, -1), e(sx, 1), sx < 0 ? ra : rb, sx < 0 ? ra : rb], [sx, 1, 0], c2)
  block(out, cx - hl - 0.1, cx + hl + 0.1, -0.15, 0.15, yR - 0.1, yR + 0.3, TILE_D)      // ridge
}

// the gate: post x positions, heights; roofs (half width, eave, ridge)
const G_POSTS = [-3.5, -1.4, 1.4, 3.5], G_POST_R = 0.2, G_SIDE_H = 5.2, G_MID_H = 6.6
const G_MID_ROOF: [number, number, number] = [2.4, 6.9, 7.9], G_SIDE_ROOF: [number, number, number] = [1.5, 5.4, 6.2]

export function porteChinoise(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0
  G_POSTS.forEach((x) => {
    const h = Math.abs(x) < 2 ? G_MID_H : G_SIDE_H
    block(out, x - 0.35, x + 0.35, -0.35, 0.35, y, y + 0.5, STONE)                       // plinth
    prism(out, x, 0, y + 0.5, y + h + 0.4, G_POST_R, 8, FADED)
  })
  // lintels and carved panels: the central bay two beams with a panel between, the side bays one each
  block(out, -1.6, 1.6, -0.18, 0.18, y + 4.0, y + 4.3, FADED)
  block(out, -1.4, 1.4, -0.12, 0.12, y + 4.3, y + 5.4, PANEL)
  block(out, -1.6, 1.6, -0.2, 0.2, y + 5.4, y + 5.7, FADED)
  block(out, -0.9, 0.9, -0.14, 0.14, y + 5.7, y + 6.6, PANEL)                             // the name tablet
  for (const s of [-1, 1]) {
    block(out, s * 1.4, s * 3.6, -0.16, 0.16, y + 3.4, y + 3.65, FADED)
    block(out, s * 1.4, s * 3.5, -0.1, 0.1, y + 3.65, y + 4.5, PANEL)
    block(out, s * 1.4, s * 3.7, -0.18, 0.18, y + 4.5, y + 4.8, FADED)
    curledRoof(out, s * 2.45, G_SIDE_ROOF[0], 0.75, y + G_SIDE_ROOF[1], y + G_SIDE_ROOF[2], 0.9, 0.35, TILE, TILE_D)
  }
  curledRoof(out, 0, G_MID_ROOF[0], 0.9, y + G_MID_ROOF[1], y + G_MID_ROOF[2], 1.4, 0.4, TILE, TILE_D)
}

// the temple: podium, cella, veranda columns, roof
const T_POD = 1.2, T_POD_H = 5, T_CELL = 2.8, T_COL = 3.9, T_WALL = 3.6, T_EAVE = 4.1, T_RIDGE = 6.4, T_OVER = 4.9

export function templeIndochinois(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0, yt = y + T_POD
  box(out, 0, y + T_POD / 2, 0, T_POD_H, T_POD / 2, T_POD_H, STONE, STUCCO)
  for (let i = 0; i < 5; i++) {                                                              // front steps
    const t = (i + 1) / 5
    box(out, 0, y + T_POD * t / 2, -T_POD_H - 2.0 + i * 0.4, 3.2, T_POD * t / 2, 0.2 + (4 - i) * 0.2 + 0.01, STONE, STUCCO)
  }
  for (const [x0, x1] of [[-T_POD_H, -3.3], [3.3, T_POD_H]] as const) block(out, x0, x1, -T_POD_H, -T_POD_H + 0.1, yt, yt + 1, RAIL)
  for (const s of [-1, 1]) block(out, s * T_POD_H - 0.05, s * T_POD_H + 0.05, -T_POD_H, T_POD_H, yt, yt + 1, RAIL)
  block(out, -T_CELL, T_CELL, -T_CELL, T_CELL, yt, yt + T_WALL, LACQUER)                     // the cella
  box(out, 0, yt + 1.9, -T_CELL - 0.04, 1.0, 1.0, 0.04, GOLD)                                // the gilt roundel
  box(out, 0, yt + 1.9, -T_CELL - 0.06, 0.75, 0.12, 0.03, LACQUER)
  for (const dy of [-0.45, 0.45]) box(out, 0, yt + 1.9 + dy, -T_CELL - 0.06, 0.55, 0.08, 0.03, LACQUER)
  for (const a of [-T_COL, -T_COL / 3, T_COL / 3, T_COL]) for (const b of [-T_COL, T_COL]) {
    prism(out, a, b, yt, yt + T_WALL + 0.4, 0.2, 8, LACQUER)
    if (Math.abs(a) > T_COL - 0.1) prism(out, b, a, yt, yt + T_WALL + 0.4, 0.2, 8, LACQUER)
  }
  block(out, -T_COL - 0.2, T_COL + 0.2, -T_COL - 0.2, T_COL + 0.2, yt + T_WALL + 0.2, yt + T_EAVE, LACQUER)
  curledRoof(out, 0, T_OVER, T_OVER, yt + T_EAVE, y + T_POD + T_RIDGE, 1.6, 0.6, TILE, TILE_D)
}

// the pavillon: wall height, band spacing, roof, the domed bay at +x
const V_WALL = 6.5, V_BAND = 0.9, V_ROOF = 8, V_BAY = 9, V_BAY_H = 8, V_DOME_R = 4.2, V_DRUM = 1.6, V_DOME_H = 4

export function pavillonIndochine(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0, hx = fit.hx, hz = fit.hz, bx = hx - V_BAY / 2
  box(out, 0, y + V_WALL / 2, 0, hx, V_WALL / 2, hz, WHITE, STUCCO)
  box(out, bx, y + V_BAY_H / 2, 0, V_BAY / 2 + 0.3, V_BAY_H / 2, hz + 0.3, WHITE, STUCCO)
  for (let b = 1; b * V_BAND < V_WALL; b++) {                                                // the red-brown courses
    const yy = y + b * V_BAND
    block(out, -hx - 0.04, hx + 0.04, -hz - 0.04, hz + 0.04, yy, yy + 0.1, BAND)
    block(out, bx - V_BAY / 2 - 0.34, bx + V_BAY / 2 + 0.34, -hz - 0.34, hz + 0.34, yy, yy + 0.1, BAND)
  }
  for (let x = -hx + 2.5; x < bx - V_BAY / 2 - 1; x += 3.2) for (const s of [-1, 1]) {      // arched windows
    block(out, x - 0.7, x + 0.7, s * (hz + 0.06) - 0.03, s * (hz + 0.06) + 0.03, y + 1.2, y + 4.6, DARK)
    prism(out, x, s * (hz + 0.06), y + 4.6, y + 4.7, 0.7, 10, DARK)
  }
  block(out, bx - 1.4, bx + 1.4, -hz - 0.36, -hz - 0.3, y, y + 5, DARK)                     // the entrance arch
  // the low hip roof, then the drum and the ribbed glass dome over the bay
  const r = (hx2: number, cx: number, y0: number, y1: number, hz2: number): void => {
    quadN(out, [[cx - hx2, y0, -hz2], [cx + hx2, y0, -hz2], [cx + hx2 - (y1 - y0), y1, 0], [cx - hx2 + (y1 - y0), y1, 0]], [0, 1, -1], ZINC)
    quadN(out, [[cx - hx2, y0, hz2], [cx + hx2, y0, hz2], [cx + hx2 - (y1 - y0), y1, 0], [cx - hx2 + (y1 - y0), y1, 0]], [0, 1, 1], ZINC)
    for (const s of [-1, 1]) quadN(out, [[cx + s * hx2, y0, -hz2], [cx + s * hx2, y0, hz2],
      [cx + s * (hx2 - (y1 - y0)), y1, 0], [cx + s * (hx2 - (y1 - y0)), y1, 0]], [s, 1, 0], ZINC)
  }
  r(hx + 0.4, 0, y + V_WALL, y + V_ROOF, hz + 0.4)
  prism(out, bx, 0, y + V_BAY_H, y + V_BAY_H + V_DRUM, V_DOME_R + 0.3, 8, WHITE, STUCCO, V_DOME_R + 0.3, true, Math.PI / 8)
  dome(out, bx, 0, y + V_BAY_H + V_DRUM, V_DOME_R, V_DOME_H, GLASS, 16, ZINC)
}
