import { MeshBuilder } from '../../../buildings.ts'
import { archedPane, block, box, column, hex, pane, pediment, prism, rotated, roof, shade, type Rgb } from '../../kit.ts'
import type { Fit } from '../../fit.ts'

const FIXED = 0

/**
 * The twin pavilions at the Tuileries' west end, either side of the garden's gate on the Place de la Concorde:
 * the Orangerie (1852) on the Terrasse du Bord-de-l'Eau, over the Seine, and the Jeu de Paume (1861) on the
 * Terrasse des Feuillants, over the Rue de Rivoli. One long stone hall each, a single tall storey under a low
 * hipped roof whose top is glass (the Nymphéas' daylight, Monet's own condition; the galleries' skylights).
 *
 * From fr.wikipedia (Musée de l'Orangerie; Galerie nationale du Jeu de Paume): the Orangerie was a greenhouse,
 * so its SOUTH front to the Seine is glazed and its NORTH front to the garden blind against the wind; at each end
 * a door under a triangular pediment carried on two columns (Visconti's decor, Poignant's cornucopias) — the
 * west ends face the Concorde, which is what everyone on the place sees. The Jeu de Paume copies its decor
 * (Viraut, 1862) on an 80 × 13 m hall; its long fronts are a close rhythm of round-arched bays between
 * pilasters, glazed to the garden, blind to the Rue de Rivoli.
 *
 * Sizes from OSM (way 54188996: 101 × 15 m, pilasters every 10.5 m; way 54188994: 82 × 13 m, every 4.6 m).
 *
 * Local frame: long axis x, the west end (to the Concorde) at −x; the garden-or-Seine south front faces −z.
 */
interface Pavilion {
  /** bays along each long front, end to end, and the eaves */
  bays: number
  eaves: number
  /** the south front glazed in tall rectangular lights (the Orangerie) or in round-arched bays (the Jeu de Paume) */
  south: 'lights' | 'arches'
  /** half the roof's top, from the west end, that is glass (the rest zinc with skylight strips) */
  glassFrom: number
  /** the Rodin bronzes on the Orangerie's north side */
  bronzes?: boolean
}

