import { describe, expect, it } from 'vitest'
import { parseQuery } from '../tools/osm-local.ts'
import * as q from '../tools/overpass.ts'

/*
 * Every query a bake asks has to be answerable from the local extract. One clause on a key the cut does not keep sends
 * the whole query to the public servers, silently, and a bake that should take an hour takes a day.
 */
const box = { south: 48.8, west: 2.2, north: 48.9, east: 2.4 }
const QUERIES = { bridgesQuery: q.bridgesQuery, campusQuery: q.campusQuery, fencesQuery: q.fencesQuery, gardenPartsQuery: q.gardenPartsQuery, sandQuery: q.sandQuery, wallsQuery: q.wallsQuery,
  squaresQuery: q.squaresQuery, stepsQuery: q.stepsQuery, wideQuery: q.wideQuery, fringeQuery: q.fringeQuery, cityQuery: q.cityQuery,
  furnitureQuery: q.furnitureQuery, partRelationsQuery: q.partRelationsQuery }

describe('the local extract answers', () => {
  for (const [name, make] of Object.entries(QUERIES)) {
    it(name, () => { expect(parseQuery(make(box))).not.toBeNull() })
  }
})
