/**
 * A city's regional character: the palette its stone comes in, what stands on its pavements, how its
 * crossings are marked. Read from regions.json; see the note there.
 */
import regions from './regions.json' with { type: 'json' }
import type { Palette, StyleId } from './facade.ts'
import type { ShopLanguage } from './shopnames.ts'
import type { Roofscape } from '../render/roofs.ts'

export interface Bollards { colour: string; spacing: number; height: number; maxPavement: number }

/** Storeys for a building nobody tagged, by what kind of building it is. */
export interface DefaultLevels { residential: number; commercial: number; house: number; industrial: number }

/**
 * HOW a region guesses the height of an untagged building — the method, not just the numbers, because the
 * right method differs by city. Paris is a city of uniform blocks, so the tagged neighbours are the best
 * witness there is. The Loop is towers beside three-storey survivors, so the median of the neighbours
 * would turn every untagged walk-up into a forty-storey tower; a low percentile is the honest guess. Nob
 * Hill is houses and small apartment blocks, where the building type says more than the neighbours.
 */
export interface LevelInference {
  /** metres around the building's centre in which tagged neighbours count */
  radius: number
  /** fewer tagged neighbours than this and they are not asked */
  minNeighbours: number
  /** which neighbour to believe: 0.5 is the median, 0.25 the lower quartile */
  percentile: number
  /** the neighbours' answer is clamped to this, so a tower next door cannot make a walk-up a tower */
  maxLevels: number
  /** building=* values whose level count is decided by the type alone, before the neighbours are asked */
  types: Record<string, number | 'house' | 'industrial'>
}

/**
 * What a way looks like inside open country — a big park, a forest, a nature reserve — where the city's
 * defaults are not merely turned down but INVERTED (city/park-area.ts, docs/PARKS.md). Selected by AREA and
 * not by city, so it serves Golden Gate Park, the Presidio, Central Park and the Bois de Boulogne alike.
 */
export interface ParkStyle {
  /** a tile's piece of park must cover at least this, m², to count — keeps pocket squares out */
  minPieceM2: number
  /** pavements beside a park road: there are none, and what OSM calls one is the detached trail */
  pavements: boolean
  /** a park road is one narrow strip, whatever OSM's lane count says */
  maxRoadWidth: number
  /** a trail is as wide as it is mapped, up to this — the rider rides it, so it is not narrowed away */
  maxTrailWidth: number
  /** the only mapped furniture a national park has; everything else is suppressed inside the area */
  keepFurniture: string[]
  /** how far you can see: *"There are almost no long sight lines, due to hills or trees."* */
  far: number
  /** and how thick the air is at that distance — heavier than the city's, and more accurate for it */
  fogDensity: number
}

