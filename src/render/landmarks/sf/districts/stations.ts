/**
 * stations: from the queue's manual tier — the two big Market Street / Union Square subway head houses.
 *
 * NOTE on the footprints. The batch list gives way/184956226 and way/160331904, but both are the UNDERGROUND
 * station boxes (`location=underground`, `layer=-1`, three hundred metres long); tools/bake.ts drops them, and
 * nothing may be raised from those rings. Both entries here are therefore STANDALONE (lat/lon + size + a
 * numeric `front`), placed on the real `railway=subway_entrance` nodes in the Overpass cache:
 * node/5318198803 "Market Street & Ellis Street" (A2) and node/10185148562 "Geary/Stockton Street".
 *
 * Local frame, as everywhere: the FRONT FACES +z. The stair descends away from the street, toward −z, so the
 * head of the escalator and the pylon are at +z, the same way round as `bartEntrance()` in render/sf/furniture.ts
 * — which is the generic small sloping-roofed entrance. These two are the named structures, and neither is that
 * shape: Powell's is a flat floating plane on four slim columns over frameless glass screens, and Union Square's
 * is a granite-clad pavilion with a dark perforated awning and a roof terrace behind art glass.
 */
import { capPolygon, type MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { box, strut, prism, disc, FIXED, EMIT, type Rgb } from '../../../models.ts'
import { signText } from '../../parts.ts'
import { surfaceTag } from '../../../cartoon-material.ts'

const GRANITE: Rgb = [0.45, 0.44, 0.43]
const PAVER: Rgb = [0.55, 0.32, 0.26]          // Market Street's red brick paving
const STEEL: Rgb = [0.71, 0.70, 0.66]          // the champagne stainless of the canopy and the pylon
const DARK: Rgb = [0.27, 0.28, 0.29]
const TREAD: Rgb = [0.5, 0.51, 0.52]
const GLASS: Rgb = [0.74, 0.82, 0.84]
const ARTGLASS: Rgb = [0.9, 0.94, 0.95]       // Hughen/Starkweather's "Convergence" — pale, patterned, tinted
const VOID: Rgb = [0.05, 0.05, 0.06]
const LIT: Rgb = [0.95, 0.93, 0.87]
const BART_BLUE: Rgb = [0.1, 0.32, 0.62]
const MUNI_RED: Rgb = [0.84, 0.2, 0.14]
const granite = surfaceTag('granite')
const metal = surfaceTag('metal')
const glass = surfaceTag('glass')
const concrete = surfaceTag('concrete')

/**
 * The escalator well shared by both: the dark hole at grade, the treads raking down toward −z, the stainless
 * balustrades either side of them, and the granite cheeks around three sides. `hw` is half the opening's width,
 * `z0` the head (at the street) and `z1` the far end.
 */
function stairWell(out: MeshBuilder, cx: number, hw: number, z0: number, z1: number, cheeks = true): void {
  const cz = (z0 + z1) / 2
  const hz = (z0 - z1) / 2
  box(out, cx, 0.05, cz, hw, 0.01, hz, VOID, FIXED)
  for (let k = 0; k < 20; k++) {
    const z = z0 - 0.5 - k * 0.58
    const y = 0.08 - k * 0.2
    if (z < z1 || y < -3.4) break
    box(out, cx, y, z, hw - 0.12, 0.02, 0.16, TREAD, FIXED)
  }
  // the balustrades, raked with the escalator
  for (const s of [-1, 1]) {
    strut(out, [cx + s * (hw - 0.08), 0.85, z0 - 0.3], [cx + s * (hw - 0.08), -2.6, z1 + 0.3], 0.1, 0.44, STEEL, metal)
  }
  if (!cheeks) return
  for (const s of [-1, 1]) box(out, cx + s * (hw + 0.22), 0.5, cz, 0.22, 0.5, hz + 0.22, GRANITE, granite)
  box(out, cx, 0.5, z1 - 0.22, hw + 0.44, 0.5, 0.22, GRANITE, granite)
}

/** The BART/Muni pylon: the champagne slab post with the blue "ba" panel, the red Muni band and the name down it. */
function pylon(out: MeshBuilder, cx: number, cz: number, name: string): void {
  box(out, cx, 2.15, cz, 0.45, 2.15, 0.26, STEEL, metal)
  box(out, cx, 3.6, cz + 0.27, 0.3, 0.34, 0.02, BART_BLUE, EMIT)
  box(out, cx, 3.12, cz + 0.27, 0.3, 0.12, 0.02, MUNI_RED, EMIT)
  signText(out, name, cx, 1.45, cz + 0.28, 0.17, DARK)
  // the two little lamp rings near the top
  for (const s of [-1, 1]) box(out, cx + s * 0.47, 3.85, cz, 0.04, 0.12, 0.12, STEEL, metal)
}

export const STATIONS: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /**
   * Powell Street Station, the Market & Ellis entrance (Perkins Eastman, the first of BART/SFMTA's Market Street
   * canopies, 2018): a big FLAT champagne plane floating at five metres, cantilevered far past four slim round
   * columns, with a lit soffit; frameless glass screens round the escalator well under it, granite cheeks, red
   * brick paving and the "POWELL STREET" pylon out at the kerb. Ref: Commons "New canopy at Powell Street
   * station, March 2019" (the fetched street views are of the neighbours, the OSM way being the underground box).
   */
  powellStreetCanopy(out: MeshBuilder): void {
    // the brick apron
    capPolygon(out, [{ x: -7.4, z: -7.2 }, { x: 7.4, z: -7.2 }, { x: 7.4, z: 5.6 }, { x: -7.4, z: 5.6 }], 0.02, PAVER, surfaceTag('tile'))
    stairWell(out, 0, 2.1, 4.2, -6.2)
    // the frameless glass screens: both long sides and the far end, the head left open to the street
    for (const s of [-1, 1]) {
      box(out, s * 2.35, 1.75, -1.0, 0.03, 1.25, 5.2, GLASS, glass)
      for (const z of [3.8, 0.6, -2.6, -5.8]) box(out, s * 2.35, 1.75, z, 0.05, 1.3, 0.05, STEEL, metal)
    }
    box(out, 0, 1.75, -6.22, 2.5, 1.25, 0.03, GLASS, glass)
    // the four columns, well inboard of the plane's edge
    for (const sx of [-1, 1]) for (const sz of [1, -1]) prism(out, sx * 3.2, sz === 1 ? 1.9 : -3.9, 0, 4.78, 0.19, 8, STEEL, metal)
    // the plane itself: pale soffit, a darker fascia band round its edge, and the lit underside
    box(out, 0, 4.95, -1.0, 5.6, 0.15, 5.5, [0.88, 0.86, 0.81], metal)
    box(out, 0, 4.95, -1.0, 5.66, 0.07, 5.56, DARK, metal)
    box(out, 0, 4.79, -1.0, 5.3, 0.02, 5.2, LIT, EMIT)
    // the real-time arrivals display hung under the plane at the head
    box(out, 0, 4.3, 3.9, 0.7, 0.25, 0.05, [0.08, 0.09, 0.11], EMIT)
    pylon(out, -4.7, 3.6, 'POWELL')
  },

  /**
   * Union Square/Market Street Station, the north head house on Union Square (Robin Chiang & Co. for the Central
   * Subway, opened 2022): NOT a glass pavilion — a granite-panelled pavilion with a wide recessed mouth, a dark
   * perforated-metal awning cantilevered over it, the glass lift in its own bay behind Hughen/Starkweather's
   * patterned "Convergence" glass, the Muni worm on the pier, and a roof terrace behind an art-glass parapet.
   * Ref: Commons "North headhouse of Union Square Market Street station, November 2022".
   */
  unionSquareHeadhouse(out: MeshBuilder): void {
    const STONE: Rgb = [0.76, 0.68, 0.64]       // the warm pink-grey granite panelling
    capPolygon(out, [{ x: -8.5, z: -4.6 }, { x: 8.5, z: -4.6 }, { x: 8.5, z: 7.5 }, { x: -8.5, z: 7.5 }], 0.02, [0.62, 0.61, 0.59], concrete)
    // the walls: the left pier, the rear wall, the lift bay's two piers, all 4.2 m to the roof slab
    box(out, -5.5, 2.1, 0, 1.0, 2.1, 3.5, STONE, granite)
    box(out, -0.45, 2.1, -3.15, 4.05, 2.1, 0.35, STONE, granite)
    box(out, 3.1, 2.1, 0, 0.5, 2.1, 3.5, STONE, granite)
    box(out, 6.0, 2.1, 0, 0.5, 2.1, 3.5, STONE, granite)
    box(out, 4.55, 2.1, -1.7, 0.95, 2.1, 1.8, STONE, granite)
    // the lift bay: art glass to the front and the return, with a granite head over it
    box(out, 4.55, 1.75, 3.4, 0.95, 1.75, 0.06, ARTGLASS, glass)
    box(out, 4.55, 3.75, 3.4, 0.95, 0.45, 0.08, STONE, granite)
    box(out, 5.52, 1.75, 2.2, 0.04, 1.75, 1.2, ARTGLASS, glass)
    box(out, 4.55, 0.06, 2.6, 0.9, 0.06, 0.8, [0.3, 0.31, 0.32], metal)   // the lift's own threshold
    // the mouth: the lit ceiling and the pale interior walls behind the awning
    box(out, -0.95, 4.05, 0.6, 3.55, 0.06, 2.8, LIT, EMIT)
    box(out, -0.95, 2.0, -2.7, 3.55, 2.0, 0.08, [0.86, 0.85, 0.82], concrete)
    for (const x of [-4.48, 2.58]) box(out, x, 2.0, 0.6, 0.04, 2.0, 2.8, [0.86, 0.85, 0.82], concrete)
    stairWell(out, -1.6, 1.4, 1.4, -2.7, false)
    // the glazed door beside the escalator, at the lift end of the mouth
    box(out, 1.9, 1.2, 1.4, 0.65, 1.2, 0.05, GLASS, glass)
    // the roof slab and, on it, the terrace's art-glass parapet with granite corner caps
    box(out, -0.25, 4.4, 0, 6.75, 0.2, 3.5, STONE, granite)
    box(out, -0.25, 5.05, 3.42, 6.75, 0.45, 0.05, ARTGLASS, glass)
    box(out, -0.25, 5.05, -3.42, 6.75, 0.45, 0.05, ARTGLASS, glass)
    for (const x of [-6.92, 6.42]) box(out, x, 5.05, 0, 0.05, 0.45, 3.5, ARTGLASS, glass)
    for (const x of [-6.9, 6.4]) for (const z of [3.4, -3.4]) box(out, x, 4.9, z, 0.3, 0.3, 0.3, STONE, granite)
    box(out, -0.25, 4.62, 0, 6.6, 0.03, 3.4, [0.55, 0.54, 0.52], concrete)   // the terrace's own paving
    // the awning: a dark perforated plane hung out over the mouth on two slim ties, raked a little
    box(out, -0.95, 3.72, 4.2, 3.6, 0.06, 1.3, DARK, metal)
    for (let k = 0; k < 5; k++) box(out, -0.95 + (k - 2) * 1.7, 3.62, 4.2, 0.05, 0.1, 1.3, DARK, metal)
    box(out, -0.95, 3.66, 2.95, 3.6, 0.14, 0.12, DARK, metal)
    for (const s of [-1, 1]) strut(out, [-0.95 + s * 3.5, 4.18, 3.0], [-0.95 + s * 3.5, 3.78, 5.4], 0.06, 0.06, DARK, metal)
    // the Muni worm on the inner pier, and the station name inside over the escalator
    disc(out, 3.1, 3.5, 3.56, 0.32, MUNI_RED, EMIT)
    signText(out, 'UNION SQUARE', -1.4, 3.35, -2.6, 0.16, DARK, { lit: true })
  },
}
