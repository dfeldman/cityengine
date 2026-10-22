/**
 * The facade grammar. This is the centre of the game's look, so it is worth saying plainly what problem it
 * solves.
 *
 * Render OSM buildings the obvious way — extrude the footprint, wrap it in a tiling brick texture — and a city
 * comes out looking like one building copied two thousand times. The eye reads a street by its RHYTHM: how
 * wide the bays are, where the floor lines fall, how the ground floor differs from the ones above it, where
 * the wall stops and the cornice begins. Get that wrong and no amount of texture resolution rescues it; get it
 * right and even plain art reads as a real street.
 *
 * So nothing here tiles by height. A facade is PLANNED:
 *
 *      style          ──►  storey bands  ──►  bays  ──►  cells        ──►  features
 *      (haussmann)         ground 4.6 m       every       one window       continuous iron
 *                          5 × 3.2 m          2.9 m       per bay, the     balcony at levels
 *                          mansard 3.0 m      along       ground ones      2 and 5; cornice
 *                                             the wall    shopfronts       under the mansard
 *
 * Three rules hold the whole thing together, and the tests pin all three:
 *
 *   1. **Bays are chosen per wall and shared by every storey**, so windows line up vertically. A facade whose
 *      windows wander is the single most obvious tell that a city is generated.
 *   2. **Ground, middle and top are different by construction.** Real buildings meet the pavement with doors
 *      and shops and meet the sky with a cornice. A building whose ground floor is just another row of windows
 *      looks like a model of a building.
 *   3. **Every random choice comes from the building's own seed**, derived from its OSM way id. Re-baking a
 *      city leaves every building exactly as it was, and two buildings side by side are never the same.
 *
 * What comes out is geometry-independent: `planFacade` knows nothing about Babylon. `src/render/buildings.ts`
 * turns a plan into meshes and `tools/facadegen` paints the atlas the cells point at. That split is what makes
 * the grammar testable, which for the part of the game that decides whether it looks good is the point.
 */
import stylesData from './styles.json' with { type: 'json' }

export type StyleId =
  | 'haussmann' | 'brownstone' | 'classical' | 'brick' | 'bauhaus' | 'brutalist' | 'skyscraper' | 'marais'
  | 'tenement' | 'chicago' | 'victorian' | 'vosges' | 'opera' | 'operaGlass'
  // San Francisco's own (SF_PLAN.md §3): the Marina's 1930s stucco, the Edwardian apartment block, Chinatown
  | 'stucco' | 'sfapartment' | 'chinatown' | 'edwardian'
  // shared: the post-war residential tower, which every city has and which is NOT an office block
  | 'towerblock'
  // the Presidio's and the old forts' (owner, 2026-10-02, 2026-10-17): the Army's white clapboard, its brick, and its
  // Mission Revival stucco — all under red roofs
  | 'presidio' | 'presidioBrick' | 'presidioStucco'
  // Sausalito's (owner, 2026-10-06): Cape Cod cedar shingle
  | 'capecod'
  // Fisherman's Wharf (owner, 2026-10-16): painted timber restaurants and gift shops under striped canvas
  | 'wharf'
  // San Francisco's commercial streets (owner, 2026-10-21): the shop-and-flats of Mission Street and the one-storey shop
  // building, drawn with other styles' paintings (`Style.art`)
  | 'shopflats' | 'storefront'
  // …and its apartment blocks (owner, 2026-10-21: the Edwardian bay-window flats were every apartment building in the city):
  // the Beaux-Arts apartment hotel, the brick one, the Mediterranean, the cheap modern box and the better modern block
  | 'aptclassical' | 'aptbrick' | 'aptmed' | 'aptmodern' | 'aptluxe'
  // …and the same proportions in stucco, for a label that saw render where the style paints wood (appearance research)
  | 'flatsstucco' | 'shopflatsstucco'

export type GroundKind = 'shopfront' | 'stoop' | 'arcade' | 'glazed' | 'recessed' | 'plain' | 'garage'
export type TopKind = 'cornice' | 'parapet' | 'mansard' | 'entablature' | 'flatband' | 'crown' | 'gable'
export type WindowKind = 'french' | 'sash' | 'pedimented' | 'punched' | 'ribbon' | 'recessed' | 'curtain' | 'casement'
  | 'chicago' | 'vosges' | 'opera' | 'operaGlass'

export interface Palette {
  wall: string
  trim: string
  roof: string
  accent: string
  /*
   * The ground floor, where it is painted differently from the rest — which it very often is: a shopfront in
   * a dark colour under pale flats, a stone or tiled base under render, a garage front (user, 2026-09-22:
   * "many buildings have a first floor in a different color from the upper floors"). Absent means the wall's
   * own colour, as before.
   */
  ground?: string
  /** how often this palette is drawn against the others in its list (default 1): San Francisco's lofts are mostly red brick */
  weight?: number
}

export interface Style {
  id: StyleId
  name: string
  note: string
  levels: [number, number]
  levelHeight: [number, number]
  groundHeight: [number, number]
  bayWidth: [number, number]
  pier: [number, number]
  window: { kind: WindowKind; widthFrac: [number, number]; heightFrac: [number, number]; sill: number }
  ground: GroundKind
  top: TopKind
  cornice: { depth: number; height: number }
  stringCourse: boolean
  balcony?: { levels: number[]; kind: 'iron' | 'slab'; depth: number; continuous: boolean }
  pilasters?: boolean
  slabBands?: boolean
  setbacks?: boolean
  reveal?: number
  /** features beyond the bands every style has: New York's fire escapes, San Francisco's bay windows */
  /** bayWindows: true = a Victorian's one bay on its narrow front; 'stacks' = an apartment block's bays up a wide one */
  features?: { fireEscape?: boolean; bayWindows?: boolean | 'stacks' }
  palettes: Palette[]
  /**
   * A style that paints nothing of its own: its windows, wall cells and wall page are this style's, and its ground storey
   * `groundArt`'s. The atlas is full (159 of 160 cells, 2026-10-21) and a new look is mostly new proportions, palettes
   * and dressing on paintings that already exist.
   */
  art?: StyleId
  groundArt?: StyleId
}

export const STYLES = stylesData.styles as unknown as Style[]
const BY_ID = new Map(STYLES.map((s) => [s.id, s]))

export function style(id: StyleId): Style {
  const s = BY_ID.get(id)
  if (!s) throw new Error(`unknown style ${id}`)
  return s
}

/** Whose paintings a style's windows and walls are (`Style.art`): its own, unless it borrows. */
export const artOf = (id: StyleId): StyleId => BY_ID.get(id)?.art ?? id
/** …and its ground storey's. */
export const groundArtOf = (id: StyleId): StyleId => BY_ID.get(id)?.groundArt ?? artOf(id)

/** The wall page a material binds for a page name — a style, or a style's `-far` page — following a borrowed style to its art. */
export function wallPageOf(page: string): string {
  const far = page.endsWith('-far')
  const id = (far ? page.slice(0, -4) : page) as StyleId
  return BY_ID.has(id) ? `${artOf(id)}${far ? '-far' : ''}` : page
}