export interface Region {
  id: string
  palettes: Partial<Record<StyleId, Palette[]>>
  /** `terraces`: café tables and chairs on the pavement in front of every named café (render/terraces.ts) */
  furniture: { lampPosts: boolean; wallLamps: boolean; benches: boolean; bollards: Bollards | null; terraces?: boolean
    /** the busy pavement (SF): newspaper racks and cans at the corners, parking meters along commercial kerbs,
     *  wooden utility poles and their wires down residential streets, and on brick streets the chain kerb */
    clutter?: boolean }
  /** zebra: close-set bars; bands: Paris's broad bars, wider apart; continental: North America's; none */
  crossings: 'zebra' | 'bands' | 'continental' | 'none'
  /** the centre line: Europe's dashed white, or North America's solid double yellow (none on one-way streets) */
  centreLine: 'white' | 'doubleYellow'
  /** red fire hydrants along the pavements */
  hydrants: boolean
  /**
   * The hydrants' paint where it is not red: the body, and the bonnets drawn from by weight. San Francisco's are white
   * with coloured tops — and the high-pressure AWSS hydrants downtown blue-, red- or black-topped (owner, 2026-10-03:
   * "blue/white fire hydrants").
   */
  hydrantPaint?: { body: string; tops: [string, number][] }
  /** open country inside this region: see `ParkStyle`. Every region has one; `default`'s is the park rule. */
  park: ParkStyle
  /** what a traffic signal looks like: a slim Paris post, or a North American mast arm over the lanes */
  signals: 'post' | 'paris' | 'mastArm'
  /**
   * What a street's width means. `corridor` (Paris): building to building, the pavements carved out of it —
   * right for narrow medieval streets. `carriageway` (North America): kerb to kerb, the pavements added
   * outside it, with American default widths — carving a Brooklyn street's pavements out of it left a lane
   * 3.4 m wide between two enormous sidewalks.
   */
  streetWidth: 'corridor' | 'carriageway'
  /** the language invented shop names are in */
  shopNames: ShopLanguage
  defaultLevels: DefaultLevels
  levelInference: LevelInference
  /** what stands on the roofs: Paris's chimney pots and dormers */
  roofscape: Roofscape
  /** how streets are named at corners: Paris's blue enamel wall plaques, New York's green blades, or nothing */
  streetSigns: 'plaque' | 'blade' | 'none'
  /** how often a shop on a main street has a canvas awning out over the pavement, 0–1 (Paris: nearly all) */
  awnings?: number
  /** how far below its lowest bank a river's surface lies, metres: the elevation data smooths a walled river's
   *  drop away (Paris: the Seine runs ~2.5 m below the lower quays, ~7 m below the streets) */
  riverDrop?: number
  /** walks laid on a viaduct's roof, by name, and how high (Paris: the Coulée Verte René-Dumont on the Viaduc
   *  des Arts, BUGS.md #32): OSM puts them at street level, where they ran hidden inside the viaduct */
  elevatedWalks?: { name: string; height: number }[]
  /**
   * Foot bridges whose OSM `layer` is not a height: within `radius` metres of the point their layer counts as at
   * most `layer` (tools/bridges.ts). OSM numbers a spiral ramp's turns 3, 4, 5 so that they can cross themselves,
   * and the bake stacked them 5.5 m a layer — the Market Street overpass helix stood 36 m up (BUGFIX #323).
   */
  footBridgeLayers?: { name: string; lat: number; lon: number; radius: number; layer: number }[]
  /**
   * Streets whose pavements are brick rather than concrete, by name (San Francisco: Market Street's red brick,
   * Embarcadero to Octavia), and the brick's colour.
   */
  brickStreets?: { names: string[]; colour: [number, number, number] }
  /**
   * Streets hung with strings of lanterns from wall to wall, between two points (render/city.ts): San Francisco's
   * Grant Avenue through Chinatown, red paper lanterns on wires every few metres (2026-10-04).
   */
  lanternStreets?: { street: string; from: [number, number]; to: [number, number]; colour?: [number, number, number] }[]
  /** marked crossings painted in the six rainbow bands within `radius` m of a point (the Castro at 18th Street) */
  rainbowCrossings?: { name: string; lat: number; lon: number; radius: number }[]
  /** the IANA time zone the city keeps, for its public clocks (render/clocks.ts) */
  timeZone?: string
  /** what the speedometer reads in: miles and mph, or kilometres and km/h (ui/hud.ts) */
  units?: 'imperial' | 'metric'
  /**
   * A named street's lanes painted over a stretch between two points (tools/street-paint.ts): `transit` the middle
   * lanes red, `bike` the kerb lanes green. San Francisco's Market Street (owner, 2026-10-04): red down the streetcar
   * lanes from Gough to 3rd and nowhere else, green bike lanes from Gough to 8th.
   */
  streetPaint?: { street: string; from: [number, number]; to: [number, number]; paint: 'transit' | 'bike'; note?: string }[]
  /** public stairways OSM does not have, by hand: each a polyline of [lat, lon] from one end to the other */
  stairways?: { name: string; points: [number, number][]; width?: number }[]
  /** squares OSM maps only as lines (the Trocadéro's parvis): paved areas by hand, rings of [lat, lon] */
  /** `brick`: laid in the region's street brick (`brickStreets.colour`) */
  pavedSquares?: { name: string; ring: [number, number][]; brick?: boolean }[]
  /** the steel of an elevated railway — the Loop's L is painted a dark green-black */
  elevatedRailColour: string
  /** the elevated railway's design: 'bent' (the Loop's L: steel bents) or 'paris' (the Métro's iron viaducts on
   *  cast-iron columns and stone piers, with its stations: PARIS_EXPAND §5 C) */
  viaduct?: 'bent' | 'paris'
  /** the stations on the viaduct, where a platform and its glass canopy stand */
  viaductStations?: { name: string; lat: number; lon: number }[]
  /** the name plate on a landmark building: Paris engraves dark capitals into a cream stone plate */
  landmarkPlate: { fill: string; text: string }
  /** how the city draws the furniture OSM maps at points (package `furniture`) */
  pointFurniture: {
    metro: 'guimard' | 'nyc' | 'cta' | 'generic' | 'bart'
    /** a Paris drinking fountain is a Wallace fountain whether or not the mapper said so */
    fountain: 'wallace' | 'tap'
    kiosk: 'paris' | 'plain'
    bikeColour: string
    /** the American street's mapped furniture (render/us-furniture.ts): stop signs, post boxes, billboards */
    american?: boolean
    /** what a bus stop is: Muni's yellow-banded pole, or a plain pole with a flag */
    busStop?: 'muni' | 'plain'
  }
}

