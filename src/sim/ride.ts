/**
 * Moving. The model is Trail Trainer's, deliberately unchanged in its bones, because the thing it gets right
 * is the thing every training game has to get right and it is not worth re-deriving per game.
 *
 * ON A BIKE the rider's measured power is one force among several, and the others do not stop when the pedals
 * do. Stop pedalling on the flat and you roll on and slowly stop; stop pedalling on a descent and you speed
 * up:
 *
 *     m·dv/dt = P·η/v − m·g·sin θ − Crr·m·g·cos θ − ½·ρ·CdA·v²
 *
 * ON A TREADMILL there is none of that. The belt speed IS your speed. Stop running and you are standing still,
 * on a descent as much as on the flat, and you cover no ground at all. A runner never gets a metre for free,
 * and pretending otherwise is the one lie that would make a training game worthless.
 *
 * What a city adds is **corners**. A rider cannot take a right-angle junction at forty kilometres an hour, so
 * approaching a turn the model brakes to a speed the corner can hold — and that is honest rather than a
 * gameplay conceit: the same cap is what keeps you upright on a real street. It only ever takes speed away;
 * it never adds any.
 */
import type { Measured } from '../controls.ts'

const G = 9.81

/** Rolling resistance by what OSM says the street is made of. */
export const CRR: Record<string, number> = {
  asphalt: 0.004, concrete: 0.005, wood: 0.006, cobblestone: 0.011, gravel: 0.008, dirt: 0.012,
}

export interface RideConfig {
  riderMassKg: number
  bikeMassKg: number
  cdA: number
  drivetrain: number
  /** the lateral acceleration a rider will accept through a corner, m/s² */
  cornerAccel: number
  /** how hard the brakes may be applied for a corner, m/s² */
  brakeDecel: number
}

export const DEFAULTS: RideConfig = {
  riderMassKg: 75, bikeMassKg: 9, cdA: 0.36, drivetrain: 0.97, cornerAccel: 2.6, brakeDecel: 2.4,
}

export interface RideState {
  speed: number
  grade: number
  power: number | null
  working: boolean
  coasting: boolean
  braking: boolean
  /** crank angle for the avatar's legs */
  crank: number
  /** m/s backwards: REVERSE, the rider stopped and asking for less than nothing (`REVERSE_WATTS`) */
  reverse?: number
}

/** the most negative power the keyboard asks for: reverse at its fastest */
export const REVERSE_WATTS = -45
/** m/s, backing up at REVERSE_WATTS: a walking shuffle */
export const REVERSE_SPEED = 1.1

/** watts at or under which the rider is not pedalling */
export const ZERO_POWER = 10
/** seconds of no power before the brake comes on, and how long it takes to come on fully */
export const BRAKE_DELAY = 0.6
export const BRAKE_RAMP = 0.5
/** m/s², the brake fully on */
export const BRAKE_HARD = 3

export class Ride {
  private v = 0
  /** world metres per physical metre (src/modes.ts): `step` returns the world speed, the physics stay physical */
  speedup = 1
  private crank = 0
  private braking = false
  /** seconds at (near) zero power: the brake comes on after a moment of it */
  private idle = 0
  /** m/s backwards (REVERSE) */
  private back = 0
  private readonly cfg: RideConfig

  constructor(cfg: Partial<RideConfig> = {}) {
    this.cfg = { ...DEFAULTS, ...cfg }
  }

  get speed(): number { return this.v }

  /** no faster than `world` m/s (the world's speed, the speedup counted): creeping through a car (game.ts) */
  cap(world: number): void { this.v = Math.min(this.v, world / this.speedup) }

  /** Stop dead — a collision (sim/traffic.ts), or a standing car in the way (game.ts): the rider simply stops. */
  halt(): void { this.v = 0; this.back = 0 }

