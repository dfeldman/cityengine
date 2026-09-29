/**
 * Building signage (render/landmarks/signage.ts): the arithmetic, without a GPU.
 *
 * What is worth pinning here is exactly what has gone wrong before in this project — which way a sign faces,
 * which way its text reads, and how far away it is still drawn.
 */
import { describe, expect, it } from 'vitest'
import { MeshBuilder } from '../src/render/buildings.ts'
import { edgeAt } from '../src/render/landmarks/parts.ts'
import { place, sign, signCorners, signCut } from '../src/render/landmarks/signage.ts'

const RING = [{ x: -5, z: -3 }, { x: 5, z: -3 }, { x: 5, z: 3 }, { x: -5, z: 3 }]

describe('sign placement', () => {
  it('records the sign on the builder rather than drawing geometry', () => {
    const out = new MeshBuilder()
    sign(out, { type: 'flat', text: 'MACY', h: 1, lit: 'none' }, { ring: RING, edge: 0, y: 4 })
    expect(out.triangles).toBe(0)
    expect(out.signs).toHaveLength(1)
    expect(out.signs[0].spec.type).toBe('flat')
  })

  it('takes an edge of the ring in the same frame edgeAt() uses', () => {
    for (let i = 0; i < RING.length; i++) {
      const e = edgeAt(RING, i)
      const p = place({ type: 'flat', text: 'X', h: 1, lit: 'none' }, { ring: RING, edge: i, y: 2 })
      expect(p.heading).toBeCloseTo(e.heading, 10)
      expect(p.x).toBeCloseTo(e.mid.x, 10)
      expect(p.z).toBeCloseTo(e.mid.z, 10)
    }
  })

  it('`along` runs from the edge\'s first corner to its second', () => {
    const a = place({ type: 'flat', text: 'X', h: 1, lit: 'none' }, { ring: RING, edge: 0, y: 2, along: 0 })
    const b = place({ type: 'flat', text: 'X', h: 1, lit: 'none' }, { ring: RING, edge: 0, y: 2, along: 1 })
    expect([a.x, a.z]).toEqual([RING[0].x, RING[0].z])
    expect([b.x, b.z]).toEqual([RING[1].x, RING[1].z])
  })
})

describe('the quad', () => {
  const p = place({ type: 'flat', text: 'X', h: 1, lit: 'none' }, { x: 0, y: 5, z: 0, heading: 0 })

  it('faces +z at heading 0, and stands off the wall along its own normal', () => {
    const q = signCorners(p, 4, 2, 0.06)
    expect(q.normal).toEqual([0, 0, 1])
    for (const c of q.corners) expect(c[2]).toBeCloseTo(0.06, 10)
  })

  it('turns with the heading, still standing off along the face', () => {
    const east = place({ type: 'flat', text: 'X', h: 1, lit: 'none' }, { x: 0, y: 5, z: 0, heading: Math.PI / 2 })
    const q = signCorners(east, 4, 2, 0.5)
    expect(q.normal[0]).toBeCloseTo(1, 10)
    for (const c of q.corners) expect(c[0]).toBeCloseTo(0.5, 10)
  })

  it('maps the texture the way the shots say it reads: u = 0 at +x, v = 0 at the bottom', () => {
    const q = signCorners(p, 4, 2, 0)
    const at = (u: number, v: number): number[] => q.corners[q.uvs.findIndex(([a, b]) => a === u && b === v)]
    // mirrored text and upside-down text are the two ways this has gone wrong; one assertion each
    expect(at(0, 0)[0]).toBeGreaterThan(at(1, 0)[0])
    expect(at(0, 0)[1]).toBeLessThan(at(0, 1)[1])
  })

  it('is exactly the size asked for', () => {
    const q = signCorners(p, 4, 2, 0)
    const xs = q.corners.map((c) => c[0])
    const ys = q.corners.map((c) => c[1])
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(4, 10)
    expect(Math.max(...ys) - Math.min(...ys)).toBeCloseTo(2, 10)
    expect((Math.max(...ys) + Math.min(...ys)) / 2).toBeCloseTo(5, 10)
  })
})

describe('the LOD gate', () => {
  const CAP = 1200   // MID * TILE as the city stands today

  it('grows with the letters: big roof lettering carries, a shop name does not', () => {
    expect(signCut(0.4, CAP)).toBeLessThan(signCut(3, CAP))
  })

  it('never reaches past the ring the city is drawing at all', () => {
    expect(signCut(50, CAP)).toBe(CAP)
    // and follows that ring rather than a written-down 1200 (PLAN.md §Soon.0a)
    expect(signCut(50, 2000)).toBe(2000)
  })

  it('keeps a small sign to a block or two, and never drops one in the near ring', () => {
    expect(signCut(0.1, CAP)).toBe(90)
    expect(signCut(1, CAP)).toBe(220)
  })
})
