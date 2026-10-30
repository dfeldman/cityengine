import type { MeshBuilder } from '../../../buildings.ts'
import { block, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { archOn, balustrade, dormers, fitted, mansard, palette, pavilionRoof, pedimentOn, range, rectOn, slabOn, type Pal, type Storey } from '../palaces/common.ts'

/** the design footprint: OSM ways 78536170 and 871912194's box (local −z faces bearing 334, the Boulevard de l'Hôpital's garden) */
const HX = 108.4
const HZ = 11.7

/**
 * La Salpêtrière's main front (Louis Le Vau, Pierre Le Muet and Libéral Bruant, 1656–77), Louis XIV's Hôpital général on
 * the site of the saltpetre works, now the Pitié-Salpêtrière: the longest plain range in Paris, two hundred metres of it
 * across the head of its garden on the Boulevard de l'Hôpital, with the chapel's dome over the middle (the chapel is its
 * own entry and not drawn here). What a rider sees, coming up the garden's avenue or down the boulevard (local −z):
 *
 * - the two long wings, the Divisions Mazarin (−x) and Lassay (+x), three storeys in pale rough stone, plain rows of
 *   windows, under a very tall slate roof with its row of dormers, a frontispiece in the middle of each;
 * - the four pavilions that break them, a step taller, each with a steep roof of its own;
 * - in the middle the low gateway building, a round arch under a pediment, with the dome behind.
 *
 * The plan and the rhythm are OSM's (ways 78536170, 871912194, 871912193 and their parts, which go down to the dormers,
 * giving the wings about 11–13 m to the eaves and the pavilions 14–18). From memory: the colour and the gateway's
 * dressing. No photograph of the front was checked. The back wings at the wings' ends are on the plan and plain.
 */
export function salpetriere(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

const STOREYS: Storey[] = [{ y: 0, h: 2.2, sill: 1.1 }, { y: 4.4, h: 2.6, sill: 0.9 }, { y: 8.4, h: 2.2, sill: 0.8 }]

function draw(out: MeshBuilder): void {
  const p = palette('#d6c9ac', '#4b5157')
  const E = 12.4
  const z0 = -11.2
  const z1 = 1.7
  // ---- the two wings
  for (const [a, b] of [[-96, -26], [25, 96]] as const) {
    range(out, a, b, z0, z1, p, { eaves: E, bay: 3.9, win: 1.45, storeys: STOREYS, faces: ['-z', '+z'], cornice: 0.5, courses: true })
    mansard(out, a, b, z0, z1, E, 3.6, 3.2, p.slate, 1.5)
    dormers(out, '-z', z0, a + 0.5, b - 0.5, E + 0.1, 7.8, p, { w: 1.2, h: 2.1, set: 0.45 })
    dormers(out, '+z', z1, a + 0.5, b - 0.5, E + 0.1, 7.8, p, { w: 1.2, h: 2.1, set: 0.45 })
    // the frontispiece in the middle of the wing: three bays, a step proud, its pediment in the roof
    const m = (a + b) / 2
    block(out, m - 5.8, m + 5.8, z0 - 0.5, z0 + 0.5, 0, E + 0.4, p.stone)
    for (const dx of [-3.9, 0, 3.9]) {
      for (const s of STOREYS) rectOn(out, '-z', z0 - 0.5, m + dx - 0.75, m + dx + 0.75, s.y + (s.sill ?? 0.9), s.y + (s.sill ?? 0.9) + s.h, p.glass, 0.06)
    }
    slabOn(out, '-z', z0 - 0.5, m - 6, m + 6, E - 0.2, E + 0.4, 0.3, p.trim)
    pedimentOn(out, '-z', z0 - 0.5, m - 6.2, m + 6.2, E + 0.4, 2.8, 0.25, p.stone)
  }
  // ---- the pavilions
  for (const [a, b] of [[-108.3, -96], [-26, -13.2], [12.1, 25], [96, 108.3]] as const) pav(out, p, a, b, z0 - 0.4, z1 + 0.2, E)
  // the pavilions' back wings on the plan
  for (const [a, b] of [[-108, -96], [-25.7, -13.6]] as const) {
    range(out, a, b, z1, 11.4, p, { eaves: E, bay: 3.9, win: 1.45, storeys: STOREYS, faces: ['-x', '+x', '+z'], cornice: 0.5 })
    mansard(out, a, b, z1, 11.4, E, 2.4, 2.4, p.slate, 1.2)
  }
  // ---- the gateway in the middle: lower, all stone, one great arch, the pediment, a balustrade to the side doors
  const a = -13.2
  const b = 12.1
  const g = z0 + 0.3
  const y = 9.6
  const m = (a + b) / 2
  block(out, a, b, g, z1 + 2, 0, y, p.stone)
  for (let k = 0.8; k < 5.6; k += 0.68) rectOn(out, '-z', g, a, b, k - 0.05, k + 0.04, p.deep, 0.03)
  rectOn(out, '-z', g, m - 3.7, m + 3.7, 0.2, 7.2, shade(p.stone, 0.86), 0.04)
  archOn(out, '-z', g, m, 0.2, 5.4, 6.9, p.dark, 0.08)
  for (const s of [-1, 1]) {
    rectOn(out, '-z', g, m + s * 8 - 0.9, m + s * 8 + 0.9, 1, 3.9, p.dark, 0.06)
    rectOn(out, '-z', g, m + s * 8 - 0.8, m + s * 8 + 0.8, 5.4, 7.6, p.glass, 0.06)
    block(out, m + s * 4.7 - 0.5, m + s * 4.7 + 0.5, g - 0.35, g, 0.3, y - 1.1, p.trim)
  }
  slabOn(out, '-z', g, a - 0.2, b + 0.2, y - 1.1, y, 0.55, p.trim)
  rectOn(out, '-z', g, m - 5.6, m + 5.6, y - 0.9, y - 0.3, shade(p.trim, 0.82), 0.56)   // the Liberté-Égalité-Fraternité band
  pedimentOn(out, '-z', g, m - 6.4, m + 6.4, y, 2.7, 0.55, p.stone)
  balustrade(out, a, b, g, z1 + 2, y, p, { sides: ['-z'], h: 0.9 })
  block(out, a + 0.2, b - 0.2, g + 0.2, z1 + 2, y, y + 0.2, p.lead)
  block(out, m - 6.4, m + 6.4, g + 0.1, g + 6, y, y + 2.2, p.stone)
  mansard(out, m - 6.4, m + 6.4, g + 0.1, g + 6, y + 2.2, 0.8, 1, p.slate, 0.7)
}

/** A pavilion: a storey's worth taller than the wings, plain stone, a steep slate roof to a short ridge, dormers on its faces. */
function pav(out: MeshBuilder, p: Pal, a: number, b: number, z0: number, z1: number, E: number): void {
  const e = E + 2.2
  range(out, a, b, z0, z1, p, { eaves: e, bay: 3.9, win: 1.45, faces: ['-z', '+z'], cornice: 0.55, quoins: true,
    storeys: [...STOREYS, { y: 11.8, h: 1.2, sill: 0.3 }] })
  pavilionRoof(out, a, b, z0, z1, e, 6.8, p, { top: 2.2 })
  dormers(out, '-z', z0, a + 1.8, b - 1.8, e + 0.1, 4.4, p, { w: 1.1, h: 1.9, set: 0.5 })
  dormers(out, '+z', z1, a + 1.8, b - 1.8, e + 0.1, 4.4, p, { w: 1.1, h: 1.9, set: 0.5 })
}
