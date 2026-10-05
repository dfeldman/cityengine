import { describe, expect, it } from 'vitest'
import { bridgeHeights, type BridgeEdge, type BridgeWorld } from '../tools/bridges.ts'

const flat: BridgeWorld['ground'] = () => 0
const river = (x0: number, x1: number): BridgeWorld['water'][number] =>
  ({ ring: [{ x: x0, z: -500 }, { x: x1, z: -500 }, { x: x1, z: 500 }, { x: x0, z: 500 }], level: 0 })

describe('bridge heights', () => {
  it('humps a long span over water, with its ends on the ground', () => {
    const e: BridgeEdge = { id: 1, a: 1, b: 2, points: [-200, 0, 0, 0, 200, 0], heights: [0, 0, 0], bridge: true, layer: 1 }
    bridgeHeights([e], { water: [river(-150, 150)], ground: flat })
    expect(e.heights![0]).toBeCloseTo(0)
    expect(e.heights![e.heights!.length - 1]).toBeCloseTo(0)
    expect(Math.max(...e.heights!)).toBeCloseTo(3.5)   // clearance over the water, at the middle
  })

  it('keeps a short steep span level and ramps the approaches instead', () => {
    // 60 m: a 3.5 m hump in so short a span would be steeper than the 6% allowed
    const e: BridgeEdge = { id: 1, a: 1, b: 2, points: [-30, 0, 0, 0, 30, 0], heights: [0, 0, 0], bridge: true, layer: 1 }
    const approach: BridgeEdge = { id: 2, a: 3, b: 1, points: [-130, 0, -30, 0], heights: [0, 0] }
    const r = bridgeHeights([e, approach], { water: [river(-25, 25)], ground: flat })
    expect(e.heights!.every((h) => Math.abs(h - 3.5) < 1e-6)).toBe(true)
    expect(r.ramps).toBe(1)
    // the approach climbs to the deck at the bridge end, and is on the ground 60 m out
    expect(approach.heights![1]).toBeCloseTo(3.5)
    expect(approach.heights![0]).toBeCloseTo(0)
  })

  it('lifts an overpass 5.5 m above the way it crosses', () => {
    const over: BridgeEdge = { id: 1, a: 1, b: 2, points: [-300, 0, 300, 0], heights: [0, 0], bridge: true, layer: 1 }
    const under: BridgeEdge = { id: 2, a: 3, b: 4, points: [0, -50, 0, 50], heights: [0, 0] }
    bridgeHeights([over, under], { water: [], ground: flat })
    // a 600 m span can hump: its middle is 5.5 m up (the bridge was densified to have a middle at all)
    expect(Math.max(...over.heights!)).toBeCloseTo(5.5)
    expect(over.heights![0]).toBeCloseTo(0)
    expect(under.heights).toEqual([0, 0])
  })

  it('touches nothing that is not a bridge or a ramp onto one', () => {
    const road: BridgeEdge = { id: 1, a: 1, b: 2, points: [0, 0, 100, 0], heights: [1, 2] }
    const r = bridgeHeights([road], { water: [river(-10, 200)], ground: flat })
    expect(road.heights).toEqual([1, 2])
    expect(r.raised.size).toBe(0)
  })
})

describe('ramps stop where they should (Stockton at Bush, 2026-09-29)', () => {
  // a short road bridge 3.5 m up, ending at node 1
  const deck = (): BridgeEdge => ({ id: 1, a: 1, b: 2, points: [-30, 0, 0, 0, 30, 0], heights: [0, 0, 0], bridge: true, layer: 1 })
  const world = { water: [river(-25, 25)], ground: flat }

  it('never ramps along a footway', () => {
    const path: BridgeEdge = { id: 2, a: 3, b: 1, points: [-60, 0, -30, 0], heights: [0, 0], foot: true }
    bridgeHeights([deck(), path], world)
    expect(path.heights).toEqual([0, 0])
  })

  it('never ramps through a footway onto a street beyond it', () => {
    const path: BridgeEdge = { id: 2, a: 3, b: 1, points: [-40, 0, -30, 0], heights: [0, 0], foot: true }
    const street: BridgeEdge = { id: 3, a: 4, b: 3, points: [-60, 0, -40, 0], heights: [0, 0] }
    bridgeHeights([deck(), path, street], world)
    expect(street.heights).toEqual([0, 0])
  })

  it('ramps a street up to the deck, but not on past a tunnel mouth', () => {
    const near: BridgeEdge = { id: 2, a: 3, b: 1, points: [-40, 0, -30, 0], heights: [0, 0] }
    const beyond: BridgeEdge = { id: 3, a: 4, b: 3, points: [-60, 0, -40, 0], heights: [0, 0] }
    const tunnel: BridgeEdge = { id: 4, a: 3, b: 5, points: [-40, 0, -40, 200], heights: [0, 0], tunnel: true, layer: -2 }
    bridgeHeights([deck(), near, beyond, tunnel], world)
    expect(near.heights![1]).toBeGreaterThan(3)     // the approach still climbs to the deck…
    expect(beyond.heights).toEqual([0, 0])          // …but the street past the tunnel mouth is left alone
    expect(tunnel.heights).toEqual([0, 0])
  })
})

