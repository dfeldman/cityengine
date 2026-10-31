import type { MeshBuilder } from '../../../buildings.ts'
import { box, prism } from '../../../models.ts'
import { beam, block, roof, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { FIXED, graded, type P2, ring, walls } from './common.ts'
import { church } from './churches.ts'
import { boxFaces, boxOn, buttress, chevet, faceFrame, flank, flyers, gable, gothicBalustrade, gothicPortal, louvred, niche, pinnacle as stackedPinnacle, roseWindow, spire, traceryWindow } from './gothic.ts'

/*
 * SAINT-SÉVERIN (13th–16th c.), in the lanes of the Latin Quarter between the Rue Saint-Jacques and the Rue de la
 * Harpe: flamboyant Gothic, and from the street a crowd of GABLES — the double aisles and the chapels down the south
 * side each under its own little transverse roof, pinnacles and gargoyles between them, the west front's great
 * flamboyant window under its gable and balustrade — and over them the TOWER at the north-west corner (OSM's
 * 664169089 to 29.2, its slate spire 1465166134 to 45.2) with its belfry and the little lantern up the spire. The
 * east end is the famous double ambulatory, round under a ring of low roofs.
 *
 * In the city OSM's parts gave a fair massing but flat aisles and a blunt tower top (2026-10-29); the model replaces
 * the outline (way 19740659) and its parts. Frame: −z the west front on the Rue des Prêtres-Saint-Séverin (bearing
 * 290.3), +x south; design metres off OSM's footprint.
 *
 * Batch 5 (2026-10-31): the plan and heights are the first attempt's; every opening, gable and flyer is the Gothic kit's.
 */
const HX = 19.45
const HZ = 26.45

const PLAN: P2[] = ring([
  -12.5, -26.5, 16.8, -26.5, 19.0, -25.6, 19.4, 11.9, 18.0, 16.6, 14.8, 21.3, 9.3, 25.3, 2.4, 26.5, -4.7, 25.3, -9.8, 21.5,
  -13.9, 24.5, -17.3, 24.6, -19.3, 22.5, -19.4, 19.1, -16.9, -20.5, -13.5, -20.3, -13.4, -25.7,
])

export function saintSeverin(out: MeshBuilder, fit: Fit): void {
  graded(out, fit, HX, HZ, (q) => severin(q))
}

function severin(out: MeshBuilder): void {
  const p = church('#a2998a', '#3a4449')
  const cx = 2.5
  // the double aisles and chapels to 10.5, their lead flat, and a row of little transverse gables along each side
  walls(out, PLAN, 0, 10.5, p.stone, p.lead)
  const south = faceFrame(out, '+x', 19.25)
  const north = faceFrame(out, '-x', -16.9)
  for (let z = -18.5; z < 12; z += 3.95) {
    roof(out, 8.3, 19.3, z - 1.9, z + 1.9, 10.5, 2.4, 0.01, 1.9, p.slate)
    roof(out, -16.6, -3.3, z - 1.9, z + 1.9, 10.5, 2.0, 0.01, 1.9, p.slate)
    // each its Flamboyant window and its gable, buttress and pinnacle and a gargoyle between
    traceryWindow(south, z, 2.5, 2.5, 6.6, { stone: p.trim, glass: p.glass, head: 'pointed', lights: 3 })
    traceryWindow(north, z, 2.5, 2.5, 6.6, { stone: p.trim, glass: p.glass, head: 'pointed', lights: 3, far: true })
    gable(south, z, 10.5, 3.7, 2.4, p.stone, { d: 0.04, finial: 0.8 })
    gable(north, z, 10.5, 3.7, 2.0, p.stone, { d: 0.04, finial: 0.8 })
    for (const [xb, fr] of [[19.4, south], [-16.9, north]] as const) {
      buttress(fr, z + 1.97, 0, 10.2, 0.8, 0.9, p.stone, 3)
      stackedPinnacle(out, xb + Math.sign(xb) * 0.2, z + 1.97, 10.2, 3.8, 0.45, p.trim)
      beam(out, [xb + Math.sign(xb) * 0.2, 9.7, z + 1.97], [xb + Math.sign(xb) * 1.3, 10.1, z + 1.97], 0.14, p.deep)
    }
  }
  boxOn(south, -20.4, 13.5, 0, 1.0, 0, 0.26, shade(p.stone, 0.9))
  boxOn(north, -20.4, 13.5, 0, 1.0, 0, 0.26, shade(p.stone, 0.9))
  // the nave and choir to 20.2, under one steep roof to 28.5; the clerestory
  block(out, cx - 5.6, cx + 5.6, -25.4, 15, 10.5, 20.2, p.stone)
  roof(out, cx - 6.0, cx + 6.0, -25.4, 15, 20.2, 8.3, 6.0, 0.01, p.slate)
  block(out, cx - 0.06, cx + 0.06, -25.4, 15, 28.45, 28.8, p.lead)
  const zs: number[] = []
  for (let z = -19.1; z < 14; z += 3.95) zs.push(z)
  for (const s of [-1, 1]) {
    const f = s < 0 ? '-x' : '+x'
    const fr = faceFrame(out, f, cx + s * 5.6)
    flank(fr, -23, 14.4, 9, { stone: p.stone, glass: p.glass, y0: 12.2, h: 6.8, lights: 3, share: 0.72, cornice: 20.2 })
    gothicBalustrade(fr, -25.4, 15, 20.2, 0.8, { stone: p.trim, d: 0.3, pitch: 1.2 })
    flyers(out, zs, cx + s * 10.5, 10.5, 15.2, cx + s * 5.6, 18.6, p.stone, { w: 0.9, pin: 2.6 })
  }
  // the chevet: the choir's polygonal end and the ring of the double ambulatory under its low roofs
  chevet(out, cx, 15, 5.6, 10.5, 20.2, 28.5, p.stone, p.slate, p.glass, { n: 7, win: { y0: 12, h: 6.8, lights: 2 }, rad: { out: 5, y0: 10.5, y1: 15, to: 18.4 } })
  // THE WEST FRONT: the nave's gable with its great flamboyant window and rose, the portal, the balustrade
  const zf = -26.5
  block(out, cx - 5.6, cx + 5.6, zf, -25.3, 0, 20.2, p.stone)
  const w = faceFrame(out, '-z', zf)
  traceryWindow(w, cx, 10.2, 7.4, 9, { stone: p.trim, glass: p.glass, head: 'pointed', lights: 5, screen: { u0: cx - 5.6, u1: cx + 5.6, base: 9.4, top: 19.8, d: 0.3 } })
  // the 13th-century portal off Saint-Pierre-aux-Bœufs, with its deep orders and a gable over
  gothicPortal(w, cx, 0.15, 5.2, 8, { stone: p.trim, dark: p.dark, door: [0.12, 0.08, 0.055], depth: 0.95, orders: 3, head: 'pointed' })
  gable(w, cx, 7.2, 6.6, 2.9, p.stone, { d: 0.5, finial: 0.7, crockets: 2 })
  for (const s of [-1, 1]) niche(w, cx + s * 3.9, 2.5, 0.95, 3.4, 0.04, p.stone, p.dark)
  boxOn(w, cx - 5.8, cx + 5.8, 19.9, 20.3, 0, 0.42, p.trim, true)
  gothicBalustrade(w, cx - 5.8, cx + 5.8, 20.3, 0.9, { stone: p.trim, d: 0.34, pitch: 0.8 })
  gable(faceFrame(out, '-z', zf + 0.6), cx, 20.2, 11.2, 8.3, p.stone, { d: 0.02, finial: 1.8, crockets: 3 })
  roseWindow(faceFrame(out, '-z', zf + 0.6), cx, 23.6, 1.3, { stone: p.trim, glass: p.glass, spokes: 8, d: 0.2, far: true })
  for (const s of [-1, 1]) {
    block(out, cx + s * 5.9 - 0.55, cx + s * 5.9 + 0.55, zf - 0.6, zf + 0.6, 0, 19.5, p.stone)
    stackedPinnacle(out, cx + s * 5.9, zf, 19.5, 5.4, 0.55, p.trim, 2)
  }
  // the south aisle's west end: a lower gable with its window
  const wa = faceFrame(out, '-z', zf)
  gable(wa, 12.55, 10.5, 8.5, 4, p.stone, { d: 0.02, finial: 1 })
  traceryWindow(wa, 12.55, 2.5, 4.4, 7.2, { stone: p.trim, glass: p.glass, head: 'pointed', lights: 3, far: true })

  // THE TOWER at the north-west corner: 6.5 m square to 29.2, its belfry's tall openings, the balustrade and corner
  // pinnacles, the slate spire to 45.2 with the little open lantern partway up
  const tx = -9.15
  const tz = -22.3
  block(out, tx - 3.25, tx + 3.25, tz - 3.25, tz + 3.1, 0, 29.2, p.stone)
  for (const [bx, bz] of [[-1, -1], [1, -1], [-1, 1]]) block(out, tx + bx * 3.25 - 0.5, tx + bx * 3.25 + 0.5, tz + bz * 3.2 - 0.5, tz + bz * 3.2 + 0.5, 0, 27.5, p.stone)
  for (const { fr, f, m, u0, u1 } of boxFaces(out, tx - 3.25, tx + 3.25, tz - 3.25, tz + 3.1)) {
    louvred(fr, m, 20.6, 3, 7.2, p.trim, p.dark, { lights: 2, slats: 6 })
    if (f === '-z' || f === '-x') traceryWindow(fr, m, 11.4, 1.5, 5, { stone: p.trim, glass: p.glass, head: 'pointed', lights: 1, far: true })
    if (f === '-z') gothicPortal(fr, m, 0.15, 3, 5.2, { stone: p.trim, dark: p.dark, door: [0.12, 0.08, 0.055], depth: 0.6, orders: 2, head: 'pointed' })
    for (const y of [10.4, 19.4]) boxOn(fr, u0 - 0.05, u1 + 0.05, y, y + 0.34, 0, 0.3, p.trim, true)
    gothicBalustrade(fr, u0, u1, 29.2, 0.8, { stone: p.trim, d: 0.3, pitch: 1.1 })
  }
  for (const [bx, bz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) stackedPinnacle(out, tx + bx * 3.1, tz + bz * 3.0, 29.2, 3.8, 0.5, p.trim, 2)
  spire(out, tx, tz, 29.2, 16, 3.1, p.slate, { rib: p.lead, lucarnes: 4, lucarneAt: 0.13, lucarneW: 0.7, cross: p.gold, dark: p.dark })
  // the little lantern up the spire
  prism(out, tx, tz, 39.0, 39.25, 1.15, 8, p.lead, FIXED, 1.15, false)
  for (let i = 0; i < 8; i++) {
    const a = ((i + 0.5) / 8) * Math.PI * 2
    box(out, tx + Math.sin(a) * 0.98, 39.9, tz + Math.cos(a) * 0.98, 0.16, 0.55, 0.16, p.dark, FIXED)
  }
  prism(out, tx, tz, 40.55, 40.8, 1.12, 8, p.lead, FIXED, 1.12, false)
}
