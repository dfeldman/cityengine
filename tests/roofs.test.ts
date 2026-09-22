/**
 * Roof geometry.
 *
 * The bug these exist to catch is one you cannot see from the street and cannot miss from a window above it:
 * a roof whose inset ring has folded through itself comes out as a funnel, with its middle BELOW its eaves.
 * OSM is full of the footprints that cause it — L-shapes, courtyard blocks, anything with a reflex corner —
 * so the assertions are about the property, not about a particular shape: every vertex a roof adds must be
 * at or above the eaves, and it must not wander outside the building it sits on.
 */
import { describe, expect, it } from 'vitest'
import { MeshBuilder } from '../src/render/buildings.ts'
import { addRoofscape, buildRoof, insetRing, type Pt } from '../src/render/roofs.ts'
import type { RoofShape } from '../src/city/package.ts'

const rect = (w: number, d: number): Pt[] =>
  [{ x: -w / 2, z: -d / 2 }, { x: w / 2, z: -d / 2 }, { x: w / 2, z: d / 2 }, { x: -w / 2, z: d / 2 }]

/** An L, which is what most real buildings on a corner are. */
const ell = (): Pt[] => [
  { x: 0, z: 0 }, { x: 20, z: 0 }, { x: 20, z: 8 }, { x: 8, z: 8 }, { x: 8, z: 18 }, { x: 0, z: 18 },
]

/** A courtyard block's outer ring, with a deep notch cut into one side. */
const notched = (): Pt[] => [
  { x: 0, z: 0 }, { x: 30, z: 0 }, { x: 30, z: 20 }, { x: 18, z: 20 },
  { x: 18, z: 4 }, { x: 12, z: 4 }, { x: 12, z: 20 }, { x: 0, z: 20 },
]

const SHAPES: RoofShape[] = ['flat', 'gabled', 'hipped', 'pyramidal', 'skillion', 'mansard']

function bounds(b: MeshBuilder): { minY: number; maxY: number; minX: number; maxX: number } {
  let minY = Infinity; let maxY = -Infinity; let minX = Infinity; let maxX = -Infinity
  for (let i = 0; i < b.positions.length; i += 3) {
    minX = Math.min(minX, b.positions[i]); maxX = Math.max(maxX, b.positions[i])
    minY = Math.min(minY, b.positions[i + 1]); maxY = Math.max(maxY, b.positions[i + 1])
  }
  return { minY, maxY, minX, maxX }
}

describe('insetRing', () => {
  it('shrinks a rectangle without inverting it', () => {
    const inset = insetRing(rect(20, 10), 2)
    const xs = inset.map((p) => p.x)
    const zs = inset.map((p) => p.z)
    expect(Math.max(...xs)).toBeLessThan(10)
    expect(Math.min(...xs)).toBeGreaterThan(-10)
    expect(Math.max(...zs)).toBeLessThan(5)
    expect(Math.min(...zs)).toBeGreaterThan(-5)
  })

  it('never sends a vertex outside the footprint, even at a reflex corner', () => {
    // the trap: at the inside of an L the bisector points OUTWARD, and amplifying the step by 1/cos there
    // throws the vertex a long way out and folds the ring through itself
    for (const ring of [ell(), notched()]) {
      const inset = insetRing(ring, 2.5)
      const pad = 0.001
      const minX = Math.min(...ring.map((p) => p.x)) - pad
      const maxX = Math.max(...ring.map((p) => p.x)) + pad
      const minZ = Math.min(...ring.map((p) => p.z)) - pad
      const maxZ = Math.max(...ring.map((p) => p.z)) + pad
      for (const p of inset) {
        expect(p.x).toBeGreaterThanOrEqual(minX)
        expect(p.x).toBeLessThanOrEqual(maxX)
        expect(p.z).toBeGreaterThanOrEqual(minZ)
        expect(p.z).toBeLessThanOrEqual(maxZ)
      }
    }
  })
})

