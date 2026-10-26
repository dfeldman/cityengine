/**
 * PEOPLE PLAYING ON THE COURTS (owner, 2026-10-03: "people realistically playing sports at the sport courts. could just be
 * avatars in our athletic set that are going around on fixed paths, I don't think we need a ball or anything"; then
 * 2026-10-26: "let's make the tennis and basketball games more realistic. right now they just have players running
 * back and forth").
 *
 * For each court near the rider (city's `courtsNear`), a few players in athletic kit, as crowd `Walker`s (kind 'run', so
 * the same bodies and gaits as the runners). Each court runs ONE game, and the game moves the players, so what they do
 * hangs together: nobody runs anywhere the ball is not going.
 * - tennis, pickleball and padel: a RALLY. The ball is served, crosses the net, bounces, is hit back; the receiver runs
 *   to where it will bounce and recovers to the middle of the baseline between shots; now and then a player follows a
 *   short ball to the net and volleys, or is lobbed and chases back. Points end in the net, long, or with a ball nobody
 *   reaches; then everyone walks back, the server bounces the ball and serves again. Doubles when the court has four.
 * - basketball: a half-court PICKUP GAME, three or four a side. The team with the ball spreads to the wings and corners;
 *   the ball is dribbled, passed round, driven to the rim and shot; a make drops through the hoop, a miss comes off the
 *   rim and everyone crashes for the rebound; the other team takes it back out past the arc. On a full court the game
 *   changes ends after a score.
 * - volleyball: two to four a side, small steps near their spots;
 * - four square: four, one in each square, bouncing on the spot;
 * - a playground: two or three children running loops.
 * Deterministic per court (its position seeds it), so a court keeps its players while the rider is near.
 *
 * The ball IS drawn now (render/life.ts `balls`), oversize, as the court's lines are drawn wider than they are: a rally
 * without a ball is two people running back and forth, which was the owner's complaint. The bodies have only their
 * running stride, so nobody swings a racket or jumps; the game reads from where people go and when, and from the ball.
 * A body at speed 0 freezes mid-stride, so a player waiting is never still: they bounce on the spot with a floor under
 * the speed the body is played at.
 */
import type { PackedCourt } from '../city/package.ts'
import { dressed, rng, type Walker } from './crowd.ts'

const RANGE = 140

/** A ball in the air or on the ground: world x/z, `y` above the ground, drawn `d` across. */
export interface Ball { x: number; z: number; y: number; d: number; colour: [number, number, number] }

/** How fast a body is played at, at least: the stride never stops (a body frozen mid-stride is a mannequin). */
const IDLE_SPEED = 1.1

interface Game { update(dt: number): void; readonly walkers: Walker[]; readonly balls: Ball[] }

export class CourtPlayers {
  private readonly byCourt = new Map<string, Game>()
  private nextId = 2_000_000_000
  /** the balls of the games near the rider, as of the last `update` */
  readonly balls: Ball[] = []

  /** the players for the courts within range, moved on by `dt`; courts out of range lose theirs */
  update(dt: number, rider: { x: number; z: number }, courts: PackedCourt[]): Walker[] {
    const seen = new Set<string>()
    const out: Walker[] = []
    this.balls.length = 0
    // (a long frame is stepped in pieces: a ball that flies 20 m in a second cannot be integrated in one 0.5 s step)
    const steps = Math.max(1, Math.ceil(dt / 0.05))
    for (const c of courts) {
      if (Math.hypot(c.x - rider.x, c.z - rider.z) > RANGE) continue
      const key = `${Math.round(c.x * 10)},${Math.round(c.z * 10)}`
      seen.add(key)
      let g = this.byCourt.get(key)
      if (!g) { g = this.spawn(c); this.byCourt.set(key, g) }
      for (let i = 0; i < steps; i++) g.update(dt / steps)
      out.push(...g.walkers)
      this.balls.push(...g.balls)
    }
    for (const k of [...this.byCourt.keys()]) if (!seen.has(k)) this.byCourt.delete(k)
    return out
  }

