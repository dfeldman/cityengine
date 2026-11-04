/**
 * Detail regions (tools/detail.ts, docs/VERSAILLES.md): where Paris is modelled on the way to Versailles, and the
 * filter that cuts a region's fetch down to it. Every number a Paris bake depends on is pinned here, because the
 * bake takes hours and a wrong one would only show at its end.
 */
import { describe, expect, it } from 'vitest'
import { bboxOf, city, detailBboxOf } from '../tools/cities.ts'
import { detailKm2, detailOutlines, detailTest, filterToRegion, regionBbox, regionsOf } from '../tools/detail.ts'
import type { OverpassResult, OsmWay } from '../tools/overpass.ts'
import { Projection } from '../src/city/geo.ts'

const paris = city('paris-centre')
const inDetail = detailTest(paris)

describe('Paris detail', () => {
  it('keeps the detail box of before to the metre, so every cached fetch of central Paris answers', () => {
    // the box before the regions: west 8355, east 5715, north 4175, south 4510
    const was = bboxOf({ ...paris, box: { west: 8355, east: 5715, north: 4175, south: 4510 } })
    expect(detailBboxOf(paris)).toEqual(was)
  })

  it('has no wide fetch (it would bake every suburban street in the grown box)', () => {
    expect(paris.wide).toBe(false)
  })

  it('holds every region inside the box', () => {
    const box = bboxOf(paris)
    for (const r of regionsOf(paris)) {
      const b = regionBbox(r)
      expect(b.west, r.name).toBeGreaterThan(box.west)
      expect(b.south, r.name).toBeGreaterThan(box.south)
      expect(b.east, r.name).toBeLessThan(box.east)
      expect(b.north, r.name).toBeLessThan(box.north)
    }
  })

  it.each([
    ['Palais-Royal', 48.8635, 2.3370],
    ['Pont de Saint-Cloud', 48.8437, 2.2215],
    ['Domaine de Saint-Cloud, the Grande Cascade', 48.8389, 2.2134],
    ['Fausses-Reposes, the Étang de Ville-d\'Avray', 48.8247, 2.1720],
    ['Place d\'Armes', 48.8044, 2.1269],
    ['the château', 48.8049, 2.1204],
    ['Grand Trianon', 48.8148, 2.1050],
    ['Petit Trianon', 48.8149, 2.1106],
    ['the Hameau', 48.8172, 2.1100],
    ['the Grand Canal\'s west end', 48.8130, 2.0880],
    ['Cathédrale Saint-Louis', 48.7998, 2.1259],
  ])('models %s', (_n, lat, lon) => {
    expect(inDetail(lat, lon)).toBe(true)
  })

  it.each([
    ['Sèvres, the town centre', 48.8235, 2.2110],
    ['Chaville', 48.8080, 2.1880],
    ['La Celle-Saint-Cloud', 48.8490, 2.1360],
    ['Viroflay', 48.7990, 2.1700],
    ['Versailles, Chantiers', 48.7950, 2.1350],
  ])('leaves out %s', (_n, lat, lon) => {
    expect(inDetail(lat, lon)).toBe(false)
  })

  it('models about what was measured: the old box and ~15 km² of regions', () => {
    const km2 = detailKm2(paris)
    expect(km2).toBeGreaterThan(125)
    expect(km2).toBeLessThan(150)
  })

  it('outlines the detail box and each region for the map, in local metres', () => {
    const p = new Projection(paris.centre)
    const o = detailOutlines(paris, (g) => p.toLocal(g))
    expect(o.length).toBe(regionsOf(paris).length + 1)
    const [x0, z0] = o[0].rings![0]
    expect(Math.abs(x0 + 8355)).toBeLessThan(2)
    expect(Math.abs(z0 + 4510)).toBeLessThan(2)
    // the château is ~15.4 km west of the Palais-Royal
    const v = o.find((d) => d.name === 'Parc de Versailles')!
    const xs = v.rings![0].filter((_, i) => i % 2 === 0)
    expect(Math.min(...xs)).toBeLessThan(-18000)
  })
})

describe('San Francisco is unchanged', () => {
  it('has no regions and keeps its wide fetch', () => {
    const sf = city('san-francisco')
    expect(regionsOf(sf)).toEqual([])
    expect(sf.wide).toBeUndefined()
  })
})

describe('filterToRegion', () => {
  const corridor = { name: 'corridor', margin: 100, line: [[48.80, 2.10], [48.80, 2.12]] as [number, number][] }
  const way = (id: number, tags: Record<string, string>, pts: [number, number][]): OsmWay =>
    ({ type: 'way', id, tags, nodes: [], geometry: pts.map(([lat, lon]) => ({ lat, lon })) })
  const res: OverpassResult = {
    copyright: 'c', timestamp: 't',
    ways: [
      // a street crossing the corridor with no node inside it (its nodes 1 km either side)
      way(1, { highway: 'residential' }, [[48.791, 2.11], [48.809, 2.11]]),
      // a street a kilometre away
      way(2, { highway: 'residential' }, [[48.81, 2.10], [48.81, 2.12]]),
      // a building inside, and one whose corner pokes in but whose centroid is 150 m out
      way(3, { building: 'yes' }, [[48.8000, 2.1100], [48.8001, 2.1100], [48.8001, 2.1101], [48.8000, 2.1100]]),
      way(4, { building: 'yes' }, [[48.8008, 2.1100], [48.8022, 2.1100], [48.8022, 2.1102], [48.8008, 2.1100]]),
    ],
    nodes: [
      { type: 'node', id: 10, lat: 48.8004, lon: 2.105, tags: {} },
      { type: 'node', id: 11, lat: 48.805, lon: 2.105, tags: {} },
    ],
    relations: [
      { type: 'relation', id: 20, tags: {}, members: [{ type: 'way', ref: 1, role: 'outer', geometry: [{ lat: 48.799, lon: 2.09 }, { lat: 48.801, lon: 2.13 }] }] },
      { type: 'relation', id: 21, tags: {}, members: [{ type: 'way', ref: 2, role: 'outer', geometry: [{ lat: 48.82, lon: 2.09 }, { lat: 48.82, lon: 2.13 }] }] },
    ],
  }
  const got = filterToRegion(res, corridor)
  it('keeps a way that crosses the region between its nodes, whole', () => {
    expect(got.ways.map((w) => w.id)).toContain(1)
    expect(got.ways.find((w) => w.id === 1)!.geometry.length).toBe(2)
  })
  it('drops what is outside', () => {
    expect(got.ways.map((w) => w.id)).not.toContain(2)
    expect(got.nodes.map((n) => n.id)).toEqual([10])
    expect(got.relations.map((r) => r.id)).toEqual([20])
  })
  it('files a building by its centroid', () => {
    expect(got.ways.map((w) => w.id)).toContain(3)
    expect(got.ways.map((w) => w.id)).not.toContain(4)
  })
})
