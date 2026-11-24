import type { MeshBuilder } from '../../../../buildings.ts'
import { box, prism, strut, type Rgb } from '../../../../models.ts'
import { block, hex, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'

/*
 * LA DÉFENSE, figurative works of the east dalle (group figurative-east): fourteen works, each a procedural base or
 * basin under a STAND-IN of the sculpture. Forms corrected 2026-11-24 against Paris La Défense's own photographs
 * (parisladefense.com/en/district/artworks/<slug>, viewed for reference, not licensed for reuse); sizes are read off
 * those photos against people and façades. Sizes are the TUNABLE constants below. The Modly figures are queued in scratchpad monu/defense/guided-queue.md (all waiting for a photo); when one
 * is published, add its paris-statues.json attach and set its STAND_IN false.
 *
 * Every piece stands on the dalle, above the model's base (the base is the lowest ground under the footprint, i.e. the
 * street under the slab): the drawing is lifted by the highest ground sampled round the origin, as figurativeWest.ts does.
 */
export const STAND_IN: Record<string, boolean> = {
  toscano: true, hercules: true, dameLune: true, terre: true, ophelie: true, somnambule: true, hommes: true, lieux: true,
  danse: true, dialogue: true, grenouille: true,
}
const FIXED = 0
const PLINTH_STONE: Rgb = hex('#a9a69d')
const WATER: Rgb = hex('#6f93a8')
const GRANITE_G: Rgb = hex('#8d8d8a')
const BLACKBRONZE: Rgb = hex('#1f1d1c')
const VERDIGRIS: Rgb = hex('#4f6f5c')

const SAMPLE_R = 2.5
function dalle(fit: Fit): number {
  const g = fit.groundAt
  if (!g) return fit.grade ?? 0
  let m = fit.grade ?? 0
  for (const [x, z] of [[0, 0], [SAMPLE_R, 0], [-SAMPLE_R, 0], [0, SAMPLE_R], [0, -SAMPLE_R]]) {
    const v = g(x, z)
    if (Number.isFinite(v)) m = Math.max(m, v)
  }
  return m
}
function lifted(out: MeshBuilder, dy: number, draw: () => void): void {
  const from = out.positions.length
  draw()
  for (let i = from; i < out.positions.length; i += 3) out.positions[i + 1] += dy
}
/** a body of revolution: profile [height above y0, radius] pairs */
function lathe(out: MeshBuilder, cx: number, cz: number, y0: number, prof: [number, number][], c: Rgb, sides = 14): void {
  for (let i = 0; i + 1 < prof.length; i++) {
    const [h0, r0] = prof[i], [h1, r1] = prof[i + 1]
    prism(out, cx, cz, y0 + h0, y0 + h1, Math.max(0.01, r0), sides, c, FIXED, Math.max(0.01, r1), i === 0 || i + 2 === prof.length)
  }
}
/** a plinth of two stone steps at (cx, cz): half-sizes, height; returns its top */
function plinth(out: MeshBuilder, cx: number, cz: number, hx: number, hz: number, h: number, c: Rgb = PLINTH_STONE): number {
  block(out, cx - hx, cx + hx, cz - hz, cz + hz, 0, h * 0.4, shade(c, 0.9))
  block(out, cx - hx * 0.85, cx + hx * 0.85, cz - hz * 0.85, cz + hz * 0.85, h * 0.4, h, c)
  return h
}
/** deterministic pseudo-random in [0,1) */
function rnd(i: number): number { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s) }
/** a ball of radius r centred (cx, cy, cz) */
function ball(out: MeshBuilder, cx: number, cy: number, cz: number, r: number, col: Rgb, bands = 6, sides = 10): void {
  for (let i = 0; i < bands; i++) {
    const a0 = Math.PI * (i / bands) - Math.PI / 2, a1 = Math.PI * ((i + 1) / bands) - Math.PI / 2
    prism(out, cx, cz, cy + r * Math.sin(a0), cy + r * Math.sin(a1), Math.max(0.001, r * Math.cos(a0)), sides, col, FIXED, Math.max(0.001, r * Math.cos(a1)), i === bands - 1)
  }
}

