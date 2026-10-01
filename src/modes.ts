/**
 * The three ways Street Runner is played (owner, 2026-10-01). They are the same game with different things on:
 *
 * - **couch** — a keyboard on the sofa. Power is chosen with ↑/↓ and paid for out of an ENERGY BAR that drains
 *   above a sustainable effort and refills below it (sim/energy.ts): the thing that makes a keyboard ride a game.
 *   Held arrows steer (fast input), and a speedup keeps a long ride moving.
 * - **trainer** — a real bike on a trainer, through Dandyhorse (src/platform.ts): power is read from the machine,
 *   the grade is written back to it. The keyboard is out of reach, so input is slow (turns are declared ahead, from
 *   the phone's d-pad), deliveries are routed, and an offered delivery is TAKEN unless the rider skips it — so a
 *   rider happy with the defaults never touches a control. No energy bar: the legs are the energy bar. A gentler
 *   speedup, because the rider can feel their own speed.
 * - **debug** — trainer debug: the trainer simulated from the keyboard (↑/↓ set the watts), slow input, no
 *   Dandyhorse, no energy bar, no speedup. What the game was before the modes.
 *
 * Running (the treadmill) is off for now, the bike only (`?running=1` brings the switch back for development).
 */
export type GameMode = 'couch' | 'trainer' | 'debug'

export interface ModeSettings {
  label: string
  /** one line for the welcome screen */
  blurb: string
  /** fast (held arrows steer) or slow (turns declared ahead): src/sim/navigate.ts */
  input: 'fast' | 'slow'
  /** the energy bar (sim/energy.ts) */
  energy: boolean
  /**
   * How much faster the rider moves through the city than their physical speed (sim/ride.ts `speedup`). The ride
   * model's physics stay honest — the grade asked of a trainer is the real one — only the ground covered is scaled.
   */
  speedup: number
  /** seconds after which an offered delivery is taken without an answer; null: it goes away instead */
  autoAccept: number | null
}

export const MODES: Record<GameMode, ModeSettings> = {
  couch: {
    label: 'Couch', blurb: 'Keyboard. Pick your effort with ↑ ↓ and watch the energy bar.',
    input: 'fast', energy: true, speedup: 2, autoAccept: null,
  },
  trainer: {
    label: 'Trainer', blurb: 'A real bike on Dandyhorse. Just pedal: deliveries and turns are taken for you.',
    input: 'slow', energy: false, speedup: 1.25, autoAccept: 12,
  },
  debug: {
    label: 'Trainer debug', blurb: 'A trainer simulated from the keyboard: ↑ ↓ set the watts.',
    input: 'slow', energy: false, speedup: 1, autoAccept: null,
  },
}

/** The mode for this page: Dandyhorse is the trainer; otherwise `?mode=`, couch by default. */
export function chooseMode(asked: string | null, onPlatform: boolean): GameMode {
  if (onPlatform) return 'trainer'
  return asked === 'debug' || asked === 'trainer' ? asked : 'couch'
}
