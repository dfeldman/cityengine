/**
 * The parks' own structures — the follies and pavilions a rider passes in the Buttes-Chaumont, the Bois de Boulogne,
 * the Parc Monceau and the Parc André-Citroën:
 *
 * - the TEMPLE DE LA SIBYLLE (Davioud, 1869) on its rock over the Buttes-Chaumont's lake: a round temple after the
 *   Temple of Vesta at Tivoli — eight Corinthian columns on a podium, a ring of entablature, a low dome
 *   (OSM way/63224946, a 5.7 m ring of columns). The cliff is the terrain's to give;
 * - the CHÂTEAU DE BAGATELLE (Bélanger, 1777), the Comte d'Artois's folly in the Bois: a two-storey stone pavilion,
 *   balustraded, its garden front swelling into a shallow bow under a low dome (way/83064970, 19 × 18 m, the bow on
 *   its north-north-east face);
 * - the ROTONDE DE CHARTRES (Ledoux, 1787) at the Parc Monceau's gate: a barrière of the Fermiers généraux, a round
 *   drum ringed by a peristyle of sixteen Tuscan columns (smooth-shafted since 1861: Wikipedia fr, "Parc Monceau"), an upper drum of arched windows, a low dome
 *   (relation/3066029, 15 m across, 20 m high);
 * - the Parc André-Citroën's two great GREENHOUSES (Patrick Berger, 1992) at the head of the lawn, tall glass naves
 *   on a grid of mullions, their gable ends looking down the lawn to the Seine (ways 53400953 and 53401227, 45 × 15 m).
 *
 * Local frames: front −z (the manifest's `front` turns it), as in render/landmarks/kit.ts.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { box, prism, strut, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { column, dome, hex, shade } from '../../kit.ts'
import { quadN, type V3 } from './bowl.ts'

const STONE = hex('#e3dac6')
const STONE_DK = shade(STONE, 0.85)
const DARK: Rgb = [0.16, 0.17, 0.18]
const ZINC: Rgb = [0.48, 0.52, 0.54]

/** a ring of quads round the y axis: a drum's wall from y0 to y1 at radius r (to r1 at the top), `n` sides */
function drum(out: MeshBuilder, cx: number, cz: number, y0: number, y1: number, r: number, n: number, c: Rgb, tag = 0, r1 = r): void {
  prism(out, cx, cz, y0, y1, r, n, c, tag, r1)
}

/** arched openings round a drum: dark panes a hand's breadth proud of the wall */
function drumArches(out: MeshBuilder, r: number, y0: number, h: number, w: number, n: number, phase = 0): void {
  for (let i = 0; i < n; i++) {
    const a = ((i + phase) / n) * Math.PI * 2
    const s = Math.sin(a)
    const c = Math.cos(a)
    const tx = c
    const tz = -s
    const P = (u: number, y: number): V3 => [s * (r + 0.04) + tx * u, y, c * (r + 0.04) + tz * u]
    quadN(out, [P(-w / 2, y0), P(w / 2, y0), P(w / 2, y0 + h - w / 2), P(-w / 2, y0 + h - w / 2)], [s, 0, c], DARK)
    // the round head as a fan of four
    for (let k = 0; k < 4; k++) {
      const a0 = (k / 4) * Math.PI
      const a1 = ((k + 1) / 4) * Math.PI
      const yc = y0 + h - w / 2
      quadN(out, [P(0, yc), P(Math.cos(a0) * w / 2, yc + Math.sin(a0) * w / 2), P(Math.cos(a1) * w / 2, yc + Math.sin(a1) * w / 2), P(0, yc)], [s, 0, c], DARK)
    }
  }
}

/* ------------------------------------------------------------------------------------------ Temple de la Sibylle */

