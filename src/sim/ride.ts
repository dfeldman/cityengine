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
}

export class Ride {
  private v = 0
  private crank = 0
  private braking = false
  private readonly cfg: RideConfig

  constructor(cfg: Partial<RideConfig> = {}) {
    this.cfg = { ...DEFAULTS, ...cfg }
  }

  get speed(): number { return this.v }

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

    // The corner cap. A bend of radius r may be taken at √(a·r); if the rider is going faster than that and
    // the corner is close, they brake. Only ever downward.
    this.braking = false
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

    this.crank += (power > 10 ? (this.v > 0.5 ? this.v * 0.9 : 1.2) : 0) * dt
    return {
      speed: this.v, grade, power: m.power, working: power > 10,
      coasting: power <= 10 && this.v > 0.3, braking: this.braking, crank: this.crank,
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
