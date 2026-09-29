/**
 * `stair()` and `railing()` — the derivations and the CLOSEDNESS, which are the two things a render cannot
 * check. The defect these parts exist to prevent (daylight under and between the treads) is a missing-quad
 * bug, so the triangle arithmetic is the test for it.
 */
import { describe, it, expect } from 'vitest'
import { MeshBuilder } from '../src/render/buildings.ts'
import { stair, railing, arcStair, ramp } from '../src/render/landmarks/parts.ts'

const A = { x: -5, z: 0 }
const B = { x: 5, z: 0 }
const bounds = (m: MeshBuilder): { min: number[]; max: number[] } => {
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (let i = 0; i < m.positions.length; i += 3) {
    for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], m.positions[i + k]); max[k] = Math.max(max[k], m.positions[i + k]) }
  }
  return { min, max }
}

describe('stair()', () => {
  it('derives the step count from the riser, never from an argument', () => {
    const m = new MeshBuilder()
    stair(m, A, B, 0, 1.5, { riser: 0.15 })
    // 10 steps: riser + tread + NOSING (6 tris) and two end quads (4 tris) each, plus base and back (4).
    // The nosing is the darker strip along each tread's front lip (BUGS.md #213d) — without it a flight
    // seen from its head, which is the view a stairway exists for, reads as a blank ramp.
    expect(m.triangles).toBe(10 * 10 + 4)
  })

  it('shares the remainder out so the flight lands exactly on y1', () => {
    const m = new MeshBuilder()
    stair(m, A, B, 0, 1.0, { riser: 0.15 })   // 1.0 / 0.15 = 6.67 -> 7 steps of 0.1428
    expect(m.triangles).toBe(7 * 10 + 4)   // 10 not 8: each step also carries a nosing quad
    expect(bounds(m).max[1]).toBeCloseTo(1.0, 6)
  })

  it('derives the tread from the riser, and the run from both', () => {
    const m = new MeshBuilder()
    stair(m, A, B, 0, 1.5, { riser: 0.15 })   // tread = max(0.26, 0.63 - 0.3, 0.375) = 0.375
    const b = bounds(m)
    expect(b.max[2] - b.min[2]).toBeCloseTo(10 * 0.375, 6)
  })

  it("lands within 2% of Yerba Buena's measured 1.7 m esplanade tread from its 0.67 m rise", () => {
    const m = new MeshBuilder()
    stair(m, A, B, 0, 4, { preset: 'esplanade', riser: 0.67 })
    const b = bounds(m)
    expect((b.max[2] - b.min[2]) / 6).toBeCloseTo(1.667, 2)
  })

  it('is CLOSED: a base, a back and an end quad per step, so no daylight passes through it', () => {
    const plain = new MeshBuilder()
    stair(plain, A, B, 0, 1.5, { riser: 0.15 })
    const land = new MeshBuilder()
    stair(land, A, B, 0, 1.5, { riser: 0.15, landing: 2 })
    // a landing adds its own tread and two end quads; the base and back simply move out
    expect(land.triangles - plain.triangles).toBe(6)
  })

  it('splays the FOOT wider than the head, and never the other way', () => {
    const m = new MeshBuilder()
    const s = stair(m, A, B, 0, 1.5, { riser: 0.15, splay: 0.5 })
    const footW = Math.hypot(s.bottom[1].x - s.bottom[0].x, s.bottom[1].z - s.bottom[0].z)
    const headW = Math.hypot(s.top[1].x - s.top[0].x, s.top[1].z - s.top[0].z)
    expect(headW).toBeCloseTo(10, 6)
    expect(footW).toBeCloseTo(15, 6)
  })

  it('honours from/to as fractions of the baseline, like vault()', () => {
    const m = new MeshBuilder()
    const s = stair(m, A, B, 0, 1.5, { from: 0.25, to: 0.75 })
    expect(Math.hypot(s.top[1].x - s.top[0].x, s.top[1].z - s.top[0].z)).toBeCloseTo(5, 6)
  })

  it("anchor 'top' hangs the flight off the baseline as the HEAD, for a wall edge", () => {
    const bottom = new MeshBuilder()
    const sb = stair(bottom, A, B, 0, 1.5, {})
    const top = new MeshBuilder()
    const st = stair(top, A, B, 0, 1.5, { anchor: 'top' })
    expect(top.triangles).toBe(bottom.triangles)
    // the head sits ON the baseline (z = 0) and the foot is out along +n; the other way round for 'bottom'
    expect(st.top[0].z).toBeCloseTo(0, 6)
    expect(sb.bottom[0].z).toBeCloseTo(0, 6)
    expect(st.bottom[0].z).toBeCloseTo(sb.top[0].z, 6)
  })

  it('pushes deep PLANTED treads to out.decks and shallow ones nowhere', () => {
    const deep = new MeshBuilder()
    stair(deep, A, B, 0, 4, { preset: 'terrace', riser: 0.8, run: 10 })
    expect(deep.decks.length).toBe(5)
    expect(deep.decks[0].ring.length).toBe(4)
    const shallow = new MeshBuilder()
    stair(shallow, A, B, 0, 1.5, { riser: 0.15, tread: 'planted' })
    expect(shallow.decks.length).toBe(0)
  })

  it('always puts a post at the HEAD of the flight, whatever the step count', () => {
    // a stride of N steps leaves the rail ending in mid air whenever count is not a multiple of it
    for (const rise of [1.0, 1.05, 1.4, 4]) {
      const none = new MeshBuilder()
      stair(none, A, B, 0, rise, { riser: 0.15 })
      const railed = new MeshBuilder()
      const s = stair(railed, A, B, 0, rise, { riser: 0.15, rail: 'left' })
      let top = -Infinity
      for (let i = 1; i < railed.positions.length; i += 3) top = Math.max(top, railed.positions[i])
      // the handrail's own top is rise + 1.05 + its half section; a post must reach it, not stop short
      expect(top).toBeCloseTo(rise + 1.05 + 0.035, 6)
      expect(railed.triangles).toBeGreaterThan(none.triangles)
      expect(s.top.length).toBe(2)
    }
  })

  it('adds a sloped rail without changing the flight', () => {
    const none = new MeshBuilder()
    stair(none, A, B, 0, 1.5, { riser: 0.15 })
    const both = new MeshBuilder()
    stair(both, A, B, 0, 1.5, { riser: 0.15, rail: 'both' })
    const one = new MeshBuilder()
    stair(one, A, B, 0, 1.5, { riser: 0.15, rail: 'left' })
    expect(both.triangles - none.triangles).toBe(2 * (one.triangles - none.triangles))
  })
})

