/**
 * The white modernist villas of rue Mallet-Stevens, 16e (Robert Mallet-Stevens, 1927; claude-sonnet-5-5, 2026-11-04, from memory, no photo pass).
 * One parametric builder, a Spec per house: white stucco cubist volumes, flat roofs with a set-back terrace box and railings,
 * a cantilevered slab over the door, glazed strip windows in dark metal frames, and (Hôtel Martel, no. 10) the cylindrical
 * stair tower with its tall glazed slot. Everything decorates the edges that face the street (local -z from the entry's
 * `front`, as in guimard.ts). Maison La Roche is not here: batch4/hotels.ts has it.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { capPolygon } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex, prism, type Rgb } from '../../kit.ts'
import { faceBand, towerRing } from '../../tower.ts'
import { edgeAt } from '../../parts.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { lump, panel } from './guimard.ts'

/** Everything tunable about one villa. */
interface Spec {
  white: Rgb; frame: Rgb; glass: Rgb; roof: Rgb
  floors: number; FH: number
  /** the glazed strip: height off the floor, height, and the share of the front's width it spans (0..1) */
  sillH: number; stripH: number; stripFrac: number; mullion: number
  /** the cantilevered slab over the door: storey it sits at (floor line), its share of the front, projection, thickness; 0 = none */
  slabK: number; slabFrac: number; slabOut: number; slabT: number
  /** the door: position along the front (0..1), width, height */
  doorT: number; doorW: number; doorH: number
  /** the roof terrace box: position (0..1), width, depth, height; 0 width = none */
  boxT: number; boxW: number; boxD: number; boxH: number
  /** railing height round the terrace, 0 = none */
  rail: number
  /** the round stair tower: position (0..1), radius, rise above the roof; 0 radius = none */
  towerT: number; towerR: number; towerRise: number
}

const BASE: Spec = {
  white: hex('#f1efe8'), frame: hex('#26292b'), glass: hex('#33424b'), roof: hex('#9a9893'),
  floors: 3, FH: 3.1, sillH: 0.8, stripH: 1.4, stripFrac: 0.8, mullion: 1.5,
  slabK: 1, slabFrac: 0.5, slabOut: 1.2, slabT: 0.28,
  doorT: 0.2, doorW: 1.2, doorH: 2.3,
  boxT: 0.65, boxW: 4, boxD: 3, boxH: 2.6, rail: 1.0,
  towerT: 0, towerR: 0, towerRise: 0,
}
export const ALLATINI: Spec = { ...BASE, floors: 3, slabK: 2, slabFrac: 0.45, boxT: 0.3, boxW: 3.6, doorT: 0.75 }
export const DREYFUS: Spec = { ...BASE, floors: 2, FH: 3.2, stripFrac: 0.7, slabK: 1, slabFrac: 0.6, boxW: 0, rail: 0.9, doorT: 0.5 }
export const MARTEL: Spec = { ...BASE, floors: 3, FH: 3.2, slabK: 2, slabFrac: 0.4, boxT: 0.2, boxW: 3.2, boxH: 2.4,
  towerT: 0.82, towerR: 1.5, towerRise: 2.8, doorT: 0.35 }
export const REIFENBERG: Spec = { ...BASE, floors: 4, FH: 3.0, stripFrac: 0.72, slabK: 2, slabFrac: 0.55, slabOut: 1.5, boxT: 0.6, boxW: 3.4, doorT: 0.2 }
export const HOTEL_MS: Spec = { ...BASE, floors: 4, FH: 3.1, stripFrac: 0.85, slabK: 2, slabFrac: 0.9, slabOut: 1.0, boxT: 0.5, boxW: 3, boxD: 2.5, doorT: 0.5 }

