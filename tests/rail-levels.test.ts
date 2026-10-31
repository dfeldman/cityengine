import { describe, expect, it } from 'vitest'
import { bedLines, bedPosts, bedProfile, bridgesOverStreets, deckChains, footWaysOnTracks, holeRuns, joinTracks, levelParisRails, liftViaducts, lyingSunk, overTheBed, parisRailRecord, railFate, railFineTiles, railLines, railMouths, spanOverRailways, stationShells, straightDeck, type OverLine } from '../tools/rail-levels.ts'
import type { PackedRail } from '../src/city/package.ts'

// an embankment 8 m high, with a street through it at x 0: the bare earth's gap
const bank = (x: number, _z: number): number => (Math.abs(x) < 10 ? 0 : Math.abs(x) < 20 ? ((Math.abs(x) - 10) / 10) * 8 : 8)
const flat = (): number => 0
const track = (): PackedRail => ({ id: 1, points: [-200, 0, 200, 0], kind: 'rail' })
const street = { points: [0, -50, 0, 50], heights: [0, 0], kind: 'residential' }
let n = 100

describe('which is on top at a crossing (owner, 2026-10-30)', () => {
  it('puts a track on an embankment on a bridge over the street, tagged or not', () => {
    const levelled = new Set<PackedRail>()
    const got = bridgesOverStreets([track()], [street], bank, levelled, () => n++)
    expect(got.spans).toBe(1)
    expect(got.rails.length).toBe(3)
    const deck = got.rails[1]
    expect(deck.bridge).toBe(true)
    expect(levelled.has(deck)).toBe(true)
    expect(Math.min(...deck.heights!)).toBeCloseTo(8)
    // the pieces either side still meet the deck's ends, and keep the way's id for the first
    expect(got.rails[0].id).toBe(1)
    expect(got.rails[0].points.slice(-2)).toEqual(deck.points.slice(0, 2))
    expect(got.rails[2].points.slice(0, 2)).toEqual(deck.points.slice(-2))
  })
  it('leaves a track on flat ground at its crossing, and counts it', () => {
    const got = bridgesOverStreets([track()], [street], flat, new Set(), () => n++)
    expect(got.spans).toBe(0)
    expect(got.flat).toBe(1)
    expect(got.rails.length).toBe(1)
  })
  it('does not touch a footpath, a tunnel or a road on its own bridge', () => {
    const others = [{ ...street, foot: true }, { ...street, tunnel: true }, { ...street, bridge: true }]
    expect(bridgesOverStreets([track()], others, bank, new Set(), () => n++).spans).toBe(0)
  })
  it('judges a crossing with the shoulder on the next way, a track being many ways', () => {
    const ways: PackedRail[] = [{ id: 1, points: [-200, 0, -8, 0], kind: 'rail' }, { id: 2, points: [-8, 0, 200, 0], kind: 'rail' }]
    const got = bridgesOverStreets(ways, [street], bank, new Set(), () => n++)
    expect(got.spans).toBe(1)
    expect(joinTracks(ways).length).toBe(1)
  })
  it('stops a chain at a junction', () => {
    const ways: PackedRail[] = [{ id: 1, points: [-100, 0, 0, 0], kind: 'rail' }, { id: 2, points: [0, 0, 100, 0], kind: 'rail' }, { id: 3, points: [0, 0, 100, 50], kind: 'rail' }]
    expect(joinTracks(ways).length).toBe(3)
  })
  it('makes a street a bridge where the track lies in a cutting under it', () => {
    const cutting = (x: number): number => (Math.abs(x) < 6 ? 8 : 0)
    const road = { points: [0, -50, 0, 50], heights: [8, 8], kind: 'residential' } as { points: number[]; heights: number[]; kind: string; bridge?: boolean }
    const got = bridgesOverStreets([track()], [road], cutting, new Set(), () => n++)
    expect(got.spans).toBe(0)
    expect(got.over).toBe(1)
    expect(road.bridge).toBe(true)
  })
  it('runs a short tagged deck straight between the ground at its ends', () => {
    const r: PackedRail = { id: 2, points: [-30, 0, 0, 0, 30, 0], kind: 'rail', bridge: true }
    straightDeck(r, (x) => (x < 0 ? 10 : 6))
    expect(r.heights).toEqual([10, 8, 6])
  })
})

