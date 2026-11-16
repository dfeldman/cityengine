import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { block } from '../../kit.ts'
import { hex } from '../../kit.ts'
import { d3, type D3Look } from './kit.ts'

/**
 * DEFENSE3 SMALL 1 (docs/landmarks/defense3-small1.tsv): 76 small or unheighted La Défense core buildings — vent and stair
 * shafts, shop kiosks, dalle pavilions, podium blocks, two canopies. Looks are grouped (Panoramax frames, 2026-11-16,
 * scratch d3s1/pmx/<osm id>_0.jpg): glass + metal pavilions, grey concrete shafts, pale-panel blocks. Heights come from
 * the manifest (BD TOPO h, OSM levels x 3.2, else a default by type); colours are the named constants below.
 */
const CONC_WALL = '#a9aaa6', CONC_ROOF = '#8a8b8c', DARK_WALL = '#3d4144'
const SKY_GLASS = '#93abc0', SKY_MULL = '#a7b0b7', SHOP_GLASS = '#7f98a8', SHOP_MULL = '#8a9096', KIOSK_GLASS = '#6f8a9a', KIOSK_MULL = '#5d6468'
const NAVY_GLASS = '#3f5a78', PANEL_WALL = '#d5d6d3', PANEL_WIN = '#5d6a74', PERF_WALL = '#c9ccce', PERF_WIN = '#7d8489'
const APT_WALL = '#cfc9bd', STONE_WALL = '#7f8386', DOME_GLASS = '#5f7f96'
const CANOPY_SLAB = '#9a9c9d', CANOPY_POST = '#6b6f73', CANOPY_GLASS = '#8fb0c4'

const CONC: D3Look = { face: { kind: 'blank', wall: CONC_WALL }, roof: CONC_ROOF, parapet: { h: 0.3 } }
const KIOSK: D3Look = { face: { kind: 'curtain', wall: KIOSK_MULL, glass: KIOSK_GLASS, floor: 3.2, pitch: 1.2 }, roof: CONC_ROOF, parapet: { h: 0.3 } }
const SHOP: D3Look = { face: { kind: 'curtain', wall: SHOP_MULL, glass: SHOP_GLASS, floor: 3.5, pitch: 2.4 }, roof: CONC_ROOF, parapet: { h: 0.5, colour: '#b4b8ba' } }
const GLASS: D3Look = { face: { kind: 'curtain', wall: SKY_MULL, glass: SKY_GLASS, floor: 3.4, pitch: 1.6 }, roof: '#85878a', parapet: { h: 0.5, colour: SKY_MULL } }
const NAVY: D3Look = { ...GLASS, face: { kind: 'curtain', wall: '#6d7782', glass: NAVY_GLASS, floor: 3.4, pitch: 1.5 } }
const PANEL: D3Look = { face: { kind: 'punched', wall: PANEL_WALL, glass: PANEL_WIN, floor: 3.4, pitch: 1.8, solid: 0.45 }, roof: '#8a8b8c' }
const PUNCH: D3Look = { face: { kind: 'punched', wall: PERF_WALL, glass: PERF_WIN, floor: 3.4, pitch: 2.0, solid: 0.8 }, roof: '#9a9c9d', parapet: { h: 0.8 } }
const APTS: D3Look = { face: { kind: 'punched', wall: APT_WALL, glass: '#5b6670', floor: 3.2, pitch: 2.2, solid: 0.55 }, roof: '#8a8b8c' }
const STONE_APTS: D3Look = { face: { kind: 'punched', wall: STONE_WALL, glass: '#2f383f', floor: 3.1, pitch: 2.4, solid: 0.8 }, roof: '#77797b' }
const DARK: D3Look = { face: { kind: 'blank', wall: DARK_WALL }, roof: '#4a4e51', parapet: { h: 0.3 } }
const DOME: D3Look = { face: { kind: 'curtain', wall: SKY_MULL, glass: DOME_GLASS, floor: 4.5, pitch: 1.8 }, roof: '#7d8a93', parapet: 'none' }

