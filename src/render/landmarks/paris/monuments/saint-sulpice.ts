import type { MeshBuilder } from '../../../buildings.ts'
import { prism } from '../../../models.ts'
import { block, classicalColumn, hex, roof, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { archOn, balustrade, fitted, pedimentOn, type Pal } from '../palaces/common.ts'
import { domeOf, drumArches, FIXED, quarter, roundBalustrade } from './common.ts'

/** the design footprint: OSM way 16077204's box turned to the church's axis (local −z faces bearing 262.6, the place) */
const HX = 28.9
const HZ = 61.2

/**
 * SAINT-SULPICE (Gittard and Le Vau's church, 1646–1745; the front Servandoni's, 1732–45; the north tower Chalgrin's,
 * 1777–80), the second church of Paris, over its square and the Fontaine des Quatre-Évêques. What everyone sees:
 *
 * - the FRONT: 58 m wide, two storeys of colonnade one over the other — the Doric portico below, two columns deep, the
 *   Ionic loggia over it — a balustrade along the top, and no pediment;
 * - the two UNEQUAL TOWERS either end of it: the north one Chalgrin finished (its square storey, its round stage ringed
 *   with columns, the balustraded crown; 73 m), the south one left as the Revolution found it, plainer and lower (68 m);
 * - behind, the long nave under its slate roof (OSM 42 m), the transept with its two-storeyed porches, the chapels
 *   between the buttresses, and the dome of the Lady Chapel at the east end.
 *
 * The plan and the body's heights are OSM's parts (1460464639…1460576478, 561766178, 664222021, 1432780454; osmium,
 * 2026-10-29); the towers' tops are Wikipedia's 73 and 68 m — OSM's tower parts stop at 58.4 and 56.4, the square
 * storeys' heads. Local −x is north.
 */
export function saintSulpice(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const stone = hex('#d9cfbc')
  const p: Pal = {
    stone, trim: shade(stone, 1.05), deep: shade(stone, 0.82), glass: [0.2, 0.21, 0.23], slate: hex('#4d5458'),
    lead: [0.34, 0.37, 0.38], gold: [0.8, 0.65, 0.3], dark: [0.15, 0.15, 0.15], bronze: [0.3, 0.33, 0.29],
  }
  const zf = -61.2
  const zw = -54.6          // the wall behind the colonnades

  // ---- the body: the chapels and aisles between the buttresses, the nave, the transept, the Lady Chapel
  block(out, -28.9, 28.9, -47.6, 44.0, 0, 19.5, stone)
  block(out, -29.2, 29.2, -47.6, 44.0, 18.8, 19.6, p.trim)
  block(out, -8.6, 8.6, -47.6, 36.7, 19.5, 34.0, stone)
  roof(out, -9.0, 9.0, -47.6, 36.7, 34.0, 8.0, 9.0, 4, p.slate)
  block(out, -24.2, 24.2, -6.3, 10.8, 19.5, 34.0, stone)
  roof(out, -24.6, 24.6, -6.5, 11.0, 34.0, 8.0, 4, 8.7, p.slate)
  for (const f of ['-x', '+x'] as const) {
    const plane = f === '-x' ? -8.6 : 8.6
    for (let z = -42; z < 34; z += 7.2) if (z < -8 || z > 12) archOn(out, f, plane, z, 22.5, 2.6, 8.2, p.glass)
    for (let z = -44; z < 42; z += 7.2) archOn(out, f, f === '-x' ? -28.9 : 28.9, z, 6.0, 2.4, 9.0, p.glass)
    // the transept's porches: two storeys of columns and a pediment on each end
    const tp = f === '-x' ? -28.9 : 28.9
    const s = f === '-x' ? -1 : 1
    block(out, Math.min(s * 24.2, tp), Math.max(s * 24.2, tp), -6.3, 10.8, 19.5, 34.0, stone)
    pedimentOn(out, f, tp, -6.3, 10.8, 34.0, 4.5, 0.6, p.trim)
    for (const z of [-3.6, 0.6, 3.6, 7.9]) {
      classicalColumn(out, tp + s * 0.9, z, 0.6, 15.5, 0.6, stone, { order: 'doric', tier: 'mid' })
      classicalColumn(out, tp + s * 0.9, z, 17.0, 31.5, 0.5, stone, { order: 'corinthian', tier: 'mid' })
    }
    archOn(out, f, tp, 2.25, 0, 3.6, 9.0, p.dark)
    archOn(out, f, tp, 2.25, 19.5, 3.0, 9.5, p.glass)
  }
  // the buttresses with their volutes along the nave, carrying the clerestory
  for (let z = -45.5; z < 36; z += 7.2) {
    if (z > -8 && z < 12) continue
    for (const s of [-1, 1]) block(out, s > 0 ? 8.6 : -12.4, s > 0 ? 12.4 : -8.6, z - 0.8, z + 0.8, 19.5, 27.0, shade(stone, 0.96))
  }
  // the Lady Chapel at the east end, its dome
  prism(out, 0, 50.5, 0, 22.0, 8.6, 20, stone, FIXED)
  prism(out, 0, 50.5, 21.4, 22.4, 9.0, 20, p.trim, FIXED)
  domeOf(out, 0, 50.5, 22.4, 8.4, 6.6, p.lead, quarter, { sides: 20, steps: 7, ribs: 10 })
  prism(out, 0, 50.5, 29.0, 31.5, 1.0, 8, p.trim, FIXED)

  // ---- the front between the towers: the two storeys of colonnade, the wall behind, the balustrade
  block(out, -15.5, 14.2, zw, -47.6, 0, 33.0, stone)
  for (let k = 0; k < 5; k++) block(out, -15.5, 14.2, zf + k * 0.45, zw, 0, 0.44 * (k + 1), k % 2 ? stone : p.trim)
  const cols = [-12, -7.2, -2.4, 2.4, 7.2, 12].map((d) => -0.65 + d)
  for (const z of [-59.8, -57.3]) {
    for (const x of cols) {
      classicalColumn(out, x, z, 2.2, 15.4, 0.85, stone, { order: 'doric', tier: z < -58 ? 'near' : 'mid', heading: Math.PI })
      classicalColumn(out, x, z, 18.2, 30.0, 0.7, stone, { order: 'ionic', tier: z < -58 ? 'near' : 'mid', heading: Math.PI })
    }
  }
  // the Doric entablature with its triglyphs, the gallery's floor, the Ionic entablature, the balustrade
  block(out, -15.5, 14.2, zf, zw, 15.4, 17.0, p.trim)
  for (let x = -15; x < 14; x += 1.6) block(out, x - 0.3, x + 0.3, zf - 0.06, zf, 15.6, 16.6, p.deep)
  block(out, -15.5, 14.2, zf, zw, 17.0, 18.2, stone)
  block(out, -15.5, 14.2, zf, zw, 30.0, 32.0, p.trim)
  balustrade(out, -15.5, 14.2, zf, zw, 32.0, p, { sides: ['-z'], h: 1.1 })
  // the doors and windows deep in the loggias
  for (const x of [-7.4, -0.65, 6.1]) {
    archOn(out, '-z', zw, x, 2.2, 3.0, 8.5, p.dark, 0.06)
    archOn(out, '-z', zw, x, 19.0, 2.6, 7.5, p.glass, 0.06)
  }

  // ---- the towers: north (−x) Chalgrin's, south (+x) unfinished
  tower(out, -21.8, -54.4, 6.3, p, true)
  tower(out, 21.0, -54.3, 6.8, p, false)
}

/** A tower at (cx, cz), half-width `hw`: the square base to the front's balustrade, the square belfry storey, the round stage, the crown. */
function tower(out: MeshBuilder, cx: number, cz: number, hw: number, p: Pal, north: boolean): void {
  const c = p.stone
  block(out, cx - hw, cx + hw, cz - hw - 0.5, cz + hw + 0.5, 0, 33.0, c)
  block(out, cx - hw - 0.3, cx + hw + 0.3, cz - hw - 0.8, cz + hw + 0.8, 30.0, 32.0, p.trim)
  for (const f of ['-z', '-x', '+x'] as const) {
    const plane = f === '-z' ? cz - hw - 0.5 : f === '-x' ? cx - hw : cx + hw
    const t = f === '-z' ? cx : cz
    archOn(out, f, plane, t, 3.0, 2.6, 7.0, p.dark)
    archOn(out, f, plane, t, 19.0, 2.4, 7.0, p.glass)
  }
  // the square belfry storey: an arched opening on each face between paired columns
  const sq = hw - 0.8
  block(out, cx - sq, cx + sq, cz - sq, cz + sq, 33.0, 49.0, c)
  for (const f of ['-z', '+z', '-x', '+x'] as const) {
    const plane = f === '-z' ? cz - sq : f === '+z' ? cz + sq : f === '-x' ? cx - sq : cx + sq
    const t = f === '-z' || f === '+z' ? cx : cz
    archOn(out, f, plane, t, 35.5, 3.4, 10.0, p.dark, 0.08)
    if (north) {
      for (const d of [-4.1, -3.1, 3.1, 4.1]) {
        const x = f === '-z' || f === '+z' ? cx + d : plane + (f === '-x' ? -0.6 : 0.6)
        const z = f === '-z' || f === '+z' ? plane + (f === '-z' ? -0.6 : 0.6) : cz + d
        classicalColumn(out, x, z, 33.6, 46.8, 0.38, c, { order: 'corinthian', tier: 'mid' })
      }
    }
  }
  block(out, cx - sq - 0.6, cx + sq + 0.6, cz - sq - 0.6, cz + sq + 0.6, 46.8, 49.0, p.trim)
  balustrade(out, cx - sq - 0.4, cx + sq + 0.4, cz - sq - 0.4, cz + sq + 0.4, 49.0, p, { h: 1.0 })
  // the round stage: Chalgrin's ringed with columns and crowned with a balustrade; the south one's plainer and lower
  const r = 4.6
  if (north) {
    prism(out, cx, cz, 49.0, 66.5, r, 24, c, FIXED)
    drumArches(out, cx, cz, r, 52.5, 6, 1.8, 7.5, p.dark)
    for (let i = 0; i < 12; i++) {
      const a = ((i + 0.5) / 12) * Math.PI * 2
      classicalColumn(out, cx + Math.sin(a) * (r + 0.6), cz + Math.cos(a) * (r + 0.6), 50.0, 65.0, 0.36, c, { order: 'corinthian', tier: 'far' })
    }
    prism(out, cx, cz, 65.0, 66.8, r + 1.1, 24, p.trim, FIXED)
    roundBalustrade(out, cx, cz, r + 0.8, 66.8, p.trim, 1.0, 24)
    prism(out, cx, cz, 66.8, 71.6, r - 1.0, 16, c, FIXED)
    prism(out, cx, cz, 71.6, 73.0, r - 0.6, 16, p.trim, FIXED)
  } else {
    prism(out, cx, cz, 49.0, 63.5, r + 0.2, 16, c, FIXED)
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      prism(out, cx + Math.sin(a) * (r + 0.35), cz + Math.cos(a) * (r + 0.35), 49.0, 63.0, 0.4, 4, shade(c, 0.97), FIXED)
    }
    prism(out, cx, cz, 63.0, 65.0, r + 0.9, 16, p.trim, FIXED)
    roundBalustrade(out, cx, cz, r + 0.6, 65.0, p.trim, 1.0, 20)
    prism(out, cx, cz, 65.0, 68.0, r - 1.2, 12, c, FIXED)
  }
}