describe('a street over a railway in the ground (the Boulevard des Batignolles, 2026-10-30)', () => {
  const flatGround = (): number => 0
  // a boulevard along x that falls 5 m to a tunnel at x 0 over 30 m each way, in two ways that meet at x 10
  const west = (): OverLine => ({ a: 1, b: 2, name: 'B', kind: 'primary', points: [-60, 0, -30, 0, -15, 0, 10, 0], heights: [5, 5, 2.5, 1.7] })
  const east = (): OverLine => ({ a: 2, b: 3, name: 'B', kind: 'primary', points: [10, 0, 30, 0, 60, 0], heights: [1.7, 5, 5] })
  const tunnel = { points: [0, -60, 0, 60] }

  it('runs the street straight from top to top, the way over the tracks a bridge', () => {
    const w = west(), e = east()
    expect(spanOverRailways([w, e], [tunnel], [], flatGround)).toBe(1)
    expect(w.bridge).toBe(true)
    expect(Math.min(...w.heights!, ...e.heights!)).toBeCloseTo(5)
    expect(e.bridge).toBeUndefined()
    expect(e.ramp).toBe(true)
  })
  it('leaves a street that goes straight over them, or falls gently: a valley', () => {
    const level: OverLine = { a: 1, b: 2, name: 'B', points: [-60, 0, 60, 0], heights: [5, 5] }
    expect(spanOverRailways([level], [tunnel], [], flatGround)).toBe(0)
    const valley: OverLine = { a: 1, b: 2, name: 'B', points: [-45, 0, 0, 0, 45, 0], heights: [2, 0, 2] }
    const valley2: OverLine = { a: 3, b: 4, name: 'C', points: [-200, 5, 0, 5, 200, 5], heights: [8, 0, 8] }
    expect(spanOverRailways([valley, valley2], [{ points: [0, -60, 0, 60] }], [], flatGround)).toBe(0)
  })
  it('counts a tunnel only near its mouth: a street over the middle of the RER is on its own ground', () => {
    const w = west(), e = east()
    expect(spanOverRailways([w, e], [{ points: [0, -500, 0, 500] }], [], flatGround)).toBe(0)
  })
  it('leaves a street under a track on a bank, and a street on its own bridge', () => {
    const w = west(), e = east()
    expect(spanOverRailways([w, e], [], [{ points: [0, -60, 0, 60] }], () => 8)).toBe(0)
    const on = { ...west(), bridge: true }
    expect(spanOverRailways([on], [tunnel], [], flatGround)).toBe(0)
  })
  it('spans a surface track in its cutting', () => {
    const w = west(), e = east()
    expect(spanOverRailways([w, e], [], [{ points: [0, -60, 0, 60] }], flatGround)).toBe(1)
  })
})

describe('people on the tracks (the Place de l\'Europe, 2026-10-30)', () => {
  const rails: PackedRail[] = [{ id: 1, points: [-200, 0, 200, 0], kind: 'rail' }]
  it('finds a foot way that runs along a track', () => {
    expect(footWaysOnTracks([{ id: 7, foot: true, points: [-50, 1, 50, 1] }], rails).has(7)).toBe(true)
  })
  it('leaves one that crosses it, one beside it, a foot bridge, a tunnel and a street', () => {
    const others = [
      { id: 2, foot: true, points: [0, -40, 0, 40] }, { id: 3, foot: true, points: [-50, 9, 50, 9] },
      { id: 4, foot: true, bridge: true, points: [-50, 1, 50, 1] }, { id: 5, foot: true, tunnel: true, points: [-50, 1, 50, 1] },
      { id: 6, points: [-50, 1, 50, 1] },
    ]
    expect(footWaysOnTracks(others, rails).size).toBe(0)
  })
})

