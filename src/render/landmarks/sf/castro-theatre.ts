/**
 * THE CASTRO THEATRE, 429 Castro Street (Timothy Pflueger, 1922; way/1206216224), from a Mapillary frame on Castro
 * Street (2026-10-04, the Market Street audit): a cream Spanish Colonial Baroque front — a tall round-arched window
 * framed in carved ornament under a scrolled, curving gable — the great red vertical blade sign spelling CASTRO in
 * white letters (neon at night), and over the doors the red-and-white marquee with its letter boards; the lobby front in
 * dark red and blue. The auditorium behind is a plain box. Was the b5 batch's blind recipe ("No photograph").
 * Local frame: the street front on +z (`front: "street"`).
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'
import { tower } from '../tower.ts'
import { signText, edgeAt, edgeFacing, boxAlong } from '../parts.ts'
import { towerRing } from '../tower.ts'
import { surfaceTag } from '../../cartoon-material.ts'

const CREAM: Rgb = [0.88, 0.85, 0.77]
const RED: Rgb = [0.66, 0.13, 0.12]

export function castroTheatre(out: MeshBuilder, fit: Fit): void {
  const H = fit.height > 15 && fit.height < 35 ? fit.height : 20
  tower(out, { ...fit, height: H }, {
    height: H,
    base: { height: 5, face: { kind: 'curtain', material: 'stucco', wall: [0.42, 0.12, 0.13], glass: [0.2, 0.15, 0.15], pitch: 3, floor: 5 } },
    tiers: [{ to: H, face: { kind: 'blank', material: 'stucco', wall: CREAM } }],
    roof: [0.5, 0.48, 0.45],
  })
  const ring = towerRing(fit)
  const e = edgeAt(ring, edgeFacing(ring))
  const st = surfaceTag('stucco')
  // a box on the street front: u along it from its middle, y up, `o` out, w × h × d
  const on = (u: number, y: number, o: number, w: number, h: number, d: number, c: Rgb, tag = st): void =>
    boxAlong(out, e.mid.x + e.tx * u + e.nx * o, y, e.mid.z + e.tz * u + e.nz * o, w / 2, h / 2, d / 2, e.heading, c, tag)
  const W = Math.min(e.L * 0.6, 16)
  // the frontispiece, stood forward of the wall, and its scrolled gable rising over the roof
  on(0, (5 + H) / 2, 0.4, W, H - 5, 0.8, CREAM)
  for (let k = 0; k < 6; k++) {
    const t = k / 6
    on(0, H + 0.6 + k * 0.9, 0.4, W * (1 - t * 0.75), 0.9, 0.8, CREAM)
  }
  on(0, H + 6.3, 0.45, 1.4, 1.2, 0.7, CREAM)
  // the great arched window: dark glass, a carved frame, the arch head stepped in
  on(0, 11.5, 0.85, W * 0.36, 11, 0.1, [0.32, 0.36, 0.4], surfaceTag('glass'))
  for (let k = 0; k < 4; k++) on(0, 17 + k * 0.5, 0.86, W * 0.36 * (1 - (k + 1) * 0.2), 0.5, 0.12, CREAM)
  for (const s of [-1, 1]) on(s * W * 0.22, 11.5, 0.9, 0.6, 12, 0.3, [0.8, 0.77, 0.68])
  // ornament: carved bands either side, pilasters at the frontispiece's edges
  for (const s of [-1, 1]) for (let y = 6; y < H; y += 1.6) on(s * W * 0.38, y, 0.85, 1.6, 0.6, 0.2, [0.8, 0.76, 0.66])
  // the marquee: a red box with white letter boards on its face and sides, over the doors
  on(0, 5.8, 1.6, W * 0.85, 1.6, 2.4, RED, surfaceTag('metal'))
  on(0, 5.8, 2.82, W * 0.8, 1.1, 0.04, [0.95, 0.94, 0.9], 0)
  // the blade sign: CASTRO down a red board standing out from the front, letters on both faces
  const bu = -W * 0.42
  const by = 15, bh = 13
  const bx = e.mid.x + e.tx * bu + e.nx * 2.4, bz = e.mid.z + e.tz * bu + e.nz * 2.4
  // (turned a quarter: the board is edge-on to the wall, its faces up and down the street)
  boxAlong(out, bx, by, bz, 0.25, bh / 2, 1.6, e.heading, RED, surfaceTag('metal'))
  boxAlong(out, bx, by + bh / 2 + 0.6, bz, 0.22, 0.6, 1.0, e.heading, [0.1, 0.45, 0.6], surfaceTag('metal'))
  for (const s of [-1, 1]) {
    const hd = e.heading + (s * Math.PI) / 2
    const fx = bx + Math.sin(hd) * 0.27, fz = bz + Math.cos(hd) * 0.27
    signText(out, 'CASTRO', fx, by, fz, 1.55, [0.98, 0.95, 0.88], { lit: true, vertical: true, heading: hd })
  }

}

/**
 * THE VOGUE THEATRE (1912, Sacramento Street), way/263646726 — a generic Victorian (historic census, 2026-10-04).
 * Mapillary on Sacramento: a cream Art Deco front stepped up in piers, a tall brown VOGUE blade sign over the
 * marquee, a streamlined canopy over the doors. Front 171: the bearing to Sacramento Street.
 */
