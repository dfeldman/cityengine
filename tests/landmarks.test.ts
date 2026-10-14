import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { entryKind, fitFront, groundedParts, isReplaced, packedIds, partsComplete, partsOutline, partsUnion, replacedIds, restyles, tileNearParts, type LandmarkEntry } from '../src/render/landmarks.ts'
import { PROCEDURAL } from '../src/render/landmarks/procedural.ts'
import { MeshBuilder } from '../src/render/buildings.ts'
import { baked } from './baked.ts'
import { readPackage } from '../tools/bake-files.ts'

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
    // and the parts of an outline it names go with it, wherever the bake dropped the outline (BUGS.md #100)
    const replaced = replacedIds(entries)
    expect(isReplaced(replaced, { id: 9 })).toBe(false)
    expect(isReplaced(replaced, { id: 9, partOf: 1 })).toBe(true)
    expect(isReplaced(replaced, { id: 9, partOf: 2 })).toBe(false)
  })
})

describe('a restyle naming an outline the bake replaced with its parts (BUGS.md #102)', () => {
  const pkg = (bs: { id: number; partOf?: number }[]) =>
    ({ origin: { lat: 0, lon: 0 }, buildings: bs.map((b) => ({ ...b, ring: [0, 0, 10, 0, 10, 10, 0, 10] })), landmarks: [] }) as never

  it('takes every part of it, with the style and NOT the whole building\'s massing', () => {
    const e: LandmarkEntry = { name: 'Grace Cathedral', osm: 'way/200', restyle: 'classical', height: 53, levels: 11, eaves: 40, dropParts: true }
    const taken = restyles([e], pkg([{ id: 201, partOf: 200 }, { id: 202, partOf: 200 }, { id: 9 }]))
    expect([...taken.keys()].sort((a, b) => a - b)).toEqual([200, 201, 202]) // 200 itself is not in the bake
    expect(taken.has(9)).toBe(false)
    // the dress is the entry's; `height`/`eaves`/`levels` describe the WHOLE building and every grounded
    // part would take them — 53 m onto a 4 m canopy
    expect(taken.get(201)!.restyle).toBe('classical')
    expect(taken.get(201)!.height).toBeUndefined()
    expect(taken.get(201)!.eaves).toBeUndefined()
    expect(taken.get(201)!.levels).toBeUndefined()
    // and `dropParts` above all: the parts ARE the building, and it would delete the aloft ones
    expect(taken.get(201)!.dropParts).toBeUndefined()
  })

  it('never reaches the parts of an outline the bake KEPT, and an exact id keeps its own entry', () => {
    const outline: LandmarkEntry = { name: 'outline', osm: 'way/200', restyle: 'classical' }
    const part: LandmarkEntry = { name: 'a part', osm: 'way/201', restyle: 'brick' }
    // way/300 is in the bake, so nothing carries partOf: 300 and it claims only itself
    const kept: LandmarkEntry = { name: 'kept', osm: 'way/300', restyle: 'chicago' }
    const taken = restyles([part, outline, kept], pkg([{ id: 201, partOf: 200 }, { id: 202, partOf: 200 }, { id: 300 }]))
    expect(taken.get(201)!.restyle).toBe('brick')      // FIRST entry wins, as everywhere else
    expect(taken.get(202)!.restyle).toBe('classical')
    expect(taken.get(300)!.restyle).toBe('chicago')
    expect(taken.get(300)!.height).toBeUndefined()
  })
})

/*
 * 25,000 triangles is the right ceiling for a BUILDING. It is the wrong ceiling for a suspension bridge
 * two and a half kilometres long, and on 2026-09-24 it actively blocked a fix: the owner reported that huge
 * polygons on the bridges and the bay wreck depth precision ("it's hard to even tell where the water line
 * is", BUGS.md #154), and the Golden Gate's deck could not be subdivided to the 16 m target because doing so
 * reached 26,168 triangles. It was left at 32 m — barely subdivided — purely to satisfy this number.
 *
 * So a few named landmarks get their own ceiling. This is deliberately a SHORT list with a reason each:
 * the test still guards every other builder at 25,000, and adding a name here should require justifying why
 * the thing is genuinely not a building.
 */
const BIG: Record<string, number> = {
  // 2.7 km of deck, towers and cables, and a surface the rider crosses at eye level, so its long spans must
  // be finely subdivided or the depth buffer cannot sort the deck against the water beneath it
  goldenGateBridge: 40_000,
  /*
   * And its NEAR level (BUGS.md #211) is the same builder with every box subdivided to 4 m, because the
   * rider is now ON it: this is the model the path runs over, so the far level's huge quads — the thing the
   * owner actually reported, *"its polys are huge so depth mapping fails"* — are what it exists to replace.
   * Twice the far level, for the one object in the city that is ridden and also seen from eight kilometres.
   */
  goldenGateBridgeNear: 80_000,
  bayBridge: 40_000,
  // the near level: both roadways tessellated to 4 m for a rider, the lane lines, the approach bents
  bayBridgeNear: 110_000,
}

describe('every procedural landmark', () => {
  for (const [name, build] of Object.entries(PROCEDURAL)) {
    it(`${name} builds finite, bounded, affordable geometry`, () => {
      const out = new MeshBuilder()
      build(out, { hx: 25, hz: 35, height: 40 })
      expect(out.positions.length).toBeGreaterThan(0)
      for (const v of out.positions) expect(Number.isFinite(v)).toBe(true)
      expect(out.triangles).toBeLessThan(BIG[name] ?? 25_000)
      // (the big builders take a second or two alone and five or more when the whole suite runs beside them: the
      // default 5 s failed the bridges on load, not on geometry)
    }, name in BIG ? 30_000 : undefined)
  }
})

