/**
 * The energy bar (couch mode, src/modes.ts): what a keyboard rider pays for power with.
 *
 * On a sofa the watts are a number the rider types, so without a cost they would type the biggest one and keep it.
 * The bar is the cost: above a SUSTAINABLE effort it drains, faster the harder the effort; below it, it refills,
 * faster the easier. Run it dry and the rider is capped below the sustainable effort until it has refilled a
 * quarter — the bonk. So a climb is a choice: sprint it and recover after, or spin up it and arrive with something
 * left for the next.
 *
 * Rates, at the default 200 W sustainable: 400 W empties a full bar in 45 s, 300 W in 90 s; soft-pedalling at
 * 100 W refills it in 80 s, coasting in 40 s.
 */
export interface EnergyConfig {
  /** watts that neither drain nor refill */
  sustainable: number
  /** seconds to empty a full bar at twice the sustainable effort */
  drainSeconds: number
  /** seconds to refill an empty bar at zero effort */
  refillSeconds: number
  /** when empty, power is held to this fraction of the sustainable effort… */
  bonkCap: number
  /** …until the bar is back to this */
  recoverAt: number
}

export const ENERGY_DEFAULTS: EnergyConfig = { sustainable: 200, drainSeconds: 45, refillSeconds: 40, bonkCap: 0.75, recoverAt: 0.25 }

export class Energy {
  /** 0 empty … 1 full */
  level = 1
  /** run dry and not yet recovered */
  bonked = false
  readonly cfg: EnergyConfig

  constructor(cfg: EnergyConfig = ENERGY_DEFAULTS) { this.cfg = cfg }

  /** The power the rider actually gets out of `asked` watts now (the bonk caps it). */
  allowed(asked: number): number {
    return this.bonked ? Math.min(asked, this.cfg.sustainable * this.cfg.bonkCap) : asked
  }

  /** Pay for `watts` over `dt` seconds (the power actually delivered, i.e. after `allowed`). */
  spend(watts: number, dt: number): void {
    const t = this.cfg.sustainable
    const over = (watts - t) / t
    this.level += over > 0 ? -(over / this.cfg.drainSeconds) * dt : (-over / this.cfg.refillSeconds) * dt
    this.level = Math.max(0, Math.min(1, this.level))
    if (this.level <= 0) this.bonked = true
    else if (this.bonked && this.level >= this.cfg.recoverAt) this.bonked = false
  }
}
