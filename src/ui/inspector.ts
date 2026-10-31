/**
 * THE INSPECTOR — for editing the city, not for playing it (owner, 2026-10-03: "a custom info box just for editing —
 * so I can press i, select a building and see the address, lat/long, source of the building data, as much internal
 * info as possible. this is just for me"). With `?edit=1` or `?dev=1`: I says what's in the middle of the view (owner, 2026-10-31:
 * "a key i could press in dev mode that would show what the building i was looking at was") and arms it (a crosshair); a click on a
 * building or a model fills the box, I or Esc puts it away. A building: where the click landed, its baked fields, every manifest entry that
 * names it (and the file to edit), and its OSM tags — address and all — fetched from openstreetmap.org. A model: its
 * manifest entry whole, and where it was placed. And Shift with a letter opens the spot in the middle of the view elsewhere (owner, 2026-10-31:
 * "keys in dev mode to jump to street view, mapillary, or google earth for that spot"; "maybe google maps too"): V Street View, M Mapillary,
 * B Google Earth (E is the free camera's way up, with Shift to go fast), G Google Maps.
 */
import type { Scene } from '@babylonjs/core/scene'
import { arrondissementOf, frontZone } from '../city/paris/arrondissements.ts'

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

/** Degrees as Google Earth's own search links spell them: `48%C2%B050%2707%2e5%22N+2%C2%B022%2717%2e7%22E`. */
function earthCoord(deg: number, pos: string, neg: string): string {
  const tenths = Math.round(Math.abs(deg) * 36000)
  const d = Math.floor(tenths / 36000), m = Math.floor(tenths / 600) % 60, sec = tenths % 600
  const whole = String(Math.floor(sec / 10)).padStart(2, '0')
  return `${d}%C2%B0${String(m).padStart(2, '0')}%27${whole}%2e${sec % 10}%22${deg < 0 ? neg : pos}`
}

/** The same spot in the other maps. `heading` (degrees, 0 north) is the way Street View looks. */
export function mapLinks(lat: number, lon: number, heading = 0): { streetView: string; mapillary: string; earth: string; maps: string } {
  const la = lat.toFixed(6), lo = lon.toFixed(6)
  return {
    streetView: `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${la},${lo}&heading=${Math.round(((heading % 360) + 360) % 360)}`,
    mapillary: `https://www.mapillary.com/app/?lat=${la}&lng=${lo}&z=18`,
    earth: `https://earth.google.com/web/search/${earthCoord(lat, 'N', 'S')}+${earthCoord(lon, 'E', 'W')}`,
    maps: `https://www.google.com/maps/search/?api=1&query=${la},${lo}`,
  }
}

const JUMPS: Record<string, keyof ReturnType<typeof mapLinks>> = { KeyV: 'streetView', KeyM: 'mapillary', KeyB: 'earth', KeyG: 'maps' }

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
      if (e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey && JUMPS[e.code]) {
        const at = this.spot()
        if (at) open(mapLinks(at.lat, at.lon, at.heading)[JUMPS[e.code]], '_blank')
        e.stopImmediatePropagation(); e.preventDefault()
      } else if (e.code === 'KeyI') { this.arm(!this.armed); e.stopImmediatePropagation(); e.preventDefault() }
      else if (e.code === 'Escape' && (this.armed || !this.box.hidden)) { this.arm(false); this.box.hidden = true }
    }, { capture: true })
    canvas.addEventListener('click', (e) => { if (this.armed) this.pick(e.offsetX, e.offsetY) })
  }

  /** the ground or building in the middle of the view, or under the camera when that's the sky; and which way it's looking */
  private spot(): { lat: number; lon: number; heading: number } | null {
    const s = this.src.scene, cam = s.activeCamera
    if (!cam) return null
    const e = s.getEngine()
    const hit = s.pick(e.getRenderWidth() / 2, e.getRenderHeight() / 2, (m) => m.isEnabled() && m.isVisible && !/^(sky|ground:sea)/.test(m.name))
    const p = hit?.hit && hit.pickedPoint ? hit.pickedPoint : cam.globalPosition
    const d = cam.getForwardRay().direction
    return { ...this.src.latLon(p.x, p.z), heading: (Math.atan2(d.x, d.z) * 180) / Math.PI }
  }

  private arm(on: boolean): void {
    this.armed = on
    document.body.classList.toggle('sr-inspect-on', on)
    if (on) {
      // what you're looking at, straight away; a click picks anything else
      const e = this.src.scene.getEngine()
      this.pick(e.getRenderWidth() / 2, e.getRenderHeight() / 2, true)
    } else this.box.hidden = true
  }

  private show(title: string, body: string): void {
    this.box.hidden = false
    this.box.innerHTML = `<h3>${esc(title)}</h3>${body}`
  }

  private pick(x: number, y: number, buildingFirst = false): void {
    const s = this.src.scene
    // (the middle of the view: the building or model it's on, though a pavement or a tree is in front of it)
    const front = buildingFirst ? s.pick(x, y, (m) => m.isEnabled() && m.isVisible && /^(b:|fringe|landmark:(?!shadow))/.test(m.name)) : null
    const hit = front?.hit ? front : s.pick(x, y, (m) => m.isEnabled() && m.isVisible && !/^(sky|ground:sea)/.test(m.name))
    if (!hit?.hit || !hit.pickedMesh || !hit.pickedPoint) { this.show('Nothing there', ''); return }
    const p = hit.pickedPoint
    const ll = this.src.latLon(p.x, p.z)
    const arr = arrondissementOf(ll.lat, ll.lon)
    const links = mapLinks(ll.lat, ll.lon)
    const where = `<span class="k">at</span> ${ll.lat.toFixed(6)}, ${ll.lon.toFixed(6)}  <span class="k">world</span> ${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)}\n`
      + (arr !== null ? `<span class="k">arrondissement</span> ${arr}  <span class="k">fronts</span> ${frontZone(ll.lat, ll.lon)}\n` : '')
      + `<a href="${links.streetView}" target="_blank">Street View</a> · <a href="${links.mapillary}" target="_blank">Mapillary</a> · `
      + `<a href="${links.earth}" target="_blank">Earth</a> · <a href="${links.maps}" target="_blank">Maps</a> · `
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
    const named = entries.find((e) => typeof e.name === 'string')?.name as string | undefined
    const facts = [b.style, b.height !== undefined ? `${b.height} m` : '', b.levels !== undefined ? `${b.levels} storeys` : ''].filter(Boolean).join(' · ')
    const fields = Object.entries(b).filter(([k]) => k !== 'ring' && k !== 'holes').map(([k, v]) => `  ${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join('\n')
    const ent = entries.length ? entries.map((e) => `  ${esc(String(e._file ?? '?'))}: ${esc(JSON.stringify(e))}`).join('\n') : '  (none — the city draws it from OSM alone)'
    this.show(named ?? `An ordinary building: ${facts}`, `${named ? `${esc(facts)}\n` : ''}${where}<span class="k">mesh</span> ${esc(name)}  <span class="k">tile</span> ${got?.tile ?? '?'}\n`
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