describe('the audit of every line (2026-10-31): what OSM says of a way', () => {
  it('a tunnel and a covered way are under something; layer -1, level -1 and cutting=yes are only below something', () => {
    expect(railFate({ tunnel: 'yes' })).toBe('buried')
    expect(railFate({ covered: 'yes' })).toBe('buried')
    expect(railFate({ tunnel: 'no' })).toBe('open')
    expect(railFate({ layer: '-1' })).toBe('sunk')
    expect(railFate({ level: '-1' })).toBe('sunk')
    expect(railFate({ cutting: 'yes' })).toBe('sunk')
    expect(railFate({ cutting: 'yes', layer: '0' })).toBe('open')
    expect(railFate({ layer: '1' })).toBe('open')
  })
  it('the Petite Ceinture is track with no train; a métro way between its tunnel and its viaduct is the viaduct; its yard and its trench are track', () => {
    const p = [0, 0, 50, 0]
    expect(parisRailRecord({ railway: 'disused' }, 1, p).rail).toMatchObject({ kind: 'rail', disused: true })
    expect(parisRailRecord({ railway: 'subway' }, 1, p).rail).toMatchObject({ kind: 'subway', bridge: true })
    expect(parisRailRecord({ railway: 'subway', service: 'yard' }, 1, p).rail).toMatchObject({ kind: 'rail', disused: true })
    expect(parisRailRecord({ railway: 'subway', layer: '-1' }, 1, p).rail).toMatchObject({ kind: 'rail', disused: true })
    expect(parisRailRecord({ railway: 'subway', tunnel: 'yes' }, 1, p).rail).toBeUndefined()
    expect(parisRailRecord({ railway: 'funicular' }, 1, p).rail).toMatchObject({ funicular: true })
  })
  it('a sunk way lies in a cutting the ground has, or beside tracks in the open; else it is roofed', () => {
    const inCut: PackedRail = { id: 1, points: [0, 0, 200, 0], kind: 'rail' }
    const cut = (_x: number, z: number): number => (Math.abs(z) < 10 ? 0 : 8)
    expect(lyingSunk([inCut], [], cut).lying).toEqual([inCut])
    const flatGround = (): number => 5
    const alone: PackedRail = { id: 2, points: [0, 0, 200, 0], kind: 'rail' }
    expect(lyingSunk([alone], [], flatGround).roofed).toEqual([alone])
    const open: PackedRail = { id: 3, points: [0, 6, 200, 6], kind: 'rail' }
    expect(lyingSunk([alone], [open], flatGround).lying).toEqual([alone])
  })
  it('a double track in a covered trench does not vouch for itself', () => {
    const a: PackedRail = { id: 1, points: [0, 0, 200, 0], kind: 'rail' }, b: PackedRail = { id: 2, points: [0, 4, 200, 4], kind: 'rail' }
    expect(lyingSunk([a, b], [], () => 5).lying.length).toBe(0)
  })
  it('a railway\'s tiles and only those ship the fine ground: not a tram\'s, not the far side of town', () => {
    const t = railFineTiles([{ kind: 'rail', points: [10, 10, 190, 10] }, { kind: 'tram', points: [1000, 1000, 1190, 1000] }], 200)
    expect(t.has('0,0')).toBe(true)
    expect(t.has('0,-1')).toBe(true)
    expect(t.has('5,5')).toBe(false)
  })
})

