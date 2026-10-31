import type { MeshBuilder } from '../../buildings.ts'
import { prism } from '../../models.ts'
import { block, roof, shade } from '../kit.ts'
import type { Fit } from '../fit.ts'
import { church } from './monuments/churches.ts'
import { FIXED } from './monuments/common.ts'
import { boxFaces, boxOn, chevet, classicalDoor, engaged, entablature, faceFrame, flank, flyers, gable, gothicBalustrade, louvred, niche, pedimentFront, pinnacle, spire, traceryWindow, volute, statue } from './monuments/gothic.ts'

/*
 * Saint-Gervais-Saint-Protais, behind the Hôtel de Ville: a tall Flamboyant Gothic church with, in front of it, the first
 * classical facade in Paris (Salomon de Brosse, 1616) — three orders of columns stacked one on another, Doric, Ionic,
 * Corinthian, narrowing to a curved pediment at the top — and the Gothic bell tower beside.
 *
 * Batch 5 (2026-10-31): 3,522 triangles of columns and dark panes become the Gothic kit's. The front's three orders are
 * still the first attempt's widths and heights; now they carry niches, statues and an entablature with a soffit; the body is
 * tracery, two-tier flyers and an apse. From memory and the aerial; street view would settle the pediments' tympana.
 */
export function saintGervais(out: MeshBuilder, fit: Fit): void {
  const p = church('#a59c89', '#3b4348')
  const zf = -fit.hz
  const back = fit.hz - 4
  const door: [number, number, number] = [0.12, 0.08, 0.055]
  // the nave, high and narrow, under a steep roof; the aisles either side; a polygonal apse at the east end
  const z0 = zf + 5
  const z1 = back - 8
  block(out, -7, 7, z0, z1, 0, 25, p.stone)
  roof(out, -7.3, 7.3, z0, z1, 25, 10, 7.3, 0, p.slate)
  block(out, -0.07, 0.07, z0, z1, 34.95, 35.3, p.lead)
  const zs: number[] = []
  const bays = Math.round((z1 - z0 - 6) / 5.6)
  const bay = (z1 - z0 - 6) / bays
  for (let i = 1; i < bays; i++) zs.push(z0 + 6 + bay * i)
  for (const s of [-1, 1]) {
    const f = s < 0 ? '-x' : '+x'
    // the aisles and chapels, under their lean-to
    const ao = s * 14
    block(out, Math.min(s * 7, ao), Math.max(s * 7, ao), z0 + 2, z1, 0, 13, p.stone)
    out.quad([[ao + s * 0.3, 13, z0 + 2], [ao + s * 0.3, 13, z1], [s * 7, 16.5, z1], [s * 7, 16.5, z0 + 2]], [s * 0.3, 0.95, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], p.slate, FIXED)
    flank(faceFrame(out, f, ao), z0 + 6, z1, bays, { stone: p.stone, glass: p.glass, y0: 3.2, h: 7.8, head: 'pointed', lights: 3, far: false, plinth: 1.1, string: true, cornice: 13, buttress: { y1: 12, d: 1, w: 0.9, pinnacle: 3.2 } })
    flank(faceFrame(out, f, s * 7), z0 + 6, z1, bays, { stone: p.stone, glass: p.glass, y0: 16.8, h: 7, head: 'pointed', lights: 3, share: 0.68, cornice: 25 })
    gothicBalustrade(faceFrame(out, f, s * 7), z0, z1, 25, 0.85, { stone: p.trim, d: 0.34, pitch: 1.2 })
    flyers(out, zs, s * 13.2, 13, 21, s * 7, 24.4, p.stone, { w: 1, pin: 4 })
    flyers(out, zs, s * 10.6, 16, 18.2, s * 7, 20.4, p.stone, { w: 0.5, pin: 0.01, drop: 1.6 })
  }
  chevet(out, 0, z1, 7, 13, 25, 33, p.stone, p.slate, p.glass, { n: 7, win: { y0: 15.5, h: 8.2, lights: 2 }, rad: { out: 6.5, y0: 13, y1: 21, to: 24.2 } })
  chevet(out, 0, z1, 14, 0, 13, 16.2, p.stone, p.slate, p.glass, { n: 9, win: { y0: 3.2, h: 7.8, lights: 2 }, lean: true, butt: 0.9 })
  // the bell tower on the south side: Flamboyant, square, its belfry and balustrade, a small pyramid and a slender flèche
  const T = { x0: 8, x1: 16, z0: zf + 12, z1: zf + 20 }
  block(out, T.x0, T.x1, T.z0, T.z1, 0, 38, p.stone)
  for (const { fr, m, u0, u1 } of boxFaces(out, T.x0, T.x1, T.z0, T.z1, ['-z', '+x', '+z', '-x'])) {
    louvred(fr, m, 27.2, 3.6, 9, p.trim, p.dark, { lights: 2, slats: 6 })
    for (const y of [15, 26.5]) boxOn(fr, u0 - 0.05, u1 + 0.05, y, y + 0.35, 0, 0.3, p.trim, true)
    for (const u of [u0 + 0.45, u1 - 0.45]) boxOn(fr, u - 0.45, u + 0.45, 0, 37, 0, 0.55, p.stone)
    gothicBalustrade(fr, u0, u1, 38.2, 0.85, { stone: p.trim, d: 0.34, pitch: 1.1 })
  }
  block(out, T.x0 - 0.4, T.x1 + 0.4, T.z0 - 0.4, T.z1 + 0.4, 37, 38.2, p.trim)
  roof(out, T.x0, T.x1, T.z0, T.z1, 38.2, 3.6, 4, 4, p.slate)
  spire(out, 12, (T.z0 + T.z1) / 2, 41, 3.6, 0.5, p.lead, { sides: 6, cross: p.gold })
  for (const [x, z] of [[T.x0, T.z0], [T.x1, T.z0], [T.x0, T.z1], [T.x1, T.z1]]) pinnacle(out, x, z, 38.2, 4, 0.5, p.trim)
  // THE FRONT: three orders, each narrower, each with a bay of doors or window and a niche with its figure between the pairs
  const orders: { w: number; y0: number; y1: number; r: number; o: 'doric' | 'ionic' | 'corinthian'; d: number; col: number[] }[] = [
    { w: 11, y0: 0, y1: 13, r: 0.56, o: 'doric', d: -1.1, col: [10, 8.3, 3.9, 2.2] },
    { w: 8, y0: 13.9, y1: 22.5, r: 0.45, o: 'ionic', d: -0.75, col: [7.2, 5.7, 2.7] },
    { w: 5.5, y0: 23.5, y1: 30.5, r: 0.38, o: 'corinthian', d: -0.45, col: [4.8, 3.6] },
  ]
  const steps = 0.5
  block(out, -12, 12, zf - 4, zf - 0.6, 0, steps, shade(p.stone, 0.92))
  block(out, -11, 11, zf - 2.6, zf - 0.6, steps, steps * 2, shade(p.stone, 0.96))
  for (let k = 0; k < orders.length; k++) {
    const q = orders[k]
    block(out, -q.w, q.w, zf + 0.6 + q.d, zf + 5, q.y0, q.y1 + 0.9, p.stone)
    block(out, -q.w + 0.1, q.w - 0.1, zf + 1.7 + q.d, zf + 5, q.y1 + 0.9, q.y1 + 0.96, p.lead)
    const fr = faceFrame(out, '-z', zf + 0.6 + q.d)
    for (const u of q.col) for (const s of [-1, 1]) engaged(fr, s * u, q.y0 + (k ? 0 : steps * 2), q.y1, q.r, p.trim, q.o)
    entablature(fr, -q.w, q.w, q.y1, 0.9, 0.82, p.trim)
    // the order's bay either side of the middle
    const u = (q.col[k ? 1 : 1] + q.col[q.col.length - 1]) / 2
    for (const s of [-1, 1]) {
      if (k === 0) {
        niche(fr, s * 6.1, 2.6, 1.3, 4.8, 0.08, p.stone, p.dark)
        traceryWindow(fr, s * 6.1, 8.6, 1.5, 3.2, { stone: p.trim, glass: p.dark, head: 'round', lights: 1, far: true })
      } else if (k === 1) {
        niche(fr, s * 4.4, q.y0 + 1.2, 1.05, 3.9, 0.08, p.stone, p.dark)
      } else {
        statue(out, s * 6.2, q.y0 - 0.55 + 0.1, zf + 0.25, 2.2, p.trim)
        void u
      }
    }
    // the scrolls off the order below's ends (the statues stand between)
    if (k === 1) for (const s of [-1, 1]) volute(fr, s * 10.8, 13.95, s * 8.1, 18, 0.34, p.trim)
    if (k === 2) for (const s of [-1, 1]) volute(fr, s * 7.8, 23.45, s * 5.7, 27.2, 0.3, p.trim)
  }
  const f0 = faceFrame(out, '-z', zf + 0.6 + orders[0].d)
  const f1 = faceFrame(out, '-z', zf + 0.6 + orders[1].d)
  const f2 = faceFrame(out, '-z', zf + 0.6 + orders[2].d)
  classicalDoor(f0, 0, steps * 2, 3.3, 8.6, p.trim, door, { head: 'round' })
  traceryWindow(f1, 0, 15, 3, 6.4, { stone: p.trim, glass: p.glass, head: 'round', lights: 3, screen: { u0: -2.2, u1: 2.2, base: 14.4, top: 22.4, d: 0.34 } })
  traceryWindow(f2, 0, 24.3, 2.3, 5.2, { stone: p.trim, glass: p.glass, head: 'round', lights: 2, far: true })
  pedimentFront(f2, -5.8, 5.8, 31.4, 3.1, 1, p.trim, { curved: true, relief: 3 })
  gable(faceFrame(out, '-z', z0), 0, 25, 13.6, 9.8, p.stone, { finial: 0, d: 0.02 })
  prism(out, 0, zf + 0.2, 34.5, 36.2, 0.16, 6, p.trim, FIXED, 0.04, false)
}
