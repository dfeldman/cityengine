/**
 * The shared building kit, one part per builder, so that every part has a PICTURE.
 *
 * MODELING_IMPROVEMENT_1.md §"The working vocabulary is five functions out of forty-five": the kit exports 45
 * building functions and nine modelling runs used five of them. `pediment` has never been used anywhere in the
 * project. The diagnosis there is that a name like `quoins` or `spireOn` or `faceOn` conveys nothing without a
 * picture, and no document showed what any of them draw.
 *
 * So each `kit_<functionName>` below draws ONE part, in isolation, on the smallest base that makes it read.
 * `tools/kit-shots.ts` photographs every one of them and `docs/KIT.md` is the catalogue they illustrate.
 *
 * Conventions used throughout, and worth copying:
 *  - the DEMO STAGE is a fixed little footprint, not the fit — a catalogue picture should not change size with
 *    the building it happens to be registered on.
 *  - the front is local −z, which is where the camera stands and which is the face `pane`, `archedPane`,
 *    `pediment` and `courtFacade` draw on. For the `parts.ts` helpers, whose heading 0 faces +z, that means
 *    `heading: Math.PI` — or, equivalently, `edgeAt(ring, 0).heading` on the stage ring below.
 */
import { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import type { Rgb } from '../../../models.ts'
import { tower, faceBand, towerRing, type Face, type Crown } from '../../tower.ts'
import {
  arcade, colonnade, quoins, cupola, spireOn, marquee, bladeSign, signText, bulbText,
  panelOn, stripRoof, roundRing, faceOn, edgeAt, sign, notch, vault, rake, deckCut, insetRing,
  stair, railing, arcStair, ramp, boxAlong,
} from '../../parts.ts'
import { capPolygon } from '../../../buildings.ts'
import {
  column, pediment, dome, pinnacle, turret, beam, windows, pane, archedPane, pointedPane, courtFacade, block,
} from '../../kit.ts'
import { classicalColumn, type ColumnOrder } from '../../column.ts'
import { facade } from '../../facade.ts'
import { saintsPeterAndPaul, oldSaintMarysCathedral } from '../districts/churches-1.ts'
import {
  church, gableRoof, gableEnd, crossFinial, roseWindow, lancet, lancetRow, buttress, flyingButtress,
  portal, bellNiche, curvedGable, spire, churchTower, apse, pagodaRoof,
} from '../../church.ts'

/** the demo stage: 9 m of frontage, 6 m deep, its front edge (index 0) at z = −3 facing −z */
type P2 = { x: number; z: number }

/** the demo stage: 9 m of frontage, 6 m deep, its front edge (index 0) at z = -3 facing -z */
const STAGE: Fit = { hx: 4.5, hz: 3, height: 7 }
const RING = towerRing(STAGE)
const FRONT = edgeAt(RING, 0)
/** the front wall's two ends, for the parts that take an edge as two points */
const A = FRONT.a
const B = FRONT.b
/** the plane of the front wall, for the `kit.ts` parts that take a z */
const Z = -STAGE.hz
const FACE_S = Math.PI

const STONE: Rgb = [0.86, 0.84, 0.78]
const TRIM: Rgb = [0.94, 0.93, 0.88]
const DARK: Rgb = [0.16, 0.17, 0.2]
const SLATE: Rgb = [0.34, 0.36, 0.4]
const COPPER: Rgb = [0.35, 0.55, 0.48]

/** a plain stone wall on the stage, for the parts that need something to sit on or against */
const stage = (out: MeshBuilder, h = 7, kind: Face['kind'] = 'blank'): void => {
  faceBand(out, RING, 0, h, { kind, wall: STONE, glass: DARK, pitch: 3, floor: 3.4, solid: 0.6, material: 'ashlar' })
}

/** a tower on a taller stage, so a face pattern or a crown has room to repeat */
const TALL: Fit = { hx: 6, hz: 5, height: 22 }
const facedTower = (out: MeshBuilder, face: Face): void => {
  tower(out, TALL, { height: 22, tiers: [{ to: 1, face }], roof: SLATE })
}
const crownedTower = (out: MeshBuilder, crown: Crown): void => {
  tower(out, TALL, {
    height: 18,
    tiers: [{ to: 1, face: { kind: 'punched', wall: STONE, glass: DARK, pitch: 3, floor: 3.4, solid: 0.6, material: 'ashlar' } }],
    roof: SLATE,
    crown,
  })
}

export const KIT_DEMO: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /* ---------------------------------------------------------------- ground floor */

  /** arcade(): round arches springing off columns along the front wall. */
  kit_arcade: (out) => {
    stage(out, 9)
    arcade(out, A, B, 0, 5.2, 4, { colour: STONE, material: 'ashlar', order: 'doric', tier: 'near', depth: 1.0 })
  },

  /** arcade({ piers: true }): the same arches on rectangular piers — a wall pierced by openings. */
  kit_arcade_piers: (out) => {
    stage(out, 9)
    arcade(out, A, B, 0, 5.2, 4, { colour: STONE, material: 'ashlar', piers: true, depth: 1.0 })
  },

  /**
   * arcade() vs colonnade(), same wall, same scale, same height — the one comparison the catalogue exists for.
   * LEFT half: an arcade, a wall pierced by round-headed openings. RIGHT half: a colonnade, free-standing posts
   * carrying a flat entablature in front of the wall.
   */
  kit_arcade_vs_colonnade: (out) => {
    const ring = towerRing({ hx: 11, hz: 3, height: 10 })
    const e = edgeAt(ring, 0)
    faceBand(out, ring, 0, 10, { kind: 'blank', wall: STONE, material: 'ashlar' })
    const mid = { x: 0, z: e.a.z }
    arcade(out, e.a, mid, 0, 6.5, 4, { colour: STONE, material: 'ashlar', order: 'doric', tier: 'near', depth: 1.0 })
    colonnade(out, mid, e.b, 0, 6.5, 4, { radius: 0.45, out: 1.4, colour: [0.9, 0.86, 0.8], order: 'doric', tier: 'near', material: 'ashlar' })
  },

  /**
   * arcade() called the way a model that has never seen it would call it: the six required arguments and an
   * empty options object. THIS IS THE HONEST DEFAULT — compare it with `kit_arcade` above.
   */
  kit_arcade_naive: (out) => {
    stage(out, 9)
    arcade(out, A, B, 0, 7, 5, {})
  },

  /** colonnade() with the minimum a model would plausibly write. Compare with `kit_colonnade`. */
  kit_colonnade_naive: (out) => {
    stage(out, 9)
    colonnade(out, A, B, 0, 7, 5, {})
  },

  /** colonnade(): a row of free-standing columns under an entablature, a giant order across a front. */
  kit_colonnade: (out) => {
    stage(out, 9)
    colonnade(out, A, B, 0, 7, 5, { radius: 0.5, out: 1.6, colour: STONE, order: 'corinthian', tier: 'near', material: 'ashlar' })
  },

  /** marquee(): a theatre's canopy out over the pavement, lit soffit, readerboard, chaser bulbs. */
  kit_marquee: (out) => {
    stage(out, 9)
    marquee(out, 0, 4.2, Z, 3.4, 2.2, 'ORPHEUM', { heading: FACE_S })
  },

  /** panelOn(): a flat board applied to one edge of the ring — shopfront, mural, spandrel. */
  kit_panelOn: (out) => {
    stage(out, 7)
    panelOn(out, RING, 0, 0.5, 3.5, 6, 2.4, [0.72, 0.18, 0.16], { out: 0.1 })
  },

  /* ---------------------------------------------------------------- facade */

  kit_face_punched: (out) => facedTower(out, { kind: 'punched', wall: STONE, glass: DARK, pitch: 3, floor: 3.4, solid: 0.55, material: 'ashlar' }),
  kit_face_punched_arched: (out) => facedTower(out, { kind: 'punched', wall: STONE, glass: DARK, pitch: 3, floor: 3.4, solid: 0.55, arched: true, material: 'ashlar' }),
  kit_face_curtain: (out) => facedTower(out, { kind: 'curtain', wall: [0.3, 0.32, 0.36], glass: [0.34, 0.45, 0.5], pitch: 1.6, floor: 3.4, material: 'metal' }),
  kit_face_fins: (out) => facedTower(out, { kind: 'fins', wall: [0.8, 0.78, 0.74], glass: DARK, pitch: 2.4, floor: 3.4, solid: 0.4, depth: 0.5, material: 'concrete' }),
  kit_face_bands: (out) => facedTower(out, { kind: 'bands', wall: [0.78, 0.76, 0.72], glass: [0.24, 0.3, 0.34], pitch: 3, floor: 3.4, solid: 0.4, material: 'concrete' }),
  kit_face_blank: (out) => facedTower(out, { kind: 'blank', wall: STONE, material: 'ashlar' }),
  kit_face_xbrace: (out) => facedTower(out, { kind: 'xbrace', wall: [0.12, 0.13, 0.15], glass: [0.62, 0.74, 0.8], pitch: 3, floor: 3.4, brace: 4, material: 'metal' }),
  kit_face_bays: (out) => facedTower(out, { kind: 'bays', wall: [0.9, 0.88, 0.82], glass: DARK, pitch: 3, floor: 3.4, solid: 0.5, bay: { depth: 0.9 }, material: 'clapboard' }),

  /** faceOn(): a DIFFERENT facade applied to one wall only, standing proud of it. */
  kit_faceOn: (out) => {
    stage(out, 10, 'blank')
    faceOn(out, RING, 0, 0, 10, { kind: 'punched', wall: [0.7, 0.3, 0.22], glass: DARK, pitch: 2.2, floor: 3.2, solid: 0.5, arched: true, material: 'brick' }, 0.35)
  },

  /** quoins(): alternating long and short corner blocks up both front corners. */
  kit_quoins: (out) => {
    stage(out, 9)
    quoins(out, A, FACE_S, 0, 9, TRIM)
    quoins(out, B, FACE_S, 0, 9, TRIM)
  },

  /** windows(): a row of dark panes, one per bay, along a span of one face. */
  kit_windows: (out) => {
    stage(out, 7)
    windows(out, '-z', Z, -4.2, 4.2, 1.6, 1.3, 2.4, 1.8, DARK, TRIM)
    windows(out, '-z', Z, -4.2, 4.2, 4.6, 1.3, 1.9, 1.8, DARK, TRIM)
  },

  /** pane(): ONE flat rectangle on a face, a few centimetres proud of it. */
  kit_pane: (out) => {
    stage(out, 7)
    pane(out, '-z', Z, 0, 2, 3.2, 3, DARK)
  },

  /** archedPane(): a round-headed opening — a rectangle with a half-disc on top. */
  kit_archedPane: (out) => {
    stage(out, 7)
    archedPane(out, Z, 0, 1.4, 3, 4.6, DARK)
  },

  /** pointedPane(): a Gothic opening — a rectangle under a triangle. */
  kit_pointedPane: (out) => {
    stage(out, 7)
    pointedPane(out, Z, 0, 1.4, 3, 4.8, DARK)
  },

  /** courtFacade(): a whole ornate classical wall — bays, pilasters, pedimented windows, cornice, lucarnes. */
  kit_courtFacade: (out) => {
    courtFacade(out, 26, 15, { stone: STONE, trim: TRIM, dark: DARK, reliefs: true, lucarnes: true, passage: true })
  },

  /* ---------------------------------------------------------------- roof and crown */

  kit_crown_parapet: (out) => crownedTower(out, { kind: 'parapet', height: 1.6, colour: SLATE, material: 'ashlar' }),
  kit_crown_hip: (out) => crownedTower(out, { kind: 'hip', height: 3.5, inset: 1.2, colour: SLATE, material: 'tile' }),
  kit_crown_mansard: (out) => crownedTower(out, { kind: 'mansard', height: 4.5, inset: 1.6, colour: SLATE, material: 'tile', dormers: 4 }),
  kit_crown_pyramid: (out) => crownedTower(out, { kind: 'pyramid', height: 6, colour: SLATE, material: 'tile' }),
  kit_crown_spire: (out) => crownedTower(out, { kind: 'spire', height: 12, inset: 1.5, colour: SLATE, material: 'tile' }),
  kit_crown_dome: (out) => crownedTower(out, { kind: 'dome', height: 6, radius: 5, drum: 2.5, colour: COPPER, material: 'copper' }),
  kit_crown_lantern: (out) => crownedTower(out, {
    kind: 'lantern', height: 5, inset: 3,
    face: { kind: 'punched', wall: TRIM, glass: DARK, pitch: 1.6, floor: 5, solid: 0.45, arched: true, material: 'ashlar' },
    cap: { kind: 'dome', height: 3, colour: COPPER, material: 'copper' },
  }),
  kit_crown_stepped: (out) => crownedTower(out, { kind: 'stepped', steps: 4, height: 7, inset: 1.1, material: 'ashlar' }),
  kit_crown_mast: (out) => crownedTower(out, { kind: 'mast', height: 11, colour: SLATE, width: 0.9, material: 'metal' }),
  kit_crown_sawtooth: (out) => crownedTower(out, { kind: 'sawtooth', height: 2.6, pitch: 2, colour: TRIM, material: 'ashlar' }),
  kit_crown_spires: (out) => crownedTower(out, { kind: 'spires', height: 9, n: 4, radius: 0.7, colour: TRIM, material: 'ashlar' }),
  kit_crown_sliced: (out) => crownedTower(out, { kind: 'sliced', height: 7, colour: SLATE, material: 'metal' }),

  /** cupola(): an octagonal drum with windows, a dome on it and a lantern — on a point, not a footprint. */
  kit_cupola: (out) => {
    stage(out, 7)
    cupola(out, { x: 0, z: 0 }, 7, 2.6, { drum: 4, dome: 3, colour: STONE, domeColour: COPPER, lantern: true })
  },

  /** spireOn(): a bell tower or campanile standing on ONE point of the building. */
  kit_spireOn: (out) => {
    stage(out, 7)
    spireOn(out, { x: -2.2, z: 0 }, 7, 1.8, 7, 7, { colour: STONE, spireColour: SLATE, sides: 4, belfry: true })
  },

  /** stripRoof(): a pitched/hipped roof over a long strip, where an inset ring would collapse. */
  kit_stripRoof: (out) => {
    stage(out, 6)
    stripRoof(out, RING, 6, 2.6, [0.55, 0.3, 0.24], 'tile')
  },

  /** dome(): a free-standing hemisphere of stacked rings, with ribs. */
  kit_dome: (out) => {
    block(out, -5, 5, -5, 5, 0, 4, STONE)
    dome(out, 0, 0, 4, 4.6, 5.5, COPPER, 16, TRIM)
  },

  /** pinnacle(): a slim Gothic shaft with a tall pointed cap, in a row along a parapet. */
  kit_pinnacle: (out) => {
    stage(out, 7)
    for (const x of [-3.4, -1.1, 1.1, 3.4]) {
      pinnacle(out, x, Z + 0.4, 7, 5, 1.1, TRIM)
    }
  },

  /** turret(): a round drum carried out from a wall on a corbel cone, with a pointed roof. */
  kit_turret: (out) => {
    stage(out, 10)
    turret(out, -4.5, -3, 4, 10, 1.8, 4.5, STONE, SLATE)
    turret(out, 4.5, -3, 4, 10, 1.8, 4.5, STONE, SLATE)
  },

  /** roundRing(): the same footprint with its corners rounded — a prow, a drum, a 1960s tower's ends. */
  kit_roundRing: (out) => {
    faceBand(out, roundRing(RING, 2.4, 5), 0, 10, { kind: 'bands', wall: [0.9, 0.88, 0.84], glass: [0.26, 0.3, 0.34], pitch: 2.4, floor: 3.2, solid: 0.42, material: 'concrete' })
  },

  /* ---------------------------------------------------------------- signs and shopfronts */

  /*
   * sign(): a real typeface on ONE QUAD with an alpha channel — two triangles whatever the word, and the
   * call to reach for FIRST for any name on a building. Placed on an edge of the ring, so a builder gives
   * the text, the type, the edge and the cap height and nothing else. (See render/landmarks/signage.ts.)
   */

  /** sign({ type: 'flat' }): the default. A grotesque applied to the wall. */
  kit_sign_flat: (out) => {
    stage(out, 7)
    sign(out, { type: 'flat', text: 'EMPORIUM', h: 0.8, face: 'grotesque', colour: DARK, lit: 'none' },
      { ring: RING, edge: 0, y: 4.6 })
  },

  /** sign({ face: 'script' }): a formal script in a colour — the department-store signature (macy's). */
  kit_sign_script: (out) => {
    stage(out, 7)
    sign(out, { type: 'flat', text: '\u2605 macy\u2019s', h: 1.3, face: 'script', colour: [0.78, 0.09, 0.11], lit: 'front' },
      { ring: RING, edge: 0, y: 4.4 })
  },

  /** sign({ face: 'engraved', tracking }): letterspaced engraved capitals, cut into stone (SAKS FIFTH AVENUE). */
  kit_sign_engraved: (out) => {
    stage(out, 7)
    // `w` where the name must fit the wall rather than the wall follow the name
    sign(out, { type: 'flat', text: 'SAKS FIFTH AVENUE', h: 0.42, face: 'engraved', tracking: 0.22,
      w: 7.6, colour: [0.24, 0.22, 0.2], lit: 'front' }, { ring: RING, edge: 0, y: 4.9 })
  },

  /** sign({ face: 'roman' }): a classical roman capital, letterspaced (NEIMAN MARCUS). */
  kit_sign_roman: (out) => {
    stage(out, 7)
    sign(out, { type: 'flat', text: 'NEIMAN MARCUS', h: 0.55, face: 'roman', tracking: 0.12,
      colour: [0.16, 0.15, 0.14], lit: 'back' }, { ring: RING, edge: 0, y: 4.8 })
  },

  /** sign({ panel }): a backing panel behind the letters — a box sign on a stadium (CHASE CENTER). */
  kit_sign_panel: (out) => {
    stage(out, 7)
    sign(out, { type: 'flat', text: 'CHASE CENTER', h: 0.62, face: 'block', colour: [0.97, 0.97, 0.98],
      panel: [0.05, 0.22, 0.45], lit: 'self' }, { ring: RING, edge: 0, y: 4.6 })
  },

  /** sign({ halo }): an outline round the letters, which is what makes pale letters read on a pale wall. */
  kit_sign_halo: (out) => {
    stage(out, 7)
    sign(out, { type: 'flat', text: 'PALACE', h: 1.0, face: 'didone', colour: [0.97, 0.95, 0.9],
      halo: [0.15, 0.12, 0.1], lit: 'none' }, { ring: RING, edge: 0, y: 4.5 })
  },

  /** sign({ vertical }): stacked letters down a blade — an old theatre or hotel. */
  kit_sign_vertical: (out) => {
    stage(out, 12)
    sign(out, { type: 'flat', text: 'HOTEL', h: 0.9, face: 'condensed', colour: [0.98, 0.9, 0.5],
      panel: [0.09, 0.1, 0.14], vertical: true, lit: 'self' }, { ring: RING, edge: 0, y: 7.6, along: 0.22 })
  },

  /** sign({ face: 'slab' }): a slab serif, the industrial name on a warehouse or a railway company. */
  kit_sign_slab: (out) => {
    stage(out, 7)
    sign(out, { type: 'flat', text: 'PACIFIC FREIGHT Co.', h: 0.5, face: 'slab', colour: [0.86, 0.84, 0.78],
      panel: [0.35, 0.16, 0.13], lit: 'none' }, { ring: RING, edge: 0, y: 4.6 })
  },

  /** signText(): block letters painted or applied on a wall. */
  kit_signText: (out) => {
    stage(out, 7)
    signText(out, 'HOTEL', 0, 4.6, Z - 0.05, 2.2, [0.85, 0.2, 0.18], { heading: FACE_S })
  },

  /** signText({ lit: true }): the same letters, emitting — a neon sign after dark. */
  kit_signText_lit: (out) => {
    stage(out, 7)
    signText(out, 'BAR', 0, 4.4, Z - 0.05, 2.1, [1, 0.35, 0.3], { lit: true, heading: FACE_S })
  },

  /** bulbText(): the letters spelled out in light bulbs on a steel frame (Ghirardelli). */
  kit_bulbText: (out) => {
    stage(out, 7)
    bulbText(out, 'GHIRARDELLI', 0, 9.5, Z, 0.5, { heading: FACE_S, lit: true })
  },

  /** bladeSign(): the tall vertical board out from a facade, lit letters down both faces. */
  kit_bladeSign: (out) => {
    stage(out, 14)
    bladeSign(out, -2.6, 13, Z, 9, 'WARFIELD', { heading: FACE_S })
  },

  /* ---------------------------------------------------------------- classical elements */

  /** column(): the kit's thin wrapper on the classical primitive. */
  kit_column: (out) => {
    for (const x of [-2.4, 0, 2.4]) column(out, x, 0, 0, 9, 0.62, STONE, { order: 'ionic', tier: 'near', heading: FACE_S })
  },

  kit_classicalColumn_tuscan: (out) => classicalColumn(out, 0, 0, 0, 9, 0.7, STONE, { order: 'tuscan', tier: 'near', heading: FACE_S, trim: TRIM }),
  kit_classicalColumn_doric: (out) => classicalColumn(out, 0, 0, 0, 9, 0.7, STONE, { order: 'doric', tier: 'near', heading: FACE_S, flutes: true, trim: TRIM }),
  kit_classicalColumn_ionic: (out) => classicalColumn(out, 0, 0, 0, 9, 0.7, STONE, { order: 'ionic', tier: 'near', heading: FACE_S, flutes: true, trim: TRIM }),
  kit_classicalColumn_corinthian: (out) => classicalColumn(out, 0, 0, 0, 9, 0.7, STONE, { order: 'corinthian', tier: 'near', heading: FACE_S, flutes: true, trim: TRIM }),

  /** pediment(): the triangular gable over a portico. */
  kit_pediment: (out) => {
    stage(out, 7)
    for (const x of [-3.6, -1.2, 1.2, 3.6]) column(out, x, Z - 1.4, 0, 7, 0.5, STONE, { order: 'doric', tier: 'near', heading: FACE_S })
    block(out, -4.6, 4.6, Z - 2.2, Z - 0.6, 7, 8.2, TRIM)
    pediment(out, -4.9, 4.9, Z - 2.3, 8.2, 2.6, 1.8, TRIM)
  },

  /** beam(): a square tube between any two points — a steel member, a truss, a tie. */
  kit_beam: (out) => {
    for (const s of [-1, 1]) {
      beam(out, [s * 4, 0, 0], [s * 4, 9, 0], 0.32, SLATE)
      beam(out, [s * 4, 0, 0], [-s * 4, 9, 0], 0.2, SLATE)
    }
    beam(out, [-4, 9, 0], [4, 9, 0], 0.32, SLATE)
    beam(out, [-4, 9, 0], [0, 12, 0], 0.26, SLATE)
    beam(out, [4, 9, 0], [0, 12, 0], 0.26, SLATE)
  },

  /* ---------------------------------------------------------------- facade(), the slot API */

  /**
   * facade(): an arcaded base under a punched shaft — Leidesdorff Place's pattern, the building seven of nine
   * runs drew as a box. The arcade is a SLOT, so it had to be decided rather than forgotten.
   */
  kit_facade_arcaded: (out) => {
    facade(out, BLOCK, {
      ground: { kind: 'arcade', arches: 5, storeys: 2, order: 'doric', material: 'granite' },
      shaft: { storeys: 6, windows: 'balanced', material: 'terracotta' },
      top: { kind: 'arcaded', storeys: 1, material: 'terracotta' },
      bands: { aboveGround: 'string', belowTop: 'string', top: 'cornice' },
      crown: { kind: 'parapet', height: 1.4, colour: [0.8, 0.78, 0.72], material: 'ashlar' },
      frame: null,
      entrance: { at: 'centre', kind: 'portal', steps: 2 },
      material: 'terracotta',
    })
  },

  /**
   * facade() with `shaft: null` — a temple: the colonnade IS nearly the whole building (the Pacific Exchange,
   * 301 Pine, 16 m). A mandatory shaft is exactly what forced earlier runs to invent a punched middle here.
   */
  kit_facade_temple: (out) => {
    facade(out, { hx: 13, hz: 9, height: 16 }, {
      ground: { kind: 'portico', columns: 6, storeys: 4, order: 'corinthian', pediment: true, steps: 5, projecting: true, material: 'marble' },
      shaft: null,
      top: null,
      bands: { aboveGround: null, belowTop: null, top: 'cornice' },
      crown: { kind: 'parapet', height: 1.2, colour: [0.9, 0.89, 0.85], material: 'ashlar' },
      frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 0 },
      material: 'limestone',
    })
  },

  /**
   * facade() with a FRAME: stone corner piers and a deep top band, the curtain wall recessed in shadow behind
   * them — the ICA pattern (345 Montgomery), the hardest building on the list and the one eight of nine missed.
   */
  kit_facade_framed: (out) => {
    facade(out, { hx: 10, hz: 10, height: 26 }, {
      ground: { kind: 'recessed', storeys: 1, depth: 1.4, material: 'dark-stone' },
      shaft: { storeys: 6, windows: 'continuous', material: 'glass' },
      top: null,
      bands: { aboveGround: null, belowTop: null, top: null },
      crown: { kind: 'flat' },
      frame: {
        verticals: { kind: 'pier', width: 3.4, at: 'corners' },
        horizontals: { top: 1.6, base: 0.8 },
        recess: 1.2,
        material: 'granite',
      },
      entrance: { at: 'centre', kind: 'recessed', steps: 2 },
      material: 'granite',
    })
  },

  /** facade() at its plainest: every slot null but the shaft — and that is an honest, unembarrassing answer. */
  kit_facade_plain: (out) => {
    facade(out, BLOCK, {
      ground: null,
      shaft: { storeys: 9, windows: 'balanced', material: null },
      top: null,
      bands: null,
      crown: null,
      frame: null,
      entrance: null,
      material: 'precast',
    })
  },

  /**
   * facade() with a STOOP on the entrance slot: `entrance: { ..., stoop: { height: 1.4, splay: 0.4 } }`, which
   * is the same `stair()` the studies above use, driven from the door's height above the pavement. The one
   * optional key in the spec, default off, so none of the ~400 existing builders changes.
   */
  kit_facade_stoop: (out) => {
    facade(out, BLOCK, {
      ground: { kind: 'rusticated', storeys: 2, material: 'granite' },
      shaft: { storeys: 6, windows: 'dressed', material: 'brick' },
      top: null,
      bands: { aboveGround: 'string', belowTop: null, top: 'bracketed' },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'portal', steps: 0, stoop: { height: 1.4, splay: 0.4, rail: 'both' } },
      material: 'brick',
    })
  },

  /** facade() with a neoclassical frame: engaged pilasters of an order, over a rusticated base. */
  kit_facade_pilastered: (out) => {
    facade(out, BLOCK, {
      ground: { kind: 'rusticated', storeys: 2, material: 'granite' },
      shaft: { storeys: 5, windows: 'balanced', material: 'limestone' },
      top: { kind: 'attic', storeys: 1, material: 'limestone' },
      bands: { aboveGround: 'cornice', belowTop: 'string', top: 'bracketed' },
      crown: { kind: 'parapet', height: 1.2, colour: [0.86, 0.84, 0.78], material: 'ashlar' },
      frame: { verticals: { kind: 'pilaster', width: 1.3, at: 'bays', order: 'ionic', count: 6 }, horizontals: null, recess: 0.35, material: 'limestone' },
      entrance: { at: 'centre', kind: 'portal', steps: 3 },
      material: 'limestone',
    })
  },

  /**
   * facade() on a NON-RECTANGULAR plan: a chamfered corner, with the colonnade on `on: 'street'` so it runs
   * along both street elevations and stops at the party walls. Every slot is placed per EDGE of the ring.
   */
  kit_facade_corner: (out) => {
    facade(out, CHAMFERED, {
      ground: { kind: 'colonnade', columns: 6, storeys: 2, order: 'ionic', on: 'street', material: 'granite' },
      shaft: { storeys: 6, windows: 'wide', material: 'terracotta' },
      top: { kind: 'glazed', storeys: 1, material: 'glass' },
      bands: { aboveGround: 'cornice', belowTop: 'string', top: 'cornice' },
      crown: { kind: 'parapet', height: 1.2, colour: [0.84, 0.82, 0.76], material: 'ashlar' },
      frame: null,
      entrance: { at: 'corner', kind: 'door', steps: 1 },
      material: 'terracotta',
    })
  },

  /**
   * NEOCLASSICAL 1 — a GIANT ORDER over a windowed wall: a bank or a courthouse, columns four storeys tall
   * with ordinary offices behind and above them. The thing `colonnade` could not say, because a colonnade
   * stands against a BLANK wall.
   */
  kit_facade_giant_order: (out) => {
    facade(out, { hx: 13, hz: 9, height: 30 }, {
      ground: { kind: 'giant-order', columns: 6, storeys: 4, order: 'corinthian', windows: 'balanced',
        engaged: false, flanks: false, pediment: false, material: 'limestone' },
      shaft: { storeys: 3, windows: 'small', material: 'limestone' },
      top: { kind: 'attic', storeys: 1, material: 'limestone' },
      bands: { aboveGround: null, belowTop: 'string', top: 'dentil' },
      crown: { kind: 'balustrade', height: 2, colour: [0.86, 0.84, 0.78], material: 'ashlar' },
      frame: null,
      entrance: { at: 'centre', kind: 'portal', steps: 4 },
      material: 'limestone',
    })
  },

  /**
   * NEOCLASSICAL 2 — the same order IN ANTIS (`flanks: true`) and ENGAGED: the columns recessed between two
   * solid end blocks, flat against the wall. This is the Pacific Exchange's move, and an enormous number of
   * 1910s–30s banks.
   */
  kit_facade_in_antis: (out) => {
    facade(out, { hx: 13, hz: 9, height: 20 }, {
      ground: { kind: 'giant-order', columns: 6, storeys: 4, order: 'doric', windows: 'small',
        engaged: true, flanks: true, pediment: false, material: 'granite' },
      shaft: null,
      top: { kind: 'attic', storeys: 1, material: 'granite' },
      bands: { aboveGround: null, belowTop: null, top: 'cornice' },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'portal', steps: 5 },
      material: 'granite',
    })
  },

  /**
   * NEOCLASSICAL 3 — AEDICULES: every window of the piano nobile with a moulded architrave, a cornice on
   * brackets and a little triangular gable. `windows: 'segmental'` gives the curved version, `'dressed'` the
   * surround without a gable. The US Appraisers Building's principal storeys.
   */
  kit_facade_aedicules: (out) => {
    facade(out, BLOCK, {
      ground: { kind: 'rusticated', storeys: 2, material: 'granite' },
      shaft: { storeys: 4, windows: 'pedimented', material: 'limestone' },
      top: { kind: 'attic', storeys: 2, material: 'limestone' },
      bands: { aboveGround: 'cornice', belowTop: 'string', top: 'modillion' },
      crown: { kind: 'balustrade', height: 1.8, colour: [0.86, 0.84, 0.78], material: 'ashlar' },
      frame: null,
      entrance: { at: 'centre', kind: 'portal', steps: 3 },
      material: 'limestone',
    })
  },

  /** NEOCLASSICAL 4 — the segmental aedicule, and QUOINS as a frame: the classical corner, no recess. */
  kit_facade_quoins: (out) => {
    facade(out, BLOCK, {
      ground: { kind: 'rusticated', storeys: 1, material: 'sandstone' },
      shaft: { storeys: 6, windows: 'segmental', material: 'sandstone' },
      top: { kind: 'attic', storeys: 1, material: 'sandstone' },
      bands: { aboveGround: 'string', belowTop: 'string', top: 'dentil' },
      crown: { kind: 'balustrade', height: 1.6, colour: [0.8, 0.72, 0.6], material: 'ashlar' },
      frame: { verticals: { kind: 'quoins', width: 1, at: 'corners' }, horizontals: null, recess: 0, material: 'limestone' },
      entrance: { at: 'centre', kind: 'door', steps: 2 },
      material: 'sandstone',
    })
  },

  /** NEOCLASSICAL 5 — a balustrade on its own, so the crown can be seen without anything else in the way. */
  kit_crown_balustrade: (out) => crownedTower(out, { kind: 'balustrade', height: 2.2, colour: [0.88, 0.86, 0.8], material: 'ashlar' }),

  /**
   * NEOCLASSICAL 6 — the THREE FRIEZES side by side on one entablature height: Doric triglyphs, Ionic
   * dentils, Corinthian modillions. `colonnade()` now picks its own from the order unless told otherwise;
   * these are what a rider distinguishes the orders by at street distance, where a capital is a smudge.
   */
  kit_friezes: (out) => {
    const orders: ColumnOrder[] = ['doric', 'ionic', 'corinthian']
    orders.forEach((o, i) => {
      const z = -3
      const x0 = -9.6 + i * 6.4
      colonnade(out, { x: x0, z }, { x: x0 + 5.8, z }, 0, 6.5, 3,
        { radius: 0.4, out: 1, colour: STONE, material: 'ashlar', order: o, tier: 'near', entablature: 1.5 })
    })
  },

  /* ---------------------------------------------------------------- the church kit (church.ts) */

  /*
   * Everything below is drawn FACING +z and turned onto a heading — the parts.ts convention. The demo wall's
   * front edge is index 0 of CH_RING, whose heading is Math.PI (it faces −z, at the camera).
   */

  /** gableRoof(): a pitched roof over a box, its ridge along z — the nave's own roof. */
  kit_church_gableRoof: (out) => {
    faceBand(out, CH_RING, 0, 6, { kind: 'blank', wall: STONE, material: 'ashlar' })
    gableRoof(out, -6.3, 6.3, -9.3, 9.3, 6, 4.4, SLATE, 'tile')
  },

  /** gableRoof({ hip: true }): the same roof with both ends pulled in — no gable to close. */
  kit_church_gableRoof_hip: (out) => {
    faceBand(out, CH_RING, 0, 6, { kind: 'blank', wall: STONE, material: 'ashlar' })
    gableRoof(out, -6.3, 6.3, -9.3, 9.3, 6, 4.4, SLATE, 'tile', true)
  },

  /** gableEnd(): the triangular wall that closes a gable, with its raking eaves trim, and a cross on the apex. */
  kit_church_gableEnd: (out) => {
    faceBand(out, CH_RING, 0, 6, { kind: 'blank', wall: STONE, material: 'ashlar' })
    gableRoof(out, -6.3, 6.3, -9.3, 9.3, 6, 4.4, SLATE, 'tile')
    gableEnd(out, { x: 0, z: -9.05 }, Math.PI, 6.3, 6, 4.4, STONE, 'ashlar', TRIM)
    crossFinial(out, { x: 0, z: -9 }, 10.4, 1.6, TRIM)
  },

  /** crossFinial(): two crossed slabs, so it reads from every side. On a ridge, a gable or a tower. */
  kit_church_crossFinial: (out) => {
    faceBand(out, CH_RING, 0, 6, { kind: 'blank', wall: STONE, material: 'ashlar' })
    crossFinial(out, { x: 0, z: 0 }, 6, 3.2, TRIM)
  },

  /** roseWindow(): the detail that says "church" at two hundred metres. Left rose, middle wheel, right medallion. */
  kit_church_roseWindow: (out) => {
    faceBand(out, CH_RING, 0, 10, { kind: 'blank', wall: STONE, material: 'ashlar' })
    roseWindow(out, { x: -4, z: -6.04 }, Math.PI, 6, 1.7, TRIM, { spokes: 8 })
    roseWindow(out, { x: 0, z: -6.04 }, Math.PI, 6, 1.7, TRIM, { spokes: 12, wheel: true })
    roseWindow(out, { x: 4, z: -6.04 }, Math.PI, 6, 1.35, TRIM, { spokes: 2, surround: true })
  },

  /** lancet(): one window, pointed / round / square head. The +z counterpart of pointedPane and archedPane. */
  kit_church_lancet: (out) => {
    faceBand(out, CH_RING, 0, 9, { kind: 'blank', wall: STONE, material: 'ashlar' })
    lancet(out, { x: -3.6, z: -6.04 }, Math.PI, 2, 1.5, 4.6, 'pointed', TRIM)
    lancet(out, { x: 0, z: -6.04 }, Math.PI, 2, 1.5, 4.6, 'round', TRIM)
    lancet(out, { x: 3.6, z: -6.04 }, Math.PI, 2, 1.5, 4.6, 'square', TRIM)
  },

  /** lancetRow(): one window per BAY along an edge — how a flank gets its rhythm from `nave.bays`. */
  kit_church_lancetRow: (out) => {
    faceBand(out, CH_RING, 0, 9, { kind: 'blank', wall: STONE, material: 'ashlar' })
    lancetRow(out, { x: -6, z: -6.06 }, { x: 6, z: -6.06 }, 2, 1.4, 4.4, 5, 'pointed', TRIM)
  },

  /** buttress(): plain (left) and stepped (right), each with its weathered cap. */
  kit_church_buttress: (out) => {
    faceBand(out, CH_RING, 0, 9, { kind: 'blank', wall: STONE, material: 'ashlar' })
    buttress(out, { x: -3, z: -6 }, Math.PI, 0, 8, 1.3, 1.2, 'plain', STONE, 'ashlar')
    buttress(out, { x: 3, z: -6 }, Math.PI, 0, 8, 1.3, 1.2, 'stepped', STONE, 'ashlar')
  },

  /** flyingButtress(): a pier out from the aisle wall and an arch bar back up to the nave wall. */
  kit_church_flyingButtress: (out) => {
    faceBand(out, CH_RING, 0, 6, { kind: 'blank', wall: STONE, material: 'ashlar' })
    faceBand(out, [{ x: -3, z: -3 }, { x: 3, z: -3 }, { x: 3, z: 3 }, { x: -3, z: 3 }], 0, 12, { kind: 'blank', wall: STONE, material: 'ashlar' })
    flyingButtress(out, { x: 0, z: -6 }, Math.PI, 0, 6.5, 3, 10.5, 1.2, STONE, 'ashlar')
  },

  /** portal(): a recessed arch in receding orders of moulding, on steps. Left pointed, right round. */
  kit_church_portal: (out) => {
    faceBand(out, CH_RING, 0, 10, { kind: 'blank', wall: STONE, material: 'ashlar' })
    portal(out, { x: -3.4, z: -6.02 }, Math.PI, 3.6, 6.2, 'pointed', TRIM, { orders: 4, steps: 4 })
    portal(out, { x: 3.4, z: -6.02 }, Math.PI, 3.6, 6.2, 'round', TRIM, { orders: 3, steps: 4 })
  },

  /** bellNiche(): a round-headed recess with a bell in it — the mission front's only ornament. */
  kit_church_bellNiche: (out) => {
    faceBand(out, CH_RING, 0, 10, { kind: 'blank', wall: [0.9, 0.88, 0.83], material: 'stucco' })
    bellNiche(out, { x: -2.2, z: -6.06 }, Math.PI, 4, 1.8, 2.8, [0.95, 0.94, 0.9])
    bellNiche(out, { x: 2.2, z: -6.06 }, Math.PI, 4, 1.8, 2.8, [0.95, 0.94, 0.9])
  },

  /** curvedGable(): the shouldered Spanish-colonial gable, built from flat courses so no wall is curved. */
  kit_church_curvedGable: (out) => {
    faceBand(out, CH_RING, 0, 8, { kind: 'blank', wall: [0.9, 0.88, 0.83], material: 'stucco' })
    curvedGable(out, { x: 0, z: -6 }, Math.PI, 6, 8, 4.5, [0.9, 0.88, 0.83], 'stucco')
  },

  /** spire(): a tapering spire with a ring of corner pinnacles at its foot. */
  kit_church_spire: (out) => {
    faceBand(out, [{ x: -2.2, z: -2.2 }, { x: 2.2, z: -2.2 }, { x: 2.2, z: 2.2 }, { x: -2.2, z: 2.2 }], 0, 9,
      { kind: 'blank', wall: STONE, material: 'ashlar' })
    spire(out, { x: 0, z: 0 }, 9, 2.3, 11, 8, SLATE, 'tile', 4)
  },

  /** churchTower(): five stages, string courses, an open belfry and a steeple. The kit's own tower. */
  kit_church_churchTower: (out) => {
    churchTower(out, { x: 0, z: 0 }, 0, 2.6, 5, 4.2, 'steeple', 'square',
      { wall: STONE, material: 'ashlar', roof: SLATE, roofMaterial: 'tile', trim: TRIM })
  },

  /** churchTower({ top: 'parapet' }): the flat-topped brick tower with corner pinnacles — Old Saint Mary's. */
  kit_church_churchTower_parapet: (out) => {
    churchTower(out, { x: 0, z: 0 }, 0, 2.6, 5, 4.2, 'parapet', 'square',
      { wall: [0.52, 0.28, 0.23], material: 'brick', roof: SLATE, roofMaterial: 'tile', trim: [0.72, 0.68, 0.6] })
  },

  /** churchTower({ top: 'lantern' }): the open cupola of a Spanish-colonial bell tower. */
  kit_church_churchTower_lantern: (out) => {
    churchTower(out, { x: 0, z: 0 }, 0, 2.4, 4, 4.2, 'lantern', 'square',
      { wall: [0.92, 0.9, 0.86], material: 'stucco', roof: [0.5, 0.3, 0.22], roofMaterial: 'tile', trim: [0.97, 0.96, 0.93] })
  },

  /** apse(): a half-octagon sanctuary with a window in each facet and a conical roof — round, and flat-walled. */
  kit_church_apse: (out) => {
    faceBand(out, [{ x: -5, z: -6 }, { x: 5, z: -6 }, { x: 5, z: 0 }, { x: -5, z: 0 }], 0, 9,
      { kind: 'blank', wall: STONE, material: 'ashlar' })
    apse(out, { x: 0, z: 0 }, 0, 5, 0, 9, STONE, 'ashlar', SLATE, 'tile', 'lancet')
  },

  /** pagodaRoof(): NOT part of church(). A tiered temple roof, placed by hand on a facade() street building. */
  kit_church_pagodaRoof: (out) => {
    facade(out, TEMPLE, {
      ground: { kind: 'shopfronts', bays: 3, storeys: 1, material: 'brick' },
      shaft: { storeys: 2, windows: 'balanced', material: 'brick' },
      // `recessed` is a GROUND kind, not a TOP kind; a set-back top storey is `setback` (facade.ts `Top`)
      top: { kind: 'setback', storeys: 1, by: 1.4, material: 'brick' },
      bands: { aboveGround: 'string', belowTop: 'cornice', top: null },
      crown: null, frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 1 },
      material: 'brick',
    })
    pagodaRoof(out, towerRing(TEMPLE), TEMPLE.height, 2, [0.55, 0.22, 0.16], [0.86, 0.3, 0.2], 'tile')
  },

  /* ---- whole churches, in slots ---- */

  /** CHURCH 1 — Gothic: twin front towers with spires, aisles, flying buttresses, a rose and a triple portal. */
  kit_church_gothic: (out) => {
    church(out, CHURCH, {
      nave: { bays: 5, storeys: 2, roof: 'gable', pitch: 'steep' },
      aisles: { roof: 'lean-to' },
      transept: { ends: 'projecting' },
      chancel: { kind: 'apse' },
      tower: { at: 'twin', stages: 5, plan: 'square', top: 'spire' },
      front: { kind: 'gable', portal: 'triple', window: 'rose', steps: 4 },
      walls: { material: 'limestone', openings: 'lancet', buttresses: 'flying' },
    })
  },

  /** CHURCH 2 — the single square brick tower on the front, flat-topped: Old Saint Mary's massing. */
  kit_church_brick: (out) => {
    church(out, CHURCH, {
      nave: { bays: 5, storeys: 1, roof: 'gable', pitch: 'low' },
      aisles: null,
      transept: null,
      chancel: { kind: 'square' },
      tower: { at: 'front-centre', stages: 5, plan: 'square', top: 'parapet' },
      front: { kind: 'gable', portal: 'single', window: 'none', steps: 5 },
      walls: { material: 'brick', openings: 'lancet', buttresses: 'stepped' },
    })
  },

  /** CHURCH 3 — Spanish-colonial: a curved gable, a medallion, twin lantern towers, stucco. */
  kit_church_baroque: (out) => {
    church(out, CHURCH, {
      nave: { bays: 4, storeys: 1, roof: 'gable', pitch: 'low' },
      aisles: { roof: 'flat' },
      transept: null,
      chancel: { kind: 'square' },
      tower: { at: 'twin', stages: 4, plan: 'square', top: 'lantern' },
      front: { kind: 'baroque', portal: 'single', window: 'medallion', steps: 6 },
      walls: { material: 'stucco', openings: 'round', buttresses: 'none' },
    })
  },

  /** CHURCH 4 — mission: a flat stuccoed parapet with bell niches, no tower and no spire at all. */
  kit_church_mission: (out) => {
    church(out, CHURCH, {
      nave: { bays: 4, storeys: 1, roof: 'gable', pitch: 'low' },
      aisles: null,
      transept: null,
      chancel: { kind: 'square' },
      tower: null,
      front: { kind: 'mission', portal: 'single', window: 'oculus', steps: 3 },
      walls: { material: 'stucco', openings: 'round', buttresses: 'plain' },
    })
  },

  /** CHURCH 5 — a basilica: a classical pediment on the gable, round-headed windows, a crossing dome. */
  kit_church_basilica: (out) => {
    church(out, CHURCH, {
      nave: { bays: 5, storeys: 1, roof: 'gable', pitch: 'low' },
      aisles: { roof: 'lean-to' },
      transept: { ends: 'flush' },
      chancel: { kind: 'apse' },
      tower: { at: 'crossing', stages: 3, plan: 'octagon', top: 'dome' },
      front: { kind: 'pediment', portal: 'porch', window: 'oculus', steps: 5 },
      walls: { material: 'sandstone', openings: 'round', buttresses: 'none' },
    })
  },


  /* ---- the two real buildings, and what facade() can say about the same ones ---- */

  /**
   * BEFORE — Old Saint Mary's as `facade()` can say it: the best a slot facade can do with an 1854 brick
   * cathedral. It is not a bad facade; it is a building of the wrong KIND. There is no gable, no tower and no
   * portal, because `facade()` has no word for any of them.
   */
  kit_church_before_stmarys: (out) => {
    facade(out, STMARYS, {
      ground: { kind: 'plain', storeys: 1, material: 'granite' },
      shaft: { storeys: 4, windows: 'arched', material: 'brick' },
      top: null,
      bands: { aboveGround: 'string', belowTop: null, top: 'cornice' },
      crown: { kind: 'parapet', height: 1.6, colour: [0.52, 0.28, 0.23], material: 'brick' },
      frame: null,
      entrance: { at: 'centre', kind: 'portal', steps: 5 },
      material: 'brick',
    })
  },

  /** AFTER — Old Saint Mary's Cathedral (way/260520154) through `church()`, on its own 24 × 40 m footprint. */
  kit_church_stmarys: (out) => oldSaintMarysCathedral(out, STMARYS),

  /**
   * BEFORE — Saints Peter and Paul as `facade()` can say it. The twin spires that ARE the building on the
   * Washington Square skyline have nowhere to go: the nearest `Crown` is `spires`, which stands needles on a
   * flat roof.
   */
  kit_church_before_ssp: (out) => {
    facade(out, SSP, {
      ground: { kind: 'plain', storeys: 2, material: 'limestone' },
      shaft: { storeys: 4, windows: 'arched', material: 'limestone' },
      top: null,
      bands: { aboveGround: 'string', belowTop: null, top: 'cornice' },
      crown: { kind: 'spires', height: 14, n: 2, colour: [0.86, 0.84, 0.78], material: 'ashlar' },
      frame: null,
      entrance: { at: 'centre', kind: 'portal', steps: 5 },
      material: 'limestone',
    })
  },

  /** AFTER — Saints Peter and Paul Church (way/29902626) through `church()`, on its own 30 × 52 m footprint. */
  kit_church_ssp: (out) => saintsPeterAndPaul(out, SSP),

  /** CHURCH 6 — a plain hall with one corner tower and a pyramid cap: the ordinary parish church. */
  kit_church_hall: (out) => {
    church(out, CHURCH, {
      nave: { bays: 4, storeys: 1, roof: 'gable', pitch: 'moderate' },
      aisles: null,
      transept: null,
      chancel: null,
      tower: { at: 'front-corner', stages: 4, plan: 'square', top: 'pyramid' },
      front: { kind: 'gable', portal: 'recessed', window: 'lancets', steps: 2 },
      walls: { material: 'dark-brick', openings: 'lancet', buttresses: 'plain' },
    })
  },

  /* ---------------------------------------------------------- shape operations: notch, vault, rake, deckCut */

  /**
   * notch(): a bite out of the FOOTPRINT at a corner, and then the ordinary tower grammar raised on the
   * result — punched facade, cornice, parapet, roof — to show that the notched ring is just a ring. The
   * YBCA galleries' patio cut out of one corner. Note what the parapet and the cornice do at the notch's
   * inner corner: `insetRing` is centroid-radial and inverts there (see docs/KIT.md).
   */
  kit_notch: (out) => {
    const r = notch(towerRing(SHAPE), { corner: 1 }, { wide: 0.45, deep: 0.5 })
    tower(out, { ...SHAPE, ring: r.ring }, {
      height: 24,
      tiers: [{ to: 1, face: { kind: 'punched', wall: STONE, glass: DARK, pitch: 3.2, floor: 3.6, solid: 0.55, material: 'ashlar' } }],
      roof: SLATE,
      crown: { kind: 'parapet', height: 1.1, colour: TRIM, material: 'ashlar' },
    })
  },

  /** notch({ edge }): the same operation in the MIDDLE of an edge — a light court opening off the street. */
  kit_notch_edge: (out) => {
    const r = notch(towerRing(SHAPE), { edge: 0, along: 0.5 }, { wide: 0.3, deep: 0.45 })
    faceBand(out, r.ring, 0, 16, { kind: 'punched', wall: STONE, glass: DARK, pitch: 3.2, floor: 3.6, solid: 0.55, material: 'ashlar' })
    capPolygon(out, r.ring, 16, SLATE, 0)
  },

  /**
   * vault(): THREE glazed barrel vaults across one end of the frontage, breaking the roofline — the YBCA
   * galleries' silhouette. `run: 'across'` puts the axes perpendicular to the wall so the glazed ends face
   * the street; `from`/`to` cluster them over the right half of the front.
   */
  kit_vault: (out) => {
    const ring = towerRing(SHAPE)
    faceBand(out, ring, 0, 9, { kind: 'bands', wall: STONE, glass: DARK, floor: 4.5, solid: 0.5, material: 'granite' })
    capPolygon(out, ring, 9, SLATE, 0)
    vault(out, ring, 0, 9, { count: 3, run: 'across', from: 0.45, to: 1, depth: 10, rise: 0.9, colour: TRIM, material: 'metal' })
  },

  /** vault({ run: 'along', count: 1 }): one barrel-vaulted glass arcade the length of the front — Crocker Galleria. */
  kit_vault_along: (out) => {
    const ring = towerRing({ hx: 5, hz: 16, height: 9 })
    faceBand(out, ring, 0, 7, { kind: 'blank', wall: STONE, material: 'ashlar' })
    vault(out, ring, 1, 7, { count: 1, run: 'along', rise: 0.85, colour: TRIM, material: 'metal', glass: [0.6, 0.72, 0.76] })
  },

  /**
   * vault({ run: 'along', count: 2, ends: 'solid' }): two parallel vaults one behind the other over the same
   * frontage, with SOLID ends — a market hall or a shed roof rather than a glazed arcade.
   */
  kit_vault_solid: (out) => {
    const ring = towerRing({ hx: 5, hz: 16, height: 9 })
    faceBand(out, ring, 0, 7, { kind: 'blank', wall: STONE, material: 'ashlar' })
    vault(out, ring, 1, 7, { count: 2, run: 'along', ends: 'solid', rise: 0.9, colour: SLATE, material: 'metal' })
  },

  /**
   * rake(): a LEANING WALL with a FLAT TOP — the YBCA theatre, "a rectangle with one side sloped steeply
   * down". The front edge leans out 26° from vertical; the roof stays horizontal and the two upright
   * neighbours come out as the trapezoids the mitre requires.
   */
  kit_rake: (out) => {
    const ring = towerRing({ hx: 7, hz: 6, height: 14 })
    const top = rake(out, ring, 0, 0, 14, { angle: 26, colour: STONE, material: 'concrete', roof: SLATE })
    faceBand(out, top, 14, 15, { kind: 'blank', wall: TRIM, material: 'concrete' })
  },

  /** rake() with a NEGATIVE angle on TWO adjoining edges: battered inward, and the corner mitres between them. */
  kit_rake_batter: (out) => {
    const ring = towerRing({ hx: 7, hz: 6, height: 14 })
    rake(out, ring, [0, 1], 0, 14, { angle: -20, colour: STONE, material: 'granite', roof: SLATE })
  },

  /**
   * deckCut(): a light well cut through a raised deck to the level below, with a kerb round its lip — the
   * skyparks (Moscone, Salesforce Park). Called INSTEAD OF `capPolygon` for the deck.
   */
  kit_deckCut: (out) => {
    const ring = towerRing(SHAPE)
    faceBand(out, ring, 0, 9, { kind: 'blank', wall: STONE, material: 'concrete' })
    deckCut(out, ring, 9, insetRing(ring, 5), { depth: 6, deck: [0.5, 0.56, 0.42], kerb: 0.9 })
  },

  /**
   * deckCut() fed the polygon `notch` removed, with a pitched glass ROOFLIGHT over it: the same corner that
   * shaped the building becomes the court through its deck. YBCA's patio and its "boat pitched down" glass.
   */
  kit_deckCut_rooflight: (out) => {
    const r = notch(towerRing(SHAPE), { corner: 1 }, { wide: 0.45, deep: 0.5 })
    faceBand(out, r.ring, 0, 9, { kind: 'blank', wall: STONE, material: 'concrete' })
    capPolygon(out, r.ring, 9, [0.5, 0.56, 0.42], 0)
    // the patio deck sits at podium level in the notch, not up at the building's roof
    deckCut(out, r.cut, 1.2, insetRing(r.cut, 1.4), { depth: 5, deck: [0.62, 0.6, 0.56], kerb: 0.8, rooflight: 'pitched', rise: 0.16 })
  },

  /**
   * A STUDY, not the production entry (the YBCA buildings belong to another run): the galleries as the four
   * parts together — a corner notched out for the patio, the patio's deck cut through to the level below
   * under its glass rooflight, and the three glazed barrel vaults clustered at one end of the frontage.
   */
  kit_ybca_galleries: (out) => {
    const ring = towerRing(SHAPE)
    const r = notch(ring, { corner: 1 }, { wide: 0.4, deep: 0.45 })
    faceBand(out, r.ring, 0, 11, { kind: 'bands', wall: STONE, glass: DARK, floor: 5.5, solid: 0.55, material: 'granite' })
    capPolygon(out, r.ring, 11, SLATE, 0)
    vault(out, r.ring, 0, 11, { count: 3, run: 'across', from: 0.5, to: 1, depth: 9, rise: 0.9, colour: TRIM, material: 'metal' })
    deckCut(out, r.cut, 0.8, insetRing(r.cut, 1.4), { depth: 5, deck: [0.6, 0.58, 0.54], rooflight: 'pitched', rise: 0.18 })
  },

  /** deckCut({ rooflight: 'vault' }): the same court under a barrel of glass rather than a pitched one. */
  kit_deckCut_vault: (out) => {
    const ring = towerRing(SHAPE)
    faceBand(out, ring, 0, 9, { kind: 'blank', wall: STONE, material: 'concrete' })
    deckCut(out, ring, 9, insetRing(ring, 5), { depth: 6, deck: [0.5, 0.56, 0.42], kerb: 0.9, rooflight: 'vault', rise: 0.55 })
  },

  /*
   * ---------------------------------------------------------------- stairs and railings
   *
   * Every one of these is shot from a LOW OBLIQUE at rider's eye height, not in elevation: the YBCA theatre's
   * steps read correctly in a front elevation and were floating louvres from the pavement (BUGS.md, ybca.ts
   * :1036), and #134a's palisade of pale poles was likewise invisible in code and in elevation.
   */

  /**
   * stair(): the ordinary stepped entrance — a row building's stoop, 1.2 m up off the pavement.
   * `anchor: 'top'` puts the head of the flight ON the wall edge, whose normal points at the street, so the
   * steps come DOWN off the doorway; 8 steps and a 0.375 m tread are DERIVED from the 0.15 m riser.
   */
  kit_stair: (out) => {
    const ring = towerRing(STAIRS)
    faceBand(out, ring, 0, 10, { kind: 'punched', wall: STONE, glass: DARK, pitch: 3.2, floor: 3.4, solid: 0.55, material: 'ashlar' })
    capPolygon(out, ring, 10, SLATE, 0)
    const e = edgeAt(ring, 0)
    stair(out, e.a, e.b, 0, 1.2, { from: 0.3, to: 0.7, anchor: 'top', rail: 'both', colour: [0.8, 0.78, 0.74], material: 'granite' })
  },

  /**
   * stair({ splay }): the VARYING-WIDTH flight — wider at the pavement, tapering to the doorway, which is the
   * standard civic/institutional entrance. 2.4 m of rise, 16 steps, and the foot is half again as wide as the
   * head. Corner and fan stairs are deliberately not in the kit (docs/KIT.md).
   */
  kit_stair_splay: (out) => {
    const ring = towerRing(STAIRS)
    faceBand(out, ring, 0, 10, { kind: 'punched', wall: STONE, glass: DARK, pitch: 3.4, floor: 3.6, solid: 0.6, material: 'ashlar' })
    capPolygon(out, ring, 10, SLATE, 0)
    const e = edgeAt(ring, 0)
    stair(out, e.a, e.b, 0, 2.4, { from: 0.3, to: 0.7, anchor: 'top', splay: 0.5, rail: 'both', colour: [0.82, 0.8, 0.75], material: 'granite' })
  },

  /**
   * The one view that proves the flight is SOLID: raised on a plinth so the camera can stand UNDER it.
   * `tools/kit-shots.ts` shoots this one from below — the only angle that shows an unclosed underside, which
   * is the defect that made the theatre's first steps a fence lying on its back.
   */
  kit_stair_under: (out) => {
    const ring = towerRing({ hx: 7, hz: 4, height: 3 })
    faceBand(out, ring, 0, 3, { kind: 'blank', wall: SLATE, material: 'concrete' })
    capPolygon(out, ring, 3, [0.55, 0.54, 0.5], 0)
    // the flight starts ON the terrace at 3 m and climbs OUT over open air, so its underside is exposed: an
    // unclosed one is daylight between every tread from here, and nothing else in the catalogue shows that
    const e = edgeAt(ring, 0)
    stair(out, e.a, e.b, 3, 6, { from: 0.25, to: 0.75, rail: 'both', colour: [0.8, 0.78, 0.74], material: 'granite' })
  },

  /**
   * A STUDY at the YBCA THEATRE's real dimensions (sf/ybca.ts:1030 — that file belongs to another run): the
   * broad shallow steps climbing the whole entrance storey, 4 m of rise across 22 m of frontage. This is the
   * shape that came out as floating louvres when it was hand-built, and it is one `stair()` call.
   */
  kit_yb_theatre_steps: (out) => {
    const ring = towerRing({ hx: 16, hz: 9, height: 16 })
    faceBand(out, ring, 4, 16, { kind: 'blank', wall: [0.78, 0.75, 0.7], material: 'concrete' })
    capPolygon(out, ring, 16, SLATE, 0)
    const e = edgeAt(ring, 0)
    stair(out, e.a, e.b, 0, 4, { from: 0.16, to: 0.84, anchor: 'top', riser: 0.16, rail: 'both',
      colour: [0.84, 0.82, 0.77], material: 'granite' })
  },

  /**
   * preset: 'esplanade' — the YERBA BUENA ESPLANADE at its measured dimensions (sf/yerba-buena.ts:400, that
   * file's own run): the lawn is `DECK_H` = 4 m up and there are only about 10 m of pavement, so its riser is
   * 0.67 m, which the preset's tread rule turns into the 1.7 m treads that file measured. `tread: 'alternate'`
   * is the grass strip, paved strip alternation the photograph shows, and it is the preset's default.
   */
  kit_esplanade: (out) => {
    const ring = towerRing({ hx: 11, hz: 8, height: 4 })
    const e = edgeAt(ring, 0)
    capPolygon(out, ring, 4, [0.42, 0.55, 0.3], 0)
    faceBand(out, ring, 0, 4, { kind: 'blank', wall: [0.72, 0.71, 0.68], material: 'concrete' })
    stair(out, e.a, e.b, 0, 4, { preset: 'esplanade', riser: 0.67, from: 0.08, to: 0.92, anchor: 'top',
      colour: [0.74, 0.73, 0.7], treadColour: [0.78, 0.77, 0.74], material: 'concrete' })
  },

  /**
   * preset: 'terrace' — the YERBA BUENA TERRACE GARDEN: the grade between the theatre passage at `DECK_H` = 4
   * and the upper patio at `PATIO_H` = 8 (sf/yerba-buena.ts:85, :301), as five deep PLANTED tiers with
   * concrete riser faces. The treads are pushed to `out.decks`, so the deck-planting path plants them — the
   * hand-built version was boxes with nothing growing on them — and the walkway at the head gets a `railing`
   * on the very edge `stair()` returned.
   */
  kit_terrace: (out) => {
    const ring = towerRing({ hx: 11, hz: 7, height: 8 })
    const e = edgeAt(ring, 0)
    faceBand(out, ring, 0, 8, { kind: 'blank', wall: [0.7, 0.69, 0.66], material: 'concrete' })
    capPolygon(out, ring, 8, [0.6, 0.58, 0.54], 0)
    const s = stair(out, e.a, e.b, 4, 8, { preset: 'terrace', riser: 0.8, run: 10, anchor: 'top',
      colour: [0.72, 0.71, 0.68], material: 'concrete' })
    railing(out, s.bottom, 4, { kind: 'posts' })
    railing(out, s.top, 8, { kind: 'glass' })
  },

  /**
   * railing(): the three kinds on one deck edge, at RIDER'S EYE HEIGHT, which is where BUGS.md #134a's
   * failure lives — `glazedFront()` drew pale mullions 0.34 m proud of the glass and a frontage read as a
   * palisade of white poles. These posts are IN the rail plane, dark, and spaced from the run's own length.
   */
  kit_railing: (out) => {
    const ring = towerRing({ hx: 9, hz: 5, height: 3 })
    faceBand(out, ring, 0, 3, { kind: 'blank', wall: [0.7, 0.69, 0.66], material: 'concrete' })
    capPolygon(out, ring, 3, [0.58, 0.57, 0.54], 0)
    const e = edgeAt(ring, 0)
    const at = (f0: number, f1: number): P2[] =>
      [{ x: e.a.x + e.tx * e.L * f0, z: e.a.z + e.tz * e.L * f0 }, { x: e.a.x + e.tx * e.L * f1, z: e.a.z + e.tz * e.L * f1 }]
    railing(out, at(0.02, 0.32), 3, { kind: 'posts' })
    railing(out, at(0.35, 0.65), 3, { kind: 'glass' })
    railing(out, at(0.68, 0.98), 3, { kind: 'solid' })
  },

  /**
   * arcStair(): the GRAND CURVED FAN STAIRCASE sweeping up from the Children's Creativity Museum's sunken
   * circular plaza (docs/MOSCONE-SOUTH.md, 4th Street side). The treads are concentric annular sectors
   * radiating from the plaza's own centre and the climb is radial; the step count comes from the riser
   * exactly as a straight flight's does. A 200 degree sweep is `from: 0, to: 0.555` of a full turn.
   */
  kit_arc_stair: (out) => {
    // the sunken plaza itself, paved pink-red, with the flight climbing out of it on three sides
    const C = { x: 0, z: 0 }
    const plaza: P2[] = []
    for (let i = 0; i < 48; i++) plaza.push({ x: Math.cos((i / 48) * Math.PI * 2) * 6.2, z: Math.sin((i / 48) * Math.PI * 2) * 6.2 })
    capPolygon(out, plaza, 0.02, [0.62, 0.42, 0.4], 0)
    arcStair(out, C, 6, 0, 4, { from: 0.06, to: 0.56, rail: 'both', colour: [0.84, 0.82, 0.77], material: 'granite' })
  },

  /**
   * arcStair({ anchor: 'top', preset: 'esplanade' }): one of the TWO CURVED ESPLANADES descending from the
   * curved dividing wall (level 2.75) to the lawn (level 2) — the hinge of the whole Moscone South park. The
   * wall is the baseline circle and the flight hangs off it outward, so `anchor: 'top'`, and the alternating
   * grass and paved treads are the esplanade preset's own default.
   */
  kit_arc_esplanade: (out) => {
    const C = { x: 0, z: 0 }
    const s = arcStair(out, C, 16, 2, 5.2, { from: 0.58, to: 0.92, anchor: 'top', preset: 'esplanade',
      riser: 0.4, colour: [0.74, 0.73, 0.7], treadColour: [0.78, 0.77, 0.74], material: 'concrete' })
    // the curved dividing wall the esplanade comes off, and the walk along its top
    railing(out, s.top, 5.2, { kind: 'posts' })
  },

  /**
   * A STUDY of the FOLSOM MONUMENTAL STAIR (docs/MOSCONE-SOUTH.md, Folsom side): a wide public flight running
   * the full depth of the block from the street up to garden level, PAIRED with a plain paved walk beside it.
   * The pair is the point — *"a stair-and-walk pair, not a single object"* — and `ramp()` takes the `run` the
   * flight returned, so the walk arrives exactly where the flight does without a length being typed twice.
   * 6 m of rise over 40 m, which is the projection the aerial gives, and 14 m of flight beside a 6 m walk.
   */
  kit_folsom_stair: (out) => {
    const a = { x: -10, z: 0 }
    const b = { x: 10, z: 0 }
    // the baseline runs b -> a so the flight climbs AWAY from the street, which is the view from Folsom
    const s = stair(out, b, a, 0, 6, { from: 0, to: 0.7, run: 40, rail: 'right',
      colour: [0.82, 0.8, 0.76], material: 'granite' })
    ramp(out, b, a, 0, 6, { from: 0.72, to: 1, run: s.run, kerb: 0.25, colour: [0.76, 0.75, 0.72], material: 'concrete' })
    // the articulated wall the flight climbs beside: big white piers at regular bays with planted terraces
    // between them. The piers are the kit's own boxes; the terraces are the terrace preset on a short run.
    for (let i = 0; i <= 5; i++) {
      boxAlong(out, 11.6, 3.4, (i / 5) * 38, 0.9, 3.4, 1.1, 0, [0.9, 0.89, 0.86], 0)
    }
  },

  /**
   * ramp() on its own: the CONCRETE RAMP descending from the curved dividing wall (2.75) to the mezzanine
   * (2.5). Its run DERIVES from the rise by a gradient — 1 in 12 unless a photograph says otherwise — so a
   * ramp cannot silently come out as a slope nobody could use, and it is solid and closed like the flight.
   */
  kit_ramp: (out) => {
    const rect = (x0: number, z0: number, x1: number, z1: number): P2[] =>
      [{ x: x0, z: z0 }, { x: x1, z: z0 }, { x: x1, z: z1 }, { x: x0, z: z1 }]
    // the mezzanine the ramp lands on (level 2.5), and the curved wall's end it comes off (level 2.75)
    const mezz = rect(-14, -26, 14, -2)
    faceBand(out, mezz, 0, 3.4, { kind: 'blank', wall: [0.72, 0.71, 0.68], material: 'concrete' })
    capPolygon(out, mezz, 3.4, [0.6, 0.58, 0.54], 0)
    const wall = rect(-9, -2, 9, 6)
    faceBand(out, wall, 0, 5.2, { kind: 'blank', wall: [0.78, 0.77, 0.74], material: 'concrete' })
    capPolygon(out, wall, 5.2, [0.66, 0.65, 0.62], 0)
    // 1.8 m of rise at the gradient a ramp is allowed to be is 21.6 m of run — which is the whole point of
    // deriving it: a ramp is LONG, and a builder who types a run gets one nobody could use
    const e = edgeAt(wall, 0)
    ramp(out, e.a, e.b, 3.4, 5.2, { from: 0.3, to: 0.52, anchor: 'top', kerb: 0.3, rail: 'both',
      colour: [0.76, 0.75, 0.72], material: 'concrete' })
  },

  /** A STUDY of the YBCA theatre: one steeply raked wall, a flat roof, a parapet on it. */
  kit_ybca_theatre: (out) => {
    const ring = towerRing({ hx: 8, hz: 7, height: 16 })
    const top = rake(out, ring, 0, 0, 16, { angle: 30, colour: [0.78, 0.75, 0.7], material: 'concrete', roof: SLATE })
    faceBand(out, top, 16, 17.2, { kind: 'blank', wall: TRIM, material: 'concrete' })
  },
}

