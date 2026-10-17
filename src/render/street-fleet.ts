/**
 * The street's cars and buses, drawn by carkit (~/dandyhorse/libs/carkit, its INTEGRATION.md): procedural vehicles
 * of many shapes and liveries, thin-instanced by shape, posed on the hill under all four tyres, with brake lamps,
 * indicators and headlamps. They replace the two stand-in models of render/models.ts (`car`, `bus`), which stood
 * level on every slope — nose dug in going up, tail floating.
 *
 * One carkit `Car` per traffic `Vehicle.id`, its shape picked once from the id so a vehicle never changes; the
 * traffic sim keeps deciding everything, this only draws it. `?without=carkit` puts the old models back.
 *
 * Trains, streetcars and cable cars are not carkit's: render/life.ts and rolling-stock.ts still draw those.
 */
import type { Scene } from '@babylonjs/core/scene'
import { Fleet, randomSpec, slopePose, steerForCurvature, type Archetype, type Car, type Livery } from 'carkit'
import { DAYLIGHT, NIGHT } from './facade-material.ts'
import type { Vehicle } from '../sim/traffic.ts'

/**
 * The city's mix of shapes, by weight (after carkit's demo): mostly sedans, hatchbacks and SUVs, a few vans and
 * trucks, the odd taxi and police car. Buses come from the traffic sim as buses.
 */
const MIX: [Archetype, number, Livery][] = [
  ['sedan', 22, 'none'], ['hatchback', 18, 'none'], ['suv', 18, 'none'], ['coupe', 4, 'none'], ['minivan', 7, 'none'],
  ['pickup', 6, 'none'], ['van', 7, 'none'], ['boxtruck', 4, 'none'], ['sedan', 6, 'taxi'], ['minivan', 2, 'taxi'],
  ['sedan', 1, 'police'], ['suv', 1, 'police'], ['van', 1, 'ambulance'], ['boxtruck', 2, 'delivery'],
]
/** what parked cars are painted: mostly white, grey, silver and black, as a real car park is, and the odd colour */
const PARKED_PAINT: [number, number, number][] = [
  [0.92, 0.92, 0.9], [0.92, 0.92, 0.9], [0.6, 0.61, 0.62], [0.72, 0.73, 0.75], [0.12, 0.12, 0.13], [0.12, 0.12, 0.13],
  [0.35, 0.36, 0.38], [0.55, 0.1, 0.1], [0.15, 0.22, 0.42], [0.7, 0.7, 0.66], [0.3, 0.33, 0.3],
]
/** metres a wheel may stand above or below the car's centreline: the most a car on a street rolls */
const ROLL = 0.08
/** how far a car on a street's profile may be lifted toward a higher surface drawn there, and how much of that may differ front to back */
const LIFT = 0.35
const PITCH_LIFT = 0.12
/** seeds per archetype: each is a different shape, i.e. a draw call; four keeps the street at ~45 */
const SEEDS = 4

/** a well-mixed hash of the id, so neighbouring ids are not neighbouring shapes */
const hash = (n: number): number => {
  let h = (n ^ 0x9e3779b9) >>> 0
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0
  return (h ^ (h >>> 16)) >>> 0
}

interface Track {
  car: Car; x: number; z: number; heading: number; y?: number; grade: number; seen: number
  /** where it is DRAWN while turning round (see `update`): eased toward the sim's pose, null when they agree */
  shown?: { x: number; z: number; heading: number } | null
}

/**
 * TURNING ROUND (BUGS.md #250: the soak's last jumps were cars turning round at a dead end — 180° in one step while
 * standing, and across to the other lane). The sim may do that in an instant; the street must not. A standing or
 * crawling car whose pose jumps is drawn swinging round to it, at these rates.
 */
const TURN_RATE = Math.PI          // rad/s: half a turn in a second
const SLIDE_RATE = 4               // m/s across

export class StreetFleet {
  readonly fleet: Fleet
  private readonly tracks = new Map<number, Track>()
  private frame = 0
  /** the probes' view (tools/probe-cars.ts): this frame's worst pitch beyond the car's own street slope, and where */
  readonly worst = { excess: 0, x: 0, z: 0, slope: 0, pitch: 0, n: 0 }
  private lookNight = -1

