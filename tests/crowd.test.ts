/**
 * The crowd walks forwards and stays on its own pavement.
 *
 * Both of these were broken in play and invisible in stills: walkers going against an edge's stored
 * direction faced backwards (half the crowd moonwalked), and a walker turning round at the end of an edge
 * jumped to the other side of the street, because the pavement offset was measured from the direction of
 * travel rather than from the street.
 */
import { describe, expect, it } from 'vitest'
import { addEdges, buildGraph, type Edge } from '../src/city/graph.ts'
import { Crowd } from '../src/sim/crowd.ts'

function street(): ReturnType<typeof buildGraph> {
  const e: Edge = {
    id: 1, a: 0, b: 1, points: [{ x: 0, z: 0 }, { x: 0, z: 60 }], length: 60,
    surface: 'asphalt', width: 7, walk: 2, foot: false, name: 'Test St',
  }
  return buildGraph([e])
}

describe('the crowd', () => {
  it('leaves the median of a dual carriageway empty (owner, 2026-10-26: "tons of pedestrians in the middle of the street")', () => {
    // two one-way carriageways 14 m apart: each has a kerb on its outer side and the median on its inner side
    const mk = (id: number, x: number): Edge => ({
      id, a: id * 2, b: id * 2 + 1, points: [{ x, z: 0 }, { x, z: 120 }], length: 120,
      surface: 'asphalt', width: 7, walk: 2, foot: false, name: 'Wide Blvd', oneway: true,
    } as Edge)
    const g = buildGraph([mk(1, 0), mk(2, 14)])
    const crowd = new Crowd(g, 'busy')
    const near = [...g.edges.values()]
    crowd.update(0.01, { x: 7, z: 60 }, near)
    crowd.update(0.1, { x: 7, z: 60 }, near)
    const walkers = crowd.all.filter((w) => w.kind !== 'cycle')
    expect(walkers.length).toBeGreaterThan(10)
    for (const w of walkers) {
      expect(w.at.x < 0 || w.at.x > 14, `walker ${w.id} at x ${w.at.x.toFixed(1)} is on the median`).toBe(true)
    }
    // …and a street on its own still has people on both of its pavements
    const g1 = buildGraph([mk(3, 0)])
    const c1 = new Crowd(g1, 'busy')
    const n1 = [...g1.edges.values()]
    c1.update(0.01, { x: 0, z: 60 }, n1)
    c1.update(0.1, { x: 0, z: 60 }, n1)
    const xs = c1.all.filter((w) => w.kind !== 'cycle').map((w) => w.at.x)
    expect(xs.some((x) => x < 0) && xs.some((x) => x > 0)).toBe(true)
  })

  it('knows a median in streets loaded after the crowd began (owner, 2026-10-27: "still far too many NPCs walking in the middle of the street")', () => {
    // the game's graph grows tile by tile: the crowd is first asked about a street somewhere else, then the boulevard comes in
    // (280 m long, the rider halfway: after the first frame people are only made beyond where they are drawn)
    const mk = (id: number, x: number, z0 = 0): Edge => ({
      id, a: id * 2, b: id * 2 + 1, points: [{ x, z: z0 }, { x, z: z0 + 280 }], length: 280,
      surface: 'asphalt', width: 7, walk: 2, foot: false, name: 'Wide Blvd', oneway: true,
    } as Edge)
    const g = buildGraph([mk(9, 2000, 2000)])
    const crowd = new Crowd(g, 'busy')
    crowd.update(0.01, { x: 2000, z: 2140 }, [...g.edges.values()])
    addEdges(g, [mk(1, 0), mk(2, 14)])
    const near = [g.edges.get(1)!, g.edges.get(2)!]
    crowd.update(0.1, { x: 7, z: 140 }, near)
    const walkers = crowd.all.filter((w) => w.kind !== 'cycle' && w.edgeId !== 9)
    expect(walkers.length).toBeGreaterThan(10)
    for (const w of walkers) expect(w.at.x < 0 || w.at.x > 14, `walker ${w.id} at x ${w.at.x.toFixed(1)} is on the median`).toBe(true)
  })

  it('does not walk on from a street onto the median where it splits into two carriageways', () => {
    // a two-way street (z −60…0) splits at the origin into two one-way carriageways 14 m apart: walkers on its pavements
    // carry on along the outer kerbs, and the ones that would have come out on the inner side turn back
    const e = (id: number, a: number, b: number, pts: { x: number; z: number }[], width = 7): Edge => ({
      id, a, b, points: pts, length: pts.slice(1).reduce((s, p, i) => s + Math.hypot(p.x - pts[i].x, p.z - pts[i].z), 0),
      surface: 'asphalt', width, walk: 2, foot: false, name: 'Wide Blvd',
    } as Edge)
    const g = buildGraph([
      e(1, 10, 11, [{ x: 7, z: -60 }, { x: 7, z: 0 }], 12),
      e(2, 11, 12, [{ x: 7, z: 0 }, { x: 0, z: 10 }, { x: 0, z: 140 }]),
      e(3, 11, 13, [{ x: 7, z: 0 }, { x: 14, z: 10 }, { x: 14, z: 140 }]),
    ])
    const crowd = new Crowd(g, 'busy')
    const near = [g.edges.get(1)!]
    crowd.update(0.01, { x: 7, z: -30 }, near)
    for (let k = 0; k < 600; k++) {
      crowd.update(0.1, { x: 7, z: -30 }, near)
      for (const w of crowd.all) {
        if (w.kind === 'cycle' || w.at.z < 30 || w.at.z > 120) continue
        expect(w.at.x < 0 || w.at.x > 14, `walker ${w.id} at x ${w.at.x.toFixed(1)}, z ${w.at.z.toFixed(0)} is on the median`).toBe(true)
      }
    }
  })

  it('faces the way it walks, in both directions along a street', () => {
    const g = street()
    const crowd = new Crowd(g, 'busy')
    const near = [...g.edges.values()]
    crowd.update(0.01, { x: 0, z: 30 }, near)
    expect(crowd.all.length).toBeGreaterThan(0)
    let checked = 0
    for (let step = 0; step < 40; step++) {
      const before = crowd.all.map((w) => ({ id: w.id, x: w.at.x, z: w.at.z, dir: w.dir }))
      crowd.update(0.1, { x: 0, z: 30 }, near)
      for (const w of crowd.all) {
        const b = before.find((q) => q.id === w.id)
        // only mid-street, where nobody turned round this step
        if (!b || b.dir !== w.dir) continue
        const dx = w.at.x - b.x
        const dz = w.at.z - b.z
        if (Math.hypot(dx, dz) < 1e-6) continue
        const along = Math.sin(w.heading) * dx + Math.cos(w.heading) * dz
        expect(along, `walker ${w.id} going ${w.dir > 0 ? 'a→b' : 'b→a'}`).toBeGreaterThan(0)
        checked++
      }
    }
    expect(checked).toBeGreaterThan(20)
  })

  it('keeps each walker on the same pavement when they turn round', () => {
    const g = street()
    const crowd = new Crowd(g, 'busy')
    const near = [...g.edges.values()]
    crowd.update(0.01, { x: 0, z: 30 }, near)
    const side = new Map(crowd.all.map((w) => [w.id, Math.sign(w.at.x)]))
    // long enough that everybody reaches an end of a 60 m street and turns round at least once
    for (let step = 0; step < 900; step++) crowd.update(0.1, { x: 0, z: 30 }, near)
    for (const w of crowd.all) {
      if (!side.has(w.id)) continue
      expect(Math.sign(w.at.x), `walker ${w.id}`).toBe(side.get(w.id))
    }
  })

  it('does not pile up copies on a long street while the rider stands still', () => {
    const e: Edge = {
      id: 7, a: 0, b: 1, points: [{ x: 0, z: 0 }, { x: 0, z: 900 }], length: 900,
      surface: 'asphalt', width: 7, walk: 3, foot: false, name: 'Promenade',
    }
    const g = buildGraph([e])
    const crowd = new Crowd(g, 'busy')
    const near = [...g.edges.values()]
    crowd.update(0.01, { x: 0, z: 100 }, near)
    const start = crowd.all.length
    // five simulated minutes: walkers reach the far end and beyond the range many times over
    for (let step = 0; step < 3000; step++) crowd.update(0.1, { x: 0, z: 100 }, near)
    expect(crowd.all.length).toBeLessThanOrEqual(start)
    // and no two walkers standing in the same place
    const spots = new Set(crowd.all.map((w) => `${w.at.x.toFixed(2)},${w.at.z.toFixed(2)}`))
    expect(spots.size).toBe(crowd.all.length)
  })
})

