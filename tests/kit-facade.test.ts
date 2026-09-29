/**
 * `facade()` — the slot API (docs/KIT-DESIGN.md). What these pin is not "it runs" but the properties the design
 * exists for: that a slot omitted is a COMPILE error, that a temple with no shaft works, that a recessed or
 * framed wall actually stands back, and — the one that matters most — that an arcade draws ARCHES (BUGS.md
 * #96), because a `ground: { kind: 'arcade' }` that renders a picket fence makes the whole API worthless.
 */
import { describe, expect, it } from 'vitest'
import { MeshBuilder } from '../src/render/buildings.ts'
import { facade, edgesFor, type FacadeSpec } from '../src/render/landmarks/facade.ts'
import { towerRing } from '../src/render/landmarks/tower.ts'
import { arcade } from '../src/render/landmarks/parts.ts'
import { classicalColumn } from '../src/render/landmarks/column.ts'

const BLOCK = { hx: 13, hz: 8, height: 31 }

const PLAIN: FacadeSpec = {
  ground: null,
  shaft: { storeys: 9, windows: 'balanced', material: null },
  top: null,
  bands: null,
  crown: null,
  frame: null,
  entrance: null,
  material: 'precast',
}

const finite = (b: MeshBuilder): boolean => b.positions.every((v) => Number.isFinite(v))
const heights = (b: MeshBuilder): number[] => b.positions.filter((_, i) => i % 3 === 1)

describe('the slot mechanism', () => {
  it('will not compile with a slot left out — the whole point of the design', () => {
    // @ts-expect-error `frame` is a REQUIRED key; a model must write `frame: null` having looked at the photo
    const bad: FacadeSpec = { ground: null, shaft: PLAIN.shaft, top: null, bands: null, crown: null, entrance: null, material: 'precast' }
    void bad
  })

  it('refuses a building with no storeys anywhere rather than drawing a silent slab', () => {
    const out = new MeshBuilder()
    expect(() => facade(out, BLOCK, { ...PLAIN, shaft: null })).toThrow(/all null/)
  })

  it('draws a plain block, and keeps it inside its height', () => {
    const out = new MeshBuilder()
    facade(out, BLOCK, PLAIN)
    expect(out.triangles).toBeGreaterThan(50)
    expect(finite(out)).toBe(true)
    expect(Math.max(...heights(out))).toBeLessThanOrEqual(31.5)
  })
})

describe('sections are counted in storeys, not fractions', () => {
  it('divides the height between ground, shaft and top by their storey counts', () => {
    const out = new MeshBuilder()
    facade(out, BLOCK, {
      ...PLAIN,
      ground: { kind: 'plain', storeys: 2, material: null },
      shaft: { storeys: 6, windows: 'balanced', material: null },
      top: { kind: 'glazed', storeys: 2, material: 'glass' },
    })
    // the glazed top is the only 'glass' colour in the model, and it must start at 8/10 of the height
    const glassY: number[] = []
    for (let i = 0; i < out.positions.length; i += 3) {
      const k = (i / 3) * 4
      if (out.colors[k + 2] > 0.44 && out.colors[k + 2] < 0.56 && out.colors[k] < 0.4) glassY.push(out.positions[i + 1])
    }
    expect(Math.min(...glassY)).toBeGreaterThan(31 * 0.8 - 1)
  })

  it('accepts a temple: ground that is nearly the whole building with shaft: null', () => {
    const out = new MeshBuilder()
    facade(out, { hx: 13, hz: 9, height: 16 }, {
      ...PLAIN,
      ground: { kind: 'portico', columns: 6, storeys: 4, order: 'corinthian', pediment: true, steps: 5, projecting: true, material: 'marble' },
      shaft: null,
      material: 'limestone',
    })
    expect(out.triangles).toBeGreaterThan(400)
    expect(finite(out)).toBe(true)
    // the portico stands FORWARD of the wall, so geometry reaches beyond the footprint's front
    const zs: number[] = []
    for (let i = 2; i < out.positions.length; i += 3) zs.push(out.positions[i])
    expect(Math.min(...zs)).toBeLessThan(-9)
  })
})

