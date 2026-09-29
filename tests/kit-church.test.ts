/**
 * `church()` — the church kit's slot API (docs/INSTITUTIONS.md, docs/KIT.md §"The church kit"). As with
 * `facade()`, what these pin is not "it runs" but the properties the design exists for: that a slot left out is
 * a COMPILE error, that a tower goes ABOVE the nave's ridge rather than sulking inside the roof, and that the
 * parts which three bugs today proved can look perfect in code and draw nothing — the portal, the rose window —
 * actually put geometry in front of the wall where a camera can see it.
 */
import { describe, expect, it } from 'vitest'
import { MeshBuilder } from '../src/render/buildings.ts'
import { church, portal, roseWindow, lancet, churchTower, type ChurchSpec } from '../src/render/landmarks/church.ts'

const FIT = { hx: 12, hz: 20, height: 19 }

const HALL: ChurchSpec = {
  nave: { bays: 4, storeys: 1, roof: 'gable', pitch: 'moderate' },
  aisles: null,
  transept: null,
  chancel: null,
  tower: null,
  front: { kind: 'gable', portal: 'single', window: 'rose', steps: 3 },
  walls: { material: 'brick', openings: 'lancet', buttresses: 'plain' },
}

const finite = (b: MeshBuilder): boolean => b.positions.every((v) => Number.isFinite(v))
const ys = (b: MeshBuilder): number[] => b.positions.filter((_, i) => i % 3 === 1)
const zs = (b: MeshBuilder): number[] => b.positions.filter((_, i) => i % 3 === 2)
const tris = (b: MeshBuilder): number => b.indices.length / 3

describe('the slot mechanism', () => {
  it('will not compile with a slot left out — a model must write `tower: null` having looked at the photograph', () => {
    // @ts-expect-error `tower` is a REQUIRED key
    const bad: ChurchSpec = { nave: HALL.nave, aisles: null, transept: null, chancel: null, front: HALL.front, walls: HALL.walls }
    void bad
  })

  it('refuses a nave with no bays rather than drawing a silent shed', () => {
    const out = new MeshBuilder()
    expect(() => church(out, FIT, { ...HALL, nave: { ...HALL.nave, bays: 0 } })).toThrow(/bays/)
  })

  it('builds every tradition it claims to cover, finitely', () => {
    const specs: ChurchSpec[] = [
      HALL,
      { ...HALL, aisles: { roof: 'lean-to' }, transept: { ends: 'projecting' }, chancel: { kind: 'apse' },
        tower: { at: 'twin', stages: 5, plan: 'square', top: 'spire' },
        walls: { material: 'limestone', openings: 'lancet', buttresses: 'flying' } },
      { ...HALL, front: { kind: 'mission', portal: 'single', window: 'oculus', steps: 3 },
        walls: { material: 'stucco', openings: 'round', buttresses: 'none' } },
      { ...HALL, front: { kind: 'baroque', portal: 'porch', window: 'medallion', steps: 4 },
        tower: { at: 'twin', stages: 4, plan: 'square', top: 'lantern' } },
      { ...HALL, front: { kind: 'pediment', portal: 'triple', window: 'wheel', steps: 2 },
        transept: { ends: 'flush' }, chancel: { kind: 'apse' },
        tower: { at: 'crossing', stages: 3, plan: 'octagon', top: 'dome' } },
      { ...HALL, nave: { ...HALL.nave, roof: 'hip' }, tower: { at: 'detached', stages: 4, plan: 'octagon', top: 'belfry' } },
      { ...HALL, nave: { ...HALL.nave, roof: 'flat' }, front: { kind: 'plain', portal: 'recessed', window: 'lancets', steps: 0 },
        walls: { material: 'concrete', openings: 'square', buttresses: 'none' } },
    ]
    for (const s of specs) {
      const out = new MeshBuilder()
      church(out, FIT, s)
      expect(finite(out)).toBe(true)
      expect(tris(out)).toBeGreaterThan(80)
    }
  })

  it('builds the same church whichever axis the footprint runs along', () => {
    const a = new MeshBuilder()
    const b = new MeshBuilder()
    church(a, FIT, HALL)
    church(b, { hx: 20, hz: 12, height: 19 }, HALL)
    expect(tris(b)).toBe(tris(a))
  })
})

