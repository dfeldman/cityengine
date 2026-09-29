/**
 * Planting by zone (src/city/zone-planting.ts) and San Francisco's zone data (data/zones/san-francisco.json).
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { Projection } from '../src/city/geo.ts'
import { localZones, type ZoneFile } from '../src/map/zones.ts'
import { PlantZones } from '../src/city/zone-planting.ts'
import { Buildings, MIN_SPACING, newPlantReport, plantCity, type Planting } from '../src/city/plantings.ts'
import { crownRadius } from '../src/city/tree-forms.ts'
import type { PackedEdge } from '../src/city/package.ts'

const proj = new Projection({ lat: 37.7930, lon: -122.4120 })
const file = JSON.parse(readFileSync('data/zones/san-francisco.json', 'utf8')) as ZoneFile
const zones = new PlantZones(localZones(file.zones, (lat, lon) => proj.toLocal({ lat, lon })))

describe('planting by zone', () => {
  // (The conversion from city/sf/parks.ts was proved here on 2026-09-28 — 10 000 points × 3 kinds, every answer
  // equal — and the file deleted once the meadow zones deliberately changed Golden Gate Park.)
  it('opens the meadows inside Golden Gate Park, which the forest around them is not', () => {
    const at = (lat: number, lon: number) => { const p = proj.toLocal({ lat, lon }); return zones.park(p.x, p.z)! }
    expect(at(37.7682, -122.4910).density).toBeLessThan(0.001)   // the Polo Field
    expect(at(37.7707, -122.4800).density).toBeLessThan(0.001)   // Hellman Hollow
    expect(at(37.7690, -122.4980).density).toBeGreaterThan(0.004) // the forest west of the Polo Field
  })

  it('invents street rows in Sausalito, and leaves the city to its register', () => {
    const sa = proj.toLocal({ lat: 37.8590, lon: -122.4850 })
    const city = proj.toLocal({ lat: 37.7800, lon: -122.4300 })
    const rule = zones.street(sa.x, sa.z)
    expect(typeof rule).toBe('object')
    expect(zones.street(city.x, city.z)).toBe('register')
  })

  it('lets a zone speak about one thing and take the rest from beneath it', () => {
    const toLocal = (lat: number, lon: number) => ({ x: lon * 1000, z: lat * 1000 })
    const spot = (form: string) => ({ density: 0.001, clump: 0, species: [{ form, weight: 1, h: [5, 6] as [number, number] }] })
    const z = new PlantZones(localZones([
      { ref: 'city', priority: 0, ring: [[0, 0], [0, 1], [1, 1], [1, 0]], props: { plant: { wood: spot('pine'), lawn: spot('oak'), street: 'register' } } },
      // a town with no register: it says only how its streets are planted
      { ref: 'town', priority: 5, ring: [[0, 0], [0, 0.5], [0.5, 0.5], [0.5, 0]], props: { plant: { street: { spacing: 12, minWalk: 1.5, minWidth: 6, species: [] } } } },
      // a park that IS forest: its `wood` answers for `park` too, and must not fall through to the city's park
      { ref: 'forest', priority: 9, ring: [[0.6, 0.6], [0.6, 0.9], [0.9, 0.9], [0.9, 0.6]], props: { plant: { wood: spot('eucalyptus') } } },
    ], toLocal))
    expect(z.street(100, 100)).toEqual({ spacing: 12, minWalk: 1.5, minWidth: 6, species: [] })
    expect(z.street(800, 100)).toBe('register')
    expect(z.wood(100, 100)!.species[0].form).toBe('pine')
    expect(z.park(700, 700)!.species[0].form).toBe('eucalyptus')
    expect(z.park(100, 100)!.species[0].form).toBe('pine')
    expect(z.lawn(700, 700)!.species[0].form).toBe('oak')
    expect(z.park(5000, 5000)).toBeNull()
  })

  describe('the zoned pass (plantCity)', () => {
    const toLocal = (lat: number, lon: number) => ({ x: lon * 1000, z: lat * 1000 })
    const sp = (form: string, h: [number, number]) => ({ form, weight: 1, h })
    const z = new PlantZones(localZones([
      // the city: a register, and a dense park planting of broad oaks
      { ref: 'city', priority: 0, ring: [[-1, -1], [-1, 1], [1, 1], [1, -1]], props: { plant: {
        street: 'register', park: { density: 0.0078, clump: 0, species: [sp('oak', [12, 16])] }, lawn: { density: 0.0005, clump: 0, species: [sp('oak', [10, 12])] } } } },
      // east of x = 300: a town with no register — plant its streets, 30% palms
      { ref: 'town', priority: 5, ring: [[-1, 0.3], [-1, 1], [1, 1], [1, 0.3]], props: { plant: { street: {
        spacing: 12, minWalk: 1.5, minWidth: 6, species: [sp('canary', [8, 10]), sp('canary', [8, 10]), sp('canary', [8, 10]), sp('deciduous', [7, 9]), sp('deciduous', [7, 9]), sp('deciduous', [7, 9]), sp('deciduous', [7, 9]), sp('deciduous', [7, 9]), sp('deciduous', [7, 9]), sp('deciduous', [7, 9])] } } } },
    ], toLocal))
    const street = (id: number, x0: number, x1: number, zc: number): PackedEdge =>
      ({ id, a: id * 10, b: id * 10 + 1, points: [x0, zc, x1, zc], surface: 'asphalt', width: 8, walk: 2.5, foot: false, kind: 'residential' })
    const sq = (x0: number, z0: number, x1: number, z1: number): number[] => [x0, z0, x1, z0, x1, z1, x0, z1]
    const pkg = {
      edges: [street(1, -250, 250, -200), street(2, 350, 800, -200)],
      // a park with a pavilion in the middle of it
      areas: [{ kind: 'park' as const, ring: sq(-200, 0, 200, 300) }],
      buildings: [{ id: 9, ring: sq(-20, 130, 20, 170), style: 'classical' as const, roof: 'flat' as const, roofHeight: 0, roofColour: [0.5, 0.5, 0.5] as [number, number, number] }],
      // a mapped tree standing exactly on a register tree, which must not become two trees
      trees: [0, -196.25],
    }
    const register: Planting[] = [{ x: 0, z: -196.25, height: 8, spin: 0, park: false, form: 1 }]
    const report = newPlantReport()
    const got = plantCity(pkg, 100000, register, z, report)

    it('never plants a tree on top of another', () => {
      for (let i = 0; i < got.length; i++) for (let j = i + 1; j < got.length; j++) {
        expect(Math.hypot(got[i].x - got[j].x, got[i].z - got[j].z)).toBeGreaterThanOrEqual(MIN_SPACING)
      }
      expect(report.register).toBe(1)
      expect(report.mapped).toBe(0)
    })

    it('keeps every park crown out of the building', () => {
      const b = new Buildings(pkg.buildings)
      const parks = got.filter((p) => p.park)
      expect(parks.length).toBeGreaterThan(200)
      for (const p of parks) expect(b.wallDistance(p.x, p.z)).toBeGreaterThanOrEqual(crownRadius(p.form, p.height))
      expect(report.crownInBuilding).toBeGreaterThan(0)
    })

    it('invents street rows only where there is no register, in the zone\'s mix', () => {
      const rows = got.filter((p) => !p.park && p.form !== 1 && p.form !== undefined)
      expect(rows.length).toBeGreaterThan(40)
      for (const p of rows) expect(p.x).toBeGreaterThan(300)
      const palms = rows.filter((p) => p.form === 18).length / rows.length
      expect(palms).toBeGreaterThan(0.15)
      expect(palms).toBeLessThan(0.45)
    })
  })
})

