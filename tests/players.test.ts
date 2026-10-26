/**
 * The games on the courts (sim/players.ts): a tennis rally and a basketball pickup game, run headless for a few
 * minutes on courts of several sizes. What is checked is what a rider would see go wrong: a player off the court or
 * moving faster than anyone can, a ball underground or stuck, a rally in which the ball never crosses the net, a
 * basketball game in which nobody ever shoots.
 */
import { describe, expect, it } from 'vitest'
import type { PackedCourt } from '../src/city/package.ts'
import { CourtPlayers } from '../src/sim/players.ts'

const DT = 1 / 60

/** the court's frame: world → (u along, v across) */
const local = (c: PackedCourt, p: { x: number; z: number }): { u: number; v: number } => {
  const dx = p.x - c.x, dz = p.z - c.z
  return { u: Math.cos(c.heading) * dx + Math.sin(c.heading) * dz, v: -Math.sin(c.heading) * dx + Math.cos(c.heading) * dz }
}

/** Runs a court for `seconds`, with a rider standing beside it, and gathers what happened. */
function run(c: PackedCourt, seconds: number) {
  const sim = new CourtPlayers()
  const rider = { x: c.x + 20, z: c.z }
  let maxSpeed = 0, maxU = 0, maxV = 0, nan = false, ballMaxY = 0, ballMinY = Infinity
  let players = 0
  let crossings = 0
  let lastSide = 0
  const ballU: number[] = []
  let frames = 0
  for (let t = 0; t < seconds; t += DT) {
    const ws = sim.update(DT, rider, [c])
    frames++
    players = ws.length
    for (const w of ws) {
      if (!Number.isFinite(w.at.x) || !Number.isFinite(w.at.z) || !Number.isFinite(w.heading)) nan = true
      maxSpeed = Math.max(maxSpeed, w.speed)
      const l = local(c, w.at)
      maxU = Math.max(maxU, Math.abs(l.u))
      maxV = Math.max(maxV, Math.abs(l.v))
    }
    for (const b of sim.balls) {
      if (!Number.isFinite(b.x) || !Number.isFinite(b.z) || !Number.isFinite(b.y)) nan = true
      ballMaxY = Math.max(ballMaxY, b.y)
      ballMinY = Math.min(ballMinY, b.y)
      const l = local(c, b)
      ballU.push(l.u)
      const side = Math.sign(l.u)
      if (side !== 0 && lastSide !== 0 && side !== lastSide) crossings++
      if (side !== 0) lastSide = side
    }
  }
  return { players, maxSpeed, maxU, maxV, nan, ballMaxY, ballMinY, crossings, ballU, frames, balls: sim.balls.length }
}

/** the first seed that gives this court players (one court in four is deliberately empty) */
const busy = (make: (x: number) => PackedCourt): PackedCourt => {
  for (let x = 100; x < 5000; x += 37) {
    const c = make(x)
    if (new CourtPlayers().update(DT, { x: c.x, z: c.z }, [c]).length > 0) return c
  }
  throw new Error('no busy court')
}

describe('a tennis rally', () => {
  const courts = [
    busy((x) => ({ sport: 'tennis', x, z: 300, heading: 0.7, len: 23.77, wid: 10.97 })),
    busy((x) => ({ sport: 'tennis', x, z: -800, heading: -1.9, len: 23.77, wid: 10.97 })),
    busy((x) => ({ sport: 'pickleball', x, z: 1200, heading: 2.4, len: 13.41, wid: 6.1 })),
    busy((x) => ({ sport: 'tennis', x, z: 40, heading: 0.1, len: 18, wid: 8.3 })),   // a shrunk court
  ]
  for (const c of courts) {
    it(`${c.sport} ${c.len} m: the ball goes over the net and back, and everyone keeps to the court`, () => {
      const got = run(c, 150)
      expect(got.nan).toBe(false)
      expect(got.players).toBeGreaterThanOrEqual(2)
      expect(got.players).toBeLessThanOrEqual(4)
      expect(got.balls).toBe(1)
      // a sprint, not a teleport: the first frame's jump from the court's centre was the bug to catch
      expect(got.maxSpeed).toBeLessThan(7.5)
      expect(got.maxU).toBeLessThan(c.len / 2 + 2.5)
      expect(got.maxV).toBeLessThan(c.wid / 2 + 2.0)
      // a rally: the ball crosses the net many times in two and a half minutes
      expect(got.crossings).toBeGreaterThan(12)
      expect(got.ballMinY).toBeGreaterThanOrEqual(0)
      expect(got.ballMaxY).toBeGreaterThan(1.5)      // a toss or a lob at least
      expect(got.ballMaxY).toBeLessThan(9)
    })
  }
})

