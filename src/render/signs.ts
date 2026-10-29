/**
 * The names of real places, on signs above the shops.
 *
 * OSM knows thousands of them — cafés, pharmacies, a named museum, a bakery — and almost none of them has a
 * modelled building. That is exactly what makes them worth drawing: a name on a fascia needs no building to
 * hang on, and it does more to say "this is the Marais" than another window variant ever could. A street of
 * generic shopfronts is anywhere; a street with BOULANGERIE and PHARMACIE over the doors is somewhere.
 *
 * The text is rendered once, at load, into a single atlas by the 2D canvas — the same way a game would bake
 * a font page, except the glyphs are already assembled into the words that are needed. Every sign is then a
 * quad pointing at its own cell, so the whole city's signage is one mesh and one draw call.
 *
 * Only a few hundred get a sign. Naming every shop in a neighbourhood would be both unreadable and a lot of
 * texture, so the ones chosen are the ones a rider would notice: anything cultural first, then places that
 * feed people, then ordinary shops — and never two of the same name within a block.
 */
import { Constants } from '@babylonjs/core/Engines/constants'
import { LOOKS_ON, lookFor } from '../city/appearance.ts'
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture'
import { Effect } from '@babylonjs/core/Materials/effect'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial'
import type { Scene } from '@babylonjs/core/scene'
import { MeshBuilder } from './buildings.ts'
import { DAYLIGHT, NIGHT } from './facade-material.ts'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { Terrain } from '../city/terrain.ts'
import { unpackPoints, type PackedBuilding, type PackedLandmark, type PackedPoi } from '../city/package.ts'
import { plateQuad } from '../city/landmark-place.ts'
import { inventShopNames } from '../city/shopnames.ts'
import { facesStreet, streetIndex, type StreetIndex } from '../city/frontage.ts'
import { planFacade, type FacadePlan } from '../city/facade.ts'
import type { Region } from '../city/region.ts'
import { onSurface } from './city.ts'
import { Carriageways } from '../city/carriageways.ts'
import type { TileLayer } from './city.ts'
import { TILE, tileKey, type Near } from '../city/tiles.ts'

const VERTEX = `
precision highp float;
attribute vec3 position;
attribute vec2 uv;
attribute vec4 color;
uniform mat4 worldViewProjection;
varying vec2 vUV;
varying vec3 vTint;
varying float vDepth;
void main(void) {
  gl_Position = worldViewProjection * vec4(position, 1.0);
  vUV = uv;
  vTint = color.rgb;
  vDepth = gl_Position.w;
}
`

const FRAGMENT = `
precision highp float;
varying vec2 vUV;
varying vec3 vTint;
varying float vDepth;
uniform sampler2D signs;
uniform vec3 fogColour;
uniform float fogDensity;
uniform vec3 ink;
uniform float night;
void main(void) {
  vec4 t = texture2D(signs, vUV);
  // the board is the tint, the lettering is the texture's own alpha. After dark the board falls away and
  // the letters do not: they read as lit, which is all a lit sign is from across a street
  vec3 board = vTint * (1.0 - 0.7 * night);
  vec3 c = mix(board, ink, t.a);
  float fog = 1.0 - exp(-vDepth * fogDensity);
  gl_FragColor = vec4(mix(c, fogColour, clamp(fog, 0.0, 1.0)), 1.0);
}
`

/** The atlas. Wide cells, because shop names are wide and short. */
const PAGE = 2048
const PAGE_H = 2048
/*
 * 4:1, the shape of the board it is drawn on (≈3.2 × 0.84 m). The cells were 512 × 32 — sixteen to one —
 * so every name was stretched four times taller than it was drawn, from 32 pixels of height: tall, thin and
 * blurred, which is why the signs were "mostly hard to read".
 */
const CELL_W = 256
const CELL_H = 64
/**
 * Cells kept back for invented names, which hang on the shopfronts OSM says nothing about. Each is used
 * many times across the city, never twice within a couple of blocks; the rest of the atlas is real places.
 */
const INVENTED = 400
/**
 * how close two copies of the same invented name may be. 150 m with 112 names put each one on about twenty
 * shops — "a Crêperie Sévigné on every block" (user) — so: four hundred names, and never within 450 m
 */
const REPEAT = 450

/** Board colours by what kind of place it is — a museum is not painted like a bakery. */
const BOARD: Record<PackedPoi['kind'], [number, number, number]> = {
  culture: [0.16, 0.20, 0.34],
  food: [0.42, 0.13, 0.12],
  shop: [0.14, 0.16, 0.18],
  service: [0.16, 0.28, 0.26],
}

let registered = false

/**
 * The pages' resolution against the cells' own (src/tier.ts): at 0.5 a page is a quarter of the memory — its
 * texture and the canvas behind it — and every cell is drawn through the same transform, so nothing that draws
 * into one knows. The sign pages held ~290 MB of GPU memory at full size (BUGS.md #242).
 */
let TEXT_SCALE = 1
export function setTextScale(s: number): void { TEXT_SCALE = s }

/** A junction the rider is asked about, with the streets that leave it: where the corner plaques go. */
/**
 * Lettering for streamed signs: pages of equal cells, ONE cell per distinct text, shared by every tile that
 * shows it and given back when the last of them is dropped (PARIS_EXPAND §4: signs are built per tile, in
 * the near ring). Cell 0 of each page is left empty: plain faces (iron, a pharmacy's cross) sample it and
 * take their tint. Pages are uploaded once per build, not once per name.
 */
export class TextAtlas {
  private readonly pages: { tex: DynamicTexture; mat: ShaderMaterial; free: number[]; dirty: boolean }[] = []
  private readonly cells = new Map<string, { page: number; cell: number; owners: Set<string> }>()
  private readonly byOwner = new Map<string, Set<string>>()
  readonly cols: number
  readonly perPage: number
  private readonly scene: Scene
  private readonly name: string
  private readonly pageW: number
  private readonly pageH: number
  private readonly cellW: number
  private readonly cellH: number
  private readonly draw: (ctx: CanvasRenderingContext2D, x0: number, y0: number, text: string) => void
  private readonly look: { ink: Color3; cull: boolean }
  private readonly maxPages: number

  constructor(scene: Scene, name: string, size: { pageW: number; pageH: number; cellW: number; cellH: number; maxPages: number },
    draw: (ctx: CanvasRenderingContext2D, x0: number, y0: number, text: string) => void, look: { ink: Color3; cull: boolean }) {
    this.scene = scene
    this.name = name
    this.pageW = size.pageW
    this.pageH = size.pageH
    this.cellW = size.cellW
    this.cellH = size.cellH
    this.maxPages = size.maxPages
    this.cols = size.pageW / size.cellW
    this.perPage = this.cols * (size.pageH / size.cellH)
    this.draw = draw
    this.look = look
  }

  /** How many distinct texts are held, and on how many pages. */
  get stats(): { texts: number; pages: number } { return { texts: this.cells.size, pages: this.pages.length } }

  private addPage(): number {
    if (!registered) {
      Effect.ShadersStore['signVertexShader'] = VERTEX
      Effect.ShadersStore['signFragmentShader'] = FRAGMENT
      registered = true
    }
    const i = this.pages.length
    const tex = new DynamicTexture(`${this.name}${i}`, { width: Math.round(this.pageW * TEXT_SCALE), height: Math.round(this.pageH * TEXT_SCALE) }, this.scene, true)
    const ctx = tex.getContext() as unknown as CanvasRenderingContext2D
    ctx.setTransform(TEXT_SCALE, 0, 0, TEXT_SCALE, 0, 0)
    ctx.clearRect(0, 0, this.pageW, this.pageH)
    tex.hasAlpha = true
    const mat = new ShaderMaterial(`${this.name}${i}`, this.scene, 'sign', {
      attributes: ['position', 'uv', 'color'],
      uniforms: ['worldViewProjection', 'fogColour', 'fogDensity', 'ink', 'night'],
      samplers: ['signs'],
    })
    mat.setTexture('signs', tex)
    mat.setColor3('fogColour', DAYLIGHT.fogColour)
    mat.setFloat('fogDensity', DAYLIGHT.fogDensity)
    mat.setColor3('ink', this.look.ink)
    mat.setFloat('night', NIGHT)
    mat.backFaceCulling = this.look.cull
    mat.depthFunction = Constants.LEQUAL
    /*
     * Pulled toward the eye in depth: a board a few centimetres proud of its wall is below what the depth
     * buffer resolves at forty metres, and the wall's own pixels won half the time (BUGS.md #15). A polygon
     * offset moves only the depth test, never where the sign is drawn.
     */
    mat.zOffset = -2
    mat.zOffsetUnits = -4
    // cell 0 stays empty: the plain faces' cell
    const free: number[] = []
    for (let c = this.perPage - 1; c >= 1; c--) free.push(c)
    this.pages.push({ tex, mat, free, dirty: true })
    return i
  }

  private rect(cell: number): { u0: number; v0: number; u1: number; v1: number } {
    const u0 = ((cell % this.cols) * this.cellW) / this.pageW
    const v0 = (Math.floor(cell / this.cols) * this.cellH) / this.pageH
    return { u0, v0, u1: u0 + this.cellW / this.pageW, v1: v0 + this.cellH / this.pageH }
  }