export function vogueTheatre(out: MeshBuilder, fit: Fit): void {
  const CREAM: Rgb = [0.86, 0.83, 0.74], BROWN: Rgb = [0.36, 0.25, 0.2]
  tower(out, fit, {
    height: 9,
    tiers: [{ to: 9, face: { kind: 'blank', wall: CREAM, material: 'stucco' } }],
    roof: [0.5, 0.48, 0.45],
  })
  const ring = towerRing(fit)
  const e = edgeAt(ring, edgeFacing(ring))
  const st = surfaceTag('stucco')
  const on = (u: number, y: number, o: number, w: number, h: number, d: number, c: Rgb, tag = st): void =>
    boxAlong(out, e.mid.x + e.tx * u + e.nx * o, y, e.mid.z + e.tz * u + e.nz * o, w / 2, h / 2, d / 2, e.heading, c, tag)
  // the stepped piers of the front, rising over the roofline
  for (const [u, h] of [[-4.5, 11], [-1.5, 12.5], [1.5, 12.5], [4.5, 11]] as [number, number][]) on(u, h / 2, 0.3, 1.2, h, 0.6, CREAM)
  // the doors and the canopy over them, the marquee board above
  on(0, 1.6, 0.05, 6, 3.2, 0.1, [0.18, 0.17, 0.17], 0)
  on(0, 3.9, 1.6, 8, 0.6, 3.2, [0.6, 0.55, 0.48])
  on(0, 5.4, 0.7, 6, 1.6, 0.4, [0.92, 0.9, 0.84], surfaceTag('metal'))
  // the blade sign, edge-on to the street, VOGUE down both faces
  const bx = e.mid.x + e.nx * 1.4, bz = e.mid.z + e.nz * 1.4
  boxAlong(out, bx, 10, bz, 0.25, 4, 1.0, e.heading, BROWN, surfaceTag('metal'))
  for (const s of [-1, 1]) {
    const hd = e.heading + (s * Math.PI) / 2
    signText(out, 'VOGUE', bx + Math.sin(hd) * 0.27, 10, bz + Math.cos(hd) * 0.27, 1.3, [0.95, 0.9, 0.75], { lit: true, vertical: true, heading: hd })
  }
}

/**
 * THE CURRAN THEATRE (1922), Geary Street — "rule 8: medium building → tenement" had made it an apartment block
 * (2026-10-04). Mapillary on Geary: buff brick framed in cream stone, tall round-arched windows across the front, a
 * cornice, the pink CURRAN blade sign over a dark marquee. Front 351, the bearing to Geary.
 */
export function curranTheatre(out: MeshBuilder, fit: Fit): void {
  const BUFF: Rgb = [0.78, 0.66, 0.5], STONE: Rgb = [0.88, 0.84, 0.75]
  tower(out, fit, {
    height: 21,
    base: { height: 5, face: { kind: 'punched', wall: STONE, glass: [0.15, 0.14, 0.14], pitch: 4, floor: 5, solid: 0.5, material: 'ashlar' } },
    tiers: [{ to: 21, face: { kind: 'punched', wall: BUFF, glass: [0.2, 0.2, 0.22], pitch: 5.5, floor: 13, solid: 0.6, arched: true, material: 'brick' }, cornice: { depth: 0.8, height: 0.8, colour: STONE } }],
    roof: [0.5, 0.48, 0.45],
  })
  const ring = towerRing(fit)
  const e = edgeAt(ring, edgeFacing(ring))
  const on = (u: number, y: number, o: number, w: number, h: number, d: number, c: Rgb, tag = 0): void =>
    boxAlong(out, e.mid.x + e.tx * u + e.nx * o, y, e.mid.z + e.tz * u + e.nz * o, w / 2, h / 2, d / 2, e.heading, c, tag)
  on(0, 4.6, 1.4, e.L * 0.7, 1.2, 2.8, [0.15, 0.14, 0.14], surfaceTag('metal'))
  const u = e.L * 0.3, bx = e.mid.x + e.tx * u + e.nx * 1.3, bz = e.mid.z + e.tz * u + e.nz * 1.3
  boxAlong(out, bx, 13, bz, 0.25, 5.5, 1.0, e.heading, [0.9, 0.72, 0.74], surfaceTag('metal'))
  for (const s of [-1, 1]) {
    const hd = e.heading + (s * Math.PI) / 2
    signText(out, 'CURRAN', bx + Math.sin(hd) * 0.27, 13, bz + Math.cos(hd) * 0.27, 1.5, [0.38, 0.18, 0.25], { vertical: true, heading: hd })
  }
}

export const CASTRO_THEATRE: Record<string, (out: MeshBuilder, fit: Fit) => void> = { castroTheatre, vogueTheatre, curranTheatre }
