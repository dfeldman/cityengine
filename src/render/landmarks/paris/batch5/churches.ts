/**
 * The two churches of Batch 5 nobody had drawn (2026-10-31): Saint-Julien-le-Pauvre across the Square Viviani from Notre-Dame, and the American Cathedral on the Avenue George-V, a tower and spire that closes the avenue from the river. The Gothic kit's (paris/monuments/gothic.ts).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { box, prism, type Rgb } from '../../../models.ts'
import type { Fit } from '../../fit.ts'
import { block, roof, shade } from '../../kit.ts'
import { fitted } from '../palaces/common.ts'
import { church } from '../monuments/churches.ts'
import { FIXED } from '../monuments/common.ts'
import { boxFaces, boxOn, buttress, chevet, classicalDoor, engaged, faceFrame, flank, flyers, gable, gothicBalustrade, gothicPortal, louvred, pinnacle, roseWindow, spire, traceryWindow } from '../monuments/gothic.ts'

const DOOR: Rgb = [0.12, 0.08, 0.055]

/**
 * SAINT-JULIEN-LE-PAUVRE (c. 1170–1240; the west front 1651), among the oldest churches in Paris and the Melkite parish, across the square from Notre-Dame. Its nave lost two bays and its towers in 1651 and is a stump behind a plain 17th-century wall with a door, a window and a gable: what a rider sees over the Square Viviani's limes is the other end, the three round APSES of the choir with their buttresses and little lancets and its brown tile roofs. OSM way 19741083, axis bearing 119 (its long walls, 24.3 m at 118.8): −z the west front on the Rue Saint-Julien-le-Pauvre (bearing 299), +z the apses. Design metres off the footprint's box. From memory and the aerial.
 */
const JX = 8.6
const JZ = 14.2
export function saintJulienPauvre(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, JX, JZ, (q) => julien(q))
}

function julien(out: MeshBuilder): void {
  const p = church('#9c927c', '#6f4c3a')
  const zf = -14.2
  const ze = 5.8
  // the nave, high and short; its aisles, lean-to in tile
  block(out, -8.4, 8.4, zf + 0.7, ze, 0, 6.2, p.stone)
  block(out, -4.2, 4.2, zf + 0.7, ze + 0.3, 6.2, 12, p.stone)
  roof(out, -4.5, 4.5, zf + 0.7, ze + 0.3, 12, 5.4, 4.5, 0.01, p.slate)
  for (const s of [-1, 1]) {
    const f = s < 0 ? '-x' : '+x'
    out.quad([[s * 8.7, 6.2, zf + 0.7], [s * 8.7, 6.2, ze], [s * 4.2, 9.1, ze], [s * 4.2, 9.1, zf + 0.7]], [s * 0.4, 0.9, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], p.slate, FIXED)
    flank(faceFrame(out, f, s * 8.4), zf + 0.9, ze, 5, { stone: p.stone, glass: p.glass, y0: 2, h: 3.2, head: 'round', lights: 1, share: 0.32, far: false, plinth: 0.7, cornice: 6.2, buttress: { y1: 5.6, d: 0.7, w: 0.8, stages: 2 } })
    flank(faceFrame(out, f, s * 4.2), zf + 0.9, ze, 4, { stone: p.stone, glass: p.glass, y0: 9.4, h: 2.1, head: 'pointed', lights: 1, share: 0.3, cornice: 12 })
    // the side apse, its own little half-round
    chevet(out, s * 6.3, ze, 2.5, 0, 5.6, 7.5, p.stone, p.slate, p.glass, { n: 4, win: { y0: 2, h: 2.6, lights: 1, head: 'round' }, butt: 0.45, cornice: false })
  }
  // the choir's great apse with its buttresses, to the nave's eaves; a flyer or two of the choir's early Gothic
  chevet(out, 0, ze + 0.3, 4.2, 0, 12, 17.4, p.stone, p.slate, p.glass, { n: 5, win: { y0: 2.5, h: 7.4, lights: 2, head: 'pointed', far: false }, butt: 0.7 })
  // THE WEST FRONT of 1651: a plain wall, a pedimented door, a small round window, the gable with its bellcote
  block(out, -9, 9, zf, zf + 0.7, 0, 7.2, p.stone)
  block(out, -4.2, 4.2, zf, zf + 0.7, 7.2, 12, p.stone)
  const w = faceFrame(out, '-z', zf)
  boxOn(w, -9, 9, 0, 0.7, 0, 0.2, shade(p.stone, 0.9))
  classicalDoor(w, 0, 0.3, 2.3, 4.6, p.trim, DOOR, { head: 'flat', pediment: true })
  for (const s of [-1, 1]) {
    engaged(w, s * 1.95, 0.3, 4.4, 0.24, p.trim, 'doric', { far: true })
    buttress(w, s * 4.2, 0, 7, 0.9, 0.9, p.stone, 2)
    traceryWindow(w, s * 6.5, 3.2, 1.3, 2.6, { stone: p.trim, glass: p.glass, head: 'round', lights: 1, far: true })
  }
  roseWindow(w, 0, 8.3, 0.9, { stone: p.trim, glass: p.glass, spokes: 6, d: 0.18, far: true })
  gable(w, 0, 12, 8.8, 5.4, p.stone, { d: 0.02, finial: 0 })
  // the bellcote on the gable's head
  block(out, -0.55, 0.55, zf + 0.15, zf + 0.6, 15.2, 17.6, p.stone)
  box(out, 0, 16.5, zf + 0.12, 0.26, 0.55, 0.03, p.dark, FIXED)
  prism(out, 0, zf + 0.37, 17.6, 18.4, 0.55, 4, p.slate, FIXED, 0.04)
}