describe('railing()', () => {
  it('derives the post spacing from the run, with a post on each end', () => {
    const m = new MeshBuilder()
    railing(m, [{ x: 0, z: 0 }, { x: 15, z: 0 }], 0, { kind: 'posts', spacing: 1.5 })
    // 10 bays -> 11 posts, plus the top rail; every piece is a closed box of 12 triangles
    expect(m.triangles).toBe(12 * 12)
  })

  it('draws the posts IN the rail plane, not proud of it (BUGS.md #134a)', () => {
    const m = new MeshBuilder()
    railing(m, [{ x: 0, z: 0 }, { x: 15, z: 0 }], 0, { kind: 'posts' })
    const b = bounds(m)
    // 0.34 m proud is what read as a palisade; nothing here may stand more than its own half-thickness out
    expect(Math.max(Math.abs(b.min[2]), Math.abs(b.max[2]))).toBeLessThan(0.06)
  })

  it('stands 1.05 m by default, and takes a height', () => {
    const m = new MeshBuilder()
    railing(m, [{ x: 0, z: 0 }, { x: 4, z: 0 }], 3, {})
    expect(bounds(m).max[1]).toBeCloseTo(4.05, 6)
  })

  it('glass and solid are closed boxes, so they read from both sides', () => {
    for (const kind of ['glass', 'solid'] as const) {
      const m = new MeshBuilder()
      railing(m, [{ x: 0, z: 0 }, { x: 3, z: 0 }], 0, { kind })
      expect(m.triangles % 12).toBe(0)
    }
  })

  it('ignores a degenerate polyline rather than throwing', () => {
    const m = new MeshBuilder()
    railing(m, [{ x: 0, z: 0 }], 0, {})
    expect(m.triangles).toBe(0)
  })
})

