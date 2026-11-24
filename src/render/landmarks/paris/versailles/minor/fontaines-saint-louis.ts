/**
 * TWO STONE FOUNTAIN PAVILIONS OF VERSAILLES' SAINT-LOUIS QUARTER (monuments historiques; no jets are drawn: a wall fountain's trickle is not worth a sheet):
 *  - the FONTAINE SAINT-LOUIS (OSM way/74631328, Mérimée PA00087690; c.1750-75, master mason Hubert Pluyette), on the north side of the place
 *    Saint-Louis against the corner of a house: a rusticated stone pavilion whose middle bay is a semicircular-headed niche with its trough, the
 *    canted wings lower, under a lead roof falling to the house. The niche's back stays well in front of the house wall.
 *  - the FONTAINE DES QUATRE PAVES (OSM node/4268639281, Mérimée PA00087689; 18th c., later the Maison de l'Habitat Ancien, OSM way/74626210):
 *    a free-standing square pavilion of banded ashlar, a big arched niche in its front flanked by two carved frieze panels, a window in each
 *    upper bay, a deep cornice and a flat roof.
 * Heights and proportions are read off Commons photographs against people and doors (about +-0.5 m), not surveyed.
 * Frame: the front faces local -z, x across, y up from the ground; the footprint is centred on the origin. Tunables: CFG.
 */
import type { MeshBuilder } from '../../../../buildings.ts'
import { surfaceTag } from '../../../../cartoon-material.ts'
import type { Fit } from '../../../fit.ts'
import { block, hex, shade, type Rgb } from '../../../kit.ts'

const CFG = {
  /** the ashlar shader greys pale stone in shade; off, the string courses are drawn as thin bands instead */
  tagAshlar: false,
  stone: '#f2e9d0', stoneDark: '#d9cfb4', recess: '#8a8270', lead: '#6e7378', dark: '#3a3c40',
  /** Quatre Pavés: footprint side, wall height to the cornice, plinth height, cornice height and overhang, roof parapet */
  qp: { w: 8.6, d: 8.5, wall: 6.1, plinth: 0.55, cornice: 0.55, out: 0.2, top: 0.35,
    /** the niche: half-width, springing height, crown height, recess depth */
    niche: { hw: 1.45, spring: 2.5, crown: 3.95, depth: 0.6 },
    /** the frieze panels beside the niche: y0, y1 and width; the windows: half-width, y0, y1, x offset from the middle */
    frieze: { y0: 3.35, y1: 4.05, w: 2.0 }, win: { hw: 0.5, y0: 4.35, y1: 5.65, dx: 2.9 },
    /** string courses of the ashlar (every `band` m, depth) */
    band: 0.62, bandIn: 0.06 },
  /** Saint-Louis: middle bay width and depth, wing width and depth, heights of the middle, wings and the roof's rise over the middle */
  sl: { mw: 3.4, md: 4.3, ww: 1.85, wd: 3.4, hMid: 4.5, hWing: 3.7, rise: 1.3, plinth: 0.4, cornice: 0.35, out: 0.15,
    niche: { hw: 0.95, spring: 1.9, crown: 2.85, depth: 0.55 }, trough: { hw: 1.0, d: 0.9, h: 0.55 } },
}

const STONE = hex(CFG.stone), DARK = hex(CFG.stoneDark), RECESS = hex(CFG.recess), LEAD = hex(CFG.lead), GLASS = hex(CFG.dark)
const ASH = surfaceTag('ashlar')

/** a block that carries the ashlar surface (courses drawn by the shader) */
function ash(out: MeshBuilder, x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, c: Rgb): void {
  const before = out.colors.length
  block(out, x0, x1, z0, z1, y0, y1, c)
  if (CFG.tagAshlar) for (let i = before + 3; i < out.colors.length; i += 4) out.colors[i] = ASH
}

/**
 * A wall pierced by a semicircular-headed niche in its front face (z = zf, facing -z): left and right piers, then slices over the
 * arch to the wall's top, the recess back and its floor. x0..x1 the wall's width, depth through the wall `d`.
 */
