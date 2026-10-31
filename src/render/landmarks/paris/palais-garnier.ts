import type { MeshBuilder } from '../../buildings.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { lathe, classicalColumn } from '../column.ts'
import { block, hex, roof, shade } from '../kit.ts'
import type { Fit } from '../fit.ts'
import { sign } from '../parts.ts'
import { arcade, archRing, balustrade, fitted, palette, range, rectOn, slabOn, type Pal } from './palaces/common.ts'
import { Relief, beast, figure } from './minor/sculpt.ts'

const FIXED = 0
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

/**
 * THE PALAIS GARNIER (Charles Garnier, 1875), rebuilt in the top-25 audit of 2026-10-30. It was 2,900 triangles: a cream box, sixteen green
 * posts and gold bricks. Read off "Paris Opera full frontal architecture, May 2009.jpg" (Commons) as the bar is read, x from its 920 px
 * between the avant-corps' outer edges for 66 m (IGN's aerial), y from the ground; the rest from the aerial and OSM's parts:
 *
 * - THE FRONT: seven arches on a rusticated ground floor (five in the middle on 8.2 m, one in each avant-corps), the roundels over the piers,
 *   the four groups either side of the avant-corps' arches (Carpeaux's La Danse among them, massed, not read figure by figure);
 * - THE LOGGIA: eight pairs of great pale monoliths (two pairs on each avant-corps, four between them), and in each of the seven bays two
 *   small rose columns, a balcony, a dark window and over it the oculus with its gilt bust (Rossini, Auber, Beethoven, Mozart…);
 * - the frieze with ACADÉMIE NATIONALE DE MUSIQUE, CHORÉGRAPHIE and POÉSIE LYRIQUE on the avant-corps, the attic with its medallions and the
 *   high reliefs between them, the gilt crest of 53 masks, the avant-corps' segmental pediments with their reliefs;
 * - the gilded HARMONY and POETRY (Gumery) on their plinths, winged, with the figures at their feet;
 * - behind: the low copper dome (OSM: 44 to 51 m) on its drum, its stone lucarnes and gilt crown; the fly tower's gable (56 m, Wikipedia),
 *   Millet's verdigris Apollo with the lyre at its apex and Lequesne's two Pegasi on the corners, the lateral galleries on their two tiers
 *   of arches, the two rotundas with their little copper domes (r ≈ 8 m on the aerial, Wikipedia gives the Abonnés' 13.5 m across), the
 *   back block.
 *
 * Local frame: the front faces −z (the entry's front 165 turns it to the Place), design size the OSM footprint's 30 × 66.5 m half-widths,
 * and the front's real 66 m stands out 3 m past it either side, as the aerial has it. Viewer's right is +x, the Abonnés' side.
 */
const HX = 30
const HZ = 66.5
const STONE: Rgb = hex('#c5bba5')
const TRIM: Rgb = shade(STONE, 1.06)
const BAND: Rgb = shade(STONE, 0.88)
const DEEP: Rgb = shade(STONE, 0.66)
const ROSE: Rgb = hex('#b99681')
const GOLD: Rgb = [0.72, 0.54, 0.17]
const COPPER: Rgb = hex('#7fa78f')
const RIB: Rgb = hex('#a5c2ad')
const VERD: Rgb = hex('#5f8d7f')
const GLASS: Rgb = [0.13, 0.13, 0.14]
const LEAD: Rgb = hex('#7c8588')
const copper = surfaceTag('copper')
const plain = surfaceTag('stucco')
const P: Pal = { ...palette('#c5bba5', '#5b6367'), stone: STONE, trim: TRIM, deep: BAND }

const F = -HZ            // the plane of the front
const GROUND = 11        // the ground floor's cornice
const CAP = 23           // the great columns' heads
const FRIEZE = 24.8
const ATTIC = 32.3
const CREST = 33.7

/** The great pairs' axes and the seven bays. */
const PAIRS = [-30.5, -21.9, -12.3, -4.1, 4.2, 12.4, 21.9, 30.4]
const BAYS = [-26.2, -8.2, 0, 8.2, -17.1, 17.1, 26.2]

