/**
 * The local-extract path, without osmium: a handful of OPL lines through the parser and the query subset.
 *
 * What this is guarding is the thing that would be worst to get wrong quietly — a query understood slightly
 * differently from Overpass, so a bake comes out with fewer buildings and nobody notices.
 */
import { describe, expect, it } from 'vitest'
import { answer, parseOpl, parseQuery, type Region } from '../tools/osm-local.ts'
import { cityQuery, furnitureQuery, stepsQuery, wideQuery } from '../tools/overpass.ts'

const OPL = [
  // a café node with an escaped name (comma and é), inside the box
  'n1 Tamenity=cafe,name=Caf%e9%%2c%%20%Deux x-122.4150 y37.8000',
  // a node outside the box
  'n2 Tamenity=cafe,name=Far x-122.5000 y37.9000',
  // a street, two nodes inside
  'w10 Thighway=residential,name=Green%20%Street Nn100x-122.4150y37.8000,n101x-122.4140y37.8010',
  // a pedestrian AREA: excluded by ["area"!~"yes"] in the street query
  'w11 Thighway=pedestrian,area=yes Nn102x-122.4150y37.8001,n103x-122.4145y37.8002,n102x-122.4150y37.8001',
  // a building, one node inside the box and one out: the whole way still comes back
  'w12 Tbuilding=yes Nn104x-122.4150y37.8000,n105x-122.9000y37.8000,n104x-122.4150y37.8000',
  // steps
  'w13 Thighway=steps Nn106x-122.4151y37.8003,n107x-122.4152y37.8004',
  // a way wholly outside
  'w14 Thighway=residential Nn108x-122.9000y37.9000,n109x-122.9001y37.9001',
  // a park multipolygon whose only member is w15, inside
  'w15 Nn110x-122.4149y37.8005,n111x-122.4148y37.8006,n110x-122.4149y37.8005',
  'r20 Tleisure=park,type=multipolygon,name=Petit%20%Parc Mw15@outer',
  // a relation whose members are all outside
  'r21 Tleisure=park,type=multipolygon Mw14@outer',
].join('\n')

const BOX = { south: 37.7990, west: -122.4200, north: 37.8010, east: -122.4100 }
const region = (): Region => ({ box: { south: 37.79, west: -122.43, north: 37.81, east: -122.40 }, ...parseOpl(OPL), timestamp: '2026-09-21T20:21:51Z', source: 'test' })
const ids = (json: string): string[] =>
  (JSON.parse(json).elements as { type: string; id: number }[]).map((e) => `${e.type}/${e.id}`).sort()

describe('OPL parsing', () => {
  it('decodes escaped tag values', () => {
    const r = parseOpl(OPL)
    expect(r.nodes.get(1)!.tags.name).toBe('Café, Deux')
    expect(r.ways.get(10)!.tags.name).toBe('Green Street')
    expect(r.relations.get(20)!.tags.name).toBe('Petit Parc')
  })
  it('gives ways node ids and geometry of the same length', () => {
    const w = parseOpl(OPL).ways.get(10)!
    expect(w.nodes).toEqual([100, 101])
    expect(w.geometry).toEqual([{ lat: 37.8, lon: -122.415 }, { lat: 37.801, lon: -122.414 }])
  })
  it('reads relation members with their roles', () => {
    expect(parseOpl(OPL).relations.get(20)!.members).toEqual([{ type: 'way', ref: 15, role: 'outer' }])
  })
})

describe('the Overpass QL subset', () => {
  it('parses the bake\'s own queries', () => {
    for (const q of [cityQuery, wideQuery, stepsQuery, furnitureQuery]) expect(parseQuery(q(BOX))).not.toBeNull()
  })
  it('refuses anything outside the subset', () => {
    expect(parseQuery('[out:json];(way(around:50,1,2););out geom qt;')).toBeNull()          // recursion
    expect(parseQuery('[out:json][timeout:10];(way["highway"](37,-122,38,-121););out meta;')).toBeNull() // out meta
    expect(parseQuery('[out:json][timeout:10];(way["surface"="asphalt"](1,2,3,4););out geom qt;')).toBeNull() // key not in the cut
  })
})

describe('answering from a region', () => {
  it('matches the city query the way Overpass does', () => {
    const got = ids(answer(region(), parseQuery(cityQuery(BOX))!))
    // the street, the building (one node inside is enough), the park relation, the café node
    expect(got).toContain('way/10')
    expect(got).toContain('way/12')
    expect(got).toContain('relation/20')
    expect(got).toContain('node/1')
    // the pedestrian AREA is excluded by ["area"!~"yes"], and everything outside the box is out
    expect(got).not.toContain('way/11')
    expect(got).not.toContain('way/14')
    expect(got).not.toContain('relation/21')
    expect(got).not.toContain('node/2')
  })
  it('keeps a way whole when only part of it is in the box', () => {
    const el = (JSON.parse(answer(region(), parseQuery(cityQuery(BOX))!)).elements as { id: number; nodes?: number[]; geometry?: unknown[] }[])
      .find((e) => e.id === 12)!
    expect(el.nodes).toEqual([104, 105, 104])
    expect(el.geometry).toHaveLength(3)
  })
  it('gives relation members their geometry, as `out geom` does', () => {
    const rel = (JSON.parse(answer(region(), parseQuery(cityQuery(BOX))!)).elements as { type: string; members?: { geometry?: unknown[] }[] }[])
      .find((e) => e.type === 'relation')!
    expect(rel.members![0].geometry).toHaveLength(3)
  })
  it('answers the steps query with just the steps', () => {
    expect(ids(answer(region(), parseQuery(stepsQuery(BOX))!))).toEqual(['way/13'])
  })
  it('carries the extract vintage through as the timestamp', () => {
    expect(JSON.parse(answer(region(), parseQuery(stepsQuery(BOX))!)).osm3s.timestamp_osm_base).toBe('2026-09-21T20:21:51Z')
  })
})
