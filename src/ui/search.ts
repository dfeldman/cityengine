/**
 * SEARCH: every landmark in the city, on a screen of its own (Menu → Search), filtered as you type; choose one and
 * the rider is there (owner, 2026-10-21: "bring back landmark search … this will help with debugging too").
 *
 * WHY THE OLD ONE "NEVER WORKED" (BUGS.md #168, then hidden behind `?dev=1`). It was a `<datalist>` over the large
 * map, and it:
 *  - knew where barely a tenth of the landmarks were. Most manifest entries name their building by OSM id alone, and
 *    the game learns where such a building is only when its tile streams in, so the list held what had loaded round
 *    the rider at start, the 233 entries with a lat/lon, and the 256 OSM-named buildings. The other ~2 000 — the Opera
 *    Plaza towers, the hospitals, every restyled block — were not there at all. Now `tools/landmark-where.ts` reads
 *    the whole bake once and writes `public/landmarks/<region>.where.json`, a lat/lon for every OSM ref.
 *  - keyed on the name, so the 13 names used more than once (19 Golden Gateway Commons houses) kept one each, and the
 *    167 entries without a name could not be found at all.
 *  - matched by "the first name that contains it", case-sensitively on accents and punctuation, in the browser's own
 *    datalist whose matching and look differ on every browser and which phones barely show.
 * Here every entry is a row, matched word by word (see `score`), and the row says what the entry IS — its builder,
 * its OSM ids, the manifest file it lives in, its coordinates — so it doubles as a way to find an entry to fix.
 */
import { parseLatLon } from './goto.ts'

/** one row: a manifest entry, an OSM-named building, or a typed "lat, lon" */
export interface Place {
  name: string
  lat?: number
  lon?: number
  /** the second line: builder, ids, file, coordinates */
  detail: string
  /** everything searchable beside the name (builder, restyle, ids, file, kind), as words */
  also: string
  /** the order when nothing is typed */
  sortKey: string
}

/** lower case, no accents, punctuation as spaces: "Saint-Eustache" and "st eustache" meet halfway */
export function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()
    .replace(/['’]/g, '').replace(/[^a-z0-9.]+/g, ' ').replace(/(^|\s)\.+|\.+(\s|$)/g, ' ').trim()
}

interface Indexed { p: Place; name: string; nameWords: string[]; also: string; alsoWords: string[] }

/** one letter changed, dropped or added: "transamerca", "embarcardero" */
function nearPrefix(word: string, t: string): boolean {
  if (t.length < 4 || word.length < t.length - 1) return false
  for (const w of [word.slice(0, t.length), word.slice(0, t.length - 1), word.slice(0, t.length + 1)]) {
    if (Math.abs(w.length - t.length) > 1) continue
    // a one-edit check, the plain dynamic programme on two short strings
    let prev = Array.from({ length: w.length + 1 }, (_, i) => i)
    for (let i = 1; i <= t.length; i++) {
      const cur = [i]
      for (let j = 1; j <= w.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (t[i - 1] === w[j - 1] ? 0 : 1))
      }
      prev = cur
    }
    if (prev[w.length] <= 1) return true
  }
  return false
}

/**
 * How well a place matches, 0 for not at all. EVERY typed word has to find itself — as the start of a word of the
 * name (best), anywhere in the name, as the start of a word of the rest (builder, OSM id, file), anywhere in the
 * rest — or, when nothing at all matches like that (`typos`), as the start of a name word with one typo. A name that
 * begins with the whole query, or is it, wins.
 */
function score(x: Indexed, q: string, tokens: string[], typos: boolean): number {
  let total = 0
  for (const t of tokens) {
    let s = 0
    if (x.nameWords.includes(t)) s = 6
    else if (x.nameWords.some((w) => w.startsWith(t))) s = 5
    else if (x.name.includes(t)) s = 3
    else if (x.alsoWords.some((w) => w.startsWith(t))) s = 2.5
    else if (x.also.includes(t)) s = 1.5
    else if (typos && x.nameWords.some((w) => nearPrefix(w, t))) s = 1
    if (!s) return 0
    total += s
  }
  if (x.name === q) total += 20
  else if (x.name.startsWith(q)) total += 10
  return total
}

export class PlaceIndex {
  private readonly all: Indexed[]
  constructor(places: Place[]) {
    this.all = places.map((p) => {
      const name = normalize(p.name)
      const also = normalize(p.also)
      return { p, name, nameWords: name.split(' '), also, alsoWords: also.split(' ') }
    }).sort((a, b) => (a.p.sortKey < b.p.sortKey ? -1 : a.p.sortKey > b.p.sortKey ? 1 : 0))
  }

