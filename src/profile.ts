/**
 * Load-stage timers, off unless asked for (BUGS.md #179). The hunt for the cold load left `console.log`
 * calls around each stage; they are worth keeping and must not print in the demo, so they go through here
 * and print only with `?profile=1` in the URL. `window.__bringStats()` is separate and always available.
 */
export const PROFILE = typeof location !== 'undefined' && new URLSearchParams(location.search).get('profile') === '1'

export function plog(...args: unknown[]): void {
  if (PROFILE) console.log('PROFILE', ...args)
}