describe('walking along the pavement, not across the road', () => {
  const road = (id: number, a: number, b: number, pts: [number, number][], name = 'Main St'): Edge => {
    const points = pts.map(([x, z]) => ({ x, z }))
    let length = 0
    for (let i = 1; i < points.length; i++) length += Math.hypot(points[i].x - points[i - 1].x, points[i].z - points[i - 1].z)
    return { id, a, b, points, length, surface: 'asphalt', width: 7, walk: 2, foot: false, name }
  }

  it('never puts anyone on a crossing, nor inside the carriageway of the street they are on', () => {
    // a T: a street running east–west, a stem going north, and a 10 m zebra footway across the stem
    const g = buildGraph([
      road(1, 0, 1, [[-80, 0], [0, 0]]), road(2, 1, 2, [[0, 0], [80, 0]]),
      road(3, 1, 3, [[0, 0], [0, 40]], 'Stem St'), road(4, 3, 4, [[0, 40], [0, 90]], 'Stem St'),
      { id: 5, a: 5, b: 6, points: [{ x: -5, z: 20 }, { x: 5, z: 20 }], length: 10, surface: 'concrete',
        width: 2.5, walk: 0, foot: true, crossing: true },
      // an untagged crossing: a short footway from one road to another
      { id: 6, a: 3, b: 7, points: [{ x: 0, z: 40 }, { x: 8, z: 40 }], length: 8, surface: 'concrete',
        width: 2, walk: 0, foot: true },
      road(7, 7, 8, [[8, 40], [8, 90]], 'Side St'),
    ])
    const crowd = new Crowd(g, 'busy')
    const near = [...g.edges.values()]
    for (let step = 0; step < 600; step++) {
      crowd.update(0.1, { x: 0, z: 20 }, near)
      for (const w of crowd.all) {
        expect(w.edgeId, 'nobody on a crossing').not.toBe(5)
        expect(w.edgeId, 'nobody on an untagged crossing').not.toBe(6)
        // cyclists ride in the road by design; everyone else is on the pavement
        if (w.kind === 'cycle') continue
        const e = g.edges.get(w.edgeId)!
        // distance from the centre line of THEIR edge
        let best = Infinity
        for (let i = 1; i < e.points.length; i++) {
          const p = e.points[i - 1]
          const q = e.points[i]
          const dx = q.x - p.x
          const dz = q.z - p.z
          const t = Math.max(0, Math.min(1, ((w.at.x - p.x) * dx + (w.at.z - p.z) * dz) / (dx * dx + dz * dz)))
          best = Math.min(best, Math.hypot(w.at.x - (p.x + dx * t), w.at.z - (p.z + dz * t)))
        }
        if (!e.foot) expect(best, `walker ${w.id} on edge ${e.id}`).toBeGreaterThanOrEqual(e.width / 2)
      }
    }
  })

  it('walks the length of a street made of several edges without turning round', () => {
    const g = buildGraph([
      road(1, 0, 1, [[0, 0], [0, 40]]), road(2, 2, 1, [[0, 80], [0, 40]]), road(3, 2, 3, [[0, 80], [0, 200]]),
    ])
    // the rider stands where all three streets stay in range, so nobody is retired with their street
    const crowd = new Crowd(g, 'busy')
    const near = [...g.edges.values()]
    crowd.update(0.01, { x: 0, z: 80 }, near)
    const starters = crowd.all.filter((w) => w.edgeId === 1 && w.dir === 1)
    expect(starters.length).toBeGreaterThan(0)
    const tracked = new Map(starters.map((w) => [w.id, { x: w.at.x, reached: false }]))
    for (let step = 0; step < 900; step++) {
      crowd.update(0.1, { x: 0, z: 80 }, near)
      for (const w of crowd.all) {
        const t = tracked.get(w.id)
        if (!t || t.reached) continue
        // walking north the whole way, on the same pavement
        expect(Math.sign(w.at.x), `walker ${w.id} stayed on their side`).toBe(Math.sign(t.x))
        if (w.edgeId === 3) t.reached = true
      }
    }
    expect([...tracked.values()].every((t) => t.reached), 'everyone started on the first edge reached the third').toBe(true)
  })
})

