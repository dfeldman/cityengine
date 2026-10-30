/**
 * BUG REPORTS, for the owner going through the city (owner, 2026-10-30: "a key b for bug. this records the time, current location,
 * orientation and a text bug report. then there would be an option to copy all the bug reports. they'd be stored in browser-local
 * storage. and we'd need a way to clear old ones. this is just for me to efficiently point out dozens of issues in the models").
 *
 * Only with `&dev=1` ("it's just for me"; "i want to zoom around the map and quickly record anything out of place"). B, always when
 * flying about paused, Shift+B beside something that can be boarded: the spot in the middle of the view and the camera are taken at
 * the press, the ride is held, you type, Enter saves. Menu → Bug reports lists them, copies them all as text to paste, and clears them: the ones already
 * copied, or all of them. Local to this browser, and it survives a reload and a re-bake.
 */
import { copyText } from './debug.ts'
import { dragToScroll } from './touch.ts'

export interface BugPlace {
  city: string
  bake?: string
  /** the spot pointed at, in the middle of the view: what is reported on, and where its marker stands */
  lat: number
  lon: number
  /** …in the city's local metres too */
  spot: { x: number; y: number; z: number }
  /** where the camera was, for a thing that shows only from up there; its compass bearing and pitch (degrees, up is positive) */
  camLat: number
  camLon: number
  cam: { x: number; y: number; z: number }
  bearing: number
  pitch: number
  /** the street, what is in the middle of the view, and the nearest landmarks */
  street?: string
  facing?: string | null
  near?: string[]
}
export interface BugReport extends BugPlace {
  id: number
  at: string
  text: string
  copied?: boolean
}

const KEY = 'sr-bug-reports'
function load(): BugReport[] {
  try {
    const got = JSON.parse(localStorage.getItem(KEY) ?? '[]') as unknown
    return Array.isArray(got) ? got as BugReport[] : []
  } catch { return [] }
}
function save(list: BugReport[]): boolean {
  try { localStorage.setItem(KEY, JSON.stringify(list)); return true } catch { return false }
}

const when = (iso: string): string => iso.slice(0, 16).replace('T', ' ')
/** one report as text: everything needed to come back to the spot and see what was seen */
export function reportText(b: BugReport, n: number): string {
  return `${n}. ${b.lat.toFixed(6)}, ${b.lon.toFixed(6)}: ${b.text}\n`
    + `   seen from ${b.camLat.toFixed(6)}, ${b.camLon.toFixed(6)}, ${b.cam.y.toFixed(0)} m up (ground zero of the city's own datum), looking ${Math.round(b.bearing)}° pitch ${Math.round(b.pitch)}°\n`
    + `   ${when(b.at)} · ${b.city}${b.bake ? ` bake ${b.bake}` : ''} · spot x ${b.spot.x.toFixed(1)} y ${b.spot.y.toFixed(1)} z ${b.spot.z.toFixed(1)}`
    + (b.street ? ` · on ${b.street}` : '') + (b.facing ? `\n   looking at: ${b.facing}` : '') + (b.near?.length ? `\n   nearest: ${b.near.join(' · ')}` : '')
}