  /** The cell for `text`, held for `owner` (a tile); null when every page is full. */
  acquire(text: string, owner: string): { page: number; u0: number; v0: number; u1: number; v1: number } | null {
    let c = this.cells.get(text)
    if (!c) {
      let page = this.pages.findIndex((p) => p.free.length > 0)
      if (page < 0) {
        if (this.pages.length >= this.maxPages) return null
        page = this.addPage()
      }
      const pg = this.pages[page]
      const cell = pg.free.pop()!
      const ctx = pg.tex.getContext() as unknown as CanvasRenderingContext2D
      const r = { x0: (cell % this.cols) * this.cellW, y0: Math.floor(cell / this.cols) * this.cellH }
      ctx.clearRect(r.x0, r.y0, this.cellW, this.cellH)
      ctx.save()
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = '#fff'
      ctx.strokeStyle = '#fff'
      this.draw(ctx, r.x0, r.y0, text)
      ctx.restore()
      pg.dirty = true
      c = { page, cell, owners: new Set() }
      this.cells.set(text, c)
    }
    c.owners.add(owner)
    let mine = this.byOwner.get(owner)
    if (!mine) { mine = new Set(); this.byOwner.set(owner, mine) }
    mine.add(text)
    return { page: c.page, ...this.rect(c.cell) }
  }

  /** The empty cell of a page, for plain faces. */
  blank(page = 0): { page: number; u0: number; v0: number; u1: number; v1: number } {
    if (this.pages.length === 0) this.addPage()
    return { page, ...this.rect(0) }
  }

  /** Everything `owner` held: a cell nobody else holds goes back to its page. */
  release(owner: string): void {
    for (const text of this.byOwner.get(owner) ?? []) {
      const c = this.cells.get(text)
      if (!c) continue
      c.owners.delete(owner)
      if (c.owners.size === 0) {
        this.cells.delete(text)
        this.pages[c.page].free.push(c.cell)
      }
    }
    this.byOwner.delete(owner)
  }

  /** Upload the pages changed since the last flush. */
  flush(): void {
    for (const p of this.pages) {
      if (!p.dirty) continue
      p.tex.update(false)   // `true` flips the page and every name reads upside down
      p.dirty = false
    }
  }

  material(page: number): ShaderMaterial { return this.pages[page].mat }
}

/** One MeshBuilder per atlas page, made into one mesh per page. */
class PageOut {
  private readonly outs = new Map<number, MeshBuilder>()
  on(page: number): MeshBuilder {
    let o = this.outs.get(page)
    if (!o) { o = new MeshBuilder(); this.outs.set(page, o) }
    return o
  }
  meshes(scene: Scene, atlas: TextAtlas, name: string): Mesh[] {
    const out: Mesh[] = []
    for (const [page, b] of this.outs) {
      if (b.triangles === 0) continue
      const m = new Mesh(`${name}:${page}`, scene)
      b.toVertexData().applyToMesh(m)
      m.material = atlas.material(page)
      m.renderingGroupId = 3
      m.isPickable = false
      out.push(m)
    }
    atlas.flush()
    return out
  }
}

/** A cell's four corners the way the boards are wound. */
const quadUV = (c: { u0: number; v0: number; u1: number; v1: number }): [number, number][] =>
  [[c.u0, c.v1], [c.u1, c.v1], [c.u1, c.v0], [c.u0, c.v0]]

export interface SignedJunction {
  at: { x: number; z: number }
  arms: { name: string; bearing: number; width: number; walk: number }[]
}

/** A shop's name on its fascia board: as large as fits, onto two lines before it is allowed to get small. */
function drawShop(ctx: CanvasRenderingContext2D, x0: number, y0: number, name: string): void {
  const cx = x0 + CELL_W / 2
  const cy = y0 + CELL_H / 2
  const text = name.toUpperCase()
  const font = (px: number): string => `700 ${px}px ui-sans-serif, Helvetica, Arial, sans-serif`
  const fit = (t: string, max: number): number => {
    let px = max
    ctx.font = font(px)
    while (ctx.measureText(t).width > CELL_W - 16 && px > 10) ctx.font = font(--px)
    return px
  }
  const one = fit(text, 40)
  const words = text.split(' ')
  if (one >= 24 || words.length < 2) {
    ctx.font = font(one)
    ctx.fillText(text, cx, cy + 1)
  } else {
    // split where the two lines come out most even
    let best = 1
    let bestDiff = Infinity
    for (let k = 1; k < words.length; k++) {
      const d = Math.abs(words.slice(0, k).join(' ').length - words.slice(k).join(' ').length)
      if (d < bestDiff) { bestDiff = d; best = k }
    }
    const a = words.slice(0, best).join(' ')
    const b = words.slice(best).join(' ')
    const px = Math.min(fit(a, 26), fit(b, 26))
    ctx.font = font(px)
    ctx.fillText(a, cx, cy - px * 0.55)
    ctx.fillText(b, cx, cy + px * 0.6)
  }
}

/** Real names given boards per tile, at most: the rest of the tile's shopfronts get invented ones. */
const PER_TILE = 48

/**
 * The names of real places on boards above the shopfronts, the invented ones over the rest, the hanging signs,
 * the corner plaques (or blades) and the landmark plates — as a per-tile layer in the near ring (render/city.ts
 * `TileLayer`), each tile holding its own cells in shared lettering atlases and giving them back when dropped.
 */
export class Signs implements TileLayer {
  readonly name = 'signs'
  /** built within two tiles of the rider (~500 m); a sign is unreadable long before that */
  readonly range = 2
  /** how many found a wall to hang on, over the tiles built now */
  count = 0
  plaques = 0
  named = 0
  blank = 0
  projecting = 0
  /** where the first hanging sign is and which way it faces, for tools that photograph one */
  readonly probe: { x?: number; y?: number; z?: number; ax?: number; az?: number } = {}

  private readonly scene: Scene
  private readonly reg: Region
  private readonly terrain: Terrain
  private readonly noSign: Set<number>
  private readonly invented: ReturnType<typeof inventShopNames>
  /** Chinatown's own (see `districtOf`) */
  private readonly chinatown: ReturnType<typeof inventShopNames>
  /** Fisherman's Wharf's own: over a building that wears the `wharf` style (sf/btype.ts gives it only on the strip) */
  private readonly wharf: ReturnType<typeof inventShopNames>
  private readonly districtOf: (x: number, z: number) => 'zh' | null
  private readonly junctionsIn = new Map<string, SignedJunction[]>()
  private readonly shops: TextAtlas
  private readonly corners: TextAtlas | null
  private readonly words: TextAtlas
  private readonly plates: TextAtlas
  private readonly counts = new Map<string, { count: number; plaques: number; named: number; blank: number; projecting: number }>()
  /** where the wayfinding panels point (game.ts: Paris's Métro stations), local metres; empty, none are put up */
  destinations: { name: string; x: number; z: number }[] = []
  private way: TextAtlas | null = null

  /**
   * `inPark`: a corner in open country gets no name blade. The owner, of Golden Gate Park: *"there are
   * almost no signs."* The only sign in either reference photograph is a 25 mph plate on the one lamppost
   * on MLK Drive — no street-name blades, no destination signs, no regulatory clutter. A national park does
   * not label itself, and at rider speed under a canopy an absent sign is invisible where a wrong one is
   * not. Passed in rather than tested for here, so the park's rule stays in one place (city/park-area.ts).
   */
  private readonly inPark: (x: number, z: number) => boolean
  constructor(scene: Scene, cityId: string, reg: Region, terrain: Terrain, junctions: SignedJunction[] = [],
              noSign: Set<number> = new Set(), inPark: (x: number, z: number) => boolean = () => false,
              districtOf: (x: number, z: number) => 'zh' | null = () => null) {
    this.districtOf = districtOf
    this.inPark = inPark
    this.scene = scene
    this.reg = reg
    this.terrain = terrain
    this.noSign = noSign
    let seed = 0x5eed
    for (const ch of cityId) seed = Math.imul(seed ^ ch.charCodeAt(0), 0x01000193) >>> 0
    this.invented = inventShopNames(reg.shopNames, INVENTED, seed)
    this.chinatown = inventShopNames('zh', 120, seed ^ 0x2a)
    this.wharf = inventShopNames('wharf', 120, seed ^ 0x3b)
    for (const j of junctions) {
      const k = tileKey(Math.floor(j.at.x / TILE), Math.floor(j.at.z / TILE))
      const list = this.junctionsIn.get(k)
      if (list) list.push(j)
      else this.junctionsIn.set(k, [j])
    }
    this.shops = new TextAtlas(scene, 'signs', { pageW: PAGE, pageH: PAGE_H, cellW: CELL_W, cellH: CELL_H, maxPages: 8 },
      drawShop, { ink: new Color3(0.96, 0.95, 0.92), cull: true })
    this.corners = reg.streetSigns === 'plaque' ? plaqueAtlas(scene) : reg.streetSigns === 'blade' ? bladeAtlas(scene) : null
    this.words = wordAtlas(scene)
    this.plates = plateAtlas(scene, reg)
  }

