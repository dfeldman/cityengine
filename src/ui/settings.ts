/**
 * THE RIDER'S SETTINGS (docs/HUD.md): what used to be URL parameters or fixed per device, chosen in Menu → Settings
 * and kept in this browser. A URL parameter still wins over a setting, so links and tools keep working.
 *
 * Some apply at once (units, minimap, on-screen controls); some only when the ride next starts (steering, quality),
 * and the menu says so.
 */
export interface Settings {
  /** speed units: the region's own (`auto`: mph in the United States), or as chosen */
  units: 'auto' | 'mph' | 'kmh'
  /** the small corner map (owner, 2026-10-14: a setting, off by default); the big map (M, Menu → Map) is always there */
  minimap: boolean
  /** the touch effort slider: `auto` shows it once the screen is touched and hides it when a key is pressed (touching
   *  the picture steers whatever this says) */
  controls: 'auto' | 'always' | 'never'
  /** steering: held (fast input) or a turn declared at the next junction (slow input); `auto` is the mode's default */
  steering: 'auto' | 'held' | 'junctions'
  /** the device tier (src/tier.ts); `auto` is what the device looks like */
  quality: 'auto' | 'desktop' | 'phone' | 'ultra'
  /** the speed streaks at the screen's edges when going fast */
  motion: boolean
  /** the haze that thickens with distance (owner, 2026-10-15: "a graphics setting to turn fog on or off") */
  fog: boolean
  /** the hour and the weather (owner, 2026-10-15: "we should add weather to settings"); `auto` is the default look, or
   *  what a Dandyhorse launch or the address (`?time=`, `?weather=`) asks for — those win over this */
  time: 'auto' | 'dawn' | 'day' | 'dusk' | 'night'
  weather: 'auto' | 'clear' | 'overcast' | 'rain'
  /**
   * WHAT THE WORLD HAS IN IT (owner, 2026-10-14: "turn trees on and off, turn NPCs on and off"): `auto` is what the
   * device's tier carries (src/tier.ts — an iPhone leaves trees and people out for memory); on and off override it.
   * Each names the subsystems it switches (FEATURE_OFF, the game's `?without=` names).
   */
  trees: Feature
  people: Feature
  cars: Feature
  details: Feature
}
export type Feature = 'auto' | 'on' | 'off'

/** the game's subsystems (`?without=` names, game.ts `off`) each world setting switches */
export const FEATURE_OFF: Record<'trees' | 'people' | 'details', string[]> = {
  trees: ['trees', 'plants'],
  people: ['crowd', 'beachcrowd'],
  details: ['signs', 'furniture', 'fountains', 'flags'],
}

const KEY = 'cycledash.settings'
const DEFAULTS: Settings = { units: 'auto', minimap: false, controls: 'auto', steering: 'auto', quality: 'auto', motion: true, fog: true, time: 'auto', weather: 'auto',
  trees: 'auto', people: 'auto', cars: 'auto', details: 'auto' }

let current: Settings | null = null
const listeners = new Set<(s: Settings) => void>()

export function settings(): Settings {
  if (current) return current
  let saved: Partial<Settings> = {}
  try { saved = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Settings> } catch { /* private window, or junk */ }
  current = { ...DEFAULTS, ...saved }
  return current
}

export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
  current = { ...settings(), [key]: value }
  try { localStorage.setItem(KEY, JSON.stringify(current)) } catch { /* private window: this ride only */ }
  for (const f of listeners) f(current)
}

/** Called now and on every change. */
export function onSettings(f: (s: Settings) => void): void {
  listeners.add(f)
  f(settings())
}

/**
 * Every setting, described once: Menu → Settings is built from this list, a submenu per group. A new setting (sound,
 * a treadmill's speed limit, …) is a field above and an entry here; the menu needs no code for it.
 */
export interface SettingDef<K extends keyof Settings = keyof Settings> {
  key: K
  group: 'Display' | 'World' | 'Graphics' | 'Controls' | 'Gameplay' | 'Sound' | 'Equipment'
  label: string
  choices: { value: Settings[K]; label: string }[]
  /** `ride`: takes effect when the ride next starts (the menu offers to restart) */
  applies: 'now' | 'ride'
}

const def = <K extends keyof Settings>(d: SettingDef<K>): SettingDef => d as unknown as SettingDef

export const SETTING_DEFS: SettingDef[] = [
  def({ key: 'units', group: 'Display', label: 'Speed units', applies: 'now',
    choices: [{ value: 'auto', label: 'Local' }, { value: 'mph', label: 'mph' }, { value: 'kmh', label: 'km/h' }] }),
  def({ key: 'minimap', group: 'Display', label: 'Corner map', applies: 'now',
    choices: [{ value: false, label: 'Off' }, { value: true, label: 'On' }] }),
  ...(['trees', 'people', 'cars', 'details'] as const).map((key) => def({ key, group: 'World', applies: 'ride',
    label: { trees: 'Trees and plants', people: 'People on the pavements', cars: 'Traffic', details: 'Signs and street furniture' }[key],
    choices: [{ value: 'auto', label: 'Auto' }, { value: 'on', label: 'On' }, { value: 'off', label: 'Off' }] })),
  def({ key: 'quality', group: 'Graphics', label: 'Quality', applies: 'ride',
    choices: [{ value: 'auto', label: 'Auto' }, { value: 'ultra', label: 'Low' }, { value: 'phone', label: 'Medium' }, { value: 'desktop', label: 'High' }] }),
  def({ key: 'time', group: 'Graphics', label: 'Time of day', applies: 'ride',
    choices: [{ value: 'auto', label: 'Auto' }, { value: 'dawn', label: 'Dawn' }, { value: 'day', label: 'Day' }, { value: 'dusk', label: 'Dusk' }, { value: 'night', label: 'Night' }] }),
  def({ key: 'weather', group: 'Graphics', label: 'Weather', applies: 'ride',
    choices: [{ value: 'auto', label: 'Auto' }, { value: 'clear', label: 'Clear' }, { value: 'overcast', label: 'Overcast' }, { value: 'rain', label: 'Rain' }] }),
  def({ key: 'fog', group: 'Graphics', label: 'Fog', applies: 'ride',
    choices: [{ value: true, label: 'On' }, { value: false, label: 'Off' }] }),
  def({ key: 'motion', group: 'Graphics', label: 'Speed streaks', applies: 'ride',
    choices: [{ value: true, label: 'On' }, { value: false, label: 'Off' }] }),
  def({ key: 'steering', group: 'Controls', label: 'Steering', applies: 'ride',
    choices: [{ value: 'auto', label: 'Auto' }, { value: 'held', label: 'Hold to steer' }, { value: 'junctions', label: 'Pick at junctions' }] }),
  def({ key: 'controls', group: 'Controls', label: 'Effort slider', applies: 'now',
    choices: [{ value: 'auto', label: 'When touched' }, { value: 'always', label: 'Always' }, { value: 'never', label: 'Never' }] }),
]
