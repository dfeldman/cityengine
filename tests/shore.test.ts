/**
 * The beach's bands (BUGS.md #200, docs/PARKS.md "Beaches are BANDS").
 *
 * Written against synthetic geometry on purpose: the package's `sand` areas arrive with a bake, and the
 * banding has to be provable without one. What is asserted is what the design note asks for — a wet band a
 * few metres wide that is DISTINCTLY darker than dry sand, dry sand beyond it, and a box edge that is not
 * mistaken for a shoreline.
 */
import { describe, expect, it } from 'vitest'
import { MeshBuilder, capPolygonWithHoles } from '../src/render/buildings.ts'
import { beachTint, buildShore, revetmentBand, shoreDistance } from '../src/render/shore.ts'

const DRY: [number, number, number] = [0.80, 0.75, 0.62]
const value = (c: [number, number, number]): number => (c[0] + c[1] + c[2]) / 3

/** a straight coast along z = 0, inside a box whose west edge is at x = -500 */
const coast = [[{ x: -400, z: 0 }, { x: 400, z: 0 }, { x: 400, z: -200 }, { x: -400, z: -200 }]]
const box = { x0: -500, x1: 500, z0: -500, z1: 500 }

describe('shore distance', () => {
  it('measures from the coastline', () => {
    const ix = buildShore(coast, box)!
    expect(ix).not.toBeNull()
    expect(shoreDistance(ix, 0, 5)).toBeCloseTo(5, 3)
    expect(shoreDistance(ix, 120, 40)).toBeCloseTo(40, 3)
  })

  it('caps far inland rather than walking the whole coast', () => {
    const ix = buildShore(coast, box)!
    expect(shoreDistance(ix, 0, 4000)).toBe(ix.cap)
  })

  it('does NOT treat the box edge as a shoreline', () => {
    // the same ring clipped to the box: the two long segments ON the west and east edges are artefacts
    const clipped = [[{ x: -500, z: 0 }, { x: 500, z: 0 }, { x: 500, z: 500 }, { x: -500, z: 500 }]]
    const ix = buildShore(clipped, box)!
    // a point just inside the west edge, far from the real coast at z = 0, must read as FAR from water
    expect(shoreDistance(ix, -498, 300)).toBe(ix.cap)
  })
})

describe('the bands', () => {
  const ix = buildShore(coast, box)!
  const at = (z: number): [number, number, number] => beachTint(DRY, shoreDistance(ix, 0, z), 0, z)

  it('is distinctly darker at the water than above the tide line', () => {
    expect(value(at(2))).toBeLessThan(value(at(40)) - 0.15)
  })

  it('keeps the wet band narrow — a tide line, not a flooded car park', () => {
    // fully wet within a handful of metres, fully dry not far above it
    expect(value(at(5))).toBeLessThan(value(DRY) - 0.15)
    expect(value(at(20))).toBeGreaterThan(value(DRY) - 0.06)
    expect(value(at(40))).toBeGreaterThan(value(DRY) - 0.06)
  })

  it('greens towards dune grass at the landward edge, and only there', () => {
    const green = (c: [number, number, number]): number => c[1] - c[2]
    // averaged along the strip: the dune tint is deliberately PATCHY, so a single sample is not the claim
    const mean = (z: number): number => {
      let s = 0
      for (let x = -50; x < 50; x += 1) s += green(beachTint(DRY, shoreDistance(ix, x, z), x, z))
      return s / 100
    }
    expect(mean(130)).toBeGreaterThan(mean(30) + 0.015)
    // and it is dune GRASS on sand, not a lawn: the park's own grass is about 0.19 green by this measure
    expect(mean(130)).toBeLessThan(0.19)
    // and sand the index gave up measuring — a golf bunker, miles from any sea — stays pale and clean
    expect(green(at(4000))).toBeCloseTo(green(DRY), 2)
  })

  it('never leaves the unit range', () => {
    for (let z = 0; z < 200; z += 0.7) {
      for (const c of [beachTint(DRY, shoreDistance(ix, z, z), z, z)]) {
        for (const v of c) { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(1) }
      }
    }
  })
})

describe('the revetment', () => {
  it('builds a continuous armoured band, not scattered rocks', () => {
    const pos: number[] = []
    const tris: number[] = []
    revetmentBand([{ x: 0, z: 0 }, { x: 30, z: 0 }, { x: 60, z: 10 }], 0.02,
      (x, y, z) => { pos.push(x, y, z); return pos.length / 3 - 1 },
      (a, b, c) => { tris.push(a, b, c) })
    expect(tris.length).toBeGreaterThan(60)
    // every vertex is within the band's half width of the wall's own line, and the band has real width
    let minZ = Infinity, maxZ = -Infinity
    for (let i = 0; i < 12; i += 1) { minZ = Math.min(minZ, pos[i * 3 + 2]); maxZ = Math.max(maxZ, pos[i * 3 + 2]) }
    expect(maxZ - minZ).toBeGreaterThan(4)
    expect(maxZ - minZ).toBeLessThan(12)
  })

  it('does nothing with a degenerate wall', () => {
    let n = 0
    revetmentBand([{ x: 0, z: 0 }], 0, () => n++, () => { n++ })
    expect(n).toBe(0)
  })
})

describe('the sand cap is fine enough to hold a band', () => {
  /*
   * The bands are per-VERTEX colours, so they exist only where there are vertices. `subdivideLastTriangles`
   * gives up at depth 12, and a piece of beach clipped to a 200 m tile starts from ~280 m edges — close
   * enough to the cap to be worth pinning, because failing it would silently smear the wet band into a
   * gradient rather than break anything.
   */
  it('reaches 4 m even from a whole 200 m tile', () => {
    const b = new MeshBuilder()
    capPolygonWithHoles(b, [[{ x: 0, z: 0 }, { x: 200, z: 0 }, { x: 200, z: 200 }, { x: 0, z: 200 }]], 0, [1, 1, 1], 0, 2.4, 4)
    let max = 0
    for (let i = 0; i < b.indices.length; i += 3) {
      const p = (k: number): { x: number; z: number } =>
        ({ x: b.positions[b.indices[i + k] * 3], z: b.positions[b.indices[i + k] * 3 + 2] })
      const a = p(0), c = p(1), d = p(2)
      max = Math.max(max, Math.hypot(a.x - c.x, a.z - c.z), Math.hypot(c.x - d.x, c.z - d.z), Math.hypot(d.x - a.x, d.z - a.z))
    }
    expect(max).toBeLessThanOrEqual(4.5)
    // and the worst case's cost, so a change that makes sand expensive shows up here: a FULL tile of sand
    expect(b.indices.length / 3).toBeLessThan(20000)
  })
})