  constructor(scene: Scene) {
    // the buildings' group (the groups after 0 clear depth, and the streets bury anything left in 0); no shadows
    // of carkit's own: Life lays its sun-stretched blob under every vehicle, sized from the car
    this.fleet = new Fleet(scene, { shadows: false, renderingGroupId: 3 })
    this.look()
  }

  /** Street Runner's sky, as carkit reads it (called when the hour changes; cheap, so also on every frame's check) */
  private look(): void {
    if (this.lookNight === NIGHT) return
    this.lookNight = NIGHT
    this.fleet.setLook({
      // carkit wants the direction TO the sun; Street Runner's `sun` is the light's direction, from it
      sun: DAYLIGHT.sun.scale(-1).normalize(),
      sunColour: DAYLIGHT.sunColour, skyColour: DAYLIGHT.skyColour, groundColour: DAYLIGHT.groundColour,
      fogColour: DAYLIGHT.fogColour,
      // carkit's fog is exp2 (exp(-(d·k)²)), Street Runner's exp (exp(-d·k)): the same half-way distance
      fogDensity: DAYLIGHT.fogDensity / Math.sqrt(Math.LN2),
      night: NIGHT,
    })
  }

  private spawn(v: Vehicle): Car {
    const h = hash(v.id)
    const seed = 1 + (h % SEEDS)
    if (v.kind === 'bus') {
      // Muni's livery, silver-grey with its two red bands (carkit `transit`), not the sim's random colour
      return this.fleet.add(randomSpec('bus', seed, 'transit'))
    }
    // the sim says which cars are taxis (it lets them onto car-free Market Street): those are drawn as taxis, and no
    // other car is
    const mix = MIX.filter((m) => (m[2] === 'taxi') === !!v.taxi)
    const total = mix.reduce((t, m) => t + m[1], 0)
    let x = (h >>> 8) % total
    let pick = mix[0]
    for (const m of mix) { x -= m[1]; if (x < 0) { pick = m; break } }
    const car = this.fleet.add(randomSpec(pick[0], seed, pick[2]))
    // a plain car keeps the colour the traffic sim gave it; a livery is its own
    if (pick[2] === 'none') car.paint = [...v.colour]
    if (pick[2] === 'police' || pick[2] === 'ambulance') car.lights.beacon = (h >>> 20) % 3 === 0
    return car
  }