/** An open canopy (building=roof): a thin slab at the top on a grid of posts, never a box. */
const CANOPY_T = 0.4, POST_R = 0.2, POST_STEP = 7
function canopyOf(slab: string, glass: boolean): (out: MeshBuilder, fit: Fit) => void {
  return (out, fit) => {
    const H = fit.height > 0 ? fit.height : 5
    const xs = (fit.ring?.length ? fit.ring.map((p) => p.x) : [-fit.hx, fit.hx]), zs = (fit.ring?.length ? fit.ring.map((p) => p.z) : [-fit.hz, fit.hz])
    const x0 = Math.min(...xs), x1 = Math.max(...xs), z0 = Math.min(...zs), z1 = Math.max(...zs)
    block(out, x0, x1, z0, z1, H - CANOPY_T, H, hex(glass ? CANOPY_GLASS : slab))
    const nx = Math.max(1, Math.round((x1 - x0) / POST_STEP)), nz = Math.max(1, Math.round((z1 - z0) / POST_STEP))
    for (let i = 0; i <= nx; i++) for (let j = 0; j <= nz; j++) {
      const x = x0 + 0.6 + (x1 - x0 - 1.2) * i / nx, z = z0 + 0.6 + (z1 - z0 - 1.2) * j / nz
      block(out, x - POST_R, x + POST_R, z - POST_R, z + POST_R, 0, H - CANOPY_T, hex(CANOPY_POST))
    }
  }
}

export const d3s1W68852753 = d3(CONC) // way/68852753
export const d3s1W68852847 = d3(CONC) // way/68852847
export const d3s1W82486121 = d3(CONC) // way/82486121
export const d3s1W68850471 = d3(CONC) // way/68850471
export const d3s1W68850533 = d3(CONC) // way/68850533
export const d3s1W68851210 = d3(CONC) // way/68851210
export const d3s1W82468230 = d3(CONC) // way/82468230
export const d3s1W82468279 = d3(CONC) // way/82468279
export const d3s1W82468255 = d3(CONC) // way/82468255
export const d3s1W82468227 = d3(CONC) // way/82468227
export const d3s1W82468213 = d3(CONC) // way/82468213
export const d3s1W82468246 = d3(CONC) // way/82468246
export const d3s1W82468244 = d3(CONC) // way/82468244
export const d3s1W82468260 = d3(CONC) // way/82468260
export const d3s1W82486373 = d3(CONC) // way/82486373
export const d3s1W82486226 = d3(CONC) // way/82486226
export const d3s1W226588906 = d3(CONC) // way/226588906
export const d3s1W82486198 = d3(CONC) // way/82486198
export const d3s1W82486372 = d3(CONC) // way/82486372
export const d3s1W68849573 = d3(CONC) // way/68849573
export const d3s1W68851155 = d3(CONC) // way/68851155
export const d3s1W635543129 = d3(CONC) // way/635543129
export const d3s1W68853517 = d3(CONC) // way/68853517
export const d3s1W68850378 = d3(CONC) // way/68850378
export const d3s1W68853175 = d3(CONC) // way/68853175
export const d3s1W68852061 = d3(CONC) // way/68852061
export const d3s1W82468234 = d3(CONC) // way/82468234
export const d3s1W82468238 = d3(CONC) // way/82468238
export const d3s1W82486152 = d3(CONC) // way/82486152
export const d3s1W82486187 = d3(CONC) // way/82486187
export const d3s1W68851382 = d3(CONC) // way/68851382
export const d3s1W68849434 = d3(CONC) // way/68849434
export const d3s1W68851040 = d3(CONC) // way/68851040
export const d3s1W68849517 = d3(CONC) // way/68849517
export const d3s1W82485972 = d3(CONC) // way/82485972
export const d3s1W68850111 = d3(CONC) // way/68850111
export const d3s1W68852143 = d3(CONC) // way/68852143
export const d3s1W68850827 = d3(CONC) // way/68850827
export const d3s1W68852887 = d3(CONC) // way/68852887
export const d3s1W68852394 = d3(CONC) // way/68852394
export const d3s1W82468211 = d3(CONC) // way/82468211
export const d3s1W637110521 = d3(CONC) // way/637110521
export const d3s1W82486401 = d3(CONC) // way/82486401
export const d3s1W68850676 = d3(CONC) // way/68850676
export const d3s1W637887599 = d3(CONC) // way/637887599
export const d3s1W68850060 = d3(CONC) // way/68850060
export const d3s1W82468258 = d3(CONC) // way/82468258
export const d3s1W1027394676 = d3(KIOSK) // way/1027394676
export const d3s1W893022791 = d3(KIOSK) // way/893022791
export const d3s1W82468218 = d3(KIOSK) // way/82468218
export const d3s1W82468220 = d3(SHOP) // way/82468220
export const d3s1W82468226 = d3(SHOP) // way/82468226
export const d3s1W951282104 = d3(SHOP) // way/951282104
export const d3s1W463691519 = d3(SHOP) // way/463691519
export const d3s1W951282105 = d3(SHOP) // way/951282105
export const d3s1W68127539 = d3(GLASS) // way/68127539
export const d3s1W68127501 = d3(GLASS) // way/68127501
export const d3s1W68127503 = d3(GLASS) // way/68127503
export const d3s1W82468209 = d3(GLASS) // way/82468209
export const d3s1W82486348 = d3(GLASS) // way/82486348
export const d3s1W82486388 = d3(GLASS) // way/82486388
export const d3s1W82468247 = d3(NAVY) // way/82468247
export const d3s1W68850223 = d3(PANEL) // way/68850223
export const d3s1W68849641 = d3(PANEL) // way/68849641
export const d3s1W82485959 = d3(PANEL) // way/82485959
export const d3s1W68852603 = d3(PANEL) // way/68852603
export const d3s1W82486000 = d3(PANEL) // way/82486000
export const d3s1W68852838 = d3(STONE_APTS) // way/68852838
export const d3s1W68853344 = d3(PUNCH) // way/68853344
export const d3s1W68849977 = d3(PUNCH) // way/68849977
export const d3s1W334470344 = d3(APTS) // way/334470344
export const d3s1W82486402 = d3(APTS) // way/82486402
export const d3s1W68850953 = canopyOf(CANOPY_SLAB, true) // way/68850953
export const d3s1W573378903 = canopyOf(CANOPY_SLAB, false) // way/573378903
export const d3s1W723542047 = d3(DOME) // way/723542047
export const d3s1W82486270 = d3(DARK) // way/82486270

