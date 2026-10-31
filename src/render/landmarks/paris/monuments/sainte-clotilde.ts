import type { MeshBuilder } from '../../../buildings.ts'
import { box, prism } from '../../../models.ts'
import { block, roof, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { FIXED, graded } from './common.ts'
import { church } from './churches.ts'
import { boxFaces, boxOn, buttress, chevet, faceFrame, flank, flyers, gable, gothicBalustrade, gothicPortal, louvred, pinnacle as stackedPinnacle, roseWindow, spire, traceryWindow, statue } from './gothic.ts'

/*
 * SAINTE-CLOTILDE (Gau, then Ballu, 1846–57), the first neo-Gothic church of Paris, over the Square Samuel-Rousseau
 * in the 7th: what a rider sees from the Rue Las Cases and from across the river are its TWIN SPIRES, open octagons
 * of stone with crockets up their edges, to 69 m (OSM's parts 685771702 / 1463207304: the towers from 28.2 to 66, the
 * spire's cone 21.6 of it). Under them the front: three portals each under its gable, the rose between the towers
 * and the gable with its statue; behind, a long body of 13th-century pattern — aisles with pinnacled buttresses, the
 * high nave and transept under steep slate, the apse with its ring of chapels.
 *
 * In the city the towers came out as two plain shafts with flat tops (2026-10-29); the model replaces the outline
 * (way 64952290) and the parts nested under it. Frame: −z the front on the Parvis Maurice-Druon (bearing 25.9), the
 * apse toward +z; design metres off OSM's footprint. Batch 5 (2026-10-31): the masses stand; the dress is the Gothic kit's.
 */
const HX = 19.25
const HZ = 46.7

export function sainteClotilde(out: MeshBuilder, fit: Fit): void {
  graded(out, fit, HX, HZ, (q) => clotilde(q))
}

function clotilde(out: MeshBuilder): void {
  const p = church('#a69e8e', '#3f4a52')
  const door: [number, number, number] = [0.12, 0.08, 0.055]
  const zf = -46.6
  // the aisles and side chapels to 17.5 under their lean-to roofs, the nave and choir to 28.2 with the steep roof to 37
  block(out, -14.0, 14.0, -38, 28, 0, 17.5, p.stone)
  roof(out, -14.3, 14.3, -38, 28, 17.5, 3.6, 8.5, 0.01, p.slate)
  block(out, -5.4, 5.4, -38, 30, 17.5, 28.2, p.stone)
  roof(out, -5.8, 5.8, -38, 30, 28.2, 8.8, 5.8, 0.01, p.slate)
  block(out, -0.07, 0.07, -38, 30, 36.95, 37.35, p.lead)
  // the transept: its arms to the full width, gables with roses at the ends
  block(out, -17.8, 17.8, -2.3, 9.6, 0, 28.2, p.stone)
  roof(out, -18.1, 18.1, -2.5, 9.8, 28.2, 8.8, 0.01, 6.15, p.slate)
  for (const s of [-1, 1]) {
    const f = s < 0 ? '-x' : '+x'
    const x = s * 17.8
    const tr = faceFrame(out, f, x)
    gable(tr, 3.65, 28.2, 11.9, 8.8, p.stone, { d: 0.05, crockets: 3, finial: 1.8 })
    roseWindow(tr, 3.65, 21.4, 3.4, { stone: p.trim, glass: p.glass, spokes: 12, d: 0.34, panel: 4.1 })
    traceryWindow(tr, 3.65, 31.2, 1.7, 2.8, { stone: p.trim, glass: p.glass, head: 'pointed', lights: 1, far: true })
    gothicPortal(tr, 3.65, 0.1, 6.2, 9.6, { stone: p.trim, dark: p.dark, door, depth: 0.9, orders: 3, head: 'pointed' })
    gable(tr, 3.65, 9, 7.2, 4.4, p.stone, { d: 0.55, crockets: 2, finial: 1 })
    gothicBalustrade(tr, -2.3, 9.6, 16.4, 1, { stone: p.trim, d: 0.34, pitch: 0.9 })
    for (const z of [-2.3, 9.6]) {
      buttress(tr, z, 0, 26, 1.4, 1.5, p.stone, 4)
      stackedPinnacle(out, x + s * 0.3, z, 26, 8, 0.8, p.trim, 2)
    }
    // the bays: the aisle windows and buttresses, the clerestory, the flyers from the piers with their pinnacles
    const aisle = faceFrame(out, f, s * 14)
    const nave = faceFrame(out, f, s * 5.4)
    flank(aisle, -37.5, -2.3, 6, { stone: p.stone, glass: p.glass, y0: 3, h: 10.8, lights: 3, far: false, plinth: 1.2, string: true, cornice: 17.5, buttress: { y1: 16.4, d: 1.1, w: 1, pinnacle: 4 } })
    flank(aisle, 9.6, 27.8, 3, { stone: p.stone, glass: p.glass, y0: 3, h: 10.8, lights: 3, far: false, plinth: 1.2, string: true, cornice: 17.5, buttress: { y1: 16.4, d: 1.1, w: 1, pinnacle: 4 } })
    gothicBalustrade(aisle, -37.5, 28, 17.5, 0.8, { stone: p.trim, d: 0.3, pitch: 1.7 })
    flank(nave, -37.5, -2.3, 6, { stone: p.stone, glass: p.glass, y0: 19.6, h: 7.4, lights: 3, share: 0.7, cornice: 28.2 })
    flank(nave, 9.6, 29.8, 4, { stone: p.stone, glass: p.glass, y0: 19.6, h: 7.4, lights: 3, share: 0.7, cornice: 28.2 })
    gothicBalustrade(nave, -37.5, 30, 28.2, 0.8, { stone: p.trim, d: 0.3, pitch: 1.8 })
    flyers(out, [-31.65, -25.8, -19.9, -14.05, -8.2, 15.65, 21.7], s * 12.6, 17.5, 23.3, s * 5.4, 26.9, p.stone, { w: 1.1, pin: 4 })
  }
  // the apse and its chapels
  block(out, -14, 14, 27.8, 28.1, 17.4, 17.6, p.lead)
  chevet(out, 0, 28, 14.0, 0, 17.5, 21.0, p.stone, p.slate, p.glass, { n: 9, win: { y0: 3, h: 10.8, lights: 2 }, lean: true, butt: 1 })
  chevet(out, 0, 30, 5.4, 17.5, 28.2, 37, p.stone, p.slate, p.glass, { n: 7, win: { y0: 19.6, h: 7.4, lights: 2 }, rad: { out: 6, y0: 17.5, y1: 23.3, to: 26.8 } })

  // the front: the block between and under the towers, the three portals with their gables, the rose, the gallery,
  // the central gable and its statue
  block(out, -11.1, 11.1, zf + 1.5, -37.8, 0, 28.2, p.stone)
  const fr = faceFrame(out, '-z', zf)
  const wall = faceFrame(out, '-z', zf + 1.5)
  for (const [x, w, h, g] of [[0, 6.4, 10, 6.0], [-8.6, 4.8, 8, 4.5], [8.6, 4.8, 8, 4.5]] as const) {
    block(out, x - w / 2 - 0.5, x + w / 2 + 0.5, zf, zf + 1.6, 0, h + 0.8, p.stone)
    gothicPortal(fr, x, 0.1, w, h, { stone: p.trim, dark: p.dark, door, depth: 0.95, orders: 3, head: 'pointed' })
    gable(fr, x, h + 0.8, w + 1, g, p.stone, { d: 0.1, crockets: 3, finial: 1.3 })
    for (const s of [-1, 1]) stackedPinnacle(out, x + s * (w / 2 + 0.5), zf + 0.8, h + 0.8, 3.2, 0.42, p.trim)
  }
  roseWindow(wall, 0, 20.2, 3.7, { stone: p.trim, glass: p.glass, spokes: 16, d: 0.34, panel: 4.4 })
  boxOn(wall, -5.6, 5.6, 15.5, 16, 0, 0.4, p.trim, true)
  gothicBalustrade(wall, -5.2, 5.2, 25.2, 1, { stone: p.trim, d: 0.4, pitch: 0.8 })
  gable(faceFrame(out, '-z', zf + 1.5), 0, 26.2, 10, 10.4, p.stone, { d: 0.05, crockets: 5, finial: 0 })
  roseWindow(wall, 0, 30.0, 1.35, { stone: p.trim, glass: p.glass, spokes: 8, d: 0.2, far: true })
  statue(out, 0, 36.7, zf + 1.9, 2.2, p.trim)
  // the towers: square, buttressed at the corners, to the gallery at 28; the belfry stage with its tall openings and
  // corner pinnacles to 44; then the octagonal spire of open stone, crockets up its edges, to 66 and the cross
  for (const s of [-1, 1]) {
    const tx = s * 8.5
    const tz = -40.5
    block(out, tx - 3.9, tx + 3.9, tz - 4.6, tz + 3.9, 0, 28.2, p.stone)
    const lower = boxFaces(out, tx - 3.9, tx + 3.9, tz - 4.6, tz + 3.9, ['-z', s < 0 ? '-x' : '+x'])
    for (const { fr: t, m, u0, u1 } of lower) {
      traceryWindow(t, m, 13.5, 3.6, 10.6, { stone: p.trim, glass: p.glass, head: 'pointed', lights: 2, far: true })
      for (const y of [12.6, 24.8]) boxOn(t, u0 - 0.1, u1 + 0.1, y, y + 0.35, 0, 0.35, p.trim, true)
      for (const u of [u0 + 0.1, u1 - 0.1]) {
        buttress(t, u, 0, 30, 1.2, 1.3, p.stone, 4)
      }
      gothicBalustrade(t, u0, u1, 28.6, 0.8, { stone: p.trim, d: 0.26, pitch: 1 })
    }
    for (const [bx, bz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) stackedPinnacle(out, tx + bx * 3.9, tz + bz * 4.2, 30, 4.4, 0.62, p.trim, 2)
    block(out, tx - 4.2, tx + 4.2, tz - 4.9, tz + 4.2, 27.6, 28.6, p.trim)
    // the belfry stage
    block(out, tx - 3.1, tx + 3.1, tz - 3.1, tz + 3.1, 28.6, 43.6, p.stone)
    for (const { fr: t, m, u0, u1 } of boxFaces(out, tx - 3.1, tx + 3.1, tz - 3.1, tz + 3.1)) {
      for (const d of [-1.3, 1.3]) louvred(t, m + d, 30.8, 1.9, 9.6, p.trim, p.dark, { lights: 1, slats: 7 })
      gable(t, m, 40.8, 6.2, 5.2, p.stone, { d: 0.14, finial: 1.1, crockets: 2 })
      void u0; void u1
    }
    for (const [bx, bz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) stackedPinnacle(out, tx + bx * 3.0, tz + bz * 3.0, 40.5, 7.0, 0.7, p.trim, 2)
    // the spire: an octagon drawn in to the point, its eight edges ribbed with crockets, lucarnes at its foot
    prism(out, tx, tz, 43.6, 44.4, 3.3, 8, p.trim, FIXED)
    spire(out, tx, tz, 44.4, 21.6, 2.9, shade(p.stone, 0.96), { rib: p.trim, crockets: 6, lucarnes: 4, lucarneAt: 0.1, lucarneW: 0.65, cross: p.dark, dark: p.dark })
    for (let i = 0; i < 8; i++) {
      // the bands of openings up the spire
      for (const yy of [53, 58.5]) {
        const b = ((i + 0.5) / 8) * Math.PI * 2 + Math.PI / 8
        const r = 2.9 * (1 - (yy - 44.4) / 21.6) + 0.06 * ((yy - 44.4) / 21.6)
        box(out, tx + Math.sin(b) * (r * 0.93 + 0.02), yy, tz + Math.cos(b) * (r * 0.93 + 0.02), 0.14, 0.6, 0.14, p.dark, FIXED)
      }
    }
  }
}