/* ------------------------------------------------------------------ randomness

   A building's look has to survive a re-bake unchanged, so every choice is drawn from a small deterministic
   generator seeded with the building's OSM id. mulberry32: four lines, good enough spread, and the same
   stream every time. */

export function rng(seed: number): () => number {
  let a = (seed ^ 0x9e3779b9) >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const between = (r: () => number, [lo, hi]: [number, number]): number => lo + r() * (hi - lo)
const pick = <T,>(r: () => number, xs: readonly T[]): T => xs[Math.min(xs.length - 1, Math.floor(r() * xs.length))]

/* ------------------------------------------------------------------ the plan */

export type StoreyKind = 'ground' | 'mid' | 'top' | 'attic'

export interface Storey {
  /** metres above the building's base */
  y0: number
  y1: number
  kind: StoreyKind
  /** 0 for the ground floor, counting up */
  index: number
}

export interface Cell {
  /** metres along the wall from its start */
  x0: number
  x1: number
  y0: number
  y1: number
  /** which painted element in the atlas: `<style>/<element>` plus a variant suffix */
  element: string
  /** 0–1 into the style's variant set, so neighbouring cells differ */
  variant: number
  /** this cell's own paint, where it is not the wall's: a modern block's colour panels (Dress.blocks) */
  tint?: string
}

export type FeatureKind = 'cornice' | 'balcony' | 'stringCourse' | 'sill' | 'slabBand' | 'pilaster' | 'parapet'
  | 'fireEscape' | 'bay' | 'gable' | 'bracket' | 'canopy' | 'panel' | 'turret'

/** Something that sticks out of the wall. Depth is metres proud of the facade plane. */
export interface Feature {
  kind: FeatureKind
  y0: number
  y1: number
  depth: number
  /** along-wall extent; absent means the whole wall */
  x0?: number
  x1?: number
  colour: string
  /** a bay's plan: three faces at 45° (the default), a box, or a curve */
  shape?: 'angled' | 'square' | 'rounded'
}

export interface FacadePlan {
  style: StyleId
  palette: Palette
  /** total height of the walled part, excluding any roof the roof builder adds */
  height: number
  levels: number
  storeys: Storey[]
  /** the plan for one wall, filled in by `planWall` */
  bayWidth: number
  window: { kind: WindowKind; widthFrac: number; heightFrac: number; sill: number }
  ground: GroundKind
  /** an institution (a school, a hospital, a church: `noShops`) — no fire escapes or apartment bay stacks either */
  institution?: boolean
  top: TopKind
  hasBalconyAt: (level: number) => boolean
  /** this building's own dressing, for the styles that have one (`DRESSERS`) */
  dress?: Dress
}

/**
 * What a commercial building wears on its street front, drawn per building from its own seed. Before this every loft in
 * SoMa had the same flat parapet and every modern block the same white band (owner, 2026-10-21: "make them have a
 * more realistic variety"): neighbours differed only in paint. The street front is where a building spends its money —
 * the cornice, the piers, the name panel are on the street wall and the side and back walls are plain — so all of it
 * except the roof's overhang goes on street-facing walls only, which also keeps it off the phone's triangle budget.
 */
export interface Dress {
  /**
   * the top: the style's own band (`plain`); a corbelled brick cornice stepping out in three courses; a pressed-metal
   * cornice on brackets; a raised name panel at the middle of the street front (strip retail's sign board, a loft's
   * date stone); a flat roof slab overhanging every wall
   */
  cap: 'plain' | 'corbel' | 'bracket' | 'panel' | 'overhang'
  /** metres the parapet rises above the style's usual coping */
  parapet: number
  /** brick piers between the bays, from the shop cornice up: the daylight factory's front */
  piers: boolean
  /** a band at every floor line above the first: a brick belt course, a modern block's slab edges */
  belts: boolean
  /** a cornice over the shop storey */
  base: boolean
  /** a flat metal canopy over the glazed ground storey */
  canopy: boolean
  fireEscape: boolean
  /** thin vertical fins between the bays */
  fins: boolean
  /** balconies on alternate bays above the ground storey */
  balconies: boolean
  /** the name panel's share of the wall */
  panel: number
  /**
   * How much of the street front is shop. Paris is shops all along under cream flats, and the grammar was written there;
   * San Francisco's commercial buildings very often have no shop at all — an office's or a warehouse's ground floor of
   * windows — or one, with its door in the middle of the front (owner, 2026-10-21). Walls off the street never have one.
   */
  shops: 'all' | 'one' | 'none'
  /** bay windows up the street front from the first floor, two bays wide: the shop-and-flats', a modern block's box bays */
  bays: boolean
  /** groups of bays painted in the accent colour from the first floor up: the cheap modern block's colour panels */
  blocks: boolean
  /**
   * A label's street front at eye level (appearance research v5): how many garage doors, how much of it is shop, and
   * whether the door is at the pavement or up a stoop. San Francisco's fronts mix them — a garage, a stoop, a garage
   * (owner, 2026-10-22: built-in garages are everywhere, houses above all) — so when this is set it decides every ground
   * bay of the street wall itself, each from whichever style has the painting, and the shopping-street rule does not
   * apply: a front a photograph shows without a shop gets none.
   */
  ground?: GroundMix
  /** a label's count of bay-window stacks up the street front (2: two or more); replaces the style's own bays */
  bayStacks?: number
  /** a label's gable or false front over the street front, or none (false) where the style would draw one */
  gable?: boolean
  /** a label's bay plan (Feature.shape) */
  bayShape?: 'angled' | 'square' | 'rounded'
  /**
   * A painted lady (owner, 2026-10-22: the Victorians are rarer than the stucco blocks, but they are what San Francisco
   * is famous for and what draws the eye — a library of their own, never flattened to a box). The three kinds a
   * passer-by tells apart: the Italianate's flat top on big brackets over slanted bays; the Stick house's square bays,
   * false-front gable and vertical trim; the Queen Anne's corner turret, gable and curves. Each is drawn with hoods over
   * its windows and its trim in its own colour.
   */
  victorian?: 'italianate' | 'stick' | 'queen_anne'
  /** a label's balconies: iron railings at the windows, or platforms to stand on */
  balconyKind?: 'balconettes' | 'projecting'
}

export interface GroundMix {
  garages: number
  shops: 'none' | 'one' | 'several' | 'all'
  entrance: 'at_grade' | 'stoop' | 'none'
}
type GroundBay = 'shop' | 'garage' | 'door' | 'stoop' | 'window'

/**
 * The ground bays of a street front, left to right, from a label's mix: the shops in the middle (all of it, or most, or
 * one or two bays), the garages at the ends, the door beside them. A front too narrow for all of it keeps the shops and
 * garages and loses the door last of all — a stoop or a lobby always finds a bay when there is one left.
 */
export function groundBays(bays: number, g: GroundMix): GroundBay[] {
  const out: GroundBay[] = Array(bays).fill('window')
  if (bays === 0) return out
  const nShop = g.shops === 'all' ? bays : g.shops === 'several' ? Math.max(2, Math.round(bays * 0.6)) : g.shops === 'one' ? (bays >= 5 ? 2 : 1) : 0
  const s0 = Math.floor((bays - Math.min(nShop, bays)) / 2)
  for (let b = s0; b < s0 + Math.min(nShop, bays); b++) out[b] = 'shop'
  // garages from the ends inwards, one end then the other
  let garages = g.garages >= 2 ? Math.max(2, Math.floor(bays / 3)) : g.garages
  for (let k = 0; garages > 0 && k < bays; k++) {
    const b = k % 2 === 0 ? k / 2 : bays - 1 - (k - 1) / 2
    if (out[b] === 'window') { out[b] = 'garage'; garages-- }
  }
  if (g.entrance !== 'none') {
    // the door: in the middle when the middle is free, else the free bay nearest it
    const free = out.map((k, b) => (k === 'window' ? b : -1)).filter((b) => b >= 0).sort((a, b) => Math.abs(a - (bays - 1) / 2) - Math.abs(b - (bays - 1) / 2))
    const at = free.length ? free[0] : out.lastIndexOf('garage') >= 0 && out.filter((k) => k === 'garage').length > 1 ? out.lastIndexOf('garage') : -1
    if (at >= 0) out[at] = g.entrance === 'stoop' ? 'stoop' : 'door'
  }
  return out
}

/** Which styles have each ground painting (the atlas: tools/facadegen). A bay borrows one when its own style has none. */
const GROUND_ART: Record<Exclude<GroundBay, 'window'>, { element: string; styles: StyleId[] }> = {
  shop: { element: 'shopfront', styles: ['tenement', 'brick', 'chinatown', 'wharf', 'marais', 'haussmann'] },
  garage: { element: 'garage', styles: ['edwardian', 'stucco'] },
  stoop: { element: 'stoop', styles: ['victorian', 'presidioStucco', 'presidio', 'presidioBrick', 'brownstone', 'capecod'] },
  door: { element: 'recessed', styles: ['sfapartment', 'towerblock', 'brutalist'] },
}

/** The painting for a ground bay: the building's own ground or wall art's when it has one, else the first that does. */
function groundElement(kind: Exclude<GroundBay, 'window'>, art: StyleId, groundArt: StyleId): string {
  const g = GROUND_ART[kind]
  const own = g.styles.includes(groundArt) ? groundArt : g.styles.includes(art) ? art : g.styles[0]
  return `${own}/${g.element}`
}

const weighted = <T,>(r: () => number, xs: readonly [T, number][]): T => {
  let x = r() * xs.reduce((t, [, w]) => t + w, 0)
  for (const [v, w] of xs) if ((x -= w) <= 0) return v
  return xs[xs.length - 1][0]
}

const NO_DRESS: Dress = { cap: 'plain', parapet: 0, piers: false, belts: false, base: false, canopy: false, fireEscape: false,
  fins: false, balconies: false, panel: 0.5, shops: 'all', bays: false, blocks: false }

/**
 * The styles that dress, and how. The weights are judgement, checked against the 50 SoMa and Mission lofts and 32 modern
 * blocks labelled from street photographs (data/appearance/training.json): about a third of the "lofts" really are brick
 * warehouses, the rest one- and two-storey shop buildings with a raised sign parapet or a plain coping.
 */
const DRESSERS: Partial<Record<StyleId, (r: () => number, levels: number) => { dress: Dress; groundPaint?: string }>> = {
  brick: (r, levels) => {
    const low = levels <= 2
    const cap = weighted<Dress['cap']>(r, low
      ? [['plain', 30], ['corbel', 20], ['bracket', 10], ['panel', 40]]
      : [['plain', 30], ['corbel', 35], ['bracket', 20], ['panel', 15]])
    const dress: Dress = {
      ...NO_DRESS,
      cap,
      parapet: r() < 0.5 ? 0 : 0.2 + r() * (low ? 1.1 : 0.7),
      piers: levels >= 2 && r() < 0.35,
      belts: levels >= 3 && r() < 0.25,
      base: r() < 0.55,
      fireEscape: levels >= 3 && r() < 0.35,
      panel: 0.35 + r() * 0.3,
      shops: weighted<Dress['shops']>(r, low ? [['all', 45], ['one', 35], ['none', 20]] : [['all', 30], ['one', 35], ['none', 35]]),
    }
    const paint = r() < 0.3 ? weighted(r, [['#2b2b2d', 3], ['#3b4a3f', 1.5], ['#5a2a26', 1.5], ['#d8d2c4', 1.5], ['#6e6e6a', 2]]) : undefined
    return { dress, groundPaint: paint }
  },
  shopflats: (r, levels) => {
    const dress: Dress = {
      ...NO_DRESS,
      cap: weighted<Dress['cap']>(r, [['bracket', 50], ['plain', 30], ['panel', 20]]),
      parapet: r() < 0.4 ? 0.3 + r() * 0.8 : 0,
      base: r() < 0.7,
      bays: levels >= 2 && r() < 0.6,
      panel: 0.5 + r() * 0.3,
      shops: weighted<Dress['shops']>(r, [['all', 55], ['one', 35], ['none', 10]]),
    }
    const paint = r() < 0.3 ? weighted(r, [['#2b2b2d', 2], ['#3b4a3f', 1.5], ['#5a2a26', 1.5], ['#2b3f55', 1.5]]) : undefined
    return { dress, groundPaint: paint }
  },
  storefront: (r, levels) => {
    const dress: Dress = {
      ...NO_DRESS,
      cap: weighted<Dress['cap']>(r, [['panel', 50], ['plain', 40], ['corbel', 10]]),
      parapet: 0.3 + r() * (levels <= 1 ? 1.4 : 0.8),
      base: r() < 0.3,
      canopy: r() < 0.3,
      panel: 0.5 + r() * 0.4,
      shops: weighted<Dress['shops']>(r, [['all', 60], ['one', 30], ['none', 10]]),
    }
    const paint = r() < 0.3 ? weighted(r, [['#3a3b3e', 2], ['#9a2b25', 1], ['#2f4f5f', 1], ['#d8d2c4', 1]]) : undefined
    return { dress, groundPaint: paint }
  },
  /*
   * The apartment blocks. Most have one entrance in the middle of the front, so `shops: 'one'` is their front door
   * (the style's ground element on one bay or two, the style's windows either side); a garage block's is its row of
   * garages.
   */
  sfapartment: (r) => ({
    dress: {
      ...NO_DRESS,
      cap: weighted<Dress['cap']>(r, [['bracket', 55], ['plain', 25], ['corbel', 20]]),
      parapet: r() < 0.3 ? 0.2 + r() * 0.5 : 0,
      fireEscape: r() < 0.5,
      base: r() < 0.5,
      belts: r() < 0.2,
      shops: weighted<Dress['shops']>(r, [['one', 80], ['none', 20]]),
    },
    groundPaint: r() < 0.25 ? weighted(r, [['#d8d2c4', 2], ['#9a9a92', 1], ['#3b4a3f', 1], ['#2b3f55', 1]]) : undefined,
  }),
  aptclassical: (r) => ({
    dress: {
      ...NO_DRESS,
      cap: weighted<Dress['cap']>(r, [['bracket', 70], ['plain', 30]]),
      parapet: r() < 0.5 ? 0.3 + r() * 0.7 : 0,
      base: r() < 0.9,
      belts: r() < 0.4,
      fireEscape: r() < 0.55,
      balconies: r() < 0.25,
      shops: weighted<Dress['shops']>(r, [['one', 85], ['all', 15]]),
    },
  }),
  aptbrick: (r) => ({
    dress: {
      ...NO_DRESS,
      cap: weighted<Dress['cap']>(r, [['bracket', 60], ['corbel', 30], ['plain', 10]]),
      parapet: r() < 0.3 ? 0.3 + r() * 0.6 : 0,
      base: r() < 0.6,
      belts: r() < 0.3,
      fireEscape: r() < 0.8,
      shops: weighted<Dress['shops']>(r, [['one', 70], ['all', 30]]),
    },
  }),
  aptmed: (r) => ({
    dress: {
      ...NO_DRESS,
      cap: weighted<Dress['cap']>(r, [['plain', 75], ['panel', 25]]),
      parapet: r() < 0.6 ? 0.3 + r() * 0.6 : 0,
      base: r() < 0.3,
      balconies: r() < 0.4,
      panel: 0.3 + r() * 0.3,
      shops: weighted<Dress['shops']>(r, [['one', 50], ['all', 50]]),
    },
  }),
  aptmodern: (r) => ({
    dress: {
      ...NO_DRESS,
      cap: weighted<Dress['cap']>(r, [['plain', 60], ['overhang', 40]]),
      belts: r() < 0.25,
      balconies: r() < 0.45,
      fins: r() < 0.1,
      blocks: r() < 0.7,
      shops: weighted<Dress['shops']>(r, [['all', 50], ['one', 30], ['none', 20]]),
    },
  }),
  aptluxe: (r) => ({
    dress: {
      ...NO_DRESS,
      cap: weighted<Dress['cap']>(r, [['overhang', 55], ['plain', 45]]),
      belts: r() < 0.3,
      balconies: r() < 0.45,
      bays: r() < 0.4,
      fins: r() < 0.25,
      canopy: r() < 0.4,
      shops: weighted<Dress['shops']>(r, [['all', 60], ['one', 40]]),
    },
  }),
  bauhaus: (r, levels) => {
    const cap = weighted<Dress['cap']>(r, [['plain', 50], ['overhang', 25], ['panel', levels <= 2 ? 25 : 8]])
    const dress: Dress = {
      ...NO_DRESS,
      cap,
      parapet: cap === 'plain' && r() < 0.35 ? 0.4 + r() * 0.6 : 0,
      belts: levels >= 2 && r() < 0.3,
      canopy: r() < 0.5,
      fins: levels >= 2 && r() < 0.2,
      balconies: levels >= 3 && r() < 0.25,
      panel: 0.4 + r() * 0.3,
      shops: weighted<Dress['shops']>(r, [['all', 35], ['one', 30], ['none', 35]]),
    }
    // (no painted base: a modern block's ground storey is a glazed front, and the paint tinted its glass — a charcoal
    // shopfront read as a black hole, owner, 2026-10-21)
    return { dress }
  },
}

/** A palette from a list, by weight where the list gives weights. One draw from `r` either way, so nothing downstream moves. */
export function pickPalette(r: () => number, list: readonly Palette[]): Palette {
  if (!list.some((p) => p.weight !== undefined)) return pick(r, list)
  return weighted(r, list.map((p) => [p, p.weight ?? 1] as [Palette, number]))
}

/** The palette `planFacade` gives building `seed` from this list: what the far city paints it, so it does not change colour as it nears. */
export function paletteFor(seed: number, list: readonly Palette[]): Palette {
  return pickPalette(rng(seed), list)
}

export interface WallPlan {
  cells: Cell[]
  features: Feature[]
  bays: number
}

/** Minimum a bay may be squeezed to before the wall drops one; below this windows collide with piers. */
export const MIN_BAY = 1.3

/**
 * Decide what a building is, from what OSM said about it plus the city's own character.
 *
 * OSM almost never tags architectural style, so this is inference, and it is deliberately conservative: the
 * strong signals (a 30-storey building is not a brownstone; a tagged brick building is brick) win, and
 * everything else falls back to what the city says is typical. `cityStyles` is a weighted list from the baked
 * package — Paris is mostly haussmann, Brooklyn mostly brownstone — which is what stops every city on earth
 * from looking like the same city.
 */
export function chooseStyle(
  tags: { levels?: number; material?: string; building?: string; height?: number },
  cityStyles: readonly { id: StyleId; weight: number }[],
  seed: number,
): StyleId {
  const r = rng(seed ^ 0x5f356495)
  const levels = tags.levels ?? (tags.height ? Math.max(1, Math.round(tags.height / 3.5)) : undefined)

  /*
   * What the building is FOR comes before how tall it is. A thirty-storey block of flats is not an office
   * tower, and inferring one from height alone put a glass curtain wall on every hill crest in San Francisco
   * — Russian Hill, Nob Hill, the Marina (user, 2026-09-22: "the style of The Royal Towers and nearby
   * buildings is very wrong"). OSM does tag this, on `building`, and we were throwing it away.
   */
  const home = tags.building
  if (levels !== undefined && levels >= 9 && home !== undefined &&
      ['apartments', 'residential', 'dormitory', 'hotel'].includes(home)) {
    const tb = cityStyles.find((c) => c.id === 'towerblock')
    if (tb) return 'towerblock'
  }

  // Height decides before anything else: nothing tall is a row house, nothing short is a curtain wall —
  // except that in a city of Chicago School towers (10–20 storeys of terracotta, not glass) tall can be either
  if (levels !== undefined && levels >= 12) {
    const cs = cityStyles.find((c) => c.id === 'chicago')
    const sk = cityStyles.find((c) => c.id === 'skyscraper')
    if (cs && levels <= 20 && tags.material !== 'glass') {
      return r() * (cs.weight + (sk?.weight ?? 0)) < cs.weight ? 'chicago' : 'skyscraper'
    }
    return 'skyscraper'
  }

  // A tagged material is a fact about the building, not a guess about the neighbourhood.
  const m = tags.material
  if (m === 'brick') return 'brick'
  if (m === 'glass' && (levels ?? 0) >= 4) return 'skyscraper'
  if (m === 'concrete' && (levels ?? 0) >= 4) return 'brutalist'

  // Otherwise: the city's own mix, with styles that cannot accommodate this height filtered out.
  const feasible = cityStyles.filter(({ id }) => {
    if (levels === undefined) return id !== 'skyscraper'
    const [lo, hi] = style(id).levels
    return levels >= lo - 1 && levels <= hi + 2
  })
  const pool = feasible.length > 0 ? feasible : cityStyles.filter((c) => c.id !== 'skyscraper')
  if (pool.length === 0) return 'brick'

  const total = pool.reduce((t, c) => t + c.weight, 0)
  let x = r() * total
  for (const c of pool) {
    x -= c.weight
    if (x <= 0) return c.id
  }
  return pool[pool.length - 1].id
}

/**
 * The building-wide half of the plan: how tall each storey is and where the bands fall. Done once per
 * building so that every wall of it agrees.
 *
 * `levels` and `height` come from OSM via the vendored streets-gl tag layer when the mapper supplied them.
 * When they disagree — and they often do, because `height` includes the roof and `building:levels` does not —
 * the level count sets the rhythm and the storeys are stretched to fill the height (see below), so a stack of
 * parts meets end to end.
 */
export function planFacade(
  styleId: StyleId,
  seed: number,
  osm: { levels?: number; height?: number; minHeight?: number; stretch?: boolean; noShops?: boolean },
  /** a region's own palettes for this style, which replace the style's (Paris is cream) */
  palettes?: Palette[],
  /** what a street-photo label says about this building, over the draws (src/city/appearance.ts, `?labels=1`) */
  look?: { palette?: Partial<Palette>; dress?: Partial<Dress> },
): FacadePlan {
  const st = style(styleId)
  const r = rng(seed)
  let palette = pickPalette(r, palettes && palettes.length > 0 ? palettes : st.palettes)
  if (look?.palette) palette = { ...palette, ...look.palette }

  let levels = Math.max(
    1,
    Math.round(osm.levels ?? (osm.height ? osm.height / between(r, st.levelHeight) : between(r, st.levels))),
  )
  const groundH = between(r, st.groundHeight)
  const levelH = between(r, st.levelHeight)
  const base = osm.minHeight ?? 0
  /*
   * A part that starts well above the street has no street-level storey: it is the top of a tower, and a
   * shopfront forty-eight metres up is not one.
   */
  const aloft = base > 2.5

  const lay = (n: number): Storey[] => {
    const out: Storey[] = []
    let y = base
    for (let i = 0; i < n; i++) {
      // A top storey that is shorter than the ones below it is what an attic or a set-back top floor does,
      // and it keeps the roofline from reading as an abrupt cut.
      const isTop = i === n - 1 && n > 2
      const ground = i === 0 && !aloft
      const h = ground ? groundH : isTop && st.top !== 'crown' ? levelH * 0.88 : levelH
      out.push({ y0: y, y1: y + h, kind: ground ? 'ground' : isTop ? 'top' : 'mid', index: i })
      y += h
    }
    return out
  }
  let storeys = lay(levels)
  /*
   * And exactly as tall as OSM says, when it says. The level count still sets the rhythm, but the storeys
   * are stretched to fill the tagged height rather than the height being re-derived from the levels. That
   * re-derivation left every stacked building — a tower whose top floors are mapped as separate parts —
   * with a band of sky between each part, because each piece came out a few metres short of the next one's
   * base. If stretching would distort the storeys badly, the level count gives way to the height instead.
   */
  const target = osm.height !== undefined ? osm.height - base : undefined
  if (target !== undefined && target > 1) {
    let extent = storeys[storeys.length - 1].y1 - base
    let k = target / extent
    // (a monumental building — a church — keeps its few tall storeys however far they stretch)
    if ((k < 0.75 || k > 1.35) && !osm.stretch) {
      levels = Math.max(1, Math.round((target - (aloft ? 0 : groundH - levelH)) / levelH))
      storeys = lay(levels)
      extent = storeys[storeys.length - 1].y1 - base
      k = target / extent
    }
    storeys = storeys.map((st2) => ({ ...st2, y0: base + (st2.y0 - base) * k, y1: base + (st2.y1 - base) * k }))
  }
  const y = storeys[storeys.length - 1].y1

  const balconyLevels = new Set(st.balcony?.levels ?? [])
  // (its own stream, so the draws above — and every building of the styles that do not dress — stay as they were)
  const drawn = osm.noShops ? undefined : DRESSERS[styleId]?.(rng(seed ^ 0x0d2e55), levels)
  // (a label's answers win over the draws, and dress a style that has no dresser of its own)
  const dressed = look?.dress ? { dress: { ...(drawn?.dress ?? NO_DRESS), ...look.dress }, groundPaint: drawn?.groundPaint } : drawn
  if (dressed?.groundPaint && !aloft && !look?.palette?.ground) palette = { ...palette, ground: dressed.groundPaint }
  return {
    style: styleId,
    palette,
    height: y,
    levels,
    storeys,
    bayWidth: between(r, st.bayWidth),
    window: {
      kind: st.window.kind,
      widthFrac: between(r, st.window.widthFrac),
      heightFrac: between(r, st.window.heightFrac),
      sill: st.window.sill,
    },
    ground: osm.noShops && st.ground === 'shopfront' ? 'plain' : st.ground,
    ...(osm.noShops ? { institution: true } : {}),
    top: st.top,
    hasBalconyAt: (level) => balconyLevels.has(level),
    ...(dressed && !aloft ? { dress: dressed.dress } : {}),
  }
}

/**
 * The per-wall half: fit whole bays into this wall's length and cut the cells.
 *
 * Fitting matters more than it sounds. A wall 11.4 m long with a 2.9 m ideal bay wants 3.93 bays; taking 3 and
 * stretching or 4 and squeezing both look wrong at the corners, so the bays are fitted to a whole number and
 * the REMAINDER goes into the corner margins rather than into the bays. That is also what real buildings do —
 * the wall returns at the corner in solid masonry, not in half a window.
 */
export function planWall(plan: FacadePlan, wallLength: number, seed: number,
  /** this wall faces a street (and how far it is to the kerb): where a dressed building puts its ornament */
  street: { pavement?: number | null; main?: boolean } | null = null,
  /**
   * Which of the building's features this wall carries (render/buildings.ts `fronts`). `front`: the narrow street front
   * a Victorian's one bay window and gable go on; `face`: a wall the street sees, where an apartment block hangs its fire
   * escape and its bay stacks. Every wall did both, so a Victorian wore 4.8 gables and 3.2 bays where a real one has one
   * of each, and the gables over its back and side walls stood as roofs in mid-air (KIT-HARVEST §5.1). Both default to
   * true for a wall planned alone.
   */
  role: { front: boolean; face: boolean } = { front: true, face: true }): WallPlan {
  const st = style(plan.style)
  const r = rng(seed)
  const cells: Cell[] = []
  const features: Feature[] = []
  // the paintings this style draws with (`Style.art`)
  const art = artOf(plan.style)
  const groundArt = groundArtOf(plan.style)

  const minMargin = between(r, st.pier) * 0.9
  const usable = wallLength - 2 * minMargin
  let bays = Math.max(0, Math.round(usable / plan.bayWidth))
  while (bays > 0 && usable / bays < MIN_BAY) bays--

  if (bays === 0) {
    // Too narrow for a window: a blank return wall, which is a real thing on the side of a row house.
    for (const s of plan.storeys) {
      cells.push({ x0: 0, x1: wallLength, y0: s.y0, y1: s.y1, element: `${art}/wall`, variant: 0 })
    }
    return { cells, features, bays: 0 }
  }

  const bayW = usable / bays
  const margin = (wallLength - bays * bayW) / 2
  /*
   * A porte cochère: the carriage door into the courtyard, on one wall in three of a Paris block. The centre
   * bay of the ground floor, full storey height, where a shop would otherwise be. It is the single most
   * Parisian thing at eye level, and it breaks up a row of shops the way the real street is broken up.
   */
  const carriageBay = (plan.style === 'haussmann' || plan.style === 'marais') && bays >= 3
    && rng(seed ^ 0x0c0c4e)() < 1 / 3 ? Math.floor(bays / 2) : -1
  // a dressed building's shops (Dress.shops): on the street front only, and there all of it, or one shop of a bay or two
  // in the middle, or none
  const d = plan.dress
  const oneN = bays >= 4 ? 2 : 1
  const one0 = Math.floor((bays - oneN) / 2)
  // (a shopping street's front always has its shop: Mission, 24th, Valencia — the warehouse ground floor is for the side streets)
  const shops = d?.shops === 'none' && street?.main ? 'one' : d?.shops
  // a cheap modern block's colour panels: a run of one or two bays in every three or four, on the street front
  const br = rng(seed ^ 0xb10c)
  const period = 3 + Math.floor(br() * 2), width = 1 + Math.floor(br() * 2), off = Math.floor(br() * period)
  const blockBay = (b: number): boolean => !!d?.blocks && street !== null && (b + off) % period < width
  const shopBay = (b: number): boolean => !d || (street !== null && (shops === 'all' || (shops === 'one' && b >= one0 && b < one0 + oneN)))
  // a label's ground floor (Dress.ground): every bay of the street front named, from any style's painting
  // (on the walls the building shows the street, whether or not the street index found a street there: a label read them
  // off a photograph of one — wave 5, a corner block's box bays went missing on a side the index had no street for)
  const labelled = d?.ground !== undefined || d?.bayStacks !== undefined
  const shown = street ?? (labelled && role.face ? {} : null)
  const mix = d?.ground && shown !== null ? groundBays(bays, d.ground) : null

  for (const s of plan.storeys) {
    // The solid wall either side of the bays, at every storey, so the corners read as masonry.
    cells.push({ x0: 0, x1: margin, y0: s.y0, y1: s.y1, element: `${art}/wall`, variant: 0 })
    cells.push({ x0: wallLength - margin, x1: wallLength, y0: s.y0, y1: s.y1, element: `${art}/wall`, variant: 0 })

    for (let b = 0; b < bays; b++) {
      const x0 = margin + b * bayW
      const x1 = x0 + bayW
      // The variant stream is seeded from the bay and storey, so the same bay is the same on every re-bake but
      // its neighbour is not: this is what stops a wall of identical windows.
      const vr = rng(seed ^ (b * 73856093) ^ (s.index * 19349663))
      /*
       * …but not on a shop floor (2026-10-17: three identical OYSTER BAR fascias side by side read as a glitch, and five
       * paintings dealt out bay by bay set the same one beside itself one bay in five): there the paintings step through
       * the set bay by bay from a seeded start, so no two neighbouring shops are the same. (They went in pairs for a few
       * hours, a shop two bays wide — but each bay paints its own fascia, so the pair read CLAM BAR | CLAM BAR.)
       */
      const shopGround = s.kind === 'ground' && (mix ? mix[b] === 'shop' : plan.ground !== 'plain' && b !== carriageBay && shopBay(b))
      const variant = shopGround ? ((rng(seed ^ 0x5e11)() + b * 0.381966) % 1) : vr()

      let element: string
      if (s.kind === 'ground' && mix) element = mix[b] === 'window' ? `${art}/window` : groundElement(mix[b] as Exclude<GroundBay, 'window'>, art, groundArt)
      else if (s.kind === 'ground' && b === carriageBay) element = `${art}/carriage`
      // ('plain': a ground floor of the style's own windows — a school's, where the style would have shops)
      else if (s.kind === 'ground') element = plan.ground === 'plain' || !shopBay(b) ? `${art}/window` : `${groundArt}/${plan.ground}`
      else if (s.kind === 'top' && plan.top === 'mansard') element = `${art}/dormer`
      else element = `${art}/window`

      cells.push({ x0, x1, y0: s.y0, y1: s.y1, element, variant, ...(blockBay(b) && s.kind !== 'ground' ? { tint: plan.palette.accent } : {}) })

      // A window sill is a small ledge, and a row of them is what catches the light on a street.
      if (s.kind !== 'ground' && st.window.sill > 0.1 && plan.style !== 'skyscraper') {
        const winW = bayW * plan.window.widthFrac
        const wx = x0 + (bayW - winW) / 2
        features.push({
          kind: 'sill', y0: s.y0 + (s.y1 - s.y0) * 0.02, y1: s.y0 + (s.y1 - s.y0) * 0.06,
          depth: 0.12, x0: wx - 0.08, x1: wx + winW + 0.08, colour: plan.palette.trim,
        })
      }
    }

    // Balconies: the continuous ones run the whole wall (Haussmann's defining feature); the others sit on
    // their own bay.
    if (plan.hasBalconyAt(s.index) && st.balcony) {
      if (st.balcony.continuous) {
        features.push({
          kind: 'balcony', y0: s.y0, y1: s.y0 + 1.0, depth: st.balcony.depth, colour: plan.palette.accent,
        })
      } else {
        for (let b = 0; b < bays; b += 2) {
          features.push({
            kind: 'balcony', y0: s.y0, y1: s.y0 + 1.0, depth: st.balcony.depth,
            x0: margin + b * bayW, x1: margin + (b + 1) * bayW, colour: plan.palette.accent,
          })
        }
      }
    }

    // Brutalism leaves the floor slab showing; it is the whole look.
    if (st.slabBands && s.kind !== 'ground') {
      features.push({ kind: 'slabBand', y0: s.y0 - 0.25, y1: s.y0 + 0.25, depth: 0.35, colour: plan.palette.trim })
    }
  }

  /*
   * A New York tenement's fire escape: an iron balcony on every storey from the second up, across the
   * centre two bays of a wall broad enough to have them, a stair between each. The thing a New York street
   * is remembered by, and nowhere else has it.
   */
  // (not on a hospital, a school, a church: St Mary's and CPMC wore the tenement's ladders, 2026-10-04)
  if (st.features?.fireEscape && (plan.dress?.fireEscape ?? true) && role.face && !plan.institution && bays >= 3 && plan.storeys.length >= 3) {
    const b0 = Math.floor((bays - 2) / 2)
    const fx0 = margin + b0 * bayW
    const fx1 = fx0 + 2 * bayW
    for (const s of plan.storeys) {
      if (s.index < 1) continue
      features.push({ kind: 'fireEscape', y0: s.y0, y1: s.y1, depth: 0.9, x0: fx0, x1: fx1, colour: '#1d1d1f' })
    }
  }

  /*
   * San Francisco's bay windows: a three-sided bay through every storey of the STREET wall — the narrow one;
   * a Victorian's lot is seven or eight metres wide and its long walls are party walls. Over the first two
   * bays, leaving the rest of the front for the door.
   */
  /*
   * …and the apartment block's: bays in stacks up a wide front, two window bays each with a flat bay between
   * (the fire escape's, when there is one), from the first floor up — the ground storey is the entrance.
   */
  // (a label's count of stacks replaces the style's bays: Dress.bayStacks, drawn in dressWall)
  const ownBays = plan.dress?.bayStacks === undefined
  if (ownBays && st.features?.bayWindows === 'stacks' && role.face && !plan.institution && bays >= 4 && plan.storeys.length >= 3) {
    const esc = st.features.fireEscape && bays >= 3 ? Math.floor((bays - 2) / 2) : -99
    for (let b = 0; b + 2 <= bays; b += 3) {
      if (b <= esc + 1 && b + 2 > esc) continue          // not across the fire escape
      for (const s of plan.storeys) {
        if (s.kind === 'ground') continue
        features.push({ kind: 'bay', y0: s.y0, y1: s.y1, depth: 0.8, x0: margin + b * bayW, x1: margin + (b + 2) * bayW, colour: plan.palette.trim })
      }
    }
  }
  if (ownBays && st.features?.bayWindows === true && role.front && wallLength <= 9.5 && bays >= 2) {
    const n = bays >= 3 ? 2 : 1
    for (const s of plan.storeys) {
      features.push({ kind: 'bay', y0: s.y0 + (s.kind === 'ground' ? 0.4 : 0), y1: s.y1, depth: 0.9,
        x0: margin, x1: margin + n * bayW, colour: plan.palette.trim })
    }
  }

  // A string course is the horizontal band that separates the ground floor from the rest; classical and
  // Haussmann facades both have one, and it is what makes the base read as a base.
  if (st.stringCourse && plan.storeys.length > 1) {
    const y = plan.storeys[0].y1
    features.push({ kind: 'stringCourse', y0: y - 0.22, y1: y + 0.1, depth: 0.2, colour: plan.palette.trim })
  }

  if (st.pilasters) {
    for (let b = 0; b <= bays; b++) {
      const x = margin + b * bayW
      features.push({
        kind: 'pilaster', y0: plan.storeys[0].y1, y1: plan.height, depth: 0.22,
        x0: x - 0.18, x1: x + 0.18, colour: plan.palette.trim,
      })
    }
  }

  // Everything is closed off at the top, but by what depends on the style: a deep bracketed cornice on a
  // brownstone, a thin coping on a brick parapet, almost nothing on a tower.
  // (a dressed building's parapet may stand higher, and then it is a wall with a back to it: `parapet` draws one)
  const rise = plan.dress?.parapet ?? 0
  if (plan.dress?.cap !== 'overhang') {
    features.push({
      kind: plan.top === 'parapet' || rise > 0 ? 'parapet' : 'cornice',
      y0: plan.height - st.cornice.height, y1: plan.height + st.cornice.height * 0.35 + rise,
      depth: st.cornice.depth, colour: rise > 0 ? plan.palette.wall : plan.palette.trim,
    })
    // a raised parapet is more wall, in the wall's colour, with the coping along its top (a storefront's charcoal trim
    // drawn a metre and a half deep read as a black slab on the roof)
    if (rise > 0) {
      const top = plan.height + st.cornice.height * 0.35 + rise
      features.push({ kind: 'cornice', y0: top - 0.14, y1: top + 0.04, depth: st.cornice.depth + 0.06, colour: plan.palette.trim })
    }
  }
  if (plan.dress) dressWall(plan, plan.dress, features, wallLength, margin, bayW, bays, shown)
  // a Victorian's gable, or its false front, rising above the cornice on the street wall (or a label's, on a front of a
  // house's width; or none, where the label saw none)
  const gable = plan.dress?.gable
  if ((gable ?? plan.top === 'gable') && role.front && wallLength <= (gable ? 12 : 9.5)) {
    features.push({ kind: 'gable', y0: plan.height + st.cornice.height * 0.35, y1: plan.height + 1.9,
      depth: 0.05, colour: plan.palette.wall })
  }

  return { cells, features, bays }
}

/**
 * A dressed building's ornament on one wall. Only the overhanging roof slab goes round every wall; everything else is
 * for the street front, which is what a passer-by sees and what the builder paid to decorate.
 */
function dressWall(plan: FacadePlan, d: Dress, features: Feature[], len: number, margin: number, bayW: number, bays: number,
  street: { pavement?: number | null; main?: boolean } | null): void {
  const h = plan.height
  const g = plan.storeys[0]
  const shop = g.kind === 'ground' && plan.storeys.length > 1
  const trim = plan.palette.trim
  const wall = plan.palette.wall
  if (d.cap === 'overhang') {
    features.push({ kind: 'cornice', y0: h - 0.05, y1: h + 0.22, depth: 0.9, colour: trim })
  }
  if (!street) return
  const top = h + style(plan.style).cornice.height * 0.35 + d.parapet

  if (d.cap === 'corbel') {
    // three courses, each a brick further out than the one below, under the coping
    features.push({ kind: 'cornice', y0: h - 1.0, y1: h - 0.78, depth: 0.08, colour: wall })
    features.push({ kind: 'cornice', y0: h - 0.78, y1: h - 0.56, depth: 0.16, colour: wall })
    features.push({ kind: 'cornice', y0: h - 0.56, y1: h - 0.34, depth: 0.24, colour: wall })
  } else if (d.cap === 'bracket' && bays > 0) {
    features.push({ kind: 'cornice', y0: h - 0.8, y1: h - 0.32, depth: 0.55, colour: trim })
    for (let b = 0; b <= bays; b++) {
      const x = margin + b * bayW
      features.push({ kind: 'bracket', y0: h - 1.25, y1: h - 0.8, depth: 0.42, x0: x - 0.12, x1: x + 0.12, colour: trim })
    }
  } else if (d.cap === 'panel' && len >= 6) {
    const w = len * d.panel
    const x0 = (len - w) / 2
    const y1 = top + 0.7 + d.panel * 1.2
    features.push({ kind: 'panel', y0: h - 0.3, y1, depth: 0.06, x0, x1: x0 + w, colour: wall })
    features.push({ kind: 'cornice', y0: y1 - 0.12, y1: y1 + 0.06, depth: 0.16, x0: x0 - 0.1, x1: x0 + w + 0.1, colour: trim })
  }

  if (shop && d.base) features.push({ kind: 'stringCourse', y0: g.y1 - 0.12, y1: g.y1 + 0.22, depth: 0.22, colour: trim })
  const shops = d.shops === 'none' && street.main ? 'one' : d.shops
  if (shop && d.canopy && bays > 0 && d.ground) {
    // over each run of a label's shop bays
    const reach = Math.max(0.6, Math.min(1.3, (street.pavement ?? 9) - 0.3))
    const y0 = Math.max(3.4, g.y1 - 0.3)
    const mix = groundBays(bays, d.ground)
    for (let b = 0; b < bays; b++) {
      if (mix[b] !== 'shop' || mix[b - 1] === 'shop') continue
      let e = b
      while (mix[e + 1] === 'shop') e++
      features.push({ kind: 'canopy', y0, y1: y0 + 0.16, depth: reach, x0: margin + b * bayW, x1: margin + (e + 1) * bayW, colour: plan.palette.accent })
    }
  } else if (shop && d.canopy && bays > 0 && shops !== 'none') {
    const reach = Math.max(0.6, Math.min(1.3, (street.pavement ?? 9) - 0.3))
    const y0 = Math.max(3.4, g.y1 - 0.3)
    // over the one shop's bays (planWall's `one0`), or the whole front
    const n = bays >= 4 ? 2 : 1
    const b0 = shops === 'one' ? Math.floor((bays - n) / 2) : 0
    const x0 = shops === 'one' ? margin + b0 * bayW : margin
    const x1 = shops === 'one' ? margin + (b0 + n) * bayW : len - margin
    features.push({ kind: 'canopy', y0, y1: y0 + 0.16, depth: reach, x0, x1, colour: plan.palette.accent })
  }
  if (d.belts) {
    for (const s of plan.storeys) {
      if (s.index < 2) continue
      features.push({ kind: 'slabBand', y0: s.y0 - 0.12, y1: s.y0 + 0.1, depth: 0.1, colour: trim })
    }
  }
  if (bays >= 2 && (d.piers || d.fins)) {
    for (let b = d.fins ? 1 : 0; b <= (d.fins ? bays - 1 : bays); b++) {
      const x = margin + b * bayW
      const half = d.fins ? 0.07 : 0.28
      features.push({ kind: 'pilaster', y0: shop ? g.y1 : 0, y1: h - (d.cap === 'corbel' ? 1.0 : 0.3), depth: d.fins ? 0.38 : 0.14,
        x0: x - half, x1: x + half, colour: d.fins ? trim : wall })
    }
  }
  if (d.fireEscape && !style(plan.style).features?.fireEscape && bays >= 3 && plan.storeys.length >= 3) {
    const b0 = Math.floor((bays - 2) / 2)
    for (const s of plan.storeys) {
      if (s.index < 1) continue
      features.push({ kind: 'fireEscape', y0: s.y0, y1: s.y1, depth: 0.9, x0: margin + b0 * bayW, x1: margin + (b0 + 2) * bayW, colour: '#1d1d1f' })
    }
  }
  if (d.bayStacks !== undefined) {
    // a label's count: one stack at the end of the front, as on a 25-foot lot; two or more spread across it, a bay wide
    // on a narrow front and two on a wide one
    const w = bays >= 5 ? 2 : 1
    const n = Math.min(d.bayStacks <= 1 ? d.bayStacks : Math.max(2, Math.floor((bays + 1) / 3)), Math.floor((bays + 1) / (w + 1)))
    for (let k = 0; k < n && plan.storeys.length >= 2; k++) {
      const b0 = n === 1 ? 0 : Math.round((k * (bays - w)) / (n - 1))
      for (const s of plan.storeys) {
        if (s.kind === 'ground') continue
        features.push({ kind: 'bay', y0: s.y0, y1: s.y1, depth: 0.8, x0: margin + b0 * bayW, x1: margin + (b0 + w) * bayW, colour: trim,
          shape: d.bayShape ?? (d.victorian === 'stick' ? 'square' : undefined) })
      }
    }
  } else if (d.bays && bays >= 3 && plan.storeys.length >= 2) {
    // over the two bays nearest one end, as on a 25-foot lot, the stair to the flats at the other; on a wide front, in
    // stacks of two bays with one between
    const starts = bays >= 6 ? Array.from({ length: Math.floor((bays + 1) / 3) }, (_, k) => k * 3) : [0]
    for (const b0 of starts) {
      for (const s of plan.storeys) {
        if (s.kind === 'ground') continue
        features.push({ kind: 'bay', y0: s.y0, y1: s.y1, depth: 0.8, x0: margin + b0 * bayW, x1: margin + (b0 + 2) * bayW, colour: trim })
      }
    }
  }
  if (d.balconies && bays >= 2) {
    for (const s of plan.storeys) {
      if (s.kind === 'ground') continue
      for (let b = 0; b < bays; b += 2) {
        // (a Mediterranean block's are wrought-iron balconettes, a step deep; so are a label's, in iron — wave 5: the
        //  accent-coloured platforms read as orange shelves on fronts that have a railing at a window or two)
        const iron = d.balconyKind === 'balconettes' || (!d.balconyKind && plan.style === 'aptmed')
        features.push({ kind: 'balcony', y0: s.y0, y1: s.y0 + 1.0, depth: iron ? 0.4 : 1.0, x0: margin + b * bayW + 0.1,
          x1: margin + (b + 1) * bayW - 0.1, colour: iron ? '#232325' : d.balconyKind ? plan.palette.trim : plan.palette.accent })
      }
    }
  }
  if (d.victorian) dressVictorian(plan, d.victorian, features, len, margin, bayW, bays)
}

/**
 * A painted lady's ornament on its street front (Dress.victorian): a moulded hood over every upper window, big paired
 * brackets under the cornice (the Italianate's, and the Stick house's smaller), thin vertical boards at the corners
 * (Stick), and the Queen Anne's turret on the corner away from the bay. All in the trim colour, which is the point: a
 * painted lady is two or three colours, and the trim is what reads from across the street.
 */
function dressVictorian(plan: FacadePlan, kind: NonNullable<Dress['victorian']>, features: Feature[], len: number,
  margin: number, bayW: number, bays: number): void {
  const trim = plan.palette.trim
  const h = plan.height
  const winW = bayW * plan.window.widthFrac
  for (const s of plan.storeys) {
    if (s.kind === 'ground') continue
    const y = s.y1 - (s.y1 - s.y0) * 0.14
    for (let b = 0; b < bays; b++) {
      const x0 = margin + b * bayW + (bayW - winW) / 2
      // a pediment-ish hood: a lip, and on an Italianate a second, deeper one above it
      features.push({ kind: 'cornice', y0: y, y1: y + 0.16, depth: 0.16, x0: x0 - 0.12, x1: x0 + winW + 0.12, colour: trim })
      if (kind === 'italianate') features.push({ kind: 'cornice', y0: y + 0.16, y1: y + 0.26, depth: 0.24, x0: x0 - 0.2, x1: x0 + winW + 0.2, colour: trim })
    }
  }
  if (kind !== 'queen_anne' && bays > 0) {
    // brackets in pairs under the top, deep on an Italianate
    const big = kind === 'italianate'
    features.push({ kind: 'cornice', y0: h - (big ? 0.9 : 0.6), y1: h - 0.25, depth: big ? 0.7 : 0.45, colour: trim })
    for (let b = 0; b <= bays; b++) {
      for (const dx of [-0.22, 0.22]) {
        const x = margin + b * bayW + dx
        if (x < 0.1 || x > len - 0.1) continue
        features.push({ kind: 'bracket', y0: h - (big ? 1.7 : 1.2), y1: h - (big ? 0.9 : 0.6), depth: big ? 0.6 : 0.4, x0: x - 0.08, x1: x + 0.08, colour: trim })
      }
    }
  }
  if (kind === 'stick') {
    for (const x of [0.12, len - 0.12]) features.push({ kind: 'pilaster', y0: 0, y1: h, depth: 0.08, x0: x - 0.12, x1: x + 0.12, colour: trim })
  }
  if (kind === 'queen_anne' && len >= 5 && plan.storeys.length >= 2) {
    // the turret, on the corner away from the bay (the bays go from the left), from the first floor to above the roof
    const r = Math.min(1.6, len * 0.17)
    features.push({ kind: 'turret', y0: plan.storeys[1].y0, y1: h + 0.8, depth: r * 0.8, x0: len - 2 * r - 0.1, x1: len - 0.1, colour: plan.palette.wall })
    features.push({ kind: 'cornice', y0: h - 0.5, y1: h - 0.2, depth: 0.35, colour: trim })
  }
}