  private spawn(c: PackedCourt): Game {
    const r = rng(Math.round(c.x * 31) ^ Math.imul(Math.round(c.z * 17), 0x9e3779b9))
    const ids = (): number => this.nextId++
    // (an empty court now and then: not every court is in use)
    if (r() < 0.25) return { update: () => {}, walkers: [], balls: [] }
    switch (c.sport) {
      case 'tennis': case 'pickleball': case 'padel': return new TennisGame(c, r, ids)
      case 'basketball': return new BasketballGame(c, r, ids)
      default: return new Wander(c, r, ids)
    }
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// the court's frame, and a player who can be sent somewhere

/** A court's own frame: `u` along its length from the centre, `v` across it. */
class Frame {
  constructor(readonly c: PackedCourt) {}
  world(u: number, v: number): { x: number; z: number } {
    const h = this.c.heading
    return { x: this.c.x + Math.cos(h) * u - Math.sin(h) * v, z: this.c.z + Math.sin(h) * u + Math.cos(h) * v }
  }
  /** a walker's yaw (0 = +z, clockwise) for the court direction (du, dv) */
  yaw(du: number, dv: number): number {
    const h = this.c.heading
    return Math.atan2(Math.cos(h) * du - Math.sin(h) * dv, Math.sin(h) * du + Math.cos(h) * dv)
  }
}

function makeWalker(id: number, c: PackedCourt, r: () => number, child = false): Walker {
  return {
    id, edgeId: -1, s: 0, dir: 1, side: 1, kind: 'run', speed: 0,
    height: child ? 0.62 + r() * 0.12 : 0.95 + r() * 0.15, phase: r() * Math.PI * 2,
    at: { x: c.x, z: c.z }, heading: 0, back: 0, across: 0, dodge: 0, ...dressed(r, true),
  }
}

/** A player on the court: where they are (court frame), where they are going, how fast they may get there. */
class Player {
  u: number
  v: number
  goalU: number
  goalV: number
  /** the top speed they go to the goal at (m/s) */
  vmax = 2.5
  /** where they look when not running: a court point, or none (face the way they move) */
  face: { u: number; v: number } | null = null
  /** their own bounce when waiting, so a court of players does not bob in step */
  private readonly bob: number
  private t = 0

  constructor(readonly w: Walker, readonly f: Frame, u: number, v: number, r: () => number) {
    this.u = this.goalU = u
    this.v = this.goalV = v
    this.bob = r() * Math.PI * 2
    this.t = r() * 10
    this.w.at = f.world(u, v)
  }

  go(u: number, v: number, vmax: number): void { this.goalU = u; this.goalV = v; this.vmax = vmax }
  dist(u: number, v: number): number { return Math.hypot(u - this.u, v - this.v) }
  get there(): boolean { return this.dist(this.goalU, this.goalV) < 0.15 }

  update(dt: number): void {
    this.t += dt
    const du = this.goalU - this.u, dv = this.goalV - this.v
    const d = Math.hypot(du, dv)
    const step = Math.min(d, this.vmax * dt)
    let moved = 0
    if (d > 1e-4) { this.u += (du / d) * step; this.v += (dv / d) * step; moved = step / Math.max(dt, 1e-6) }
    // on the spot: a small bounce on the toes, the way anyone waits for a ball
    let su = this.u, sv = this.v
    if (d < 0.5) {
      const b = Math.sin(this.t * 5.5 + this.bob) * 0.08
      su += b * 0.4; sv += b
    }
    const p = this.f.world(su, sv)
    const want = moved > 1.3 || !this.face ? (moved > 0.05 ? this.f.yaw(du, dv) : this.w.heading)
      : this.f.yaw(this.face.u - this.u, this.face.v - this.v)
    // turned smoothly: a player who flips 180° in a frame is the old back-and-forth
    let diff = want - this.w.heading
    diff = Math.atan2(Math.sin(diff), Math.cos(diff))
    this.w.heading += Math.sign(diff) * Math.min(Math.abs(diff), 9 * dt)
    this.w.at = { x: p.x, z: p.z }
    this.w.speed = Math.max(moved, IDLE_SPEED)
    this.w.phase += dt * this.w.speed * 3.2
  }
}

/** A ball flying from `a` to `b` along a parabola `apex` above the straight line between them, over `T` seconds. */
class Flight {
  t = 0
  constructor(readonly a: { u: number; v: number; y: number }, readonly b: { u: number; v: number; y: number },
              readonly T: number, readonly apex: number) {}
  get done(): boolean { return this.t >= this.T }
  at(): { u: number; v: number; y: number } {
    const s = Math.min(1, this.t / this.T)
    return { u: this.a.u + (this.b.u - this.a.u) * s, v: this.a.v + (this.b.v - this.a.v) * s,
      y: this.a.y + (this.b.y - this.a.y) * s + 4 * this.apex * s * (1 - s) }
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// the small games, as they were: a wander about a spot

class Wander implements Game {
  readonly walkers: Walker[] = []
  readonly balls: Ball[] = []
  private readonly ps: { w: Walker; spot: [number, number]; amp: [number, number]; rate: number; t: number }[] = []
  private readonly f: Frame

  constructor(c: PackedCourt, r: () => number, ids: () => number) {
    this.f = new Frame(c)
    const L = c.len / 2, W = c.wid / 2
    const spots: { spot: [number, number]; amp: [number, number]; rate: number; child?: boolean }[] = []
    switch (c.sport) {
      case 'american_football': {
        // a practice: two lines facing each other near midfield, and a few running routes downfield
        const n = 6 + Math.floor(r() * 6)
        for (let k = 0; k < n; k++) {
          const side = k % 2 ? 1 : -1
          spots.push({ spot: [side * (2 + r() * 3), (r() - 0.5) * W * 1.1], amp: [k % 3 === 0 ? L * 0.35 : 1.5, k % 3 === 0 ? W * 0.3 : 1.5], rate: 0.5 + r() * 0.6 })
        }
        break
      }
      case 'volleyball': {
        const n = 2 + Math.floor(r() * 3)
        for (const side of [-1, 1]) for (let k = 0; k < n; k++) {
          spots.push({ spot: [side * L * (0.3 + 0.35 * (k % 2)), (k / Math.max(1, n - 1) - 0.5) * W * 1.2], amp: [1, 1.2], rate: 0.8 + r() * 0.6 })
        }
        break
      }
      case 'four_square': {
        for (const [a, b] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) spots.push({ spot: [a * L * 0.5, b * W * 0.5], amp: [0.6, 0.6], rate: 1.2 + r() * 0.6, child: r() < 0.6 })
        break
      }
      case 'playground': {
        const n = 2 + Math.floor(r() * 2)
        for (let k = 0; k < n; k++) spots.push({ spot: [(r() - 0.5) * L, (r() - 0.5) * W], amp: [L * 0.4, W * 0.4], rate: 0.5 + r() * 0.4, child: true })
        break
      }
    }
    for (const s of spots) {
      const w = makeWalker(ids(), c, r, s.child)
      const p = { w, spot: s.spot, amp: s.amp, rate: s.rate, t: r() * 100 }
      w.at = this.f.world(s.spot[0] + Math.sin(p.t * 0.7) * s.amp[0], s.spot[1] + Math.sin(p.t * 1.3 + 1.1) * s.amp[1])
      this.ps.push(p)
      this.walkers.push(w)
    }
  }

  update(dt: number): void {
    for (const p of this.ps) {
      p.t += dt * p.rate
      // a Lissajous wander about the spot
      const at = this.f.world(p.spot[0] + Math.sin(p.t * 0.7) * p.amp[0], p.spot[1] + Math.sin(p.t * 1.3 + 1.1) * p.amp[1])
      const dx = at.x - p.w.at.x, dz = at.z - p.w.at.z
      const step = Math.hypot(dx, dz)
      const speed = dt > 0 ? step / dt : 0
      if (step > 1e-3) p.w.heading = Math.atan2(dx, dz)
      p.w.at = at
      p.w.speed = Math.max(speed, IDLE_SPEED)
      p.w.phase += dt * p.w.speed * 3.2
    }
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// TENNIS (and pickleball, and padel): a rally

const TENNIS_BALL: [number, number, number] = [0.85, 0.95, 0.25]

class TennisGame implements Game {
  readonly walkers: Walker[] = []
  readonly balls: Ball[] = []
  private readonly f: Frame
  /** the published court this one is, scaled: 1 is full size */
  private readonly k: number
  /** the baseline, the net's height, the sideline the ball is kept inside (singles or doubles), the service line */
  private readonly L: number
  private readonly netH: number
  private readonly S: number
  private readonly svc: number
  private readonly players: (Player & { side: -1 | 1 })[]
  private readonly doubles: boolean
  private readonly ballD: number
  private readonly pace: number
  private ball: { u: number; v: number; y: number } = { u: 0, v: 0, y: 0 }
  private flight: Flight | null = null
  /** flight: the ball is going to `hitter`'s side; `hitter` is the player who will play it, or null for a ball nobody reaches */
  private hitter: (Player & { side: -1 | 1 }) | null = null
  private phase: 'serve' | 'toss' | 'flight' | 'bounce' | 'dead' | 'reset' = 'serve'
  private timer = 0
  private server: -1 | 1
  private points = 0
  /** shots in this point so far: the longer a rally, the likelier the next one is missed */
  private shots = 0
  /** on a volley the ball is taken out of the air: no bounce leg */
  private volley = false

  constructor(c: PackedCourt, private readonly r: () => number, ids: () => number) {
    this.f = new Frame(c)
    const full = c.sport === 'tennis' ? 23.77 : c.sport === 'padel' ? 20 : 13.41
    this.k = c.len / full
    this.L = c.len / 2
    this.doubles = c.sport === 'padel' || c.wid > 9 && r() < 0.4 || c.sport === 'pickleball' && r() < 0.5
    this.S = c.sport === 'tennis' ? (this.doubles ? 5.485 : 4.115) * this.k : c.wid / 2
    this.netH = (c.sport === 'tennis' ? 0.914 : c.sport === 'padel' ? 0.88 : 0.864) * this.k
    this.svc = (c.sport === 'tennis' ? 6.4 : c.sport === 'padel' ? 6.95 : 2.13) * this.k
    this.ballD = c.sport === 'tennis' ? 0.16 : 0.18
    // the ball's pace: a tennis groundstroke crosses the court in about a second; the small courts are slower games
    this.pace = c.sport === 'tennis' ? 15 + r() * 4 : 9 + r() * 2
    this.server = r() < 0.5 ? -1 : 1
    this.players = []
    for (const side of [-1, 1] as const) {
      const n = this.doubles ? 2 : 1
      for (let i = 0; i < n; i++) {
        const w = makeWalker(ids(), c, r)
        const p = Object.assign(new Player(w, this.f, side * (this.L + 0.6), n === 1 ? 0 : (i ? 0.5 : -0.5) * this.S, r), { side })
        this.players.push(p)
        this.walkers.push(w)
      }
    }
    this.toServe()
    this.timer = 1 + r() * 2
  }

  private clampU(u: number): number { return Math.max(-this.L - 1.5, Math.min(this.L + 1.5, u)) }

  /** everyone to their places for the next point: the server behind the baseline, the receiver diagonally opposite */
  private toServe(): void {
    const deuce = this.points % 2 === 0 ? 1 : -1
    for (const p of this.players) {
      const serving = p.side === this.server
      const mate = this.players.find((q) => q !== p && q.side === p.side)
      const first = !mate || this.players.indexOf(p) < this.players.indexOf(mate)
      if (serving) {
        if (first) p.go(p.side * (this.L + 0.7), deuce * p.side * 0.4, 1.5)
        else p.go(p.side * this.L * 0.35, -deuce * p.side * this.S * 0.5, 1.5)
      } else if (first) p.go(p.side * (this.L + 0.3), deuce * p.side * this.S * 0.6, 1.5)
      else p.go(p.side * this.svc * 1.0, -deuce * p.side * this.S * 0.5, 1.5)
      p.face = { u: -p.side * this.L, v: p.v }
    }
    this.phase = 'reset'
    this.timer = 0
  }

  /** the player who will take a ball arriving at (u, v) on `side`: the nearer one, in doubles */
  private taker(side: -1 | 1, u: number, v: number): Player & { side: -1 | 1 } {
    let best = this.players[0], bd = Infinity
    for (const p of this.players) {
      if (p.side !== side) continue
      const d = p.dist(u, v)
      if (d < bd) { bd = d; best = p }
    }
    return best
  }

  /** a shot from the ball's position toward `side`'s court; the point ends on an error now and then */
  private hit(side: -1 | 1, kind: 'serve' | 'ground' | 'lob' | 'volley'): void {
    const r = this.r
    const from = { ...this.ball }
    this.shots++
    // where it lands: a serve into the service box, a groundstroke deep, a lob deeper still
    let land: { u: number; v: number }
    if (kind === 'serve') {
      const deuce = this.points % 2 === 0 ? 1 : -1
      land = { u: side * this.svc * (0.6 + r() * 0.35), v: deuce * side * this.S * 0.6 * (0.2 + r() * 0.8) }
    } else {
      land = { u: side * this.L * (kind === 'lob' ? 0.8 + r() * 0.15 : 0.5 + r() * 0.45), v: (r() * 2 - 1) * this.S * 0.85 }
    }
    // the errors: into the net or long, one shot in eight (serves and lobs a little more)
    const err = r()
    const tired = Math.min(0.2, this.shots * 0.015)
    const netted = err < (kind === 'serve' ? 0.05 : 0.05 + tired / 2)
    const long = !netted && err < (kind === 'serve' ? 0.12 : kind === 'lob' ? 0.2 : 0.13 + tired)
    if (long) land.u = side * (this.L + 0.8 + r() * 2)
    const apexFor = kind === 'lob' ? 3.2 * Math.max(0.5, this.k) : kind === 'volley' ? 0.3 : 0.9 + r() * 0.6
    if (netted) {
      // dies at the net: a short flight that ends against the tape and drops
      const T = Math.hypot(from.u, land.v * 0.5 - from.v) / this.pace
      this.flight = new Flight(from, { u: 0, v: (from.v + land.v) / 2, y: this.netH * 0.8 }, Math.max(0.3, T), 0.2)
      this.hitter = null
      this.phase = 'flight'
      this.volley = false
      return
    }
    const dist = Math.hypot(land.u - from.u, land.v - from.v)
    const T = Math.max(0.35, dist / (kind === 'serve' ? this.pace * 1.5 : kind === 'lob' ? this.pace * 0.6 : this.pace))
    this.flight = new Flight(from, { ...land, y: 0 }, T, apexFor)
    this.phase = 'flight'
    this.volley = false
    // the receiver: the nearer player on that side, sent to where it will bounce, a step behind it
    const dir = { u: land.u - from.u, v: land.v - from.v }
    const dl = Math.hypot(dir.u, dir.v) || 1
    // (a serve skids on deep after its bounce; a groundstroke sits up a step past where it lands)
    const past = (kind === 'serve' ? 3.5 : 1.6) * Math.min(1, this.k)
    const strike = { u: this.clampU(land.u + (dir.u / dl) * past), v: land.v + (dir.v / dl) * past }
    const p = this.taker(side, strike.u, strike.v)
    if (long) {
      // a ball going long: the receiver shapes to it, sees it out, and lets it go
      this.hitter = null
      p.go(this.clampU(p.side * this.L * 1.02), strike.v * 0.7, 3)
      p.face = { u: -side * this.L, v: p.v }
      return
    }
    // a volley: a player at the net takes it out of the air there, the ball is aimed at them
    if (Math.abs(p.u) < this.L * 0.5 && kind !== 'lob' && r() < 0.7) {
      this.volley = true
      this.flight = new Flight(from, { u: p.u, v: p.v + (r() - 0.5) * 2, y: 1.0 }, Math.max(0.3, Math.hypot(p.u - from.u, p.v - from.v) / this.pace), 0.5)
      strike.u = this.flight.b.u; strike.v = this.flight.b.v
    }
    this.hitter = p
    // (a sprint if it is far, otherwise just moving)
    const need = p.dist(strike.u, strike.v) / (T + 0.35)
    p.go(strike.u, strike.v, Math.min(6.5, Math.max(2.5, need * 1.15)))
    p.face = { u: -side * this.L, v: p.v }
    // the hitter recovers: back to the middle of the baseline, or follows a short ball in to the net
    for (const q of this.players) {
      if (q === p || q.side === side) continue
      const wasMe = kind !== 'serve' && q.dist(from.u, from.v) < 1.5
      if (wasMe && Math.abs(land.u) < this.L * 0.7 && r() < 0.25) q.go(q.side * this.L * 0.3, q.v * 0.5, 3.5)
      else if (wasMe || q.dist(q.goalU, q.goalV) < 0.3) {
        const mate = this.players.find((o) => o !== q && o.side === q.side)
        const home = mate ? (Math.abs(q.u) < Math.abs(mate.u) ? q.side * this.L * 0.35 : q.side * (this.L + 0.5)) : q.side * (this.L + 0.5)
        const homeV = mate ? (q.v < mate.v ? -0.5 : 0.5) * this.S : 0
        if (Math.abs(q.u) >= this.L * 0.5 || !mate) q.go(home, homeV, 2.5)
      }
      q.face = { u: -q.side * this.L, v: q.v }
    }
  }

  update(dt: number): void {
    const r = this.r
    this.timer -= dt
    switch (this.phase) {
      case 'reset':
        // everyone walks to their places; the ball is carried by the server
        if (this.players.every((p) => p.there) && this.timer <= 0) { this.phase = 'serve'; this.timer = 1.2 + r() * 1.8 }
        break
      case 'serve': {
        // the server bounces the ball, looks up, and tosses
        if (this.timer <= 0) {
          const s = this.players.find((p) => p.side === this.server && Math.abs(p.u) > this.L * 0.8)!
          this.ball = { u: s.u, v: s.v, y: 1.2 }
          this.flight = new Flight(this.ball, { u: s.u + s.side * 0.2, v: s.v, y: 2.7 }, 0.55, 0.0)
          this.phase = 'toss'
        }
        break
      }
      case 'toss':
        this.flight!.t += dt
        if (this.flight!.done) {
          this.ball = { ...this.flight!.b, y: 2.6 }
          this.hit((-this.server) as -1 | 1, 'serve')
        }
        break
      case 'flight': {
        const fl = this.flight!
        fl.t += dt
        if (!fl.done) break
        if (!this.hitter) { this.endPoint(); break }
        if (this.volley) { this.strike(); break }
        // the bounce: a short low hop on to the hitter's racket
        const to = { u: this.hitter.goalU, v: this.hitter.goalV, y: 1.0 }
        this.flight = new Flight({ ...fl.b }, to, 0.3 + 0.15 * Math.min(1, this.k), 0.25)
        this.phase = 'bounce'
        break
      }
      case 'bounce':
        this.flight!.t += dt
        if (this.flight!.done) {
          const p = this.hitter!
          if (p.dist(this.flight!.b.u, this.flight!.b.v) < 1.3) this.strike()
          else {
            // not reached: the ball runs on past them and the point is over
            const fl = this.flight!
            const du = fl.b.u - fl.a.u, dv = fl.b.v - fl.a.v
            this.flight = new Flight({ ...fl.b }, { u: this.clampU(fl.b.u + du * 2.5), v: fl.b.v + dv * 2.5, y: 0 }, 0.6, 0.1)
            this.hitter = null
            this.phase = 'flight'
          }
        }
        break
      case 'dead':
        if (this.timer <= 0) { this.points++; if (this.points % 4 === 0) this.server = (-this.server) as -1 | 1; this.toServe() }
        break
    }
    // the ball, where it is
    if (this.flight && (this.phase === 'flight' || this.phase === 'bounce' || this.phase === 'toss')) this.ball = this.flight.at()
    else if (this.flight && this.phase === 'dead') { this.flight.t += dt; this.ball = this.flight.at() }
    else if (this.phase === 'serve' || this.phase === 'reset') {
      const s = this.players.find((p) => p.side === this.server && Math.abs(p.goalU) > this.L * 0.8)!
      // in the server's hand, bounced on the ground while they wait
      const bounce = this.phase === 'serve' ? Math.abs(Math.sin(this.timer * 4.5)) * 0.9 : 0.9
      this.ball = { u: s.u + s.side * 0.15, v: s.v + 0.3, y: bounce }
    }
    for (const p of this.players) p.update(dt)
    const w = this.f.world(this.ball.u, this.ball.v)
    this.balls.length = 0
    this.balls.push({ x: w.x, z: w.z, y: Math.max(0.07, this.ball.y) + this.ballD / 2, d: this.ballD, colour: TENNIS_BALL })
  }

  /** the hitter plays the ball back; the rally goes on, or they come to the net */
  private strike(): void {
    const p = this.hitter!
    this.ball = { u: p.u, v: p.v, y: 1.0 }
    const r = this.r
    // the other side has someone at the net: lob them one time in three
    const netMan = this.players.some((q) => q.side !== p.side && Math.abs(q.u) < this.L * 0.5)
    const kind = Math.abs(p.u) < this.L * 0.5 ? 'volley' : netMan && r() < 0.35 ? 'lob' : 'ground'
    this.hit((-p.side) as -1 | 1, kind)
  }

  private endPoint(): void {
    this.phase = 'dead'
    this.timer = 1.5 + this.r() * 1.5
    this.shots = 0
    // a ball that died at the net drops to the ground there
    if (this.ball.y > 0.05) this.flight = new Flight({ ...this.ball }, { u: this.ball.u, v: this.ball.v, y: 0 }, 0.3, 0)
    else this.flight = null
    // everyone eases up
    for (const p of this.players) { p.go(p.u, p.v, 1.5); p.face = { u: -p.side * this.L, v: p.v } }
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// BASKETBALL: a pickup game at one hoop

const BASKETBALL: [number, number, number] = [0.80, 0.38, 0.14]
const RIM_Y = 3.05

type BPlayer = Player & { team: 0 | 1; spot: number; mark?: BPlayer; cutT: number }

class BasketballGame implements Game {
  readonly walkers: Walker[] = []
  readonly balls: Ball[] = []
  private readonly f: Frame
  private readonly k: number
  private readonly L: number
  private readonly W: number
  private readonly players: BPlayer[] = []
  /** the end being played at: the rim is at u = end * (L − 0.3) */
  private end: -1 | 1
  private offence: 0 | 1 = 0
  private holder: BPlayer | null = null
  private ball: { u: number; v: number; y: number }
  private flight: Flight | null = null
  private phase: 'check' | 'pass' | 'drive' | 'shoot' | 'made' | 'miss' | 'loose' | 'bringup' | 'transition' = 'bringup'
  private timer = 0
  private target: BPlayer | null = null
  private dribbleT = 0
  /** the ball is loose after a score: only the team that was defending takes it */
  private scored = false

  constructor(c: PackedCourt, private readonly r: () => number, ids: () => number) {
    this.f = new Frame(c)
    this.k = c.wid / 15
    this.L = c.len / 2
    this.W = c.wid / 2
    this.end = c.half ? 1 : r() < 0.5 ? 1 : -1
    const perSide = c.wid >= 13 && c.len >= 24 ? 4 : c.wid < 8 ? 2 : 3
    // a team wears one colour, the other another: shirts against shirts, as a pickup game sorts itself
    const tops = ['#1f6bff', '#e03131', '#ffd42a', '#12a874', '#ffffff', '#111111']
    const a = Math.floor(r() * tops.length)
    const b = (a + 1 + Math.floor(r() * (tops.length - 1))) % tops.length
    for (const team of [0, 1] as const) {
      for (let i = 0; i < perSide; i++) {
        const w = makeWalker(ids(), c, r)
        const hex = tops[team ? b : a]
        w.look = { ...w.look, top: hex }
        w.shirt = [parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255]
        const p = Object.assign(new Player(w, this.f, 0, 0, r), { team, spot: i, cutT: 2 + r() * 4 })
        this.players.push(p)
        this.walkers.push(w)
      }
    }
    // the first possession is brought up from the top
    const off = this.players.filter((p) => p.team === this.offence)
    for (const p of this.players) { const s = this.spotFor(p); p.u = p.goalU = s.u; p.v = p.goalV = s.v; p.w.at = this.f.world(s.u, s.v) }
    this.holder = off[0]
    this.ball = { u: this.holder.u, v: this.holder.v, y: 1 }
    this.marks()
    this.bringUp()
  }

  private get rim(): { u: number; v: number } { return { u: this.end * (this.L - 0.3), v: 0 } }

  private clamp(u: number, v: number): { u: number; v: number } {
    return { u: Math.max(-this.L + 0.4, Math.min(this.L - 0.4, u)), v: Math.max(-this.W + 0.3, Math.min(this.W - 0.3, v)) }
  }

  /** an attacker's home: the top of the key, the wings, the corners; a defender's: between their mark and the rim */
  private spotFor(p: BPlayer): { u: number; v: number } {
    const rim = this.rim
    const k = this.k
    if (p.team === this.offence) {
      const n = this.players.length / 2
      // top, left wing, right wing, left corner, right corner — the positions go round as the team moves
      const homes = [[7.2, 0], [5.6, -4.6], [5.6, 4.6], [1.2, -6.4], [1.2, 6.4]]
      const h = homes[p.spot % Math.max(n, 3)]
      return this.clamp(rim.u - this.end * h[0] * k, h[1] * k)
    }
    const m = p.mark
    if (!m) return this.clamp(rim.u - this.end * 3 * k, 0)
    const du = rim.u - m.u, dv = rim.v - m.v
    const d = Math.hypot(du, dv) || 1
    const back = m === this.holder ? 1.0 : Math.min(1.6, d * 0.35)
    return this.clamp(m.u + (du / d) * back, m.v + (dv / d) * back)
  }

  private marks(): void {
    const off = this.players.filter((p) => p.team === this.offence)
    const def = this.players.filter((p) => p.team !== this.offence)
    def.forEach((d, i) => { d.mark = off[i % off.length] })
    off.forEach((o) => { o.mark = undefined })
  }

  /** the ball goes out to the top of the key and the possession starts */
  private bringUp(): void {
    this.phase = 'bringup'
    const off = this.players.filter((p) => p.team === this.offence)
    for (const p of off) { const s = this.spotFor(p); p.go(s.u, s.v, p === this.holder ? 3.0 : 3.5); p.face = this.rim }
    this.timer = 0
  }

  private flyBall(to: { u: number; v: number; y: number }, speed: number, apex: number): void {
    const d = Math.hypot(to.u - this.ball.u, to.v - this.ball.v, to.y - this.ball.y)
    this.flight = new Flight({ ...this.ball }, to, Math.max(0.25, d / speed), apex)
  }

  private shoot(): void {
    const h = this.holder!
    const rim = this.rim
    const d = Math.hypot(rim.u - h.u, rim.v - h.v)
    const layup = d < 2.2 * this.k + 0.6
    const three = d > 6.75 * this.k
    this.ball = { u: h.u, v: h.v, y: layup ? 2.3 : 2.1 }
    this.flyBall({ ...rim, y: RIM_Y }, layup ? 6 : 7.5, layup ? 0.7 : 1.4 + d * 0.08)
    const make = this.r() < (layup ? 0.62 : three ? 0.34 : 0.44)
    this.phase = 'shoot'
    this.target = null
    this.timer = make ? 1 : 0
    this.holder = null
    // the shooter holds their follow-through; the others start toward the boards
    h.go(h.u, h.v, 1.5)
    for (const p of this.players) p.face = rim
  }

  private rebound(): void {
    const rim = this.rim
    const r = this.r
    // off the rim: a metre or three out into the court
    const ang = (r() - 0.5) * Math.PI * 1.2
    const dist = 1 + r() * 2.5 * Math.max(0.6, this.k)
    const to = this.clamp(rim.u - this.end * Math.cos(ang) * dist, rim.v + Math.sin(ang) * dist)
    this.ball = { ...rim, y: RIM_Y }
    this.flyBall({ ...to, y: 0 }, 5, 0.3)
    this.phase = 'miss'
    // everyone near crashes the boards
    for (const p of this.players) {
      if (p.dist(to.u, to.v) < 7) { p.go(to.u + (r() - 0.5) * 0.8, to.v + (r() - 0.5) * 0.8, 4.5 + r()); p.face = to }
    }
  }

  /** the ball is on the floor at (u, v): the nearest player picks it up */
  private pickUp(): void {
    let best: BPlayer | null = null, bd = Infinity
    for (const p of this.players) {
      if (this.scored && p.team === this.offence) continue
      const d = p.dist(this.ball.u, this.ball.v); if (d < bd) { bd = d; best = p }
    }
    const p = best!
    if (bd > 0.6) { p.go(this.ball.u, this.ball.v, this.scored ? 2.5 : 4); this.phase = 'loose'; return }
    this.holder = p
    this.ball = { u: p.u, v: p.v, y: 1 }
    this.scored = false
    if (p.team !== this.offence) this.turnover()
    else if (p.dist(this.rim.u, this.rim.v) < 2.5 * this.k && this.r() < 0.5) this.shoot()
    else { this.phase = 'drive'; this.driveOut(p) }
  }

  /** the ball changes hands: the other team takes it out, or, on a full court after a score, down the other end */
  private turnover(): void {
    this.offence = (1 - this.offence) as 0 | 1
    this.players.forEach((p) => { p.spot = (p.spot + 1) % 5 })
    this.marks()
    if (!this.f.c.half && this.r() < 0.6) {
      this.end = (-this.end) as -1 | 1
      this.phase = 'transition'
      for (const p of this.players) {
        const s = this.spotFor(p)
        // the defence runs back ahead of the ball; the offence jogs down
        p.go(s.u, s.v, p.team === this.offence ? (p === this.holder ? 3.5 : 4) : 5)
        p.face = this.rim
      }
      return
    }
    // past the arc: the holder dribbles the ball out to the top before the next possession
    this.bringUp()
  }

  /** the holder goes somewhere with the ball: to the rim, or round to another spot */
  private driveOut(p: BPlayer): void {
    const rim = this.rim
    const r = this.r
    if (r() < 0.45) {
      // a drive: at the rim from the side they are on
      const side = p.v === 0 ? (r() < 0.5 ? -1 : 1) : Math.sign(p.v)
      const to = this.clamp(rim.u - this.end * 1.1 * this.k, side * 0.9 * this.k)
      p.go(to.u, to.v, 4.2 + r())
    } else {
      const s = this.spotFor(p)
      p.go(s.u, s.v, 3)
    }
    p.face = null
    this.phase = 'drive'
  }

  update(dt: number): void {
    const r = this.r
    this.timer -= dt
    const rim = this.rim
    switch (this.phase) {
      case 'bringup': case 'transition':
        if (this.holder && this.holder.there) { this.phase = 'check'; this.timer = 0.8 + r() * 1.5 }
        break
      case 'check': {
        const h = this.holder!
        if (this.timer > 0) break
        const roll = r()
        const d = h.dist(rim.u, rim.v)
        if (roll < 0.45) {
          // a pass to a team-mate, mostly one who is open (not the one just passed from)
          const mates = this.players.filter((p) => p.team === this.offence && p !== h)
          const to = mates[Math.floor(r() * mates.length)]
          this.target = to
          to.go(to.u, to.v, 2)
          to.face = { u: h.u, v: h.v }
          this.ball = { u: h.u, v: h.v, y: 1.3 }
          this.flyBall({ u: to.u, v: to.v, y: 1.3 }, 9, 0.15)
          this.phase = 'pass'
          this.holder = null
          // the passer cuts, or drifts to the next spot
          if (r() < 0.35) { const c = this.clamp(rim.u - this.end * 1.5 * this.k, (r() - 0.5) * 3 * this.k); h.go(c.u, c.v, 4); h.cutT = 1.2 }
          else { h.spot = (h.spot + 2) % 5; const s = this.spotFor(h); h.go(s.u, s.v, 2.5) }
          h.face = rim
        } else if (roll < 0.8 || d > 8 * this.k) this.driveOut(h)
        else this.shoot()
        break
      }
      case 'pass':
        this.flight!.t += dt
        if (this.flight!.done) {
          const to = this.target!
          this.holder = to
          this.ball = { u: to.u, v: to.v, y: 1.2 }
          to.go(to.u, to.v, 2)
          to.face = rim
          this.phase = 'check'
          this.timer = 0.3 + r() * 1.2
          // the catcher shoots straight away one time in four, when in range
          if (to.dist(rim.u, rim.v) < 7.5 * this.k && r() < 0.25) this.shoot()
        }
        break
      case 'drive': {
        const h = this.holder!
        if (h.there) {
          if (h.dist(rim.u, rim.v) < 2.6 * this.k + 0.5) this.shoot()
          else { this.phase = 'check'; this.timer = 0.5 + r() * 1.2; h.face = rim }
        }
        break
      }
      case 'shoot':
        this.flight!.t += dt
        if (this.flight!.done) {
          if (this.timer > 0) {
            // through the net: straight down under the rim
            this.ball = { ...rim, y: RIM_Y }
            this.flyBall({ u: rim.u - this.end * 0.3, v: rim.v + (r() - 0.5) * 0.6, y: 0 }, 5, 0)
            this.phase = 'made'
            for (const p of this.players) if (p.team !== this.offence && p.dist(rim.u, rim.v) < 6) { p.go(rim.u - this.end * 0.8, rim.v + (r() - 0.5), 3); p.face = rim }
          } else this.rebound()
        }
        break
      case 'made': case 'miss':
        this.flight!.t += dt
        if (this.flight!.done) {
          if (this.phase === 'made') {
            // a score: the other team's ball — the nearest of them goes and gets it from under the hoop
            this.scored = true
            this.ball = { ...this.flight!.b }
            this.flight = null
            this.phase = 'loose'
          } else {
            // a bounce or two on the floor, then picked up
            const b = this.flight!.b
            this.ball = { ...b }
            this.flyBall({ u: this.clamp(b.u + (r() - 0.5) * 0.6, b.v + (r() - 0.5) * 0.6).u, v: b.v, y: 0 }, 3, 0.5)
            this.phase = 'loose'
          }
        }
        break
      case 'loose':
        if (this.flight && !this.flight.done) { this.flight.t += dt; if (this.flight.done) this.flight = null; break }
        this.pickUp()
        break
    }

    // the defence shadows its marks; attackers off the ball hold their spots, and now and then cut to the rim and out
    for (const p of this.players) {
      if (p.team !== this.offence) {
        if (this.phase !== 'miss' && this.phase !== 'loose' && this.phase !== 'transition' && this.phase !== 'made') {
          const s = this.spotFor(p)
          p.go(s.u, s.v, 4.5)
          p.face = p.mark ? { u: p.mark.u, v: p.mark.v } : rim
        }
      } else if (p !== this.holder && p !== this.target && (this.phase === 'check' || this.phase === 'pass' || this.phase === 'drive')) {
        p.cutT -= dt
        if (p.cutT <= 0) {
          // a cut to the rim and back out, or a slide to the next spot
          if (r() < 0.4) { const c = this.clamp(rim.u - this.end * 1.5 * this.k, (r() - 0.5) * 3 * this.k); p.go(c.u, c.v, 4); p.cutT = 1.0 }
          else { if (p.there) p.spot = (p.spot + 1) % 5; const s = this.spotFor(p); p.go(s.u, s.v, 2.8); p.cutT = 3 + r() * 4 }
        } else if (p.there && p.cutT < 2.5 && p.dist(rim.u, rim.v) < 3) { const s = this.spotFor(p); p.go(s.u, s.v, 3) }
        p.face = this.holder ? { u: this.holder.u, v: this.holder.v } : rim
      }
    }
    for (const p of this.players) p.update(dt)

    // the ball: in flight, or with its holder — dribbled at the hip, bouncing
    if (this.flight && (this.phase === 'pass' || this.phase === 'shoot' || this.phase === 'made' || this.phase === 'miss' || this.phase === 'loose')) {
      this.ball = this.flight.at()
    } else if (this.holder) {
      const h = this.holder
      this.dribbleT += dt
      const moving = !h.there
      // off the right hand, out of the way of the stride
      const hx = Math.cos(h.w.heading), hz = -Math.sin(h.w.heading)
      const w = { x: h.w.at.x + hx * 0.45 + Math.sin(h.w.heading) * 0.15, z: h.w.at.z + hz * 0.45 + Math.cos(h.w.heading) * 0.15 }
      const bounce = this.phase === 'check' || moving ? Math.abs(Math.sin(this.dribbleT * (moving ? 6 : 4.5))) * 0.9 : 1.1
      this.balls.length = 0
      this.balls.push({ x: w.x, z: w.z, y: bounce + 0.12, d: 0.24, colour: BASKETBALL })
      return
    }
    const w = this.f.world(this.ball.u, this.ball.v)
    this.balls.length = 0
    this.balls.push({ x: w.x, z: w.z, y: Math.max(0.07, this.ball.y) + 0.12, d: 0.24, colour: BASKETBALL })
  }
}
