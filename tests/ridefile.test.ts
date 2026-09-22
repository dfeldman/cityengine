import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { mapEdges, packRide, rideFor, unpackRide, type RideFile } from '../src/city/ridefile.ts'
import { Terrain } from '../src/city/terrain.ts'
import type { CityPackage } from '../src/city/package.ts'

describe('the baked ride graph is the one the game would build (PARIS_EXPAND §3)', () => {
  const pkg = JSON.parse(readFileSync('public/cities/paris-marais.json', 'utf8')) as CityPackage
  const terrain = new Terrain(pkg.terrain)
  const built = rideFor(pkg.id, pkg.origin, mapEdges(pkg.edges, terrain), 'bike', (x, z) => terrain.heightAt(x, z), pkg.region,
    pkg.buildings.filter((b) => (b.minHeight ?? 0) < 2).map((b) => b.ring))

  it('round-trips through the file', () => {
    const back = unpackRide(JSON.parse(JSON.stringify(packRide(built, 'bike'))) as RideFile)
    expect(back.edges.size).toBe(built.edges.size)
    expect(back.nodes.size).toBe(built.nodes.size)
    for (const [id, e] of built.edges) {
      const f = back.edges.get(id)!
      expect(f.a).toBe(e.a)
      expect(f.over.map((o) => o.id)).toEqual(e.over.map((o) => o.id))
      expect(Math.abs(f.length - e.length)).toBeLessThan(0.1)
    }
  })

  it('matches what the bake shipped', () => {
    const shipped = unpackRide(JSON.parse(readFileSync('public/cities/paris-marais/ride-bike.json', 'utf8')) as RideFile)
    expect(shipped.edges.size).toBe(built.edges.size)
    const key = (g: typeof built): string[] => [...g.edges.values()].map((e) => e.over.map((o) => o.id).join('.')).sort()
    expect(key(shipped)).toEqual(key(built))
  })
})
