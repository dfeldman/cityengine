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
  panelOn, stripRoof, roundRing, faceOn, edgeAt,
} from '../../parts.ts'
import {
  column, pediment, dome, pinnacle, turret, beam, windows, pane, archedPane, pointedPane, courtFacade, block,
} from '../../kit.ts'
import { classicalColumn, type ColumnOrder } from '../../column.ts'

/** the demo stage: 9 m of frontage, 6 m deep, its front edge (index 0) at z = −3 facing −z */
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
}

/** the four classical orders, for the doc — the order matters only above the `far` tier */
export const KIT_ORDERS: ColumnOrder[] = ['tuscan', 'doric', 'ionic', 'corinthian']
