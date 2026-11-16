import { describe, expect, it, vi } from 'vitest'
import { alignDeckEnds, bridgeRise, chains, closedFootBridge } from '../tools/bridges.ts'

// La Défense (docs/DEFENSE-WALKWAYS.md): a named foot deck runs on through a junction where a side footway joins
const e = (id: number, a: number, b: number, name?: string, layer = 4): any => ({ id, a, b, points: [a, 0, b, 0], bridge: true, foot: true, kind: 'pedestrian', name, layer, width: 6 })

describe('chains through a named foot deck', () => {
  it('La Jetée stays one chain past a side footway', () => {
    const out = chains([e(1, 0, 10, 'La Jetée'), e(2, 10, 20, 'La Jetée'), e(3, 10, 30, undefined, 1)])
    const jetee = out.find((c) => c.some((s) => s.e.id === 1))!
    expect(jetee.map((s) => s.e.id).sort()).toEqual([1, 2])
    expect(out.find((c) => c.some((s) => s.e.id === 3))!.length).toBe(1)
  })
  it('does not pick between two same-named ways', () => {
    const out = chains([e(1, 0, 10, 'X'), e(2, 10, 20, 'X'), e(3, 10, 30, 'X')])
    expect(out.length).toBe(3)
  })
  it('a road junction still splits', () => {
    const r = (id: number, a: number, b: number): any => ({ ...e(id, a, b, 'Bd'), foot: false, kind: 'primary' })
    expect(chains([r(1, 0, 10), r(2, 10, 20), r(3, 10, 30)]).length).toBe(3)
  })
})

describe('closed foot bridges', () => {
  it('La Jetée (access=no) is off the bike graph', () => {
    expect(closedFootBridge({ highway: 'pedestrian', bridge: 'yes', access: 'no', layer: '4' })).toBe(true)
    expect(closedFootBridge({ highway: 'pedestrian', bridge: 'yes' })).toBe(false)
    expect(closedFootBridge({ highway: 'primary', bridge: 'yes', access: 'no' })).toBe(false)
    expect(closedFootBridge({ highway: 'footway', bridge: 'yes', access: 'no', bicycle: 'yes' })).toBe(false)
  })
})

describe('foot bridge over nothing in a footBridgeLayers zone', () => {
  const world = (caps: any[]): any => ({ water: [], ground: () => 0, layerCaps: caps })
  const b = { ...e(1, 0, 1), points: [0, 0, 60, 0] }
  it('takes no rise inside the zone with CAP_FLAT=1 (off by default)', async () => {
    const zone = world([{ x: 0, z: 0, radius: 500, layer: 1 }])
    expect(bridgeRise(b, [b], zone, [0, 0]).rise).toBe(2)
    process.env.CAP_FLAT = '1'
    vi.resetModules()
    const m = await import('../tools/bridges.ts')
    expect(m.bridgeRise(b, [b], zone, [0, 0]).rise).toBe(0)
    delete process.env.CAP_FLAT
  })
  it('keeps 2 m outside', () => expect(bridgeRise(b, [b], world([]), [0, 0]).rise).toBe(2))
})

describe('alignDeckEnds', () => {
  const d = (id: number, a: number, b: number, x0: number, x1: number, h: number[]): any => ({ ...e(id, a, b), points: [x0, 0, (x0 + x1) / 2, 0, x1, 0], heights: h })
  it('brings three ends at one node to the highest', () => {
    const es = [d(1, 0, 9, -40, 0, [27, 27, 27.1]), d(2, 9, 2, 0, 40, [33.1, 33.1, 33.1]), d(3, 9, 3, 0, 0.001, [30.1, 30.1, 30.1])]
    es[2].points = [0, 0, 0, 5, 0, 10]
    alignDeckEnds(es, [{ x: 0, z: 0, radius: 500 }])
    expect(es[0].heights[2]).toBe(33.1)
    expect(es[0].heights[0]).toBe(27)
    expect(es[2].heights[0]).toBe(33.1)
  })
  it('leaves a node outside the zone, and a step too big', () => {
    const es = [d(1, 0, 9, -40, 0, [27, 27, 27]), d(2, 9, 2, 0, 40, [30, 30, 30])]
    alignDeckEnds(es, [{ x: 9999, z: 0, radius: 10 }])
    expect(es[0].heights[2]).toBe(27)
    const big = [d(1, 0, 9, -40, 0, [20, 20, 20]), d(2, 9, 2, 0, 40, [30, 30, 30])]
    alignDeckEnds(big, [{ x: 0, z: 0, radius: 500 }])
    expect(big[0].heights[2]).toBe(20)
  })
})

