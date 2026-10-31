import { describe, expect, it } from 'vitest'
import { decksBetweenMouths, deckLevel, deckPosts, levelFootOnDecks, mouthsAtDecks, overRailway } from '../src/render/rail-overbridge.ts'
import { addRailDecks, RAIL_DECKS } from '../src/city/paris/rail-decks.ts'

const ring = [{ x: 0, z: 0 }, { x: 40, z: 0 }, { x: 40, z: 20 }, { x: 0, z: 20 }]
const flat = [0, 0, 40, 0, 40, 20, 0, 20]
const street = { points: [-10, 10, 50, 10], heights: [13, 13], foot: false, tunnel: false }

describe('a street over a station throat (the Pont de l\'Europe, PARIS_BUGS.md)', () => {
  it('reads the deck from its streets, not its pavements or a road under it', () => {
    const under = { points: [5, -5, 5, 25], heights: [5, 5], foot: false, tunnel: false }
    const lower = { points: [10, 5, 30, 5], heights: [10.7, 10.8], foot: true, tunnel: false }
    const three = { points: [20, 2, 20, 18], heights: [13.1, 13.1], foot: false, tunnel: false }
    const posts = deckPosts(ring, [street, under, lower, three])
    expect(posts.every((q) => q.y > 12)).toBe(true)
    expect(deckLevel(posts, 20, 10)).toBeGreaterThan(12.9)
  })
  it('stands over a track under it or stopping at its edge, not a track on it', () => {
    const posts = deckPosts(ring, [street])
    const bed = (): number => 6
    expect(overRailway(ring, posts, [{ kind: 'rail', points: [20, -30, 20, -1] }], bed)).toBe(true)
    // the railway's own bridge: the track rides at the street's level
    expect(overRailway(ring, posts, [{ kind: 'rail', points: [20, -5, 20, 25], heights: [13, 13] }], bed)).toBe(false)
    // and no street on it, or no track near it
    expect(overRailway(ring, [], [{ kind: 'rail', points: [20, -30, 20, -1] }], bed)).toBe(false)
    expect(overRailway(ring, posts, [{ kind: 'rail', points: [200, -30, 200, -1] }], bed)).toBe(false)
  })
  it('takes the mouths at a street\'s bridge, and leaves the ones at a real tunnel', () => {
    const atFace = { x: 20, z: -5 }, inHill = { x: 300, z: 300 }
    const track = { kind: 'rail' as const, points: [20, -30, 20, -1] }
    const got = mouthsAtDecks([atFace, inHill], [{ ring: flat }], [street], [track])
    expect(got.has(atFace)).toBe(true)
    expect(got.has(inHill)).toBe(false)
    // no main line at it: a tram's portal keeps its mouth, there being no face to draw
    expect(mouthsAtDecks([atFace], [{ ring: flat }], [street], [{ ...track, kind: 'tram' as const }]).size).toBe(0)
    // a railway's own bridge keeps them
    const onIt = mouthsAtDecks([atFace], [{ ring: flat }], [street], [{ kind: 'rail', points: [20, -5, 20, 25], heights: [13, 13] }])
    expect(onIt.size).toBe(0)
  })
  it('finds the deck nobody outlined between two wide mouths facing each other over a street', () => {
    const a = { x: 0, z: 0, ox: 0, oz: -1, half: 15 }, b = { x: 2, z: 40, ox: 0, oz: 1, half: 14 }
    const across = { points: [-30, 20, 30, 20], heights: [13, 13], foot: false, tunnel: false }
    const [d] = decksBetweenMouths([a, b], [across])
    expect(d.a).toBe(a)
    expect(d.b).toBe(b)
    // no street over them, or a tunnel too long to be a bridge, or a single track's mouth
    expect(decksBetweenMouths([a, b], [])).toHaveLength(0)
    expect(decksBetweenMouths([a, { ...b, z: 300 }], [across])).toHaveLength(0)
    expect(decksBetweenMouths([{ ...a, half: 4 }, b], [across])).toHaveLength(0)
  })
  it('brings a pavement on the deck up to it, and leaves the walks by the tracks below', () => {
    const pavement = { points: [5, 19, 35, 19], heights: [10.8, 10.8], foot: true, tunnel: false }
    const walk = { points: [5, -30, 5, 5], heights: [6, 6], foot: true, tunnel: false }
    const moved = levelFootOnDecks([{ ring: flat }], [street, pavement, walk], [{ kind: 'rail', points: [20, -30, 20, -1] }], () => 6)
    expect(moved).toBe(1)
    expect(pavement.heights[0]).toBeCloseTo(13, 1)
    expect(walk.heights).toEqual([6, 6])
  })
  it('joins the outlines of the tiles a deck touches', () => {
    const t: { key: string; bridges?: { id: number; ring: number[] }[] } = { key: '0,0' }
    RAIL_DECKS.push({ id: 1, ring: [10, 10, 30, 10, 30, 30, 10, 30] })
    addRailDecks(t)
    addRailDecks(t)
    expect(t.bridges).toHaveLength(1)
    const far: { key: string; bridges?: { id: number; ring: number[] }[] } = { key: '50,50' }
    addRailDecks(far)
    expect(far.bridges).toBeUndefined()
    RAIL_DECKS.pop()
  })
})
