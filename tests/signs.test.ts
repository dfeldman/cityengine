/**
 * Where a landmark's name goes: on the wall that faces the street, and on the pavement in front of it —
 * never on a courtyard wall, never in the road.
 */
import { describe, expect, it } from 'vitest'
import { frontageOf, plateQuad, simplify, totemPoint } from '../src/city/landmark-place.ts'
import type { PackedEdge } from '../src/city/package.ts'

// a street running east–west along z = 0: 7 m of carriageway, 2 m of pavement either side
const street: PackedEdge = {
  id: 1, a: 1, b: 2, points: [-100, 0, 100, 0], surface: 'asphalt', width: 7, walk: 2, foot: false, kind: 'residential',
}
// a 20 × 30 m building north of it, set back to the pavement's edge (z from 5.5 to 35.5), anticlockwise
const ring = [{ x: -10, z: 5.5 }, { x: -10, z: 35.5 }, { x: 10, z: 35.5 }, { x: 10, z: 5.5 }].reverse()

describe('landmark name plates', () => {
  it('hang on the wall that faces the street, just outside it', () => {
    const f = frontageOf(ring, [street])!
    expect(f).not.toBeNull()
    expect(f.z).toBeCloseTo(5.5)          // the south wall, facing the street
    expect(f.nz).toBeCloseTo(-1)           // and facing out of the building, towards it
    for (const [x, , z] of plateQuad(f, 2.4, 0.5, 3.5)) {
      expect(z).toBeLessThan(5.5)                       // outside the footprint…
      expect(5.5 - z).toBeLessThanOrEqual(0.1)          // …by no more than 10 cm
      expect(Math.abs(x)).toBeLessThanOrEqual(10)       // and within the wall's length
    }
  })

  it('put the totem on the pavement, not in the carriageway', () => {
    const f = frontageOf(ring, [street])!
    const t = totemPoint(f, [street])!
    expect(t).not.toBeNull()
    expect(Math.abs(t.z)).toBeGreaterThan(street.width / 2)            // off the carriageway
    expect(t.z).toBeLessThan(5.5)                                         // and in front of the wall
  })

  it('give nothing to a building that faces no street', () => {
    const back = ring.map((p) => ({ x: p.x, z: p.z + 200 }))
    expect(frontageOf(back, [street])).toBeNull()
  })

  it('see a façade traced round every buttress as one wall', () => {
    // the south wall as a zigzag of 0.4 m teeth
    const zig: { x: number; z: number }[] = []
    for (let x = 10; x > -10; x -= 1) zig.push({ x, z: 5.5 }, { x: x - 0.5, z: 5.9 })
    const traced = [...zig, { x: -10, z: 5.5 }, { x: -10, z: 35.5 }, { x: 10, z: 35.5 }].reverse()
    expect(simplify(traced).length).toBeLessThan(8)
    expect(frontageOf(traced, [street])).not.toBeNull()
  })
})