// --- Mitoraj, Le Grand Toscano (1983, bronze; photos: a giant black-bronze torso, head and arms broken off, truncated at
// the neck with a square patch on the chest, on a granite block among dark stone benches at the Areva tower's foot).
const TOSCANO_H = 3.7
function toscano(out: MeshBuilder): void {
  const y = plinth(out, 0, 0, 2.0, 1.6, 0.6, GRANITE_G)
  if (!STAND_IN.toscano) return
  const H = TOSCANO_H
  lathe(out, 0, 0, y, [[0, 1.25], [0.15 * H, 1.45], [0.5 * H, 1.55], [0.82 * H, 1.2], [0.93 * H, 0.65], [H, 0.6]], BLACKBRONZE, 14)
  for (const s of [-1, 1]) ball(out, s * 1.15, y + 0.72 * H, 0, 0.62, BLACKBRONZE, 5, 8)   // broken shoulders
  block(out, -0.2, 0.2, 1.38, 1.45, y + 0.5 * H, y + 0.5 * H + 0.4, hex('#3a3835'))      // chest patch
}

// --- Miró, Personnages fantastiques (1976, painted polyester, 12 m up on the Parvis roof; photos): A, a yellow column
// under a big blue round head with a red eye; B, a tall blue tapering body ending in a horn, with a red beaked head
// turned toward A. Bright blue, yellow, red.
const MIRO_H: [number, number] = [8.6, 12], MIRO_GAP = 6
const MIRO_BLUE = hex('#2f4fa8'), MIRO_RED = hex('#d23a2c'), MIRO_YEL = hex('#f2c92c')
function miro(out: MeshBuilder): void {
  const zA = MIRO_GAP / 2, zB = -MIRO_GAP / 2, HA = MIRO_H[0], HB = MIRO_H[1]
  block(out, -1.4, 1.4, zA - 1.4, zA + 1.4, 0, 0.3, hex('#bdb8ae'))
  block(out, -1.6, 1.6, zB - 1.6, zB + 1.6, 0, 0.3, hex('#bdb8ae'))
  // A
  lathe(out, 0, zA, 0.3, [[0, 0.9], [0.5 * HA, 0.75], [HA - 2.6, 0.8]], MIRO_YEL, 12)
  ball(out, 0, HA - 1.45, zA, 1.45, MIRO_BLUE, 8, 14)
  ball(out, 0, HA - 1.3, zA - 1.3, 0.45, MIRO_RED, 4, 8)                                     // red eye toward B
  // B
  lathe(out, 0, zB, 0.3, [[0, 1.9], [0.45 * HB, 1.35], [0.8 * HB, 0.8], [HB - 0.3, 0.12]], MIRO_BLUE, 14)
  ball(out, 0, 0.62 * HB, zB, 0.95, MIRO_RED, 6, 10)                                          // red head
  strut(out, [0, 0.62 * HB, zB + 0.3], [0, 0.66 * HB, zB + 2.4], 1.5, 1.0, MIRO_RED)         // beak toward A
}

// --- Paul Belmondo, stèle en hommage à Emmanuel Pouvreau (2007; photos): a bronze medallion (portrait relief, ~0.8 m)
// laid on a granite block on the Cnit parapet, with a plaque on its side. NOT a tall stele.
const STELE_H = 0.9
function pouvreau(out: MeshBuilder): void {
  block(out, -0.5, 0.5, -0.5, 0.5, 0, STELE_H, hex('#8f8f8c'))
  prism(out, 0, 0, STELE_H, STELE_H + 0.03, 0.4, 16, BLACKBRONZE, FIXED)
  block(out, -0.2, 0.2, 0.5, 0.52, 0.3, 0.6, BLACKBRONZE)
}