/** the church demos' stage: a long wall 12 m across, its front edge at z = −6 facing the camera */
const CH_STAGE: Fit = { hx: 6, hz: 6, height: 10 }
const CH_RING = towerRing(CH_STAGE)

/** a church-sized footprint for the whole-church demos: 20 m across, 34 m deep, ridge at 16 m */
const CHURCH: Fit = { hx: 10, hz: 17, height: 16 }

/** the two real buildings' own footprints — the church proper, not the OSM way that merges in its school */
const SSP: Fit = { hx: 15, hz: 26, height: 23 }
const STMARYS: Fit = { hx: 12, hz: 20, height: 19 }

/** an ordinary Chinatown street building, for the temple demo: the pagoda roof goes on TOP of a facade() */
const TEMPLE: Fit = { hx: 9, hz: 6, height: 14 }

/** a plain city block for the facade() demos: 26 m of frontage, 16 m deep, nine storeys */
const BLOCK: Fit = { hx: 13, hz: 8, height: 31 }

/** the same block with its street corner cut off — a San Francisco commercial cliché, and a non-rectangle */
const CHAMFERED: Fit = {
  hx: 13, hz: 8, height: 31,
  ring: [
    // the street front (−z) is the LONGEST edge — the back is broken by a light-well jog — so `on: 'front'`
    // and `on: 'street'` pick the elevation that faces the junction rather than the party wall behind it
    { x: -13, z: -8 }, { x: 9, z: -8 }, { x: 13, z: -4 }, { x: 13, z: 8 }, { x: 1, z: 10 }, { x: -13, z: 8 },
  ],
}

/** the stair demos' stage: 24 m of frontage, deep enough that a flight in front of it still reads */
const STAIRS: Fit = { hx: 8, hz: 6, height: 10 }

/** the shape demos' stage: a 26 m x 20 m block, big enough for a corner bite and three vaults to read */
const SHAPE: Fit = { hx: 13, hz: 10, height: 24 }

/** the four classical orders, for the doc — the order matters only above the `far` tier */
export const KIT_ORDERS: ColumnOrder[] = ['tuscan', 'doric', 'ionic', 'corinthian']
