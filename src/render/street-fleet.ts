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
import { Fleet, randomSpec, slopePose, steerForCurvature, type Archetype, type Car, type Livery } from '@dandyhorse/carkit'
import { DAYLIGHT, NIGHT } from './facade-material.ts'
import type { Vehicle } from '../sim/traffic.ts'
import { nearLevel } from '../city/terrain.ts'

/**
 * The city's mix of shapes, by weight (after carkit's demo): mostly sedans, hatchbacks and SUVs, a few vans and
 * trucks, the odd taxi and police car. Buses come from the traffic sim as buses.
 */
const MIX: [Archetype, number, Livery][] = [
  ['sedan', 22, 'none'], ['hatchback', 18, 'none'], ['suv', 18, 'none'], ['coupe', 4, 'none'], ['minivan', 7, 'none'],
  ['pickup', 6, 'none'], ['van', 7, 'none'], ['boxtruck', 4, 'none'], ['sedan', 6, 'taxi'], ['minivan', 2, 'taxi'],
  ['sedan', 1, 'police'], ['suv', 1, 'police'], ['van', 1, 'ambulance'], ['boxtruck', 2, 'delivery'],
]
const MIX_TOTAL = MIX.reduce((s, m) => s + m[1], 0)
/** seeds per archetype: each is a different shape, i.e. a draw call; four keeps the street at ~45 */
const SEEDS = 4

/** a well-mixed hash of the id, so neighbouring ids are not neighbouring shapes */
const hash = (n: number): number => {
  let h = (n ^ 0x9e3779b9) >>> 0
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0
  return (h ^ (h >>> 16)) >>> 0
}

interface Track { car: Car; x: number; z: number; heading: number; y?: number; grade: number; seen: number }

export class StreetFleet {
  readonly fleet: Fleet
  private readonly tracks = new Map<number, Track>()
  private frame = 0
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
      const car = this.fleet.add(randomSpec('bus', seed, 'transit'))
      car.paint = [...v.colour]
      return car
    }
    let x = (h >>> 8) % MIX_TOTAL
    let pick = MIX[0]
    for (const m of MIX) { x -= m[1]; if (x < 0) { pick = m; break } }
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
    const headlights = NIGHT > 0.3
    for (const v of vehicles) {
      let t = this.tracks.get(v.id)
      if (!t) {
        t = { car: this.spawn(v), x: v.at.x, z: v.at.z, heading: v.heading, y: v.y, grade: 0, seen: 0 }
        this.tracks.set(v.id, t)
      }
      t.seen = this.frame
      const car = t.car
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
        car.setPose(slopePose(v.at.x, v.y, v.at.z, v.heading, t.grade))
        car.drops = car.layout.wheels.map(() => 0)
      } else {
        // (on the ground, but never off the street's own level: city/terrain.ts `nearLevel`)
        car.place(v.at.x, v.at.z, v.heading, (x, z) => nearLevel(groundAt(x, z), v.level), dt)
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
      shadow(v.at, v.heading, car.spec.length, car.spec.width, car.spec.height)
    }
    // gone from the traffic (despawned, or hidden in a tunnel): gone from the street
    for (const [id, t] of this.tracks) {
      if (t.seen === this.frame) continue
      this.fleet.remove(t.car)
      this.tracks.delete(id)
    }
    this.fleet.update(dt)
  }

  get count(): number { return this.tracks.size }
}