export function archedWall(out: MeshBuilder, x0: number, x1: number, zf: number, d: number, y0: number, y1: number,
  n: { hw: number; spring: number; crown: number; depth: number }, c: Rgb, back: Rgb): void {
  const cx = (x0 + x1) / 2, R = n.hw, slices = 10
  ash(out, x0, cx - R, zf, zf + d, y0, y1, c)
  ash(out, cx + R, x1, zf, zf + d, y0, y1, c)
  // under the springing the recess is only the two piers apart; above it the head: slices as tall as the arch leaves
  ash(out, cx - R, cx + R, zf + n.depth, zf + d, y0, y1, c)
  const rise = n.crown - n.spring
  for (let i = 0; i < slices; i++) {
    const a = ((i + 0.5) / slices) * 2 - 1, xa = cx + a * R, w = R / slices
    const top = n.spring + rise * Math.sqrt(Math.max(0, 1 - a * a))
    ash(out, xa - w, xa + w, zf, zf + n.depth, top, y1, c)
  }
  // the recess back is darker, a thin plate in front of the wall behind
  block(out, cx - R, cx + R, zf + n.depth - 0.02, zf + n.depth, y0, n.spring, back)
  for (let i = 0; i < slices; i++) {
    const a = ((i + 0.5) / slices) * 2 - 1, xa = cx + a * R, w = R / slices
    const top = n.spring + rise * Math.sqrt(Math.max(0, 1 - a * a))
    block(out, xa - w, xa + w, zf + n.depth - 0.02, zf + n.depth, n.spring, top, back)
  }
}

/** a flat dark window set into a face at z (facing -z), with a stone surround */
function window(out: MeshBuilder, cx: number, zf: number, y0: number, y1: number, hw: number, ax: 'z' | 'x' = 'z', dir = -1): void {
  const s = 0.05
  if (ax === 'z') {
    block(out, cx - hw - 0.12, cx + hw + 0.12, dir < 0 ? zf - 0.1 : zf, dir < 0 ? zf : zf + 0.1, y0 - 0.12, y1 + 0.16, shade(STONE, 1.05))
    block(out, cx - hw, cx + hw, dir < 0 ? zf - 0.1 - s : zf + 0.1, dir < 0 ? zf - 0.1 : zf + 0.1 + s, y0, y1, GLASS)
  } else {
    // cx is the z centre on a side face at x = zf
    block(out, dir < 0 ? zf - 0.1 : zf, dir < 0 ? zf : zf + 0.1, cx - hw - 0.12, cx + hw + 0.12, y0 - 0.12, y1 + 0.16, shade(STONE, 1.05))
    block(out, dir < 0 ? zf - 0.14 : zf, dir < 0 ? zf : zf + 0.14, cx - hw, cx + hw, y0, y1, GLASS)
  }
}

/** Fontaine des Quatre Pavés: the free-standing arched pavilion */
export function versaillesFontaineQuatrePaves(out: MeshBuilder, fit: Fit): void {
  const Q = CFG.qp, y = fit.grade ?? 0, hw = Q.w / 2, hd = Q.d / 2
  // plinth, then the body wall; the front (-z) wall carries the niche
  ash(out, -hw - 0.1, hw + 0.1, -hd - 0.1, hd + 0.1, y - 0.3, y + Q.plinth, shade(STONE, 0.92))
  archedWall(out, -hw, hw, -hd, 0.9, y + Q.plinth, y + Q.wall, { ...Q.niche, spring: y + Q.niche.spring, crown: y + Q.niche.crown }, STONE, RECESS)
  ash(out, -hw, hw, -hd + 0.9, hd, y + Q.plinth, y + Q.wall, STONE)
  // ashlar string courses on all four sides, thin dark joints proud by a hair
  for (let by = y + Q.plinth + Q.band; by < y + Q.wall - 0.2; by += Q.band) {
    block(out, -hw - 0.02, hw + 0.02, -hd - 0.02, -hd + 0.0, by - 0.025, by + 0.025, DARK)
    block(out, -hw - 0.02, hw + 0.02, hd, hd + 0.02, by - 0.025, by + 0.025, DARK)
    block(out, -hw - 0.02, -hw, -hd, hd, by - 0.025, by + 0.025, DARK)
    block(out, hw, hw + 0.02, -hd, hd, by - 0.025, by + 0.025, DARK)
  }
  // the carved frieze panels either side of the niche (darker, slightly proud) and the upper windows, front and back
  for (const sx of [-1, 1]) {
    const c = sx * (Q.niche.hw + 0.35 + Q.frieze.w / 2)
    block(out, c - Q.frieze.w / 2, c + Q.frieze.w / 2, -hd - 0.08, -hd, y + Q.frieze.y0, y + Q.frieze.y1, shade(DARK, 1.0))
    window(out, sx * Q.win.dx, -hd, y + Q.win.y0, y + Q.win.y1, Q.win.hw, 'z', -1)
    window(out, sx * Q.win.dx, hd, y + Q.win.y0, y + Q.win.y1, Q.win.hw, 'z', 1)
    // sides: one window each, the carved band beneath
    window(out, sx * 1.6, -hw, y + Q.win.y0, y + Q.win.y1, Q.win.hw, 'x', -1)
    window(out, sx * 1.6, hw, y + Q.win.y0, y + Q.win.y1, Q.win.hw, 'x', 1)
  }
  // cornice, flat roof with a low parapet, a lead sheet inside
  const cy = y + Q.wall
  ash(out, -hw - Q.out, hw + Q.out, -hd - Q.out, hd + Q.out, cy, cy + Q.cornice, shade(STONE, 1.04))
  ash(out, -hw - Q.out * 0.5, hw + Q.out * 0.5, -hd - Q.out * 0.5, hd + Q.out * 0.5, cy + Q.cornice, cy + Q.cornice + Q.top, STONE)
  block(out, -hw + 0.3, hw - 0.3, -hd + 0.3, hd - 0.3, cy + Q.cornice + Q.top - 0.01, cy + Q.cornice + Q.top + 0.04, LEAD)
}

