/**
 * Two decorated street fronts from booster2success's "7 wonders" list (claude-opus-5-5, 2026-11-05). From memory, no photo pass.
 *   eauxMinerales (way/69257441, 30 rue de Londres, 1920s): the Société française des Eaux minérales front, faced in
 *     azure ceramic; columns of bubbles up the two side bays, a crown motif three times, "Les perles de Vals" over the door.
 *   sgraffiti (way/56140815, 134 rue Mouffetard, 1929, MH 1990): Adigheri's sgraffito for the butcher Fachetti, pale
 *     render scratched with dark vines, birds and game in panels between the windows, a shop at the foot.
 * The street front is local −z (the entry's `front`); edges facing it are dressed.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex, prism, type Rgb } from '../../kit.ts'
import { faceBand, towerRing } from '../../tower.ts'
import { edgeAt, stripRoof } from '../../parts.ts'
import { surfaceTag, type Surface } from '../../../cartoon-material.ts'
import { panel, lump } from './guimard.ts'

type Edge = ReturnType<typeof edgeAt>
const at = (e: Edge, s: number, off: number): [number, number] => [e.a.x + e.tx * s + e.nx * off, e.a.z + e.tz * s + e.nz * off]

interface Spec {
  wall: Rgb; skin: Rgb; deco: Rgb; trim: Rgb; glass: Rgb; slate: Rgb; shop: Rgb
  skinMat: Surface; wallMat: Surface
  F0: number; FH: number; floors: number; bay: number; roofRise: number
  /** side bays (share of the front each) carrying bubble columns; 0 = none */
  sideW: number; bubbles: number; bubbleR: number
  /** crown motifs across the top storey */
  crowns: number
  /** sgraffito panels: per storey, between windows; vine beads per panel */
  sgraffito: boolean; vine: number
}

function dressFront(out: MeshBuilder, e: Edge, sp: Spec, top: number): void {
  const L = e.L
  // shopfront / ground floor and cornice
  panel(out, e, 0.3, L - 0.3, 0.2, sp.F0 - 0.5, sp.shop, 0.06)
  panel(out, e, 0.6, L - 0.6, 0.4, sp.F0 - 0.9, sp.glass, 0.09, surfaceTag('glass'))
  lump(out, e, L / 2, 0.15, sp.F0 - 0.5, sp.F0, L, 0.3, sp.trim)
  lump(out, e, L / 2, 0.3, top - 0.35, top, L + 0.3, 0.6, sp.trim)
  // the skin over the upper storeys (ceramic or render), leaving window holes implied by the band behind
  const nb = Math.max(2, Math.round(L / sp.bay))
  for (let k = 0; k < sp.floors; k++) {
    const y = sp.F0 + sp.FH * k
    lump(out, e, L / 2, 0.05, y - 0.06, y + 0.1, L, 0.1, sp.trim)
    // ceramic spandrels under the sills and over the lintels, so the skin reads as a whole surface
    if (sp.skinMat === 'tessera') for (const [a, c] of [[y + 0.1, y + 0.95], [y + sp.FH - 0.55, y + sp.FH - 0.06]]) panel(out, e, 0, L, a, c, sp.skin, 0.035, surfaceTag(sp.skinMat))
    for (let b = 0; b <= nb; b++) {
      const s = L * b / nb, w = b === 0 || b === nb ? 0.6 : 0.9
      panel(out, e, Math.max(0, s - w / 2), Math.min(L, s + w / 2), y + 0.1, y + sp.FH - 0.06, sp.skin, 0.04, surfaceTag(sp.skinMat))
      if (sp.sgraffito && b > 0 && b < nb) {
        // a vine: beads wandering up the pier, leaves offset each side, a bird near the top
        for (let j = 0; j < sp.vine; j++) {
          const f = (j + 0.5) / sp.vine, ds = 0.22 * Math.sin(f * Math.PI * 3)
          lump(out, e, s + ds, 0.07, y + 0.3 + f * (sp.FH - 0.7), y + 0.42 + f * (sp.FH - 0.7), 0.16, 0.04, sp.deco)
          lump(out, e, s + ds + (j % 2 ? 0.18 : -0.18), 0.07, y + 0.34 + f * (sp.FH - 0.7), y + 0.4 + f * (sp.FH - 0.7), 0.14, 0.04, sp.deco)
        }
        lump(out, e, s, 0.07, y + sp.FH - 0.45, y + sp.FH - 0.3, 0.42, 0.04, sp.deco)
      }
    }
    if (sp.sgraffito) lump(out, e, L / 2, 0.07, y + sp.FH - 0.28, y + sp.FH - 0.16, L - 0.4, 0.04, sp.deco)
  }
  // bubble columns up the two side bays
  if (sp.sideW > 0) for (const c of [L * sp.sideW / 2, L * (1 - sp.sideW / 2)]) {
    for (let j = 0; j < sp.bubbles; j++) {
      const f = (j + 0.5) / sp.bubbles, r = sp.bubbleR * (0.6 + 0.4 * ((j * 7) % 5) / 4)
      const [x, z] = at(e, c + (j % 2 ? 0.35 : -0.35) * L * sp.sideW, 0.12)
      const y = sp.F0 + f * (top - sp.F0 - 0.6)
      prism(out, x, z, y - r, y + r, r * 0.6, 8, sp.deco, 0, r)
    }
  }
  // crowns of pearls on the top storey, and the lettered band over the door
  for (let q = 0; q < sp.crowns; q++) {
    const s = L * (q + 1) / (sp.crowns + 1), y = top - sp.FH + 0.3
    lump(out, e, s, 0.1, y, y + 0.35, 1.0, 0.12, sp.deco)
    for (let j = 0; j < 5; j++) {
      const [x, z] = at(e, s - 0.45 + j * 0.225, 0.14)
      prism(out, x, z, y + 0.35, y + 0.55 + (j === 2 ? 0.25 : 0), 0.07, 6, sp.deco)
      prism(out, x, z, y + 0.55 + (j === 2 ? 0.25 : 0), y + 0.7 + (j === 2 ? 0.25 : 0), 0.09, 6, sp.trim)
    }
  }
  if (sp.crowns > 0) panel(out, e, L / 2 - 1.6, L / 2 + 1.6, sp.F0 - 1.2, sp.F0 - 0.6, sp.deco, 0.12)
}

