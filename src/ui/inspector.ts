/**
 * THE INSPECTOR — for editing the city, not for playing it (owner, 2026-10-03: "a custom info box just for editing —
 * so I can press i, select a building and see the address, lat/long, source of the building data, as much internal
 * info as possible. this is just for me"). With `?edit=1`: I arms it (a crosshair), a click on a building or a model
 * fills the box, I or Esc puts it away. A building: where the click landed, its baked fields, every manifest entry that
 * names it (and the file to edit), and its OSM tags — address and all — fetched from openstreetmap.org. A model: its
 * manifest entry whole, and where it was placed.
 */
import type { Scene } from '@babylonjs/core/scene'

export interface InspectorSources {
  scene: Scene
  /** world → lat/lon */
  latLon(x: number, z: number): { lat: number; lon: number }
  /** a baked building by id, with the tile it came in */
  building(id: number): { tile: string; b: Record<string, unknown> } | null
  /** the manifest entries naming this building id (directly, or through the outline it is a part of) */
  entriesFor(id: number, partOf?: number): Record<string, unknown>[]
  /** a model's manifest entry and its placement, by the model's name */
  model(name: string): { entry: Record<string, unknown> | null; placed: Record<string, unknown> | null }
}

const CSS = `
.sr-inspect { position: fixed; z-index: 50; right: 12px; top: 64px; width: min(460px, 94vw); max-height: 78vh; overflow: auto;
  background: rgba(14,18,28,.94); color: #e8edf5; font: 12px/1.45 ui-monospace, Menlo, monospace; border-radius: 10px;
  padding: 10px 12px; box-shadow: 0 8px 30px rgba(0,0,0,.45); white-space: pre-wrap; word-break: break-word }
.sr-inspect h3 { margin: 0 0 6px; font: 700 14px/1.3 system-ui, sans-serif; color: #ffd27a }
.sr-inspect a { color: #8fd0ff }
.sr-inspect .k { color: #9aa6ba }
.sr-inspect-on canvas { cursor: crosshair !important }
`

export class Inspector {
  private armed = false
  private readonly box: HTMLDivElement
  constructor(private readonly src: InspectorSources, canvas: HTMLCanvasElement) {
    const st = document.createElement('style')
    st.textContent = CSS
    document.head.appendChild(st)
    this.box = document.createElement('div')
    this.box.className = 'sr-inspect'
    this.box.hidden = true
    document.body.appendChild(this.box)
    addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select')) return
      if (e.code === 'KeyI') { this.arm(!this.armed); e.stopImmediatePropagation(); e.preventDefault() }
      else if (e.code === 'Escape' && (this.armed || !this.box.hidden)) { this.arm(false); this.box.hidden = true }
    }, { capture: true })
    canvas.addEventListener('click', (e) => { if (this.armed) this.pick(e.offsetX, e.offsetY) })
  }

  private arm(on: boolean): void {
    this.armed = on
    document.body.classList.toggle('sr-inspect-on', on)
    if (on) this.show('Inspector', 'click a building or a model · I or Esc to stop')
    else this.box.hidden = true
  }

  private show(title: string, body: string): void {
    this.box.hidden = false
    this.box.innerHTML = `<h3>${esc(title)}</h3>${body}`
  }

  private pick(x: number, y: number): void {
    const s = this.src.scene
    const hit = s.pick(x, y, (m) => m.isEnabled() && m.isVisible && !/^(sky|ground:sea)/.test(m.name))
    if (!hit?.hit || !hit.pickedMesh || !hit.pickedPoint) { this.show('Nothing there', ''); return }
    const p = hit.pickedPoint
    const ll = this.src.latLon(p.x, p.z)
    const where = `<span class="k">at</span> ${ll.lat.toFixed(6)}, ${ll.lon.toFixed(6)}  <span class="k">world</span> ${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)}\n`
      + `<a href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${ll.lat},${ll.lon}" target="_blank">Street View</a> · `
      + `<a href="https://www.openstreetmap.org/#map=19/${ll.lat}/${ll.lon}" target="_blank">OSM map</a>\n`
    const m = hit.pickedMesh
    const name = m.name
    // a model
    if (name.startsWith('landmark:')) {
      const n = name.slice('landmark:'.length)
      const got = this.src.model(n)
      this.show(n, `${where}<span class="k">mesh</span> ${esc(name)}\n\n<span class="k">manifest entry</span> ${esc(String(got.entry?._file ?? '?'))}\n${esc(JSON.stringify(got.entry, null, 1))}\n\n<span class="k">placed</span>\n${esc(JSON.stringify(got.placed, null, 1))}`)
      return
    }
    // a city building: its id from the mesh's spans
    const spans = (m.metadata?.buildingSpans ?? []) as [number, number][]
    let id: number | null = null
    for (const [start, bid] of spans) if (start <= hit.faceId) id = bid
    if (id === null) { this.show(name, `${where}<span class="k">(not a building: no ids on this mesh${spans.length ? '' : ' — buildings carry them only with ?edit=1 / ?pick=1, from tiles built after load'})</span>`); return }
    const got = this.src.building(id)
    const b = got?.b ?? {}
    const partOf = b.partOf as number | undefined
    const refs = osmRefs(id)
    const entries = this.src.entriesFor(id, partOf)
    const fields = Object.entries(b).filter(([k]) => k !== 'ring' && k !== 'holes').map(([k, v]) => `  ${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join('\n')
    const ent = entries.length ? entries.map((e) => `  ${esc(String(e._file ?? '?'))}: ${esc(JSON.stringify(e))}`).join('\n') : '  (none — the city draws it from OSM alone)'
    this.show(`Building ${id}`, `${where}<span class="k">mesh</span> ${esc(name)}  <span class="k">tile</span> ${got?.tile ?? '?'}\n`
      + `<span class="k">OSM</span> ${refs.map((r) => `<a href="https://www.openstreetmap.org/${r}" target="_blank">${r}</a>`).join(' or ')}`
      + `${partOf !== undefined ? `  <span class="k">part of</span> ${osmRefs(partOf).join(' / ')}` : ''}\n`
      + `\n<span class="k">baked</span>\n${esc(fields)}\n\n<span class="k">manifest entries naming it</span>\n${ent}\n\n<span class="k">OSM tags</span>\n<span class="osm">fetching…</span>`)
    void this.tags(refs).then((t) => { const el = this.box.querySelector('.osm'); if (el) el.textContent = t })
  }

  /** the element's tags, live from the OSM API (the address is there, and everything the bake read) */
  private async tags(refs: string[]): Promise<string> {
    for (const r of refs) {
      try {
        const got = await fetch(`https://api.openstreetmap.org/api/0.6/${r}.json`)
        if (!got.ok) continue
        const j = await got.json() as { elements?: { tags?: Record<string, string>; version?: number; timestamp?: string }[] }
        const el = j.elements?.[0]
        if (!el) continue
        return `${r} v${el.version} ${el.timestamp ?? ''}\n` + Object.entries(el.tags ?? {}).map(([k, v]) => `  ${k} = ${v}`).join('\n')
      } catch { /* the next */ }
    }
    return '(could not fetch — offline, or not a way/relation id)'
  }
}

/** a packed id's OSM element: a way keeps its id; a relation is stored as 2N+1 — so an odd id may be either */
function osmRefs(id: number): string[] {
  return id % 2 === 1 ? [`way/${id}`, `relation/${(id - 1) / 2}`] : [`way/${id}`]
}

const esc = (s: string): string => s.replace(/[&<>]/g, (c) => (c === '&' ? '&amp;' : c === '<' ? '&lt;' : '&gt;'))