  build(near: Near, rect: { x0: number; z0: number; x1: number; z1: number }): Mesh[] {
    const k = near.key
    const reg = this.reg
    const terrain = this.terrain
    const meshes: Mesh[] = []
    const c = { count: 0, plaques: 0, named: 0, blank: 0, projecting: 0 }
    const index = buildingIndex(near.around.buildings)
    const js = (this.junctionsIn.get(k) ?? []).filter((j) => !this.inPark(j.at.x, j.at.z))
    if (this.corners && js.length > 0) {
      if (reg.streetSigns === 'plaque') {
        const r = plaques(this.scene, this.corners, k, js, index, terrain)
        meshes.push(...r.meshes)
        c.plaques = r.placed
      } else {
        const roads = new Carriageways(near.around.edges.filter((e) => onSurface(e)))
        const r = blades(this.scene, this.corners, k, js, terrain, this.probe, (x, z) => roads.inside(x, z, 0.5), (x, z) => roads.toPavement(x, z))
        meshes.push(...r.meshes)
        c.plaques = r.n
      }
    }
    if (this.destinations.length && js.length) {
      this.way ??= wayfindingAtlas(this.scene)
      meshes.push(...wayfinding(this.scene, this.way, k, js, this.destinations, terrain))
    }
    const lm = landmarkPlates(this.scene, this.plates, k, reg, near.tile.landmarks.filter((l) => !this.noSign.has(l.id)), terrain)
    meshes.push(...lm.meshes)
    c.named = lm.shown

    const pkg = { buildings: near.around.buildings, edges: near.around.edges }
    const chosen = pick(near.tile.pois, PER_TILE)
    const invented = this.invented
    const pages = new PageOut()
    const inTile = (x: number, z: number): boolean => x >= rect.x0 && x < rect.x1 && z >= rect.z0 && z < rect.z1
    const centreOf = (b: PackedBuilding): { x: number; z: number } => {
      let x = 0
      let z = 0
      for (let i = 0; i < b.ring.length; i += 2) { x += b.ring[i]; z += b.ring[i + 1] }
      return { x: x / (b.ring.length / 2), z: z / (b.ring.length / 2) }
    }
    let placed = 0
    /*
     * The building's own facade plan, the same one the builder draws from, so a sign sits on the fascia
     * of THAT building's ground floor — just under the ledge that ends it — rather than at one height for
     * the whole city, which cut the lettering off under every tall Haussmann shopfront's cornice.
     */
    const byId = new Map(pkg.buildings.map((b) => [b.id, b]))
    const plans = new Map<number, FacadePlan>()
    const planOf = (id: number): FacadePlan | null => {
      const b = byId.get(id)
      if (!b) return null
      let pl = plans.get(id)
      if (!pl) {
        pl = planFacade(b.style, b.id, { levels: b.levels, height: b.height, minHeight: b.minHeight, noShops: b.noShops },
          reg.palettes[b.style])
        plans.set(id, pl)
      }
      return pl
    }
    const fascia = (id: number): number => {
      const g = planOf(id)?.storeys.find((st) => st.index === 0)
      return g ? Math.max(2.8, g.y1 - 0.85) : 3.4
    }
    const signed = new Set<number>()
    const hung: Hung[] = []
    chosen.forEach((poi) => {
      const spot = faceFor(poi, index)
      if (!spot) return
      const cell = this.shops.acquire(poi.name, k)
      if (!cell) return
      signed.add(spot.building)
      board(pages.on(cell.page), spot, BOARD[poi.kind], cell.u0, cell.v0, terrain.heightAt(spot.x, spot.z), fascia(spot.building))
      hung.push({ spot, name: poi.name, tint: BOARD[poi.kind], ground: terrain.heightAt(spot.x, spot.z),
        fascia: fascia(spot.building), kind: poi.kind, real: true })
      placed++
    })

    /*
     * And the invented ones: one per building with a street frontage and no real sign, on its longest
     * wall that faces a carriageway. The name is chosen from the building's id, moving on through the list
     * until one has not been used within a couple of blocks, so a street never repeats itself. Worked out
     * over the tile AND its neighbours, in id order, so the answer for a building does not depend on which
     * tiles happen to be built; only the tile's own buildings are drawn.
     */
    if (invented.length > 0) {
      const streets = streetIndex(pkg.edges.filter(onSurface))
      const used = new Map<number, { x: number; z: number }[]>()
      for (const b of [...pkg.buildings].sort((p, q) => p.id - q.id)) {
        if (signed.has(b.id)) continue
        // (a labelled building wears its own sign, read off its photograph — render/city.ts — or none: an invented
        //  trade's name on a labelled auto shop was a judge's most-cited wrong sign, wave 8)
        if (LOOKS_ON && lookFor(b.id)) continue
        // only over a shop: a stoop, a plain wall or a glazed lobby does not get a trade's name over it
        if (planOf(b.id)?.ground !== 'shopfront') continue
        // …nor over a commercial building whose ground floor is offices or a warehouse (facade.ts Dress.shops)
        if (planOf(b.id)?.dress?.shops === 'none') continue
        const spot = frontage(b, streets)
        if (!spot) continue
        // in Chinatown, its own names (offset past the city's in `used`, so the two lists never collide); on the
        // Wharf, its seafood houses and gift shops — chosen by the building's style, which only the strip wears
        const zh = this.districtOf(spot.x, spot.z) === 'zh'
        const wharf = !zh && b.style === 'wharf'
        const list0 = zh ? this.chinatown : wharf ? this.wharf : invented
        const base = zh ? invented.length : wharf ? invented.length + this.chinatown.length : 0
        let j = Math.abs(b.id) % list0.length
        let ok = false
        for (let tries = 0; tries < list0.length; tries++, j = (j + 1) % list0.length) {
          const near = (used.get(base + j) ?? []).some((q) => Math.hypot(q.x - spot.x, q.z - spot.z) < REPEAT)
          if (!near) { ok = true; break }
        }
        const pickd = list0[j]
        j += base
        const mine = (() => { const q = centreOf(b); return inTile(q.x, q.z) })()
        if (!ok) { if (mine) c.blank++; continue }
        const list = used.get(j) ?? []
        list.push({ x: spot.x, z: spot.z })
        used.set(j, list)
        if (!mine) continue
        const cell = this.shops.acquire(pickd.name, k)
        if (!cell) continue
        board(pages.on(cell.page), spot, BOARD[pickd.kind], cell.u0, cell.v0, terrain.heightAt(spot.x, spot.z),
          fascia(b.id))
        hung.push({ spot, name: pickd.name, tint: BOARD[pickd.kind], ground: terrain.heightAt(spot.x, spot.z),
          fascia: fascia(b.id), kind: pickd.kind, real: false })
        placed++
      }
    }
    c.count = placed
    if (placed > 0) meshes.push(...pages.meshes(this.scene, this.shops, `signs:${k}`))
    const pr = projectingSigns(this.scene, this.words, k, hung, this.probe)
    meshes.push(...pr.meshes)
    c.projecting = pr.n
    this.counts.set(k, c)
    this.count += c.count; this.plaques += c.plaques; this.named += c.named; this.blank += c.blank; this.projecting += c.projecting
    for (const m of meshes) m.alwaysSelectAsActiveMesh = false
    return meshes
  }

  release(k: string): void {
    for (const a of [this.shops, this.corners, this.words, this.plates]) a?.release(k)
    const c = this.counts.get(k)
    if (!c) return
    this.count -= c.count; this.plaques -= c.plaques; this.named -= c.named; this.blank -= c.blank; this.projecting -= c.projecting
    this.counts.delete(k)
  }
}

/** The plaque page: 2:1 cells, the shape of the plate, so its lettering is not stretched. */
const PLAQUE_PAGE = 2048
const PLAQUE_W = 256
const PLAQUE_H = 128
const PLAQUE_BLUE: [number, number, number] = [0x1f / 255, 0x4c / 255, 0x9a / 255]

/**
 * Paris's blue enamel street plaques — white capitals on blue, a white border — one on the corner of every
 * arm of every junction the rider is asked about, on the wall that runs ALONG the street it names, at the
 * height of a first-floor sill. That is where a Parisian looks for them, and it is the HUD's "left onto Rue
 * Payenne" made visible on the street itself.
 */