export const SMALL1 = {
  d3s1W68852753,
  d3s1W68852847,
  d3s1W82486121,
  d3s1W68850471,
  d3s1W68850533,
  d3s1W68851210,
  d3s1W82468230,
  d3s1W82468279,
  d3s1W82468255,
  d3s1W82468227,
  d3s1W82468213,
  d3s1W82468246,
  d3s1W82468244,
  d3s1W82468260,
  d3s1W82486373,
  d3s1W82486226,
  d3s1W226588906,
  d3s1W82486198,
  d3s1W82486372,
  d3s1W68849573,
  d3s1W68851155,
  d3s1W635543129,
  d3s1W68853517,
  d3s1W68850378,
  d3s1W68853175,
  d3s1W68852061,
  d3s1W82468234,
  d3s1W82468238,
  d3s1W82486152,
  d3s1W82486187,
  d3s1W68851382,
  d3s1W68849434,
  d3s1W68851040,
  d3s1W68849517,
  d3s1W82485972,
  d3s1W68850111,
  d3s1W68852143,
  d3s1W68850827,
  d3s1W68852887,
  d3s1W68852394,
  d3s1W82468211,
  d3s1W637110521,
  d3s1W82486401,
  d3s1W68850676,
  d3s1W637887599,
  d3s1W68850060,
  d3s1W82468258,
  d3s1W1027394676,
  d3s1W893022791,
  d3s1W82468218,
  d3s1W82468220,
  d3s1W82468226,
  d3s1W951282104,
  d3s1W463691519,
  d3s1W951282105,
  d3s1W68127539,
  d3s1W68127501,
  d3s1W68127503,
  d3s1W82468209,
  d3s1W82486348,
  d3s1W82486388,
  d3s1W82468247,
  d3s1W68850223,
  d3s1W68849641,
  d3s1W82485959,
  d3s1W68852603,
  d3s1W82486000,
  d3s1W68852838,
  d3s1W68853344,
  d3s1W68849977,
  d3s1W334470344,
  d3s1W82486402,
  d3s1W68850953,
  d3s1W573378903,
  d3s1W723542047,
  d3s1W82486270,
}
