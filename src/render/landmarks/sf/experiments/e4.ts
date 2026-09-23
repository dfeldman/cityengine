import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { tower } from '../../tower.ts'
import { fromRecipe } from '../recipes.ts'

export const EXP_4: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** 300 Montgomery Street (way/944039725): pre-war stone office block, colonnaded base with round
   *  columns at the corner, punched masonry shaft, heavy cornice, flat parapet. Photos 02/03. */
  e4_montgomery_300: fromRecipe('chicago-block', {
    height: 58,
    wall: [0.80, 0.77, 0.70],
    material: 'granite',
    pitch: 3.2,
    floor: 3.9,
    base: 6,
    baseWall: [0.72, 0.69, 0.62],
    crown: { kind: 'parapet', height: 1.2, colour: [0.76, 0.73, 0.66] },
  }),

  /** 550 California Street (way/243794014): tan/beige ashlar tower, arched storefront entries at
   *  street level, plain punched windows above, flat parapet top. Photos 03/05 (01/02 are the
   *  neighbouring round-cornered curtain tower — junk for this building). */
  e4_california_550: fromRecipe('granite-eighties', {
    height: 55,
    wall: [0.82, 0.77, 0.68],
    material: 'ashlar',
    pitch: 3.4,
    floor: 3.8,
    base: 5.5,
    baseWall: [0.78, 0.73, 0.63],
    crown: { kind: 'parapet', height: 1.0, colour: [0.78, 0.74, 0.65] },
  }),

  /** way/256067734 (no address): dark modern curtain tower, vertical black metal fin mullions over
   *  tinted bronze/dark glass, Chase bank at ground floor. Photos 01/03 both clear; 02 shows it
   *  reflected/adjacent to the older stone building next door. */
  e4_darkFinTower_256067734: fromRecipe('glass-tower', {
    height: 48,
    glass: [0.07, 0.08, 0.10],
    wall: [0.05, 0.05, 0.06],
    material: 'metal',
    pitch: 2.6,
    floor: 3.9,
    crown: { kind: 'flat' },
  }),

  /** Institute of Contemporary Art SF, 345 Montgomery Street (way/288511103): a low, squat glass
   *  pavilion — dark bronze/brown stone piers (one an angled corner blade) framing a fully-glazed,
   *  recessed curtain wall, tucked beneath much taller stone neighbours. Photos 01 and 03 both show
   *  it clearly and agree; 02 is a different building (Monte's Bar, terracotta arches) — junk.
   *  Hand-built rather than from a recipe: no recipe matches a squat all-glass low-rise pavilion. */
  e4_ica_345Montgomery: (out, fit) => {
    tower(out, fit, {
      height: 22,
      base: { height: 4.5, face: { kind: 'blank', wall: [0.30, 0.22, 0.17], material: 'metal' } },
      tiers: [{ to: 1, face: { kind: 'curtain', wall: [0.28, 0.20, 0.16], glass: [0.10, 0.11, 0.12],
                                pitch: 3.6, solid: 0.18, floor: 4.4, material: 'metal' } }],
      crown: { kind: 'flat' },
    })
  },

  /** Alvinza Hayward Building, 400 Montgomery Street (way/690663633): narrow dark-grey stone office
   *  tower, punched windows, ornate bracketed cornice and parapet at the crown. Photo 02 is the clear
   *  reference (the building's own upper storeys and cornice against the sky); 01 and 03 show it
   *  partly occluded by street furniture and neighbours but agree on colour and rhythm. */
  e4_alvinzaHayward_400Montgomery: fromRecipe('edwardian-terracotta', {
    height: 36,
    wall: [0.42, 0.40, 0.38],
    material: 'granite',
    pitch: 3.0,
    floor: 3.7,
    crown: { kind: 'parapet', height: 1.4, colour: [0.38, 0.36, 0.34] },
  }),
}