function villa(out: MeshBuilder, fit: Fit, sp: Spec): void {
  const ring = towerRing(fit), top = sp.floors * sp.FH
  const stucco = { kind: 'punched' as const, wall: sp.white, glass: sp.glass, floor: sp.FH, pitch: 4, solid: 0.78, material: 'stucco' as const }
  faceBand(out, ring, 0, top, stucco)
  faceBand(out, ring, top, top + 0.45, { kind: 'blank', wall: sp.white, material: 'stucco' })
  capPolygon(out, ring, top + 0.02, sp.roof, 0)
  const fronts: number[] = []
  for (let i = 0; i < ring.length; i++) { const e = edgeAt(ring, i); if (-e.nz > 0.6 && e.L > 3) fronts.push(i) }
  const main = fronts.reduce((m, i) => (edgeAt(ring, i).L > edgeAt(ring, m).L ? i : m), fronts[0] ?? 0)
  const metal = surfaceTag('metal')
  for (const i of fronts) {
    const e = edgeAt(ring, i), L = e.L, isMain = i === main
    const s0 = L * (1 - sp.stripFrac) / 2, s1 = L - s0
    // glazed strip windows in dark frames, one per storey above the ground, a window pair on the ground floor
    for (let k = 0; k < sp.floors; k++) {
      const y0 = k * sp.FH + sp.sillH, y1 = y0 + sp.stripH
      const a = k === 0 ? L * 0.5 : s0, b = k === 0 ? L - 0.7 : s1
      if (b - a < 1) continue
      panel(out, e, a, b, y0, y1, sp.glass, 0.04)
      lump(out, e, (a + b) / 2, 0.06, y0 - 0.08, y0 + 0.04, b - a, 0.12, sp.frame)
      lump(out, e, (a + b) / 2, 0.06, y1 - 0.04, y1 + 0.08, b - a, 0.12, sp.frame)
      const n = Math.max(1, Math.round((b - a) / sp.mullion))
      for (let m = 0; m <= n; m++) lump(out, e, a + (b - a) * m / n, 0.06, y0, y1, 0.07, 0.12, sp.frame)
    }
    if (!isMain) continue
    // the door: a dark metal-framed leaf under the slab
    const ds = L * sp.doorT
    panel(out, e, ds - sp.doorW / 2, ds + sp.doorW / 2, 0, sp.doorH, sp.frame, 0.05, metal)
    lump(out, e, ds, 0.2, sp.doorH, sp.doorH + 0.1, sp.doorW + 0.6, 0.45, sp.white)
    // the cantilevered slab, carried out over the door, with a plain parapet
    if (sp.slabFrac > 0) {
      const w = L * sp.slabFrac, c = Math.min(Math.max(ds, w / 2), L - w / 2), y = sp.slabK * sp.FH
      lump(out, e, c, sp.slabOut / 2, y - sp.slabT, y, w, sp.slabOut, sp.white)
      lump(out, e, c, sp.slabOut - 0.04, y, y + 0.9, w, 0.08, sp.white)
    }
    // the stair tower: a white cylinder against the front, a tall glazed slot up its face
    if (sp.towerR > 0) {
      const s = L * sp.towerT, cx = e.a.x + e.tx * s + e.nx * (sp.towerR * 0.35), cz = e.a.z + e.tz * s + e.nz * (sp.towerR * 0.35)
      prism(out, cx, cz, 0, top + sp.towerRise, sp.towerR, 18, sp.white, surfaceTag('stucco'))
      lump(out, e, s, sp.towerR * 0.35 + sp.towerR, 0.6, top + sp.towerRise - 0.8, 0.9, 0.12, sp.glass)
      for (let k = 1; k < sp.floors + 1; k++) lump(out, e, s, sp.towerR * 0.35 + sp.towerR, k * sp.FH - 0.05, k * sp.FH + 0.05, 1.0, 0.16, sp.frame)
      prism(out, cx, cz, top + sp.towerRise, top + sp.towerRise + 0.12, sp.towerR + 0.1, 18, sp.roof)
    }
    // the roof: a set-back box with a strip window, and a thin railing round the terrace
    if (sp.boxW > 0) {
      const s = L * sp.boxT
      lump(out, e, s, -sp.boxD / 2 - 1.2, top + 0.45, top + 0.45 + sp.boxH, sp.boxW, sp.boxD, sp.white)
      panel(out, e, s - sp.boxW * 0.4, s + sp.boxW * 0.4, top + 1.2, top + 2.0, sp.glass, -1.2 + 0.02 + 0.0)
    }
    if (sp.rail > 0) {
      const n = Math.max(2, Math.round(L / 1.2))
      for (let r = 0; r <= n; r++) lump(out, e, 0.1 + (L - 0.2) * r / n, 0.0, top + 0.45, top + 0.45 + sp.rail, 0.04, 0.04, sp.frame)
      lump(out, e, L / 2, 0.0, top + 0.45 + sp.rail, top + 0.45 + sp.rail + 0.04, L - 0.2, 0.05, sp.frame)
    }
  }
}

export const villaAllatini = (out: MeshBuilder, fit: Fit): void => villa(out, fit, ALLATINI)
export const villaDreyfus = (out: MeshBuilder, fit: Fit): void => villa(out, fit, DREYFUS)
export const hotelMartel = (out: MeshBuilder, fit: Fit): void => villa(out, fit, MARTEL)
export const villaReifenberg = (out: MeshBuilder, fit: Fit): void => villa(out, fit, REIFENBERG)
export const hotelMalletStevens = (out: MeshBuilder, fit: Fit): void => villa(out, fit, HOTEL_MS)