describe('the track\'s own level (2026-10-31)', () => {
  const samples = (f: (s: number) => number, n = 100, step = 4): number[] => Array.from({ length: n }, (_, i) => f(i * step))
  const none = (n = 100): boolean[] => new Array<boolean>(n).fill(false)

  it('a track runs straight past the hole under a bridge, and rides over a hump', () => {
    const holed = samples((s) => (s > 180 && s < 220 ? 12 : 19.4))
    const b = bedProfile(holed, none())
    expect(Math.min(...b)).toBeCloseTo(19.4)
    const humped = samples((s) => (s > 190 && s < 210 ? 12 : 5))
    expect(Math.max(...bedProfile(humped, none()))).toBeCloseTo(5)
  })
  it('follows a real grade, however long', () => {
    const slope = samples((s) => 0.02 * s)
    const b = bedProfile(slope, none())
    expect(b[50]).toBeCloseTo(slope[50], 0)
    expect(b[80] - b[20]).toBeCloseTo(slope[80] - slope[20], 0)
  })
  it('a hole wider than the window fills from its rims at a railway\'s grade, not its own', () => {
    const wide = samples((s) => (s > 100 && s < 300 ? 0 : 10))
    const b = bedProfile(wide, none())
    for (let i = 1; i < b.length; i++) expect(Math.abs(b[i] - b[i - 1])).toBeLessThanOrEqual(0.04 * 4 + 1e-6)
  })
  it('a run clear of the ground with a rim both sides is a deck, from rim to rim; one running off the line\'s end is not', () => {
    const g = samples((s) => (s > 180 && s < 220 ? 12 : 19.4))
    const b = bedProfile(g, none())
    const runs = holeRuns(g, b)
    expect(runs[50]).toBe(true)
    expect(runs[10]).toBe(false)
    const atEnd = samples((s) => (s > 360 ? 12 : 19.4))
    expect(holeRuns(atEnd, bedProfile(atEnd, none())).some(Boolean)).toBe(false)
  })
  it('a mapper\'s bridge that stops halfway across the hole is carried to the far rim, and the track either side keeps the level (Pantin, 48.8979, 2.3832)', () => {
    let id = 500
    const ground = (x: number): number => (x > -20 && x < 20 ? 12 : 19)
    const ways: PackedRail[] = [
      { id: 1, kind: 'rail', points: [-200, 0, -10, 0] },
      { id: 2, kind: 'rail', bridge: true, points: [-10, 0, 5, 0] },
      { id: 3, kind: 'rail', points: [5, 0, 200, 0] },
    ]
    const got = bedLines(ways, ground, () => id++)
    const decks = got.rails.filter((r) => r.bridge)
    for (const d of decks) expect(Math.min(...d.heights!)).toBeGreaterThan(18.5)
    // nothing that lies on the ground is in the hole
    const open = got.rails.filter((r) => !r.bridge)
    for (const r of open) for (let i = 0; i < r.points.length; i += 2) expect(Math.abs(r.points[i])).toBeGreaterThanOrEqual(19)
    expect(got.holes).toBeGreaterThan(0)
    // the beds are only under open track
    for (const b of got.beds) expect(Math.abs(b.x)).toBeGreaterThan(14)
  })
  it('lays the ground\'s posts to the nearest track\'s level within its reach', () => {
    const posts = bedPosts([{ x: 10, z: 10, y: 3 }, { x: 22, z: 10, y: 9 }], 0, 0, 4)
    expect(posts.get('2,2')).toBe(3)
    expect(posts.get('6,2')).toBe(9)
    expect(posts.has('20,2')).toBe(false)
  })
  it('a line through a junction runs straight on; the branch is its own', () => {
    const a: PackedRail = { id: 1, kind: 'rail', points: [-100, 0, 0, 0] }
    const b: PackedRail = { id: 2, kind: 'rail', points: [0, 0, 100, 0] }
    const c: PackedRail = { id: 3, kind: 'rail', points: [0, 0, 80, 60] }
    const lines = railLines([a, b, c])
    expect(lines.length).toBe(2)
    expect(lines.find((l) => l.ways.length === 2)!.ways.map((w) => w.r.id).sort()).toEqual([1, 2])
  })
  it('does not run a disused line into a running one', () => {
    const a: PackedRail = { id: 1, kind: 'rail', points: [-100, 0, 0, 0] }
    const b: PackedRail = { id: 2, kind: 'rail', disused: true, points: [0, 0, 100, 0] }
    expect(railLines([a, b]).length).toBe(2)
    expect(joinTracks([a, b]).length).toBe(2)
  })
  it('a street\'s corridor over a track in its bed is a deck, its centre line never crossing the track (the Place de l\'Europe)', () => {
    const rail: PackedRail = { id: 1, kind: 'rail', points: [-100, 0, 100, 0] }
    const beside = { points: [-40, 6, 40, 6], heights: [11, 11], width: 8, walk: 3 } as { points: number[]; heights: number[]; width: number; walk: number; bridge?: boolean }
    const pavement = { points: [-40, 1, 40, 1], heights: [11, 11], width: 3, foot: true } as { points: number[]; heights: number[]; width: number; foot: boolean; bridge?: boolean }
    const rim = { points: [-400, 30, 400, 30], heights: [11, 11], width: 8, walk: 3 } as { points: number[]; heights: number[]; width: number; walk: number; bridge?: boolean }
    const level = { points: [-40, 6, 40, 6], heights: [5, 5], width: 8, walk: 3 } as { points: number[]; heights: number[]; width: number; walk: number; bridge?: boolean }
    expect(overTheBed([rail], [beside, pavement, rim, level], () => 5)).toBe(2)
    expect(beside.bridge).toBe(true)
    expect(pavement.bridge).toBe(true)
    expect(rim.bridge).toBeUndefined()
    expect(level.bridge).toBeUndefined()
  })
  it('spans a street over a trench deeper than a tunnel\'s approach', () => {
    const w: OverLine = { a: 1, b: 2, name: 'R', kind: 'residential', points: [-45, 0, 0, 0, 45, 0], heights: [14, 0, 14] }
    expect(spanOverRailways([w], [], [{ points: [0, -60, 0, 60] }], () => 0)).toBe(1)
    const u: OverLine = { a: 3, b: 4, name: 'R', kind: 'residential', points: [-45, 0, 0, 0, 45, 0], heights: [14, 0, 14] }
    expect(spanOverRailways([u], [{ points: [0, -60, 0, 60] }], [], () => 0)).toBe(0)
  })
})