describe('buildRoof', () => {
  it('never puts any part of a roof below its eaves', () => {
    for (const shape of SHAPES) {
      for (const ring of [rect(20, 10), rect(9, 9), rect(60, 7), ell(), notched()]) {
        const out = new MeshBuilder()
        const top = buildRoof(out, ring, { shape, y: 12, height: 4, colour: [0.3, 0.3, 0.3] })
        const b = bounds(out)
        expect(b.minY, `${shape} dips below the eaves`).toBeGreaterThanOrEqual(12 - 1e-6)
        expect(top, `${shape} reports a top below the eaves`).toBeGreaterThanOrEqual(12)
        expect(b.maxY, `${shape} exceeds the height it was given`).toBeLessThanOrEqual(12 + 4 + 1e-6)
      }
    }
  })

  it('keeps the roof over the building, not hanging off it', () => {
    for (const shape of SHAPES) {
      const ring = ell()
      const out = new MeshBuilder()
      buildRoof(out, ring, { shape, y: 10, height: 3.5, colour: [0.3, 0.3, 0.3] })
      const b = bounds(out)
      expect(b.minX).toBeGreaterThanOrEqual(-0.5)
      expect(b.maxX).toBeLessThanOrEqual(20.5)
    }
  })

  it('actually rises: a pitched roof is taller than a flat one', () => {
    const flat = new MeshBuilder()
    buildRoof(flat, rect(14, 10), { shape: 'flat', y: 9, height: 4, colour: [0.3, 0.3, 0.3] })
    expect(bounds(flat).maxY).toBeCloseTo(9)

    for (const shape of ['gabled', 'hipped', 'pyramidal', 'mansard'] as RoofShape[]) {
      const out = new MeshBuilder()
      buildRoof(out, rect(14, 10), { shape, y: 9, height: 4, colour: [0.3, 0.3, 0.3] })
      expect(bounds(out).maxY, `${shape} is flat`).toBeGreaterThan(11)
    }
  })
})

describe('the Paris roofscape', () => {
  it('puts chimney stacks and dormers on a Haussmann block, above the eaves and inside the footprint', () => {
    const ring = rect(20, 14)
    const spec = { shape: 'mansard' as RoofShape, y: 20, height: 4.2, colour: [0.4, 0.45, 0.5] as [number, number, number] }
    const out = new MeshBuilder()
    buildRoof(out, ring, spec)
    const got = addRoofscape(out, ring, spec, { chimneys: true, dormers: true, pots: 'terracotta' },
      { wall: [0.9, 0.85, 0.75], bayWidth: 2.6, dormerUV: null, seed: 7 })
    expect(got.stacks.length).toBeGreaterThanOrEqual(2)
    expect(got.dormers.length).toBeGreaterThan(0)
    const inside = (x: number, z: number): boolean => Math.abs(x) < 10 && Math.abs(z) < 7
    for (const s of got.stacks) {
      expect(s.top).toBeGreaterThan(spec.y + spec.height)
      expect(inside(s.x, s.z)).toBe(true)
    }
    for (const d of got.dormers) {
      expect(d.y).toBeGreaterThan(spec.y)
      expect(inside(d.x, d.z)).toBe(true)
    }
    // every other bay: on the 20 m walls (8 bays of 2.5 m) dormers sit two bays apart, never side by side
    const long = got.dormers.filter((d) => Math.abs(Math.abs(d.z) - 7) < 2).sort((p, q) => p.x - q.x || p.z - q.z)
    const southSide = long.filter((d) => d.z < 0)
    for (let i = 1; i < southSide.length; i++) expect(southSide[i].x - southSide[i - 1].x).toBeGreaterThan(4)
    // and nothing added pokes below the eaves except the stacks' own feet, hidden in the roof
    for (let i = 1; i < out.positions.length; i += 3) expect(out.positions[i]).toBeGreaterThanOrEqual(spec.y - 0.21)
  })

  it('adds nothing where the region asks for nothing', () => {
    const out = new MeshBuilder()
    const spec = { shape: 'flat' as RoofShape, y: 10, height: 0, colour: [0.5, 0.5, 0.5] as [number, number, number] }
    const got = addRoofscape(out, rect(20, 14), spec, { chimneys: false, dormers: false },
      { wall: [1, 1, 1], bayWidth: 2.6, dormerUV: null, seed: 1 })
    expect(got.stacks.length + got.dormers.length).toBe(0)
    expect(out.positions.length).toBe(0)
  })
})