describe('strangers in company', () => {
  const road = (id: number, a: number, b: number, pts: [number, number][], name = 'Main St'): Edge => {
    const points = pts.map(([x, z]) => ({ x, z }))
    let length = 0
    for (let i = 1; i < points.length; i++) length += Math.hypot(points[i].x - points[i - 1].x, points[i].z - points[i - 1].z)
    return { id, a, b, points, length, surface: 'asphalt', width: 7, walk: 3, name, foot: false }
  }
  it('spawns mostly in groups, some running and cycling, and walkers in a group stay together', () => {
    const long = buildGraph([road(1, 0, 1, [[-150, 0], [-50, 0], [0, 0], [50, 0], [150, 0]])])
    const crowd = new Crowd(long, 'busy')
    const near = [...long.edges.values()]
    crowd.update(0.1, { x: 0, z: 0 }, near)
    const all = crowd.all
    const followers = all.filter((w) => w.leader !== undefined)
    const leaders = new Set(followers.map((w) => w.leader))
    const solos = all.filter((w) => w.kind === 'walk' && w.leader === undefined && !leaders.has(w.id))
    expect(followers.length + leaders.size).toBeGreaterThan(solos.length)
    expect(all.some((w) => w.kind === 'run')).toBe(true)
    for (let step = 0; step < 200; step++) crowd.update(0.1, { x: 0, z: 0 }, near)
    const byId = new Map(crowd.all.map((w) => [w.id, w]))
    for (const w of crowd.all) {
      const l = w.leader !== undefined ? byId.get(w.leader) : undefined
      if (l) expect(Math.hypot(w.at.x - l.at.x, w.at.z - l.at.z)).toBeLessThan(4)
    }
  })

  it('keeps walkers on the same pavement from walking through one another', () => {
    const long = buildGraph([road(1, 0, 1, [[-150, 0], [-50, 0], [0, 0], [50, 0], [150, 0]])])
    const crowd = new Crowd(long, 'busy')
    const near = [...long.edges.values()]
    let close = 0
    let pairs = 0
    for (let step = 0; step < 300; step++) {
      crowd.update(0.1, { x: 0, z: 0 }, near)
      if (step < 50) continue
      const lead = crowd.all.filter((w) => w.leader === undefined && w.kind !== 'cycle')
      for (let i = 0; i < lead.length; i++) {
        for (let j = i + 1; j < lead.length; j++) {
          pairs++
          if (Math.hypot(lead[i].at.x - lead[j].at.x, lead[i].at.z - lead[j].at.z) < 0.35) close++
        }
      }
    }
    // overlaps are rare events, not the norm
    expect(close / Math.max(1, pairs)).toBeLessThan(0.002)
  })
})

