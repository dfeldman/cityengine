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
    /** Paris: tall lanterns on the boulevards and avenues only, where `lampPosts` is off (render/models.ts parisLamp) */
    boulevardLamps?: boolean
    /** the busy pavement (SF): newspaper racks and cans at the corners, parking meters along commercial kerbs,
     *  wooden utility poles and their wires down residential streets, and on brick streets the chain kerb */
    clutter?: boolean }
  /** zebra: close-set bars; bands: Paris's broad bars, wider apart; continental: North America's; none */
  crossings: 'zebra' | 'bands' | 'continental' | 'none'
  /** the centre line: Europe's dashed white, or North America's solid double yellow (none on one-way streets) */
  centreLine: 'white' | 'doubleYellow'
  /**
   * Paris's road paint (owner, 2026-10-29: "the street lines are different. mostly single lines with zigzags for no
   * parking and checkerboards"): the axis line only, no edge lines; the yellow zigzag along the kerb at a bus stop (the
   * no-stopping mark); the white damier across a signalled junction's box.
   */
  roadPaint?: 'paris'
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
   * Islands a ferry serves (game/stations.ts) but no street reaches: their network is kept, though it is not the
   * city's largest — the bake and the ride graph otherwise drop every island (San Francisco: Alcatraz, BUGS.md #263).
   * Any edge within `radius` metres of the point keeps its whole island.
   */
  ferryIslands?: { name: string; lat: number; lon: number; radius: number }[]
  /**
   * Streets whose pavements are brick rather than concrete, by name (San Francisco: Market Street's red brick,
   * Embarcadero to Octavia), and the brick's colour.
   */
  brickStreets?: { names: string[]; colour: [number, number, number]; share?: number }
  /**
   * Streets hung with strings of lanterns from wall to wall, between two points (render/city.ts): San Francisco's
   * Grant Avenue through Chinatown, red paper lanterns on wires every few metres (2026-10-04).
   */
  lanternStreets?: { street: string; from: [number, number]; to: [number, number]; colour?: [number, number, number] }[]
  /**
   * Stretches of street whose roadway is poured concrete in transverse light and dark bands, with a strip of cobbles
   * round the streetcar tracks down the middle (render/city.ts). San Francisco: Jefferson Street between Jones and
   * Taylor (owner, 2026-10-17, with a photo: "distinctive light/dark stripes of concrete, with cobblestone around the
   * streetcar tracks … just one super busy block on jefferson between jones and taylor").
   */
  /** OSM ways tagged bridge/layer that are ridden at grade (tools/bake.ts): their bridge and layer tags are dropped */
  atGrade?: number[]
  /** bridges by name whose model draws the deck bank to bank: the way runs straight between its ends, for the rider to be on it */
  straightDecks?: string[]
  /** the named foot bridges are ridden, with the footways joining them to the bike network (tools/bridges.ts footBridgeLinks) */
  rideFootBridges?: boolean
  /** where a road on a bridge is a traffic viaduct, no pavements on it and a real width (La Défense's Boulevard Circulaire) */
  bareViaducts?: { lat: number; lon: number; radius: number }[]
  stripedStreets?: { street: string; from: [number, number]; to: [number, number]; cobbles?: number }[]
  /**
   * Areas whose sidewalks are crowded with furniture (render/city.ts, owner 2026-10-17 of Fisherman's Wharf: "a LOT of
   * street furniture… poster boards, official maps on metal kiosks, bike racks, triple trash cans with a poster on the
   * side, outdoor dining… bike racks everywhere"). Rings are [lat, lon].
   */
  touristStrips?: { name: string; ring: [number, number][] }[]
  /** marked crossings painted in the six rainbow bands within `radius` m of a point (the Castro at 18th Street) */
  rainbowCrossings?: { name: string; lat: number; lon: number; radius: number }[]
  /** stairways with their risers painted in bands of colour: any flight whose middle is within `radius` m */
  rainbowStairs?: { name: string; lat: number; lon: number; radius: number }[]
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
  /**
   * A named street's measured carriageway (kerb to kerb, m) and sidewalk over a stretch between two points, where
   * OSM's lanes give the wrong width (tools/street-paint.ts `applyStreetWidths`); `walk` defaults to the region's own
   */
  /** districts whose invented shop names are in their own language (Chinatown), rings of [lat, lon] */
  shopDistricts?: { lang: 'zh'; name?: string; ring: [number, number][] }[]
  streetWidths?: { street: string; from: [number, number]; to: [number, number]; width: number; walk?: number; note?: string }[]
  /** public stairways OSM does not have, by hand: each a polyline of [lat, lon] from one end to the other */
  stairways?: { name: string; points: [number, number][]; width?: number }[]
  /** squares OSM maps only as lines (the Trocadéro's parvis): paved areas by hand, rings of [lat, lon] */
  /** `brick`: laid in the region's street brick (`brickStreets.colour`) */
  /** (`lot`: asphalt; `parking`: a car park, laid out with stalls and parked cars — city/parking.ts) */
  pavedSquares?: { name: string; ring: [number, number][]; brick?: boolean; surface?: 'wood' | 'cobblestone' | 'brick'; lot?: boolean; parking?: boolean }[]
  /** a pitch's sport where OSM has it wrong, by way id (with a note in regions.json saying who said so) */
  courtSports?: Record<string, string>
  /**
   * A waterfront street's wharf apron: paving from its bay-side kerb out over the seawall, `reach` metres from the
   * centreline, wherever there is water on that side. OSM maps the apron along the Embarcadero as nothing, so the
   * city's base ground — grass — showed between the sidewalk and the pier bulkheads (2026-10-05). Painted UNDER the
   * parks and the water, which cover it where they are mapped.
   */
  wharfAprons?: { street: string; reach: number }[]
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
    busStop?: 'muni' | 'plain' | 'paris'
    /** the bike share's stations: Paris's Vélib' rows (render/models.ts velibStation), else the short rack */
    bikeShare?: 'velib'
    /** bike parking at the kerb (PackedFurniture `bikeparking`), drawn full (render/models.ts bikeParking) */
    bikeParking?: boolean
    /** two-wheeler parking at the kerb (PackedFurniture `motoparking`), a row of scooters (render/models.ts motoParking) */
    motoParking?: boolean
    /** Paris's street furniture beyond the rest: litter hoops, glass bells, Sanisettes, statues, market rows, stands (render/paris/street.ts) */
    parisStreet?: boolean
    /** the street fire alarm box (render/us-furniture.ts): San Francisco's gabled Gamewell head, New York's ERS post */
    callBox?: 'sf' | 'nyc'
    /** the share of street junctions (three streets or more) that get a box where OSM has mapped none near: 0–1 */
    callBoxFill?: number
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
    roadPaint: own?.roadPaint ?? base.roadPaint,
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
    ferryIslands: own?.ferryIslands ?? base.ferryIslands,
    pavedSquares: own?.pavedSquares ?? base.pavedSquares,
    courtSports: own?.courtSports ?? base.courtSports,
    wharfAprons: own?.wharfAprons ?? base.wharfAprons,
    brickStreets: own?.brickStreets ?? base.brickStreets,
    timeZone: own?.timeZone ?? base.timeZone,
    lanternStreets: own?.lanternStreets ?? base.lanternStreets,
    stripedStreets: own?.stripedStreets ?? base.stripedStreets,
    atGrade: own?.atGrade ?? base.atGrade,
    straightDecks: own?.straightDecks ?? base.straightDecks,
    rideFootBridges: own?.rideFootBridges ?? base.rideFootBridges,
    bareViaducts: own?.bareViaducts ?? base.bareViaducts,
    touristStrips: own?.touristStrips ?? base.touristStrips,
    rainbowCrossings: own?.rainbowCrossings ?? base.rainbowCrossings,
    rainbowStairs: own?.rainbowStairs ?? base.rainbowStairs,
    units: own?.units ?? base.units,
    streetPaint: own?.streetPaint ?? base.streetPaint,
    streetWidths: own?.streetWidths ?? base.streetWidths,
    shopDistricts: own?.shopDistricts ?? base.shopDistricts,
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
