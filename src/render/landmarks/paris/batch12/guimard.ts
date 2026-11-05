/**
 * Hector Guimard on rue Jean de La Fontaine, 16e (claude-opus-5-5, 2026-11-04). From memory of the buildings, no photo pass.
 *   castelBeranger (way/84198307, no. 14, 1898): millstone and cut-stone base, brick and glazed-sandstone storeys, asymmetric
 *     bays, an oriel, wavy green cast-iron balconies, the copper-green entrance gate off-centre, a broken roofline of gables.
 *   hotelMezzara (way/84262071, no. 60, 1911): a pale stone hôtel with a brick band, a tall central studio window, one wavy balcony.
 * Both decorate every ring edge that faces the street (local -z, from the entry's `front`); the rest is a plain punched band.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex, prism, type Rgb } from '../../kit.ts'
import { faceBand, towerRing } from '../../tower.ts'
import { edgeAt, stripRoof } from '../../parts.ts'
import { surfaceTag } from '../../../cartoon-material.ts'

const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

/** Everything tunable about one Guimard front. */
interface Spec {
  base: Rgb; body: Rgb; trim: Rgb; iron: Rgb; glass: Rgb; slate: Rgb
  baseMat: 'rock' | 'ashlar'; bodyMat: 'brick' | 'ashlar' | 'stucco'
  F0: number; FH: number; floors: number
  /** bay pitch along the front, metres */
  bay: number
  /** where along the main front the gate stands (0..1), its width and height; 0 width = none */
  gateT: number; gateW: number; gateH: number
  /** the oriel: position (0..1), width, depth, first and last storey; 0 width = none */
  orielT: number; orielW: number; orielD: number; orielF0: number; orielF1: number
  /** which storeys carry balconies, and the balcony depth and wave */
  balconies: number[]; balD: number; waveA: number; waveN: number
  /** gables on the roofline: positions (0..1), width, rise */
  gables: number[]; gableW: number; gableH: number
  /** a central studio window (Mezzara): width, storeys; 0 = none */
  studioW: number; studioF: number
  roofRise: number
}

/** A vertical quad along an edge from s0 to s1 (metres from a), offset out by `off`. */
export const panel = (out: MeshBuilder, e: ReturnType<typeof edgeAt>, s0: number, s1: number, y0: number, y1: number, c: Rgb, off: number, tag = 0): void => {
  const p = (s: number): [number, number] => [e.a.x + e.tx * s + e.nx * off, e.a.z + e.tz * s + e.nz * off]
  const [ax, az] = p(s0), [bx, bz] = p(s1)
  out.quad([[ax, y0, az], [bx, y0, bz], [bx, y1, bz], [ax, y1, az]], [e.nx, 0, e.nz], UV, c, tag)
}
/** A box sitting on the edge at s, its centre `off` out, sized along/up/out. */
export const lump = (out: MeshBuilder, e: ReturnType<typeof edgeAt>, s: number, off: number, y0: number, y1: number, w: number, d: number, c: Rgb): void => {
  const cx = e.a.x + e.tx * s + e.nx * off, cz = e.a.z + e.tz * s + e.nz * off
  // box is axis-aligned; build the turned box from four panels and a lid
  const ux = e.tx * w / 2, uz = e.tz * w / 2, vx = e.nx * d / 2, vz = e.nz * d / 2
  const P = (a: number, b: number, y: number): [number, number, number] => [cx + ux * a + vx * b, y, cz + uz * a + vz * b]
  const side = (a0: number, b0: number, a1: number, b1: number, n: [number, number, number]): void =>
    out.quad([P(a0, b0, y0), P(a1, b1, y0), P(a1, b1, y1), P(a0, b0, y1)], n, UV, c, 0)
  side(-1, 1, 1, 1, [e.nx, 0, e.nz]); side(1, -1, -1, -1, [-e.nx, 0, -e.nz])
  side(1, 1, 1, -1, [e.tx, 0, e.tz]); side(-1, -1, -1, 1, [-e.tx, 0, -e.tz])
  out.quad([P(-1, -1, y1), P(-1, 1, y1), P(1, 1, y1), P(1, -1, y1)], [0, 1, 0], UV, c, 0)
}
/** A wavy cast-iron balcony: a slab and a railing whose top rolls up and down. */
const balcony = (out: MeshBuilder, e: ReturnType<typeof edgeAt>, s0: number, s1: number, y: number, sp: Spec): void => {
  lump(out, e, (s0 + s1) / 2, sp.balD / 2, y - 0.15, y, s1 - s0, sp.balD, sp.trim)
  const n = Math.max(4, Math.round((s1 - s0) / 0.35))
  for (let i = 0; i < n; i++) {
    const a = s0 + (s1 - s0) * i / n, b = s0 + (s1 - s0) * (i + 1) / n
    const top = y + 0.95 + sp.waveA * Math.sin((i + 0.5) / n * Math.PI * 2 * sp.waveN)
    panel(out, e, a, b, y, top, sp.iron, sp.balD, surfaceTag('metal'))
  }
}