// --- Léonardo Delfino, Les Lieux du corps (1980/83, polyester composite and paint; photos): a dark cluster of ~8 organic
// forms (mushroom-capped columns, helmet and robot shapes, couchant creatures) heaped on a long low plinth in a pool.
const LIEUX_H = 3.0
function lieux(out: MeshBuilder): void {
  const y = plinth(out, 0, 0, 2.6, 1.0, 0.4, GRANITE_G)
  if (!STAND_IN.lieux) return
  const FORMS: [number, number, number, number][] = [[-2.0, 0.1, 1.4, 0.35], [-1.1, -0.2, 2.6, 0.38], [-0.2, 0.2, LIEUX_H, 0.34], [0.7, -0.1, 2.3, 0.4], [1.5, 0.2, 1.7, 0.33], [2.1, -0.2, 1.0, 0.5]]
  for (const [x, z, h, r] of FORMS) {
    lathe(out, x, z, y, [[0, r * 1.5], [0.35 * h, r], [0.72 * h, r * 1.1], [0.8 * h, r * 1.7], [0.94 * h, r * 1.9], [h, r * 0.8]], BLACKBRONZE, 10)   // column swelling to a mushroom cap
  }
  lathe(out, -0.6, 0.3, y, [[0, 0.5], [0.4, 0.55], [0.8, 0.35]], BLACKBRONZE, 10)
}

// --- Léo Caillard, Hercules in the Wind (2024, steel and 3D-printed resin, "more than 3 m high, 2 m wide"; photos): a
// bright white bearded bust of the Farnese Hercules, hair and shoulders streaming sideways as if blown, on a white
// pedestal ~1.2 m at the foot of the Latitude tower.
const HERC_H = 2.8
function hercules(out: MeshBuilder): void {
  const y = plinth(out, 0, 0, 0.6, 0.6, 1.2, hex('#e8e6e0'))
  if (!STAND_IN.hercules) return
  const H = HERC_H
  lathe(out, 0, 0, y, [[0, 0.5], [0.08 * H, 0.8], [0.4 * H, 1.0], [0.55 * H, 0.55], [0.6 * H, 0.45], [0.88 * H, 0.45], [H, 0.15]], hex('#f2f0ea'), 14)
  for (const dz of [-0.2, 0.2]) strut(out, [0, y + 0.55 * H, dz], [-1.3, y + 0.5 * H, dz * 3], 0.3, 0.4, hex('#f2f0ea'))   // windblown locks
}

// --- Julio Silva, Dame Lune (1977, one block of Carrara marble, 4.5 m high, 1.2 m wide; photos): a white-grey marble
// column swelling at the foot, curving up in an S and ending in a big round disc (a smiling moon face on one side, a
// hand-like shape on the other), polished pebble surfaces.
const LUNE_H = 4.5
const LUNE_MARBLE = hex('#d6d6d2')
function dameLune(out: MeshBuilder): void {
  const y = plinth(out, 0, 0, 1.2, 1.2, 0.2, GRANITE_G)
  if (!STAND_IN.dameLune) return
  const SEG = 12
  for (let i = 0; i < SEG; i++) {
    const t0 = i / SEG, t1 = (i + 1) / SEG
    const off = (t: number) => Math.sin(t * Math.PI * 1.6) * 0.45 * t
    const r = (t: number) => 0.7 - 0.35 * Math.sin(Math.min(1, t * 1.4) * Math.PI / 2) + (t > 0.9 ? 0 : 0)
    prism(out, off(t0), 0, y + t0 * LUNE_H * 0.82, y + t1 * LUNE_H * 0.82, r(t0), 10, LUNE_MARBLE, FIXED, r(t1), false)
  }
  const ox = Math.sin(1 * Math.PI * 1.6) * 0.45
  box(out, ox, y + LUNE_H * 0.9, 0, 0.18, 0.62 * LUNE_H / 4.5, 0.62, LUNE_MARBLE, FIXED)    // the disc, flat to the x axis
  block(out, ox - 0.18, ox + 0.18, -0.2, 0.2, y + LUNE_H * 0.82 - 0.2, y + LUNE_H * 0.82 + 0.2, LUNE_MARBLE)
}