import { btFootDecks, btOffset, capUnderDecks } from '../tools/defense-decks.ts'
import { packPoints } from '../src/city/package.ts'

describe('La Défense decks from BD TOPO', () => {
  const seg = (ax: number, bx: number, z: number, sol: string, zz = 0): any => ({ ax, az: zz, bx, bz: zz, za: z, zb: z, f: { id: 's', coords: [], props: { position_par_rapport_au_sol: sol } } })
  const cap = [{ x: 0, z: 0, radius: 1000 }]
  it('measures the NGF offset from at-grade roads', () => {
    const roads = Array.from({ length: 25 }, (_, k): any => ({ id: k, a: 1000 + k, b: 2000 + k, kind: 'residential', points: packPoints([{ x: 0, z: 50 + k * 0.01 }, { x: 10, z: 50 + k * 0.01 }]), heights: [10, 10], width: 5 }))
    expect(btOffset(roads, [seg(-5, 15, 42.9, '0', 50)], cap)).toBeCloseTo(32.9, 1)
  })
  it('lifts a capped deck to BD TOPO, its ends kept where a way at grade meets them', () => {
    const deck: any = { id: 1, a: 1, b: 2, bridge: true, foot: true, kind: 'footway', width: 3, points: packPoints([0, 10, 20, 30, 40].map((x) => ({ x, z: 0 }))), heights: [20, 20, 20, 20, 20] }
    const street: any = { id: 2, a: 2, b: 3, foot: true, kind: 'footway', width: 3, points: packPoints([{ x: 40, z: 0 }, { x: 60, z: 0 }]), heights: [20, 20] }
    const other: any = { id: 3, a: 1, b: 5, bridge: true, foot: true, kind: 'footway', width: 3, points: packPoints([{ x: 0, z: 0 }, { x: 0, z: 40 }]), heights: [20, 20] }
    const street2: any = { id: 4, a: 5, b: 6, foot: true, kind: 'footway', width: 3, points: packPoints([{ x: 0, z: 40 }, { x: 0, z: 60 }]), heights: [20, 20] }
    btFootDecks([deck, street, other, street2], [seg(-5, 45, 60, '1')], cap, 33, () => 10)
    expect(deck.heights[2]).toBe(27)
    expect(deck.heights[4]).toBe(20) // pinned by the street
    expect(deck.heights[0]).toBe(27) // an end meeting only another deck takes BD TOPO
  })
  it('ignores a sol-1 line that would put the deck on the ground', () => {
    const deck: any = { id: 1, a: 1, b: 2, bridge: true, foot: true, kind: 'footway', width: 3, points: packPoints([{ x: 0, z: 0 }, { x: 20, z: 0 }]), heights: [20, 20] }
    expect(btFootDecks([deck], [seg(-5, 25, 43.5, '1')], cap, 33, () => 19.5)).toEqual([])
  })
  it('caps a generic building a deck runs through, never a landmark', () => {
    const ring = packPoints([{ x: 0, z: -10 }, { x: 30, z: -10 }, { x: 30, z: 10 }, { x: 0, z: 10 }])
    const deck: any = { id: 9, a: 1, b: 2, bridge: true, kind: 'primary', width: 7, points: packPoints([-5, 10, 20, 35].map((x) => ({ x, z: 0 }))), heights: [27, 27, 27, 27] }
    const gen: any = { id: 100, ring, height: 25.8, levels: 8 }, lm: any = { id: 101, ring, height: 25.8 }
    expect(capUnderDecks([gen, lm], [deck], () => 14.7, new Set([101]))).toEqual([100])
    expect(gen.height).toBeCloseTo(10.8, 1)
    expect(lm.height).toBe(25.8)
  })
})

