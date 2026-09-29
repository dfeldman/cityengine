/**
 * Map format v3 (docs/MAP-FORMAT.md): every tile of a real city survives v2 → v3 → v2, so the game can read v3
 * through the adapter and draw exactly what it drew.
 *
 * Runs on checked-in fixtures (tests/fixtures/map-v3/): a 3×3 block of San Francisco round tile (−1,−3) —
 * per-tile terrain, sports courts, cable-car rails, `building:part`s, landmark plates — and a 2×2 of central
 * Paris with a Wallace fountain. Cut from real bakes, so they are real data, and always present: a test that
 * skipped when a city had not been baked would pass green with nothing checked.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { CityIndex, TileData } from '../src/city/tiles.ts'
import { Terrain } from '../src/city/terrain.ts'
import { convertTile, DictBuilder, edgeRefs, newStats } from '../src/map/convert.ts'
import { convertIndex, FloorScan } from '../src/map/convert-city.ts'
import { adaptIndex, adaptTile } from '../src/map/adapt.ts'
import { ITEM_STRIDE, type MapTile } from '../src/map/format.ts'
import { applyPatches, indexPatches, type PatchOp } from '../src/map/patch.ts'


/** numbers equal within `tol`, everything else structurally; `path` for the message */
function near(a: unknown, b: unknown, tol: (path: string) => number, path = ''): string | null {
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) <= tol(path) ? null : `${path}: ${a} ≠ ${b}`
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return `${path}: length ${a.length} ≠ ${b.length}`
    for (let i = 0; i < a.length; i++) { const d = near(a[i], b[i], tol, `${path}[${i}]`); if (d) return d }
    return null
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const ka = Object.keys(a).filter((k) => (a as Record<string, unknown>)[k] !== undefined).sort()
    const kb = Object.keys(b).filter((k) => (b as Record<string, unknown>)[k] !== undefined).sort()
    if (ka.join() !== kb.join()) return `${path}: keys {${ka}} ≠ {${kb}}`
    for (const k of ka) { const d = near((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], tol, `${path}.${k}`); if (d) return d }
    return null
  }
  return a === b ? null : `${path}: ${String(a)} ≠ ${String(b)}`
}

/**
 * What v3 stores as an integer where v2 had a float of more precision: bounded, and named. Lengths are half a
 * centimetre — v2 is on the centimetre grid almost everywhere, but a few clipped and relation rings are not
 * (−4.5006 m in central Paris), and v3 rounding them is the rule, not a loss.
 */
const TOL = (p: string): number =>
  /roofDirection$/.test(p) ? Math.PI / 18000 : /roofColour/.test(p) ? 0.5 / 255 : 0.005 + 1e-9