it.skipIf(!baked('paris-marais'))('the Place des Vosges restyle takes the houses round the square and nothing in its garden', () => {
  const pkg = readPackage('paris-marais')
  const manifest: LandmarkEntry[] = JSON.parse(readFileSync('public/landmarks/paris.json', 'utf8'))
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

/*
 * BUGS.md #100: an entry naming an outline the bake replaced with the building's own `building:part`s. The
 * outline is not in the package — only the parts, each carrying `partOf: <its id>` — so the entry must claim
 * them and be fitted to their UNION. Fitting to one part is the whole trap: each Salesforce Tower part is a
 * ~250 m² wedge and the tower would have been built a quarter of its size.
 */
describe('a building the bake replaced with its own parts (BUGS.md #100)', () => {
  const ring = (x0: number, z0: number, x1: number, z1: number): number[] => [x0, z0, x1, z0, x1, z1, x0, z1]
  // a 60 x 20 m building mapped as three grounded parts in a row, plus a roof plate that starts at 30 m
  const parts = [
    { id: 1, ring: ring(0, 0, 20, 20), height: 30 },
    { id: 2, ring: ring(20, 0, 40, 20), height: 30 },
    { id: 3, ring: ring(40, 0, 60, 20), height: 30 },
    { id: 4, ring: ring(0, 0, 60, 20), height: 34, minHeight: 30 },
  ]

  it('unions the grounded parts and takes the tallest part\'s height', () => {
    expect(groundedParts(parts).map((p) => p.id)).toEqual([1, 2, 3])
    const u = partsUnion(parts)!
    expect(u.height).toBe(34)
    const xs = u.hull.map((p) => p.x)
    const zs = u.hull.map((p) => p.z)
    expect(Math.min(...xs)).toBe(0)
    expect(Math.max(...xs)).toBe(60)
    expect(Math.min(...zs)).toBe(0)
    expect(Math.max(...zs)).toBe(20)
  })

  /*
   * An L round a neighbour's corner lot (SFMOMA round the W, 2026-10-03): the hull fills the notch, the outline must
   * not — it is what `"plan": "union"` hands a builder as its ring.
   */
  it('traces the true outline of an L-shaped plan, notch and all', () => {
    const L = [{ id: 1, ring: ring(0, 0, 40, 20), height: 20 }, { id: 2, ring: ring(0, 20, 20, 40), height: 20 }]
    const o = partsOutline(L)!
    const area = Math.abs(o.reduce((a, p, i) => { const q = o[(i + 1) % o.length]; return a + p.x * q.z - q.x * p.z }, 0) / 2)
    expect(area).toBeCloseTo(1200, -1)
    expect(o.length).toBe(6)
    const inside = (x: number, z: number): boolean => {
      let c = false
      for (let i = 0, j = o.length - 1; i < o.length; j = i++) if ((o[i].z > z) !== (o[j].z > z) && x < ((o[j].x - o[i].x) * (z - o[i].z)) / (o[j].z - o[i].z) + o[i].x) c = !c
      return c
    }
    expect(inside(30, 30)).toBe(false)
    expect(inside(10, 30)).toBe(true)
  })

  /** The roof plate alone would give the same footprint here; a part that overhangs would not. */
  it('does not let an ungrounded part widen the footprint', () => {
    const over = [...parts.slice(0, 3), { id: 5, ring: ring(-15, -15, 75, 35), height: 40, minHeight: 25 }]
    const u = partsUnion(over)!
    expect(Math.min(...u.hull.map((p) => p.x))).toBe(0)
    expect(u.height).toBe(40)
  })

  /*
   * And the readiness: tiles stream, and a building 60 m long straddles a 200 m tile boundary. Placed on the
   * parts of the first tile to arrive, the Ferry Building (200 m, seven parts) would stand a third of its
   * length. A part that has not arrived is in a tile that has not arrived — a tile's buildings all come at
   * once — so every tile the parts reach into, with a margin for one that starts just beyond them, must be in.
   */
  describe('waiting for the parts that are still in another tile', () => {
    const left = [{ id: 1, ring: ring(150, 50, 199, 70), height: 30 }]
    const right = [{ id: 2, ring: ring(201, 50, 260, 70), height: 30 }]
    it('is not complete while a tile the building reaches into is missing', () => {
      expect(partsComplete(left, new Set(['0,0']))).toBe(false)
      expect(partsComplete([...left, ...right], new Set(['0,0']))).toBe(false)
    })
    it('is complete once every tile it reaches into has arrived', () => {
      expect(partsComplete([...left, ...right], new Set(['0,0', '1,0']))).toBe(true)
    })
    /** the seam case: a part ending ON the boundary does not reach into the next tile by its ring alone */
    it('still waits for the tile just beyond a part that ends on the boundary', () => {
      expect(partsComplete(left, new Set(['0,0', '0,1']))).toBe(false)
    })
    it('nothing is never complete', () => {
      expect(partsComplete([], new Set(['0,0']))).toBe(false)
    })
    /*
     * And the backstop only counts tiles of the building's OWN neighbourhood: a tile arriving a kilometre
     * away says nothing about whether the rest of this building is coming. Counting every tile, a landmark
     * the camera passed once from across the city was placed on whatever single part happened to be loaded.
     */
    it('knows which arriving tiles are its own neighbourhood', () => {
      expect(tileNearParts(left, 0, 0)).toBe(true)
      expect(tileNearParts(left, 2, 1)).toBe(true)
      expect(tileNearParts(left, 5, 0)).toBe(false)
      expect(tileNearParts(left, 0, -4)).toBe(false)
      expect(tileNearParts([], 0, 0)).toBe(false)
    })
  })
})
