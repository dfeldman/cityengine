/**
 * The landmark card (user, 2026-09-22): an optional box with a few lines about the major landmark the rider
 * is nearest — its name, what it is, when it was built, and a short note — with how far it is and which way.
 * The notes are per region (`public/landmarks/<region>-info.json`); a landmark without one is not shown.
 *
 * I toggles it (and the × on the card); the choice is remembered in this browser. It changes only when the
 * nearest landmark does, and fades between them.
 */
export interface LandmarkInfo { kind: string; year?: string; text: string }

export const CARD_CSS = `
.sr-landmark-card { position: fixed; left: 16px; bottom: 64px; width: min(360px, 44vw); padding: 14px 16px 14px;
  z-index: 5; transition: opacity .4s ease, transform .4s ease; }
.sr-landmark-card.hidden { opacity: 0; transform: translateY(8px); pointer-events: none; }
.sr-landmark-card h2 { margin: 8px 0 2px; font: 800 21px/1.2 var(--font); }
.sr-landmark-card .meta { font: 600 13px/1.3 var(--font); color: var(--muted); }
.sr-landmark-card p { margin: 8px 0 0; font: 14px/1.45 var(--font); color: var(--text); }
.sr-landmark-card .where { float: right; font: 700 13px/1 var(--font); color: var(--page); margin: 3px 26px 0 0; }
.sr-landmark-card .close { position: absolute; top: 8px; right: 10px; background: none; border: none; color: var(--muted);
  font: 20px/1 var(--font); cursor: pointer; padding: 2px 4px; }
.sr-info-toggle { position: fixed; left: 16px; bottom: 44px; z-index: 5; font: 700 13px/1 var(--font); color: var(--text);
  background: var(--panel); border: 1px solid var(--border); border-radius: 999px; padding: 8px 12px; cursor: pointer;
  box-shadow: var(--shadow); }
`

const KEY = 'streetrunner.landmarkCard'

export class LandmarkCard {
  private readonly card: HTMLElement
  private readonly toggle: HTMLButtonElement
  private info: Record<string, LandmarkInfo> = {}
  private showing: string | null = null
  private on: boolean

  constructor(private readonly places: () => Iterable<{ name: string; x: number; z: number }>) {
    let saved: string | null = null
    try { saved = localStorage.getItem(KEY) } catch { /* private window */ }
    this.on = saved !== 'off'
    this.card = document.createElement('div')
    this.card.className = 'sr-card sr-landmark-card hidden'
    this.toggle = document.createElement('button')
    this.toggle.className = 'sr-info-toggle'
    this.toggle.textContent = 'ⓘ Landmarks'
    this.toggle.title = 'Show notes on the landmarks nearby (I)'
    this.toggle.addEventListener('click', () => { this.set(true); this.toggle.blur() })
    document.body.append(this.card, this.toggle)
    addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.code === 'KeyI') this.set(!this.on)
    })
    this.apply()
  }

  async load(base: string, names: string[]): Promise<void> {
    for (const n of names) {
      try {
        const r = await fetch(new URL(`landmarks/${n}-info.json`, base).href)
        const t = await r.text()
        if (r.ok && t.trimStart().startsWith('{')) { this.info = JSON.parse(t) as Record<string, LandmarkInfo>; return }
      } catch { /* the next */ }
    }
  }

  get isOn(): boolean { return this.on }

  set(on: boolean): void {
    this.on = on
    try { localStorage.setItem(KEY, on ? 'on' : 'off') } catch { /* private window */ }
    this.showing = null
    this.apply()
  }

  private apply(): void {
    // (the ⓘ button that brought the card back is not shown any more: Menu → Settings → Display → Landmark notes,
    // or I — docs/HUD.md, nothing on screen that is not needed in the next ten seconds)
    this.toggle.style.display = 'none'
    if (!this.on) this.card.classList.add('hidden')
  }

  private last = 0
  /** a few times a second: the nearest landmark with a note, within 300 m, ahead of the rider preferred */
  update(at: { x: number; z: number }, heading: number): void {
    if (!this.on) return
    const now = performance.now()
    if (now - this.last < 400) return
    this.last = now
    let best: { name: string; d: number; score: number; x: number; z: number } | null = null
    for (const p of this.places()) {
      const key = this.info[p.name] ? p.name : this.info[p.name.replace(/ — .*$/, '')] ? p.name.replace(/ — .*$/, '') : null
      if (!key) continue
      const dx = p.x - at.x
      const dz = p.z - at.z
      const d = Math.hypot(dx, dz)
      if (d > 300) continue
      // behind the rider counts as half again as far: what is coming up is what they want to know about
      const ahead = (dx * Math.sin(heading) + dz * Math.cos(heading)) / (d || 1)
      const score = d * (ahead < -0.3 ? 1.5 : 1)
      if (!best || score < best.score) best = { name: key, d, score, x: p.x, z: p.z }
    }
    if (!best) {
      if (this.showing !== null) { this.card.classList.add('hidden'); this.showing = null }
      return
    }
    const bearing = Math.atan2(best.x - at.x, best.z - at.z) - heading
    const rel = Math.atan2(Math.sin(bearing), Math.cos(bearing))
    const side = Math.abs(rel) < 0.4 ? 'ahead' : Math.abs(rel) > 2.6 ? 'behind' : rel > 0 ? 'on your right' : 'on your left'
    const where = `${best.d < 40 ? 'here' : `${Math.round(best.d / 10) * 10} m ${side}`}`
    if (this.showing === best.name) {
      const w = this.card.querySelector('.where')
      if (w) w.textContent = where
      return
    }
    this.showing = best.name
    const i = this.info[best.name]
    this.card.innerHTML = ''
    const close = document.createElement('button')
    close.className = 'close'
    close.textContent = '×'
    close.title = 'Hide (I)'
    close.addEventListener('click', () => this.set(false))
    const pill = document.createElement('span')
    pill.className = 'sr-pill'
    pill.textContent = i.kind
    const w = document.createElement('span')
    w.className = 'where'
    w.textContent = where
    const h = document.createElement('h2')
    h.textContent = best.name.replace(/ — .*$/, '')
    const meta = document.createElement('div')
    meta.className = 'meta'
    meta.textContent = i.year ?? ''
    const p = document.createElement('p')
    p.textContent = i.text
    this.card.append(close, pill, w, h, meta, p)
    this.card.classList.remove('hidden')
  }
}