function tuileriesPavilion(out: MeshBuilder, fit: Fit, o: Pavilion, hxMin: number, hxMax: number, hzMin: number, hzMax: number): void {
  const stone = hex('#e6dcc6')
  const deep = shade(stone, 0.86)
  const plinthC = shade(stone, 0.8)
  const glass: Rgb = [0.34, 0.42, 0.47]
  const roofGlass: Rgb = [0.6, 0.68, 0.72]
  const zinc = hex('#7e868b')
  const door = hex('#3a3c3a')
  const bronze: Rgb = [0.22, 0.26, 0.23]
  const hx = Math.min(Math.max(fit.hx, hxMin), hxMax)
  const hz = Math.min(Math.max(fit.hz, hzMin), hzMax)
  const E = o.eaves
  const plinth = 1.1

  // ---- the body: a plinth, the walls, the cornice and a low parapet
  block(out, -hx - 0.25, hx + 0.25, -hz - 0.25, hz + 0.25, 0, plinth, plinthC)
  block(out, -hx, hx, -hz, hz, plinth, E, stone)
  block(out, -hx - 0.5, hx + 0.5, -hz - 0.5, hz + 0.5, E, E + 0.55, deep)            // the cornice
  block(out, -hx - 0.2, hx + 0.2, -hz - 0.2, hz + 0.2, E + 0.55, E + 1.2, stone)     // the parapet
  block(out, -hx - 0.3, hx + 0.3, -hz - 0.3, hz + 0.3, E - 1.4, E - 1.0, shade(stone, 0.92))   // the frieze's lower band

  // ---- the roof: low hipped zinc sides, the long flat top glass
  const ry = E + 1.2
  const rise = 2.2
  const ri = Math.min(3.2, hz - 1.5)
  roof(out, -hx + 0.3, hx - 0.3, -hz + 0.3, hz - 0.3, ry, rise, ri, ri, zinc)
  const top = ry + rise + 0.04
  const gx = -hx + 0.3 + ri + (2 * (hx - 0.3 - ri)) * o.glassFrom
  // the glass, west of gx; east of it zinc with skylight strips
  out.quad([[-hx + 0.3 + ri, top, -hz + 0.3 + ri], [gx, top, -hz + 0.3 + ri], [gx, top, hz - 0.3 - ri], [-hx + 0.3 + ri, top, hz - 0.3 - ri]],
    [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], roofGlass, FIXED)
  for (let x = gx + 3; x < hx - ri - 2; x += 6) block(out, x - 1.6, x + 1.6, -hz + ri + 1.2, hz - ri - 1.2, top - 0.04, top + 0.35, roofGlass)
  // the glazing bars over the glass
  for (let x = -hx + 0.3 + ri + 2.5; x < gx; x += 2.5) block(out, x - 0.06, x + 0.06, -hz + 0.3 + ri, hz - 0.3 - ri, top, top + 0.08, shade(zinc, 0.8))

  // ---- the long fronts: pilasters at every bay, glazed to the south, blind to the north
  const bay = (2 * hx) / o.bays
  const front = (face: 'south' | 'north'): MeshBuilder => {
    const q = new MeshBuilder()
    const z = -hz
    for (let i = 0; i <= o.bays; i++) {
      const x = -hx + i * bay
      const w = i === 0 || i === o.bays ? 1.2 : Math.min(1.0, bay * 0.18)
      block(q, x - w / 2, x + w / 2, z - 0.35, z, plinth, E - 1.4, stone)
      block(q, x - w / 2 - 0.12, x + w / 2 + 0.12, z - 0.45, z, E - 2.0, E - 1.4, deep)     // the capital
    }
    for (let i = 0; i < o.bays; i++) {
      const x = -hx + (i + 0.5) * bay
      const w = bay - Math.min(1.0, bay * 0.18) - 0.8
      if (face === 'south' && o.south === 'lights') {
        // a tall glazed bay, nearly the height of the wall: mullions and a transom over it
        pane(q, '-z', z, x, plinth + 0.5, w, E - plinth - 2.6, glass)
        for (const f of [-1 / 6, 1 / 6]) pane(q, '-z', z, x + f * w * 1.5, plinth + 0.5, 0.18, E - plinth - 2.6, stone, 0.08)
        pane(q, '-z', z, x, E - 3.6, w, 0.18, stone, 0.08)
        pane(q, '-z', z, x, plinth + 0.35, w + 0.4, 0.2, deep, 0.1)                          // the sill
      } else {
        // a round-arched bay: glazed to the garden, a blind recess to the street
        archedPane(q, z, x, plinth + 0.6, w, E - plinth - 2.9, face === 'south' ? glass : shade(stone, 0.8))
        if (face === 'south') pane(q, '-z', z, x, plinth + 0.45, w + 0.3, 0.18, deep, 0.1)
      }
    }
    return q
  }
  // (the north front is the same drawing turned half round)
  rotated(out, front('south'), 0)
  rotated(out, front('north'), Math.PI)

  // ---- the ends: a door under a triangular pediment carried on two columns (the west to the Concorde)
  const end = new MeshBuilder()
  {
    const z = -hx
    const cz = Math.min(3.3, hz * 0.45)
    // a frontispiece a little proud of the wall, the pediment over it
    block(end, -cz - 1.6, cz + 1.6, z - 0.4, z, plinth, E - 1.4, stone)
    archedPane(end, z - 0.4, 0, plinth, Math.min(3.2, cz * 1.1), Math.min(6.2, E - plinth - 2.4), door)
    for (const s of [-1, 1]) {
      box(end, s * cz, plinth + 0.5, z - 1.0, 0.75, 0.5, 0.75, deep, FIXED)                      // the pedestal
      column(end, s * cz, z - 1.0, plinth + 1.0, E - 1.4, 0.48, stone)
    }
    block(end, -cz - 1.9, cz + 1.9, z - 1.7, z, E - 1.4, E + 0.55, deep)                         // the entablature
    pediment(end, -cz - 2.1, cz + 2.1, z - 1.75, E + 0.55, 2.6, 1.8, stone)
    // the cornucopias in the tympanum, as a relief
    box(end, 0, E + 1.4, z - 1.8, 1.6, 0.45, 0.06, deep, FIXED)
    // the steps up to the door
    for (let i = 0; i < 3; i++) block(end, -cz - 1.2 + i * 0.25, cz + 1.2 - i * 0.25, z - 3.2 + i * 0.5, z - 1.7, 0, 0.3 + i * 0.3, plinthC)
  }
  rotated(out, end, Math.PI / 2)
  rotated(out, end, -Math.PI / 2)

  // ---- the three Rodin bronzes along the Orangerie's north side (Ève, Méditation, L'Ombre), and Kirili's white column
  if (o.bronzes) {
    for (const x of [-hx * 0.6, -hx * 0.35, -hx * 0.1]) {
      block(out, x - 0.6, x + 0.6, hz + 2.4, hz + 3.6, 0, 1.4, shade(stone, 0.9))
      prism(out, x, hz + 3.0, 1.4, 3.2, 0.32, 8, bronze, FIXED, 0.22)
      box(out, x, 3.4, hz + 3.0, 0.16, 0.2, 0.16, bronze, FIXED)
    }
    prism(out, hx * 0.3, hz + 3.0, 0, 3.2, 0.5, 6, hex('#f2f0ea'), FIXED, 0.35)
  }
}

/** The Musée de l'Orangerie (way 54188996): ten bays of glass to the Seine, the Nymphéas under the glass roof's west half. */
export function orangerie(out: MeshBuilder, fit: Fit): void {
  tuileriesPavilion(out, fit, { bays: 10, eaves: 10, south: 'lights', glassFrom: 0.6, bronzes: true }, 40, 54, 6, 9)
}

/** The Jeu de Paume (way 54188994): eighteen round-arched bays a side, the end porches copied from the Orangerie. */
export function jeuDePaume(out: MeshBuilder, fit: Fit): void {
  tuileriesPavilion(out, fit, { bays: 18, eaves: 9.5, south: 'arches', glassFrom: 1 }, 34, 44, 5.5, 8)
}
