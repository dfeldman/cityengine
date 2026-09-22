import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { entryKind, fitFront, packedIds, replacedIds, restyles, type LandmarkEntry } from '../src/render/landmarks.ts'
import { PROCEDURAL } from '../src/render/landmarks/procedural.ts'
import { MeshBuilder } from '../src/render/buildings.ts'

/** Where a model-space point lands in the world, as Babylon places it (rotation.y, then position). */
const place = (f: ReturnType<typeof fitFront>, x: number, z: number): { x: number; z: number } => ({
  x: f.cx + x * Math.cos(f.rotation) + z * Math.sin(f.rotation),
  z: f.cz - x * Math.sin(f.rotation) + z * Math.cos(f.rotation),
})

describe('fitting a landmark to its footprint', () => {
  // 20 m east–west, 40 m north–south, centred at (100, 50)
  const ring = [{ x: 90, z: 30 }, { x: 110, z: 30 }, { x: 110, z: 70 }, { x: 90, z: 70 }]

  it('measures across and along the facing, and puts the front where it faces', () => {
    const east = fitFront(ring, 90)
    expect(east.hx).toBeCloseTo(20)      // across an east-facing front is north–south
    expect(east.hz).toBeCloseTo(10)
    const p = place(east, 0, -east.hz)    // the middle of the model's front (local −z)
    expect(p.x).toBeCloseTo(110)          // on the east edge
    expect(p.z).toBeCloseTo(50)
    const north = fitFront(ring, 0)
    const q = place(north, 0, -north.hz)
    expect(q.z).toBeCloseTo(70)           // a north-facing front is on the north edge
    expect(north.hx).toBeCloseTo(10)
  })
})

describe('manifest entries', () => {
  it('never removes a restyled building, and survives an entry without osm', () => {
    const entries: LandmarkEntry[] = [
      { name: 'a', osm: ['way/1'], procedural: 'saintPaul' },
      { name: 'b', osm: ['way/2'], restyle: 'vosges' },
      { name: 'c', procedural: 'tourSaintJacques', lat: 1, lon: 2 },
    ]
    expect(entryKind(entries[0])).toBe('replace')
    expect(entryKind(entries[1])).toBe('restyle')
    expect(entryKind(entries[2])).toBe('standalone')
    expect(packedIds(entries[2])).toEqual([])
    expect([...replacedIds(entries)]).toEqual([1])
  })
})

describe('every procedural landmark', () => {
  for (const [name, build] of Object.entries(PROCEDURAL)) {
    it(`${name} builds finite, bounded, affordable geometry`, () => {
      const out = new MeshBuilder()
      build(out, { hx: 25, hz: 35, height: 40 })
      expect(out.positions.length).toBeGreaterThan(0)
      for (const v of out.positions) expect(Number.isFinite(v)).toBe(true)
      expect(out.triangles).toBeLessThan(25_000)
    })
  }
})

it('the Place des Vosges restyle takes the houses round the square and nothing in its garden', () => {
  const pkg = JSON.parse(readFileSync('public/cities/paris-marais.json', 'utf8'))
  const manifest: LandmarkEntry[] = JSON.parse(readFileSync('public/landmarks/paris-marais.json', 'utf8'))
  const vosges = manifest.find((e) => e.restyle === 'vosges')!
  const taken = restyles([vosges], pkg)
  expect(taken.size).toBeGreaterThan(35)
  expect(taken.size).toBeLessThan(60)
  // the Pavillon du Roi, on the south side, is one of them
  expect(taken.has(49734499)).toBe(true)
})

describe('fitSnug (BUGS.md #6)', () => {
  it('keeps the given bearing on a round footprint', async () => {
    const { fitSnug } = await import('../src/render/landmarks.ts')
    const ring = Array.from({ length: 20 }, (_, i) => ({ x: Math.sin((i / 20) * Math.PI * 2) * 20, z: Math.cos((i / 20) * Math.PI * 2) * 20 }))
    const f = fitSnug(ring, 260)
    expect(f.rotation).toBeCloseTo(((260 + 180) * Math.PI) / 180, 6)
  })
  it('still turns to a rectangle\'s own axes', async () => {
    const { fitSnug } = await import('../src/render/landmarks.ts')
    // a 60 x 20 m block turned 25°, asked for bearing 0
    const t = (25 * Math.PI) / 180
    const ring = [[-30, -10], [30, -10], [30, 10], [-30, 10]].map(([x, z]) => ({ x: x * Math.cos(t) + z * Math.sin(t), z: -x * Math.sin(t) + z * Math.cos(t) }))
    const f = fitSnug(ring, 0)
    expect(f.hx * f.hz).toBeLessThan(310)
  })
})