export function sibylleTemple(out: MeshBuilder, fit: Fit): void {
  const conc = surfaceTag('ashlar')
  const R = Math.min(Math.max(Math.min(fit.hx, fit.hz), 2.4), 4)
  const g = fit.groundAt?.(0, 0) ?? 0.5
  // the podium, three steps up
  for (let k = 0; k < 3; k++) drum(out, 0, 0, g - 0.6, g + 0.35 * (k + 1), R + 0.6 - k * 0.3, 24, STONE_DK, conc)
  const y0 = g + 1.05
  const colH = 6.2
  // eight Corinthian columns, their capitals a touch wider
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    const x = Math.sin(a) * (R - 0.35)
    const z = Math.cos(a) * (R - 0.35)
    column(out, x, z, y0, y0 + colH - 0.6, 0.3, STONE)
    prism(out, x, z, y0 + colH - 0.6, y0 + colH, 0.32, 8, STONE, 0, 0.42)
  }
  // the entablature, a ring; the low dome on its drum; the finial
  drum(out, 0, 0, y0 + colH, y0 + colH + 1.1, R, 24, STONE, conc)
  drum(out, 0, 0, y0 + colH + 1.1, y0 + colH + 1.35, R + 0.15, 24, STONE_DK, conc)
  dome(out, 0, 0, y0 + colH + 1.35, R - 0.1, R * 0.62, STONE)
  prism(out, 0, 0, y0 + colH + 1.35 + R * 0.6, y0 + colH + 2.4 + R * 0.6, 0.25, 8, STONE, 0, 0.08)
  // the dark cella's shadow behind the columns (it is open: a ceiling under the dome)
  drum(out, 0, 0, y0, y0 + 0.1, R - 0.7, 16, STONE_DK, conc)
  quadN(out, [[-R + 0.4, y0 + colH - 0.02, -R + 0.4], [R - 0.4, y0 + colH - 0.02, -R + 0.4], [R - 0.4, y0 + colH - 0.02, R - 0.4], [-R + 0.4, y0 + colH - 0.02, R - 0.4]], [0, -1, 0], shade(STONE, 0.6))
}

/* ------------------------------------------------------------------------------------------ Château de Bagatelle */

export function chateauBagatelle(out: MeshBuilder, fit: Fit): void {
  const ash = surfaceTag('ashlar')
  const hx = Math.min(Math.max(fit.hx, 7), 12)
  const hz = Math.min(Math.max(fit.hz, 6), 11)
  const g = fit.grade ?? 0.5
  const bowDeep = 3.3 * (hz / 9.3)
  const zf = -hz + bowDeep            // the garden front's plane; the bow swells out of it towards −z
  const eaves = g + 10
  const glass: Rgb = [0.2, 0.22, 0.24]
  // the block, a plinth, two storeys of tall windows, the cornice and balustrade
  box(out, 0, (g - 0.5 + eaves) / 2, (zf + hz) / 2, hx, (eaves - g + 0.5) / 2, (hz - zf) / 2, STONE, ash)
  box(out, 0, g + 0.4, (zf + hz) / 2, hx + 0.3, 0.9, (hz - zf) / 2 + 0.3, STONE_DK, ash)
  box(out, 0, g + 5, (zf + hz) / 2, hx + 0.15, 0.25, (hz - zf) / 2 + 0.15, STONE_DK, ash)
  box(out, 0, eaves + 0.35, (zf + hz) / 2, hx + 0.45, 0.35, (hz - zf) / 2 + 0.45, STONE_DK, ash)
  for (const [z, n] of [[zf - 0.03, -1], [hz + 0.03, 1]] as const) {
    for (let i = 0; i < 5; i++) {
      const x = -hx + 1.8 + ((2 * hx - 3.6) * i) / 4
      if (n < 0 && Math.abs(x) < 4.5) continue          // the bow covers the middle of the garden front
      for (const [y0, h] of [[g + 1.5, 3.2], [g + 6, 2.8]]) box(out, x, y0 + h / 2, z, 0.65, h / 2, 0.03, glass, 0)
    }
  }
  for (const [x, n] of [[-hx - 0.03, -1], [hx + 0.03, 1]] as const) {
    for (let i = 0; i < 4; i++) {
      const z = zf + 1.5 + ((hz - zf - 3) * i) / 3
      for (const [y0, h] of [[g + 1.5, 3.2], [g + 6, 2.8]]) box(out, x, y0 + h / 2, z, 0.03, h / 2, 0.65, glass, 0)
      void n
    }
  }
  // the balustrade round the roof
  const by = eaves + 0.7
  for (const [x0, z0, x1, z1] of [[-hx, zf, hx, zf], [-hx, hz, hx, hz], [-hx, zf, -hx, hz], [hx, zf, hx, hz]]) {
    const L = Math.hypot(x1 - x0, z1 - z0)
    const m = Math.round(L / 0.5)
    for (let k = 0; k <= m; k++) box(out, x0 + ((x1 - x0) * k) / m, by + 0.45, z0 + ((z1 - z0) * k) / m, 0.09, 0.4, 0.09, STONE, ash)
    box(out, (x0 + x1) / 2, by + 0.95, (z0 + z1) / 2, Math.max(0.16, Math.abs(x1 - x0) / 2), 0.1, Math.max(0.16, Math.abs(z1 - z0) / 2), STONE, ash)
  }
  // the flat roof behind the balustrade
  box(out, 0, eaves + 0.75, (zf + hz) / 2, hx - 0.3, 0.05, (hz - zf) / 2 - 0.3, ZINC, 0)
  // the bow: a half-drum on the garden front, its windows, and the low dome over the salon behind it
  const br = 4.4 * (hx / 9.6)
  const bz = zf + br - bowDeep
  for (let k = 0; k < 10; k++) {
    const a0 = Math.PI + (k / 10) * Math.PI
    const a1 = Math.PI + ((k + 1) / 10) * Math.PI
    const P = (a: number, y: number, r = br): V3 => [Math.cos(a) * r, y, bz + Math.sin(a) * r]
    const am = (a0 + a1) / 2
    quadN(out, [P(a0, g - 0.5), P(a1, g - 0.5), P(a1, eaves), P(a0, eaves)], [Math.cos(am), 0, Math.sin(am)], STONE, ash)
    quadN(out, [P(a0, eaves, br + 0.4), P(a1, eaves, br + 0.4), P(a1, eaves + 0.7, br + 0.4), P(a0, eaves + 0.7, br + 0.4)], [Math.cos(am), 0, Math.sin(am)], STONE_DK, ash)
    if (k % 2 === 1) for (const [y0, h] of [[g + 1.5, 3.2], [g + 6, 2.8]]) {
      const Q = (u: number, y: number): V3 => [Math.cos(am) * (br + 0.03) - Math.sin(am) * u, y, bz + Math.sin(am) * (br + 0.03) + Math.cos(am) * u]
      quadN(out, [Q(-0.6, y0), Q(0.6, y0), Q(0.6, y0 + h), Q(-0.6, y0 + h)], [Math.cos(am), 0, Math.sin(am)], glass)
    }
  }
  drum(out, 0, bz + 1.2, eaves + 0.7, eaves + 2.2, br * 0.85, 20, STONE, ash)
  dome(out, 0, bz + 1.2, eaves + 2.2, br * 0.85, br * 0.42, ZINC)
  prism(out, 0, bz + 1.2, eaves + 2.2 + br * 0.4, eaves + 3.2 + br * 0.4, 0.5, 8, ZINC, 0, 0.3)
  // the court front (+z): a frontispiece of four Tuscan columns carrying a balcony
  for (const x of [-3, -1, 1, 3]) column(out, x, hz + 1.1, g + 0.8, g + 4.8, 0.3, STONE)
  box(out, 0, g + 5.1, hz + 0.7, 3.8, 0.3, 0.9, STONE_DK, ash)
  box(out, 0, g + 2.4, hz + 0.03, 1.1, 1.6, 0.03, glass, 0)
}