const CSS = `
.sr-bug { position: fixed; inset: 0; z-index: 60; display: none; align-items: flex-start; justify-content: center; padding: 16px;
  background: rgba(6,8,14,.45); color: var(--text); font: 500 15px/1.35 var(--font) }
.sr-bug.on { display: flex }
.sr-bug .panel { width: min(640px, 100%); max-height: calc(100dvh - 32px); display: flex; flex-direction: column; gap: 8px; padding: 12px;
  background: var(--panel-solid); border: 2px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow) }
.sr-bug h2 { margin: 0; font: 700 16px/1.2 var(--font) }
.sr-bug .where { font-size: 12px; opacity: .75; overflow-wrap: anywhere; white-space: pre-line }
.sr-bug textarea { width: 100%; min-height: 72px; box-sizing: border-box; resize: vertical; padding: 8px; font: 500 16px/1.3 var(--font);
  color: var(--text); background: var(--panel); border: 1px solid var(--border); border-radius: 6px }
.sr-bug .row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center }
.sr-bug button { padding: 6px 12px; font: 600 14px/1.2 var(--font); color: var(--text); background: var(--panel); border: 1px solid var(--border); border-radius: 6px; cursor: pointer }
.sr-bug button.go { border-color: currentColor }
.sr-bug .grow { flex: 1 }
.sr-bug ul { margin: 0; padding: 0; list-style: none; overflow: auto; flex: 1; min-height: 60px }
.sr-bug li { display: flex; gap: 8px; align-items: flex-start; padding: 8px 2px; border-top: 1px solid var(--border) }
.sr-bug li div { flex: 1; min-width: 0; overflow-wrap: anywhere }
.sr-bug li small { display: block; font-size: 12px; opacity: .7 }
.sr-bug li.copied { opacity: .55 }
`

export class BugReports {
  private readonly el: HTMLElement
  private readonly panel: HTMLElement
  private place: BugPlace | null = null
  private note: HTMLTextAreaElement | null = null
  /** told when it opens and closes (the ride is held while it is open) */
  onChange: ((open: boolean) => void) | null = null
  /** a report's place was chosen: go there */
  onGo: ((b: BugReport) => void) | null = null
  /** told whenever the list changes: the markers follow it */
  onChanged: (() => void) | null = null
  /** told when a report is saved, to say so */
  onSaved: ((count: number, stored: boolean) => void) | null = null

  constructor() {
    const st = document.createElement('style')
    st.textContent = CSS
    document.head.appendChild(st)
    this.el = document.createElement('div')
    this.el.className = 'sr-bug'
    this.panel = document.createElement('div')
    this.panel.className = 'panel'
    this.panel.setAttribute('role', 'dialog')
    this.el.appendChild(this.panel)
    document.body.appendChild(this.el)
    this.el.addEventListener('pointerdown', (e) => { if (e.target === this.el) this.close() })
    addEventListener('keydown', (e) => this.key(e), true)
    addEventListener('keyup', (e) => { if (this.isOpen) e.stopImmediatePropagation() }, true)
  }

  get isOpen(): boolean { return this.el.classList.contains('on') }
  get count(): number { return load().length }
  get all(): BugReport[] { return load() }

  private show(): void {
    this.el.classList.add('on')
    this.onChange?.(true)
  }
  close(): void {
    if (!this.isOpen) return
    this.el.classList.remove('on')
    this.note = null
    this.onChange?.(false)
  }

  /** the keys are all ours while it is open: Enter saves, Shift+Enter is a new line, Esc goes */
  private key(e: KeyboardEvent): void {
    if (!this.isOpen) return
    if (e.key === 'Escape') { e.preventDefault(); this.close() }
    else if (e.key === 'Enter' && !e.shiftKey && this.note) { e.preventDefault(); this.submit() }
    e.stopImmediatePropagation()
  }

  /** write one: the place is what the camera had when the key was pressed, whatever it does while the words are typed */
  report(place: BugPlace): void {
    this.place = place
    const saved = this.count
    this.panel.innerHTML = '<h2>Bug report</h2><div class="where"></div><textarea placeholder="What is wrong here?"></textarea>'
      + `<div class="row"><button class="go">Save (Enter)</button><button class="x">Cancel (Esc)</button><span class="grow"></span><button class="all">All reports (${saved})</button></div>`
    // (already said? what has been reported close to this spot, so it need not be said twice)
    const close = load().filter((b) => b.city === place.city && Math.hypot(b.spot.x - place.spot.x, b.spot.z - place.spot.z) < 40)
    this.panel.querySelector('.where')!.textContent = `${place.lat.toFixed(6)}, ${place.lon.toFixed(6)} · looking ${Math.round(place.bearing)}°`
      + (place.facing ? ` · ${place.facing}` : '') + (place.near?.[0] ? ` · near ${place.near[0]}` : '')
      + (close.length ? `\nalready reported within 40 m: ${close.slice(-3).map((b) => `"${b.text.slice(0, 60)}"`).join(', ')}` : '')
    this.note = this.panel.querySelector('textarea')
    this.panel.querySelector('.go')!.addEventListener('click', () => this.submit())
    this.panel.querySelector('.x')!.addEventListener('click', () => this.close())
    this.panel.querySelector('.all')!.addEventListener('click', () => this.list())
    this.show()
    this.note!.focus()
  }