/** A standing group of the gilded kind: a winged figure with its arms up, two more at her feet. In its own relief, looking at −z. */
function gilded(q: MeshBuilder, x: number, y: number, z: number, side: number): void {
  const r = new Relief(q, x, y, z - 0.9, GOLD, 0.6)
  // a core, so that it has a back from the Rue Auber
  prism(q, x, z, y + 0.3, y + 5.6, 1.3, 8, shade(GOLD, 0.92), plain, 0.6)
  figure(r, { k: 0.52, hip: [0, 3.7, 0.5], chest: [0.1, 5.05, 0.5], head: [0.15, 6.15, 0.5],
    armL: [[-0.85, 6.1, 0.55], [-1.15, 7.6, 0.6]], armR: [[0.95, 6.2, 0.55], [1.1, 7.7, 0.6]], skirt: { to: [0.0, 0.5, 0.55], w: 1.0 } })
  for (const s of [-1, 1]) r.wing([s * 0.55, 5.5, 0.2], s > 0 ? 0.9 : 2.25, s > 0 ? 0.7 : 2.45, 2.9, 6)
  // the seated figures at her feet, the one on the outside taller, as the photograph has them
  figure(r, { k: 0.42, hip: [-side * 1.8, 1.3, 0.9], chest: [-side * 1.9, 2.4, 0.9], head: [-side * 1.95, 3.3, 0.9], armL: [[-side * 2.5, 2.2, 1], [-side * 2.2, 3.0, 1.1]],
    legL: [[-side * 1.3, 1.1, 1.3], [-side * 1.5, 0.05, 1.4]], legR: [[-side * 2.4, 1.1, 1.3], [-side * 2.5, 0.05, 1.4]] })
  figure(r, { k: 0.42, hip: [side * 1.8, 1.3, 0.9], chest: [side * 1.85, 2.4, 0.9], head: [side * 1.9, 3.3, 0.9], armR: [[side * 2.5, 2.2, 1], [side * 2.3, 1.4, 1.1]],
    legL: [[side * 1.3, 1.1, 1.3], [side * 1.5, 0.05, 1.4]], legR: [[side * 2.4, 1.1, 1.3], [side * 2.5, 0.05, 1.4]] })
}

/** A group on a ground-floor pier (La Danse and its three fellows): a central figure, two beside it. Massed, not read off its photograph. */
function pierGroup(q: MeshBuilder, x: number, seed: number): void {
  block(q, x - 1.9, x + 1.9, F - 2.2, F, 0, 2.2, TRIM)
  block(q, x - 2.1, x + 2.1, F - 2.4, F, 2.2, 2.55, BAND)
  const r = new Relief(q, x, 2.55, F - 1.0, shade(STONE, 1.08), 1.2)
  const a = seed % 2 ? 1 : -1
  figure(r, { k: 0.78, hip: [0, 2.2, 0.5], chest: [a * 0.2, 3.55, 0.55], head: [a * 0.35, 4.65, 0.55], armL: [[-1.05, 3.5, 0.6], [-1.5, 4.5, 0.6]], armR: [[1.05, 3.55, 0.6], [1.5, 4.5, 0.6]],
    legL: [[-0.45, 1.1, 0.6], [-0.75, 0.05, 0.7]], legR: [[0.45, 1.1, 0.6], [0.8, 0.05, 0.7]] })
  for (const s of [-1, 1]) {
    figure(r, { k: 0.62, hip: [s * 1.35, 1.7, 0.45], chest: [s * 1.3, 2.75, 0.45], head: [s * 1.3, 3.55, 0.45], armL: [[s * 0.85, 2.7, 0.6], [s * 0.55, 3.2, 0.7]],
      legR: [[s * 1.35, 0.85, 0.65], [s * 1.5, 0.05, 0.75]], legL: [[s * 0.95, 0.85, 0.65], [s * 0.9, 0.05, 0.75]] })
  }
}