describe('strangers and the rider (BUGS.md #42)', () => {
  it('step out of the way of a rider coming down the middle of a path, or stop and wait', () => {
    const e: Edge = {
      id: 1, a: 0, b: 1, points: Array.from({ length: 9 }, (_, i) => ({ x: 0, z: i * 50 })), length: 400,
      surface: 'asphalt', width: 4, walk: 0, foot: true, name: 'Allée', kind: 'footway',
    } as Edge
    const g = buildGraph([e])
    const crowd = new Crowd(g, 'crowded')
    const near = [...g.edges.values()]
    // the crowd fills a street within its range of the rider: start near the middle
    let rz = 130
    crowd.update(0.01, { x: 0, z: rz }, near)
    expect(crowd.all.length).toBeGreaterThan(3)
    // the rider rides up the middle at 6 m/s; every walker the rider passes is either off the line or stopped
    let passes = 0
    let tooClose = 0
    for (let t = 0; t < 22; t += 0.05) {
      rz += 6 * 0.05
      const before = new Map(crowd.all.map((w) => [w.id, { ...w.at }]))
      crowd.update(0.05, { x: 0, z: rz }, near)
      for (const w of crowd.all) {
        if (w.kind === 'cycle') continue
        if (Math.abs(w.at.z - rz) > 0.8) continue
        passes++
        const b = before.get(w.id)
        const moving = b ? Math.hypot(w.at.x - b.x, w.at.z - b.z) > 0.01 : true
        if (Math.abs(w.at.x) < 0.7 && moving) tooClose++
      }
    }
    expect(passes).toBeGreaterThan(5)
    // hardly anyone walking into the rider's line as they pass
    expect(tooClose / passes).toBeLessThan(0.1)
  })

  it('step aside smoothly, not flickering between the sidestep and their own line (BUGS.md #49)', () => {
    const e: Edge = {
      id: 1, a: 0, b: 1, points: Array.from({ length: 9 }, (_, i) => ({ x: 0, z: i * 50 })), length: 400,
      surface: 'asphalt', width: 4, walk: 0, foot: true, name: 'Allée', kind: 'footway',
    } as Edge
    const g = buildGraph([e])
    const crowd = new Crowd(g, 'crowded')
    const near = [...g.edges.values()]
    let rz = 130
    crowd.update(0.01, { x: 0, z: rz }, near)
    // across the path, a walker moves no faster than a quick sidestep (3 m/s) — frame to frame, at 30 fps
    let worst = 0
    const dt = 1 / 30
    for (let t = 0; t < 20; t += dt) {
      rz += 6 * dt
      const before = new Map(crowd.all.map((w) => [w.id, w.at.x]))
      crowd.update(dt, { x: 0, z: rz }, near)
      for (const w of crowd.all) {
        const b = before.get(w.id)
        if (b !== undefined && w.kind !== 'cycle') worst = Math.max(worst, Math.abs(w.at.x - b))
      }
    }
    expect(worst).toBeLessThan(3 * dt + 1e-6)
  })
})
