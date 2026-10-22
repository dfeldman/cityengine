/**
 * THE PAUSE MENU (docs/HUD.md; owner, 2026-10-14: "a pause menu with submenus … accessible both on mobile and desktop.
 * Our users have a variety of devices from laptops, to tablets, to PCs with limited input, phones, possibly even apple
 * tv like devices with almost no inputs").
 *
 * Everything that is not needed in the next ten seconds of riding lives here. One vertical list, one item
 * highlighted, so the whole thing works with nothing but Up / Down / Enter / Back — a TV remote, a D-pad, a keyboard —
 * and with a mouse or a finger as anyone would expect. Submenus stack: Back (Esc, Backspace, ←, a remote's Back) goes
 * up a level, and out of the menu from the top. While it is open the ride is held (game.ts `menuOpen`) and the menu
 * takes every key, so nothing behind it steers.
 *
 * The items are built by whoever opens it (game.ts), each time a list is shown, so what they say is current.
 */
export type MenuItem =
  /** do something; the menu closes unless `stay` */
  | { label: string; hint?: string; run: () => void; stay?: boolean }
  /** a submenu, built when it is opened */
  | { label: string; hint?: string; sub: () => MenuItem[] }
  /** a setting: Enter or → steps to the next choice, ← to the one before */
  | { label: string; choices: string[]; value: () => number; set: (i: number) => void; note?: string }
  /** a line of information (not selectable) */
  | { label: string; info: string }

interface Level { title: string; items: () => MenuItem[]; focus: number }

export const MENU_CSS = `
.sr-menu-button { position: fixed; top: 14px; right: 14px; z-index: 9; width: 48px; height: 48px; border-radius: 50%;
  border: 2px solid var(--border); background: var(--panel); color: var(--text); font: 800 22px/1 var(--font);
  box-shadow: var(--shadow); backdrop-filter: blur(6px); display: grid; place-items: center; padding: 0; cursor: pointer;
  touch-action: manipulation; -webkit-tap-highlight-color: transparent }
/* while the big map is open the button closes it (game.ts toggleMap): ☰ becomes ✕ */
.sr-map-open .sr-menu-button { font-size: 0; z-index: 7 } .sr-map-open .sr-menu-button::after { content: '✕'; font-size: 22px }
.sr-menu { position: fixed; inset: 0; z-index: 50; display: none; place-items: center; background: rgba(6,8,14,.55);
  backdrop-filter: blur(3px); font: 600 18px/1.3 var(--font); color: var(--text) }
.sr-menu.on { display: grid }
.sr-menu .panel { width: min(440px, calc(100vw - 32px)); max-height: calc(100vh - 32px); overflow: auto; background: var(--panel);
  border: 2px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow); padding: 14px }
.sr-menu .head { display: flex; align-items: center; gap: 10px; margin: 2px 4px 10px }
.sr-menu .head h2 { margin: 0; font: 800 22px/1.2 var(--font); flex: 1 }
.sr-menu .head button { background: none; border: 0; color: var(--muted); font: 700 15px/1 var(--font); cursor: pointer; padding: 8px }
.sr-menu ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px }
.sr-menu li { display: flex; align-items: center; gap: 12px; min-height: 48px; padding: 8px 14px; border-radius: 12px;
  cursor: pointer; border: 2px solid transparent }
.sr-menu li.focus { background: var(--page); color: var(--on-page); border-color: var(--page) }
.sr-menu li .l { flex: 1 }
.sr-menu li .h { font-size: 14px; opacity: .7 }
.sr-menu li .v { font-weight: 800 }
.sr-menu li .v::before { content: '‹ '; opacity: .5 } .sr-menu li .v::after { content: ' ›'; opacity: .5 }
.sr-menu li.info { cursor: default; min-height: 36px; padding: 4px 14px }
.sr-menu li.info .h { opacity: 1; font-weight: 800; font-variant-numeric: tabular-nums }
.sr-menu li .more::after { content: '›'; font-size: 22px; opacity: .6 }
.sr-menu .note { margin: 10px 4px 0; font-size: 14px; color: var(--muted) }
`

export class Menu {
  private readonly el: HTMLElement
  private readonly list: HTMLUListElement
  private readonly titleEl: HTMLElement
  private readonly backEl: HTMLButtonElement
  private readonly noteEl: HTMLElement
  private stack: Level[] = []
  private items: MenuItem[] = []
  /** called when the menu opens or closes (the ride is held while it is open) */
  onChange: ((open: boolean) => void) | null = null

  constructor(private readonly root: () => MenuItem[]) {
    this.el = document.createElement('div')
    this.el.className = 'sr-menu'
    this.el.innerHTML = '<div class="panel" role="menu"><div class="head"><button class="back">‹ Back</button><h2></h2>'
      + '<button class="x" aria-label="Close">✕</button></div><ul></ul><div class="note"></div></div>'
    this.list = this.el.querySelector('ul')!
    this.titleEl = this.el.querySelector('h2')!
    this.backEl = this.el.querySelector('.back')!
    this.noteEl = this.el.querySelector('.note')!
    this.backEl.addEventListener('click', () => this.back())
    this.el.querySelector('.x')!.addEventListener('click', () => this.close())
    // a tap on the dimmed scene outside the panel resumes
    this.el.addEventListener('pointerdown', (e) => { if (e.target === this.el) this.close() })
    document.body.appendChild(this.el)
    // capture phase: while open, the menu has every key before the game sees it
    addEventListener('keydown', (e) => this.key(e), true)
    addEventListener('keyup', (e) => { if (this.isOpen) { e.stopImmediatePropagation() } }, true)
  }