function guimard(out: MeshBuilder, fit: Fit, sp: Spec): void {
  const ring = towerRing(fit), top = sp.F0 + sp.FH * sp.floors
  faceBand(out, ring, 0, sp.F0, { kind: 'punched', wall: sp.base, glass: sp.glass, floor: sp.F0, pitch: sp.bay, solid: 0.55, arched: true, material: sp.baseMat })
  faceBand(out, ring, sp.F0, top, { kind: 'punched', wall: sp.body, glass: sp.glass, floor: sp.FH, pitch: sp.bay, solid: 0.5, material: sp.bodyMat })
  stripRoof(out, ring, top, sp.roofRise, sp.slate, 'tile')
  const fronts: number[] = []
  for (let i = 0; i < ring.length; i++) { const e = edgeAt(ring, i); if (-e.nz > 0.7 && e.L > 4) fronts.push(i) }
  const main = fronts.reduce((m, i) => (edgeAt(ring, i).L > edgeAt(ring, m).L ? i : m), fronts[0] ?? 0)
  for (const i of fronts) {
    const e = edgeAt(ring, i), L = e.L, isMain = i === main
    // the base: a proud millstone/stone plinth and a stone string course over it
    panel(out, e, 0, L, 0, 1.1, sp.base, 0.08, surfaceTag(sp.baseMat))
    lump(out, e, L / 2, 0.12, sp.F0 - 0.2, sp.F0 + 0.15, L, 0.24, sp.trim)
    // a string course every other storey, glazed sandstone against the brick
    for (let k = 2; k < sp.floors; k += 2) lump(out, e, L / 2, 0.06, sp.F0 + sp.FH * k - 0.1, sp.F0 + sp.FH * k + 0.1, L, 0.12, sp.trim)
    // balconies, broken into irregular runs (Guimard's asymmetry): skip one bay in three, offset per storey
    const nb = Math.max(1, Math.floor(L / sp.bay))
    for (const k of sp.balconies) {
      for (let b = 0; b < nb; b++) {
        if ((b + k) % 3 === 1) continue
        const s0 = (L - nb * sp.bay) / 2 + b * sp.bay + 0.25
        balcony(out, e, s0, s0 + sp.bay - 0.5, sp.F0 + sp.FH * k, sp)
      }
    }
    // the oriel: a stone box carried up the main front on a corbel
    if (isMain && sp.orielW > 0) {
      const s = L * sp.orielT, y0 = sp.F0 + sp.FH * sp.orielF0, y1 = sp.F0 + sp.FH * (sp.orielF1 + 1)
      prism(out, e.a.x + e.tx * s + e.nx * sp.orielD * 0.5, e.a.z + e.tz * s + e.nz * sp.orielD * 0.5, y0 - 1.2, y0, sp.orielD * 0.55, 6, sp.trim, 0, 0.2)
      lump(out, e, s, sp.orielD / 2, y0, y1, sp.orielW, sp.orielD, sp.trim)
      for (let k = sp.orielF0; k <= sp.orielF1; k++) panel(out, e, s - sp.orielW * 0.38, s + sp.orielW * 0.38, sp.F0 + sp.FH * k + 0.5, sp.F0 + sp.FH * k + sp.FH - 0.4, sp.glass, sp.orielD + 0.02)
      lump(out, e, s, sp.orielD / 2, y1, y1 + 1.4, sp.orielW * 0.7, sp.orielD * 0.8, sp.iron)
    }
    // the gate: a stone arch round the green cast-iron gate, its bars curling up
    if (isMain && sp.gateW > 0) {
      const s = L * sp.gateT, w = sp.gateW
      lump(out, e, s - w / 2 - 0.35, 0.25, 0, sp.gateH + 0.6, 0.7, 0.5, sp.trim)
      lump(out, e, s + w / 2 + 0.35, 0.25, 0, sp.gateH + 0.9, 0.7, 0.5, sp.trim)
      lump(out, e, s, 0.25, sp.gateH, sp.gateH + 0.7, w + 1.4, 0.5, sp.trim)
      panel(out, e, s - w / 2, s + w / 2, 0, sp.gateH, hex('#1b1f1c'), 0.02)
      const bars = 9
      for (let j = 0; j < bars; j++) {
        const c = s - w / 2 + w * (j + 0.5) / bars, rise = sp.gateH * (0.75 + 0.22 * Math.sin(j / (bars - 1) * Math.PI))
        panel(out, e, c - 0.04, c + 0.04, 0, rise, sp.iron, 0.3, surfaceTag('metal'))
        lump(out, e, c, 0.3, rise - 0.15, rise + 0.12, 0.28, 0.08, sp.iron)
      }
    }
    // the studio window: a tall glazed slot up the middle
    if (isMain && sp.studioW > 0) panel(out, e, L / 2 - sp.studioW / 2, L / 2 + sp.studioW / 2, sp.F0 + 0.4, sp.F0 + sp.FH * sp.studioF - 0.4, sp.glass, 0.05)
    // the sculpted roofline: gables of different heights, each with a dormer, and a chimney stack beside
    if (isMain) for (let g = 0; g < sp.gables.length; g++) {
      const s = L * sp.gables[g], hgt = sp.gableH * (1 - 0.25 * g)
      const steps = 5
      for (let j = 0; j < steps; j++) {
        const f = (j + 0.5) / steps, w = sp.gableW * (1 - f * 0.8)
        lump(out, e, s, 0.15, top + hgt * j / steps, top + hgt * (j + 1) / steps, w, 0.5, j % 2 ? sp.trim : sp.body)
      }
      panel(out, e, s - sp.gableW * 0.2, s + sp.gableW * 0.2, top + 0.4, top + hgt * 0.55, sp.glass, 0.42)
      prism(out, e.a.x + e.tx * (s + sp.gableW * 0.7) - e.nx * 1.5, e.a.z + e.tz * (s + sp.gableW * 0.7) - e.nz * 1.5, top, top + hgt + 1.2, 0.45, 4, sp.body, 0, 0)
    }
  }
}