describe('viaducts, chain by chain (2026-10-31)', () => {
  it('joins decks that meet at a node, and not the track beside it 4 m off', () => {
    const ds: PackedRail[] = [
      { id: 1, kind: 'subway', bridge: true, points: [0, 0, 100, 0] },
      { id: 2, kind: 'subway', bridge: true, points: [100, 0, 200, 0] },
      { id: 3, kind: 'subway', bridge: true, points: [100, 4, 300, 4] },
    ]
    expect(deckChains(ds).length).toBe(2)
  })
  it('a métro viaduct stands over flat ground and comes down at a ramp\'s grade at each true end; no step between two ways', () => {
    const a: PackedRail = { id: 1, kind: 'subway', bridge: true, layer: 2, points: [0, 0, 150, 0] }
    const b: PackedRail = { id: 2, kind: 'subway', bridge: true, layer: 2, points: [150, 0, 300, 0, 450, 0] }
    const got = liftViaducts([a, b], () => 0)
    expect(got.eased).toBe(1)
    expect(a.heights![0]).toBe(0)
    expect(b.heights![2]).toBe(0)
    expect(a.heights![1]).toBeCloseTo(b.heights![0])
    expect(b.heights![1]).toBeGreaterThan(7)
    expect(a.heights![1] / 150).toBeLessThanOrEqual(0.0501)
  })
  it('the track beside an end does not stop it easing (the T2\'s decks at Puteaux stood 8 m over their own track)', () => {
    const a: PackedRail = { id: 1, kind: 'subway', bridge: true, points: [0, 0, 200, 0] }
    const beside: PackedRail = { id: 2, kind: 'subway', bridge: true, points: [0, 4, 200, 4] }
    liftViaducts([a, beside], () => 0)
    expect(a.heights![0]).toBe(0)
    expect(beside.heights![1]).toBe(0)
  })
  it('a main line\'s viaduct keeps its banks\' level where that clears the ground, and rises only where it must', () => {
    const banks = (x: number): number => (x < 20 || x > 380 ? 12 : 0)
    const a: PackedRail = { id: 1, kind: 'rail', bridge: true, points: [0, 0, 100, 0, 200, 0, 300, 0, 400, 0] }
    liftViaducts([a], banks)
    expect(a.heights![0]).toBeCloseTo(12)
    expect(a.heights![2]).toBeCloseTo(12)
    const hill = (x: number): number => (x > 350 && x < 450 ? 10 : 0)
    const b: PackedRail = { id: 2, kind: 'rail', bridge: true, points: [0, 0, 400, 0, 800, 0] }
    liftViaducts([b], hill)
    expect(b.heights![1]).toBeGreaterThan(14)
  })
})

describe('a métro in the middle of a road bridge (the Line 1, Pont de Neuilly)', () => {
  const road = { bridge: true, points: [-100, 3, 300, 3], heights: [4, 4] }
  it('runs on the road\'s own level, straight from there to its ends', () => {
    const m: PackedRail = { id: 1, kind: 'subway', bridge: true, layer: 1, points: [-200, 0, 100, 0, 400, 0] }
    liftViaducts([m], () => 0, [road])
    expect(m.heights![1]).toBeCloseTo(4, 0)
    expect(m.heights![0]).toBe(0)
  })
  it('the Line 6 on the Bir-Hakeim\'s upper deck, layer 2, stays up; and a viaduct with no road by it', () => {
    const six: PackedRail = { id: 2, kind: 'subway', bridge: true, layer: 2, points: [-200, 0, 100, 0, 400, 0] }
    liftViaducts([six], () => 0, [road])
    expect(six.heights![1]).toBeCloseTo(8)
    const alone: PackedRail = { id: 3, kind: 'subway', bridge: true, layer: 1, points: [-200, 0, 100, 0, 400, 0] }
    liftViaducts([alone], () => 0, [])
    expect(alone.heights![1]).toBeCloseTo(6.5)
  })
})