function decorated(out: MeshBuilder, fit: Fit, sp: Spec): void {
  const ring = towerRing(fit), top = sp.F0 + sp.FH * sp.floors
  faceBand(out, ring, 0, sp.F0, { kind: 'punched', wall: sp.wall, glass: sp.glass, floor: sp.F0, pitch: sp.bay, solid: 0.5, material: sp.wallMat })
  faceBand(out, ring, sp.F0, top, { kind: 'punched', wall: sp.wall, glass: sp.glass, floor: sp.FH, pitch: sp.bay, solid: 0.55, material: sp.wallMat })
  stripRoof(out, ring, top, sp.roofRise, sp.slate, 'tile')
  // the street front: the edge facing −z most squarely (long enough to carry a front)
  let best = -1, bestNz = 0.3
  for (let i = 0; i < ring.length; i++) { const e = edgeAt(ring, i); if (e.L > 3 && -e.nz > bestNz) { best = i; bestNz = -e.nz } }
  // collinear pieces of the same front (cadastre rings split a street wall) are dressed too
  if (best >= 0) for (let i = 0; i < ring.length; i++) { const e = edgeAt(ring, i); if (e.L > 2 && -e.nz > bestNz - 0.08) dressFront(out, e, sp, top) }
}

/** 30 rue de Londres. */
export const EAUX: Spec = {
  wall: hex('#d9d2c2'), skin: hex('#3f8fc4'), deco: hex('#e9f2f6'), trim: hex('#1f5f8c'), glass: hex('#2a3338'), slate: hex('#5d6268'), shop: hex('#1f5f8c'),
  skinMat: 'tessera', wallMat: 'stucco',
  F0: 4.2, FH: 3.0, floors: 6, bay: 2.7, roofRise: 2.6,
  sideW: 0.2, bubbles: 14, bubbleR: 0.28, crowns: 3, sgraffito: false, vine: 0,
}
/** 134 rue Mouffetard. */
export const SGRAFFITI: Spec = {
  wall: hex('#e6dcc4'), skin: hex('#ece2c8'), deco: hex('#6b5a44'), trim: hex('#cbbd9d'), glass: hex('#2a3338'), slate: hex('#6a6e72'), shop: hex('#7a2b22'),
  skinMat: 'stucco', wallMat: 'stucco',
  F0: 3.8, FH: 2.8, floors: 4, bay: 2.4, roofRise: 2.2,
  sideW: 0, bubbles: 0, bubbleR: 0, crowns: 0, sgraffito: true, vine: 9,
}
export const eauxMinerales = (out: MeshBuilder, fit: Fit): void => decorated(out, fit, EAUX)
export const sgraffiti = (out: MeshBuilder, fit: Fit): void => decorated(out, fit, SGRAFFITI)