import { rampFreeEnds, dalleHeight } from '../tools/defense-decks.ts'
describe('round 4: free ends, bad matches, the dalle', () => {
  const cap = [{ x: 0, z: 0, radius: 1000 }]
  const seg = (ax: number, bx: number, z: number): any => ({ ax, az: 0, bx, bz: 0, za: z, zb: z, f: { id: 's', coords: [], props: { position_par_rapport_au_sol: '1' } } })
  it('a deck end joined to nothing ramps down to the ground at 8%, on through the next way', () => {
    const a: any = { id: 1, a: 1, b: 2, bridge: true, foot: true, kind: 'footway', width: 3, points: packPoints([0, 50, 100].map((x) => ({ x, z: 0 }))), heights: [30, 30, 30] }
    const b: any = { id: 2, a: 2, b: 3, bridge: true, foot: true, kind: 'footway', width: 3, points: packPoints([100, 200].map((x) => ({ x, z: 0 }))), heights: [30, 30] }
    rampFreeEnds([a, b], cap, () => 20)
    expect(a.heights[0]).toBe(20)
    expect(a.heights[1]).toBe(24)
    expect(a.heights[2]).toBe(28)
    // b's far end is free too: it comes down to 20 from its own end
    expect(b.heights[1]).toBe(20)
  })
  it('a lone match far off the old height is dropped (Place du Sud)', () => {
    const d: any = { id: 1, a: 1, b: 2, bridge: true, foot: true, kind: 'footway', width: 3, points: packPoints([{ x: 0, z: 0 }, { x: 10, z: 0 }]), heights: [19, 19] }
    const s2: any = { id: 2, a: 2, b: 3, foot: true, kind: 'footway', width: 3, points: packPoints([{ x: 10, z: 0 }, { x: 30, z: 0 }]), heights: [19, 19] }
    const s1: any = { id: 3, a: 1, b: 4, foot: true, kind: 'footway', width: 3, points: packPoints([{ x: 0, z: 0 }, { x: -30, z: 0 }]), heights: [19, 19] }
    btFootDecks([d, s1, s2], [seg(-1, 11, 33 + 40)], cap, 33, () => 5)
    expect(d.heights).toEqual([19, 19])
  })
  it('the dalle: raised where BD TOPO agrees, not where levels mix', () => {
    const v = [{ x: 0, z: 0, h: 25 }, { x: 5, z: 0, h: 25.5 }, { x: 0, z: 5, h: 25.2 }]
    expect(dalleHeight(v, 1, 1, 12)).toBeCloseTo(25.2, 1)
    expect(dalleHeight([...v, { x: 2, z: 2, h: 12.8 }], 1, 1, 12)).toBeNull()
    expect(dalleHeight(v, 1, 1, 24)).toBeNull()
  })
})

import { stairsAtDeckEnds } from '../tools/defense-decks.ts'
describe('round 5: stairs at deck ends', () => {
  const cap = [{ x: 0, z: 0, radius: 1000 }]
  const w = (id: number, a: number, b: number, pts: [number, number][], h: number[], extra: any = {}): any => ({ id, a, b, foot: true, kind: 'footway', width: 3, points: packPoints(pts.map(([x, z]) => ({ x, z }))), heights: h, ...extra })
  it('re-slopes an OSM flight found along the path, the path between lifted as its landing', () => {
    const deck = w(1, 1, 2, [[-50, 0], [0, 0]], [20, 20], { bridge: true })
    const path = w(2, 2, 3, [[0, 0], [10, 0]], [8, 8])
    const steps = w(3, 3, 4, [[10, 0], [30, 0]], [8, 8], { kind: 'steps' })
    stairsAtDeckEnds([deck, path, steps], cap)
    expect(path.heights).toEqual([20, 20])
    expect(steps.heights).toEqual([20, 8])
  })
  it('turns a short meeting path into a flight, a long one into a ramp', () => {
    const deck = w(1, 1, 2, [[-50, 0], [0, 0]], [20, 20], { bridge: true })
    const short = w(2, 2, 3, [[0, 0], [20, 0]], [8, 8])
    stairsAtDeckEnds([deck, short], cap)
    expect(short.kind).toBe('steps')
    expect(short.heights).toEqual([20, 8])
    const deck2 = w(1, 1, 2, [[-50, 0], [0, 0]], [20, 20], { bridge: true })
    const long = w(2, 2, 3, [[0, 0], [100, 0], [200, 0]], [8, 8, 8])
    stairsAtDeckEnds([deck2, long], cap)
    expect(long.kind).toBe('footway')
    expect(long.heights).toEqual([20, 12, 8])
  })
  it('leaves a step meetDecks can take', () => {
    const deck = w(1, 1, 2, [[-50, 0], [0, 0]], [20, 20], { bridge: true })
    const p = w(2, 2, 3, [[0, 0], [20, 0]], [17, 17])
    expect(stairsAtDeckEnds([deck, p], cap)).toEqual([])
  })
})
