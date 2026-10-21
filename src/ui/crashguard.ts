/**
 * THE CRASH GUARD (owner, 2026-10-14: "I turned graphics up to high and now I get stuck in a restart loop. We
 * should record when loading starts and ends, and if it crashed last time return to low graphics").
 *
 * iOS kills a tab that outgrows its memory (~384 MB) and Safari reloads it, so a setting the device cannot hold
 * crashes it again, for ever, and the menu that would undo it is never reached. So every run is recorded: `loading`
 * as it starts, `riding` once the ride is on screen, `closed` whenever the page is hidden or left normally — which a
 * crash never gets to write. A run that ended neither closed nor hidden crashed, and the next one steps down:
 *
 *   first: quality back to Auto (on an iPhone that is the low tier), and the world features forced On back to Auto
 *   again, already on Auto: quality Low
 *
 * and says so once the ride is up. `?reset=1` clears every setting by hand.
 */
import { detectTier } from '../tier.ts'
import { FEATURE_OFF, REDUCED_KEY, setSetting, settings, type Feature } from './settings.ts'

const KEY = 'cycledash.lastRun'
interface Run { state: 'loading' | 'riding' | 'closed'; tier: string; at: number; crashes: number }

let note: string | null = null
let crashes = 0
let tier = ''

const read = (): Run | null => {
  try { return JSON.parse(localStorage.getItem(KEY) ?? 'null') as Run | null } catch { return null }
}
const write = (state: Run['state']): void => {
  try { localStorage.setItem(KEY, JSON.stringify({ state, tier, at: Date.now(), crashes } satisfies Run)) } catch { /* private window */ }
}

/**
 * Before the tier is chosen: if the last run crashed, take the settings down a step. Returns nothing; what was done
 * is `recoveryNote()`, for the ride to show.
 */
export function recoverFromCrash(): void {
  if (new URLSearchParams(location.search).get('reset') === '1') {
    try { localStorage.removeItem('cycledash.settings') } catch { /* fine */ }
    note = 'Settings reset'
  }
  const last = read()
  if (!last || last.state === 'closed') return
  crashes = (last.crashes ?? 0) + 1
  const s = settings()
  const done: string[] = []
  /*
   * HOW FAR DOWN THIS IS ALLOWED TO GO DEPENDS ON THE MACHINE.
   *
   * Owner, 2026-10-21: *"Plants are not loading on desktop... It's like we're applying the same memory
   * limits on desktop now as we have on the phone... on desktop the heap size is 199 MB"* — and in a
   * private window it was the desktop tier again, which is what gave it away. This did that. It stepped a
   * desktop down to `ultra`, the mobile tier, wrote it to localStorage and never undid it: 199 MB of heap
   * and no plants on a browser with gigabytes spare, for ever, over two runs that happened not to end
   * cleanly. A run counts as a crash merely by not writing `closed`, which an ordinary force-quit manages.
   *
   * A desktop crash is almost never the 384 MB ceiling this guard exists for, so on anything that is not a
   * phone the ladder stops at Medium. The floor is also excluded from the reset above, or the two rules
   * push against each other and the setting flips between Auto and Medium on alternate crashes.
   */
  const floor = detectTier(null) === 'ultra' ? 'ultra' : 'phone'
  if ((s.quality === 'desktop' || s.quality === 'phone') && s.quality !== floor) { setSetting('quality', 'auto'); done.push('graphics back to Auto') }
  else if (crashes >= 2 && s.quality !== floor) {
    setSetting('quality', floor)
    // …and remember that it was us, not the user, so the menu can keep saying so (`autoReduced`)
    try { localStorage.setItem(REDUCED_KEY, floor) } catch { /* private window */ }
    done.push(floor === 'ultra' ? 'graphics to Low' : 'graphics to Medium')
  }
  for (const f of Object.keys(FEATURE_OFF) as (keyof typeof FEATURE_OFF)[]) {
    if (s[f] === 'on') { setSetting(f, 'auto' as Feature); done.push(`${f} back to Auto`) }
  }
  if (done.length) note = `The last ride stopped unexpectedly: ${done.join(', ')}. Menu → Settings to change it.`
}

/** The ride is starting on this tier: record it, and record a normal leaving. */
export function beginRun(t: string): void {
  tier = t
  write('loading')
  const leave = (): void => write('closed')
  addEventListener('pagehide', leave)
  // (hidden — another app, another tab, the screen locked — is a normal end too: iOS may discard a background tab
  // without a pagehide, and that is not this game's crash)
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') leave(); else write(ridingNow ? 'riding' : 'loading') })
}

let ridingNow = false
/** The ride is on screen: the load did not crash. A run that gets this far and crashes later still counts. */
export function riding(): void {
  ridingNow = true
  // a run that rode for a while proves the settings hold: the count starts again
  setTimeout(() => { crashes = 0; if (document.visibilityState === 'visible') write('riding') }, 120_000)
  write('riding')
}

/** what the guard did at the start, once (null if nothing) */
export function recoveryNote(): string | null {
  const n = note
  note = null
  return n
}

/**
 * The quality the guard chose on the player's behalf, or null.
 *
 * Owner, 2026-10-21: *"Add some indication that we are moving to a lower graphics mode based on a cookie
 * (previous crash) so the user knows what's happening. if there's the default graphics mode, don't display
 * this indication at all."* The banner the recovery shows is seen once and then the reason is gone for
 * ever, which is how a desktop can sit on the phone tier for days with nobody knowing why. This is for
 * saying it somewhere that stays — and it answers null the moment anybody chooses a quality themselves, or
 * where the setting is Auto, which is the default and worth no remark.
 */
export function autoReduced(): string | null {
  const q = settings().quality
  if (q === 'auto') return null
  try {
    return localStorage.getItem(REDUCED_KEY) === q ? q : null
  } catch { return null }
}
