import type { MeshBuilder } from '../../../buildings.ts'
import { box, prism } from '../../../models.ts'
import { beam, block, classicalColumn, roof } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { archOn, mansard, pedimentOn, rectOn } from '../palaces/common.ts'
import { domeOf, drumArches, figure, FIXED, graded, quarter } from './common.ts'
import { pal } from './churches.ts'

/*
 * THE VAL-DE-GRÂCE (François Mansart, then Lemercier, Le Muet and Le Duc, 1645–67), Anne of Austria's votive church
 * at the head of the Rue du Val-de-Grâce, now the army's: with the Invalides, the Sorbonne and the Panthéon one of the
 * city's four great DOMES. The drum ringed by paired pilasters and buttressing scrolls with statues on them, the
 * ribbed lead cap with its dormers and gilded garlands, the open LANTERN and its spire (OSM's parts: the drum 1458521343
 * to 39.3, the cap 1458521342 to 52.8, the lantern 1458521344 to 62), the four little domed turrets at the crossing's
 * corners (1458831028…31, 36.4). Below, the FRONT on the Place Alphonse-Laveran in two storeys of Corinthian columns
 * — the projecting portico with its pediment at 17, the upper order and the great pediment at 30 — scrolls sweeping
 * down to the lower chapels either side, the nave under its mansard behind.
 *
 * OSM's parts drew the dome as an octagonal shaft with a flat top in the city (2026-10-29); the model replaces the
 * outline (way 59846865) and its parts. Frame: −z the front (bearing 293), the dome toward +z on the axis x = −5.85.
 */
const HX = 29.7
const HZ = 36.7

export function valDeGrace(out: MeshBuilder, fit: Fit): void {
  graded(out, fit, HX, HZ, (q) => valdg(q))
}