// --- Louis Derbré, La Terre (1972 / 1978; photos): two verdigris bronze figures curved head to foot into a closed ring
// (a vertical hoop), shown on a terrace against trees. Diameter guessed from the photo (the page gives ~9 m, doubtful).
const TERRE_D = 5.5, TERRE_TUBE = 0.38
function terre(out: MeshBuilder): void {
  const y = plinth(out, 0, 0, 1.0, 1.0, 0.4, GRANITE_G)
  if (!STAND_IN.terre) return
  const R = TERRE_D / 2, cy = y + 0.7 + R, SEG = 24
  for (let i = 0; i < SEG; i++) {
    const a0 = (i / SEG) * Math.PI * 2, a1 = ((i + 1) / SEG) * Math.PI * 2
    const bulge = (a: number) => TERRE_TUBE * (0.8 + 0.5 * Math.abs(Math.sin(a * 2)))
    strut(out, [R * Math.cos(a0), cy + R * Math.sin(a0), 0], [R * Math.cos(a1), cy + R * Math.sin(a1), 0.0], bulge(a0) * 2, bulge(a0) * 2, VERDIGRIS)
  }
  for (const sy of [-1, 1]) ball(out, 0.0, cy + sy * R * 0.55, 0, 0.3, VERDIGRIS, 4, 8)  // joined hands / heads
  block(out, -0.3, 0.3, -0.3, 0.3, y, y + 0.7, GRANITE_G)  // the ring stands on a stub
}

// --- Claude Torricini, La Fontaine à boire / La Grenouille (1987; photos): a big bronze frog (~1.4 m) with a small frog
// in its open mouth that spits the water, on a stepped round stone fountain, ringed by curved granite benches like
// terraces (OSM way 186981691, ~1.2 m footprint, is the frog's base).
function grenouille(out: MeshBuilder): void {
  prism(out, 0, 0, 0, 0.3, 1.25, 16, PLINTH_STONE, FIXED)
  prism(out, 0, 0, 0.3, 0.6, 0.85, 16, PLINTH_STONE, FIXED)
  if (STAND_IN.grenouille) {
    const FROG = hex('#5a4a2a')
    lathe(out, 0, 0, 0.6, [[0, 0.6], [0.35, 0.55], [0.7, 0.4], [1.0, 0.3]], FROG, 10)                // squat body
    ball(out, 0, 1.2, 0.3, 0.38, FROG, 4, 8)                                                           // head with eye bump
    ball(out, 0, 1.45, 0.05, 0.12, FROG, 3, 6)
    block(out, -0.35, 0.35, 0.3, 0.85, 0.85, 0.98, FROG)                                              // open mouth lip
  }
  for (let k = 0; k < 4; k++) {   // benches: arcs of granite blocks at r = 3.6
    for (let i = 0; i < 5; i++) {
      const a = (k * 90 + 10 + i * 14) * Math.PI / 180
      box(out, Math.cos(a) * 3.6, 0.25, Math.sin(a) * 3.6, 0.55, 0.25, 0.4, GRANITE_G, FIXED)
    }
  }
}

// --- Fenosa, Ophélie (1951 / cast 1987; photos): not a lying figure but two dark bronze relief slabs (~1 x 1.9 m, after
// Rimbaud's poem, a drowned woman in veils) set upright in an ivy-clad granite wall.
function ophelie(out: MeshBuilder): void {
  block(out, -2.6, 2.6, -0.3, 0.3, 0, 2.4, hex('#b4b0a6'))
  block(out, -2.7, 2.7, -0.4, 0.4, 2.4, 2.9, hex('#4f6a3a'))     // ivy cap
  if (!STAND_IN.ophelie) return
  for (const x of [-1.1, 1.1]) block(out, x - 0.5, x + 0.5, 0.3, 0.38, 0.3, 2.2, BLACKBRONZE)
}

