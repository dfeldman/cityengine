/**
 * Jules Lavirotte's glazed-stoneware fronts (claude-opus-5-5, 2026-11-04). From memory, no photo pass.
 *   immeubleLavirotte (way/69073399, 29 avenue Rapp, 1901): a narrow Bigot-stoneware front in warm ochre and brown, the
 *     towering sculpted doorway (an arched frame climbing two storeys, figures either side, swirls over the arch),
 *     curved bellied balconies with wavy iron, and a rounded crown over the top storey.
 *   ceramicHotel (way/70224059, 34 avenue de Wagram, 1904): the same glazed-tile skin with two bow windows up the front.
 * The street front is local −z (the entry's `front`); every ring edge facing it is dressed.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex, prism, type Rgb } from '../../kit.ts'
import { faceBand, towerRing } from '../../tower.ts'
import { edgeAt, stripRoof } from '../../parts.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { panel, lump } from './guimard.ts'

type Edge = ReturnType<typeof edgeAt>

interface Spec {
  body: Rgb; dark: Rgb; trim: Rgb; iron: Rgb; glass: Rgb; slate: Rgb
  F0: number; FH: number; floors: number; bay: number
  /** doorway: width, height of the arch springing, figures beside it (0 = none), swirl count over the arch */
  doorW: number; doorH: number; figH: number; swirls: number
  /** curved balconies: storeys, depth at the belly, wave of the railing */
  balconies: number[]; balD: number; waveA: number; waveN: number
  /** bow windows: positions along the front (0..1), radius, first and last storey */
  bows: number[]; bowR: number; bowF0: number; bowF1: number
  /** rounded crown over the top: width share of the front and rise; 0 = none */
  crownW: number; crownH: number
  roofRise: number
}

const at = (e: Edge, s: number, off: number): [number, number] => [e.a.x + e.tx * s + e.nx * off, e.a.z + e.tz * s + e.nz * off]

/** A bellied balcony: slab segments whose depth swells to the middle, the iron rail rolling along the curve. */
function curvedBalcony(out: MeshBuilder, e: Edge, s0: number, s1: number, y: number, sp: Spec): void {
  const n = Math.max(6, Math.round((s1 - s0) / 0.3))
  for (let i = 0; i < n; i++) {
    const a = s0 + (s1 - s0) * i / n, b = s0 + (s1 - s0) * (i + 1) / n
    const d = 0.25 + (sp.balD - 0.25) * Math.sin((i + 0.5) / n * Math.PI)
    lump(out, e, (a + b) / 2, d / 2, y - 0.25, y, b - a + 0.02, d, sp.dark)
    const top = y + 0.95 + sp.waveA * Math.sin((i + 0.5) / n * Math.PI * 2 * sp.waveN)
    panel(out, e, a, b, y, top, sp.iron, d, surfaceTag('metal'))
  }
}

/** The doorway: piers, a semicircular arch of stoneware voussoirs, figures on plinths, swirls rolling over the crown. */
function doorway(out: MeshBuilder, e: Edge, s: number, sp: Spec): void {
  const w = sp.doorW, r = w / 2 + 0.5
  panel(out, e, s - w / 2, s + w / 2, 0, sp.doorH, hex('#2a1d14'), 0.03)
  for (const k of [-1, 1]) lump(out, e, s + k * (w / 2 + 0.3), 0.3, 0, sp.doorH, 0.6, 0.6, sp.trim)
  const nv = 13
  for (let j = 0; j < nv; j++) {
    const t = Math.PI * (j + 0.5) / nv, c = s - Math.cos(t) * r, y = sp.doorH + Math.sin(t) * r
    lump(out, e, c, 0.32, y - 0.32, y + 0.32, 0.62, 0.64, j % 2 ? sp.trim : sp.dark)
  }
  // the glazed tympanum under the arch, dark glass
  for (let j = 0; j < 6; j++) {
    const f = (j + 0.5) / 6, hw = (w / 2) * Math.sqrt(1 - f * f)
    panel(out, e, s - hw, s + hw, sp.doorH + (w / 2) * j / 6, sp.doorH + (w / 2) * (j + 1) / 6, sp.glass, 0.04)
  }
  if (sp.figH > 0) for (const k of [-1, 1]) {
    const [x, z] = at(e, s + k * (w / 2 + 0.3), 0.75)
    prism(out, x, z, sp.doorH - 0.3, sp.doorH, 0.4, 8, sp.trim)
    prism(out, x, z, sp.doorH, sp.doorH + sp.figH * 0.72, 0.22, 8, sp.dark, 0, 0.17)
    prism(out, x, z, sp.doorH + sp.figH * 0.72, sp.doorH + sp.figH, 0.14, 8, sp.dark, 0, 0.12)
  }
  // swirls: spiralling beads climbing from the arch's crown, alternating sides
  for (let q = 0; q < sp.swirls; q++) {
    const k = q % 2 ? 1 : -1, cs = s + k * (0.5 + 0.35 * q), cy = sp.doorH + r + 0.4 + 0.45 * q
    for (let j = 0; j < 7; j++) {
      const t = j / 7 * Math.PI * 1.6, rr = 0.55 * (1 - j / 9)
      lump(out, e, cs + k * Math.cos(t) * rr, 0.2, cy + Math.sin(t) * rr - 0.11, cy + Math.sin(t) * rr + 0.11, 0.24, 0.4, j % 2 ? sp.trim : sp.iron)
    }
  }
}