/** The plaques' lettering, drawn into one atlas cell: the kind of street small on top, the name large beneath. */
function drawPlaque(ctx: CanvasRenderingContext2D, x0: number, y0: number, name: string): void {
  ctx.lineWidth = 5
  ctx.strokeRect(x0 + 9, y0 + 9, PLAQUE_W - 18, PLAQUE_H - 18)
  // "RUE DES FRANCS BOURGEOIS": the kind of street small on top, the name large beneath, as the real ones
  const upper = name.toUpperCase()
  const m = upper.match(/^(RUE|AVENUE|BOULEVARD|PLACE|QUAI|IMPASSE|PASSAGE|ALLÉE|COUR|SQUARE|VILLA|CITÉ|PONT|PARC|JARDIN|PORT)( DE LA| DES| DU| DE L'| DE| D')?\s+(.*)$/)
  const small = m ? `${m[1]}${m[2] ?? ''}` : ''
  const big = m ? m[3] : upper
  const font = (px: number): string => `700 ${px}px ui-sans-serif, Helvetica, Arial, sans-serif`
  const fit = (t: string, max: number): number => {
    let px = max
    ctx.font = font(px)
    while (ctx.measureText(t).width > PLAQUE_W - 34 && px > 12) ctx.font = font(--px)
    return px
  }
  const cx = x0 + PLAQUE_W / 2
  // a long name onto two lines (split where they come out most even) rather than shrunk to nothing
  let lines = [big]
  let size = fit(big, 34)
  const words = big.split(' ')
  if (size < 24 && words.length > 1) {
    let best = 1
    for (let k = 1, bd = Infinity; k < words.length; k++) {
      const d = Math.abs(words.slice(0, k).join(' ').length - words.slice(k).join(' ').length)
      if (d < bd) { bd = d; best = k }
    }
    lines = [words.slice(0, best).join(' '), words.slice(best).join(' ')]
    size = Math.min(fit(lines[0], 28), fit(lines[1], 28))
  }
  const top = small ? y0 + 50 : y0 + PLAQUE_H / 2 - (lines.length - 1) * size * 0.55
  if (small) {
    ctx.font = `600 18px ui-sans-serif, Helvetica, Arial, sans-serif`
    ctx.fillText(small, cx, y0 + (lines.length > 1 ? 28 : 38))
  }
  ctx.font = font(size)
  lines.forEach((t, k) => ctx.fillText(t, cx, (small ? (lines.length > 1 ? y0 + 58 : y0 + 76) : top) + k * size * 1.1))
}

const WAY_W = 512
const WAY_H = 128
/**
 * Paris's WAYFINDING panels (owner, 2026-10-29: "distinctive wayfinding signs. there aren't many, but they're very prominent
 * and hard to miss"): white boards with a blue border, blue capitals and the arrow's end pointing the way, two or three on a
 * grey post at the big crossings. One cell a destination and a direction: `NAME|L` or `NAME|R` (the board is read from both
 * sides, and from the other side the arrow points the other way). `|post` is blank: the post is the quad's own grey.
 */
function drawWayfinding(ctx: CanvasRenderingContext2D, x0: number, y0: number, text: string): void {
  const [name, dir] = text.split('|')
  if (dir === 'post') return
  const right = dir === 'R'
  const tip = 70
  ctx.lineWidth = 7
  ctx.beginPath()
  const l = x0 + 8, r = x0 + WAY_W - 8, t = y0 + 10, b = y0 + WAY_H - 10, m = (t + b) / 2
  if (right) { ctx.moveTo(l, t); ctx.lineTo(r - tip, t); ctx.lineTo(r, m); ctx.lineTo(r - tip, b); ctx.lineTo(l, b) } else {
    ctx.moveTo(r, t); ctx.lineTo(l + tip, t); ctx.lineTo(l, m); ctx.lineTo(l + tip, b); ctx.lineTo(r, b)
  }
  ctx.closePath()
  ctx.stroke()
  const upper = name.toUpperCase()
  let px = 64
  const font = (n: number): string => `700 ${n}px ui-sans-serif, Helvetica, Arial, sans-serif`
  ctx.font = font(px)
  while (ctx.measureText(upper).width > WAY_W - tip - 50 && px > 20) ctx.font = font(--px)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(upper, x0 + (right ? (WAY_W - tip) / 2 + 4 : tip + (WAY_W - tip) / 2 - 4), m + 2)
}

export function wayfindingAtlas(scene: Scene): TextAtlas {
  return new TextAtlas(scene, 'wayfinding', { pageW: 2048, pageH: 1024, cellW: WAY_W, cellH: WAY_H, maxPages: 3 },
    drawWayfinding, { ink: new Color3(0.12, 0.28, 0.62), cull: true })
}

export function plaqueAtlas(scene: Scene): TextAtlas {
  return new TextAtlas(scene, 'plaques', { pageW: PLAQUE_PAGE, pageH: PLAQUE_PAGE, cellW: PLAQUE_W, cellH: PLAQUE_H, maxPages: 4 },
    drawPlaque, { ink: new Color3(0.96, 0.95, 0.92), cull: true })
}

/**
 * The wayfinding posts of one tile (drawWayfinding): at a crossing of four or more streets all 7 m or wider — one in two
 * of them, there are not many — a grey post on the corner pavement and a board for each of up to three of its streets,
 * naming the destination that lies most nearly that way, 300 m to 3 km off.
 */
function wayfinding(scene: Scene, atlas: TextAtlas, owner: string, junctions: SignedJunction[],
  dests: { name: string; x: number; z: number }[], terrain: Terrain): Mesh[] {
  const out = new PageOut()
  const GREY: [number, number, number] = [0.6, 0.62, 0.63]
  const WHITE: [number, number, number] = [0.95, 0.95, 0.93]
  for (const j of junctions) {
    if (j.arms.length < 4 || j.arms.some((a) => a.width < 7)) continue
    if (((Math.round(j.at.x * 7) * 73856093) ^ (Math.round(j.at.z * 7) * 19349663)) >>> 0 & 1) continue
    const boards: { arm: SignedJunction['arms'][number]; name: string }[] = []
    for (const arm of j.arms) {
      const dx = Math.sin(arm.bearing), dz = Math.cos(arm.bearing)
      let best: { name: string; score: number } | null = null
      for (const d of dests) {
        const vx = d.x - j.at.x, vz = d.z - j.at.z, dist = Math.hypot(vx, vz)
        if (dist < 300 || dist > 3000) continue
        const off = Math.acos(Math.max(-1, Math.min(1, (vx * dx + vz * dz) / dist)))
        if (off > Math.PI / 6) continue
        const score = off + dist / 6000
        if (!best || score < best.score) best = { name: d.name.replace(/ \(.*\)$/, ''), score }
      }
      if (best && !boards.some((b) => b.name === best!.name)) boards.push({ arm, name: best.name })
      if (boards.length === 3) break
    }
    if (boards.length < 2) continue
    // the post on the corner pavement, right of the first street's mouth
    const a0 = boards[0].arm
    const d0x = Math.sin(a0.bearing), d0z = Math.cos(a0.bearing)
    const reach = a0.width / 2 + a0.walk * 0.7
    const px = j.at.x + d0x * (reach + 1.5) + d0z * reach, pz = j.at.z + d0z * (reach + 1.5) - d0x * reach
    const g = terrain.heightAt(px, pz)
    const post = atlas.acquire('|post', owner)
    if (!post) continue
    for (const [nx, nz] of [[1, 0], [0, 1]] as const) {
      const ax = -nz * 0.05, az = nx * 0.05
      for (const f of [1, -1]) {
        out.on(post.page).quad([[px - ax * f, g, pz - az * f], [px + ax * f, g, pz + az * f], [px + ax * f, g + 3.6, pz + az * f], [px - ax * f, g + 3.6, pz - az * f]],
          [nx * f, 0, nz * f], quadUV(post), GREY, 0)
      }
    }
    boards.forEach((b, i) => {
      const dx = Math.sin(b.arm.bearing), dz = Math.cos(b.arm.bearing)
      const w = 0.62, h = 0.155, y = g + 3.25 - i * 0.4
      const cx = px + dx * (w + 0.06), cz = pz + dz * (w + 0.06)
      // its two faces: from its right side the way is to the reader's right, from its left side to the left
      for (const [side, dir] of [[1, 'R'], [-1, 'L']] as const) {
        const cell = atlas.acquire(`${b.name}|${dir}`, owner)
        if (!cell) continue
        const nx = dz * side, nz = -dx * side
        const ax = -nz, az = nx
        const ox = cx + nx * 0.02, oz = cz + nz * 0.02
        out.on(cell.page).quad([[ox - ax * w, y - h, oz - az * w], [ox + ax * w, y - h, oz + az * w], [ox + ax * w, y + h, oz + az * w], [ox - ax * w, y + h, oz - az * w]],
          [nx, 0, nz], quadUV(cell), WHITE, 0)
      }
    })
  }
  return out.meshes(scene, atlas, `wayfinding:${owner}`)
}

/** The plaques of the junctions in one tile, on the corner walls of the buildings round them. */
function plaques(scene: Scene, atlas: TextAtlas, owner: string, junctions: SignedJunction[], index: Map<string, PackedBuilding[]>,
  terrain: Terrain): { meshes: Mesh[]; placed: number } {
  const out = new PageOut()
  let placed = 0
  for (const j of junctions) {
    for (const arm of j.arms) {
      const cell = atlas.acquire(arm.name, owner)
      if (!cell) continue
      // along the arm, and its right-hand side: the corner building is out past the pavement on that side
      const dx = Math.sin(arm.bearing)
      const dz = Math.cos(arm.bearing)
      const rx = dz
      const rz = -dx
      const reach = arm.width / 2 + arm.walk
      const target = { x: j.at.x + dx * (reach + 2.5) + rx * (reach + 0.5), z: j.at.z + dz * (reach + 2.5) + rz * (reach + 0.5) }
      const spot = cornerWall(index, target, dx, dz, rx, rz, j.at)
      if (!spot) continue
      const y = terrain.heightAt(spot.x, spot.z) + 2.6
      // larger than life (a real plate is about 0.45 × 0.3 m): it has to read from a moving bike
      const w = 0.5
      const h = 0.25
      const ax = -spot.nz
      const az = spot.nx
      const px = spot.x + spot.nx * 0.06
      const pz = spot.z + spot.nz * 0.06
      out.on(cell.page).quad(
        [[px - ax * w, y - h, pz - az * w], [px + ax * w, y - h, pz + az * w],
         [px + ax * w, y + h, pz + az * w], [px - ax * w, y + h, pz - az * w]],
        [spot.nx, 0, spot.nz], quadUV(cell), PLAQUE_BLUE, 0)
      placed++
    }
  }
  return { meshes: out.meshes(scene, atlas, `plaques:${owner}`), placed }
}

