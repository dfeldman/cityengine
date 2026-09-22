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

export type GroundKind = 'shopfront' | 'stoop' | 'arcade' | 'glazed' | 'recessed' | 'plain'
export type TopKind = 'cornice' | 'parapet' | 'mansard' | 'entablature' | 'flatband' | 'crown' | 'gable'
export type WindowKind = 'french' | 'sash' | 'pedimented' | 'punched' | 'ribbon' | 'recessed' | 'curtain' | 'casement'
  | 'chicago' | 'vosges' | 'opera' | 'operaGlass'

export interface Palette { wall: string; trim: string; roof: string; accent: string }

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
  features?: { fireEscape?: boolean; bayWindows?: boolean }
  palettes: Palette[]
}

export const STYLES = stylesData.styles as unknown as Style[]
const BY_ID = new Map(STYLES.map((s) => [s.id, s]))

export function style(id: StyleId): Style {
  const s = BY_ID.get(id)
  if (!s) throw new Error(`unknown style ${id}`)
  return s
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
}

export type FeatureKind = 'cornice' | 'balcony' | 'stringCourse' | 'sill' | 'slabBand' | 'pilaster' | 'parapet'
  | 'fireEscape' | 'bay' | 'gable'

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
  top: TopKind
  hasBalconyAt: (level: number) => boolean
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
  osm: { levels?: number; height?: number; minHeight?: number },
  /** a region's own palettes for this style, which replace the style's (Paris is cream) */
  palettes?: Palette[],
): FacadePlan {
  const st = style(styleId)
  const r = rng(seed)
  const palette = pick(r, palettes && palettes.length > 0 ? palettes : st.palettes)

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
    if (k < 0.75 || k > 1.35) {
      levels = Math.max(1, Math.round((target - (aloft ? 0 : groundH - levelH)) / levelH))
      storeys = lay(levels)
      extent = storeys[storeys.length - 1].y1 - base
      k = target / extent
    }
    storeys = storeys.map((st2) => ({ ...st2, y0: base + (st2.y0 - base) * k, y1: base + (st2.y1 - base) * k }))
  }
  const y = storeys[storeys.length - 1].y1

  const balconyLevels = new Set(st.balcony?.levels ?? [])
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
    ground: st.ground,
    top: st.top,
    hasBalconyAt: (level) => balconyLevels.has(level),
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
export function planWall(plan: FacadePlan, wallLength: number, seed: number): WallPlan {
  const st = style(plan.style)
  const r = rng(seed)
  const cells: Cell[] = []
  const features: Feature[] = []

  const minMargin = between(r, st.pier) * 0.9
  const usable = wallLength - 2 * minMargin
  let bays = Math.max(0, Math.round(usable / plan.bayWidth))
  while (bays > 0 && usable / bays < MIN_BAY) bays--

  if (bays === 0) {
    // Too narrow for a window: a blank return wall, which is a real thing on the side of a row house.
    for (const s of plan.storeys) {
      cells.push({ x0: 0, x1: wallLength, y0: s.y0, y1: s.y1, element: `${plan.style}/wall`, variant: 0 })
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

  for (const s of plan.storeys) {
    // The solid wall either side of the bays, at every storey, so the corners read as masonry.
    cells.push({ x0: 0, x1: margin, y0: s.y0, y1: s.y1, element: `${plan.style}/wall`, variant: 0 })
    cells.push({ x0: wallLength - margin, x1: wallLength, y0: s.y0, y1: s.y1, element: `${plan.style}/wall`, variant: 0 })

    for (let b = 0; b < bays; b++) {
      const x0 = margin + b * bayW
      const x1 = x0 + bayW
      // The variant stream is seeded from the bay and storey, so the same bay is the same on every re-bake but
      // its neighbour is not: this is what stops a wall of identical windows.
      const vr = rng(seed ^ (b * 73856093) ^ (s.index * 19349663))
      const variant = vr()

      let element: string
      if (s.kind === 'ground' && b === carriageBay) element = `${plan.style}/carriage`
      else if (s.kind === 'ground') element = `${plan.style}/${plan.ground}`
      else if (s.kind === 'top' && plan.top === 'mansard') element = `${plan.style}/dormer`
      else element = `${plan.style}/window`

      cells.push({ x0, x1, y0: s.y0, y1: s.y1, element, variant })

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
  if (st.features?.fireEscape && bays >= 3 && plan.storeys.length >= 3) {
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
  if (st.features?.bayWindows && wallLength <= 9.5 && bays >= 2) {
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
  features.push({
    kind: plan.top === 'parapet' ? 'parapet' : 'cornice',
    y0: plan.height - st.cornice.height, y1: plan.height + st.cornice.height * 0.35,
    depth: st.cornice.depth, colour: plan.palette.trim,
  })
  // a Victorian's gable, or its false front, rising above the cornice on the street wall
  if (plan.top === 'gable' && wallLength <= 9.5) {
    features.push({ kind: 'gable', y0: plan.height + st.cornice.height * 0.35, y1: plan.height + 1.9,
      depth: 0.05, colour: plan.palette.wall })
  }

  return { cells, features, bays }
}
