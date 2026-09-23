import { describe, expect, it } from 'vitest'
import { Projection } from '../src/city/geo.ts'
import { sfParkRule } from '../src/city/sf/parks.ts'
import { MAX_DENSITY } from '../src/city/park-planting.ts'

const proj = new Projection({ lat: 37.7930, lon: -122.4120 })
const rule = sfParkRule((g) => proj.toLocal(g))
const at = (lat: number, lon: number, kind: 'park' | 'wood' | 'grass' = 'park'): ReturnType<typeof rule> => {
  const { x, z } = proj.toLocal({ lat, lon })
  return rule(x, z, kind)
}
/** a forest: a trunk about every twelve metres or closer */
const FOREST = 0.004

describe('what San Francisco plants in its parks (city/sf/parks.ts)', () => {
  it('makes a forest of Golden Gate Park and the Presidio', () => {
    for (const [name, lat, lon] of [
      ['Golden Gate Park, the east end', 37.7700, -122.4560],
      ['Golden Gate Park, by Stow Lake', 37.7690, -122.4730],
      ['Golden Gate Park, the ocean end', 37.7690, -122.4980],
      ['the Presidio, above Baker Beach', 37.7950, -122.4750],
      ['the Presidio, the east forest', 37.7940, -122.4520],
    ] as [string, number, number][]) {
      const spot = at(lat, lon)
      expect(spot, name).not.toBeNull()
      expect(spot!.density, name).toBeGreaterThanOrEqual(FOREST)
      expect(spot!.density, name).toBeLessThanOrEqual(MAX_DENSITY)
      // never one species: a park planted in one tree at one spacing reads worse than no park
      expect(spot!.species.length, name).toBeGreaterThanOrEqual(4)
    }
  })

  it('leaves the open parks open — Dolores, Twin Peaks, Alamo Square are not eucalyptus woods', () => {
    for (const [name, lat, lon] of [
      ['Dolores Park', 37.7596, -122.4269],
      ['Twin Peaks', 37.7544, -122.4477],
      ['Alamo Square', 37.7764, -122.4347],
      ['Duboce Park', 37.7694, -122.4336],
      ['Washington Square', 37.8006, -122.4100],
      ['Lafayette Park', 37.7916, -122.4270],
      ['Alta Plaza', 37.7912, -122.4377],
      ['a Sunset playground', 37.7580, -122.4900],
      ['a Richmond square', 37.7810, -122.4830],
    ] as [string, number, number][]) {
      const spot = at(lat, lon)
      expect(spot, name).not.toBeNull()
      expect(spot!.density, name).toBeLessThan(FOREST)
    }
  })

  it('still makes a wood of a polygon OSM tagged as one, wherever it is', () => {
    // Buena Vista and Mount Sutro are natural=wood inside the open-parks zone
    expect(at(37.7684, -122.4417, 'wood')!.density).toBeGreaterThanOrEqual(FOREST)
    expect(at(37.7600, -122.4580, 'wood')!.density).toBeGreaterThanOrEqual(FOREST)
    // and a wood nobody has an opinion about is still a wood
    expect(at(37.7300, -122.3900, 'wood')!.density).toBeGreaterThanOrEqual(FOREST)
  })

  it('leaves a lawn a lawn everywhere: the meadows, the Concourse, Crissy Field', () => {
    for (const [name, lat, lon] of [
      ['the Music Concourse', 37.7699, -122.4681],
      ['Speedway Meadow', 37.7680, -122.4830],
      ['Crissy Field', 37.8040, -122.4560],
      ['the Presidio Main Post', 37.7975, -122.4570],
      ['the Panhandle', 37.7726, -122.4490],
    ] as [string, number, number][]) {
      const spot = at(lat, lon, 'grass')
      expect(spot, name).not.toBeNull()
      expect(spot!.density, name).toBeLessThan(0.0015)
      expect(spot!.species.length, name).toBeGreaterThanOrEqual(2)
    }
  })

  it('never asks for more than the pass will give', () => {
    for (let lat = 37.73; lat < 37.82; lat += 0.002) {
      for (let lon = -122.52; lon < -122.36; lon += 0.002) {
        for (const kind of ['park', 'wood', 'grass'] as const) {
          const spot = at(lat, lon, kind)
          expect(spot!.density).toBeLessThanOrEqual(MAX_DENSITY)
          expect(spot!.clump).toBeGreaterThanOrEqual(0)
          expect(spot!.clump).toBeLessThanOrEqual(1)
        }
      }
    }
  })
})