describe('arcStair()', () => {
  const C = { x: 0, z: 0 }
  const radial = (m: MeshBuilder): { min: number; max: number } => {
    let min = Infinity
    let max = -Infinity
    for (let i = 0; i < m.positions.length; i += 3) {
      const r = Math.hypot(m.positions[i], m.positions[i + 2])
      min = Math.min(min, r); max = Math.max(max, r)
    }
    return { min, max }
  }

  it("shares the straight flight's derivations exactly", () => {
    const arc = new MeshBuilder()
    const a = arcStair(arc, C, 6, 0, 1.5, { riser: 0.15 })
    const str = new MeshBuilder()
    const b = stair(str, { x: -5, z: 0 }, { x: 5, z: 0 }, 0, 1.5, { riser: 0.15 })
    expect(a.steps).toBe(b.steps)
    expect(a.tread).toBeCloseTo(b.tread, 9)
    expect(a.run).toBeCloseTo(b.run, 9)
  })

  it('climbs RADIALLY: the head is a run further out than the foot', () => {
    const m = new MeshBuilder()
    const s = arcStair(m, C, 6, 0, 1.5, { riser: 0.15, from: 0, to: 0.5 })
    const r = radial(m)
    expect(r.min).toBeCloseTo(6, 6)
    expect(r.max).toBeCloseTo(6 + s.run, 6)
    expect(Math.hypot(s.top[0].x, s.top[0].z)).toBeCloseTo(6 + s.run, 6)
  })

  it("climb: 'in' turns it into a bowl instead", () => {
    const m = new MeshBuilder()
    const s = arcStair(m, C, 20, 0, 1.5, { riser: 0.15, climb: 'in' })
    expect(Math.hypot(s.top[0].x, s.top[0].z)).toBeCloseTo(20 - s.run, 6)
  })

  it('closes its two radial ends on a partial sweep and omits them on a full turn', () => {
    const part = new MeshBuilder()
    arcStair(part, C, 6, 0, 1.5, { riser: 0.15, from: 0, to: 0.5, segments: 12 })
    const whole = new MeshBuilder()
    arcStair(whole, C, 6, 0, 1.5, { riser: 0.15, segments: 12 })
    // same sweep count, so the partial one carries exactly 10 steps x 2 ends x 2 triangles more
    expect(part.triangles - whole.triangles).toBe(10 * 2 * 2)
  })

  it('subdivides the sweep by its own arc LENGTH, not by a typed count', () => {
    const small = new MeshBuilder()
    arcStair(small, C, 4, 0, 1.5, { riser: 0.15 })
    const big = new MeshBuilder()
    arcStair(big, C, 40, 0, 1.5, { riser: 0.15 })
    // (and it is capped, so a huge radius does not run away: 72 segments is the ceiling)
    expect(big.triangles).toBeGreaterThan(small.triangles * 2)
  })

  it('returns its foot and head as polylines a railing can take', () => {
    const m = new MeshBuilder()
    const s = arcStair(m, C, 6, 0, 1.5, { from: 0, to: 0.25 })
    expect(s.top.length).toBeGreaterThan(4)
    const r = new MeshBuilder()
    railing(r, s.top, 1.5, { kind: 'posts' })
    expect(r.triangles).toBeGreaterThan(0)
  })

  it('pushes planted arc treads to out.decks as closed rings', () => {
    const m = new MeshBuilder()
    arcStair(m, C, 8, 0, 4, { preset: 'terrace', riser: 0.8, run: 10, from: 0, to: 0.5 })
    expect(m.decks.length).toBe(5)
    expect(m.decks[0].ring.length).toBeGreaterThan(8)
  })
})

describe('ramp()', () => {
  const A2 = { x: -3, z: 0 }
  const B2 = { x: 3, z: 0 }

  it('derives its run from the rise by a gradient, 1 in 12 by default', () => {
    const m = new MeshBuilder()
    const r = ramp(m, A2, B2, 0, 1.8, {})
    expect(r.run).toBeCloseTo(21.6, 6)
  })

  it('takes a run instead, so it can be paired with a flight', () => {
    const m = new MeshBuilder()
    const s = stair(m, A2, B2, 0, 6, { run: 40 })
    const w = new MeshBuilder()
    const r = ramp(w, A2, B2, 0, 6, { run: s.run })
    expect(r.run).toBeCloseTo(s.run, 9)
    expect(r.top[0].z).toBeCloseTo(s.top[0].z, 9)
  })

  it('is a closed wedge: a surface, two sides, a base and a back', () => {
    const m = new MeshBuilder()
    ramp(m, A2, B2, 0, 1.8, {})
    expect(m.triangles).toBe(5 * 2)
  })
})