// --- Shelomo Selinger, La Danse (1983, tinted concrete; photos): four low planter blocks of pale grey-pink granite-like
// concrete, each carved on its long face as a relief of intertwined figures and faces, planted on top.
function danse(out: MeshBuilder): void {
  const GR = hex('#a9a095')
  for (let k = 0; k < 4; k++) {
    const cx = (k - 1.5) * 4.0, hx = 1.8
    block(out, cx - hx, cx + hx, -0.6, 0.6, 0, 0.9, GR)
    block(out, cx - hx + 0.2, cx + hx - 0.2, -0.45, 0.45, 0.9, 1.0, hex('#4f6a3a'))        // planting
    if (!STAND_IN.danse) continue
    for (let i = 0; i < 5; i++) ball(out, cx - hx + 0.5 + i * 0.7, 0.5 + 0.12 * (i % 2), 0.62, 0.3, GR, 4, 8)   // relief bosses
  }
}

// --- Henri de Miller, Le Somnambule (1983; photos): a slender dark bronze figure leaning out into the sky with arms flung
// wide, balanced on a sphere resting on the corner of a cube, on a terrace.
const SOMN_H = 3.2
function somnambule(out: MeshBuilder): void {
  box(out, 0, 0.6, 0, 0.6, 0.6, 0.6, GRANITE_G, FIXED)
  ball(out, 0.1, 1.45, 0, 0.45, hex('#6a4a2a'), 5, 10)
  if (!STAND_IN.somnambule) return
  const y = 1.8
  strut(out, [0.1, y, 0], [0.55, y + 0.55 * SOMN_H, 0], 0.16, 0.12, BLACKBRONZE)               // leaning torso
  strut(out, [0.1, y, 0], [-0.5, y - 0.1, 0], 0.1, 0.1, BLACKBRONZE)                            // trailing leg
  strut(out, [0.55, y + 0.55 * SOMN_H, 0], [-0.6, y + 0.9 * SOMN_H, 0], 0.08, 0.08, BLACKBRONZE) // raised arm
  strut(out, [0.55, y + 0.55 * SOMN_H, 0], [1.5, y + 0.5 * SOMN_H, 0], 0.08, 0.08, BLACKBRONZE)  // other arm
  ball(out, 0.62, y + 0.62 * SOMN_H, 0, 0.12, BLACKBRONZE, 3, 6)
}

// --- France and Hughes Siptrott, Les Hommes de la cité (1995, polychrome patinated bronze; photos): eight life-plus-size
// anonymous passers-by in coats, striding or standing in a loose group on a paved court (six together on a base, one
// raised, one at the RATP stair).
const HOMMES_H = 2.3
function hommes(out: MeshBuilder): void {
  block(out, -3.0, 3.0, -1.4, 1.4, 0, 0.12, hex('#c9c3b6'))
  if (!STAND_IN.hommes) return
  const POS: [number, number][] = [[-2.4, 0.3], [-1.6, -0.5], [-0.8, 0.4], [0.1, -0.4], [0.9, 0.5], [1.8, -0.2], [2.5, 0.6], [-0.2, 1.0]]
  POS.forEach(([x, z], i) => {
    const h = HOMMES_H * (0.92 + 0.12 * rnd(i))
    lathe(out, x, z, 0.12, [[0, 0.28], [0.2 * h, 0.32], [0.62 * h, 0.34], [0.82 * h, 0.3], [0.88 * h, 0.12], [0.93 * h, 0.14], [h, 0.1]], i % 2 ? VERDIGRIS : hex('#6a5a3a'), 8)
  })
}