/** Castel Béranger, 14 rue Jean de La Fontaine. */
export const CASTEL: Spec = {
  base: hex('#9a7f5c'), body: hex('#a8553e'), trim: hex('#e2d6bc'), iron: hex('#3f6a4d'), glass: hex('#2c3437'), slate: hex('#5d6268'),
  baseMat: 'rock', bodyMat: 'brick', F0: 4.0, FH: 2.95, floors: 6, bay: 3.3,
  gateT: 0.42, gateW: 2.6, gateH: 3.6,
  orielT: 0.7, orielW: 2.6, orielD: 0.9, orielF0: 1, orielF1: 4,
  balconies: [1, 3, 5], balD: 0.75, waveA: 0.16, waveN: 2,
  gables: [0.22, 0.7, 0.92], gableW: 3.4, gableH: 3.6,
  studioW: 0, studioF: 0, roofRise: 2.6,
}
/** Hôtel Mezzara, 60 rue Jean de La Fontaine. */
export const MEZZARA: Spec = {
  base: hex('#cfc6b0'), body: hex('#ddd3bd'), trim: hex('#a3533d'), iron: hex('#3f5d4c'), glass: hex('#2c3437'), slate: hex('#5d6268'),
  baseMat: 'ashlar', bodyMat: 'stucco', F0: 3.6, FH: 3.2, floors: 3, bay: 3.6,
  gateT: 0.2, gateW: 1.8, gateH: 2.8,
  orielT: 0, orielW: 0, orielD: 0, orielF0: 0, orielF1: 0,
  balconies: [1], balD: 0.6, waveA: 0.12, waveN: 1,
  gables: [0.5], gableW: 4.6, gableH: 3.0,
  studioW: 3.2, studioF: 2, roofRise: 2.2,
}
export const castelBeranger = (out: MeshBuilder, fit: Fit): void => guimard(out, fit, CASTEL)
export const hotelMezzara = (out: MeshBuilder, fit: Fit): void => guimard(out, fit, MEZZARA)