describe('a bridge in several pieces', () => {
  it('is one hump, not one per piece', () => {
    const pieces: BridgeEdge[] = [
      { id: 1, a: 1, b: 2, points: [-300, 0, -100, 0], heights: [0, 0], bridge: true, layer: 1 },
      { id: 2, a: 3, b: 2, points: [100, 0, -100, 0], heights: [0, 0], bridge: true, layer: 1 },   // stored backwards
      { id: 3, a: 3, b: 4, points: [100, 0, 300, 0], heights: [0, 0], bridge: true, layer: 1 },
    ]
    bridgeHeights(pieces, { water: [{ ring: [{ x: -250, z: -50 }, { x: 250, z: -50 }, { x: 250, z: 50 }, { x: -250, z: 50 }], level: 0 }], ground: () => 0 })
    expect(pieces[0].heights![0]).toBeCloseTo(0)
    expect(pieces[2].heights![pieces[2].heights!.length - 1]).toBeCloseTo(0)
    // the middle piece carries the crown, and the joins agree
    expect(Math.max(...pieces[1].heights!)).toBeCloseTo(3.5, 1)
    expect(pieces[0].heights![pieces[0].heights!.length - 1]).toBeCloseTo(pieces[1].heights![pieces[1].heights!.length - 1])
  })
})

describe('a foot bridge over a footpath (the Market Street helix, 2026-10-04)', () => {
  it('clears the path by one storey however high its layer, and a road by its layers', () => {
    const turn: BridgeEdge = { id: 1, a: 1, b: 2, points: [-20, 0, 20, 0], heights: [0, 0], bridge: true, foot: true, layer: 4 }
    const path: BridgeEdge = { id: 2, a: 3, b: 4, points: [0, -20, 0, 20], heights: [0, 0], foot: true }
    bridgeHeights([turn, path], { water: [], ground: flat })
    expect(Math.max(...turn.heights!)).toBeCloseTo(5.5)
    const park: BridgeEdge = { id: 1, a: 1, b: 2, points: [-20, 0, 20, 0], heights: [0, 0], bridge: true, foot: true, layer: 3 }
    const street: BridgeEdge = { id: 2, a: 3, b: 4, points: [0, -20, 0, 20], heights: [0, 0] }
    bridgeHeights([park, street], { water: [], ground: flat })
    expect(Math.max(...park.heights!)).toBeCloseTo(16.5)
  })
})

describe('a region\'s foot-bridge layer caps', () => {
  it('lifts a foot bridge near a capped point one storey over the road, whatever its OSM layer', () => {
    const span = (): BridgeEdge => ({ id: 1, a: 1, b: 2, points: [-20, 0, 20, 0], heights: [0, 0], bridge: true, foot: true, layer: 5 })
    const road = (): BridgeEdge => ({ id: 2, a: 3, b: 4, points: [0, -20, 0, 20], heights: [0, 0] })
    const capped = span()
    bridgeHeights([capped, road()], { water: [], ground: flat, layerCaps: [{ x: 0, z: 0, radius: 45, layer: 1 }] })
    expect(Math.max(...capped.heights!)).toBeCloseTo(5.5)
    const far = span()
    bridgeHeights([far, road()], { water: [], ground: flat, layerCaps: [{ x: 500, z: 0, radius: 45, layer: 1 }] })
    expect(Math.max(...far.heights!)).toBeCloseTo(27.5)
  })
})

describe('freeway junctions in the air (Central Freeway at Bryant and Division, 2026-10-05)', () => {
  it('keeps the node where three freeway decks meet up at deck height, not on the ground', () => {
    // three 400 m freeway viaducts meeting at node 9 (x 0); their outer ends on the ground
    const mk = (id: number, x: number, z: number): BridgeEdge =>
      ({ id, a: id, b: 9, points: [x, z, 0, 0], heights: [0, 0], bridge: true, layer: 1, kind: 'motorway' })
    const es = [mk(1, -400, 0), mk(2, 400, 0), mk(3, 0, 400)]
    bridgeHeights(es, { water: [], ground: flat })
    for (const e of es) {
      // the outer end on the ground, the junction end up with the deck
      expect(e.heights![0]).toBeCloseTo(0)
      expect(e.heights![e.heights!.length - 1]).toBeGreaterThan(5)
    }
  })
})