describe('the tower', () => {
  it('clears the nave ridge — a tower buried in its own roof is not a landmark', () => {
    const roofOnly = new MeshBuilder()
    church(roofOnly, FIT, HALL)
    const ridge = Math.max(...ys(roofOnly))
    const withTower = new MeshBuilder()
    church(withTower, FIT, { ...HALL, tower: { at: 'front-corner', stages: 4, plan: 'square', top: 'pyramid' } })
    expect(Math.max(...ys(withTower))).toBeGreaterThan(ridge * 1.3)
  })

  it('gets taller with more stages, which is the only size the spec gives it', () => {
    const h = (stages: number): number => {
      const out = new MeshBuilder()
      church(out, FIT, { ...HALL, tower: { at: 'front-centre', stages, plan: 'square', top: 'parapet' } })
      return Math.max(...ys(out))
    }
    expect(h(6)).toBeGreaterThan(h(4))
  })

  it('draws a top for every named finish', () => {
    for (const top of ['spire', 'steeple', 'belfry', 'pyramid', 'dome', 'lantern', 'parapet', 'flat'] as const) {
      const out = new MeshBuilder()
      churchTower(out, { x: 0, z: 0 }, 0, 2.5, 4, 4, top, 'square',
        { wall: [0.8, 0.8, 0.8], material: 'ashlar', roof: [0.3, 0.3, 0.3], roofMaterial: 'tile', trim: [0.9, 0.9, 0.9] })
      expect(finite(out)).toBe(true)
      expect(tris(out)).toBeGreaterThan(20)
    }
  })
})

describe('the parts that have to be IN FRONT of the wall to exist at all', () => {
  /*
   * The church kit's walls are solid `faceBand`; nothing can cut a hole in them. The first portal was modelled
   * as a recess at negative z and was invisible at every size — a blank elevation with a flight of steps under
   * it (the BUGS.md #96 failure). These pin the fix: on a wall at z = 0 facing +z, the geometry must be at
   * POSITIVE z.
   */
  const inFront = (b: MeshBuilder): boolean => Math.max(...zs(b)) > 0.02

  it('portal: the void, the door and every order of moulding stand proud of the wall', () => {
    const out = new MeshBuilder()
    portal(out, { x: 0, z: 0 }, 0, 3.6, 6, 'pointed', [0.8, 0.8, 0.8], { orders: 3 })
    expect(inFront(out)).toBe(true)
    expect(zs(out).every((z) => z > -0.001)).toBe(true)
    expect(tris(out)).toBeGreaterThan(30)
  })

  it('rose window: the spokes lie in the WALL plane, not fanned across the pavement', () => {
    const out = new MeshBuilder()
    roseWindow(out, { x: 0, z: 0 }, 0, 8, 2, [0.9, 0.9, 0.9], { spokes: 8 })
    expect(inFront(out)).toBe(true)
    // a spoked wheel two metres across spans 4 m in x and 4 m in y, and nothing in z
    const xs = out.positions.filter((_, i) => i % 3 === 0)
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(3.8)
    expect(Math.max(...ys(out)) - Math.min(...ys(out))).toBeGreaterThan(3.8)
    expect(Math.max(...zs(out))).toBeLessThan(0.5)
  })

  it('lancet: a pointed head is taller than its springing and never inverted', () => {
    const out = new MeshBuilder()
    lancet(out, { x: 0, z: 0 }, 0, 2, 1.4, 5, 'pointed', [0.9, 0.9, 0.9])
    expect(inFront(out)).toBe(true)
    expect(Math.max(...ys(out))).toBeCloseTo(7, 0)
  })

  it('a portal drawn on a turned wall keeps its geometry on that wall\'s OUTWARD side', () => {
    // heading π faces −z: everything must land at NEGATIVE z, which is the +z convention working
    const out = new MeshBuilder()
    portal(out, { x: 0, z: 0 }, Math.PI, 3.6, 6, 'round', [0.8, 0.8, 0.8], { orders: 2 })
    expect(Math.min(...zs(out))).toBeLessThan(-0.02)
    expect(Math.max(...zs(out))).toBeLessThan(0.001)
  })
})