  /**
   * Draw this frame's vehicles. `groundAt` is the drawn ground (streets levelled); `shadow` lays a blob under each
   * one, `long` by `wide`, for something `tall`.
   */
  update(dt: number, vehicles: readonly Vehicle[], groundAt: (x: number, z: number) => number,
         shadow: (at: { x: number; z: number }, heading: number, long: number, wide: number, tall: number) => void): void {
    this.look()
    this.frame++
    Object.assign(this.worst, { excess: 0, n: 0 })
    ;(globalThis as unknown as { __fleetWorst?: unknown }).__fleetWorst = this.worst
    const headlights = NIGHT > 0.3
    for (const v of vehicles) {
      let t = this.tracks.get(v.id)
      if (!t) {
        t = { car: this.spawn(v), x: v.at.x, z: v.at.z, heading: v.heading, y: v.y, grade: 0, seen: 0 }
        this.tracks.set(v.id, t)
      }
      t.seen = this.frame
      const car = t.car
      // a jump while (nearly) standing: draw it swinging round from where it was, not snapping
      {
        let dh = v.heading - (t.shown?.heading ?? t.heading)
        while (dh > Math.PI) dh -= Math.PI * 2
        while (dh < -Math.PI) dh += Math.PI * 2
        const from = t.shown ?? { x: t.x, z: t.z, heading: t.heading }
        const jump = Math.hypot(v.at.x - from.x, v.at.z - from.z)
        if (!t.shown && v.speed < 1.5 && (Math.abs(dh) > 0.6 || jump > 1.5)) t.shown = { ...from }
        if (t.shown) {
          const step = Math.max(-TURN_RATE * dt, Math.min(TURN_RATE * dt, dh))
          t.shown.heading += step
          const k = jump > 1e-6 ? Math.min(1, (SLIDE_RATE * dt) / jump) : 1
          t.shown.x += (v.at.x - t.shown.x) * k
          t.shown.z += (v.at.z - t.shown.z) * k
          if (Math.abs(dh - step) < 0.02 && jump * (1 - k) < 0.05) t.shown = null
        }
      }
      const pose = t.shown ?? { x: v.at.x, z: v.at.z, heading: v.heading }
      // the footprint drawn, for the traffic sim's boxes (collisions, being held behind it): sim/traffic.ts `size`
      v.size ??= { len: car.spec.length, wid: car.spec.width }
      const ds = Math.hypot(v.at.x - t.x, v.at.z - t.z)
      if (v.y !== undefined) {
        /*
         * On a raised edge (a bridge deck, a ramp) the ground under the car is not what it drives on: `place`
         * would sample the terrain metres below the deck. The deck's own grade instead, from the heights the
         * sim gives it frame to frame, smoothed.
         */
        if (t.y !== undefined && ds > 0.05) t.grade += (Math.max(-0.2, Math.min(0.2, (v.y - t.y) / ds)) - t.grade) * Math.min(1, dt * 4)
        car.setPose(slopePose(pose.x, v.y, pose.z, pose.heading, t.grade))
        car.drops = car.layout.wheels.map(() => 0)
      } else {
        // (on the ground, but never off the street's own level: city/terrain.ts `nearLevel`)
        /*
         * …and hardly ROLLED (owner, 2026-10-02: on steep hills "cars appear to go partially underground … we should
         * probably just limit roll; cars never actually roll very much since they have four wheels that all have to
         * be on the street"). A wheel near the kerb sampled the terrain beside the graded street and tipped the car
         * into the hill. Each wheel reads the ground on the car's own centreline, abreast of it, and keeps at most
         * `ROLL` of the real difference across.
         */
        const fx = Math.sin(pose.heading), fz = Math.cos(pose.heading)
        const cx = pose.x, cz = pose.z
        /*
         * …and on the STREET'S OWN PROFILE (owner, 2026-10-02: on Crossover Drive's ramp "the cars all go partially
         * underground … this time it's pitch"). The road is drawn at its profile; the terrain under a wheel can be a
         * metre and more below it on a ramp or an embankment (`nearLevel` let 1.5 m through). Each wheel stands on the
         * profile where it is along the car — the street's slope is the pitch — and the ground adds no more than
         * `ROLL` of camber. A street with no profile keeps the ground, read on the centreline.
         */
        /*
         * …and never PITCHED by what is beside its own street (owner, 2026-10-17: "the cars on inclines look tilted up way
         * too much now… on steep changing inclines they can look like they're tipping over backward"). `groundAt` is the
         * higher of the ground and the highest carriageway drawn there (#283: no car under a junction's surface), so at a
         * junction the front wheels read the crossing street's flat plateau while the rear ones stood on the steep approach.
         * On a street with a profile, the car stands on the PROFILE, lifted as a whole by at most LIFT toward a higher
         * surface; the lift front and back differ by at most PITCH_LIFT, so the street's own slope is the car's pitch, give
         * or take a degree or two.
         */
        const half = car.spec.length / 2
        const liftAt = (along: number): number => {
          if (v.level === undefined) return 0
          const prof = v.level + (v.slope ?? 0) * along
          const c = groundAt(cx + fx * along, cz + fz * along)
          return c > prof && c - prof < 1.5 ? Math.min(LIFT, c - prof) : 0
        }
        const lb = liftAt(-half), lf = liftAt(half)
        const lm = Math.max(lb, lf, liftAt(0))
        const ground = (x: number, z: number): number => {
          const along = (x - cx) * fx + (z - cz) * fz
          const centre = groundAt(cx + fx * along, cz + fz * along)
          const profile = v.level !== undefined ? v.level + (v.slope ?? 0) * along : undefined
          // on the street's profile, lifted as a whole (front and back within PITCH_LIFT of each other); a street with no
          // profile keeps the ground on its centreline
          const t = Math.max(0, Math.min(1, along / (2 * half) + 0.5))
          const lift = Math.max(lm - PITCH_LIFT / 2, Math.min(lm, lb + (lf - lb) * t))
          const mid = profile === undefined ? centre : profile + lift
          const here = groundAt(x, z)
          // (a ground metres off the street — a tunnel's cut, the hill beside an embankment — says nothing about it)
          if (Math.abs(here - mid) > 1.5) return mid
          return mid + Math.max(-ROLL, Math.min(ROLL, here - mid))
        }
        car.place(pose.x, pose.z, pose.heading, ground, dt)
        if (v.slope !== undefined) {
          const excess = Math.abs(Math.abs(car.pitch) - Math.abs(Math.atan(v.slope)))   // (magnitudes: `slope` runs along the edge, not always the heading)
          this.worst.n++
          if (excess > this.worst.excess) Object.assign(this.worst, { excess, x: pose.x, z: pose.z, slope: v.slope, pitch: -car.pitch })
        }
        t.grade = 0
      }
      // the front wheels follow the path's curvature (only seen, so the frame-to-frame estimate will do)
      if (ds > 0.05) {
        let dh = v.heading - t.heading
        while (dh > Math.PI) dh -= Math.PI * 2
        while (dh < -Math.PI) dh += Math.PI * 2
        car.steer += (steerForCurvature(car.layout, dh / ds) - car.steer) * Math.min(1, dt * 6)
      }
      car.drive(v.speed * dt)
      car.lights.brake = v.waiting
      car.lights.headlights = headlights
      // indicating through the junction, and while held at its line for the turn it will take
      const turn = v.inBox?.turn ?? (v.next && (v.waiting || v.speed < 4) ? v.next.turn : undefined)
      car.lights.indicator = turn === 'left' ? 'left' : turn === 'right' ? 'right' : 'off'
      t.x = v.at.x
      t.z = v.at.z
      t.heading = v.heading
      t.y = v.y
      shadow({ x: pose.x, z: pose.z }, pose.heading, car.spec.length, car.spec.width, car.spec.height)
    }
    // gone from the traffic (despawned, or hidden in a tunnel): gone from the street
    for (const [id, t] of this.tracks) {
      if (t.seen === this.frame) continue
      this.fleet.remove(t.car)
      this.tracks.delete(id)
    }
    this.fleet.update(dt)
  }

