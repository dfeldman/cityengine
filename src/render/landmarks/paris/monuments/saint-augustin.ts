import type { MeshBuilder } from '../../../buildings.ts'
import { box, prism } from '../../../models.ts'
import { block, roof, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { band, domeOf, drumArches, FIXED, graded, type P2, ring, walls } from './common.ts'
import { church } from './churches.ts'
import { blindArcade, boxOn, chevet, edgeFrame, engaged, entablature, faceFrame, flank, frameAt, gothicPortal, niche, pedimentFront, pinnacle as stackedPinnacle, roseWindow, traceryWindow, statue } from './gothic.ts'

/*
 * SAINT-AUGUSTIN (Victor Baltard, 1860–71), at the meeting of the Boulevard Malesherbes and the Boulevard Haussmann:
 * the first Paris church hung on an IRON FRAME, its stone a skin over cast-iron columns. The lot is a wedge, so the
 * church is too: a narrow FRONT on the Place Saint-Augustin (three porch arches, the frieze of apostles, the 8 m rose
 * under its great arch, the gable and the cross), a nave that WIDENS bay by bay as its chapels grow toward the choir,
 * and over the choir the great DOME — 25 m across, its drum ringed with arched windows, four little domed turrets at
 * its corners, the ribbed lead cap and the red-painted iron LANTERN to 83 m (OSM's parts: the drum and dome
 * 354602974 to 70, the lantern's posts 71–79 and its spire to 83, the turrets 30 + domes to 45). From the Parc Monceau
 * and down the Boulevard Malesherbes the dome is the whole of it.
 *
 * In the city OSM's parts drew the dome as a windowed tower with a flat top and the turrets as box chimneys
 * (2026-10-29), so the model replaces the outline (way 67501490, dropped by the bake; its 20 parts nested under it).
 * Frame: −z the front on the place (bearing 155), the dome toward +z; design metres off OSM's ring turned so.
 */
const HX = 19.4
const HZ = 47.55

/** The outline, simplified from OSM's (1 m): the porch, the widening nave, the chapels, the chevet. */
const PLAN: P2[] = ring([
  -10.8, -47.6, 10.8, -47.6, 10.8, -36.8, 12.2, -34.8, 12.1, -31.0, 9.2, -29.7, 16.1, -2.5, 15.9, 4.1, 18.4, 6.7, 18.4, 10.1,
  15.8, 12.5, 15.8, 16.4, 19.4, 19.9, 19.4, 25.1, 15.9, 28.6, 15.8, 32.5, 18.3, 34.9, 18.2, 38.3, 15.7, 40.7, 12.3, 40.7,
  10.0, 38.2, 6.7, 38.2, -6.7, 38.2, -10.0, 38.2, -12.5, 40.7, -15.8, 40.7, -18.3, 38.2, -18.3, 34.9, -15.9, 32.4, -15.9, 28.5,
  -19.4, 25.0, -19.3, 19.9, -15.8, 16.5, -15.8, 12.5, -18.2, 10.0, -18.2, 6.6, -15.9, 4.2, -16.0, -2.4, -9.1, -29.7, -12.1, -31.1,
  -12.1, -34.9, -10.8, -36.8,
])

export function saintAugustin(out: MeshBuilder, fit: Fit): void {
  graded(out, fit, HX, HZ, (q) => augustin(q))
}

function augustin(out: MeshBuilder): void {
  // (Batch 5, 2026-10-31: stone and paint that don't blow out, the windows and front on the Gothic kit, in Baltard's Romano-Byzantine round heads)
  const p = church('#a59c88', '#3d484f')
  const lead: [number, number, number] = [0.27, 0.31, 0.35]
  const red: [number, number, number] = [0.42, 0.18, 0.12]
  const door: [number, number, number] = [0.12, 0.08, 0.055]
  // the chapels and aisles all round to 21 m under a low lead roof; the cornice
  walls(out, PLAN, 0, 21, p.stone, p.lead)
  band(out, PLAN, 20.2, 0.9, 0.35, p.trim)
  // the nave's clerestory, ±7.3, eaves at 33 and its roof ridge at 40; the windows down both sides
  block(out, -7.3, 7.3, -38, 8, 21, 33, p.stone)
  roof(out, -7.7, 7.7, -38, 8, 33, 6.5, 7.7, 0.01, p.slate)
  for (const s of [-1, 1]) flank(faceFrame(out, s < 0 ? '-x' : '+x', s * 7.3), -35.3, 7, 9, { stone: p.stone, glass: p.glass, y0: 23.5, h: 6.8, head: 'round', lights: 2, share: 0.54, cornice: 33 })
  // the chapels' round windows along the widening sides: on the wedge's own walls
  for (const s of [-1, 1]) {
    const a = { x: s * 9.1, z: -29.7 }
    const b = { x: s * 16.1, z: -2.5 }
    const e = edgeFrame(out, a, b, { x: 0, z: -15 })
    flank(e, 0.6, e.L - 0.6, 5, { stone: p.stone, glass: p.glass, y0: 6.6, h: 9.4, head: 'round', lights: 3, share: 0.56, far: false, plinth: 1.2, string: true, buttress: { y1: 19, d: 0.5, w: 0.8, stages: 2 } })
  }

  // the crossing under the dome: a square block to 33, the four turrets at its corners with their little domes
  const dz = 22.4
  block(out, -15.6, 15.6, dz - 15.6, dz + 15.6, 21, 33, p.stone)
  band(out, ring([-15.6, dz - 15.6, 15.6, dz - 15.6, 15.6, dz + 15.6, -15.6, dz + 15.6]), 32.4, 1.0, 0.4, p.trim)
  for (const [x, z] of [[-14.1, 8.3], [14.1, 8.3], [-14.1, 36.6], [14.1, 36.6]]) {
    block(out, x - 3.2, x + 3.2, z - 3.2, z + 3.2, 21, 30, p.stone)
    prism(out, x, z, 30, 37.5, 2.9, 8, p.stone, FIXED)
    for (let i = 0; i < 8; i++) {
      const a0 = (i / 8) * Math.PI * 2
      const a1 = ((i + 1) / 8) * Math.PI * 2
      const e = edgeFrame(out, { x: x + Math.sin(a0) * 2.9, z: z + Math.cos(a0) * 2.9 }, { x: x + Math.sin(a1) * 2.9, z: z + Math.cos(a1) * 2.9 }, { x, z })
      traceryWindow(e, e.L / 2, 31.2, e.L * 0.56, 4.8, { stone: p.trim, glass: p.dark, head: 'round', lights: 1, far: true })
    }
    prism(out, x, z, 37.5, 38.3, 3.2, 8, p.trim, FIXED)
    domeOf(out, x, z, 38.3, 2.9, 4.2, lead, (t) => Math.cos(Math.asin(Math.min(1, t))) ** 0.8, { sides: 12, steps: 5 })
    prism(out, x, z, 42.4, 44.6, 0.35, 6, lead, FIXED, 0.08)
  }
  // the drum: a plinth, the ring of tall arched windows between pilasters, the cornice
  prism(out, 0, dz, 33, 37, 14.2, 28, p.stone, FIXED)
  prism(out, 0, dz, 37, 50.5, 12.8, 28, p.stone, FIXED)
  for (let i = 0; i < 28; i++) {
    const a0 = (i / 28) * Math.PI * 2
    const a1 = ((i + 1) / 28) * Math.PI * 2
    if (i % 2) {
      box(out, Math.sin((a0 + a1) / 2) * 12.9, 44.6, dz + Math.cos((a0 + a1) / 2) * 12.9, 0.4, 5.9, 0.4, p.trim, FIXED)
      continue
    }
    const e = edgeFrame(out, { x: Math.sin(a0) * 12.82, z: dz + Math.cos(a0) * 12.82 }, { x: Math.sin(a1) * 12.82, z: dz + Math.cos(a1) * 12.82 }, { x: 0, z: dz })
    traceryWindow(e, e.L / 2, 39.5, 2.1, 8.8, { stone: p.trim, glass: p.glass, head: 'round', lights: 2, far: true })
  }
  prism(out, 0, dz, 50.5, 52.2, 13.6, 28, p.trim, FIXED)
  prism(out, 0, dz, 52.2, 53.6, 12.9, 28, p.stone, FIXED)
  // the ribbed cap, a little flattened, the oculi round its foot
  domeOf(out, 0, dz, 53.6, 12.9, 17.2, lead, (t) => Math.cos(Math.asin(Math.min(1, t * 0.98))) ** 0.9,
    { sides: 28, steps: 10, ribs: 16, rib: [0.36, 0.38, 0.38] })
  // the red iron lantern: its ring of posts, the cornice, the spire and the cross
  const ly = 70.4
  prism(out, 0, dz, ly, ly + 0.8, 3.2, 12, red, FIXED)
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    box(out, Math.sin(a) * 2.7, ly + 4.6, dz + Math.cos(a) * 2.7, 0.18, 3.8, 0.18, red, FIXED)
  }
  prism(out, 0, dz, ly + 1, ly + 8, 2.0, 12, p.dark, FIXED)
  prism(out, 0, dz, ly + 8.2, ly + 9.2, 3.1, 12, red, FIXED)
  prism(out, 0, dz, ly + 9.2, ly + 13.0, 2.2, 12, red, FIXED, 0.15)
  box(out, 0, ly + 14.0, dz, 0.07, 1.0, 0.07, p.gold, FIXED)
  box(out, 0, ly + 14.4, dz, 0.45, 0.07, 0.07, p.gold, FIXED)

  // the chevet: the apse beyond the crossing, half-round, and its roof
  chevet(out, 0, 38.2, 9.8, 0, 26, 30, p.stone, p.lead, p.glass, { n: 7, win: { y0: 9, h: 11, head: 'round', lights: 2 }, butt: 1 })

  // the front on the place: the porch block with its three arches, the frieze of the apostles, the great arch with
  // the rose, the gable and its cross; the corner piers with their niches and pinnacles
  const zf = -47.6
  block(out, -10.8, 10.8, zf, -36.8, 0, 27.5, p.stone)
  const fr = faceFrame(out, '-z', zf)
  for (let k = 0; k < 4; k++) block(out, -10.4 + k * 0.4, 10.4 - k * 0.4, zf - 2.2 + k * 0.5, zf, 0, 0.6 - k * 0.15, p.trim)
  // the porch's three round arches between Corinthian shafts
  for (const x of [-5.6, 0, 5.6]) gothicPortal(fr, x, 0.8, 4.4, 8.6, { stone: p.trim, dark: p.dark, door, depth: 0.85, orders: 3 })
  for (const x of [-8.3, -2.8, 2.8, 8.3]) engaged(fr, x, 0.6, 9.6, 0.4, p.trim, 'corinthian')
  entablature(fr, -10.9, 10.9, 9.6, 1, 0.6, p.trim)
  // the frieze of Christ and the Apostles, each under a little arch, and the gallery's rail over
  blindArcade(fr, -8.4, 8.4, 10.9, 2.8, 13, p.trim, p.dark, { d: 0.2 })
  for (let i = 0; i < 13; i++) statue(out, -8.4 + (16.8 * (i + 0.5)) / 13, 10.95, zf - 0.07, 2.1, shade(p.stone, 1.12))
  boxOn(fr, -10.9, 10.9, 13.8, 14.5, 0, 0.5, p.trim, true)
  // the great arch with the rose
  gothicPortal(fr, 0, 14.8, 15.4, 11.8, { stone: p.stone, dark: p.stone, door: p.stone, depth: 0.5, orders: 2 })
  roseWindow(frameAt(fr, 0.14), 0, 20.4, 4, { stone: p.trim, glass: p.glass, spokes: 16, d: 0.3 })
  boxOn(fr, -11.2, 11.2, 26.9, 28, 0, 0.7, p.trim, true)
  pedimentFront(fr, -11.2, 11.2, 28, 7.2, 0.7, p.trim, { relief: 3 })
  box(out, 0, 36.6, zf + 0.4, 0.55, 1.4, 0.45, p.stone, FIXED)
  box(out, 0, 39.2, zf + 0.4, 0.14, 1.3, 0.14, p.stone, FIXED)
  box(out, 0, 39.6, zf + 0.4, 0.7, 0.14, 0.14, p.stone, FIXED)
  // the façade's gable roof running back to the nave
  roof(out, -11.0, 11.0, -47.2, -36.8, 27.5, 7.0, 11.0, 0.01, p.slate)
  for (const s of [-1, 1]) {
    const x = s * 11.0
    block(out, x - 1.2, x + 1.2, zf - 0.3, zf + 2.2, 0, 29.5, p.stone)
    const pier = faceFrame(out, '-z', zf - 0.3)
    niche(pier, x, 10.8, 1.2, 3.4, 0.04, p.stone, p.dark)
    niche(pier, x, 3, 1.2, 3.4, 0.04, p.stone, p.dark)
    stackedPinnacle(out, x, zf + 1.0, 29.5, 3.6, 0.8, p.trim, 2)
    // the two small domed turrets behind the front, where the nave meets it
    const tz = -38.0
    prism(out, s * 8.6, tz, 27.5, 34.0, 1.75, 8, p.stone, FIXED)
    drumArches(out, s * 8.6, tz, 1.75, 29.0, 6, 0.6, 2.8, p.dark, p.trim)
    domeOf(out, s * 8.6, tz, 34.0, 1.9, 2.4, lead, (t) => Math.cos(Math.asin(Math.min(1, t))), { sides: 10, steps: 4 })
    prism(out, s * 8.6, tz, 36.4, 37.6, 0.2, 6, p.gold, FIXED, 0.05)
  }
}