  get size(): number { return this.all.length }

  /** the places matching `text`, best first; all of them, in order, for nothing typed */
  find(text: string): Place[] {
    const q = normalize(text)
    const out: Place[] = []
    // a pasted "lat, lon" is a place too (what Google Maps copies)
    const ll = parseLatLon(text)
    if (ll && /^[\s(]*-?\d/.test(text)) out.push({ name: `${ll.lat.toFixed(6)}, ${ll.lon.toFixed(6)}`, ...ll, detail: 'go to these coordinates', also: '', sortKey: '' })
    if (!q) return [...out, ...this.all.map((x) => x.p)]
    const tokens = q.split(' ')
    const hits: { p: Place; s: number; n: number }[] = []
    // a typo is forgiven only when nothing is spelt that way: "coit" should not bring "Coterie" and "City Hall"
    for (const typos of [false, true]) {
      for (const x of this.all) {
        const s = score(x, q, tokens, typos)
        if (s) hits.push({ p: x.p, s, n: x.name.length })
      }
      if (hits.length) break
    }
    // (stable: equal scores stay in alphabetical order, the shorter name first)
    hits.sort((a, b) => b.s - a.s || a.n - b.n)
    return [...out, ...hits.map((h) => h.p)]
  }
}

/** what the manifest says, loosely: the game's LandmarkEntry and the keys only the tools read */
type Entry = {
  name?: string; osm?: string | string[]; lat?: number; lon?: number; within?: [number, number][]
  procedural?: string; restyle?: string; file?: string; kind?: string; by?: string; _file?: string; aliases?: string[]
}
/** an OSM-named building the bake found (city/package.ts PackedLandmark), in local metres */
type Named = { id: number; name: string; kind: string; x: number; z: number }

const fix = (n: number): string => n.toFixed(5)
/** the order of the full list: names, then street addresses ("1 Kearny Street"), then entries with no name */
const rank = (name: string | undefined): number => (!name ? 2 : /^\d/.test(name) ? 1 : 0)
const refs = (e: Entry): string[] => (e.osm === undefined ? [] : Array.isArray(e.osm) ? e.osm : [e.osm])
const packed = (ref: string): number => { const [k, n] = ref.split('/'); return k === 'relation' ? Number(n) * 2 + 1 : Number(n) }

/**
 * Every place worth a row. A manifest entry is placed by its own lat/lon, else the middle of its `within`, else the
 * bake's centre of its first OSM building (`where`, tools/landmark-where.ts), else an OSM-named building with the
 * same id. One with none of those still gets a row — "not placed" is worth knowing when debugging.
 */
export function landmarkPlaces(entries: Entry[], where: Record<string, [number, number]>, named: Named[],
                               toLatLon: (p: { x: number; z: number }) => { lat: number; lon: number }): Place[] {
  const namedById = new Map(named.map((l) => [l.id, l]))
  const taken = new Set<number>()
  const out: Place[] = []
  for (const e of entries) {
    const rs = refs(e)
    if (!e.name && !rs.length && e.lat === undefined) continue   // a `_removed` tombstone
    for (const r of rs) taken.add(packed(r))
    let ll: { lat: number; lon: number } | undefined
    if (e.lat !== undefined && e.lon !== undefined) ll = { lat: e.lat, lon: e.lon }
    else if (e.within?.length) ll = { lat: e.within.reduce((a, q) => a + q[0], 0) / e.within.length, lon: e.within.reduce((a, q) => a + q[1], 0) / e.within.length }
    else {
      const r = rs.find((q) => where[q])
      if (r) ll = { lat: where[r][0], lon: where[r][1] }
      else {
        const n = rs.map((q) => namedById.get(packed(q))).find(Boolean)
        if (n) ll = toLatLon(n)
      }
    }
    const builder = e.procedural ?? (e.restyle ? `restyle ${e.restyle}` : e.file ? e.file.replace(/^.*\//, '') : e.kind ?? '')
    const name = e.name || `${builder || 'unnamed'} ${rs[0] ?? ''}`.trim()
    const ids = rs.length > 2 ? `${rs.slice(0, 2).join(' ')} +${rs.length - 2}` : rs.join(' ')
    const detail = [builder, ids, e.by ? `by ${e.by}` : '', e._file ?? '', ll ? `${fix(ll.lat)}, ${fix(ll.lon)}` : 'not placed']
      .filter(Boolean).join(' · ')
    out.push({
      name, ...ll, detail,
      also: [builder, e.procedural ?? '', e.restyle ?? '', e.kind ?? '', e.file ?? '', ...rs, e.by ?? '', e._file ?? '', ...(e.aliases ?? [])].join(' '),
      sortKey: `${rank(e.name)}${normalize(name)}`,
    })
  }
  // the bake's own named buildings that no entry claims: churches, schools, museums the plates and the map name
  for (const l of named) {
    if (taken.has(l.id)) continue
    const ll = toLatLon(l)
    out.push({ name: l.name, ...ll, detail: `OSM ${l.kind} · id ${l.id} · ${fix(ll.lat)}, ${fix(ll.lon)}`, also: `osm ${l.kind} ${l.id}`, sortKey: `${rank(l.name)}${normalize(l.name)}` })
  }
  return out
}

/** the whereabouts file, or nothing (a city never run through tools/landmark-where.ts) */
export async function loadWhere(base: string, names: string[]): Promise<Record<string, [number, number]>> {
  for (const n of names) {
    const r = await fetch(new URL(`landmarks/${n}.where.json`, base).href).catch(() => null)
    // (Vite answers a missing file with the app's page and a 200)
    if (r?.ok && (r.headers.get('content-type') ?? '').includes('json')) return ((await r.json()) as { at: Record<string, [number, number]> }).at
  }
  return {}
}

export const SEARCH_CSS = `
.sr-search { position: fixed; inset: 0; z-index: 50; display: none; justify-content: center; align-items: flex-start;
  background: rgba(6,8,14,.6); backdrop-filter: blur(3px); color: var(--text); font: 600 16px/1.3 var(--font) }
.sr-search.on { display: flex }
.sr-search .panel { width: min(640px, 100vw); height: 100%; max-height: 100dvh; display: flex; flex-direction: column;
  background: var(--panel); border-left: 2px solid var(--border); border-right: 2px solid var(--border); box-shadow: var(--shadow) }
@media (min-width: 680px) { .sr-search { padding: 16px 0 } .sr-search .panel { border: 2px solid var(--border); border-radius: var(--radius); max-height: calc(100dvh - 32px) } }
.sr-search .head { display: flex; gap: 8px; align-items: center; padding: 12px 12px 6px }
/* 16 px at least: anything smaller and iOS Safari zooms the page on focus */
.sr-search input { flex: 1; min-width: 0; font: 600 17px/1.2 var(--font); color: var(--text); background: var(--panel-solid);
  border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 11px 14px; appearance: none; -webkit-appearance: none }
.sr-search input::placeholder { color: var(--muted) }
.sr-search input:focus-visible { outline: 3px solid var(--page); outline-offset: 1px }
.sr-search .x { background: none; border: 0; color: var(--muted); font: 700 22px/1 var(--font); cursor: pointer; padding: 10px; min-width: 44px; min-height: 44px }
.sr-search .count { padding: 0 16px 6px; font-size: 13px; color: var(--muted) }
.sr-search ul { list-style: none; margin: 0; padding: 0 8px 12px; overflow-y: auto; flex: 1; overscroll-behavior: contain }
.sr-search li { padding: 8px 10px; border-radius: 10px; cursor: pointer; border: 2px solid transparent }
.sr-search li.focus { background: var(--page); color: var(--on-page) }
.sr-search li .d { font: 500 12px/1.35 ui-monospace, SFMono-Regular, Menlo, monospace; opacity: .7; overflow-wrap: anywhere }
.sr-search li.off { opacity: .45; cursor: default }
.sr-search li.more { color: var(--muted); font-size: 14px; cursor: default; text-align: center }
`

const PAGE = 120

/**
 * The screen. Up / Down (and Page Up / Down) move through the list, Enter goes, Esc closes; typing goes to the box,
 * which is always focused. While it is open it takes every key before the ride does (capture phase, as the menu).
 */
export class SearchScreen {
  private readonly el: HTMLElement
  private readonly input: HTMLInputElement
  private readonly list: HTMLUListElement
  private readonly countEl: HTMLElement
  private index: PlaceIndex | null = null
  private loading: Promise<PlaceIndex> | null = null
  private hits: Place[] = []
  private shown = 0
  private focus = 0
  /** told when it opens and closes (the ride is held while it is open) */
  onChange: ((open: boolean) => void) | null = null
  /** a place was chosen: go there; returns why not, or null */
  onPick: ((p: Place) => string | null) | null = null

  constructor(private readonly build: () => Promise<Place[]>) {
    this.el = document.createElement('div')
    this.el.className = 'sr-search'
    this.el.innerHTML = '<div class="panel" role="dialog" aria-label="Search landmarks"><div class="head">'
      + '<input type="search" placeholder="Search landmarks…" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="go" aria-label="Search landmarks">'
      + '<button class="x" aria-label="Close">✕</button></div><div class="count"></div><ul role="listbox"></ul></div>'
    this.input = this.el.querySelector('input')!
    this.list = this.el.querySelector('ul')!
    this.countEl = this.el.querySelector('.count')!
    this.el.querySelector('.x')!.addEventListener('click', () => this.close())
    this.el.addEventListener('pointerdown', (e) => { if (e.target === this.el) this.close() })
    this.input.addEventListener('input', () => this.refresh())
    this.list.addEventListener('scroll', () => {
      if (this.list.scrollTop + this.list.clientHeight > this.list.scrollHeight - 300) this.more()
    })
    document.body.appendChild(this.el)
    addEventListener('keydown', (e) => this.key(e), true)
    addEventListener('keyup', (e) => { if (this.isOpen) e.stopImmediatePropagation() }, true)
  }

  get isOpen(): boolean { return this.el.classList.contains('on') }

  open(): void {
    if (this.isOpen) return
    this.el.classList.add('on')
    this.onChange?.(true)
    this.input.value = ''
    // focused on the NEXT tick: focused inside the keydown or click that opened it, the key lands in the box
    setTimeout(() => { if (this.isOpen) this.input.focus() }, 0)
    if (this.index) { this.refresh(); return }
    this.countEl.textContent = 'loading…'
    this.loading ??= this.build().then((p) => (this.index = new PlaceIndex(p)))
    void this.loading.then(() => { if (this.isOpen) this.refresh() })
  }

  close(): void {
    if (!this.isOpen) return
    this.el.classList.remove('on')
    this.input.blur()
    this.onChange?.(false)
  }

  private refresh(): void {
    if (!this.index) return
    this.hits = this.index.find(this.input.value)
    this.focus = 0
    this.shown = 0
    this.list.innerHTML = ''
    this.list.scrollTop = 0
    const q = this.input.value.trim()
    this.countEl.textContent = q ? `${this.hits.length} of ${this.index.size} match` : `${this.index.size} landmarks · type to filter`
    this.more()
  }

  /** the next page of rows: thousands of them at once is a stall on a phone, and nobody scrolls that far */
  private more(): void {
    if (this.shown >= this.hits.length) return
    this.list.querySelector('li.more')?.remove()
    const end = Math.min(this.hits.length, this.shown + PAGE)
    for (let i = this.shown; i < end; i++) {
      const p = this.hits[i]
      const li = document.createElement('li')
      li.setAttribute('role', 'option')
      if (p.lat === undefined) li.classList.add('off')
      if (i === this.focus) li.classList.add('focus')
      const n = document.createElement('div')
      n.textContent = p.name
      const d = document.createElement('div')
      d.className = 'd'
      d.textContent = p.detail
      li.append(n, d)
      li.addEventListener('click', () => { this.setFocus(i); this.pick() })
      // the mouse MOVING onto a row: a row arriving under a still pointer as the list changes is not a choice
      li.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' && this.focus !== i) this.setFocus(i, false) })
      this.list.appendChild(li)
    }
    this.shown = end
    if (end < this.hits.length) {
      const li = document.createElement('li')
      li.className = 'more'
      li.textContent = `${this.hits.length - end} more…`
      this.list.appendChild(li)
    }
  }

  private setFocus(i: number, scroll = true): void {
    if (!this.hits.length) return
    i = Math.max(0, Math.min(this.hits.length - 1, i))
    while (i >= this.shown) this.more()
    this.list.children[this.focus]?.classList.remove('focus')
    this.focus = i
    const li = this.list.children[i]
    li?.classList.add('focus')
    if (scroll) li?.scrollIntoView({ block: 'nearest' })
  }

  private pick(): void {
    const p = this.hits[this.focus]
    if (!p || p.lat === undefined) return
    const why = this.onPick?.(p) ?? null
    if (why) { this.countEl.textContent = why; return }
    this.close()
  }

  private key(e: KeyboardEvent): void {
    if (!this.isOpen) return
    // nothing behind the screen hears a key while it is open; typing still reaches the box
    e.stopImmediatePropagation()
    switch (e.key) {
      case 'ArrowDown': this.setFocus(this.focus + 1); break
      case 'ArrowUp': this.setFocus(this.focus - 1); break
      case 'PageDown': this.setFocus(this.focus + 10); break
      case 'PageUp': this.setFocus(this.focus - 10); break
      case 'Enter': if (!e.repeat) this.pick(); break
      case 'Escape': case 'GoBack': case 'BrowserBack': this.close(); break
      default:
        // a key pressed with the box unfocused (after a click on a row) types into it, as anybody would expect
        if (document.activeElement !== this.input && e.key.length === 1 && !e.metaKey && !e.ctrlKey) this.input.focus()
        return
    }
    e.preventDefault()
  }
}
