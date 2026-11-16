/**
 * devmaps data: what tools/devmaps-prep.ts wrote (public/devmaps/<city>/) and the raw bake tiles
 * (public/cities/<city>/v3/<tx>_<ty>.json), both fetched lazily and held in small LRU caches.
 * Everything here is in v2 metres: x east, z north (src/city/geo.ts).
 */
import { Projection } from '../city/geo.ts'

// ---- tunables ----
/** chunks held at once (a Paris chunk is up to 5 MB of JSON) */
export const CHUNK_CACHE = 16
/** raw tiles held at once */
export const TILE_CACHE = 120

export interface Street { t: string; i: number; r: string; k: string; f: number; p: number[]; h: number[]; d: (number | null)[]; lv: number[]; L?: number; oz?: 1; n?: string; w?: number; gc?: 1 }
export interface Bldg { t: string; i: number; k: string; x: number; z: number; rs: number[][]; ht?: number; lod?: string; lk?: { w?: string; s?: string; src: string; on: boolean; c?: number }; st?: number; ar?: number }
export interface AreaR { t: string; i: number; k: string; p: number[]; ho?: number[][]; pk?: 1 }
export interface Chunk {
  streets: Street[]; buildings: Bldg[]; areas: AreaR[]
  items: { t: string; d: number[] }[]
  places: { t: string; i: number; k: string; n: string; x: number; z: number; tier?: number }[]
  decks: { t: string; i: number; p: number[]; h: number }[]
  boats: { t: string; i: number; p: number[]; n?: string }[]
  courts: { t: string; i: number; s: string; x: number; z: number; hd: number; l: number; w: number }[]
  ride: { m: string; p: number[]; h?: number[]; a: Record<string, unknown> }[]
}
export interface Custom { kind: 'builder' | 'statue' | 'fountain'; name: string; src: string; x: number; z: number; proc?: string; model?: string; rect?: number[]; bld?: { t: string; i: number; k: string }; approx?: string; entry: Record<string, unknown> }
export interface Legacy { quay: number[]; hedges: { points: number[]; h: number; w: number; y0?: number }[]; flats: { ring: number[]; kind: string }[]; topiary: number[]; formal: number[][] }
export interface TourLeg { p: number[]; h: number[]; km: number }
export interface Tour { id: string; name: string; blurb?: string; partial?: boolean; stops: { lat: number; lon: number; name?: string; text?: string; x: number; z: number; off?: boolean }[]; legs: TourLeg[] }
export interface Meta {
  prepped: string; chunk: number; levelTol: number
  index: { id: string; name: string; origin: { lat: number; lon: number }; tile: number; zFloor: number; datumMsl?: number; radius: number; box?: { x0: number; x1: number; z0: number; z1: number }; detail?: { name: string; margin: number; rings?: number[][]; line?: number[] }[]; bake?: string; [k: string]: unknown }
  dict: { names: string[]; styles: string[]; kinds: string[]; items: string[]; archetypes: string[] }
  terrain: { x0: number; z0: number; step: number; cols: number; rows: number; lo: number; hi: number } | null
  zones: { ref: string; priority?: number; props: Record<string, unknown>; ring: number[] }[]
  water: { kind: string; ring: number[]; [k: string]: unknown }[]
  river: { name?: string; points?: number[]; [k: string]: unknown } | null
  landmarks: { id: number; name: string; kind: string; tier?: number; x: number; z: number; [k: string]: unknown }[]
  walls: { id: number; points: number[] }[]
  roundabouts: { lat: number; lon: number; r: number; R: number; name?: string }[]
  tiles: ({ key: string; tx: number; ty: number; bytes: number; buildings: number; edges: number } & Record<string, number | string>)[]
  chunks: string[]; census: Record<string, Record<string, number>>; tours: Tour[]; levelCount: number[]
  legacyCensus: Record<string, unknown>; quayWalls: number; garden: Record<string, number>
  issueCount?: Record<string, number>; issueTol?: Record<string, number>
}
/** a diagnostic from the prep (tools/devmaps-prep.ts issue checks) */
export interface Issue { k: string; m: string; x: number; z: number; t?: string; i?: number }

class LRU<V> {
  private m = new Map<string, V>()
  constructor(private cap: number) {}
  get(k: string): V | undefined { const v = this.m.get(k); if (v !== undefined) { this.m.delete(k); this.m.set(k, v) } return v }
  set(k: string, v: V): void { this.m.set(k, v); while (this.m.size > this.cap) this.m.delete(this.m.keys().next().value!) }
  has(k: string): boolean { return this.m.has(k) }
  values(): IterableIterator<V> { return this.m.values() }
}

