import type { MeshBuilder } from '../../../buildings.ts'
import { prism, type Rgb } from '../../../models.ts'
import { block, dome, hex, shade } from '../../kit.ts'
import { boxAlong } from '../../parts.ts'
import type { Fit } from '../../fit.ts'
import { extrude, fitted, palette, pts } from './common.ts'
import { bandRound, capRound, lettersRound } from './showfront.ts'
import { baysOf, wallOn, type Wall } from './wall.ts'

/** the design footprint: OSM way 29168869's box turned to the Rue de Rivoli (local −z faces bearing 200) */
const HX = 51.4
const HZ = 33.5
const EAVES = 24

/** Way 29168869 in the model's frame, the rotunda's curve left to the drum drawn over it. */
const PLAN = pts([
  -50.6, -29, -47.9, -32.2, -44.8, -33.5, -38.4, -32, -37.7, -33.1, 45.8, -33.3, 51.3, -27.7, 51.4, 14.1, 50.3, 16.8, 47.8, 20.1, 43.1, 22, -31.4, 33.5, -36.4, 32.6, -41.1, 26.4, -49.9, -18.4, -48.9, -19.1, -51.3, -24,
])

/** the rotunda on the crossing of the Rue de Rivoli and the Rue du Temple */
const RX = -42.3
const RZ = -24.6
const RR = 9.3

interface Tones { stone: Rgb; trim: Rgb; deep: Rgb; dark: Rgb; glass: Rgb; red: Rgb; lit: Rgb }

/**
 * Le BHV Marais, the Bazar de l'Hôtel de Ville (Xavier Ruel's store, rebuilt 1903–13 by Auguste Roy), on the Rue de Rivoli
 * opposite the Hôtel de Ville. What a rider sees:
 *
 * - the ROTUNDA on the Rue du Temple corner, the store's whole identity: dark-framed glass up three storeys between stone
 *   piers, the sign round its cornice, a round attic, and over it the black ribbed DOME with its bull's-eyes and lantern;
 * - the long Rivoli front: tall glazed bays between stone piers, red banners on them, an attic and a slate roof;
 * - the glass and iron MARQUISE along the shops, fanning round the rotunda's foot.
 *
 * Plan is OSM's, whose curve at that corner is where the rotunda goes. Commons "Bazar Hôtel Ville - Paris IV (FR75) -
 * 2020-09-30 - 3" and "Le BHV, magasin emblématique parisien": heights scaled off a door: marquise 4.6 m, cornice 21,
 * the store's eaves 24, the drum's attic to 28, the dome to 39, the lantern 43.
 */
export function bhv(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const p = palette('#dcd3bf', '#3f4549')
  const t: Tones = { stone: p.stone, trim: p.trim, deep: p.deep, dark: hex('#2f3a38'), glass: [0.24, 0.3, 0.33], red: hex('#a22a2a'), lit: hex('#94856a') }
  extrude(out, [PLAN], p, { eaves: EAVES, storeys: [], bay: 4, rise: 3.6, inset: 2.6, dormers: false })
  // ---- the street walls, in ring order
  front(wallOn(out, { x: -33, z: -33.2 }, { x: 45.8, z: -33.3 }), t, 6.4, true)
  front(wallOn(out, { x: 51.3, z: -27.7 }, { x: 51.4, z: 14.1 }), t, 6.4, false)
  front(wallOn(out, { x: 43.1, z: 22 }, { x: -31.4, z: 33.5 }), t, 6.4, false)
  front(wallOn(out, { x: -41.1, z: 26.4 }, { x: -49.2, z: -14 }), t, 6.4, false)
  // the cut corner on the Rue des Archives
  const cut = wallOn(out, { x: 45.8, z: -33.3 }, { x: 51.3, z: -27.7 })
  cut.rect(0, cut.L, 0, EAVES, t.stone, 0.1)
  cut.rect(0.8, cut.L - 0.8, 5.4, 19.4, t.glass, 0.14)
  // the marquise along the shops on Rivoli
  block(out, -33, 45.8, -35.6, -33.2, 4.6, 4.9, t.dark)
  // ---- the rotunda
  rotunda(out, t, p.slate)
}

/** A store wall: shops at the foot, tall glass between stone piers, the cornice, the attic. */
function front(w: Wall, t: Tones, bay: number, banners: boolean): void {
  const { mids, step } = baysOf(w.L, bay, 0.2)
  w.rect(0, w.L, 0, EAVES, t.stone, 0.1)
  mids.forEach((m, i) => {
    // the shop
    w.rect(m - step * 0.42, m + step * 0.42, 0.25, 4.4, i % 3 === 1 ? t.lit : t.glass, 0.15)
    w.rect(m - step * 0.42, m + step * 0.42, 4.4, 5.2, t.dark, 0.15)
    // the three storeys of tall glass in one dark frame
    w.rect(m - step * 0.36, m + step * 0.36, 5.6, 19.4, t.dark, 0.14)
    w.rect(m - step * 0.32, m + step * 0.32, 5.9, 19.1, t.glass, 0.17)
    for (const y of [10.4, 15]) w.rect(m - step * 0.36, m + step * 0.36, y - 0.22, y + 0.22, t.dark, 0.18)
    for (const u of [-0.11, 0.11]) w.rect(m + u * step - 0.06, m + u * step + 0.06, 5.9, 19.1, t.dark, 0.19)
    // the pier's capital and the attic window
    w.rect(m - step * 0.5, m - step * 0.5 + 0.1, 5.6, 20, t.deep, 0.13)
    w.rect(m - 1.05, m + 1.05, 21.5, 23.4, t.deep, 0.13)
    w.rect(m - 0.86, m + 0.86, 21.65, 23.25, t.glass, 0.16)
    if (banners && i % 2 === 0 && i > 1) {
      const u = m + step / 2
      w.slab(u - 0.5, u + 0.5, 8.4, 18.6, 0.5, t.red)
    }
  })
  w.slab(0, w.L, 5.2, 5.6, 0.34, t.trim)
  w.slab(0, w.L, 19.9, 21, 0.62, t.trim)
  w.slab(0, w.L, EAVES - 0.45, EAVES, 0.42, t.trim)
}