/**
 * THE AMERICAN CATHEDRAL, Holy Trinity (George Edmund Street, 1881–86), on the Avenue George-V: English Decorated Gothic in a Paris street. Its TOWER stands on the avenue, square to 45 m in stepped buttresses with a spire of stone to 85 (Wikipedia), and closes the view; behind the avenue's trees the steep-roofed nave runs west, its aisles and lancets between buttresses (OSM's way 69485169 has every one of them, 5 m apart). South of it is the cloister. Frame: −z the front on the avenue (bearing 87), +x north off the footprint: nave's axis at x = 7.5, the tower at (−9, −19), read off the aerial and the way's outline. Height from Wikipedia's spire; the rest from memory.
 */
const AX = 21.5
const AZ = 24.1
export function americanCathedral(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, AX, AZ, (q) => american(q))
}

function american(out: MeshBuilder): void {
  const p = church('#a69e8c', '#39424a')
  const ax = 7.5
  const z0 = -22.8
  const z1 = 21.8
  // the nave and aisles
  block(out, ax - 13, ax + 13, z0 + 1, z1 - 3, 0, 9, p.stone)
  block(out, ax - 6.6, ax + 6.6, z0, z1, 9, 17, p.stone)
  roof(out, ax - 7, ax + 7, z0, z1, 17, 10, 7, 0.01, p.slate)
  block(out, ax - 0.06, ax + 0.06, z0, z1, 26.95, 27.25, p.lead)
  for (const s of [-1, 1]) {
    const f = s < 0 ? '-x' : '+x'
    out.quad([[ax + s * 13.3, 9, z0 + 1], [ax + s * 13.3, 9, z1 - 3], [ax + s * 6.6, 12.5, z1 - 3], [ax + s * 6.6, 12.5, z0 + 1]], [s * 0.3, 0.95, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], p.slate, FIXED)
    flank(faceFrame(out, f, ax + s * 13), z0 + 1.5, z1 - 3, 8, { stone: p.stone, glass: p.glass, y0: 2.6, h: 5.2, lights: 2, share: 0.56, far: false, plinth: 0.9, string: true, cornice: 9, buttress: { y1: 8.2, d: 0.85, w: 0.75, pinnacle: 1.6, stages: 2 } })
    flank(faceFrame(out, f, ax + s * 6.6), z0 + 1.5, z1 - 3, 8, { stone: p.stone, glass: p.glass, y0: 12.6, h: 4, lights: 2, share: 0.6, cornice: 17 })
    flyers(out, [-12.9, -7.3, -1.7, 3.9, 9.5, 15.1], ax + s * 11.4, 9, 13, ax + s * 6.6, 16.2, p.stone, { w: 0.7, pin: 2, drop: 2 })
  }
  // the choir's straight east end (the English way), its great window: local +z, on the Rue Bassano side
  const e = faceFrame(out, '+z', z1)
  traceryWindow(e, ax, 9, 6.4, 11, { stone: p.trim, glass: p.glass, head: 'pointed', lights: 4, far: true })
  gable(e, ax, 17, 13.6, 10, p.stone, { d: 0.02, finial: 1.6 })
  // the front on the avenue: the portal under its gable, the great west window, the gable over
  const zf = z0
  const w = faceFrame(out, '-z', zf)
  gothicPortal(w, ax, 0.1, 5.2, 7, { stone: p.trim, dark: p.dark, door: DOOR, depth: 0.95, orders: 3, head: 'pointed' })
  gable(w, ax, 6.4, 6.4, 3.4, p.stone, { d: 0.55, crockets: 2, finial: 0.9 })
  block(out, ax - 6.6, ax + 6.6, zf, zf + 1, 0, 9, p.stone)
  traceryWindow(w, ax, 9.8, 7.4, 9.4, { stone: p.trim, glass: p.glass, head: 'pointed', lights: 4 })
  roseWindow(w, ax, 22.2, 1.5, { stone: p.trim, glass: p.glass, spokes: 8, d: 0.2, far: true })
  gable(w, ax, 17, 13.6, 10, p.stone, { d: 0.02, crockets: 4, finial: 1.7 })
  for (const s of [-1, 1]) {
    buttress(w, ax + s * 6.8, 0, 17, 1.1, 1.2, p.stone, 4)
    pinnacle(out, ax + s * 6.8, zf - 0.3, 17, 4.6, 0.55, p.trim, 2)
    traceryWindow(faceFrame(out, '-z', zf + 1), ax + s * 9.9, 2.6, 3.4, 5.2, { stone: p.trim, glass: p.glass, head: 'pointed', lights: 2, far: true })
  }
  // the cloister's range south of the nave: low, slate, with its lancets and arcaded court
  block(out, -21.4, -5, z0 + 1.6, 23, 0, 6.6, p.stone)
  roof(out, -21.6, -4.8, z0 + 1.6, 23, 6.6, 3, 2, 0.01, p.slate)
  for (const [f, plane] of [['-x', -21.4]] as const) flank(faceFrame(out, f, plane), -21, 23, 8, { stone: p.stone, glass: p.glass, y0: 1.8, h: 3.6, lights: 1, share: 0.34, cornice: 6.6, buttress: { y1: 5.6, d: 0.5, w: 0.6, stages: 2 } })
  // THE TOWER on the avenue, its corners in stepped buttresses, the belfry's two tall louvred openings, a pierced parapet, and the spire to 85
  const tx = -9
  const tz = -18.6
  const hw = 5.2
  block(out, tx - hw, tx + hw, tz - hw, tz + hw, 0, 44.6, p.stone)
  for (const { fr, f, m, u0, u1 } of boxFaces(out, tx - hw, tx + hw, tz - hw, tz + hw)) {
    if (f === '-z') {
      gothicPortal(fr, m, 0.1, 4, 6.2, { stone: p.trim, dark: p.dark, door: DOOR, depth: 0.8, orders: 3, head: 'pointed' })
      gable(fr, m, 5.8, 5, 2.8, p.stone, { d: 0.5, finial: 0.7 })
    } else traceryWindow(fr, m, 3, 2.6, 6, { stone: p.trim, glass: p.glass, head: 'pointed', lights: 2, far: true })
    traceryWindow(fr, m, 12, 3, 8.4, { stone: p.trim, glass: p.glass, head: 'pointed', lights: 2, far: true })
    for (const d of [-1.9, 0, 1.9]) traceryWindow(fr, m + d, 23, 1.3, 5.6, { stone: p.trim, glass: p.dark, head: 'pointed', lights: 1, far: true })
    for (const d of [-1.65, 1.65]) louvred(fr, m + d, 31, 2.6, 11.4, p.trim, p.dark, { lights: 2, slats: 9 })
    for (const y of [10.8, 21.8, 30]) boxOn(fr, u0 - 0.05, u1 + 0.05, y, y + 0.38, 0, 0.34, p.trim, true)
    for (const u of [u0 + 0.35, u1 - 0.35]) buttress(fr, u, 0, 41, 1.2, 1.5, p.stone, 5)
    boxOn(fr, u0 - 0.2, u1 + 0.2, 44.2, 44.75, 0, 0.44, p.trim, true)
    gothicBalustrade(fr, u0, u1, 44.75, 1, { stone: p.trim, d: 0.34, pitch: 0.95 })
  }
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    pinnacle(out, tx + x * (hw + 0.1), tz + z * (hw + 0.1), 41, 8.6, 0.72, p.trim, 2)
  }
  spire(out, tx, tz, 45.7, 37.4, 4.3, shade(p.stone, 0.92), { rib: p.trim, crockets: 8, lucarnes: 4, lucarneAt: 0.09, lucarneW: 0.72, cross: p.dark, dark: p.dark })
}
