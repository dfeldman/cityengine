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
  /** the touch buttons and slider: `auto` shows them once the screen is touched and hides them when a key is pressed */
  controls: 'auto' | 'always' | 'never'
  /** steering: held (fast input) or a turn declared at the next junction (slow input); `auto` is the mode's default */
  steering: 'auto' | 'held' | 'junctions'
  /** the device tier (src/tier.ts); `auto` is what the device looks like */
  quality: 'auto' | 'desktop' | 'phone' | 'ultra'
  /** the speed streaks at the screen's edges when going fast */
  motion: boolean
}

const KEY = 'cycledash.settings'
const DEFAULTS: Settings = { units: 'auto', minimap: false, controls: 'auto', steering: 'auto', quality: 'auto', motion: true }

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
  group: 'Display' | 'Graphics' | 'Controls' | 'Sound' | 'Equipment'
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
  def({ key: 'quality', group: 'Graphics', label: 'Quality', applies: 'ride',
    choices: [{ value: 'auto', label: 'Auto' }, { value: 'ultra', label: 'Low' }, { value: 'phone', label: 'Medium' }, { value: 'desktop', label: 'High' }] }),
  def({ key: 'motion', group: 'Graphics', label: 'Speed streaks', applies: 'ride',
    choices: [{ value: true, label: 'On' }, { value: false, label: 'Off' }] }),
  def({ key: 'steering', group: 'Controls', label: 'Steering', applies: 'ride',
    choices: [{ value: 'auto', label: 'Auto' }, { value: 'held', label: 'Hold to steer' }, { value: 'junctions', label: 'Pick at junctions' }] }),
  def({ key: 'controls', group: 'Controls', label: 'On-screen buttons', applies: 'now',
    choices: [{ value: 'auto', label: 'When touched' }, { value: 'always', label: 'Always' }, { value: 'never', label: 'Never' }] }),
]