  get isOpen(): boolean { return this.stack.length > 0 }

  open(): void {
    if (this.isOpen) return
    this.stack = [{ title: 'Paused', items: this.root, focus: 0 }]
    this.el.classList.add('on')
    this.render()
    this.onChange?.(true)
  }

  close(): void {
    if (!this.isOpen) return
    this.stack = []
    this.el.classList.remove('on')
    this.onChange?.(false)
  }

  toggle(): void { if (this.isOpen) this.close(); else this.open() }

  /** Open straight into a submenu (Settings from the welcome screen, say). */
  push(title: string, items: () => MenuItem[]): void {
    if (!this.isOpen) this.open()
    this.stack.push({ title, items, focus: 0 })
    this.render()
  }

  private back(): void {
    if (this.stack.length <= 1) { this.close(); return }
    this.stack.pop()
    this.render()
  }

  private get level(): Level { return this.stack[this.stack.length - 1] }
  private selectable(i: number): boolean { return !!this.items[i] && !('info' in this.items[i]) }

  private render(): void {
    const lv = this.level
    this.items = lv.items()
    if (!this.selectable(lv.focus)) lv.focus = this.items.findIndex((_, i) => this.selectable(i))
    this.titleEl.textContent = lv.title
    this.backEl.style.visibility = this.stack.length > 1 ? 'visible' : 'hidden'
    this.list.innerHTML = ''
    let note = ''
    this.items.forEach((it, i) => {
      const li = document.createElement('li')
      const l = document.createElement('span')
      l.className = 'l'
      l.textContent = it.label
      li.appendChild(l)
      const right = document.createElement('span')
      if ('info' in it) { li.className = 'info'; right.className = 'h'; right.textContent = it.info }
      else if ('choices' in it) { right.className = 'v'; right.textContent = it.choices[it.value()] ?? '' }
      else if ('sub' in it) { right.className = 'more'; if (it.hint) { const h = document.createElement('span'); h.className = 'h'; h.textContent = it.hint; li.appendChild(h) } }
      else if (it.hint) { right.className = 'h'; right.textContent = it.hint }
      li.appendChild(right)
      if (i === lv.focus) { li.classList.add('focus'); if ('choices' in it && it.note) note = it.note }
      if (!('info' in it)) {
        li.setAttribute('role', 'menuitem')
        // the highlight moves, the rows stay: rebuilding the list here put a new row under a press already begun on
        // the old one, so the click never arrived (a pointer that lands and presses in the same instant)
        li.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && lv.focus !== i) this.highlight(i) })
        li.addEventListener('click', () => { lv.focus = i; this.activate(1) })
      }
      this.list.appendChild(li)
    })
    this.noteEl.textContent = note
    this.noteEl.hidden = !note
    this.list.children[lv.focus]?.scrollIntoView({ block: 'nearest' })
  }

  /** focus row `i` in place, without rebuilding the list */
  private highlight(i: number): void {
    const lv = this.level
    this.list.children[lv.focus]?.classList.remove('focus')
    lv.focus = i
    this.list.children[i]?.classList.add('focus')
    const it = this.items[i]
    const note = it && 'choices' in it ? it.note ?? '' : ''
    this.noteEl.textContent = note
    this.noteEl.hidden = !note
  }

  private move(d: number): void {
    const lv = this.level
    for (let i = lv.focus + d; i >= 0 && i < this.items.length; i += d) {
      if (this.selectable(i)) { lv.focus = i; this.render(); return }
    }
  }

  private activate(dir: 1 | -1): void {
    const it = this.items[this.level.focus]
    if (!it || 'info' in it) return
    if ('choices' in it) { const n = it.choices.length; it.set((it.value() + dir + n) % n); this.render(); return }
    if (dir < 0) return
    if ('sub' in it) { this.stack.push({ title: it.label, items: it.sub, focus: 0 }); this.render(); return }
    if (!it.stay) this.close()
    it.run()
    if (it.stay && this.isOpen) this.render()
  }

  private key(e: KeyboardEvent): void {
    if (!this.isOpen) return
    // (a field inside the menu, if one is ever added, types normally)
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
    e.stopImmediatePropagation()
    e.preventDefault()
    if (e.repeat && (e.code === 'Enter' || e.code === 'Space')) return
    const focused = this.items[this.level.focus]
    switch (e.code || e.key) {
      case 'ArrowUp': case 'KeyW': this.move(-1); break
      case 'ArrowDown': case 'KeyS': this.move(1); break
      case 'ArrowRight': case 'KeyD': if (focused && 'choices' in focused) this.activate(1); else if (focused && 'sub' in focused) this.activate(1); break
      case 'ArrowLeft': case 'KeyA': if (focused && 'choices' in focused) this.activate(-1); else this.back(); break
      case 'Enter': case 'NumpadEnter': case 'Space': this.activate(1); break
      case 'Escape': case 'Backspace': case 'GoBack': case 'BrowserBack': this.back(); break
      case 'KeyP': case 'Pause': case 'ContextMenu': this.close(); break
    }
  }
}
