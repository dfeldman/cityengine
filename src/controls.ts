/**
 * Everything the game knows about the person riding it comes through here, and nothing else reaches for an
 * input. Standalone that is the keyboard; on Dandyhorse it is one more implementation backed by the
 * platform's session (see INTEGRATION.md), and no other file changes.
 *
 * The one rule, carried over from Trail Trainer unchanged: `measured()` is what the machine MEASURED, never
 * what the game asked for. A trainer told to hold 8% may be holding 5%. The ride model is fed the truth and
 * the request is only ever a request.
 *
 * Street Runner adds a second seam that Trail Trainer had no need of: **steering**. It is here rather than in
 * the navigator because it is an input, and because the platform delivers it through the same once-a-second
 * poll as everything else — see `src/sim/navigate.ts` for why that shapes the whole design.
 */
import type { Turn } from './city/graph.ts'
import { REVERSE_WATTS } from './sim/ride.ts'

export interface Measured {
  power: number | null
  speed: number | null
  cadence: number | null
  heartRate: number | null
}

export const NO_READING: Measured = { power: null, speed: null, cadence: null, heartRate: null }

export interface Controls {
  measured(): Measured
  paused(): boolean
  elapsedSeconds(): number
  /** the game asking the machine for a grade, in percent; the platform clamps and scales it */
  request(gradePercent: number): void
  ended(): boolean
  /**
   * Any steering asked for since the last call, oldest first. A list rather than a single value because
   * button presses can arrive faster than the game polls, and dropping one loses a turn the rider meant.
   */
  steering(): Steer[]
  /** the game's own steering buttons, where they must go the platform's way round (platform.ts) */
  press?(s: Steer): void
  /**
   * FAST INPUT (src/sim/navigate.ts): the direction held right now, −1 left, 0 none, +1 right — for an input that
   * can be held and read every frame, which a keyboard can and the platform's once-a-second poll cannot.
   */
  steerAxis?(): -1 | 0 | 1
}

/** A turn at the next junction, or 'back': turn round where you are. */
export type Steer = Turn | 'back'

export class LocalControls implements Controls {
  private watts = 180
  private belt = 2.8
  private coasting = false
  private started = performance.now()
  private paused_ = false
  private grade = 0
  private pending: Steer[] = []
  /**
   * Slow input: is a turn signalled and not yet latched? Then ↑ cancels it — a 'straight' — instead of adding
   * power (owner, 2026-09-29: "there is no way to cancel a turn instruction once issued"). Set by the game.
   */
  turnPending: (() => boolean) | null = null
  /** the steering keys held down: ArrowLeft/KeyA, ArrowRight/KeyD */
  private readonly down = new Set<string>()

  private readonly deviceType: () => 'bike' | 'treadmill'

  constructor(deviceType: () => 'bike' | 'treadmill') {
    this.deviceType = deviceType
    addEventListener('keydown', (e) => this.key(e, true))
    addEventListener('keyup', (e) => this.key(e, false))
    // a key released while the window had no focus never sends its keyup: forget them all
    addEventListener('blur', () => this.down.clear())
  }

  steerAxis(): -1 | 0 | 1 {
    const l = this.down.has('ArrowLeft') || this.down.has('KeyA')
    const r = this.down.has('ArrowRight') || this.down.has('KeyD')
    return l === r ? 0 : l ? -1 : 1
  }

  private key(e: KeyboardEvent, down: boolean): void {
    const bike = this.deviceType() === 'bike'
    if (e.code === 'Space') { this.coasting = down; e.preventDefault(); return }
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight' || e.code === 'KeyA' || e.code === 'KeyD') {
      if (down) this.down.add(e.code); else this.down.delete(e.code)
    }
    if (!down) return
    const big = e.shiftKey ? 4 : 1
    switch (e.code) {
      case 'ArrowUp':
        if (this.turnPending?.()) this.pending.push('straight')
        else if (bike) this.watts += 15 * big
        else this.belt += 0.15 * big
        e.preventDefault()
        break
      case 'ArrowDown': bike ? (this.watts -= 15 * big) : (this.belt -= 0.15 * big); e.preventDefault(); break
      case 'ArrowLeft': this.pending.push('left'); e.preventDefault(); break
      case 'ArrowRight': this.pending.push('right'); e.preventDefault(); break
      case 'KeyS': this.pending.push('straight'); break
      case 'KeyU': case 'Backspace': this.pending.push('back'); e.preventDefault(); break
      // (the Pause key too: the touch ⏸ sends it, so it pauses without also toggling photo mode, which is also P)
      case 'KeyP': case 'Pause': this.paused_ = !this.paused_; break
    }
    // a little below zero is REVERSE (owner, 2026-10-01: "power should go slightly negative so you can get unstuck if
    // you're right behind a car that isn't moving"): sim/ride.ts backs the bike up once it has stopped
    this.watts = Math.max(REVERSE_WATTS, Math.min(700, this.watts))
    this.belt = Math.max(0, Math.min(7, this.belt))
  }

  measured(): Measured {
    const bike = this.deviceType() === 'bike'
    const power = this.coasting ? 0 : this.watts
    return {
      power: bike ? power : null,
      speed: bike ? null : this.coasting ? 0 : this.belt,
      cadence: bike ? (power > 10 ? 85 : 0) : null,
      heartRate: null,
    }
  }

  paused(): boolean { return this.paused_ }
  elapsedSeconds(): number { return (performance.now() - this.started) / 1000 }
  request(gradePercent: number): void { this.grade = gradePercent }
  requested(): number { return this.grade }
  ended(): boolean { return false }

  steering(): Steer[] {
    const out = this.pending
    this.pending = []
    return out
  }

  setting(): { watts: number; belt: number; coasting: boolean } {
    return { watts: this.watts, belt: this.belt, coasting: this.coasting }
  }
}