/* ------------------------------------------------------------------------------------------ Rotonde de Chartres */

export function rotondeChartres(out: MeshBuilder, fit: Fit): void {
  const ash = surfaceTag('ashlar')
  const R = Math.min(Math.max(Math.min(fit.hx, fit.hz), 5), 8.5)
  const g = fit.groundAt?.(0, 0) ?? 0.5
  // three steps, the core drum, the peristyle of sixteen columns, its entablature
  for (let k = 0; k < 3; k++) drum(out, 0, 0, g - 0.6, g + 0.25 * (k + 1), R - k * 0.3, 32, STONE_DK, ash)
  const y0 = g + 0.75
  const core = R - 2.4
  drum(out, 0, 0, y0, y0 + 7, core, 24, STONE, ash)
  drumArches(out, core, y0 + 0.6, 4.6, 1.4, 8)
  for (let i = 0; i < 16; i++) {
    const a = ((i + 0.5) / 16) * Math.PI * 2
    const x = Math.sin(a) * (R - 0.75)
    const z = Math.cos(a) * (R - 0.75)
    column(out, x, z, y0, y0 + 6.2, 0.42, STONE)
    box(out, x, y0 + 6.3, z, 0.52, 0.1, 0.52, STONE, ash)
  }
  drum(out, 0, 0, y0 + 6.4, y0 + 7.4, R - 0.35, 32, STONE, ash)
  drum(out, 0, 0, y0 + 7.4, y0 + 7.8, R - 0.15, 32, STONE_DK, ash)
  // the peristyle's ceiling, and the terrace round the upper drum
  drum(out, 0, 0, y0 + 7.8, y0 + 7.9, R - 0.2, 32, ZINC, 0, core + 0.5)
  // the upper drum with its twelve arched windows, the cornice, the low zinc dome
  const top = y0 + 7.8
  drum(out, 0, 0, top, top + 7, core + 0.4, 24, STONE, ash)
  drumArches(out, core + 0.4, top + 1.2, 4, 1.3, 12, 0.5)
  drum(out, 0, 0, top + 7, top + 7.6, core + 0.8, 24, STONE_DK, ash)
  dome(out, 0, 0, top + 7.6, core + 0.6, 2.6, ZINC)
  prism(out, 0, 0, top + 9.9, top + 10.9, 0.7, 8, ZINC, 0, 0.5)
}