describe('tunnel mouths (2026-10-31)', () => {
  it('finds a mouth on any railway, where a drawn track ends at a way under something', () => {
    const under = [{ points: [100, 0, 300, 0] }]
    const m = railMouths(under, [{ kind: 'subway', points: [0, 0, 100, 0], heights: [8, 0] }])
    expect(m.length).toBe(1)
    expect(m[0].ox).toBeCloseTo(-1)
  })
  it('none where nothing drawn meets it', () => {
    expect(railMouths([{ points: [100, 0, 300, 0] }], [{ kind: 'rail', points: [0, 40, 90, 40] }]).length).toBe(0)
  })
  it('stops the wall short of a track passing it', () => {
    const under = [{ points: [100, 0, 300, 0] }]
    const alone = railMouths(under, [{ kind: 'rail', points: [0, 0, 100, 0] }])
    expect(alone[0].half).toBe(6)
    const passing = railMouths(under, [{ kind: 'rail', points: [0, 0, 100, 0] }, { kind: 'rail', points: [0, 5, 300, 5] }])
    expect(passing[0].half).toBeCloseTo(3.4)
    const tight = railMouths(under, [{ kind: 'rail', points: [0, 0, 100, 0] }, { kind: 'rail', points: [0, 3.5, 300, 3.5] }])
    expect(tight[0].half).toBe(2.6)
    expect(tight[0].tight).toBe(true)
  })
  it('tracks side by side share a mouth', () => {
    const under = [{ points: [100, 0, 300, 0] }, { points: [100, 5, 300, 5] }]
    const m = railMouths(under, [{ kind: 'rail', points: [0, 0, 100, 0] }, { kind: 'rail', points: [0, 5, 100, 5] }])
    expect(m.length).toBe(1)
    expect(m[0].tracks).toBe(2)
    expect(m[0].half).toBeCloseTo(8.5)
  })
  it('a branch off the side of a running track has its mouth back along the branch', () => {
    const m = railMouths([{ points: [100, 0, 100, 200] }], [{ kind: 'rail', points: [0, 0, 300, 0] }])
    expect(m.length).toBe(1)
    expect(m[0].z).toBeCloseTo(10)
  })
})

describe('the viaducts\' stations (2026-10-31, Dupleix)', () => {
  const deck: PackedRail = { id: 1, kind: 'subway', bridge: true, heights: [8, 8], points: [-100, 0, 100, 0] }
  const shell = { id: 7, ring: [-40, -8, 40, -8, 40, 8, -40, 8] }
  const far = { id: 8, ring: [-40, 92, 40, 92, 40, 108, -40, 108] }
  const hall = { id: 9, ring: [-60, -30, 60, -30, 60, 30, -60, 30] }
  it('drops the shell of a station the viaduct runs through, and not a great hall or a building away from it', () => {
    const got = stationShells([shell, far, hall], [deck], [{ x: 0, z: 0 }])
    expect([...got]).toEqual([7])
  })
  it('keeps a building the line goes through away from any station', () => {
    expect(stationShells([shell], [deck], [{ x: 900, z: 0 }]).size).toBe(0)
  })
})

describe('the Paris rail stage whole', () => {
  it('draws the sunk way beside open track, leaves the roofed one, and counts them', () => {
    let id = 900
    const open: PackedRail = { id: 1, kind: 'rail', points: [0, 0, 300, 0] }
    const beside: PackedRail = { id: 2, kind: 'rail', layer: -1, points: [0, 5, 300, 5] }
    const roofed: PackedRail = { id: 3, kind: 'rail', points: [0, 500, 300, 500] }
    let laid = 0
    const got = levelParisRails([open], [beside, roofed], [], [], () => 4, (b) => { laid = b.length; return b.length }, () => id++)
    expect(got.lying).toBe(1)
    expect(got.roofed).toEqual([roofed])
    expect(got.rails.some((r) => r.points[1] === 5)).toBe(true)
    expect(laid).toBeGreaterThan(50)
  })
})

describe('people beside the Petite Ceinture', () => {
  it('keeps a walk along a disused line', () => {
    const rails: PackedRail[] = [{ id: 1, kind: 'rail', disused: true, points: [-200, 0, 200, 0] }]
    expect(footWaysOnTracks([{ id: 7, foot: true, points: [-50, 1, 50, 1] }], rails).size).toBe(0)
  })
})