function rotunda(out: MeshBuilder, t: Tones, slate: Rgb): void {
  const a0 = -Math.PI
  const a1 = Math.PI
  bandRound(out, RX, RZ, RR, RR, a0, a1, 0, 21, t.stone, { segs: 28 })
  // the glass up three storeys, and the stone piers between, round the street side only: the rest is inside the store
  const n = 9
  const from = -Math.PI   // the three-quarters of the drum clear of the store, centred on the crossing (a = −π/4)
  const span = Math.PI * 1.5
  for (let i = 0; i < n; i++) {
    const a = from + (span * (i + 0.5)) / n
    const hw = span / n * 0.36
    bandRound(out, RX, RZ, RR + 0.06, RR + 0.06, a - hw - 0.03, a + hw + 0.03, 5.6, 19, t.dark, { segs: 3 })
    bandRound(out, RX, RZ, RR + 0.1, RR + 0.1, a - hw, a + hw, 5.9, 18.7, t.glass, { segs: 3 })
    for (const y of [10.2, 14.6]) bandRound(out, RX, RZ, RR + 0.13, RR + 0.13, a - hw, a + hw, y - 0.2, y + 0.2, t.dark, { segs: 3 })
    bandRound(out, RX, RZ, RR + 0.08, RR + 0.08, a - hw, a + hw, 0.2, 4.4, i % 2 ? t.lit : t.glass, { segs: 3 })
    // the windows of the attic, one over each bay
    bandRound(out, RX, RZ, RR - 0.9, RR - 0.9, a - hw * 0.7, a + hw * 0.7, 24.8, 27.2, t.glass, { segs: 2 })
  }
  // the fan of the marquise round its foot, and the fascia
  bandRound(out, RX, RZ, RR + 4, RR + 4, a0, a1, 4.6, 5.2, t.dark, { segs: 28 })
  capRound(out, RX, RZ, RR + 4, RR + 4, a0, a1, 5.2, shade(t.dark, 1.5), true, 28)
  capRound(out, RX, RZ, RR + 4, RR + 4, a0, a1, 4.6, t.lit, false, 28)
  // the stone band with the sign, the cornice
  bandRound(out, RX, RZ, RR + 0.16, RR + 0.16, a0, a1, 19, 21.8, t.trim, { segs: 28 })
  lettersRound(out, RX, RZ, RR + 0.16, RR + 0.16, -Math.PI * 0.25, 19.35, "BAZAR DE L'HOTEL DE VILLE", { h: 0.7, c: hex('#2e2a26'), wide: 0.55, th: 0.11, gap: 0.14, d: 0.04 })
  lettersRound(out, RX, RZ, RR + 0.16, RR + 0.16, -Math.PI * 0.25, 20.45, 'LE BHV MARAIS', { h: 1, c: hex('#2e2a26'), wide: 0.6, th: 0.14, gap: 0.2, d: 0.04 })
  bandRound(out, RX, RZ, RR + 0.8, RR + 0.8, a0, a1, 21.8, 22.5, t.trim, { segs: 28 })
  capRound(out, RX, RZ, RR + 0.8, RR + 0.8, a0, a1, 22.5, t.deep, true, 28)
  // the round attic, set in, its balustrade, its windows above
  bandRound(out, RX, RZ, RR - 1, RR - 1, a0, a1, 22.5, 28, t.stone, { segs: 28 })
  bandRound(out, RX, RZ, RR - 0.6, RR - 0.6, a0, a1, 27.8, 28.6, t.trim, { segs: 28 })
  capRound(out, RX, RZ, RR - 0.6, RR - 0.6, a0, a1, 28.6, t.deep, true, 28)
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2
    prism(out, RX + Math.cos(a) * (RR - 0.1), RZ + Math.sin(a) * (RR - 0.1), 22.5, 23.5, 0.1, 5, t.trim, 0)
  }
  // ---- the dome: black, ribbed, with its bull's-eyes, and the lantern
  dome(out, RX, RZ, 28.6, RR - 1.5, 10.4, slate, 16, shade(slate, 1.55))
  for (let i = 0; i < 4; i++) {
    const a = -Math.PI * 0.75 + ((i - 1.5) * Math.PI) / 2.6
    const r = RR - 2.2
    const x = RX + Math.cos(a) * r
    const z = RZ + Math.sin(a) * r
    const h = Math.atan2(Math.cos(a), Math.sin(a))
    boxAlong(out, x, 32.1, z, 0.85, 1.25, 0.9, h, t.trim)
    boxAlong(out, x + Math.cos(a) * 0.04, 32, z + Math.sin(a) * 0.04, 0.55, 0.85, 0.9, h, t.glass)
  }
  prism(out, RX, RZ, 38.4, 41, 1.45, 8, shade(t.dark, 1.1), 0)
  for (let i = 0; i < 8; i++) {
    const a = ((i + 0.5) / 8) * Math.PI * 2
    prism(out, RX + Math.cos(a) * 1.5, RZ + Math.sin(a) * 1.5, 38.4, 41, 0.14, 5, t.trim, 0)
  }
  prism(out, RX, RZ, 41, 42.5, 1.6, 8, slate, 0, 0.3)
  prism(out, RX, RZ, 42.5, 47, 0.07, 5, t.dark, 0, 0.05)
}