/* ------------------------------------------------------------------------------------------ the Citroën greenhouses */

export function citroenGreenhouse(out: MeshBuilder, fit: Fit): void {
  const glassT = surfaceTag('glass')
  const metal = surfaceTag('metal')
  const hx = Math.min(Math.max(fit.hx, 10), 26)
  const hz = Math.min(Math.max(fit.hz, 5), 9)
  const g = fit.grade ?? 0.5
  const H = 15
  const ridge = H + 2.2
  const GL: Rgb = [0.6, 0.7, 0.72]
  const LEAF: Rgb = [0.24, 0.38, 0.24]
  const FR: Rgb = [0.38, 0.36, 0.33]               // the frame, dark timber and steel
  const STONE_B: Rgb = [0.72, 0.7, 0.66]
  // a granite plinth
  box(out, 0, g + 0.2, 0, hx + 0.3, 0.7, hz + 0.3, STONE_B, surfaceTag('granite'))
  const y0 = g + 0.9
  // the long walls and the two gable ends: panes, the plants inside darkening the lower ones, the mullion grid
  const walls: [[number, number], [number, number], [number, number]][] = [
    [[-hx, -hz], [hx, -hz], [0, -1]], [[hx, hz], [-hx, hz], [0, 1]], [[-hx, hz], [-hx, -hz], [-1, 0]], [[hx, -hz], [hx, hz], [1, 0]],
  ]
  for (const [a, b, n] of walls) {
    const L = Math.hypot(b[0] - a[0], b[1] - a[1])
    const m = Math.max(2, Math.round(L / 2.5))
    const gable = n[1] === 0
    for (let k = 0; k < m; k++) {
      const f0 = k / m
      const f1 = (k + 1) / m
      const pa = [a[0] + (b[0] - a[0]) * f0, a[1] + (b[1] - a[1]) * f0]
      const pb = [a[0] + (b[0] - a[0]) * f1, a[1] + (b[1] - a[1]) * f1]
      // the gable's top follows the roof's pitch
      const top = (p: number[]): number => (gable ? H + (ridge - H) * (1 - Math.abs(p[1]) / hz) : H)
      const leaf = 3 + 3 * Math.abs(Math.sin(k * 2.1 + a[0] * 0.13))
      quadN(out, [[pa[0], y0, pa[1]], [pb[0], y0, pb[1]], [pb[0], g + leaf, pb[1]], [pa[0], g + leaf, pa[1]]], [n[0], 0, n[1]], LEAF, glassT)
      quadN(out, [[pa[0], g + leaf, pa[1]], [pb[0], g + leaf, pb[1]], [pb[0], g + top(pb), pb[1]], [pa[0], g + top(pa), pa[1]]], [n[0], 0, n[1]], GL, glassT)
      strut(out, [pa[0] + n[0] * 0.1, y0, pa[1] + n[1] * 0.1], [pa[0] + n[0] * 0.1, g + top(pa), pa[1] + n[1] * 0.1], 0.22, 0.22, FR, metal, false)
    }
    // the transoms, every three metres
    for (let y = 3; y < H; y += 3) strut(out, [a[0] + n[0] * 0.1, g + y, a[1] + n[1] * 0.1], [b[0] + n[0] * 0.1, g + y, b[1] + n[1] * 0.1], 0.16, 0.16, FR, metal, false)
  }
  // the roof: two glass slopes to the ridge along the length, the rafters over them
  for (const s of [-1, 1]) {
    quadN(out, [[-hx, g + H, s * hz], [hx, g + H, s * hz], [hx, g + ridge, 0], [-hx, g + ridge, 0]], [0, 1, s * 0.3], GL, glassT)
    for (let x = -hx; x <= hx + 0.01; x += 2.5) strut(out, [x, g + H + 0.1, s * hz], [x, g + ridge + 0.1, 0], 0.18, 0.18, FR, metal, false)
  }
  strut(out, [-hx, g + ridge + 0.15, 0], [hx, g + ridge + 0.15, 0], 0.35, 0.35, FR, metal, false)
  for (const s of [-1, 1]) strut(out, [-hx, g + H + 0.1, s * hz], [hx, g + H + 0.1, s * hz], 0.3, 0.3, FR, metal, false)
}

/** one name per greenhouse (a builder named by two entries reads as a dead duplicate to the audits: kezar.ts) */
export const CITROEN = { citroenSerreNord: citroenGreenhouse, citroenSerreSud: citroenGreenhouse }
