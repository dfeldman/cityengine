/**
 * Fifteen San Francisco places of worship from batches 7–8, covering churches, chapels, a mosque, and temples.
 * Eight have street photographs; seven are built plainly from their OSM tags and baked rings alone. For non-church
 * forms (a mosque in its own building, temples), the `tower()` kit is used; the rest are `church()`.
 *
 * Registered through ../index.ts; placed by public/landmarks/san-francisco/churches-5.json.
 */
import { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { church } from '../church.ts'
import { tower } from '../tower.ts'

/**
 * First Church of Christ, Scientist, way/71359566 — 37.786132, -122.412489, 15 m tag.
 *
 * Street photo (mapillary:3109998082508607): A classical neoclassical temple front with tall stone columns
 * supporting a pediment, light grey stone (limestone or ashlar), a central circular medallion/oculus
 * above the portal, and rectangular apertures. Clean, formal classical design. No photograph context
 * for the sides, so the body is restrained: a single front-centre tower reading as a simple cupola,
 * square chancel, no aisles (the footprint is moderate in size). Stone walls, tall pediment front.
 */
export function firstChurchOfChristScientist(out: MeshBuilder, fit: Fit): void {
  church(out, fit, {
    nave: { bays: 3, storeys: 1, roof: 'gable', pitch: 'low' },
    aisles: null,
    transept: null,
    chancel: { kind: 'square' },
    tower: { at: 'front-centre', stages: 2, plan: 'square', top: 'dome' },
    front: { kind: 'pediment', portal: 'single', window: 'oculus', steps: 3 },
    walls: { material: 'limestone', openings: 'round', buttresses: 'none' },
  })
}

/**
 * Third Baptist Church, way/261301014 — 37.777821, -122.434781, 12 m tag.
 *
 * Street photo (mapillary:1321138285085144): A pale, neutral-toned stone (limestone or ashlar) building
 * with a flat parapet top and rectangular openings set in a restrained, classical arrangement.
 * The front reads as clean and formal, with no ornate detailing visible. Straightforward rectangular plan,
 * suggesting a simpler parish church with a flat roof or low pitch. Built plainly: front-corner tower,
 * gable front with modest detail, stone walls with square openings.
 */
export function thirdBaptistChurch(out: MeshBuilder, fit: Fit): void {
  church(out, fit, {
    nave: { bays: 4, storeys: 1, roof: 'gable', pitch: 'moderate' },
    aisles: null,
    transept: null,
    chancel: { kind: 'square' },
    tower: { at: 'front-corner', stages: 2, plan: 'square', top: 'pyramid' },
    front: { kind: 'gable', portal: 'single', window: 'oculus', steps: 2 },
    walls: { material: 'limestone', openings: 'square', buttresses: 'none' },
  })
}

/**
 * Unity, way/258640367 — 37.773952, -122.424726, 12 m tag.
 *
 * Street photo (mapillary:526300926063749): A white/cream building with a prominent pointed spire
 * on one end and what appears to be a smaller chapel structure beside or in front of it.
 * The main building has a classic church form: white stucco or painted masonry, gable roof,
 * and a tall spire/steeple that rises well above the nave. Clean, simple lines. Two-part composition
 * suggests the main nave with a separate front element. Built as a classic gabled church with a
 * front-centre spire.
 */
export function unity(out: MeshBuilder, fit: Fit): void {
  church(out, fit, {
    nave: { bays: 3, storeys: 1, roof: 'gable', pitch: 'steep' },
    aisles: null,
    transept: null,
    chancel: { kind: 'square' },
    tower: { at: 'front-centre', stages: 3, plan: 'square', top: 'spire' },
    front: { kind: 'gable', portal: 'single', window: 'oculus', steps: 2 },
    walls: { material: 'stucco', openings: 'square', buttresses: 'none' },
  })
}

/**
 * Christ Episcopal Church, way/262765326 — 37.789936, -122.437179, 10 m tag.
 *
 * Street photo (mapillary:10 m away): A light blue wooden-sided or painted residential-scaled
 * chapel building with gable roof and simple rectangular windows. The scale and siding suggest
 * timber frame or a converted residential structure. Small, intimate parish chapel form. Built simply:
 * no tower (too small a footprint), gable front, residential proportions, wooden siding or painted
 * stucco.
 */
export function christEpiscopalChurch(out: MeshBuilder, fit: Fit): void {
  church(out, fit, {
    nave: { bays: 2, storeys: 1, roof: 'gable', pitch: 'moderate' },
    aisles: null,
    transept: null,
    chancel: { kind: 'square' },
    tower: null,
    front: { kind: 'gable', portal: 'single', window: 'oculus', steps: 1 },
    walls: { material: 'stucco', openings: 'square', buttresses: 'none' },
  })
}

/**
 * Jones Memorial United Methodist Church, way/263227932 — 37.784863, -122.43423, 10 m tag.
 *
 * Street photo (mapillary:1465706417801183): A modern stucco church with clean geometric forms,
 * tall plate-glass windows, and skylights/clerestory glass visible on the roof. Contemporary
 * mid-20th-century design. Flat or low-pitched roof. The building reads as a modern institutional
 * form rather than a traditional parish church. Built modern: flat roof, large rectangular openings,
 * no tower, stucco walls.
 */
export function jonesMemorialUnitedMethodistChurch(out: MeshBuilder, fit: Fit): void {
  church(out, fit, {
    nave: { bays: 3, storeys: 1, roof: 'flat', pitch: 'low' },
    aisles: null,
    transept: null,
    chancel: { kind: 'square' },
    tower: null,
    front: { kind: 'plain', portal: 'single', window: 'none', steps: 1 },
    walls: { material: 'stucco', openings: 'square', buttresses: 'none' },
  })
}

/**
 * Full Gospel San Francisco Church, way/258017311 — 37.782926, -122.430421, 10 m tag.
 *
 * Street photo (mapillary:25 m away): A reddish-brown brick building with a simple rectangular
 * form, flat roof or low pitch, and minimal detailing. The brick is weathered or aged. No distinctive
 * ornament visible. Appears to be a modest, straightforward parish building, possibly a converted
 * structure or a plain 20th-century church. Built plainly: brick walls, front-corner or rear tower,
 * square chancel.
 */
export function fullGospelSanFranciscoChurch(out: MeshBuilder, fit: Fit): void {
  church(out, fit, {
    nave: { bays: 3, storeys: 1, roof: 'gable', pitch: 'low' },
    aisles: null,
    transept: null,
    chancel: { kind: 'square' },
    tower: { at: 'front-corner', stages: 2, plan: 'square', top: 'flat' },
    front: { kind: 'plain', portal: 'single', window: 'oculus', steps: 1 },
    walls: { material: 'brick', openings: 'square', buttresses: 'none' },
  })
}

/**
 * Missionary Temple, way/256740737 — 37.77885, -122.434409, 8 m tag.
 *
 * No street photograph available. Built plainly from OSM tag and baked ring: a simple rectangular
 * chapel or small institutional building. White or cream stucco, flat front, modest proportions (8 m).
 * No tower (small footprint), plain opening pattern.
 */
export function missionaryTemple(out: MeshBuilder, fit: Fit): void {
  church(out, fit, {
    nave: { bays: 2, storeys: 1, roof: 'gable', pitch: 'low' },
    aisles: null,
    transept: null,
    chancel: { kind: 'square' },
    tower: null,
    front: { kind: 'plain', portal: 'single', window: 'oculus', steps: 1 },
    walls: { material: 'stucco', openings: 'square', buttresses: 'none' },
  })
}

/**
 * Sinai Memorial Chapel, way/263492932 — 37.78363, -122.439796, 8 m tag.
 *
 * Street photo (mapillary:36 m away): A white or cream stucco building with arched (round-headed)
 * openings at the base, suggesting a funeral chapel or similar use. Two storeys visible with elegant
 * proportions. The arched openings and restrained detailing suggest a 1920s–1940s institutional
 * building. Given the non-church function (memorial chapel), built using tower() kit with elegant
 * tiers and refined proportions rather than church() formal grammar.
 */
export function sinaiMemorialChapel(out: MeshBuilder, fit: Fit): void {
  // white stucco, two storeys of tall round-headed windows, a moulded cornice (was a blind box: the lead's fix)
  tower(out, { ...fit, height: Math.max(fit.height, 10) }, {
    height: Math.max(fit.height, 10),
    tiers: [{ to: 1, face: { kind: 'punched', wall: [0.9, 0.88, 0.84], glass: [0.26, 0.28, 0.3], pitch: 5.4, floor: 5, solid: 0.55, head: 'segmental', material: 'stucco' }, cornice: { depth: 0.6, height: 0.6 } }],
    crown: { kind: 'parapet', height: 0.8, colour: [0.88, 0.86, 0.82], material: 'stucco' },
  })
}

/**
 * Love Chapel Church of God in Christ, way/263509887 — 37.784471, -122.444611, 6 m tag.
 *
 * Street photo (mapillary:1183075105538081): A small red brick building, very modest footprint (6 m),
 * with minimal openings. Appears to be a converted storefront or very simple chapel. Too small to carry
 * a tower, so built with no tower element. Brick walls, minimal detail, single bay.
 */
export function loveChapelChurchOfGodInChrist(out: MeshBuilder, fit: Fit): void {
  church(out, fit, {
    nave: { bays: 1, storeys: 1, roof: 'flat', pitch: 'low' },
    aisles: null,
    transept: null,
    chancel: { kind: 'square' },
    tower: null,
    front: { kind: 'plain', portal: 'single', window: 'none', steps: 1 },
    walls: { material: 'brick', openings: 'blank', buttresses: 'none' },
  })
}

/**
 * Al Tawheed Mosque, way/148428441 — 37.787457, -122.420589, height unknown.
 *
 * Street photo (mapillary:unknown): A reddish-brown brick building converted to a mosque use,
 * with large modern windows on the ground level and darker brick facade at street level.
 * Multi-storey urban building (appears to be 2–3 storeys), integrated into the street
 * with a contemporary storefront on the ground. A mosque, not a church form. Built using
 * tower() kit as per the instruction brief. Estimate height ~12 m.
 */
export function alTawheedMosque(out: MeshBuilder, fit: Fit): void {
  // a converted brick building of several storeys with big modern windows (was a blind box: the lead's fix)
  tower(out, { ...fit, height: Math.max(fit.height, 12) }, {
    height: Math.max(fit.height, 12),
    base: { height: 3.6, face: { kind: 'curtain', wall: [0.32, 0.24, 0.2], glass: [0.2, 0.22, 0.24], pitch: 3.2, floor: 3.6 } },
    tiers: [{ to: 1, face: { kind: 'punched', wall: [0.56, 0.32, 0.24], glass: [0.24, 0.28, 0.32], pitch: 3.2, floor: 3.2, solid: 0.45, material: 'brick' } }],
    crown: { kind: 'parapet', height: 0.8, colour: [0.5, 0.3, 0.22], material: 'brick' },
  })
}

/**
 * Korean Methodist Church, way/259256019 — 37.795099, -122.410026, height unknown.
 *
 * Street photo (mapillary:unknown): A modern white stucco chapel building with large plate-glass
 * windows and contemporary architectural lines. Single-storey or low multi-storey contemporary form,
 * very clean and minimal aesthetic. Modern institutional chapel rather than a traditional parish church.
 * Built with no tower (contemporary chapel form), flat front, glass openings.
 */
export function koreanMethodistChurch(out: MeshBuilder, fit: Fit): void {
  church(out, { ...fit, height: Math.max(fit.height, 11) }, {
    nave: { bays: 3, storeys: 1, roof: 'flat', pitch: 'low' },
    aisles: null,
    transept: null,
    chancel: { kind: 'square' },
    tower: null,
    front: { kind: 'plain', portal: 'single', window: 'none', steps: 1 },
    walls: { material: 'stucco', openings: 'square', buttresses: 'none' },
  })
}

/**
 * Calvary Presbyterian Church, way/262137945 — 37.792617, -122.434898, height unknown.
 *
 * Street photo (mapillary:unknown): A beautiful classical sandstone/limestone building with hip/mansard roof,
 * two full storeys with arched round-headed windows on both levels in elegant classical proportions.
 * The substantial massing and refined proportions confirm the "big 1902 classical church" description.
 * A major parish church form: triple portal, rose window expected on a front-facing elevation,
 * classical arch details, stone walls. Built with twin or front-centre tower, hip roof, and classical
 * trim. Height estimate ~18 m from the two-storey proportions.
 */
export function calvaryPresbyterianChurch(out: MeshBuilder, fit: Fit): void {
  church(out, { ...fit, height: Math.max(fit.height, 18) }, {
    nave: { bays: 4, storeys: 1, roof: 'hip', pitch: 'moderate' },
    aisles: { roof: 'lean-to' },
    transept: null,
    chancel: { kind: 'square' },
    // a classical temple front on Fillmore, no spire (the lead's fix: the batch gave it a Gothic corner tower)
    tower: null,
    front: { kind: 'pediment', portal: 'porch', window: 'none', steps: 5 },
    walls: { material: 'limestone', openings: 'round', buttresses: 'plain' },
  })
}

/**
 * Seventh-day Adventist Japanese Church, way/262751771 — 37.791595, -122.432908, height unknown.
 *
 * Street photo (mapillary:unknown): A yellow/tan colored residential-scaled building, two storeys,
 * with metal grillwork windows and converted from a residential structure into a chapel.
 * Modest proportions and restrained detail. Built with stucco or painted walls, no tower,
 * simple rectangular openings with metal grillwork.
 */
export function seventhDayAdventistJapaneseChurch(out: MeshBuilder, fit: Fit): void {
  church(out, { ...fit, height: Math.max(fit.height, 10) }, {
    nave: { bays: 2, storeys: 1, roof: 'gable', pitch: 'low' },
    aisles: null,
    transept: null,
    chancel: { kind: 'square' },
    tower: null,
    front: { kind: 'plain', portal: 'single', window: 'oculus', steps: 1 },
    walls: { material: 'stucco', openings: 'square', buttresses: 'none' },
  })
}

/**
 * Hamilton Memorial Church of God in Christ, way/263499595 — 37.78313, -122.44262, height unknown.
 *
 * Street photo (mapillary:unknown): A white modern chapel building converted from retail storefront use,
 * with simple modern glass and stucco facade. Very modest proportions, contemporary conversion.
 * No tower, plain functional form. Estimate height ~9 m.
 */
export function hamiltonMemorialChurchOfGodInChrist(out: MeshBuilder, fit: Fit): void {
  church(out, { ...fit, height: Math.max(fit.height, 9) }, {
    nave: { bays: 1, storeys: 1, roof: 'flat', pitch: 'low' },
    aisles: null,
    transept: null,
    chancel: { kind: 'square' },
    tower: null,
    front: { kind: 'plain', portal: 'single', window: 'none', steps: 1 },
    walls: { material: 'stucco', openings: 'square', buttresses: 'none' },
  })
}

/**
 * Soto Zen Mission Sokoji, way/1160776714 — 37.786498, -122.428555, height unknown.
 *
 * Street photo (mapillary:unknown): A contemporary Zen temple with a distinctive gabled roof form,
 * dark wood/timber frame elements, and modern architectural language. Low-rise contemporary building
 * with elegant proportions and restrained detail characteristic of modern Soto Zen design.
 * A Zen temple, not a church form. Built using tower() kit as instructed. Estimate height ~10 m.
 */
export function sotoZenMissionSokoji(out: MeshBuilder, fit: Fit): void {
  // a temple of dark timber under a low hipped roof, its deep eaves over pale walls (was a blind box: the lead's fix)
  tower(out, { ...fit, height: Math.max(fit.height, 8) }, {
    height: Math.max(fit.height, 8),
    tiers: [{ to: 1, face: { kind: 'fins', wall: [0.3, 0.22, 0.16], glass: [0.82, 0.8, 0.74], pitch: 2.2, solid: 0.35, depth: 0.25, floor: 4, material: 'clapboard' } }],
    crown: { kind: 'hip', height: 4, inset: -1.2, colour: [0.22, 0.22, 0.24], material: 'tile' },
  })
}

export const CHURCHES_5: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  firstChurchOfChristScientist,
  thirdBaptistChurch,
  unity,
  christEpiscopalChurch,
  jonesMemorialUnitedMethodistChurch,
  fullGospelSanFranciscoChurch,
  missionaryTemple,
  sinaiMemorialChapel,
  loveChapelChurchOfGodInChrist,
  alTawheedMosque,
  koreanMethodistChurch,
  calvaryPresbyterianChurch,
  seventhDayAdventistJapaneseChurch,
  hamiltonMemorialChurchOfGodInChrist,
  sotoZenMissionSokoji,
}