interface Hung {
  spot: Spot
  name: string
  tint: [number, number, number]
  ground: number
  /** the fascia's height above the ground: a hanging sign goes above it */
  fascia: number
  kind: PackedPoi['kind']
  /** a place OSM names, as opposed to an invented name over an anonymous shopfront */
  real: boolean
}

const WORD_PAGE_W = 4096
const WORD_PAGE_H = 2048
/** tall cells: the name runs down the blade, top to bottom */
const WORD_W = 128
const WORD_H = 256
/** no two hanging signs closer than this along a street, or they hide each other */
const BLADE_GAP = 12

/** how much a place deserves a sign out over the pavement: the ones a rider looks for, first */
function bladeRank(h: Hung): number {
  const pick = hashSpot(h.spot) % 100
  if (/^pharmacie\b/i.test(h.name) || /\btabac\b/i.test(h.name)) return 4
  if (!h.real) return pick < 8 ? 1 : 0
  if (h.kind === 'culture') return 3
  if (h.kind === 'food') return 2.5
  return pick < 50 ? 2 : 0
}

function hashSpot(s: Spot): number {
  let x = Math.imul(Math.round(s.x * 10) ^ Math.imul(Math.round(s.z * 10), 0x27d4eb2d), 0x9e3779b1)
  x ^= x >>> 15
  return x >>> 0
}

/**
 * The hanging signs — the enseigne drapeau — out over the pavement on an iron bracket, perpendicular to the
 * wall, so a shop can be read from down the street instead of only from across it. Not every shop has one,
 * only the ones worth looking for: every museum, theatre and gallery, every café and restaurant, half the
 * other real shops, and a few of the invented names; never two within a dozen metres. A blade is a tall
 * board above the fascia with the name running down it. A pharmacy hangs its green cross instead, and a
 * tabac its red "carotte" — the two signs every Parisian street has, and the two anyone would recognise.
 */
/** A hanging sign's word, turned a quarter so it reads top to bottom down the blade, in a frame. */
function drawWord(ctx: CanvasRenderingContext2D, x0: number, y0: number, w: string): void {
  ctx.lineWidth = 4
  ctx.strokeRect(x0 + 9, y0 + 9, WORD_W - 18, WORD_H - 18)
  // turned a quarter clockwise, so it reads top to bottom down the blade
  ctx.save()
  ctx.translate(x0 + WORD_W / 2, y0 + WORD_H / 2)
  ctx.rotate(Math.PI / 2)
  let size = 64
  ctx.font = `700 ${size}px ui-sans-serif, Helvetica, Arial, sans-serif`
  while ((ctx.measureText(w).width > WORD_H - 40 || size > WORD_W - 44) && size > 12) {
    size -= 1
    ctx.font = `700 ${size}px ui-sans-serif, Helvetica, Arial, sans-serif`
  }
  ctx.fillText(w, 0, 2)
  ctx.restore()
}

export function wordAtlas(scene: Scene): TextAtlas {
  return new TextAtlas(scene, 'words', { pageW: WORD_PAGE_W, pageH: WORD_PAGE_H, cellW: WORD_W, cellH: WORD_H, maxPages: 3 },
    drawWord, { ink: new Color3(0.96, 0.95, 0.92), cull: true })
}

function projectingSigns(scene: Scene, atlas: TextAtlas, owner: string, hung: Hung[],
                         probe: { x?: number; y?: number; z?: number; ax?: number; az?: number } = {},
                onRoad: (x: number, z: number) => boolean = () => false): { meshes: Mesh[]; n: number } {
  const ranked = hung.map((h) => ({ h, r: bladeRank(h) })).filter((c) => c.r > 0).sort((a, b) => b.r - a.r)
  const chosen: Hung[] = []
  for (const { h } of ranked) {
    if (chosen.some((c) => Math.hypot(c.spot.x - h.spot.x, c.spot.z - h.spot.z) < BLADE_GAP)) continue
    chosen.push(h)
  }
  const special = (h: Hung): 'cross' | 'carotte' | null =>
    /^pharmacie\b/i.test(h.name) ? 'cross' : /\btabac\b/i.test(h.name) ? 'carotte' : null
  const text = (name: string): string => {
    const up = name.toUpperCase()
    return up.length <= 16 ? up : firstWord(name)
  }
  const blankCell = atlas.blank(0)
  const iron: [number, number, number] = [0.1, 0.1, 0.11]
  const green: [number, number, number] = [0.1, 0.72, 0.3]
  const red: [number, number, number] = [0.78, 0.12, 0.08]
  const pages = new PageOut()
  let n = 0
  for (const h of chosen) {
    const kind = special(h)
    const got = kind ? blankCell : atlas.acquire(text(h.name), owner)
    if (!got) continue
    const i = got
    const blank = atlas.blank(got.page)
    const out = pages.on(got.page)
    const s = h.spot
    const ax = -s.nz
    const az = s.nx
    // just beyond the right-hand end of the fascia board, and above it
    const along = s.width / 2 + 0.5
    const bx = s.x + ax * along
    const bz = s.z + az * along
    const y0 = h.ground + Math.max(3.3, h.fascia + 0.6)
    const p = (o: number, yy: number, a = 0): [number, number, number] =>
      [bx + s.nx * o + ax * a, yy, bz + s.nz * o + az * a]
    /** a panel in the wall's normal plane, from `o0` to `o1` out and `ya` to `yb` up, a face each way */
    const panel = (o0: number, o1: number, ya: number, yb: number, cell: { u0: number; v0: number; u1: number; v1: number }, tint: [number, number, number]): void => {
      out.quad([p(o0, ya, 0.01), p(o1, ya, 0.01), p(o1, yb, 0.01), p(o0, yb, 0.01)], [ax, 0, az], quadUV(cell), tint, 0)
      out.quad([p(o1, ya, -0.01), p(o0, ya, -0.01), p(o0, yb, -0.01), p(o1, yb, -0.01)], [-ax, 0, -az], quadUV(cell), tint, 0)
    }
    let top: number
    let reach: number
    if (kind === 'cross') {
      // the green cross, lit: two bars crossed, face-on to the street both ways
      const yc = y0 + 0.5
      panel(0.3, 1.2, yc - 0.15, yc + 0.15, blank, green)
      panel(0.6, 0.9, yc - 0.45, yc + 0.45, blank, green)
      top = yc + 0.45
      reach = 1.05
    } else if (kind === 'carotte') {
      // the tabac's red lozenge: a tall diamond, drawn in both planes so it reads from every side
      const cx = 0.75
      const yb = y0
      const yt = y0 + 1.1
      const ym = (yb + yt) / 2
      const w = 0.32
      for (const [dx, dz] of [[1, 0], [0, 1]] as const) {
        const at = (o: number, a: number, yy: number): [number, number, number] =>
          [bx + s.nx * (cx + o * dx) + ax * a * dz, yy, bz + s.nz * (cx + o * dx) + az * a * dz]
        const edge = (k: number): [number, number, number] => dx ? at(k * w, 0, ym) : at(0, k * w, ym)
        const top3 = at(0, 0, yt)
        const bot3 = at(0, 0, yb)
        const nrm: [number, number, number] = dx ? [ax, 0, az] : [s.nx, 0, s.nz]
        out.quad([edge(-1), edge(1), top3, top3], nrm, quadUV(blank), red, 0)
        out.quad([edge(1), edge(-1), top3, top3], [-nrm[0], 0, -nrm[2]], quadUV(blank), red, 0)
        out.quad([edge(1), edge(-1), bot3, bot3], nrm, quadUV(blank), red, 0)
        out.quad([edge(-1), edge(1), bot3, bot3], [-nrm[0], 0, -nrm[2]], quadUV(blank), red, 0)
      }
      top = yt
      reach = 0.75
    } else {
      // the blade: 0.8 m out from the wall, 1.6 m tall, a thin iron edge round it. The word is drawn turned a
      // quarter clockwise, which reads top to bottom only with the letters' tops on the reader's RIGHT: toward
      // the wall on one face and away from it on the other. Both faces had them the same way along the wall's
      // normal, so every blade read mirrored from both sides (BUGS.md #50) — the cell is laid with u reversed.
      panel(0.18, 0.98, y0, y0 + 1.6, { u0: i.u1, v0: i.v0, u1: i.u0, v1: i.v1 }, h.tint)
      panel(0.14, 1.02, y0 - 0.04, y0, blank, iron)
      panel(0.14, 1.02, y0 + 1.6, y0 + 1.64, blank, iron)
      top = y0 + 1.64
      reach = 1.02
    }
    if (probe.x === undefined && !kind) Object.assign(probe, { x: bx + s.nx * 0.58, y: y0 + 0.8, z: bz + s.nz * 0.58, ax, az })
    // the bracket: a bar out from the wall over the top, and a stay down to the wall under it
    panel(0, reach + 0.05, top + 0.02, top + 0.09, blank, iron)
    // the stay only across the gap between the wall and the board: drawn over the board it lay 2 mm off the
    // board's face and z-fought with the lettering at every distance
    const gap = kind === 'cross' ? 0.28 : kind === 'carotte' ? 0.4 : 0.16
    out.quad([p(0, top - 0.55, 0.012), p(0.05, top - 0.57, 0.012), p(gap, top + 0.02, 0.012), p(gap - 0.06, top + 0.02, 0.012)],
      [ax, 0, az], quadUV(blank), iron, 0)
    n++
  }
  return { meshes: pages.meshes(scene, atlas, `words:${owner}`), n }
}