// --- Louis Leygue, La Fontaine des corolles (1973, copper alloy and paint; photos): a large black sculpture of curved,
// pierced petal-bowls stacked and tilted on one column, in a square pool; water falls from bowl to bowl.
const COROLLE_H = 5.0
function corolles(out: MeshBuilder): void {
  const POOL = 4.2
  block(out, -POOL, POOL, -POOL, POOL, 0, 0.45, hex('#8f8c85'))
  block(out, -POOL + 0.35, POOL - 0.35, -POOL + 0.35, POOL - 0.35, 0.45, 0.47, WATER)
  lathe(out, 0, 0, 0.45, [[0, 0.5], [0.3 * COROLLE_H, 0.35], [0.6 * COROLLE_H, 0.3]], BLACKBRONZE, 10)
  const BOWLS: [number, number, number, number][] = [[0.0, 0.2, 2.1, 0.0], [0.4, 0.55, 1.6, 0.35], [-0.3, 0.85, 1.2, -0.3]]   // dx, height share, radius, tilt (z lean)
  for (const [dx, hs, r, tilt] of BOWLS) {
    const y0 = 0.45 + hs * COROLLE_H
    for (let i = 0; i < 4; i++) {
      const t0 = i / 4, t1 = (i + 1) / 4
      prism(out, dx + tilt * t0 * 2, tilt * t0 * 0.8, y0 + t0 * 0.9, y0 + t1 * 0.9, r * (0.35 + 0.65 * t0), 14, BLACKBRONZE, FIXED, r * (0.35 + 0.65 * t1), i === 0)
    }
  }
}

// --- Gualtiero Busato, La Fontaine du dialogue (1989, lost-wax bronze with gold-leaf patina, ~2 m; photos): two figures
// talking, a bronze group atop a tall dark column carrying relief motifs, in a small round court ringed by curved
// granite benches. (The basin of the previous draft was wrong.)
const DIALOGUE_H = 1.9
function dialogue(out: MeshBuilder): void {
  prism(out, 0, 0, 0, 0.12, 4.1, 20, hex('#bdb6a8'), FIXED)
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2
    if (i % 4 === 0) continue
    box(out, Math.cos(a) * 3.6, 0.3, Math.sin(a) * 3.6, 0.7, 0.3, 0.3, GRANITE_G, FIXED)
  }
  block(out, -0.45, 0.45, -0.45, 0.45, 0.12, DIALOGUE_H, BLACKBRONZE)
  if (!STAND_IN.dialogue) return
  const GOLDB = hex('#8a6a30')
  lathe(out, -0.3, 0, DIALOGUE_H, [[0, 0.35], [0.5, 0.3], [0.9, 0.2]], GOLDB, 8)
  lathe(out, 0.3, 0, DIALOGUE_H, [[0, 0.3], [0.45, 0.28], [0.8, 0.2]], GOLDB, 8)
  ball(out, -0.3, DIALOGUE_H + 1.05, 0, 0.17, GOLDB, 3, 6)
  ball(out, 0.3, DIALOGUE_H + 0.95, 0, 0.17, GOLDB, 3, 6)
}

type Draw = (out: MeshBuilder, fit: Fit) => void
const wrap = (d: Draw): Draw => (out, fit) => lifted(out, dalle(fit), () => d(out, fit))
export const defenseToscano = wrap(toscano)
export const defenseMiro = wrap(miro)
export const defensePouvreau = wrap(pouvreau)
export const defenseLieuxDuCorps = wrap(lieux)
export const defenseHercules = wrap(hercules)
export const defenseDameLune = wrap(dameLune)
export const defenseTerreDerbre = wrap(terre)
export const defenseGrenouille = wrap(grenouille)
export const defenseOphelie = wrap(ophelie)
export const defenseDanse = wrap(danse)
export const defenseSomnambule = wrap(somnambule)
export const defenseHommesCite = wrap(hommes)
export const defenseCorolles = wrap(corolles)
export const defenseDialogue = wrap(dialogue)