/** The front, with what stands on it. */
function front(q: MeshBuilder): void {
  // ---- the steps, the width of the front (the aerial: 8 m of them), up to the ground floor
  for (let i = 0; i < 8; i++) block(q, -36, 36, F - 8.5 + i, F + 0.2, 0, 0.2 + i * 0.2, shade(STONE, 0.86 + i * 0.012))
  const Y0 = 1.6

  // ---- the ground floor: the arcade, cut true, and the avant-corps a metre proud of it
  const hArch = 8.4
  const w = 4.5
  const middle = [-16.4, -8.2, 0, 8.2, 16.4]
  arcade(q, F, -19.4, 19.4, Y0, GROUND, middle, w, hArch, 1.6, STONE, DEEP, GLASS)
  for (const s of [-1, 1]) {
    const x0 = s > 0 ? 19.4 : -33
    const x1 = s > 0 ? 33 : -19.4
    arcade(q, F - 1, x0, x1, Y0, GROUND, [s * 26.2], w, hArch, 2.6, STONE, DEEP, GLASS)
    // the returns
    q.quad([[x0, Y0, F], [x0, Y0, F - 1], [x0, GROUND, F - 1], [x0, GROUND, F]], [s > 0 ? -1 : 1, 0, 0], UV, shade(STONE, 0.94), FIXED)
    q.quad([[x1, Y0, F], [x1, Y0, F - 1], [x1, GROUND, F - 1], [x1, GROUND, F]], [s, 0, 0], UV, shade(STONE, 0.94), FIXED)
  }
  for (const c of [...middle, -26.2, 26.2]) {
    const z = Math.abs(c) > 20 ? F - 1 : F
    archRing(q, z, c, Y0 + hArch - w / 2, w / 2, w / 2 + 0.42, 0.2, TRIM, BAND)
    // the iron grilles in the arches' feet (the photograph's dark bars with a gold line)
    block(q, c - w / 2, c + w / 2, z + 0.25, z + 0.32, Y0, Y0 + 2.1, shade(GLASS, 1.6))
    block(q, c - w / 2, c + w / 2, z + 0.22, z + 0.34, Y0 + 2.1, Y0 + 2.2, GOLD)
    // the rusticated piers' courses
  }
  for (let y = Y0 + 0.9; y < GROUND - 3.6; y += 0.9) {
    for (const c of [-12.3, -4.1, 4.1, 12.3]) block(q, c - 1.85, c + 1.85, F - 0.05, F, y - 0.04, y + 0.04, BAND)
  }
  // the roundels over the piers and the seated statues under them
  const rr = new Relief(q, 0, 0, F - 0.02, TRIM, 0.4)
  for (const c of [-12.3, -4.1, 4.1, 12.3]) {
    rr.disc([c, 8.5, 0.02], 1.0, 0.28, 10)
    rr.lump([c, 8.5, 0.28], 0.42, 0.5, 0.2, 4, true, 2)
    block(q, c - 0.8, c + 0.8, F - 1.3, F, Y0, Y0 + 1.4, TRIM)
    const fig = new Relief(q, c, Y0 + 1.4, F - 0.8, shade(STONE, 1.05), 0.8)
    figure(fig, { k: 0.48, hip: [0, 0.95, 0.25], chest: [0, 1.85, 0.25], head: [0, 2.5, 0.25], armL: [[-0.45, 1.75, 0.3], [-0.3, 2.25, 0.35]],
      legL: [[-0.3, 0.5, 0.3], [-0.35, 0.03, 0.35]], legR: [[0.3, 0.5, 0.3], [0.35, 0.03, 0.35]] })
  }
  // the four groups
  pierGroup(q, -31, 0); pierGroup(q, -21.4, 1); pierGroup(q, 21.4, 2); pierGroup(q, 31, 3)

  // the ground floor's cornice
  block(q, -19.6, 19.6, F - 0.5, F + 0.4, GROUND - 0.3, GROUND + 0.2, TRIM)
  for (const s of [-1, 1]) block(q, s > 0 ? 19.2 : -33.5, s > 0 ? 33.5 : -19.2, F - 1.5, F + 0.4, GROUND - 0.3, GROUND + 0.2, TRIM)

  // ---- the loggia: the back wall, the windows, the balconies, the small columns and the oculi
  const LZ = F + 2.6
  block(q, -33, 33, LZ, LZ + 1, GROUND, CAP, BAND)
  block(q, -33.5, 33.5, F - 0.4, LZ, GROUND + 0.2, GROUND + 0.45, shade(STONE, 0.8))
  for (const c of BAYS) {
    const isAvant = Math.abs(c) > 20
    const hw = isAvant ? 3.1 : 2.75
    // the dark window between its small columns
    rectOn(q, '-z', LZ, c - hw * 0.72, c + hw * 0.72, GROUND + 0.5, 18.3, GLASS, 0.05)
    for (const s of [-1, 0, 1]) block(q, c + s * hw * 0.3 - 0.05, c + s * hw * 0.3 + 0.05, LZ - 0.12, LZ - 0.04, GROUND + 0.5, 18.3, shade(GLASS, 2))
    block(q, c - hw * 0.72, c + hw * 0.72, LZ - 0.12, LZ - 0.04, 15.2, 15.32, shade(GLASS, 2))
    for (const s of [-1, 1]) {
      classicalColumn(q, c + s * hw * 0.82, LZ - 0.6, GROUND + 0.5, 18.2, 0.27, ROSE, { order: 'ionic', tier: 'mid', tag: plain, trim: TRIM })
    }
    // their lintel, and the panel over it with the oculus and its gilt bust
    block(q, c - hw - 0.1, c + hw + 0.1, LZ - 0.8, LZ, 18.2, 18.75, TRIM)
    const R = new Relief(q, c, 0, LZ - 0.02, TRIM, 0.4)
    R.disc([0, 20.8, 0], 1.25, 0.34, 10)
    prism(q, c, LZ - 0.32, 20.8 - 0.75, 20.8 + 0.75, 0.75, 8, GLASS, FIXED)
    R.lump([0, 20.85, 0.5], 0.33, 0.45, 0.25, 4, true, 2)
    const B = new Relief(q, c, 0, LZ - 0.5, GOLD, 0.4)
    B.lump([0, 20.95, 0.2], 0.3, 0.4, 0.22, 5, true, 2)
    B.lump([0, 20.35, 0.2], 0.48, 0.28, 0.22, 4, true, 2)
    // the balcony, at the line of the great plinths, with its balusters
    const bz = isAvant ? F - 0.6 : F + 0.4
    balustrade(q, c - hw + 0.4, c + hw - 0.4, bz, bz + 0.2, GROUND + 0.45, P, { sides: ['-z'], h: 1.15 })
  }
  // the great columns, in pairs, on their plinths
  for (const p of PAIRS) {
    const avant = Math.abs(p) > 20
    const z = (avant ? F - 1 : F) + 0.15
    block(q, p - 1.62, p + 1.62, z - 0.75, z + 0.75, GROUND + 0.2, GROUND + 1.25, TRIM)
    for (const s of [-1, 1]) classicalColumn(q, p + s * 0.82, z, GROUND + 1.25, CAP, 0.55, shade(STONE, 1.1), { order: 'corinthian', tier: 'near', tag: plain, trim: TRIM })
  }

  // ---- the entablature and the frieze: its marble band and its words
  block(q, -19.4, 19.4, F - 0.55, LZ, CAP, FRIEZE, TRIM)
  for (const s of [-1, 1]) block(q, s > 0 ? 19.4 : -33.4, s > 0 ? 33.4 : -19.4, F - 1.55, LZ, CAP, FRIEZE, TRIM)
  block(q, -19.4, 19.4, F - 0.7, F, CAP + 0.25, CAP + 0.95, hex('#8c6a4a'))
  const word = (text: string, x: number, wd: number, z: number): void => {
    sign(q, { type: 'flat', text, h: 0.5, w: wd, face: 'roman', colour: GOLD, tracking: 0.2, lit: 'none' }, { x, y: CAP + 0.35, z, heading: Math.PI })
  }
  word('ACADÉMIE NATIONALE DE MUSIQUE', 0, 22, F - 0.74)
  for (const s of [-1, 1]) {
    block(q, s > 0 ? 21 : -32, s > 0 ? 32 : -21, F - 1.7, F, CAP + 0.25, CAP + 0.95, hex('#8c6a4a'))
    word(s < 0 ? 'CHORÉGRAPHIE' : 'POÉSIE LYRIQUE', s * 26.4, 8.4, F - 1.74)
  }
  block(q, -19.6, 19.6, F - 0.9, LZ, FRIEZE - 0.2, FRIEZE + 0.3, shade(STONE, 1.08))

  // ---- the attic: the medallions and the high reliefs between them
  block(q, -19.4, 19.4, F, F + 16, FRIEZE + 0.3, ATTIC, STONE)
  const att = new Relief(q, 0, 0, F - 0.02, TRIM, 0.6)
  for (let i = 0; i < 9; i++) {
    const x = (i - 4) * 4.15
    if (i % 2 === 0) {
      att.disc([x, 28.6, 0.02], 1.5, 0.3, 12)
      att.disc([x, 28.6, 0.28], 0.8, 0.22, 8)
    } else {
      block(q, x - 0.8, x + 0.8, F - 0.35, F, FRIEZE + 0.3, FRIEZE + 0.9, TRIM)
      figure(att, { k: 0.5, coarse: true, hip: [x, 28.2, 0.35], chest: [x + 0.1, 29.45, 0.4], head: [x + 0.1, 30.4, 0.4], armL: [[x - 0.7, 29.5, 0.45], [x - 0.6, 30.6, 0.45]], armR: [[x + 0.8, 29.3, 0.45], [x + 0.75, 28.4, 0.45]], skirt: { to: [x, 25.9, 0.35], w: 0.8 } })
    }
  }
  // the avant-corps' attics, a metre proud, and their segmental pediments on consoles
  for (const s of [-1, 1]) {
    const x0 = s > 0 ? 19.4 : -33
    const x1 = s > 0 ? 33 : -19.4
    const cx = s * 26.2
    block(q, x0, x1, F - 1, F + 16, FRIEZE + 0.3, ATTIC, STONE)
    const yb = FRIEZE + 0.9
    const span = (x1 - x0) / 2 - 0.3
    const rise = 3.6
    const n = 14
    const tym = shade(STONE, 0.92)
    const mould = shade(STONE, 1.08)
    const crown = (u: number): number => yb + rise * (1 - u * u)
    for (let i = 0; i < n; i++) {
      const u0 = -1 + (2 * i) / n, u1 = -1 + (2 * (i + 1)) / n
      q.quad([[cx + u0 * span, yb, F - 1.05], [cx + u1 * span, yb, F - 1.05], [cx + u1 * span, crown(u1), F - 1.05], [cx + u0 * span, crown(u0), F - 1.05]], [0, 0, -1], UV, tym, FIXED)
      // the moulding that runs round it, standing proud
      const box0: [number, number, number] = [cx + u0 * (span + 0.35), crown(u0) + 0.05, F - 1.6]
      const box1: [number, number, number] = [cx + u1 * (span + 0.35), crown(u1) + 0.05, F - 1.6]
      q.quad([box0, box1, [box1[0], box1[1] + 0.5, F - 1.6], [box0[0], box0[1] + 0.5, F - 1.6]], [0, 0, -1], UV, mould, FIXED)
      q.quad([[box0[0], box0[1] + 0.5, F - 1.6], [box1[0], box1[1] + 0.5, F - 1.6], [box1[0], box1[1] + 0.5, F - 1], [box0[0], box0[1] + 0.5, F - 1]], [0, 1, -0.1], UV, mould, FIXED)
    }
    block(q, x0, x1, F - 1.65, F - 0.9, yb - 0.15, yb + 0.05, mould)
    // Petit's and Gruyère's reliefs: figures reclining away from a middle one
    const rel = new Relief(q, cx, yb, F - 1.07, TRIM, 0.5)
    figure(rel, { k: 0.34, coarse: true, hip: [0, 0.7, 0.2], chest: [0.05, 1.55, 0.24], head: [0.05, 2.25, 0.25], armL: [[-0.5, 1.5, 0.3], [-0.65, 2.1, 0.3]], armR: [[0.55, 1.5, 0.3], [0.7, 2.1, 0.3]], skirt: { to: [0, 0.05, 0.2], w: 0.6 } })
    for (const d of [-1, 1]) {
      figure(rel, { k: 0.3, coarse: true, hip: [d * 2.2, 0.55, 0.2], chest: [d * 1.5, 1.05, 0.24], head: [d * 1.05, 1.65, 0.25], armL: [[d * 2.1, 1.2, 0.3], [d * 2.6, 1.0, 0.3]],
        legL: [[d * 3.2, 0.5, 0.25], [d * 4, 0.1, 0.25]], legR: [[d * 3.1, 0.25, 0.25], [d * 3.7, 0.08, 0.25]] })
    }
    block(q, cx - 0.55, cx + 0.55, F - 1.9, F - 1, crown(0) + 0.1, crown(0) + 0.95, mould)
  }

  // ---- the crest: the cornice and its 53 gilded masks and palmettes along the top
  block(q, -33.6, 33.6, F - 1.8, F + 16.4, ATTIC - 0.2, ATTIC + 0.35, TRIM)
  block(q, -33.7, 33.7, F - 1.85, F - 1.5, ATTIC + 0.35, ATTIC + 0.6, GOLD)
  block(q, -33.7, 33.7, F - 1.5, F + 16.5, ATTIC + 0.35, ATTIC + 0.6, TRIM)
  const crest = new Relief(q, 0, ATTIC + 0.6, F - 1.8, GOLD, 0.3)
  for (let i = 0; i < 53; i++) {
    const x = -32.8 + (65.6 * i) / 52
    crest.lump([x, 0.42, 0.1], 0.52, 0.52, 0.16, 4, true, 2)
  }
  block(q, -33.3, 33.3, F - 1.4, F - 0.9, ATTIC + 0.6, CREST, shade(GOLD, 0.92))
  block(q, -33.3, 33.3, F - 0.9, F + 16.2, ATTIC + 0.6, CREST - 0.05, shade(STONE, 0.85))
  // the leads of the front block
  block(q, -33, 33, F - 1, F + 16, CREST - 0.05, CREST, LEAD)

  // ---- Gumery's gilded Harmony and Poetry on their plinths at the avant-corps' tops
  for (const s of [-1, 1]) {
    block(q, s * 26.2 - 4.5, s * 26.2 + 4.5, F - 0.6, F + 5.6, CREST, CREST + 0.5, TRIM)
    block(q, s * 26.2 - 3.6, s * 26.2 + 3.6, F, F + 5, CREST + 0.5, CREST + 1.6, STONE)
    gilded(q, s * 26.2, CREST + 1.6, F + 2.5, s)
  }
}

