/**
 * Which buildings outside Paris proper are SINGLE-FAMILY HOUSES (owner, 2026-11-05: the road to Versailles has a few dozen between
 * apartment blocks and forest, drawn as six-storey Paris). Strict on purpose: an apartment building must never become a house,
 * so a house needs a low, small footprint AND evidence of one household — an OSM house tag, or BD TOPO recording one dwelling
 * (or two, for a semi) in a residential use. A bare `building=yes` with no record is left to the generic classifier.
 */
import type { BuildingFacts } from '../building-types.ts'
import { wallKind } from './materials.ts'

/** the rule's numbers; tune here */
export const HOUSE = {
  /** the tallest wall (m, to the eaves) of a house: three storeys */
  maxHeight: 10.5,
  /** most storeys OSM may give it */
  maxLevels: 3,
  /** footprint limits (m²): under the floor it is a shed or annex, over the ceiling a block or a manor */
  minArea: 45, maxArea: 260,
  /** the footprint cap for a building with no record at all, only an OSM house tag */
  maxAreaTagOnly: 320,
  /** most dwellings BD TOPO may record (2: a semi-detached pair counted on one outline) */
  maxDwellings: 2,
  /** La Défense's centre and the radius (m) inside which nothing is a house */
  defense: { lat: 48.8917, lon: 2.24, r: 1300 },
  /** the wall mix of a house whose records say nothing, percent: brick, millstone (meulière), render (the rest) */
  hashBrick: 22, hashMillstone: 14,
}

/** OSM `building=` values that say one household (`yes`, `residential` do not) */
const HOUSE_TAG = /^(house|detached|semidetached_house|terrace|villa|bungalow)$/
/** …and those that say it is something else, whatever BD TOPO says */
const NOT_HOUSE = /^(apartments|dormitory|hotel|commercial|retail|office|industrial|warehouse|school|church|chapel|public|civic|hospital|garage|garages|shed|roof|carport|service|train_station|university|kindergarten|religious|transportation|parking|greenhouse|barn|stable|farm_auxiliary|construction|ruins|hut|cabin|kiosk|supermarket|government|fire_station|sports_hall)$/
/** BD TOPO usage_1 values that are a home (accents stripped) */
const HOME_USE = /^r[ée]sidentiel$/i
const ANNEX = /^annexe$/i

export function houseFor(b: BuildingFacts): { wall: string; rule: string } | null {
  const t = b.tags
  if (t['building:part'] !== undefined) return null
  const kind = t.building ?? ''
  if (NOT_HOUSE.test(kind)) return null
  if (t.amenity || t.shop || t.office || t.tourism || t.leisure || t.historic || t.name || t.craft || t.man_made || t.healthcare) return null
  if (Math.hypot((b.lon - HOUSE.defense.lon) * 73270, (b.lat - HOUSE.defense.lat) * 111320) < HOUSE.defense.r) return null
  const rec = b.record
  if (rec?.nature && ANNEX.test(rec.nature)) return null
  const h = b.height ?? (b.levels ? b.levels * 3.1 : undefined)
  if (h !== undefined && h > HOUSE.maxHeight) return null
  if (b.levels !== undefined && b.levels > HOUSE.maxLevels) return null
  if (b.area < HOUSE.minArea) return null
  const tagged = HOUSE_TAG.test(kind)
  const dwellings = rec?.dwellings
  if (dwellings !== undefined && dwellings > HOUSE.maxDwellings) return null
  if (rec?.usage && !HOME_USE.test(rec.usage)) return null
  const homeRec = !!rec?.usage && HOME_USE.test(rec.usage)
  let rule: string
  if (tagged) {
    if (b.area > HOUSE.maxAreaTagOnly) return null
    rule = `building=${kind}${dwellings === undefined ? '' : `, ${dwellings} dwelling(s)`}`
  } else {
    // building=yes/residential: only BD TOPO's word for one household will do, and a known height (≤ 3 storeys) to go with it
    if (b.area > HOUSE.maxArea || !homeRec || dwellings === undefined || dwellings < 1 || h === undefined) return null
    rule = `BD TOPO: residential, ${dwellings} dwelling(s), ${h.toFixed(1)} m`
  }
  const w = wallKind(rec?.walls)
  const hash = (Math.imul(b.id, 2246822519) >>> 0) % 100
  const wall = w === 'brick' ? 'brick' : w === 'millstone' ? 'millstone' : w === 'stone' ? 'stone'
    : hash < HOUSE.hashBrick ? 'brick' : hash < HOUSE.hashBrick + HOUSE.hashMillstone ? 'millstone' : 'render'
  return { wall, rule }
}
