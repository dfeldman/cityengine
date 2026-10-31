import { describe, expect, it } from 'vitest'
import { bridgeHeights, footBridgeLinks, meetDecks, mergeBridgeLanes, oneDeck, rampFootBridgeEnds, type BridgeEdge, type BridgeWorld } from '../tools/bridges.ts'

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

  it('never ramps along a footway — its end meets the deck, and that is all', () => {
    const path: BridgeEdge = { id: 2, a: 3, b: 1, points: [-60, 0, -30, 0], heights: [0, 0], foot: true }
    const d = deck()
    bridgeHeights([d, path], world)
    // (the stairs or pavement stub at a bridge's end reach the deck at their shared node, eased over 15 m: the Seine bridges'
    //  foot ways stood 2–6 m under their decks, 2026-10-30) — and the far end, 30 m off, is where it was
    expect(path.heights![path.heights!.length - 1]).toBeCloseTo(d.heights![0], 1)
    expect(path.heights![0]).toBe(0)
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

describe('a deck a model draws (Region.straightDecks)', () => {
  it('runs straight from bank to bank, over what the rule would have cleared', () => {
    const deck = (): BridgeEdge => ({ id: 1, a: 1, b: 2, points: [-20, 0, 20, 0], heights: [6, 3], bridge: true, foot: true, layer: 1 })
    const path = (): BridgeEdge => ({ id: 2, a: 3, b: 4, points: [0, -20, 0, 20], heights: [3, 3], foot: true })
    const humped = deck()
    bridgeHeights([humped, path()], { water: [], ground: flat })
    expect(Math.max(...humped.heights!)).toBeGreaterThan(6)
    const line = deck()
    const r = bridgeHeights([line, path()], { water: [], ground: flat, straight: new Set([1]) })
    expect(line.heights![0]).toBeCloseTo(6)
    expect(line.heights![line.heights!.length - 1]).toBeCloseTo(3)
    expect(Math.max(...line.heights!)).toBeCloseTo(6)
    expect(r.raised.has(1)).toBe(true)
  })
})

describe('the hole under an abutment (the Pont de Puteaux, 2026-10-30)', () => {
  const mk = (): BridgeEdge[] => [
    { id: 1, a: 1, b: 2, points: [0, 0, 200, 0], heights: [-7, 0], bridge: true, layer: 1, name: 'Pont de Puteaux' },
    { id: 2, a: 3, b: 1, points: [-16, 0, 0, 0], heights: [-1.6, -7], name: 'Pont de Puteaux' },
    { id: 3, a: 4, b: 3, points: [-100, 0, -16, 0], heights: [-1.6, -1.6], name: 'Pont de Puteaux' },
    { id: 4, a: 5, b: 6, points: [-30, 30, 30, 30], heights: [-3, 8], name: 'Rue Haute' },
  ]
  it('runs the deck through to the street it meets', () => {
    const es = mk()
    bridgeHeights(es, { water: [], ground: flat, liftAbutments: true })
    expect(es[1].bridge).toBe(true)
    expect(Math.min(...es[0].heights!, ...es[1].heights!)).toBeGreaterThan(-1.7)
    expect(es[1].heights!.find((_, i) => i === 0)).toBeCloseTo(-1.6, 0)
    expect(es[3].bridge).toBeUndefined()
  })
  it('leaves it to a city whose ground has its bridges in it', () => {
    const es = mk()
    bridgeHeights(es, { water: [], ground: flat })
    expect(es[1].bridge).toBeUndefined()
  })
})

describe('named foot bridges open to bikes', () => {
  const way = (id: number, a: number, b: number, kind: string, x0: number, x1: number, more = {}) =>
    ({ id, a, b, kind, points: [x0, 0, x1, 0], ...more })
  it('takes the stubs to the bike network at both ends', () => {
    const open = footBridgeLinks([
      way(1, 1, 2, 'footway', 0, 100, { bridge: true, name: 'Pont des Arts' }),
      way(2, 2, 3, 'footway', 100, 120), way(3, 3, 4, 'residential', 120, 200),
      way(4, 1, 5, 'footway', -30, 0), way(5, 5, 6, 'pedestrian', -90, -30),
    ])
    expect([...open].sort()).toEqual([1, 2, 4])
  })
  it('leaves a bridge alone when an end reaches the network only by stairs, or too far off', () => {
    const stairs = footBridgeLinks([
      way(1, 1, 2, 'footway', 0, 100, { bridge: true, name: 'Passerelle' }),
      way(2, 2, 3, 'steps', 100, 130), way(3, 3, 4, 'residential', 130, 200),
      way(4, 1, 5, 'residential', -30, 0),
    ])
    expect(stairs.size).toBe(0)
    const far = footBridgeLinks([
      way(1, 1, 2, 'footway', 0, 100, { bridge: true, name: 'Passerelle' }),
      way(2, 2, 3, 'footway', 100, 500), way(3, 3, 4, 'residential', 500, 600),
      way(4, 1, 5, 'residential', -30, 0),
    ])
    expect(far.size).toBe(0)
  })
})

describe('named foot bridges open to bikes: the Seine audit', () => {
  const way = (id: number, a: number, b: number, kind: string, x0: number, x1: number, more = {}) =>
    ({ id, a, b, kind, points: [x0, 0, x1, 0], ...more })
  it('joins a short flight on the way off (the Passerelle Debilly)', () => {
    const open = footBridgeLinks([
      way(1, 1, 2, 'footway', 0, 100, { bridge: true, name: 'Passerelle Debilly' }),
      way(2, 2, 3, 'steps', 100, 105), way(3, 3, 4, 'residential', 105, 200),
      way(4, 1, 5, 'residential', -30, 0),
    ])
    expect([...open].sort()).toEqual([1, 2])
  })
  it('leaves the pavements of a road bridge of the same name as footways (the Pont National)', () => {
    const open = footBridgeLinks([
      way(1, 1, 2, 'footway', 0, 100, { bridge: true, name: 'Pont National' }),
      way(2, 3, 4, 'primary', 0, 100, { bridge: true, name: 'Pont National' }),
      way(3, 1, 3, 'residential', -30, 0), way(4, 2, 4, 'residential', 100, 130),
    ])
    expect(open.size).toBe(0)
  })
  it('crosses a closed lens of two walks (the Passerelle Senghor)', () => {
    const open = footBridgeLinks([
      way(1, 1, 2, 'footway', 0, 100, { bridge: true, name: 'Passerelle Senghor' }),
      way(2, 2, 1, 'footway', 100, 0, { bridge: true, name: 'Passerelle Senghor' }),
      way(3, 1, 3, 'residential', -30, 0), way(4, 2, 4, 'residential', 100, 130),
    ])
    expect([...open].sort()).toEqual([1, 2])
  })
  it('goes on from its own far end when the bridge is a pedestrian way (the Passerelle Nord)', () => {
    const open = footBridgeLinks([
      way(1, 1, 2, 'pedestrian', 0, 100, { bridge: true, name: 'Passerelle Nord' }),
      way(2, 2, 3, 'footway', 100, 120), way(3, 3, 4, 'residential', 120, 200),
      way(4, 1, 5, 'residential', -30, 0),
    ])
    expect([...open].sort()).toEqual([1, 2])
  })
})

describe('a freeway through a city of lidar (the Seine audit)', () => {
  it('comes off a viaduct at a grade a road has, and is one storey over a street whatever its layer', () => {
    const fw: BridgeEdge = { id: 1, a: 1, b: 2, points: [0, 0, 600, 0], heights: [0, 0], bridge: true, layer: 3, kind: 'trunk' }
    const under: BridgeEdge = { id: 2, a: 3, b: 4, points: [300, -30, 300, 30], heights: [2, 2], kind: 'residential' }
    bridgeHeights([fw, under], { water: [], ground: flat, liftAbutments: true })
    expect(Math.max(...fw.heights!)).toBeCloseTo(7.5, 0)
    for (let i = 1; i < fw.heights!.length; i++) expect(Math.abs(fw.heights![i] - fw.heights![i - 1]) / Math.hypot(fw.points[2 * i] - fw.points[2 * i - 2], 0)).toBeLessThan(0.09)
  })
})

describe('a path too short for its step off a deck (the Allée des Cygnes)', () => {
  it('ramps on past the next node at a grade, so the ride graph does not drop it as a wall', () => {
    const deck: BridgeEdge = { id: 1, a: 1, b: 2, bridge: true, points: [0, 0, 100, 0], heights: [1.4, 1.4] }
    const scrap: BridgeEdge = { id: 2, a: 2, b: 3, foot: true, kind: 'pedestrian', points: [100, 0, 102, 0], heights: [-1.5, -1.5] }
    const path: BridgeEdge = { id: 3, a: 3, b: 4, foot: true, kind: 'pedestrian', points: [102, 0, 130, 0, 160, 0], heights: [-1.5, -1.5, -1.5] }
    meetDecks([deck, scrap, path], false, true)
    expect(scrap.heights![0]).toBeCloseTo(1.4, 1)
    expect(Math.abs(scrap.heights![1] - scrap.heights![0])).toBeLessThan(1)
    expect(path.heights![path.heights!.length - 1]).toBeCloseTo(-1.5, 1)
  })
})

describe('one bridge, one deck (the Seine audit)', () => {
  const world: BridgeWorld = { water: [{ ...river(-150, 150), level: -6 }], ground: flat, liftAbutments: true }
  const line = (from: number, to: number, y: (x: number) => number): { points: number[]; heights: number[] } => {
    const points: number[] = [], heights: number[] = []
    for (let x = from; x <= to + 1e-6; x += 10) { points.push(x, 0); heights.push(y(x)) }
    return { points, heights }
  }
  const street = (id: number, a: number, b: number, from: number, to: number, y: number, name?: string): BridgeEdge => ({ id, a, b, name, kind: 'residential', ...line(from, to, () => y) })
  it('puts every way of a bridge on one profile, the street at each end and a crown, whatever each stood on', () => {
    const road1: BridgeEdge = { id: 1, a: 1, b: 2, bridge: true, kind: 'primary', name: 'Pont au Change', layer: 1, ...line(-160, 0, (x) => x > -10 ? -5.6 : 2) }
    const road2: BridgeEdge = { id: 2, a: 2, b: 3, bridge: true, kind: 'primary', name: 'Pont au Change', layer: 1, ...line(0, 160, (x) => x < 10 ? -5.6 : 2.3) }
    const foot: BridgeEdge = { id: 3, a: 4, b: 5, bridge: true, foot: true, kind: 'footway', layer: 1, ...line(-160, 160, () => 4) }
    foot.points = foot.points.map((v, i) => (i % 2 ? 8 : v))
    const n = street(4, 1, 6, -220, -160, 1), s_ = street(5, 3, 7, 160, 220, 1)
    n.points = [...n.points]
    const es = [road1, road2, foot, n, s_]
    const r = oneDeck(es, world)
    expect(r.decks).toBe(1)
    expect(r.ids.size).toBe(3)
    // no dip at the stair's node, and the ends are the street's
    const y = (e: BridgeEdge): number[] => e.heights!
    expect(Math.min(...y(road1), ...y(road2))).toBeGreaterThan(0.9)
    expect(y(road1)[0]).toBeCloseTo(1, 1)
    expect(y(road2)[y(road2).length - 1]).toBeCloseTo(1, 1)
    // the pavement is the roadway's height at the same station
    expect(y(foot)[16]).toBeCloseTo(y(road2)[0], 1)
    // a crown, at the clearance's level or the default, and gentle
    expect(y(road2)[0]).toBeGreaterThan(2)
    for (const e of [road1, road2]) for (let i = 1; i < y(e).length; i++) expect(Math.abs(y(e)[i] - y(e)[i - 1]) / 10).toBeLessThan(0.05)
  })
  it('leaves a way along the lower quay at the water, and stands a deck clear of a stair at its end', () => {
    const berge: BridgeEdge = { id: 1, a: 1, b: 2, bridge: true, kind: 'path', ...line(-160, 160, () => -4.5) }
    const n = street(2, 1, 6, -220, -160, -4.5), s_ = street(3, 2, 7, 160, 220, -4.5)
    n.kind = 'path'; s_.kind = 'path'
    expect(oneDeck([berge, n, s_], world).decks).toBe(0)
    const debilly: BridgeEdge = { id: 1, a: 1, b: 2, bridge: true, foot: true, kind: 'footway', name: 'Passerelle', ...line(-160, 160, () => -3) }
    const down: BridgeEdge = { id: 2, a: 1, b: 6, foot: true, kind: 'footway', ...line(-220, -160, () => -4) }
    const up: BridgeEdge = { id: 3, a: 2, b: 7, foot: true, kind: 'footway', ...line(160, 220, () => 0.4) }
    oneDeck([debilly, down, up], world)
    expect(debilly.heights![0]).toBeCloseTo(-1.5, 1)
    expect(debilly.heights![debilly.heights!.length - 1]).toBeCloseTo(0.4, 1)
  })
  it('leaves a bridge that is not over the river, and a freeway over it', () => {
    const over: BridgeEdge = { id: 1, a: 1, b: 2, bridge: true, kind: 'primary', name: 'Pont', ...line(200, 400, () => 5) }
    const free: BridgeEdge = { id: 2, a: 3, b: 4, bridge: true, kind: 'motorway', name: 'Autoroute', ...line(-160, 160, () => 15) }
    const before = [[...over.heights!], [...free.heights!]]
    expect(oneDeck([over, free], world).decks).toBe(0)
    expect(over.heights).toEqual(before[0])
    expect(free.heights).toEqual(before[1])
  })
  it('brings a slip road on a deck of its own to the node it shares', () => {
    const road: BridgeEdge = { id: 1, a: 1, b: 2, bridge: true, kind: 'primary', name: 'Pont', ...line(-160, 160, () => 1) }
    const slip: BridgeEdge = { id: 2, a: 2, b: 9, bridge: true, kind: 'trunk_link', points: [160, 0, 170, 100, 180, 200], heights: [12, 12, 12] }
    const end: BridgeEdge = street(3, 1, 8, -220, -160, 1)
    oneDeck([road, slip, end], world)
    expect(slip.heights![0]).toBeCloseTo(road.heights![road.heights!.length - 1], 1)
    expect(slip.heights![2]).toBeCloseTo(12, 1)
  })
  it('stands the Passerelle Simone-de-Beauvoir between its high banks, each arm running to what meets it', () => {
    const name = 'Passerelle Simone de Beauvoir'
    const f = (id: number, a: number, b: number, from: number, to: number, y: number): BridgeEdge => ({ id, a, b, name, kind: 'footway', foot: true, bridge: true, layer: 1, ...line(from, to, () => y) })
    const span = f(1, 1, 2, -50, 50, -2.5)
    const hiW = f(2, 3, 1, -150, -50, 7.8), loW = f(3, 4, 1, -100, -50, 0), hiE = f(4, 2, 5, 50, 150, 8.3), loE = f(5, 2, 6, 50, 100, 4.5)
    const ground = (id: number, a: number, from: number, to: number, y: number): BridgeEdge => ({ id, a, b: 100 + id, kind: 'footway', foot: true, ...line(from, to, () => y) })
    const es = [span, hiW, loW, hiE, loE, ground(6, 3, -160, -150, 2), ground(7, 4, -110, -100, -0.5), ground(8, 5, 150, 160, 8), ground(9, 6, 100, 110, 1)]
    oneDeck(es, world)
    expect(new Set(span.heights).size).toBe(1)
    expect(span.heights![0]).toBeCloseTo((2 + 8) / 2, 1)
    expect(hiW.heights![0]).toBeCloseTo(2, 1)
    expect(hiW.heights![hiW.heights!.length - 1]).toBeCloseTo(5, 1)
    expect(loE.heights![loE.heights!.length - 1]).toBeCloseTo(1, 1)
  })
  it('a sidewalk of a humped deck keeps the hump (`rampFootBridgeEnds` humped)', () => {
    const road = { id: 1, a: 1, b: 2, kind: 'primary', bridge: true, points: [0, 0, 50, 0, 100, 0], heights: [0, 2, 0] }
    const walk = (): { id: number; a: number; b: number; kind: string; foot: boolean; bridge: boolean; points: number[]; heights: number[] } =>
      ({ id: 2, a: 3, b: 4, kind: 'footway', foot: true, bridge: true, points: [0, 5, 50, 5, 100, 5], heights: [0, 2, 0] })
    const flat_ = walk()
    rampFootBridgeEnds([road, flat_])
    expect(flat_.heights).toEqual([2, 2, 2])
    const humped = walk()
    rampFootBridgeEnds([road, humped], true)
    expect(humped.heights).toEqual([0, 2, 0])
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

describe('a footway joins only the roadway it runs along (Mariposa Street under I-280, 2026-10-05)', () => {
  it('does not lift a raised footway crossing UNDER a freeway onto the freeway deck', () => {
    const freeway: BridgeEdge = { id: 1, a: 1, b: 2, points: [0, -400, 0, 400], heights: [0, 0], bridge: true, layer: 2, kind: 'motorway' }
    // a 40 m sidewalk on a short bridge, crossing under it at right angles
    const walk: BridgeEdge = { id: 2, a: 3, b: 4, points: [-20, 0, 20, 0], heights: [0, 0], bridge: true, layer: 1, foot: true, kind: 'footway' }
    bridgeHeights([freeway, walk], { water: [], ground: flat })
    expect(Math.max(...freeway.heights!)).toBeGreaterThan(5)
    expect(Math.max(...walk.heights!)).toBeLessThan(5)
  })
})

describe('a road too short for the step off a deck (the Rue du Département, 2026-10-30)', () => {
  const deck = (): BridgeEdge => ({ id: 1, a: 1, b: 2, points: [0, 0, 50, 0], heights: [3.5, 3.5], bridge: true, layer: 1 })
  const stub = (): BridgeEdge => ({ id: 2, a: 3, b: 1, points: [-3, 0, 0, 0], heights: [0, 0] })
  const street = (): BridgeEdge => ({ id: 3, a: 4, b: 3, points: [-100, 0, -50, 0, -3, 0], heights: [0, 0, 0] })

  it('leaves the old 100% step where the region has not asked (San Francisco)', () => {
    const s = stub(), r = street()
    meetDecks([deck(), s, r])
    expect(s.heights![1]).toBe(3.5)
    expect(r.heights).toEqual([0, 0, 0])
  })
  it('carries the ramp on past the node at a grade you could ride', () => {
    const s = stub(), r = street()
    const ids = meetDecks([deck(), s, r], false, true)
    expect(ids).toEqual(expect.arrayContaining([2, 3]))
    expect(s.heights![1]).toBe(3.5)
    const off = r.heights![2]
    expect(off).toBeGreaterThan(3)                                // no step at the node…
    expect(off).toBeCloseTo(s.heights![0], 1)                     // …the two ways meet there…
    expect((3.5 - off) / 3).toBeLessThan(0.12)                    // …it is a slope…
    expect(r.heights![0]).toBe(0)                                 // …and the street further off is where it was
    expect(r.ramp).toBe(true)
  })
  it('stops at a tunnel mouth', () => {
    const s = stub(), r = street()
    const tunnel: BridgeEdge = { id: 4, a: 3, b: 5, points: [-3, 0, -3, 200], heights: [0, 0], tunnel: true, layer: -1 }
    meetDecks([deck(), s, r, tunnel], false, true)
    expect(r.heights).toEqual([0, 0, 0])
  })
  it('does not touch a footway', () => {
    const path: BridgeEdge = { id: 2, a: 3, b: 1, points: [-3, 0, 0, 0], heights: [0, 0], foot: true }
    const r = street()
    meetDecks([deck(), path, r], false, true)
    expect(r.heights).toEqual([0, 0, 0])
  })
})

describe('one bridge, one deck (the Pont du Carrousel, 2026-10-30)', () => {
  // two roadway pieces meeting a third at node 2: the long one's end is down on the lower quay in the lidar
  const world = (over: Partial<BridgeWorld> = {}): BridgeWorld => ({ water: [river(-200, 200)], ground: flat, liftAbutments: true, ...over })
  const road = (): BridgeEdge => ({ id: 1, a: 1, b: 2, kind: 'service', points: [-100, 0, -50, 0, 0, 0, 50, 0, 100, 0], heights: [-3, -3, -3, -3, 0], bridge: true, layer: 1 })
  const stub = (id: number, n: number, x: number): BridgeEdge => ({ id, a: n, b: 1, kind: 'service', points: [x, 30, -100, 0], heights: [3, 3], bridge: true, layer: 1 })
  const cycle = (): BridgeEdge => ({ id: 5, a: 7, b: 8, kind: 'cycleway', points: [-100, 8, -50, 8, 0, 8, 50, 8, 100, 8], heights: [3, 3, 3, 3, 3], bridge: true, layer: 1 })

  it('a cycle track along a roadway rides its deck where the ground is lidar', () => {
    const r = road(), c = cycle()
    bridgeHeights([r, c], world())
    expect(c.heights![2]).toBeCloseTo(r.heights![2], 1)
  })
  it('…and only there (San Francisco keeps its own)', () => {
    const r = road(), c = cycle()
    bridgeHeights([r, c], world({ liftAbutments: false }))
    expect(Math.abs(c.heights![2] - r.heights![2])).toBeGreaterThan(0.5)
  })
  it("brings a roadway's sunk end up to the decks at its node", () => {
    const r = road(), s1 = stub(2, 3, -130), s2 = stub(3, 4, -70)
    bridgeHeights([r, s1, s2], world())
    expect(r.heights![0]).toBeGreaterThan(-1)
  })
})

describe('a bridge\'s cycle lanes (the Pont du Carrousel, 2026-10-30)', () => {
  type E = { id: number; a: number; b: number; points: number[]; bridge?: boolean; foot?: boolean; kind?: string; name?: string; width: number }
  const road: E = { id: 1, a: 1, b: 2, points: [0, 0, 0, 100], bridge: true, kind: 'service', name: 'Pont', width: 3 }
  const lane = (id: number, x: number, a: number, b: number): E => ({ id, a, b, points: [x, 0, x, 100], bridge: true, kind: 'cycleway', name: 'Pont', width: 2.8 })

  it('takes the lanes off the graph and widens the road over them', () => {
    const r = { ...road }
    const out = mergeBridgeLanes([r, lane(2, 6, 1, 2), lane(3, -6, 2, 1)])
    expect(out.edges.map((e) => e.id)).toEqual([1])
    expect(r.width).toBeCloseTo(14.8)
  })
  it('widens the nearer of two carriageways, and only into the room there is', () => {
    const w: E = { id: 1, a: 1, b: 2, points: [0, 0, 0, 100], bridge: true, kind: 'primary', name: 'Pont', width: 5 }
    const e: E = { id: 2, a: 3, b: 4, points: [12, 0, 12, 100], bridge: true, kind: 'primary', name: 'Pont', width: 5 }
    // (on the far side of the east carriageway, 16 m from the west one, 4 from its own)
    const out = mergeBridgeLanes([w, e, lane(3, 4 + 12, 3, 4)].map((q) => ({ ...q })))
    const by = new Map(out.edges.map((q) => [q.id, q]))
    expect(by.get(3)).toBeUndefined()
    expect(by.get(1)!.width).toBe(5)
    expect(by.get(2)!.width).toBeGreaterThan(5)
    expect(by.get(2)!.width).toBeLessThan(11)
  })
  it('takes a stub of lane on land with it, and leaves one that goes somewhere', () => {
    const stub: E = { id: 4, a: 3, b: 1, points: [6, -20, 6, 0], kind: 'cycleway', name: 'Pont', width: 2.8 }
    const onward: E = { id: 5, a: 2, b: 9, points: [0, 100, 0, 200], kind: 'cycleway', width: 2.8 }
    const far: E = { id: 6, a: 9, b: 10, points: [0, 200, 0, 300], kind: 'residential', width: 6 }
    const out = mergeBridgeLanes([{ ...road }, lane(2, 6, 3, 2), stub, onward, far])
    expect(out.edges.map((e) => e.id).sort()).toEqual([1, 5, 6])
  })
  it('leaves a cycleway across a river on a bridge of its own', () => {
    const own: E = { id: 2, a: 5, b: 6, points: [200, 0, 200, 100], bridge: true, kind: 'cycleway', name: 'Pont', width: 2.8 }
    expect(mergeBridgeLanes([{ ...road }, own]).edges.length).toBe(2)
  })
})