export class CityData {
  meta!: Meta
  proj!: Projection
  liveBake: string | undefined
  terrainImg: HTMLImageElement | null = null
  major: { k: string; f: number; p: number[] }[] = []
  custom: Custom[] = []
  restyles: Record<string, unknown> = {}
  legacy: Legacy = { quay: [], hedges: [], flats: [], topiary: [], formal: [] }
  issues: Issue[] = []
  /** "tile|index" of every bake building a catalogue entry builds */
  customBldg = new Map<string, Custom>()
  private chunks = new LRU<Chunk>(CHUNK_CACHE)
  private tiles = new LRU<Record<string, unknown>>(TILE_CACHE)
  private pending = new Set<string>()
  private searchRows: (string | number)[][] | null = null
  tileSet = new Set<string>()
  chunkSet = new Set<string>()
  onLoad: () => void = () => {}

  constructor(readonly id: string) {}

  async load(): Promise<void> {
    const base = `/devmaps/${this.id}`
    this.meta = await (await fetch(`${base}/meta.json`)).json()
    this.proj = new Projection(this.meta.index.origin)
    this.major = await (await fetch(`${base}/major.json`)).json()
    try { this.custom = await (await fetch(`${base}/custom.json`)).json() } catch { this.custom = [] }
    try { this.restyles = await (await fetch(`${base}/restyles.json`)).json() } catch { /* prepped before restyles */ }
    try { this.legacy = await (await fetch(`${base}/legacy.json`)).json() } catch { /* prepped before legacy.json */ }
    try { this.issues = await (await fetch(`${base}/issues.json`)).json() } catch { /* prepped before issues.json */ }
    for (const c of this.custom) if (c.bld) this.customBldg.set(`${c.bld.t}|${c.bld.i}`, c)
    for (const t of this.meta.tiles) this.tileSet.add(t.key)
    for (const c of this.meta.chunks) this.chunkSet.add(c)
    if (this.meta.terrain) {
      const img = new Image()
      img.src = `${base}/terrain.png`
      img.onload = () => { this.terrainImg = img; this.onLoad() }
    }
    // is the prep from the same bake as the tiles on disk? (the raw tiles' dictionaries must match the prep's)
    try { this.liveBake = (await (await fetch(`/cities/${this.id}/v3/index.json`, { method: 'GET' })).json()).bake } catch { /* none */ }
  }

  /** a chunk if it is here; otherwise starts fetching it and returns undefined */
  chunk(key: string): Chunk | undefined {
    const c = this.chunks.get(key)
    if (c || !this.chunkSet.has(key) || this.pending.has('c' + key)) return c
    this.pending.add('c' + key)
    fetch(`/devmaps/${this.id}/chunk/${key}.json`).then((r) => r.json()).then((j: Chunk) => { this.chunks.set(key, j); this.pending.delete('c' + key); this.onLoad() })
      .catch(() => this.pending.delete('c' + key))
    return undefined
  }
  loadedChunks(): IterableIterator<Chunk> { return this.chunks.values() }
  /** the raw tile if it is loaded already (never fetches) */
  peekTile(key: string): Record<string, unknown> | undefined { return this.tiles.get(key) }

  /** the raw bake tile (key "tx,ty"), or undefined while it loads */
  tile(key: string): Record<string, unknown> | undefined {
    const t = this.tiles.get(key)
    if (t || !this.tileSet.has(key) || this.pending.has('t' + key)) return t
    this.pending.add('t' + key)
    const q = this.meta.index.bake ? `?b=${this.meta.index.bake}` : ''
    fetch(`/cities/${this.id}/v3/${key.replace(',', '_')}.json${q}`).then((r) => r.json()).then((j) => { this.tiles.set(key, j); this.pending.delete('t' + key); this.onLoad() })
      .catch(() => this.pending.delete('t' + key))
    return undefined
  }
  async tileNow(key: string): Promise<Record<string, unknown> | undefined> {
    const t = this.tile(key)
    if (t) return t
    for (let i = 0; i < 100 && !this.tiles.has(key); i++) await new Promise((r) => setTimeout(r, 50))
    return this.tiles.get(key)
  }

  async search(): Promise<(string | number)[][]> {
    if (!this.searchRows) this.searchRows = await (await fetch(`/devmaps/${this.id}/search.json`)).json()
    return this.searchRows!
  }

  get pendingCount(): number { return this.pending.size }

  /** v3 cm above zFloor → v2 metres, and v2 metres → above sea level when the datum is known */
  v2(zcm: number): number { return (zcm + this.meta.index.zFloor) / 100 }
  msl(v2: number): number | null { return this.meta.index.datumMsl != null ? v2 + this.meta.index.datumMsl : null }
}