/** The front of the main block and the mass behind it, and the flanks, in the plan's frame. */
function mass(q: MeshBuilder): void {
  // ---- the foyer's roof behind the front's crest, and the stair hall's: pale zinc, hipped, as the aerial has them
  roof(q, -25, 25, F + 13, -11, 31, 7, 13, 6, hex('#7f888b'))
  block(q, -29, 29, F + 16, -10, 0, 31, STONE)
  // the galleries down the flanks: two tiers of arches, a balustrade, a low slate roof
  const storeys = [{ y: 1.2, h: 7.2, arched: true, sill: 0.2 }, { y: 13, h: 7.6, arched: true, sill: 0.6 }]
  range(q, -30, -19, F + 16, HZ, P, { eaves: 25, storeys, bay: 7.4, win: 3.1, faces: ['-x'], courses: true, quoins: false, frames: true, cornice: 0.7 })
  range(q, 19, 30, F + 16, HZ, P, { eaves: 25, storeys, bay: 7.4, win: 3.1, faces: ['+x'], courses: true, quoins: false, frames: true, cornice: 0.7 })
  for (const s of [-1, 1]) {
    const x0 = s > 0 ? 19 : -30
    const x1 = s > 0 ? 30 : -19
    balustrade(q, x0, x1, F + 16, HZ, 25, P, { sides: [s > 0 ? '+x' : '-x'], h: 1 })
    roof(q, x0 + 0.4, x1 - 0.4, F + 16, HZ, 25, 5, (x1 - x0) / 2 - 0.4, 0.01, P.slate)
  }
  // the returns of the attic down the flanks of the front block
  for (const s of [-1, 1]) {
    const pl = s * 33
    const f = s > 0 ? '+x' : '-x'
    for (let i = 0; i < 2; i++) {
      const zc = F + 3.5 + i * 7.5
      rectOn(q, f, pl, zc - 1.6, zc + 1.6, 12.5, 21, GLASS, 0.05)
      rectOn(q, f, pl, zc - 1.8, zc + 1.8, 1.8, 8, GLASS, 0.05)
    }
    block(q, Math.min(pl, s * 29), Math.max(pl, s * 29), F + 2.6, F + 16, 0, CREST - 1.4, STONE)
  }

  // ---- the auditorium's drum and its copper dome: 17 m in radius off the aerial, at z = 5
  const dz = 5.2
  const R = 17.4
  prism(q, 0, dz, 25, 44, R + 0.5, 32, STONE, FIXED)
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2
    box(q, Math.sin(a) * (R + 0.6), 38, dz + Math.cos(a) * (R + 0.6), 0.5, 5.8, 0.5, TRIM, FIXED)
  }
  prism(q, 0, dz, 43.4, 44.6, R + 1.4, 32, TRIM, FIXED)
  // the dome's skirt and the dome, low, as OSM's parts and the photograph have it
  const prof: [number, number][] = []
  for (let i = 0; i <= 10; i++) { const t = (i / 10) * Math.PI * 0.5; prof.push([Math.cos(t) * R + 0.4, 44.6 + Math.sin(t) * 7.6]) }
  lathe(q, 0, dz, prof, 32, COPPER, copper)
  // its ribs, 24 of them, proud and paler
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2
    const d = 0.022
    for (let k = 0; k < 9; k++) {
      const t0 = (k / 9) * Math.PI * 0.46, t1 = ((k + 1) / 9) * Math.PI * 0.46
      const r0 = Math.cos(t0) * R + 0.5, r1 = Math.cos(t1) * R + 0.5
      const y0 = 44.6 + Math.sin(t0) * 7.6, y1 = 44.6 + Math.sin(t1) * 7.6
      q.quad([[Math.sin(a - d) * r0, y0, dz + Math.cos(a - d) * r0], [Math.sin(a + d) * r0, y0, dz + Math.cos(a + d) * r0],
        [Math.sin(a + d * 1.4) * r1, y1, dz + Math.cos(a + d * 1.4) * r1], [Math.sin(a - d * 1.4) * r1, y1, dz + Math.cos(a - d * 1.4) * r1]],
      [Math.sin(a) * Math.cos(t0), Math.sin(t0), Math.cos(a) * Math.cos(t0)], UV, RIB, copper)
    }
  }
  // the stone lucarnes round its foot, each with its gilt-edged oval
  for (let i = 0; i < 16; i++) {
    const a = ((i + 0.5) / 16) * Math.PI * 2
    const x = Math.sin(a) * (R + 0.2)
    const z = dz + Math.cos(a) * (R + 0.2)
    box(q, x, 46.1, z, 0.8, 1.3, 0.8, TRIM, FIXED)
    prism(q, x, z, 47.4, 48.2, 0.8, 6, BAND, FIXED, 0.1)
    box(q, x * 1.035, 46.3, dz + (z - dz) * 1.035, 0.45, 0.6, 0.45, GOLD, FIXED)
  }
  // the crown: the lantern's gilt rings and palmettes
  prism(q, 0, dz, 52, 52.5, 3.8, 16, GOLD, FIXED, 3.6)
  prism(q, 0, dz, 52.5, 54, 2.6, 12, shade(COPPER, 0.8), copper, 2.2)
  prism(q, 0, dz, 54, 54.6, 2.9, 16, GOLD, FIXED, 1.4)
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    prism(q, Math.sin(a) * 3.3, dz + Math.cos(a) * 3.3, 52.4, 53.9, 0.3, 5, GOLD, FIXED, 0.06)
  }

  // ---- the fly tower: 54 m across and 34 m deep off the aerial, its gable facing the front, the ridge at 56 m (Wikipedia; OSM says 58)
  const SZ0 = 22.5
  const SZ1 = 56.5
  const SW = 27
  const EAVES = 46
  const RIDGE = 56
  block(q, -SW, SW, SZ0, SZ1, 0, EAVES, STONE)
  block(q, -SW - 0.6, SW + 0.6, SZ0 - 0.6, SZ1 + 0.6, EAVES - 1.1, EAVES, TRIM)
  // the roof: ridge along z, zinc, its skylights
  roof(q, -SW - 0.3, SW + 0.3, SZ0, SZ1, EAVES, RIDGE - EAVES, SW + 0.3, 0.001, LEAD)
  for (const s of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      const z = SZ0 + 4 + i * 6.5
      const u = 0.58
      const y = EAVES + (RIDGE - EAVES) * (1 - u)
      q.quad([[s * SW * (u - 0.14), y + 1.4, z], [s * SW * (u - 0.14), y + 1.4, z + 4], [s * SW * (u + 0.14), y - 1.4, z + 4], [s * SW * (u + 0.14), y - 1.4, z]],
        [s * 0.35, 0.94, 0], UV, shade(GLASS, 2.3), FIXED)
    }
  }
  // the gables, front and back, with their raking cornices
  for (const [z, nz] of [[SZ0 - 0.1, -1], [SZ1 + 0.1, 1]] as const) {
    q.quad([[-SW, EAVES, z], [SW, EAVES, z], [0, RIDGE, z], [0, RIDGE, z]], [0, 0, nz], UV, STONE, FIXED)
    for (const s of [-1, 1]) {
      const a: [number, number, number] = [s * (SW + 0.9), EAVES - 0.2, z + nz * 0.5]
      const b: [number, number, number] = [0, RIDGE + 0.2, z + nz * 0.5]
      q.quad([a, b, [b[0], b[1] + 0.7, b[2]], [a[0], a[1] + 0.7, a[2]]], [0, 0, nz], UV, TRIM, FIXED)
      q.quad([[a[0], a[1] + 0.7, a[2]], [b[0], b[1] + 0.7, b[2]], [b[0], b[1] + 0.7, z], [a[0], a[1] + 0.7, z]], [s * 0.3, 0.95, 0], UV, TRIM, FIXED)
    }
  }
  // the flanks of the tower: tall blind arches between pilasters
  for (const s of [-1, 1]) {
    const fc = s > 0 ? '+x' : '-x'
    for (let i = 0; i < 4; i++) {
      const z = SZ0 + 5 + i * 8
      rectOn(q, fc, s * SW, z - 1.6, z + 1.6, 28, 40, DEEP, 0.05)
      slabOn(q, fc, s * SW, z + 3.6, z + 4.4, 26, EAVES - 1.1, 0.4, TRIM)
    }
  }
  // Millet's Apollo: the verdigris group on a pedestal over the gable's apex, the lyre held up over his head
  block(q, -2.3, 2.3, SZ0 - 2, SZ0 + 1.2, RIDGE - 1.5, RIDGE + 0.6, TRIM)
  const ap = new Relief(q, 0, RIDGE + 0.6, SZ0 - 1, VERD, 0.9)
  prism(q, 0, SZ0, RIDGE + 0.6, RIDGE + 4.6, 1.2, 8, shade(VERD, 0.9), plain, 0.5)
  figure(ap, { k: 0.52, hip: [0, 2.6, 0.5], chest: [0, 3.9, 0.5], head: [0, 4.95, 0.5], armL: [[-0.95, 4.9, 0.55], [-0.55, 6.1, 0.55]], armR: [[0.95, 4.9, 0.55], [0.55, 6.1, 0.55]], skirt: { to: [0, 0.2, 0.4], w: 0.9 } })
  // (the lyre, gilded)
  const ly = new Relief(q, 0, RIDGE + 0.6, SZ0 - 1, GOLD, 0.5)
  ly.tube([-0.5, 6.1, 0.65], [-0.65, 7.2, 0.65], 0.09, 0.07, 3)
  ly.tube([0.5, 6.1, 0.65], [0.65, 7.2, 0.65], 0.09, 0.07, 3)
  ly.tube([-0.65, 7.2, 0.65], [0.65, 7.2, 0.65], 0.08, 0.08, 3)
  ly.tube([-0.5, 6.1, 0.65], [0.5, 6.1, 0.65], 0.1, 0.1, 3)
  for (const s of [-1, 1]) figure(ap, { k: 0.34, hip: [s * 1.6, 1.1, 0.6], chest: [s * 1.55, 2, 0.6], head: [s * 1.5, 2.7, 0.6], armL: [[s * 1.1, 2.15, 0.65], [s * 0.7, 2.7, 0.65]], skirt: { to: [s * 1.7, 0.05, 0.5], w: 0.6 } })
  // Lequesne's Pegasi on the gable's feet, one wing up
  for (const s of [-1, 1]) {
    const x = s * (SW - 2)
    block(q, x - 2, x + 2, SZ0 - 1, SZ0 + 1.5, EAVES, EAVES + 1, TRIM)
    const r = new Relief(q, x, EAVES + 1, SZ0 - 0.2, VERD, 0.7, s > 0)
    beast(r, { rump: [1.3, 2.1, 0.4], chest: [-0.85, 2.6, 0.4], poll: [-1.5, 4.0, 0.4], muzzle: [-2.1, 3.7, 0.4],
      legs: [[[1.25, 1.85, 0.6], [1.5, 0.95, 0.65], [1.3, 0.05, 0.65]], [[1.0, 1.85, 0.25], [1.05, 0.95, 0.25], [1.2, 0.05, 0.25]], [[-0.9, 2.1, 0.6], [-1.5, 1.8, 0.65], [-1.25, 1.1, 0.65]], [[-0.7, 2.1, 0.25], [-0.75, 1.1, 0.25], [-0.85, 0.05, 0.25]]],
      tail: [[1.8, 2.5, 0.4], [2.3, 1.8, 0.4], [2.2, 1.0, 0.4]], girth: 0.72 })
    r.wing([0.1, 3.15, 0.5], 0.9, 1.95, 3.1, 6)
  }

  // ---- the back block: the administration's plain walls, its windows and its mansard
  const backStoreys = [{ y: 1, h: 3.4 }, { y: 7, h: 3.8 }, { y: 13, h: 3.8 }, { y: 19, h: 2.8 }]
  range(q, -27, 27, SZ1, 66.5, P, { eaves: 26, storeys: backStoreys, bay: 4, win: 1.8, faces: ['-x', '+x'], courses: false, frames: false })
  range(q, -23, 23, 66.5, 84, P, { eaves: 26, storeys: backStoreys, bay: 4, win: 1.8, faces: ['+z', '-x', '+x'], courses: true, frames: false })
  block(q, -23, 23, SZ1, 84, 25.95, 26.1, LEAD)
  roof(q, -23.5, 23.5, SZ1 + 0.4, 84.5, 26, 4, 3, 3, P.slate)

  // ---- the two rotundas on the flanks, off the aerial at x = ±41.5, z = 7: Pavillon de l'Empereur (−x) and des Abonnés (+x)
  for (const s of [-1, 1]) {
    const cx = s * 41.5
    const cz = 7
    block(q, s > 0 ? 29 : -41.5, s > 0 ? 41.5 : -29, cz - 13, cz + 13, 0, 17, STONE)
    block(q, s > 0 ? 29 : -41.8, s > 0 ? 41.8 : -29, cz - 13.3, cz + 13.3, 16.6, 17.4, TRIM)
    block(q, s > 0 ? 29 : -41.5, s > 0 ? 41.5 : -29, cz - 13, cz + 13, 17.4, 17.5, LEAD)
    prism(q, cx, cz, 0, 19.5, 8.6, 24, STONE, FIXED)
    prism(q, cx, cz, 19.1, 20.2, 9.1, 24, TRIM, FIXED)
    for (let i = 0; i < 10; i++) {
      const a = ((i + 0.5) / 10) * Math.PI * 2
      const x = cx + Math.sin(a) * 8.64
      const z = cz + Math.cos(a) * 8.64
      const n: [number, number, number] = [Math.sin(a), 0, Math.cos(a)]
      const t: [number, number] = [Math.cos(a), -Math.sin(a)]
      const panel = (y0: number, y1: number, w: number, c: Rgb): void => {
        q.quad([[x - t[0] * w, y0, z - t[1] * w], [x + t[0] * w, y0, z + t[1] * w], [x + t[0] * w, y1, z + t[1] * w], [x - t[0] * w, y1, z - t[1] * w]], n, UV, c, FIXED)
      }
      panel(1, 8, 1.35, GLASS)
      panel(10.5, 17, 1.25, GLASS)
      box(q, x + Math.sin(a + 0.32) * 0.2, 9, z + Math.cos(a + 0.32) * 0.2, 0.25, 8.6, 0.25, TRIM, FIXED)
    }
    const pr: [number, number][] = []
    for (let i = 0; i <= 8; i++) { const t = (i / 8) * Math.PI * 0.5; pr.push([Math.cos(t) * 8.2 + 0.2, 20.2 + Math.sin(t) * 5.6]) }
    lathe(q, cx, cz, pr, 24, COPPER, copper)
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2
      for (let k = 0; k < 5; k++) {
        const t0 = (k / 5) * Math.PI * 0.46, t1 = ((k + 1) / 5) * Math.PI * 0.46
        const r0 = Math.cos(t0) * 8.2 + 0.25, r1 = Math.cos(t1) * 8.2 + 0.25
        const d0 = 0.03, d1 = 0.05
        q.quad([[cx + Math.sin(a - d0) * r0, 20.2 + Math.sin(t0) * 5.6, cz + Math.cos(a - d0) * r0], [cx + Math.sin(a + d0) * r0, 20.2 + Math.sin(t0) * 5.6, cz + Math.cos(a + d0) * r0],
          [cx + Math.sin(a + d1) * r1, 20.2 + Math.sin(t1) * 5.6, cz + Math.cos(a + d1) * r1], [cx + Math.sin(a - d1) * r1, 20.2 + Math.sin(t1) * 5.6, cz + Math.cos(a - d1) * r1]],
        [Math.sin(a) * Math.cos(t0), Math.sin(t0), Math.cos(a) * Math.cos(t0)], UV, RIB, copper)
      }
    }
    prism(q, cx, cz, 25.7, 27.8, 1.1, 10, shade(COPPER, 0.85), copper, 0.75)
    prism(q, cx, cz, 27.8, 29.6, 0.55, 8, GOLD, FIXED, 0.04)
  }
}

export function palaisGarnier(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => {
    front(q)
    mass(q)
  })
}
