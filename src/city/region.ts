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

export interface Region {
  id: string
  palettes: Partial<Record<StyleId, Palette[]>>
  /** `terraces`: café tables and chairs on the pavement in front of every named café (render/terraces.ts) */
  furniture: { lampPosts: boolean; wallLamps: boolean; benches: boolean; bollards: Bollards | null; terraces?: boolean }
  /** zebra: close-set bars; bands: Paris's broad bars, wider apart; continental: North America's; none */
  crossings: 'zebra' | 'bands' | 'continental' | 'none'
  /** the centre line: Europe's dashed white, or North America's solid double yellow (none on one-way streets) */
  centreLine: 'white' | 'doubleYellow'
  /** red fire hydrants along the pavements */
  hydrants: boolean
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
  /** squares OSM maps only as lines (the Trocadéro's parvis): paved areas by hand, rings of [lat, lon] */
  pavedSquares?: { name: string; ring: [number, number][] }[]
  /** the steel of an elevated railway — the Loop's L is painted a dark green-black */
  elevatedRailColour: string
  /** the name plate on a landmark building: Paris engraves dark capitals into a cream stone plate */
  landmarkPlate: { fill: string; text: string }
  /** how the city draws the furniture OSM maps at points (package `furniture`) */
  pointFurniture: {
    metro: 'guimard' | 'nyc' | 'cta' | 'generic'
    /** a Paris drinking fountain is a Wallace fountain whether or not the mapper said so */
    fountain: 'wallace' | 'tap'
    kiosk: 'paris' | 'plain'
    bikeColour: string
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
    signals: own?.signals ?? base.signals,
    streetWidth: own?.streetWidth ?? base.streetWidth,
    shopNames: own?.shopNames ?? base.shopNames,
    defaultLevels: { ...base.defaultLevels, ...(own?.defaultLevels ?? {}) },
    roofscape: { ...base.roofscape, ...(own?.roofscape ?? {}) },
    streetSigns: own?.streetSigns ?? base.streetSigns,
    awnings: own?.awnings ?? base.awnings,
    riverDrop: own?.riverDrop ?? base.riverDrop,
    elevatedWalks: own?.elevatedWalks ?? base.elevatedWalks,
    pavedSquares: own?.pavedSquares ?? base.pavedSquares,
    pointFurniture: { ...base.pointFurniture, ...(own?.pointFurniture ?? {}) },
    landmarkPlate: { ...base.landmarkPlate, ...(own?.landmarkPlate ?? {}) },
    elevatedRailColour: own?.elevatedRailColour ?? base.elevatedRailColour,
    levelInference: {
      ...base.levelInference,
      ...(own?.levelInference ?? {}),
      types: { ...base.levelInference.types, ...(own?.levelInference?.types ?? {}) },
    },
  }
}
