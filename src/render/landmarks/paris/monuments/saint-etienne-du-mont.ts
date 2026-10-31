import type { MeshBuilder } from '../../../buildings.ts'
import { box, prism } from '../../../models.ts'
import { block, roof, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { domeOf, FIXED, graded, quarter } from './common.ts'
import { church } from './churches.ts'
import { boxFaces, boxOn, chevet, classicalDoor, edgeFrame, engaged, entablature, faceFrame, flank, flyers, gable, gothicBalustrade, louvred, niche, pedimentFront, rect, roseWindow, traceryWindow, volute } from './gothic.ts'

/*
 * SAINT-ÉTIENNE-DU-MONT (1492–1626), beside the Panthéon on the Place Sainte-Geneviève: a Gothic church in a
 * Renaissance FRONT of three stacked storeys — the portal under its pediment between columns, the rose under a curved
 * pediment, the steep gable with its little rose and cross — the lower aisle fronts either side with their own roses,
 * and on the north the BELFRY (OSM's 664185486 to 46 m): a square tower with its clock, then an octagonal belfry of
 * open arches under a lead dome and lantern to 53 (1202493346), the round stair turret beside it with its cone to 48.
 * Behind, the long nave under a steep slate roof (34.4 to the ridge), the chapels down both sides with their
 * pyramid roofs, the apse at the east.
 *
 * In the city OSM's parts drew the front as a mansarded block and the belfry as a plain shaft (2026-10-29); the model
 * replaces the outline (way 55343672) and its parts. Frame: −z the front on the place (bearing 283.7), +x south.
 *
 * Batch 5 (2026-10-31): the masses are the first attempt's, 2,226 triangles of flat silhouettes; the dress is the Gothic
 * kit's. It is a Flamboyant body with three-light tracery, the front is engaged columns, a sculpted tympanum and niches.
 * The carved front itself is in PARIS-TRIPO-NOTES.md.
 */
const HX = 17.35
const HZ = 38.0

export function saintEtienneDuMont(out: MeshBuilder, fit: Fit): void {
  graded(out, fit, HX, HZ, (q) => etienne(q))
}

function etienne(out: MeshBuilder): void {
  const p = church('#a89f8c', '#3c454a')
  const door: [number, number, number] = [0.12, 0.08, 0.055]
  const cx = 0.95
  const zf = -38.0
  // the chapels and aisles to 19.5 under hipped roofs, the nave to 23.9 eaves and its roof to 34.4
  block(out, -15.4, 17.3, -31, 18, 0, 19.5, p.stone)
  roof(out, -15.7, 17.6, -31.2, 18.2, 19.5, 3.5, 4.0, 1.5, p.slate)
  block(out, cx - 6.35, cx + 6.35, -36.5, 22, 19.5, 23.9, p.stone)
  roof(out, cx - 6.7, cx + 6.7, zf + 0.1, 22, 23.9, 10.5, 6.7, 0.01, p.slate)
  block(out, cx - 6.5, cx + 6.5, zf, -36.4, 22.8, 23.9, p.stone)
  block(out, cx - 0.07, cx + 0.07, zf + 1, 22, 34.35, 34.65, p.lead)
  for (const s of [-1, 1]) {
    const f = s < 0 ? '-x' : '+x'
    // the flanks: tall three-light Flamboyant windows between stepped buttresses with their pinnacles
    flank(faceFrame(out, f, s < 0 ? -15.4 : 17.3), -30.5, 17.5, 9, { stone: p.stone, glass: p.glass, y0: 3.8, h: 11.5, head: 'pointed', lights: 3, far: false, plinth: 1.2, string: true, cornice: 19.5, buttress: { y1: 18.2, d: 1.15, w: 0.95, pinnacle: 3.6 } })
    gothicBalustrade(faceFrame(out, f, s < 0 ? -15.4 : 17.3), -30.5, 17.5, 19.5, 0.85, { stone: p.trim, d: 0.3, pitch: 1.2 })
    // the clerestory, short over the aisles' roofs, and the flyers to it
    flank(faceFrame(out, f, cx + s * 6.35), -30, 22, 10, { stone: p.stone, glass: p.glass, y0: 20.1, h: 3.3, head: 'pointed', lights: 2 })
    flyers(out, [-27.4, -22.2, -17, -11.8, -6.6, -1.4, 3.8, 9, 14.2], cx + s * 10.8, 19.4, 24.6, cx + s * 6.35, 23.6, p.stone, { w: 0.85, pin: 2.8, drop: 2.2 })
  }
  // the choir and apse, the chevet round to the east
  block(out, -13, 15, 18, 26, 0, 19.5, p.stone)
  roof(out, -13.2, 15.2, 18, 25.2, 19.5, 2.4, 2, 0.01, p.slate)
  chevet(out, cx, 25, 14.5, 0, 19.5, 22.4, p.stone, p.slate, p.glass, { n: 9, win: { y0: 3.8, h: 11.2, lights: 2 }, lean: true, butt: 1 })
  chevet(out, cx, 22, 6.35, 19.5, 23.9, 31.5, p.stone, p.slate, p.glass, { n: 7, win: { y0: 20.2, h: 3.2, lights: 1 } })

  // THE FRONT. The central frontispiece, x = cx ± 6.5, on the front plane z = −38
  block(out, cx - 6.5, cx + 6.5, zf, -36.4, 0, 23.0, p.stone)
  const fr = faceFrame(out, '-z', zf)
  // the steps, the portal between four columns under the pediment carved with the Stoning of Saint Stephen
  for (let k = 0; k < 4; k++) block(out, cx - 8 + k * 0.3, cx + 8 - k * 0.3, zf - 2.0 + k * 0.5, zf, 0, 0.18 * (k + 1), p.trim)
  boxOn(fr, cx - 6.5, cx + 6.5, 0, 0.75, 0, 0.5, shade(p.stone, 0.9))
  for (const dx of [-5.0, -3.5, 3.5, 5.0]) engaged(fr, cx + dx, 0.75, 8.6, 0.42, p.trim, 'corinthian')
  entablature(fr, cx - 5.9, cx + 5.9, 8.6, 1.2, 0.68, p.trim)
  pedimentFront(fr, cx - 6.05, cx + 6.05, 9.8, 2.6, 1.0, p.trim, { relief: 9 })
  // the door in its round head, the tympanum of the arch, the niches beside it
  classicalDoor(fr, cx, 0.75, 3.4, 7.2, p.trim, door, { head: 'round' })
  for (const s of [-1, 1]) niche(fr, cx + s * 4.25, 3.4, 0.95, 2.8, 0.06, p.stone, p.dark)
  // the second storey: the rose between niches under the curved pediment, its pilasters
  roseWindow(fr, cx, 16.5, 2.45, { stone: p.trim, glass: p.glass, spokes: 12, d: 0.34 })
  for (const s of [-1, 1]) {
    niche(fr, cx + s * 4.4, 13.5, 1.15, 3.6, 0.06, p.stone, p.dark)
    engaged(fr, cx + s * 6.0, 12.9, 19.8, 0.3, p.trim, 'ionic', { far: true })
    engaged(fr, cx + s * 3.0, 12.9, 19.8, 0.3, p.trim, 'ionic', { far: true })
  }
  boxOn(fr, cx - 6.5, cx + 6.5, 12.6, 12.9, 0, 0.3, p.trim)
  entablature(fr, cx - 6.5, cx + 6.5, 19.8, 1, 0.5, p.trim)
  pedimentFront(fr, cx - 6.5, cx + 6.5, 20.8, 2.7, 0.8, p.trim, { curved: true, relief: 3 })
  for (const s of [-1, 1]) prism(out, cx + s * 6.2, zf - 0.2, 20.8, 22.8, 0.32, 6, p.trim, FIXED, 0.08, false)
  // the gable, its small rose, its cross
  gable(fr, cx, 23.0, 13, 10.4, p.stone, { d: 0.12, crockets: 5, finial: 0 })
  roseWindow(fr, cx, 26.0, 1.15, { stone: p.trim, glass: p.glass, spokes: 8, d: 0.26, far: true })
  traceryWindow(fr, cx, 28.4, 1, 2.6, { stone: p.trim, glass: p.glass, head: 'pointed', lights: 1, far: true })
  box(out, cx, 34.6, zf + 0.3, 0.1, 1.1, 0.1, p.trim, FIXED)
  box(out, cx, 35.0, zf + 0.3, 0.55, 0.1, 0.1, p.trim, FIXED)
  // the south aisle's front, x 7.5..17.3: its door, window and rose, a scroll up to the frontispiece
  block(out, 7.4, 17.3, zf + 0.4, -30, 0, 19.0, p.stone)
  const south = faceFrame(out, '-z', zf + 0.4)
  classicalDoor(south, 12.3, 0.4, 2.1, 4.8, p.trim, door, { head: 'round' })
  pedimentFront(south, 10.8, 13.8, 5.6, 1.1, 0.45, p.trim)
  traceryWindow(south, 15.3, 8.0, 2, 6.2, { stone: p.trim, glass: p.glass, head: 'pointed', lights: 2, far: true })
  roseWindow(south, 10.5, 12.6, 1.25, { stone: p.trim, glass: p.glass, spokes: 8, d: 0.24, far: true })
  boxOn(south, 7.4, 17.3, 7.2, 7.5, 0, 0.26, p.trim)
  boxOn(south, 7.4, 17.3, 18.5, 19.05, 0, 0.42, p.trim, true)
  volute(south, 15.2, 19.05, 7.8, 22.9, 0.36, p.trim)
  roof(out, 7.4, 17.3, zf + 0.6, -30, 19.0, 2.0, 0.01, 1.5, p.slate)
  // the north side: a lower front set back, the little round turret at its corner with its cone
  block(out, -15.4, cx - 6.5, -34.5, -30, 0, 17.5, p.stone)
  const north = faceFrame(out, '-z', -34.5)
  classicalDoor(north, -10, 0.4, 1.9, 4.2, p.trim, door, { head: 'flat', pediment: true })
  traceryWindow(north, -9.8, 8, 3.2, 7.6, { stone: p.trim, glass: p.glass, head: 'pointed', lights: 2, far: true })
  boxOn(north, -15.4, cx - 6.5, 16.9, 17.5, 0, 0.42, p.trim, true)
  gothicBalustrade(north, -15.4, cx - 6.5, 17.5, 0.8, { stone: p.trim, d: 0.26, pitch: 1 })
  prism(out, -16.0, -32.0, 0, 14.5, 1.7, 10, p.stone, FIXED)
  for (const y of [4.2, 9.2]) prism(out, -16.0, -32.0, y, y + 0.28, 1.84, 10, p.trim, FIXED, 1.84, false)
  prism(out, -16.0, -32.0, 14.5, 18.5, 1.9, 10, p.slate, FIXED, 0.05)

  // THE BELFRY at (−6.3, −26.2): the square tower with its clock to 33, the octagonal belfry of arches, the lead
  // dome and the lantern; the round stair turret at its west corner, its cone to 48
  const bx = -6.3
  const bz = -26.2
  block(out, bx - 3.45, bx + 3.45, bz - 3.4, bz + 3.4, 0, 33.0, p.stone)
  for (const { fr: t, m, u0, u1, f } of boxFaces(out, bx - 3.45, bx + 3.45, bz - 3.4, bz + 3.4, ['-z', '-x', '+x'])) {
    void f
    for (const d of [-1.05, 1.05]) louvred(t, m + d, 22.2, 1.35, 5, p.trim, p.dark, { lights: 1, head: 'round', slats: 5 })
    boxOn(t, u0 - 0.1, u1 + 0.1, 21.4, 21.75, 0, 0.3, p.trim)
    boxOn(t, u0 - 0.1, u1 + 0.1, 27.7, 28.05, 0, 0.3, p.trim)
    // the clock's face in its square
    rect(t, m - 1.3, m + 1.3, 28.3, 30.9, 0.1, p.trim)
    rect(t, m - 1.05, m + 1.05, 28.55, 30.65, 0.13, [0.06, 0.07, 0.09])
    rect(t, m - 0.03, m + 0.03, 29.6, 30.45, 0.15, p.gold)
    rect(t, m - 0.03, m + 0.62, 29.56, 29.64, 0.15, p.gold)
  }
  block(out, bx - 3.7, bx + 3.7, bz - 3.65, bz + 3.65, 32.5, 33.4, p.trim)
  for (const { fr: t, u0, u1 } of boxFaces(out, bx - 3.45, bx + 3.45, bz - 3.4, bz + 3.4)) gothicBalustrade(t, u0, u1, 33.4, 0.8, { stone: p.trim, d: -0.2, pitch: 1.3 })
  prism(out, bx, bz, 33.4, 41.5, 2.9, 8, p.stone, FIXED)
  for (let i = 0; i < 8; i++) {
    const a0 = (i / 8) * Math.PI * 2, a1 = ((i + 1) / 8) * Math.PI * 2
    const e = edgeFrame(out, { x: bx + Math.sin(a0) * 2.9, z: bz + Math.cos(a0) * 2.9 }, { x: bx + Math.sin(a1) * 2.9, z: bz + Math.cos(a1) * 2.9 }, { x: bx, z: bz })
    louvred(e, e.L / 2, 34.6, e.L * 0.62, 5.6, p.trim, p.dark, { lights: 1, head: 'round', slats: 4 })
  }
  prism(out, bx, bz, 41.5, 42.3, 3.2, 8, p.trim, FIXED)
  domeOf(out, bx, bz, 42.3, 2.9, 5.0, p.lead, quarter, { sides: 16, steps: 6, ribs: 8 })
  prism(out, bx, bz, 47.0, 49.6, 0.85, 8, p.lead, FIXED)
  for (let i = 0; i < 8; i++) {
    const a = ((i + 0.5) / 8) * Math.PI * 2
    box(out, bx + Math.sin(a) * 0.86, 48.2, bz + Math.cos(a) * 0.86, 0.14, 0.7, 0.14, p.dark, FIXED)
  }
  domeOf(out, bx, bz, 49.6, 0.95, 1.6, p.lead, quarter, { sides: 8, steps: 4 })
  box(out, bx, 52.2, bz, 0.06, 0.9, 0.06, p.dark, FIXED)
  box(out, bx, 52.5, bz, 0.4, 0.06, 0.06, p.dark, FIXED)
  // the stair turret: its courses and little slit windows
  prism(out, bx - 1.2, bz - 3.6, 0, 43.5, 1.2, 12, p.stone, FIXED)
  for (const y of [12, 22, 32, 43.2]) prism(out, bx - 1.2, bz - 3.6, y, y + 0.4, 1.35, 12, p.trim, FIXED)
  for (let y = 4; y < 42; y += 6) box(out, bx - 1.2, y, bz - 3.6 - 1.2, 0.17, 0.75, 0.04, p.dark, FIXED)
  prism(out, bx - 1.2, bz - 3.6, 43.9, 48.0, 1.35, 12, p.slate, FIXED, 0.05)
}