function valdg(out: MeshBuilder): void {
  const p = pal('#d9cfb9', '#4f5960')
  const cx = -5.85
  const dz = 11.2
  // the side ranges in the outline: the convent wings against the church, mansarded
  block(out, 8.1, 27.7, 4.0, 17.1, 0, 14.1, p.stone)
  mansard(out, 8.1, 27.7, 4.0, 17.1, 14.1, 3.6, 2.3, p.slate)
  block(out, -29.7, -19.3, 4.2, 17.0, 0, 13.5, p.stone)
  mansard(out, -29.7, -19.3, 4.2, 17.0, 13.5, 3.4, 2.2, p.slate)
  block(out, 7.9, 17.7, -16.2, 2.3, 0, 8.0, p.stone)
  roof(out, 7.9, 17.7, -16.2, 2.3, 8.0, 2.0, 4.9, 4.9, p.slate)
  // the side chapels to 17.9 under lean-to roofs, the nave to 23.3 under its broken roof to 28
  block(out, -19.3, 8.0, -27.2, -2.4, 0, 14.1, p.stone)
  roof(out, -19.4, 8.1, -27.2, -2.4, 14.1, 3.8, 6.9, 0.01, p.slate)
  block(out, cx - 6.75, cx + 6.75, -25, -2.4, 14.1, 23.3, p.stone)
  mansard(out, cx - 6.75, cx + 6.75, -25, -2.4, 23.3, 3.2, 1.5, p.slate, 1.8)
  for (let z = -22; z < -3; z += 5.0) {
    for (const s of [-1, 1]) {
      archOn(out, s < 0 ? '-x' : '+x', cx + s * 6.75, z, 16.0, 2.0, 5.5, p.glass)
      archOn(out, s < 0 ? '-x' : '+x', s < 0 ? -19.3 : 8.0, z, 2.5, 2.2, 7.0, p.glass)
    }
  }
  // the crossing: the square base under the drum to 27, the transept arms and the choir behind, the chapels round
  block(out, cx - 13.2, cx + 13.2, dz - 13.4, dz + 13.4, 0, 27.0, p.stone)
  block(out, cx - 13.5, cx + 13.5, dz - 13.7, dz + 13.7, 26.4, 27.2, p.trim)
  for (const f of ['-x', '+x', '+z'] as const) {
    const plane = f === '-x' ? cx - 13.2 : f === '+x' ? cx + 13.2 : dz + 13.4
    const t = f === '+z' ? cx : dz
    archOn(out, f, plane, t, 9.0, 4.2, 10.0, p.glass)
    pedimentOn(out, f, plane, t - 7, t + 7, 27.2, 3.4, 0.3, p.trim)
  }
  // the choir's chapel beyond the crossing with its own small dome (1458521345/6)
  block(out, cx - 6.6, cx + 6.6, 24.6, 36.7, 0, 16.4, p.stone)
  prism(out, cx, 29.6, 16.4, 19.0, 4.6, 16, p.stone, FIXED)
  domeOf(out, cx, 29.6, 19.0, 4.6, 3.6, p.lead, quarter, { sides: 16, steps: 5, ribs: 8 })
  // the four little domed turrets at the corners of the crossing
  for (const [x, z] of [[3.9, -0.1], [3.9, 20.8], [-15.0, 20.6], [-15.3, -0.1]]) {
    prism(out, x, z, 27.2, 32.6, 1.9, 8, p.stone, FIXED)
    drumArches(out, x, z, 1.9, 28.2, 4, 0.8, 2.8, p.dark)
    prism(out, x, z, 32.6, 33.1, 2.1, 8, p.trim, FIXED)
    domeOf(out, x, z, 33.1, 1.9, 2.6, p.lead, (t) => Math.cos(Math.asin(Math.min(1, t))) ** 0.6, { sides: 8, steps: 5 })
    prism(out, x, z, 35.6, 36.6, 0.18, 6, p.gold, FIXED, 0.06)
  }
  // THE DRUM: its body and the windows between paired pilasters, a buttress with its scroll and statue at every
  // pair; the cornice and the attic with its garlands
  prism(out, cx, dz, 27.2, 29.0, 12.6, 32, p.stone, FIXED)
  prism(out, cx, dz, 29.0, 39.3, 10.8, 32, p.stone, FIXED)
  drumArches(out, cx, dz, 10.8, 30.6, 16, 1.9, 6.6, p.glass)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    const sx = Math.sin(a)
    const sz = Math.cos(a)
    // the paired pilasters as one buttress, its scroll down to the base, a statue standing on it
    for (const d of [-0.07, 0.07]) {
      const b = a + d
      box(out, cx + Math.sin(b) * 11.2, 34.2, dz + Math.cos(b) * 11.2, 0.35, 5.1, 0.35, p.trim, FIXED)
    }
    beam(out, [cx + sx * 11.3, 33.5, dz + sz * 11.3], [cx + sx * 12.9, 29.2, dz + sz * 12.9], 0.5, p.stone)
    figure(out, cx + sx * 12.4, 29.0, dz + sz * 12.4, 2.3, p.trim)
  }
  prism(out, cx, dz, 39.3, 40.6, 11.7, 32, p.trim, FIXED)
  prism(out, cx, dz, 40.6, 43.0, 10.9, 32, p.stone, FIXED)
  for (let i = 0; i < 16; i++) {
    const a = ((i + 0.5) / 16) * Math.PI * 2
    figure(out, cx + Math.sin(a) * 11.3, 40.6, dz + Math.cos(a) * 11.3, 2.0, p.trim)
  }
  // THE CAP: ribbed lead with gilded ribs, a ring of dormers
  domeOf(out, cx, dz, 43.0, 10.6, 9.8, p.lead, quarter, { sides: 32, steps: 10, ribs: 16, rib: [0.62, 0.56, 0.4] })
  for (let i = 0; i < 8; i++) {
    const a = ((i + 0.5) / 8) * Math.PI * 2
    const r = 9.3
    const x = cx + Math.sin(a) * r
    const z = dz + Math.cos(a) * r
    prism(out, x, z, 45.2, 47.4, 0.75, 6, p.lead, FIXED)
    prism(out, x, z, 47.4, 48.4, 0.85, 6, p.lead, FIXED, 0.1)
  }
  // THE LANTERN: a balustraded ring, the open stage of arches, the little dome and spire, the cross at ~63
  prism(out, cx, dz, 52.6, 53.2, 3.4, 16, p.trim, FIXED)
  prism(out, cx, dz, 53.2, 58.2, 2.7, 16, p.stone, FIXED)
  drumArches(out, cx, dz, 2.7, 53.8, 8, 0.9, 3.4, p.dark, p.trim)
  prism(out, cx, dz, 58.2, 58.8, 3.0, 16, p.trim, FIXED)
  domeOf(out, cx, dz, 58.8, 2.6, 1.6, p.lead, quarter, { sides: 12, steps: 4 })
  prism(out, cx, dz, 60.3, 62.4, 0.55, 8, p.lead, FIXED, 0.08)
  box(out, cx, 63.0, dz, 0.06, 0.7, 0.06, p.gold, FIXED)
  box(out, cx, 63.3, dz, 0.35, 0.06, 0.06, p.gold, FIXED)

  // THE FRONT: the nave's end to 26 between the scrolls, the steps, the lower portico (four columns, its pediment to
  // 17.2), the upper order (four columns between pilasters, the great pediment to 30.2), the side chapels' fronts
  const zf = -27.2
  block(out, cx - 8.4, cx + 8.4, zf, -24.0, 0, 26.0, p.stone)
  for (let k = 0; k < 5; k++) block(out, cx - 10.5 + k * 0.4, cx + 10.5 - k * 0.4, -33.6 + k * 0.6, zf, 0, 0.2 * (k + 1), p.trim)
  for (const x of [-2.3, -0.7, -9.9, -11.5]) {
    classicalColumn(out, x - 0.1 + 0.15, -29.7, 1.0, 13.0, 0.5, p.stone, { order: 'corinthian', tier: 'mid', heading: Math.PI })
  }
  block(out, cx - 6.6, cx + 6.6, -30.8, zf, 13.0, 14.2, p.trim)
  block(out, cx - 6.6, cx + 6.6, -30.4, zf, 13.0, 14.0, p.stone)
  pedimentOn(out, '-z', -30.8, cx - 6.6, cx + 6.6, 14.2, 3.0, 0.6, p.trim)
  roof(out, cx - 6.6, cx + 6.6, -30.8, zf, 14.0, 3.0, 6.6, 0.01, p.slate)
  archOn(out, '-z', zf, cx, 1.0, 3.6, 8.8, p.dark)
  for (const x of [1.4, -0.6, -11.6, -13.6]) {
    classicalColumn(out, x + 0.05, -27.9, 17.4, 25.8, 0.42, p.stone, { order: 'corinthian', tier: 'mid', heading: Math.PI })
  }
  archOn(out, '-z', zf, cx, 18.0, 3.6, 6.6, p.glass)
  block(out, cx - 8.8, cx + 8.8, -28.8, zf, 25.8, 27.0, p.trim)
  pedimentOn(out, '-z', -28.8, cx - 8.8, cx + 8.8, 27.0, 3.4, 0.6, p.trim)
  rectOn(out, '-z', zf, cx - 7.5, cx + 7.5, 16.0, 17.2, p.trim, 0.25)
  for (const s of [-1, 1]) {
    // the scroll sweeping down from the upper order to the chapel's front, the chapel's front itself, its urn
    beam(out, [cx + s * 8.4, 24.0, -27.4], [cx + s * 12.6, 15.0, -27.4], 0.8, p.trim)
    rectOn(out, '-z', zf, cx + s * 9.0 - 3.3, cx + s * 9.0 + 3.3, 0.5, 13.5, p.stone, 0.05)
    archOn(out, '-z', zf, cx + s * 10.3, 2.0, 2.0, 6.0, p.glass)
    prism(out, cx + s * 12.6, -27.4, 14.1, 15.6, 0.4, 8, p.trim, FIXED, 0.25)
  }
}