  /**
   * One step. `grade` is rise over run; `cornerRadius` is the radius of the bend the rider is approaching,
   * in metres, or Infinity on a straight; `distanceToCorner` is how far away it is.
   */
  step(
    dt: number,
    m: Measured,
    deviceType: 'bike' | 'treadmill',
    surface: string,
    grade: number,
    cornerRadius = Infinity,
    distanceToCorner = Infinity,
    /**
     * The vehicle ahead in the rider's lane, if any (sim/traffic.ts `leaderFor`): its speed and the clear road to
     * its tail. The owner, 2026-09-29: on a narrow street the rider is stuck behind the car, so the virtual speed
     * is held to its speed — a cap like the corner's, only ever downward. Absent on a descent (the traffic makes
     * way instead), so the descent stays the rider's.
     */
    leader: { speed: number; gap: number } | null = null,
  ): RideState {
    if (deviceType === 'treadmill') {
      // The belt is the truth. Smoothing is for the eye only: the machine reports once a second and the
      // screen draws sixty times, and without it the runner visibly stutters.
      const belt = m.speed ?? 0
      this.v += (belt - this.v) * Math.min(1, dt * 6)
      this.crank += this.v * dt * 1.8
      return {
        speed: this.v, grade, power: m.power, working: belt > 0.2,
        coasting: false, braking: false, crank: this.crank,
      }
    }

    /*
     * THE SPEEDUP (src/modes.ts): the rider covers `speedup` times the ground their physical speed would. The
     * physics stay in physical metres — the resistance, so the grade a trainer is asked for, is the real one — and
     * what comes in from the world (the corner, the car ahead) is turned into physical terms first, so the caps
     * still hold in the world: a corner taken at √(a·r) world speed, the car ahead never passed through.
     */
    const k = this.speedup
    if (k !== 1) {
      cornerRadius /= k * k
      distanceToCorner /= k
      if (leader) leader = { speed: leader.speed / k, gap: leader.gap / k }
    }
    const mass = this.cfg.riderMassKg + this.cfg.bikeMassKg
    const power = m.power ?? 0
    const crr = CRR[surface] ?? CRR.asphalt
    const θ = Math.atan(grade)

    // The rider's own force. At a standstill P/v is infinite, so it is capped at what a rider can actually
    // put through the pedals from stopped.
    const drive = this.v > 0.8 ? (power * this.cfg.drivetrain) / this.v : power * this.cfg.drivetrain / 0.8
    const gravity = mass * G * Math.sin(θ)
    const rolling = crr * mass * G * Math.cos(θ) * (this.v > 0.05 ? 1 : 0)
    const drag = 0.5 * 1.225 * this.cfg.cdA * this.v * this.v

    this.v += ((drive - gravity - rolling - drag) / mass) * dt
    if (this.v < 0) this.v = 0

    /*
     * BRAKES (owner, 2026-09-29): *"if power goes to 0 then it should go 'negative' and that should be a brake."*
     * With dense traffic and timed lights a bike that could not slow was unfair — a red light it could not stop
     * for, a car it could not avoid. Stop pedalling and the brake comes on: after 0.6 s of (near) zero power,
     * because a trainer reports once a second and can read zero for a beat between strokes, easing in over half a
     * second to 3 m/s² — more than any hill here pulls, so a rider can always stop. Keep pedalling and a descent
     * is as fast as ever.
     */
    this.idle = power <= ZERO_POWER ? this.idle + dt : 0
    const squeeze = Math.min(1, Math.max(0, (this.idle - BRAKE_DELAY) / BRAKE_RAMP))
    if (squeeze > 0 && this.v > 0) this.v = Math.max(0, this.v - BRAKE_HARD * squeeze * dt)

    // The corner cap. A bend of radius r may be taken at √(a·r); if the rider is going faster than that and
    // the corner is close, they brake. Only ever downward.
    this.braking = squeeze > 0 && this.v > 0.1
    if (Number.isFinite(cornerRadius) && cornerRadius > 0) {
      const vMax = Math.sqrt(this.cfg.cornerAccel * cornerRadius)
      if (this.v > vMax) {
        // the distance it would take to shed the excess, plus a margin
        const needed = (this.v * this.v - vMax * vMax) / (2 * this.cfg.brakeDecel)
        if (distanceToCorner <= needed + 3) {
          this.v = Math.max(vMax, this.v - this.cfg.brakeDecel * dt)
          this.braking = true
        }
      }
    }

    // held behind the vehicle ahead: brake towards its speed as the gap closes, never through it
    if (leader && this.v > leader.speed) {
      const needed = (this.v * this.v - leader.speed * leader.speed) / (2 * this.cfg.brakeDecel)
      if (leader.gap <= needed + 2) {
        this.v = Math.max(leader.speed, this.v - this.cfg.brakeDecel * 2 * dt)
        if (leader.gap < 0.5) this.v = Math.min(this.v, leader.speed)
        this.braking = true
      }
    }

    /*
     * REVERSE (owner, 2026-10-01): stopped, and asking for negative power, the rider walks the bike back — slowly,
     * along the street they are on (game.ts `Navigator.backUp`), to get out from behind a car that will not move.
     * Moving forward, negative power is only the brake.
     */
    const backWanted = power < 0 && this.v < 0.05 ? REVERSE_SPEED * Math.min(1, power / REVERSE_WATTS) : 0
    this.back += (backWanted - this.back) * Math.min(1, dt * (backWanted > this.back ? 2 : 6))
    if (this.back < 0.02 && backWanted === 0) this.back = 0
    this.crank += (power > 10 ? (this.v > 0.5 ? this.v * 0.9 : 1.2) : 0) * dt
    return {
      speed: this.v * k, grade, power: m.power, working: power > 10,
      coasting: power <= ZERO_POWER && this.v > 0.3 && !this.braking, braking: this.braking, crank: this.crank,
      reverse: this.back,
    }
  }
}

/**
 * The radius of the bend a turn of `angle` radians makes at a junction. A square left turn onto a street is a
 * tight bend; carrying on straight is no bend at all. Real junction geometry is a curb radius of a handful of
 * metres, which is why a cyclist slows for one.
 */
export function cornerRadius(angle: number): number {
  const a = Math.abs(angle)
  if (a < 0.2) return Infinity
  // 90° → about 7 m, 45° → about 16 m, 180° → about 3 m
  return Math.max(3, 14 / Math.tan(Math.min(a, Math.PI - 0.3) / 2))
}
