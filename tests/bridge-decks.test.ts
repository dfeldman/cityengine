/**
 * Ways over a modelled bridge take its deck's heights (src/city/bridge-decks.ts): on the deck, exactly; the chain
 * of structures off its end, straight grades between the deck and where they touch down; a way on the ground that
 * leaves the deck, brought to it within a cone; plan untouched; a street under the bridge left alone; layers kept.
 */
import { describe, expect, it } from 'vitest'
import { BridgeDecks, placement, toModel, toWorld, type GraphEdge } from '../src/city/bridge-decks.ts'
import { Projection } from '../src/city/geo.ts'

const proj = new Projection({ lat: 37.8, lon: -122.4 })
// a bridge 400 m long along world +z at x = 0, its deck at 30 m (flat), 10 m either side of its axis
const P = { ...placement({ lat: 37.8, lon: -122.4, baseY: 0 }, proj) }
const decks = (): BridgeDecks => {
  const b = new BridgeDecks()
  b.add(P, [{ from: -200, to: 200, half: 10, y: () => 30 }])
  return b
}
const flat = (): number => 0
let ids = 0
/** a way from (x0, z0) to (x1, z1) with a point every 10 m, at height `h` */
const way = (a: number, b: number, x0: number, z0: number, x1: number, z1: number, h: number, more: Partial<GraphEdge> = {}): GraphEdge => {
  const n = Math.max(1, Math.round(Math.hypot(x1 - x0, z1 - z0) / 10))
  const points = Array.from({ length: n + 1 }, (_, i) => ({ x: x0 + ((x1 - x0) * i) / n, z: z0 + ((z1 - z0) * i) / n }))
  return { id: ++ids, a, b, points, heights: points.map(() => h), kind: 'primary', ...more }
}
const hAt = (e: GraphEdge, z: number): number => e.heights![e.points.findIndex((q) => Math.abs(q.z - z) < 0.01)]