describe('every slot is placed per EDGE, because a footprint is any polygon', () => {
  const ring = towerRing({ hx: 13, hz: 8, height: 31, ring: [
    { x: -13, z: -8 }, { x: 9, z: -8 }, { x: 13, z: -4 }, { x: 13, z: 8 }, { x: 1, z: 10 }, { x: -13, z: 8 }] })

  it('resolves front / street / all / an index on a non-rectangular ring', () => {
    expect(edgesFor(ring, 'front')).toHaveLength(1)
    expect(edgesFor(ring, 'all')).toHaveLength(ring.length)
    // on THIS plan no other edge is within 75% of the front, so 'street' is the front alone — which is the
    // honest answer: a Fit carries no street bearings, so 'street' is a guess from the plan
    expect(edgesFor(ring, 'street')).toEqual(edgesFor(ring, 'front'))
    // on a squarer corner block both elevations qualify
    const square = towerRing({ hx: 12, hz: 10, height: 20 })
    // (a rectangle's four edges are two pairs, so all four qualify — the guess is only as good as the plan)
    expect(edgesFor(square, 'street').length).toBeGreaterThan(1)
    expect(edgesFor(ring, 2)).toEqual([2])
  })

  it('builds a chamfered-corner building without a NaN anywhere', () => {
    const out = new MeshBuilder()
    facade(out, { hx: 13, hz: 8, height: 31, ring: [...ring] }, {
      ...PLAIN,
      ground: { kind: 'colonnade', columns: 6, storeys: 2, order: 'ionic', on: 'street', material: null },
      shaft: { storeys: 7, windows: 'wide', material: 'terracotta' },
      entrance: { at: 'corner', kind: 'door', steps: 1 },
    })
    expect(finite(out)).toBe(true)
    expect(out.triangles).toBeGreaterThan(200)
  })
})

describe('the frame stands forward and the wall stands back', () => {
  it('puts frame piers outside the recessed curtain wall (the ICA pattern)', () => {
    const framed = new MeshBuilder()
    facade(framed, { hx: 10, hz: 10, height: 26 }, {
      ...PLAIN,
      ground: { kind: 'recessed', storeys: 1, depth: 1.4, material: 'dark-stone' },
      shaft: { storeys: 6, windows: 'continuous', material: 'glass' },
      frame: { verticals: { kind: 'pier', width: 3.4, at: 'corners' }, horizontals: { top: 1.6, base: 0.8 }, recess: 1.2, material: 'granite' },
      material: 'granite',
    })
    const bare = new MeshBuilder()
    facade(bare, { hx: 10, hz: 10, height: 26 }, { ...PLAIN, shaft: { storeys: 7, windows: 'continuous', material: 'glass' } })
    const reach = (b: MeshBuilder): number => Math.max(...b.positions.filter((_, i) => i % 3 === 0))
    // the frame reaches further out than a plain wall on the same footprint does
    expect(reach(framed)).toBeGreaterThan(reach(bare) + 0.5)
    expect(finite(framed)).toBe(true)
  })
})

describe('BUGS.md #96: an arcade draws arches', () => {
  it('fills the arch head above the springing line, not just a rectangular hole', () => {
    const out = new MeshBuilder()
    const H = 8
    arcade(out, { x: -9, z: -4 }, { x: 9, z: -4 }, 0, H, 4, { piers: true })
    const spring = H * 0.72
    // shade-coloured (near-black) geometry ABOVE the springing is the arch head; the broken version had none
    let above = 0
    for (let i = 0; i < out.positions.length; i += 3) {
      const k = (i / 3) * 4
      const dark = out.colors[k] < 0.2 && out.colors[k + 1] < 0.2
      if (dark && out.positions[i + 1] > spring + 0.05) above++
    }
    expect(above).toBeGreaterThan(8)
  })

  it('keeps the arch head below the top of the arcade, so a wide low arcade goes segmental', () => {
    const out = new MeshBuilder()
    arcade(out, { x: -14, z: -4 }, { x: 14, z: -4 }, 0, 5, 3, { piers: true })
    expect(Math.max(...heights(out))).toBeLessThanOrEqual(5.01)
  })
})

describe('BUGS.md #97: an order asked for is an order drawn', () => {
  it('no longer silently downgrades a short column to a tuscan slab', () => {
    const slab = new MeshBuilder()
    classicalColumn(slab, 0, 0, 0, 4.5, 0.35, [0.8, 0.8, 0.75], {})
    const asked = new MeshBuilder()
    classicalColumn(asked, 0, 0, 0, 4.5, 0.35, [0.8, 0.8, 0.75], { order: 'corinthian' })
    expect(asked.triangles).toBeGreaterThan(slab.triangles * 2)
  })

  it('still honours an explicit tier: far is a stated cost decision and stays cheap', () => {
    const out = new MeshBuilder()
    classicalColumn(out, 0, 0, 0, 4.5, 0.35, [0.8, 0.8, 0.75], { order: 'corinthian', tier: 'far' })
    expect(out.triangles).toBeLessThanOrEqual(32)
  })
})