  /**
   * PARKED CARS in the car parks near the rider (city/parking.ts; owner, 2026-10-17: "the cars do not need to ever
   * move"): added from the same shapes as the traffic when a stall comes within range, placed once on the ground,
   * never driven, removed when it goes out of range. Keyed by where they stand.
   */
  private readonly parked = new Map<string, Car>()
  park(stalls: readonly { x: number; z: number; heading: number; id: number }[], groundAt: (x: number, z: number) => number): void {
    const want = new Set<string>()
    for (const s of stalls) {
      const k = `${Math.round(s.x * 10)},${Math.round(s.z * 10)}`
      want.add(k)
      if (this.parked.has(k)) continue
      const h = hash(s.id)
      // (cars, vans and pickups: no box trucks in a car park)
      const mix = MIX.filter((m) => m[2] === 'none' && m[0] !== 'boxtruck')
      const total = mix.reduce((t, m) => t + m[1], 0)
      let x = (h >>> 8) % total
      let pick = mix[0]
      for (const m of mix) { x -= m[1]; if (x < 0) { pick = m; break } }
      const car = this.fleet.add(randomSpec(pick[0], 1 + (h % SEEDS), 'none'))
      car.paint = [...PARKED_PAINT[(h >>> 4) % PARKED_PAINT.length]]
      car.place(s.x, s.z, s.heading, groundAt)
      this.parked.set(k, car)
    }
    for (const [k, car] of this.parked) {
      if (want.has(k)) continue
      this.fleet.remove(car)
      this.parked.delete(k)
    }
  }

  get count(): number { return this.tracks.size }
}