describe.each(['san-francisco', 'paris-centre'])('map v3 round trip (%s fixture)', (city) => {
  const DIR = `tests/fixtures/map-v3/${city}`
  const index = JSON.parse(readFileSync(`${DIR}/index.json`, 'utf8')) as CityIndex
  const tiles = index.tiles.map((e) => JSON.parse(readFileSync(`${DIR}/tiles/${e.tx}_${e.tz}.json`, 'utf8')) as TileData)

  const floor = new FloorScan()
  if (index.terrain) floor.addArray(index.terrain.heights)
  for (const t of tiles) floor.tile(t)
  const refs = edgeRefs(tiles.flatMap((t) => t.edges))
  const terrain = new Terrain(index.terrain ?? null, index.tile)
  for (const t of tiles) { const [tx, tz] = t.key.split(',').map(Number); terrain.addTile(tx, tz, t.terrain) }
  const dict = new DictBuilder()
  const stats = newStats()
  const ctx = { zFloor: floor.zFloor, dict, heightAt: (x: number, z: number) => terrain.rawHeightAt(x, z), edgeRef: (e: { id: number }) => refs.get(e.id)!, stats }
  const v3 = tiles.map((t) => convertTile(t, ctx))
  const idx3 = convertIndex(index, floor.zFloor, dict.dict, v3.map((m, i) => ({ key: m.key, tx: m.tx, ty: m.ty, bytes: 0, buildings: index.tiles[i].buildings, edges: index.tiles[i].edges })))

  it('gives every tile back', () => {
    const byId = <T extends { id: number; ring: number[] }>(l: T[]): T[] => [...l].sort((a, b) => a.id - b.id || a.ring[0] - b.ring[0])
    for (let i = 0; i < tiles.length; i++) {
      const was = tiles[i]
      const back = adaptTile(JSON.parse(JSON.stringify(v3[i])), idx3)
      // parts come back after their owner, not where the bake filed them: order within a tile is not meaningful
      const norm = (t: TileData): TileData => ({
        ...t, buildings: byId(t.buildings), boats: t.boats ?? [], bridges: t.bridges ?? [], courts: t.courts ?? [],
      })
      const d = near(norm(back), norm(was), TOL, was.key)
      expect(d).toBeNull()
    }
  })

  it('never puts a real height at or below zFloor (0 must mean "none")', () => {
    expect(stats.belowFloor).toBe(0)
    for (const m of v3) {
      for (let i = 2; i < m.nodes.length; i += 3) expect(m.nodes[i]).toBeGreaterThanOrEqual(0)
      for (const b of m.buildings) expect(b.z).toBeGreaterThan(0)
      for (let i = 0; i < (m.items?.data.length ?? 0); i += ITEM_STRIDE) expect(m.items!.data[i + 2]).toBeGreaterThan(0)
    }
  })

  it('holds only integers outside the documented float fields', () => {
    // MAP-FORMAT §2 rule 1 lists these: diagnostics and metadata carried verbatim, not coordinates
    const FLOATS = /\.(form|heading|levels|palette|resM)\b|\.(fired)$/
    const walk = (v: unknown, p: string): void => {
      if (typeof v === 'number') { if (!FLOATS.test(p)) expect(Number.isInteger(v), p).toBe(true); return }
      if (Array.isArray(v)) { v.forEach((x, i) => walk(x, `${p}[${i}]`)); return }
      if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, `${p}.${k}`)
    }
    for (const m of v3) walk(m, m.key)
  })

  it('shares a junction between the streets that meet there', () => {
    // at least one node in the city is referenced by three or more streets: a crossroads is one node, not four
    const most = Math.max(...v3.map((m) => {
      const uses = new Map<number, number>()
      for (const w of m.ways) if (w.role === 'street') for (const n of [w.nodes[0], w.nodes[w.nodes.length - 1]]) uses.set(n, (uses.get(n) ?? 0) + 1)
      return Math.max(0, ...uses.values())
    }))
    expect(most).toBeGreaterThanOrEqual(3)
    expect(stats.unsharedJunctions).toBe(0)
  })

  it('gives the same ref to an edge in every tile that holds it', () => {
    const seen = new Map<number, string>()
    for (const m of v3) for (const w of m.ways) if (w.role === 'street') {
      const had = seen.get(w.id!)
      if (had) expect(w.ref).toBe(had)
      else seen.set(w.id!, w.ref!)
    }
    expect(new Set(seen.values()).size).toBe(seen.size)
  })

  it('adapts the index back', () => {
    const back = adaptIndex(idx3)
    expect(back.start).toEqual(index.start)
    expect(back.landmarks).toEqual(index.landmarks)
    expect(back.terrain?.heights.length).toBe(index.terrain?.heights.length)
    expect(back.tiles).toEqual(index.tiles.map((t) => ({ ...t, bytes: 0 })))
  })

  describe('patches', () => {
    // the busiest tile: buildings, streets, and a named landmark
    const k = v3.reduce((best, m, i) => (m.buildings.length + m.ways.length > v3[best].buildings.length + v3[best].ways.length ? i : best), 0)
    const fresh = (): MapTile => JSON.parse(JSON.stringify(v3[k]))
    const T = 200 * 100
    const patch = (ops: PatchOp[]) => {
      const m = fresh()
      const dictCopy = JSON.parse(JSON.stringify(idx3.dict))
      const at = { ...idx3, dict: dictCopy }
      return adaptTile(applyPatches(m, indexPatches([{ v: 1, city, ops }], 200), at), at)
    }
    const b0 = () => fresh().buildings.find((b) => b.way !== undefined && !b.lod)!
    const s0 = () => fresh().ways.find((w) => w.role === 'street')!

    it('changes nothing with an empty set', () => {
      expect(near(patch([]), adaptTile(fresh(), idx3), TOL)).toBeNull()
    })

    it('suppresses a building, and a street — and the buildings after it still find their footprints', () => {
      const b = b0()
      const s = s0()
      const back = patch([{ op: 'suppress', ref: b.ref }, { op: 'suppress', ref: s.ref! }])
      const was = adaptTile(fresh(), idx3)
      expect(back.buildings.some((q) => q.id === b.seed)).toBe(false)
      expect(back.buildings.length).toBe(was.buildings.length - 1)
      expect(back.edges.some((e) => e.id === s.id)).toBe(false)
      const others = was.buildings.filter((q) => q.id !== b.seed)
      expect(near([...back.buildings].sort((a, c) => a.id - c.id || a.ring[0] - c.ring[0]), [...others].sort((a, c) => a.id - c.id || a.ring[0] - c.ring[0]), TOL)).toBeNull()
    })

    it('restyles a building by name, extending the dictionary for a style the bake never used', () => {
      const b = b0()
      const back = patch([{ op: 'override', ref: b.ref, set: { kind: 'restyled', style: 'victorian', colour: 0x3355aa } }])
      expect(back.buildings.find((q) => q.id === b.seed)!.style).toBe('victorian')
    })

    it('moves a street without a re-bake', () => {
      const s = s0()
      const ox = v3[k].tx * T
      const oy = v3[k].ty * T
      const pts = [ox + 1000, oy + 1000, 0, ox + 5000, oy + 1200, 0]
      const back = patch([{ op: 'override', ref: s.ref!, set: { pts } }])
      const e = back.edges.find((q) => q.id === s.id)!
      expect(e.points).toEqual([(ox + 1000) / 100, (oy + 1000) / 100, (ox + 5000) / 100, (oy + 1200) / 100])
    })

    it('adds a hydrant and a building where the patch says', () => {
      const ox = v3[k].tx * T
      const oy = v3[k].ty * T
      const back = patch([
        { op: 'add', type: 'item', record: { ref: 'x:test-hydrant', x: ox + 3000, y: oy + 4000, type: 'hydrant' } },
        { op: 'add', type: 'building', record: { ref: 'x:test-house', kind: 'generic', seed: 42, pts: [ox + 100, oy + 100, ox + 900, oy + 100, ox + 900, oy + 900, ox + 100, oy + 900], h: 900, style: 'brick', roof: { shape: 'flat', h: 0, colour: 0x777777 } } },
      ])
      expect(back.furniture.find((f) => f.kind === 'hydrant' && f.x === (ox + 3000) / 100 && f.z === (oy + 4000) / 100)).toBeTruthy()
      const house = back.buildings.find((b) => b.id === 42)!
      expect(house.style).toBe('brick')
      expect(house.height).toBe(9)
      expect(house.ring.length).toBe(8)
    })

    it('hands a building to the landmark path by turning it procedural', () => {
      const b = b0()
      const back = patch([{ op: 'override', ref: b.ref, set: { kind: 'procedural', proc: { name: 'test' } } }])
      expect(back.buildings.some((q) => q.id === b.seed)).toBe(false)
    })
  })
})