describe('bridge decks', () => {
  it('places and unplaces a point the same way round', () => {
    const p = placement({ lat: 37.81, lon: -122.41, rotateDeg: -5.26, baseY: -84.5, scale: 1.2 }, proj)
    const q = toWorld(p, { x: 7, z: -400 })
    const m = toModel(p, q)
    expect(m.x).toBeCloseTo(7, 6)
    expect(m.z).toBeCloseTo(-400, 6)
  })

  it('puts a bridge way on the deck, and grades the structure off its end straight to the touchdown', () => {
    // the bridge way runs the deck and 100 m on past its south end (the bake had all of it at 15 m); there it
    // meets an ordinary street, on the ground
    const bridge = way(1, 2, 2, 200, 2, -300, 15, { bridge: true })
    const street = way(2, 3, 2, -300, 80, -300, 0)
    const r = decks().conformGraph([bridge, street], flat)
    expect(r.pinned).toBe(1)
    for (let i = 0; i < bridge.points.length; i++) if (bridge.points[i].z >= -200) expect(bridge.heights![i]).toBe(30)
    // the plan is not touched
    expect(bridge.points[5]).toEqual({ x: 2, z: 150 })
    // off the end: straight from the deck (30 m at z −200) to the street (0 at z −300)
    expect(hAt(bridge, -250)).toBeCloseTo(15)
    expect(hAt(bridge, -300)).toBe(0)
    expect(street.heights!.every((h) => h === 0)).toBe(true)
  })

  it('sets a junction where ramps part at the height every ramp agrees on', () => {
    // off the deck's end a viaduct runs 100 m to a junction, where two ramps part: 100 m and 300 m to the ground
    const bridge = way(1, 2, 0, 200, 0, -200, 12, { bridge: true })
    const viaduct = way(2, 3, 0, -200, 0, -300, 12, { bridge: true })
    const short = way(3, 4, 0, -300, -100, -300, 12, { bridge: true })
    const long = way(3, 5, 0, -300, 300, -300, 12, { bridge: true })
    const streets = [way(4, 6, -100, -300, -100, -400, 0), way(5, 7, 300, -300, 300, -400, 0)]
    decks().conformGraph([bridge, viaduct, short, long, ...streets], flat)
    // harmonic: (30/100 + 0/100 + 0/300) / (1/100 + 1/100 + 1/300)
    const j = (30 / 100) / (1 / 100 + 1 / 100 + 1 / 300)
    expect(hAt(viaduct, -300)).toBeCloseTo(j, 1)
    expect(short.heights![0]).toBeCloseTo(j, 1)
    expect(short.heights![short.heights!.length - 1]).toBe(0)
    // each a straight grade
    expect(long.heights![15]).toBeCloseTo(j / 2, 1)
  })

  it('leaves a street under the bridge alone, and a way off the deck to one side', () => {
    const under = way(1, 2, -50, 0, 50, 0, 0)
    const beside = way(3, 4, 40, -100, 40, 100, 5, { bridge: true })
    const r = decks().conformGraph([under, beside], flat)
    expect(r.changed.size).toBe(0)
    expect(under.heights!.every((h) => h === 0)).toBe(true)
    expect(beside.heights!.every((h) => h === 5)).toBe(true)
  })

  it('keeps a double-deck bridge\'s layers apart', () => {
    const b = new BridgeDecks()
    b.add(P, [{ from: -200, to: 200, half: 10, y: () => 30, layer: 2 }, { from: -200, to: 200, half: 10, y: () => 20, layer: 1 }])
    const upper = way(1, 2, 0, -50, 0, 50, 0, { bridge: true, layer: 2 })
    const lower = way(3, 4, 0, -50, 0, 50, 0, { bridge: true, layer: 1 })
    b.conformGraph([upper, lower], flat)
    expect(upper.heights!.every((h) => h === 30)).toBe(true)
    expect(lower.heights!.every((h) => h === 20)).toBe(true)
    // and the deck over a rider on the lower one is the upper
    expect(b.above(0, 0, 20)).toBe(30)
    expect(b.above(0, 0, 30)).toBeNull()
  })

  it('takes a plain way of a kind the deck names, and no other', () => {
    const b = new BridgeDecks()
    b.add(P, [{ from: -200, to: 200, half: 10, y: () => 30, kinds: ['motorway'] }])
    const freeway = way(1, 2, 0, -50, 0, 50, 3, { kind: 'motorway' })
    const street = way(3, 4, 5, -50, 5, 50, 3)
    b.conformGraph([freeway, street], flat)
    expect(freeway.heights!.every((h) => h === 30)).toBe(true)
    expect(street.heights!.every((h) => h === 3)).toBe(true)
  })

  it('brings a way on the ground that leaves the deck up to it within a cone, and calls it a bridge', () => {
    // a path leaves the sidewalk's junction at the deck's end and runs 1 km on, on the ground
    const bridge = way(1, 2, 0, 200, 0, -200, 10, { bridge: true })
    const path = way(2, 3, 0, -200, 0, -1200, 0, { kind: 'footway' })
    const r = decks().conformGraph([bridge, path], flat)
    expect(path.heights![0]).toBe(30)
    // 5% down from 30 m: 100 m on, 25 m; on the ground from 600 m
    expect(hAt(path, -300)).toBeCloseTo(25)
    expect(hAt(path, -800)).toBeCloseTo(0)
    expect(hAt(path, -1200)).toBe(0)
    expect(path.bridge).toBe(true)
    expect(r.flagged).toBe(1)
  })

  it('does not bury a structure under a hill between its ends', () => {
    const hill = (_x: number, z: number): number => (z < -240 && z > -260 ? 40 : 0)
    const bridge = way(1, 2, 0, 200, 0, -300, 15, { bridge: true })
    const street = way(2, 3, 0, -300, 80, -300, 0)
    decks().conformGraph([bridge, street], hill)
    expect(hAt(bridge, -250)).toBe(40)
  })

  it('lands a ramp on the ground, and takes the bake\'s own ramp back out of the street it lands on', () => {
    // off the deck's end a ramp bridge runs 300 m to a street — which the bake had lifted 9 m there, to a bridge it
    // guessed, and ramped back to the ground over 60 m (tools/bridges.ts)
    const bridge = way(1, 2, 0, 200, 0, -200, 9, { bridge: true })
    const ramp = way(2, 3, 0, -200, 0, -500, 9, { bridge: true })
    const street = way(3, 4, 0, -500, 200, -500, 0, { ramp: true })
    street.heights = street.points.map((q) => Math.max(0, 9 * (1 - q.x / 60)))
    decks().conformGraph([bridge, ramp, street], flat)
    expect(ramp.heights![0]).toBe(30)
    expect(ramp.heights![ramp.heights!.length - 1]).toBe(0)
    expect(ramp.heights![15]).toBeCloseTo(15)
    // the street: on the ground at the landing, and within 60 m barely off it
    expect(street.heights![0]).toBe(0)
    for (let i = 0; i < street.points.length; i++) expect(street.heights![i]).toBeLessThanOrEqual(0.015 * street.points[i].x + 0.02)
  })

  it('brings a way that bulges past the edge of the roadway the model draws back onto it, and leaves one that departs', () => {
    const b = new BridgeDecks()
    // the deck is declared 10 m either side; the model draws 8
    b.add(P, [{ from: -200, to: 200, half: 10, y: () => 30, model: { from: -200, to: 200, half: 8 } }])
    // a sidewalk at x = 6 that swings out to 11 round a tower at z = 0, and back
    const walk = way(1, 2, 6, -100, 6, 100, 30, { bridge: true })
    for (const q of walk.points) if (Math.abs(q.z) <= 10) q.x = 11
    // and a road that leaves the deck for good, curving off to the side
    const road = way(3, 4, 0, -100, 0, 100, 30, { bridge: true })
    for (const q of road.points) if (q.z > 50) q.x = (q.z - 50) * 0.4
    const r = b.conformGraph([walk, road], flat)
    expect(r.snapped).toBe(3)
    expect(walk.points.every((q) => Math.abs(q.x) <= 7.11)).toBe(true)
    expect(walk.points[5]).toEqual({ x: 6, z: -50 })
    // (and the detector's question, answered by the same declaration)
    expect(b.drawn(7, 0)).toBe(true)
    expect(b.drawn(9, 0)).toBe(false)
    expect(road.points[road.points.length - 1].x).toBeCloseTo(20)
  })
})