/** Fontaine Saint-Louis: the niche pavilion with canted wings, its back to the house */
export function versaillesFontaineSaintLouis(out: MeshBuilder, fit: Fit): void {
  const S = CFG.sl, y = fit.grade ?? 0
  const mhw = S.mw / 2, back = S.md / 2, front = -S.md / 2
  // the middle bay: plinth, arched wall, a stone trough in the niche
  ash(out, -mhw - 0.1, mhw + 0.1, front - 0.1, back, y - 0.3, y + S.plinth, shade(STONE, 0.92))
  archedWall(out, -mhw, mhw, front, S.md, y + S.plinth, y + S.hMid, { ...S.niche, spring: y + S.niche.spring, crown: y + S.niche.crown }, STONE, RECESS)
  const T = S.trough
  ash(out, -T.hw, T.hw, front + S.niche.depth - 0.05, front + S.niche.depth - 0.05 + T.d, y, y + T.h, shade(STONE, 0.97))
  // the wings: a lower block either side, set back, with a carved panel
  for (const sx of [-1, 1]) {
    const x0 = sx > 0 ? mhw : -mhw - S.ww, x1 = sx > 0 ? mhw + S.ww : -mhw
    const wf = back - S.wd
    ash(out, x0, x1, wf, back, y - 0.3, y + S.plinth, shade(STONE, 0.92))
    ash(out, x0, x1, wf, back, y + S.plinth, y + S.hWing, STONE)
    ash(out, x0 - S.out, x1 + S.out * (sx > 0 ? 1 : 1), wf - S.out, back, y + S.hWing, y + S.hWing + S.cornice, shade(STONE, 1.04))
    const px = (x0 + x1) / 2
    block(out, px - 0.55, px + 0.55, wf - 0.06, wf, y + 1.2, y + 3.0, DARK)
  }
  // middle cornice, then the lead roof falling to the house (higher at the back)
  const cy = y + S.hMid
  ash(out, -mhw - S.out, mhw + S.out, front - S.out, back, cy, cy + S.cornice, shade(STONE, 1.04))
  const r0 = cy + S.cornice, r1 = r0 + S.rise, zf = front - S.out * 0.5, zb = back
  const xl = -mhw - S.out * 0.5, xr = mhw + S.out * 0.5
  const uv: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
  out.quad([[xl, r0, zf], [xr, r0, zf], [xr, r1, zb], [xl, r1, zb]], [0, 0.75, -0.66], uv, LEAD, 0)
  out.quad([[xl, r0, zb], [xl, r0, zf], [xl, r0, zf], [xl, r1, zb]], [-1, 0, 0], uv, shade(LEAD, 0.85), 0)
  out.quad([[xr, r0, zf], [xr, r0, zb], [xr, r1, zb], [xr, r0, zf]], [1, 0, 0], uv, shade(LEAD, 0.85), 0)
}

export const VERSAILLES_SAINT_LOUIS = { versaillesFontaineQuatrePaves, versaillesFontaineSaintLouis }