function lavirotte(out: MeshBuilder, fit: Fit, sp: Spec): void {
  const ring = towerRing(fit), top = sp.F0 + sp.FH * sp.floors
  faceBand(out, ring, 0, sp.F0, { kind: 'punched', wall: sp.dark, glass: sp.glass, floor: sp.F0, pitch: sp.bay, solid: 0.55, arched: true, material: 'terracotta' })
  faceBand(out, ring, sp.F0, top, { kind: 'punched', wall: sp.body, glass: sp.glass, floor: sp.FH, pitch: sp.bay, solid: 0.5, arched: true, material: 'terracotta' })
  stripRoof(out, ring, top, sp.roofRise, sp.slate, 'tile')
  const fronts: number[] = []
  for (let i = 0; i < ring.length; i++) { const e = edgeAt(ring, i); if (-e.nz > 0.7 && e.L > 3) fronts.push(i) }
  const main = fronts.reduce((m, i) => (edgeAt(ring, i).L > edgeAt(ring, m).L ? i : m), fronts[0] ?? 0)
  for (const i of fronts) {
    const e = edgeAt(ring, i), L = e.L, isMain = i === main
    lump(out, e, L / 2, 0.12, sp.F0 - 0.2, sp.F0 + 0.15, L, 0.24, sp.trim)
    for (let k = 1; k < sp.floors; k++) lump(out, e, L / 2, 0.05, sp.F0 + sp.FH * k - 0.08, sp.F0 + sp.FH * k + 0.08, L, 0.1, sp.dark)
    for (const k of sp.balconies) curvedBalcony(out, e, 0.4, L - 0.4, sp.F0 + sp.FH * k, sp)
    for (const t of sp.bows) {
      const [x, z] = at(e, L * t, 0)
      prism(out, x, z, sp.F0 + sp.FH * sp.bowF0 - 0.6, sp.F0 + sp.FH * sp.bowF0, sp.bowR * 0.85, 12, sp.dark, 0, sp.bowR)
      for (let k = sp.bowF0; k <= sp.bowF1; k++) {
        const y = sp.F0 + sp.FH * k
        prism(out, x, z, y, y + 0.7, sp.bowR, 12, sp.body, surfaceTag('terracotta'))
        prism(out, x, z, y + 0.7, y + sp.FH - 0.35, sp.bowR - 0.05, 12, sp.glass, surfaceTag('glass'))
        prism(out, x, z, y + sp.FH - 0.35, y + sp.FH, sp.bowR + 0.05, 12, sp.trim)
      }
    }
    if (!isMain) continue
    doorway(out, e, L / 2, sp)
    if (sp.crownW > 0) {
      const w = L * sp.crownW, n = 9
      for (let j = 0; j < n; j++) {
        const f0 = j / n, f1 = (j + 1) / n, hw = (w / 2) * Math.sqrt(1 - f0 * f0)
        lump(out, e, L / 2, 0.2, top + sp.crownH * f0, top + sp.crownH * f1, 2 * hw, 0.4, j % 2 ? sp.trim : sp.body)
      }
      panel(out, e, L / 2 - w * 0.18, L / 2 + w * 0.18, top + 0.3, top + sp.crownH * 0.6, sp.glass, 0.41)
    }
  }
}

/** 29 avenue Rapp. */
export const RAPP: Spec = {
  body: hex('#b98a4e'), dark: hex('#7a5232'), trim: hex('#d9b97c'), iron: hex('#3b3a2c'), glass: hex('#2c3437'), slate: hex('#5d6268'),
  F0: 4.2, FH: 3.0, floors: 6, bay: 2.6,
  doorW: 2.2, doorH: 3.4, figH: 1.8, swirls: 6,
  balconies: [1, 3, 5], balD: 0.9, waveA: 0.18, waveN: 2,
  bows: [], bowR: 0, bowF0: 0, bowF1: 0,
  crownW: 0.6, crownH: 3.2, roofRise: 2.2,
}
/** Céramic Hôtel, 34 avenue de Wagram. */
export const CERAMIC: Spec = {
  body: hex('#c9a46e'), dark: hex('#8a6440'), trim: hex('#e6d2a6'), iron: hex('#3b3a2c'), glass: hex('#2c3437'), slate: hex('#5d6268'),
  F0: 4.0, FH: 3.0, floors: 7, bay: 2.8,
  doorW: 2.0, doorH: 3.0, figH: 0, swirls: 4,
  balconies: [6], balD: 0.7, waveA: 0.14, waveN: 2,
  bows: [0.22, 0.78], bowR: 1.1, bowF0: 1, bowF1: 5,
  crownW: 0, crownH: 0, roofRise: 2.6,
}
export const immeubleLavirotte = (out: MeshBuilder, fit: Fit): void => lavirotte(out, fit, RAPP)
export const ceramicHotel = (out: MeshBuilder, fit: Fit): void => lavirotte(out, fit, CERAMIC)