/** The word on a hanging sign: the name's first word worth reading — "PHARMACIE", not "LA". */
function firstWord(name: string): string {
  const words = name.toUpperCase().split(/[\s'’-]+/).filter(Boolean)
  return words.find((w) => w.length >= 3 && !/^(LES|DES|DU|DE|LA|LE|THE|AND|AUX)$/.test(w)) ?? words[0] ?? name
}

/** The landmark plate page: 4:1 cells, the shape of a plate; the last cell is left empty for plain faces. */
const PLATE_PAGE = 3072
const PLATE_W = 384
const PLATE_H = 96
const KIND_COLOUR: Record<PackedLandmark['kind'], [number, number, number]> = {
  church: [0.45, 0.28, 0.55], school: [0.9, 0.55, 0.15], museum: [0.2, 0.4, 0.75], civic: [0.72, 0.18, 0.16],
  shop: [0.2, 0.55, 0.3], historic: [0.55, 0.4, 0.25], other: [0.45, 0.47, 0.5],
}

/**
 * The names on the buildings a rider steers by (item K): a plate on the street-facing wall at 3.5 m — the
 * top tier 2.4 m wide, the rest 1.4 m — with a small square in the colour of what kind of place it is at its
 * left end, and for the top tier a totem on the pavement with the name up both faces, so it can be read from
 * down the street. Where they go was decided in the bake (city/landmark-place.ts).
 */
/** A landmark's name on its plate, in a serif, onto two lines when it will not fit on one. */
function drawPlate(ctx: CanvasRenderingContext2D, x0: number, y0: number, name: string): void {
  const cx = x0 + PLATE_W / 2
  const cy = y0 + PLATE_H / 2
  let size = 44
  const text = name.toUpperCase()
  ctx.font = `600 ${size}px Georgia, 'Times New Roman', serif`
  while (ctx.measureText(text).width > PLATE_W - 20 && size > 14) {
    size -= 1
    ctx.font = `600 ${size}px Georgia, 'Times New Roman', serif`
  }
  // a long name that will not fit at a readable size goes onto two lines
  if (size < 26 && text.includes(' ')) {
    const mid = text.lastIndexOf(' ', Math.floor(text.length / 2) + 4)
    const [l1, l2] = [text.slice(0, mid), text.slice(mid + 1)]
    // (as large as the cell takes — two lines of 40 px in its 96: at 34 with 20 px margins it read as a smudge)
    size = 40
    ctx.font = `600 ${size}px Georgia, 'Times New Roman', serif`
    while (Math.max(ctx.measureText(l1).width, ctx.measureText(l2).width) > PLATE_W - 16 && size > 12) {
      size -= 1
      ctx.font = `600 ${size}px Georgia, 'Times New Roman', serif`
    }
    ctx.fillText(l1, cx, cy - size * 0.52)
    ctx.fillText(l2, cx, cy + size * 0.52)
  } else {
    ctx.fillText(text, cx, cy)
  }
}

export function plateAtlas(scene: Scene, reg: Region): TextAtlas {
  return new TextAtlas(scene, 'plates', { pageW: PLATE_PAGE, pageH: PLATE_PAGE, cellW: PLATE_W, cellH: PLATE_H, maxPages: 2 },
    drawPlate, { ink: Color3.FromHexString(reg.landmarkPlate.text), cull: false })
}

/** The plates and totems of the named buildings in one tile. */
function landmarkPlates(scene: Scene, atlas: TextAtlas, owner: string, reg: Region, list: PackedLandmark[],
  terrain: Terrain): { meshes: Mesh[]; shown: number } {
  const fill = Color3.FromHexString(reg.landmarkPlate.fill)
  const tint: [number, number, number] = [fill.r, fill.g, fill.b]
  const pages = new PageOut()
  let shown = 0
  for (const l of list) {
    const got = atlas.acquire(l.name, owner)
    if (!got) continue
    shown++
    const out = pages.on(got.page)
    const plain = quadUV(atlas.blank(got.page))
    const f = l.frontage
    const c = got
    // (the smaller plates a third larger than they were, 1.4 × 0.35 m: a two-line name on them was too small to read)
    const w = l.tier === 1 ? 2.4 : 1.8
    const h = l.tier === 1 ? 0.5 : 0.45
    const y = terrain.heightAt(f.x, f.z) + 3.5
    const q = plateQuad(f, w, h, y)
    out.quad(q, [f.nx, 0, f.nz], [[c.u0, c.v1], [c.u1, c.v1], [c.u1, c.v0], [c.u0, c.v0]], tint, 0)
    /*
     * The kind marker just OUTSIDE the plate's left end (owner, 2026-10-06: "all of our landmark signs are unreadable").
     * It stood on the plate over its left end, and the name, centred across the whole plate, ran under it: every
     * plate lost its first letter or two ("ONEER LOG CABIN").
     */
    const ax = -f.nz
    const az = f.nx
    const s = h * 0.62
    const lx = q[0][0] - ax * (0.05 + s / 2) + f.nx * 0.012
    const lz = q[0][2] - az * (0.05 + s / 2) + f.nz * 0.012
    out.quad([[lx - ax * s / 2, y - s / 2, lz - az * s / 2], [lx + ax * s / 2, y - s / 2, lz + az * s / 2],
      [lx + ax * s / 2, y + s / 2, lz + az * s / 2], [lx - ax * s / 2, y + s / 2, lz - az * s / 2]],
      [f.nx, 0, f.nz], plain, KIND_COLOUR[l.kind], 0)

    if (l.tier === 1 && l.totem) {
      /*
       * The totem: a slim dark post 2.2 m tall, broadside to the street so both faces are seen from along it,
       * with the name running up each face. Its faces are turned to face along the street, i.e. along the wall.
       */
      const tx = l.totem.x
      const tz = l.totem.z
      const g = terrain.heightAt(tx, tz)
      const hw = 0.13       // half the post's width across its face
      const hd = 0.05       // half its thickness
      const post: [number, number, number] = [0.14, 0.15, 0.16]
      // faces point along the street (±a); width runs toward/away from the wall (n)
      for (const sgn of [1, -1]) {
        const fx = tx + ax * hd * sgn
        const fz = tz + az * hd * sgn
        const p = (dn: number, yy: number): [number, number, number] => [fx + f.nx * dn, g + yy, fz + f.nz * dn]
        out.quad([p(-hw * sgn, 0), p(hw * sgn, 0), p(hw * sgn, 2.2), p(-hw * sgn, 2.2)], [ax * sgn, 0, az * sgn],
          plain, post, 0)
        /*
         * The name panel, reading bottom to top: the text's start (u0) at the foot, and the tops of the
         * letters (v0) to the viewer's LEFT. Seen from the face whose normal is sgn·a, the viewer's right is
         * −sgn·n — so the letter tops go on the +sgn·n side. Getting that backwards mirrored every totem.
         */
        const pn = (dn: number, yy: number): [number, number, number] =>
          [fx + ax * 0.004 * sgn + f.nx * dn, g + yy, fz + az * 0.004 * sgn + f.nz * dn]
        out.quad([pn(-hw * 0.8 * sgn, 0.35), pn(hw * 0.8 * sgn, 0.35), pn(hw * 0.8 * sgn, 2.05), pn(-hw * 0.8 * sgn, 2.05)],
          [ax * sgn, 0, az * sgn], [[c.u0, c.v1], [c.u0, c.v0], [c.u1, c.v0], [c.u1, c.v1]], tint, 0)
      }
      // the post's two narrow sides and its cap
      for (const sgn of [1, -1]) {
        const px = tx + f.nx * hw * sgn
        const pz = tz + f.nz * hw * sgn
        out.quad([[px - ax * hd, g, pz - az * hd], [px + ax * hd, g, pz + az * hd],
          [px + ax * hd, g + 2.2, pz + az * hd], [px - ax * hd, g + 2.2, pz - az * hd]], [f.nx * sgn, 0, f.nz * sgn],
          plain, post, 0)
      }
    }
  }
  return { meshes: pages.meshes(scene, atlas, `plates:${owner}`), shown }
}

const BLADE_PAGE = 2048
const BLADE_W = 512
const BLADE_H = 128

/**
 * North America's street signs: green blades on a pole at a corner, one per street, crossed at right angles
 * so each reads along its own street — the other corner signal a rider takes in without looking for it.
 * One pole per junction of two differently named streets, on the corner between them, out at the kerb.
 */
/** An American street blade's name, with the usual abbreviations, in a thin white frame. */
function drawBlade(ctx: CanvasRenderingContext2D, x0: number, y0: number, name: string): void {
  ctx.lineWidth = 4
  ctx.strokeRect(x0 + 8, y0 + 8, BLADE_W - 16, BLADE_H - 16)
  // "W Adams St": the abbreviations every American blade uses, so the name fits at a readable size
  const text = name.replace(/\bWest\b/, 'W').replace(/\bEast\b/, 'E').replace(/\bNorth\b/, 'N')
    .replace(/\bSouth\b/, 'S').replace(/\bStreet$/, 'St').replace(/\bAvenue$/, 'Ave')
    .replace(/\bBoulevard$/, 'Blvd').replace(/\bPlace$/, 'Pl').replace(/\bDrive$/, 'Dr')
  let size = 72
  ctx.font = `600 ${size}px ui-sans-serif, Helvetica, Arial, sans-serif`
  while (ctx.measureText(text).width > BLADE_W - 40 && size > 20) {
    size -= 2
    ctx.font = `600 ${size}px ui-sans-serif, Helvetica, Arial, sans-serif`
  }
  ctx.fillText(text, x0 + BLADE_W / 2, y0 + BLADE_H / 2 + 4)
}

export function bladeAtlas(scene: Scene): TextAtlas {
  return new TextAtlas(scene, 'blades', { pageW: BLADE_PAGE, pageH: BLADE_PAGE, cellW: BLADE_W, cellH: BLADE_H, maxPages: 3 },
    drawBlade, { ink: new Color3(0.96, 0.96, 0.94), cull: true })
}

/** The street blades at the junctions of one tile. */
function blades(scene: Scene, atlas: TextAtlas, owner: string, junctions: SignedJunction[], terrain: Terrain,
                probe: { x?: number; y?: number; z?: number; ax?: number; az?: number } = {},
                onRoad: (x: number, z: number) => boolean = () => false,
                toPavement: (x: number, z: number) => { x: number; z: number } = (x, z) => ({ x, z })): { meshes: Mesh[]; n: number } {
  const green: [number, number, number] = [0x0b / 255, 0x6b / 255, 0x3a / 255]
  const pole: [number, number, number] = [0.3, 0.32, 0.33]
  const pages = new PageOut()
  let n = 0
  for (const j of junctions) {
    // two arms with different names, the first pair round the junction
    const a1 = j.arms[0]
    const a2 = j.arms.find((a) => a.name !== a1.name)
    if (!a2) continue
    const c1 = atlas.acquire(a1.name, owner)
    const c2 = atlas.acquire(a2.name, owner)
    if (!c1 || !c2) continue
    const blank = quadUV(atlas.blank(c1.page))
    const out = pages.on(c1.page)
    const d1 = { x: Math.sin(a1.bearing), z: Math.cos(a1.bearing) }
    const d2 = { x: Math.sin(a2.bearing), z: Math.cos(a2.bearing) }
    let cx = d1.x + d2.x
    let cz = d1.z + d2.z
    const cl = Math.hypot(cx, cz)
    if (cl < 0.2) continue          // the two run straight through each other: no corner between them
    cx /= cl
    cz /= cl
    /*
     * ON THE CORNER, where the two kerbs meet, a little back onto the pavement (owner, 2026-10-05: blades "well away
     * from the curb, closer to the middle of the street"). It was a reach along the bisector set by the WIDER street,
     * which is the corner only where two equal streets cross square: where a broad street meets a narrow one, or
     * the two meet at a slant, the pole stood out in the narrower street's roadway. Now each street's kerb line
     * (its half-width plus 0.6 m of pavement, towards the other street) and the pole at their intersection.
     */
    const n1 = { x: d2.x - (d2.x * d1.x + d2.z * d1.z) * d1.x, z: d2.z - (d2.x * d1.x + d2.z * d1.z) * d1.z }
    const n2 = { x: d1.x - (d1.x * d2.x + d1.z * d2.z) * d2.x, z: d1.z - (d1.x * d2.x + d1.z * d2.z) * d2.z }
    const l1 = Math.hypot(n1.x, n1.z), l2 = Math.hypot(n2.x, n2.z)
    let px = j.at.x + cx * (Math.max(a1.width, a2.width) / 2 + 0.6) * 1.35
    let pz = j.at.z + cz * (Math.max(a1.width, a2.width) / 2 + 0.6) * 1.35
    if (l1 > 0.3 && l2 > 0.3) {
      n1.x /= l1; n1.z /= l1; n2.x /= l2; n2.z /= l2
      const o1 = a1.width / 2 + (a1.walk > 0 ? 0.6 : 0.4), o2 = a2.width / 2 + (a2.walk > 0 ? 0.6 : 0.4)
      const det = n1.x * n2.z - n1.z * n2.x
      if (Math.abs(det) > 0.25) {
        const sx = (o1 * n2.z - o2 * n1.z) / det, sz = (n1.x * o2 - n2.x * o1) / det
        // (a very acute corner throws the meeting point far down the street: no farther than it is wide again)
        const far = Math.max(a1.width, a2.width) + 3
        const L = Math.hypot(sx, sz)
        px = j.at.x + sx * Math.min(1, far / L)
        pz = j.at.z + sz * Math.min(1, far / L)
      }
    }
    /*
     * …and then out along the corner until it is clear of every DRAWN carriageway. The junction is the ride graph's,
     * which merges a boulevard's two carriageways and a cluster of nodes into one, so its point and its widths are not
     * the drawn streets' (Pine at Powell: the pole stood 3 m into the side street). A corner that never clears in 12 m
     * (a junction inside a wide square) gets no sign.
     */
    let clear = !onRoad(px, pz)
    for (let step = 0; step < 24 && !clear; step++) {
      px += cx * 0.5
      pz += cz * 0.5
      clear = !onRoad(px, pz)
    }
    if (!clear) continue
    // …and onto the pavement: clear of the carriageways can still be the open asphalt of a big junction's corner
    // (owner, 2026-10-14, Green at Columbus: "a short distance away from the sidewalk")
    ;({ x: px, z: pz } = toPavement(px, pz))
    if (onRoad(px, pz)) continue
    /*
     * …and out of the junction's own asphalt: the city paves a junction as the hull of its streets' mouths
     * (render/city.ts `junctionHull`, `reach` = 1.35 × the widest half + 0.4 m out), whose straight edge cuts across each
     * corner — a pole at the kerb lines' meeting stood on that asphalt, at the end of the crosswalk (owner,
     * 2026-10-15, 4th St at Mission: "lamppost in middle of street"). Out along the corner until it is clear.
     */
    {
      const reach = Math.max(...j.arms.map((a) => a.width / 2)) * 1.35 + 0.4
      const ring = j.arms.flatMap((a) => {
        const ux = Math.sin(a.bearing), uz = Math.cos(a.bearing), h = a.width / 2
        const cx2 = j.at.x + ux * reach, cz2 = j.at.z + uz * reach
        return [{ x: cx2 - uz * h, z: cz2 + ux * h }, { x: cx2 + uz * h, z: cz2 - ux * h }]
      }).sort((p, q) => Math.atan2(p.x - j.at.x, p.z - j.at.z) - Math.atan2(q.x - j.at.x, q.z - j.at.z))
      const inHull = (x: number, z: number): boolean => {
        let hit = false
        for (let i = 0, k = ring.length - 1; i < ring.length; k = i++) {
          const a = ring[i], b = ring[k]
          if ((a.z > z) !== (b.z > z) && x < ((b.x - a.x) * (z - a.z)) / (b.z - a.z) + a.x) hit = !hit
        }
        return hit
      }
      for (let step = 0; step < 16 && inHull(px, pz); step++) { px += cx * 0.4; pz += cz * 0.4 }
      if (inHull(px, pz) || onRoad(px, pz)) continue
    }
    const g = terrain.heightAt(px, pz)
    // the pole, up to the lower blade: the blades sit on its cap, they are not threaded on it (owner, 2026-10-02:
    // "street signs are always obstructing the sign with the pole" — it ran on to 2.7 m, through both names)
    const top = 2.3 - 0.11
    for (const [ox, oz] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
      const hx = oz * 0.04
      const hz = -ox * 0.04
      const fx = px + ox * 0.04
      const fz = pz + oz * 0.04
      out.quad([[fx - hx, g, fz - hz], [fx + hx, g, fz + hz], [fx + hx, g + top, fz + hz], [fx - hx, g + top, fz - hz]],
        [ox, 0, oz], blank, pole, 0)
    }
    // a blade along each street, one above the other
    for (const [arm, cell, y] of [[a1, c1, 2.3], [a2, c2, 2.55]] as const) {
      const ax = Math.sin(arm.bearing)
      const az = Math.cos(arm.bearing)
      // the probe looks along the blade's face normal, so it is the normal that is recorded
      if (probe.x === undefined) Object.assign(probe, { x: px, y: g + y, z: pz, ax: az, az: -ax })
      const w = 0.45
      const h = 0.11
      const on = pages.on(cell.page)
      on.quad([[px - ax * w, g + y - h, pz - az * w], [px + ax * w, g + y - h, pz + az * w],
        [px + ax * w, g + y + h, pz + az * w], [px - ax * w, g + y + h, pz - az * w]],
        [az, 0, -ax], quadUV(cell), green, 0)
      // and its back, wound the other way, so the name reads left to right from behind as well
      const bx = -az * 0.01
      const bz = ax * 0.01
      on.quad([[px + ax * w + bx, g + y - h, pz + az * w + bz], [px - ax * w + bx, g + y - h, pz - az * w + bz],
        [px - ax * w + bx, g + y + h, pz - az * w + bz], [px + ax * w + bx, g + y + h, pz + az * w + bz]],
        [-az, 0, ax], quadUV(cell), green, 0)
    }
    n++
  }
  return { meshes: pages.meshes(scene, atlas, `blades:${owner}`), n }
}

/**
 * The wall a corner plaque goes on: near `target`, running along the street (parallel to d), facing the
 * carriageway (its outward normal against r), and the point on it nearest the junction, kept 0.6 m in from
 * the corner so the plate does not overhang it.
 */
function cornerWall(index: Map<string, PackedBuilding[]>, target: { x: number; z: number },
                    dx: number, dz: number, rx: number, rz: number, junction: { x: number; z: number }): Spot | null {
  const gx = Math.floor(target.x / 100)
  const gz = Math.floor(target.z / 100)
  let best: Spot | null = null
  let bestD = 7
  for (let oz = -1; oz <= 1; oz++) {
    for (let ox = -1; ox <= 1; ox++) {
      for (const b of index.get(`${gx + ox},${gz + oz}`) ?? []) {
        const ring = unpackPoints(b.ring)
        for (let i = 0; i < ring.length; i++) {
          const a = ring[i]
          const c = ring[(i + 1) % ring.length]
          const ex = c.x - a.x
          const ez = c.z - a.z
          const len = Math.hypot(ex, ez)
          if (len < 2) continue
          const nx = ez / len
          const nz = -ex / len
          if (Math.abs((ex * dx + ez * dz) / len) < 0.8) continue      // not along the street
          if (nx * rx + nz * rz > -0.6) continue                        // not facing the carriageway
          const t = Math.max(0, Math.min(1, ((target.x - a.x) * ex + (target.z - a.z) * ez) / (len * len)))
          const d = Math.hypot(target.x - (a.x + ex * t), target.z - (a.z + ez * t))
          if (d >= bestD) continue
          // the end of this wall nearest the junction, 0.6 m in
          const toA = Math.hypot(a.x - junction.x, a.z - junction.z)
          const toC = Math.hypot(c.x - junction.x, c.z - junction.z)
          const k = Math.min(0.5, 0.6 / len)
          const tt = toA < toC ? k : 1 - k
          bestD = d
          best = { x: a.x + ex * tt, z: a.z + ez * tt, nx, nz, width: 0.6, building: b.id }
        }
      }
    }
  }
  return best
}

/**
 * Which places get a sign.
 *
 * Spread across the city, not concentrated. Ranking by kind and then by distance from the centre — which is
 * the obvious thing — put all three hundred signs in the middle of the Marais, and a rider starting five
 * hundred metres out saw not one. So the city is divided into cells and each contributes its best few in
 * turn, which gives an even scatter whichever way the rider goes, with the cultural landmarks still winning
 * their own neighbourhood.
 */
function pick(pois: PackedPoi[], capacity: number): PackedPoi[] {
  const rank: Record<PackedPoi['kind'], number> = { culture: 0, food: 1, service: 2, shop: 3 }
  const CELL = 70

  const cells = new Map<string, PackedPoi[]>()
  for (const p of pois) {
    const k = `${Math.floor(p.x / CELL)},${Math.floor(p.z / CELL)}`
    const list = cells.get(k)
    if (list) list.push(p)
    else cells.set(k, [p])
  }
  for (const list of cells.values()) list.sort((a, b) => rank[a.kind] - rank[b.kind])

  // round-robin: every cell gets its best before any cell gets its second
  const out: PackedPoi[] = []
  const lists = [...cells.values()]
  for (let round = 0; out.length < capacity; round++) {
    let added = 0
    for (const list of lists) {
      if (round >= list.length || out.length >= capacity) continue
      out.push(list[round])
      added++
    }
    if (added === 0) break
  }
  return out
}

interface Spot { x: number; z: number; nx: number; nz: number; width: number; building: number }

/**
 * A building's shopfront: its longest wall that faces a street across a pavement — close to a
 * carriageway's centre line and turned towards it, not a party wall or the back of a courtyard.
 */
function frontage(b: PackedBuilding, streets: StreetIndex): Spot | null {
  const ring = unpackPoints(b.ring)
  let best: Spot | null = null
  let bestLen = 4
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const c = ring[(i + 1) % ring.length]
    const ex = c.x - a.x
    const ez = c.z - a.z
    const len = Math.hypot(ex, ez)
    if (len < bestLen) continue
    const mx = (a.x + c.x) / 2
    const mz = (a.z + c.z) / 2
    // the ring is anticlockwise, so the outward normal of a→c is (ez, −ex)
    const nx = ez / len
    const nz = -ex / len
    const faces = facesStreet(streets, mx, mz, nx, nz)
    if (!faces) continue
    bestLen = len
    best = { x: mx, z: mz, nx, nz, width: Math.min(3.2, len * 0.6), building: b.id }
  }
  return best
}

/** Buildings bucketed by 100 m cell, so finding the wall behind a shop is not a scan of three thousand. */
function buildingIndex(buildings: PackedBuilding[]): Map<string, PackedBuilding[]> {
  const grid = new Map<string, PackedBuilding[]>()
  for (const b of buildings) {
    const k = `${Math.floor(b.ring[0] / 100)},${Math.floor(b.ring[1] / 100)}`
    const list = grid.get(k)
    if (list) list.push(b)
    else grid.set(k, [b])
  }
  return grid
}

/**
 * Where a sign goes: on the wall of the building the shop is in, facing out of it.
 *
 * A shop's node is inside its building, so the nearest wall segment is the shopfront, and the outward
 * normal of that segment is the direction the sign has to face. Getting the normal backwards puts every
 * sign in the city facing into the building it is on, which is invisible and would take a while to notice.
 */
function faceFor(poi: PackedPoi, index: Map<string, PackedBuilding[]>): Spot | null {
  const gx = Math.floor(poi.x / 100)
  const gz = Math.floor(poi.z / 100)
  let best: Spot | null = null
  let bestD = 14         // metres; beyond this the shop is not in any building we know about

  for (let dz = -1; dz <= 1; dz++) {
    for (let dx = -1; dx <= 1; dx++) {
      for (const b of index.get(`${gx + dx},${gz + dz}`) ?? []) {
        const ring = unpackPoints(b.ring)
        for (let i = 0; i < ring.length; i++) {
          const a = ring[i]
          const c = ring[(i + 1) % ring.length]
          const ex = c.x - a.x
          const ez = c.z - a.z
          const len = Math.hypot(ex, ez)
          if (len < 2.4) continue        // too short to carry a sign
          const t = Math.max(0.2, Math.min(0.8, ((poi.x - a.x) * ex + (poi.z - a.z) * ez) / (len * len)))
          const px = a.x + ex * t
          const pz = a.z + ez * t
          const d = Math.hypot(poi.x - px, poi.z - pz)
          if (d >= bestD) continue
          bestD = d
          // the ring is anticlockwise, so the outward normal of a→c is (ez, −ex)
          best = { x: px, z: pz, nx: ez / len, nz: -ex / len, width: Math.min(3.2, len * 0.8), building: b.id }
        }
      }
    }
  }
  return best
}

/** One sign board, standing proud of the wall it is on. */
function board(out: MeshBuilder, s: Spot, tint: [number, number, number], u0: number, v0: number,
               groundY: number, fasciaY: number): void {
  const h = 0.42
  const y = fasciaY + groundY   // on the fascia, under the ledge that ends the ground floor
  const w = s.width / 2
  // along the wall is the normal turned ninety degrees
  const ax = -s.nz
  const az = s.nx
  // proud of the wall by more than the shopfront's own reveals, or the glazing shows through the board
  const px = s.x + s.nx * 0.2
  const pz = s.z + s.nz * 0.2
  const u1 = u0 + CELL_W / PAGE
  const v1 = v0 + CELL_H / PAGE_H
  out.quad(
    [[px - ax * w, y - h, pz - az * w], [px + ax * w, y - h, pz + az * w],
     [px + ax * w, y + h, pz + az * w], [px - ax * w, y + h, pz - az * w]],
    [s.nx, 0, s.nz],
    [[u0, v1], [u1, v1], [u1, v0], [u0, v0]],
    tint, 0,
  )
}
