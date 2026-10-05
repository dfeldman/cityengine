/**
 * HUA ZANG SI, 3134 22nd Street (way/261119353) — a Buddhist temple in an 1890s Gothic Revival church, from the
 * owner's Street View photograph (2026-10-04: "it's really cool"). Was the bake's generic brick box.
 *
 * The whole front is painted RED (fish-scale shingle) with every piece of the Gothic dressing in two greys: a dark
 * rusticated base; a steep Gothic portal up a flight of steps, its pointed arch in a gable flanked by two pinnacles;
 * over it a great ROSE window (a pale wheel, the temple's name across it) and, in the centre gable, a triple lancet.
 * TWIN TOWERS frame the front, each with grey buttress piers up its corners, tall lancets, a triple-lancet belfry
 * under a railed gallery, four corner pinnacles and a slate spire. Front 180: 22nd Street is south.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import type { Rgb } from '../../models.ts'
import { prism, strut } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { tower } from '../tower.ts'
import { boxAlong } from '../parts.ts'
import { frontFrame } from './macang.ts'

const RED: Rgb = [0.82, 0.24, 0.26]
const GREY: Rgb = [0.62, 0.63, 0.65]
const DARKGREY: Rgb = [0.33, 0.34, 0.36]
const SLATE: Rgb = [0.3, 0.32, 0.31]
const GLASS: Rgb = [0.16, 0.17, 0.2]

export function huaZangSi(out: MeshBuilder, fit: Fit): void {
  const G = Math.max(0, fit.grade ?? 0)
  const H = G + 15
  const sh = surfaceTag('clapboard'), st = surfaceTag('ashlar')
  tower(out, fit, {
    height: H,
    base: { height: 2.3, face: { kind: 'blank', wall: DARKGREY, material: 'ashlar' } },
    tiers: [{ to: H, face: { kind: 'punched', wall: RED, glass: GLASS, pitch: 4, solid: 0.75, floor: 6, arched: true, material: 'clapboard' } }],
    roof: SLATE,
    crown: { kind: 'flat' },
  })
  const f = frontFrame(out, fit, G)
  const L = f.L, TW = Math.min(4.2, L * 0.27)
  const lancet = (u: number, y0: number, w: number, h: number, o: number): void => {
    f.on(u, y0 + h / 2, o + 0.03, w + 0.3, h + 0.3, 0.06, GREY, st)
    f.on(u, y0 + (h - w / 2) / 2, o + 0.07, w, h - w / 2, 0.05, GLASS, 0)
    for (let k = 0; k < 3; k++) f.on(u, y0 + h - w / 2 + k * (w / 6) + w / 12, o + 0.07, w * (1 - k / 3), w / 6, 0.05, GLASS, 0)
  }
  // the dark rusticated base across the whole front
  f.on(0, 1.15, 0.15, L, 2.3, 0.3, DARKGREY, st)
  // the centre: the portal up its steps, the rose window, the gable with its triple lancet
  for (let k = 0; k < 6; k++) f.on(0, 0.2 + k * 0.35, 2.4 - k * 0.38, 4.6, 0.35, 0.4, DARKGREY, st)
  f.on(0, 4, 0.35, 4, 6.4, 0.5, DARKGREY, st)
  f.on(0, 2.6, 0.62, 2.2, 3.2, 0.06, GLASS, 0)
  f.tri(-2.3, 2.3, 7.2, 3.6, 0.62, DARKGREY, st)
  f.tri(-1.4, 1.4, 7.4, 2.2, 0.66, GREY, st)
  for (const s of [-1, 1]) {
    const [px, pz] = f.at(s * 2.4, 0.5)
    prism(out, px, pz, G + 2.3, G + 8.8, 0.32, 8, GREY, st)
    prism(out, px, pz, G + 8.8, G + 10.6, 0.36, 8, GREY, st, 0.03)
  }
  const [rx, rz] = f.at(0, 0.08)
  // the rose: a pale wheel in a grey rim, its spokes
  const R = Math.min(2.7, (L - 2 * TW) / 2 - 0.3), ry = 12.2
  for (let k = 0; k < 24; k++) {
    const a0 = (k / 24) * Math.PI * 2, a1 = ((k + 1) / 24) * Math.PI * 2
    const ex = Math.cos(f.heading), ez = -Math.sin(f.heading), nx = Math.sin(f.heading), nz = Math.cos(f.heading)
    const P = (a: number, r: number, o: number): [number, number, number] => [rx + ex * Math.cos(a) * r + nx * o, G + ry + Math.sin(a) * r, rz + ez * Math.cos(a) * r + nz * o]
    out.quad([P(a0, R + 0.35, 0.02), P(a1, R + 0.35, 0.02), P(a1, R, 0.02), P(a0, R, 0.02)].reverse() as [number, number, number][], [nx, 0, nz], [[0, 0], [1, 0], [1, 1], [0, 1]], DARKGREY, 0)
    out.quad([P(a0, R, 0.04), P(a1, R, 0.04), P(a1, 0, 0.04), P(a0, 0, 0.04)].reverse() as [number, number, number][], [nx, 0, nz], [[0, 0], [1, 0], [1, 1], [0, 1]], [0.86, 0.86, 0.84], 0)
  }
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI, ex = Math.cos(f.heading), ez = -Math.sin(f.heading)
    const dx = ex * Math.cos(a) * R, dz = ez * Math.cos(a) * R, dy = Math.sin(a) * R
    const [sx, sz] = f.at(0, 0.16)
    strut(out, [sx - dx, G + ry - dy, sz - dz], [sx + dx, G + ry + dy, sz + dz], 0.08, 0.04, DARKGREY, 0)
  }
  // the centre gable over the front's eaves, its triple lancet
  f.tri(-(L / 2 - TW), L / 2 - TW, 15, 5, 0.02, RED, sh)
  for (const u of [-0.9, 0, 0.9]) lancet(u, 16, 0.7, 2, 0)
  const [cx, cz] = f.at(0, 0.1)
  prism(out, cx, cz, G + 20, G + 21.2, 0.12, 4, GREY, st)
  // the side bays' lower arched windows and the tall lancets above them
  for (const s of [-1, 1]) {
    const u = s * (L / 2 - TW / 2)
    lancet(u, 2.6, 2, 2.6, 0.5)
    lancet(u, 6.2, 1.1, 6.8, 0.5)
  }
  // the towers: proud of the front, grey corner piers to the top, the belfry, the railed gallery, pinnacles, spire
  for (const s of [-1, 1]) {
    const u = s * (L / 2 - TW / 2)
    const [tx, tz] = f.at(u, -TW / 2 + 0.5)
    const sq = (y0: number, y1: number, half: number, c: Rgb, tag: number): void => boxAlong(out, tx, G + (y0 + y1) / 2, tz, half, (y1 - y0) / 2, half, f.heading, c, tag)
    sq(15, 19.5, TW / 2, RED, sh)
    for (let side = 0; side < 4; side++) {
      const hd = f.heading + (side * Math.PI) / 2
      const nx = Math.sin(hd), nz = Math.cos(hd), ax = Math.cos(hd), az = -Math.sin(hd)
      for (const v of [-TW / 2 + 0.2, TW / 2 - 0.2]) boxAlong(out, tx + ax * v + nx * (TW / 2 + 0.05), G + 10.3, tz + az * v + nz * (TW / 2 + 0.05), 0.28, 10.3, 0.22, hd, GREY, st)
      for (const v of [-0.9, 0, 0.9]) {
        const bx = tx + ax * v + nx * (TW / 2 + 0.03), bz = tz + az * v + nz * (TW / 2 + 0.03)
        boxAlong(out, bx, G + 17.2, bz, 0.3, 1, 0.03, hd, GLASS, 0)
      }
    }
    sq(19.5, 19.9, TW / 2 + 0.25, DARKGREY, st)
    // the railing and the four corner pinnacles
    for (let k = 0; k < 4; k++) {
      const a = f.heading + (k * Math.PI) / 2 + Math.PI / 4, r = (TW / 2 + 0.1) * Math.SQRT2
      const px = tx + Math.sin(a) * r, pz = tz + Math.cos(a) * r
      prism(out, px, pz, G + 19.9, G + 22.6, 0.22, 6, GREY, st)
      prism(out, px, pz, G + 22.6, G + 24.4, 0.26, 6, GREY, st, 0.03)
    }
    sq(20.6, 20.75, TW / 2 + 0.15, DARKGREY, st)
    // the spire
    prism(out, tx, tz, G + 19.9, G + 21.5, TW / 2 - 0.3, 8, GREY, st)
    prism(out, tx, tz, G + 21.5, G + 31, TW / 2 - 0.4, 8, SLATE, surfaceTag('tile'), 0.06)
  }
}

export const HUA_ZANG_SI: Record<string, (out: MeshBuilder, fit: Fit) => void> = { huaZangSi }