type Raw = Omit<Partial<Region>, 'id' | 'levelInference'> & { note?: string; levelInference?: Partial<LevelInference> }

export function region(id: string | undefined): Region {
  const all = regions as unknown as Record<string, Raw>
  const base = all.default as Raw & Omit<Region, 'id'>
  const own = id ? all[id] : undefined
  return {
    id: own ? id! : 'default',
    palettes: { ...base.palettes, ...(own?.palettes ?? {}) },
    furniture: { ...base.furniture, ...(own?.furniture ?? {}) },
    crossings: own?.crossings ?? base.crossings,
    centreLine: own?.centreLine ?? base.centreLine,
    hydrants: own?.hydrants ?? base.hydrants,
    hydrantPaint: own?.hydrantPaint ?? base.hydrantPaint,
    park: { ...base.park, ...(own?.park ?? {}) },
    signals: own?.signals ?? base.signals,
    streetWidth: own?.streetWidth ?? base.streetWidth,
    shopNames: own?.shopNames ?? base.shopNames,
    defaultLevels: { ...base.defaultLevels, ...(own?.defaultLevels ?? {}) },
    roofscape: { ...base.roofscape, ...(own?.roofscape ?? {}) },
    streetSigns: own?.streetSigns ?? base.streetSigns,
    awnings: own?.awnings ?? base.awnings,
    riverDrop: own?.riverDrop ?? base.riverDrop,
    elevatedWalks: own?.elevatedWalks ?? base.elevatedWalks,
    footBridgeLayers: own?.footBridgeLayers ?? base.footBridgeLayers,
    pavedSquares: own?.pavedSquares ?? base.pavedSquares,
    brickStreets: own?.brickStreets ?? base.brickStreets,
    timeZone: own?.timeZone ?? base.timeZone,
    lanternStreets: own?.lanternStreets ?? base.lanternStreets,
    rainbowCrossings: own?.rainbowCrossings ?? base.rainbowCrossings,
    units: own?.units ?? base.units,
    streetPaint: own?.streetPaint ?? base.streetPaint,
    stairways: own?.stairways ?? base.stairways,
    pointFurniture: { ...base.pointFurniture, ...(own?.pointFurniture ?? {}) },
    landmarkPlate: { ...base.landmarkPlate, ...(own?.landmarkPlate ?? {}) },
    elevatedRailColour: own?.elevatedRailColour ?? base.elevatedRailColour,
    viaduct: own?.viaduct ?? base.viaduct,
    viaductStations: own?.viaductStations ?? base.viaductStations,
    levelInference: {
      ...base.levelInference,
      ...(own?.levelInference ?? {}),
      types: { ...base.levelInference.types, ...(own?.levelInference?.types ?? {}) },
    },
  }
}
