import type { MeshBuilder } from '../../../buildings.ts'
import { box, prism } from '../../../models.ts'
import { block, classicalColumn, roof } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { archOn, pedimentOn, rectOn } from '../palaces/common.ts'
import { apseWall, band, domeOf, drumArches, FIXED, graded, type P2, ring, walls } from './common.ts'
import { pal, pinnacle, roseOn } from './churches.ts'

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
  const p = pal('#d9cdb2', '#53606a')
  const lead: [number, number, number] = [0.44, 0.49, 0.54]
  const red: [number, number, number] = [0.78, 0.42, 0.3]
  // the chapels and aisles all round to 21 m under a low lead roof; the cornice
  walls(out, PLAN, 0, 21, p.stone, p.lead)
  band(out, PLAN, 20.2, 0.9, 0.35, p.trim)
  // the nave's clerestory, ±7.3, eaves at 33 and its roof ridge at 40; the windows down both sides
  block(out, -7.3, 7.3, -38, 8, 21, 33, p.stone)
  roof(out, -7.7, 7.7, -38, 8, 33, 6.5, 7.7, 0.01, p.slate)
  for (let z = -33; z < 6; z += 4.6) {
    for (const s of [-1, 1]) archOn(out, s < 0 ? '-x' : '+x', s * 7.3, z, 23.5, 2.0, 6.5, p.glass)
  }
  // the chapels' round windows along the widening sides
  for (let z = -26; z < 2; z += 5.2) {
    const w = 9.1 + ((z + 29.7) / 27.2) * 7.0
    for (const s of [-1, 1]) archOn(out, s < 0 ? '-x' : '+x', s * w, z, 7, 2.2, 8, p.glass)
  }

  // the crossing under the dome: a square block to 33, the four turrets at its corners with their little domes
  const dz = 22.4
  block(out, -15.6, 15.6, dz - 15.6, dz + 15.6, 21, 33, p.stone)
  band(out, ring([-15.6, dz - 15.6, 15.6, dz - 15.6, 15.6, dz + 15.6, -15.6, dz + 15.6]), 32.4, 1.0, 0.4, p.trim)
  for (const [x, z] of [[-14.1, 8.3], [14.1, 8.3], [-14.1, 36.6], [14.1, 36.6]]) {
    block(out, x - 3.2, x + 3.2, z - 3.2, z + 3.2, 21, 30, p.stone)
    prism(out, x, z, 30, 37.5, 2.9, 8, p.stone, FIXED)
    drumArches(out, x, z, 2.9, 31.2, 8, 0.8, 4.2, p.dark)
    prism(out, x, z, 37.5, 38.3, 3.2, 8, p.trim, FIXED)
    domeOf(out, x, z, 38.3, 2.9, 4.2, lead, (t) => Math.cos(Math.asin(Math.min(1, t))) ** 0.8, { sides: 12, steps: 5 })
    prism(out, x, z, 42.4, 44.6, 0.35, 6, lead, FIXED, 0.08)
  }
  // the drum: a plinth, the ring of tall arched windows between pilasters, the cornice
  prism(out, 0, dz, 33, 37, 14.2, 28, p.stone, FIXED)
  prism(out, 0, dz, 37, 50.5, 12.8, 28, p.stone, FIXED)
  drumArches(out, 0, dz, 12.8, 39.5, 16, 2.0, 8.5, p.glass, p.trim)
  prism(out, 0, dz, 50.5, 52.2, 13.6, 28, p.trim, FIXED)
  prism(out, 0, dz, 52.2, 53.6, 12.9, 28, p.stone, FIXED)
  // the ribbed cap, a little flattened, the oculi round its foot
  domeOf(out, 0, dz, 53.6, 12.9, 17.2, lead, (t) => Math.cos(Math.asin(Math.min(1, t * 0.98))) ** 0.9,
    { sides: 28, steps: 10, ribs: 16, rib: [0.6, 0.6, 0.58] })
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
  apseWall(out, 0, 38.2, 9.8, 0, 26, 30, p.stone, p.lead, p.glass, 8)

  // the front on the place: the porch block with its three arches, the frieze of the apostles, the great arch with
  // the rose, the gable and its cross; the corner piers with their niches and pinnacles
  const zf = -47.6
  block(out, -10.8, 10.8, zf, -36.8, 0, 27.5, p.stone)
  for (const x of [-5.6, 0, 5.6]) archOn(out, '-z', zf, x, 0.8, 4.2, 9.0, p.dark)
  for (const x of [-8.3, -2.8, 2.8, 8.3]) classicalColumn(out, x, zf - 0.45, 0.6, 7.2, 0.38, p.stone, { order: 'corinthian', tier: 'mid', heading: Math.PI })
  for (let k = 0; k < 4; k++) block(out, -10.4 + k * 0.4, 10.4 - k * 0.4, zf - 2.2 + k * 0.5, zf, 0, 0.6 - k * 0.15, p.trim)
  block(out, -10.9, 10.9, zf - 0.6, zf, 9.8, 10.6, p.trim)
  for (let x = -7.4; x <= 7.5; x += 1.35) box(out, x, 12.3, zf - 0.25, 0.42, 1.25, 0.25, p.deep, FIXED)
  block(out, -10.9, 10.9, zf - 0.6, zf, 13.8, 14.6, p.trim)
  archOn(out, '-z', zf, 0, 14.8, 13.4, 11.6, p.deep, 0.05)
  roseOn(out, '-z', zf, 0, 20.4, 3.9, p.glass, p.trim)
  block(out, -11.2, 11.2, zf - 0.7, zf + 0.2, 27.0, 28.0, p.trim)
  pedimentOn(out, '-z', zf + 0.2, -11.2, 11.2, 28.0, 7.2, 0.7, p.trim)
  rectOn(out, '-z', zf, -1.0, 1.0, 30.0, 32.2, p.deep, 0.75)
  box(out, 0, 36.6, zf + 0.4, 0.55, 1.4, 0.45, p.stone, FIXED)
  box(out, 0, 39.2, zf + 0.4, 0.14, 1.3, 0.14, p.stone, FIXED)
  box(out, 0, 39.6, zf + 0.4, 0.7, 0.14, 0.14, p.stone, FIXED)
  // the façade's gable roof running back to the nave
  roof(out, -11.0, 11.0, -47.2, -36.8, 27.5, 7.0, 11.0, 0.01, p.slate)
  for (const s of [-1, 1]) {
    const x = s * 11.0
    block(out, x - 1.2, x + 1.2, zf - 0.3, zf + 2.2, 0, 29.5, p.stone)
    archOn(out, '-z', zf - 0.3, x, 10.8, 1.3, 3.0, p.deep)
    archOn(out, '-z', zf - 0.3, x, 3.0, 1.3, 3.0, p.deep)
    pinnacle(out, x, zf + 1.0, 29.5, 3.2, 1.6, p.trim)
    // the two small domed turrets behind the front, where the nave meets it
    const tz = -38.0
    prism(out, s * 8.6, tz, 27.5, 34.0, 1.75, 8, p.stone, FIXED)
    drumArches(out, s * 8.6, tz, 1.75, 29.0, 6, 0.6, 2.8, p.dark)
    domeOf(out, s * 8.6, tz, 34.0, 1.9, 2.4, lead, (t) => Math.cos(Math.asin(Math.min(1, t))), { sides: 10, steps: 4 })
    prism(out, s * 8.6, tz, 36.4, 37.6, 0.2, 6, p.gold, FIXED, 0.05)
  }
}