  private submit(): void {
    const text = this.note?.value.trim()
    if (!text || !this.place) { this.close(); return }
    const list = load()
    const b: BugReport = { ...this.place, id: Date.now(), at: new Date().toISOString(), text }
    list.push(b)
    const stored = save(list)
    this.close()
    this.onChanged?.()
    this.onSaved?.(list.length, stored)
  }

  /** the list, newest first, with the ways to copy and clear it */
  list(): void {
    this.note = null
    this.onChanged?.()
    const all = load()
    const fresh = all.filter((b) => !b.copied).length
    this.panel.innerHTML = `<h2>Bug reports (${all.length}${all.length !== fresh ? `, ${fresh} not yet copied` : ''})</h2>`
      + '<div class="row"><button class="go copy">Copy all</button><button class="new">Copy new</button><button class="old">Clear copied</button><button class="wipe">Clear all</button><span class="grow"></span><button class="x">Close (Esc)</button></div>'
      + '<div class="where said"></div><ul></ul>'
    const said = this.panel.querySelector('.said')!
    const copy = (which: BugReport[]): void => {
      if (!which.length) { said.textContent = 'nothing to copy'; return }
      void copyText(which.map((b, i) => reportText(b, i + 1)).join('\n')).then((ok) => {
        if (!ok) { said.textContent = 'could not copy'; return }
        const ids = new Set(which.map((b) => b.id))
        save(load().map((b) => (ids.has(b.id) ? { ...b, copied: true } : b)))
        this.list()
        this.panel.querySelector('.said')!.textContent = `${which.length} copied`
      })
    }
    this.panel.querySelector('.copy')!.addEventListener('click', () => copy(load()))
    this.panel.querySelector('.new')!.addEventListener('click', () => copy(load().filter((b) => !b.copied)))
    this.panel.querySelector('.old')!.addEventListener('click', () => { save(load().filter((b) => !b.copied)); this.list() })
    this.panel.querySelector('.wipe')!.addEventListener('click', () => {
      if (all.length && confirm(`Delete all ${all.length} bug reports?`)) { save([]); this.list() }
    })
    this.panel.querySelector('.x')!.addEventListener('click', () => this.close())
    const ul = this.panel.querySelector('ul')!
    dragToScroll(ul)
    for (const b of [...all].reverse()) {
      const li = document.createElement('li')
      if (b.copied) li.className = 'copied'
      const d = document.createElement('div')
      d.textContent = b.text
      const s = document.createElement('small')
      s.textContent = `${when(b.at)} · ${b.lat.toFixed(5)}, ${b.lon.toFixed(5)}${b.facing ? ` · ${b.facing}` : ''}`
      d.appendChild(s)
      const go = document.createElement('button')
      go.textContent = 'Go'
      go.addEventListener('click', () => { this.close(); this.onGo?.(b) })
      const del = document.createElement('button')
      del.textContent = '✕'
      del.setAttribute('aria-label', 'Delete this report')
      del.addEventListener('click', () => { save(load().filter((q) => q.id !== b.id)); this.list() })
      li.append(d, go, del)
      ul.appendChild(li)
    }
    this.show()
  }
}