describe('a basketball pickup game', () => {
  const courts = [
    busy((x) => ({ sport: 'basketball', x, z: 300, heading: 0.3, len: 28, wid: 15 })),
    busy((x) => ({ sport: 'basketball', x, z: -300, heading: 1.3, len: 14, wid: 15.2, half: true })),
    busy((x) => ({ sport: 'basketball', x, z: 900, heading: -0.4, len: 8.5, wid: 9.3, half: true })),   // a tiny park court
    busy((x) => ({ sport: 'basketball', x, z: 1900, heading: 2.9, len: 25.6, wid: 15.2 })),
  ]
  for (const c of courts) {
    it(`${c.len} x ${c.wid}${c.half ? ' half' : ''}: shots go up, the ball stays in play, everyone keeps to the court`, () => {
      const got = run(c, 150)
      expect(got.nan).toBe(false)
      expect(got.players).toBeGreaterThanOrEqual(4)
      expect(got.players).toBeLessThanOrEqual(8)
      expect(got.players % 2).toBe(0)
      expect(got.balls).toBe(1)
      expect(got.maxSpeed).toBeLessThan(7.5)
      expect(got.maxU).toBeLessThan(c.len / 2 + 0.5)
      expect(got.maxV).toBeLessThan(c.wid / 2 + 0.5)
      // a shot reaches the rim (3.05 m) and goes over it
      expect(got.ballMaxY).toBeGreaterThan(3.2)
      expect(got.ballMaxY).toBeLessThan(7)
      expect(got.ballMinY).toBeGreaterThanOrEqual(0)
      // the ball moves about: not stuck with one player
      const spread = Math.max(...got.ballU) - Math.min(...got.ballU)
      expect(spread).toBeGreaterThan(Math.min(c.len * 0.4, 6))
    })
  }
  it('a full court changes ends: the ball is played at both hoops over time', () => {
    const c = busy((x) => ({ sport: 'basketball', x, z: 300, heading: 0.3, len: 28, wid: 15 }))
    const got = run(c, 400)
    expect(Math.max(...got.ballU)).toBeGreaterThan(8)
    expect(Math.min(...got.ballU)).toBeLessThan(-8)
  })
})

describe('the other courts', () => {
  it('keep their wander, with a stride that never freezes', () => {
    const c = busy((x) => ({ sport: 'volleyball', x, z: 300, heading: 0.3, len: 18, wid: 9 }))
    const got = run(c, 20)
    expect(got.nan).toBe(false)
    expect(got.players).toBeGreaterThan(0)
    expect(got.balls).toBe(0)
    expect(got.maxSpeed).toBeLessThan(6)
  })
  it('a court the rider has left loses its players', () => {
    const sim = new CourtPlayers()
    const c: PackedCourt = { sport: 'tennis', x: 100, z: 100, heading: 0, len: 23.77, wid: 10.97 }
    sim.update(DT, { x: 100, z: 100 }, [c])
    expect(sim.update(DT, { x: 1000, z: 1000 }, [c])).toHaveLength(0)
    expect(sim.balls).toHaveLength(0)
  })
})
